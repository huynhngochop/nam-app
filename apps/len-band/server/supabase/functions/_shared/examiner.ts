// Prompt giám khảo AI + kiểm tra kết quả trả về. Thuần TypeScript để test được bằng Node.

export type Category = "GRA" | "LR" | "P" | "FC";

export interface ErrorCodeLite { code: string; category: Category; title: string }
export interface RecallTarget {
  id: string;               // learner_errors.id
  code: string | null;
  right_text: string;       // cấu trúc đúng cần người học tự dùng lại
  elicit_hint: string;      // gợi ý câu hỏi để gợi ra cấu trúc
}
export interface Turn { role: "examiner" | "learner"; text: string }

export interface ExaminerContext {
  part: 1 | 2 | 3 | "free";
  /** Thi thử đủ 3 part: giám khảo chuyển part như phòng thi khi `part` đổi. */
  mock?: boolean;
  topic: string;
  mode: "practice" | "exam";
  correctionLevel: "light" | "medium" | "strict";
  estimatedBand: number;
  /** Band người học muốn đạt (5.0–9.0). Không có hồ sơ thì lấy band hiện tại + 1. */
  targetBand?: number;
  history: Turn[];                    // vài lượt gần nhất (đã cắt)
  learnerText: string;                // câu vừa nói (từ STT)
  activeTarget: RecallTarget | null;  // lỗi đã gài ở câu hỏi trước
  dueTargets: RecallTarget[];         // lỗi đến hạn có thể gài ở câu hỏi tiếp theo
  codes: ErrorCodeLite[];
}

const MOCK_NOTE =
  "This is a full mock test. If the previous examiner turn belonged to an earlier part, open the new part exactly like the real test (Part 2: give a cue card with 3-4 bullet points and ask them to talk for 1-2 minutes; Part 3: say you will now discuss more general questions related to Part 2).";

const round = (x: number) => Math.floor(x * 2 + 0.5) / 2;

/** Band của câu nâng cấp: cao hơn hiện tại khoảng 1 band, không vượt mục tiêu, tối đa 9.0. */
export function upgradeBand(estimated: number, target?: number): number {
  const t = target ?? estimated + 1;
  return Math.min(9, round(Math.min(Math.max(t, estimated + 0.5), estimated + 1)));
}

/** Mục tiêu càng cao, giám khảo càng soi kỹ: band 8+ không chấp nhận lỗi nhỏ lặp lại hay từ thiếu tự nhiên. */
function strictnessNote(target: number): string {
  if (target >= 8.5)
    return "The learner aims for band " + target.toFixed(1) + ": flag even small slips (articles, prepositions, word endings), unnatural collocations and flat intonation. Ask demanding, abstract follow-ups.";
  if (target >= 7.5)
    return "The learner aims for band " + target.toFixed(1) + ": also flag repeated small slips and words that are correct but not natural. Ask follow-ups that need opinions, comparisons and reasons.";
  return "The learner aims for band " + target.toFixed(1) + ": focus on mistakes that block communication or repeat often; ignore tiny slips.";
}

const MAX_ERRORS: Record<ExaminerContext["correctionLevel"], number> = { light: 1, medium: 2, strict: 3 };

