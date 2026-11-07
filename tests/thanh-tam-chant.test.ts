// Thành Tâm: tụng kinh theo nghi lễ. Dữ liệu kinh, nghi thức theo lễ, bộ đếm nhịp mõ, chuông.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KINH,
  NGHI_THUC,
  RITUAL_CHANT,
  chantLines,
  chantMinutes,
  chantPlan,
  kinhById,
  listenUrl,
  nghiThucById,
  syllables,
  totalBeats,
} from '../apps/thanh-tam/src/data/kinh';
import { BELL_GAP, gotoLine, gotoStep, nextLine, startPos, tick } from '../apps/thanh-tam/src/lib/chant';
import { RITUALS } from '../apps/thanh-tam/src/data/rituals';

const NO_CHANT = ['than-tai-hang-ngay', 'mung-10-than-tai', 'ong-cong-ong-tao'];

test('mỗi lễ có nghi thức tụng phù hợp, hoặc được ghi rõ là không tụng', () => {
  for (const r of RITUALS) {
    if (NO_CHANT.includes(r.id)) assert.equal(RITUAL_CHANT[r.id], undefined, r.id);
    else assert.ok(nghiThucById(RITUAL_CHANT[r.id]), `lễ ${r.id} chưa có nghi thức tụng`);
  }
  for (const id of Object.keys(RITUAL_CHANT))
    assert.ok(
      RITUALS.some((r) => r.id === id),
      `RITUAL_CHANT có lễ lạ ${id}`,
    );
  // Giỗ, Thanh minh: cầu siêu; Vu Lan có kinh Vu Lan; Rằm, mùng 1: cầu an.
  assert.equal(RITUAL_CHANT['gio-thuong'], 'cau-sieu');
  assert.equal(RITUAL_CHANT['thanh-minh'], 'cau-sieu');
  assert.equal(RITUAL_CHANT['mung-1-ram'], 'cau-an');
  assert.ok(nghiThucById('vu-lan')!.short.some((s) => s.kinh === 'vu-lan'));
  assert.ok(nghiThucById('cau-sieu')!.full.some((s) => s.kinh === 'a-di-da'));
  assert.ok(nghiThucById('cau-an')!.full.some((s) => s.kinh === 'pho-mon'));
});

test('nghi thức khác nhau tụng bộ kinh khác nhau', () => {
  const sig = (id: string) =>
    nghiThucById(id)!
      .full.map((s) => s.kinh)
      .join(',');
  assert.notEqual(sig('cau-an'), sig('cau-sieu'));
  assert.notEqual(sig('cau-sieu'), sig('vu-lan'));
  assert.ok(!nghiThucById('cau-an')!.full.some((s) => s.kinh === 'vang-sanh'), 'cầu an không tụng Vãng sanh');
});

test('chữ kinh: đủ bài, không đoạn rỗng, đúng mở đầu và kết thúc', () => {
  assert.equal(KINH.length, 13);
  for (const k of KINH) {
    assert.ok(k.paras.length > 0, `${k.id} rỗng`);
    for (const p of k.paras) {
      assert.ok(p.l.length > 0, `${k.id}: đoạn không có dòng`);
      for (const l of p.l) {
        assert.ok(syllables(l) > 0, `${k.id}: dòng rỗng`);
        assert.ok(!/[<>{}]|&[a-z]+;/.test(l), `${k.id}: còn thẻ HTML "${l}"`);
      }
    }
  }
  const first = (id: string) => kinhById(id)!.paras[0].l[0];
  const last = (id: string) => kinhById(id)!.paras.at(-1)!.l.at(-1)!;
  assert.match(first('bat-nha'), /^Quán Tự Tại Bồ tát/);
  assert.match(last('bat-nha'), /bồ-đề tát bà ha/);
  assert.match(first('dai-bi'), /^Nam mô Đại bi Hội thượng/);
  assert.match(first('khai-kinh'), /^Vô thượng thậm thâm vi diệu pháp/);
  assert.match(first('vu-lan'), /^Văn như thị/);
  assert.match(last('hoi-huong'), /Giai cộng thành Phật đạo/);
  assert.equal(kinhById('tam-quy-y')!.paras.length, 4);
  assert.match(kinhById('vang-sanh')!.paras[0].l.join(' '), /Nam mô a di đa bà dạ.*ta bà ha\.$/);
  assert.equal(kinhById('pho-mon')!.paras.filter((p) => !p.l.join('').trim()).length, 0);
  // Có bản dịch cho kệ khai kinh, Phổ Môn
  assert.ok(kinhById('khai-kinh')!.paras.every((p) => p.vi?.length));
  assert.ok(kinhById('pho-mon')!.paras.some((p) => p.vi?.length));
});

