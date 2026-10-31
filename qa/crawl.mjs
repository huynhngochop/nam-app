// Bộ QA tự động kiểu "người dùng bấm thử": đi qua mọi màn hình của một app (bản web), bấm từng nút,
// điền từng ô nhập, ghi lại kết quả (chuyển màn, chữ mới xuất hiện, đổi giao diện, lỗi JS) và chụp ảnh.
// Dùng: node qa/crawl.mjs <app> <baseUrl> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [app, base, outDir] = process.argv.slice(2);
const T0 = Date.now();
const BUDGET_MS = Number(process.env.QA_BUDGET_MIN || 75) * 60_000;
const MAX_CLICKS = Number(process.env.QA_MAX_CLICKS || 45);
fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });

/* ---------- route list từ cây thư mục app/ ---------- */
function listRoutes(dir, prefix = '') {
  const out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory())
      out.push(...listRoutes(path.join(dir, f.name), f.name.startsWith('(') ? prefix : `${prefix}/${f.name}`));
    else if (/\.tsx$/.test(f.name) && !f.name.startsWith('_')) {
      const n = f.name.replace(/\.tsx$/, '');
      out.push(n === 'index' ? prefix || '/' : `${prefix}/${n}`);
    }
  }
  return out;
}
const all = listRoutes(path.resolve('apps', app, 'app'));
const dynamicPatterns = all.filter((r) => r.includes('['));
const staticRoutes = all.filter((r) => !r.includes('[') && r !== '/qa-seed');
const SEEDED = process.env.QA_SEED === '1';
const isEntry = (r) => /^\/(onboarding|welcome|auth|setup)/.test(r) || r === '/';
const order = [...staticRoutes.filter((r) => !isEntry(r)), ...staticRoutes.filter((r) => isEntry(r))];
const patternOf = (p) => {
  if (staticRoutes.includes(p)) return p;
  for (const d of dynamicPatterns) {
    const re = new RegExp('^' + d.replace(/\[[^\]]+\]/g, '[^/]+') + '$');
    if (re.test(p)) return d;
  }
  return null;
};

/* ---------- tiện ích ---------- */
const DESTRUCTIVE =
  /xóa|xoá|đặt lại|làm lại từ đầu|đăng xuất|reset|delete|hủy lịch|huỷ lịch|xoá hết|khôi phục|restore/i;
const slug = (s) => (s || 'root').replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '_') || 'root';
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
const seenShots = new Set();
let shotN = 0;
const report = {
  app,
  startedAt: new Date().toISOString(),
  firstRun: [],
  routes: [],
  tablet: [],
  destructive: [],
  errorsGlobal: [],
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
});
// Ghi long task (tác vụ JS > 50 ms chặn luồng chính) cho từng lần tải trang.
await ctx.addInitScript(() => {
  window.__lt = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration));
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
});
const page = await ctx.newPage();
let sink = [];
page.on('pageerror', (e) => sink.push({ type: 'pageerror', text: String(e?.stack || e).slice(0, 900) }));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    sink.push({ type: 'console.' + m.type(), text: m.text().slice(0, 600) });
});
page.on('requestfailed', (r) =>
  sink.push({ type: 'requestfailed', text: `${r.url().slice(0, 200)} ${r.failure()?.errorText}` }),
);
page.on('dialog', async (d) => {
  sink.push({ type: 'dialog', text: `${d.type()}: ${d.message().slice(0, 300)}` });
  await d.accept().catch(() => {});
});
const drain = () => {
  const s = sink;
  sink = [];
  return s.filter((e) => !/Download the React DevTools|was preloaded using link preload/.test(e.text));
};

