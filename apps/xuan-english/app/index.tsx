import { Redirect } from 'expo-router';
import { useXuan } from '../src/store';

/** Chưa có mục tiêu → giới thiệu; đã có → màn Hôm nay. */
export default function Index() {
  const onboarded = useXuan((s) => s.onboarded);
  const hasPlan = useXuan((s) => !!s.plan);
  if (!onboarded) return <Redirect href="/welcome" />;
  if (!hasPlan) return <Redirect href="/goals" />;
  return <Redirect href="/(tabs)/today" />;
}
