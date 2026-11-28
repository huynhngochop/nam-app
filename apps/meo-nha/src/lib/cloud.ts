import { InteractionManager } from 'react-native';
import { cloudContent, flushQuestions, hasCloud, sendQuestion, updateCloudContent, type CloudItem } from '@nam/core';
import baked from '../data/cloud.json';
import { addCloudTips } from '../data/tips';
import { cloudTips } from './cloudTip';

/**
 * Mẹo Nhà ↔ nam-cloud:
 *  - Mẹo mới (AI viết, trả lời câu hỏi người dùng): đóng sẵn khi build (`data/cloud.json`) + tải thêm theo gói.
 *  - Gửi câu hỏi app chưa trả lời được; câu trả lời quay về như một mẹo mới.
 * Không có máy chủ → chỉ dùng bản đóng sẵn, mọi thứ chạy trên máy.
 */
export const APP = 'meonha';
const BAKED = baked as { version: number; items: CloudItem[] };

let started = false;
/** Gọi một lần khi mở app: nạp mẹo đã có (nhanh), rồi khi rảnh mới tải gói mới và gửi câu hỏi đang chờ. */
export function startCloud() {
  if (started) return;
  started = true;
  cloudContent(APP, BAKED)
    .then((c) => addCloudTips(cloudTips(c.items)))
    .catch(() => {});
  if (!hasCloud()) return;
  InteractionManager.runAfterInteractions(() => {
    updateCloudContent(APP, BAKED)
      .then((next) => next && addCloudTips(cloudTips(next.items)))
      .catch(() => {});
    flushQuestions(APP).catch(() => {});
  });
}

export const askTeam = (q: string) => sendQuestion(APP, q);
export { flushQuestions, hasCloud };
