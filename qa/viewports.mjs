// Kiểm thử hệ thống (ST) bản web ở nhiều cỡ màn: điện thoại nhỏ → máy gập (gập/mở, dọc/ngang) → tablet → màn lớn.
// Mỗi màn × mỗi cỡ: chụp ảnh, đếm lỗi JS, tràn ngang, phần tử ra ngoài màn, vùng chạm quá nhỏ, màn trắng.
// Dùng: node qa/viewports.mjs <routes.json> <baseUrl> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [routesFile, base, outDir] = process.argv.slice(2);
const ROUTES = Object.entries(JSON.parse(fs.readFileSync(routesFile, 'utf8'))).filter(([k]) => k !== '_');
fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });

// Kích thước theo dp/CSS px của máy thật.
export const PROFILES = [
  ['phone-320', 320, 568, 'Điện thoại rất nhỏ (iPhone SE 1, Android cũ)'],
  ['android-360', 360, 780, 'Android phổ thông 360dp'],
  ['iphone-se', 375, 667, 'iPhone SE'],
  ['iphone-16', 393, 852, 'iPhone 16'],
  ['pixel-8', 412, 915, 'Pixel 8 / Galaxy S'],
  ['iphone-pro-max', 440, 956, 'iPhone 16 Pro Max'],
  ['phone-land', 852, 393, 'Điện thoại xoay ngang'],
  ['fold-cover', 344, 882, 'Galaxy Z Fold khi gập (màn ngoài)'],
  ['flip', 360, 880, 'Galaxy Z Flip mở'],
  ['fold-open', 690, 829, 'Galaxy Z Fold mở, dọc'],
  ['fold-open-land', 829, 690, 'Galaxy Z Fold mở, ngang'],
  ['pixel-fold-land', 900, 700, 'Pixel Fold mở, ngang'],
  ['ipad-mini', 744, 1133, 'iPad mini dọc'],
  ['ipad', 820, 1180, 'iPad dọc'],
  ['ipad-land', 1180, 820, 'iPad ngang'],
  ['ipad-split', 507, 820, 'iPad chia đôi màn hình'],
  ['android-tab', 800, 1280, 'Tablet Android dọc'],
  ['android-tab-land', 1280, 800, 'Tablet Android ngang'],
  ['ipad-pro-13-land', 1376, 1032, 'iPad Pro 13 ngang'],
  ['desktop', 1920, 1080, 'Màn lớn (Chromebook, máy tính)'],
];
const ONLY = process.env.QA_PROFILES ? new Set(process.env.QA_PROFILES.split(',')) : null;

