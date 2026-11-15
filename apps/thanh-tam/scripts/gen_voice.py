"""Tạo giọng đọc mẫu cho văn khấn và kinh (chạy trên CI, không chạy trong app).

Giọng chọn theo `engine` mỗi bài (VOICE_ENGINE trong src/lib/voiceCues.ts, cũng nằm trong mã băm):
- google-chirp3hd-<tên>: Google Cloud Text-to-Speech, giọng vi-VN-Chirp3-HD-<Tên>. Cần biến GOOGLE_TTS_KEY.
- piper: Piper (MIT), mô hình vi_VN-vais1000-medium (dữ liệu VAIS-1000, CC BY 4.0). Cần tệp mô hình.
Vào: voice-text.json (scripts/voice-text.ts). Ra: <out>/<id>.m4a và manifest.json
  manifest = {v, voice, credit, items: {id: {file, bytes, ms, hash, cues: [[bắt_đầu_ms, dài_ms], ...]}}}

Nhịp "như người khấn": mỗi câu (cue) tạo riêng, cắt lặng thừa hai đầu, rồi tự chèn khoảng nghỉ:
ngắt hơi ở dấu phẩy, nghỉ giữa câu, nghỉ dài giữa đoạn; câu niệm "Nam mô ..." đọc chậm hơn.
Mốc thời gian từng câu ghi vào manifest để app tô sáng đúng câu đang đọc.
Chỗ người khấn tự đọc (tên, địa chỉ) là khoảng lặng để người dùng đọc theo.

Dùng: python3 gen_voice.py voice-text.json <mô_hình_piper.onnx|-> out/ [chỉ_tạo_id ...]
"""
import base64
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave

RATE = 24000
GAP_MS = {'kinh': 300, 'khan': 650}  # giữa hai câu trong một đoạn
PARA_GAP_MS = {'kinh': 300, 'khan': 1100}  # giữa hai đoạn văn khấn
COMMA_MS = {'kinh': 160, 'khan': 330}  # ngắt hơi ở dấu phẩy
FIELD_MS = 2400  # chỗ người khấn tự đọc tên, địa chỉ
NIEM = re.compile(r'^\s*nam\s+m[ôo]\b', re.I)  # câu niệm Phật: đọc chậm, ngân


def silence(ms):
    return b'\x00\x00' * int(RATE * ms / 1000)


def trim(pcm, thr=350, keep_ms=35):
    """Cắt lặng thừa hai đầu (giọng máy hay để sẵn 0,1–0,3 giây) để nhịp do mình quyết định."""
    n = len(pcm) // 2
    if n == 0:
        return pcm
    import array

    a = array.array('h')
    a.frombytes(pcm)
    lo = next((i for i in range(n) if abs(a[i]) > thr), 0)
    hi = next((i for i in range(n - 1, -1, -1) if abs(a[i]) > thr), n - 1)
    k = int(RATE * keep_ms / 1000)
    lo, hi = max(0, lo - k), min(n, hi + k)
    return a[lo:hi].tobytes()


def wav_pcm(data):
    with wave.open(io.BytesIO(data), 'rb') as r:
        assert r.getframerate() == RATE and r.getsampwidth() == 2 and r.getnchannels() == 1, 'sai định dạng âm'
        return r.readframes(r.getnframes())


class Google:
    def __init__(self, engine):
        key = os.environ.get('GOOGLE_TTS_KEY', '').strip()
        if not key:
            sys.exit('Thiếu GOOGLE_TTS_KEY (khóa API Google Cloud Text-to-Speech)')
        self.key = key
        name = engine.split('-')[-1].capitalize()
        self.voice = f'vi-VN-Chirp3-HD-{name}'
        self.cache = {}
        self.calls = 0
        self.chars = 0

    def say(self, text, pace):
        rate = round(1 / pace, 3)
        k = (text, rate)
        if k in self.cache:
            return self.cache[k]
        body = json.dumps(
            {
                'input': {'text': text},
                'voice': {'languageCode': 'vi-VN', 'name': self.voice},
                'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': RATE, 'speakingRate': rate},
            }
        ).encode()
        for n in range(6):
            req = urllib.request.Request(
                'https://texttospeech.googleapis.com/v1/text:synthesize',
                data=body,
                headers={'Content-Type': 'application/json', 'X-Goog-Api-Key': self.key},
            )
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    pcm = trim(wav_pcm(base64.b64decode(json.load(r)['audioContent'])))
                break
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors='replace')[:300]
                if e.code in (429, 500, 502, 503, 504) and n < 5:
                    time.sleep(2 ** n)
                    continue
                sys.exit(f'Google TTS lỗi {e.code}: {msg}')
            except (urllib.error.URLError, TimeoutError):
                if n < 5:
                    time.sleep(2 ** n)
                    continue
                raise
        self.calls += 1
        self.chars += len(text)
        self.cache[k] = pcm
        return pcm