test('thời lượng ước tính: bản gọn ngắn hơn bản đầy đủ, nhịp nhanh thì ngắn hơn', () => {
  for (const n of NGHI_THUC) {
    const s = chantMinutes(n.short, 96);
    const f = chantMinutes(n.full, 96);
    assert.ok(s >= 3 && s <= 25, `${n.id} gọn ${s} phút`);
    assert.ok(f > s, `${n.id} đầy đủ ${f} ≤ gọn ${s}`);
    assert.ok(chantMinutes(n.full, 160) < f);
  }
});

test('bộ đếm nhịp: đi hết nghi thức, đúng số mõ, đúng số chuông, lặp đúng số lần', () => {
  const plan = chantPlan('cau-an', false)!;
  const lines = chantLines(plan.steps);
  let p = startPos();
  let mo = 0;
  let bells = 0;
  let guard = 0;
  const reps = new Map<number, number>();
  while (!p.done && guard++ < 1e6) {
    const r = tick(p, lines);
    if (r.mo) mo++;
    if (r.bell) bells++;
    p = r.pos;
    if (!p.done) reps.set(lines[p.idx].step, Math.max(reps.get(lines[p.idx].step) ?? 0, p.rep));
  }
  assert.ok(p.done);
  assert.equal(mo, totalBeats(plan.steps));
  assert.equal(bells, plan.steps.length, 'chuông giữa mỗi bài và khi xong');
  const qa = plan.steps.findIndex((s) => s.kinh === 'niem-quan-am');
  assert.equal(reps.get(qa), 10);
  // Sau chuông nghỉ BELL_GAP nhịp không gõ mõ
  assert.equal(startPos().gap, BELL_GAP);
});

test('bộ đếm nhịp: nhảy bài, chạm dòng, câu chỉ một chữ', () => {
  const lines = chantLines(chantPlan('cau-sieu', true)!.steps);
  const s3 = gotoStep(lines, 3);
  assert.equal(lines[s3.idx].step, 3);
  assert.equal(s3.rep, 1);
  const mid = { ...s3, rep: 2, gap: 0 };
  assert.equal(gotoLine(mid, lines, s3.idx + 1).rep, lines[s3.idx + 1].step === 3 ? 2 : 1);
  assert.equal(gotoLine(mid, lines, 0).rep, 1);
  // Dòng cuối: hết buổi, thỉnh chuông
  const end = nextLine({ idx: lines.length - 1, rep: 1, beat: 0, gap: 0, done: false }, lines);
  assert.ok(end.pos.done && end.bell);
  // Không có dòng nào: kết thúc ngay, không văng lỗi
  assert.ok(tick(startPos(), []).pos.done);
  // Bài lẻ: niệm danh hiệu 108 lần
  const one = chantPlan('niem-a-di-da', false)!;
  assert.equal(one.single, true);
  assert.equal(one.steps[0].times, 108);
  assert.equal(chantPlan('khong-co', false), null);
});

test('nghe tụng mẫu: mở tìm kiếm YouTube, không nhúng tệp âm thanh của ai', () => {
  const u = listenUrl('Kinh A Di Đà');
  assert.match(u, /^https:\/\/www\.youtube\.com\/results\?search_query=/);
  assert.ok(decodeURIComponent(u).includes('Kinh A Di Đà'));
});

test('dữ liệu lớn: chạy hết nghi thức dài nhất (108 lần niệm) thật nhanh', () => {
  const t0 = performance.now();
  let total = 0;
  for (const n of NGHI_THUC) {
    const lines = chantLines(n.full);
    let p = startPos();
    while (!p.done) {
      p = tick(p, lines).pos;
      total++;
    }
  }
  const ms = performance.now() - t0;
  assert.ok(total > 5000, `${total} nhịp`);
  assert.ok(ms < 1500, `${ms} ms`);
});
