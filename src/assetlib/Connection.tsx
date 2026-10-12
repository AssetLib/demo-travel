import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePublicConfig, type AssetlibConfig, type AssetRef, type AssetStatus, type ClientStatus } from '@assetlib/sdk-core';
import { AssetlibImage, AssetlibStateImage, createExpoAssetClient, type AssetlibImageProps } from '@assetlib/sdk-expo';
import { Image as BundledImage } from 'expo-image';
import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

const STORAGE_KEY = '@assetlib/mobile-lab/public-config/v1';
const USAGE_REPORTING_KEY = '@assetlib/mobile-lab/usage-reporting/v1';
const ALLOW_LOOPBACK = process.env.EXPO_PUBLIC_ASSETLIB_ALLOW_LOOPBACK === 'true';
const CONFIG_FIELDS = new Set(['schemaVersion', 'orgId', 'appId', 'environment', 'manifestUrl', 'pinnedPublicKey', 'keyId', 'pinnedPublicKeys', 'keyIds']);
type Client = ReturnType<typeof createExpoAssetClient>;
type ClientOptions = NonNullable<Parameters<typeof createExpoAssetClient>[1]>;

// Usage reporting is the SDK's opt-in telemetry: placement keys, resolve and display counts and a random
// install ID go to the connected workspace, never a person or device identifier. Off until the person turns
// it on in Connect; the console's Where used then shows what this app resolved and displayed, per build.
function telemetryOptions(enabled: boolean): ClientOptions['telemetry'] {
  if (!enabled) return undefined;
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  const expo = Constants.expoConfig;
  const buildNumber = platform === 'ios' ? expo?.ios?.buildNumber : platform === 'android' ? expo?.android?.versionCode?.toString() : undefined;
  return { enabled: true, build: { platform, appVersion: expo?.version ?? 'unknown', buildNumber: buildNumber ?? 'unknown' } };
}
type Connection = {
  config: AssetlibConfig | null;
  client: Client | null;
  status: ClientStatus | null;
  assets: Record<string, AssetStatus>;
  busy: boolean;
  hydrating: boolean;
  revision: number;
  error: string | null;
  notice: string | null;
  usageReporting: boolean;
  setUsageReporting: (enabled: boolean) => Promise<void>;
  connect: (text: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  reportAsset: (key: string, status: AssetStatus, owner: Client) => void;
};

const ConnectionContext = createContext<Connection | null>(null);

export function readPublicConfig(text: string): AssetlibConfig {
  if (!text.trim()) throw new Error('Paste the public SDK config from your app in Assetlib.');
  if (text.length > 16_384) throw new Error('This config is too large. Copy only the public SDK config.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('This is not valid JSON. Copy the complete public SDK config.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Use the public SDK config object from Assetlib.');
  if (Object.keys(input).some(key => !CONFIG_FIELDS.has(key))) throw new Error('Only public SDK config is accepted. Do not include passwords, private keys, or admin tokens.');
  return parsePublicConfig(input, { allowInsecureLoopback: ALLOW_LOOPBACK });
}

// The SDK passes transport failures through in the platform's own words, for example
// "fetch failed: java.net.UnknownHostException: …" from expo/fetch on Android, or
// "Failed to fetch" in a browser. Show plain copy for those. Keep the SDK's verification
// and HTTP messages, which are already written for people.
const TRANSPORT_FAILURE = /fetch failed|failed to fetch|network request failed|networkerror|load failed|internet connection appears to be offline|java\.(?:net|io)\./i;
const UNREACHABLE = 'Assetlib could not be reached. Check this device’s connection.';

export function plainError(message: string): string {
  if (!TRANSPORT_FAILURE.test(message)) return message.slice(0, 240);
  return message.startsWith('Using bundled artwork.') ? `Using bundled artwork. ${UNREACHABLE}` : UNREACHABLE;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? plainError(error.message) : 'The connection could not be checked. Your bundled artwork is still available.';
}

export function AssetConnectionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AssetlibConfig | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<ClientStatus | null>(null);
  const [assets, setAssets] = useState<Record<string, AssetStatus>>({});
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usageReporting, setUsageReportingState] = useState(false);
  const operation = useRef(0);
  const clientRef = useRef<Client | null>(null);

  const activate = useCallback(async (nextConfig: AssetlibConfig, persist: boolean, reporting: boolean) => {
    const currentOperation = ++operation.current;
    const nextClient = createExpoAssetClient(nextConfig, { allowVector: Platform.OS === 'web', allowInsecureLoopback: ALLOW_LOOPBACK, telemetry: telemetryOptions(reporting) });
    clientRef.current?.dispose();
    clientRef.current = nextClient;
    setClient(nextClient);
    setConfig(nextConfig);
    setAssets({});
    setStatus(null);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (persist) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
      await nextClient.initialize();
      if (operation.current !== currentOperation) return;
      setStatus(nextClient.getStatus());
      setRevision(value => value + 1);
      const result = await nextClient.refresh();
      if (operation.current !== currentOperation) return;
      setStatus(nextClient.getStatus());
      setRevision(value => value + 1);
      if (result.error) setError(plainError(result.error));
      else setNotice('Connection checked. Open a sample to see its artwork.');
    } catch (caught) {
      if (operation.current !== currentOperation) return;
      setStatus(nextClient.getStatus());
      setError(messageFor(caught));
    } finally {
      if (operation.current === currentOperation) setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [saved, reporting] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(USAGE_REPORTING_KEY)]);
        if (!active) return;
        const enabled = reporting === 'on';
        setUsageReportingState(enabled);
        if (saved) await activate(readPublicConfig(saved), false, enabled);
      } catch {
        if (active) setError('The saved connection could not be restored. Paste your public config again.');
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => { active = false; operation.current += 1; };
  }, [activate]);

  const connect = useCallback(async (text: string) => {
    if (busy || hydrating) return;
    try { await activate(readPublicConfig(text), true, usageReporting); }
    catch (caught) { setError(messageFor(caught)); }
  }, [activate, busy, hydrating, usageReporting]);

  /* The setting is remembered beside the config. A connected app gets a new client, so the change applies at once:
     turning it on starts reporting from the next resolution; turning it off drops anything not yet sent. */
  const setUsageReporting = useCallback(async (enabled: boolean) => {
    if (busy || hydrating) return;
    setUsageReportingState(enabled);
    try { await AsyncStorage.setItem(USAGE_REPORTING_KEY, enabled ? 'on' : 'off'); }
    catch { setError('The usage-reporting setting could not be saved on this device.'); }
    if (config) await activate(config, false, enabled);
  }, [activate, busy, config, hydrating]);

  const refresh = useCallback(async () => {
    const activeClient = clientRef.current;
    if (!activeClient || busy || hydrating) return;
    const currentOperation = ++operation.current;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await activeClient.refresh();
      if (operation.current !== currentOperation) return;
      setStatus(activeClient.getStatus());
      setRevision(value => value + 1);
      if (result.error) setError(plainError(result.error));
      else setNotice(result.updated ? 'New release received. Open a sample to load its artwork.' : 'This app has the latest published release.');
    } catch (caught) {
      if (operation.current === currentOperation) setError(messageFor(caught));
    } finally {
      if (operation.current === currentOperation) setBusy(false);
    }
  }, [busy, hydrating]);

  const disconnect = useCallback(async () => {
    if (busy || hydrating) return;
    ++operation.current;
    clientRef.current?.dispose();
    clientRef.current = null;
    setClient(null);
    setConfig(null);
    setStatus(null);
    setAssets({});
    setRevision(value => value + 1);
    setError(null);
    setNotice('Disconnected. The samples now use bundled artwork. Previously verified cache is retained on this device.');
    try { await AsyncStorage.removeItem(STORAGE_KEY); }
    catch { setError('The saved config could not be removed from local storage. Clear app data to prevent restoring it after restart.'); }
  }, [busy, hydrating]);

  const reportAsset = useCallback((key: string, next: AssetStatus, owner: Client) => {
    if (clientRef.current !== owner) return;
    setAssets(current => {
      const previous = current[key];
      if (previous?.source === next.source && previous?.sequence === next.sequence && previous?.message === next.message && previous?.sha256 === next.sha256 && previous?.assetId === next.assetId) return current;
      return { ...current, [key]: next };
    });
  }, []);

  return <ConnectionContext.Provider value={{ config, client, status, assets, busy, hydrating, revision, error, notice, usageReporting, setUsageReporting, connect, disconnect, refresh, reportAsset }}>{children}</ConnectionContext.Provider>;
}

