import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen 
          name="adwhale-app-open" 
          options={{ 
            title: '앱 오프닝 광고',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="adwhale-banner" 
          options={{ 
            title: '배너 광고',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="adwhale-interstitial" 
          options={{ 
            title: '전면 광고',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="adwhale-native" 
          options={{ 
            title: '네이티브 광고',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="adwhale-reward" 
          options={{ 
            title: '보상형 광고',
            headerShown: false 
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
