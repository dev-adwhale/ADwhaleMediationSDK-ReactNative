// example/src/AdWhaleSampleApp.tsx
import React, {useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AdWhaleBannerSampleScreen from './AdWhaleBannerSampleScreen';
import AdWhaleInterstitialSampleScreen from './AdWhaleInterstitialSampleScreen';
import AdWhaleRewardSampleScreen from './AdWhaleRewardSampleScreen';
import AdWhaleNativeSampleScreen from './AdWhaleNativeSampleScreen';
import AdWhaleAppOpenSampleScreen from './AdWhaleAppOpenSampleScreen';

type ScreenType = 'menu' | 'banner' | 'interstitial' | 'reward' | 'native' | 'appopen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');

  const showMenu = () => setCurrentScreen('menu');

  const renderMenu = () => (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>
        AdWhale Mediation Ad{'\n'}React-Native Sample (TypeScript)
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('banner')}>
          <Text style={styles.buttonText}>Banner Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('interstitial')}>
          <Text style={styles.buttonText}>Interstitial Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('reward')}>
          <Text style={styles.buttonText}>Reward Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('native')}>
          <Text style={styles.buttonText}>Native Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('appopen')}>
          <Text style={styles.buttonText}>App Open Ad</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'banner':
        return <AdWhaleBannerSampleScreen onBack={showMenu} />;
      case 'interstitial':
        return <AdWhaleInterstitialSampleScreen onBack={showMenu} />;
      case 'reward':
        return <AdWhaleRewardSampleScreen onBack={showMenu} />;
      case 'native':
        return <AdWhaleNativeSampleScreen onBack={showMenu} />;
      case 'appopen':
        return <AdWhaleAppOpenSampleScreen onBack={showMenu} />;
      case 'menu':
      default:
        return renderMenu();
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    margin: 30,
    fontWeight: 'bold',
  },
  buttonContainer: {
    margin: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
