"""Tách phần âm Hán Việt (hoặc phiên âm chú) từ tệp của kho kinh_nhat_tung (Unlicense, phạm vi công cộng).

Dùng: python3 -I extract_kinh.py <tệp.html> [...] > out.json
Mỗi khối (.multi-lang / .wait-multi-lang / .mantra-seg) → một đoạn:
  - kinh, kệ: nối các <rt> thuộc phần lang="zh-Hant" (âm Hán Việt từng chữ); <br> = xuống dòng (giữ câu kệ)
  - chú: phần lang="vi" khi khối không có zh-Hant
"""
import json
import re
import sys
from html.parser import HTMLParser

VOID = {'br', 'img', 'hr', 'meta', 'link', 'input', 'wbr'}


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paras = []
        self.cur = None  # {'hv': [str|'\n'], 'vi': [str], 'kind'}
        self.stack = []  # (tag, lang) của các thẻ đang mở trong khối

    def lang(self):
        return self.stack[-1][1] if self.stack else ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class', '') or ''
        if self.cur is None:
            if 'multi-lang' in cls or 'mantra-seg' in cls:
                self.cur = {'hv': [], 'vi': [], 'kind': 'mantra' if 'mantra-seg' in cls else 'text'}
                self.stack = [(tag, a.get('lang', ''))]
            return
        if tag in VOID:
            if tag == 'br':
                if self.lang() == 'zh-Hant':
                    self.cur['hv'].append('\n')
                elif self.lang() == 'vi':
                    self.cur['vi'].append('\n')
            return
        self.stack.append((tag, a.get('lang', self.lang())))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.cur is None or tag in VOID:
            return
        # đóng tới thẻ khớp gần nhất (HTML lỏng)
        while self.stack:
            t, _ = self.stack.pop()
            if t == tag:
                break
        if not self.stack:
            self.paras.append(self.finish(self.cur))
            self.cur = None

    def handle_data(self, data):
        if self.cur is None:
            return
        top = self.stack[-1][0] if self.stack else ''
        if top == 'rt' and self.lang() == 'zh-Hant':
            self.cur['hv'].append(data.strip())
        elif self.lang() == 'vi' and top != 'rt':
            self.cur['vi'].append(data)

    @staticmethod
    def finish(c):
        lines, buf = [], []
        for x in c['hv'] + ['\n']:
            if x == '\n':
                s = ' '.join(w for w in buf if w)
                s = re.sub(r'\s+([,.;:!?”」])', r'\1', s).strip()
                if s:
                    lines.append(s)
                buf = []
            else:
                buf.append(x)
        vi_lines = [' '.join(l.split()) for l in ''.join(c['vi']).split('\n')]
        return {'kind': c['kind'], 'hv': lines, 'vi': [l for l in vi_lines if l]}


def main():
    out = []
    for path in sys.argv[1:]:
        raw = open(path, encoding='utf-8').read()
        m = re.search(r'^title:\s*(.+)$', raw, re.M)
        p = P()
        p.feed(raw)
        out.append({'file': path, 'title': m.group(1).strip() if m else '', 'paras': p.paras})
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)


main()
