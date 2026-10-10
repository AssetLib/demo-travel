import { usePathname, useRouter } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssetConnection } from '../assetlib/Connection';

/* Each sample app has its own palette, but both share one grammar: an app bar with the
   wordmark and the connection pill, one display-face title, a hero card whose caption bar
   carries the name and the one action, then plain rows. Two faces, two weights, no glyphs. */
export type Theme = { paper: string; surface: string; wash: string; line: string; ink: string; muted: string; accent: string; caption: string; fill: string; onFill: string };
export const roam: Theme = { paper: '#f5f1e7', surface: '#fffdf8', wash: '#ebe8dc', line: '#dcd8ca', ink: '#263659', muted: '#66705f', accent: '#8a6a3a', caption: '#efece2', fill: '#263659', onFill: '#f5f1e7' };
export const daylight: Theme = { paper: '#fafbf7', surface: '#ffffff', wash: '#edf0e8', line: '#dfe5d9', ink: '#284d3e', muted: '#67725f', accent: '#9a7a33', caption: '#e9efe3', fill: '#31573f', onFill: '#ffffff' };
export const colors = { ink: roam.ink, muted: roam.muted, paper: roam.paper, line: roam.line, ochre: '#b27a35', green: '#386853' };
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

export function AppBar({ brand, children }: { brand: ReactNode; children?: ReactNode }) {
  return <View style={styles.appBar}>{brand}<View style={styles.appBarRight}>{children}</View></View>;
}

/* The connection, as one small control: what the app is showing and where to change it. */
export function StatusPill({ theme }: { theme: Theme }) {
  const router = useRouter();
  const { config, status, busy, hydrating, error } = useAssetConnection();
  const connected = !!config && !!status?.sequence;
  const label = busy || hydrating ? 'Checking…' : error ? 'Check connection' : config ? status?.sequence ? `Release ${status.sequence}` : 'Waiting for release' : 'Connect';
  const dot = error ? '#b3552e' : connected ? '#3e7350' : theme.muted;
  return <Pressable accessibilityRole="button" accessibilityLabel="Open Assetlib connection" onPress={() => router.navigate('/connect')} style={({ pressed }) => [styles.pill, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
    {config || error ? <View style={[styles.pillDot, { backgroundColor: dot }]} /> : <Feather name="link" size={12} color={theme.muted} />}
    <Text style={[styles.pillText, { color: theme.ink }]}>{label}</Text>
  </Pressable>;
}

export function PageHeader({ theme, title, description }: { theme: Theme; title: string; description?: string }) {
  return <View style={styles.header}>
    <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
    {description ? <Text style={[styles.description, { color: theme.muted }]}>{description}</Text> : null}
  </View>;
}

export function Segmented<T extends string>({ theme, options, value, onChange }: { theme: Theme; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <View style={[styles.segmented, { backgroundColor: theme.wash }]}>{options.map(option => {
    const selected = option.value === value;
    return <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${option.label} filter`} accessibilityState={{ selected }} aria-pressed={selected} onPress={() => onChange(option.value)} style={[styles.segment, selected && { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.segmentText, { color: selected ? theme.ink : theme.muted }]}>{option.label}</Text>
    </Pressable>;
  })}</View>;
}

const DEMO_VARIANT = process.env.EXPO_PUBLIC_ASSETLIB_DEMO ?? 'travel';

export function LabShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { width, height } = useWindowDimensions();
  const desktop = width >= 900;
  // Shared screens such as /connect follow the app's own variant, not the travel default.
  const isTasks = path === '/tasks' || (path !== '/travel' && DEMO_VARIANT === 'todo');
  return (
    <View style={[styles.stage, desktop && styles.desktopStage]}>
      {desktop && <View style={styles.rail}>
        <View style={styles.railBrand}><Image source={require('../../assets/essential-mark.png')} style={styles.mark} /><Text style={styles.railLabel}>Assetlib sample app</Text></View>
        <Text style={styles.railHeading}>{isTasks ? 'A small task app.' : 'A small travel app.'}</Text>
        <Text style={styles.railBody}>{isTasks ? 'Its daily illustration is an Assetlib placement, with the artwork bundled into the app as a fallback.' : 'Two of its images are Assetlib placements, with the artwork bundled into the app as a fallback.'}</Text>
        <View style={styles.railRule} />
        <Text style={styles.railNote}>Choose Connect at the top of the app to attach a workspace, then publish a release to change the artwork here.</Text>
      </View>}
      <SafeAreaView style={[styles.app, { backgroundColor: isTasks ? daylight.paper : roam.paper }, desktop && { height: Math.min(height - 64, 920), borderRadius: 28, borderWidth: 1, borderColor: '#d8dacd', flex: undefined }]}>
        {children}
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
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: type.medium, fontSize: 12 },
  pressed: { opacity: 0.7 },
  header: { paddingTop: 26, paddingBottom: 22 },
  title: { fontFamily: type.display, fontSize: 34, lineHeight: 39, letterSpacing: -1.1 },
  description: { fontFamily: type.regular, fontSize: 14, lineHeight: 21, marginTop: 8 },
  segmented: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 12, gap: 2 },
  segment: { minHeight: 34, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  segmentText: { fontFamily: type.medium, fontSize: 13 },
});
