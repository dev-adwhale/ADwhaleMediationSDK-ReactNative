export const AdConfig = {
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

  get placementUid() {
    return this.banner320x50PlacementUid;
  },
} as const;