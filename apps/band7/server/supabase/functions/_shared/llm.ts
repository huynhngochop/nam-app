// Gọi AI free: Groq (Whisper + GPT-OSS) trước, Gemini dự phòng khi bị giới hạn hoặc model bị gỡ.
// Thứ tự model đặt qua biến môi trường (STT_MODELS, CHAT_CHAIN, GRADE_CHAIN) để đổi mà không sửa code.

const env = (k: string, d = "") => Deno.env.get(k) ?? d;

const GROQ = "https://api.groq.com/openai/v1";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta";

export class RateLimited extends Error {}
/** Thiếu khoá API hoặc nhà cung cấp lỗi: trả 502 có thông báo rõ thay vì 500 khó hiểu. */
export class AiUnavailable extends Error {}

/** Danh sách model từ biến môi trường (cách nhau dấu phẩy), không có thì dùng mặc định. */
function list(name: string, def: string[]): string[] {
  const v = env(name);
  return v ? v.split(",").map((x) => x.trim()).filter(Boolean) : def;
}
/** Model không còn (404 / decommissioned) → thử model kế tiếp. */
function isModelGone(e: unknown): boolean {
  const m = String((e as Error)?.message ?? "");
  return /\b404\b|decommission|not found|no longer available|does not exist|model_not_found/i.test(m);
}

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

/** Speech-to-text tiếng Anh bằng Groq Whisper (model bị gỡ thì thử model kế tiếp) */
export async function transcribe(audio: Blob, filename = "audio.m4a"): Promise<string> {
  const models = list("STT_MODELS", ["whisper-large-v3-turbo", "whisper-large-v3"]);
  let last: unknown;
  for (const m of models) {
    try {
      return await transcribeWith(audio, filename, m);
    } catch (e) {
      last = e;
      if (e instanceof RateLimited || !isModelGone(e)) throw e;
    }
  }
  throw last;
}

async function transcribeWith(audio: Blob, filename: string, model: string): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", model);
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
      ...(model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
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
 * Thứ tự thử (đổi được bằng biến môi trường, không cần sửa code khi nhà cung cấp gỡ model):
 *  - chat: hội thoại từng lượt → Groq (nhanh), dự phòng Gemini Flash-Lite / Flash.
 *  - grade: chấm cuối buổi → Gemini Flash, dự phòng Groq model lớn.
 * Model ghi dạng "groq:<id>" hoặc "gemini:<id>".
 */
const DEFAULT_CHAIN = {
  chat: ["groq:openai/gpt-oss-20b", "gemini:gemini-3.5-flash-lite", "gemini:gemini-3.5-flash", "groq:openai/gpt-oss-120b"],
  grade: ["gemini:gemini-3.5-flash", "groq:openai/gpt-oss-120b", "gemini:gemini-3.5-flash-lite"],
};

export async function chatJSON(messages: Msg[], tier: "chat" | "grade" = "chat"): Promise<{ text: string; provider: string }> {
  const chain = list(tier === "chat" ? "CHAT_CHAIN" : "GRADE_CHAIN", DEFAULT_CHAIN[tier]);
  const budget = tier === "chat" ? 1200 : 2400; // model suy luận dùng thêm token để nghĩ
  let last: unknown;
  for (const item of chain) {
    const [provider, ...rest] = item.split(":");
    const model = rest.join(":");
    try {
      const text = provider === "groq"
        ? await groqJSON(messages, model, budget)
        : await geminiJSON(messages, model, budget);
      if (!text.trim()) throw new AiUnavailable(`${item}: empty response`);
      return { text, provider: item };
    } catch (e) {
      console.error("ai_try_failed", item, String((e as Error)?.message ?? e).slice(0, 300));
      last = e;
    }
  }
  if (last instanceof RateLimited) throw last;
  throw last instanceof AiUnavailable ? last : new AiUnavailable(String(last ?? "no provider"));
}
