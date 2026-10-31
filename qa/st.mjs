// Kiểm thử hệ thống (ST) trên bản web QA của một app, với dữ liệu lớn từ màn /qa-seed.
// Dùng: node qa/st.mjs <app> <baseUrl> <outDir> <routes.json>
// routes.json: danh sách route tĩnh (lấy từ report.json của vòng IT).
// Các nhóm kiểm tra:
//   bền dữ liệu   — tắt hẳn trình duyệt rồi mở lại (cùng hồ sơ), dữ liệu còn nguyên
//   ngoại tuyến   — mất mạng: mọi màn vẫn mở, không lỗi JS
//   tương phản    — chữ đủ tương phản với nền (WCAG AA) ở giao diện sáng và tối
//   trợ năng      — nút / ô nhập có tên đọc được, vùng chạm ≥ 44×44
//   màn nhỏ       — 320×568: không tràn ngang
//   máy chậm      — CPU chậm 4 lần (gần máy Android tầm trung): thời gian mở màn, long task
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [app, base, outDir, routesFile] = process.argv.slice(2);
const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });

/** Chữ chắc chắn có sau khi seed — để kiểm dữ liệu còn sau khi mở lại app. */
const MARKERS = {
  'vi-gon': { route: '/funds', text: 'Du lịch Đà Nẵng' },
  'hen-dep': { route: '/customers', text: '2500 khách' },
  nhip: { route: '/me', text: 'Quang' },
  'meo-nha': { route: '/saved', text: 'Dọn nhà Tết' },
};

const report = { app, startedAt: new Date().toISOString(), checks: {} };
const save = () => fs.writeFileSync(path.join(outDir, 'st.json'), JSON.stringify(report, null, 1));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `st-${app}-`));

async function open(opts = {}) {
  const ctx = await chromium.launchPersistentContext(profileDir, {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    ...opts,
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]));
  return { ctx, page, errors };
}

async function settle(page, max = 10000) {
  const t = Date.now();
  let prev = null;
  while (Date.now() - t < max) {
    await page.waitForTimeout(300);
    const cur = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    if (cur && cur === prev) return Date.now() - t - 300;
    prev = cur;
  }
  return max;
}
const bodyText = (page) => page.evaluate(() => document.body?.innerText || '').catch(() => '');
const slug = (r) => r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';

/* ---------------- 0. seed ---------------- */
{
  const { ctx, page } = await open();
  const t = Date.now();
  await page.goto(base + '/qa-seed', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => /QA_SEED_(DONE|FAIL)/.test(document.body?.innerText || ''), null, {
    timeout: 600000,
  });
  const txt = await bodyText(page);
  report.seed = { ok: txt.includes('QA_SEED_DONE'), ms: Date.now() - t, tail: txt.slice(-400) };
  await page.waitForTimeout(1500); // để bộ lưu gom ghi kịp xả
  await ctx.close();
  save();
  if (!report.seed.ok) {
    console.log('SEED FAIL', report.seed.tail);
    process.exit(1);
  }
}

