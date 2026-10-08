import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DemoProvider, LabShell } from '../components/Lab';
import { AssetConnectionProvider } from '../assetlib/Connection';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular: require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
    DMSans_500Medium: require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
    DMSans_600SemiBold: require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
    Fraunces_500Medium: require('@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf'),
  });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: '#f5f1e7' }} />;
  return <SafeAreaProvider><AssetConnectionProvider><DemoProvider><StatusBar style="dark" /><LabShell><Slot /></LabShell></DemoProvider></AssetConnectionProvider></SafeAreaProvider>;
}
