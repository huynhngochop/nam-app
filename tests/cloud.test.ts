import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudItemToTip, cloudTips } from '../apps/meo-nha/src/lib/cloudTip';
import { CATEGORIES, validateTips } from '../apps/meo-nha/src/data/tips';

const item = (over: Record<string, unknown> = {}) => ({
  id: '0f1e2d3c-0000-4000-8000-000000000001',
  kind: 'faq',
  topic: 'Hỏi đáp',
  title: 'Tẩy ố vàng thớt nhựa bằng baking soda',
  tags: ['thớt', 'bếp'],
  updated_at: '2026-11-28T00:00:00Z',
  body: {
    question: 'Thớt nhựa bị ố vàng làm sao?',
    alt: ['thớt nhựa vàng tẩy kiểu gì'],
    summary: 'Baking soda và chanh làm mờ vết ố trên thớt nhựa sau vài lần.',
    steps: ['Rắc baking soda lên thớt.', 'Vắt chanh lên, chà đều.', 'Để 10 phút rồi rửa sạch.'],
    warnings: [],
    category: 'kitchen',
    ...over,
  },
});

test('cloud tip: câu trả lời câu hỏi → mẹo hợp lệ, tìm được bằng câu hỏi gốc', () => {
  const t = cloudItemToTip(item())!;
  assert.equal(t.id, 'c-0f1e2d3c-0000-4000-8000-000000000001');
  assert.equal(t.categoryId, 'kitchen');
  assert.ok(CATEGORIES.find((c) => c.id === 'kitchen')!.subs.includes(t.sub!));
  assert.match(t.keywords, /thot nhua/);
  assert.deepEqual(validateTips([t]), []);
});

test('cloud tip: chủ đề AI → đúng danh mục và nhóm con', () => {
  const t = cloudItemToTip({ ...item({ category: undefined }), kind: 'tip', topic: 'Giặt giũ & quần áo' })!;
  assert.equal(t.categoryId, 'laundry');
  assert.equal(t.sub, 'Vết bẩn');
});

test('cloud tip: thiếu bước / tóm tắt thì bỏ qua, không làm hỏng app', () => {
  assert.equal(cloudItemToTip(item({ steps: ['một bước'] })), null);
  assert.equal(cloudItemToTip(item({ summary: '' })), null);
  assert.equal(cloudTips([item(), item({ steps: [] })]).length, 1);
});

test('cloud tip: cảnh báo an toàn được giữ', () => {
  const t = cloudItemToTip(item({ warnings: ['Đeo găng tay khi dùng nước tẩy.'] }))!;
  assert.deepEqual(t.safety, ['Đeo găng tay khi dùng nước tẩy.']);
});
