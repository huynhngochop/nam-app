/** Một mục nội dung từ máy chủ nam-cloud (mẹo, hướng dẫn, câu hỏi đáp). Không import gì để dùng được trong test. */
export type CloudItem = {
  id: string;
  kind: string;
  topic: string;
  title: string;
  body: Record<string, unknown>;
  tags: string[];
  updated_at: string;
};
