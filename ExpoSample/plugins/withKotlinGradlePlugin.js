// plugins/withKotlinGradlePlugin.js
//
// android/build.gradle 의 kotlin-gradle-plugin classpath 에 버전을 지정한다.
// AdMob 어댑터 25.4.0.0(Google Mobile Ads SDK 25.4.0)은 Kotlin Gradle 플러그인 2.2.0 이상이 필요하다.
// expo-build-properties 의 kotlinVersion 만으로는 classpath 버전이 바뀌지 않아 이 plugin 으로 지정한다.
const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withKotlinGradlePlugin(config, { version = '2.2.0' } = {}) {
  return withProjectBuildGradle(config, (cfg) => {
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::[^'"]*)?['"]\)/,
      `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${version}')`
    );
    return cfg;
  });
};
