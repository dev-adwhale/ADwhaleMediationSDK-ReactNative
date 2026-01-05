import { useRouter } from 'expo-router';
import AdWhaleAppOpenSampleScreen from '../AdWhaleAppOpenSampleScreen';

export default function AdWhaleAppOpenScreen() {
  const router = useRouter();

  return (
    <AdWhaleAppOpenSampleScreen
      onBack={() => router.back()}
    />
  );
}

