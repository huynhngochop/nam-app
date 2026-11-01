// Chỉ cho bản web QA (CI): sửa lỗi của expo-sqlite bản web khi trả kết quả đồng bộ từ worker.
//
// Worker ghi độ dài kết quả bằng `uint8.set(new Uint32Array([length]), 0)`. Lệnh này chép từng PHẦN TỬ
// (giá trị bị cắt về 1 byte), không chép 4 byte của số, nên luồng chính đọc được `length % 256`.
// Kết quả nào dài hơn 255 byte (gần như mọi danh sách giao dịch) bị cắt cụt → JSON.parse lỗi →
// màn danh sách trống. Bản Android / iOS không dùng đường này nên không bị.
//
// Sửa: chép đúng 4 byte của số nguyên. Dùng: node qa/patch-sqlite-web.mjs (sau npm ci).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('node_modules/expo-sqlite');
const bad = /\.set\(new Uint32Array\(\[([A-Za-z_$][\w$]*)\]\),\s*0\)/g;
let patched = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p);
    } else if (/\.(ts|js|mjs)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      if (!bad.test(s)) continue;
      bad.lastIndex = 0;
      fs.writeFileSync(p, s.replace(bad, '.set(new Uint8Array(new Uint32Array([$1]).buffer), 0)'));
      console.log('đã vá', path.relative(process.cwd(), p));
      patched++;
    }
  }
};
walk(root);
if (!patched) {
  console.log('Không thấy đoạn cần vá — có thể expo-sqlite đã sửa lỗi này.');
}
