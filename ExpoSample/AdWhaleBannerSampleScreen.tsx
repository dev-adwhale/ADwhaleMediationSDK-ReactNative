// example/src/AdWhaleBannerSampleScreen.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

import { AdWhaleMediationSdk } from 'adwhale-sdk-react-native';
import { AdWhaleBannerView } from 'adwhale-sdk-react-native';

/** 배너 사이즈 타입 */
type BannerSizeKey =
  | 'SIZE_320x50'
  | 'SIZE_320x100'
  | 'SIZE_300x250'
  | 'SIZE_250x250'
  | 'ADAPTIVE_ANCHOR';

const BANNER_SIZES: Record<BannerSizeKey, string> = {
  SIZE_320x50: '320x50',
  SIZE_320x100: '320x100',
  SIZE_300x250: '300x250',
  SIZE_250x250: '250x250',
  ADAPTIVE_ANCHOR: 'ADAPTIVE_ANCHOR',
};

export interface AdWhaleBannerSampleScreenProps {
  onBack?: () => void;
}

export const AdWhaleBannerSampleScreen: React.FC<
  AdWhaleBannerSampleScreenProps
> = ({ onBack }) => {
  // -----------------------------------------------------
  // 상태값
  // -----------------------------------------------------
  const [loggerEnabled, setLoggerEnabled] = useState(false);
  const [coppaEnabled, setCoppaEnabled] = useState(false);

  const [placementUid, setPlacementUid] = useState('AU1718694072940');
  const [placementName, setPlacementName] = useState('');
  const [region, setRegion] = useState('');
  const [gcoder, setGcoder] = useState<{ lt: number; lng: number } | undefined>(
    undefined,
  );
  const [selectedAdSize, setSelectedAdSize] =
    useState<BannerSizeKey>('SIZE_320x50');

  const [debugInfo, setDebugInfo] = useState(
    'Please touch [광고 로드] button.',
  );

  // 광고 로드용 상태
  const [isBannerAdLoaded, setIsBannerAdLoaded] = useState(false);
  const [loadBannerAd, setLoadBannerAd] = useState(false);
  const [bannerPlacementUid, setBannerPlacementUid] = useState('');
  const [bannerPlacementName, setBannerPlacementName] = useState('');
  const [bannerRegion, setBannerRegion] = useState('');
  const [bannerGcoder, setBannerGcoder] = useState<{
    lt: number;
    lng: number;
  } | undefined>(undefined);
  const [bannerAdSize, setBannerAdSize] =
    useState<BannerSizeKey>('SIZE_320x50');

  // -----------------------------------------------------
  // SDK 초기화
  // -----------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const statusCode = await AdWhaleMediationSdk.initialize();
        if (!mounted) return;

        if (statusCode === 100) {
          setDebugInfo(prev => `SDK 초기화 성공\n${prev}`);
        } else {
          setDebugInfo(
            prev => `SDK 초기화 실패(status: ${statusCode})\n${prev}`,
          );
        }
      } catch (error: any) {
        if (!mounted) return;
        setDebugInfo(
          prev =>
            `SDK 초기화 오류: ${
              error?.message ?? JSON.stringify(error)
            }\n${prev}`,
        );
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // -----------------------------------------------------
  // Android Back Button
  // -----------------------------------------------------
  useEffect(() => {
    if (!onBack) return;

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

  // -----------------------------------------------------
  // GDPR / COPPA
  // -----------------------------------------------------
  const handleSetCoppa = useCallback(
    (value: boolean) => {
      setCoppaEnabled(value);
      AdWhaleMediationSdk.setCoppa(value);
    },
    [],
  );

  const handleRequestGdpr = useCallback(async () => {
    console.log('[AdWhaleBanner] handleRequestGdpr called');
    try {
      setDebugInfo('GDPR Request 시작...\n');
      const r = await AdWhaleMediationSdk.requestGdprConsent();
      console.log('[AdWhaleBanner] GDPR Request result:', r);
      setDebugInfo(
        `GDPR Request: ${r.isSuccess ? 'Success' : 'Failed'}\n${r.message}`,
      );
    } catch (error: any) {
      console.error('[AdWhaleBanner] GDPR Request Error:', error);
      setDebugInfo(
        `GDPR Request Error: ${
          error?.message ?? JSON.stringify(error)
        }`,
      );
    }
  }, []);

  const handleCheckStatus = useCallback(async () => {
    console.log('[AdWhaleBanner] handleCheckStatus called');
    try {
      setDebugInfo('Status 확인 중...\n');
      const status = await AdWhaleMediationSdk.getConsentStatus();
      console.log('[AdWhaleBanner] Status result:', status);
      setDebugInfo(
        `COPPA: ${status.coppa}\nGDPR: ${status.gdpr}\nPersonalized: ${status.personalizedConsent}`,
      );
    } catch (error: any) {
      console.error('[AdWhaleBanner] Status Error:', error);
      setDebugInfo(
        `Status Error: ${error?.message ?? JSON.stringify(error)}`,
      );
    }
  }, []);

  const handleResetGdpr = useCallback(() => {
    console.log('[AdWhaleBanner] handleResetGdpr called');
    try {
      AdWhaleMediationSdk.resetGdprConsentStatus();
      setDebugInfo('GDPR consent status reset.');
    } catch (error: any) {
      console.error('[AdWhaleBanner] Reset Error:', error);
      setDebugInfo(`Reset Error: ${error?.message ?? JSON.stringify(error)}`);
    }
  }, []);

  const handleSetGdpr = useCallback((value: boolean) => {
    console.log('[AdWhaleBanner] handleSetGdpr called:', value);
    try {
      AdWhaleMediationSdk.setGdpr(value);
      setDebugInfo(`Set Personalized Consent → ${value}`);
    } catch (error: any) {
      console.error('[AdWhaleBanner] SetGdpr Error:', error);
      setDebugInfo(`SetGdpr Error: ${error?.message ?? JSON.stringify(error)}`);
    }
  }, []);

  // -----------------------------------------------------
  // 배너 사이즈 / Placement UID
  // -----------------------------------------------------
  const updatePlacementUidBySize = useCallback(() => {
    // 사이즈별로 pid를 관리해야 할 경우 변경
    setPlacementUid('PlacementUid를 입력 하세요.');
  }, []);

  const handleAdSizeChange = useCallback(
    (size: BannerSizeKey) => {
      setSelectedAdSize(size);
      updatePlacementUidBySize();
      setDebugInfo(
        '배너 사이즈 변경됨 — [광고 로드] 버튼을 눌러주세요.\n',
      );
      setLoadBannerAd(false);
      setIsBannerAdLoaded(false);
    },
    [updatePlacementUidBySize],
  );

  const bannerHeight = useMemo(() => {
    switch (selectedAdSize) {
      case 'SIZE_320x50':
        return 50;
      case 'SIZE_320x100':
        return 100;
      case 'SIZE_300x250':
      case 'SIZE_250x250':
        return 250;
      case 'ADAPTIVE_ANCHOR':
        return 60;
      default:
        return 50;
    }
  }, [selectedAdSize]);

  const getSizeParam = useCallback(
    (key: BannerSizeKey) => BANNER_SIZES[key],
    [],
  );

  // -----------------------------------------------------
  // 광고 로드 / 초기화
  // -----------------------------------------------------
  const handleAdLoad = useCallback(() => {
    if (!placementUid) return;

    const sizeStr = getSizeParam(selectedAdSize);

    setBannerPlacementUid(placementUid);
    setBannerPlacementName(placementName);
    setBannerRegion(region);
    setBannerGcoder(gcoder);
    setBannerAdSize(selectedAdSize);

    setLoadBannerAd(true);
    setIsBannerAdLoaded(false);

    setDebugInfo(
      `배너 광고 요청!\npid: ${placementUid}\nsize: ${sizeStr}\nplacementName: ${placementName || 'N/A'}\nregion: ${region || 'N/A'}\n`,
    );
  }, [placementUid, placementName, region, gcoder, selectedAdSize, getSizeParam]);

  const handleClearView = useCallback(() => {
    setLoadBannerAd(false);
    setIsBannerAdLoaded(false);
    setBannerPlacementUid('');
    setBannerPlacementName('');
    setBannerRegion('');
    setBannerGcoder(undefined);
    setBannerAdSize('SIZE_320x50');
    setDebugInfo('Please touch [광고 로드] button.');
  }, []);

  // -----------------------------------------------------
  // 배너 이벤트
  // -----------------------------------------------------
  const onBannerAdLoaded = useCallback(() => {
    setIsBannerAdLoaded(true);
    setLoadBannerAd(false);
    setDebugInfo('배너 광고 로드 성공!\n');
  }, []);

  const onBannerAdLoadFailed = useCallback(
    (event: { statusCode?: number; message?: string }) => {
      const code = event.statusCode ?? -1;
      const msg = event.message ?? 'Unknown';
      setIsBannerAdLoaded(false);
      setLoadBannerAd(false);
      setDebugInfo(`배너 광고 로드 실패: ${code}, ${msg}\n`);
    },
    [],
  );

  const onBannerAdClicked = useCallback(() => {
    setDebugInfo('배너 클릭됨\n');
  }, []);

  // -----------------------------------------------------
  // UI Helper
  // -----------------------------------------------------
  const renderRadio = (
    label: string,
    key: BannerSizeKey,
    selected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity key={key} style={styles.radioRow} onPress={onPress}>
      <View
        style={[
          styles.radioCircle,
          selected && styles.radioCircleSelected,
        ]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 메인으로</Text>
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>AdWhale 배너 샘플 (TS)</Text>

          {/* Logger / COPPA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Logger / COPPA</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Logger</Text>
              <Switch
                value={loggerEnabled}
                onValueChange={v => {
                  setLoggerEnabled(v);
                  AdWhaleMediationSdk.setLoggerEnabled(v);
                }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>COPPA</Text>
              <Switch value={coppaEnabled} onValueChange={handleSetCoppa} />
            </View>
          </View>

          {/* GDPR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1.1. GDPR</Text>
            <View style={styles.buttonRow}>
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSetGdpr(true)}>
                <Text style={styles.buttonText}>Set True</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSetGdpr(false)}>
                <Text style={styles.buttonText}>Set False</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ad Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 배너 사이즈 선택</Text>

            {renderRadio(
              '320x50',
              'SIZE_320x50',
              selectedAdSize === 'SIZE_320x50',
              () => handleAdSizeChange('SIZE_320x50'),
            )}
            {renderRadio(
              '320x100',
              'SIZE_320x100',
              selectedAdSize === 'SIZE_320x100',
              () => handleAdSizeChange('SIZE_320x100'),
            )}
            {renderRadio(
              '300x250',
              'SIZE_300x250',
              selectedAdSize === 'SIZE_300x250',
              () => handleAdSizeChange('SIZE_300x250'),
            )}
            {renderRadio(
              '250x250',
              'SIZE_250x250',
              selectedAdSize === 'SIZE_250x250',
              () => handleAdSizeChange('SIZE_250x250'),
            )}
            {renderRadio(
              'Adaptive',
              'ADAPTIVE_ANCHOR',
              selectedAdSize === 'ADAPTIVE_ANCHOR',
              () => handleAdSizeChange('ADAPTIVE_ANCHOR'),
            )}
          </View>

          {/* Placement UID */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. placement uid 입력</Text>
            <TextInput
              style={styles.input}
              value={placementUid}
              onChangeText={setPlacementUid}
              placeholder="placement uid"
              placeholderTextColor="#999"
            />
          </View>

          {/* Placement Name, Region, Gcoder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. 추가 옵션 (선택사항)</Text>
            <TextInput
              style={styles.input}
              value={placementName}
              onChangeText={setPlacementName}
              placeholder="placement name (optional)"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={region}
              onChangeText={setRegion}
              placeholder="region (optional, e.g., KR)"
              placeholderTextColor="#999"
            />
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lt?.toString() || ''}
                onChangeText={text => {
                  const lt = parseFloat(text);
                  setGcoder(
                    text && !isNaN(lt)
                      ? { ...gcoder, lt } || { lt, lng: gcoder?.lng || 0 }
                      : undefined,
                  );
                }}
                placeholder="latitude (optional)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={gcoder?.lng?.toString() || ''}
                onChangeText={text => {
                  const lng = parseFloat(text);
                  setGcoder(
                    text && !isNaN(lng)
                      ? { ...gcoder, lng } || { lt: gcoder?.lt || 0, lng }
                      : undefined,
                  );
                }}
                placeholder="longitude (optional)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleAdLoad}>
              <Text style={styles.buttonText}>광고 로드</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleClearView}>
              <Text style={styles.buttonText}>뷰 초기화</Text>
            </TouchableOpacity>
          </View>

          {/* Debug Info */}
          <View style={styles.section}>
            <TextInput
              style={styles.debugInfo}
              value={debugInfo}
              onChangeText={setDebugInfo}
              multiline
              editable={false}
            />
          </View>
        </ScrollView>

        {/* 배너 광고 영역 */}
        {(loadBannerAd || isBannerAdLoaded) &&
          bannerPlacementUid !== '' && (
            <View
              style={[
                styles.bannerContainer,
                { height: bannerHeight + 20 },
              ]}>
              <AdWhaleBannerView
                key={`banner-${bannerPlacementUid}-${bannerAdSize}`}
                style={[styles.bannerView, { height: bannerHeight }]}
                placementUid={bannerPlacementUid}
                placementName={bannerPlacementName || undefined}
                region={bannerRegion || undefined}
                gcoder={bannerGcoder}
                adSize={getSizeParam(bannerAdSize)}
                loadAd={loadBannerAd}
                onAdLoaded={onBannerAdLoaded}
                onAdLoadFailed={onBannerAdLoadFailed}
                onAdClicked={onBannerAdClicked}
              />
            </View>
          )}
      </View>
    </SafeAreaView>
  );
};

// -----------------------------------------------------
// Styles
// -----------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 16,
    backgroundColor: '#f3f3f3',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  container: { flex: 1 },
  scrollView: { padding: 16 },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    backgroundColor: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 6,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: { fontSize: 14, color: '#333' },
  debugInfo: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    minHeight: 200,
    fontSize: 13,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  bannerContainer: {
    width: '100%',
    backgroundColor: '#eaeaea',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bannerView: {
    width: '100%',
    backgroundColor: 'white',
  },
});

/** default export (중요!) */
export default AdWhaleBannerSampleScreen;
