/**
 * Kết nối máy chủ Band7 (Supabase) bằng fetch thuần — không thêm @supabase/supabase-js (~100 KB) vào APK.
 * Chỉ bật khi có EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY. Thiếu cấu hình: app chạy chế độ
 * ngoại tuyến (lộ trình, đề, sổ tay đã lưu), phần nói với AI hiện thông báo chưa sẵn sàng.
 */
import type { Criterion } from './plan';

const URL_ = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const serverEnabled = () => !!URL_ && !!ANON;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email?: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public messageVi: string,
  ) {
    super(messageVi || code);
  }
}

/** Phiên đăng nhập do store giữ; api.ts chỉ đọc/ghi qua 2 hàm này để không phụ thuộc store. */
let getSession: () => AuthSession | null = () => null;
let saveSession: (s: AuthSession | null) => void = () => {};
export function bindSession(get: () => AuthSession | null, save: (s: AuthSession | null) => void) {
  getSession = get;
  saveSession = save;
}

type AuthResp = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
};
const toSession = (r: AuthResp): AuthSession => ({
  accessToken: r.access_token,
  refreshToken: r.refresh_token,
  expiresAt: Date.now() + r.expires_in * 1000,
  userId: r.user.id,
  email: r.user.email,
});

async function authFetch(path: string, body: unknown): Promise<AuthResp> {
  const res = await fetch(`${URL_}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      res.status,
      j.error_code ?? 'auth',
      j.msg ?? j.error_description ?? 'Đăng nhập không thành công.',
    );
  return j as AuthResp;
}

/** "Dùng thử không cần tài khoản": cần bật Anonymous sign-ins trong Supabase Auth. */
export async function signInAnonymously(): Promise<AuthSession> {
  const s = toSession(await authFetch('signup', { data: {} }));
  saveSession(s);
  return s;
}
/** Gửi mã 6 số qua email. */
export async function sendEmailCode(email: string): Promise<void> {
  const res = await fetch(`${URL_}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!res.ok) throw new ApiError(res.status, 'otp', 'Không gửi được mã. Kiểm tra lại email.');
}
export async function verifyEmailCode(email: string, token: string): Promise<AuthSession> {
  const s = toSession(await authFetch('verify', { type: 'email', email, token }));
  saveSession(s);
  return s;
}
export function signOut() {
  saveSession(null);
}

