// ExpoSample/adwhale/TransitionPopupScreen.tsx
// adwhale-sdk-react-native/example/src/AdWhaleTransitionPopupSampleScreen.tsx 를 이식한 화면.
// 앱 전환 팝업(Transition Popup)은 Android 전용입니다.
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { transitionPopupPlacementUid as defaultPlacementUid } from './config';
import {
  AdWhaleMediationAds,
  AdWhaleTransitionPopupAd,
  type AdWhaleTransitionPopupAdClosedEvent,
  type AdWhaleTransitionPopupAdErrorEvent,
} from 'adwhale-sdk-react-native';

interface Props {
  onBack?: () => void;
}

interface State {
  loggerEnabled: boolean;
  coppaEnabled: boolean;
  placementUid: string;
  placementName: string;
  region: string;
  gcoder: { lt: number; lng: number } | undefined;
  debugInfo: string;
  isLoaded: boolean;
}

const TransitionPopupScreen: React.FC<Props> = ({ onBack }) => {
  const [state, setState] = useState<State>({
    loggerEnabled: false,
    coppaEnabled: false,
    placementUid: defaultPlacementUid,
    placementName: '',
    region: '',
    gcoder: undefined,
    debugInfo:
      Platform.OS === 'android'
        ? '앱 전환 팝업: [광고 로드] 후 [광고 표시]로 테스트합니다.'
        : 'Transition Popup Ad는 Android 전용입니다.',
    isLoaded: false,
  });

  useEffect(() => {
    AdWhaleMediationAds.initialize()
      .then(result => {
        if (result.statusCode === 100) {
          setState(prev => ({
            ...prev,
            debugInfo: `SDK 초기화 성공: ${result.message}\n`,
          }));
        } else {
          setState(prev => ({
            ...prev,
            debugInfo: `SDK 초기화 실패(status: ${result.statusCode}): ${result.message}\n`,
          }));
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
    if (Platform.OS !== 'android') {
      return;
    }
    const subs = AdWhaleTransitionPopupAd.addEventListeners({
      onLoaded: () => {
        setState(prev => ({
          ...prev,
          isLoaded: true,
          debugInfo: 'Transition 팝업 광고 로드 성공\n',
        }));
      },
      onLoadFailed: (e: AdWhaleTransitionPopupAdErrorEvent) => {
        setState(prev => ({
          ...prev,
          isLoaded: false,
          debugInfo: `로드 실패: ${e.statusCode} - ${e.message}\n`,
        }));
      },
      onShowed: () => {
        setState(prev => ({
          ...prev,
          debugInfo: 'Transition 팝업 표시됨\n',
        }));
      },
      onShowFailed: (e: AdWhaleTransitionPopupAdErrorEvent) => {
        setState(prev => ({
          ...prev,
          debugInfo: `표시 실패: ${e.statusCode} - ${e.message}\n`,
        }));
      },
      onClicked: () => {
        setState(prev => ({ ...prev, debugInfo: '광고 클릭\n' }));
      },
      onClosed: (e: AdWhaleTransitionPopupAdClosedEvent) => {
        setState(prev => ({
          ...prev,
          isLoaded: false,
          debugInfo: `닫힘: reasonId=${e.reasonId}, ${e.reasonMessage}\n`,
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
    return () => subscription.remove();
  }, [onBack]);

  const handleSetCoppa = (value: boolean) => {
    setState(prev => ({ ...prev, coppaEnabled: value }));
    AdWhaleMediationAds.setCoppa(value);
  };

  const handleAdLoad = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const { placementUid, placementName, region, gcoder } = state;
    if (!placementUid) {
      return;
    }
    setState(prev => ({
      ...prev,
      debugInfo: `광고 로드 요청...\nplacementUid: ${placementUid}\n`,
    }));
    AdWhaleTransitionPopupAd.loadAd(placementUid, {
      placementName: placementName || undefined,
      region: region || undefined,
      gcoder,
    });
  };

  const handleAdShow = () => {
    if (Platform.OS !== 'android' || !state.isLoaded) {
      return;
    }
    AdWhaleTransitionPopupAd.showAd();
  };

  const handleResume = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    AdWhaleTransitionPopupAd.resume();
    setState(prev => ({ ...prev, debugInfo: 'resume() 호출\n' }));
  };

  const handleDestroy = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    AdWhaleTransitionPopupAd.destroy();
    setState(prev => ({
      ...prev,
      isLoaded: false,
      debugInfo: 'destroy() 호출\n',
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
    isLoaded,
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
          <Text style={styles.title}>앱 전환 팝업 (Transition Popup, Android)</Text>

          {Platform.OS !== 'android' && (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>
                이 샘플은 Android 전용입니다.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Logger / COPPA</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Logger</Text>
              <Switch
                value={loggerEnabled}
                onValueChange={v => {
                  setState(prev => ({ ...prev, loggerEnabled: v }));
                  AdWhaleMediationAds.setLoggerEnabled(v);
                }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>COPPA</Text>
              <Switch value={coppaEnabled} onValueChange={handleSetCoppa} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. placement uid</Text>
            <TextInput
              style={styles.input}
              value={placementUid}
              onChangeText={text =>
                setState(prev => ({ ...prev, placementUid: text }))
              }
              placeholder="placement uid"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. 옵션 (선택)</Text>
            <TextInput
              style={styles.input}
              value={placementName}
              onChangeText={text =>
                setState(prev => ({ ...prev, placementName: text }))
              }
              placeholder="placement name"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={region}
              onChangeText={text =>
                setState(prev => ({ ...prev, region: text }))
              }
              placeholder="region (e.g. KR)"
              placeholderTextColor="#999"
            />
            <View style={styles.rowGap}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lt?.toString() ?? ''}
                onChangeText={text => {
                  const lt = parseFloat(text);
                  setState(prev => {
                    if (!text || Number.isNaN(lt)) {
                      return { ...prev, gcoder: undefined };
                    }
                    const lng = prev.gcoder?.lng ?? 0;
                    return { ...prev, gcoder: { lt, lng } };
                  });
                }}
                placeholder="latitude"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lng?.toString() ?? ''}
                onChangeText={text => {
                  const lng = parseFloat(text);
                  setState(prev => {
                    if (!text || Number.isNaN(lng)) {
                      return { ...prev, gcoder: undefined };
                    }
                    const lt = prev.gcoder?.lt ?? 0;
                    return { ...prev, gcoder: { lt, lng } };
                  });
                }}
                placeholder="longitude"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                Platform.OS !== 'android' && styles.buttonDisabled,
              ]}
              disabled={Platform.OS !== 'android'}
              onPress={handleAdLoad}>
              <Text style={styles.buttonText}>광고 로드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                (!isLoaded || Platform.OS !== 'android') &&
                  styles.buttonDisabled,
              ]}
              disabled={!isLoaded || Platform.OS !== 'android'}
              onPress={handleAdShow}>
              <Text style={styles.buttonText}>광고 표시</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                Platform.OS !== 'android' && styles.buttonDisabled,
              ]}
              disabled={Platform.OS !== 'android'}
              onPress={handleResume}>
              <Text style={styles.buttonText}>resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonDanger,
                Platform.OS !== 'android' && styles.buttonDisabled,
              ]}
              disabled={Platform.OS !== 'android'}
              onPress={handleDestroy}>
              <Text style={styles.buttonText}>destroy</Text>
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
  safeArea: { flex: 1, backgroundColor: 'white' },
  backButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  container: { flex: 1 },
  scrollView: { flex: 1, padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  warnBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  warnText: { color: '#856404', fontSize: 13 },
  section: { marginBottom: 20 },
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
  switchLabel: { fontSize: 14, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 13,
    backgroundColor: 'white',
  },
  rowGap: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
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
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDanger: {
    backgroundColor: '#c00',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600' },
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

export default TransitionPopupScreen;
