import { AiUnavailableError, callAi, fold } from '@nam/core';
import { Tip, TIPS, tipById } from '../data/tips';
import { scoreTip } from './search';

/** Hỏi Mẹo Nhà (MN-21…23). Chỉ trả lời từ kho mẹo đã kiểm chứng; câu nguy hiểm bị chặn bằng quy tắc TRƯỚC khi gọi AI. */
export type AskAnswer =
  | { kind: 'answer'; text: string; steps: string[]; sources: Tip[]; safety: string[]; viaAi: boolean }
  | { kind: 'danger'; text: string; sources: Tip[] }
  | { kind: 'no_tip' }
  | { kind: 'out_of_scope' };

const DANGER: { re: RegExp; text: string; tip?: string }[] = [
  { re: /(javel|clo|nuoc tay|thuoc tay).*(giam|amoniac|axit|acid)|(giam|amoniac|axit).*(javel|clo|nuoc tay)/, text: 'Không nên làm. Trộn nước tẩy javel với giấm hoặc amoniac sinh ra khí độc. Dùng riêng từng loại, xả sạch giữa hai lần.', tip: 't6' },
  { re: /(\bgas\b|binh ga|bep ga).*(ro ri|\bxi\b|\bmui\b)|ro ri gas/, text: 'Nếu ngửi thấy mùi gas: khóa van bình, mở cửa thông gió, không bật/tắt công tắc điện, không bật lửa và gọi kỹ thuật viên.' },
  { re: /(chap dien|giat dien|sua (o cam|dien|cau dao|day dien)|tu (sua|thay) (o cam|cau dao|day dien))/, text: 'Việc sửa điện có nguy cơ giật. Ngắt cầu dao và gọi thợ điện; Mẹo Nhà không hướng dẫn tự sửa điện.' },
];
const OUT_OF_SCOPE = /(bi sot|sot cao|uong thuoc|thuoc gi|dau bung|mang thai|phap ly|kien tung|dau tu|chung khoan|vay tien|benh vien|kham benh)/;

export function preCheck(q: string): AskAnswer | null {
  const f = fold(q);
  for (const d of DANGER) if (d.re.test(f)) return { kind: 'danger', text: d.text, sources: d.tip ? [tipById(d.tip)!] : [] };
  if (OUT_OF_SCOPE.test(f)) return { kind: 'out_of_scope' };
  return null;
}

export function retrieve(q: string, k = 5): Tip[] {
  return TIPS.map((t) => ({ t, s: scoreTip(t, q) })).filter((x) => x.s >= 0.5).sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.t);
}

/** Trả lời không cần AI: dùng mẹo khớp nhất. */
function localAnswer(top: Tip[]): AskAnswer {
  const best = top[0];
  return { kind: 'answer', text: best.summary, steps: best.steps, sources: top.slice(0, 2), safety: best.safety ?? [], viaAi: false };
}

type AiOut = { answer: string; steps: string[]; sourceTipIds: string[]; confidence: number };

export async function ask(q: string, history: string[] = []): Promise<AskAnswer> {
  const pre = preCheck(q);
  if (pre) return pre;
  const top = retrieve(q);
  if (!top.length) return { kind: 'no_tip' };
  try {
    const out = await callAi<AiOut>('ask', { question: q, context: history.slice(0, 2), tips: top.map((t) => ({ id: t.id, title: t.title, steps: t.steps, safety: t.safety })) });
    const allowed = new Set(top.map((t) => t.id));
    const sources = out.sourceTipIds.filter((id) => allowed.has(id)).map((id) => tipById(id)!).filter(Boolean);
    if (!sources.length || out.confidence < 0.6) return { kind: 'no_tip' };
    const safety = sources.flatMap((s) => s.safety ?? []);
    return { kind: 'answer', text: out.answer, steps: out.steps.slice(0, 5), sources, safety, viaAi: true };
  } catch (e) {
    if (e instanceof AiUnavailableError) return localAnswer(top);
    throw e;
  }
}

export const POPULAR_QUESTIONS = ['Áo trắng bị ố vàng ở cổ?', 'Tường bị nồm chảy nước phải làm sao?', 'Cây lưỡi hổ bị úng rễ cứu được không?', 'Làm sao hết mùi tủ lạnh?'];
