import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudItemToFaq, cloudFaqs } from '../apps/thanh-tam/src/lib/cloudFaq';
import { addCloudFaqs, ask } from '../apps/thanh-tam/src/lib/ask';

const item = {
  id: '7a7a7a7a-0000-4000-8000-000000000001',
  kind: 'faq',
  topic: 'Hỏi đáp',
  title: 'Có nên thắp hương khi đang có tang?',
  tags: ['tang', 'thắp hương'],
  updated_at: '2026-11-28T00:00:00Z',
  body: {
    question: 'Nhà đang có tang có được thắp hương bàn thờ Phật không?',
    alt: ['đang để tang thắp nhang được không', 'có tang có cúng được không'],
    summary: 'Theo quan niệm dân gian, nhà có tang vẫn thắp hương gia tiên; nhiều nơi tạm không cúng lễ lớn.',
    sections: [{ heading: 'Khác nhau theo vùng', text: 'Mỗi nhà một nếp, nhiều nơi kiêng cúng lễ vui trong năm có tang.' }],
    notes: ['Nhà có lệ riêng thì theo lệ nhà mình.'],
  },
};

test('cloud faq: câu trả lời → câu hỏi đáp, có cách hỏi khác và đoạn trả lời', () => {
  const f = cloudItemToFaq(item)!;
  assert.equal(f.id, 'c-7a7a7a7a-0000-4000-8000-000000000001');
  assert.equal(f.q, item.body.question);
  assert.ok(f.alt.includes('đang để tang thắp nhang được không'));
  assert.equal(f.a[0], item.body.summary);
  assert.match(f.a[1], /^Khác nhau theo vùng: /);
  assert.match(f.kw, /tang/);
});

test('cloud faq: thiếu tóm tắt thì bỏ qua', () => {
  assert.equal(cloudItemToFaq({ ...item, body: { ...item.body, summary: '' } }), null);
  assert.equal(cloudFaqs([item, { ...item, id: '' }]).length, 1);
});

test('Hỏi Thành Tâm trả lời được câu mới sau khi gộp câu hỏi đáp từ máy chủ', () => {
  const ctx = { today: new Date(2026, 10, 28), anniversaries: [] };
  addCloudFaqs(cloudFaqs([item]));
  const a = ask('đang để tang có thắp nhang được không', ctx);
  assert.equal(a.kind, 'faq');
  assert.equal(a.faq?.id, 'c-7a7a7a7a-0000-4000-8000-000000000001');
  // gộp lại lần nữa (bản cập nhật) không nhân đôi
  addCloudFaqs(cloudFaqs([item]));
  assert.equal(ask('đang để tang có thắp nhang được không', ctx).faq?.id, a.faq?.id);
});
