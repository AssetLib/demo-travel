import { Redirect } from 'expo-router';

export default function Index() {
  const variant = process.env.EXPO_PUBLIC_ASSETLIB_DEMO ?? 'travel';
  return <Redirect href={variant === 'todo' ? '/tasks' : '/travel'} />;
}
