import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = process.env.EXPO_PUBLIC_ASSETLIB_DEMO ?? 'travel';
  return {
    ...config,
    name: variant === 'todo' ? 'Daylight — Assetlib demo' : variant === 'travel' ? 'Roam — Assetlib demo' : 'Assetlib Mobile Lab',
    slug: variant === 'todo' ? 'assetlib-demo-todo' : variant === 'travel' ? 'assetlib-demo-travel' : 'assetlib-mobile-lab',
    scheme: variant === 'todo' ? 'assetlib-demo-todo' : variant === 'travel' ? 'assetlib-demo-travel' : config.scheme,
    extra: { ...config.extra, assetlibDemo: variant === 'todo' || variant === 'travel' ? variant : 'lab' },
  };
};
