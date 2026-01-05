// example/src/AdWhaleNativeSampleScreen.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
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
  AdWhaleMediationSdk,
  AdWhaleNativeTemplateView,
  AdWhaleNativeTemplateHandle,
  AdWhaleNativeTemplateStyle,
  AdWhaleNativeTemplateType,
  AdWhaleNativeCustomView,
  AdWhaleNativeCustomHandle,
  AdWhaleNativeTemplateError,
  AdWhaleNativeCustomError,
} from 'adwhale-sdk-react-native';

interface Props {
  onBack?: () => void;
}

type AdType = 'TEMPLATE_SMALL' | 'TEMPLATE_MEDIUM' | 'CUSTOM';

interface TemplateStyleOption {
  key: string;
  name: string;
  style: AdWhaleNativeTemplateStyle | null;
}

const TEMPLATE_STYLES: TemplateStyleOption[] = [
  {key: 'DEFAULT', name: 'Default', style: null},
  {
    key: 'DARK',
    name: 'Dark Theme',
    style: {
      mainBackgroundColor: '#2C2C2C',
      primaryTextTypefaceColor: 'white',
      secondaryTextTypefaceColor: '#CCCCCC',
      tertiaryTextTypefaceColor: '#AAAAAA',
      callToActionTypefaceColor: 'white',
      callToActionBackgroundColor: '#4CAF50',
    },
  },
  {
    key: 'BRAND',
    name: 'Brand Theme',
    style: {
      mainBackgroundColor: '#E3F2FD',
      primaryTextTypefaceColor: '#1976D2',
      secondaryTextTypefaceColor: '#1565C0',
      tertiaryTextTypefaceColor: '#424242',
      callToActionTypefaceColor: 'white',
      callToActionBackgroundColor: '#FF5722',
      primaryTextSize: 18.0,
      callToActionTextSize: 16.0,
    },
  },
  {
    key: 'MINIMAL',
    name: 'Minimal',
    style: {
      mainBackgroundColor: 'white',
      primaryTextTypefaceColor: '#333333',
      secondaryTextTypefaceColor: '#666666',
      tertiaryTextTypefaceColor: '#999999',
      callToActionTypefaceColor: '#2196F3',
      callToActionBackgroundColor: 'transparent',
    },
  },
  {
    key: 'FULL',
    name: 'Full Style',
    style: {
      mainBackgroundColor: '#F5F5F5',
      primaryTextTypefaceColor: '#1A1A1A',
      primaryTextSize: 20.0,
      primaryTextBackgroundColor: '#E8F5E8',
      secondaryTextTypefaceColor: '#2E7D32',
      secondaryTextSize: 16.0,
      secondaryTextBackgroundColor: '#F1F8E9',
      tertiaryTextTypefaceColor: '#424242',
      tertiaryTextSize: 14.0,
      tertiaryTextBackgroundColor: '#FAFAFA',
      callToActionTypefaceColor: 'white',
      callToActionTextSize: 18.0,
      callToActionBackgroundColor: '#FF6B35',
    },
  },
];

interface NativeState {
  loggerEnabled: boolean;
  coppaEnabled: boolean;
  placementUid: string;
  placementName: string;
  region: string;
  gcoder: { lt: number; lng: number } | undefined;
  selectedAdType: AdType;
  selectedStyleKey: string;
  debugInfo: string;
  isAdLoaded: boolean;
  adViewKey: number;
}

