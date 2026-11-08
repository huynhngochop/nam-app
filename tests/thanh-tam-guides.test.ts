/* Hướng dẫn có hình, lễ mới, văn khấn mới: quét toàn bộ dữ liệu. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RITUALS } from '../apps/thanh-tam/src/data/rituals';
import { PRAYERS, prayerById } from '../apps/thanh-tam/src/data/prayers';
import { GUIDES, guideById } from '../apps/thanh-tam/src/data/guides';
import { RITUAL_CHANT, nghiThucById } from '../apps/thanh-tam/src/data/kinh';
import { fieldsUsed } from '../apps/thanh-tam/src/lib/prayer';
import { search } from '../apps/thanh-tam/src/lib/search';
import { planNotifications } from '../apps/thanh-tam/src/lib/schedule';
import { voiceItems } from '../apps/thanh-tam/src/lib/voiceCues';

const FIG_SRC = fs.readFileSync(path.join(__dirname, '../apps/thanh-tam/src/figures.tsx'), 'utf8');

test('đủ các lễ phổ biến trong năm và trong đời', () => {
  const need = [
    'mung-1-ram',
    'tat-nien',
    'giao-thua',
    'mung-1-tet',
    'hoa-vang',
    'ram-thang-gieng',
    'han-thuc',
    'thanh-minh',
    'phat-dan',
    'doan-ngo',
    'vu-lan',
    'cung-chung-sinh',
    'trung-thu',
    'ram-thang-muoi',
    'ong-cong-ong-tao',
    'bao-sai',
    'ta-dat',
    'gio-thuong',
    'tuan-49-100',
    'nhap-trach',
    'dong-tho',
    'an-vi-bat-huong',
    'day-thang',
    'thoi-noi',
    'khai-truong',
    'than-tai-hang-ngay',
    'mung-10-than-tai',
    'xe-moi',
    'le-chua',
  ];
  for (const id of need)
    assert.ok(
      RITUALS.some((r) => r.id === id),
      id,
    );
  assert.equal(new Set(RITUALS.map((r) => r.id)).size, RITUALS.length, 'mã lễ trùng');
  assert.equal(new Set(PRAYERS.map((p) => p.id)).size, PRAYERS.length, 'mã văn khấn trùng');
  // Mỗi nhóm có ít nhất một lễ (nhóm "Lễ chùa, đền" trước đây trống).
  for (const g of ['hang-thang', 'tet-le', 'gia-tien', 'nha-cua', 'con-tre', 'lam-an', 'di-le'])
    assert.ok(
      RITUALS.some((r) => r.group === g),
      g,
    );
});

test('mọi lễ: có văn khấn, có hướng dẫn có hình, bước nào trỏ hướng dẫn thì hướng dẫn có thật', () => {
  for (const r of RITUALS) {
    assert.ok(r.prayers.length && r.prayers.every((p) => prayerById(p)), r.id);
    assert.ok(r.guides.length && r.guides.every((g) => guideById(g)), `${r.id}: guides`);
    for (const s of [...r.steps, ...r.afterSteps]) if (s.guide) assert.ok(guideById(s.guide), `${r.id}: ${s.guide}`);
    // Bước hiện theo tên: tên trùng làm lặp khóa trong danh sách.
    assert.equal(new Set(r.steps.map((s) => s.title)).size, r.steps.length, `${r.id}: tên bước trùng`);
    assert.equal(new Set(r.afterSteps.map((s) => s.title)).size, r.afterSteps.length, `${r.id}: bước sau trùng`);
    // Có thắp hương thì có bước vái hoặc lạy, ghi rõ số lần.
    if (r.steps.some((s) => /thắp hương/i.test(s.title)))
      assert.ok(
        r.steps.some((s) => /\d (lạy|vái)/.test(s.text)),
        `${r.id}: thiếu số lạy`,
      );
    // Lễ cần tên người mất, tên bé thì văn khấn có ô đó.
    for (const need of r.needs ?? [])
      assert.ok(
        r.prayers.some((p) => fieldsUsed(prayerById(p)!.body).includes(need)),
        `${r.id}: văn khấn thiếu ô ${need}`,
      );
    const chant = RITUAL_CHANT[r.id];
    if (chant) assert.ok(nghiThucById(chant), `${r.id} → ${chant}`);
  }
});

test('lễ giỗ, Tết có ba tuần rượu; ban Phật không dâng rượu, đồ mặn', () => {
  for (const id of ['gio-thuong', 'tat-nien']) {
    const r = RITUALS.find((x) => x.id === id)!;
    assert.ok(r.steps.filter((s) => /tuần rượu/i.test(s.title)).length === 2, id);
  }
  for (const id of ['phat-dan', 'le-chua']) {
    const r = RITUALS.find((x) => x.id === id)!;
    const all = [...(r.offerings.chung ?? []), ...r.offerings.gianDi].map((o) => o.name.toLowerCase()).join(' ');
    assert.ok(!/rượu|gà|thịt|heo/.test(all), id);
  }
});

test('hướng dẫn: hình có thật, chú thích khớp số trên hình', () => {
  // Số chú thích phải bằng số nhãn vẽ trên hình (đếm từ mã hình).
  const COUNT: Record<string, number> = {
    'ban-tho': 7,
    'mam-bac': 10,
    'mam-nam': 7,
    'mam-chay': 5,
    vai: 3,
    lay: 4,
    'ba-tuan': 3,
    'cham-tra': 3,
    'thap-huong': 3,
    'nhieu-ban-tho': 4,
  };
  const used = new Set<string>();
  for (const g of GUIDES) {
    assert.ok(g.sources.length, g.id);
    for (const s of g.sections) {
      assert.ok(s.p.length || s.legend?.length, `${g.id}/${s.h}`);
      if (!s.fig) continue;
      used.add(s.fig);
      assert.ok(FIG_SRC.includes(`'${s.fig}'`) || FIG_SRC.includes(`${s.fig}:`), s.fig);
      assert.equal(s.legend?.length, COUNT[s.fig], `${g.id}: ${s.fig}`);
      assert.ok(s.figLabel, `${g.id}: ${s.fig} thiếu tên hình (đọc cho người khiếm thị)`);
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(COUNT).sort());
});

test('tìm kiếm ra lễ mới và hướng dẫn', () => {
  assert.equal(search('mấy lạy')[0].href, '/guide/vai-lay');
  assert.ok(search('rót rượu').some((r) => r.href === '/guide/tra-ruou'));
  assert.ok(search('tat nien').some((r) => r.id === 'tat-nien'));
  assert.ok(search('49 ngày').some((r) => r.id === 'tuan-49-100'));
  assert.ok(search('cô hồn').some((r) => r.id === 'cung-chung-sinh'));
  assert.ok(search('đi chùa').some((r) => r.id === 'le-chua'));
});

test('nhắc lễ: hai lễ cùng ngày chỉ nhắc một lần', () => {
  // 30 Tết Bính Ngọ: 2027-02-05. Tất niên và giao thừa cùng ngày.
  const plan = planNotifications(
    new Date(2027, 0, 25, 9),
    { mung1Ram: false, eveBefore: false, mung10: false, festivals: true, time: '06:30' },
    RITUALS,
    [],
    30,
  );
  const days = plan.map((p) => p.at.toDateString());
  assert.equal(new Set(days).size, days.length);
});

test('giọng mẫu: văn khấn mới tự có trong danh sách tạo giọng', () => {
  const ids = new Set(voiceItems().map((v) => v.id));
  for (const p of PRAYERS)
    assert.ok(
      [...ids].some((x) => x.endsWith(p.id)),
      p.id,
    );
});
