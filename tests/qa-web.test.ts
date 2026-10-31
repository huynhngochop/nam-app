// Test cho các lỗi tìm thấy khi bấm thử tự động trên bản web (W3, N1, N2). Mỗi test ghi mã lỗi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redirectFor } from '../apps/hen-dep/src/access';
import { classifySession } from '../apps/nhip/src/recovery';
import type { Session } from '../apps/nhip/src/store';

/* ---------------- W3 · Hẹn Đẹp: phân quyền theo route ---------------- */
test('W3: nhân viên không vào được màn của chủ tiệm, kể cả bằng đường dẫn', () => {
  for (const seg of [
    ['(tabs)', 'revenue'],
    ['(tabs)', 'shop'],
    ['settings'],
    ['billing'],
    ['campaign'],
    ['staff'],
    ['link'],
  ])
    assert.equal(redirectFor(seg, 'staff'), '/(tabs)/calendar', seg.join('/'));
});
test('W3: nhân viên vẫn vào được Lịch, Khách, lịch hẹn, hồ sơ khách', () => {
  for (const seg of [
    ['(tabs)', 'calendar'],
    ['(tabs)', 'customers'],
    ['booking', '[id]'],
    ['booking', 'new'],
    ['customer', '[id]'],
  ])
    assert.equal(redirectFor(seg, 'staff'), null, seg.join('/'));
});
test('W3: chủ tiệm vào được mọi màn; chưa đăng nhập thì về màn đăng nhập', () => {
  assert.equal(redirectFor(['(tabs)', 'revenue'], 'owner'), null);
  assert.equal(redirectFor(['settings'], 'owner'), null);
  assert.equal(redirectFor(['(tabs)', 'revenue'], null), '/auth');
  assert.equal(redirectFor(['auth'], null), null);
  assert.equal(redirectFor([], null), null); // "/" tự chuyển hướng trong index.tsx
});

/* ---------------- N1, N2 · Nhịp: khôi phục phiên ---------------- */
const now = 1_800_000_000_000;
const sess = (p: Partial<Session>): Session => ({
  id: 's',
  phase: 'focus',
  mode: 'pomodoro',
  plannedSec: 1500,
  startedAt: now - 600_000,
  endAt: now + 900_000,
  pausedAccumSec: 0,
  cycleIndex: 0,
  lastHeartbeatAt: now - 5_000,
  status: 'running',
  ...p,
});
test('N1: phiên đã qua giờ kết thúc được tính là hoàn thành, kể cả khi app bị tắt', () => {
  assert.equal(classifySession(sess({ endAt: now - 1000, lastHeartbeatAt: now - 3_600_000 }), now, true), 'expired');
  assert.equal(classifySession(sess({ endAt: now - 1000 }), now, false), 'expired');
});
test('N2: bấm Back khỏi màn phiên không bật hộp "phiên dở"; chỉ hỏi ở lần mở đầu sau khi app khởi động', () => {
  const s = sess({ lastHeartbeatAt: now - 300_000 });
  assert.equal(classifySession(s, now, false), 'active');
  assert.equal(classifySession(s, now, true), 'stale');
});
test('N2: phiên tạm dừng hoặc đếm lên không bao giờ bị coi là hết giờ', () => {
  assert.equal(
    classifySession(sess({ status: 'paused', endAt: now - 1000, pausedRemainingSec: 300 }), now, false),
    'active',
  );
  assert.equal(classifySession(sess({ mode: 'countup', endAt: now - 1000 }), now, false), 'active');
  assert.equal(classifySession(null, now, true), 'none');
});
