import { useRouter } from 'expo-router';
import AdWhaleBannerSampleScreen from '../AdWhaleBannerSampleScreen';

export default function AdWhaleBannerScreen() {
  const router = useRouter();

  return (
    <AdWhaleBannerSampleScreen
      onBack={() => router.back()}
    />
  );
}