let refreshing: Promise<AuthSession | null> | null = null;
async function validToken(): Promise<string> {
  const s = getSession();
  if (!s) throw new ApiError(401, 'no_session', 'Bạn cần đăng nhập để nói với giám khảo AI.');
  if (s.expiresAt - Date.now() > 60_000) return s.accessToken;
  refreshing ??= authFetch('token?grant_type=refresh_token', { refresh_token: s.refreshToken })
    .then((r) => {
      const n = toSession(r);
      saveSession(n);
      return n;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  const n = await refreshing;
  if (!n) {
    saveSession(null);
    throw new ApiError(401, 'expired', 'Phiên đăng nhập đã hết, đăng nhập lại nhé.');
  }
  return n.accessToken;
}

async function call<T>(
  path: string,
  init: { body: FormData | string; json?: boolean; timeoutMs?: number },
): Promise<T> {
  if (!serverEnabled()) throw new ApiError(0, 'offline', 'Phần nói với AI chưa được bật ở bản này.');
  const token = await validToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 30_000);
  try {
    const res = await fetch(`${URL_}${path}`, {
      method: 'POST',
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token}`,
        ...(init.json ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body,
      signal: ctrl.signal,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, j.error ?? 'error', j.message_vi ?? defaultMessage(res.status));
    return j as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, 'network', 'Mất kết nối. Kiểm tra mạng rồi thử lại.');
  } finally {
    clearTimeout(timer);
  }
}
function defaultMessage(status: number) {
  if (status === 429) return 'Bạn đã dùng hết lượt nói hôm nay.';
  if (status === 503) return 'Máy chủ AI đang bận, thử lại sau vài giây.';
  if (status === 401) return 'Bạn cần đăng nhập lại.';
  return 'Có lỗi, thử lại sau.';
}

function audioPart(uri: string) {
  // React Native nhận object {uri,name,type} trong FormData
  return { uri, name: 'turn.m4a', type: 'audio/m4a' } as unknown as Blob;
}

/* ───────────── Các API của backend (xem band7-backend/README.md) ───────────── */

export type Correction = {
  id: string;
  code: string | null;
  category: Criterion;
  wrong: string;
  right: string;
  band7: string | null;
  explain_vi: string | null;
};
export type RecallResult = { error_id: string; result: 'correct' | 'wrong'; streak?: number; status?: string };
export type TurnResult = {
  transcript: string;
  reply: string;
  corrections: Correction[];
  hint_vi: string;
  recall: RecallResult | null;
  turns_left: number;
};
export type SessionKind = 'placement' | 'part1' | 'part2' | 'part3' | 'mock' | 'free';

/** `first`: câu hỏi đầu lấy từ đề trong máy (đề local), để máy chủ và app cùng một đề. */
export function startSession(
  kind: SessionKind,
  mode: 'practice' | 'exam',
  topicId?: string,
  first?: string,
  topicTitle?: string,
) {
  const f = new FormData();
  f.append('kind', kind);
  f.append('mode', mode);
  if (topicId && !topicId.startsWith('local-')) f.append('topic_id', topicId);
  else if (first) {
    f.append('first', first);
    if (topicTitle) f.append('topic_title', topicTitle);
  }
  return call<{ session_id: string; reply: string; topic: string | null }>('/functions/v1/talk', { body: f });
}
export function sendTurn(sessionId: string, audioUri: string) {
  const f = new FormData();
  f.append('session_id', sessionId);
  f.append('audio', audioPart(audioUri));
  return call<TurnResult>('/functions/v1/talk', { body: f, timeoutMs: 40_000 });
}

export type RepairResult = {
  transcript: string;
  target: string;
  key_phrase: string;
  ok: boolean;
  similarity: number;
  missed: string[];
  keyHit: boolean;
  repair_ok?: number;
  status?: 'repairing' | 'recalling' | 'closed';
  next_due_at?: string;
  message_vi: string;
};
export function sendRepair(errorId: string, audioUri: string, target: 'right' | 'band7' = 'right') {
  const f = new FormData();
  f.append('error_id', errorId);
  f.append('target', target);
  f.append('audio', audioPart(audioUri));
  return call<RepairResult>('/functions/v1/repair', { body: f });
}

export type GradeResult = {
  fc: number;
  lr: number;
  gra: number;
  p: number;
  overall: number;
  strengths_vi: string[];
  priorities_vi: string[];
};
export function gradeSession(sessionId: string) {
  return call<GradeResult>('/functions/v1/grade', {
    body: JSON.stringify({ session_id: sessionId }),
    json: true,
    timeoutMs: 45_000,
  });
}

/* ───────────── Đọc dữ liệu của chính mình (RLS) ───────────── */

export type LearnerError = {
  id: string;
  code: string | null;
  category: Criterion;
  wrong_text: string;
  right_text: string;
  band7_text: string | null;
  explain_vi: string | null;
  status: 'repairing' | 'recalling' | 'closed';
  repair_ok: number;
  stage: number;
  streak: number;
  occurrences: number;
  next_due_at: string | null;
  closed_at: string | null;
  last_seen_at: string;
  created_at: string;
};

async function rest<T>(pathAndQuery: string, init?: { method?: string; body?: unknown; prefer?: string }): Promise<T> {
  if (!serverEnabled()) throw new ApiError(0, 'offline', '');
  const token = await validToken();
  const res = await fetch(`${URL_}/rest/v1/${pathAndQuery}`, {
    method: init?.method ?? 'GET',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: init?.prefer ?? 'return=minimal',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, 'rest', defaultMessage(res.status));
  return (res.status === 204 || res.status === 201 ? null : await res.json()) as T;
}

export function fetchErrors() {
  return rest<LearnerError[]>('learner_errors?select=*&order=last_seen_at.desc&limit=300');
}
export type ErrorEvent = { kind: string; created_at: string };
export function fetchErrorEvents(errorId: string) {
  return rest<ErrorEvent[]>(
    `error_events?select=kind,created_at&error_id=eq.${encodeURIComponent(errorId)}&order=created_at`,
  );
}
/** Điểm thi IELTS thật người dùng nhập — dùng để hiệu chỉnh cách chấm. */
export function saveRealScore(userId: string, b: { fc: number; lr: number; gra: number; p: number; overall: number }) {
  return rest<null>('band_snapshots', { method: 'POST', body: { user_id: userId, source: 'real_exam', ...b } });
}
export function saveProfile(row: Record<string, unknown>) {
  return rest<null>('profiles?on_conflict=id', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}
