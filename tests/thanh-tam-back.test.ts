/* Nút Quay lại Android: một lần về màn trước, ở màn chính hai lần liền nhau mới thoát. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideBack, EXIT_WINDOW_MS, isTabRoot } from '../apps/thanh-tam/src/lib/backPress';

test('còn màn trước thì quay lại, không nhắc, không thoát', () => {
  assert.equal(decideBack({ canGoBack: true, path: '/ritual/gio-thuong', now: 5000, lastWarn: 4900 }), 'nav');
  assert.equal(decideBack({ canGoBack: true, path: '/rituals', now: 5000, lastWarn: 0 }), 'nav');
});

test('màn chính: lần một nhắc, lần hai trong 2 giây thì thoát, quá 2 giây thì nhắc lại', () => {
  const base = { canGoBack: false, path: '/today' };
  assert.equal(decideBack({ ...base, now: 10_000, lastWarn: 0 }), 'warn');
  assert.equal(decideBack({ ...base, now: 10_800, lastWarn: 10_000 }), 'exit');
  assert.equal(decideBack({ ...base, now: 10_000 + EXIT_WINDOW_MS + 1, lastWarn: 10_000 }), 'warn');
});

test('màn lẻ mở từ thông báo (không có màn trước) thì về Hôm nay, không thoát', () => {
  assert.equal(decideBack({ canGoBack: false, path: '/ritual/tat-nien', now: 1, lastWarn: 0 }), 'home');
  assert.equal(decideBack({ canGoBack: false, path: '/guide/vai-lay', now: 1, lastWarn: 0 }), 'home');
});

test('nhận đúng màn chính', () => {
  for (const p of ['/', '/today', '/rituals', '/calendar', '/explore', '/(tabs)/today']) assert.ok(isTabRoot(p), p);
  for (const p of ['/me', '/ritual/x', '/settings']) assert.ok(!isTabRoot(p), p);
});
