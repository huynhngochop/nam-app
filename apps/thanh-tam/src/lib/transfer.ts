/**
 * Gửi, nhận sổ giỗ và sao lưu toàn bộ dữ liệu bằng tệp (không cần máy chủ).
 * Hàm thuần, có kiểm thử: đọc tệp, kiểm tra từng bản ghi, so trùng, gộp mà không xóa dữ liệu đang có.
 */
import type { Anniversary } from './schedule';
import { fold } from '@nam/core';

export const TRANSFER_APP = 'thanh-tam';
export const MAX_IMPORT = 5000;

export type SoGioFile = {
  app: typeof TRANSFER_APP;
  kind: 'so-gio';
  v: 1;
  createdAt: number;
  /** Tên người gửi (tín chủ) để người nhận biết sổ của ai. */
  from?: string;
  anniversaries: Anniversary[];
};

/** Khóa được sao lưu. Không gồm: bản ghi riêng trên máy (đường dẫn tệp), giao dịch mua (khôi phục qua cửa hàng). */
export const BACKUP_KEYS = [
  'onboarded',
  'household',
  'remind',
  'theme',
  'fontScale',
  'prayFont',
  'ttsEnabled',
  'people',
  'anniversaries',
  'prayLogs',
  'saves',
  'offeringChecks',
  'levelByRitual',
  'fireAck',
  'face',
  'firstTimeDismissed',
  'chant',
  'myVideos',
] as const;
export type BackupKey = (typeof BACKUP_KEYS)[number];

export type BackupFile = {
  app: typeof TRANSFER_APP;
  kind: 'sao-luu';
  v: 1;
  createdAt: number;
  counts: { anniversaries: number; people: number };
  data: Partial<Record<BackupKey, unknown>>;
};

export type ParsedTransfer = { kind: 'so-gio'; file: SoGioFile } | { kind: 'sao-luu'; file: BackupFile };

/** Lỗi đọc tệp, mã ổn định để màn hình đổi ra câu dễ hiểu. */
export class TransferError extends Error {
  constructor(public code: 'KHONG_DOC_DUOC' | 'KHONG_PHAI_TEP_THANH_TAM' | 'PHIEN_BAN_MOI' | 'QUA_LON' | 'RONG') {
    super(code);
  }
}

export const TRANSFER_MESSAGES: Record<TransferError['code'], string> = {
  KHONG_DOC_DUOC: 'Không đọc được tệp này. Tệp có thể bị hỏng khi gửi.',
  KHONG_PHAI_TEP_THANH_TAM: 'Đây không phải tệp sổ giỗ hay bản sao lưu của Thành Tâm.',
  PHIEN_BAN_MOI: 'Tệp tạo từ bản Thành Tâm mới hơn. Cập nhật app rồi thử lại.',
  QUA_LON: 'Tệp có quá nhiều ngày giỗ để nhập một lần.',
  RONG: 'Tệp không có ngày giỗ nào.',
};

const str = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const int = (x: unknown, lo: number, hi: number) =>
  typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi ? x : null;

/** Kiểm tra, làm sạch một ngày giỗ đọc từ tệp. Sai thì bỏ (trả null), không làm hỏng cả tệp. */
export function cleanAnniversary(x: unknown): Anniversary | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const lunar = (o.lunar ?? {}) as Record<string, unknown>;
  const day = int(lunar.day, 1, 30);
  const month = int(lunar.month, 1, 12);
  const name = str(o.name, 80);
  if (!name || day === null || month === null) return null;
  const remind = Array.isArray(o.remindDays)
    ? [...new Set(o.remindDays.filter((d): d is number => int(d, 0, 30) !== null))].sort((a, b) => b - a).slice(0, 5)
    : [7, 3, 1];
  const a: Anniversary = {
    id: str(o.id, 40) || '',
    name,
    relation: str(o.relation, 40),
    lunar: { day, month, leap: lunar.leap === true },
    missingDayRule: o.missingDayRule === 'hoi-moi-nam' ? 'hoi-moi-nam' : 'ngay-cuoi-thang',
    remindDays: remind,
  };
  const dishes = str(o.dishes, 500);
  if (dishes) a.dishes = dishes;
  const death = str(o.deathSolar, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(death)) a.deathSolar = death;
  return a;
}

