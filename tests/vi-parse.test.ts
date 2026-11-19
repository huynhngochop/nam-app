import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorize, cleanMerchant, parseBankText } from '../apps/vi-gon/src/parse';

const now = new Date(2026, 9, 29, 13, 0, 0);

test('dạng TK *1234 −85.000 VND lúc 12:31', () => {
  const parsed = parseBankText('TK *1234 −85.000 VND lúc 12:31. ND: COM TAM BA GHIEN', now)!;
  assert.equal(parsed.amount, 85000);
  assert.equal(parsed.kind, 'expense');
  assert.equal(parsed.account, '1234');
  assert.equal(new Date(parsed.at!).getHours(), 12);
  assert.equal(parsed.merchant, 'Com tam ba ghien');
});

test('dạng có số dư SD không nhầm với số tiền', () => {
  const parsed = parseBankText('TK 1234xxx5678 -85,000VND 12:31 29/10/26 SD: 1,234,000VND ND: COM TAM BA GHIEN', now)!;
  assert.equal(parsed.amount, 85000);
  assert.equal(parsed.balance, 1234000);
  assert.equal(parsed.account, '5678');
  assert.equal(new Date(parsed.at!).getDate(), 29);
});

test('thu nhập dấu +', () => {
  const parsed = parseBankText('TK 0011 +18,500,000 VND luc 09:00 28/10. ND: LUONG THANG 10', now)!;
  assert.equal(parsed.kind, 'income');
  assert.equal(parsed.amount, 18500000);
  assert.equal(categorize(parsed.merchant, parsed.kind, []).categoryId, 'salary');
});

test('GD: -1,250,000VND (dạng lạ vẫn ra số tiền)', () => {
  const parsed = parseBankText('GD: -1,250,000VND 28/10 21:14 SD: 5,000,000 REF FT2430112233', now)!;
  assert.equal(parsed.amount, 1250000);
  assert.equal(parsed.kind, 'expense');
});

test('không có số tiền → null', () => {
  assert.equal(parseBankText('Ma OTP cua ban la 123456', now), null);
  assert.equal(parseBankText('Khuyen mai cuoi tuan!', now), null);
});

test('thời gian tương lai bị kẹp về hiện tại', () => {
  const parsed = parseBankText('TK *1234 -50.000 VND 23:59 30/12. ND: CAFE', now)!;
  assert.ok(parsed.at! <= now.getTime());
});

test('dọn nội dung', () => {
  assert.equal(cleanMerchant('MBVCB.1234567.CA PHE HIGHLANDS.CT tu 0011 toi 999'), 'Ca phe highlands');
});

test('phân loại: quy tắc người dùng thắng', () => {
  assert.equal(categorize('Grab car', 'expense', []).categoryId, 'move');
  assert.equal(categorize('Highlands coffee', 'expense', []).categoryId, 'food');
  assert.deepEqual(categorize('Com tam ba ghien', 'expense', [{ id: '1', keyword: 'COM TAM', categoryId: 'family' }]), {
    categoryId: 'family',
    confident: true,
  });
  assert.equal(categorize('Xyz', 'expense', []).categoryId, 'other');
  assert.equal(categorize('Luong', 'expense', []).categoryId, 'other');
});
