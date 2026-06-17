import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import 'react-native-reanimated';

import {
  AdWhaleExitPopupAd,
  type AdWhaleExitPopupAdErrorEvent,
  AdWhaleMediationAds,
} from 'adwhale-sdk-react-native';
import { exitPopupPlacementUid } from '../adwhale/config';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const exitPopupGuardRef = useRef(false);
  const exitPopupLoadedRef = useRef(false);
  const exitPopupSubsRef = useRef<EmitterSubscription[]>([]);

  // SDK 초기화 후 Android 한정으로 종료 팝업 광고를 로드합니다.
  useEffect(() => {
    let mounted = true;

    AdWhaleMediationAds.initialize()
      .then(result => {
        if (!mounted) {
          return;
        }
        if (result.statusCode !== 100) {
          console.warn(
            '[RootLayout] AdWhale init failed',
            'statusCode:',
            result.statusCode,
            'message:',
            result.message,
          );
          return;
        }

        if (Platform.OS === 'android') {
          const subs = AdWhaleExitPopupAd.addEventListeners({
            onLoaded: () => {
              exitPopupLoadedRef.current = true;
              console.log('[RootLayout] ExitPopupAd onLoaded');
            },
            onLoadFailed: (e: AdWhaleExitPopupAdErrorEvent) => {
              exitPopupLoadedRef.current = false;
              console.warn(
                '[RootLayout] ExitPopupAd onLoadFailed',
                'statusCode:',
                e.statusCode,
                'message:',
                e.message,
              );
            },
            onShowed: () => {
              exitPopupLoadedRef.current = false;
              console.log('[RootLayout] ExitPopupAd onShowed');
            },
            onShowFailed: (e: AdWhaleExitPopupAdErrorEvent) => {
              exitPopupLoadedRef.current = false;
              console.warn(
                '[RootLayout] ExitPopupAd onShowFailed',
                'statusCode:',
                e.statusCode,
                'message:',
                e.message,
              );
            },
            onClosed: () => {
              exitPopupLoadedRef.current = false;
              console.log('[RootLayout] ExitPopupAd onClosed');
            },
            onClicked: () => {
              console.log('[RootLayout] ExitPopupAd onClicked');
            },
          });
          exitPopupSubsRef.current = subs;

          try {
            AdWhaleExitPopupAd.loadAd(exitPopupPlacementUid, {
              primaryButtonText: '테스트 취소',
              secondaryButtonText: '테스트 종료',
              descriptionText: '테스트 문구',
            });
          } catch (e) {
            console.warn('[RootLayout] ExitPopupAd loadAd:', e);
          }
        }
      })
      .catch(e => {
        if (!mounted) {
          return;
        }
        console.warn('[RootLayout] AdWhale init error:', String(e));
      });

    return () => {
      mounted = false;
      exitPopupSubsRef.current.forEach(s => s.remove());
      exitPopupSubsRef.current = [];
    };
  }, []);

  // 하드웨어 뒤로가기(Android) 시 종료 팝업 광고를 노출합니다.
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const onHardwareBackPress = (): boolean => {
      if (exitPopupGuardRef.current) {
        return true;
      }
      if (!exitPopupLoadedRef.current) {
        return false;
      }

      exitPopupGuardRef.current = true;
      try {
        AdWhaleExitPopupAd.showAd();
      } catch (e) {
        console.warn('[RootLayout] showExitPopupAd failed:', e);
        exitPopupGuardRef.current = false;
        return false;
      }

      setTimeout(() => {
        exitPopupGuardRef.current = false;
      }, 2000);

      return true;
    };

    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackPress,
    );
    return () => sub.remove();
  }, []);

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
