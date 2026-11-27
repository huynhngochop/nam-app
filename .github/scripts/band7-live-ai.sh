#!/usr/bin/env bash
# Band7 · thử một buổi nói thật với giám khảo AI trên project Supabase đang chạy.
# Giọng nói được tạo bằng espeak-ng (giọng máy, có lỗi ngữ pháp cố ý) → m4a mono 16 kHz giống app.
# Kiểm tra: Whisper nghe được, giám khảo trả câu hỏi, bắt được lỗi, chấm band, bước Sửa ngay.
# Cần: URL, ANON, TOKEN (access token của người dùng ẩn danh).
set -euo pipefail

work=$(mktemp -d)
say() { # say <file> <câu>
  espeak-ng -v en-us -s 140 -w "$work/$1.wav" "$2"
  ffmpeg -loglevel error -y -i "$work/$1.wav" -ac 1 -ar 16000 -c:a aac -b:a 32k "$work/$1.m4a"
}
call() { # call <function> <curl args...>
  local fn=$1
  shift
  curl -sS -m 60 -X POST "$URL/functions/v1/$fn" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" "$@"
}
fail() {
  echo "::error title=Band7 AI::$1"
  exit 1
}

say t1 "My city change a lot in recent years. There are many building now and the traffic is very crowded."
say t2 "Last year I go to Da Lat with my family. We visit many place and the weather was very good."
say t3 "If I have more time, I will learn to play the guitar because music make me relax after work."

start=$(call talk -F kind=part1 -F mode=practice -F 'first=Let us talk about your hometown. Has it changed much?' -F topic_title=Hometown)
sid=$(echo "$start" | jq -r '.session_id // empty')
[ -n "$sid" ] || fail "Không mở được buổi nói: $start"

err_id=""
for t in t1 t2 t3; do
  res=$(call talk -F session_id="$sid" -F "audio=@$work/$t.m4a;type=audio/m4a")
  echo "--- $t"
  echo "$res" | jq -c '{transcript, reply, corrections: [.corrections[]? | {wrong, right, code}], turns_left}' || true
  if echo "$res" | jq -e '.error' > /dev/null; then
    case $(echo "$res" | jq -r .error) in
      ai_unavailable) fail "Giám khảo AI chưa chạy: kiểm tra GROQ_API_KEY / GEMINI_API_KEY trong Edge Functions › Secrets (xem Logs của function talk)." ;;
      *) fail "Lượt $t lỗi: $res" ;;
    esac
  fi
  [ -n "$(echo "$res" | jq -r '.transcript // empty')" ] || fail "Whisper không nghe được câu $t"
  [ -n "$(echo "$res" | jq -r '.reply // empty')" ] || fail "Giám khảo không trả câu hỏi ở lượt $t"
  [ -n "$err_id" ] || err_id=$(echo "$res" | jq -r '.corrections[0].id // empty')
done
echo "::notice title=Band7 AI::Whisper nghe được 3 lượt, giám khảo trả câu hỏi tiếp theo"

grade=$(call grade -H 'Content-Type: application/json' -d "{\"session_id\":\"$sid\"}")
echo "grade: $grade"
echo "$grade" | jq -e '.overall >= 3 and .overall <= 9' > /dev/null || fail "Chấm band lỗi: $grade"
echo "::notice title=Band7 AI::Chấm band: $(echo "$grade" | jq -r '"\(.overall) (FC \(.fc), LR \(.lr), GRA \(.gra), P \(.p))"')"

if [ -z "$err_id" ]; then
  echo "::warning title=Band7 AI::Giám khảo không bắt được lỗi nào trong 3 câu có lỗi cố ý (prompt cần xem lại)"
  exit 0
fi
right=$(curl -sS "$URL/rest/v1/learner_errors?select=right_text&id=eq.$err_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | jq -r '.[0].right_text')
echo "Sửa ngay: nói lại \"$right\""
say fix "$right"
rep=$(call repair -F error_id="$err_id" -F target=right -F "audio=@$work/fix.m4a;type=audio/m4a")
echo "repair: $rep"
echo "$rep" | jq -e 'has("ok") and has("similarity")' > /dev/null || fail "Bước Sửa ngay lỗi: $rep"
echo "::notice title=Band7 AI::Sửa ngay: nghe \"$(echo "$rep" | jq -r .transcript)\" · khớp $(echo "$rep" | jq -r .similarity) · qua=$(echo "$rep" | jq -r .ok)"
