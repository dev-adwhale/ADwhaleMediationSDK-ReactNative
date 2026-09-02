# AdWhale SDK React Native (Expo) Sample

AdWhale Mediation SDK 를 **Expo (Custom Dev Client / Bare Workflow)** 환경에서 사용하는 샘플 프로젝트입니다.

> ⚠️ 네이티브 광고 모듈 특성상 **Expo Go 에서는 동작하지 않습니다.** `expo prebuild` 로 생성한 Dev Client / Release 빌드로 실행하세요.

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
샘플에 적용된 React Native SDK 버전은 ```2.7.700``` 입니다.

| Native SDK    | React Native SDK |
|---------------|------------------|
| Android 2.7.7 | 2.7.700          |
| iOS 1.0.8     | 2.7.700          |

- Expo SDK: `~54.0.30`
- React Native: `0.81.5`

## 시작하기

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 1. 프로젝트 클론
git clone https://github.com/dev-adwhale/ADwhaleMediationSDK-ReactNative.git
cd ADwhaleMediationSDK-ReactNative/ExpoSample

# 2. 의존성 설치
npm install        # 또는 yarn install

# 3. 네이티브 프로젝트 생성 (android/ ios/ 는 prebuild 산출물)
npx expo prebuild --clean

# 4. iOS 의존성 설치 (iOS 빌드 시에만 필요)
cd ios
pod install
cd ..
```

### 2. 필수 설정

> Expo 는 `android/` · `ios/` 네이티브 폴더를 **prebuild 가 자동 생성**합니다. 따라서 `AndroidManifest.xml` · `Info.plist` 를 직접 수정하면 다음 `prebuild --clean` 때 사라집니다.
> 모든 네이티브 설정은 **`app.json` 과 config plugin(`plugins/withAdwhaleAds.js`)** 에서 관리하며, prebuild 시 자동 주입됩니다.

#### (1) PUBLISHER_UID / AdMob App ID — `plugins/withAdwhaleAds.js`

이 plugin 이 prebuild 때 AndroidManifest 와 iOS Info.plist 에 값을 주입합니다. 파일 상단 상수를 본인 값으로 바꾸세요:

```js
// AndroidManifest <application> 에 주입 (com.google.android.gms.ads / net.adwhale.sdk.mediation)
const ANDROID_PUBLISHER_UID = 'YOUR_PUBLISHER_UID';            // AdWhale 대시보드 발급 Publisher UID
const ANDROID_ADMOB_APP_ID  = 'YOUR_ANDROID_ADMOB_APP_ID';    // 예: ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx

// iOS Info.plist GADApplicationIdentifier 에 주입
const IOS_ADMOB_APP_ID      = 'YOUR_IOS_ADMOB_APP_ID';        // 예: ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
```

> AdMob App ID 가 잘못되면 앱 시작 시 `MobileAdsInitProvider ... Invalid application ID` 로 크래시합니다. 반드시 유효한 값을 넣으세요.

이 plugin 은 그 외에도 prebuild 시 다음을 자동 처리합니다(수정 불필요): iOS Podfile spec source(`AdWhaleSDK_iOS`) 주입, `-ObjC` 링커 플래그, 미디에이션 어댑터 의존성, Gradle 힙 상향, 커스텀 네이티브 광고(`app_custom`) 등록 + 레이아웃.

#### (2) 빌드 속성 — `app.json` 의 `expo-build-properties`

미디에이션 maven 저장소, SDK/Kotlin 버전, iOS 미디에이션 pod, R8 난독화 규칙이 들어 있습니다. 보통 그대로 두면 되며, 새 미디에이션 네트워크 추가 시 이곳을 수정합니다.

#### (3) iOS 서명(Development Team)

`npx expo prebuild` 후 Xcode 에서 팀을 지정합니다.
- `ios/ExpoSample.xcworkspace` 를 Xcode 로 엽니다.
- **TARGETS → ExpoSample → Signing & Capabilities** → **Team** 에서 본인의 Apple Developer 팀 선택.
  (팀이 없다면 [Apple Developer Program](https://developer.apple.com/programs/) 가입 필요)

#### (4) Placement UID — `adwhale/config.ts`

각 광고 타입별 Placement UID(운영 값)를 설정하세요. iOS 는 GMA Ad Unit ID, Android 는 AdWhale Placement UID 를 사용합니다.

```ts
export const adwhaleConfig = {
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
};
```

> `config.ts` 는 debug/release 분기 없이 단일(운영) 값으로 동작합니다.

### 3. 실행

```bash
# 네이티브/설정 변경 후에는 prebuild 재생성
npx expo prebuild --clean
cd ios && pod install && cd ..

