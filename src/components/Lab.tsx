import { usePathname, useRouter } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssetConnection } from '../assetlib/Connection';

export const colors = { ink: '#263659', muted: '#647067', paper: '#f5f1e7', line: '#dddccd', ochre: '#b27a35', green: '#386853' };
export const type = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold', display: 'Fraunces_500Medium' };

export type Task = { id: number; title: string; category: string; done: boolean };
type DemoState = {
  saved: string[];
  toggleSaved: (id: string) => void;
  tasks: Task[];
  toggleTask: (id: number) => void;
  addTask: (title: string) => boolean;
};
const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [nextId, setNextId] = useState(4);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Take a walk before the day begins', category: 'FOR YOU', done: true },
    { id: 2, title: 'Pick a place for the weekend', category: 'SOMETHING GOOD', done: false },
    { id: 3, title: 'Water the plants', category: 'AT HOME', done: false },
  ]);
  const toggleSaved = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const toggleTask = (id: number) => setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task));
  const addTask = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > 100 || tasks.length >= 100) return false;
    setTasks(current => [...current, { id: nextId, title: trimmed, category: 'YOUR LIST', done: false }]);
    setNextId(current => current + 1);
    return true;
  };
  return <DemoContext.Provider value={{ saved, toggleSaved, tasks, toggleTask, addTask }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('DemoProvider is required.');
  return value;
}

export function LabShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { config, status, busy, hydrating, error } = useAssetConnection();
  const { width, height } = useWindowDimensions();
  const desktop = width >= 900;
  const isTasks = path === '/tasks';
  const isTravel = path === '/travel' || path === '/';
  return (
    <View style={[styles.stage, desktop && styles.desktopStage]}>
      {desktop && <View style={styles.rail}>
        <View style={styles.railBrand}><Image source={require('../../assets/essential-mark.png')} style={styles.mark} /><Text style={styles.railLabel}>ASSETLIB / MOBILE LAB</Text></View>
        <Text style={styles.railHeading}>Small apps.{ '\n' }Real starting{ '\n' }points.</Text>
        <Text style={styles.railBody}>Two original sample apps, with artwork bundled into the app. Save a place. Finish a little task.</Text>
        <View style={styles.railRule} />
        <Text style={styles.railNote}>Three images are wired to Assetlib.{ '\n' }Connect your app to try a release.</Text>
      </View>}
      <SafeAreaView style={[styles.app, { backgroundColor: isTasks ? '#fafbf7' : colors.paper }, desktop && { height: Math.min(height - 64, 920), borderRadius: 28, borderWidth: 1, borderColor: '#d8dacd', flex: undefined }]}>
        <View style={styles.labBar}>
          <Text style={styles.labLabel}>MOBILE LAB</Text>
          <View style={styles.switcher}>
            <Pressable accessibilityRole="button" accessibilityLabel="Travel sample" accessibilityState={{ selected: isTravel }} aria-pressed={isTravel} onPress={() => router.navigate('/travel')} style={[styles.switch, isTravel && styles.activeSwitch]}><Text style={[styles.switchText, isTravel && styles.activeSwitchText]}>Travel</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Tasks sample" accessibilityState={{ selected: isTasks }} aria-pressed={isTasks} onPress={() => router.navigate('/tasks')} style={[styles.switch, isTasks && styles.activeSwitch]}><Text style={[styles.switchText, isTasks && styles.activeSwitchText]}>Tasks</Text></Pressable>
          </View>
        </View>
        {children}
        <Pressable accessibilityRole="button" accessibilityLabel="Open Assetlib connection" onPress={() => router.navigate('/connect')} style={[styles.labFooter, { minHeight: 48 }]}><Text style={styles.labFooterText}>{busy || hydrating ? 'Checking Assetlib…' : error ? 'Check connection · Assetlib ↗' : config ? status?.sequence ? `Release ${status.sequence} · Assetlib connection ↗` : 'Waiting for release · Assetlib ↗' : 'Bundled artwork · Connect Assetlib ↗'}</Text></Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#e9ece3', alignItems: 'center' },
  desktopStage: { flexDirection: 'row', justifyContent: 'center', gap: 72, padding: 32 },
  rail: { width: 290, alignSelf: 'center', paddingBottom: 32 },
  railBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 },
  mark: { width: 28, height: 28 },
  railLabel: { fontFamily: type.bold, color: colors.ink, fontSize: 11, letterSpacing: 1.3 },
  railHeading: { fontFamily: type.display, color: colors.ink, fontSize: 47, lineHeight: 53, letterSpacing: -1.6 },
  railBody: { fontFamily: type.regular, fontSize: 16, lineHeight: 25, color: '#526158', marginTop: 24 },
  railRule: { width: 40, height: 1, backgroundColor: '#899488', marginTop: 34, marginBottom: 18 },
  railNote: { fontFamily: type.regular, color: '#57645a', fontSize: 13, lineHeight: 20 },
  app: { flex: 1, width: '100%', maxWidth: 540, overflow: 'hidden' },
  labBar: { minHeight: 68, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#dedfd3', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  labLabel: { fontFamily: type.bold, fontSize: 10, letterSpacing: 1.3, color: '#647067' },
  switcher: { flexDirection: 'row', backgroundColor: '#e7e9df', padding: 3, borderRadius: 28 },
  switch: { paddingHorizontal: 18, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  activeSwitch: { backgroundColor: colors.ink },
  switchText: { fontFamily: type.bold, color: '#58665d', fontSize: 13 },
  activeSwitchText: { color: '#fffaf0' },
  labFooter: { paddingVertical: 9, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#dedfd3' },
  labFooterText: { fontFamily: type.regular, fontSize: 11, color: '#616d63' },
});
