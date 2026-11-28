/**
 * Ngân hàng đề có sẵn trong app (dùng được khi không có mạng). Viết dạng văn bản gọn theo docs/lean-app.md mục 8.
 * Mỗi dòng: part | tiêu đề | câu hỏi (Part 1, 3: ngăn bằng ";" — Part 2: cue ; ý 1 ; ý 2 …) | thẻ
 * Đề mới theo quý lấy từ máy chủ (bảng `topics`) khi có mạng.
 */
const RAW = `
1|Hometown|Where is your hometown?;What do you like most about it?;Has your hometown changed much in recent years?;Would you like to live there in the future?|place
1|Work or study|Do you work or are you a student?;Why did you choose that field?;What is the most difficult part of it?;What would you like to do in the future?|work
1|Daily routine|What does a typical day look like for you?;Do you prefer mornings or evenings?;Has your routine changed since you were a child?|life
1|Food|What kind of food do you like?;Do you often cook at home?;Is there any food you didn't like as a child but enjoy now?|food
1|Technology|How often do you use your phone?;What apps do you use the most?;Has technology changed the way you study?|tech
1|Weekends|What do you usually do at weekends?;Did you do anything special last weekend?;What would you do if you had a long weekend?|life
1|Music|What kind of music do you enjoy?;Did you learn a musical instrument as a child?;Has your taste in music changed?|hobby
1|Weather|What is the weather like where you live?;Do you prefer hot or cold weather?;Has the weather changed in recent years?|place
2|A skill that took a long time to learn|Describe a skill you learned that took a long time.;what the skill is;when and how you learned it;why it took a long time;and explain how you feel about it now|skill
2|A place you like to visit|Describe a place you like to visit in your free time.;where it is;how often you go there;what you do there;and explain why you like it|place
2|A person who helped you|Describe a person who has helped you a lot.;who this person is;how you know them;what they did to help you;and explain how you felt about it|people
2|A difficult decision|Describe a difficult decision you made.;what the decision was;when you made it;why it was difficult;and explain how you feel about it now|life
2|A useful app|Describe an app you find very useful.;what the app is;how you found it;what you use it for;and explain why it is useful|tech
2|A memorable trip|Describe a trip you remember well.;where you went;who you went with;what you did there;and explain why it was memorable|travel
3|Technology and learning|How has technology changed the way people study?;Do you think online courses will replace schools?;What are the risks of children using phones too much?;Should the government control how young people use technology?|tech
3|Cities and change|Why do so many people move to big cities?;What problems does fast urban growth cause?;How could cities become better places to live?;Will people prefer living in the countryside in the future?|place
3|Work and careers|What makes a job satisfying?;Is it better to stay in one company or change jobs often?;How will artificial intelligence change jobs?;Should schools prepare students for specific careers?|work
3|Environment|What can individuals do to protect the environment?;Is it the government's or the people's responsibility?;Why do some people not care about environmental problems?|env
`;

export type Topic = {
  id: string;
  part: 1 | 2 | 3;
  title: string;
  questions: string[]; // Part 1/3: câu hỏi · Part 2: [cue, ...ý]
  tag: string;
};

let cache: Topic[] | null = null;
let merged: Topic[] | null = null;
let remote: Topic[] = [];

/** Đề mới từ máy chủ (bảng `topics`, cập nhật theo quý). Gộp sau đề có sẵn, bỏ trùng tiêu đề. */
export function registerRemoteTopics(list: Topic[]) {
  remote = list;
  merged = null;
}

export function topics(): Topic[] {
  if (merged) return merged;
  const local = localTopics();
  const titles = new Set(local.map((t) => t.title.toLowerCase()));
  merged = [...remote.filter((t) => !titles.has(t.title.toLowerCase())), ...local];
  return merged;
}

function localTopics(): Topic[] {
  if (cache) return cache;
  cache = RAW.trim()
    .split('\n')
    .map((line, i) => {
      const [part, title, qs, tag] = line.split('|');
      return {
        id: `local-${i + 1}`,
        part: Number(part) as 1 | 2 | 3,
        title: title.trim(),
        questions: qs
          .split(';')
          .map((q) => q.trim())
          .filter(Boolean),
        tag: (tag ?? '').trim(),
      };
    });
  return cache;
}

export function topicsOfPart(part: 1 | 2 | 3): Topic[] {
  return topics().filter((t) => t.part === part);
}
export function topicById(id: string): Topic | undefined {
  return topics().find((t) => t.id === id);
}
/** Chọn đề chưa luyện gần đây; hết thì quay vòng. */
export function pickTopic(part: 1 | 2 | 3, practicedIds: string[]): Topic {
  const list = topicsOfPart(part);
  const fresh = list.filter((t) => !practicedIds.includes(t.id));
  return (fresh.length ? fresh : list)[0];
}

/** Kiểm tra dữ liệu đề (chạy trong test). Trả về danh sách lỗi, rỗng = hợp lệ. */
export function validateTopics(): string[] {
  const errs: string[] = [];
  for (const t of localTopics()) {
    if (![1, 2, 3].includes(t.part)) errs.push(`${t.id}: part sai`);
    if (!t.title) errs.push(`${t.id}: thiếu tiêu đề`);
    if (t.part === 2 && t.questions.length < 4) errs.push(`${t.id}: cue card cần câu mô tả + ít nhất 3 ý`);
    if (t.part !== 2 && t.questions.length < 3) errs.push(`${t.id}: cần ít nhất 3 câu hỏi`);
  }
  return errs;
}
