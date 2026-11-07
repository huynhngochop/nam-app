// Đặt android.versionCode của Thành Tâm theo số lượt chạy CI, để bản sau cài đè được bản trước.
import fs from 'node:fs';

const f = 'apps/thanh-tam/app.json';
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
j.expo.android.versionCode = Number(process.argv[2]) || 1;
fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
console.log(`versionCode = ${j.expo.android.versionCode}`);
