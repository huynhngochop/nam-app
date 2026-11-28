import Storage from 'expo-sqlite/kv-store';
import { getConfig } from './config';
import { uid } from './id';
import type { CloudItem } from './cloudTypes';

export type { CloudItem } from './cloudTypes';

/**
 * Client máy chủ chung nam-cloud (Supabase) — chỉ dùng `fetch`, không thêm thư viện (giữ APK nhẹ).
 * Bỏ trống EXPO_PUBLIC_NAM_CLOUD_URL / EXPO_PUBLIC_NAM_CLOUD_KEY thì mọi hàm báo `CloudOffError` và app chạy như cũ.
 *  - rpc(): gọi hàm `nc_*` (PostgREST), có/không cần phiên đăng nhập.
 *  - session(): tài khoản ẩn danh theo máy, tự làm mới token. Không cần màn đăng ký.
 *  - questions: gửi câu hỏi (xếp hàng khi mất mạng), xem trạng thái câu đã gửi.
 *  - content: tải gói nội dung AI (manifest → delta/full JSON trên CDN), app tự lưu.
 */
export class CloudOffError extends Error {
  constructor() {
    super('Chưa kết nối máy chủ');
  }
}
export class CloudError extends Error {
  constructor(
    msg: string,
    public code: string,
    public status: number,
  ) {
    super(msg);
  }
}

export const hasCloud = () => !!(getConfig().cloudUrl && getConfig().cloudKey);
const base = () => {
  const { cloudUrl, cloudKey } = getConfig();
  if (!cloudUrl || !cloudKey) throw new CloudOffError();
  return { url: cloudUrl.replace(/\/+$/, ''), key: cloudKey };
};

