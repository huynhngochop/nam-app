#!/usr/bin/env bash
# Đóng giọng đọc AI của Thành Tâm vào bản cài trước khi build (gọi từ thanh-tam-qa.yml, chạy ở gốc repo).
# Nguồn: kho công khai 'voice' trên Supabase (hàm voice-tts đọc dần theo lượt miễn phí của Gemini).
# Văn khấn rồi kinh ngắn vào app tới ngân sách; bài còn lại ra voice-dl/ để đăng Releases (tham số "publish").
# Không bao giờ làm hỏng build: lỗi mạng hay chưa có bài nào thì giữ bản trống, app tải giọng mẫu như cũ.
set -uo pipefail
BASE=https://zmyniorgbzpconhyxhtu.supabase.co/storage/v1/object/public/voice
APP=apps/thanh-tam
TS=$APP/src/data/voiceBundle.ts

restore() {
  echo "::warning::Chưa đóng được giọng AI ($1): bản cài dùng giọng mẫu tải về như cũ"
  git checkout -- "$TS"
  rm -f "$APP"/assets/voice/*.m4a
  rm -rf voice-dl
  exit 0
}

command -v ffmpeg >/dev/null || sudo apt-get install -y -qq ffmpeg >/dev/null || restore "cài ffmpeg"
python3 -c 'import numpy' 2>/dev/null || python3 -m pip install -q --break-system-packages numpy || restore "cài numpy"
npx tsx "$APP/scripts/voice-text.ts" > voice-text.json || restore "xuất câu"
if [ "${1:-}" = publish ] && [ -n "${GH_TOKEN:-}" ]; then
  gh release download thanh-tam-voice -p manifest.json -O voice-old-manifest.json --clobber 2>/dev/null || true
  export VOICE_OLD_MANIFEST=voice-old-manifest.json
fi
VOICE_CACHE=.voice-cache python3 "$APP/scripts/voice_ai.py" bundle voice-text.json "$BASE" \
  "$APP/assets/voice" "$TS" voice-dl || restore "đóng gói"
npx prettier --write "$TS" >/dev/null 2>&1 || true

if [ "${1:-}" = publish ] && [ -n "${GH_TOKEN:-}" ] && ls voice-dl/*.m4a >/dev/null 2>&1; then
  # Bài để tải: tệp AI mới cùng manifest gộp (bài chưa đọc xong giữ tệp cũ).
  gh release upload thanh-tam-voice voice-dl/*.m4a voice-dl/manifest.json --clobber ||
    echo "::warning::Chưa đăng được giọng AI để tải"
fi
exit 0
