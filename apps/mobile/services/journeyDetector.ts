// Snaps a coordinate to a ~50 m grid cell.
// At mid-latitudes, 0.00045° ≈ 50 m.
const GRID_DEG = 0.00045;

export function snapToGrid(coord: number): number {
  return Math.round(coord / GRID_DEG) * GRID_DEG;
}

// Speed threshold above which we consider the device to be on a train.
// Trains rarely travel below 20 km/h while in service; cars average lower on city streets.
const TRAIN_SPEED_KMH = 20;

export function isTrainSpeed(speedKmh: number | null): boolean {
  if (speedKmh == null) return false;
  return speedKmh >= TRAIN_SPEED_KMH;
}
