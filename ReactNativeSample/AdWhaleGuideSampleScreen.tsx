import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Platform,
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
  AdWhaleAdView,
  AdWhaleAdSize,
  AdWhaleInterstitialAd,
  AdWhaleRewardAd,
  AdWhaleNativeTemplateView,
  AdWhaleNativeTemplateHandle,
  AdWhaleNativeTemplateType,
  AdWhaleNativeCustomView,
  AdWhaleNativeCustomHandle,
  AdWhaleNativeTemplateError,
  AdWhaleNativeCustomError,
  AdWhaleInterstitialErrorEvent,
  AdWhaleRewardErrorEvent,
  AdWhaleRewardUserRewardedEvent,
} from 'adwhale-sdk-react-native';
import * as AdWhaleSdk from 'adwhale-sdk-react-native';

// Metro/번들 환경에 따라 named export interop가 달라질 수 있어,
// namespace export 쪽에서 컴포넌트를 먼저 가져오도록 보강합니다.
// 배너 컴포넌트는 SDK에서 AdWhaleAdView 로 export 됩니다.
const BannerView = (AdWhaleSdk as any).AdWhaleAdView ?? AdWhaleAdView;
const NativeTemplateView =
  (AdWhaleSdk as any).AdWhaleNativeTemplateView ?? AdWhaleNativeTemplateView;
const NativeCustomView =
  (AdWhaleSdk as any).AdWhaleNativeCustomView ?? AdWhaleNativeCustomView;

interface AdWhaleAppOpenErrorEvent {
  statusCode: number;
  message: string;
}

// AdWhaleAppOpenAd - SDK에서 추후 제공 예정, 현재는 stub
const AdWhaleAppOpenAd: {
  loadAd: (uid: string, options?: {placementName?: string; region?: string; gcoder?: {lt: number; lng: number}}) => void;
  showAd: () => void;
  addEventListeners: (listeners: {
    onLoaded?: () => void;
    onLoadFailed?: (e: AdWhaleAppOpenErrorEvent) => void;
    onShowed?: () => void;
    onShowFailed?: (e: AdWhaleAppOpenErrorEvent) => void;
    onDismissed?: () => void;
    onClicked?: () => void;
  }) => {remove: () => void}[];
} = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sdk = require('adwhale-sdk-react-native');
    if (sdk.AdWhaleAppOpenAd) return sdk.AdWhaleAppOpenAd;
  } catch {}
  return {
    loadAd: () => console.warn('AdWhaleAppOpenAd.loadAd: not available in current SDK'),
    showAd: () => console.warn('AdWhaleAppOpenAd.showAd: not available in current SDK'),
    addEventListeners: () => [],
  };
})();

// AdWhaleMediationAds: SDK AdWhaleMediationSdk에 없는 메서드를 확장
const mediationBase =
  (AdWhaleSdk as any).AdWhaleMediationAds ??
  (AdWhaleSdk as any).AdWhaleMediationSdk ??
  {};

const AdWhaleMediationAds = {
  ...mediationBase,
  initialize: async () => {
    if (!mediationBase?.initialize) {
      return {
        isSuccess: false,
        statusCode: -1,
        message: 'initialize API not found',
      };
    }
    const raw = await mediationBase.initialize();
    if (raw && typeof raw === 'object') {
      // 네이티브 초기화 성공 코드는 statusCode === 100
      return {
        isSuccess: (raw.statusCode ?? -1) === 100,
        statusCode: raw.statusCode ?? -1,
        message: raw.message ?? '',
      };
    }
    const code = Number(raw);
    const ok = code === 100 || code === 0;
    return {
      isSuccess: ok,
      statusCode: code,
      message: ok ? 'Success' : `Failed(${code})`,
    };
  },
  // RN SDK는 boolean API(setTagForUnderAgeOfConsent)만 제공.
  // index: 0=TRUE, 1=FALSE, 2=UNSPECIFIED(RN 미지원 → 미적용)
  setTagForUnderAgeOfConsentMode: async (mode: number): Promise<void> => {
    try {
      if (mode === 2) return;
      (mediationBase as any).setTagForUnderAgeOfConsent?.(mode === 0);
    } catch {}
  },
  // SDK setMaxAdContentRating 은 문자열(.general/.parentalGuidance/.teen/.matureAudience) 을 받음
  setMaxAdContentRating: async (ratingIndex: number): Promise<void> => {
    try {
      const MAX_RATING_API = [
        '.general',
        '.parentalGuidance',
        '.teen',
        '.matureAudience',
      ];
      (mediationBase as any).setMaxAdContentRating?.(
        MAX_RATING_API[ratingIndex] ?? null,
      );
    } catch {}
  },
  setAppMuted: async (muted: boolean): Promise<void> => {
    try {
      const sdk = require('adwhale-sdk-react-native');
      if (sdk.AdWhaleMediationAds?.setAppMuted) {
        await sdk.AdWhaleMediationAds.setAppMuted(muted);
      } else if ((mediationBase as any).setAppMuted) {
        await (mediationBase as any).setAppMuted(muted);
      }
    } catch {}
  },
  setAppVolume: async (volume: number): Promise<void> => {
    try {
      const sdk = require('adwhale-sdk-react-native');
      if (sdk.AdWhaleMediationAds?.setAppVolume) {
        await sdk.AdWhaleMediationAds.setAppVolume(volume);
      } else if ((mediationBase as any).setAppVolume) {
        await (mediationBase as any).setAppVolume(volume);
      }
    } catch {}
  },
  // SDK showAdInspector() 는 인자 없이 Promise<{statusCode, message}> 반환
  showAdInspector: async (): Promise<{statusCode: number; message: string}> => {
    return (mediationBase as any).showAdInspector();
  },
  // SDK getLogLevel() 은 Promise<string> (Android 전용)
  getLogLevel: async (): Promise<string> => {
    try {
      return await (mediationBase as any).getLogLevel?.();
    } catch {
      return 'unknown';
    }
  },
};
import {AdConfig} from './config';

