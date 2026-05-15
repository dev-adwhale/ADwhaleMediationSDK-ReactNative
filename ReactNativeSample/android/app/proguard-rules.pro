# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
#================== AdWhale Mediation SDK Proguard for Release 적용 코드 시작 ==================

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationAds {
    public static final int TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED;
    public static final int TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE;
    public static final int TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE;
    public static final java.lang.String MAX_AD_CONTENT_RATING_G;
    public static final java.lang.String MAX_AD_CONTENT_RATING_PG;
    public static final java.lang.String MAX_AD_CONTENT_RATING_T;
    public static final java.lang.String MAX_AD_CONTENT_RATING_MA;

    public static *** init(***);
    public static *** init(***, ***);
    public static *** setCoppa(***);
    public static *** setGdpr(***);
    public static *** getGdpr(***);
    public static *** requestGdprConsent(***, ***);
    public static *** isCoppaApplied();
    public static *** getGdprConsentStatus(***);
    public static *** resetGdprConsentStatus(***);
    public static *** getAdwhaleGDPR(***);
    public static *** setAppVolume(***);
    public static *** setAppMuted(***);
    public static *** setTagForUnderAgeOfConsent(***);
    public static *** setMaxAdContentRating(***);
    public static *** setTestDeviceIdentifiers(***);
    public static *** openAdInspector(***, ***);
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleGdprConsentListener {*;}
-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationAdInspectorCloseListener {*;}
-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationOnInitCompleteListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.utils.AdWhaleLog {
    public static *** setLogLevel(***);
    public static *** getLogLevel();
    public static *** d(***);
    public static *** i(***);
    public static *** w(***);
    public static *** e(java.lang.String);
    public static *** e(java.lang.String, java.lang.Exception);
    public static *** e(java.lang.String, java.lang.Throwable);
}

-keep class net.adwhale.sdk.mediation.ads.ADWHALE_AD_SIZE {*;}
-keep class net.adwhale.sdk.mediation.ads.ADWHALE_RESULT_CODE {*;}
-keep class net.adwhale.sdk.mediation.ads.ADWHALE_NATIVE_TEMPLATE {*;}
-keep class net.adwhale.sdk.mediation.ads.ADWHALE_POPUP_AD_CLOSE_REASON {*;}
-keep class net.adwhale.sdk.mediation.ads.GdprConsentStatus {*;}

-keep class net.adwhale.sdk.utils.AdWhaleLog$LogLevel{*;}
-keep class net.adwhale.sdk.impl.mediation.ReqMediationAdConfig {*;}
-keep class net.adwhale.sdk.impl.mediation.ResMediationAdConfig {*;}
-keep class net.adwhale.sdk.impl.mediation.ResMediation {*;}
-keep class net.adwhale.sdk.impl.mediation.ResExtension {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationInterstitialAd {
    public <init>(...);
    public *** loadAd();
    public *** showAd();
    public *** showAd(***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementName(***);
    public *** destroy();
    public *** setAdWhaleMediationInterstitialAdListener(***);
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationInterstitialAdListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationRewardAd {
    public <init>(...);
    public *** loadAd(***);
    public *** showAd(***);
    public *** showAd(***, ***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementName(***);
    public *** destroy();
    public *** setAdWhaleMediationFullScreenContentCallback(***);
}

-keep class net.adwhale.sdk.mediation.ads.AdWhaleMediationRewardItem {*;}
-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationFullScreenContentCallback {*;}
-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationRewardedAdLoadCallback {*;}
-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationUserEarnedRewardListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationNativeAdView {
    public <init>(...);
    public *** loadAdWithBinder(***);
    public *** loadAdWithTemplate(***);
    public *** show();
    public *** setDebugEnabled(***);
    public *** setAdWhaleMediationNativeAdViewListener(***);
    public *** setPlacementUid(***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** resume();
    public *** pause();
    public *** destroy();
}

-keep class net.adwhale.sdk.mediation.ads.AdWhaleNativeAdBinder {*;}
-keep class net.adwhale.sdk.mediation.ads.AdWhaleNativeAdBinder$Builder {*;}
-keep class net.adwhale.sdk.mediation.ads.AdWhaleMediationNativeTemplateStyle {*;}
-keep class net.adwhale.sdk.mediation.ads.AdWhaleMediationNativeTemplateStyle$Builder {*;}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationNativeAdViewListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationAdView {
    public <init>(...);
    public *** loadAd();
    public *** destroy();
    public *** setAdWhaleMediationAdViewListener(***);
    public *** setAdwhaleAdSize(***);
    public *** setPlacementUid(***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementName(***);
    public *** setAdaptiveAnchorWidth(***);
    public *** resume();
    public *** pause();
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationAdViewListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationAdBannerView {
    public <init>(...);
    public *** loadAd();
    public *** show();
    public *** setRegion(***);
    public *** setPlacementName(***);
    public *** destroy();
    public *** setAdWhaleMediationAdBannerViewListener(***);
    public *** setAdaptiveAnchorWidth(***);
    public *** resume();
    public *** pause();
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationAdBannerViewListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationAppOpenAd {
    public <init>(...);
    public *** loadAd();
    public *** showAd(***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementUid(***);
    public *** setPlacementName(***);
    public *** destroy();
    public *** setAdWhaleMediationAppOpenAdListener(***);
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationAppOpenAdListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationExitPopupAd {
    public <init>(...);
    public *** loadAd();
    public *** showAd(***, ***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementUid(***);
    public *** setPlacementName(***);
    public *** setCustomizeButtonText(***, ***);
    public *** setCustomDescription(***);
    public *** destroy();
    public *** resume(***);
    public *** setAdWhaleMediationExitPopupAdListener(***);
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationExitPopupAdListener {*;}

-keepclasseswithmembers class net.adwhale.sdk.mediation.ads.AdWhaleMediationTransitionPopupAd {
    public <init>(...);
    public *** loadAd();
    public *** showAd(***, ***);
    public *** setRegion(***);
    public *** setGcoder(***, ***);
    public *** setPlacementUid(***);
    public *** setPlacementName(***);
    public *** destroy();
    public *** resume(***);
    public *** setAdWhaleMediationTransitionPopupAdListener(***);
}

-keep interface net.adwhale.sdk.mediation.ads.AdWhaleMediationTransitionPopupAdListener {*;}

#================== AdWhale Mediation SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale Cauly Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.cauly.adapter.CaulyAdBannerLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyAdInterstitialLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyAdRewardLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyCustomEventInterstitialLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyCustomEventBannerLoader {*;}

-keep class net.adwhale.sdk.cauly.adapter.CaulyCustomEventRewardLoader {*;}

#================== AdWhale Cauly Adapter SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale Admize Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.admize.adapter.AdmizeAdBannerLoader {*;}

-keep class net.adwhale.sdk.admize.adapter.AdmizeAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.admize.adapter.AdmizeAdInterstitialLoader {*;}

-keep class net.adwhale.sdk.admize.adapter.AdmizeAdRewardLoader {*;}

#================== AdWhale Admize Adapter SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale AdFit Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.adfit.adapter.AdFitAdBannerLoader {*;}

-keep class net.adwhale.sdk.adfit.adapter.AdFitAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.adfit.adapter.AdFitExitPopupAdLoader {*;}

-keep class net.adwhale.sdk.adfit.adapter.AdFitTransitionPopupAdLoader {*;}

#================== AdWhale AdFit Adapter SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale AdManager Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdBannerLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdInterstitialLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdNativeTemplateLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdNativeCustomBindingLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdRewardLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdManagerAdRewardedInterstitialLoader {*;}
-keep class net.adwhale.sdk.admob.adapter.AdManagerAdAppOpeningLoader {*;}

#================== AdWhale AdManager Adapter SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale Admob Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.admob.adapter.AdmobAdBannerLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdInterstitialLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdNativeTemplateLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdNativeCustomBindingLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdRewardLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdRewardedInterstitialLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.AdmobAdAppOpeningLoader {*;}

-keep class net.adwhale.sdk.admob.adapter.custom.cauly.AdMobCaulyEvent {*;}

-keep class net.adwhale.sdk.admob.adapter.custom.cauly.CaulyMediationBannerAd {*;}

-keep class net.adwhale.sdk.admob.adapter.custom.cauly.CaulyMediationInterstitialAd {*;}

-keep class net.adwhale.sdk.admob.adapter.custom.cauly.CaulyMediationRewardAd {*;}

# AdWhale AdMob Adapter - Keep the public entry points for reflection
-keep public class net.adwhale.sdk.admob.adapter.AdMobPrivacyAdapter {
    public static net.adwhale.sdk.admob.adapter.AdMobPrivacyAdapter getInstance();
}

#================== AdWhale Admob Adapter SDK Proguard for Release 적용 코드 끝 ==================

#================== AdWhale LevelPlay Adapter SDK Proguard for Release 적용 코드 시작 ==================

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdBannerLoader {*;}

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdBannerPreLoader {*;}

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdInterstitialLoader {*;}

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdRewardLoader {*;}

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdNativeCustomBindingLoader {*;}

-keep class net.adwhale.sdk.levelplay.adapter.LevelPlayAdNativeTemplateLoader {*;}

# AdWhale LevelPlay Adapter - Keep the public entry points for reflection
-keep public class net.adwhale.sdk.levelplay.adapter.LevelPlayPrivacyAdapter {
    public static net.adwhale.sdk.levelplay.adapter.LevelPlayPrivacyAdapter getInstance();
}

#================== AdWhale LevelPlay Adapter SDK Proguard for Release 적용 코드 끝 ==================