async function text() {
  return page.evaluate(() => document.body?.innerText || '').catch(() => '');
}
/** Chờ nội dung ổn định; trả về số ms tới lần cuối nội dung còn thay đổi. */
async function ready(max = 8000) {
  const t = Date.now();
  let prev = null;
  let changedAt = t;
  while (Date.now() - t < max) {
    await page.waitForTimeout(350);
    const cur = await text();
    if (cur && cur === prev) return changedAt - t;
    if (cur !== prev) changedAt = Date.now();
    prev = cur;
  }
  return max;
}
async function longTasks() {
  return page
    .evaluate(() => {
      const a = window.__lt || [];
      window.__lt = [];
      return { n: a.length, total: a.reduce((x, y) => x + y, 0), max: a.length ? Math.max(...a) : 0 };
    })
    .catch(() => ({ n: 0, total: 0, max: 0 }));
}
let lastLoad = { ms: 0, lt: { n: 0, total: 0, max: 0 } };
async function go(route, max = 12000) {
  const t0 = Date.now();
  await page
    .goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    .catch((e) => sink.push({ type: 'goto', text: String(e).slice(0, 300) }));
  const domMs = Date.now() - t0;
  const stable = await ready(max);
  lastLoad = { ms: domMs + stable, lt: await longTasks() };
  return lastLoad;
}
async function shot(name, full = false, type = 'png') {
  const buf = await page
    .screenshot({ fullPage: full, type, quality: type === 'jpeg' ? 55 : undefined })
    .catch(() => null);
  if (!buf) return null;
  const h = md5(buf);
  if (seenShots.has(h)) return { dup: h };
  seenShots.add(h);
  const file = `shots/${String(++shotN).padStart(4, '0')}-${name}.${type === 'jpeg' ? 'jpg' : 'png'}`;
  fs.writeFileSync(path.join(outDir, file), buf);
  return { file };
}
async function quickHash() {
  const b = await page.screenshot({ type: 'jpeg', quality: 30 }).catch(() => null);
  return b ? md5(b) : '';
}

