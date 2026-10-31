import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { Tx } from './types';

/**
 * Giao dịch nằm trong SQLite (có chỉ mục theo thời gian) để danh sách vài chục nghìn dòng vẫn mượt.
 * Truy vấn đồng bộ, nhỏ, chạy dưới 1–2 ms; tổng hợp làm bằng SQL, không nạp hết vào bộ nhớ.
 */
let db: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS tx (
  id TEXT PRIMARY KEY NOT NULL,
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,
  category_id TEXT,
  merchant TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL,
  account TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  raw TEXT,
  fund_id TEXT,
  flag TEXT,
  pair_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tx_at ON tx(at DESC);
CREATE INDEX IF NOT EXISTS tx_status ON tx(status);
CREATE INDEX IF NOT EXISTS tx_cat ON tx(category_id, at);
`;

export function getDb() {
  if (!db) {
    db = SQLite.openDatabaseSync('vigon.db');
    db.execSync(SCHEMA);
  }
  return db;
}

/** Bộ đếm phiên bản — mọi thao tác ghi tăng số này để các màn đang mở tự truy vấn lại. */
export const useTxVersion = create<{ v: number; bump: () => void }>((set) => ({
  v: 0,
  bump: () => set((s) => ({ v: s.v + 1 })),
}));
const bump = () => useTxVersion.getState().bump();

type Row = {
  id: string;
  amount: number;
  kind: Tx['kind'];
  category_id: string | null;
  merchant: string;
  note: string;
  at: number;
  account: string | null;
  source: Tx['source'];
  status: Tx['status'];
  raw: string | null;
  fund_id: string | null;
  flag: Tx['flag'];
  pair_id: string | null;
  created_at: number;
};
const toTx = (r: Row): Tx => ({
  id: r.id,
  amount: r.amount,
  kind: r.kind,
  categoryId: r.category_id,
  merchant: r.merchant,
  note: r.note,
  at: r.at,
  account: r.account,
  source: r.source,
  status: r.status,
  raw: r.raw,
  fundId: r.fund_id,
  flag: r.flag,
  pairId: r.pair_id,
  createdAt: r.created_at,
});

const txArgs = (t: Tx) => [
  t.id,
  Math.round(t.amount),
  t.kind,
  t.categoryId,
  t.merchant,
  t.note,
  t.at,
  t.account,
  t.source,
  t.status,
  t.raw,
  t.fundId,
  t.flag,
  t.pairId,
  t.createdAt,
];

export function insertTx(t: Tx) {
  getDb().runSync(
    `INSERT INTO tx (id, amount, kind, category_id, merchant, note, at, account, source, status, raw, fund_id, flag, pair_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    txArgs(t),
  );
  bump();
}

/** 15 cột × 60 dòng = 900 tham số, dưới giới hạn 999 của SQLite cũ. */
export const INSERT_ROWS_PER_STMT = 60;

