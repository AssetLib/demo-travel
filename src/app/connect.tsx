import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { sourceLabel, useAssetConnection } from '../assetlib/Connection';
import { colors, type } from '../components/Lab';

const placements = [
  { key: 'travel.coast', name: 'The quiet coast', screen: 'Travel', ratio: '4:3' },
  { key: 'travel.ridge', name: 'A path through the pines', screen: 'Travel', ratio: '4:3' },
  { key: 'tasks.garden', name: 'Growing plant · 4 stages', screen: 'Tasks', ratio: '3:2' },
] as const;

function safeConsoleUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}

export default function ConnectScreen() {
  const { config, status, assets, busy, hydrating, error, notice, connect, disconnect, refresh } = useAssetConnection();
  const [draft, setDraft] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [actionArea, setActionArea] = useState<'config' | 'refresh'>('config');
  const consoleUrl = safeConsoleUrl(process.env.EXPO_PUBLIC_ASSETLIB_CONSOLE_URL ?? 'https://assetlib-console.vercel.app') ?? safeConsoleUrl(config?.manifestUrl ? new URL(config.manifestUrl).origin : undefined);
  const pending = busy || hydrating;
  const configText = draft ?? (config ? JSON.stringify(config, null, 2) : '');
  const openConsole = async () => {
    if (!consoleUrl) return;
    setLinkError(null);
    try { await Linking.openURL(consoleUrl); } catch { setLinkError('The console could not be opened. Try its address in your browser.'); }
  };
  const removeConnection = async () => { await disconnect(); setDraft(''); };
  const feedback = <>
    {error && <View style={styles.feedback}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Text style={styles.hint}>A verified cached image or the bundled fallback keeps the samples usable.</Text></View>}
    {notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
  </>;
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>ASSETLIB CONNECTION</Text>
      <Text style={styles.title}>Your app.{ '\n' }Your artwork.</Text>
      <Text style={styles.lead}>The samples already have their images. Connect an app to receive verified artwork from your own Assetlib workspace.</Text>

      <View style={styles.connectionSummary}>
        <View style={styles.summaryHeading}><View style={[styles.dot, config && status?.sequence ? styles.connectedDot : undefined]} /><Text style={styles.summaryTitle}>{hydrating ? 'Restoring your connection' : config ? status?.sequence ? `Release ${status.sequence}` : 'Waiting for a published release' : 'Using bundled artwork'}</Text></View>
        <Text style={styles.summaryBody}>{config ? `App ${config.appId}` : 'Everything works before you connect. The original artwork stays in the app as its fallback.'}</Text>
        {config && <Text selectable style={styles.connectionHost}>{new URL(config.manifestUrl).host}</Text>}
      </View>

      <View style={styles.step}><Text style={styles.stepNumber}>01</Text><View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Create your app in Assetlib</Text>
        <Text style={styles.body}>Create an account in the console, then create a workspace with its demo app. Its three placements match these samples.</Text>
        {consoleUrl ? <Pressable accessibilityRole="link" accessibilityLabel="Open Assetlib console" onPress={() => void openConsole()} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Open Assetlib console ↗</Text></Pressable> : <Text style={styles.hint}>This build has no console address yet. Set EXPO_PUBLIC_ASSETLIB_CONSOLE_URL when running it, or paste an existing app’s public config below.</Text>}
        {linkError && <Text accessibilityRole="alert" style={styles.error}>{linkError}</Text>}
      </View></View>

      <View style={styles.step}><Text style={styles.stepNumber}>02</Text><View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Paste the public SDK config</Text>
        <Text style={styles.body}>Copy it from the app’s connection panel. It identifies your app and pins the key used to verify releases.</Text>
        <TextInput accessibilityLabel="Public SDK configuration" value={configText} onChangeText={setDraft} editable={!pending} placeholder={'{\n  "schemaVersion": 1,\n  …public config from your app\n}'} placeholderTextColor="#7b8576" multiline autoCapitalize="none" autoCorrect={false} maxLength={16_384} textAlignVertical="top" style={styles.configInput} />
        <Text style={styles.hint}>Public config only. No password, private signing key, or admin API token belongs in this app. It is remembered on this device.</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending }} disabled={pending} onPress={() => { setActionArea('config'); void connect(configText); }} style={[styles.primaryButton, pending && styles.disabled]}>{pending ? <ActivityIndicator color="#f5f1e7" size="small" /> : null}<Text style={styles.primaryButtonText}>{pending ? 'Checking connection…' : config ? 'Update connection' : 'Connect and check release'}</Text></Pressable>
        {actionArea === 'config' && feedback}
      </View></View>

      <View style={styles.step}><Text style={styles.stepNumber}>03</Text><View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Publish a different image</Text>
        <Text style={styles.body}>In the console, upload artwork, bind it to one of these placements, and publish a release. Return here and check for updates, then open its sample screen.</Text>
        <Text style={styles.hint}>The app downloads an image when its screen needs it. A published release and the displayed image are separate checks.</Text>
        <Text style={styles.hint}>The task plant uses empty, started, growing, and complete artwork. The app chooses a stage from task progress; publish all four together to update the plant.</Text>
      </View></View>

      <View style={styles.placements}>
        <Text style={styles.sectionLabel}>THREE CONNECTED PLACEMENTS</Text>
        {placements.map(placement => <View key={placement.key} style={styles.placement}>
          <View style={styles.placementTop}><Text style={styles.placementName}>{placement.name}</Text><Text style={styles.ratio}>{placement.ratio}</Text></View>
          <Text style={styles.placementKey}>{placement.screen} · {placement.key}</Text>
          <Text style={styles.source} accessibilityLiveRegion="polite">{sourceLabel(assets[placement.key], !!config)}{assets[placement.key]?.sequence ? ` · Release ${assets[placement.key].sequence}` : ''}</Text>
          {assets[placement.key]?.source === 'bundle' && <Text style={styles.hint}>{assets[placement.key].message}</Text>}
        </View>)}
      </View>

      <View style={styles.placements}>
        <Text style={styles.sectionLabel}>TRAVEL COLLECTION</Text>
        <Text style={styles.body}>Published catalog artwork appears after the two sample places. More pages load as you scroll, and an image downloads when its card is visible.</Text>
        <Text style={styles.hint}>Images kept for this session. The collection uses one bundled placeholder and memory caching, so it does not store the full feed for offline use. Your app’s backend owns destination names and details.</Text>
      </View>

      {actionArea === 'refresh' && feedback}
      {config && <View style={styles.connectionActions}>
        <Pressable accessibilityRole="button" disabled={pending} accessibilityState={{ disabled: pending }} onPress={() => { setActionArea('refresh'); void refresh(); }} style={[styles.primaryButton, pending && styles.disabled]}><Text style={styles.primaryButtonText}>{pending ? 'Checking…' : 'Check for updates'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={pending} accessibilityState={{ disabled: pending }} onPress={() => void removeConnection()} style={[styles.disconnectButton, pending && styles.disabled]}><Text style={styles.disconnectText}>Disconnect this app</Text></Pressable>
        <Text style={styles.hint}>Disconnect removes the saved public config and returns to bundled artwork. Previously verified cache stays on this device.</Text>
      </View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
  eyebrow: { fontFamily: type.bold, color: '#7d633e', fontSize: 10, letterSpacing: 1.5, marginBottom: 14 },
  title: { fontFamily: type.display, fontSize: 45, lineHeight: 49, letterSpacing: -1.8, color: colors.ink },
  lead: { fontFamily: type.regular, fontSize: 15, lineHeight: 23, color: '#5e6958', marginTop: 18, marginBottom: 24 },
  connectionSummary: { padding: 18, backgroundColor: '#e8eddf', borderRadius: 9, marginBottom: 30 },
  summaryHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 7, height: 7, backgroundColor: '#8d967d', borderRadius: 4 }, connectedDot: { backgroundColor: '#3e7350' },
  summaryTitle: { fontFamily: type.bold, color: '#34513d', fontSize: 14, flex: 1 }, summaryBody: { fontFamily: type.regular, color: '#5c6b52', fontSize: 12, lineHeight: 19, marginTop: 8 }, connectionHost: { fontFamily: type.medium, color: '#4b6048', fontSize: 12, marginTop: 8 },
  step: { flexDirection: 'row', gap: 15, paddingBottom: 27 }, stepNumber: { fontFamily: type.medium, color: '#9b8152', fontSize: 12, paddingTop: 3 }, stepContent: { flex: 1, minWidth: 0 }, stepTitle: { fontFamily: type.bold, fontSize: 16, lineHeight: 23, color: colors.ink, marginBottom: 8 }, body: { fontFamily: type.regular, color: '#5f6959', fontSize: 14, lineHeight: 22 }, hint: { fontFamily: type.regular, fontSize: 12, lineHeight: 19, color: '#6a745f', marginTop: 8 },
  outlineButton: { minHeight: 48, borderWidth: 1, borderColor: '#c7ceba', borderRadius: 7, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, marginTop: 14 }, outlineButtonText: { fontFamily: type.bold, fontSize: 13, color: '#36513a' },
  configInput: { minHeight: 180, maxHeight: 240, borderWidth: 1, borderColor: '#cdd3c2', borderRadius: 8, padding: 13, backgroundColor: '#fffdf7', fontFamily: type.regular, fontSize: 12, lineHeight: 19, color: '#344936', marginTop: 14 }, primaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 7, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 14 }, primaryButtonText: { fontFamily: type.bold, color: '#f5f1e7', fontSize: 13 }, disabled: { opacity: 0.5 },
  placements: { borderTopWidth: 1, borderTopColor: '#d8dccb', paddingTop: 22 }, sectionLabel: { fontFamily: type.bold, color: '#6b775f', fontSize: 10, letterSpacing: 1.1, marginBottom: 6 }, placement: { paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: '#dfe2d4' }, placementTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, placementName: { fontFamily: type.medium, fontSize: 14, color: colors.ink, flex: 1 }, ratio: { fontFamily: type.medium, fontSize: 11, color: '#7a846e' }, placementKey: { fontFamily: type.regular, fontSize: 11, color: '#79836c', marginTop: 4 }, source: { fontFamily: type.bold, fontSize: 12, lineHeight: 19, color: '#3e6544', marginTop: 9 },
  feedback: { padding: 15, borderLeftWidth: 2, borderLeftColor: '#b9753d', backgroundColor: '#f0e7d7', marginTop: 20 }, error: { fontFamily: type.medium, color: '#8d492e', fontSize: 13, lineHeight: 20 }, notice: { fontFamily: type.regular, color: '#4a6a44', fontSize: 13, lineHeight: 21, marginTop: 20 }, connectionActions: { marginTop: 12 }, disconnectButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 6 }, disconnectText: { fontFamily: type.medium, color: '#74573a', fontSize: 13 },
});
