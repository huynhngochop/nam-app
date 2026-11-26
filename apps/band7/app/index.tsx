import { Redirect } from 'expo-router';
import { useBand7 } from '../src/store';

/** Chưa có mục tiêu → giới thiệu; đã có → màn Hôm nay. */
export default function Index() {
  const onboarded = useBand7((s) => s.onboarded);
  const hasPlan = useBand7((s) => !!s.plan);
  if (!onboarded) return <Redirect href="/welcome" />;
  if (!hasPlan) return <Redirect href="/goals" />;
  return <Redirect href="/(tabs)/today" />;
}