const AdWhaleNativeSampleScreen: React.FC<Props> = ({onBack}) => {
  const [state, setState] = useState<NativeState>({
    loggerEnabled: false,
    coppaEnabled: false,
    placementUid: 'PlacementUid를 입력 하세요.',
    placementName: '',
    region: '',
    gcoder: undefined,
    selectedAdType: 'TEMPLATE_SMALL',
    selectedStyleKey: 'DEFAULT',
    debugInfo: 'Please select an ad type and load an ad.',
    isAdLoaded: false,
    adViewKey: 1,
  });

  const templateRef = useRef<AdWhaleNativeTemplateHandle | null>(null);
  const customRef = useRef<AdWhaleNativeCustomHandle | null>(null);

  useEffect(() => {
    AdWhaleMediationSdk.initialize()
      .then(code => {
        if (code === 100) {
          setState(prev => ({...prev, debugInfo: 'SDK 초기화 성공\n'}));
        } else {
          setState(prev => ({...prev, debugInfo: 'SDK 초기화 실패\n'}));
        }
      })
      .catch(err => {
          setState(prev => ({...prev, debugInfo: `SDK 초기화 에러: ${String(err)}\n`}));
      });
  }, []);

  useEffect(() => {
    if (!onBack) {
      return;
    }

    const handler = () => {
      onBack();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );

    return () => {
      subscription.remove();
    };
  }, [onBack]);

  const handleSetCoppa = (v: boolean) => {
    setState(prev => ({...prev, coppaEnabled: v}));
    AdWhaleMediationSdk.setCoppa(v);
  };

  const handleRequestGdpr = async () => {
    console.log('[AdWhaleNative] handleRequestGdpr called');
    try {
      setState(prev => ({...prev, debugInfo: 'GDPR Request 시작...\n'}));
      const result = await AdWhaleMediationSdk.requestGdprConsent();
      console.log('[AdWhaleNative] GDPR Request result:', result);
      const msg = `GDPR Consent: ${
        result.isSuccess ? 'Success' : 'Failed'
      }, ${result.message}`;
      setState(prev => ({...prev, debugInfo: msg}));
    } catch (e: any) {
      console.error('[AdWhaleNative] GDPR Consent Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `GDPR Consent Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleCheckStatus = async () => {
    console.log('[AdWhaleNative] handleCheckStatus called');
    try {
      setState(prev => ({...prev, debugInfo: 'Status 확인 중...\n'}));
      const status = await AdWhaleMediationSdk.getConsentStatus();
      console.log('[AdWhaleNative] Status result:', status);
      const msg =
        `COPPA Applied: ${status.coppa}\n` +
        `UMP Status: ${status.gdpr}\n` +
        `Personalized Consent: ${status.personalizedConsent}`;
      setState(prev => ({...prev, debugInfo: msg}));
    } catch (e: any) {
      console.error('[AdWhaleNative] Get Status Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `Get Status Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleResetGdpr = () => {
    console.log('[AdWhaleNative] handleResetGdpr called');
    try {
      AdWhaleMediationSdk.resetGdprConsentStatus();
      setState(prev => ({
        ...prev,
        debugInfo: 'GDPR consent status has been reset.',
      }));
    } catch (e: any) {
      console.error('[AdWhaleNative] Reset Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `Reset Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleSetGdpr = (consent: boolean) => {
    console.log('[AdWhaleNative] handleSetGdpr called:', consent);
    try {
      AdWhaleMediationSdk.setGdpr(consent);
      setState(prev => ({
        ...prev,
        debugInfo: `Personalized Consent set to: ${consent}`,
      }));
    } catch (e: any) {
      console.error('[AdWhaleNative] SetGdpr Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `SetGdpr Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleInitializeView = () => {
    setState(prev => ({
      ...prev,
      adViewKey: prev.adViewKey + 1,
      isAdLoaded: false,
      debugInfo: '뷰 초기화 완료. 새로운 광고를 로드해주세요.\n',
    }));
  };

  const handleAdTypeChange = (type: AdType) => {
    setState(prev => ({
      ...prev,
      selectedAdType: type,
      isAdLoaded: false,
      adViewKey: prev.adViewKey + 1,
      debugInfo: '광고 타입 변경. 새로운 광고를 로드해주세요.\n',
    }));
  };

  const handleStyleChange = (key: string) => {
    setState(prev => ({
      ...prev,
      selectedStyleKey: key,
      isAdLoaded: false,
      adViewKey: prev.adViewKey + 1,
      debugInfo: '스타일 변경. 새로운 광고를 로드해주세요.\n',
    }));
  };

  const handleAdLoad = () => {
    const {selectedAdType, placementUid} = state;
    if (!placementUid) return;
    setState(prev => ({
      ...prev,
      isAdLoaded: false,
      debugInfo: `네이티브 광고 로드 중...\nPlacement: ${placementUid}\nType: ${selectedAdType}\n`,
    }));

    if (selectedAdType === 'CUSTOM') {
      customRef.current?.loadAd();
    } else {
      templateRef.current?.loadAd();
    }
  };

  const handleAdShow = () => {
    const {selectedAdType, isAdLoaded} = state;
    if (!isAdLoaded) {
      setState(prev => ({
        ...prev,
        debugInfo: '광고가 로드되지 않았습니다. 먼저 광고를 로드해주세요.\n',
      }));
      return;
    }
    setState(prev => ({...prev, debugInfo: '네이티브 광고 표시 중...\n'}));

    if (selectedAdType === 'CUSTOM') {
      customRef.current?.showAd();
    } else {
      templateRef.current?.showAd();
    }
  };

  const handleAdLoaded = () => {
    setState(prev => ({
      ...prev,
      isAdLoaded: true,
      debugInfo: '네이티브 광고 로드 성공. 표시 가능.\n',
    }));
  };

  const handleAdFailedToLoadTemplate = (e: AdWhaleNativeTemplateError) => {
    setState(prev => ({
      ...prev,
      isAdLoaded: false,
      debugInfo: `광고 로드 실패.\n- Code: ${e.errorCode}\n- Message: ${e.errorMessage}\n`,
    }));
  };

  const handleAdFailedToLoadCustom = (e: AdWhaleNativeCustomError) => {
    setState(prev => ({
      ...prev,
      isAdLoaded: false,
      debugInfo: `광고 로드 실패.\n- Code: ${e.errorCode}\n- Message: ${e.errorMessage}\n`,
    }));
  };

  const handleAdShowFailed = (e: AdWhaleNativeTemplateError) => {
    setState(prev => ({
      ...prev,
      isAdLoaded: false,
      debugInfo: `광고 표시 실패.\n- Code: ${e.errorCode}\n- Message: ${e.errorMessage}\n`,
    }));
  };

  const renderRadio = (
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
      <View
        style={[
          styles.radioCircle,
          selected && styles.radioCircleSelected,
        ]}>
        {selected && <View style={styles.radioCircleInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStyleRadio = (opt: TemplateStyleOption, selectedKey: string) =>
    renderRadio(
      opt.name,
      selectedKey === opt.key,
      () => handleStyleChange(opt.key),
    );

  const renderAdView = () => {
    const {
      selectedAdType,
      placementUid,
      placementName,
      region,
      gcoder,
      adViewKey,
      selectedStyleKey,
    } = state;

    if (selectedAdType === 'CUSTOM') {
      return (
        <AdWhaleNativeCustomView
          key={`custom-${adViewKey}`}
          ref={customRef}
          style={[styles.adContainer, {height: 350}]}
          placementUid={placementUid}
          placementName={placementName || undefined}
          region={region || undefined}
          gcoder={gcoder}
          layoutName="custom_native_ad_layout"
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoadCustom}
        />
      );
    } else {
      const template: AdWhaleNativeTemplateType =
        selectedAdType === 'TEMPLATE_SMALL' ? 'SMALL' : 'MEDIUM';
      const height = template === 'SMALL' ? 120 : 400;
      const selectedStyle = TEMPLATE_STYLES.find(
        s => s.key === selectedStyleKey,
      );
      return (
        <AdWhaleNativeTemplateView
          key={`template-${adViewKey}`}
          ref={templateRef}
          style={[styles.adContainer, {height}]}
          placementUid={placementUid}
          placementName={placementName || undefined}
          region={region || undefined}
          gcoder={gcoder}
          template={template}
          templateStyle={selectedStyle?.style || undefined}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoadTemplate}
          onAdShowFailed={handleAdShowFailed}
        />
      );
    }
  };

  const {
    loggerEnabled,
    coppaEnabled,
    placementUid,
    placementName,
    region,
    gcoder,
    selectedAdType,
    selectedStyleKey,
    debugInfo,
    isAdLoaded,
  } = state;

  return (
    <SafeAreaView style={styles.safeArea}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 메인 메뉴로</Text>
        </TouchableOpacity>
      )}
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>네이티브 광고 (TypeScript)</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Logger/COPPA 설정:</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Logger</Text>
              <Switch
                value={loggerEnabled}
                onValueChange={v => {
                  setState(prev => ({...prev, loggerEnabled: v}));
                  AdWhaleMediationSdk.setLoggerEnabled(v);
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>COPPA</Text>
              <Switch
                value={coppaEnabled}
                onValueChange={handleSetCoppa}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1.1 GDPR 설정:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.button} onPress={handleRequestGdpr}>
                <Text style={styles.buttonText}>Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleCheckStatus}>
                <Text style={styles.buttonText}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleResetGdpr}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.button} onPress={() => handleSetGdpr(true)}>
                <Text style={styles.buttonText}>Set True</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleSetGdpr(false)}>
                <Text style={styles.buttonText}>Set False</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 광고 타입 선택:</Text>
            {renderRadio(
              'Small (Template)',
              selectedAdType === 'TEMPLATE_SMALL',
              () => handleAdTypeChange('TEMPLATE_SMALL'),
            )}
            {renderRadio(
              'Medium (Template)',
              selectedAdType === 'TEMPLATE_MEDIUM',
              () => handleAdTypeChange('TEMPLATE_MEDIUM'),
            )}
            {renderRadio(
              'Custom Layout',
              selectedAdType === 'CUSTOM',
              () => handleAdTypeChange('CUSTOM'),
            )}
          </View>

          {selectedAdType !== 'CUSTOM' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2.1 템플릿 스타일 선택:</Text>
              {TEMPLATE_STYLES.map(s =>
                renderStyleRadio(s, selectedStyleKey),
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. placement uid 입력:</Text>
            <TextInput
              style={styles.input}
              value={placementUid}
              onChangeText={text =>
                setState(prev => ({...prev, placementUid: text}))
              }
              placeholder="Placement UID"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3.1 추가 옵션 (선택사항):</Text>
            <TextInput
              style={styles.input}
              value={placementName}
              onChangeText={text =>
                setState(prev => ({...prev, placementName: text}))
              }
              placeholder="placement name (optional)"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={region}
              onChangeText={text =>
                setState(prev => ({...prev, region: text}))
              }
              placeholder="region (optional, e.g., KR)"
            />
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lt?.toString() || ''}
                onChangeText={text => {
                  const lt = parseFloat(text);
                  setState(prev => ({
                    ...prev,
                    gcoder:
                      text && !isNaN(lt)
                        ? { ...prev.gcoder, lt } || { lt, lng: prev.gcoder?.lng || 0 }
                        : undefined,
                  }));
                }}
                placeholder="latitude (optional)"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lng?.toString() || ''}
                onChangeText={text => {
                  const lng = parseFloat(text);
                  setState(prev => ({
                    ...prev,
                    gcoder:
                      text && !isNaN(lng)
                        ? { ...prev.gcoder, lng } || { lt: prev.gcoder?.lt || 0, lng }
                        : undefined,
                  }));
                }}
                placeholder="longitude (optional)"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={handleAdLoad}>
              <Text style={styles.buttonText}>광고 로드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !isAdLoaded && styles.buttonDisabled]}
              onPress={handleAdShow}
              disabled={!isAdLoaded}>
              <Text style={styles.buttonText}>광고 표시</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleInitializeView}>
              <Text style={styles.buttonText}>뷰 초기화</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.debugInfo}
              value={debugInfo}
              multiline
              editable={false}
            />
          </View>

          {renderAdView()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'white'},
  backButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButtonText: {fontSize: 16, color: '#007AFF', fontWeight: '600'},
  container: {flex: 1},
  scrollView: {flex: 1, padding: 16},
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {marginBottom: 20},
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderRadius: 4,
  },
  switchLabel: {fontSize: 14, color: '#333'},
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {borderColor: '#007AFF'},
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {fontSize: 14, color: '#333'},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 13,
    backgroundColor: 'white',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {color: 'white', fontSize: 14, fontWeight: '600'},
  debugInfo: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 13,
    minHeight: 150,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  adContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
  },
});

export default AdWhaleNativeSampleScreen;
