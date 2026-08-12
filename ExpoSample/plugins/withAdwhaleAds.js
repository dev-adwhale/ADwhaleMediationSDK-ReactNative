// plugins/withAdwhaleAds.js
//
// ExpoSample 전용 config plugin.
// adwhale-sdk-react-native/example/ios/Podfile 에 있던 설정 중
// expo-build-properties 로 표현할 수 없는 두 가지를 prebuild 시 자동 주입한다.
//
//   1) CocoaPods spec source 선언 (AdWhaleSDK 1.0.7 pod 을 찾기 위해 필수)
//        source 'https://cdn.cocoapods.org/'
//        source 'https://github.com/dev-adwhale/AdWhaleSDK_iOS.git'
//   2) 앱 타겟 OTHER_LDFLAGS 에 -ObjC (미디에이션 어댑터의 카테고리 로딩용)
//   3) (Android) 앱 build.gradle 에 미디에이션 어댑터 의존성 주입
//
// ⚠️ 3번은 "테스트용"이다. 실제 제품에서는 SDK 배포 후, 앱 개발자가
//    연동 가이드를 보고 자기 앱 build.gradle 에 직접 추가하는 항목이다.
//    (SDK 패키지 자체에는 어댑터가 들어가지 않는다.)
//
// use_frameworks! :linkage => :static, 미디에이션 pod, maven repo, SDK/Kotlin 버전 등
// 나머지는 app.json 의 expo-build-properties 에서 처리한다.

const {
  withDangerousMod,
  withXcodeProject,
  withAppBuildGradle,
  withGradleProperties,
  withAndroidManifest,
  withInfoPlist,
  withMainActivity,
  withAppDelegate,
  AndroidConfig,
  IOSConfig,
} = require('expo/config-plugins');

// AndroidManifest <application> 에 넣을 meta-data
// (manifest는 prebuild 생성물이라 손으로 넣으면 매 빌드 때 지워짐 → plugin으로 주입)
const ANDROID_PUBLISHER_UID = 'Publisher Uid 를 발급받으세요';
const ANDROID_ADMOB_APP_ID = 'Google AdMob 에서 발급한 키값';

// iOS Info.plist GADApplicationIdentifier (plist도 prebuild 생성물이라 동일하게 plugin으로 주입)
const IOS_ADMOB_APP_ID = 'Google AdMob 에서 발급한 키값';
const fs = require('fs');
const path = require('path');

const ADWHALE_SOURCE = 'https://github.com/dev-adwhale/AdWhaleSDK_iOS.git';
const CDN_SOURCE = 'https://cdn.cocoapods.org/';

// [테스트용] AdMob 미디에이션 어댑터 의존성 — 실제 배포 시엔 앱 개발자가 가이드대로 추가
const ANDROID_ADAPTER_DEPS = `
    // === [AdWhale 테스트용] 미디에이션 어댑터 (배포 시엔 가이드 보고 앱에서 직접 추가) ===
    implementation "net.adwhale.sdk.cauly.adapter:cauly-sdk:3.5.46.0"
    implementation "net.adwhale.sdk.admize.adapter:admize-sdk:1.0.8.4"
    implementation "net.adwhale.sdk.adfit.adapter:adfit-sdk:3.21.17.3"
    implementation "net.adwhale.sdk.admob.adapter:admob-sdk:24.3.0.6"
    implementation "net.adwhale.sdk.levelplay.adapter:levelplay-sdk:8.12.0.3"
    implementation 'com.google.ads.mediation:applovin:13.3.1.1' // Admob-AppLovin
    implementation 'com.google.ads.mediation:fyber:8.3.7.0' // Admob-DT Exchange
    implementation 'com.google.ads.mediation:inmobi:10.8.3.1' // Admob-InMobi
    implementation 'com.google.ads.mediation:vungle:7.5.0.0' // Admob-Liftoff Monetize
    implementation 'com.google.ads.mediation:mintegral:16.9.71.0' // Admob-Mintegral
    implementation 'com.google.ads.mediation:pangle:7.2.0.4.0' // Admob-Pangle
    implementation 'com.unity3d.ads:unity-ads:4.15.0' // Admob-Unity Ads
    implementation 'com.google.ads.mediation:unity:4.15.0.0' // Admob-Unity Ads
    implementation 'com.google.ads.mediation:moloco:3.10.0.0' // Admob-Moloco
    implementation 'com.google.ads.mediation:ironsource:8.9.0.0' // Admob-Ironsource
    // 커스텀 네이티브 광고 레이아웃(custom_native_ad_main_layout.xml)이 ConstraintLayout 사용
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    // === [AdWhale 테스트용] 끝 ===
`;

