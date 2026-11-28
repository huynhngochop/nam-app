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
Lên band cao cần từ chính xác hơn: very good → excellent, very tired → exhausted, very big → enormous.
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
## Đọc to đoạn mẫu band 6
Đọc rõ từng từ, bật âm cuối, ngắt hơi sau dấu phẩy.
- I live in a small apartment near the city centre, so it's quite convenient.
- I usually go to work by motorbike because the buses are often crowded.
- In my free time I like watching films and meeting my friends.
## Đọc to đoạn mẫu band 8
Giữ nhịp đều, nhấn từ mang nghĩa, các từ chức năng đọc nhẹ.
- What really struck me was how quickly the neighbourhood had transformed.
- I'd argue that the benefits far outweigh the drawbacks, at least in the long run.
- It's not so much the money that matters as the sense of achievement.
## Đọc to đoạn mẫu band 9
Nói như kể chuyện với bạn: ngữ điệu lên xuống tự nhiên, ngắt theo cụm ý.
- Had I known how demanding the course would be, I might have thought twice.
- It's a double-edged sword: it brings people together, yet it can be terribly isolating.
- Admittedly, there's no easy answer, but on balance I'd lean towards stricter rules.
## Thì hoàn thành tiếp diễn và câu giả định
Việc kéo dài tới giờ: have been + V-ing. Giả định sau suggest, it's time: dùng động từ nguyên mẫu hoặc quá khứ.
- I've been learning the guitar for about three years now.
- It's high time the government invested more in public transport.
- My teacher suggested that I spend more time reading in English.
## Câu chẻ để nhấn mạnh
It is/was … that …, What … is …: đưa ý quan trọng lên đầu.
- It was my grandmother who taught me to love cooking.
- What I enjoy most about my job is the people I work with.
- The thing that surprised me was how friendly everyone was.
## Paraphrase câu hỏi của giám khảo
Đừng lặp nguyên câu hỏi. Nói lại bằng từ khác rồi trả lời.
- Do you like reading? → Yes, I'm quite a keen reader, actually.
- Is your hometown good for children? → I'd say it's a fairly child-friendly place.
- Do you often take the bus? → I rely on public transport most days, to be honest.
## Collocation ít gặp nhưng tự nhiên
Band 7.5+ cần cụm từ chính xác, không chỉ từ khó.
- The project was a steep learning curve for me.
- Social media has a profound impact on how teenagers see themselves.
- It's a widely held belief, but I'm not entirely convinced.
## Âm yếu và dạng rút gọn
to, for, and, of, can thường đọc nhẹ thành /tə/ /fə/ /ən/ /əv/ /kən/.
- I want to go for a walk.
- A cup of tea and a piece of cake.
- I can swim, but I can't dive.
## Trả lời có chiều sâu: ý + lý do + hệ quả
Không dừng ở ví dụ: nói thêm điều đó dẫn tới đâu.
- I prefer working from home, mainly because I save two hours a day on commuting.
- As a result, I actually have time to cook properly and exercise.
- So in a way, it's made me healthier as well as more productive.
## Mệnh đề rút gọn và cụm phân từ
Gộp hai câu thành một bằng V-ing hoặc V3 ở đầu câu.
- Having grown up by the sea, I've always loved swimming.
- Built in the 1920s, the market is the oldest building in town.
- Not knowing anyone there, I felt a bit lost at first.
## Cụm động từ tự nhiên khi kể chuyện
Người bản xứ kể chuyện bằng phrasal verb hơn là từ trang trọng.
- We set off early to avoid the traffic.
- The trip didn't turn out the way we'd planned.
- In the end, we ended up staying an extra night.
## Nhịp câu: nhấn từ mang nghĩa
Tiếng Anh nhấn danh từ, động từ, tính từ; lướt nhanh các từ còn lại.
- I SPENT the WHOLE WEEKEND REVISING for my EXAMS.
- It's the BEST DECISION I've EVER MADE.
- I'd LOVE to TRAVEL MORE, but I CAN'T AFFORD it.
## Part 2 có điểm nhấn và kết luận
Có một chi tiết bất ngờ ở giữa và một câu chốt cảm nhận ở cuối.
- The funny thing is, I almost didn't go at all.
- That was the moment I realised how much it meant to me.
- So all in all, it's an experience I'll never forget.
## Nói giảm nói tránh (hedging)
Band cao không khẳng định tuyệt đối: tend to, it seems, to a certain extent.
- Younger people tend to be more open to new technology.
- It seems to me that cities are becoming less friendly.
- To a certain extent, I'd agree with that.
## Từ chỉ sắc thái: arguably, to some extent
Thêm mức độ và thái độ cho ý kiến.
- Arguably, the internet is the most important invention of our time.
- I'm somewhat sceptical about that idea.
- It's by no means perfect, but it's a step in the right direction.
## Ngữ điệu thể hiện thái độ
Lên xuống giọng cho thấy bạn ngạc nhiên, đồng ý một phần hay không chắc.
- Really? I had no idea. (ngạc nhiên, lên giọng)
- Well, yes and no. (đồng ý một phần, kéo dài "well")
- I suppose so… (không chắc, xuống giọng nhẹ)
## Lập luận hai chiều rồi chốt quan điểm
Một mặt, mặt khác, rồi quan điểm của bạn và lý do.
- On the one hand, working abroad broadens your horizons.
- On the other hand, being far from family can be really tough.
- Personally, I think it's worth it, at least for a few years.
## Dọn lỗi nhỏ còn sót ở band cao
Lỗi nhỏ lặp lại kéo band xuống: mạo từ, số nhiều, giới từ. Đọc chậm, chú ý từng từ.
- I'm interested in the history of the city.
- There's been a significant increase in the number of tourists.
- It depends on the situation, really.
## Từ ít phổ biến dùng đúng ngữ cảnh
Dùng 1–2 từ chính xác thay cho từ chung chung, đừng nhồi.
- The view from the top was breathtaking.
- It's a fairly mundane job, but it pays the bills.
- The city has a vibrant nightlife.
## Nói dài không mất mạch ý
Báo trước số ý, đi lần lượt, quay lại câu hỏi ở cuối.
- There are a couple of reasons for that. First of all…
- Another thing worth mentioning is…
- So, coming back to your question, I'd say…
## Đảo ngữ trong văn nói
Dùng ít, đúng chỗ để nhấn mạnh: Not only…, Never have I…, Had I…
- Not only is it cheaper, but it's also much faster.
- Never have I seen so many people in one place.
- Had I started earlier, I'd be fluent by now.
## Thành ngữ và cách nói hình ảnh đúng chỗ
Chọn cách nói hợp ngữ cảnh, giọng tự nhiên, không học thuộc cả câu.
- Moving abroad was a real eye-opener for me.
- I'm on the fence about that, to be honest.
- It's easier said than done.
## Nhượng bộ rồi phản biện tự nhiên
Công nhận ý kia trước, rồi mới đưa lý do của mình.
- Admittedly, it's expensive. That said, you get what you pay for.
- I take your point, but I'd still argue that…
- While that's true to some extent, it overlooks the bigger picture.
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
/** Đoạn mẫu để nói nhại, theo band của câu mẫu (xem modelBand trong plan.ts). */
export function shadowDrill(band = 7): Drill {
  const level = band >= 8.75 ? 9 : band >= 7.75 ? 8 : band >= 6.75 ? 7 : 6;
  return all().get(`Đọc to đoạn mẫu band ${level}`)!;
}
export function drillTitles(): string[] {
  return [...all().keys()];
}
