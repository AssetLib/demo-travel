import type { ImageSource } from 'expo-image';
import { AppAssets } from '../assets.generated';
import { ManagedStateArtwork } from './Connection';
import { selectGardenState, type GardenState } from './garden-state';
import type { StyleProp, ImageStyle } from 'react-native';

const fallbacks: Record<GardenState, ImageSource> = {
  empty: require('../../assets/task-garden-empty.png'),
  started: require('../../assets/task-garden-started.png'),
  growing: require('../../assets/task-garden-growing.png'),
  complete: require('../../assets/task-garden-complete.png'),
};

const labels: Record<GardenState, string> = {
  empty: 'A planted seed, ready to grow',
  started: 'A small sprout for your first steps',
  growing: 'Your plant is growing as tasks are completed',
  complete: 'A flowering plant: all tasks complete',
};

export function Garden({ done, total, style }: { done: number; total: number; style: StyleProp<ImageStyle> }) {
  const state = selectGardenState(done, total);
  return <ManagedStateArtwork asset={AppAssets.Tasks.garden} state={state} fallbacks={fallbacks} style={style} contentFit="contain" accessibilityLabel={labels[state]} />;
}
