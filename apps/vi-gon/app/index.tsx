import { Redirect } from 'expo-router';
import { useVi } from '../src/store';

export default function Index() {
  const onboarded = useVi((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/home' : '/welcome'} />;
}
