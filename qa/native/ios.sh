#!/usr/bin/env bash
# Chạy Thành Tâm bản release trên iOS Simulator: iPhone SE, iPhone Pro Max, iPad mini, iPad Pro 13.
# Dùng Maestro mở từng màn qua deep link (tự bấm "Open" của hộp hỏi iOS 17+), chụp ở chữ thường, chữ lớn nhất, nền tối.
# Dùng: bash qa/native/ios.sh <App.app> <outDir>
set -u
APP="$1"
mkdir -p "$2"
OUT="$(cd "$2" && pwd)"
BUNDLE=vn.namapp.thanhtam
mkdir -p "$OUT/shots" "$OUT/flows"
LOG="$OUT/run.log"
: >"$LOG"
say() { echo "$*" | tee -a "$LOG"; }

ROUTES=$(node -e 'const r=require(process.argv[1]);for(const[k,v]of Object.entries(r))if(k!=="_")console.log(k+" "+v)' "$PWD/qa/thanh-tam-routes.json")
RT_JSON=$(xcrun simctl list runtimes -j)
RUNTIME=$(echo "$RT_JSON" | node -e 'const j=JSON.parse(require("fs").readFileSync(0));const r=j.runtimes.filter(x=>x.isAvailable&&/iOS/.test(x.name)).pop();console.log(r.identifier)')
say "RUNTIME: $RUNTIME"
# Chọn loại máy mới nhất khớp tên trong số máy runtime này hỗ trợ.
typeid() {
  echo "$RT_JSON" | node -e '
    const j=JSON.parse(require("fs").readFileSync(0)); const re=new RegExp(process.argv[1]);
    const r=j.runtimes.find(x=>x.identifier===process.argv[2]);
    const t=(r.supportedDeviceTypes||[]).filter(d=>re.test(d.name)).pop();
    console.log(t?t.identifier+"|"+t.name:"")' "$1" "$RUNTIME"
}

# Tạo flow Maestro cho một lượt. $1 = tên tệp, $2 = tiền tố ảnh, $3 = danh sách key (trống = tất cả), $4 = có nạp dữ liệu không
make_flow() {
  local F="$OUT/flows/$1.yaml" PREFIX="$2" KEYS="$3" SEED="$4"
  {
    echo "appId: $BUNDLE"
    echo "---"
    echo "- launchApp"
    if [ "$SEED" = yes ]; then
      echo "- openLink: thanhtam://qa-seed?small=1"
      echo "- tapOn: { text: 'Open', optional: true }"
      echo "- extendedWaitUntil: { visible: 'Chào buổi.*', timeout: 60000, optional: true }"
      echo "- takeScreenshot: $OUT/shots/$PREFIX-00-after-seed"
    fi
    while read -r KEY ROUTE <&3; do
      [ -z "$KEY" ] && continue
      if [ -n "$KEYS" ] && ! echo " $KEYS " | grep -q " $KEY "; then continue; fi
      echo "- openLink: thanhtam:/${ROUTE}"
      echo "- tapOn: { text: 'Open', optional: true }"
      echo "- waitForAnimationToEnd: { timeout: 2500 }"
      echo "- takeScreenshot: $OUT/shots/$PREFIX-$KEY"
    done 3<<<"$ROUTES"
  } >"$F"
  echo "$F"
}

FEW="today rituals calendar ritual prayer pray anniversaries age face-step settings people-edit anniversary-edit"
DEVICES=(
  "iphone-se|^iPhone SE"
  "iphone-pro-max|^iPhone 1[5-7] Pro Max$"
  "ipad-mini|^iPad mini"
  "ipad-pro-13|^iPad Pro 13-inch"
)
for D in "${DEVICES[@]}"; do
  IFS='|' read -r NAME RE <<<"$D"
  TT=$(typeid "$RE")
  if [ -z "$TT" ]; then say "== $NAME: runtime không hỗ trợ loại máy nào khớp"; continue; fi
  T="${TT%%|*}"
  UDID=$(xcrun simctl create "qa-$NAME" "$T" "$RUNTIME") || { say "== $NAME: không tạo được máy ảo"; continue; }
  xcrun simctl boot "$UDID"
  xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1
  xcrun simctl install "$UDID" "$APP"
  say "== $NAME (${TT#*|})"
  for PASS in normal bigtext dark; do
    case $PASS in
      normal) xcrun simctl ui "$UDID" appearance light; xcrun simctl ui "$UDID" content_size large; KEYS=$([ "$NAME" = iphone-pro-max ] && echo "" || echo "$FEW"); SEED=yes ;;
      bigtext) xcrun simctl ui "$UDID" content_size accessibility-extra-extra-extra-large; KEYS="today ritual prayer pray calendar age anniversary-edit settings"; SEED=no ;;
      dark) xcrun simctl ui "$UDID" content_size large; xcrun simctl ui "$UDID" appearance dark; KEYS="today ritual prayer pray calendar age anniversary-edit settings"; SEED=no ;;
    esac
    FLOW=$(make_flow "$NAME-$PASS" "$NAME-$PASS" "$KEYS" "$SEED")
    T0=$(date +%s)
    if maestro --device "$UDID" test "$FLOW" >"$OUT/maestro-$NAME-$PASS.txt" 2>&1; then R=ok; else R="LỖI (xem maestro-$NAME-$PASS.txt)"; fi
    N=$(ls "$OUT/shots" | grep -c "^$NAME-$PASS-")
    say "  $PASS: $R · $N ảnh · $(($(date +%s) - T0)) s"
    # Ảnh + cây giao diện Maestro lưu khi một bước trượt: chép về để xem app đang ở màn nào.
    D=$(grep -o '/Users/runner/.maestro/tests/[0-9_-]*' "$OUT/maestro-$NAME-$PASS.txt" | tail -1)
    if [ -n "$D" ] && [ -d "$D" ]; then mkdir -p "$OUT/debug/$NAME-$PASS"; cp "$D"/*.png "$D"/*.json "$OUT/debug/$NAME-$PASS/" 2>/dev/null; fi
    if grep -qiE "app crashed" "$OUT/maestro-$NAME-$PASS.txt"; then say "  SẬP trong lượt $PASS"; fi
  done
  xcrun simctl spawn "$UDID" log show --last 30m --predicate 'process CONTAINS "Thanh" OR subsystem CONTAINS "com.facebook.react"' --style compact >"$OUT/log-$NAME.txt" 2>/dev/null
  say "  dòng lỗi JS: $(grep -c -E 'TypeError|ReferenceError|Invariant Violation|Unhandled JS Exception' "$OUT/log-$NAME.txt")"
  xcrun simctl shutdown "$UDID"
done
say "BÁO CÁO SẬP: $(ls ~/Library/Logs/DiagnosticReports 2>/dev/null | grep -ci thanh)"
cp ~/Library/Logs/DiagnosticReports/*hanh* "$OUT/" 2>/dev/null
exit 0
