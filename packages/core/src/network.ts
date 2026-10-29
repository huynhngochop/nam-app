import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/** true khi có mạng dùng được. Khởi đầu = true để không nháy banner khi mở app. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(!!s.isConnected && s.isInternetReachable !== false)), []);
  return online;
}
export async function isOnline(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return !!s.isConnected && s.isInternetReachable !== false;
}
