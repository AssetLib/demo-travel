export type GardenState = 'empty' | 'started' | 'growing' | 'complete';

// Progress belongs to the app. Assetlib only supplies artwork for this finite set.
export function selectGardenState(done: number, total: number): GardenState {
  if (total <= 0 || done <= 0) return 'empty';
  if (done >= total) return 'complete';
  return done / total <= 1 / 3 ? 'started' : 'growing';
}
