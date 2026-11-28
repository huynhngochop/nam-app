import { Redirect } from 'expo-router';
import { useEmma } from '../src/store';

/** Chưa có mục tiêu → giới thiệu; đã có → màn Hôm nay. */
export default function Index() {
  const onboarded = useEmma((s) => s.onboarded);
  const hasPlan = useEmma((s) => !!s.plan);
  if (!onboarded) return <Redirect href="/welcome" />;
  if (!hasPlan) return <Redirect href="/goals" />;
  return <Redirect href="/(tabs)/today" />;
}
