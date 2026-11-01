import { create } from 'zustand';
import type { FieldValues } from './lib/prayer';
import type { FaceAnswers } from './face/data';

/** Dữ liệu tạm (không lưu xuống máy): ô điền cho một lần khấn, bản nháp nhân tướng. */
type Session = {
  extra: FieldValues;
  prayDate: number | null;
  faceDraft: FaceAnswers;
  set: (p: Partial<Pick<Session, 'extra' | 'prayDate' | 'faceDraft'>>) => void;
};
export const useSession = create<Session>((set) => ({ extra: {}, prayDate: null, faceDraft: {}, set: (p) => set(p) }));