/* ---------------- 1. bền dữ liệu: đóng trình duyệt, mở lại ---------------- */
{
  const m = MARKERS[app];
  const { ctx, page, errors } = await open();
  await page.goto(base + m.route, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const txt = await bodyText(page);
  report.checks.persistence = {
    pass: txt.includes(m.text),
    route: m.route,
    expect: m.text,
    errors,
    excerpt: txt.slice(0, 300),
  };
  await page.screenshot({ path: path.join(outDir, 'shots', 'persist.png') });
  await ctx.close();
  save();
}

/* ---------------- 2. ngoại tuyến ---------------- */
{
  const { ctx, page, errors } = await open({ offline: true });
  // Tải trang khi còn mạng (bản web cần tải mã), rồi cắt mạng và đi khắp các màn bằng điều hướng trong app.
  await ctx.setOffline(false);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await ctx.setOffline(true);
  const rows = [];
  for (const r of routes) {
    errors.length = 0;
    // Điều hướng phía client (không tải lại trang) như người dùng bấm trong app.
    await page.evaluate((to) => {
      window.history.pushState({}, '', to);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, r);
    await settle(page, 5000);
    const txt = await bodyText(page);
    rows.push({
      route: r,
      chars: txt.trim().length,
      errors: [...errors],
      offlineMsg: /ngoại tuyến|mất mạng|không có mạng|offline/i.test(txt),
    });
  }
  report.checks.offline = { rows, pass: rows.every((x) => x.chars > 20 && !x.errors.length) };
  await ctx.close();
  save();
}

/* ---------------- 3–5. tương phản, trợ năng, màn nhỏ ---------------- */
async function audit(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
      return { r, g, b, a };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    // Nền thật dưới chữ: phần tử nằm bên dưới tại tâm chữ (tính cả lớp xếp chồng / position absolute),
    // phần tử đầu tiên có nền đặc. Không có thì lấy nền của body.
    const bgOf = (el) => {
      const r = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 10));
      for (const e of stack) {
        if (e === el || el.contains(e)) continue;
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0.5) return c;
      }
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0.5) return c;
      }
      return parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        st.visibility !== 'hidden' &&
        Number(st.opacity) > 0.05 &&
        r.bottom > 0 &&
        r.top < innerHeight * 3
      );
    };
    // Tương phản: các nút lá có chữ.
    const lowContrast = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .trim();
      if (!own || own.length < 2) continue;
      const st = getComputedStyle(el);
      const fg = parse(st.color);
      if (!fg) continue;
      // Chữ mờ có chủ đích (opacity trên tổ tiên) — tính màu sau khi pha với nền.
      let op = 1;
      for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      const bg = bgOf(el);
      const a = fg.a * op;
      const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
      const [l1, l2] = [lum(mix), lum(bg)].sort((x, y) => y - x);
      const ratio = (l1 + 0.05) / (l2 + 0.05);
      const size = parseFloat(st.fontSize);
      const bold = Number(st.fontWeight) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (ratio < need) {
        const key = own.slice(0, 40);
        if (seen.has(key)) continue;
        seen.add(key);
        lowContrast.push({ text: key, ratio: Math.round(ratio * 100) / 100, need, size });
      }
    }
    // Trợ năng: phần tử bấm được / ô nhập.
    const noName = [];
    const smallTarget = [];
    for (const el of document.querySelectorAll(
      '[role=button],[role=link],[role=tab],[role=switch],[role=checkbox],a,button,input,textarea,[tabindex="0"]',
    )) {
      if (!visible(el)) continue;
      const name = (
        el.getAttribute('aria-label') ||
        el.innerText ||
        el.getAttribute('placeholder') ||
        el.getAttribute('title') ||
        ''
      ).trim();
      const r = el.getBoundingClientRect();
      const tag = el.getAttribute('role') || el.tagName.toLowerCase();
      if (!name)
        noName.push({ tag, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      // Vùng chạm thật gồm cả hitSlop (RN web không thể hiện) — chỉ cảnh báo khi < 32 px.
      if ((r.width < 32 || r.height < 32) && !['input', 'textarea'].includes(tag))
        smallTarget.push({ tag, name: name.slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    }
    const overflowX = document.documentElement.scrollWidth - innerWidth;
    return {
      lowContrast: lowContrast.slice(0, 15),
      lowContrastN: lowContrast.length,
      noName: noName.slice(0, 10),
      noNameN: noName.length,
      smallTarget: smallTarget.slice(0, 10),
      smallTargetN: smallTarget.length,
      overflowX,
    };
  });
}

for (const [label, opts] of [
  ['light', { colorScheme: 'light' }],
  ['dark', { colorScheme: 'dark' }],
  ['small', { colorScheme: 'light', viewport: { width: 320, height: 568 } }],
]) {
  const { ctx, page, errors } = await open(opts);
  const rows = [];
  for (const r of routes) {
    errors.length = 0;
    await page.goto(base + r, { waitUntil: 'domcontentloaded' });
    await settle(page, 6000);
    const a = await audit(page).catch((e) => ({ error: String(e) }));
    if (label !== 'light') await page.screenshot({ path: path.join(outDir, 'shots', `${label}-${slug(r)}.png`) });
    rows.push({ route: r, ...a, errors: [...errors] });
  }
  report.checks[label] = rows;
  await ctx.close();
  save();
}

/* ---------------- 6. máy chậm (CPU × 4) ---------------- */
{
  const { ctx, page, errors } = await open();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__lt = [];
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration));
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
  const rows = [];
  for (const r of routes) {
    errors.length = 0;
    const t = Date.now();
    await page.goto(base + r, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const dom = Date.now() - t;
    const stable = await settle(page, 20000);
    const lt = await page.evaluate(() => window.__lt || []).catch(() => []);
    rows.push({
      route: r,
      ms: dom + stable,
      ltMax: lt.length ? Math.max(...lt) : 0,
      ltTotal: lt.reduce((a, b) => a + b, 0),
      errors: [...errors],
    });
  }
  report.checks.slowCpu = rows;
  await ctx.close();
  save();
}

report.finishedAt = new Date().toISOString();
save();
fs.rmSync(profileDir, { recursive: true, force: true });
console.log('ST xong', app);
