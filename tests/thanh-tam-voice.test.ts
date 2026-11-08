// Thành Tâm: giọng đọc mẫu (câu khớp chữ trên màn), chọn giọng máy tiếng Việt, đường dẫn video YouTube.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KINH, NGHI_THUC, chantLines, kinhById, nghiThucById } from '../apps/thanh-tam/src/data/kinh';
import { PRAYERS } from '../apps/thanh-tam/src/data/prayers';
import { buildPrayer } from '../apps/thanh-tam/src/lib/prayer';
import { cueAt, hashCues, khanCues, kinhCues, voiceItems } from '../apps/thanh-tam/src/lib/voiceCues';
import { pickViVoice } from '../apps/thanh-tam/src/lib/voicePick';
import { VIDEOS, youtubeId } from '../apps/thanh-tam/src/data/videos';
import { YT_BLOCKED_CODES, nextPlayable } from '../apps/thanh-tam/src/lib/videoFallback';

test('giọng mẫu kinh: mỗi câu ứng đúng một dòng trên màn tụng, cùng thứ tự', () => {
  for (const k of KINH) {
    const lines = chantLines([{ kinh: k.id }]);
    const cues = kinhCues(k.id);
    assert.equal(cues.length, lines.length, k.id);
    cues.forEach((c, i) => {
      assert.equal(c.text, lines[i].text, `${k.id} câu ${i}`);
      assert.equal(c.p, i);
    });
  }
});

test('giọng mẫu văn khấn: câu thuộc đúng đoạn, chỗ tên/địa chỉ là khoảng lặng, đoạn lặp đọc đủ lần', () => {
  for (const p of PRAYERS) {
    const paras = buildPrayer(p.body, {});
    const cues = khanCues(p.id);
    assert.ok(cues.length > 0, p.id);
    for (const c of cues) {
      assert.ok(c.p >= 0 && c.p < paras.length, `${p.id}: đoạn ${c.p}`);
      assert.ok(!!c.text !== !!c.field, `${p.id}: câu vừa có chữ vừa là ô điền`);
      if (c.text) assert.match(c.text, /\p{L}/u);
    }
    // mọi đoạn đều được đọc
    assert.deepEqual(
      [...new Set(cues.map((c) => c.p))].sort((a, b) => a - b),
      paras.map((_, i) => i),
      p.id,
    );
    paras.forEach((para, i) => {
      if (para.repeat) {
        const n = cues.filter((c) => c.p === i).length;
        const once = para.segments.filter((s) => s.field || /\p{L}/u.test(s.text)).length;
        assert.equal(n, once * para.repeat, `${p.id} đoạn ${i} lặp ${para.repeat}`);
      }
    });
  }
  const tinChu = khanCues('gia-tien-thuong').filter((c) => c.field === 'tinChu');
  assert.ok(tinChu.length >= 1);
});

test('mã băm: đổi chữ thì đổi mã, giữ nguyên thì giữ mã; đủ 23 bài', () => {
  const items = voiceItems();
  assert.equal(items.length, KINH.length + PRAYERS.length);
  assert.equal(new Set(items.map((x) => x.id)).size, items.length);
  const a = kinhCues('bat-nha');
  assert.equal(hashCues(a, 1.15), hashCues(kinhCues('bat-nha'), 1.15));
  assert.notEqual(hashCues(a, 1.15), hashCues(a, 1.0));
  const b = a.map((c, i) => (i === 3 ? { ...c, text: `${c.text}.` } : c));
  assert.notEqual(hashCues(a, 1.15), hashCues(b, 1.15));
  assert.match(hashCues(a, 1), /^[0-9a-f]{8}$/);
});

test('tìm câu đang đọc theo mốc thời gian', () => {
  const starts = [0, 1000, 2500, 4000];
  assert.equal(cueAt(starts, -5), -1);
  assert.equal(cueAt(starts, 0), 0);
  assert.equal(cueAt(starts, 999), 0);
  assert.equal(cueAt(starts, 1000), 1);
  assert.equal(cueAt(starts, 3999), 2);
  assert.equal(cueAt(starts, 99999), 3);
  assert.equal(cueAt([], 10), -1);
});

