// POST /functions/v1/grade — kết thúc buổi: chấm 4 tiêu chí bằng model mạnh hơn (1 lần/buổi).
// body JSON: {session_id}
import { admin, aiErrorResponse, cors, json, requireUser } from "../_shared/http.ts";
import { chatJSON } from "../_shared/llm.ts";

const BAND = (x: unknown) => {
  const n = Math.round(Number(x) * 2) / 2;
  return Number.isFinite(n) && n >= 3 && n <= 9 ? n : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const user = await requireUser(req);
  if (user instanceof Response) return user;
  const { session_id } = await req.json().catch(() => ({}));
  if (!session_id) return json({ error: "session_id required" }, 400);

  const { data: s } = await admin.from("sessions").select("id, user_id, kind, ended_at, scores")
    .eq("id", session_id).single();
  if (!s || s.user_id !== user.id) return json({ error: "not found" }, 404);
  if (s.ended_at && s.scores) return json(s.scores);                 // đã chấm: không tốn lượt AI

  const { data: turns } = await admin.from("turns").select("role, text").eq("session_id", session_id).order("id");
  const learnerWords = (turns ?? []).filter((t) => t.role === "learner").map((t) => t.text).join(" ").split(/\s+/).length;
  if (learnerWords < 40) return json({ error: "too_short", message_vi: "Buổi nói quá ngắn để chấm band." }, 422);

  const transcript = (turns ?? []).map((t) => `${t.role === "examiner" ? "E" : "L"}: ${t.text}`).join("\n").slice(0, 12_000);
  const messages = [
    {
      role: "system" as const,
      content: `You are a certified IELTS Speaking examiner. Score the LEARNER (L) using the public IELTS band descriptors.
Pronunciation can only be estimated from a transcript: base it on likely mis-recognitions and keep it conservative.
Return ONLY JSON: {"fc":n,"lr":n,"gra":n,"p":n,"overall":n,"strengths_vi":["..."],"priorities_vi":["...","..."]}
Bands in 0.5 steps. Vietnamese texts short (max 20 words each), concrete, about this learner.`,
    },
    { role: "user" as const, content: transcript },
  ];

  let raw: string;
  try { raw = (await chatJSON(messages, "grade")).text; } catch (e) {
    return aiErrorResponse(e);
  }
  let j: Record<string, unknown> = {};
  try { j = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw); } catch { /* giữ rỗng */ }
  const fc = BAND(j.fc), lr = BAND(j.lr), gra = BAND(j.gra), p = BAND(j.p);
  if ([fc, lr, gra, p].some((x) => x === null)) return json({ error: "grading_failed" }, 502);
  // overall theo cách làm tròn của IELTS: trung bình 4 tiêu chí, làm tròn tới 0.5
  const overall = Math.round(((fc! + lr! + gra! + p!) / 4) * 2) / 2;

  const scores = {
    fc, lr, gra, p, overall,
    strengths_vi: Array.isArray(j.strengths_vi) ? j.strengths_vi.slice(0, 3) : [],
    priorities_vi: Array.isArray(j.priorities_vi) ? j.priorities_vi.slice(0, 3) : [],
  };
  await Promise.all([
    admin.from("sessions").update({ scores, ended_at: new Date().toISOString() }).eq("id", session_id),
    admin.from("band_snapshots").insert({
      user_id: user.id, session_id, source: s.kind === "mock" ? "mock" : s.kind === "placement" ? "placement" : "session",
      fc, lr, gra, p, overall,
    }),
  ]);
  return json(scores);
});