export function insertMany(list: Tx[], opts: { replaceAll?: boolean } = {}) {
  const d = getDb();
  // Một giao dịch SQLite: lỗi giữa chừng thì không mất dữ liệu cũ.
  // Ghi nhiều dòng mỗi câu lệnh: khôi phục 12 nghìn giao dịch chỉ còn ~200 lần gọi thay vì 12 nghìn (IT6).
  d.withTransactionSync(() => {
    if (opts.replaceAll) d.runSync('DELETE FROM tx');
    for (let i = 0; i < list.length; i += INSERT_ROWS_PER_STMT) {
      const part = list.slice(i, i + INSERT_ROWS_PER_STMT);
      d.runSync(
        `INSERT OR REPLACE INTO tx (id, amount, kind, category_id, merchant, note, at, account, source, status, raw, fund_id, flag, pair_id, created_at)
         VALUES ${part.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
        part.flatMap(txArgs),
      );
    }
  });
  bump();
}

const COLS: Record<string, string> = {
  amount: 'amount',
  kind: 'kind',
  categoryId: 'category_id',
  merchant: 'merchant',
  note: 'note',
  at: 'at',
  account: 'account',
  source: 'source',
  status: 'status',
  fundId: 'fund_id',
  flag: 'flag',
  pairId: 'pair_id',
};

export function updateTx(id: string, p: Partial<Tx>) {
  const keys = Object.keys(p).filter((k) => COLS[k]);
  if (!keys.length) return;
  getDb().runSync(`UPDATE tx SET ${keys.map((k) => `${COLS[k]} = ?`).join(', ')} WHERE id = ?`, [
    ...keys.map((k) => (p as Record<string, never>)[k] ?? null),
    id,
  ]);
  bump();
}

export function deleteTx(id: string) {
  getDb().runSync('DELETE FROM tx WHERE id = ?', [id]);
  bump();
}

export function getTx(id: string): Tx | null {
  const r = getDb().getFirstSync<Row>('SELECT * FROM tx WHERE id = ?', [id]);
  return r ? toTx(r) : null;
}

export type TxFilter = {
  from?: number;
  to?: number;
  kind?: Tx['kind'];
  status?: Tx['status'];
  categoryId?: string;
  q?: string;
  flagged?: boolean;
  limit?: number;
};

export function listTx(f: TxFilter = {}): Tx[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.from != null) {
    where.push('at >= ?');
    args.push(f.from);
  }
  if (f.to != null) {
    where.push('at < ?');
    args.push(f.to);
  }
  if (f.kind) {
    where.push('kind = ?');
    args.push(f.kind);
  }
  if (f.status) {
    where.push('status = ?');
    args.push(f.status);
  }
  if (f.categoryId) {
    where.push('category_id = ?');
    args.push(f.categoryId);
  }
  if (f.flagged) where.push('flag IS NOT NULL');
  if (f.q) {
    const digits = f.q.replace(/[^\d]/g, '');
    where.push(`(merchant LIKE ? OR note LIKE ?${digits.length >= 3 ? ' OR CAST(amount AS TEXT) LIKE ?' : ''})`);
    args.push(`%${f.q}%`, `%${f.q}%`, ...(digits.length >= 3 ? [`%${digits}%`] : []));
  }
  const sql = `SELECT * FROM tx ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY at DESC LIMIT ${f.limit ?? 2000}`;
  return getDb().getAllSync<Row>(sql, args).map(toTx);
}

/** Tổng chi/thu (đã xác nhận) trong khoảng [from, to). Chuyển nội bộ không tính. */
export function totals(from: number, to: number) {
  const r = getDb().getFirstSync<{ exp: number | null; inc: number | null; n: number }>(
    `SELECT SUM(CASE WHEN kind = 'expense' THEN amount END) AS exp, SUM(CASE WHEN kind = 'income' THEN amount END) AS inc, COUNT(*) AS n
     FROM tx WHERE status = 'confirmed' AND at >= ? AND at < ?`,
    [from, to],
  );
  return { expense: r?.exp ?? 0, income: r?.inc ?? 0, count: r?.n ?? 0 };
}

export function byCategory(from: number, to: number, kind: 'expense' | 'income' = 'expense') {
  return getDb()
    .getAllSync<{ category_id: string | null; total: number; n: number }>(
      `SELECT category_id, SUM(amount) AS total, COUNT(*) AS n FROM tx WHERE status = 'confirmed' AND kind = ? AND at >= ? AND at < ?
     GROUP BY category_id ORDER BY total DESC`,
      [kind, from, to],
    )
    .map((r) => ({ categoryId: r.category_id ?? 'other', total: r.total, count: r.n }));
}

export function countWhere(sql: string, args: (string | number)[] = []) {
  return getDb().getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM tx WHERE ${sql}`, args)?.n ?? 0;
}

/** Giao dịch gần một thời điểm có cùng số tiền (dò trùng, chuyển nội bộ). */
export function near(amount: number, at: number, windowMs: number, excludeId?: string) {
  return getDb()
    .getAllSync<Row>('SELECT * FROM tx WHERE amount = ? AND at BETWEEN ? AND ? AND id != ?', [
      amount,
      at - windowMs,
      at + windowMs,
      excludeId ?? '',
    ])
    .map(toTx);
}

export function lastAutoAt(): number | null {
  return getDb().getFirstSync<{ m: number | null }>("SELECT MAX(at) AS m FROM tx WHERE source = 'auto'")?.m ?? null;
}

/** Số dòng mỗi lần đọc khi xuất / sao lưu toàn bộ. */
export const EXPORT_PAGE = 1000;

/**
 * Toàn bộ giao dịch, cũ trước. Đọc theo trang (IT1): một lần đọc cả bảng 12 nghìn dòng vượt bộ đệm
 * kết quả của SQLite bản web ("offset is out of bounds") và giữ luồng JS quá lâu trên máy yếu.
 */
export function allTx(pageSize = EXPORT_PAGE): Tx[] {
  const d = getDb();
  const out: Tx[] = [];
  let last: { at: number; id: string } | null = null;
  for (;;) {
    const rows: Row[] = last
      ? d.getAllSync<Row>('SELECT * FROM tx WHERE at > ? OR (at = ? AND id > ?) ORDER BY at, id LIMIT ?', [
          last.at,
          last.at,
          last.id,
          pageSize,
        ])
      : d.getAllSync<Row>('SELECT * FROM tx ORDER BY at, id LIMIT ?', [pageSize]);
    for (const r of rows) out.push(toTx(r));
    if (rows.length < pageSize) return out;
    const tail = rows[rows.length - 1];
    last = { at: tail.at, id: tail.id };
  }
}
export function wipeTx() {
  getDb().runSync('DELETE FROM tx');
  bump();
}

/** Chạy lại truy vấn mỗi khi dữ liệu đổi. Lỗi CSDL → trả giá trị mặc định thay vì làm sập màn hình. */
export function useQuery<T>(fn: () => T, deps: unknown[], fallback: T): T {
  const v = useTxVersion((s) => s.v);
  const [val, setVal] = useState<T>(() => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      setVal(fn());
    } catch (e) {
      console.warn('[vigon] query failed', e);
      setVal(fallback);
    }
  }, [v, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}
