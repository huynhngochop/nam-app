declare const __DEV__: boolean;
declare const process: { env: Record<string, string | undefined> };
declare function require(id: string): any;
declare function btoa(s: string): string;
declare function atob(s: string): string;
declare class TextEncoder {
  encode(s: string): Uint8Array;
}
declare class TextDecoder {
  decode(b: Uint8Array): string;
}
declare const console: { log(...a: any[]): void; warn(...a: any[]): void; error(...a: any[]): void };
declare function setTimeout(fn: (...a: any[]) => void, ms?: number): number;
declare function clearTimeout(id: any): void;
declare function setInterval(fn: (...a: any[]) => void, ms?: number): number;
declare function clearInterval(id: any): void;
declare function fetch(
  url: string,
  init?: any,
): Promise<{ ok: boolean; status: number; json(): Promise<any>; text(): Promise<string> }>;
declare class AbortController {
  signal: any;
  abort(): void;
}
declare function requestAnimationFrame(fn: (t: number) => void): number;
declare function cancelAnimationFrame(id: number): void;
declare function queueMicrotask(fn: () => void): void;
