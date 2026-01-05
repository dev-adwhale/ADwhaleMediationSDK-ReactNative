import { useRouter } from 'expo-router';
import AdWhaleNativeSampleScreen from '../AdWhaleNativeSampleScreen';

export default function AdWhaleNativeScreen() {
  const router = useRouter();

  return (
    <AdWhaleNativeSampleScreen
      onBack={() => router.back()}
    />
  );
}

