export type Ingredient = { id: string; name: string; aliases: string[] };
export type Recipe = {
  id: string; title: string; minutes: number; difficulty: 'easy' | 'medium'; kcal?: number; baseServings: number; cheap?: boolean;
  ingredients: { id: string; qty: number; unit: string; optional?: boolean }[];
  steps: { title?: string; text: string; timerSec?: number }[];
};

export const INGREDIENTS: Ingredient[] = [
  { id: 'trung', name: 'Trứng', aliases: ['trung ga', 'trung vit'] },
  { id: 'ca-chua', name: 'Cà chua', aliases: [] },
  { id: 'hanh-la', name: 'Hành lá', aliases: ['hanh'] },
  { id: 'com-nguoi', name: 'Cơm nguội', aliases: ['com'] },
  { id: 'nuoc-mam', name: 'Nước mắm', aliases: [] },
  { id: 'dau-phu', name: 'Đậu phụ', aliases: ['dau hu', 'tau hu'] },
  { id: 'thit-heo', name: 'Thịt heo', aliases: ['thit lon', 'thit ba chi'] },
  { id: 'rau-muong', name: 'Rau muống', aliases: [] },
  { id: 'toi', name: 'Tỏi', aliases: [] },
  { id: 'bi-dao', name: 'Bí đao', aliases: [] },
  { id: 'tom', name: 'Tôm', aliases: [] },
  { id: 'cai-thao', name: 'Cải thảo', aliases: [] },
  { id: 'mi-goi', name: 'Mì gói', aliases: ['mi tom'] },
  { id: 'khoai-tay', name: 'Khoai tây', aliases: [] },
  { id: 'ca-rot', name: 'Cà rốt', aliases: [] },
  { id: 'gung', name: 'Gừng', aliases: [] },
];
export const ingName = (id: string) => INGREDIENTS.find((i) => i.id === id)?.name ?? id;

