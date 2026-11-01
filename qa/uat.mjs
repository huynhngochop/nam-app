// UAT: kịch bản người dùng thật trên bản web QA, mỗi app bắt đầu như người mới cài.
// Mỗi kịch bản có tiêu chí chấp nhận (see / url). Bước lỗi → ghi lại, chụp ảnh, chuyển kịch bản sau.
// Dùng: node qa/uat.mjs <app> <baseUrl> <outDir>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [app, base, outDir] = process.argv.slice(2);
fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });

const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), `uat-${app}-`)), {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(String(e.message || e).split('\n')[0]));
page.on('dialog', (d) => d.accept());

/* ---------------- bộ bước ---------------- */
const body = () => page.evaluate(() => document.body?.innerText || '').catch(() => '');
async function settle(max = 6000) {
  const t = Date.now();
  let prev = null;
  while (Date.now() - t < max) {
    await page.waitForTimeout(250);
    const cur = await body();
    if (cur && cur === prev) return;
    prev = cur;
  }
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const S = {
  go: async (p) => {
    await page.goto(base + p, { waitUntil: 'domcontentloaded' });
    await settle(8000);
  },
  /** Bấm phần tử có vai trò button/tab/checkbox/switch theo tên; không có thì bấm theo chữ. */
  tap: async (name, o = {}) => {
    const exact = o.exact ?? false;
    const roles = o.role ? [o.role] : ['button', 'tab', 'checkbox', 'switch', 'link'];
    for (const r of roles) {
      const loc = page.getByRole(r, { name, exact });
      const n = await loc.count();
      for (let i = o.nth ?? 0; i < n; i++) {
        const el = loc.nth(o.last ? n - 1 - i : i);
        if (await el.isVisible()) {
          await el.click({ timeout: 4000 }).catch((e) => {
            const why = String(e.message)
              .split('\n')
              .filter((l) => /intercepts|not stable|not visible|not enabled|outside/.test(l))
              .slice(0, 2)
              .join(' | ');
            throw new Error(`bấm «${name}» không được: ${why || String(e.message).split('\n')[0]}`);
          });
          await settle(o.wait ?? 4000);
          return;
        }
      }
    }
    await page.getByText(name, { exact }).first().click({ timeout: 4000 });
    await settle(o.wait ?? 4000);
  },
  type: async (field, value) => {
    const ph = page.getByPlaceholder(field, { exact: false });
    const loc = (await ph.count()) ? ph.first() : page.getByLabel(field).first();
    await loc.fill(value, { timeout: 4000 });
    await settle(1500);
  },
  /** Ô nhập đang hiện cuối cùng (sheet / dialog thường có ô không nhãn). */
  typeLast: async (value) => {
    await page.locator('input:visible, textarea:visible').last().fill(value, { timeout: 4000 });
    await settle(1500);
  },
  /** Bàn phím số trong app: chuỗi các nút, ví dụ ['8','5','000']. */
  keypad: async (keys) => {
    for (const k of keys) await page.getByRole('button', { name: k, exact: true }).first().click({ timeout: 3000 });
    await settle(1500);
  },
  see: async (text, timeout = 6000) => {
    const t = Date.now();
    const re = text instanceof RegExp ? text : new RegExp(esc(text));
    while (Date.now() - t < timeout) {
      if (re.test(await body())) return;
      await page.waitForTimeout(300);
    }
    throw new Error(`không thấy «${text}»`);
  },
  notSee: async (text) => {
    await settle(2000);
    const re = text instanceof RegExp ? text : new RegExp(esc(text));
    if (re.test(await body())) throw new Error(`vẫn thấy «${text}»`);
  },
  url: async (re) => {
    const t = Date.now();
    while (Date.now() - t < 6000) {
      if (re.test(page.url().replace(base, ''))) return;
      await page.waitForTimeout(250);
    }
    throw new Error(`đang ở ${page.url().replace(base, '')}, cần ${re}`);
  },
  wait: (ms) => page.waitForTimeout(ms),
  press: async (key) => {
    await page.keyboard.press(key);
    await settle(1500);
  },
  /** Tua đồng hồ của trang (đã cài page.clock trước khi tải). */
  tick: async (ms) => {
    await page.clock.runFor(ms);
    await settle(3000);
  },
};

// UAT_TRACE=1: in từng bước để dò kịch bản.
if (process.env.UAT_TRACE)
  for (const k of Object.keys(S)) {
    const f = S[k];
    S[k] = async (...a) => {
      console.log('   ·', k, ...a.map((x) => (x instanceof RegExp ? String(x) : JSON.stringify(x))));
      return f(...a);
    };
  }

/* ---------------- kịch bản theo app ---------------- */
// Tin nhắn ngân hàng giờ hiện tại hôm nay (ngày lấy theo lúc chạy để giao dịch rơi vào kỳ này).
const smsAt = new Date(Date.now() - 5 * 60_000);
const p2 = (n) => String(n).padStart(2, '0');
const SMS = `TK 0123456789 -120,000VND luc ${p2(smsAt.getHours())}:${p2(smsAt.getMinutes())} ${p2(smsAt.getDate())}/${p2(smsAt.getMonth() + 1)}/${smsAt.getFullYear()}. SD: 1,234,000VND. ND: HIGHLANDS COFFEE`;
const SCENARIOS = {
  'vi-gon': [
    {
      id: 'V1',
      name: 'Người mới: giới thiệu → đặt ngân sách 15 tr, ngày lương 5, tên → Tổng quan',
      ac: 'Tổng quan chào đúng tên, hiện ngân sách 15.000.000đ, chưa có giao dịch',
      steps: async () => {
        await S.go('/');
        await S.tap('Bắt đầu');
        await S.tap('Tiếp tục');
        await S.tap('Tiếp tục');
        await S.url(/onboarding\/budget/);
        await S.tap('15 tr', { exact: true });
        for (let i = 0; i < 4; i++) await S.tap('Tăng', { wait: 600 });
        await S.see('Ngày 5');
        await S.type('Để Ví Gọn chào bạn', 'Lan');
        await S.tap('Xong', { exact: true });
        await S.url(/home/);
        await S.see('Lan');
        await S.see('/ 15.000.000đ');
        await S.see('Chưa có giao dịch');
      },
    },
    {
      id: 'V2',
      name: 'Ghi tay một khoản chi 85.000đ ăn uống "Cơm tấm"',
      ac: 'Tổng quan: Đã chi 85.000đ, khoản mới nằm trong "Vừa ghi nhận"; Giao dịch có dòng Cơm tấm',
      steps: async () => {
        await S.go('/home');
        await S.tap('Thêm giao dịch');
        await S.url(/add/);
        await S.keypad(['8', '5', '000']);
        await S.see('85.000');
        await S.tap('Ăn uống');
        await S.type('Ví dụ: Cơm tấm', 'Cơm tấm');
        await S.tap('Lưu', { exact: true });
        await S.url(/home/);
        await S.see(/Đã chi\s*85\.000đ/);
        await S.see('Cơm tấm');
        await S.tap('Giao dịch', { role: 'tab' });
        await S.see('Cơm tấm');
      },
    },
    {
      id: 'V3',
      name: 'Ghi khoản thu lương 20.000.000đ',
      ac: 'Thu kỳ này +20.000.000đ; Đã chi không đổi',
      steps: async () => {
        await S.go('/add');
        await S.tap('Thu', { role: 'tab', exact: true });
        await S.keypad(['2', '0', '000', '000']);
        await S.see('20.000.000');
        await S.tap('Lưu', { exact: true });
        await S.go('/home');
        await S.see('+20.000.000đ');
        await S.see(/Đã chi\s*85\.000đ/);
      },
    },
    {
      id: 'V4',
      name: 'Dán tin nhắn ngân hàng → Ví Gọn đọc → xác nhận',
      ac: 'Đọc đúng −120.000đ, nơi chi Highlands; sau xác nhận không còn chờ, Đã chi 205.000đ',
      steps: async () => {
        await S.go('/transactions');
        await S.tap('Dán tin ngân hàng');
        await S.url(/import/);
        await S.type('TK *1234', SMS);
        await S.tap('Đọc tin');
        await S.url(/pending/);
        await S.see('−120.000đ');
        await S.see(/Highlands/i);
        await S.tap('Lưu', { exact: false, last: true });
        await S.go('/home');
        await S.see(/Đã chi\s*205\.000đ/);
        await S.notSee('giao dịch chờ xác nhận');
      },
    },
    {
      id: 'V5',
      name: 'Dán lại đúng tin nhắn đó lần nữa',
      ac: 'Không ghi trùng: báo trùng hoặc đưa vào nghi trùng; Đã chi vẫn 205.000đ',
      steps: async () => {
        await S.go('/import');
        await S.type('TK *1234', SMS);
        await S.tap('Đọc tin');
        await S.go('/home');
        await S.see(/Đã chi\s*205\.000đ/);
      },
    },
    {
      id: 'V6',
      name: 'Tạo quỹ "Du lịch" 5 tr, góp 500.000đ',
      ac: 'Quỹ hiện 500.000đ / 5.000.000đ (10%); khoản góp không tính vào Đã chi',
      steps: async () => {
        await S.go('/funds');
        await S.tap('Tạo quỹ');
        await S.type('Ví dụ: Mua laptop mới', 'Du lịch');
        await S.type('25.000.000', '5000000');
        await S.tap('Tạo quỹ', { last: true });
        await S.see('Du lịch');
        // Tạo xong app mở thẳng chi tiết quỹ.
        await S.url(/fund\/(?!new)/);
        await S.tap('Góp vào quỹ');
        await S.typeLast('500000');
        await S.tap('Xong', { exact: true, last: true });
        await S.see('500.000đ');
        await S.see('10%');
        await S.go('/home');
        await S.see(/Đã chi\s*205\.000đ/);
      },
    },
    {
      id: 'V7',
      name: 'Tìm giao dịch theo tên và theo số tiền',
      ac: '"cơm" ra Cơm tấm; "120" ra Highlands; chuỗi lạ ra danh sách trống',
      steps: async () => {
        await S.go('/transactions');
        await S.type('Tìm nơi chi', 'cơm');
        await S.see('Cơm tấm');
        await S.notSee(/Highlands/i);
        await S.type('Tìm nơi chi', '120');
        await S.see(/Highlands/i);
        await S.type('Tìm nơi chi', 'zzzzzz');
        await S.notSee('Cơm tấm');
      },
    },
    {
      id: 'V8',
      name: 'Sửa khoản Cơm tấm (danh mục, ghi chú, số tiền 95.000đ) rồi xóa',
      ac: 'Danh mục, ghi chú giữ lại kể cả khi bấm Quay lại ngay; sửa số tiền → Đã chi 215.000đ; xóa → 120.000đ, Cơm tấm biến mất',
      steps: async () => {
        await S.go('/transactions');
        await S.tap('Cơm tấm');
        await S.see('85.000');
        await S.tap('Khác');
        await S.type('Thêm ghi chú', 'ăn với bạn');
        // Người dùng gõ xong bấm Quay lại ngay (bàn phím vẫn mở) — ghi chú phải được giữ.
        await S.tap('Quay lại');
        await S.tap('Cơm tấm');
        await S.see('ăn với bạn');
        await S.tap('Sửa số tiền');
        await S.type('Số tiền (đồng)', '95000');
        await S.tap('Lưu', { exact: true, last: true });
        await S.see('95.000');
        await S.go('/home');
        await S.see(/Đã chi\s*215\.000đ/);
        await S.go('/transactions');
        await S.tap('Cơm tấm');
        await S.tap('Xóa giao dịch');
        await S.tap('Xóa', { exact: true, last: true });
        await S.go('/home');
        await S.see(/Đã chi\s*120\.000đ/);
        await S.notSee('Cơm tấm');
      },
    },
    {
      id: 'V9',
      name: 'Đặt ngân sách ăn uống 100.000đ khi đã chi 120.000đ',
      ac: 'Màn ngân sách báo vượt ở Ăn uống',
      steps: async () => {
        await S.go('/budgets');
        await S.see('Ăn uống');
        await S.tap('Ăn uống');
        await S.typeLast('100000');
        await S.tap('Lưu', { exact: true, last: true });
        await S.see(/Vượt|vượt|120%|Quá/);
      },
    },
    {
      id: 'V10',
      name: 'Đóng app rồi mở lại',
      ac: 'Tên, ngân sách, giao dịch, quỹ còn nguyên',
      steps: async () => {
        await page.reload();
        await settle(8000);
        await S.go('/home');
        await S.see('Lan');
        await S.see(/Đã chi\s*120\.000đ/);
        await S.go('/funds');
        await S.see('Du lịch');
      },
    },
  ],

  'hen-dep': [
    {
      id: 'H1',
      name: 'Chủ tiệm mới đăng nhập bằng số điện thoại + mã',
      ac: 'Nhập SĐT → nhận mã → nhập 123456 (bản thử) → vào màn thiết lập tiệm',
      steps: async () => {
        await S.go('/');
        await S.url(/auth/);
        await S.type('0912 345 678', '0901234567');
        await S.tap('Nhận mã');
        await S.see('123456');
        await S.typeLast('123456');
        await S.url(/setup/);
        await S.see('1/4');
      },
    },
    {
      id: 'H2',
      name: 'Thiết lập tiệm: tên, loại Nail, giờ mặc định, 2 dịch vụ, quay lại bước dịch vụ rồi đi tiếp',
      ac: 'Xong 4 bước có link đặt lịch; Dịch vụ có đúng 2 mục, không bị nhân đôi khi quay lại',
      steps: async () => {
        await S.go('/setup');
        await S.type('Ví dụ: Salon Mây', 'Salon Hoa');
        await S.tap('Nail', { exact: true });
        await S.type('Số nhà, đường, quận', '12 Lê Lợi, Q1');
        await S.tap('Tiếp tục');
        await S.see('2/4');
        await S.tap('Tiếp tục');
        await S.see('3/4');
        await S.tap(/^Sơn gel/);
        await S.tap(/^Vẽ móng/);
        await S.tap('Tiếp tục');
        await S.see('4/4');
        // Người dùng quay lại xem bước dịch vụ rồi đi tiếp.
        await S.tap('Quay lại');
        await S.see('3/4');
        await S.tap('Tiếp tục');
        await S.see('4/4');
        await S.tap('Chỉ mình tôi');
        await S.tap('Tiếp tục');
        await S.see('Tiệm đã sẵn sàng');
        await S.see('hendep.app/salon-hoa');
        await S.tap('Vào lịch');
        await S.url(/calendar/);
        await S.go('/services');
        const n = ((await body()).match(/Sơn gel/g) || []).length;
        if (n !== 1) throw new Error(`"Sơn gel" xuất hiện ${n} lần trong Dịch vụ`);
      },
    },
    {
      id: 'H3',
      name: 'Ngày tiệm nghỉ (Chủ nhật): lịch không gợi ý lấp chỗ trống',
      ac: 'Ngày có chữ "Tiệm nghỉ ngày này" thì không có gợi ý "Trống … Gửi ưu đãi"',
      steps: async () => {
        await S.go('/calendar');
        for (let i = 0; i < 7; i++) {
          if (/Chủ nhật/.test(await body())) break;
          await S.tap('Ngày sau', { wait: 1500 });
        }
        await S.see('Tiệm nghỉ ngày này');
        await S.notSee(/Trống \d/);
      },
    },
    {
      id: 'H4',
      name: 'Tạo lịch hẹn từ màn Lịch: khách mới Chị Mai, Sơn gel, Thứ Hai tuần sau 10:00',
      ac: 'Quay về Lịch; ngày đó có lịch của Chị Mai lúc 10:00; khách mới có trong danh sách Khách',
      steps: async () => {
        await S.go('/calendar');
        await S.tap('Tạo lịch hẹn');
        await S.url(/booking\/new/);
        await S.type('Tìm tên hoặc SĐT', '0987654321');
        await S.type('Họ tên', 'Chị Mai');
        // Thứ Hai gần nhất (không phải hôm nay).
        await S.tap(/^T2, /);
        await S.tap('10:00', { exact: true });
        await S.see(/GIỜ · 10:00 – 11:00/);
        await S.tap('Tạo lịch hẹn', { last: true });
        await S.url(/calendar/);
        await S.go('/customers');
        await S.see('Chị Mai');
      },
    },
    {
      id: 'H5',
      name: 'Không cho giờ hẹn kết thúc sau giờ đóng cửa',
      ac: 'Dịch vụ 60 phút, tiệm đóng 20:00: không có ô giờ sau 19:00',
      steps: async () => {
        await S.go('/booking/new');
        await S.tap(/^T2, /);
        await S.notSee(/\n(19:15|19:30|19:45|20:00|20:15|20:30|20:45)\n/);
      },
    },
    {
      id: 'H6',
      name: 'Phục vụ khách: đã đến → đang làm → hoàn thành, thu 200.000đ',
      ac: 'Lịch hẹn ở trạng thái Hoàn thành; Doanh thu có 200.000đ; Chị Mai 1 lần · 200.000đ',
      steps: async () => {
        await S.go('/customers');
        await S.tap('Chị Mai');
        await S.see('Sơn gel');
        await S.tap(/Sơn gel|HD-/);
        await S.url(/booking\//);
        await S.tap('Khách đã đến');
        await S.tap(/Bắt đầu làm|Đang làm/);
        await S.tap(/Hoàn thành|Thanh toán/);
        await S.tap(/Tiền mặt|Xác nhận|Đã thu/, { last: true }).catch(() => {});
        await S.see(/HOÀN THÀNH|Đã thanh toán|Đã thu/i);
        await S.go('/customers');
        await S.see(/1 lần · 200\.000đ/);
      },
    },
    {
      id: 'H7',
      name: 'Đóng app rồi mở lại',
      ac: 'Vẫn đăng nhập, tiệm, khách và lịch hẹn còn nguyên',
      steps: async () => {
        await page.reload();
        await settle(8000);
        await S.go('/');
        await S.url(/calendar/);
        await S.go('/customers');
        await S.see('Chị Mai');
      },
    },
  ],

  nhip: [
    {
      id: 'N1',
      name: 'Người mới: chọn mục tiêu 1 giờ → Hẹn giờ',
      ac: 'Màn Hẹn giờ hiện 0/2 phiên hôm nay, 25:00',
      steps: async () => {
        await S.go('/');
        await S.url(/onboarding/);
        await S.tap('1 giờ');
        await S.tap('Học', { exact: true });
        await S.tap('Tiếp tục');
        await S.tap('Để sau');
        await S.url(/timer/);
        await S.see('0/2 phiên hôm nay');
        await S.see('25:00');
      },
    },
    {
      id: 'N2',
      name: 'Thêm việc "Ôn thi Toán" 3 phiên cho hôm nay và chọn làm việc đang làm',
      ac: 'Việc mới có trong danh sách hôm nay (0/3 phiên) và hiện ở ô "Việc đang làm"',
      steps: async () => {
        await S.go('/timer');
        await S.tap('Chọn việc');
        await S.tap('Thêm việc');
        await S.type('Chuẩn bị slide họp', 'Ôn thi Toán');
        await S.tap('Tăng');
        await S.tap('Thêm việc', { last: true });
        await S.see('Ôn thi Toán');
        await S.see('0/3 phiên');
        await S.tap('Ôn thi Toán');
        await S.go('/timer');
        await S.see('Ôn thi Toán');
      },
    },
    {
      id: 'N3',
      name: 'Tập trung đủ một phiên 25 phút (tua giờ)',
      ac: 'Hết giờ → báo xong/nghỉ; Thống kê hôm nay có 25 phút; việc thành 1/3 phiên',
      steps: async () => {
        await S.go('/timer');
        await S.tap('Bắt đầu');
        await S.url(/session/);
        await S.tick(25 * 60_000 + 2000);
        await S.see(/nghỉ|Xong|hoàn thành/i, 8000);
        await S.go('/stats');
        await S.see(/25 phút|0,4 giờ/);
        // Thói quen "Phiên tập trung" theo mục tiêu 1 giờ = 2 phiên, khớp màn Hẹn giờ.
        await S.see('1/2 phiên');
        await S.go('/tasks');
        await S.see('1/3 phiên');
      },
    },
    {
      id: 'N4',
      name: 'Dừng phiên giữa chừng',
      ac: 'Hỏi xác nhận; dừng xong không tính là phiên hoàn thành',
      steps: async () => {
        await S.go('/timer');
        await S.tap('Bắt đầu');
        await S.url(/session/);
        await S.tick(5 * 60_000);
        await S.tap(/Dừng|Bỏ phiên|Kết thúc/);
        await S.tap(/Dừng|Bỏ|Kết thúc/, { last: true }).catch(() => {});
        await S.go('/tasks');
        await S.see('1/3 phiên');
      },
    },
    {
      id: 'N5',
      name: 'Thói quen: đánh dấu uống nước hôm nay',
      ac: 'Bấm + ở thói quen → số hôm nay tăng',
      steps: async () => {
        await S.go('/habits');
        await S.see(/Thói quen/);
        const before = await body();
        await S.tap(/Thêm 1|Tăng|\+/);
        const after = await body();
        if (before === after) throw new Error('bấm không đổi gì');
      },
    },
    {
      id: 'N6',
      name: 'Đóng app rồi mở lại',
      ac: 'Việc, phiên đã xong còn nguyên; không hỏi tiếp tục phiên đã dừng',
      steps: async () => {
        await page.reload();
        await settle(8000);
        await S.go('/tasks');
        await S.see('Ôn thi Toán');
        await S.see('1/3 phiên');
        await S.go('/timer');
        await S.notSee('Tiếp tục phiên dở');
      },
    },
  ],

  'meo-nha': [
    {
      id: 'M1',
      name: 'Người mới: chọn Bếp, Giặt ủi → Khám phá',
      ac: 'Mẹo đầu danh sách thuộc Bếp / Giặt ủi',
      steps: async () => {
        await S.go('/');
        await S.tap('Bếp');
        await S.tap('Giặt ủi');
        await S.see('Tiếp tục (2)');
        await S.tap('Tiếp tục');
        await S.tap('Để sau');
        await S.url(/explore/);
        const t = await body();
        const firstCats = [...t.matchAll(/· (Bếp|Nhà cửa|Cây xanh|Giặt ủi|Tiết kiệm|Sửa chữa nhỏ)\n/g)]
          .slice(0, 4)
          .map((m) => m[1]);
        if (!firstCats.length || firstCats.some((c) => !['Bếp', 'Giặt ủi'].includes(c)))
          throw new Error(`4 mẹo đầu: ${firstCats.join(', ')}`);
      },
    },
    {
      id: 'M2',
      name: 'Mở một mẹo, lưu, xem trong Đã lưu',
      ac: 'Mẹo lưu xong có trong tab Đã lưu; bỏ lưu thì mất',
      steps: async () => {
        await S.go('/explore');
        await S.tap('Tẩy dầu mỡ trên mặt bếp');
        await S.url(/tip\//);
        await S.tap(/^Lưu/);
        await S.go('/saved');
        await S.see('Tẩy dầu mỡ trên mặt bếp');
      },
    },
    {
      id: 'M3',
      name: 'Tìm "nồm"',
      ac: 'Có kết quả về nồm; tìm lại hiện trong tìm gần đây',
      steps: async () => {
        await S.go('/search');
        await S.type('', 'nồm').catch(async () => {
          await page.locator('input').first().fill('nồm');
        });
        await S.press('Enter');
        await S.see(/nồm/i);
      },
    },
    {
      id: 'M4',
      name: 'Tủ lạnh: thêm Đậu phụ → món đậu sốt cà chua bớt thiếu',
      ac: '"Đậu phụ sốt cà chua" từ "Thiếu: Đậu phụ, Nước mắm" thành "Thiếu: Nước mắm"; Đậu phụ có trong tủ',
      steps: async () => {
        await S.go('/fridge');
        await S.see('Thiếu: Đậu phụ, Nước mắm');
        await S.tap('+ Thêm', { exact: true });
        await S.see('Thêm nguyên liệu');
        await S.tap('Đậu phụ', { exact: true, last: true });
        await S.press('Escape');
        await S.go('/fridge');
        await S.notSee('Thiếu: Đậu phụ, Nước mắm');
        await S.see(/Đậu phụ sốt cà chua\n[^\n]*Thiếu: Nước mắm/);
      },
    },
    {
      id: 'M5',
      name: 'Đóng app rồi mở lại',
      ac: 'Mẹo đã lưu và đồ trong tủ lạnh còn nguyên',
      steps: async () => {
        await page.reload();
        await settle(8000);
        await S.go('/saved');
        await S.see('Tẩy dầu mỡ trên mặt bếp');
        await S.go('/fridge');
        await S.notSee('Thiếu: Đậu phụ, Nước mắm');
      },
    },
  ],
};

/* ---------------- chạy ---------------- */
if (app === 'nhip') await page.clock.install({ time: new Date() });
const results = [];
for (const sc of SCENARIOS[app] ?? []) {
  jsErrors.length = 0;
  const t = Date.now();
  const r = { id: sc.id, name: sc.name, ac: sc.ac };
  try {
    await sc.steps();
    r.pass = true;
  } catch (e) {
    r.pass = false;
    r.error = String(e.message || e)
      .split('\n')[0]
      .slice(0, 300);
    r.url = page.url().replace(base, '');
    r.screen = (await body()).replace(/\n{2,}/g, '\n').slice(0, 600);
  }
  r.ms = Date.now() - t;
  r.jsErrors = [...jsErrors];
  await page.screenshot({ path: path.join(outDir, 'shots', `${sc.id}.png`) }).catch(() => {});
  results.push(r);
  console.log(
    `${r.pass ? 'ĐẠT ' : 'LỖI '} ${sc.id} ${sc.name}${r.pass ? '' : `\n      → ${r.error} @ ${r.url}`}${r.jsErrors.length ? `\n      JS: ${r.jsErrors.join(' | ')}` : ''}`,
  );
  fs.writeFileSync(path.join(outDir, 'uat.json'), JSON.stringify(results, null, 1));
}
await ctx.close();
process.exitCode = results.every((r) => r.pass) ? 0 : 1;
