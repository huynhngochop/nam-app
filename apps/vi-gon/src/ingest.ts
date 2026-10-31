import { track, uid } from '@nam/core';
import { insertTx, near, updateTx } from './db';
import { categorize, parseBankText, signatureOf } from './parse';
import { useVi } from './store';
import { Tx } from './types';

export type IngestResult = { status: 'saved' | 'pending' | 'unparsed' | 'duplicate'; tx?: Tx };

/**
 * Một thông báo / tin nhắn ngân hàng đi vào app (từ bộ lắng nghe Android, Phím tắt iOS qua deep link, hoặc dán tay).
 * Mọi xử lý ở trên máy. Không đọc được → xếp vào "Chưa đọc được" (VG-18) thay vì bỏ mất.
 */
export function ingestText(
  text: string,
  opts: { app?: string | null; source?: Tx['source']; postedAt?: number } = {},
): IngestResult {
  const s = useVi.getState();
  const parsed = parseBankText(text, new Date(opts.postedAt ?? Date.now()));
  if (!parsed) {
    s.addUnparsed({ text, app: opts.app ?? null, at: opts.postedAt ?? Date.now() });
    track('tx_unparsed', { app: opts.app ?? 'paste' });
    return { status: 'unparsed' };
  }
  const at = parsed.at ?? opts.postedAt ?? Date.now();

  // Cùng nội dung đã ghi (thông báo lặp lại khi máy khởi động lại) → bỏ qua hẳn.
  const same = near(parsed.amount, at, 120000).find((x) => x.raw === text);
  if (same) return { status: 'duplicate', tx: same };

  const { categoryId, confident } = categorize(parsed.merchant, parsed.kind, s.rules);
  const tx: Tx = {
    id: uid(),
    amount: parsed.amount,
    kind: parsed.kind,
    categoryId,
    merchant: parsed.merchant || (parsed.kind === 'income' ? 'Tiền vào' : 'Chi tiêu'),
    note: '',
    at,
    account: parsed.account,
    source: opts.source ?? 'auto',
    status: s.askBeforeSave || !confident ? 'pending' : 'confirmed',
    raw: text,
    fundId: null,
    flag: null,
    pairId: null,
    createdAt: Date.now(),
  };

  // VG-19: cùng số tiền trong 3 phút từ nguồn khác → nghi trùng; ngược chiều trong 10 phút, khác tài khoản → nghi chuyển nội bộ.
  const around = near(parsed.amount, at, 10 * 60000);
  const dup = around.find((x) => x.kind === tx.kind && Math.abs(x.at - at) <= 180000 && x.raw !== text);
  const pair = around.find(
    (x) => x.kind !== tx.kind && x.kind !== 'transfer' && x.account && tx.account && x.account !== tx.account,
  );
  if (dup) {
    tx.flag = 'dup';
    tx.pairId = dup.id;
    tx.status = 'pending';
    updateTx(dup.id, { flag: 'dup', pairId: tx.id });
  } else if (pair) {
    tx.flag = 'transfer';
    tx.pairId = pair.id;
    updateTx(pair.id, { flag: 'transfer', pairId: tx.id });
  }

  insertTx(tx);
  if (opts.app && !s.learned.some((l) => l.sig === signatureOf(text)))
    s.set({ learned: [...s.learned, { sig: signatureOf(text), app: opts.app }].slice(-100) });
  track('tx_ingested', { status: tx.status, flag: tx.flag ?? 'none' });
  return { status: tx.status === 'confirmed' ? 'saved' : 'pending', tx };
}

/** Dán nhiều tin một lúc: tách theo dòng trống hoặc mỗi dòng có số tiền. */
export function ingestMany(block: string): { saved: number; pending: number; unparsed: number; duplicate: number } {
  const parts = block
    .split(/\n\s*\n/)
    .flatMap((p) => (p.split('\n').filter((l) => /[+\-−]\s*\d/.test(l)).length > 1 ? p.split('\n') : [p]))
    .map((x) => x.trim())
    .filter(Boolean);
  const r = { saved: 0, pending: 0, unparsed: 0, duplicate: 0 };
  for (const p of parts.slice(0, 200)) r[ingestText(p, { source: 'import' }).status]++;
  return r;
}
