import { Redirect } from 'expo-router';
import { useNhip } from '../src/store';

/** Màn khởi động: sau splash thì vào giới thiệu, phiên đang chạy dở, hoặc màn Hẹn giờ. */
export default function Index() {
  const onboarded = useNhip((s) => s.onboarded);
  const session = useNhip((s) => s.session);
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (session && session.endAt > Date.now() && Date.now() - session.lastHeartbeatAt < 90_000)
    return <Redirect href="/session" />;
  return <Redirect href="/(tabs)/timer" />;
}
