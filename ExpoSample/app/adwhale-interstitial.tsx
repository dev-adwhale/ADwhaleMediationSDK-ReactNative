import { useRouter } from 'expo-router';
import AdWhaleInterstitialSampleScreen from '../AdWhaleInterstitialSampleScreen';

export default function AdWhaleInterstitialScreen() {
  const router = useRouter();

  return (
    <AdWhaleInterstitialSampleScreen
      onBack={() => router.back()}
    />
  );
}

