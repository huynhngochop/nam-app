#!/bin/bash
# Mở thử APK trên máy ảo: cài, mở màn đầu, chờ 30 giây; app phải còn chạy và không có lỗi FATAL.
# Bắt lỗi khởi động do R8 bỏ nhầm lớp, thiếu module native, cấu hình manifest sai.
# Dùng: smoke-apk.sh <apk> <package>
set -u
apk="$1"
pkg="$2"
adb wait-for-device
adb logcat -c
adb install -r -g "$apk" > /tmp/install.txt 2>&1 || { echo "::error title=smoke $pkg::cài APK lỗi: $(tr '\n' ' ' < /tmp/install.txt)"; exit 1; }
adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
sleep 30
pid=$(adb shell pidof "$pkg" | tr -d '\r')
adb logcat -d > /tmp/logcat.txt
fatal=$(grep -A12 -E "FATAL EXCEPTION|AndroidRuntime: Process: $pkg" /tmp/logcat.txt | head -30 | tr '\n' ' ' | cut -c1-1500)
js=$(grep -E "ReactNativeJS.*(Error|Exception)|unknown module|Invariant Violation" /tmp/logcat.txt | head -5 | tr '\n' ' ' | cut -c1-800)
adb exec-out screencap -p > "smoke-$pkg.png" || true
if [ -z "$pid" ] || [ -n "$fatal" ]; then
  echo "::error title=smoke $pkg::app không chạy sau 30 giây. ${fatal} ${js}"
  exit 1
fi
echo "::notice title=smoke $pkg::đang chạy (pid $pid) sau 30 giây${js:+ · lỗi JS: $js}"
