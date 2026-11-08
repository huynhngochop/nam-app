#!/bin/bash
# Mở thử APK trên máy ảo: cài, mở màn đầu, chờ 30 giây; app phải còn chạy và không có lỗi FATAL.
# Bắt lỗi khởi động do R8 bỏ nhầm lớp, thiếu module native, cấu hình manifest sai.
# Sau đó mở lần lượt mọi màn hình bằng deep link (id không tồn tại để thử nhánh "không tìm thấy"),
# rồi thử nút Quay lại ở màn gốc. Dùng: smoke-apk.sh <apk> <package> [thư mục app]
set -u
apk="$1"
pkg="$2"
appdir="${3:-}"
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

# Ví Gọn: service đọc thông báo có trong app, bật được quyền, nhận một thông báo ngân hàng mà không lỗi.
if [ "$pkg" = "vn.namapp.vigon" ]; then
  comp="$pkg/vn.namapp.vigon.listener.BankNotificationService"
  reg=$(adb shell dumpsys package "$pkg" | grep -c BankNotificationService | tr -d '\r')
  adb shell cmd notification allow_listener "$comp" > /tmp/allow.txt 2>&1
  sleep 3
  bound=$(adb shell dumpsys notification | grep -c "vn.namapp.vigon.listener" | tr -d '\r')
  adb logcat -c
  adb shell cmd notification post -S bigtext -t "VCB" vigon-test "TK 0123 -120,000VND luc 10:00. ND: HIGHLANDS COFFEE" > /dev/null 2>&1
  sleep 8
  pid2=$(adb shell pidof "$pkg" | tr -d '\r')
  adb logcat -d > /tmp/logcat2.txt
  fatal2=$(grep -A8 "FATAL EXCEPTION" /tmp/logcat2.txt | head -12 | tr '\n' ' ' | cut -c1-900)
  if [ "$reg" = "0" ] || [ -z "$pid2" ] || [ -n "$fatal2" ]; then
    echo "::error title=listener $pkg::service trong package: $reg · đã gắn: $bound · app chạy: ${pid2:-không} · $(cat /tmp/allow.txt) ${fatal2}"
    exit 1
  fi
  echo "::notice title=listener $pkg::service có trong app ($reg), hệ thống đã gắn ($bound), nhận thông báo thử không lỗi"
fi

# Đi qua mọi màn hình: app phải còn chạy, không FATAL, không hiện màn lỗi (ErrorBoundary).
if [ -n "$appdir" ]; then
  scheme=$(grep -o '"scheme": *"[^"]*"' "$appdir/app.json" | sed 's/.*"\([^"]*\)"$/\1/')
  routes=$(cd "$appdir/app" && find . -name '*.tsx' ! -name '_layout.tsx' | sed -e 's#^\./##' -e 's#(tabs)/##' -e 's#\.tsx$##' -e 's#/\?index$##' -e 's#\[id\]#khong-ton-tai#' | sort)
  bad=""
  n=0
  adb logcat -c
  for r in $routes; do
    n=$((n + 1))
    adb shell am start -W -a android.intent.action.VIEW -d "$scheme://$r" "$pkg" > /dev/null 2>&1
    sleep 4
    if [ -z "$(adb shell pidof "$pkg" | tr -d '\r')" ]; then
      bad="$bad $r(văng)"
      adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
      sleep 8
      continue
    fi
    adb shell uiautomator dump /sdcard/ui.xml > /dev/null 2>&1
    if adb shell cat /sdcard/ui.xml 2>/dev/null | grep -q "Có lỗi khi mở màn hình này"; then bad="$bad $r(màn-lỗi)"; fi
  done
  adb logcat -d > /tmp/logcat3.txt
  fatal3=$(grep -A10 "FATAL EXCEPTION" /tmp/logcat3.txt | head -20 | tr '\n' ' ' | cut -c1-1200)
  js3=$(grep -E "ReactNativeJS.*(Error|Exception)|Invariant Violation" /tmp/logcat3.txt | sort -u | head -6 | tr '\n' ' ' | cut -c1-1200)
  if [ -n "$bad" ] || [ -n "$fatal3" ]; then
    echo "::error title=routes $pkg::$n màn, lỗi:$bad ${fatal3} ${js3}"
    exit 1
  fi
  echo "::notice title=routes $pkg::mở $n màn hình không văng, không màn lỗi${js3:+ · log JS: $js3}"

  # Quay lại ở màn gốc: mở lại app từ đầu, bấm Quay lại 2 lần liền → app rời màn hình.
  adb shell am force-stop "$pkg"
  adb shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 10
  adb shell input keyevent KEYCODE_BACK
  sleep 1
  adb shell input keyevent KEYCODE_BACK
  sleep 2
  top=$(adb shell dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity" | head -1 | tr -d '\r')
  if echo "$top" | grep -q "$pkg"; then
    echo "::error title=back $pkg::bấm Quay lại 2 lần ở màn đầu mà app vẫn ở trên cùng: $top"
    exit 1
  fi
  echo "::notice title=back $pkg::bấm Quay lại 2 lần ở màn đầu thì thoát app"
fi
