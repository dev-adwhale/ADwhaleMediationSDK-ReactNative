/**
 * AdWhale SDK Configuration
 * debug/release 분기 없이 release(운영) 값 단일 구성으로 사용합니다.
 *
 * Android: placementUid(AU…)는 AdWhale 미디에이션 슬롯 ID.
 * iOS 배너 등: AdWhaleBannerAd 가 GMA ad unit ID(ca-app-pub-…)를 요구하므로 별도 키 사용 (Flutter AdConfig 와 동일).
 */

import { Platform } from 'react-native';

type AdwhaleConfigMap = {
  iosBannerAdUnitId: string;
  iosInterstitialAdUnitId: string;
  iosRewardAdUnitId: string;
  iosAppOpenAdUnitId: string;
  iosNativeAdUnitId: string;
  banner320x50PlacementUid: string;
  banner320x100PlacementUid: string;
  banner300x250PlacementUid: string;
  banner250x250PlacementUid: string;
  interstitialPlacementUid1: string;
  interstitialPlacementUid2: string;
  interstitialPlacementUid3: string;
  rewardPlacementUid1: string;
  rewardPlacementUid2: string;
  rewardPlacementUid3: string;
  nativePlacementUid: string;
  appOpenPlacementUid: string;
  exitPopupPlacementUid: string;
  transitionPopupPlacementUid: string;
};

export const adwhaleConfig: AdwhaleConfigMap = {
  iosBannerAdUnitId: 'YOUR_IOS_BANNER_PLACEMENT_UID',
  iosInterstitialAdUnitId: 'YOUR_IOS_INTERSTITIAL_PLACEMENT_UID',
  iosRewardAdUnitId: 'YOUR_IOS_REWARD_PLACEMENT_UID',
  iosAppOpenAdUnitId: 'YOUR_IOS_APP_OPEN_PLACEMENT_UID',
  iosNativeAdUnitId: 'YOUR_IOS_NATIVE_PLACEMENT_UID',
  banner320x50PlacementUid: 'YOUR_AOS_BANNER_PLACEMENT_UID',
  banner320x100PlacementUid: 'YOUR_AOS_BANNER_PLACEMENT_UID',
  banner300x250PlacementUid: 'YOUR_AOS_BANNER_PLACEMENT_UID',
  banner250x250PlacementUid: 'YOUR_AOS_BANNER_PLACEMENT_UID',
  interstitialPlacementUid1: 'YOUR_AOS_INTERSTITIAL_PLACEMENT_UID',
  interstitialPlacementUid2: 'YOUR_AOS_INTERSTITIAL_PLACEMENT_UID',
  interstitialPlacementUid3: 'YOUR_AOS_INTERSTITIAL_PLACEMENT_UID',
  rewardPlacementUid1: 'YOUR_AOS_REWARD_PLACEMENT_UID',
  rewardPlacementUid2: 'YOUR_AOS_REWARD_PLACEMENT_UID',
  rewardPlacementUid3: 'YOUR_AOS_REWARD_PLACEMENT_UID',
  nativePlacementUid: 'YOUR_AOS_NATIVE_PLACEMENT_UID',
  appOpenPlacementUid: 'YOUR_AOS_APP_OPEN_PLACEMENT_UID',
  exitPopupPlacementUid: 'YOUR_AOS_EXIT_POPUP_PLACEMENT_UID',
  transitionPopupPlacementUid: 'YOUR_AOS_TRANSITION_POPUP_PLACEMENT_UID',
};

export const iosBannerAdUnitId = adwhaleConfig.iosBannerAdUnitId;
export const iosInterstitialAdUnitId = adwhaleConfig.iosInterstitialAdUnitId;
export const iosRewardAdUnitId = adwhaleConfig.iosRewardAdUnitId;
export const iosAppOpenAdUnitId = adwhaleConfig.iosAppOpenAdUnitId;
export const iosNativeAdUnitId = adwhaleConfig.iosNativeAdUnitId;
export const banner320x50PlacementUid = adwhaleConfig.banner320x50PlacementUid;
export const banner320x100PlacementUid = adwhaleConfig.banner320x100PlacementUid;
export const banner300x250PlacementUid = adwhaleConfig.banner300x250PlacementUid;
export const banner250x250PlacementUid = adwhaleConfig.banner250x250PlacementUid;
/** iOS는 GMA ad unit ID, Android는 AU placementUid 사용 */
export const interstitialPlacementUid1 =
  Platform.OS === 'ios'
    ? iosInterstitialAdUnitId
    : adwhaleConfig.interstitialPlacementUid1;
export const interstitialPlacementUid2 =
  Platform.OS === 'ios'
    ? iosInterstitialAdUnitId
    : adwhaleConfig.interstitialPlacementUid2;
export const interstitialPlacementUid3 =
  Platform.OS === 'ios'
    ? iosInterstitialAdUnitId
    : adwhaleConfig.interstitialPlacementUid3;
export const rewardPlacementUid1 =
  Platform.OS === 'ios' ? iosRewardAdUnitId : adwhaleConfig.rewardPlacementUid1;
export const rewardPlacementUid2 =
  Platform.OS === 'ios' ? iosRewardAdUnitId : adwhaleConfig.rewardPlacementUid2;
export const rewardPlacementUid3 =
  Platform.OS === 'ios' ? iosRewardAdUnitId : adwhaleConfig.rewardPlacementUid3;
export const nativePlacementUid =
  Platform.OS === 'ios' ? iosNativeAdUnitId : adwhaleConfig.nativePlacementUid;
export const appOpenPlacementUid =
  Platform.OS === 'ios' ? iosAppOpenAdUnitId : adwhaleConfig.appOpenPlacementUid;
export const exitPopupPlacementUid = adwhaleConfig.exitPopupPlacementUid;
export const transitionPopupPlacementUid =
  adwhaleConfig.transitionPopupPlacementUid;

/** 기본 배너용: Android 는 placementUid, iOS 는 GMA 배너 단위 ID */
export const defaultBannerPlacementOrIosAdUnitId =
  Platform.OS === 'ios'
    ? iosBannerAdUnitIdForMultiSlot(0)
    : banner320x50PlacementUid;

/**
 * iOS 멀티 배너 슬롯: release 단일 구성이므로 모든 슬롯이 iosBannerAdUnitId 를 사용.
 */
export function iosBannerAdUnitIdForMultiSlot(_slotIndex: number): string {
  return adwhaleConfig.iosBannerAdUnitId;
}

/**
 * 배너 AdWhaleAdView 의 placementUid: Android 는 AU…, iOS 는 ca-app-pub…
 */
export function bannerAdUnitIdForCurrentPlatform(
  androidPlacementUid: string,
  _options?: { adSizeIsAdaptiveAnchor?: boolean },
): string {
  if (Platform.OS !== 'ios') {
    return androidPlacementUid;
  }
  if (androidPlacementUid.includes('ca-app-pub-')) {
    return androidPlacementUid;
  }
  return iosBannerAdUnitIdForMultiSlot(0);
}

export default adwhaleConfig;
