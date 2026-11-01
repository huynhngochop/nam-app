#!/usr/bin/env bash
# Chạy Thành Tâm bản release trên Android emulator, đổi cỡ màn để giả lập nhiều loại máy, chụp từng màn qua deep link.
# Dùng: bash qa/native/android.sh <apk> <outDir>
set -u
APK="$1"
OUT="$2"
PKG=vn.namapp.thanhtam
mkdir -p "$OUT/shots"
LOG="$OUT/run.log"
: >"$LOG"
say() { echo "$*" | tee -a "$LOG"; }

adb wait-for-device
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
# Máy ảo quá tải làm trình khởi chạy treo, hiện hộp "Pixel Launcher isn't responding" đè lên ảnh: tắt nó và ẩn hộp báo lỗi.
adb shell settings put global hide_error_dialogs 1
adb shell pm disable-user --user 0 com.google.android.apps.nexuslauncher >/dev/null 2>&1
adb install -r "$APK" >>"$LOG" 2>&1 || { say "CÀI APK THẤT BẠI"; exit 1; }
adb logcat -c

open_url() {
  adb shell am start -W -a android.intent.action.VIEW -d "$1" "$PKG" >/dev/null 2>&1
}
alive() { adb shell pidof "$PKG" >/dev/null 2>&1; }

# 1) Mở app lần đầu (đo thời gian khởi động lạnh) rồi nạp dữ liệu
START=$(adb shell am start -W -n "$PKG/.MainActivity" 2>/dev/null | grep -E "TotalTime|WaitTime" | tr '\r\n' '  ')
say "KHỞI ĐỘNG LẠNH: $START"
sleep 6
adb exec-out screencap -p >"$OUT/shots/00-first-open.png"
open_url "thanhtam://qa-seed?small=1"
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb shell cat /sdcard/ui.xml 2>/dev/null; }
SEEDLINE=""
for i in $(seq 1 60); do
  sleep 1
  SEEDLINE=$(ui | grep -o 'QA_SEED_[A-Z]* [^"]*' | head -1)
  [ -n "$SEEDLINE" ] && break
done
adb exec-out screencap -p >"$OUT/shots/01-seed.png"
say "SEED: $SEEDLINE"

ROUTES=$(node -e 'const r=require(process.argv[1]);for(const[k,v]of Object.entries(r))if(k!=="_")console.log(k+" "+v)' "$PWD/qa/thanh-tam-routes.json")

# 2) Mỗi cấu hình màn: tên | kích thước px | mật độ | xoay | cỡ chữ | nền tối
PROFILES=(
  "phone|1080x2400|420|0|1.0|no"
  "phone-small|720x1280|320|0|1.0|no"
  "phone-font200|1080x2400|420|0|2.0|no"
  "phone-land|1080x2400|420|1|1.0|no"
  "fold-cover|904x2316|420|0|1.0|no"
  "fold-open|1812x2176|420|0|1.0|no"
  "fold-open-land|1812x2176|420|1|1.0|no"
  "tablet|1600x2560|320|0|1.0|no"
  "tablet-land|1600x2560|320|1|1.0|no"
  "phone-dark|1080x2400|420|0|1.0|yes"
)
adb shell settings put system accelerometer_rotation 0
for P in "${PROFILES[@]}"; do
  IFS='|' read -r NAME SIZE DENS ROT FONT DARK <<<"$P"
  adb shell wm size "$SIZE"
  adb shell wm density "$DENS"
  adb shell settings put system user_rotation "$ROT"
  adb shell settings put system font_scale "$FONT"
  if [ "$DARK" = yes ]; then adb shell cmd uimode night yes; else adb shell cmd uimode night no; fi
  sleep 3
  say "== $NAME ($SIZE @$DENS, xoay $ROT, chữ $FONT, tối $DARK)"
  while read -r KEY ROUTE <&3; do
    [ -z "$KEY" ] && continue
    # chỉ chụp đủ mọi màn ở cấu hình chính; các cấu hình khác chụp màn đại diện
    if [ "$NAME" != phone ] && ! echo " today rituals calendar ritual prayer pray anniversaries age face-step settings anniversary-edit people-edit " | grep -q " $KEY "; then continue; fi
    open_url "thanhtam:/${ROUTE}"
    sleep 2.5
    if ! alive; then
      say "  SẬP ở $KEY ($ROUTE)"
      adb logcat -d -b crash >>"$OUT/crash-$NAME-$KEY.txt" 2>&1
      adb shell am start -n "$PKG/.MainActivity" >/dev/null 2>&1
      sleep 5
      continue
    fi
    adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1
    adb exec-out screencap -p >"$OUT/shots/$NAME-$KEY.png"
    say "  ok $KEY"
  done 3<<<"$ROUTES"
done
adb shell wm size reset
adb shell wm density reset
adb shell settings put system font_scale 1.0
adb shell settings put system user_rotation 0

# 3) Gập/mở liên tục khi đang ở màn văn khấn (đổi cấu hình nóng, không khởi động lại Activity)
open_url "thanhtam://ritual/mung-1-ram/prayer"
sleep 3
PID0=$(adb shell pidof "$PKG")
for i in 1 2 3 4 5; do
  adb shell wm size 1812x2176; sleep 1.2
  adb shell wm size 904x2316; sleep 1.2
done
adb shell wm size reset
sleep 2
PID1=$(adb shell pidof "$PKG")
adb exec-out screencap -p >"$OUT/shots/zz-after-fold-cycles.png"
say "GẬP/MỞ 5 LẦN: pid trước $PID0, sau $PID1 $([ "$PID0" = "$PID1" ] && echo '(giữ nguyên, không sập)' || echo '(KHÁC: app đã khởi động lại hoặc sập)')"

# 4) Dữ liệu cực lớn: 1.000 ngày giỗ, 60 người. Cuộn Sổ giỗ và Lịch, đo khung hình giật.
open_url "thanhtam://qa-seed"
sleep 12
adb exec-out screencap -p >"$OUT/shots/big-01-seed.png"
for KEY in anniversaries calendar today age; do
  ROUTE=$(grep "^$KEY " <<<"$ROUTES" | cut -d' ' -f2)
  adb shell dumpsys gfxinfo "$PKG" reset >/dev/null 2>&1
  T0=$(date +%s%N)
  open_url "thanhtam:/${ROUTE}"
  sleep 3
  for i in 1 2 3 4 5 6; do adb shell input swipe 540 1800 540 500 250; sleep 0.4; done
  adb exec-out screencap -p >"$OUT/shots/big-$KEY.png"
  J=$(adb shell dumpsys gfxinfo "$PKG" | grep -E "Total frames rendered|Janky frames" | tr -s ' ' | tr '\n' ' ')
  say "DỮ LIỆU LỚN $KEY: $J $(alive && echo '(đang chạy)' || echo '(SẬP)')"
done

# 5) Bộ nhớ và lỗi JS
say "BỘ NHỚ: $(adb shell dumpsys meminfo "$PKG" | grep -E 'TOTAL PSS|TOTAL:' | head -1)"
adb logcat -d -s ReactNativeJS:V ReactNative:V AndroidRuntime:E >"$OUT/logcat.txt" 2>&1
adb logcat -d -b crash >"$OUT/crash.txt" 2>&1
say "LỖI JS: $(grep -c -E 'ReactNativeJS.*(Error|TypeError|Invariant)' "$OUT/logcat.txt")"
say "SẬP NATIVE: $(grep -c 'FATAL EXCEPTION' "$OUT/crash.txt")"
exit 0