const browser = await chromium.launch();
const report = { startedAt: new Date().toISOString(), seed: null, results: [] };
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    colorScheme: scheme,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  let errs = [];
  page.on('pageerror', (e) => errs.push(String(e?.message || e).slice(0, 400)));
  page.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text().slice(0, 300)));

  // Dữ liệu thật vừa phải (?small) để ảnh giống người dùng thường.
  await page.goto(base + '/qa-seed?small=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page
    .waitForFunction(() => /QA_SEED_(DONE|FAIL)/.test(document.body?.innerText || ''), null, { timeout: 180000 })
    .catch(() => {});
  if (scheme === 'light') report.seed = (await page.evaluate(() => document.body.innerText)).slice(-600);
  errs = [];

  const profiles = PROFILES.filter(([id]) => !ONLY || ONLY.has(id)).filter(
    // Nền tối: chỉ chụp 3 cỡ đại diện.
    ([id]) => scheme === 'light' || ['iphone-16', 'fold-open', 'ipad-land'].includes(id),
  );
  for (const [pid, w, h, label] of profiles) {
    await page.setViewportSize({ width: w, height: h });
    for (const [key, route] of ROUTES) {
      errs = [];
      const t0 = Date.now();
      await page
        .goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
        .catch((e) => errs.push(String(e)));
      // chờ nội dung ổn định
      let prev = '';
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(250);
        const cur = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
        if (cur && cur === prev) break;
        prev = cur;
      }
      const loadMs = Date.now() - t0;
      const m = await page.evaluate(() => {
        const W = innerWidth;
        const scrollsX = (el) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return true;
          }
          return false;
        };
        const vis = (e) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
        };
        const outside = [];
        for (const e of document.querySelectorAll('body *')) {
          if (!e.children.length && vis(e)) {
            const r = e.getBoundingClientRect();
            if ((r.right > W + 1 || r.left < -1) && !scrollsX(e))
              outside.push(
                `${(e.innerText || e.getAttribute('aria-label') || e.tagName).slice(0, 40)} [${Math.round(r.left)}–${Math.round(r.right)}]`,
              );
          }
        }
        const small = [];
        for (const e of document.querySelectorAll(
          '[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],input,button,a[href]',
        )) {
          if (!vis(e)) continue;
          const r = e.getBoundingClientRect();
          if (r.width < 32 || r.height < 32)
            small.push(
              `${(e.getAttribute('aria-label') || e.innerText || e.tagName).slice(0, 30)} ${Math.round(r.width)}×${Math.round(r.height)}`,
            );
        }
        // chữ bị chồng lên nhau: hai khối chữ lá giao nhau đáng kể
        // Chỉ tính phần thực sự nhìn thấy: cắt theo khung cuộn/khung ẩn của tổ tiên và theo màn hình.
        // Bỏ chữ rỗng, ký tự biểu tượng (vùng Private Use của phông icon) và đoạn inline nằm trong cùng câu.
        const clipRect = (e) => {
          const r = e.getBoundingClientRect();
          let x1 = Math.max(r.left, 0);
          let y1 = Math.max(r.top, 0);
          let x2 = Math.min(r.right, innerWidth);
          let y2 = Math.min(r.bottom, innerHeight);
          for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
              const q = p.getBoundingClientRect();
              x1 = Math.max(x1, q.left);
              y1 = Math.max(y1, q.top);
              x2 = Math.min(x2, q.right);
              y2 = Math.min(y2, q.bottom);
            }
          }
          return x2 - x1 > 2 && y2 - y1 > 2 ? { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 } : null;
        };
        const realText = (s) => s.replace(/[-\s]/g, '');
        const leaves = [...document.querySelectorAll('body *')]
          .filter(
            (e) =>
              !e.children.length &&
              realText(e.innerText || '') &&
              vis(e) &&
              getComputedStyle(e).display !== 'inline' &&
              !e.closest('[aria-hidden="true"]'),
          )
          .slice(0, 500)
          .map((e) => ({ t: e.innerText.trim().slice(0, 30), r: clipRect(e) }))
          .filter((x) => x.r);
        const overlaps = [];
        for (let i = 0; i < leaves.length && overlaps.length < 5; i++)
          for (let j = i + 1; j < leaves.length && overlaps.length < 5; j++) {
            const a = leaves[i].r;
            const b = leaves[j].r;
            const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ix > 6 && iy > 6 && ix * iy > 0.3 * Math.min(a.width * a.height, b.width * b.height))
              overlaps.push(`"${leaves[i].t}" ⟂ "${leaves[j].t}"`);
          }
        return {
          url: location.pathname,
          scrollW: document.documentElement.scrollWidth,
          W,
          textLen: (document.body.innerText || '').trim().length,
          outside: outside.slice(0, 6),
          outsideN: outside.length,
          small: small.slice(0, 6),
          smallN: small.length,
          overlaps,
        };
      });
      const file = `shots/${scheme}-${pid}-${key}.jpg`;
      await page.screenshot({ path: path.join(outDir, file), type: 'jpeg', quality: 60 }).catch(() => {});
      const issues = [];
      if (errs.length) issues.push(`lỗi JS: ${errs[0]}`);
      if (m.scrollW > m.W + 1) issues.push(`tràn ngang ${m.scrollW - m.W}px`);
      if (m.outsideN) issues.push(`${m.outsideN} phần tử ra ngoài màn: ${m.outside.join('; ')}`);
      if (m.textLen < 15) issues.push('màn trắng');
      if (m.overlaps.length) issues.push(`chữ chồng nhau: ${m.overlaps.join('; ')}`);
      report.results.push({
        scheme,
        profile: pid,
        label,
        w,
        h,
        key,
        route,
        landed: m.url,
        loadMs,
        file,
        errors: errs,
        ...m,
        issues,
      });
      console.log(`${scheme} ${pid} ${key}: ${issues.length ? issues.join(' | ') : 'ok'} (${loadMs} ms)`);
    }
  }
  await ctx.close();
}
await browser.close();
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));

// Tóm tắt + trang xem ảnh
const bad = report.results.filter((r) => r.issues.length);
const lines = [
  `# Nhiều cỡ màn: ${report.results.length} lượt chụp, ${bad.length} có vấn đề`,
  `seed: ${report.seed?.split('\n').pop()}`,
  '',
  ...bad.map((r) => `- ${r.scheme} · ${r.profile} (${r.w}×${r.h}) · ${r.key}: ${r.issues.join(' | ')}`),
  '',
  '## Vùng chạm < 32px (theo màn, cỡ iphone-16)',
  ...report.results
    .filter((r) => r.profile === 'iphone-16' && r.scheme === 'light' && r.smallN)
    .map((r) => `- ${r.key}: ${r.smallN} (${r.small.join('; ')})`),
];
fs.writeFileSync(path.join(outDir, 'summary.md'), lines.join('\n') + '\n');
const byProfile = {};
for (const r of report.results) (byProfile[`${r.scheme} · ${r.profile} · ${r.label} (${r.w}×${r.h})`] ||= []).push(r);
fs.writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><meta charset=utf-8><title>Thành Tâm · cỡ màn</title><style>body{font:14px system-ui;margin:16px}h2{margin-top:32px}.g{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:220px}img{width:100%;border:1px solid #ccc}figcaption{font-size:12px}.bad{color:#b42318}</style>` +
    Object.entries(byProfile)
      .map(
        ([k, rs]) =>
          `<h2>${k}</h2><div class=g>${rs.map((r) => `<figure><a href="${r.file}"><img loading=lazy src="${r.file}"></a><figcaption>${r.key}${r.issues.length ? `<div class=bad>${r.issues.join('<br>')}</div>` : ''}</figcaption></figure>`).join('')}</div>`,
      )
      .join(''),
);
console.log(lines.join('\n'));
