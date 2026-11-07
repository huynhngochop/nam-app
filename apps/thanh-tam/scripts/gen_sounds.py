"""Tạo tiếng mõ và tiếng chuông bằng tổng hợp âm (tự làm, không dùng bản ghi của ai).

Dùng: python3 -I scripts/gen_sounds.py assets/sounds
"""
import math
import random
import struct
import sys
import wave

SR = 22050


def write(path, samples):
    peak = max(abs(x) for x in samples) or 1.0
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(x / peak * 0.89 * 32767)) for x in samples))


def mo():
    # Mõ gỗ: vài cộng hưởng ngắn của khối gỗ rỗng + tiếng gõ (nhiễu rất ngắn).
    random.seed(7)
    n = int(SR * 0.28)
    modes = [(520, 0.050, 1.0), (1180, 0.030, 0.45), (2050, 0.016, 0.22), (3300, 0.008, 0.10)]
    out = []
    for i in range(n):
        t = i / SR
        s = sum(a * math.exp(-t / d) * math.sin(2 * math.pi * f * t) for f, d, a in modes)
        s += (random.random() * 2 - 1) * 0.6 * math.exp(-t / 0.0025)
        out.append(s * min(1.0, i / 20))
    return out


def chuong():
    # Chuông gia trì / chuông bát: các họa âm không điều hòa, tắt chậm, hơi "đập" do hai tần số sát nhau.
    n = int(SR * 5.0)
    f0 = 196.0
    partials = [(1.0, 3.6, 1.0), (1.004, 3.4, 0.5), (2.71, 2.2, 0.55), (5.13, 1.2, 0.3), (8.21, 0.6, 0.16), (11.9, 0.3, 0.08)]
    out = []
    for i in range(n):
        t = i / SR
        s = sum(a * math.exp(-t / d) * math.sin(2 * math.pi * f0 * r * t) for r, d, a in partials)
        s += 0.4 * math.exp(-t / 0.004) * math.sin(2 * math.pi * 3100 * t)
        fade = min(1.0, (n - i) / (SR * 0.3))
        out.append(s * min(1.0, i / 30) * fade)
    return out


d = sys.argv[1]
write(f'{d}/mo.wav', mo())
write(f'{d}/chuong.wav', chuong())