export function buildExaminerMessages(ctx: ExaminerContext): { role: "system" | "user"; content: string }[] {
  const codeList = ctx.codes.map((c) => `${c.code}[${c.category}] ${c.title}`).join("\n");
  const due = ctx.dueTargets
    .map((t) => `- id=${t.id} | target: "${t.right_text}" | how to elicit: ${t.elicit_hint}`)
    .join("\n") || "(none)";
  const active = ctx.activeTarget
    ? `Your previous question was designed to elicit: "${ctx.activeTarget.right_text}" (id=${ctx.activeTarget.id}). Judge whether the learner's answer used this structure correctly.`
    : "No recall target was set for the previous question.";

  const target = Math.min(9, Math.max(ctx.targetBand ?? ctx.estimatedBand + 1, ctx.estimatedBand));
  const up = upgradeBand(ctx.estimatedBand, ctx.targetBand);
  const system = `You are Emma, a friendly but professional IELTS Speaking examiner. Learner level ≈ band ${ctx.estimatedBand}. ${strictnessNote(target)}
Part: ${ctx.part}. Topic: ${ctx.topic}. Mode: ${ctx.mode}.${ctx.mock ? ` ${MOCK_NOTE}` : ""}

Each turn you must:
1. Ask the NEXT question, like a real examiner (one question, max 25 words, natural follow-up to what the learner said). Part 3: more abstract, ask "why"/compare.
2. Hidden recall: if a due target fits, phrase your next question so the learner naturally NEEDS that structure. Never mention the structure, never hint, never correct in the question itself. Pick at most one target.
3. ${active}
4. Find at most ${MAX_ERRORS[ctx.correctionLevel]} of the learner's most important mistakes in their last answer. Prefer a code from the list when it matches; else code=null.
5. Explanations in Vietnamese, short (max 25 words), comparing with how Vietnamese speakers think.

Error codes:
${codeList}

Due recall targets:
${due}

Reply with ONLY this JSON, no markdown:
{"reply":"<your next question>","target_id":"<id from due list or null>","recall":"correct|wrong|not_attempted|none","errors":[{"code":"VN-07 or null","cat":"GRA|LR|P|FC","wrong":"<learner's exact words>","right":"<corrected words>","upgrade":"<the learner's whole sentence rewritten at band ${up.toFixed(1)}, keeping their idea>","vi":"<Vietnamese explanation>"}],"hint_vi":"<one short Vietnamese tip for the next answer, or empty>"}`;

  const convo = ctx.history.map((t) => `${t.role === "examiner" ? "Examiner" : "Learner"}: ${t.text}`).join("\n");
  const user = `${convo ? convo + "\n" : ""}Learner: ${ctx.learnerText}`;
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

export interface ParsedError {
  code: string | null; category: Category; wrong: string; right: string; band7: string | null; explain_vi: string | null;
}
export interface ExaminerOutput {
  reply: string;
  targetId: string | null;
  recall: "correct" | "wrong" | "not_attempted" | "none";
  errors: ParsedError[];
  hintVi: string;
}

const CATS = new Set(["GRA", "LR", "P", "FC"]);
const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

/** Kiểm tra JSON từ model nhỏ: không tin tuyệt đối, lọc mọi trường. */
export function parseExaminerOutput(
  raw: string, opts: { dueIds: string[]; knownCodes: string[]; maxErrors: number; hadActiveTarget: boolean },
): ExaminerOutput {
  let j: Record<string, unknown>;
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    j = JSON.parse(m ? m[0] : raw);
  } catch {
    // model trả về chữ thường: dùng làm câu hỏi, bỏ chấm lỗi
    return { reply: clip(raw, 300) || "Could you tell me more about that?", targetId: null, recall: "none", errors: [], hintVi: "" };
  }
  const known = new Set(opts.knownCodes);
  const errors: ParsedError[] = (Array.isArray(j.errors) ? j.errors : [])
    .map((e: Record<string, unknown>) => {
      const code = typeof e.code === "string" && known.has(e.code) ? e.code : null;
      const cat = typeof e.cat === "string" && CATS.has(e.cat) ? (e.cat as Category) : null;
      const wrong = clip(e.wrong, 200), right = clip(e.right, 200);
      if (!cat || !wrong || !right || wrong.toLowerCase() === right.toLowerCase()) return null;
      return { code, category: cat, wrong, right, band7: clip(e.upgrade ?? e.band7, 300) || null, explain_vi: clip(e.vi, 200) || null };
    })
    .filter((e): e is ParsedError => e !== null)
    .slice(0, opts.maxErrors);

  const targetId = typeof j.target_id === "string" && opts.dueIds.includes(j.target_id) ? j.target_id : null;
  const recallRaw = String(j.recall ?? "none");
  const recall = opts.hadActiveTarget && ["correct", "wrong", "not_attempted"].includes(recallRaw)
    ? (recallRaw as ExaminerOutput["recall"]) : "none";

  return {
    reply: clip(j.reply, 300) || "Could you tell me more about that?",
    targetId, recall, errors, hintVi: clip(j.hint_vi, 200),
  };
}

export const maxErrorsFor = (lvl: ExaminerContext["correctionLevel"]) => MAX_ERRORS[lvl];
