import { InteractionManager } from 'react-native';
import { cloudContent, flushQuestions, hasCloud, sendQuestion, updateCloudContent, type CloudItem } from '@nam/core';
import baked from '../data/cloud.json';
import { addCloudFaqs } from './ask';
import { cloudFaqs } from './cloudFaq';

/**
 * Thành Tâm ↔ nam-cloud. Chỉ gửi đi khi người dùng tự bấm "Gửi câu hỏi" (đúng câu chữ họ gõ, không kèm sổ giỗ
 * hay thông tin gia đình). Câu trả lời được biên tập rồi quay về như câu hỏi đáp mới trong "Hỏi Thành Tâm".
 */
export const APP = 'thanhtam';
const BAKED = baked as { version: number; items: CloudItem[] };

let started = false;
export function startCloud() {
  if (started) return;
  started = true;
  cloudContent(APP, BAKED)
    .then((c) => addCloudFaqs(cloudFaqs(c.items)))
    .catch(() => {});
  if (!hasCloud()) return;
  InteractionManager.runAfterInteractions(() => {
    updateCloudContent(APP, BAKED)
      .then((next) => next && addCloudFaqs(cloudFaqs(next.items)))
      .catch(() => {});
    flushQuestions(APP).catch(() => {});
  });
}

export const askTeam = (q: string) => sendQuestion(APP, q);
export { flushQuestions, hasCloud };
