"""Tạo giọng đọc mẫu cho văn khấn và kinh (chạy trên CI, không chạy trong app).

Giọng: Piper (MIT) với mô hình vi_VN-vais1000-medium, huấn luyện trên dữ liệu VAIS-1000 (CC BY 4.0).
Vào: voice-text.json (scripts/voice-text.ts). Ra: thư mục <out>/ gồm <id>.m4a và manifest.json
  manifest = {v, voice, credit, items: {id: {file, bytes, ms, hash, cues: [[bắt_đầu_ms, dài_ms], ...]}}}
Mỗi câu (cue) tạo riêng rồi nối lại, giữa các câu có khoảng lặng; chỗ cần người khấn tự đọc (tên, địa chỉ)
là khoảng lặng 2,4 giây để người dùng đọc theo hoặc để app đọc tên bằng giọng máy.

Dùng: python3 gen_voice.py voice-text.json model.onnx out/ [chỉ_tạo_id ...]
"""
import io
import json
import os
import subprocess
import sys
import wave

from piper import PiperVoice

try:  # piper-tts >= 1.3
    from piper import SynthesisConfig
except ImportError:  # bản cũ
    SynthesisConfig = None

GAP_MS = {'kinh': 280, 'khan': 420}
PARA_GAP_MS = 650
FIELD_MS = 2400


def synth(voice, text, pace):
    """Trả về (khung âm int16 dạng bytes, tần số mẫu)."""
    if SynthesisConfig is not None and hasattr(voice, 'synthesize_wav'):
        cfg = SynthesisConfig(length_scale=pace)
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as w:
            voice.synthesize_wav(text, w, syn_config=cfg)
    else:
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as w:
            voice.synthesize(text, w, length_scale=pace)
    buf.seek(0)
    with wave.open(buf, 'rb') as r:
        return r.readframes(r.getnframes()), r.getframerate()


def silence(ms, rate):
    return b'\x00\x00' * int(rate * ms / 1000)


def main():
    src, model, out = sys.argv[1], sys.argv[2], sys.argv[3]
    only = set(sys.argv[4:])
    os.makedirs(out, exist_ok=True)
    voice = PiperVoice.load(model)
    items = json.load(open(src, encoding='utf-8'))
    man_path = os.path.join(out, 'manifest.json')
    manifest = {
        'v': 1,
        'voice': 'vi_VN-vais1000-medium',
        'credit': 'Giọng đọc tạo bằng Piper (MIT) với mô hình vi_VN-vais1000, dữ liệu VAIS-1000 (CC BY 4.0).',
        'items': {},
    }
    for it in items:
        if only and it['id'] not in only:
            continue
        pcm = bytearray()
        rate = None
        cues = []
        last_p = None
        for c in it['cues']:
            if rate is None:
                _, rate = synth(voice, 'a', it['pace'])
            if cues:
                gap = PARA_GAP_MS if (it['kind'] == 'khan' and c['p'] != last_p) else GAP_MS[it['kind']]
                pcm += silence(gap, rate)
            start = len(pcm) // 2 * 1000 // rate
            if c.get('text'):
                frames, _ = synth(voice, c['text'], it['pace'])
                pcm += frames
            else:
                pcm += silence(FIELD_MS, rate)
            cues.append([start, len(pcm) // 2 * 1000 // rate - start])
            last_p = c['p']
        pcm += silence(500, rate)
        wav = os.path.join(out, it['id'] + '.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(bytes(pcm))
        m4a = os.path.join(out, it['id'] + '.m4a')
        subprocess.run(
            ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-c:a', 'aac', '-b:a', '40k', '-movflags', '+faststart', m4a],
            check=True,
        )
        os.remove(wav)
        manifest['items'][it['id']] = {
            'file': it['id'] + '.m4a',
            'bytes': os.path.getsize(m4a),
            'ms': len(pcm) // 2 * 1000 // rate,
            'hash': it['hash'],
            'cues': cues,
        }
        print(f"{it['id']}: {len(cues)} câu, {manifest['items'][it['id']]['ms'] / 1000:.0f} s, {manifest['items'][it['id']]['bytes'] / 1024:.0f} KB", flush=True)
    with open(man_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False)


main()
