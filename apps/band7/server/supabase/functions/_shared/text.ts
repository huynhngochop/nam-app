// So khớp câu nói lại ở bước "Sửa ngay" — chạy thuần, không cần gọi AI (tiết kiệm quota).

const CONTRACTIONS: Record<string, string> = {
  "it's": "it is", "that's": "that is", "i'm": "i am", "i've": "i have", "i'd": "i would",
  "i'll": "i will", "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "can't": "cannot", "won't": "will not", "isn't": "is not", "aren't": "are not",
  "there's": "there is", "they're": "they are", "we're": "we are", "you're": "you are",
  "he's": "he is", "she's": "she is", "hasn't": "has not", "haven't": "have not",
};

export function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\/[^/]*\//g, " ") // bỏ phiên âm /θɪŋk/
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] ?? w).split(" "));
}

/** Levenshtein theo từ, trả về [khoảng cách, các từ đúng bị thiếu/sai] */
function wordDistance(said: string[], target: string[]): { dist: number; missed: string[] } {
  const n = said.length, m = target.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => {
    const row = new Array<number>(m + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = said[i - 1] === target[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  // truy vết để biết từ đích nào bị sai/thiếu
  const missed: string[] = [];
  let i = n, j = m;
  while (j > 0) {
    if (i > 0 && d[i][j] === d[i - 1][j - 1] + (said[i - 1] === target[j - 1] ? 0 : 1)) {
      if (said[i - 1] !== target[j - 1]) missed.unshift(target[j - 1]);
      i--; j--;
    } else if (d[i][j] === d[i][j - 1] + 1) {
      missed.unshift(target[j - 1]); j--;
    } else if (i > 0) {
      i--;
    } else {
      missed.unshift(target[j - 1]); j--;
    }
  }
  return { dist: d[n][m], missed };
}

export interface RepairCheck {
  ok: boolean;
  similarity: number;   // 0..1
  missed: string[];     // từ của câu đúng mà người học nói sai/thiếu
  keyHit: boolean;      // có nói đúng "cụm then chốt" (phần sửa) không
}

/**
 * Người học qua bước Sửa ngay khi: nói gần đúng toàn câu (≥ 0.8) VÀ nói đúng cụm then chốt.
 * keyPhrase = phần được sửa, ví dụ "has changed".
 */
export function checkRepair(said: string, target: string, keyPhrase?: string): RepairCheck {
  const s = normalize(said), t = normalize(target);
  if (t.length === 0) return { ok: false, similarity: 0, missed: [], keyHit: false };
  const { dist, missed } = wordDistance(s, t);
  const similarity = Math.max(0, 1 - dist / Math.max(t.length, s.length));
  const key = keyPhrase ? normalize(keyPhrase).join(" ") : "";
  const keyHit = key === "" || ` ${s.join(" ")} `.includes(` ${key} `);
  return { ok: similarity >= 0.8 && keyHit, similarity: Math.round(similarity * 100) / 100, missed, keyHit };
}

/** Tìm cụm then chốt: phần khác nhau giữa câu sai và câu đúng */
export function keyPhraseOf(wrong: string, right: string): string {
  const w = new Set(normalize(wrong));
  const r = normalize(right);
  const diff = r.filter((x) => !w.has(x));
  if (diff.length === 0) return "";
  // mở rộng thành cụm liền nhau trong câu đúng
  const first = r.indexOf(diff[0]);
  const last = r.lastIndexOf(diff[diff.length - 1]);
  return r.slice(first, last + 1).slice(0, 5).join(" ");
}
