import * as Crypto from 'expo-crypto';
/** UUID v4 — dùng làm id bản ghi và idempotencyKey (Chuẩn spec › 11). */
export const uid = (): string => Crypto.randomUUID();
