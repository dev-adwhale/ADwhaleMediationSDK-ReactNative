/**
 * Flutter `android/guide_sample_android.dart` 와 같은 역할:
 * 한 화면에서 TFUA/MaxRating/COPPA/GDPR/로거/볼륨·뮤트 설정 후
 * 광고 타입(배너·전면·보상·네이티브 템플릿/커스텀·앱오프닝)을 전환하며 테스트합니다.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Clipboard,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AdWhaleMediationAds,
  AdWhaleAdView,
  AdWhaleAdSize,
  AdWhaleInterstitialAd,
  AdWhaleRewardAd,
  AdWhaleAppOpenAd,
  AdWhaleNativeTemplateView,
  AdWhaleNativeCustomView,
} from 'adwhale-sdk-react-native';
import type { AdWhaleNativeTemplateHandle } from 'adwhale-sdk-react-native';
import type { AdWhaleNativeCustomHandle } from 'adwhale-sdk-react-native';
import type { AdWhaleInterstitialErrorEvent } from 'adwhale-sdk-react-native';
import type { AdWhaleRewardErrorEvent } from 'adwhale-sdk-react-native';
import type { AdWhaleAppOpenErrorEvent } from 'adwhale-sdk-react-native';
import type { AdWhaleNativeTemplateError } from 'adwhale-sdk-react-native';
import type { AdWhaleNativeCustomError } from 'adwhale-sdk-react-native';
import {
  bannerAdUnitIdForCurrentPlatform,
  defaultBannerPlacementOrIosAdUnitId,
  interstitialPlacementUid1,
  rewardPlacementUid1,
  nativePlacementUid,
  appOpenPlacementUid,
} from './config';

const ACCENT = '#6739F5';

const SCREEN = Dimensions.get('window');

const TFUA_LABELS = [
  'TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE',
  'TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE',
  'TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED',
] as const;

const MAX_RATING_LABELS = [
  'MAX_AD_CONTENT_RATING_G',
  'MAX_AD_CONTENT_RATING_PG',
  'MAX_AD_CONTENT_RATING_T',
  'MAX_AD_CONTENT_RATING_MA',
] as const;

const MAX_RATING_API: (string | null)[] = [
  '.general',
  '.parentalGuidance',
  '.teen',
  '.matureAudience',
];

export interface GuideSampleAndroidScreenProps {
  onBack?: () => void;
}

type AdType = 0 | 1 | 2 | 3 | 4 | 5;
type NativeTemplateSize = 'SMALL' | 'MEDIUM' | 'FULLSCREEN';

const GuideSampleAndroidScreen: React.FC<GuideSampleAndroidScreenProps> = ({
  onBack,
}) => {
  const isIos = Platform.OS === 'ios';

  const [tfuaModeIndex, setTfuaModeIndex] = useState(2);
  const [maxRatingIndex, setMaxRatingIndex] = useState(3);
  const [isCoppa, setIsCoppa] = useState(false);
  const [isLoggerOn, setIsLoggerOn] = useState(false);
  const [isAppMuted, setIsAppMuted] = useState(false);
  const [appVolumeText, setAppVolumeText] = useState('0.1');

  const [selectedAdType, setSelectedAdType] = useState<AdType>(0);
  const [placementUidByType, setPlacementUidByType] = useState<
    Record<number, string>
  >({
    0: defaultBannerPlacementOrIosAdUnitId,
    1: interstitialPlacementUid1,
    2: rewardPlacementUid1,
    3: nativePlacementUid,
    4: nativePlacementUid,
    5: appOpenPlacementUid,
  });
  const [placementUidInput, setPlacementUidInput] = useState(
    defaultBannerPlacementOrIosAdUnitId,
  );

  const [selectedBannerSize, setSelectedBannerSize] = useState(0);
  const [adaptiveWidthText, setAdaptiveWidthText] = useState('0');
  const [selectedTemplateSize, setSelectedTemplateSize] =
    useState<NativeTemplateSize>('SMALL');

  const [debugInfo, setDebugInfo] = useState(
    'Please touch [광고 로드] button.',
  );

  // --- 배너 하단 슬롯 ---
  // 기본 배너 테스트: 진입 시에는 로드하지 않고, "광고 로드" 버튼에서만 로드합니다.
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerLoadReady, setBannerLoadReady] = useState(false);
  const [bannerLoadNonce, setBannerLoadNonce] = useState(0);
  const [bannerPlacementUid, setBannerPlacementUid] = useState('');
  const [bannerAdSize, setBannerAdSize] = useState<AdWhaleAdSize>(
    AdWhaleAdSize.BANNER_320x50,
  );
  const [bannerAdaptiveW, setBannerAdaptiveW] = useState(0);

  // --- 전면 / 보상 / 앱오프닝 ---
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardLoaded, setRewardLoaded] = useState(false);
  const [appOpenLoaded, setAppOpenLoaded] = useState(false);

  // --- 보상형 SSV(서버 사이드 검증) 테스트용 입력값 ---
  // QA 가 APK/TestFlight 로 다양한 값으로 바꿔가며 테스트할 수 있도록
  // 하드코딩 대신 UI 입력값을 사용합니다. 기본값은 기존 하드코딩 값으로 둡니다.
  const [rewardUserId, setRewardUserId] = useState('test_user_001');
  const [rewardRequestId, setRewardRequestId] = useState('test_request_001');
  const [rewardSessionId, setRewardSessionId] = useState('test_session_001');

  // --- 네이티브 ---
  const [nativeKind, setNativeKind] = useState<'none' | 'template' | 'custom'>(
    'none',
  );
  const [nativeLoaded, setNativeLoaded] = useState(false);
  const [nativeShown, setNativeShown] = useState(false);
  const [nativeMountNonce, setNativeMountNonce] = useState(0);
  const [nativeLayoutReady, setNativeLayoutReady] = useState(false);
  /** Fullscreen template: Modal hosts the view from load; transparent until Show. */
  const [nativeFullscreenSession, setNativeFullscreenSession] =
    useState(false);
  const [nativeFullscreenReveal, setNativeFullscreenReveal] =
    useState(false);
  const templateRef = useRef<AdWhaleNativeTemplateHandle | null>(null);
  const customRef = useRef<AdWhaleNativeCustomHandle | null>(null);

  const currentPlacementUid = () => {
    const t = placementUidInput.trim();
    if (t.length > 0) {
      return t;
    }
    return placementUidByType[selectedAdType] ?? '';
  };

  const bannerEnumForSize = (idx: number): AdWhaleAdSize => {
    switch (idx) {
      case 0:
        return AdWhaleAdSize.BANNER_320x50;
      case 1:
        return AdWhaleAdSize.BANNER_320x100;
      case 2:
        return AdWhaleAdSize.BANNER_300x250;
      case 3:
        return AdWhaleAdSize.BANNER_250x250;
      default:
        return AdWhaleAdSize.ADAPTIVE_ANCHOR;
    }
  };

  const bannerHeightFor = (size: AdWhaleAdSize) => {
    switch (size) {
      case AdWhaleAdSize.BANNER_320x50:
        return 50;
      case AdWhaleAdSize.BANNER_320x100:
        return 100;
      case AdWhaleAdSize.BANNER_300x250:
      case AdWhaleAdSize.BANNER_250x250:
        return 250;
      default:
        return 50;
    }
  };

  const nativeAdHeightForCurrent = () => {
    if (selectedAdType === 4) {
      return 720;
    }
    switch (selectedTemplateSize) {
      case 'SMALL':
        return 320;
      case 'MEDIUM':
        return 520;
      case 'FULLSCREEN':
        return 0;
      default:
        return 320;
    }
  };

  // SDK 초기화
  useEffect(() => {
    AdWhaleMediationAds.initialize()
      .then(r => {
        if (r.statusCode === 100) {
          setDebugInfo(prev => `SDK 초기화 성공: ${r.message}\n${prev}`);
        } else {
          setDebugInfo(
            prev =>
              `SDK 초기화 실패(status: ${r.statusCode}): ${r.message}\n${prev}`,
          );
        }
      })
      .catch(e => {
        setDebugInfo(prev => `SDK 초기화 에러: ${String(e)}\n${prev}`);
      });
  }, []);

  // 네이티브 배너가 0x0으로 측정되기 전에 로드가 걸리지 않도록,
  // 첫 렌더 이후 한 프레임(0ms timeout) 뒤에 loadAd=true로 전환합니다.
  useEffect(() => {
    const t = setTimeout(() => setBannerLoadReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Flutter initState postFrame 와 유사: MaxRating + TFUA(2 제외) 적용
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (tfuaModeIndex !== 2) {
          AdWhaleMediationAds.setTagForUnderAgeOfConsent(tfuaModeIndex === 0);
        }
      } catch (e) {
        console.warn('TFUA apply', e);
      }
      try {
        AdWhaleMediationAds.setMaxAdContentRating(
          MAX_RATING_API[maxRatingIndex],
        );
      } catch (e) {
        console.warn('MaxRating apply', e);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const applyTfuaMode = async (index: number) => {
    try {
      if (index === 2) {
        console.log(
          '[GuideSampleAndroid] TFUA: TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED 선택. RN은 현재 boolean API만 제공해 UNSPECIFIED(int) 적용이 불가합니다.',
        );
        return;
      }
      AdWhaleMediationAds.setTagForUnderAgeOfConsent(index === 0);
    } catch (e) {
      console.warn('setTagForUnderAgeOfConsent', e);
    }
  };

  const applyMaxRating = async (index: number) => {
    try {
      AdWhaleMediationAds.setMaxAdContentRating(MAX_RATING_API[index]);
    } catch (e) {
      console.warn('setMaxAdContentRating', e);
    }
  };

  const onAdTypeChanged = (newType: AdType) => {
    const updated = {
      ...placementUidByType,
      [selectedAdType]: placementUidInput.trim(),
    };
    setPlacementUidByType(updated);
    setSelectedAdType(newType);
    setPlacementUidInput(updated[newType] ?? '');

    // 배너는 "배너" 타입일 때만 노출되게 유지:
    // 전면/보상형/네이티브/앱오프닝 타입으로 변경하면
    // 하단 배너가 남아 혼동되는 현상을 방지합니다.
    if (newType !== 0) {
      setBannerActive(false);
      setBannerPlacementUid('');
      setBannerLoadReady(false);
      setBannerLoadNonce(n => n + 1);
    }

    // 다른 타입으로 전환 시, 이전 타입에서 "로드 완료" 상태가 남아
    // 광고표시 버튼이 잘못 활성화되는 것을 방지합니다.
    if (newType !== 1) setInterstitialLoaded(false);
    if (newType !== 2) setRewardLoaded(false);
    if (newType !== 3 && newType !== 4) {
      setNativeKind('none');
      setNativeLoaded(false);
      setNativeShown(false);
      setNativeFullscreenSession(false);
      setNativeFullscreenReveal(false);
    }
    // 네이티브는 템플릿/커스텀 타입 전환 시에도 이전 뷰가 남지 않게 정리합니다.
    if (newType === 3 && nativeKind !== 'template') {
      setNativeKind('none');
      setNativeLoaded(false);
      setNativeShown(false);
      setNativeLayoutReady(false);
      setNativeFullscreenSession(false);
      setNativeFullscreenReveal(false);
    }
    if (newType === 4 && nativeKind !== 'custom') {
      setNativeKind('none');
      setNativeLoaded(false);
      setNativeShown(false);
      setNativeLayoutReady(false);
      setNativeFullscreenSession(false);
      setNativeFullscreenReveal(false);
    }
    if (newType !== 5) setAppOpenLoaded(false);
  };

  // 전면 이벤트
  useEffect(() => {
    const subs = AdWhaleInterstitialAd.addEventListeners({
      onLoaded: () => {
        setInterstitialLoaded(true);
        setDebugInfo('전면 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setInterstitialLoaded(false);
        setDebugInfo(`전면 로드 실패: ${e.statusCode} ${e.message}\n`);
      },
      onShowFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setInterstitialLoaded(false);
        setDebugInfo(`전면 표시 실패: ${e.statusCode} ${e.message}\n`);
      },
      onClosed: () => {
        setInterstitialLoaded(false);
        setDebugInfo('전면 닫힘\n');
      },
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  // 보상 이벤트
  useEffect(() => {
    const subs = AdWhaleRewardAd.addEventListeners({
      onLoaded: () => {
        setRewardLoaded(true);
        setDebugInfo('보상형 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleRewardErrorEvent) => {
        setRewardLoaded(false);
        setDebugInfo(`보상형 로드 실패: ${e.statusCode} ${e.message}\n`);
      },
      onShowFailed: (e: AdWhaleRewardErrorEvent) => {
        setDebugInfo(`보상형 표시 실패: ${e.statusCode} ${e.message}\n`);
      },
      onDismissed: () => {
        setRewardLoaded(false);
        setDebugInfo('보상형 닫힘\n');
      },
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  // 앱 오프닝 이벤트
  useEffect(() => {
    const subs = AdWhaleAppOpenAd.addEventListeners({
      onLoaded: () => {
        setAppOpenLoaded(true);
        setDebugInfo('앱오프닝 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleAppOpenErrorEvent) => {
        setAppOpenLoaded(false);
        setDebugInfo(`앱오프닝 로드 실패: ${e.statusCode} ${e.message}\n`);
      },
      onShowFailed: (e: AdWhaleAppOpenErrorEvent) => {
        setAppOpenLoaded(false);
        setDebugInfo(`앱오프닝 표시 실패: ${e.statusCode} ${e.message}\n`);
      },
      onDismissed: () => {
        setAppOpenLoaded(false);
        setDebugInfo('앱오프닝 닫힘\n');
      },
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  const snack = (msg: string) => {
    Alert.alert('', msg);
  };

  const closeFullscreenTemplate = () => {
    setNativeFullscreenSession(false);
    setNativeFullscreenReveal(false);
    setNativeLoaded(false);
    setNativeShown(false);
    setNativeLayoutReady(false);
    setNativeKind('none');
  };

  const onTemplateSizeChange = (val: NativeTemplateSize) => {
    if (
      selectedTemplateSize === 'FULLSCREEN' &&
      val !== 'FULLSCREEN' &&
      nativeFullscreenSession
    ) {
      setNativeFullscreenSession(false);
      setNativeFullscreenReveal(false);
      setNativeLoaded(false);
      setNativeShown(false);
      setNativeLayoutReady(false);
      setNativeMountNonce(n => n + 1);
    }
    if (
      val === 'FULLSCREEN' &&
      selectedTemplateSize !== 'FULLSCREEN' &&
      nativeKind === 'template'
    ) {
      setNativeFullscreenSession(false);
      setNativeFullscreenReveal(false);
      setNativeLoaded(false);
      setNativeShown(false);
      setNativeLayoutReady(false);
      setNativeMountNonce(n => n + 1);
    }
    setSelectedTemplateSize(val);
  };

  const onBannerLoad = () => {
    if (selectedAdType !== 0) {
      return;
    }
    const sizeEnum = bannerEnumForSize(selectedBannerSize);
    let adaptiveW = 0;
    if (sizeEnum === AdWhaleAdSize.ADAPTIVE_ANCHOR) {
      const p = parseInt(adaptiveWidthText.trim(), 10);
      if (!Number.isNaN(p) && p >= 0) {
        adaptiveW = p;
      }
    }
    const bannerUid = bannerAdUnitIdForCurrentPlatform(currentPlacementUid(), {
      adSizeIsAdaptiveAnchor: sizeEnum === AdWhaleAdSize.ADAPTIVE_ANCHOR,
    });
    setBannerPlacementUid(bannerUid);
    setBannerAdSize(sizeEnum);
    setBannerAdaptiveW(adaptiveW);
    setBannerLoadReady(true);
    setBannerActive(true);
    // loadAd가 이미 true여도 다시 load 되도록, 매 요청마다 remount 유도
    setBannerLoadNonce(n => n + 1);
    setDebugInfo(`배너 요청\nplacement: ${bannerUid}\nsize: ${sizeEnum}\n`);
  };

  const iosNonBannerBlocked = () => {
    if (
      isIos &&
      selectedAdType !== 1 &&
      selectedAdType !== 2 &&
      selectedAdType !== 4 &&
      selectedAdType !== 5
    ) {
      snack(
        'iOS에서는 현재 전면/보상형/네이티브(커스텀)/앱오프닝만 지원합니다.',
      );
      return true;
    }
    return false;
  };

  const onLoadNonBanner = () => {
    if (iosNonBannerBlocked()) {
      return;
    }
    const uid = currentPlacementUid();
    if (!uid) {
      snack('placement uid 를 입력하세요.');
      return;
    }
    switch (selectedAdType) {
      case 1:
        setInterstitialLoaded(false);
        AdWhaleInterstitialAd.loadAd(uid, {
          placementName: 'test_interstitial',
          region: '서울시 서초구',
          gcoder: { lt: 37.49, lng: 127.02 },
        });
        break;
      case 2: {
        setRewardLoaded(false);
        // 보상형 SSV: UI 입력값을 사용 (기본값은 기존 하드코딩 값)
        const rewardCustomData: { [key: string]: string } = {
          request_id: rewardRequestId,
          session_id: rewardSessionId,
          os: isIos ? 'Expo-iOS' : 'Expo-Android',
        };
        AdWhaleRewardAd.loadAd(uid, {
          placementName: 'test_reward',
          region: 'test_reward_region',
          gcoder: { lt: 37.5, lng: 126.9 },
          userId: rewardUserId || undefined,
          customData: rewardCustomData,
        });
        setDebugInfo(
          `보상형 광고 로드 시작...\nuserId: ${rewardUserId || 'N/A'}\ncustomData: ${JSON.stringify(rewardCustomData)}\n`,
        );
        break;
      }
      case 3:
        if (isIos) {
          snack('iOS 네이티브 템플릿은 Flutter 가이드와 동일하게 이 샘플에서 제외됩니다.');
          return;
        }
        setNativeKind('template');
        setNativeLoaded(false);
        setNativeShown(false);
        if (selectedTemplateSize === 'FULLSCREEN') {
          setNativeFullscreenSession(true);
          setNativeFullscreenReveal(false);
          setNativeLayoutReady(false);
        } else {
          setNativeFullscreenSession(false);
          setNativeFullscreenReveal(false);
        }
        setNativeMountNonce(n => n + 1);
        break;
      case 4:
        setNativeKind('custom');
        setNativeLoaded(false);
        setNativeShown(false);
        setNativeMountNonce(n => n + 1);
        break;
      case 5:
        setAppOpenLoaded(false);
        AdWhaleAppOpenAd.loadAd(uid, {
          placementName: 'test_app_open',
          region: '서울시 강남구',
          gcoder: { lt: 37.5665, lng: 126.978 },
        });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (nativeKind === 'none') {
      return;
    }
    if (!nativeLayoutReady) {
      return;
    }

    // layout 측정이 끝난 뒤에 loadAd()를 호출해야 "뷰 크기 0" 문제를 피할 수 있습니다.
    const id = setTimeout(() => {
      if (nativeKind === 'template') {
        templateRef.current?.loadAd();
      } else if (nativeKind === 'custom') {
        customRef.current?.loadAd();
      }
    }, 0);
    return () => clearTimeout(id);
  }, [nativeKind, nativeMountNonce, nativeLayoutReady]);

  const onShowNonBanner = () => {
    if (iosNonBannerBlocked()) {
      return;
    }
    switch (selectedAdType) {
      case 1:
        if (!interstitialLoaded) {
          snack('전면 광고를 먼저 로드해 주세요.');
          return;
        }
        AdWhaleInterstitialAd.showAd();
        setInterstitialLoaded(false);
        break;
      case 2:
        if (!rewardLoaded) {
          snack('보상형 광고를 먼저 로드해 주세요.');
          return;
        }
        AdWhaleRewardAd.showAd();
        setRewardLoaded(false);
        break;
      case 3:
        if (!nativeLoaded || nativeKind !== 'template') {
          snack('네이티브 템플릿 광고를 먼저 로드해 주세요.');
          return;
        }
        if (selectedTemplateSize === 'FULLSCREEN') {
          setNativeFullscreenReveal(true);
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              templateRef.current?.showAd();
            }, 120);
          });
        } else {
          templateRef.current?.showAd();
        }
        setNativeLoaded(false);
        setNativeShown(true);
        break;
      case 4:
        if (!nativeLoaded || nativeKind !== 'custom') {
          snack('네이티브 커스텀 광고를 먼저 로드해 주세요.');
          return;
        }
        customRef.current?.showAd();
        setNativeLoaded(false);
        setNativeShown(true);
        break;
      case 5:
        if (!appOpenLoaded) {
          snack('앱오프닝 광고를 먼저 로드해 주세요.');
          return;
        }
        AdWhaleAppOpenAd.showAd();
        break;
      default:
        break;
    }
  };

  const onClearAds = () => {
    setBannerActive(false);
    setBannerPlacementUid('');
    setBannerLoadNonce(n => n + 1);
    setInterstitialLoaded(false);
    setRewardLoaded(false);
    setAppOpenLoaded(false);
    setNativeKind('none');
    setNativeLoaded(false);
    setNativeShown(false);
    setNativeLayoutReady(false);
    setNativeFullscreenSession(false);
    setNativeFullscreenReveal(false);
    setDebugInfo('Please touch [광고 로드] button.');
  };

  const onCopyDebug = async () => {
    if (!debugInfo.trim()) {
      snack('복사할 내용이 없습니다.');
      return;
    }
    await Clipboard.setString(debugInfo);
    snack('Copy success!');
  };

  const purpleSmall = (
    label: string,
    onPress: (() => void) | null,
    key?: string,
  ) => (
    <TouchableOpacity
      key={key ?? label}
      style={[styles.smallBtn, !onPress && styles.smallBtnDisabled]}
      disabled={!onPress}
      onPress={onPress ?? undefined}>
      <Text style={styles.smallBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  const purpleBtn = (
    label: string,
    onPress: (() => void) | null,
    disabled = false,
  ) => (
    <TouchableOpacity
      style={[styles.bigBtn, (disabled || !onPress) && styles.bigBtnDisabled]}
      disabled={disabled || !onPress}
      onPress={onPress ?? undefined}>
      <Text style={styles.bigBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  const adTypeRow = (value: AdType, label: string) => (
    <TouchableOpacity
      key={value}
      style={styles.radioRow}
      onPress={() => onAdTypeChanged(value)}>
      <View
        style={[
          styles.radioOuter,
          selectedAdType === value && styles.radioOuterOn,
        ]}>
        {selectedAdType === value ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const placementHint = useMemo(() => {
    if (
      isIos &&
      (selectedAdType === 1 ||
        selectedAdType === 2 ||
        selectedAdType === 4 ||
        selectedAdType === 5)
    ) {
      const m =
        selectedAdType === 1
          ? 'iOS 전면: 예제는 placement 입력값으로 로드합니다(Flutter 는 Ad Unit ID 분리).'
          : selectedAdType === 2
            ? 'iOS 보상형: 동일.'
            : selectedAdType === 4
              ? 'iOS 네이티브 커스텀: 동일.'
              : 'iOS 앱오프닝: 동일.';
      return m;
    }
    return null;
  }, [isIos, selectedAdType]);

  const canShowNonBannerAd = useMemo(() => {
    switch (selectedAdType) {
      case 1:
        return interstitialLoaded;
      case 2:
        return rewardLoaded;
      case 3:
        return nativeLoaded && nativeKind === 'template';
      case 4:
        return nativeLoaded && nativeKind === 'custom';
      case 5:
        return appOpenLoaded;
      default:
        return false;
    }
  }, [
    selectedAdType,
    interstitialLoaded,
    rewardLoaded,
    nativeLoaded,
    nativeKind,
    appOpenLoaded,
  ]);

  return (
    <>
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>← 메인</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>
          기본 배너/전면/보상형/네이티브/앱오프닝 테스트
        </Text>

        {/* TFUA */}
        <Text style={styles.rowLabel}>TFUA</Text>
        <View style={styles.chipRow}>
          {TFUA_LABELS.map((lbl, i) => (
            <TouchableOpacity
              key={lbl}
              style={[
                styles.chip,
                tfuaModeIndex === i && styles.chipOn,
              ]}
              onPress={async () => {
                setTfuaModeIndex(i);
                await applyTfuaMode(i);
                console.log(`[GuideSampleAndroid] TFUA: ${lbl}`);
              }}>
              <Text
                style={[
                  styles.chipText,
                  tfuaModeIndex === i && styles.chipTextOn,
                ]}
                numberOfLines={2}>
                {lbl.replace(/TAG_FOR_UNDER_AGE_OF_CONSENT_/g, '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.rowLabel, styles.mt]}>MaxRating</Text>
        <View style={styles.chipRow}>
          {MAX_RATING_LABELS.map((lbl, i) => (
            <TouchableOpacity
              key={lbl}
              style={[
                styles.chip,
                maxRatingIndex === i && styles.chipOn,
              ]}
              onPress={async () => {
                setMaxRatingIndex(i);
                await applyMaxRating(i);
                console.log(`[GuideSampleAndroid] MaxRating: ${lbl}`);
              }}>
              <Text
                style={[
                  styles.chipText,
                  maxRatingIndex === i && styles.chipTextOn,
                ]}>
                {lbl.replace('MAX_AD_CONTENT_RATING_', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.wrapRow, styles.mt]}>
          <View style={styles.coppaRow}>
            <Text>COPPA</Text>
            <Switch
              value={isCoppa}
              onValueChange={v => {
                setIsCoppa(v);
                AdWhaleMediationAds.setCoppa(v);
                snack(`COPPA setting applied: ${v}`);
              }}
            />
          </View>
          {purpleSmall('GDPR', async () => {
            const r = await AdWhaleMediationAds.requestGdprConsent();
            const ok = r.success;
            snack(
              `GDPR Consent: ${ok ? 'Success' : 'Failed'}, ${r.message}`,
            );
          })}
          {purpleSmall(
            'Check',
            Platform.OS === 'android'
              ? async () => {
                  try {
                    const s = await AdWhaleMediationAds.getConsentStatus();
                    snack(
                      `coppa: ${String(s.coppa)}, gdpr: ${String(s.gdpr)}, personalizedConsent: ${String(s.personalizedConsent)}`,
                    );
                  } catch (e) {
                    snack(`Check: ${String(e)}`);
                  }
                }
              : null,
          )}
          {purpleSmall('Reset', async () => {
            AdWhaleMediationAds.resetGdprConsentStatus();
            snack('GDPR consent status has been reset.');
          })}
        </View>
        <View style={styles.wrapRow}>
          {purpleSmall(
            'SINGLE GDPR TRUE',
            Platform.OS === 'android'
              ? () => {
                  AdWhaleMediationAds.setGdpr(true);
                  snack('setGdpr(true)');
                }
              : null,
          )}
          {purpleSmall(
            'SINGLE GDPR FALSE',
            Platform.OS === 'android'
              ? () => {
                  AdWhaleMediationAds.setGdpr(false);
                  snack('setGdpr(false)');
                }
              : null,
          )}
        </View>

        <View style={styles.rightRow}>
          {purpleSmall('AdMob Ad Inspector', async () => {
            try {
              await AdWhaleMediationAds.showAdInspector();
              snack('Ad Inspector 요청 완료(닫힘 시점에 결과 확인)');
            } catch (e) {
              snack(`Ad Inspector: ${String(e)}`);
            }
          })}
        </View>

        <Text style={styles.section}>1. 로거출력여부:</Text>
        <Switch
          value={isLoggerOn}
          onValueChange={async v => {
            if (isIos) {
              snack('iOS에서는 로거 설정을 지원하지 않습니다.');
              return;
            }
            setIsLoggerOn(v);
            AdWhaleMediationAds.setLoggerEnabled(v);
            try {
              const level = await AdWhaleMediationAds.getLogLevel();
              console.log('현재 로그 레벨:', level);
            } catch {
              /* ignore */
            }
          }}
        />

        <Text style={styles.section}>앱 볼륨/Mute 설정:</Text>
        <View style={styles.volRow}>
          <Text>App Muted:</Text>
          <Switch value={isAppMuted} onValueChange={setIsAppMuted} />
          <TextInput
            style={styles.volInput}
            value={appVolumeText}
            onChangeText={setAppVolumeText}
            keyboardType="decimal-pad"
            placeholder="0.0 ~ 1.0"
          />
        </View>
        {purpleSmall('볼륨/Mute 적용', () => {
          const text = appVolumeText.trim();
          if (!text) {
            snack('볼륨 값을 입력해주세요.');
            return;
          }
          let volume = parseFloat(text);
          if (Number.isNaN(volume)) {
            snack('숫자를 입력해주세요.');
            return;
          }
          volume = Math.min(1, Math.max(0, volume));
          try {
            AdWhaleMediationAds.setAppMuted(isAppMuted);
            AdWhaleMediationAds.setAppVolume(volume);
            snack(
              `Mute: ${isAppMuted}, Volume: ${volume.toFixed(2)}`,
            );
          } catch (e) {
            snack(`설정 실패: ${String(e)}`);
          }
        })}

        <Text style={styles.section}>2. 광고 타입 선택:</Text>
        {adTypeRow(0, '배너')}
        {adTypeRow(1, '전면')}
        {adTypeRow(2, '보상형전면')}
        {adTypeRow(
          3,
          isIos
            ? '네이티브광고(고정형템플릿) (iOS 미지원)'
            : '네이티브광고(고정형템플릿)',
        )}
        {adTypeRow(
          4,
          isIos
            ? '네이티브광고(커스텀바인딩) (iOS: SDK 고정 레이아웃)'
            : '네이티브광고(커스텀바인딩)',
        )}
        {adTypeRow(5, '앱 오프닝')}

        <Text style={styles.section}>3. publisher uid입력:</Text>
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="publisher uid를 입력해주세요."
        />

        <Text style={styles.section}>
          {isIos &&
          (selectedAdType === 1 ||
            selectedAdType === 2 ||
            selectedAdType === 4 ||
            selectedAdType === 5)
            ? '4. placement / Ad Unit ID:'
            : '4. placement uid입력:'}
        </Text>
        {placementHint ? (
          <Text style={styles.hint}>{placementHint}</Text>
        ) : null}
        <TextInput
          style={styles.input}
          value={placementUidInput}
          onChangeText={t => {
            setPlacementUidInput(t);
            setPlacementUidByType(prev => ({
              ...prev,
              [selectedAdType]: t.trim(),
            }));
          }}
          placeholder={
            isIos &&
            (selectedAdType === 1 ||
              selectedAdType === 2 ||
              selectedAdType === 4 ||
              selectedAdType === 5)
              ? '(Android만) placement uid'
              : 'placement uid를 입력해주세요.'
          }
        />

        {(selectedAdType === 0 || selectedAdType === 3) && (
          <>
            <Text style={styles.section}>5. 광고사이즈선택:</Text>
            {selectedAdType === 0 && (
              <>
                <View style={styles.bannerSizeRow}>
                  {['320x50', '320x100', '300x250', '250x250', 'Adaptive'].map(
                    (lbl, i) => (
                      <TouchableOpacity
                        key={lbl}
                        style={styles.radioRow}
                        onPress={() => setSelectedBannerSize(i)}>
                        <View
                          style={[
                            styles.radioOuter,
                            selectedBannerSize === i && styles.radioOuterOn,
                          ]}>
                          {selectedBannerSize === i ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                        <Text>{lbl}</Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
                {selectedBannerSize === 4 && (
                  <>
                    <Text style={styles.hint}>
                      adaptive width size(0: 디바이스 전체 길이):
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={adaptiveWidthText}
                      onChangeText={setAdaptiveWidthText}
                      keyboardType="number-pad"
                      placeholder="adaptive anchor width"
                    />
                  </>
                )}
              </>
            )}
            {selectedAdType === 3 && (
              <View style={styles.templateRow}>
                {(
                  [
                    ['SMALL', 'Small'],
                    ['MEDIUM', 'Medium'],
                    ['FULLSCREEN', 'Fullscreen'],
                  ] as const
                ).map(([val, name]) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.templateChip,
                      selectedTemplateSize === val && styles.chipOn,
                    ]}
                    onPress={() => onTemplateSizeChange(val)}>
                    <Text
                      style={
                        selectedTemplateSize === val
                          ? styles.chipTextOn
                          : styles.chipText
                      }>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {selectedAdType === 2 && (
          <>
            <Text style={styles.section}>
              5. 보상형 SSV (userId / customData) 입력:
            </Text>
            <Text style={styles.hint}>request_id</Text>
            <TextInput
              style={styles.input}
              value={rewardRequestId}
              onChangeText={setRewardRequestId}
              autoCapitalize="none"
              placeholder="request_id"
            />
            <Text style={[styles.hint, styles.mt]}>session_id</Text>
            <TextInput
              style={styles.input}
              value={rewardSessionId}
              onChangeText={setRewardSessionId}
              autoCapitalize="none"
              placeholder="session_id"
            />
            <Text style={[styles.hint, styles.mt]}>userId</Text>
            <TextInput
              style={styles.input}
              value={rewardUserId}
              onChangeText={setRewardUserId}
              autoCapitalize="none"
              placeholder="userId (SSV user_id)"
            />
          </>
        )}

        <View style={styles.actionRow}>
          {selectedAdType === 0 ? (
            <>
              {purpleBtn('광고 로드', onBannerLoad)}
              {purpleBtn('뷰 초기화', onClearAds)}
              {purpleBtn('복사', onCopyDebug)}
            </>
          ) : (
            <>
              {purpleBtn('광고 로드', onLoadNonBanner)}
              {purpleBtn(
                '광고 표시',
                onShowNonBanner,
                !canShowNonBannerAd,
              )}
              {purpleBtn('뷰 초기화', onClearAds)}
              {purpleBtn('복사', onCopyDebug)}
            </>
          )}
        </View>

        <TextInput
          style={styles.debugArea}
          value={debugInfo}
          multiline
          editable={false}
        />

        <Text style={styles.nativeTitle}>네이티브 광고 영역</Text>
        {(nativeKind === 'template' ||
          nativeKind === 'custom' ||
          (selectedAdType === 3 &&
            selectedTemplateSize === 'FULLSCREEN')) ? (
          selectedAdType === 3 && selectedTemplateSize === 'FULLSCREEN' ? (
            <View style={styles.fullscreenNativeHint}>
              <Text style={styles.fullscreenNativeHintText}>
                FULLSCREEN 템플릿은 아래 영역에 노출되지 않습니다. [광고 로드] 시
                전용 모달에서 로드되고, [광고 표시]에서 전면(인터스티셜과 같은)
                모달로 노출됩니다.
              </Text>
            </View>
          ) : (
          <View
            onLayout={() => setNativeLayoutReady(true)}
            style={{
              height: (() => {
                const h = nativeAdHeightForCurrent();
                return h > 0 ? h : 400;
              })(),
              marginBottom: 16,
              opacity: nativeShown ? 1 : 0.02,
            }}>
            {nativeKind === 'template' ? (
              <AdWhaleNativeTemplateView
                key={`nt-${nativeMountNonce}`}
                ref={templateRef}
                placementUid={currentPlacementUid()}
                template={selectedTemplateSize}
                placementName="test_template_native"
                region="서울시 구로구"
                gcoder={{ lt: 37.48, lng: 126.89 }}
                style={{ flex: 1, width: '100%' }}
                onNativeAdLoaded={() => {
                  setNativeLoaded(true);
                  setDebugInfo('네이티브 템플릿 로드 완료\n');
                }}
                onNativeAdFailedToLoad={(e: AdWhaleNativeTemplateError) => {
                  setNativeKind('none');
                  setDebugInfo(
                    `템플릿 로드 실패: ${e.statusCode} ${e.message}\n`,
                  );
                }}
                onNativeAdShowFailed={(e: AdWhaleNativeTemplateError) => {
                  setNativeKind('none');
                  setNativeShown(false);
                  setDebugInfo(
                    `템플릿 표시 실패: ${e.statusCode} ${e.message}\n`,
                  );
                }}
                onNativeAdClicked={() => {
                  setDebugInfo('네이티브 템플릿 클릭됨\n');
                }}
                onNativeAdClosed={() => {
                  setNativeLoaded(false);
                  setNativeShown(false);
                  setNativeKind('none');
                  setDebugInfo('네이티브 템플릿 닫힘\n');
                }}
              />
            ) : (
              <AdWhaleNativeCustomView
                key={`nc-${nativeMountNonce}`}
                ref={customRef}
                placementUid={currentPlacementUid()}
                factoryId="app_custom"
                placementName="test_custom_native"
                region="서울시 구로구"
                gcoder={{ lt: 37.48, lng: 126.89 }}
                style={{ flex: 1, width: '100%' }}
                onNativeAdLoaded={() => {
                  setNativeLoaded(true);
                  setDebugInfo('네이티브 커스텀 로드 완료\n');
                }}
                onNativeAdFailedToLoad={(e: AdWhaleNativeCustomError) => {
                  setNativeKind('none');
                  setDebugInfo(
                    `커스텀 로드 실패: ${e.statusCode} ${e.message}\n`,
                  );
                }}
                onNativeAdShowFailed={(e: AdWhaleNativeCustomError) => {
                  setNativeKind('none');
                  setNativeShown(false);
                  setDebugInfo(
                    `커스텀 표시 실패: ${e.statusCode} ${e.message}\n`,
                  );
                }}
                onNativeAdClicked={() => {
                  setDebugInfo('네이티브 커스텀 클릭됨\n');
                }}
                onNativeAdClosed={() => {
                  setNativeLoaded(false);
                  setNativeShown(false);
                  setNativeKind('none');
                  setDebugInfo('네이티브 커스텀 닫힘\n');
                }}
              />
            )}
          </View>
          )
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 배너 슬롯 */}
      <View
        style={[
          styles.bottomBanner,
          {
            height:
              !bannerActive || !bannerPlacementUid
                ? 60
                : bannerHeightFor(bannerAdSize) + 20,
          },
        ]}>
        {!bannerActive || !bannerPlacementUid ? (
          <View style={styles.bottomPlaceholder}>
            <Text style={styles.bottomPlaceholderText}>
              여기에 배너 광고가 노출됩니다.
            </Text>
          </View>
        ) : (
          <AdWhaleAdView
              key={`banner-${bannerPlacementUid}-${bannerAdSize}-${bannerAdaptiveW}-${bannerLoadNonce}`}
            placementUid={bannerPlacementUid}
            adSize={bannerAdSize}
            adaptiveAnchorWidth={
              bannerAdSize === AdWhaleAdSize.ADAPTIVE_ANCHOR
                ? bannerAdaptiveW
                : undefined
            }
            placementName="guide_banner"
            region="서울시 강남구"
            gcoder={{ lt: 37.5665, lng: 126.978 }}
            style={{
              height: bannerHeightFor(bannerAdSize),
              width: '100%',
            }}
            loadAd={bannerActive && bannerLoadReady}
            onAdLoaded={() =>
              setDebugInfo('배너 로드 성공 (하단 슬롯)\n')
            }
            onAdLoadFailed={e =>
              setDebugInfo(
                `배너 로드 실패: ${e.statusCode} ${e.message}\n`,
              )
            }
          />
        )}
      </View>
    </SafeAreaView>

    {nativeKind === 'template' &&
      selectedTemplateSize === 'FULLSCREEN' &&
      nativeFullscreenSession ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          statusBarTranslucent={Platform.OS === 'android'}
          onRequestClose={closeFullscreenTemplate}>
          <View
            style={[
              styles.fsModalRoot,
              { width: SCREEN.width, height: SCREEN.height },
            ]}
            pointerEvents="box-none">
            <Pressable
              pointerEvents={nativeFullscreenReveal ? 'auto' : 'none'}
              onPress={
                nativeFullscreenReveal ? closeFullscreenTemplate : undefined
              }
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: nativeFullscreenReveal
                    ? 'rgba(0,0,0,0.55)'
                    : 'transparent',
                },
              ]}
            />
            <SafeAreaView style={styles.fsModalSafe} pointerEvents="box-none">
              {nativeFullscreenReveal ? (
                <View style={styles.fsTopBar} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.fsCloseBtn}
                    onPress={closeFullscreenTemplate}
                    activeOpacity={0.85}>
                    <Text style={styles.fsCloseBtnText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View
                collapsable={false}
                style={[
                  styles.fsAdArea,
                  {
                    opacity: nativeFullscreenReveal ? 1 : 0.02,
                  },
                ]}
                onLayout={() => setNativeLayoutReady(true)}
                pointerEvents={nativeFullscreenReveal ? 'auto' : 'box-none'}>
                <AdWhaleNativeTemplateView
                  key={`nt-${nativeMountNonce}`}
                  ref={templateRef}
                  placementUid={currentPlacementUid()}
                  template="FULLSCREEN"
                  placementName="test_template_native"
                  region="서울시 구로구"
                  gcoder={{ lt: 37.48, lng: 126.89 }}
                  style={{
                    flex: 1,
                    width: '100%',
                    minHeight: Math.min(SCREEN.height * 0.72, 560),
                  }}

                  onNativeAdLoaded={() => {
                    setNativeLoaded(true);
                    setDebugInfo('네이티브 FULLSCREEN 템플릿 로드 완료\n');
                  }}
                  onNativeAdFailedToLoad={(e: AdWhaleNativeTemplateError) => {
                    setNativeKind('none');
                    setNativeFullscreenSession(false);
                    setNativeFullscreenReveal(false);
                    setDebugInfo(
                      `템플릿 로드 실패: ${e.statusCode} ${e.message}\n`,
                    );
                  }}
                  onNativeAdShowFailed={(e: AdWhaleNativeTemplateError) => {
                    setNativeKind('none');
                    setNativeShown(false);
                    setNativeFullscreenSession(false);
                    setNativeFullscreenReveal(false);
                    setDebugInfo(
                      `템플릿 표시 실패: ${e.statusCode} ${e.message}\n`,
                    );
                  }}
                  onNativeAdClicked={() => {
                    setDebugInfo('네이티브 템플릿 클릭됨\n');
                  }}
                  onNativeAdClosed={() => {
                    closeFullscreenTemplate();
                    setDebugInfo('네이티브 템플릿 닫힘\n');
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16 },
  back: { marginBottom: 8 },
  backText: { fontSize: 16, color: ACCENT },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  rowLabel: { fontSize: 12 },
  mt: { marginTop: 8 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '48%',
  },
  chipOn: { backgroundColor: ACCENT },
  chipText: { fontSize: 10, color: '#333' },
  chipTextOn: { fontSize: 10, color: '#fff' },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  coppaRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  smallBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  smallBtnDisabled: { opacity: 0.45 },
  smallBtnText: { color: '#fff', fontSize: 11 },
  rightRow: { alignItems: 'flex-end', marginTop: 8 },
  section: { fontSize: 15, marginTop: 12, marginBottom: 4 },
  volRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  volInput: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#888',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterOn: { borderColor: ACCENT },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT,
  },
  radioLabel: { flex: 1, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 15,
  },
  hint: { fontSize: 12, color: '#666', marginBottom: 4 },
  bannerSizeRow: { marginTop: 4 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  bigBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  bigBtnDisabled: {
    opacity: 0.45,
  },
  bigBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  debugArea: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 120,
    padding: 8,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  nativeTitle: { fontWeight: '700', marginTop: 16 },
  fullscreenNativeHint: {
    minHeight: 120,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  fullscreenNativeHintText: { fontSize: 13, color: '#444', lineHeight: 20 },
  fsModalRoot: { flex: 1, width: '100%' },
  fsModalSafe: { flex: 1, width: '100%' },
  fsTopBar: {
    zIndex: 10,
    elevation: 10,
    width: '100%',
  },
  fsCloseBtn: {
    alignSelf: 'flex-end',
    marginRight: 12,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ACCENT,
    borderRadius: 6,
  },
  fsCloseBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  fsAdArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
  bottomBanner: {
    width: '100%',
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPlaceholder: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPlaceholderText: { fontSize: 13, color: '#555' },
});

export default GuideSampleAndroidScreen;
