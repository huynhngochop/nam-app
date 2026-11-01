/** Nhân tướng: 8 bước tự chọn. Nội dung đã lọc định kiến (xem "Nội dung · Nhân tướng"). */
export type FaceOption = {
  id: string;
  label: string;
  traits: string[];
  summary: string;
  folk?: string;
  shape?: string;
};
export type FacePart = { id: string; name: string; question: string; hint?: string; options: FaceOption[] };

export const FACE_PARTS: FacePart[] = [
  {
    id: 'dang-mat',
    name: 'Dáng mặt',
    question: 'Dáng mặt của bạn gần với kiểu nào nhất?',
    hint: 'Nhìn gương hoặc ảnh của chính bạn. Không cần chính xác tuyệt đối.',
    options: [
      {
        id: 'tron',
        label: 'Tròn',
        traits: ['hòa đồng', 'linh hoạt'],
        summary: 'Dân gian coi mặt tròn là người hòa đồng, dễ gần, thích ứng nhanh với hoàn cảnh mới.',
        folk: 'Ứng với hành Thủy: mềm mỏng, khéo giao tiếp.',
        shape: 'M20 9a15 15 0 1 1 0 30 15 15 0 0 1 0-30z',
      },
      {
        id: 'vuong',
        label: 'Vuông',
        traits: ['quyết đoán', 'giữ nguyên tắc'],
        summary: 'Dân gian coi mặt vuông là người quyết đoán, giữ lời, làm việc có nguyên tắc.',
        folk: 'Ứng với hành Kim: cứng rắn, rõ ràng.',
        shape: 'M13 8h14a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H13a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7z',
      },
      {
        id: 'dai',
        label: 'Dài',
        traits: ['kiên nhẫn', 'ham học'],
        summary: 'Dân gian coi mặt dài là người kiên nhẫn, ham học hỏi, suy nghĩ sâu.',
        folk: 'Ứng với hành Mộc: phát triển từ từ, bền bỉ.',
        shape: 'M20 5c6 0 11 8.5 11 19s-5 19-11 19S9 34.5 9 24 14 5 20 5z',
      },
      {
        id: 'trai-xoan',
        label: 'Trái xoan',
        traits: ['điềm đạm', 'tinh tế'],
        summary: 'Dân gian coi mặt trái xoan là người điềm đạm, tinh tế, biết cân bằng.',
        folk: 'Được coi là dáng mặt hài hòa: người điềm đạm, tinh tế, biết cân bằng giữa việc và người.',
        shape: 'M20 5c9 0 14 7 14 16 0 11-7 21-14 21S6 32 6 21C6 12 11 5 20 5z',
      },
      {
        id: 'tam-giac',
        label: 'Trán rộng, cằm thon',
        traits: ['sáng tạo', 'nhiệt tình'],
        summary: 'Dân gian coi dáng mặt này là người nhiều ý tưởng, nhiệt tình, nhanh nhạy.',
        folk: 'Ứng với hành Hỏa: sôi nổi, giàu năng lượng.',
        shape: 'M5 10c0-3 3-5 15-5s15 2 15 5c0 12-8 32-15 32S5 22 5 10z',
      },
      {
        id: 'day-dan',
        label: 'Đầy đặn, cằm rộng',
        traits: ['chu đáo', 'đáng tin'],
        summary: 'Dân gian coi dáng mặt đầy đặn là người chu đáo, đáng tin, giữ được việc lâu dài.',
        folk: 'Ứng với hành Thổ: vững vàng.',
        shape: 'M20 6c8 0 12 5 13 12 1 6 2 10 2 14 0 6-6 10-15 10S5 38 5 32c0-4 1-8 2-14 1-7 5-12 13-12z',
      },
    ],
  },
  {
    id: 'tam-dinh',
    name: 'Tam đình',
    question: 'Ba phần khuôn mặt của bạn thế nào?',
    hint: 'Trên: chân tóc đến chân mày · Giữa: chân mày đến đầu mũi · Dưới: đầu mũi đến cằm.',
    options: [
      {
        id: 'can-doi',
        label: 'Ba phần gần bằng nhau',
        traits: ['điềm đạm', 'cân bằng'],
        summary: 'Dân gian coi tam đình cân đối là người cân bằng, làm việc gì cũng có trước có sau.',
      },
      {
        id: 'tren',
        label: 'Phần trên dài hơn',
        traits: ['ham học', 'suy nghĩ sâu'],
        summary: 'Dân gian coi thượng đình nổi trội là người thiên về suy nghĩ, học hỏi, lập kế hoạch.',
      },
      {
        id: 'giua',
        label: 'Phần giữa dài hơn',
        traits: ['quyết đoán', 'chủ động'],
        summary: 'Dân gian coi trung đình nổi trội là người chủ động, dám làm, mạnh ở tuổi trung niên.',
      },
      {
        id: 'duoi',
        label: 'Phần dưới dài hơn',
        traits: ['chu đáo', 'bền bỉ'],
        summary: 'Dân gian coi hạ đình nổi trội là người bền bỉ, chăm lo gia đình, càng về sau càng vững.',
      },
    ],
  },
  {
    id: 'tran',
    name: 'Trán',
    question: 'Trán của bạn?',
    options: [
      {
        id: 'cao',
        label: 'Cao, rộng',
        traits: ['ham học', 'nhìn xa'],
        summary: 'Dân gian coi trán cao rộng là người ham học, nhìn xa, hợp việc cần lập kế hoạch.',
      },
      {
        id: 'vua',
        label: 'Vừa phải',
        traits: ['cân bằng', 'thực tế'],
        summary: 'Dân gian coi trán vừa là người thực tế, biết lượng sức, làm việc chắc chắn.',
      },
      {
        id: 'gon',
        label: 'Thấp, gọn',
        traits: ['nhanh nhẹn', 'thực hành'],
        summary: 'Dân gian coi trán gọn là người nhanh nhẹn, thích làm hơn nói, học tốt qua thực hành.',
      },
    ],
  },
  {
    id: 'long-may',
    name: 'Lông mày',
    question: 'Lông mày của bạn?',
    options: [
      {
        id: 'day',
        label: 'Dày, rõ nét',
        traits: ['quyết đoán', 'nhiệt tình'],
        summary: 'Dân gian coi lông mày dày rõ là người nhiệt tình, có chính kiến, dám nhận việc.',
      },
      {
        id: 'manh',
        label: 'Mảnh, thanh',
        traits: ['tinh tế', 'chu đáo'],
        summary: 'Dân gian coi lông mày thanh là người tinh tế, để ý tiểu tiết, chu đáo với người khác.',
      },
      {
        id: 'cong',
        label: 'Cong',
        traits: ['hòa đồng', 'mềm mỏng'],
        summary: 'Dân gian coi lông mày cong là người mềm mỏng, khéo cư xử, dễ được quý mến.',
      },
      {
        id: 'thang',
        label: 'Thẳng',
        traits: ['giữ nguyên tắc', 'thẳng thắn'],
        summary: 'Dân gian coi lông mày thẳng là người thẳng thắn, rõ ràng, giữ lời hứa.',
      },
    ],
  },
  {
    id: 'mat',
    name: 'Mắt',
    question: 'Mắt của bạn?',
    options: [
      {
        id: 'to',
        label: 'To, tròn',
        traits: ['cởi mở', 'nhiệt tình'],
        summary: 'Dân gian coi mắt to tròn là người cởi mở, giàu cảm xúc, dễ đồng cảm.',
      },
      {
        id: 'dai',
        label: 'Dài',
        traits: ['nhìn xa', 'điềm đạm'],
        summary: 'Dân gian coi mắt dài là người điềm đạm, quan sát kỹ, nhìn việc lâu dài.',
      },
      {
        id: 'nho',
        label: 'Nhỏ, sáng',
        traits: ['tập trung', 'cẩn thận'],
        summary: 'Dân gian coi mắt nhỏ sáng là người tập trung, cẩn thận, giữ được bí mật.',
      },
    ],
  },
  {
    id: 'mui',
    name: 'Mũi',
    question: 'Mũi của bạn?',
    options: [
      {
        id: 'cao',
        label: 'Sống mũi cao, thẳng',
        traits: ['chủ động', 'giữ nguyên tắc'],
        summary: 'Dân gian coi sống mũi cao thẳng là người chủ động, có lập trường, giữ nguyên tắc.',
      },
      {
        id: 'tron',
        label: 'Đầu mũi tròn, đầy',
        traits: ['chu đáo', 'biết vun vén'],
        summary: 'Dân gian coi đầu mũi tròn đầy là người chu đáo, biết vun vén, giữ của cho gia đình.',
      },
      {
        id: 'thon',
        label: 'Nhỏ, thon',
        traits: ['tinh tế', 'khéo léo'],
        summary: 'Dân gian coi mũi nhỏ thon là người khéo léo, tinh tế, có óc thẩm mỹ.',
      },
    ],
  },
  {
    id: 'mieng',
    name: 'Miệng, môi',
    question: 'Miệng, môi của bạn?',
    options: [
      {
        id: 'moi-day',
        label: 'Môi đầy',
        traits: ['nhiệt tình', 'chân thành'],
        summary: 'Dân gian coi môi đầy là người chân thành, ấm áp, quý tình cảm.',
      },
      {
        id: 'moi-mong',
        label: 'Môi mỏng',
        traits: ['rõ ràng', 'nhanh nhạy'],
        summary: 'Dân gian coi môi mỏng là người nói năng rõ ràng, nhanh nhạy, giỏi lập luận.',
      },
      {
        id: 'rong',
        label: 'Miệng rộng',
        traits: ['hòa đồng', 'cởi mở'],
        summary: 'Dân gian coi miệng rộng là người cởi mở, hào sảng, đông bạn bè.',
      },
      {
        id: 'nho',
        label: 'Miệng nhỏ',
        traits: ['cẩn thận', 'tinh tế'],
        summary: 'Dân gian coi miệng nhỏ là người cẩn thận lời nói, kín đáo, tinh tế.',
      },
    ],
  },
  {
    id: 'tai',
    name: 'Tai',
    question: 'Tai của bạn?',
    options: [
      {
        id: 'to',
        label: 'To, dái tai dày',
        traits: ['điềm đạm', 'bền bỉ'],
        summary: 'Dân gian coi tai to, dái tai dày là người điềm đạm, bền bỉ, biết lắng nghe.',
      },
      {
        id: 'vua',
        label: 'Vừa',
        traits: ['cân bằng', 'thực tế'],
        summary: 'Dân gian coi tai vừa là người thực tế, cân bằng giữa nghe và làm.',
      },
      {
        id: 'nho',
        label: 'Nhỏ, gọn',
        traits: ['nhanh nhẹn', 'độc lập'],
        summary: 'Dân gian coi tai nhỏ gọn là người nhanh nhẹn, tự lập, quyết nhanh.',
      },
    ],
  },
];

