import { Redirect } from 'expo-router';
import { useNhip } from '../src/store';

/** NH-01: splash hệ thống; sau đó vào onboarding, phiên đang chạy, hoặc màn Hẹn giờ. */
export default function Index() {
  const onboarded = useNhip((s) => s.onboarded);
  const session = useNhip((s) => s.session);
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (session && session.endAt > Date.now() && Date.now() - session.lastHeartbeatAt < 90_000)
    return <Redirect href="/session" />;
  return <Redirect href="/(tabs)/timer" />;
}
