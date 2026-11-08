#!/bin/bash
# Kiểm tra APK có vượt ngân sách trong .github/apk-budget.json không; vượt thì in 15 file nặng nhất.
# Dùng: apk-budget.sh <app> <apk>
set -u
app="$1"
apk="$2"
size=$(du -k "$apk" | cut -f1)
budget=$(node -p "const b=require('./.github/apk-budget.json'); b.apps['$app'] ?? b.default")
top=$(unzip -lv "$apk" | awk 'NR>3 && $8 != "" {printf "%d KB %s\n", $3/1024, $8}' | sort -nr | head -15 | tr '\n' ';')
if [ "$size" -gt "$budget" ]; then
  echo "::error title=Dung lượng $app::${size} KB vượt ngân sách ${budget} KB (arm64). File nặng nhất (đã nén): $top Xem docs/lean-app.md."
  exit 1
fi
echo "::notice title=Dung lượng $app::${size} KB / ngân sách ${budget} KB (arm64) · nặng nhất: $top"
