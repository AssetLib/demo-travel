import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePublicConfig, type AssetlibConfig, type AssetStatus, type ClientStatus } from '@assetlib/sdk-core';
import { AssetlibImage, AssetlibStateImage, createExpoAssetClient, type AssetlibImageProps } from '@assetlib/sdk-expo';
import { Image as BundledImage } from 'expo-image';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

const STORAGE_KEY = '@assetlib/mobile-lab/public-config/v1';
const ALLOW_LOOPBACK = process.env.EXPO_PUBLIC_ASSETLIB_ALLOW_LOOPBACK === 'true';
const CONFIG_FIELDS = new Set(['schemaVersion', 'orgId', 'appId', 'environment', 'manifestUrl', 'pinnedPublicKey', 'keyId', 'pinnedPublicKeys', 'keyIds']);
type Client = ReturnType<typeof createExpoAssetClient>;
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

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 240) : 'The connection could not be checked. Your bundled artwork is still available.';
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
  const operation = useRef(0);
  const clientRef = useRef<Client | null>(null);

  const activate = useCallback(async (nextConfig: AssetlibConfig, persist: boolean) => {
    const currentOperation = ++operation.current;
    const nextClient = createExpoAssetClient(nextConfig, { allowVector: Platform.OS === 'web', allowInsecureLoopback: ALLOW_LOOPBACK });
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
      if (result.error) setError(result.error);
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
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;
        if (saved) await activate(readPublicConfig(saved), false);
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
    try { await activate(readPublicConfig(text), true); }
    catch (caught) { setError(messageFor(caught)); }
  }, [activate, busy, hydrating]);

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
      if (result.error) setError(result.error);
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

  return <ConnectionContext.Provider value={{ config, client, status, assets, busy, hydrating, revision, error, notice, connect, disconnect, refresh, reportAsset }}>{children}</ConnectionContext.Provider>;
}

export function useAssetConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('AssetConnectionProvider is required.');
  return context;
}

// Both sample palettes are light only (app.json sets userInterfaceStyle), so request light
// artwork instead of the SDK's default of following the system color scheme.
export const APP_APPEARANCE = 'light';

export function ManagedArtwork({ asset, fallback, appearance = APP_APPEARANCE, ...props }: Omit<AssetlibImageProps, 'client' | 'revision' | 'onStatus'>) {
  const { client, revision, reportAsset } = useAssetConnection();
  const onStatus = useCallback((next: AssetStatus) => { if (client) reportAsset(asset.key, next, client); }, [asset.key, client, reportAsset]);
  if (!client) return <BundledImage {...props} source={fallback} />;
  return <AssetlibImage {...props} client={client} asset={asset} fallback={fallback} appearance={appearance} revision={revision} onStatus={onStatus} />;
}

export function ManagedStateArtwork({ asset, state, fallbacks, appearance = APP_APPEARANCE, ...props }: Omit<ComponentProps<typeof AssetlibStateImage>, 'client' | 'revision' | 'onStatus'>) {
  const { client, revision, reportAsset } = useAssetConnection();
  const onStatus = useCallback((next: AssetStatus) => { if (client) reportAsset(asset.key, next, client); }, [asset.key, client, reportAsset]);
  if (!client) return <BundledImage {...props} source={fallbacks[state]} />;
  return <AssetlibStateImage {...props} client={client} asset={asset} state={state} fallbacks={fallbacks} appearance={appearance} revision={revision} onStatus={onStatus} />;
}

export function sourceLabel(status: AssetStatus | undefined, connected: boolean): string {
  if (!status) return connected ? 'Open this screen to load' : 'Bundled';
  return status.source === 'remote' ? 'Downloaded' : status.source === 'cache' ? 'Verified cache' : 'Bundled fallback';
}