// 커스텀 네이티브 광고(factoryId: app_custom) 레이아웃. android/ 는 prebuild 생성물이라
// res/layout 파일과 MainActivity 등록 코드가 매 빌드 때 지워짐 → plugin 으로 복원.
const CUSTOM_NATIVE_LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:padding="16dp"
    android:background="@android:color/white"
    android:elevation="4dp">

    <!-- 앱 아이콘 -->
    <ImageView
        android:id="@+id/main_view_icon"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:layout_marginEnd="12dp"
        android:scaleType="centerCrop"
        app:layout_constraintBottom_toBottomOf="@id/main_view_title"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="@id/main_view_title" />

    <!-- 제목 -->
    <TextView
        android:id="@+id/main_view_title"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:textSize="16sp"
        android:textStyle="bold"
        android:textColor="@android:color/black"
        android:ellipsize="end"
        android:maxLines="2"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toEndOf="@id/main_view_icon"
        app:layout_constraintTop_toTopOf="parent"
        tools:text="광고 제목입니다" />

    <!-- 설명 -->
    <TextView
        android:id="@+id/main_view_body"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:textSize="14sp"
        android:textColor="@android:color/darker_gray"
        android:ellipsize="end"
        android:lines="2"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="@id/main_view_title"
        app:layout_constraintTop_toBottomOf="@id/main_view_title"
        tools:text="광고 설명입니다. 이 앱을 다운로드하세요!" />

    <!-- CTA 버튼 -->
    <Button
        android:id="@+id/main_button_cta"
        android:layout_width="wrap_content"
        android:layout_height="36dp"
        android:layout_marginTop="8dp"
        android:textSize="12sp"
        android:backgroundTint="#009688"
        android:textColor="@android:color/white"
        android:text="설치하기"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintTop_toBottomOf="@id/main_view_body" />

    <!-- 미디어 뷰 -->
    <FrameLayout
        android:id="@+id/main_view_media"
        android:layout_width="match_parent"
        android:layout_height="300dp"
        android:layout_marginTop="12dp"
        app:layout_constraintTop_toBottomOf="@id/main_button_cta" />

