import { create } from 'zustand';
import type { FieldValues } from './lib/prayer';
import type { FaceAnswers } from './face/data';
import type { Anniversary } from './lib/schedule';

/** Sổ giỗ vừa đọc từ tệp, chờ người dùng xem và quyết định trùng. */
export type ImportDraft = { from?: string; createdAt: number; list: Anniversary[]; source: 'so-gio' | 'sao-luu' };

/** Dữ liệu tạm (không lưu xuống máy): ô điền cho một lần khấn, bản nháp nhân tướng. */
type Session = {
  extra: FieldValues;
  prayDate: number | null;
  faceDraft: FaceAnswers;
  importDraft: ImportDraft | null;
  set: (p: Partial<Pick<Session, 'extra' | 'prayDate' | 'faceDraft' | 'importDraft'>>) => void;
};
export const useSession = create<Session>((set) => ({
  extra: {},
  prayDate: null,
  faceDraft: {},
  importDraft: null,
  set: (p) => set(p),
}));
