// POST /functions/v1/talk
// 1) Bắt đầu buổi: form {kind, topic_id?, mode?} không có audio → tạo buổi, trả câu hỏi đầu (không gọi AI).
// 2) Mỗi lượt: form {session_id, audio} → nghe (Whisper) → giám khảo (LLM) → lưu lỗi, gài lại → câu hỏi tiếp.
import { admin, aiErrorResponse, cors, FREE_DAILY_TURNS, json, MAX_AUDIO_BYTES, PRO_DAILY_TURNS, requireUser } from "../_shared/http.ts";
import { chatJSON, transcribe } from "../_shared/llm.ts";
import {
  buildExaminerMessages, type ErrorCodeLite, type ExaminerContext, maxErrorsFor, parseExaminerOutput,
  type RecallTarget, type Turn,
} from "../_shared/examiner.ts";

// Kho mã lỗi ít đổi → cache theo worker
let codeCache: { at: number; codes: (ErrorCodeLite & { elicit_hint: string })[] } | null = null;
async function errorCodes() {
  if (codeCache && Date.now() - codeCache.at < 3_600_000) return codeCache.codes;
  const { data, error } = await admin.from("error_codes").select("code, category, title:title_vi, elicit_hint");
  if (error) throw error;
  codeCache = { at: Date.now(), codes: data as never };
  return codeCache.codes;
}

