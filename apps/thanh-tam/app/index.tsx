import { Redirect } from 'expo-router';
import { useTT } from '../src/store';

/** TT-01: splash do expo-splash-screen giữ đến khi phông chữ và dữ liệu trên máy sẵn sàng. */
export default function Index() {
  const onboarded = useTT((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/today' : '/onboarding/tradition'} />;
}
