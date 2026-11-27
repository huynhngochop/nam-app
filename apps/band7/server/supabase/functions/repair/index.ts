// POST /functions/v1/repair — bước "Sửa ngay": người học nói lại câu đúng.
// Chỉ dùng Whisper + so khớp chữ, KHÔNG gọi LLM → nhanh và tiết kiệm quota free.
// form: {error_id, audio, attempt: 1|2}
import { admin, aiErrorResponse, cors, json, MAX_AUDIO_BYTES, requireUser } from "../_shared/http.ts";
import { transcribe } from "../_shared/llm.ts";
import { checkRepair, keyPhraseOf, normalize } from "../_shared/text.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const form = await req.formData();
  const errorId = form.get("error_id")?.toString();
  const audio = form.get("audio");
  if (!errorId || !(audio instanceof File)) return json({ error: "error_id and audio required" }, 400);
  if (audio.size > MAX_AUDIO_BYTES) return json({ error: "audio too long" }, 413);

  let err, said: string;
  try {
    [{ data: err }, said] = await Promise.all([
      admin.from("learner_errors").select("id, wrong_text, right_text, band7_text, status")
        .eq("id", errorId).eq("user_id", user.id).maybeSingle(),
      transcribe(audio, audio.name || "audio.m4a"),
    ]);
  } catch (e) {
    return aiErrorResponse(e);
  }
  if (!err) return json({ error: "not found" }, 404);

  // Ưu tiên câu band 7 nếu người học đang luyện câu đó, nếu không thì câu đúng tối thiểu
  const target = (form.get("target")?.toString() === "band7" && err.band7_text) ? err.band7_text : err.right_text;
  // Cụm then chốt phải nằm trong câu đang luyện (câu band 7 có thể viết khác câu đúng tối thiểu)
  const keyRight = keyPhraseOf(err.wrong_text, err.right_text);
  const key = target === err.right_text || ` ${normalize(target).join(" ")} `.includes(` ${keyRight} `)
    ? keyRight
    : keyPhraseOf(err.wrong_text, target);
  const check = checkRepair(said, target, key);

  const { data: updated } = await admin.rpc("apply_error_event", {
    p_user: user.id, p_error: err.id, p_kind: check.ok ? "repair_ok" : "repair_fail",
  });

  return json({
    transcript: said, target, key_phrase: key, ...check,
    repair_ok: updated?.repair_ok, status: updated?.status,           // 'recalling' = đã qua bước Sửa ngay
    next_due_at: updated?.next_due_at,
    message_vi: check.ok
      ? (updated?.status === "recalling" ? "Chuẩn rồi! Giám khảo sẽ hỏi lại cấu trúc này vào ngày mai." : "Đúng rồi, nói thêm 1 lần nữa nhé.")
      : (check.keyHit ? "Gần đúng rồi, nói trọn cả câu nhé." : `Chú ý phần: “${key}”.`),
  });
});