export const RECIPES: Recipe[] = [
  { id: 'r1', title: 'Cơm chiên trứng cà chua', minutes: 15, difficulty: 'easy', kcal: 420, baseServings: 2, cheap: true,
    ingredients: [{ id: 'com-nguoi', qty: 2, unit: 'chén' }, { id: 'trung', qty: 3, unit: 'quả' }, { id: 'ca-chua', qty: 2, unit: 'quả' }, { id: 'hanh-la', qty: 2, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa', optional: true }],
    steps: [{ title: 'Sơ chế', text: 'Cà chua thái hạt lựu, hành lá cắt nhỏ, đánh tan trứng.' }, { title: 'Phi hành, xào cà chua', text: 'Phi thơm hành với 1 thìa dầu, cho cà chua vào xào đến khi mềm.', timerSec: 180 },
      { title: 'Chiên cơm', text: 'Cho cơm vào đảo đều, rưới trứng, đảo nhanh tay cho trứng bám hạt cơm.', timerSec: 240 }, { title: 'Nêm nếm', text: 'Nêm nước mắm, rắc hành lá, tắt bếp.' }] },
  { id: 'r2', title: 'Trứng đúc hành lá', minutes: 8, difficulty: 'easy', kcal: 220, baseServings: 2, cheap: true,
    ingredients: [{ id: 'trung', qty: 3, unit: 'quả' }, { id: 'hanh-la', qty: 2, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa', optional: true }],
    steps: [{ text: 'Đánh trứng với hành lá cắt nhỏ và chút nước mắm.' }, { text: 'Đổ vào chảo nóng có dầu, chiên lửa vừa đến khi vàng mặt dưới.', timerSec: 120 }, { text: 'Lật mặt, chiên thêm 1 phút.', timerSec: 60 }] },
  { id: 'r3', title: 'Canh cà chua trứng', minutes: 12, difficulty: 'easy', kcal: 150, baseServings: 3, cheap: true,
    ingredients: [{ id: 'ca-chua', qty: 2, unit: 'quả' }, { id: 'trung', qty: 2, unit: 'quả' }, { id: 'hanh-la', qty: 1, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa' }],
    steps: [{ text: 'Xào cà chua với chút dầu cho ra màu.' }, { text: 'Thêm 700 ml nước, đun sôi.', timerSec: 300 }, { text: 'Đổ trứng đánh tan theo vòng tròn, khuấy nhẹ, nêm nước mắm, thêm hành.' }] },
  { id: 'r4', title: 'Đậu phụ sốt cà chua', minutes: 20, difficulty: 'easy', kcal: 310, baseServings: 2, cheap: true,
    ingredients: [{ id: 'dau-phu', qty: 3, unit: 'bìa' }, { id: 'ca-chua', qty: 2, unit: 'quả' }, { id: 'hanh-la', qty: 1, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa' }],
    steps: [{ text: 'Cắt đậu miếng vừa, chiên vàng các mặt.', timerSec: 360 }, { text: 'Xào cà chua đến khi nhuyễn, thêm 3 thìa nước, nêm nước mắm.' }, { text: 'Cho đậu vào, đun nhỏ lửa cho thấm.', timerSec: 300 }] },
  { id: 'r5', title: 'Rau muống xào tỏi', minutes: 10, difficulty: 'easy', kcal: 120, baseServings: 2, cheap: true,
    ingredients: [{ id: 'rau-muong', qty: 1, unit: 'bó' }, { id: 'toi', qty: 3, unit: 'tép' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa' }],
    steps: [{ text: 'Nhặt rau, rửa sạch, chần qua nước sôi 30 giây rồi vớt ra.', timerSec: 30 }, { text: 'Phi thơm tỏi, cho rau vào xào lửa lớn.', timerSec: 90 }, { text: 'Nêm nước mắm, tắt bếp.' }] },
  { id: 'r6', title: 'Canh bí đao tôm', minutes: 20, difficulty: 'easy', kcal: 180, baseServings: 3,
    ingredients: [{ id: 'bi-dao', qty: 300, unit: 'g' }, { id: 'tom', qty: 150, unit: 'g' }, { id: 'hanh-la', qty: 1, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa' }],
    steps: [{ text: 'Tôm bóc vỏ, băm nhỏ; bí đao gọt vỏ, thái miếng.' }, { text: 'Xào tôm cho thơm, thêm 800 ml nước, đun sôi.', timerSec: 240 }, { text: 'Cho bí vào nấu đến khi trong.', timerSec: 420 }, { text: 'Nêm nước mắm, rắc hành.' }] },
  { id: 'r7', title: 'Thịt heo kho trứng', minutes: 60, difficulty: 'medium', kcal: 520, baseServings: 4,
    ingredients: [{ id: 'thit-heo', qty: 500, unit: 'g' }, { id: 'trung', qty: 4, unit: 'quả' }, { id: 'nuoc-mam', qty: 3, unit: 'thìa' }, { id: 'toi', qty: 3, unit: 'tép' }],
    steps: [{ text: 'Luộc trứng 10 phút, bóc vỏ.', timerSec: 600 }, { text: 'Ướp thịt với nước mắm, tỏi 20 phút.', timerSec: 1200 }, { text: 'Xào săn thịt, thêm nước ngập, cho trứng vào kho nhỏ lửa.', timerSec: 1800 }] },
  { id: 'r8', title: 'Mì xào cải thảo', minutes: 12, difficulty: 'easy', kcal: 450, baseServings: 1, cheap: true,
    ingredients: [{ id: 'mi-goi', qty: 2, unit: 'gói' }, { id: 'cai-thao', qty: 3, unit: 'lá' }, { id: 'trung', qty: 1, unit: 'quả', optional: true }, { id: 'toi', qty: 2, unit: 'tép' }],
    steps: [{ text: 'Trụng mì 1 phút, để ráo.', timerSec: 60 }, { text: 'Phi tỏi, xào cải thảo đến khi mềm.', timerSec: 120 }, { text: 'Cho mì và gói gia vị vào đảo đều, thêm trứng nếu có.' }] },
  { id: 'r9', title: 'Canh khoai tây cà rốt', minutes: 25, difficulty: 'easy', kcal: 200, baseServings: 3, cheap: true,
    ingredients: [{ id: 'khoai-tay', qty: 2, unit: 'củ' }, { id: 'ca-rot', qty: 1, unit: 'củ' }, { id: 'hanh-la', qty: 1, unit: 'cây' }, { id: 'nuoc-mam', qty: 1, unit: 'thìa' }],
    steps: [{ text: 'Gọt vỏ, cắt khoai tây và cà rốt miếng vừa ăn.' }, { text: 'Đun sôi 1 lít nước, cho rau củ vào nấu mềm.', timerSec: 900 }, { text: 'Nêm nước mắm, rắc hành.' }] },
  { id: 'r10', title: 'Trà gừng ấm', minutes: 8, difficulty: 'easy', kcal: 30, baseServings: 1, cheap: true,
    ingredients: [{ id: 'gung', qty: 1, unit: 'nhánh' }],
    steps: [{ text: 'Thái lát mỏng gừng.' }, { text: 'Hãm với 250 ml nước sôi.', timerSec: 300 }, { text: 'Thêm chút mật ong nếu thích.' }] },
];

export type RecipeMatch = { recipe: (typeof RECIPES)[number]; have: number; total: number; missing: string[] };

/** Tính món nấu được từ nguyên liệu đang có — chạy trên máy, không cần mạng. */
export function matchRecipes(pantry: string[]): RecipeMatch[] {
  const set = new Set(pantry);
  return RECIPES.map((r) => {
    const req = r.ingredients.filter((i) => !i.optional);
    const have = req.filter((i) => set.has(i.id)).length;
    return { recipe: r, have, total: req.length, missing: req.filter((i) => !set.has(i.id)).map((i) => i.id) };
  })
    .filter((m) => m.have > 0)
    .sort((a, b) => (a.missing.length - b.missing.length) || (a.recipe.minutes - b.recipe.minutes));
}
