import { getConfig } from './config';
import { uid } from './id';

/**
 * Client của "Cổng AI" dùng chung (Chuẩn spec › 13). App KHÔNG chứa khóa API của nhà cung cấp.
 * Khi chưa cấu hình EXPO_PUBLIC_AI_GATEWAY_URL, mọi lời gọi ném AiUnavailableError để màn dùng phương án không AI.
 */
export class AiUnavailableError extends Error { constructor(msg = 'AI chưa sẵn sàng') { super(msg); } }
export class AiQuotaError extends Error { constructor() { super('Hết lượt hôm nay'); } }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callAi<T>(feature: string, payload: unknown, opts: { timeoutMs?: number; userId?: string } = {}): Promise<T> {
  const base = getConfig().aiGatewayUrl;
  if (!base) throw new AiUnavailableError();
  const key = uid();
  const delays = [0, 1000, 4000];
  let lastErr: unknown;
  for (const d of delays) {
    if (d) await sleep(d + Math.random() * 300);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
    try {
      const res = await fetch(`${base}/${feature}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': key, ...(opts.userId ? { 'x-user': opts.userId } : {}) },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (res.status === 429) throw new AiQuotaError();
      if (res.status >= 500) { lastErr = new Error(`AI ${res.status}`); continue; }
      if (!res.ok) throw new AiUnavailableError(`AI ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof AiQuotaError || e instanceof AiUnavailableError) throw e;
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr instanceof Error ? new AiUnavailableError(lastErr.message) : new AiUnavailableError();
}
