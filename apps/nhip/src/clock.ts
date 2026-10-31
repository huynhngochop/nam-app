import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Đồng hồ hiển thị: chỉ chạy khi app ở tiền cảnh; giá trị luôn tính lại từ endAt nên không bị lệch. */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setInterval> | null = setInterval(() => setNow(Date.now()), intervalMs);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        setNow(Date.now());
        if (!t) t = setInterval(() => setNow(Date.now()), intervalMs);
      } else if (t) {
        clearInterval(t);
        t = null;
      }
    });
    return () => {
      if (t) clearInterval(t);
      sub.remove();
    };
  }, [active, intervalMs]);
  return now;
}