</androidx.constraintlayout.widget.ConstraintLayout>
`;

// MainActivity.onCreate 에 주입할 BinderFactory 등록 코드 (example 과 동일: AdWhaleCustomNativeBinderFactory)
const CUSTOM_NATIVE_REGISTER_KT = `
    // Register BinderFactory for custom binding native ad (factoryId: app_custom)
    AdwhaleSdkReactNativePackage.registerBinderFactory(
      "app_custom",
      AdWhaleCustomNativeBinderFactory(
        R.layout.custom_native_ad_main_layout, // 레이아웃 리소스 ID
        R.id.main_view_icon,                   // 아이콘 View ID
        R.id.main_view_title,                  // 제목 View ID
        R.id.main_view_body,                   // 본문 View ID
        R.id.main_button_cta,                  // CTA 버튼 View ID
        R.id.main_view_media                   // 미디어 View ID
      )
    )`;

/** (Android) 앱 build.gradle 의 dependencies 블록에 어댑터 의존성을 (중복 없이) 주입 */
const withAndroidAdapters = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('net.adwhale.sdk.cauly.adapter')) {
      contents = contents.replace(
        /dependencies\s*\{/,
        (match) => `${match}\n${ANDROID_ADAPTER_DEPS}`
      );
      cfg.modResults.contents = contents;
    }
    return cfg;
  });

/** Podfile 최상단에 CocoaPods spec source 2줄을 (중복 없이) 주입 */
const withAdwhalePodSources = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile'
      );
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes(ADWHALE_SOURCE)) {
        const sourceBlock =
          `source '${CDN_SOURCE}'\n` + `source '${ADWHALE_SOURCE}'\n\n`;
        contents = sourceBlock + contents;
        fs.writeFileSync(podfilePath, contents, 'utf8');
      }
      return cfg;
    },
  ]);

/** 앱 타겟 OTHER_LDFLAGS 에 -ObjC 추가 */
const withObjCLinkerFlag = (config) =>
  withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(buildConfigs)) {
      const entry = buildConfigs[key];
      // 주석(_comment) 항목 및 빌드설정 없는 항목은 스킵
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      const bs = entry.buildSettings;
      // 앱 타겟만 대상 (Pods/프레임워크 타겟에는 INFOPLIST_FILE 이 없음)
      if (!bs.INFOPLIST_FILE) continue;

      let flags = bs.OTHER_LDFLAGS || ['"$(inherited)"'];
      if (typeof flags === 'string') flags = [flags];
      if (!flags.some((f) => String(f).includes('-ObjC'))) {
        flags.push('"-ObjC"');
      }
      bs.OTHER_LDFLAGS = flags;
    }
    return cfg;
  });

// (Android) R8(minify)이 광고 어댑터 다수로 힙 부족(OOM)이 나므로 Gradle JVM 힙 상향
const withGradleHeap = (config) =>
  withGradleProperties(config, (cfg) => {
    const KEY = 'org.gradle.jvmargs';
    const VALUE =
      '-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8';
    const existing = cfg.modResults.find(
      (i) => i.type === 'property' && i.key === KEY
    );
    if (existing) {
      existing.value = VALUE;
    } else {
      cfg.modResults.push({ type: 'property', key: KEY, value: VALUE });
    }
    return cfg;
  });

// (Android) AndroidManifest <application> 에 PUBLISHER_UID / AdMob APPLICATION_ID 주입
const withAdwhaleManifestMeta = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      'net.adwhale.sdk.mediation.PUBLISHER_UID',
      ANDROID_PUBLISHER_UID
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      'com.google.android.gms.ads.APPLICATION_ID',
      ANDROID_ADMOB_APP_ID
    );
    return cfg;
  });

// (iOS) AppDelegate didFinishLaunching 에 주입할 커스텀 네이티브 팩토리 등록 코드.
// iOS 는 Android 와 달리 "커스텀 네이티브만" 지원(템플릿 네이티브 없음).
const IOS_CUSTOM_NATIVE_REGISTER_SWIFT = `
    // Register custom native ad view factory (factoryId: app_custom)
    AdWhaleNativeCustomViewFactoryRegistry.registerNativeAdViewFactory(
      "app_custom",
      factory: AdWhaleBlockNativeAdViewFactory { frame in
        ExampleCustomNativeAdView(frame: frame)
      }
    )
`;

// 커스텀 네이티브 뷰 구현 — 독립 Swift 파일로 생성하고 Xcode 프로젝트 소스에 등록한다.
const IOS_CUSTOM_NATIVE_VIEW_FILENAME = 'ExampleCustomNativeAdView.swift';
const IOS_CUSTOM_NATIVE_VIEW_FILE = `import AdWhaleSDK
import UIKit

/// RN 예제: iOS 커스텀 네이티브 바인딩은 앱이 \`AdWhaleNativeAdView\`를 상속해 뷰를 구현해야 합니다.
final class ExampleCustomNativeAdView: AdWhaleNativeAdView {
  private let titleLbl = UILabel()
  private let bodyLbl = UILabel()
  private let ctaBtn = UIButton(type: .system)
  private let profileNameLbl = UILabel()
  private let profileIcon = UIImageView()
  private let whaleMediaView = AdWhaleMediaView()

  override init(frame: CGRect) {
    super.init(frame: frame)
    buildLayout()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    buildLayout()
  }