export function parseTransfer(text: string): ParsedTransfer {
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    throw new TransferError('KHONG_DOC_DUOC');
  }
  if (!j || typeof j !== 'object') throw new TransferError('KHONG_DOC_DUOC');
  const o = j as Record<string, unknown>;
  if (o.app !== TRANSFER_APP || (o.kind !== 'so-gio' && o.kind !== 'sao-luu')) {
    throw new TransferError('KHONG_PHAI_TEP_THANH_TAM');
  }
  if (typeof o.v !== 'number' || o.v > 1) throw new TransferError('PHIEN_BAN_MOI');
  const createdAt = typeof o.createdAt === 'number' ? o.createdAt : 0;
  if (o.kind === 'so-gio') {
    const raw = Array.isArray(o.anniversaries) ? o.anniversaries : [];
    if (raw.length > MAX_IMPORT) throw new TransferError('QUA_LON');
    const list = raw.map(cleanAnniversary).filter((a): a is Anniversary => !!a);
    if (!list.length) throw new TransferError('RONG');
    return {
      kind: 'so-gio',
      file: {
        app: TRANSFER_APP,
        kind: 'so-gio',
        v: 1,
        createdAt,
        from: str(o.from, 80) || undefined,
        anniversaries: list,
      },
    };
  }
  const data = (o.data && typeof o.data === 'object' ? o.data : {}) as Record<string, unknown>;
  const clean: Partial<Record<BackupKey, unknown>> = {};
  for (const k of BACKUP_KEYS) if (k in data) clean[k] = data[k];
  const ann = Array.isArray(clean.anniversaries) ? clean.anniversaries : [];
  if (ann.length > MAX_IMPORT) throw new TransferError('QUA_LON');
  clean.anniversaries = ann.map(cleanAnniversary).filter((a): a is Anniversary => !!a);
  const people = Array.isArray(clean.people) ? clean.people : [];
  return {
    kind: 'sao-luu',
    file: {
      app: TRANSFER_APP,
      kind: 'sao-luu',
      v: 1,
      createdAt,
      counts: { anniversaries: (clean.anniversaries as unknown[]).length, people: people.length },
      data: clean,
    },
  };
}

export function buildSoGio(list: Anniversary[], from: string | undefined, now = Date.now()): SoGioFile {
  return { app: TRANSFER_APP, kind: 'so-gio', v: 1, createdAt: now, from: from || undefined, anniversaries: list };
}

export function buildBackup(state: Partial<Record<BackupKey, unknown>>, now = Date.now()): BackupFile {
  const data: Partial<Record<BackupKey, unknown>> = {};
  for (const k of BACKUP_KEYS) if (state[k] !== undefined) data[k] = state[k];
  return {
    app: TRANSFER_APP,
    kind: 'sao-luu',
    v: 1,
    createdAt: now,
    counts: {
      anniversaries: Array.isArray(data.anniversaries) ? data.anniversaries.length : 0,
      people: Array.isArray(data.people) ? data.people.length : 0,
    },
    data,
  };
}