const PART_OF: Record<string, ExaminerContext["part"]> = { part1: 1, part2: 2, part3: 3, mock: 1, placement: 1, free: "free" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const form = await req.formData();
  const audio = form.get("audio");
  const sessionId = form.get("session_id")?.toString();

  // ───── Bắt đầu buổi mới ─────
  if (!sessionId) {
    const kind = form.get("kind")?.toString() ?? "part1";
    const mode = form.get("mode")?.toString() === "exam" ? "exam" : "practice";
    if (!(kind in PART_OF)) return json({ error: "bad kind" }, 400);
    let topicId = form.get("topic_id")?.toString() ?? null;
    let topic: { id: string; title: string; questions: unknown } | null = null;
    if (topicId) {
      topic = (await admin.from("topics").select("id,title,questions").eq("id", topicId).single()).data;
    } else if (kind !== "free") {
      const part = PART_OF[kind] === "free" ? 1 : PART_OF[kind];
      // chọn đề chưa luyện gần đây; đơn giản: ngẫu nhiên trong đề của part
      const { data } = await admin.from("topics").select("id,title,questions").eq("part", part).limit(50);
      topic = data?.length ? data[Math.floor(Math.random() * data.length)] : null;
      topicId = topic?.id ?? null;
    }
    // App gửi kèm câu hỏi đầu của đề có sẵn trong máy → dùng đúng đề đó (không chọn đề khác trên máy chủ)
    const appFirst = form.get("first")?.toString().trim().slice(0, 600);
    const appTitle = form.get("topic_title")?.toString().trim().slice(0, 120);
    if (appFirst && !form.get("topic_id")) { topic = null; topicId = null; }
    const q = topic?.questions as { cue?: string } | string[] | undefined;
    const first = appFirst || (Array.isArray(q) ? q[0] : q?.cue) || "Let's talk about your hometown. Where are you from?";
    const title = appFirst ? (appTitle || "General") : topic?.title ?? "General";
    const { data: s, error } = await admin.from("sessions")
      .insert({ user_id: user.id, kind, mode, topic_id: topicId, state: { topic: title } })
      .select("id").single();
    if (error) return json({ error: error.message }, 500);
    await admin.from("turns").insert({ session_id: s.id, user_id: user.id, role: "examiner", text: first });
    return json({ session_id: s.id, reply: first, topic: title });
  }

  // ───── Một lượt nói ─────
  if (!(audio instanceof File)) return json({ error: "audio required" }, 400);
  if (audio.size > MAX_AUDIO_BYTES) return json({ error: "audio too long" }, 413);

  const { data: profile } = await admin.from("profiles")
    .select("plan, correction_level, target_band").eq("id", user.id).maybeSingle();
  const limit = profile?.plan === "pro" ? PRO_DAILY_TURNS : FREE_DAILY_TURNS;
  const { data: left, error: qErr } = await admin.rpc("consume_turn", { p_user: user.id, p_daily_limit: limit });
  if (qErr) return json({ error: qErr.message }, 500);
  if (left === -1) return json({ error: "quota", message_vi: "Bạn đã dùng hết lượt nói hôm nay." }, 429);

  // Nghe và nạp ngữ cảnh song song để giảm độ trễ
  let learnerText: string, session, history, due, codes, band;
  try {
    [learnerText, session, history, due, codes, band] = await Promise.all([
      transcribe(audio, audio.name || "audio.m4a"),
      admin.from("sessions").select("id, kind, mode, state, user_id").eq("id", sessionId).single().then((r) => r.data),
      admin.from("turns").select("role, text").eq("session_id", sessionId).order("id", { ascending: false }).limit(6)
        .then((r) => (r.data ?? []).reverse() as Turn[]),
      admin.rpc("due_recalls", { p_user: user.id, p_limit: 3 }).then((r) => r.data ?? []),
      errorCodes(),
      admin.from("band_snapshots").select("overall").eq("user_id", user.id).order("created_at", { ascending: false })
        .limit(1).then((r) => Number(r.data?.[0]?.overall ?? 5.5)),
    ]);
  } catch (e) {
    return aiErrorResponse(e);
  }
  if (!session || session.user_id !== user.id) return json({ error: "session not found" }, 404);
  if (!learnerText) return json({ error: "empty", message_vi: "Mình chưa nghe rõ, bạn nói lại nhé." }, 422);

  const hintOf = new Map(codes.map((c) => [c.code, c.elicit_hint]));
  const toTarget = (e: { id: string; code: string | null; right_text: string }): RecallTarget => ({
    id: e.id, code: e.code, right_text: e.right_text,
    elicit_hint: (e.code && hintOf.get(e.code)) || `Ask a question whose natural answer needs: "${e.right_text}"`,
  });

  const state = (session.state ?? {}) as { topic?: string; active_target?: string | null; asked?: string[]; n?: number };
  const n = state.n ?? 0; // số lượt người học đã nói trong buổi
  // Thi thử: Part 1 (4 lượt) → Part 2 (2 lượt) → Part 3
  const part: ExaminerContext["part"] = session.kind === "mock" ? (n < 4 ? 1 : n < 6 ? 2 : 3) : PART_OF[session.kind] ?? 1;
  const asked = new Set(state.asked ?? []);
  // mỗi lỗi chỉ gài 1 lần trong một buổi
  const dueTargets: RecallTarget[] = due.filter((e: { id: string }) => !asked.has(e.id) && e.id !== state.active_target)
    .map(toTarget);
  let activeTarget: RecallTarget | null = null;
  if (state.active_target) {
    const { data } = await admin.from("learner_errors").select("id, code, right_text")
      .eq("id", state.active_target).eq("user_id", user.id).maybeSingle();
    if (data) activeTarget = toTarget(data);
  }

  const level = (profile?.correction_level ?? "medium") as ExaminerContext["correctionLevel"];
  const ctx: ExaminerContext = {
    part, mock: session.kind === "mock", topic: state.topic ?? "General", mode: session.mode, correctionLevel: level,
    estimatedBand: band, targetBand: profile?.target_band != null ? Number(profile.target_band) : undefined, history, learnerText, activeTarget, dueTargets, codes,
  };

  let out;
  try {
    const { text } = await chatJSON(buildExaminerMessages(ctx), "chat");
    out = parseExaminerOutput(text, {
      dueIds: dueTargets.map((t) => t.id), knownCodes: codes.map((c) => c.code),
      maxErrors: maxErrorsFor(level), hadActiveTarget: !!activeTarget,
    });
  } catch (e) {
    return aiErrorResponse(e);
  }

  // Lưu lượt nói của người học
  const { data: lt } = await admin.from("turns")
    .insert({ session_id: sessionId, user_id: user.id, role: "learner", text: learnerText })
    .select("id").single();
  const turnId = lt?.id ?? null;

  // Kết quả gài lại
  let recall: { error_id: string; result: string; streak?: number; status?: string } | null = null;
  if (activeTarget && (out.recall === "correct" || out.recall === "wrong")) {
    const { data: e } = await admin.rpc("apply_error_event", {
      p_user: user.id, p_error: activeTarget.id, p_kind: out.recall === "correct" ? "recall_ok" : "recall_fail", p_turn: turnId,
    });
    recall = { error_id: activeTarget.id, result: out.recall, streak: e?.streak, status: e?.status };
  }

  // Ghi lỗi mới (bỏ lỗi trùng với mục đang gài — đã tính ở trên)
  const caught = [];
  for (const err of out.errors) {
    if (activeTarget && err.code && err.code === activeTarget.code) continue;
    const { data: id } = await admin.rpc("catch_error", {
      p_user: user.id, p_code: err.code, p_category: err.category, p_wrong: err.wrong, p_right: err.right,
      p_band7: err.band7, p_explain: err.explain_vi, p_turn: turnId,
    });
    caught.push({ id, ...err });
  }

  // Câu hỏi tiếp + cập nhật lỗi đang gài
  if (out.targetId) asked.add(out.targetId);
  await Promise.all([
    admin.from("turns").insert({ session_id: sessionId, user_id: user.id, role: "examiner", text: out.reply }),
    admin.from("sessions").update({ state: { ...state, n: n + 1, active_target: out.targetId, asked: [...asked] } }).eq("id", sessionId),
  ]);

  const practice = session.mode === "practice";
  return json({
    transcript: learnerText,
    reply: out.reply,
    corrections: practice ? caught : [],          // chế độ Thi thật: ẩn sửa lỗi tới cuối buổi
    hint_vi: practice ? out.hintVi : "",
    recall,                                        // app hiện "Bạn tự dùng đúng · 2/3" nếu correct
    turns_left: left,
  });
});
