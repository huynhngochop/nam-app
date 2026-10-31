/**
 * Nhận diện nguyên liệu trên máy (MN-10). Cắm mô hình nhỏ (≤ 15 MB, TFLite/Core ML) qua một Expo module riêng.
 * Bản hiện tại chưa nhúng mô hình: trả về danh sách rỗng để màn chụp chuyển sang bước "Có phải là…" (MN-19)
 * cho người dùng chọn nhanh — luồng vẫn dùng được trọn vẹn.
 */
export type Detection = { ingredientId: string; confidence: number };

export async function detectIngredients(_photoUri: string): Promise<Detection[]> {
  return [];
}

/** Gợi ý chọn nhanh khi chưa nhận ra: nguyên liệu phổ biến nhất ở chợ Việt. */
export const QUICK_GUESSES = [
  'trung',
  'ca-chua',
  'hanh-la',
  'dau-phu',
  'rau-muong',
  'thit-heo',
  'bi-dao',
  'khoai-tay',
  'ca-rot',
  'tom',
  'cai-thao',
  'toi',
];