class Piper:
    def __init__(self, model):
        from piper import PiperVoice

        self.v = PiperVoice.load(model)

    def say(self, text, pace):
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as w:
            try:
                from piper import SynthesisConfig

                self.v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=pace))
            except ImportError:
                self.v.synthesize(text, w, length_scale=pace)
        buf.seek(0)
        with wave.open(buf, 'rb') as r:
            pcm = r.readframes(r.getnframes())
            if r.getframerate() != RATE:  # đổi tần số mẫu bằng ffmpeg
                p = subprocess.run(
                    ['ffmpeg', '-loglevel', 'error', '-f', 's16le', '-ar', str(r.getframerate()), '-ac', '1', '-i', '-',
                     '-f', 's16le', '-ar', str(RATE), '-'],
                    input=pcm, capture_output=True, check=True)
                pcm = p.stdout
        return trim(pcm)


def phrases(text):
    """Tách câu ở dấu phẩy, chấm phẩy, hai chấm để ngắt hơi như người khấn."""
    parts = [x.strip() for x in re.split(r'(?<=[,;:])\s+', text) if x.strip()]
    return parts or [text]


def speak(tts, text, kind, pace):
    if NIEM.match(text):
        pace = pace * 1.15
    out = bytearray()
    for i, ph in enumerate(phrases(text)):
        if i:
            out += silence(COMMA_MS[kind])
        out += tts.say(ph, pace)
    return bytes(out)


def main():
    src, model, out = sys.argv[1], sys.argv[2], sys.argv[3]
    only = set(sys.argv[4:])
    os.makedirs(out, exist_ok=True)
    items = json.load(open(src, encoding='utf-8'))
    engine = items[0].get('engine', 'piper')
    if engine.startswith('google'):
        tts = Google(engine)
        voice, credit = tts.voice, 'Giọng đọc mẫu tạo sẵn bằng Google Cloud Text-to-Speech (giọng Chirp 3 HD tiếng Việt).'
    else:
        tts = Piper(model)
        voice = 'vi_VN-vais1000-medium'
        credit = 'Giọng đọc tạo bằng Piper (MIT) với mô hình vi_VN-vais1000, dữ liệu VAIS-1000 (CC BY 4.0).'
    manifest = {'v': 1, 'voice': voice, 'credit': credit, 'items': {}}
    for it in items:
        if only and it['id'] not in only:
            continue
        kind = it['kind']
        pcm = bytearray(silence(250))
        cues = []
        last_p = None
        for c in it['cues']:
            if cues:
                pcm += silence(PARA_GAP_MS[kind] if c['p'] != last_p else GAP_MS[kind])
            start = len(pcm) // 2 * 1000 // RATE
            pcm += speak(tts, c['text'], kind, it['pace']) if c.get('text') else silence(FIELD_MS)
            cues.append([start, len(pcm) // 2 * 1000 // RATE - start])
            last_p = c['p']
        pcm += silence(600)
        wav = os.path.join(out, it['id'] + '.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(bytes(pcm))
        m4a = os.path.join(out, it['id'] + '.m4a')
        subprocess.run(
            ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ac', '1', '-ar', str(RATE),
             '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', m4a],
            check=True,
        )
        os.remove(wav)
        ms = len(pcm) // 2 * 1000 // RATE
        manifest['items'][it['id']] = {'file': it['id'] + '.m4a', 'bytes': os.path.getsize(m4a), 'ms': ms, 'hash': it['hash'], 'cues': cues}
        print(f"{it['id']}: {len(cues)} câu, {ms / 1000:.0f} s, {os.path.getsize(m4a) / 1024:.0f} KB", flush=True)
    if isinstance(tts, Google):
        print(f'Google TTS: {tts.calls} lượt gọi, {tts.chars} ký tự (miễn phí tới 1 triệu ký tự mỗi tháng)')
    with open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False)


main()
