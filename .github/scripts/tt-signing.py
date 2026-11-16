"""Ký bản phát hành Thành Tâm bằng khóa tải lên (upload key) cho Google Play.

Đọc khóa từ biến môi trường (secret GitHub), ghi tệp khóa ra ngoài mã nguồn, rồi sửa android/app/build.gradle
(sinh từ expo prebuild) cho kiểu build release dùng khóa này thay khóa thử (debug).
Google Play ký lại bằng khóa ứng dụng của Google (Play App Signing), nên mất khóa tải lên vẫn xin đổi được.

Biến: ANDROID_UPLOAD_KEYSTORE_B64, ANDROID_UPLOAD_KEYSTORE_PASSWORD, ANDROID_UPLOAD_KEY_ALIAS (mặc định upload),
ANDROID_UPLOAD_KEY_PASSWORD (mặc định = mật khẩu kho khóa).
Dùng: python3 tt-signing.py apps/thanh-tam/android
"""
import base64
import os
import re
import sys

android = sys.argv[1]
b64 = os.environ.get('ANDROID_UPLOAD_KEYSTORE_B64', '').strip()
pw = os.environ.get('ANDROID_UPLOAD_KEYSTORE_PASSWORD', '')
if not b64 or not pw:
    sys.exit('Thiếu secret khóa ký (ANDROID_UPLOAD_KEYSTORE_B64, ANDROID_UPLOAD_KEYSTORE_PASSWORD)')
ks = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'upload.jks')
with open(ks, 'wb') as f:
    f.write(base64.b64decode(b64))
alias = os.environ.get('ANDROID_UPLOAD_KEY_ALIAS', 'upload') or 'upload'

gradle = os.path.join(android, 'app', 'build.gradle')
s = open(gradle, encoding='utf-8').read()
if 'signingConfigs.upload' not in s:
    s = s.replace(
        'signingConfigs {',
        'signingConfigs {\n        upload {\n'
        f'            storeFile file({ks!r})\n'
        "            storePassword System.getenv('ANDROID_UPLOAD_KEYSTORE_PASSWORD')\n"
        f'            keyAlias {alias!r}\n'
        "            keyPassword System.getenv('ANDROID_UPLOAD_KEY_PASSWORD') ?: System.getenv('ANDROID_UPLOAD_KEYSTORE_PASSWORD')\n"
        '        }',
        1,
    )
    m = re.search(r'release\s*\{[^{}]*?signingConfig\s+signingConfigs\.debug', s)
    if not m:
        sys.exit('Không tìm thấy khối buildTypes.release trong build.gradle')
    s = s[: m.start()] + m.group(0).replace('signingConfigs.debug', 'signingConfigs.upload') + s[m.end():]
    open(gradle, 'w', encoding='utf-8').write(s)
print('Bản release ký bằng khóa tải lên, bí danh', alias)
