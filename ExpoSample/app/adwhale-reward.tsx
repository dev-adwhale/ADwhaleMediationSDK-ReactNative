import { useRouter } from 'expo-router';
import AdWhaleRewardSampleScreen from '../AdWhaleRewardSampleScreen';

export default function AdWhaleRewardScreen() {
  const router = useRouter();

  return (
    <AdWhaleRewardSampleScreen
      onBack={() => router.back()}
    />
  );
}

