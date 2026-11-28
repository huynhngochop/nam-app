// voice-tts: tạo giọng đọc AI cho văn khấn và kinh của Thành Tâm, mỗi lần gọi làm một đoạn.
// Gói miễn phí của Gemini chỉ cho vài lượt đọc mỗi ngày, nên pg_cron (private.kick) gọi 5 phút một lần khi còn
// đoạn đến lượt; hết lượt thì cả hàng tạm dừng tới khi Google cấp lượt mới. Kết quả: tệp WAV trong kho công khai
// 'voice' và <app>/jobs.json liệt kê đoạn đã xong, để CI nam-app tải về, căn mốc từng câu và đóng vào app.
// Danh sách đoạn lấy từ ai-jobs.json do CI đăng ở Releases (apps/thanh-tam/scripts/voice_ai.py jobs).
// Bản triển khai trên Supabase: dự án nam-core, verify_jwt tắt, chỉ nhận lời gọi có x-cron-secret.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { decodeBase64 } from 'jsr:@std/encoding@1/base64';
import { admin, assertCron, json } from '../_shared/util.ts';

const APP = 'thanh-tam';
const JOBS_URL = 'https://github.com/huynhngochop/nam-app/releases/download/thanh-tam-voice/ai-jobs.json';
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const BUCKET = 'voice';

type Config = { voice: string; prefer: string[]; max_tries: number };
type Job = {
  id: string;
  app: string;
  kind: 'khan' | 'kinh';
  script: string;
  tries: number;
  item_hash: string;
  config: Config;
};

/** Hết lượt của một mô hình: `until` là lúc nên thử lại. */
class QuotaError extends Error {
  constructor(
    msg: string,
    public until: Date,
  ) {
    super(msg);
  }
}

const db = admin();

Deno.serve(async (req) => {
  const denied = await assertCron(req, db);
  if (denied) return denied;
  // Trả lời pg_net ngay (nó chỉ chờ 5 giây), việc đọc chạy nền.
  EdgeRuntime.waitUntil(
    run().catch((e) => console.error(JSON.stringify({ msg: 'voice_run_failed', error: String(e) }))),
  );
  return json({ ok: true }, 202);
});

async function run() {
  await seedIfDue();
  const { data: job, error } = await db.rpc('nc_voice_next');
  if (error) throw new Error(`next: ${error.message}`);
  if (!job) return;
  const j = job as Job;
  const models = await ttsModels(j.config.prefer);
  let quotaUntil: Date | null = null;
  let lastError = models.length ? '' : 'no_tts_model';
  // Lần thử lại của cùng một đoạn bắt đầu ở mô hình kế tiếp, phòng khi một mô hình cứ đọc quá lâu.
  const order = models.map((_, i) => models[(i + j.tries - 1) % models.length]);
  const began = Date.now();
  for (const model of order) {
    // Một lần gọi chỉ sống khoảng 150 giây: còn ít thời gian thì để lần sau.
    if (Date.now() - began > 30_000) break;
    try {
      const pcm = await synthesize(model, j);
      const ms = Math.round((pcm.byteLength / 2 / 24000) * 1000);
      checkLength(j.script, ms);
      const path = `${j.app}/${j.id}-${j.item_hash}.wav`;
      const up = await db.storage
        .from(BUCKET)
        .upload(path, wav(pcm), { contentType: 'audio/wav', upsert: true, cacheControl: '31536000' });
      if (up.error) throw new Error(`upload: ${up.error.message}`);
      const done = await db.rpc('nc_voice_done', {
        p_id: j.id,
        p_path: path,
        p_bytes: pcm.byteLength + 44,
        p_ms: ms,
        p_model: model,
        p_voice: j.config.voice,
      });
      if (done.error) throw new Error(`done: ${done.error.message}`);
      console.log(JSON.stringify({ msg: 'voice_done', id: j.id, model, ms }));
      await writeManifest(j.app);
      return;
    } catch (e) {
      if (e instanceof QuotaError) {
        // Mỗi mô hình có hạn mức riêng: hết lượt mô hình này thì thử mô hình kế.
        if (!quotaUntil || e.until < quotaUntil) quotaUntil = e.until;
        continue;
      }
      lastError = String((e as Error).message ?? e);
      console.error(JSON.stringify({ msg: 'voice_error', id: j.id, model, error: lastError }));
    }
  }
  const pause = !lastError && quotaUntil ? quotaUntil.toISOString() : null;
  await db.rpc('nc_voice_fail', { p_id: j.id, p_error: lastError || 'quota', p_pause_until: pause });
  console.log(JSON.stringify({ msg: 'voice_retry_later', id: j.id, pause, error: lastError }));
}

/** Nạp lại danh sách đoạn mỗi 6 giờ: chữ văn khấn đổi thì đoạn đó được đọc lại, đoạn cũ giữ nguyên. */
async function seedIfDue() {
  const { data: due } = await db.rpc('nc_voice_seed_due');
  if (due !== true) return;
  const r = await fetch(JOBS_URL, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) {
    console.error(JSON.stringify({ msg: 'voice_seed_fetch', status: r.status }));
    return;
  }
  const jobs = await r.json();
  const { data, error } = await db.rpc('nc_voice_seed', { p_app: APP, p_jobs: jobs });
  console.log(JSON.stringify({ msg: 'voice_seeded', ...(data ?? {}), error: error?.message }));
  await writeManifest(APP);
}

let modelCache: string[] | null = null;