export function useAssetConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('AssetConnectionProvider is required.');
  return context;
}

// Both sample palettes are light only (app.json sets userInterfaceStyle), so request light
// artwork instead of the SDK's default of following the system color scheme.
export const APP_APPEARANCE = 'light';

export function ManagedArtwork<R extends AssetRef>({ asset, fallback, appearance = APP_APPEARANCE, ...props }: Omit<AssetlibImageProps<R>, 'client' | 'revision' | 'onStatus'>) {
  const { client, revision, reportAsset } = useAssetConnection();
  const onStatus = useCallback((next: AssetStatus) => { if (client) reportAsset(asset.key, next, client); }, [asset.key, client, reportAsset]);
  if (!client) return <BundledImage {...props} source={fallback} />;
  return <AssetlibImage<AssetRef> {...props} client={client} asset={asset} fallback={fallback} appearance={appearance} revision={revision} onStatus={onStatus} />;
}

export function ManagedStateArtwork({ asset, state, fallbacks, appearance = APP_APPEARANCE, ...props }: Omit<ComponentProps<typeof AssetlibStateImage>, 'client' | 'revision' | 'onStatus'>) {
  const { client, revision, reportAsset } = useAssetConnection();
  const onStatus = useCallback((next: AssetStatus) => { if (client) reportAsset(asset.key, next, client); }, [asset.key, client, reportAsset]);
  if (!client) return <BundledImage {...props} source={fallbacks[state]} />;
  return <AssetlibStateImage {...props} client={client} asset={asset} state={state} fallbacks={fallbacks} appearance={appearance} revision={revision} onStatus={onStatus} />;
}

