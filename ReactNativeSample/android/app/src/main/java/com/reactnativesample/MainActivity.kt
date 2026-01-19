package com.reactnativesample

import android.os.Bundle
import com.adwhalesdkreactnative.AdwhaleSdkReactNativePackage
import com.adwhalesdkreactnative.SimpleBinderFactory
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "ReactNativeSample"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register BinderFactory for custom binding native ad (factoryId: app_custom)
        AdwhaleSdkReactNativePackage.registerBinderFactory(
            "app_custom",
            SimpleBinderFactory(
                R.layout.custom_native_ad_main_layout,  // 레이아웃 리소스 ID
                R.id.main_view_icon,                     // 아이콘 View ID
                R.id.main_view_title,                     // 제목 View ID
                R.id.main_view_body,                      // 본문 View ID
                R.id.main_button_cta,                     // CTA 버튼 View ID
                R.id.main_view_media                      // 미디어 View ID
            )
        )
    }
}
