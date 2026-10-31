#!/usr/bin/env bash
# Chạy Thành Tâm bản release trên iOS Simulator: iPhone SE, iPhone Pro Max, iPad mini, iPad Pro 13.
# Chụp từng màn qua deep link, cả chữ cỡ lớn nhất và nền tối.
# Dùng: bash qa/native/ios.sh <App.app> <outDir>
set -u
APP="$1"
OUT="$2"
BUNDLE=vn.namapp.thanhtam
mkdir -p "$OUT/shots"
LOG="$OUT/run.log"
: >"$LOG"
say() { echo "$*" | tee -a "$LOG"; }

ROUTES=$(node -e 'const r=require(process.argv[1]);for(const[k,v]of Object.entries(r))if(k!=="_")console.log(k+" "+v)' "$PWD/qa/thanh-tam-routes.json")
RUNTIME=$(xcrun simctl list runtimes -j | node -e 'const j=JSON.parse(require("fs").readFileSync(0));const r=j.runtimes.filter(x=>x.isAvailable&&/iOS/.test(x.name)).pop();console.log(r.identifier)')
say "RUNTIME: $RUNTIME"
TYPES=$(xcrun simctl list devicetypes -j)
typeid() { echo "$TYPES" | node -e 'const j=JSON.parse(require("fs").readFileSync(0));const re=new RegExp(process.argv[1]);const t=j.devicetypes.filter(d=>re.test(d.name)).pop();console.log(t?t.identifier:"")' "$1"; }

DEVICES=(
  "iphone-se|^iPhone SE"
  "iphone-pro-max|^iPhone 1[5-7] Pro Max$"
  "ipad-mini|^iPad mini"
  "ipad-pro-13|^iPad Pro 13-inch"
)
for D in "${DEVICES[@]}"; do
  IFS='|' read -r NAME RE <<<"$D"
  T=$(typeid "$RE")
  if [ -z "$T" ]; then say "== $NAME: không có loại máy này trên runner"; continue; fi
  UDID=$(xcrun simctl create "qa-$NAME" "$T" "$RUNTIME")
  xcrun simctl boot "$UDID"
  xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1
  xcrun simctl install "$UDID" "$APP"
  say "== $NAME ($T)"
  T0=$(date +%s)
  xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null
  sleep 8
  say "  mở lạnh + 8 s chờ: $(($(date +%s) - T0)) s"
  xcrun simctl io "$UDID" screenshot "$OUT/shots/$NAME-00-first-open.png" >/dev/null 2>&1
  xcrun simctl openurl "$UDID" "thanhtam://qa-seed?small=1"
  sleep 10
  xcrun simctl io "$UDID" screenshot "$OUT/shots/$NAME-01-seed.png" >/dev/null 2>&1
  for PASS in normal bigtext dark; do
    case $PASS in
      normal) xcrun simctl ui "$UDID" appearance light; xcrun simctl ui "$UDID" content_size large ;;
      bigtext) xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large ;;
      dark) xcrun simctl ui "$UDID" content_size large; xcrun simctl ui "$UDID" appearance dark ;;
    esac
    while read -r KEY ROUTE; do
      [ -z "$KEY" ] && continue
      if [ "$PASS" != normal ] && ! echo " today ritual prayer pray calendar age anniversary-edit settings " | grep -q " $KEY "; then continue; fi
      if [ "$NAME" != iphone-pro-max ] && [ "$PASS" = normal ] && ! echo " today rituals calendar ritual prayer pray anniversaries age face-step settings people-edit " | grep -q " $KEY "; then continue; fi
      xcrun simctl openurl "$UDID" "thanhtam:/${ROUTE}" 2>>"$LOG"
      sleep 2.5
      if ! xcrun simctl spawn "$UDID" launchctl list 2>/dev/null | grep -q "$BUNDLE"; then
        say "  SẬP ở $PASS/$KEY"
        xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null; sleep 6
        continue
      fi
      xcrun simctl io "$UDID" screenshot "$OUT/shots/$NAME-$PASS-$KEY.png" >/dev/null 2>&1
    done <<<"$ROUTES"
    say "  xong lượt $PASS"
  done
  xcrun simctl spawn "$UDID" log show --last 15m --predicate 'process CONTAINS "Thanh" OR subsystem CONTAINS "com.facebook.react"' --style compact >"$OUT/log-$NAME.txt" 2>/dev/null
  say "  dòng lỗi JS: $(grep -c -E 'TypeError|ReferenceError|Invariant Violation|Unhandled JS Exception' "$OUT/log-$NAME.txt")"
  xcrun simctl shutdown "$UDID"
done
say "BÁO CÁO SẬP: $(ls ~/Library/Logs/DiagnosticReports 2>/dev/null | grep -ci thanh)"
cp ~/Library/Logs/DiagnosticReports/*hanh* "$OUT/" 2>/dev/null
exit 0
