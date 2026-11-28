#!/usr/bin/env node
// Tải nội dung mới nhất từ nam-cloud (mẹo AI, câu trả lời cho câu hỏi người dùng) và đóng sẵn vào app
// (apps/<app>/src/data/cloud.json), để bản cài mới có ngay nội dung, kể cả khi không có mạng.
// Chạy trong CI trước khi build. Lỗi mạng / chưa xuất bản → giữ nguyên file cũ, không làm hỏng build.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = (process.env.EXPO_PUBLIC_NAM_CLOUD_URL || 'https://zmyniorgbzpconhyxhtu.supabase.co').replace(/\/+$/, '');
const APPS = { meonha: 'apps/meo-nha', thanhtam: 'apps/thanh-tam' };
const pub = `${BASE}/storage/v1/object/public/content/`;

async function json(path) {
  const r = await fetch(pub + path, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

let changed = 0;
for (const [app, dir] of Object.entries(APPS)) {
  const file = `${dir}/src/data/cloud.json`;
  if (!existsSync(file)) continue; // app không có trên nhánh này
  const cur = JSON.parse(readFileSync(file, 'utf8'));
  try {
    const m = await json(`${app}/manifest.json`);
    if (!m.full || m.full.version <= (cur.version ?? 0)) {
      console.log(`${app}: đã mới nhất (v${cur.version ?? 0})`);
      continue;
    }
    const full = await json(m.full.path);
    const items = (full.items ?? []).map(({ id, kind, topic, title, body, tags, updated_at }) => ({
      id,
      kind,
      topic,
      title,
      body,
      tags,
      updated_at,
    }));
    writeFileSync(file, JSON.stringify({ version: m.full.version, items }) + '\n');
    changed++;
    console.log(
      `${app}: v${cur.version ?? 0} → v${m.full.version} (${items.length} mục, ${new TextEncoder().encode(JSON.stringify(items)).length >> 10} KB)`,
    );
  } catch (e) {
    console.log(`${app}: giữ bản cũ (${e.message})`);
  }
}
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: 'a' });
