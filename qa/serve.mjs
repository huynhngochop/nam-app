// Máy chủ tĩnh tối giản cho bản web đã export (output: single → mọi đường dẫn trả index.html).
// Gửi kèm COOP/COEP để expo-sqlite (wa-sqlite + SharedArrayBuffer) chạy được trên trình duyệt.
// Dùng: node qa/serve.mjs <thư mục dist> <cổng>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [root, port] = [path.resolve(process.argv[2]), Number(process.argv[3] || 8080)];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const html = file.replace(/\/$/, '') + '.html';
      file = fs.existsSync(html) ? html : path.join(root, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`serving ${root} on :${port}`));
