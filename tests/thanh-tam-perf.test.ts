// Thành Tâm: giữ các quy tắc dung lượng, hiệu năng và điều hướng đã chốt trong apps/thanh-tam/CLAUDE.md.
// Mỗi ca ứng với một lỗi đã gặp: bản cài 97 MB, nút "Quay lại" không phản hồi khi mở màn từ thông báo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..');
const TT = path.join(ROOT, 'apps/thanh-tam');

function files(dir: string, ext = /\.(ts|tsx)$/): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'android' || e.name === 'ios') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p, ext));
    else if (ext.test(e.name)) out.push(p);
  }
  return out;
}
const SRC = [...files(path.join(TT, 'app')), ...files(path.join(TT, 'src')), ...files(path.join(ROOT, 'packages'))];
const rel = (p: string) => path.relative(ROOT, p);

test('biểu tượng và phông nhập theo đường dẫn con (không kéo cả gói vào bản cài)', () => {
  for (const f of SRC) {
    const s = fs.readFileSync(f, 'utf8');
    assert.ok(!/from '@expo\/vector-icons'/.test(s), `${rel(f)}: nhập '@expo/vector-icons/<Bộ>' thay vì gốc gói`);
    assert.ok(
      !/from '@expo-google-fonts\/[a-z-]+'/.test(s),
      `${rel(f)}: nhập '@expo-google-fonts/<gói>/<độ đậm>' thay vì gốc gói`,
    );
  }
});

test('không dùng router.back() trực tiếp: màn mở từ thông báo không có màn trước', () => {
  for (const f of SRC.filter((x) => x.startsWith(TT))) {
    if (f.endsWith(path.join('src', 'nav.ts'))) continue;
    const s = fs.readFileSync(f, 'utf8');
    assert.ok(!s.includes('router.back()'), `${rel(f)}: dùng goBack() từ src/nav.ts`);
  }
});

test('mọi màn đều có đường ra: nút Quay lại, Đóng, hoặc là màn gốc', () => {
  const ROOTS = new Set(['(tabs)/today', '(tabs)/rituals', '(tabs)/calendar', '(tabs)/explore', 'index', 'onboarding/tradition', 'ritual/[id]/index']);
  for (const f of files(path.join(TT, 'app')).filter((x) => !/_layout\.tsx$/.test(x))) {
    const route = path.relative(path.join(TT, 'app'), f).replace(/\.tsx$/, '');
    const s = fs.readFileSync(f, 'utf8');
    if (ROOTS.has(route) || route === 'qa-seed') continue;
    assert.ok(
      /goBack|accessibilityLabel="Đóng"|label="Quay lại"/.test(s),
      `${route}: thiếu nút Quay lại hoặc Đóng`,
    );
  }
});

test('Thành Tâm không kèm thư viện chỉ dùng khi phát triển, có bật thu gọn mã bản phát hành', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(TT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies['expo-dev-client'], undefined, 'expo-dev-client kéo theo máy quét mã QR (≈5 MB mỗi kiểu chip)');
  const app = JSON.parse(fs.readFileSync(path.join(TT, 'app.json'), 'utf8'));
  const bp = app.expo.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-build-properties');
  assert.ok(bp, 'thiếu expo-build-properties');
  assert.equal(bp[1].android.enableMinifyInReleaseBuilds, true);
  assert.equal(bp[1].android.enableShrinkResourcesInReleaseBuilds, true);
});

test('tài nguyên đóng gói nhỏ: mỗi tệp dưới 300 KB, tổng dưới 1 MB', () => {
  const list = files(path.join(TT, 'assets'), /./);
  let total = 0;
  for (const f of list) {
    const n = fs.statSync(f).size;
    total += n;
    assert.ok(n < 300 * 1024, `${rel(f)}: ${Math.round(n / 1024)} KB`);
  }
  assert.ok(total < 1024 * 1024, `assets tổng ${Math.round(total / 1024)} KB`);
});
