// Đo dung lượng bản cài Android theo phần (thư viện máy, mã Java, tài nguyên, mã JS) và chặn khi vượt ngân sách.
// Dùng: node .github/scripts/tt-apk-size.mjs <a.apk> <ngân sách MB> [<b.apk> <ngân sách MB> ...]
// Ghi bảng ra apk-size.md và tóm tắt của lượt chạy. Vượt ngân sách → thoát mã 1.
import fs from 'node:fs';

function entries(file) {
  const b = fs.readFileSync(file);
  // Bản ghi kết thúc thư mục zip (EOCD) nằm trong 64 KB cuối.
  let e = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) {
      e = i;
      break;
    }
  }
  if (e < 0) throw new Error(`${file}: không phải tệp zip`);
  const count = b.readUInt16LE(e + 10);
  let p = b.readUInt32LE(e + 16);
  const out = [];
  for (let n = 0; n < count; n++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error(`${file}: thư mục zip hỏng`);
    const comp = b.readUInt32LE(p + 20);
    const raw = b.readUInt32LE(p + 24);
    const nameLen = b.readUInt16LE(p + 28);
    const extra = b.readUInt16LE(p + 30);
    const comment = b.readUInt16LE(p + 32);
    out.push({ name: b.toString('utf8', p + 46, p + 46 + nameLen), comp, raw });
    p += 46 + nameLen + extra + comment;
  }
  return { size: b.length, list: out };
}

function group(name) {
  if (name.startsWith('lib/')) return `Thư viện máy (${name.split('/')[1]})`;
  if (/^classes\d*\.dex$/.test(name)) return 'Mã Java/Kotlin (dex)';
  if (name === 'assets/index.android.bundle') return 'Mã JS (Hermes)';
  if (name.startsWith('res/') || name === 'resources.arsc') return 'Tài nguyên (ảnh, phông, âm thanh)';
  if (name.startsWith('assets/')) return 'Tài nguyên khác (assets)';
  return 'Khác';
}

const mb = (x) => (x / 1048576).toFixed(1);
const args = process.argv.slice(2);
let md = '\n### Dung lượng bản cài\n';
let over = false;
for (let i = 0; i < args.length; i += 2) {
  const file = args[i];
  const budget = Number(args[i + 1]);
  const { size, list } = entries(file);
  const by = new Map();
  for (const x of list) by.set(group(x.name), (by.get(group(x.name)) ?? 0) + x.comp);
  const ok = size <= budget * 1048576;
  if (!ok) over = true;
  md += `\n**${file}: ${mb(size)} MB** (ngân sách ${budget} MB) ${ok ? 'đạt' : 'VƯỢT'}\n\n| Phần | MB trong tệp |\n| --- | --- |\n`;
  for (const [k, v] of [...by.entries()].sort((a, b) => b[1] - a[1])) md += `| ${k} | ${mb(v)} |\n`;
  const top = [...list].sort((a, b) => b.comp - a.comp).slice(0, 8);
  md += `\nTệp lớn nhất: ${top.map((x) => `${x.name} ${mb(x.comp)} MB`).join(', ')}\n`;
}
fs.writeFileSync('apk-size.md', md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
if (over) {
  console.error('Bản cài vượt ngân sách dung lượng. Xem bảng trên để biết phần nào tăng.');
  process.exit(1);
}