interface Props {
  onBack?: () => void;
}

// Flutter: 0: 배너, 1: 전면, 2: 보상형전면, 3: 네이티브(템플릿), 4: 네이티브(커스텀), 5: 앱 오프닝
type AdTypeIndex = 0 | 1 | 2 | 3 | 4 | 5;

const TFUA_LABELS = [
  'TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE',
  'TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE',
  'TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED',
];

const MAX_RATING_LABELS = [
  'MAX_AD_CONTENT_RATING_G',
  'MAX_AD_CONTENT_RATING_PG',
  'MAX_AD_CONTENT_RATING_T',
  'MAX_AD_CONTENT_RATING_MA',
];

const BANNER_SIZE_LABELS: Record<AdWhaleAdSize, string> = {
  [AdWhaleAdSize.BANNER_320x50]: '320x50',
  [AdWhaleAdSize.BANNER_320x100]: '320x100',
  [AdWhaleAdSize.BANNER_300x250]: '300x250',
  [AdWhaleAdSize.BANNER_250x250]: '250x250',
  [AdWhaleAdSize.ADAPTIVE_ANCHOR]: 'Adaptive',
};

const BANNER_SIZES: AdWhaleAdSize[] = [
  AdWhaleAdSize.BANNER_320x50,
  AdWhaleAdSize.BANNER_320x100,
  AdWhaleAdSize.BANNER_300x250,
  AdWhaleAdSize.BANNER_250x250,
  AdWhaleAdSize.ADAPTIVE_ANCHOR,
];

const BANNER_HEIGHTS: Record<AdWhaleAdSize, number> = {
  [AdWhaleAdSize.BANNER_320x50]: 50,
  [AdWhaleAdSize.BANNER_320x100]: 100,
  [AdWhaleAdSize.BANNER_300x250]: 250,
  [AdWhaleAdSize.BANNER_250x250]: 250,
  [AdWhaleAdSize.ADAPTIVE_ANCHOR]: 50,
};

const DEFAULT_PLACEMENT_UID_BY_TYPE: Record<AdTypeIndex, string> = {
  0: AdConfig.banner320x50PlacementUid,
  1: AdConfig.interstitialPlacementUid1,
  2: AdConfig.rewardPlacementUid1,
  3: AdConfig.nativePlacementUid,
  4: AdConfig.nativePlacementUid,
  5: AdConfig.appOpenPlacementUid,
};

