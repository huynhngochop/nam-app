import { Redirect } from 'expo-router';
import { useMeo } from '../src/store';

/** Màn khởi động: giữ splash đến khi phông và dữ liệu sẵn sàng, rồi chuyển tới giới thiệu hoặc tab Khám phá. */
export default function Index() {
  const onboarded = useMeo((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/explore' : '/onboarding/interests'} />;
}
