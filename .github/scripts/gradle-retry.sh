#!/usr/bin/env bash
# Chạy gradlew, thử lại tối đa 3 lần khi lỗi do mạng (GitHub hay Maven trả 502/503/504, hết giờ tải).
# Lỗi khác (lỗi biên dịch) dừng ngay, không thử lại.
# Dùng: bash .github/scripts/gradle-retry.sh <thư mục android> <tham số gradlew...>
set -uo pipefail
DIR="$1"
shift
LOG="$(mktemp)"
for n in 1 2 3; do
  (cd "$DIR" && ./gradlew "$@") >"$LOG" 2>&1
  code=$?
  tail -60 "$LOG"
  [ "$code" -eq 0 ] && exit 0
  if grep -qE "response code: 50[234]|status code 50[234]|Could not GET|Could not download|Read timed out|Connection reset|Gateway Time-out" "$LOG"; then
    echo "::warning::Lỗi mạng khi build (lần $n), đợi 90 giây rồi thử lại"
    sleep 90
  else
    exit "$code"
  fi
done
exit 1
