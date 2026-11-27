// Gọi AI free: Groq (Whisper + Llama) trước, Gemini dự phòng khi bị giới hạn.
// Model đặt qua biến môi trường để đổi mà không sửa code.

const env = (k: string, d = "") => Deno.env.get(k) ?? d;

const GROQ = "https://api.groq.com/openai/v1";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

export class RateLimited extends Error {}
/** Thiếu khoá API hoặc nhà cung cấp lỗi: trả 502 có thông báo rõ thay vì 500 khó hiểu. */
export class AiUnavailable extends Error {}

function key(name: string): string {
  const v = env(name);
  if (!v) throw new AiUnavailable(`missing ${name}`);
  return v;
}

async function withTimeout(p: (signal: AbortSignal) => Promise<Response>, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await p(ctl.signal); } finally { clearTimeout(t); }
}

/** Speech-to-text tiếng Anh bằng Groq Whisper */
export async function transcribe(audio: Blob, filename = "audio.m4a"): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", env("STT_MODEL", "whisper-large-v3-turbo"));
  form.append("language", "en");
  form.append("response_format", "json");
  form.append("temperature", "0");
  const res = await withTimeout((signal) => fetch(`${GROQ}/audio/transcriptions`, {
    method: "POST", headers: { Authorization: `Bearer ${key("GROQ_API_KEY")}` }, body: form, signal,
  }), 20_000);
  if (res.status === 429) throw new RateLimited("stt");
  if (!res.ok) throw new AiUnavailable(`stt ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return String(j.text ?? "").trim();
}

type Msg = { role: "system" | "user"; content: string };

async function groqJSON(messages: Msg[], model: string, maxTokens: number): Promise<string> {
  const res = await withTimeout((signal) => fetch(`${GROQ}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key("GROQ_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, messages, temperature: 0.4, max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
    signal,
  }), 15_000);
  if (res.status === 429) throw new RateLimited("groq");
  if (!res.ok) throw new AiUnavailable(`groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function geminiJSON(messages: Msg[], model: string, maxTokens: number): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const res = await withTimeout((signal) => fetch(`${GEMINI}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key("GEMINI_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens, responseMimeType: "application/json" },
    }),
    signal,
  }), 25_000);
  if (res.status === 429) throw new RateLimited("gemini");
  if (!res.ok) throw new AiUnavailable(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

/**
 * tier "chat": hội thoại từng lượt → model nhanh (Groq 8B), dự phòng Gemini Flash.
 * tier "grade": chấm cuối buổi → model mạnh (Gemini Flash), dự phòng Groq 70B.
 */
export async function chatJSON(messages: Msg[], tier: "chat" | "grade" = "chat"): Promise<{ text: string; provider: string }> {
  const chain: [string, () => Promise<string>][] = tier === "chat"
    ? [
      ["groq", () => groqJSON(messages, env("CHAT_MODEL", "llama-3.1-8b-instant"), 500)],
      ["gemini", () => geminiJSON(messages, env("GEMINI_MODEL", "gemini-2.5-flash"), 500)],
    ]
    : [
      ["gemini", () => geminiJSON(messages, env("GEMINI_MODEL", "gemini-2.5-flash"), 1200)],
      ["groq", () => groqJSON(messages, env("GRADE_MODEL", "llama-3.3-70b-versatile"), 1200)],
    ];
  let last: unknown;
  for (const [provider, call] of chain) {
    try { return { text: await call(), provider }; } catch (e) { last = e; }
  }
  if (last instanceof RateLimited) throw last;
  throw last instanceof AiUnavailable ? last : new AiUnavailable(String(last ?? "no provider"));
}
