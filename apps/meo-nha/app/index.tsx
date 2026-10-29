import { Redirect } from 'expo-router';
import { useMeo } from '../src/store';

/** MN-01: splash do expo-splash-screen hiển thị đến khi phông + dữ liệu sẵn sàng; sau đó chuyển màn. */
export default function Index() {
  const onboarded = useMeo((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/explore' : '/onboarding/interests'} />;
}