type Req = { method?: string; body?: string; headers?: Record<string, string>; timeoutMs?: number };
async function http<T>(path: string, init: Req = {}): Promise<T> {
  const { url, key } = base();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 12000);
  try {
    const res = await fetch(`${url}${path}`, {
      method: init.method,
      body: init.body,
      headers: { apikey: key, 'content-type': 'application/json', ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (body && (body.message || body.msg || body.error_description || body.error)) || `HTTP ${res.status}`;
      throw new CloudError(String(msg), String(body?.code ?? body?.error_code ?? res.status), res.status);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------- device + anonymous session ----------------
const K_DEVICE = 'nc:device';
const K_SESSION = 'nc:session';
let deviceCache: string | null = null;

/** Id cố định của máy (sinh một lần, lưu trên máy). */
export async function deviceId(): Promise<string> {
  if (deviceCache) return deviceCache;
  let d = await Storage.getItem(K_DEVICE);
  if (!d) {
    d = uid();
    await Storage.setItem(K_DEVICE, d);
  }
  return (deviceCache = d);
}

type Session = { access_token: string; refresh_token: string; expires_at: number; user_id: string };
type AuthOut = { access_token: string; refresh_token: string; expires_in: number; user: { id: string } };
let sessionCache: Session | null = null;
let pending: Promise<Session> | null = null;

const toSession = (a: AuthOut): Session => ({
  access_token: a.access_token,
  refresh_token: a.refresh_token,
  expires_at: Date.now() + a.expires_in * 1000,
  user_id: a.user.id,
});

/** Phiên ẩn danh của máy này: tạo lần đầu, làm mới khi sắp hết hạn. Gọi song song chỉ tạo một phiên. */
export function session(): Promise<Session> {
  if (sessionCache && sessionCache.expires_at - Date.now() > 60_000) return Promise.resolve(sessionCache);
  pending ??= (async () => {
    try {
      const saved = sessionCache ?? JSON.parse((await Storage.getItem(K_SESSION)) ?? 'null');
      let s: Session;
      if (saved && saved.expires_at - Date.now() > 60_000) s = saved;
      else if (saved?.refresh_token) {
        try {
          s = toSession(
            await http<AuthOut>('/auth/v1/token?grant_type=refresh_token', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: saved.refresh_token }),
            }),
          );
        } catch (e) {
          if (e instanceof CloudError && e.status >= 400 && e.status < 500) s = await signUpAnon();
          else throw e;
        }
      } else s = await signUpAnon();
      sessionCache = s;
      await Storage.setItem(K_SESSION, JSON.stringify(s));
      return s;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
const signUpAnon = async () =>
  toSession(await http<AuthOut>('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ data: {} }) }));

/** Id người dùng ẩn danh (dùng khi mời người khác vào nhóm). */
export const cloudUserId = async () => (await session()).user_id;

/** Gọi hàm `nc_*` trên máy chủ. `auth: true` = cần phiên của máy (đồng bộ, nhóm). */
export async function rpc<T>(
  fn: string,
  args: Record<string, unknown>,
  opts: { auth?: boolean; timeoutMs?: number } = {},
) {
  const headers: Record<string, string> = {};
  if (opts.auth) headers.Authorization = `Bearer ${(await session()).access_token}`;
  return http<T>(`/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(args),
    headers,
    timeoutMs: opts.timeoutMs,
  });
}

// ---------------- questions ("Gửi câu hỏi") ----------------
export type SentQuestion = {
  id: string | null; // null = đang chờ gửi (mất mạng)
  text: string;
  at: number;
  status: 'queued' | 'new' | 'grouped' | 'answered' | 'rejected';
  itemId?: string | null;
  title?: string | null;
  reason?: string | null;
};
const kQ = (app: string) => `nc:questions:${app}`;
export async function myQuestions(app: string): Promise<SentQuestion[]> {
  return JSON.parse((await Storage.getItem(kQ(app))) ?? '[]');
}
const saveQuestions = (app: string, list: SentQuestion[]) =>
  Storage.setItem(kQ(app), JSON.stringify(list.slice(0, 50)));

/**
 * Gửi câu hỏi app chưa trả lời được. Mất mạng thì giữ trên máy, lần mở app sau tự gửi (flushQuestions).
 * Trả về danh sách câu đã gửi mới nhất.
 */
export async function sendQuestion(app: string, text: string): Promise<SentQuestion[]> {
  const list = await myQuestions(app);
  const t = text.trim().replace(/\s+/g, ' ').slice(0, 300);
  if (list.some((q) => q.text.toLowerCase() === t.toLowerCase())) return list;
  list.unshift({ id: null, text: t, at: Date.now(), status: 'queued' });
  await saveQuestions(app, list);
  return flushQuestions(app);
}

/** Gửi các câu đang chờ và cập nhật trạng thái các câu đã gửi. Lỗi mạng: giữ nguyên, thử lại lần sau. */
export async function flushQuestions(app: string): Promise<SentQuestion[]> {
  const list = await myQuestions(app);
  if (!hasCloud() || !list.length) return list;
  const device = await deviceId();
  try {
    for (const q of list.filter((x) => !x.id)) {
      try {
        const r = await rpc<{ id: string }>('nc_question_submit', { p_app: app, p_device: device, p_text: q.text });
        q.id = r.id;
        q.status = 'new';
      } catch (e) {
        // câu quá ngắn / bị từ chối: bỏ khỏi hàng chờ; hết lượt hôm nay: để mai gửi
        if (e instanceof CloudError && /too_short|app_not_accepting/.test(e.message)) q.status = 'rejected';
        else throw e;
      }
    }
    const ids = list.filter((x) => x.id && x.status !== 'answered' && x.status !== 'rejected').map((x) => x.id!);
    if (ids.length) {
      const st = await rpc<
        {
          id: string;
          status: SentQuestion['status'];
          item_id: string | null;
          title: string | null;
          reason: string | null;
        }[]
      >('nc_question_status', { p_device: device, p_ids: ids });
      for (const s of st) {
        const q = list.find((x) => x.id === s.id);
        if (q) Object.assign(q, { status: s.status, itemId: s.item_id, title: s.title, reason: s.reason });
      }
    }
  } catch {
    /* mất mạng / máy chủ bận: giữ nguyên, lần sau thử lại */
  }
  await saveQuestions(
    app,
    list.filter((q) => q.status !== 'rejected' || q.id),
  );
  return list;
}

// ---------------- AI content bundles ----------------
type Manifest = {
  latest: number;
  full: { version: number; path: string } | null;
  deltas: { version: number; path: string; count: number }[];
};
const kC = (app: string) => `nc:content:${app}`;
const kChecked = (app: string) => `nc:content-checked:${app}`;

/** Nội dung đã tải về máy (chưa có thì `baked`: bản đóng sẵn khi build app). */
export async function cloudContent(app: string, baked?: { version: number; items: CloudItem[] }) {
  const saved = JSON.parse((await Storage.getItem(kC(app))) ?? 'null') as {
    version: number;
    items: CloudItem[];
  } | null;
  if (baked && (!saved || baked.version > saved.version)) return baked;
  return saved ?? { version: 0, items: [] };
}

/**
 * Tải nội dung mới nếu có (tối đa một lần mỗi `minHours`). Trả về toàn bộ nội dung sau khi gộp, hoặc null
 * khi không có gì mới. Tải delta nếu thiếu ít, tải full nếu mới cài hoặc thiếu nhiều.
 */
export async function updateCloudContent(
  app: string,
  baked?: { version: number; items: CloudItem[] },
  minHours = 12,
): Promise<{ version: number; items: CloudItem[] } | null> {
  if (!hasCloud()) return null;
  const last = Number((await Storage.getItem(kChecked(app))) ?? 0);
  if (Date.now() - last < minHours * 3600_000) return null;
  const { url } = base();
  const pub = `${url}/storage/v1/object/public/content/`;
  const get = async <T>(p: string) => {
    const r = await fetch(pub + p);
    if (!r.ok) throw new CloudError(`HTTP ${r.status}`, String(r.status), r.status);
    return (await r.json()) as T;
  };
  let m: Manifest;
  try {
    m = await get<Manifest>(`${app}/manifest.json`);
  } catch (e) {
    if (e instanceof CloudError && e.status === 400) await Storage.setItem(kChecked(app), String(Date.now()));
    return null; // chưa xuất bản gì (400/404) hoặc mất mạng
  }
  await Storage.setItem(kChecked(app), String(Date.now()));
  const cur = await cloudContent(app, baked);
  if (m.latest <= cur.version) return null;

  const missing = m.deltas.filter((d) => d.version > cur.version);
  const gap = !m.deltas.length || m.deltas[0].version > cur.version + 1;
  let next: { version: number; items: CloudItem[] };
  if ((cur.version === 0 || gap || missing.length > 5) && m.full) {
    const full = await get<{ items: CloudItem[] }>(m.full.path);
    next = { version: m.full.version, items: full.items };
  } else {
    const map = new Map(cur.items.map((i) => [i.id, i]));
    let v = cur.version;
    for (const d of missing) {
      const delta = await get<{ items: CloudItem[] }>(d.path);
      for (const it of delta.items) map.set(it.id, it);
      v = d.version;
    }
    next = { version: v, items: [...map.values()] };
  }
  await Storage.setItem(kC(app), JSON.stringify(next));
  return next;
}
