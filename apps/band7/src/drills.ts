/**
 * Bài ngắn chạy ngoại tuyến (khởi động phát âm, ngữ pháp/từ vựng mini, nói nhại). Không gọi AI.
 * Mỗi khối: "## Tiêu đề" · dòng giải thích (tiếng Việt) · các dòng "- câu mẫu" để đọc to.
 * Tiêu đề khớp với MINI trong plan.ts.
 */
const RAW = `
## Hiện tại hoàn thành cho thay đổi tới nay
Tiếng Việt chỉ thêm "đã". Thay đổi bắt đầu trong quá khứ và còn tới bây giờ: has/have + V3.
- My hometown has changed a lot in recent years.
- Prices have gone up since last year.
- I've become much more confident about speaking English.
## Quá khứ đơn với động từ bất quy tắc
Chuyện đã xong, có thời điểm cụ thể (last year, when I was ten): đổi động từ sang quá khứ.
- Last summer I went to Da Lat with my family.
- I bought my first laptop when I was eighteen.
- We took a lot of photos and ate local food.
## Câu điều kiện loại 1 và 2
Có thể xảy ra: If + hiện tại, will + V. Giả định không có thật: If + quá khứ, would + V.
- If it rains tomorrow, I'll stay at home.
- If I had more free time, I would learn to play the piano.
- If I could change one thing about my city, I would build more parks.
## Collocation về thói quen hằng ngày
Dùng cụm từ người bản xứ hay đi cùng nhau, không dịch từng chữ.
- I usually grab a quick breakfast and catch the bus at seven.
- I try to make time for exercise, but it's not always easy.
- In the evening I like to unwind by watching a film.
## Thay "very good" bằng tính từ mạnh
Band 7 cần từ chính xác hơn: very good → excellent, very tired → exhausted, very big → enormous.
- The food there was absolutely delicious.
- After the trip I was completely exhausted.
- It was a genuinely rewarding experience.
## Âm cuối /t/ /d/ /s/
Bật nhẹ âm cuối, đừng nuốt mất: walked /t/, played /d/, books /s/.
- I walked to school and played football after class.
- She keeps three books in her bag.
- We visited the market and bought some fruits.
## Âm /θ/ và /ð/
Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi. Không đọc thành /t/ hay /s/.
- I think three thousand is too much.
- This is the thing I was thinking about.
- My brother and father are both thirty-three.
## Mệnh đề quan hệ để nói dài hơn
Nối thông tin bằng who/which/where để câu dài và tự nhiên hơn.
- My aunt, who lives in Hue, taught me how to cook.
- It's a small café where I usually study at weekends.
- I bought a phone which has a really good camera.
## Kể chuyện bằng quá khứ tiếp diễn
Việc đang diễn ra (was/were + V-ing) thì có việc khác xen vào (quá khứ đơn).
- I was walking home when it started to rain.
- While we were having dinner, the lights went out.
- She was studying abroad when she met her best friend.
## Cụm từ kể trải nghiệm
Dùng cụm mở đầu và kết thúc để Part 2 trôi chảy.
- I'd like to talk about a trip I took a couple of years ago.
- What made it really special was the people I met.
- Looking back, it was one of the best decisions I've ever made.
## Từ nối: on top of that, having said that
Nối ý thay vì nói từng câu rời.
- It's cheap, and on top of that, it's really convenient.
- Living in the city is exciting. Having said that, it can be quite stressful.
- As a result, I've decided to move closer to my office.
## Trọng âm từ nhiều âm tiết
Nhấn mạnh đúng một âm, các âm còn lại đọc nhẹ.
- deVELopment · PHOtograph · phoTOgraphy
- ecoNOMic · enVIronment · comMUnity
- The deVELopment of TECHnology has CHANGED our COMmunity.
## Nối âm trong câu
Phụ âm cuối nối sang nguyên âm đầu của từ sau.
- Not at all → no-ta-tall.
- Pick it up and put it on.
- I'm interested in art and history.
## Chia 2 phút Part 2 thành 4 ý
Mở bài 15 giây · quá trình 40 giây · khó khăn hoặc điểm đặc biệt 40 giây · cảm nhận 25 giây.
- I'd like to talk about learning to swim, which took me surprisingly long.
- The main reason it was so hard was that I was afraid of water.
- Looking back, I'm really proud that I didn't give up.
## Câu bị động khi nói về xã hội
Khi không cần nói ai làm: be + V3.
- More parks should be built in big cities.
- Students are often given too much homework.
- Plastic bags have been banned in many supermarkets.
## Câu so sánh nâng cao
far/much + so sánh hơn, the more … the more …
- Online courses are far more flexible than traditional classes.
- The more you practise, the more confident you become.
- It's not nearly as expensive as people think.
## Cụm từ đưa ý kiến và phản biện
Nêu ý kiến rồi cân nhắc mặt kia.
- From my point of view, technology has done more good than harm.
- That said, I can see why some parents are worried.
- It depends on how it's used, really.
## Idiom tự nhiên, dùng đúng chỗ
Dùng ít nhưng đúng ngữ cảnh, đừng nhồi.
- Learning to drive was a piece of cake compared to learning English.
- I was over the moon when I passed the exam.
- It took a while, but I finally got the hang of it.
## Ngữ điệu câu hỏi và câu nhấn mạnh
Câu hỏi Yes/No lên giọng cuối; câu hỏi Wh- xuống giọng; nhấn từ quan trọng.
- Do you live near here? (lên giọng)
- Where do you work? (xuống giọng)
- I REALLY enjoyed it, but it was EXPENSIVE.
## Cụm đệm thay cho "um, uh"
Có thời gian nghĩ mà vẫn nghe tự nhiên.
- That's an interesting question. Let me think…
- Well, I've never really thought about it, but I'd say…
- It's hard to say for sure, but probably…
## Rà lỗi ngữ pháp còn lặp
Đọc to các câu đúng trong sổ lỗi của bạn, mỗi câu 2 lần.
- My city has changed a lot recently.
- There are many buildings in my neighbourhood.
- If I had more time, I would travel more.
## Ôn cụm từ đã học theo chủ đề
Chọn một chủ đề và nói 3 câu dùng cụm từ đã học.
- On top of that, it's really convenient.
- It took a while, but I finally got the hang of it.
- Looking back, it was a great decision.
## Đọc to đoạn mẫu band 7
Đọc chậm, rõ âm cuối, nhấn đúng trọng âm.
- I've always been fascinated by languages, which is why I decided to study abroad.
- Having said that, adapting to a new culture wasn't exactly easy.
- Looking back, it was one of the most rewarding experiences of my life.
## Luyện giữ nhịp khi bị hỏi bất ngờ
Dùng cụm đệm, rồi trả lời: ý chính + lý do + ví dụ.
- That's a tricky one. I'd say yes, mainly because…
- Off the top of my head, I'd probably choose…
- I haven't thought about it much, but I suppose…
## Mở rộng câu trả lời: ý + lý do + ví dụ
Band 6.5+ không trả lời cụt. Nói 2–3 câu.
- Yes, I really enjoy it, mainly because it helps me relax after work.
- For example, last weekend I spent the whole afternoon reading in a café.
- No, not really. I find it a bit boring, to be honest.
`;

export type Drill = { title: string; explain: string; lines: string[] };
let cache: Map<string, Drill> | null = null;

function all(): Map<string, Drill> {
  if (cache) return cache;
  cache = new Map();
  for (const block of RAW.split('\n## ')
    .map((b) => b.replace(/^## /, '').trim())
    .filter(Boolean)) {
    const [title, explain, ...rest] = block.split('\n').map((l) => l.trim());
    cache.set(title, { title, explain, lines: rest.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)) });
  }
  return cache;
}

export function drillByTitle(title: string): Drill | undefined {
  return all().get(title);
}
const WARMUPS = ['Âm cuối /t/ /d/ /s/', 'Âm /θ/ và /ð/', 'Trọng âm từ nhiều âm tiết', 'Nối âm trong câu'];
export function warmupFor(dayIndex: number): Drill {
  return all().get(WARMUPS[dayIndex % WARMUPS.length])!;
}
export function shadowDrill(): Drill {
  return all().get('Đọc to đoạn mẫu band 7')!;
}
export function drillTitles(): string[] {
  return [...all().keys()];
}
