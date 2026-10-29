import { AiUnavailableError, callAi } from '@nam/core';

export type PromoGoal = 'lunch' | 'lapsed' | 'birthday' | 'new_service';
export type PromoTone = 'friendly' | 'polite' | 'fun';
export const GOAL_LABEL: Record<PromoGoal, string> = { lunch: 'Lấp khung trưa', lapsed: 'Khách lâu chưa đến', birthday: 'Sinh nhật', new_service: 'Dịch vụ mới' };
export const TONE_LABEL: Record<PromoTone, string> = { friendly: 'Thân thiện', polite: 'Lịch sự', fun: 'Vui vẻ' };

type Input = { shopName: string; link: string; goal: PromoGoal; tone: PromoTone; offerPct: number; window?: string };

/** Bản nháp theo mẫu (không cần AI) — luôn có link đặt lịch, ≤ 160 ký tự. */
export function templateVariants(i: Input): string[] {
  const w = i.window ?? '12h–14h';
  const off = `${i.offerPct}%`;
  const T: Record<PromoGoal, Record<PromoTone, string[]>> = {
    lunch: {
      friendly: [`${i.shopName} nhớ bạn! Tuần này đặt lịch ${w} giảm ${off}. Đặt nhanh: ${i.link}`, `Trưa rảnh ghé ${i.shopName} nhé — giảm ${off} mọi dịch vụ ${w}, chỉ tuần này. ${i.link}`],
      polite: [`${i.shopName} trân trọng gửi ưu đãi giảm ${off} cho lịch hẹn ${w} trong tuần này. Đặt lịch: ${i.link}`, `Quý khách đặt lịch khung ${w} tuần này được giảm ${off}. Đặt tại: ${i.link}`],
      fun: [`Giờ trưa = giờ làm đẹp! Giảm ${off} khung ${w} tại ${i.shopName}. Chốt lịch: ${i.link}`, `Trưa nay đi đâu? Ghé ${i.shopName} giảm ${off} nè! ${i.link}`],
    },
    lapsed: {
      friendly: [`Lâu rồi chưa gặp bạn! ${i.shopName} tặng bạn ${off} cho lần hẹn tới. Đặt lịch: ${i.link}`, `${i.shopName} nhớ bạn nhiều. Quay lại tuần này giảm ${off} nhé: ${i.link}`],
      polite: [`${i.shopName} kính mời quý khách quay lại với ưu đãi ${off} cho lần hẹn kế tiếp. Đặt lịch: ${i.link}`, `Cảm ơn quý khách đã tin chọn ${i.shopName}. Ưu đãi ${off} đang chờ bạn: ${i.link}`],
      fun: [`Tóc đang “nhớ” thợ rồi đó! Giảm ${off} khi quay lại ${i.shopName}: ${i.link}`, `Đã đến lúc làm mới bản thân! ${off} cho bạn tại ${i.shopName}: ${i.link}`],
    },
    birthday: {
      friendly: [`Chúc mừng sinh nhật! ${i.shopName} tặng bạn ${off} trong tháng này. Đặt lịch: ${i.link}`, `Sinh nhật vui vẻ! Quà từ ${i.shopName}: giảm ${off}. ${i.link}`],
      polite: [`${i.shopName} kính chúc quý khách sinh nhật an vui và gửi tặng ưu đãi ${off}. Đặt lịch: ${i.link}`, `Mừng sinh nhật quý khách, ${i.shopName} gửi tặng ${off}: ${i.link}`],
      fun: [`Tuổi mới, diện mạo mới! ${i.shopName} tặng ${off} nè: ${i.link}`, `Sinh nhật phải xinh! Giảm ${off} tại ${i.shopName}: ${i.link}`],
    },
    new_service: {
      friendly: [`${i.shopName} vừa có dịch vụ mới! Thử ngay với ưu đãi ${off}: ${i.link}`, `Có gì mới ở ${i.shopName}? Ghé thử, giảm ${off} tuần đầu: ${i.link}`],
      polite: [`${i.shopName} trân trọng giới thiệu dịch vụ mới, ưu đãi ${off} cho khách đặt sớm: ${i.link}`, `Dịch vụ mới tại ${i.shopName}, giảm ${off} trong tuần ra mắt: ${i.link}`],
      fun: [`Hàng mới về! Dịch vụ mới ở ${i.shopName} giảm ${off}: ${i.link}`, `Thử cái mới không? ${i.shopName} giảm ${off} nè: ${i.link}`],
    },
  };
  return T[i.goal][i.tone].map((x) => x.slice(0, 160));
}

/** AI soạn (HD-C19). Kiểm tra: phải có link, đúng % ưu đãi đã nhập; sai → dùng mẫu. */
export async function generatePromo(i: Input): Promise<{ variants: string[]; viaAi: boolean }> {
  try {
    const r = await callAi<{ variants: string[] }>('promo', { goal: i.goal, tone: i.tone, offer: i.offerPct, timeWindow: i.window, shop: i.shopName, link: i.link });
    const ok = r.variants.filter((v) => v.includes(i.link) && v.includes(`${i.offerPct}%`) && v.length <= 200);
    if (ok.length) return { variants: ok.slice(0, 3), viaAi: true };
  } catch (e) {
    if (!(e instanceof AiUnavailableError)) throw e;
  }
  return { variants: templateVariants(i), viaAi: false };
}