test('chọn giọng máy tiếng Việt: ưu tiên giọng trên máy, nhận cả vi_VN và vi-VN; không có thì báo không có', () => {
  assert.equal(pickViVoice([{ identifier: 'en-us-x', language: 'en-US' }]), undefined);
  const v = pickViVoice([
    { identifier: 'vi-vn-x-gft-network', language: 'vi-VN' },
    { identifier: 'vi-vn-x-gft-local', language: 'vi_VN' },
    { identifier: 'en', language: 'en-US' },
  ]);
  assert.equal(v?.identifier, 'vi-vn-x-gft-local');
  assert.equal(
    pickViVoice([{ identifier: 'com.apple.voice.compact.vi-VN.Linh', language: 'vi-VN' }])?.identifier,
    'com.apple.voice.compact.vi-VN.Linh',
  );
});

test('video: đọc đúng mã từ mọi kiểu đường dẫn YouTube; khóa video là nghi thức hoặc bài có thật', () => {
  const id = 'dfovLYA4jhI';
  const urls = [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?index=17&list=RD&v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://m.youtube.com/watch?v=${id}&t=30s`,
  ];
  for (const u of urls) {
    assert.equal(youtubeId(u), id, u);
  }
  assert.equal(youtubeId('https://example.com/video'), null);
  assert.equal(youtubeId('xin chào'), null);
  for (const [k, list] of Object.entries(VIDEOS)) {
    assert.ok(nghiThucById(k) || kinhById(k), `khóa lạ: ${k}`);
    for (const v of list) assert.match(v.id, /^[\w-]{11}$/, `${k}: ${v.id}`);
  }
  for (const n of NGHI_THUC) assert.ok(VIDEOS[n.id]?.length, `nghi thức ${n.id} chưa có video`);
});

test('video trong app: mỗi mục 2–3 bản khác nhau; lỗi thì chuyển bản kế; không cho rời sang trang YouTube', () => {
  for (const [k, list] of Object.entries(VIDEOS)) {
    assert.ok(list.length >= 2 && list.length <= 3, `${k}: ${list.length} bản`);
    assert.equal(new Set(list.map((v) => v.id)).size, list.length, `${k}: trùng bản`);
  }
  const O = 'https://huynhngochop.github.io';
  // khung chính: chỉ trang trình phát
  assert.equal(nextPlayable.allowNavigation(O, true, O), true);
  assert.equal(nextPlayable.allowNavigation('about:blank', true, O), true);
  assert.equal(nextPlayable.allowNavigation('https://www.youtube.com/watch?v=dfovLYA4jhI', true, O), false);
  assert.equal(nextPlayable.allowNavigation('https://m.youtube.com/channel/x', true, O), false);
  assert.equal(nextPlayable.allowNavigation('https://accounts.google.com/', true, O), false);
  assert.equal(nextPlayable.allowNavigation('https://huynhngochop.github.io.evil.com/', true, O), false);
  // khung con (iframe trình phát) tải bình thường
  assert.equal(nextPlayable.allowNavigation('https://www.youtube-nocookie.com/embed/x', false, O), true);
  // chuyển bản: vòng quanh, bỏ bản đã thử, hết thì -1
  assert.equal(nextPlayable.next(3, 0, new Set([0])), 1);
  assert.equal(nextPlayable.next(3, 2, new Set([2])), 0);
  assert.equal(nextPlayable.next(3, 1, new Set([0, 1])), 2);
  assert.equal(nextPlayable.next(3, 2, new Set([0, 1, 2])), -1);
  for (const c of [101, 150, 152, 153, 100]) assert.ok(YT_BLOCKED_CODES.includes(c));
});
