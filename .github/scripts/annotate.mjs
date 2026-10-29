// Chạy một lệnh, in output như bình thường, rồi đẩy phần cuối output thành annotation
// để xem được kết quả ngay trên trang Checks mà không cần mở log.
// Dùng: node .github/scripts/annotate.mjs "<tiêu đề>" <lệnh shell...>
import { spawnSync } from 'node:child_process';

const [title, ...cmd] = process.argv.slice(2);
const res = spawnSync(cmd.join(' '), { shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const out = (res.stdout || '') + (res.stderr || '');
process.stdout.write(out);

const code = res.status ?? 1;
const level = code === 0 ? 'notice' : 'error';
const esc = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const tail = out.slice(-24000);
const size = 3000;
const chunks = [];
for (let i = 0; i < tail.length; i += size) chunks.push(tail.slice(i, i + size));
if (chunks.length === 0) chunks.push('(không có output)');
chunks.slice(-8).forEach((c, i, all) => {
  console.log(`::${level} title=${esc(title)} [exit ${code}] ${i + 1}/${all.length}::${esc(c)}`);
});
process.exit(code);
