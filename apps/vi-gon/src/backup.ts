import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { allTx, insertMany } from './db';
import { useVi } from './store';
import { Tx } from './types';

/**
 * Sao lưu mã hóa đầu-cuối (VG-15/VG-20). Khóa sinh từ mật khẩu bằng PBKDF2-SHA256, mã hóa XChaCha20-Poly1305.
 * Ví Gọn không giữ mật khẩu — quên mật khẩu thì không ai mở được bản sao lưu.
 * Tệp .vgb do người dùng tự lưu vào iCloud Drive / Google Drive qua bảng chia sẻ của hệ điều hành.
 */
const ITER = 150_000;
export type BackupMeta = {
  v: 1;
  app: 'vi-gon';
  createdAt: number;
  txCount: number;
  fundCount: number;
  hint: string;
  kdf: 'pbkdf2-sha256';
  iter: number;
  salt: string;
  nonce: string;
};
type BackupFile = BackupMeta & { data: string };

const enc = new TextEncoder();
const dec = new TextDecoder();
function b64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function unb64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const deriveKey = (pw: string, salt: Uint8Array, iter: number) =>
  pbkdf2Async(sha256, enc.encode(pw.normalize('NFC')), salt, { c: iter, dkLen: 32, asyncTick: 20 });

const SETTINGS_KEYS = [
  'name',
  'monthlyBudget',
  'monthStartDay',
  'budgets',
  'categories',
  'rules',
  'funds',
  'allowedApps',
  'askBeforeSave',
  'isPro',
  'learned',
] as const;

export async function createBackup(password: string, hint: string): Promise<{ uri: string; shared: boolean }> {
  if (password.length < 8) throw new Error('WEAK_PASSWORD');
  const s = useVi.getState();
  const settings = Object.fromEntries(SETTINGS_KEYS.map((k) => [k, s[k]]));
  const tx = allTx();
  const salt = Crypto.getRandomBytes(16);
  const nonce = Crypto.getRandomBytes(24);
  const key = await deriveKey(password, salt, ITER);
  const cipher = xchacha20poly1305(key, nonce).encrypt(enc.encode(JSON.stringify({ settings, tx })));
  const file: BackupFile = {
    v: 1,
    app: 'vi-gon',
    createdAt: Date.now(),
    txCount: tx.length,
    fundCount: s.funds.length,
    hint: hint.slice(0, 60),
    kdf: 'pbkdf2-sha256',
    iter: ITER,
    salt: b64(salt),
    nonce: b64(nonce),
    data: b64(cipher),
  };
  const d = new Date();
  const f = new File(
    Paths.cache,
    `ViGon-saoluu-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.vgb`,
  );
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(file));
  s.set({ lastBackupAt: Date.now(), backupHint: hint });
  const can = await Sharing.isAvailableAsync();
  if (can)
    await Sharing.shareAsync(f.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Lưu bản sao lưu Ví Gọn',
      UTI: 'public.data',
    });
  return { uri: f.uri, shared: can };
}

export function readMeta(uri: string): BackupMeta {
  const text = new File(uri).textSync();
  const j = JSON.parse(text) as BackupFile;
  if (j.app !== 'vi-gon' || j.v !== 1 || !j.data) throw new Error('NOT_BACKUP');
  const { data: _d, ...meta } = j;
  return meta;
}

/** Sai mật khẩu → ném 'WRONG_PASSWORD' (Poly1305 không khớp). Thành công → ghi đè dữ liệu trên máy. */
export async function restoreBackup(uri: string, password: string): Promise<{ txCount: number }> {
  const j = JSON.parse(new File(uri).textSync()) as BackupFile;
  const key = await deriveKey(password, unb64(j.salt), j.iter);
  let plain: Uint8Array;
  try {
    plain = xchacha20poly1305(key, unb64(j.nonce)).decrypt(unb64(j.data));
  } catch {
    throw new Error('WRONG_PASSWORD');
  }
  const { settings, tx } = JSON.parse(dec.decode(plain)) as { settings: Record<string, unknown>; tx: Tx[] };
  insertMany(tx, { replaceAll: true });
  useVi.getState().set({ ...(settings as object), onboarded: true, lastBackupAt: j.createdAt, backupHint: j.hint });
  return { txCount: tx.length };
}
