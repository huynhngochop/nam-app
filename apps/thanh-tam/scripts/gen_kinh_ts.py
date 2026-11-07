"""Sinh apps/thanh-tam/src/data/kinhText.ts từ kinh-all.json (tách bằng extract_kinh.py).

Nguồn chữ: kho github.com/phineas-pta/kinh_nhat_tung (Unlicense, phạm vi công cộng).
Dùng: python3 -I gen_kinh_ts.py kinh-all.json > kinhText.ts
"""
import json
import sys

d = json.load(open(sys.argv[1], encoding='utf-8'))
by = {x['file'].split('/')[-1].replace('.html', ''): x for x in d}

# id trong app ← tệp nguồn; title hiển thị; cách lấy dòng
MAP = [
    ('tan-lu-huong', 'tan-lu-huong', 'Tán Lư Hương', 'ke'),
    ('khai-kinh', 'khai-kinh-ke', 'Khai Kinh Kệ', 'ke'),
    ('bat-nha', 'bat-nha-tam-kinh', 'Bát Nhã Tâm Kinh', 'kinh'),
    ('dai-bi', 'chu-dai-bi', 'Chú Đại Bi', 'chu'),
    ('a-di-da', 'kinh-a-di-da', 'Kinh A Di Đà', 'kinh'),
    ('pho-mon', 'pham-pho-mon', 'Phẩm Phổ Môn', 'kinh'),
    ('vu-lan', 'kinh-vu-lan', 'Kinh Vu Lan', 'kinh'),
    ('tan-phat', 'tan-phat-a-di-da', 'Tán Phật A Di Đà', 'ke'),
    ('tam-quy-y', 'tam-quy-y', 'Tam Quy Y', 'ke'),
    ('hoi-huong', 'hoi-huong', 'Hồi Hướng', 'ke'),
]


def tidy(s):
    s = ' '.join(s.split())
    return s.replace('Ðạ', 'Đạ').replace('Ð', 'Đ')


out = {}
for app_id, src, title, kind in MAP:
    paras = []
    seen = set()
    for p in by[src]['paras']:
        if p['hv']:
            lines = [tidy(x) for x in p['hv']]
            vi = [tidy(x) for x in p['vi']]
        elif p['vi']:
            # chú: phần phiên âm Việt là phần tụng
            lines, vi = [tidy(x) for x in p['vi']], []
        else:
            continue  # đoạn chỉ có chữ Phạn: bỏ
        key = '|'.join(lines)
        if key in seen:
            continue
        seen.add(key)
        para = {'l': lines}
        if vi:
            para['vi'] = vi
        if p['kind'] == 'mantra':
            para['m'] = 1
        paras.append(para)
    out[app_id] = {'title': title, 'kind': kind, 'paras': paras}

w = sys.stdout.write
w('// Tệp sinh tự động bởi scripts/gen_kinh_ts.py, đừng sửa tay.\n')
w('// Chữ kinh: âm Hán Việt và bản dịch Việt từ kho "Kinh nhật tụng" (github.com/phineas-pta/kinh_nhat_tung),\n')
w('// phát hành theo Unlicense (phạm vi công cộng).\n')
w("import type { KinhPara } from './types';\n\n")
w('export const KINH_TEXT: Record<string, { title: string; kind: \'kinh\' | \'chu\' | \'ke\'; paras: KinhPara[] }> = ')
w(json.dumps(out, ensure_ascii=False, indent=1))
w(';\n')