// Only a 404 for the manifest says the app has no published release in this environment yet; the SDK reports it
// as "Assetlib delivery returned 404.". Any other failure (no network, a host that does not resolve, a timeout, a
// server error, a release that fails verification) means the connection could not be checked, which says nothing
// about whether a release exists. An unrecognized message falls to that wording too. A device that already holds a
// verified release keeps showing it after a failed check, so the title names that release and what the check found.
const NO_PUBLISHED_RELEASE = /delivery returned 404\b/;

export type ConnectionSummary = { title: string; live: boolean };

export function connectionSummary(config: AssetlibConfig | null, status: ClientStatus | null, busy: boolean, hydrating: boolean): ConnectionSummary {
  if (hydrating) return { title: 'Restoring your connection', live: false };
  if (!config) return { title: 'Using bundled artwork', live: false };
  const sequence = status?.sequence ?? 0;
  const lastError = status?.lastError ?? null;
  const noRelease = lastError !== null && NO_PUBLISHED_RELEASE.test(lastError);
  if (sequence) {
    if (!lastError) return { title: `Release ${sequence}`, live: true };
    return { title: `Release ${sequence} · ${noRelease ? 'no published release found' : 'connection could not be checked'}`, live: false };
  }
  if (busy) return { title: 'Checking connection', live: false };
  if (noRelease) return { title: 'Waiting for a published release', live: false };
  return { title: 'Connection could not be checked', live: false };
}

export function sourceLabel(status: AssetStatus | undefined, connected: boolean): string {
  if (!status) return connected ? 'Open this screen to load' : 'Bundled';
  return status.source === 'remote' ? 'Downloaded' : status.source === 'cache' ? 'Verified cache' : 'Bundled fallback';
}
