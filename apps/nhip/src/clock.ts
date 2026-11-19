import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Đồng hồ hiển thị: chỉ chạy khi app ở tiền cảnh; giá trị luôn tính lại từ endAt nên không bị lệch. */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    let ticker: ReturnType<typeof setInterval> | null = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        setNow(Date.now());
        if (!ticker) ticker = setInterval(() => setNow(Date.now()), intervalMs);
      } else if (ticker) {
        clearInterval(ticker);
        ticker = null;
      }
    });
    return () => {
      if (ticker) clearInterval(ticker);
      sub.remove();
    };
  }, [active, intervalMs]);
  return now;
}
