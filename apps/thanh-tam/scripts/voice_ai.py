"""Giọng đọc AI (Gemini) cho văn khấn và kinh: chia đoạn cho máy chủ đọc, rồi đóng bản đã đọc vào app.

Máy chủ: hàm voice-tts trên Supabase (server/supabase/functions/voice-tts) đọc từng đoạn theo lượt miễn phí,
lưu WAV công khai và <app>/jobs.json liệt kê đoạn đã xong.

  python3 voice_ai.py jobs voice-text.json ai-jobs.json
      Chia mỗi bài thành đoạn ≤ 700 ký tự theo ranh giới câu, mỗi câu một dòng, dòng trống giữa hai đoạn văn.
      Câu cần người khấn tự đọc (tên, địa chỉ) không gửi đi: lúc đóng gói sẽ chèn khoảng lặng.
      Văn khấn làm trước, kinh ngắn trước kinh dài. CI đăng tệp này ở Releases để máy chủ nạp.

  python3 voice_ai.py bundle voice-text.json <url_kho> <thư_mục_assets> <voiceBundle.ts> <thư_mục_tải>
      Tải các bài đã đọc đủ đoạn và khớp mã băm, căn mốc từng câu theo chỗ ngừng, chèn khoảng lặng ở chỗ
      tự đọc, chuẩn hóa âm lượng, nén AAC. Văn khấn rồi kinh ngắn vào bản cài cho tới BUNDLE_MB
      (sinh src/data/voiceBundle.ts: require từng tệp + mốc câu); bài còn lại vào <thư_mục_tải> kèm
      manifest.json để đăng ở Releases thanh-tam-voice, app tải khi người dùng chọn.
      Bài máy chủ chưa đọc xong thì bỏ qua: app vẫn tải giọng mẫu cũ cho bài đó.
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import urllib.request
import wave

LIMIT = 700  # ký tự mỗi đoạn: máy chủ phải đọc xong trong một lần gọi (≈150 giây)
RATE = 24000
FIELD_MS = 2400  # chỗ người khấn tự đọc tên, địa chỉ
PART_GAP_MS = 700  # nối hai đoạn của cùng một bài
LEAD_MS = 250  # khoảng lặng đầu bài
BUNDLE_MB = 11.0  # giọng AI trong bản cài (ngân sách APK 45 MB); bài vượt phần này thì để tải về
KBPS = 24  # AAC-LC một kênh 24 kHz: đủ rõ cho giọng nói
CREDIT = 'Giọng đọc mẫu tạo bằng AI (Google Gemini), đọc chậm, ngắt hơi như người khấn.'


def text_of(cue):
    return cue['text'].strip().lstrip(',;: ').strip() if 'text' in cue else ''


def make_jobs(items):
    khan = [i for i in items if i['kind'] == 'khan']
    kinh = sorted((i for i in items if i['kind'] == 'kinh'), key=lambda i: sum(len(text_of(c)) for c in i['cues']))
    jobs = []
    for rank, it in enumerate(khan + kinh):
        parts, cur, size = [], [], 0
        for idx, c in enumerate(it['cues']):
            t = text_of(c)
            if not t:
                continue
            if cur and size + len(t) > LIMIT:
                parts.append(cur)
                cur, size = [], 0
            cur.append((idx, t, c['p']))
            size += len(t) + 1
        if cur:
            parts.append(cur)
        for n, part in enumerate(parts):
            lines, prev = [], None
            for _, t, p in part:
                if prev is not None and p != prev:
                    lines.append('')
                lines.append(t)
                prev = p
            jobs.append({
                'id': f"{it['id']}.p{n + 1}", 'item': it['id'], 'part': n + 1, 'parts': len(parts),
                'kind': it['kind'], 'hash': it['hash'], 'script': '\n'.join(lines),
                'cues': [x[0] for x in part],
                'priority': (0 if it['kind'] == 'khan' else 1000) + rank * 10 + n,
            })
    return jobs


# ---------- căn mốc câu ----------

def frames_db(x, np):
    """Năng lượng từng khung 10 ms (dB)."""
    hop = RATE // 100
    n = len(x) // hop
    f = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((f * f).mean(axis=1) + 1e-9)
    return 20 * np.log10(rms + 1e-9)


def find_gaps(db, np):
    """Các quãng lặng ≥ 150 ms nằm giữa tiếng đọc: (khung đầu, khung cuối). Kèm khung đầu, cuối của tiếng."""
    thr = max(np.percentile(db, 95) - 32, np.percentile(db, 10) + 6)
    loud = db > thr
    idx = np.flatnonzero(loud)
    if len(idx) == 0:
        return [], 0, len(db)
    first, last = int(idx[0]), int(idx[-1])
    gaps, run = [], None
    for i in range(first, last + 1):
        if not loud[i]:
            run = i if run is None else run
        elif run is not None:
            if i - run >= 15:
                gaps.append((run, i))
            run = None
    return gaps, first, last + 1


def syllables(s):
    return max(1, len(s.split()))


def align(lines, paras, db, np):
    """Chọn L-1 chỗ cắt cho L dòng. Chỗ ngừng dài, gần vị trí ước theo số âm tiết thì được ưu tiên.
    Thiếu chỗ ngừng thì cắt ở vị trí ước. Trả về khung bắt đầu từng dòng và khung kết thúc dòng cuối."""
    gaps, first, end = find_gaps(db, np)
    L = len(lines)
    if L == 1:
        return [first], end
    w = [syllables(t) + 1 for t in lines]
    tot = sum(w)
    span = end - first
    expect = [first + span * sum(w[:k]) / tot for k in range(1, L)]
    unit = span / L  # độ dài trung bình một dòng (khung)
    cands = [((a + b) / 2, b - a) for a, b in gaps]
    K = L - 1
    NEG = -1e18
    # best[k][c]: điểm tốt nhất khi chỗ cắt thứ k dùng ứng viên c (c = len(cands) là cắt ảo ở vị trí ước)
    best = [[NEG] * (len(cands) + 1) for _ in range(K)]
    back = [[-1] * (len(cands) + 1) for _ in range(K)]

    def pos(k, c):
        return expect[k] if c == len(cands) else cands[c][0]

    def score(k, c):
        if c == len(cands):
            return -4.0
        center, length = cands[c]
        d = abs(center - expect[k]) / unit
        bonus = 0.6 if paras[k + 1] != paras[k] else 0.0
        return (1 + bonus) * math.log1p(length / 15) - 1.2 * d * d

    for c in range(len(cands) + 1):
        best[0][c] = score(0, c)
    for k in range(1, K):
        for c in range(len(cands) + 1):
            p = pos(k, c)
            s = score(k, c)
            for b in range(len(cands) + 1):
                if best[k - 1][b] > NEG and pos(k - 1, b) + 20 <= p and best[k - 1][b] + s > best[k][c]:
                    best[k][c] = best[k - 1][b] + s
                    back[k][c] = b
    c = max(range(len(cands) + 1), key=lambda i: best[K - 1][i])
    cuts = []
    for k in range(K - 1, -1, -1):
        cuts.append(pos(k, c))
        c = back[k][c]
    cuts.reverse()
    return [first] + [int(x) for x in cuts], end


def read_wav(path, np):
    with wave.open(path, 'rb') as r:
        assert r.getframerate() == RATE and r.getsampwidth() == 2 and r.getnchannels() == 1
        return np.frombuffer(r.readframes(r.getnframes()), dtype='<i2').astype(np.float32) / 32768


def fetch(url, dst=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'nam-app-ci'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    if dst:
        with open(dst, 'wb') as f:
            f.write(data)
    return data


def bundle(items, base, assets, ts_out, dl_dir):
    import numpy as np

    base = base.rstrip('/')
    man = json.loads(fetch(f'{base}/thanh-tam/jobs.json'))
    by_item = {}
    for j in man['jobs']:
        by_item.setdefault(j['item'], []).append(j)
    cache = os.environ.get('VOICE_CACHE', '.voice-cache')
    os.makedirs(cache, exist_ok=True)
    os.makedirs(assets, exist_ok=True)
    built = {}
    for it in items:
        parts = sorted(by_item.get(it['id'], []), key=lambda j: j['part'])
        if not parts or len(parts) != parts[0]['parts'] or any(j['hash'] != it['hash'] for j in parts):
            continue
        segs = {}  # chỉ số câu → mẫu âm
        for j in parts:
            local = os.path.join(cache, os.path.basename(j['file']))
            if not os.path.exists(local):
                fetch(f"{base}/{j['file']}", local)
            x = read_wav(local, np)
            db = frames_db(x, np)
            lines = [text_of(it['cues'][i]) for i in j['cues']]
            paras = [it['cues'][i]['p'] for i in j['cues']]
            starts, end = align(lines, paras, db, np)
            hop = RATE // 100
            pad = 5  # 50 ms
            bounds = [max(0, (starts[0] - pad))] + starts[1:] + [min(len(db), end + pad)]
            for k, ci in enumerate(j['cues']):
                segs[ci] = x[bounds[k] * hop: bounds[k + 1] * hop]
        out, cues, t = [np.zeros(RATE * LEAD_MS // 1000, np.float32)], [], LEAD_MS
        prev_part = None
        part_of = {ci: j['part'] for j in parts for ci in j['cues']}
        for ci, c in enumerate(it['cues']):
            if ci in segs:
                if prev_part is not None and part_of[ci] != prev_part:
                    out.append(np.zeros(RATE * PART_GAP_MS // 1000, np.float32))
                    t += PART_GAP_MS
                prev_part = part_of[ci]
                s = segs[ci]
                ms = round(len(s) * 1000 / RATE)
                out.append(s)
            else:
                ms = FIELD_MS if 'field' in c else 0
                out.append(np.zeros(RATE * ms // 1000, np.float32))
            cues.append([t, ms])
            t += ms
        out.append(np.zeros(RATE * 600 // 1000, np.float32))
        pcm = (np.clip(np.concatenate(out), -1, 1) * 32767).astype('<i2').tobytes()
        built[it['id']] = {'pcm': pcm, 'cues': cues, 'ms': t + 600, 'hash': it['hash']}

    prio = {j['item']: j['priority'] for j in man['jobs']}
    order = sorted(built, key=lambda i: prio.get(i, 1e9))
    os.makedirs(dl_dir, exist_ok=True)
    entries, downloads, used = {}, {}, 0
    for iid in order:
        b = built[iid]
        raw = os.path.join(cache, f'{iid}.pcm')
        with open(raw, 'wb') as f:
            f.write(b['pcm'])
        name = f"{iid}-{hashlib.sha1(b['pcm']).hexdigest()[:6]}.m4a"
        tmp = os.path.join(cache, name)
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', raw,
             '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ar', str(RATE), '-c:a', 'aac', '-b:a', f'{KBPS}k',
             '-movflags', '+faststart', tmp],
            check=True,
        )
        size = os.path.getsize(tmp)
        entry = {'file': name, 'bytes': size, 'ms': b['ms'], 'hash': b['hash'], 'cues': b['cues']}
        # Bài đã vượt phần bản cài thì các bài sau cũng để tải, giữ thứ tự ưu tiên dễ đoán.
        if not downloads and used + size <= BUNDLE_MB * 1048576:
            os.replace(tmp, os.path.join(assets, name))
            entries[iid] = entry
            used += size
        else:
            os.replace(tmp, os.path.join(dl_dir, name))
            downloads[iid] = entry
    for f in os.listdir(assets):
        if f.endswith('.m4a') and f not in {e['file'] for e in entries.values()}:
            os.remove(os.path.join(assets, f))
    # Bài máy chủ chưa đọc xong: giữ bản tải cũ (tệp vẫn nằm ở Releases) để app vẫn tải được.
    old = os.environ.get('VOICE_OLD_MANIFEST')
    keep = {}
    if old and os.path.exists(old):
        prev = json.load(open(old, encoding='utf-8')).get('items', {})
        keep = {i: e for i, e in prev.items() if i not in built}
    with open(os.path.join(dl_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump({'v': 2, 'voice': 'gemini', 'credit': CREDIT, 'items': {**keep, **downloads}}, f,
                  ensure_ascii=False)
    rel = os.path.relpath(assets, os.path.dirname(ts_out)).replace(os.sep, '/')
    rel = rel if rel.startswith('.') else f'./{rel}'
    rows = []
    for iid in sorted(entries):
        e = entries[iid]
        rows.append(
            f"  '{iid}': {{ asset: require('{rel}/{e['file']}'), bytes: {e['bytes']}, ms: {e['ms']}, "
            f"hash: '{e['hash']}', cues: {json.dumps(e['cues'], separators=(',', ':'))} }},"
        )
    credit = CREDIT if entries else ''
    ts = (
        "// Sinh tự động trên CI (apps/thanh-tam/scripts/voice_ai.py bundle), không sửa tay.\n"
        "// Giọng đọc AI đóng sẵn trong bản cài; bản trong git để trống, app tải giọng mẫu qua mạng.\n"
        "import type { BundledVoices } from '../lib/voiceBundle';\n\n"
        f"export const VOICE_BUNDLE_CREDIT = {json.dumps(credit, ensure_ascii=False)};\n"
        "export const BUNDLED_VOICES: BundledVoices = {\n" + '\n'.join(rows) + "\n};\n"
    )
    with open(ts_out, 'w', encoding='utf-8') as f:
        f.write(ts)
    mb = used / 1048576
    dmb = sum(e['bytes'] for e in downloads.values()) / 1048576
    mins = sum(b['ms'] for b in built.values()) / 60000
    print(f'{len(built)}/{len(items)} bài xong ({mins:.0f} phút). Trong app: {len(entries)} bài, {mb:.1f} MB. '
          f'Để tải: {len(downloads)} bài, {dmb:.1f} MB')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as f:
            f.write(f"Giọng AI: trong app {len(entries)} bài ({mb:.1f} MB), để tải {len(downloads)} bài "
                    f"({dmb:.1f} MB); máy chủ xong {man['done']}/{man['total']} đoạn\n")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'jobs' and len(sys.argv) == 4:
        items = json.load(open(sys.argv[2], encoding='utf-8'))
        jobs = make_jobs(items)
        with open(sys.argv[3], 'w', encoding='utf-8') as f:
            json.dump(jobs, f, ensure_ascii=False)
        print(f'{len(jobs)} đoạn, {sum(len(j["script"]) for j in jobs)} ký tự')
    elif cmd == 'bundle' and len(sys.argv) == 7:
        items = json.load(open(sys.argv[2], encoding='utf-8'))
        bundle(items, sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