const AdWhaleGuideSampleScreen: React.FC<Props> = ({onBack}) => {
  const isIos = Platform.OS === 'ios';

  // ─── TFUA / MaxRating (Flutter 상단 스피너) ───────────────────────────────
  const [tfuaModeIndex, setTfuaModeIndex] = useState(2); // 기본 UNSPECIFIED
  const [maxRatingIndex, setMaxRatingIndex] = useState(3); // 기본 MA

  // ─── COPPA / Logger / 볼륨 ─────────────────────────────────────────────────
  const [isCoppa, setIsCoppa] = useState(false);
  const [isLoggerOn, setIsLoggerOn] = useState(false);
  const [isAppMuted, setIsAppMuted] = useState(false);
  const [appVolumeText, setAppVolumeText] = useState('0.1');

  // ─── 광고 타입 / 배너 사이즈 ────────────────────────────────────────────────
  const [selectedAdType, setSelectedAdType] = useState<AdTypeIndex>(0);
  const [selectedBannerSize, setSelectedBannerSize] = useState<AdWhaleAdSize>(
    AdWhaleAdSize.BANNER_320x50,
  );
  const [adaptiveWidth, setAdaptiveWidth] = useState('0');

  // 네이티브 템플릿 사이즈
  const [templateSize, setTemplateSize] = useState<AdWhaleNativeTemplateType>('SMALL');

  // ─── Placement UID (타입별 저장) ─────────────────────────────────────────
  const placementUidByType = useRef<Record<number, string>>({
    ...DEFAULT_PLACEMENT_UID_BY_TYPE,
  });
  const [placementUidText, setPlacementUidText] = useState(
    DEFAULT_PLACEMENT_UID_BY_TYPE[0],
  );

  // ─── Debug 영역 ───────────────────────────────────────────────────────────
  const [debugInfo, setDebugInfo] = useState('Please touch [광고 로드] button.');

  // ─── 배너 광고 상태 ──────────────────────────────────────────────────────
  const [loadBannerAd, setLoadBannerAd] = useState(false);
  const [isBannerAdLoaded, setIsBannerAdLoaded] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);
  const [activeBannerSize, setActiveBannerSize] = useState<AdWhaleAdSize>(
    AdWhaleAdSize.BANNER_320x50,
  );

  // ─── 전면 광고 상태 ──────────────────────────────────────────────────────
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);

  // ─── 보상형 광고 상태 ────────────────────────────────────────────────────
  const [isRewardLoaded, setIsRewardLoaded] = useState(false);

  // ─── 보상형 SSV (userId / customData) 입력 ───────────────────────────────
  const [rewardUserId, setRewardUserId] = useState('test_user_001');
  const [rewardRequestId, setRewardRequestId] = useState('test_request_001');
  const [rewardSessionId, setRewardSessionId] = useState('test_session_001');

  // ─── 앱오프닝 광고 상태 ─────────────────────────────────────────────────
  const [isAppOpenLoaded, setIsAppOpenLoaded] = useState(false);

  // ─── 네이티브 광고 상태 ─────────────────────────────────────────────────
  const [nativeAdViewKey, setNativeAdViewKey] = useState(0);
  const [isNativeLoaded, setIsNativeLoaded] = useState(false);
  const [isNativeShown, setIsNativeShown] = useState(false);
  const templateRef = useRef<AdWhaleNativeTemplateHandle | null>(null);
  const customRef = useRef<AdWhaleNativeCustomHandle | null>(null);

  // ─── SDK 초기화 ──────────────────────────────────────────────────────────
  useEffect(() => {
    AdWhaleMediationAds.initialize().catch(() => {});
  }, []);

  // ─── 초기 TFUA / MaxRating 적용 ─────────────────────────────────────────
  useEffect(() => {
    AdWhaleMediationAds.setTagForUnderAgeOfConsentMode(tfuaModeIndex).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    AdWhaleMediationAds.setMaxAdContentRating(maxRatingIndex).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 전면 광고 이벤트 ────────────────────────────────────────────────────
  useEffect(() => {
    const subs = AdWhaleInterstitialAd.addEventListeners({
      onLoaded: () => {
        setIsInterstitialLoaded(true);
        setDebugInfo('전면 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setIsInterstitialLoaded(false);
        setDebugInfo(`전면 광고 로드 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onShowed: () => setDebugInfo('전면 광고 표시됨\n'),
      onShowFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setIsInterstitialLoaded(false);
        setDebugInfo(`전면 광고 표시 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onClosed: () => {
        setIsInterstitialLoaded(false);
        setDebugInfo('전면 광고 닫힘\n');
      },
      onClicked: () => setDebugInfo('전면 광고 클릭됨\n'),
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  // ─── 보상형 광고 이벤트 ──────────────────────────────────────────────────
  useEffect(() => {
    const subs = AdWhaleRewardAd.addEventListeners({
      onLoaded: () => {
        setIsRewardLoaded(true);
        setDebugInfo('보상형 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleRewardErrorEvent) => {
        setIsRewardLoaded(false);
        setDebugInfo(`보상형 광고 로드 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onShowed: () => setDebugInfo('보상형 광고 표시됨\n'),
      onShowFailed: (e: AdWhaleRewardErrorEvent) => {
        setIsRewardLoaded(false);
        setDebugInfo(`보상형 광고 표시 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onDismissed: () => {
        setIsRewardLoaded(false);
        setDebugInfo('보상형 광고 닫힘\n');
      },
      onClicked: () => setDebugInfo('보상형 광고 클릭됨\n'),
      onUserRewarded: (e: AdWhaleRewardUserRewardedEvent) =>
        setDebugInfo(`보상 지급됨: ${e.type} - ${e.amount}\n`),
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  // ─── 앱오프닝 광고 이벤트 ───────────────────────────────────────────────
  useEffect(() => {
    const subs = AdWhaleAppOpenAd.addEventListeners({
      onLoaded: () => {
        setIsAppOpenLoaded(true);
        setDebugInfo('앱오프닝 광고 로드 완료\n');
      },
      onLoadFailed: (e: AdWhaleAppOpenErrorEvent) => {
        setIsAppOpenLoaded(false);
        setDebugInfo(`앱오프닝 광고 로드 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onShowed: () => setDebugInfo('앱오프닝 광고 표시됨\n'),
      onShowFailed: (e: AdWhaleAppOpenErrorEvent) => {
        setIsAppOpenLoaded(false);
        setDebugInfo(`앱오프닝 광고 표시 실패: ${e.statusCode} - ${e.message}\n`);
      },
      onDismissed: () => {
        setIsAppOpenLoaded(false);
        setDebugInfo('앱오프닝 광고 닫힘\n');
      },
      onClicked: () => setDebugInfo('앱오프닝 광고 클릭됨\n'),
    });
    return () => subs.forEach(s => s.remove());
  }, []);

  // ─── Android 뒤로가기 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!onBack) return;
    const handler = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [onBack]);

  // ─── 광고 타입 변경 ──────────────────────────────────────────────────────
  const handleAdTypeChange = useCallback(
    (newType: AdTypeIndex) => {
      placementUidByType.current[selectedAdType] = placementUidText.trim();
      setSelectedAdType(newType);
      setPlacementUidText(
        placementUidByType.current[newType] ?? DEFAULT_PLACEMENT_UID_BY_TYPE[newType],
      );
    },
    [selectedAdType, placementUidText],
  );

  const currentPlacementUid = useCallback(() => {
    const text = placementUidText.trim();
    return text || placementUidByType.current[selectedAdType] || '';
  }, [placementUidText, selectedAdType]);

  // ─── TFUA ────────────────────────────────────────────────────────────────
  const handleTfuaChange = useCallback(async (idx: number) => {
    setTfuaModeIndex(idx);
    try {
      await AdWhaleMediationAds.setTagForUnderAgeOfConsentMode(idx);
      setDebugInfo(`TFUA: ${TFUA_LABELS[idx]}`);
    } catch (e: any) {
      setDebugInfo(`TFUA 설정 실패: ${e?.message ?? String(e)}`);
    }
  }, []);

  // ─── MaxRating ───────────────────────────────────────────────────────────
  const handleMaxRatingChange = useCallback(async (idx: number) => {
    setMaxRatingIndex(idx);
    try {
      await AdWhaleMediationAds.setMaxAdContentRating(idx);
      setDebugInfo(`MaxRating: ${MAX_RATING_LABELS[idx]}`);
    } catch (e: any) {
      setDebugInfo(`MaxRating 설정 실패: ${e?.message ?? String(e)}`);
    }
  }, []);

  // ─── 볼륨/Mute 적용 ─────────────────────────────────────────────────────
  const handleApplyVolume = useCallback(async () => {
    try {
      let volume = parseFloat(appVolumeText);
      if (isNaN(volume)) {
        setDebugInfo('볼륨 값을 입력해주세요.');
        return;
      }
      volume = Math.min(1.0, Math.max(0.0, volume));
      await AdWhaleMediationAds.setAppMuted(isAppMuted);
      await AdWhaleMediationAds.setAppVolume(volume);
      setDebugInfo(`Mute: ${isAppMuted}, Volume: ${volume.toFixed(2)}`);
    } catch (e: any) {
      setDebugInfo(`볼륨 설정 실패: ${e?.message ?? String(e)}`);
    }
  }, [appVolumeText, isAppMuted]);

  // ─── GDPR ────────────────────────────────────────────────────────────────
  const handleRequestGdpr = useCallback(async () => {
    try {
      setDebugInfo('GDPR Request 시작...\n');
      const r = await AdWhaleMediationAds.requestGdprConsent();
      setDebugInfo(`GDPR Consent: ${r.success ? 'Success' : 'Failed'}, ${r.message}`);
    } catch (e: any) {
      setDebugInfo(`GDPR Consent Error: ${e?.message ?? String(e)}`);
    }
  }, []);

  const handleCheckConsentStatus = useCallback(async () => {
    try {
      setDebugInfo('Status 확인 중...\n');
      const m = await AdWhaleMediationAds.getConsentStatus();
      setDebugInfo(
        `coppa: ${m.coppa}, gdpr: ${m.gdpr}, personalizedConsent: ${m.personalizedConsent}`,
      );
    } catch (e: any) {
      setDebugInfo(`Check: ${e?.message ?? String(e)}`);
    }
  }, []);

  const handleResetGdpr = useCallback(() => {
    try {
      AdWhaleMediationAds.resetGdprConsentStatus();
      setDebugInfo('GDPR consent status has been reset.');
    } catch (e: any) {
      setDebugInfo(`Reset Error: ${e?.message ?? String(e)}`);
    }
  }, []);

  const handleSetGdpr = useCallback((value: boolean) => {
    try {
      AdWhaleMediationAds.setGdpr(value);
      setDebugInfo(`setGdpr(${value})`);
    } catch (e: any) {
      setDebugInfo(`SetGdpr Error: ${e?.message ?? String(e)}`);
    }
  }, []);

  // ─── AdMob Ad Inspector ──────────────────────────────────────────────────
  const handleAdInspector = useCallback(async () => {
    try {
      const result = await AdWhaleMediationAds.showAdInspector();
      setDebugInfo(
        result?.statusCode === 100
          ? `Ad Inspector 요청됨: ${result.message}`
          : `Ad Inspector를 열 수 없습니다: ${result?.statusCode} ${
              result?.message ?? ''
            }`,
      );
    } catch (e: any) {
      setDebugInfo(`Ad Inspector: ${e?.message ?? String(e)}`);
    }
  }, []);

  // ─── 배너 광고 로드 ──────────────────────────────────────────────────────
  const handleBannerLoad = useCallback(() => {
    const uid = currentPlacementUid();
    if (!uid) return;

    const parsedAdaptiveWidth = parseInt(adaptiveWidth, 10);
    const finalAdaptiveWidth = isNaN(parsedAdaptiveWidth) ? 0 : parsedAdaptiveWidth;

    setActiveBannerSize(selectedBannerSize);
    setBannerKey(k => k + 1);
    setLoadBannerAd(true);
    setIsBannerAdLoaded(false);

    const adaptiveInfo =
      selectedBannerSize === AdWhaleAdSize.ADAPTIVE_ANCHOR
        ? `\nadaptiveAnchorWidth: ${finalAdaptiveWidth || '0 (전체 너비)'}`
        : '';
    setDebugInfo(
      `배너 광고 요청!\npid: ${uid}\nsize: ${selectedBannerSize}${adaptiveInfo}\n`,
    );
  }, [currentPlacementUid, selectedBannerSize, adaptiveWidth]);

  // ─── 비배너 광고 로드 ────────────────────────────────────────────────────
  const handleNonBannerLoad = useCallback(() => {
    const uid = currentPlacementUid();
    switch (selectedAdType) {
      case 1: {
        const interstitialUid = isIos ? AdConfig.iosInterstitialAdUnitId : uid;
        setDebugInfo(`전면 광고 로드 시작...\npid: ${interstitialUid}\n`);
        AdWhaleInterstitialAd.loadAd(interstitialUid, {
          region: '서울시 서초구',
          gcoder: {lt: 37.49, lng: 127.02},
          placementName: 'test_interstitial',
        });
        break;
      }
      case 2: {
        const rewardUid = isIos ? AdConfig.iosRewardAdUnitId : uid;
        // 보상형 SSV(서버 사이드 검증): UI 입력값을 customData / userId 로 전달
        const rewardCustomData: {[key: string]: string} = {
          request_id: rewardRequestId,
          session_id: rewardSessionId,
          os: Platform.OS === 'ios' ? 'ReactNative-iOS' : 'ReactNative-Android',
        };
        AdWhaleRewardAd.loadAd(rewardUid, {
          region: 'test_reward_region',
          gcoder: {lt: 37.5, lng: 126.9},
          placementName: 'test_reward',
          userId: rewardUserId || undefined,
          customData: rewardCustomData,
        });
        setDebugInfo(
          `보상형 광고 로드 시작...\npid: ${rewardUid}\nuserId: ${
            rewardUserId || 'N/A'
          }\ncustomData: ${JSON.stringify(rewardCustomData)}\n`,
        );
        break;
      }
      case 3: {
        setIsNativeLoaded(false);
        setIsNativeShown(false);
        setNativeAdViewKey(k => k + 1);
        setDebugInfo(`네이티브 템플릿 광고 로드 시작...\npid: ${uid}\n`);
        setTimeout(() => templateRef.current?.loadAd(), 50);
        break;
      }
      case 4: {
        const customUid = isIos ? AdConfig.iosNativeAdUnitId : uid;
        setIsNativeLoaded(false);
        setIsNativeShown(false);
        setNativeAdViewKey(k => k + 1);
        setDebugInfo(`네이티브 커스텀 광고 로드 시작...\npid: ${customUid}\n`);
        setTimeout(() => customRef.current?.loadAd(), 50);
        break;
      }
      case 5: {
        const appOpenUid = isIos ? AdConfig.iosAppOpenAdUnitId : uid;
        setDebugInfo(`앱오프닝 광고 로드 시작...\npid: ${appOpenUid}\n`);
        AdWhaleAppOpenAd.loadAd(appOpenUid, {
          region: '서울시 강남구',
          gcoder: {lt: 37.5665, lng: 126.978},
          placementName: 'test_app_open',
        });
        break;
      }
      default:
        break;
    }
  }, [
    selectedAdType,
    currentPlacementUid,
    isIos,
    rewardUserId,
    rewardRequestId,
    rewardSessionId,
  ]);

  // ─── 비배너 광고 표시 ────────────────────────────────────────────────────
  const handleNonBannerShow = useCallback(() => {
    switch (selectedAdType) {
      case 1:
        if (!isInterstitialLoaded) {
          setDebugInfo('전면 광고를 먼저 로드해 주세요.\n');
          return;
        }
        AdWhaleInterstitialAd.showAd();
        setIsInterstitialLoaded(false);
        break;
      case 2:
        if (!isRewardLoaded) {
          setDebugInfo('보상형 광고를 먼저 로드해 주세요.\n');
          return;
        }
        AdWhaleRewardAd.showAd();
        setIsRewardLoaded(false);
        break;
      case 3:
        if (!isNativeLoaded) {
          setDebugInfo('네이티브 템플릿 광고를 먼저 로드해 주세요.\n');
          return;
        }
        templateRef.current?.showAd();
        setIsNativeLoaded(false);
        setIsNativeShown(true);
        break;
      case 4:
        if (!isNativeLoaded) {
          setDebugInfo('네이티브 커스텀 광고를 먼저 로드해 주세요.\n');
          return;
        }
        customRef.current?.showAd();
        setIsNativeLoaded(false);
        setIsNativeShown(true);
        break;
      case 5:
        if (!isAppOpenLoaded) {
          setDebugInfo('앱오프닝 광고를 먼저 로드해 주세요.\n');
          return;
        }
        AdWhaleAppOpenAd.showAd();
        setIsAppOpenLoaded(false);
        break;
      default:
        break;
    }
  }, [
    selectedAdType,
    isInterstitialLoaded,
    isRewardLoaded,
    isNativeLoaded,
    isAppOpenLoaded,
  ]);

  // ─── 뷰 초기화 ───────────────────────────────────────────────────────────
  const handleClearAds = useCallback(() => {
    setLoadBannerAd(false);
    setIsBannerAdLoaded(false);
    setIsInterstitialLoaded(false);
    setIsRewardLoaded(false);
    setIsAppOpenLoaded(false);
    setIsNativeLoaded(false);
    setIsNativeShown(false);
    setNativeAdViewKey(k => k + 1);
    setDebugInfo('Please touch [광고 로드] button.');
  }, []);

  // ─── 네이티브 이벤트 핸들러 ─────────────────────────────────────────────
  const handleNativeAdLoaded = useCallback(() => {
    setIsNativeLoaded(true);
    setDebugInfo(
      selectedAdType === 4
        ? '네이티브 커스텀 광고 로드 완료\n'
        : '네이티브 템플릿 광고 로드 완료\n',
    );
  }, [selectedAdType]);

  const handleNativeTemplateLoadFailed = useCallback(
    (e: AdWhaleNativeTemplateError) => {
      setIsNativeLoaded(false);
      setDebugInfo(`네이티브 광고 로드 실패: ${e.statusCode} - ${e.message}\n`);
    },
    [],
  );

  const handleNativeCustomLoadFailed = useCallback((e: AdWhaleNativeCustomError) => {
    setIsNativeLoaded(false);
    setDebugInfo(`네이티브 광고 로드 실패: ${e.statusCode} - ${e.message}\n`);
  }, []);

  // ─── Render Helper ───────────────────────────────────────────────────────
  const renderRadio = (
    label: string,
    selected: boolean,
    onPress: () => void,
    keyValue: string | number,
  ) => (
    <TouchableOpacity key={keyValue} style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderSmallButton = (
    label: string,
    onPress: (() => void) | undefined,
  ) => (
    <TouchableOpacity
      style={[styles.smallButton, !onPress && styles.buttonDisabled]}
      onPress={onPress}
      disabled={!onPress}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderPurpleButton = (label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.purpleButton} onPress={onPress}>
      <Text style={styles.purpleButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  // ─── 네이티브 광고 뷰 ────────────────────────────────────────────────────
  const renderNativeAdView = () => {
    if (!isNativeShown) return null;

    const uid = currentPlacementUid();
    const placementName = selectedAdType === 4 ? 'test_custom_native' : 'test_template_native';
    const region = '서울시 구로구';
    const gcoder = {lt: 37.48, lng: 126.89};

    if (selectedAdType === 4) {
      if (!NativeCustomView) {
        return (
          <View style={styles.nativeAdContainer}>
            <Text style={styles.bannerPlaceholderText}>
              AdWhaleNativeCustomView 컴포넌트를 현재 SDK에서 찾을 수 없습니다.
            </Text>
          </View>
        );
      }
      return (
        <NativeCustomView
          key={`custom-${nativeAdViewKey}`}
          ref={customRef}
          style={styles.nativeAdContainer}
          placementUid={isIos ? AdConfig.iosNativeAdUnitId : uid}
          placementName={placementName}
          region={region}
          gcoder={gcoder}
          factoryId="app_custom"
          onNativeAdLoaded={handleNativeAdLoaded}
          onNativeAdFailedToLoad={handleNativeCustomLoadFailed}
        />
      );
    }

    const template: AdWhaleNativeTemplateType = templateSize;
    const height = template === 'SMALL' ? 320 : template === 'MEDIUM' ? 520 : undefined;

    return (
      NativeTemplateView ? (
        <NativeTemplateView
          key={`template-${nativeAdViewKey}`}
          ref={templateRef}
          style={[
            styles.nativeAdContainer,
            height ? {height} : {flex: 1},
          ]}
          placementUid={uid}
          placementName={placementName}
          region={region}
          gcoder={gcoder}
          template={template}
          onNativeAdLoaded={handleNativeAdLoaded}
          onNativeAdFailedToLoad={handleNativeTemplateLoadFailed}
        />
      ) : (
        <View style={styles.nativeAdContainer}>
          <Text style={styles.bannerPlaceholderText}>
            AdWhaleNativeTemplateView 컴포넌트를 현재 SDK에서 찾을 수 없습니다.
          </Text>
        </View>
      )
    );
  };

  // 네이티브 광고 뷰 (로드만 된 상태, 아직 표시 전)
  const renderNativeAdViewHidden = () => {
    if (isNativeShown) return null;
    const uid = currentPlacementUid();
    const region = '서울시 구로구';
    const gcoder = {lt: 37.48, lng: 126.89};

    if (selectedAdType === 4) {
      if (!NativeCustomView) return null;
      return (
        <NativeCustomView
          key={`custom-${nativeAdViewKey}`}
          ref={customRef}
          style={[styles.nativeAdContainer, {height: 0, overflow: 'hidden'}]}
          placementUid={isIos ? AdConfig.iosNativeAdUnitId : uid}
          placementName="test_custom_native"
          region={region}
          gcoder={gcoder}
          factoryId="app_custom"
          onNativeAdLoaded={handleNativeAdLoaded}
          onNativeAdFailedToLoad={handleNativeCustomLoadFailed}
        />
      );
    }

    if (selectedAdType === 3) {
      if (!NativeTemplateView) return null;
      return (
        <NativeTemplateView
          key={`template-${nativeAdViewKey}`}
          ref={templateRef}
          style={[styles.nativeAdContainer, {height: 0, overflow: 'hidden'}]}
          placementUid={uid}
          placementName="test_template_native"
          region={region}
          gcoder={gcoder}
          template={templateSize}
          onNativeAdLoaded={handleNativeAdLoaded}
          onNativeAdFailedToLoad={handleNativeTemplateLoadFailed}
        />
      );
    }

    return null;
  };

  // ─── 배너 뷰 ─────────────────────────────────────────────────────────────
  const renderBannerView = () => {
    if (!loadBannerAd && !isBannerAdLoaded) {
      return (
        <View style={styles.bannerPlaceholder}>
          <Text style={styles.bannerPlaceholderText}>여기에 배너 광고가 노출됩니다.</Text>
        </View>
      );
    }

    const height = BANNER_HEIGHTS[activeBannerSize];
    const uid = currentPlacementUid();

    if (!BannerView) {
      return (
        <View style={styles.bannerPlaceholder}>
          <Text style={styles.bannerPlaceholderText}>
            AdWhaleAdView 컴포넌트를 현재 SDK에서 찾을 수 없습니다.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.bannerContainer, {height: height + 20}]}>
        <BannerView
          key={`banner-${bannerKey}`}
          style={[styles.bannerView, {height}]}
          placementUid={isIos ? AdConfig.iosBannerAdUnitId : uid}
          placementName="guide_banner"
          region="서울시 강남구"
          gcoder={{lt: 37.5665, lng: 126.978}}
          adSize={activeBannerSize}
          loadAd={loadBannerAd}
          onAdLoaded={() => {
            setIsBannerAdLoaded(true);
            setLoadBannerAd(false);
            setDebugInfo('배너 광고 로드 성공!\n');
          }}
          onAdLoadFailed={(e: {statusCode?: number; message?: string}) => {
            setIsBannerAdLoaded(false);
            setLoadBannerAd(false);
            setDebugInfo(`배너 광고 로드 실패: ${e.statusCode}, ${e.message}\n`);
          }}
          onAdClicked={() => setDebugInfo('배너 클릭됨\n')}
        />
      </View>
    );
  };

  const adTypeLabel = (idx: number) => {
    const labels = [
      '배너',
      '전면',
      '보상형전면',
      isIos ? '네이티브광고(고정형템플릿) (iOS 미지원)' : '네이티브광고(고정형템플릿)',
      isIos
        ? '네이티브광고(커스텀바인딩) (iOS: SDK 고정 레이아웃)'
        : '네이티브광고(커스텀바인딩)',
      '앱 오프닝',
    ];
    return labels[idx] ?? '';
  };

  // ─── iOS 전면/보상/커스텀네이티브/앱오프닝은 adUnitId 사용 안내 ──────────
  const showIosAdUnitIdNote =
    isIos &&
    (selectedAdType === 1 ||
      selectedAdType === 2 ||
      selectedAdType === 4 ||
      selectedAdType === 5);

  const iosAdUnitIdNote = () => {
    if (!showIosAdUnitIdNote) return null;
    const noteMap: Record<number, string> = {
      1: 'iOS 전면: AdConfig.iosInterstitialAdUnitId로 로드됩니다.',
      2: 'iOS 보상형: AdConfig.iosRewardAdUnitId로 로드됩니다.',
      4: 'iOS 네이티브: AdConfig.iosNativeAdUnitId로 로드됩니다.',
      5: 'iOS 앱오프닝: AdConfig.iosAppOpenAdUnitId로 로드됩니다.',
    };
    return (
      <Text style={styles.noteText}>{noteMap[selectedAdType]}</Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 메인으로</Text>
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>기본 배너/전면/보상형/네이티브/앱오프닝 테스트</Text>

          {/* TFUA */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TFUA</Text>
            {TFUA_LABELS.map((label, idx) =>
              renderRadio(
                label,
                tfuaModeIndex === idx,
                () => handleTfuaChange(idx),
                idx,
              ),
            )}
          </View>

          {/* MaxRating */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MaxRating</Text>
            {MAX_RATING_LABELS.map((label, idx) =>
              renderRadio(
                label,
                maxRatingIndex === idx,
                () => handleMaxRatingChange(idx),
                idx,
              ),
            )}
          </View>

          {/* COPPA / GDPR / Check / Reset */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.switchLabel}>COPPA</Text>
              <Switch
                value={isCoppa}
                onValueChange={async v => {
                  setIsCoppa(v);
                  await AdWhaleMediationAds.setCoppa(v);
                  setDebugInfo(`COPPA setting applied: ${v}`);
                }}
              />
            </View>
            <View style={styles.wrapRow}>
              {renderSmallButton('GDPR', handleRequestGdpr)}
              {renderSmallButton('Check', Platform.OS === 'android' ? handleCheckConsentStatus : undefined)}
              {renderSmallButton('Reset', handleResetGdpr)}
            </View>
            <View style={styles.wrapRow}>
              {renderSmallButton('SINGLE GDPR TRUE', Platform.OS === 'android' ? () => handleSetGdpr(true) : undefined)}
              {renderSmallButton('SINGLE GDPR FALSE', Platform.OS === 'android' ? () => handleSetGdpr(false) : undefined)}
            </View>
          </View>

          {/* AdMob Ad Inspector */}
          <View style={[styles.section, styles.alignRight]}>
            {renderSmallButton('AdMob Ad Inspector', handleAdInspector)}
          </View>

          {/* Logger */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>1. 로거출력여부:</Text>
            <Switch
              value={isLoggerOn}
              onValueChange={async v => {
                if (isIos) {
                  setDebugInfo('iOS에서는 로거 설정을 지원하지 않습니다.');
                  return;
                }
                setIsLoggerOn(v);
                await AdWhaleMediationAds.setLoggerEnabled(v);
                const logLevel = await AdWhaleMediationAds.getLogLevel();
                console.log('현재 로그 레벨:', logLevel);
              }}
            />
          </View>

          {/* 볼륨/Mute */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>앱 볼륨/Mute 설정:</Text>
            <View style={styles.row}>
              <Text style={styles.switchLabel}>App Muted:</Text>
              <Switch
                value={isAppMuted}
                onValueChange={setIsAppMuted}
              />
              <TextInput
                style={[styles.input, styles.volumeInput]}
                value={appVolumeText}
                onChangeText={setAppVolumeText}
                keyboardType="decimal-pad"
                placeholder="0.0 ~ 1.0"
                placeholderTextColor="#999"
              />
            </View>
            {renderSmallButton('볼륨/Mute 적용', handleApplyVolume)}
          </View>

          {/* 광고 타입 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>2. 광고 타입 선택:</Text>
            {([0, 1, 2, 3, 4, 5] as AdTypeIndex[]).map(idx =>
              renderRadio(
                adTypeLabel(idx),
                selectedAdType === idx,
                () => handleAdTypeChange(idx),
                idx,
              ),
            )}
          </View>

          {/* Publisher UID (disabled, Flutter와 동일) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>3. publisher uid입력:</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              editable={false}
              placeholder="publisher uid를 입력해주세요."
              placeholderTextColor="#999"
            />
          </View>

          {/* Placement UID */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {showIosAdUnitIdNote
                ? '4. placement / Ad Unit ID:'
                : '4. placement uid입력:'}
            </Text>
            {iosAdUnitIdNote()}
            <TextInput
              style={styles.input}
              value={placementUidText}
              onChangeText={text => {
                setPlacementUidText(text);
                placementUidByType.current[selectedAdType] = text.trim();
              }}
              placeholder={
                showIosAdUnitIdNote
                  ? '(Android만) placement uid'
                  : 'placement uid를 입력해주세요.'
              }
              placeholderTextColor="#999"
            />
          </View>

          {/* 보상형 SSV (userId / customData) 입력 */}
          {selectedAdType === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                5. 보상형 SSV (userId / customData) 입력:
              </Text>
              <Text style={styles.subsectionLabel}>request_id</Text>
              <TextInput
                style={styles.input}
                value={rewardRequestId}
                onChangeText={setRewardRequestId}
                autoCapitalize="none"
                placeholder="request_id"
                placeholderTextColor="#999"
              />
              <Text style={[styles.subsectionLabel, {marginTop: 8}]}>
                session_id
              </Text>
              <TextInput
                style={styles.input}
                value={rewardSessionId}
                onChangeText={setRewardSessionId}
                autoCapitalize="none"
                placeholder="session_id"
                placeholderTextColor="#999"
              />
              <Text style={[styles.subsectionLabel, {marginTop: 8}]}>
                userId
              </Text>
              <TextInput
                style={styles.input}
                value={rewardUserId}
                onChangeText={setRewardUserId}
                autoCapitalize="none"
                placeholder="userId (SSV user_id)"
                placeholderTextColor="#999"
              />
            </View>
          )}

          {/* 배너 사이즈 선택 */}
          {selectedAdType === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>5. 광고사이즈선택:</Text>
              <View style={styles.wrapRow}>
                {BANNER_SIZES.map(size =>
                  renderRadio(
                    BANNER_SIZE_LABELS[size],
                    selectedBannerSize === size,
                    () => setSelectedBannerSize(size),
                    size,
                  ),
                )}
              </View>
              {selectedBannerSize === AdWhaleAdSize.ADAPTIVE_ANCHOR && (
                <View style={styles.adaptiveContainer}>
                  <Text style={styles.adaptiveLabel}>
                    adaptive width size(0: 디바이스 전체 길이):
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={adaptiveWidth}
                    onChangeText={setAdaptiveWidth}
                    keyboardType="numeric"
                    placeholder="adaptive anchor width를 입력해주세요."
                    placeholderTextColor="#999"
                  />
                </View>
              )}
            </View>
          )}

          {/* 네이티브 템플릿 사이즈 선택 */}
          {selectedAdType === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>5. 광고사이즈선택:</Text>
              <Text style={styles.subsectionLabel}>템플릿 크기:</Text>
              <View style={styles.wrapRow}>
                {renderRadio(
                  'Small',
                  templateSize === 'SMALL',
                  () => setTemplateSize('SMALL'),
                  'native-template-small',
                )}
                {renderRadio(
                  'Medium',
                  templateSize === 'MEDIUM',
                  () => setTemplateSize('MEDIUM'),
                  'native-template-medium',
                )}
                {renderRadio(
                  'Fullscreen',
                  templateSize === 'FULLSCREEN',
                  () => setTemplateSize('FULLSCREEN'),
                  'native-template-fullscreen',
                )}
              </View>
            </View>
          )}

          {/* 버튼 영역 */}
          <View style={styles.buttonRow}>
            {selectedAdType === 0 ? (
              <>
                {renderPurpleButton('광고 로드', handleBannerLoad)}
                {renderPurpleButton('뷰 초기화', handleClearAds)}
              </>
            ) : (
              <>
                {renderPurpleButton('광고 로드', handleNonBannerLoad)}
                {renderPurpleButton('광고 표시', handleNonBannerShow)}
                {renderPurpleButton('뷰 초기화', handleClearAds)}
              </>
            )}
          </View>

          {/* Debug Info */}
          <View style={styles.section}>
            <TextInput
              style={styles.debugInfo}
              value={debugInfo}
              multiline
              editable={false}
            />
          </View>

          {/* 네이티브 광고 영역 */}
          <Text style={styles.nativeAdLabel}>네이티브 광고 영역</Text>
          {renderNativeAdViewHidden()}
          {renderNativeAdView()}
        </ScrollView>

        {/* 하단 배너 광고 영역 */}
        {selectedAdType === 0 && renderBannerView()}
      </View>
    </SafeAreaView>
  );
};

const PURPLE = '#6739F5';

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'white'},
  backButton: {
    padding: 16,
    backgroundColor: '#f3f3f3',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButtonText: {fontSize: 15, color: '#007AFF', fontWeight: '600'},
  container: {flex: 1},
  scrollView: {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 32},
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {marginBottom: 16},
  sectionLabel: {fontSize: 15, fontWeight: 'bold', marginBottom: 6, color: '#333'},
  subsectionLabel: {fontSize: 14, marginBottom: 4, color: '#555'},
  row: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8},
  wrapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4},
  alignRight: {alignItems: 'flex-end'},
  switchLabel: {fontSize: 14, color: '#333', marginRight: 4},
  radioRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 4},
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {borderColor: PURPLE},
  radioInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: PURPLE},
  radioLabel: {fontSize: 13, color: '#333', flexShrink: 1},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    backgroundColor: 'white',
  },
  inputDisabled: {backgroundColor: '#f5f5f5', color: '#aaa'},
  volumeInput: {flex: 1, marginLeft: 8},
  adaptiveContainer: {marginTop: 8},
  adaptiveLabel: {fontSize: 14, color: '#333', marginBottom: 4},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  purpleButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 80,
  },
  purpleButtonText: {color: 'white', fontSize: 13, fontWeight: '600'},
  smallButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  smallButtonText: {color: 'white', fontSize: 11, fontWeight: '600'},
  buttonDisabled: {opacity: 0.4},
  debugInfo: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    minHeight: 120,
    fontSize: 13,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  nativeAdLabel: {fontWeight: 'bold', marginBottom: 8, color: '#333'},
  nativeAdContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
    height: 360,
  },
  bannerContainer: {
    width: '100%',
    backgroundColor: '#eaeaea',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bannerView: {width: '100%', backgroundColor: 'white'},
  bannerPlaceholder: {
    width: '100%',
    height: 60,
    backgroundColor: '#eaeaea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholderText: {fontSize: 13, color: '#888'},
  noteText: {fontSize: 12, color: '#777', marginBottom: 4, fontStyle: 'italic'},
});

export default AdWhaleGuideSampleScreen;
