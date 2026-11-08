#!/usr/bin/env bash
# Tải trước bản Gradle cho gradlew, thử nhiều nguồn: services.gradle.org (chuyển sang GitHub Releases, có lúc trả 504)
# rồi các bản sao (Tencent, Huawei, Aliyun). Kiểm tra mã SHA-256 do gradle.org công bố khi lấy được.
# Rồi trỏ gradle-wrapper.properties vào tệp đã tải.
# Dùng: bash .github/scripts/gradle-dist.sh apps/thanh-tam/android
set -uo pipefail
PROPS="$1/gradle/wrapper/gradle-wrapper.properties"
URL="$(grep '^distributionUrl=' "$PROPS" | cut -d= -f2- | sed 's#\\:#:#g')"
NAME="$(basename "$URL")"
VER="$(echo "$NAME" | sed -E 's/^gradle-([0-9.]+)-(bin|all)\.zip$/\1/')"
DEST="$HOME/gradle-dist/$NAME"
mkdir -p "$HOME/gradle-dist"
echo "Gradle cần: $NAME"

SHA=""
for s in "https://services.gradle.org/distributions/$NAME.sha256" "https://downloads.gradle.org/distributions/$NAME.sha256"; do
  SHA="$(curl -fsSL --retry 2 --connect-timeout 15 "$s" 2>/dev/null | tr -dc 'a-f0-9' | head -c 64)"
  [ "${#SHA}" -eq 64 ] && break
  SHA=""
done
if [ -z "$SHA" ]; then
  # Trang mã kiểm tra của gradle.org (không qua GitHub): dòng đầu tiên sau mục phiên bản là mã của bản -bin
  SHA="$(curl -fsSL --retry 2 --connect-timeout 15 https://gradle.org/release-checksums/ 2>/dev/null |
    tr '\n' ' ' | sed -E "s/.*name=\"v$VER\"//" | grep -oE '[a-f0-9]{64}' | head -1)"
fi
[ -n "$SHA" ] && echo "SHA-256 mong đợi: $SHA" || echo "::warning::Không lấy được mã SHA-256 của Gradle, chỉ kiểm tra tệp zip đọc được"

ok=""
for u in \
  "https://services.gradle.org/distributions/$NAME" \
  "https://mirrors.cloud.tencent.com/gradle/$NAME" \
  "https://mirrors.huaweicloud.com/gradle/$NAME" \
  "https://mirrors.aliyun.com/gradle/distributions/v$VER/$NAME"; do
  echo "Thử $u"
  if curl -fsSL --retry 3 --retry-all-errors --connect-timeout 20 --max-time 600 -o "$DEST" "$u" && unzip -tq "$DEST" >/dev/null; then
    if [ -n "$SHA" ] && [ "$(sha256sum "$DEST" | cut -d' ' -f1)" != "$SHA" ]; then
      echo "::warning::Sai mã SHA-256 từ $u, bỏ"
      continue
    fi
    ok="$u"
    break
  fi
done
if [ -z "$ok" ]; then
  echo "::error::Không tải được $NAME từ nguồn nào"
  exit 1
fi
echo "Đã tải $NAME từ $ok"
sed -i "s#^distributionUrl=.*#distributionUrl=file\\\\:$DEST#" "$PROPS"
grep '^distributionUrl=' "$PROPS"