/** Các mô hình đọc (TTS) mà khóa này dùng được, xếp theo `prefer` rồi theo phiên bản mới trước. */
async function ttsModels(prefer: string[]): Promise<string[]> {
  if (modelCache) return modelCache;
  const r = await fetch(`${GEMINI}/models?pageSize=1000`, {
    headers: { 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') ?? '' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`models ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const list = ((await r.json()).models ?? []) as { name: string; supportedGenerationMethods?: string[] }[];
  const names = list
    .filter((m) => m.name.includes('tts') && m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
  const rank = (n: string) => {
    const p = prefer.findIndex((x) => n.includes(x));
    return p < 0 ? prefer.length : p;
  };
  const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  modelCache = names.sort((a, b) => rank(a) - rank(b) || version(b) - version(a));
  console.log(JSON.stringify({ msg: 'voice_models', models: modelCache }));
  return modelCache;
}

// Lời dặn giọng đọc. Văn bản mỗi câu một dòng; dòng trống là sang đoạn. Mốc từng câu do CI căn theo chỗ ngừng,
// nên cần ngừng rõ ở cuối mỗi dòng.
const STYLE: Record<Job['kind'], string> = {
  khan:
    'Read the Vietnamese prayer below aloud, word for word, in natural standard Vietnamese. ' +
    'You are the head of a Vietnamese family praying before the ancestral altar with incense in hand. ' +
    'Use a deep, warm, sincere and reverent male voice: slow, steady and soft, close to a murmured prayer. ' +
    'Never sound theatrical, cheerful or like a newsreader. Keep every tone mark exact. ' +
    'Stop for about one second at the end of every line, and about two seconds at each blank line. ' +
    'Say "Nam mô A Di Đà Phật" slowly and gently, drawing out the syllables. ' +
    'Do not read these instructions, do not add or skip any words.',
  kinh:
    'Chant the Vietnamese Buddhist sutra below aloud, word for word, in standard Vietnamese, the way a monk ' +
    'chants (tụng kinh) at a temple. Use a deep, calm, even male voice in a steady rhythm, one syllable per ' +
    'beat of the wooden fish, each syllable slightly drawn out, with very little pitch movement and no ' +
    'emotion or emphasis. Keep every tone mark exact. Pause briefly at the end of every line and longer at ' +
    'each blank line. Do not read these instructions, do not add or skip any words.',
};

async function synthesize(model: string, j: Job): Promise<Uint8Array> {
  const res = await fetch(`${GEMINI}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') ?? '' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${STYLE[j.kind]}\n\n${j.script}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: 0.6,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: j.config.voice } } },
      },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (res.status === 429) throw new QuotaError('quota', retryAt(await res.text()));
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const parts = (data?.candidates?.[0]?.content?.parts ?? []) as { inlineData?: { mimeType: string; data: string } }[];
  const chunks = parts.filter((p) => p.inlineData?.data).map((p) => p.inlineData!);
  if (!chunks.length) throw new Error(`no_audio: ${data?.candidates?.[0]?.finishReason ?? 'unknown'}`);
  const rate = Number(/rate=(\d+)/.exec(chunks[0].mimeType)?.[1] ?? 24000);
  if (rate !== 24000) throw new Error(`rate ${rate}`);
  const bufs = chunks.map((c) => decodeBase64(c.data));
  const out = new Uint8Array(bufs.reduce((a, b) => a + b.byteLength, 0));
  let o = 0;
  for (const b of bufs) {
    out.set(b, o);
    o += b.byteLength;
  }
  return out;
}

/** Lúc nên thử lại sau lỗi 429: hết lượt theo ngày thì chờ tới khi Google cấp lại (nửa đêm giờ Thái Bình Dương). */
function retryAt(body: string): Date {
  const now = Date.now();
  if (/PerDay/i.test(body)) {
    const d = new Date(now);
    d.setUTCHours(8, 5, 0, 0);
    if (d.getTime() <= now) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }
  const s = Number(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(body)?.[1] ?? 60);
  return new Date(now + Math.max(60, s + 5) * 1000);
}

/** Bỏ bản đọc hụt hoặc đọc lan man: tiếng Việt đọc chậm vào khoảng 2–4 âm tiết mỗi giây. */
function checkLength(script: string, ms: number) {
  const syllables = script.split(/\s+/).filter(Boolean).length;
  if (ms < syllables * 150) throw new Error(`too_short ${ms}ms/${syllables}`);
  if (ms > syllables * 1500 + 20_000) throw new Error(`too_long ${ms}ms/${syllables}`);
}

/** Bọc PCM 16 bit, 24 kHz, một kênh thành tệp WAV. */
function wav(pcm: Uint8Array): Uint8Array {
  const h = new DataView(new ArrayBuffer(44));
  const tag = (o: number, s: string) => [...s].forEach((c, i) => h.setUint8(o + i, c.charCodeAt(0)));
  tag(0, 'RIFF');
  h.setUint32(4, 36 + pcm.byteLength, true);
  tag(8, 'WAVEfmt ');
  h.setUint32(16, 16, true);
  h.setUint16(20, 1, true);
  h.setUint16(22, 1, true);
  h.setUint32(24, 24000, true);
  h.setUint32(28, 48000, true);
  h.setUint16(32, 2, true);
  h.setUint16(34, 16, true);
  tag(36, 'data');
  h.setUint32(40, pcm.byteLength, true);
  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(h.buffer), 0);
  out.set(pcm, 44);
  return out;
}

/** Ghi <app>/jobs.json (công khai) để CI biết đoạn nào đã xong mà không cần khóa. */
async function writeManifest(app: string) {
  const { data, error } = await db.rpc('nc_voice_manifest', { p_app: app });
  if (error) throw new Error(`manifest: ${error.message}`);
  const body = new TextEncoder().encode(JSON.stringify(data));
  const up = await db.storage
    .from(BUCKET)
    .upload(`${app}/jobs.json`, body, { contentType: 'application/json', upsert: true, cacheControl: '60' });
  if (up.error) throw new Error(`manifest upload: ${up.error.message}`);
}