export const FACE_REAL =
  'Nhân tướng học là cách người xưa quan sát và ghi chép, không phải khoa học. Các nghiên cứu tâm lý (ví dụ của Alexander Todorov) cho thấy con người đoán tính cách qua khuôn mặt rất nhanh nhưng thường sai. Tính cách hình thành từ trải nghiệm, giáo dục và lựa chọn của mỗi người.';
export const FACE_ADVICE = 'Đọc để tự ngẫm điểm mạnh của mình. Đừng dùng để đánh giá người khác.';
export const FACE_DISCLAIMER =
  'Theo nhân tướng học dân gian. Khoa học chưa chứng minh tính cách đọc được qua khuôn mặt.';

export type FaceAnswers = Partial<Record<string, string>>;
/** 3 nét nổi bật: đếm từ khóa của các lựa chọn, hòa thì theo thứ tự bước. Bước "Không chắc" bị bỏ qua. */
export function topTraits(answers: FaceAnswers, n = 3): string[] {
  const count = new Map<string, { c: number; first: number }>();
  let order = 0;
  for (const part of FACE_PARTS) {
    const opt = part.options.find((o) => o.id === answers[part.id]);
    if (!opt) continue;
    for (const t of opt.traits) {
      const cur = count.get(t);
      if (cur) cur.c++;
      else count.set(t, { c: 1, first: order });
      order++;
    }
  }
  return [...count.entries()]
    .sort((a, b) => b[1].c - a[1].c || a[1].first - b[1].first)
    .slice(0, n)
    .map(([t]) => t);
}
export const optionOf = (partId: string, optionId?: string) =>
  FACE_PARTS.find((p) => p.id === partId)?.options.find((o) => o.id === optionId);
