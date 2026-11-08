// Xuất danh sách câu của mọi bài để tạo giọng đọc mẫu (chạy trên CI): npx tsx apps/thanh-tam/scripts/voice-text.ts > voice-text.json
import { hashCues, voiceItems } from '../src/lib/voiceCues';

const items = voiceItems().map((it) => ({ ...it, hash: hashCues(it.cues, it.pace) }));
process.stdout.write(JSON.stringify(items));
