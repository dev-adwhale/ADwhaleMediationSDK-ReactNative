// example/src/AdWhaleInterstitialSampleScreen.tsx
import React, {useEffect, useState} from 'react';
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
import {AdWhaleMediationSdk} from 'adwhale-sdk-react-native';
import {
  AdWhaleInterstitialAd,
  AdWhaleInterstitialErrorEvent,
} from 'adwhale-sdk-react-native';

interface Props {
  onBack?: () => void;
}

interface InterstitialState {
  loggerEnabled: boolean;
  coppaEnabled: boolean;
  placementUid: string;
  placementName: string;
  region: string;
  gcoder: { lt: number; lng: number } | undefined;
  debugInfo: string;
  isInterstitialAdLoaded: boolean;
}

const AdWhaleInterstitialSampleScreen: React.FC<Props> = ({onBack}) => {
  const [state, setState] = useState<InterstitialState>({
    loggerEnabled: false,
    coppaEnabled: false,
    placementUid: 'PlacementUid를 입력 하세요.',
    placementName: '',
    region: '',
    gcoder: undefined,
    debugInfo: 'Please touch [광고 로드] button.',
    isInterstitialAdLoaded: false,
  });

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
        setState(prev => ({
          ...prev,
          debugInfo: `SDK 초기화 에러: ${String(err)}\n`,
        }));
      });
  }, []);

  useEffect(() => {
    const subs = AdWhaleInterstitialAd.addEventListeners({
      onLoaded: () => {
        setState(prev => ({
          ...prev,
          isInterstitialAdLoaded: true,
          debugInfo: '전면 광고 로드 성공!\n',
        }));
      },
      onLoadFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setState(prev => ({
          ...prev,
          isInterstitialAdLoaded: false,
          debugInfo: `전면 광고 로드 실패: ${e.statusCode} - ${e.message}\n`,
        }));
      },
      onShowed: () => {
        setState(prev => ({
          ...prev,
          debugInfo: '전면 광고 표시됨\n',
        }));
      },
      onShowFailed: (e: AdWhaleInterstitialErrorEvent) => {
        setState(prev => ({
          ...prev,
          isInterstitialAdLoaded: false,
          debugInfo: `전면 광고 표시 실패: ${e.statusCode} - ${e.message}\n`,
        }));
      },
      onClosed: () => {
        setState(prev => ({
          ...prev,
          isInterstitialAdLoaded: false,
          debugInfo: '전면 광고 닫힘\n',
        }));
      },
      onClicked: () => {
        setState(prev => ({
          ...prev,
          debugInfo: '전면 광고 클릭됨\n',
        }));
      },
    });

    return () => {
      subs.forEach(s => s.remove());
    };
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

  const handleSetCoppa = (value: boolean) => {
    setState(prev => ({...prev, coppaEnabled: value}));
    AdWhaleMediationSdk.setCoppa(value);
  };

  const handleRequestGdpr = async () => {
    console.log('[AdWhaleInterstitial] handleRequestGdpr called');
    try {
      setState(prev => ({...prev, debugInfo: 'GDPR Request 시작...\n'}));
      const result = await AdWhaleMediationSdk.requestGdprConsent();
      console.log('[AdWhaleInterstitial] GDPR Request result:', result);
      const msg = `GDPR Consent: ${
        result.isSuccess ? 'Success' : 'Failed'
      }, ${result.message}`;
      setState(prev => ({...prev, debugInfo: msg}));
    } catch (e: any) {
      console.error('[AdWhaleInterstitial] GDPR Consent Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `GDPR Consent Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleCheckStatus = async () => {
    console.log('[AdWhaleInterstitial] handleCheckStatus called');
    try {
      setState(prev => ({...prev, debugInfo: 'Status 확인 중...\n'}));
      const status = await AdWhaleMediationSdk.getConsentStatus();
      console.log('[AdWhaleInterstitial] Status result:', status);
      const msg =
        `COPPA Applied: ${status.coppa}\n` +
        `UMP Status: ${status.gdpr}\n` +
        `Personalized Consent: ${status.personalizedConsent}`;
      setState(prev => ({...prev, debugInfo: msg}));
    } catch (e: any) {
      console.error('[AdWhaleInterstitial] Get Status Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `Get Status Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleResetGdpr = () => {
    console.log('[AdWhaleInterstitial] handleResetGdpr called');
    try {
      AdWhaleMediationSdk.resetGdprConsentStatus();
      setState(prev => ({
        ...prev,
        debugInfo: 'GDPR consent status has been reset.',
      }));
    } catch (e: any) {
      console.error('[AdWhaleInterstitial] Reset Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `Reset Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleSetGdpr = (consent: boolean) => {
    console.log('[AdWhaleInterstitial] handleSetGdpr called:', consent);
    try {
      AdWhaleMediationSdk.setGdpr(consent);
      setState(prev => ({
        ...prev,
        debugInfo: `Personalized Consent set to: ${consent}`,
      }));
    } catch (e: any) {
      console.error('[AdWhaleInterstitial] SetGdpr Error:', e);
      setState(prev => ({
        ...prev,
        debugInfo: `SetGdpr Error: ${e?.message ?? String(e)}`,
      }));
    }
  };

  const handleAdLoad = () => {
    const {placementUid, placementName, region, gcoder} = state;
    if (!placementUid) return;
    setState(prev => ({
      ...prev,
      debugInfo: `광고 로드 시작...\nPlacement UID: ${placementUid}\nplacementName: ${placementName || 'N/A'}\nregion: ${region || 'N/A'}\n`,
    }));
    AdWhaleInterstitialAd.loadAd(placementUid, {
      placementName: placementName || undefined,
      region: region || undefined,
      gcoder: gcoder,
    });
  };

  const handleAdShow = () => {
    if (!state.isInterstitialAdLoaded) return;
    AdWhaleInterstitialAd.showAd();
  };

  const handleClearView = () => {
    setState(prev => ({
      ...prev,
      isInterstitialAdLoaded: false,
      debugInfo: 'Please touch [광고 로드] button.',
    }));
  };

  const {
    loggerEnabled,
    coppaEnabled,
    placementUid,
    placementName,
    region,
    gcoder,
    debugInfo,
    isInterstitialAdLoaded,
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
          <Text style={styles.title}>전면 광고 (TypeScript)</Text>

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
            <Text style={styles.sectionTitle}>2. placement uid 입력:</Text>
            <TextInput
              style={styles.input}
              value={placementUid}
              onChangeText={text => setState(prev => ({...prev, placementUid: text}))}
              placeholder="placement uid"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2.1 추가 옵션 (선택사항):</Text>
            <TextInput
              style={styles.input}
              value={placementName}
              onChangeText={text => setState(prev => ({...prev, placementName: text}))}
              placeholder="placement name (optional)"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={region}
              onChangeText={text => setState(prev => ({...prev, region: text}))}
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
            {isInterstitialAdLoaded && (
              <TouchableOpacity style={styles.button} onPress={handleAdShow}>
                <Text style={styles.buttonText}>광고 표시</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.button} onPress={handleClearView}>
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
  buttonText: {color: 'white', fontSize: 14, fontWeight: '600'},
  debugInfo: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 13,
    minHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
});

export default AdWhaleInterstitialSampleScreen;