/** Tên tệp dễ nhận ra khi gửi qua mail, Zalo: ThanhTam-sogio-20261108.json */
export function transferFileName(kind: 'so-gio' | 'sao-luu', d = new Date()) {
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ThanhTam-${kind === 'so-gio' ? 'sogio' : 'saoluu'}-${ymd}.json`;
}

/** Cùng một người: cùng tên (bỏ dấu, hoa thường, khoảng trắng) và cùng ngày âm. */
export const personKey = (a: Pick<Anniversary, 'name' | 'lunar'>) =>
  `${fold(a.name).replace(/\s+/g, ' ').trim()}|${a.lunar.day}/${a.lunar.month}${a.lunar.leap ? 'n' : ''}`;

const content = (a: Anniversary) =>
  JSON.stringify([
    a.name.trim(),
    a.relation.trim(),
    a.lunar,
    a.missingDayRule,
    [...a.remindDays].sort(),
    a.dishes ?? '',
    a.deathSolar ?? '',
  ]);
export const sameContent = (a: Anniversary, b: Anniversary) => content(a) === content(b);

export type Conflict = { mine: Anniversary; theirs: Anniversary; why: 'cung-ma' | 'cung-nguoi' };
export type ImportPlan = { add: Anniversary[]; identical: number; conflicts: Conflict[] };

/**
 * Xếp từng ngày giỗ trong tệp vào: thêm mới / giống hệt (bỏ qua) / trùng cần hỏi.
 * Trùng = cùng mã (đã từng gửi qua lại) hoặc cùng người (tên + ngày âm) mà nội dung khác nhau.
 */
export function planImport(current: Anniversary[], incoming: Anniversary[]): ImportPlan {
  const byId = new Map(current.map((a) => [a.id, a]));
  const byKey = new Map(current.map((a) => [personKey(a), a]));
  const seen = new Set<string>();
  const plan: ImportPlan = { add: [], identical: 0, conflicts: [] };
  const usedMine = new Set<string>();
  for (const t of incoming) {
    const k = personKey(t);
    if (seen.has(k)) continue; // trùng ngay trong tệp: lấy bản đầu
    seen.add(k);
    const mine = (t.id && byId.get(t.id)) || byKey.get(k);
    if (!mine) {
      plan.add.push(t);
      continue;
    }
    if (usedMine.has(mine.id)) continue;
    usedMine.add(mine.id);
    if (sameContent(mine, t)) plan.identical++;
    else plan.conflicts.push({ mine, theirs: t, why: t.id && t.id === mine.id ? 'cung-ma' : 'cung-nguoi' });
  }
  return plan;
}

export type Decision = 'giu' | 'ghi-de';

/**
 * Gộp theo kế hoạch. Không xóa gì của người dùng. Ghi đè giữ mã của bản trên máy để nhắc lịch và
 * các màn đang mở không mất dấu. Bản mới thêm giữ mã từ tệp (gửi qua lại lần sau sẽ nhận ra nhau),
 * trừ khi mã đó đã có trên máy cho một người khác.
 */
export function applyImport(
  current: Anniversary[],
  plan: ImportPlan,
  decisions: Decision[],
  newId: () => string,
): { list: Anniversary[]; added: number; overwritten: number } {
  const out = new Map(current.map((a) => [a.id, a]));
  let overwritten = 0;
  plan.conflicts.forEach((c, i) => {
    if (decisions[i] === 'ghi-de') {
      out.set(c.mine.id, { ...c.theirs, id: c.mine.id });
      overwritten++;
    }
  });
  for (const a of plan.add) {
    const id = a.id && !out.has(a.id) ? a.id : newId();
    out.set(id, { ...a, id });
  }
  return { list: [...out.values()], added: plan.add.length, overwritten };
}

/** Khác nhau ở đâu, để người dùng quyết định ghi đè hay không. */
export function diffFields(mine: Anniversary, theirs: Anniversary): string[] {
  const d: string[] = [];
  if (mine.name.trim() !== theirs.name.trim()) d.push('tên');
  if (mine.relation.trim() !== theirs.relation.trim()) d.push('quan hệ');
  if (JSON.stringify(mine.lunar) !== JSON.stringify(theirs.lunar)) d.push('ngày âm');
  if (mine.missingDayRule !== theirs.missingDayRule) d.push('cách tính tháng thiếu');
  if ([...mine.remindDays].sort().join() !== [...theirs.remindDays].sort().join()) d.push('ngày nhắc');
  if ((mine.dishes ?? '') !== (theirs.dishes ?? '')) d.push('món cúng');
  if ((mine.deathSolar ?? '') !== (theirs.deathSolar ?? '')) d.push('ngày mất dương lịch');
  return d;
}