async function candidates() {
  return page
    .evaluate(() => {
      const sel =
        '[role=button],[role=link],[role=tab],[role=switch],[role=checkbox],[role=radio],[role=menuitem],[role=slider],[role=adjustable],a[href],button,input,textarea,select,[tabindex="0"]';
      const vw = innerWidth * innerHeight;
      let els = [...document.querySelectorAll(sel)].filter((e) => {
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return (
          r.width > 2 &&
          r.height > 2 &&
          s.visibility !== 'hidden' &&
          s.display !== 'none' &&
          s.pointerEvents !== 'none' &&
          !e.closest('[aria-hidden="true"]')
        );
      });
      const set = new Set(els);
      // bỏ lớp phủ/khung lớn chứa các nút khác (scrim của sheet, thẻ bao ngoài cả màn)
      els = els.filter((e) => {
        const r = e.getBoundingClientRect();
        const big = r.width * r.height > 0.5 * vw;
        return !(big && [...e.querySelectorAll('*')].some((c) => set.has(c)));
      });
      document.querySelectorAll('[data-qa-i]').forEach((e) => e.removeAttribute('data-qa-i'));
      return els.map((e, i) => {
        e.setAttribute('data-qa-i', String(i));
        const r = e.getBoundingClientRect();
        const label = (
          e.getAttribute('aria-label') ||
          e.innerText ||
          e.getAttribute('placeholder') ||
          e.value ||
          e.getAttribute('href') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 90);
        return {
          i,
          tag: e.tagName.toLowerCase(),
          role: e.getAttribute('role') || '',
          label,
          disabled: e.getAttribute('aria-disabled') === 'true' || e.disabled === true,
          input:
            ['input', 'textarea'].includes(e.tagName.toLowerCase()) &&
            !['checkbox', 'radio'].includes((e.getAttribute('type') || '').toLowerCase()),
          inputmode: e.getAttribute('inputmode') || e.getAttribute('type') || '',
          placeholder: e.getAttribute('placeholder') || '',
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      });
    })
    .catch(() => []);
}

function sampleFor(c) {
  const p = (c.placeholder + ' ' + c.label).toLowerCase();
  if (/otp|mã/.test(p) && !/mã giảm/.test(p)) return '123456';
  if (/điện thoại|sđt|phone|09/.test(p) || c.inputmode === 'tel') return '0901234567';
  if (/mật khẩu|password/.test(p) || c.inputmode === 'password') return 'MatKhau123!';
  if (/tin nhắn|dán|sms|nội dung tin/.test(p))
    return 'TK 0123456789 -85,000VND luc 12:31 29/10/2026. SD: 1,234,000VND. ND: GRAB thanh toan';
  if (/bảng giá/.test(p)) return 'Cắt tóc nữ 150k\nGội đầu dưỡng sinh 80.000\nSơn gel 120k';
  if (/hỏi|câu hỏi/.test(p)) return 'Tháng này ăn uống hết bao nhiêu?';
  if (
    c.inputmode === 'numeric' ||
    c.inputmode === 'decimal' ||
    c.inputmode === 'number' ||
    /số tiền|giá|tiền|đ$|vnd|ngân sách|phút/.test(p)
  )
    return '150000';
  if (/email/.test(p)) return 'qa@example.com';
  if (/tìm/.test(p)) return 'trứng';
  if (/tên/.test(p)) return 'Khách QA';
  return 'Kiểm thử QA';
}
async function fillEmptyInputs() {
  const cs = (await candidates()).filter((c) => c.input && !c.disabled);
  for (const c of cs) {
    const loc = page.locator(`[data-qa-i="${c.i}"]`);
    const v = await loc.inputValue().catch(() => 'x');
    if (!v) await loc.fill(sampleFor(c), { timeout: 2000 }).catch(() => {});
  }
}

/* ---------- 1. lần chạy đầu: đi hết onboarding / đăng nhập / thiết lập ---------- */
const PRIMARY = [
  /^tiếp tục/i,
  /^tiếp theo/i,
  /^tiếp$/i,
  /^bắt đầu/i,
  /^gửi mã/i,
  /^xác nhận/i,
  /^đăng nhập/i,
  /^tạo/i,
  /^lưu/i,
  /^xong/i,
  /^hoàn tất/i,
  /^đồng ý/i,
  /^vào /i,
  /^cho phép/i,
  /^bật/i,
  /^bỏ qua/i,
  /^để sau/i,
  /^lúc khác/i,
];
if (SEEDED) {
  // Tạo dữ liệu lớn bằng chính store / SQLite của app (màn qa-seed chỉ có trong bản build QA).
  const t0 = Date.now();
  await page.goto(base + '/qa-seed', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page
    .waitForFunction(() => /QA_SEED_(DONE|FAIL)/.test(document.body?.innerText || ''), null, { timeout: 15 * 60000 })
    .catch(() => {});
  const body = await text();
  const m = body.match(/QA_SEED_DONE (\{.*\})/);
  report.seed = m ? { ...JSON.parse(m[1]), wallMs: Date.now() - t0 } : { error: body.slice(-1500) };
  report.seed.lt = await longTasks();
  report.seed.errors = drain();
  report.seed.shot = await shot('seed', true);
  console.log('SEED', JSON.stringify(report.seed).slice(0, 800));
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
  if (!m) {
    await browser.close();
    process.exit(1);
  }
}
await go('/');
report.firstRun.push({ step: 0, url: page.url().replace(base, ''), shot: await shot('first-run-0'), errors: drain() });
// Dừng sớm nếu app sập ngay khi mở (trang trắng): không có gì để bấm, đừng tốn cả tiếng quét.
if (!(await candidates()).length && report.firstRun[0].errors.some((e) => e.type === 'pageerror')) {
  report.fatal = report.firstRun[0].errors.filter((e) => e.type === 'pageerror').map((e) => e.text);
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(outDir, 'summary.md'), `# ${app}\nAPP SẬP KHI MỞ:\n${report.fatal.join('\n')}\n`);
  console.log(`APP SẬP KHI MỞ: ${report.fatal.join(' | ')}`);
  await browser.close();
  process.exit(1);
}
for (let step = 1; step <= (SEEDED ? 0 : 20); step++) {
  const url = page.url().replace(base, '');
  if (!isEntry(url.split('?')[0]) && step > 1) break;
  // chọn thử 2 lựa chọn đầu (sở thích, mục tiêu...) nếu có
  const cs0 = await candidates();
  const choices = cs0.filter((c) => ['checkbox', 'radio', 'switch'].includes(c.role) && !c.disabled).slice(0, 2);
  for (const c of choices)
    await page
      .locator(`[data-qa-i="${c.i}"]`)
      .click({ timeout: 2000 })
      .catch(() => {});
  await fillEmptyInputs();
  const cs = await candidates();
  let target = null;
  for (const re of PRIMARY) {
    target = cs.find((c) => !c.input && !c.disabled && re.test(c.label));
    if (target) break;
  }
  if (!target) target = [...cs].reverse().find((c) => !c.input && !c.disabled && c.role === 'button');
  if (!target) {
    report.firstRun.push({
      step,
      url,
      note: 'không tìm thấy nút để đi tiếp',
      shot: await shot(`first-run-${step}-stuck`, true),
    });
    break;
  }
  await page
    .locator(`[data-qa-i="${target.i}"]`)
    .click({ timeout: 3000 })
    .catch((e) => sink.push({ type: 'click', text: String(e).slice(0, 200) }));
  await ready(5000);
  report.firstRun.push({
    step,
    url,
    clicked: target.label,
    filled: choices.map((c) => c.label),
    after: page.url().replace(base, ''),
    shot: await shot(`first-run-${step}`),
    errors: drain(),
  });
}

/* ---------- 2. quét từng màn: bấm từng nút ---------- */
const queue = [...order];
const visitedPatterns = new Set(order);
const deferred = [];
const outOfTime = () => Date.now() - T0 > BUDGET_MS;

async function sweep(route) {
  const r = { route, pattern: patternOf(route), clicks: [] };
  await go(route);
  r.perf = { ...lastLoad };
  r.landed = page.url().replace(base, '');
  r.redirected = r.landed.split('?')[0] !== route;
  r.textExcerpt = (await text()).slice(0, 1500);
  r.shot = await shot(`route-${slug(route)}`, true);
  r.loadErrors = drain();
  const cs = await candidates();
  r.elementCount = cs.length;
  r.elements = cs.map(({ i, role, label, input, disabled }) => ({ i, role, label, input, disabled }));
  for (const c of cs.slice(0, MAX_CLICKS)) {
    if (outOfTime()) {
      r.truncated = true;
      break;
    }
    if (DESTRUCTIVE.test(c.label)) {
      deferred.push({ route, c });
      continue;
    }
    await go(route);
    if (page.url().replace(base, '').split('?')[0] !== r.landed.split('?')[0]) await go(route);
    const now = await candidates();
    const t =
      now.find((x) => x.i === c.i && x.label === c.label) || now.find((x) => x.label === c.label && x.role === c.role);
    const res = { i: c.i, role: c.role, label: c.label, input: c.input, disabled: c.disabled };
    if (!t) {
      res.result = 'không còn thấy phần tử sau khi tải lại';
      r.clicks.push(res);
      continue;
    }
    drain();
    const beforeText = await text();
    const beforeUrl = page.url();
    const beforeHash = await quickHash();
    const loc = page.locator(`[data-qa-i="${t.i}"]`);
    try {
      if (t.input) {
        res.value = sampleFor(t);
        await loc.fill(res.value, { timeout: 2500 });
        await loc.press('Enter').catch(() => {});
      } else await loc.click({ timeout: 3000 });
      res.t0 = Date.now();
    } catch (e) {
      const lines = String(e.message || e).split('\n');
      res.actionError = lines[0].slice(0, 200);
      // Lý do Playwright không bấm được (bị che, không ổn định, ngoài khung nhìn…).
      res.actionWhy = [
        ...new Set(
          lines
            .slice(1)
            .map((s) => s.trim())
            .filter((s) => /intercepts|not stable|not visible|outside of the viewport|not enabled|detached/.test(s)),
        ),
      ]
        .slice(0, 3)
        .map((s) => s.slice(0, 300));
    }
    await page.waitForTimeout(150);
    const settle = await ready(4000);
    res.ms = res.t0 ? Date.now() - res.t0 : undefined;
    res.settleMs = settle;
    delete res.t0;
    res.lt = await longTasks();
    const afterText = await text();
    const afterUrl = page.url();
    const afterHash = await quickHash();
    const bl = new Set(
      beforeText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const al = afterText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    res.urlAfter = afterUrl !== beforeUrl ? afterUrl.replace(base, '') : undefined;
    res.added = al.filter((l) => !bl.has(l)).slice(0, 12);
    res.visualChange = afterHash !== beforeHash;
    res.errors = drain();
    res.outcome = res.actionError
      ? 'lỗi thao tác'
      : res.urlAfter
        ? 'chuyển màn'
        : res.added.length
          ? 'nội dung đổi'
          : res.visualChange
            ? 'giao diện đổi'
            : 'không phản hồi';
    if (res.outcome !== 'không phản hồi' || res.errors.length)
      res.shot = await shot(`click-${slug(route)}-${c.i}`, false, 'jpeg');
    if (res.urlAfter) {
      const p = res.urlAfter.split('?')[0];
      const pat = patternOf(p);
      if (pat && !visitedPatterns.has(pat)) {
        visitedPatterns.add(pat);
        queue.push(p);
      }
      if (!pat) res.unknownRoute = true;
    }
    r.clicks.push(res);
  }
  if (cs.length > MAX_CLICKS) r.truncated = true;
  return r;
}

while (queue.length && !outOfTime()) {
  const route = queue.shift();
  const r = await sweep(route);
  report.routes.push(r);
  console.log(
    `[${app}] ${route} → ${r.landed} | phần tử ${r.elementCount} | bấm ${r.clicks.length} | lỗi tải ${r.loadErrors.length}`,
  );
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
}
report.notVisited = queue;
report.dynamicNeverReached = dynamicPatterns.filter((d) => !visitedPatterns.has(d));

/* ---------- 3. chụp lại mọi màn sau khi đã có dữ liệu + cỡ tablet / máy gập ---------- */
const visited = report.routes.map((r) => r.route);
for (const route of visited) {
  await go(route);
  report.routes.find((r) => r.route === route).shotAfter = await shot(`after-${slug(route)}`, true);
  drain();
}
for (const [w, h, tag] of [
  [700, 900, 'fold'],
  [1180, 820, 'tablet'],
]) {
  await page.setViewportSize({ width: w, height: h });
  for (const route of visited) {
    await go(route);
    report.tablet.push({ route, size: tag, shot: await shot(`${tag}-${slug(route)}`), errors: drain() });
  }
}
await page.setViewportSize({ width: 390, height: 844 });

/* ---------- 4. thao tác xoá / đặt lại (để cuối vì làm mất dữ liệu) ---------- */
for (const { route, c } of deferred) {
  await go(route);
  const t = (await candidates()).find((x) => x.label === c.label);
  if (!t) {
    report.destructive.push({ route, label: c.label, result: 'không thấy' });
    continue;
  }
  const bu = page.url();
  await page
    .locator(`[data-qa-i="${t.i}"]`)
    .click({ timeout: 3000 })
    .catch(() => {});
  await ready(3000);
  const s1 = await shot(`destr-${slug(route)}-${t.i}`, false, 'jpeg');
  // nếu hiện hộp xác nhận, bấm nút xác nhận để kiểm tra luồng đến cùng
  const confirm = (await candidates()).find((x) => DESTRUCTIVE.test(x.label) && x.i !== t.i);
  if (confirm) {
    await page
      .locator(`[data-qa-i="${confirm.i}"]`)
      .click({ timeout: 3000 })
      .catch(() => {});
    await ready(3000);
  }
  report.destructive.push({
    route,
    label: c.label,
    confirmed: confirm?.label,
    urlAfter: page.url() !== bu ? page.url().replace(base, '') : undefined,
    shot: s1,
    shotAfter: await shot(`destr2-${slug(route)}-${t.i}`, false, 'jpeg'),
    errors: drain(),
  });
}

report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));

