# AdWhale SDK React Native (Bare) Sample

AdWhale Mediation SDK 를 **Bare React Native (RN CLI)** 환경에서 사용하는 샘플 프로젝트입니다.

## Support platforms
| Platform | Support |
|----------|---------|
| Android  | O       |
| iOS      | O       |

## Support Features
| Features         | Support           |
|------------------|-------------------|
| SDK initialize   | O                 |
| Banner           | O                 |
| Interstitial     | O                 |
| Rewarded         | O                 |
| Native Template  | ⚠️(Android only)  |
| Native Custom    | O                 |
| App Open         | O                 |
| App Exit Popup   | ⚠️(Android only)  |
| Transition Popup | ⚠️(Android only)  |
| Event Callback   | O                 |

## Version
샘플에 적용된 React Native SDK 버전은 ```2.7.400``` 입니다.

| Native SDK    | React Native SDK |
|---------------|------------------|
| Android 2.7.4 | 2.7.400          |
| iOS 1.0.7     | 2.7.400          |

- React Native: `0.83.1`

## 시작하기

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 1. 프로젝트 클론
git clone https://github.com/dev-adwhale/ADwhaleMediationSDK-ReactNative.git
cd ADwhaleMediationSDK-ReactNative/ReactNativeSample

# 2. 의존성 설치
yarn install        # 또는 npm install

# 3. iOS 의존성 설치 (iOS 빌드 시에만 필요)
cd ios
pod install
cd ..
```

### 2. 필수 설정

#### Android 설정

`android/app/src/main/AndroidManifest.xml` 의 `<application>` 안에 다음 값을 설정하세요:

```xml
<!-- AdWhale SDK 설정 -->
<meta-data
    android:name="net.adwhale.sdk.mediation.PUBLISHER_UID"
    android:value="YOUR_PUBLISHER_UID" />

<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="YOUR_ANDROID_ADMOB_APP_ID" />
```

- `YOUR_PUBLISHER_UID`: AdWhale 대시보드에서 발급받은 Publisher UID
- `YOUR_ANDROID_ADMOB_APP_ID`: Google AdMob 발급 Application ID (예: `ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx`)

> AdMob App ID 가 잘못되면 앱 시작 시 `MobileAdsInitProvider ... Invalid application ID` 로 크래시합니다.

미디에이션 어댑터 의존성·maven 저장소·R8 난독화 규칙·Gradle 힙은 다음 파일에 이미 구성되어 있습니다(네트워크 추가 시 수정): `android/build.gradle`, `android/app/build.gradle`, `android/app/proguard-rules.pro`, `android/gradle.properties`.

#### iOS 설정

1. **서명(Development Team) 설정**
   - `ios/ReactNativeSample.xcworkspace` 를 Xcode 로 엽니다.
   - **TARGETS → ReactNativeSample → Signing & Capabilities** → **Team** 에서 본인의 Apple Developer 팀을 선택합니다.
     (팀이 없다면 [Apple Developer Program](https://developer.apple.com/programs/) 가입 필요)

2. **AdMob 앱 ID 설정**
   - `ios/ReactNativeSample/Info.plist` 의 `GADApplicationIdentifier` 값을 iOS AdMob App ID 로 변경합니다.
     (예: `ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx`)

> iOS 미디에이션 spec source / 미디에이션 pod / `-ObjC` 링커 플래그 / 커스텀 네이티브(`ExampleCustomNativeAdView`)는 `ios/Podfile` 과 `ios/ReactNativeSample/AppDelegate.swift` 에 이미 구성되어 있습니다.

#### Placement UID 설정 — `config.ts`

각 광고 타입별 Placement UID(운영 값)를 설정하세요. iOS 는 GMA Ad Unit ID, Android 는 AdWhale Placement UID 를 사용합니다.

```ts
export const AdConfig = {
  // iOS 지면ID (AdUnitId)
  iosBannerAdUnitId: 'YOUR_IOS_BANNER_AD_UNIT_ID',
  iosInterstitialAdUnitId: 'YOUR_IOS_INTERSTITIAL_AD_UNIT_ID',
  iosRewardAdUnitId: 'YOUR_IOS_REWARD_AD_UNIT_ID',
  iosAppOpenAdUnitId: 'YOUR_IOS_APP_OPEN_AD_UNIT_ID',
  iosNativeAdUnitId: 'YOUR_IOS_NATIVE_AD_UNIT_ID',

  // Android 지면ID (PlacementUid)
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
} as const;
```

### 3. 실행

```bash
# Metro 시작
yarn start

# Android (debug)
yarn android
# Android (release)
npx react-native run-android --mode release

# iOS (debug)
yarn ios
# iOS (release)
npx react-native run-ios --mode Release
```

### 4. 환경 점검
```sh
npx react-native doctor
```

## 프로젝트 구조

- `App.tsx`: 앱 진입점 + SDK 초기화 + **앱 종료 팝업(Android 전용)** 구현(메인 메뉴에서 하드웨어 뒤로가기 가로채기), 메뉴 네비게이션
- `AdWhaleGuideSampleScreen.tsx`: 배너 / 전면 / 보상형(SSV) / 네이티브(템플릿·커스텀) / 앱 오프닝 통합 테스트
- `AdWhaleTransitionPopupSampleScreen.tsx`: **앱 전환 팝업(Android 전용)** 광고 구현
- `config.ts`: 광고 Placement UID 설정(`AdConfig`)
- `ios/ReactNativeSample/ExampleCustomNativeAdView.swift`: iOS 커스텀 네이티브 광고 뷰 구현(`app_custom`)
- `android/app/src/main/java/.../MainActivity.kt`: Android 커스텀 네이티브 BinderFactory 등록(`app_custom`)

## 요구사항

- Node.js 18 이상
- React Native 0.83
- Android Studio / Xcode (네이티브 빌드용)
- CocoaPods (iOS)

## 참고 문서

- [AdWhale SDK React Native 가이드](https://adwhale.gitbook.io/adwhale-mediation-sdk/react-native/sdk)

## 문제 해결

### iOS 빌드 오류
- **Signing requires a development team**: `ios/ReactNativeSample.xcworkspace` → Signing & Capabilities 에서 Team 을 선택하세요.
- **배너 로드 실패 `Cannot determine request type`**: iOS 배너는 GMA Ad Unit ID(`iosBannerAdUnitId`)가 필요합니다. `config.ts` 의 iOS 값을 확인하세요.
- **Pod / 빌드 캐시 문제**:
```bash
cd ios
pod deintegrate
pod install
cd ..
yarn start --reset-cache
```

### Android 빌드 오류
- **`Invalid application ID` 크래시**: `AndroidManifest.xml` 의 AdMob `APPLICATION_ID` 가 유효한지 확인하세요.
- **R8 `OutOfMemoryError`**: `android/gradle.properties` 의 `org.gradle.jvmargs` 힙을 올리세요(기본 6g).
- **클린 빌드**:
```bash
yarn start --reset-cache
cd android
./gradlew clean
cd ..
```

## 라이선스

이 프로젝트는 샘플 프로젝트입니다.
