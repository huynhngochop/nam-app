import { Redirect } from 'expo-router';
import { useHen } from '../src/store';

export default function Index() {
  const auth = useHen((s) => s.auth);
  const setupDone = useHen((s) => s.setupDone);
  if (!auth) return <Redirect href="/auth" />;
  if (!setupDone && auth.role === 'owner') return <Redirect href="/setup" />;
  return <Redirect href="/(tabs)/calendar" />;
}
