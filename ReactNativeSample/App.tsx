/**
 * App.tsx
 * Flutter main.dart 와 1:1 매핑된 메인 앱 파일입니다.
 *
 * 메뉴:
 *  1. 기본 배너, 전면, 보상형, 네이티브, 앱오프닝 테스트  → AdWhaleGuideSampleScreen
 *  2. 앱 전환 광고 테스트                               → AdWhaleTransitionPopupSampleScreen
 */
import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import * as AdWhaleSdk from 'adwhale-sdk-react-native';
import {AdWhaleExitPopupAd} from 'adwhale-sdk-react-native';
import type {AdWhaleExitPopupAdErrorEvent} from 'adwhale-sdk-react-native';
import AdWhaleGuideSampleScreen from './AdWhaleGuideSampleScreen';
import AdWhaleTransitionPopupSampleScreen from './AdWhaleTransitionPopupSampleScreen';
import {AdConfig} from './config';

type ScreenType = 'menu' | 'guide' | 'transitionPopup';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkErrorText, setSdkErrorText] = useState('');

  // ─── 종료 팝업 광고 (Android 전용) ───────────────────────────────────────
  const exitPopupGuardRef = useRef(false);
  const exitPopupLoadedRef = useRef(false);
  const exitPopupSubsRef = useRef<EmitterSubscription[]>([]);

  useEffect(() => {
    const mediationApi =
      (AdWhaleSdk as any).AdWhaleMediationAds ??
      (AdWhaleSdk as any).AdWhaleMediationSdk;

    if (!mediationApi?.initialize) {
      setSdkErrorText(
        'SDK 초기화 실패\ninitialize API를 찾을 수 없습니다.\n(AdWhaleMediationAds/AdWhaleMediationSdk 미노출)',
      );
      return;
    }

    mediationApi
      .initialize()
      .then((result: any) => {
        // SDK 버전별 반환 타입 대응:
        // - number (0 또는 100 성공)
        // - { isSuccess?, statusCode, message } — statusCode 100 = 초기화 성공
        const isObject = result && typeof result === 'object';
        const statusCode = isObject ? result.statusCode : result;
        const message = isObject ? result.message : '';
        const isSuccess = isObject
          ? result.isSuccess === true || statusCode === 100
          : result === 0 || result === 100;

        if (isSuccess) {
          setSdkReady(true);

          // Android 전용: 종료 팝업 광고 init 시점에 로드
          if (Platform.OS === 'android') {
            const subs = AdWhaleExitPopupAd.addEventListeners({
              onLoaded: () => {
                exitPopupLoadedRef.current = true;
              },
              onLoadFailed: (err: AdWhaleExitPopupAdErrorEvent) => {
                exitPopupLoadedRef.current = false;
                console.warn(
                  '[App] ExitPopupAd onLoadFailed',
                  err.statusCode,
                  err.message,
                );
              },
              onShowed: () => {
                exitPopupLoadedRef.current = false;
              },
              onShowFailed: (err: AdWhaleExitPopupAdErrorEvent) => {
                exitPopupLoadedRef.current = false;
                console.warn(
                  '[App] ExitPopupAd onShowFailed',
                  err.statusCode,
                  err.message,
                );
              },
              onClosed: () => {
                exitPopupLoadedRef.current = false;
              },
              onClicked: () => {},
            });
            exitPopupSubsRef.current = subs;

            try {
              AdWhaleExitPopupAd.loadAd(AdConfig.exitPopupPlacementUid, {
                primaryButtonText: '테스트 취소',
                secondaryButtonText: '테스트 종료',
                descriptionText: '테스트 문구',
              });
            } catch (e) {
              console.warn('[App] ExitPopupAd loadAd:', e);
            }
          }
        } else {
          setSdkErrorText(
            `SDK 초기화 실패\nstatusCode: ${String(statusCode)}${
              message ? `\nmessage: ${message}` : ''
            }`,
          );
        }
      })
      .catch((e: any) => {
        setSdkErrorText(`SDK 초기화 오류: ${e?.message ?? String(e)}`);
      });

    return () => {
      exitPopupSubsRef.current.forEach(s => s.remove());
      exitPopupSubsRef.current = [];
    };
  }, []);

  // ─── 메인 메뉴에서 뒤로가기 → 종료 팝업 (Android 전용) ────────────────────
  useEffect(() => {
    if (currentScreen !== 'menu' || !sdkReady) {
      return;
    }

    const onHardwareBackPress = (): boolean => {
      if (Platform.OS !== 'android') {
        return false;
      }
      // 이미 팝업 처리 중이면 기본 동작 막음
      if (exitPopupGuardRef.current) {
        return true;
      }
      // 로드되지 않았으면 기본 종료 동작 허용
      if (!exitPopupLoadedRef.current) {
        return false;
      }

      exitPopupGuardRef.current = true;
      try {
        AdWhaleExitPopupAd.showAd();
      } catch (e) {
        console.warn('[App] showExitPopupAd failed:', e);
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
  }, [currentScreen, sdkReady]);

  if (sdkErrorText) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{sdkErrorText}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'guide') {
    return (
      <AdWhaleGuideSampleScreen onBack={() => setCurrentScreen('menu')} />
    );
  }

  if (currentScreen === 'transitionPopup') {
    return (
      <AdWhaleTransitionPopupSampleScreen
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  // 메인 메뉴 (Flutter MainMenuPage 와 동일)
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setCurrentScreen('guide')}>
          <Text style={styles.menuButtonText}>
            기본 배너, 전면, 보상형, 네이티브, 앱오프닝 테스트
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setCurrentScreen('transitionPopup')}>
            <Text style={styles.menuButtonText}>앱 전환 광고 테스트</Text>
          </TouchableOpacity>
        )}

        {!sdkReady && (
          <Text style={styles.loadingText}>SDK 초기화 중...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const PURPLE = '#6739F5';

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'white'},
  errorContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  errorText: {fontSize: 15, textAlign: 'center', color: '#d00'},
  menuContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  menuButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    width: '100%',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {fontSize: 13, color: '#888', marginTop: 16},
});

export default App;
