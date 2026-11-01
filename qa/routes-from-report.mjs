// Lấy danh sách màn từ report.json của vòng crawl (bỏ màn giới thiệu / đăng nhập / seed) cho qa/st.mjs.
// Dùng: node qa/routes-from-report.mjs <report.json> <routes.json>
import fs from 'node:fs';

const [src, dst] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(src, 'utf8'));
const list = r.routes.map((x) => x.route).filter((x) => x !== '/' && !/onboarding|welcome|auth|setup|qa-seed/.test(x));
fs.writeFileSync(dst, JSON.stringify(list));
console.log(list.length, 'màn:', list.join(' '));
