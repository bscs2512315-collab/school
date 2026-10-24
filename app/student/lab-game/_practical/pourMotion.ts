// The action timer and both 3D scenes use one timeline so the beaker, stream,
// receiving tube, and result transition stay in sync on every device.
export const POUR_MOVE_END = 1.6;
export const POUR_TILT_END = 2.7;
export const POUR_FLOW_END = 5.8;
export const POUR_RETURN_END = 6.9;
export const POUR_ACTION_MS = 7000;

export function smoothPourStep(start: number, end: number, time: number): number {
  const t = Math.max(0, Math.min(1, (time - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function transferredFraction(time: number): number {
  return smoothPourStep(POUR_TILT_END, POUR_FLOW_END, time);
}
