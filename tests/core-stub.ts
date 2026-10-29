export * from '../packages/core/src/format';
export class AiUnavailableError extends Error {}
export class AiQuotaError extends Error {}
export async function callAi<T>(_f: string, _p: unknown, _o?: unknown): Promise<T> { throw new AiUnavailableError(); }
export const track = (_e: string, _p?: unknown) => {};
let n = 0;
export const uid = () => `id${++n}`;
