// Thành Tâm: Hỏi Thành Tâm trả lời trên máy. Câu hỏi thường gặp, lịch, ngày giỗ trong sổ, câu chưa có trả lời.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ask, matchFaq, ASK_THRESHOLD } from '../apps/thanh-tam/src/lib/ask';
import { FAQ, FAQ_SUGGEST } from '../apps/thanh-tam/src/data/faq';
import { RITUALS } from '../apps/thanh-tam/src/data/rituals';
import { SIGNS, TIPS } from '../apps/thanh-tam/src/data/signs';
import { kinhById, nghiThucById } from '../apps/thanh-tam/src/data/kinh';
import { lunarOf } from '../apps/thanh-tam/src/calendar/lunar';
import type { Anniversary } from '../apps/thanh-tam/src/lib/schedule';

const today = new Date(2026, 10, 8); // 8/11/2026
const ctx = { today, anniversaries: [] as Anniversary[] };
const top = (q: string) => {
  const a = ask(q, ctx);
  return a.kind === 'faq' ? a.faq!.id : a.kind;
};

test('hỏi theo nhiều cách, có dấu hoặc không dấu, ra đúng câu trả lời', () => {
  const cases: [string, string][] = [
    ['thắp mấy nén hương', 'so-nen-huong'],
    ['thap bao nhieu nen nhang', 'so-nen-huong'],
    ['Khi nào thì hạ lễ được?', 'ha-le'],
    ['cúng giỗ làm trước một ngày được không', 'gio-ngay-nao'],
    ['giỗ ngày 30 mà tháng thiếu thì sao', 'thang-thieu'],
    ['mất tháng nhuận giỗ thế nào', 'thang-nhuan'],
    ['cúng rằm mấy giờ', 'ram-gio-nao'],
    ['rằm cúng chay hay mặn', 'chay-man'],
    ['nhang cháy lệch có sao không', 'huong-lech'],
    ['bát hương bị cháy phải làm gì', 'chan-huong-chay'],
    ['ngày giỗ thì tụng kinh gì', 'tung-gio'],
    ['đốt vàng mã có nên không', 'vang-ma'],
    ['dâng sao giải hạn', 'sao-han'],
    ['đổi điện thoại mới có mất sổ giỗ', 'doi-may'],
    ['gửi sổ giỗ qua zalo cho anh em', 'gui-so-gio'],
    ['bấm đọc mà không có tiếng', 'khong-co-tieng'],
    ['không thấy thông báo nhắc rằm', 'khong-thong-bao'],
    ['ong tao cung ngay nao', 'ong-tao'],
    ['nằm mơ thấy bà nội đã mất', 'mo-nguoi-mat'],
    ['chuyển nhà mới cúng gì', 'nha-moi'],
  ];
  const wrong = cases.filter(([q, id]) => top(q) !== id).map(([q, id]) => `${q} → ${top(q)} (cần ${id})`);
  assert.deepEqual(wrong, []);
});

test('câu ngoài phạm vi: nói thật là chưa có, không trả lời bừa', () => {
  for (const q of ['giá vàng hôm nay', 'cách nấu phở bò', 'xyz', '']) {
    assert.equal(ask(q, ctx).kind, 'chua-co', q);
  }
  const m = matchFaq('giá vàng hôm nay')[0];
  assert.ok(!m || m.score < ASK_THRESHOLD);
});

test('hỏi lịch: hôm nay âm lịch, rằm tới, mùng 1 tới tính đúng', () => {
  const a = ask('hôm nay là ngày bao nhiêu âm', ctx);
  assert.equal(a.kind, 'lich');
  const l = lunarOf(today);
  assert.ok(a.title.startsWith(`Hôm nay là ngày ${l.day} tháng`), a.title);
  const r = ask('rằm tháng này ngày nào', ctx);
  assert.equal(r.kind, 'lich');
  assert.match(r.title, /^Rằm tới: /);
  const m = ask('mùng 1 tới là khi nào', ctx);
  assert.equal(m.kind, 'lich');
  assert.match(m.title, /^Mùng 1 tới: /);
  // "rằm tháng Giêng" là lễ cụ thể, không phải rằm tới
  assert.notEqual(ask('rằm tháng giêng cúng gì', ctx).title.slice(0, 7), 'Rằm tới');
});

test('hỏi ngày giỗ trong sổ theo tên hoặc quan hệ', () => {
  const gio: Anniversary = {
    id: 'a',
    name: 'Nguyễn Văn Ba',
    relation: 'Ông nội',
    lunar: { day: 12, month: 3, leap: false },
    missingDayRule: 'ngay-cuoi-thang',
    remindDays: [7],
  };
  const c = { today, anniversaries: [gio] };
  for (const q of ['giỗ ông nội ngày nào', 'gio ong Ba khi nao', 'ngày giỗ ông nội năm nay']) {
    const a = ask(q, c);
    assert.equal(a.kind, 'gio', q);
    assert.match(a.text[0], /Ông nội Nguyễn Văn Ba: .*\d+\/\d+\/20\d\d/);
  }
  assert.notEqual(ask('giỗ bà ngoại ngày nào', c).kind, 'gio');
});

test('mọi đường dẫn trong câu trả lời mở được màn có thật', () => {
  const APP = path.join(__dirname, '../apps/thanh-tam/app');
  const exists = (href: string) => {
    const p = href.split('?')[0];
    const [, a, b] = p.split('/');
    if (a === 'ritual') return !!RITUALS.find((r) => r.id === b);
    if (a === 'sign') return !!SIGNS.find((s) => s.id === b);
    if (a === 'tip') return !!TIPS.find((t) => t.id === b);
    if (a === 'chant' && b) return !!(nghiThucById(b) || kinhById(b));
    const file = ['', '.tsx', '/index.tsx'].map((x) => path.join(APP, p + x));
    const tab = path.join(APP, '(tabs)', `${a}.tsx`);
    return file.some((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || fs.existsSync(tab);
  };
  for (const f of FAQ) for (const l of f.links) assert.ok(exists(l.href), `${f.id}: ${l.href}`);
  for (const id of FAQ_SUGGEST) assert.ok(FAQ.some((f) => f.id === id), id);
  assert.equal(new Set(FAQ.map((f) => f.id)).size, FAQ.length, 'mã câu hỏi trùng');
});

test('mỗi câu hỏi thường gặp tự tìm được chính nó', () => {
  const miss = FAQ.filter((f) => top(f.q) !== f.id).map((f) => `${f.q} → ${top(f.q)}`);
  assert.deepEqual(miss, []);
});

test('nhanh: 1.000 câu hỏi dưới 1 giây', () => {
  const qs = FAQ.flatMap((f) => [f.q, ...f.alt]);
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) ask(qs[i % qs.length], ctx);
  const ms = performance.now() - t0;
  assert.ok(ms < 1000, `${ms} ms`);
});
