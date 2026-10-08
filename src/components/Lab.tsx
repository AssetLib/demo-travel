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
    { id: 1, title: 'Take a walk before the day begins', category: 'For you', done: true },
    { id: 2, title: 'Pick a place for the weekend', category: 'Something good', done: false },
    { id: 3, title: 'Water the plants', category: 'At home', done: false },
  ]);
  const toggleSaved = (id: string) => setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const toggleTask = (id: number) => setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task));
  const addTask = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > 100 || tasks.length >= 100) return false;
    setTasks(current => [...current, { id: nextId, title: trimmed, category: 'Your list', done: false }]);
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
  return (
    <View style={[styles.stage, desktop && styles.desktopStage]}>
      {desktop && <View style={styles.rail}>
        <View style={styles.railBrand}><Image source={require('../../assets/essential-mark.png')} style={styles.mark} /><Text style={styles.railLabel}>Assetlib sample app</Text></View>
        <Text style={styles.railHeading}>{isTasks ? 'A small task app.' : 'A small travel app.'}</Text>
        <Text style={styles.railBody}>{isTasks ? 'Its daily illustration is an Assetlib placement, with the artwork bundled into the app as a fallback.' : 'Two of its images are Assetlib placements, with the artwork bundled into the app as a fallback.'}</Text>
        <View style={styles.railRule} />
        <Text style={styles.railNote}>Connect a workspace from the link at the bottom of the app, then publish a release to change the artwork here.</Text>
      </View>}
      <SafeAreaView style={[styles.app, { backgroundColor: isTasks ? '#fafbf7' : colors.paper }, desktop && { height: Math.min(height - 64, 920), borderRadius: 28, borderWidth: 1, borderColor: '#d8dacd', flex: undefined }]}>
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
  railLabel: { fontFamily: type.medium, color: colors.ink, fontSize: 13 },
  railHeading: { fontFamily: type.display, color: colors.ink, fontSize: 40, lineHeight: 46, letterSpacing: -1.2 },
  railBody: { fontFamily: type.regular, fontSize: 16, lineHeight: 25, color: '#526158', marginTop: 24 },
  railRule: { width: 40, height: 1, backgroundColor: '#899488', marginTop: 34, marginBottom: 18 },
  railNote: { fontFamily: type.regular, color: '#57645a', fontSize: 13, lineHeight: 20 },
  app: { flex: 1, width: '100%', maxWidth: 540, overflow: 'hidden' },
  labFooter: { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#dedfd3' },
  labFooterText: { fontFamily: type.medium, fontSize: 12, color: '#616d63' },
});