/* ---------- tóm tắt ---------- */
const lines = [
  `# ${app}`,
  report.seed
    ? `seed: ${JSON.stringify({ ...report.seed, shot: undefined, errors: (report.seed.errors || []).length })}`
    : '',
  `màn đã quét: ${report.routes.length} | chưa tới: ${report.notVisited.join(', ') || '-'} | route động chưa tới: ${report.dynamicNeverReached.join(', ') || '-'}`,
];
for (const r of report.routes) {
  const k = (o) => r.clicks.filter((c) => c.outcome === o).length;
  const errs =
    r.loadErrors.filter((e) => e.type === 'pageerror').length +
    r.clicks.reduce((n, c) => n + (c.errors || []).filter((e) => e.type === 'pageerror').length, 0);
  lines.push(
    `${r.route}${r.redirected ? ` (→${r.landed})` : ''}: ${r.elementCount} pt, chuyển ${k('chuyển màn')}, đổi ${k('nội dung đổi') + k('giao diện đổi')}, KHÔNG phản hồi ${k('không phản hồi')}, lỗi thao tác ${k('lỗi thao tác')}, pageerror ${errs}, tải ${r.perf?.ms ?? '-'} ms, long task ${r.perf?.lt?.n ?? '-'} (tổng ${r.perf?.lt?.total ?? '-'} ms, lớn nhất ${r.perf?.lt?.max ?? '-'} ms)`,
  );
}
fs.writeFileSync(path.join(outDir, 'summary.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
await browser.close();
