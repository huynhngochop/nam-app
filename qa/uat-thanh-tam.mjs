// Kiểm thử chấp nhận (UAT) Thành Tâm: các hành trình của người dùng thật, có tiêu chí đạt/không đạt rõ ràng.
// Dùng: node qa/uat-thanh-tam.mjs <baseUrl> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [base, outDir] = process.argv.slice(2);
fs.mkdirSync(path.join(outDir, 'shots'), { recursive: true });
const OUT = path.resolve(outDir);
const browser = await chromium.launch();
const results = [];

async function newPage({ w = 393, h = 852, tz = 'Asia/Ho_Chi_Minh', scheme = 'light' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    locale: 'vi-VN',
    timezoneId: tz,
    colorScheme: scheme,
    hasTouch: true,
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push(String(e?.message || e).slice(0, 300)));
  page.cons = [];
  page.on(
    'console',
    (m) => ['error', 'warning'].includes(m.type()) && page.cons.push(`${m.type()}: ${m.text().slice(0, 240)}`),
  );
  return page;
}
const settle = async (page, ms = 600) => {
  let prev = '';
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(250);
    const cur = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    if (cur && cur === prev) break;
    prev = cur;
  }
  await page.waitForTimeout(ms / 3);
};
const go = async (page, route) => {
  await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page);
};
const body = (page) => page.evaluate(() => document.body.innerText);
const expectText = async (page, re, what) => {
  const ok = await page
    .waitForFunction((src) => new RegExp(src, 'i').test(document.body.innerText), re.source, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) throw new Error(`không thấy ${what ?? re}`);
};
const btn = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' }).first();
const click = async (page, name) => {
  await btn(page, name).click({ timeout: 6000 });
  await settle(page);
};
async function seed(page, small = true) {
  await page.goto(base + `/qa-seed${small ? '?small=1' : ''}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => /QA_SEED_(DONE|FAIL)/.test(document.body?.innerText || ''), null, {
    timeout: 240000,
  });
}

async function scenario(id, who, goal, fn, opts) {
  const page = await newPage(opts);
  const t0 = Date.now();
  const steps = [];
  let pass = true;
  let error;
  try {
    await fn(page, (s) => steps.push(s));
    if (page.errs.length) throw new Error(`lỗi JS: ${page.errs[0]}`);
  } catch (e) {
    pass = false;
    error = String(e.message || e)
      .split('\n')[0]
      .slice(0, 300);
    // Ghi kèm lỗi JS/console để biết vì sao trượt (vd. trang trắng).
    const extra = [...page.errs.map((x) => `pageerror: ${x}`), ...page.cons].slice(0, 4);
    if (extra.length) error += ` · ${extra.join(' · ')}`;
  }
  const shot = `shots/${id}.jpg`;
  await page.screenshot({ path: path.join(outDir, shot), type: 'jpeg', quality: 65, fullPage: true }).catch(() => {});
  results.push({ id, who, goal, pass, error, steps, ms: Date.now() - t0, shot, url: page.url().replace(base, '') });
  console.log(`${pass ? 'ĐẠT ' : 'TRƯỢT'} ${id} · ${goal}${error ? ` → ${error}` : ''}`);
  await page.context().close();
}

/* ---------------- các hành trình ---------------- */
await scenario(
  'U01',
  'Người mới cài app (miền Nam, có ban Thần tài)',
  'Đi hết onboarding, vào Hôm nay thấy ngày âm và tên mình',
  async (p, s) => {
    await go(p, '/');
    await expectText(p, /Nếp nhà mình/);
    await p.getByRole('tab', { name: 'Miền Nam' }).click();
    await p.getByRole('checkbox', { name: 'Ban Thần tài' }).click();
    await click(p, /^Tiếp tục$/);
    s('chọn miền Nam + ban Thần tài');
    await expectText(p, /Điền sẵn vào văn khấn/);
    await p.getByPlaceholder('Ví dụ: Nguyễn Thị Lan').fill('Nguyễn Thị Lan');
    await p.getByPlaceholder('Số nhà, phường, tỉnh').fill('12 Lê Lợi, Quận 1, TP.HCM');
    await p.getByPlaceholder('Ví dụ: Nguyễn', { exact: true }).fill('Nguyễn');
    await click(p, /^Bắt đầu$/);
    s('điền tên, địa chỉ, họ');
    await expectText(p, /Lan/, 'tên "Lan" ở đầu Hôm nay');
    await expectText(p, /âm/, 'ngày âm');
    // Hành trình nối tiếp: lễ vật theo miền Nam, văn khấn có tên đã điền
    // Chờ dữ liệu ghi xong xuống máy trước khi tải lại trang.
    await p.waitForTimeout(2500);
    await go(p, '/ritual/mung-1-ram/offerings');
    await expectText(p, /Mãng cầu/, 'lễ vật miền Nam (mãng cầu)');
    await p.getByRole('checkbox').first().click();
    await expectText(p, /Đã có 1\//, 'đếm món đã đánh dấu');
    s('lễ vật miền Nam, đánh dấu 1 món');
    await go(p, '/ritual/mung-1-ram/prayer');
    await expectText(p, /Nguyễn Thị Lan/, 'tên gia chủ trong văn khấn');
    await expectText(p, /12 Lê Lợi/, 'địa chỉ trong văn khấn');
    s('văn khấn đã điền tên, địa chỉ');
  },
);

await scenario(
  'U02',
  'Bà Lan, 60 tuổi, cúng rằm',
  'Mở lễ, đọc văn khấn chữ to, khấn xong, đặt nhắc hạ lễ',
  async (p, s) => {
    await seed(p);
    await go(p, '/ritual/mung-1-ram');
    await expectText(p, /Cúng mùng 1, rằm/);
    await expectText(p, /Lần tới/, 'ngày cúng lần tới');
    await click(p, /^Văn khấn$/);
    await expectText(p, /Văn khấn/);
    s('mở văn khấn');
    await click(p, /^Bắt đầu khấn$/);
    await expectText(p, /Khấn xong/);
    const size0 = await p.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll('div[dir],div')].map((e) => parseFloat(getComputedStyle(e).fontSize) || 0),
      ),
    );
    await click(p, 'Chữ to');
    const size1 = await p.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll('div[dir],div')].map((e) => parseFloat(getComputedStyle(e).fontSize) || 0),
      ),
    );
    if (!(size1 > size0)) throw new Error(`bấm "Chữ to" không tăng cỡ chữ (${size0} → ${size1})`);
    s(`chữ khấn ${size0}px → ${size1}px`);
    await btn(p, /^Khấn xong$/).click();
    await settle(p);
    await expectText(p, /Đã khấn xong/);
    s('khấn xong → màn sau khi cúng');
  },
);

await scenario(
  'U03',
  'Người lo việc giỗ',
  'Thêm giỗ bà nội 30 tháng Chạp: app báo năm nay tháng Chạp thiếu, giỗ ngày 29',
  async (p, s) => {
    await seed(p);
    await go(p, '/anniversaries/edit');
    await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Phạm Thị Hoa');
    await click(p, /^Bà nội$/);
    await p.getByLabel('Ngày giỗ (lịch âm)').fill('30');
    await p.getByLabel('Tháng giỗ (lịch âm)').fill('12');
    await settle(p);
    await expectText(p, /Lần tới/, 'ngày dương của lần giỗ tới');
    await expectText(p, /chỉ có 29 ngày/, 'nhắc tháng Chạp thiếu (Chạp Bính Ngọ có 29 ngày)');
    s('xem trước: tháng thiếu → ngày 29');
    await click(p, /^Thêm ngày giỗ$/);
    await go(p, '/anniversaries');
    await expectText(p, /Phạm Thị Hoa/);
    await expectText(p, /Năm nay: .*5\/2\/2027/, 'giỗ năm nay rơi vào 5/2/2027');
    s('sổ giỗ hiện 5/2/2027');
  },
);

await scenario(
  'U04',
  'Chủ nhà xem tuổi năm mới',
  'Thêm người sinh 10/2/1975 (trước Tết Ất Mão) → tuổi Giáp Dần, mệnh Đại Khê Thủy; năm Bính Ngọ: sao Thái Âm, kim lâu lục súc',
  async (p, s) => {
    await seed(p, true);
    await go(p, '/people/edit');
    await p.getByPlaceholder('Ví dụ: Trần Văn Minh').fill('Lê Văn Tùng');
    await p.getByRole('tab', { name: 'Nam', exact: true }).click();
    await p.getByLabel('Ngày (lịch dương)').fill('10');
    await p.getByLabel('Tháng (lịch dương)').fill('2');
    await p.getByLabel('Năm (lịch dương)').fill('1975');
    await settle(p);
    await expectText(p, /Tuổi Giáp Dần/, 'quy đổi sinh trước Tết → Giáp Dần');
    s('quy đổi: Giáp Dần (năm âm 1974)');
    await click(p, /^Thêm người$/);
    await go(p, '/age?year=2026');
    await click(p, /^Tùng$/);
    await expectText(p, /Đại Khê Thủy/, 'mệnh Đại Khê Thủy');
    await expectText(p, /Sao Thái Âm/, 'sao Thái Âm (nam 53 tuổi mụ)');
    await expectText(p, /lục súc/i, 'kim lâu lục súc (53 tuổi)');
    await expectText(p, /Xem thêm|Hiểu thế nào/, 'liên kết Xem thêm');
    s('Tuổi & năm đúng vector kiểm thử');
  },
);

await scenario(
  'U05',
  'Người gõ không dấu',
  'Tìm "ong tao" ra lễ ông Công ông Táo; tìm "huong chay" ra dấu hiệu hương cháy',
  async (p, s) => {
    await seed(p);
    await go(p, '/search');
    await p.getByPlaceholder(/Ví dụ: cúng ông Táo/).fill('ong tao');
    await expectText(p, /ông Công ông Táo/i);
    s('ong tao → ông Công ông Táo');
    await p.getByPlaceholder(/Ví dụ: cúng ông Táo/).fill('huong chay');
    await expectText(p, /Hương cháy/);
    s('huong chay → Hương cháy không đều');
  },
);

await scenario('U06', 'Xem lịch âm', 'Chạm một ngày trên lịch → thấy ngày âm, can chi, giờ hoàng đạo', async (p, s) => {
  await seed(p);
  await go(p, '/calendar');
  await expectText(p, /Lịch âm|Tháng \d+\/\d{4}/);
  await p
    .getByRole('button', { name: /15 tháng/ })
    .first()
    .click();
  await settle(p);
  await expectText(p, /Giờ hoàng đạo/);
  await expectText(p, /âm lịch/);
  s('chi tiết ngày hiện đủ');
});

await scenario('U07', 'Tự xem nhân tướng', 'Đi 8 bước, có kết quả 3 nét nổi bật, lưu được', async (p, s) => {
  await seed(p);
  await go(p, '/face');
  await click(p, /Bắt đầu|Chọn lại từ đầu/);
  for (let i = 0; i < 8; i++) {
    await p.getByRole('radio').first().click();
    await click(p, i === 7 ? /^Xem kết quả$/ : /^Tiếp$/);
  }
  await expectText(p, /Ba nét nổi bật/);
  await expectText(p, /Khoa học chưa chứng minh/, 'lời nhắc khoa học');
  s('kết quả có 3 nét + lời nhắc');
  await click(p, /^Lưu cho tôi$/);
  await expectText(p, /Kết quả đã lưu/);
  s('đã lưu');
});

await scenario(
  'U08',
  'Người ở Mỹ (UTC−5)',
  'Hôm nay vẫn hiện ngày âm, ghi "theo lịch Việt Nam"',
  async (p, s) => {
    await seed(p);
    await go(p, '/today');
    await expectText(p, /Theo lịch Việt Nam/);
    s('có nhãn theo lịch Việt Nam');
  },
  { tz: 'America/New_York' },
);

await scenario(
  'U09',
  'Dùng iPad ngang',
  'Bài cúng hiện danh sách + chi tiết cạnh nhau; chạm mục đổi chi tiết, không rời trang',
  async (p, s) => {
    await seed(p);
    await go(p, '/rituals');
    await expectText(p, /Bài cúng/);
    await expectText(p, /Văn khấn/, 'cột chi tiết hiện sẵn');
    const url0 = p.url();
    await p
      .getByRole('button', { name: /Cúng ông Công ông Táo/ })
      .first()
      .click();
    await settle(p);
    if (p.url() !== url0) throw new Error('chạm mục lại chuyển trang thay vì đổi cột chi tiết');
    await expectText(p, /23 tháng Chạp|tháng Chạp/, 'chi tiết lễ ông Táo');
    s('hai cột hoạt động');
    await go(p, '/calendar');
    await p
      .getByRole('button', { name: /15 tháng/ })
      .first()
      .click();
    await settle(p);
    const sheetOpen = await p.evaluate(() => !!document.querySelector('[aria-modal="true"]'));
    await expectText(p, /Giờ hoàng đạo/);
    s(`lịch: chi tiết ngày ${sheetOpen ? 'mở sheet' : 'ở cột bên phải'}`);
  },
  { w: 1180, h: 820 },
);

await scenario(
  'U10',
  'Máy gập mở (Galaxy Z Fold dọc)',
  'Hôm nay chia 2 cột, không tràn ngang',
  async (p, s) => {
    await seed(p);
    await go(p, '/today');
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) throw new Error(`tràn ngang ${over}px`);
    await expectText(p, /Sắp tới/);
    await expectText(p, /Mẹo hôm nay/);
    s('2 cột, không tràn');
  },
  { w: 690, h: 829 },
);

await scenario(
  'U11',
  'Dữ liệu cực lớn (1.000 ngày giỗ, 60 người)',
  'Các màn chính mở dưới 3 giây, không lỗi',
  async (p, s) => {
    await seed(p, false);
    for (const r of ['/today', '/calendar', '/anniversaries', '/age', '/me']) {
      const t0 = Date.now();
      await go(p, r);
      const ms = Date.now() - t0;
      s(`${r}: ${ms} ms`);
      if (ms > 3000) throw new Error(`${r} mở mất ${ms} ms (> 3 s)`);
    }
  },
);

await scenario(
  'U12',
  'Người thích nền tối',
  'Chế độ khấn và Hôm nay ở nền tối không lỗi',
  async (p, s) => {
    await seed(p);
    await go(p, '/today');
    await go(p, '/ritual/mung-1-ram/pray');
    await expectText(p, /Khấn xong/);
    s('nền tối ổn');
  },
  { scheme: 'dark' },
);

await scenario(
  'U13',
  'Con cháu tụng kinh ngày giỗ',
  'Từ lễ giỗ mở nghi thức cầu siêu, tụng theo mõ, chuyển bài, tụng xong',
  async (p, s) => {
    await seed(p);
    await go(p, '/ritual/gio-thuong');
    await expectText(p, /Nghi thức cầu siêu/, 'mục tụng kinh trong lễ giỗ');
    await click(p, /Nghi thức cầu siêu/);
    await expectText(p, /Vãng Sanh/, 'thứ tự tụng có Chú Vãng Sanh');
    await click(p, 'Bắt đầu tụng');
    await expectText(p, /Bài 1\/7/, 'màn tụng bài 1');
    await click(p, 'Tụng');
    await p.waitForTimeout(2500);
    await click(p, 'Tạm dừng');
    s('tụng theo mõ, tạm dừng được');
    await click(p, 'Bài sau');
    await expectText(p, /Bài 2\/7/, 'chuyển sang bài 2');
    await expectText(p, /Vô thượng thậm thâm/, 'chữ Khai Kinh Kệ');
    s('chuyển bài được');
    for (let i = 0; i < 5; i++) await click(p, 'Bài sau');
    await expectText(p, /Bài 7\/7/, 'bài cuối');
    s('tới bài cuối');
  },
);

await scenario(
  'U14',
  'Người mới, không thuộc kinh',
  'Thư viện kinh: mở bài Bát Nhã, bật nghĩa, chỉnh nhịp mõ, có đường nghe chư Tăng tụng',
  async (p, s) => {
    await seed(p);
    await go(p, '/explore');
    await click(p, 'Tụng kinh');
    await expectText(p, /Nghi thức cầu an/);
    await click(p, /Khai Kinh Kệ/);
    await expectText(p, /Nghe chư Tăng tụng/, 'đường nghe tụng mẫu');
    await p.getByRole('switch', { name: 'Hiện nghĩa tiếng Việt' }).first().click({ timeout: 6000 });
    await settle(p);
    await click(p, 'Tăng');
    await expectText(p, /130/, 'nhịp mõ tăng lên 130');
    await click(p, 'Bắt đầu tụng');
    await expectText(p, /Pháp Phật cao sâu/, 'nghĩa tiếng Việt hiện dưới kệ');
    s('bài lẻ, có nghĩa, đổi nhịp được');
  },
);

await scenario(
  'U15',
  'Mở từ thông báo nhắc lễ',
  'Màn mở thẳng (không có màn trước): bấm Quay lại, Đóng vẫn ra được, về Hôm nay',
  async (p, s) => {
    await seed(p);
    await go(p, '/ritual/mung-1-ram/prayer');
    await click(p, 'Quay lại');
    await expectText(p, /Chào buổi/, 'về Hôm nay sau khi bấm Quay lại');
    s('màn văn khấn mở thẳng: Quay lại về Hôm nay');
    await go(p, '/chant/cau-an/play');
    await click(p, 'Đóng');
    await expectText(p, /Chào buổi/, 'về Hôm nay sau khi bấm Đóng');
    s('màn tụng mở thẳng: Đóng về Hôm nay');
  },
);

await scenario(
  'U16',
  'Con cháu gửi sổ giỗ cho nhau',
  'Gửi sổ giỗ ra tệp, người nhận nhập: thêm ngày mới, ngày trùng hỏi trước khi ghi đè, không mất ngày nào',
  async (p, s) => {
    await seed(p);
    await go(p, '/anniversaries');
    const before = (await body(p)).match(/(\d+) ngày giỗ ·/);
    await click(p, 'Gửi cho cả nhà');
    await expectText(p, /Đã chọn \d+\/\d+/, 'màn chọn ngày giỗ để gửi');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), click(p, /^Gửi \d+ ngày giỗ$/)]);
    const file = path.join(OUT, 'sogio.json');
    await dl.saveAs(file);
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (j.app !== 'thanh-tam' || j.kind !== 'so-gio' || !j.anniversaries.length) throw new Error('tệp gửi đi sai');
    s(`tệp gửi đi có ${j.anniversaries.length} ngày giỗ`);
    // Người nhận: một ngày sửa món cúng (trùng), một ngày mới
    j.anniversaries[0] = { ...j.anniversaries[0], dishes: 'Xôi gấc, gà luộc (QA)' };
    j.anniversaries.push({
      id: 'qa-moi',
      name: 'Người Mới QA',
      relation: 'Cụ',
      lunar: { day: 9, month: 9, leap: false },
      missingDayRule: 'ngay-cuoi-thang',
      remindDays: [7, 3, 1],
    });
    const file2 = path.join(OUT, 'sogio-nhan.json');
    fs.writeFileSync(file2, JSON.stringify(j));
    await go(p, '/data');
    const [fc] = await Promise.all([
      p.waitForEvent('filechooser', { timeout: 15000 }),
      click(p, /Nhận sổ giỗ từ người khác/),
    ]);
    await fc.setFiles(file2);
    await expectText(p, /Ngày giỗ mới sẽ thêm/, 'màn xem trước khi nhập');
    await expectText(p, /Ngày trùng: chọn giữ hay ghi đè/, 'hỏi trước khi ghi đè');
    await p
      .getByRole('tab', { name: 'Lấy bản mới' })
      .first()
      .click({ timeout: 6000 })
      .catch(async () => {
        await p.getByText('Lấy bản mới', { exact: true }).first().click({ timeout: 6000 });
      });
    await settle(p);
    await click(p, /^Thêm 1, ghi đè 1$/);
    await expectText(p, /Người Mới QA/, 'ngày mới có trong sổ');
    const after = (await body(p)).match(/(\d+) ngày giỗ ·/);
    if (before && after && Number(after[1]) !== Number(before[1]) + 1)
      throw new Error(`số ngày giỗ ${before[1]} → ${after[1]}`);
    s('thêm 1 ngày mới, ghi đè 1 ngày trùng theo lựa chọn, không mất ngày nào');
  },
);

await scenario(
  'U17',
  'Người mới hỏi Thành Tâm',
  'Hỏi bằng câu thường ngày, không dấu; có câu trả lời và mục liên quan; câu ngoài phạm vi nói rõ là chưa có',
  async (p, s) => {
    await seed(p);
    await go(p, '/ask');
    await p.getByPlaceholder('Ví dụ: giỗ tháng nhuận cúng ngày nào?').fill('mat thang nhuan gio the nao');
    await click(p, 'Hỏi');
    await expectText(p, /tháng thường cùng tên/, 'trả lời giỗ tháng nhuận');
    s('hỏi không dấu ra đúng câu trả lời');
    await p.getByPlaceholder('Ví dụ: giỗ tháng nhuận cúng ngày nào?').fill('cách nấu phở bò');
    await click(p, 'Hỏi');
    await expectText(p, /chưa có câu trả lời chắc chắn/, 'không trả lời bừa');
    s('câu ngoài phạm vi: nói rõ chưa có');
  },
);

await scenario(
  'U18',
  'Nghe chư Tăng tụng ngay trong app',
  'Video YouTube phát trong app (không chuyển sang YouTube), chữ kinh ở dưới để đọc theo',
  async (p, s) => {
    await seed(p);
    await go(p, '/chant/bat-nha');
    await click(p, /Nghe chư Tăng tụng, đọc theo/);
    await p.waitForSelector('iframe[src*="youtube-nocookie.com/embed/"]', { timeout: 15000 });
    await expectText(p, /Quán Tự Tại Bồ tát/, 'chữ kinh để đọc theo');
    if (!p.url().includes('/video')) throw new Error('không ở trong app');
    s('trình phát nhúng, chữ kinh bên dưới');
  },
);

await browser.close();
const pass = results.filter((r) => r.pass).length;
const md = [
  `# UAT Thành Tâm: ${pass}/${results.length} đạt`,
  '',
  '| Mã | Người dùng | Mục tiêu | Kết quả | Ghi chú |',
  '|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| ${r.id} | ${r.who} | ${r.goal} | ${r.pass ? 'Đạt' : '**Trượt**'} | ${(r.error ?? r.steps.join('; ')).replace(/\|/g, '/')} |`,
  ),
];
fs.writeFileSync(path.join(outDir, 'summary.md'), md.join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 1));
console.log(md.join('\n'));
process.exit(0);