# Android (debug)
npx expo run:android
# Android (release)
npx expo run:android --variant release

# iOS (debug)
npx expo run:ios
# iOS (release)
npx expo run:ios --configuration Release
```

### 4. 환경 점검
```sh
npx expo-doctor
```

## 프로젝트 구조

- `app/_layout.tsx`: 루트 레이아웃 + SDK 초기화 + **앱 종료 팝업(Android 전용)** 구현(하드웨어 뒤로가기 가로채기)
- `app/(tabs)/index.tsx`: 메인(가이드) 화면 진입점 → `adwhale/GuideSampleScreen`
- `app/(tabs)/explore.tsx`: **앱 전환 팝업(Android 전용)** 테스트 탭 → `adwhale/TransitionPopupScreen`
- `adwhale/GuideSampleScreen.tsx`: 배너 / 전면 / 보상형(SSV) / 네이티브(템플릿·커스텀) / 앱 오프닝 통합 테스트
- `adwhale/TransitionPopupScreen.tsx`: 앱 전환 팝업 광고 구현
- `adwhale/config.ts`: 광고 Placement UID 설정
- `plugins/withAdwhaleAds.js`: prebuild 시 네이티브 설정 주입(Manifest/Info.plist meta-data, Podfile source, 어댑터, 커스텀 네이티브 등)

## 요구사항

- Node.js 18 이상
- Expo SDK 54 / React Native 0.81
- Android Studio / Xcode (네이티브 빌드용)
- CocoaPods (iOS)

## 참고 문서

- [AdWhale SDK React Native 가이드](https://adwhale.gitbook.io/adwhale-mediation-sdk/react-native/sdk)

## 문제 해결

### Expo / 공통
- **설정이 반영 안 됨**: `npx expo prebuild --clean` 으로 네이티브를 재생성하세요. JS 변경만이면 `npx expo start -c` 로 Metro 캐시를 비웁니다.
- **Expo Go 로 켜져 광고가 안 뜸**: Dev Client(`expo run:*`) 로 실행하고 있는지 확인하세요.

### iOS 빌드 오류
- **Signing requires a development team**: `ios/ExpoSample.xcworkspace` → Signing & Capabilities 에서 Team 을 선택하세요.
- **`use_frameworks! static` + 새 아키텍처 충돌**: `app.json` 의 `expo-build-properties.ios` 에 `"buildReactNativeFromSource": true` 를 추가하고 `prebuild --clean` 후 다시 빌드하세요.
- **Pod 캐시 문제**:
```bash
cd ios && pod deintegrate && pod install && cd ..
```

### Android 빌드 오류
- **`Invalid application ID` 크래시**: `plugins/withAdwhaleAds.js` 의 `ANDROID_ADMOB_APP_ID` 가 유효한 AdMob App ID 인지 확인하세요.
- **R8 `OutOfMemoryError`**: plugin 이 `org.gradle.jvmargs` 힙을 상향(6g)합니다. 부족하면 더 올리세요.
- **클린 빌드**:
```bash
cd android && ./gradlew clean && cd ..
```

## 라이선스

이 프로젝트는 샘플 프로젝트입니다.
