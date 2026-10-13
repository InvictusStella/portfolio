// Warp jumps: short, triggered sequences inspired by Star Wars hyperspace and Mass Effect
// relay jumps. Pure timing, so it's testable:
//   anticipation → the stars stretch slightly and the view tightens,
//   burst        → long streaks shoot outward from the centre, the view widens,
//   flash        → a brief blue-white flash at the height of the burst,
//   settle       → the streaks collapse back into stars.
// Phases are fractions of the duration, so the small jump is the same move, faster and gentler.

import { smoothstep } from './director';

export type WarpKind = 'big' | 'small';

export const WARPS: Record<WarpKind, { duration: number; stretch: number; fov: number; flash: number }> = {
  // Leaving the sun.
  big: { duration: 1.6, stretch: 1, fov: 12, flash: 0.55 },
  // Into the star chart.
  small: { duration: 0.9, stretch: 0.55, fov: 6, flash: 0.25 },
};

/** End of the anticipation, peak of the burst, start of the settle (fractions of the duration). */
const ANTICIPATION = 0.156;
const BURST_PEAK = 0.4;
const SETTLE = 0.56;

export type WarpState = {
  /** 0 = stars are points → 1 = full-length streaks. */
  stretch: number;
  /** Change in field of view, degrees (negative = tighter). */
  fov: number;
  /** 0..1 strength of the flash. */
  flash: number;
  done: boolean;
};

export function warpState(kind: WarpKind, seconds: number): WarpState {
  const config = WARPS[kind];
  const u = seconds / config.duration;
  if (u >= 1) return { stretch: 0, fov: 0, flash: 0, done: true };

  const settle = 1 - smoothstep(SETTLE, 1, u);
  const anticipating = u < ANTICIPATION;
  const lead = smoothstep(0, ANTICIPATION, u);
  const burst = smoothstep(ANTICIPATION, BURST_PEAK, u);

  const stretch = (anticipating ? 0.15 * lead : 0.15 + 0.85 * burst) * settle * config.stretch;
  const fov = (anticipating ? -2 * lead : -2 + (config.fov + 2) * burst) * settle;
  const flash = config.flash * smoothstep(0.42, 0.5, u) * (1 - smoothstep(0.5, 0.66, u));
  // (+ 0 turns a -0 at the very start into a plain 0.)
  return { stretch, fov: fov + 0, flash, done: false };
}

/** True when `value` has just passed `threshold` going down the page (it only increases downward). */
export function crossedDown(previous: number, value: number, threshold: number): boolean {
  return previous < threshold && value >= threshold;
}