  private func buildLayout() {
    backgroundColor = .secondarySystemBackground
    titleLbl.font = .boldSystemFont(ofSize: 16)
    titleLbl.numberOfLines = 2
    bodyLbl.font = .systemFont(ofSize: 14)
    bodyLbl.numberOfLines = 3
    bodyLbl.textColor = .secondaryLabel
    profileNameLbl.font = .systemFont(ofSize: 12)
    profileIcon.contentMode = .scaleAspectFill
    profileIcon.clipsToBounds = true
    profileIcon.layer.cornerRadius = 20
    ctaBtn.titleLabel?.font = .boldSystemFont(ofSize: 14)
    whaleMediaView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      whaleMediaView.heightAnchor.constraint(equalToConstant: 180),
    ])

    let profileRow = UIStackView(arrangedSubviews: [profileIcon, profileNameLbl])
    profileRow.axis = .horizontal
    profileRow.spacing = 8
    profileRow.alignment = .center
    profileIcon.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      profileIcon.widthAnchor.constraint(equalToConstant: 40),
      profileIcon.heightAnchor.constraint(equalToConstant: 40),
    ])

    let stack = UIStackView(arrangedSubviews: [
      titleLbl,
      bodyLbl,
      whaleMediaView,
      profileRow,
      ctaBtn,
    ])
    stack.axis = .vertical
    stack.spacing = 8
    stack.translatesAutoresizingMaskIntoConstraints = false
    addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
      stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
      stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),
    ])
  }

  override func adTitleLabel() -> UILabel { titleLbl }
  override func adBodyLabel() -> UILabel { bodyLbl }
  override func adCallToActionButton() -> UIButton { ctaBtn }
  override func adProfileNameLabel() -> UILabel { profileNameLbl }
  override func adProfileIconView() -> UIImageView { profileIcon }
  override func adMediaView() -> AdWhaleMediaView { whaleMediaView }
}
`;

// (iOS) AppDelegate 에 커스텀 네이티브 등록 + import + 뷰 클래스 주입
const withCustomNativeAppDelegate = (config) =>
  withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('AdWhaleNativeCustomViewFactoryRegistry')) {
      // import 추가 (import Expo 뒤)
      // 등록 API(AdWhaleNativeCustomViewFactoryRegistry / AdWhaleBlockNativeAdViewFactory)는
      // AdWhaleSDK 가 아니라 RN 래퍼 모듈 'AdwhaleSdkReactNative' 에 있다.
      src = src.replace(
        /^(import Expo\r?\n)/m,
        `$1import AdwhaleSdkReactNative\n`
      );
      // didFinishLaunching 의 return super 직전에 등록 코드 삽입
      // ExampleCustomNativeAdView 는 같은 타깃(모듈)의 별도 파일에 있으므로 import 불필요
      src = src.replace(
        /(\n\s*return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\))/,
        `\n${IOS_CUSTOM_NATIVE_REGISTER_SWIFT}$1`
      );
      cfg.modResults.contents = src;
    }
    return cfg;
  });

// (iOS) ExampleCustomNativeAdView.swift 파일 생성 + Xcode 프로젝트 소스에 등록
const withCustomNativeViewFile = (config) => {
  // 1) 파일 작성
  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        cfg.modRequest.projectName
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, IOS_CUSTOM_NATIVE_VIEW_FILENAME),
        IOS_CUSTOM_NATIVE_VIEW_FILE,
        'utf8'
      );
      return cfg;
    },
  ]);
  // 2) Xcode 프로젝트 빌드 소스에 등록
  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const filepath = `${projectName}/${IOS_CUSTOM_NATIVE_VIEW_FILENAME}`;
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project,
      });
    }
    return cfg;
  });
  return config;
};

// (iOS) Info.plist 에 GADApplicationIdentifier 주입
const withAdwhaleInfoPlist = (config) =>
  withInfoPlist(config, (cfg) => {
    cfg.modResults.GADApplicationIdentifier = IOS_ADMOB_APP_ID;
    return cfg;
  });

// (Android) MainActivity 에 커스텀 네이티브 BinderFactory 등록 + import 주입
const withCustomNativeMainActivity = (config) =>
  withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('AdWhaleCustomNativeBinderFactory')) {
      // import 추가 (package 라인 바로 뒤)
      src = src.replace(
        /^(package .+\r?\n)/m,
        `$1import com.adwhalesdkreactnative.AdwhaleSdkReactNativePackage\nimport com.adwhalesdkreactnative.AdWhaleCustomNativeBinderFactory\n`
      );
      // super.onCreate(...) 직후에 등록 코드 삽입
      src = src.replace(
        /(super\.onCreate\([^)]*\)\s*\n)/,
        `$1${CUSTOM_NATIVE_REGISTER_KT}\n`
      );
      cfg.modResults.contents = src;
    }
    return cfg;
  });

// (Android) res/layout/custom_native_ad_main_layout.xml 생성
const withCustomNativeLayout = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const layoutDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/layout'
      );
      fs.mkdirSync(layoutDir, { recursive: true });
      fs.writeFileSync(
        path.join(layoutDir, 'custom_native_ad_main_layout.xml'),
        CUSTOM_NATIVE_LAYOUT_XML,
        'utf8'
      );
      return cfg;
    },
  ]);

module.exports = (config) =>
  withCustomNativeViewFile(
    withCustomNativeAppDelegate(
      withCustomNativeLayout(
        withCustomNativeMainActivity(
          withAdwhaleInfoPlist(
            withAdwhaleManifestMeta(
              withGradleHeap(
                withAndroidAdapters(
                  withObjCLinkerFlag(withAdwhalePodSources(config))
                )
              )
            )
          )
        )
      )
    )
  );
