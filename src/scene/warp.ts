// The warp: a short hyperspace sequence inspired by Star Wars and Mass Effect.
//   anticipation → the stars stretch slightly and the view tightens,
//   burst        → long streaks shoot outward from the centre, the view widens,
//   flash        → a brief blue-white flash at the height of the burst,
//   settle       → the streaks collapse back into stars.
// One look, three ways to set it off:
//   - scrolling away from the sun (driven by the clock or the scroll, whichever is further),
//   - the "Scroll to begin the journey" link (timed: BEGIN_SECONDS),
//   - the "Return to Sun" button (timed: RETURN_SECONDS).
// Pure timing, so it's testable.

import { smoothstep } from './director';

export const WARP = { duration: 1.6, stretch: 1, fov: 12, flash: 0.55 };

/** "Scroll to begin the journey": slow enough to actually see what happens. */
export const BEGIN_SECONDS = 1.5;
/** "Return to Sun". */
export const RETURN_SECONDS = 1.8;

/**
 * The stretch of the hero's departure (0..1) the scroll-driven warp lives in: from just after
 * the name has faded (30%) to just before About arrives.
 */
export const WARP_ZONE = { start: 0.35, end: 0.95 };

/** End of the anticipation, peak of the burst, start of the settle (fractions of the sequence). */
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

/** Where `value` is within [start, end], as 0..1. */
export function scrollDrive(value: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (value - start) / (end - start)));
}

/**
 * How far through the warp we are: whichever is further along, the clock or the scroll.
 * Scroll slowly and it plays at its own pace; scroll fast and the scroll pushes it, so it
 * always finishes as the next section arrives — never behind it.
 */
export function warpProgress(timeProgress: number, scrollProgress: number): number {
  return Math.min(1, Math.max(timeProgress, scrollProgress));
}

/** Warp state after `seconds` at the standard pace. */
export function warpState(seconds: number): WarpState {
  return warpStateAt(seconds / WARP.duration);
}

/** Warp state at progress `u` (0..1) through the sequence. */
export function warpStateAt(u: number): WarpState {
  if (u >= 1) return { stretch: 0, fov: 0, flash: 0, done: true };

  const settle = 1 - smoothstep(SETTLE, 1, u);
  const anticipating = u < ANTICIPATION;
  const lead = smoothstep(0, ANTICIPATION, u);
  const burst = smoothstep(ANTICIPATION, BURST_PEAK, u);

  const stretch = (anticipating ? 0.15 * lead : 0.15 + 0.85 * burst) * settle * WARP.stretch;
  const fov = (anticipating ? -2 * lead : -2 + (WARP.fov + 2) * burst) * settle;
  const flash = WARP.flash * smoothstep(0.42, 0.5, u) * (1 - smoothstep(0.5, 0.66, u));
  // (+ 0 turns a -0 at the very start into a plain 0.)
  return { stretch, fov: fov + 0, flash, done: false };
}

/**
 * Scroll position during a button warp: eases from `from` to `to` (slow start, fast middle,
 * gentle arrival) as `u` goes 0 → 1, so the page glides in step with the warp.
 */
export function travelScroll(from: number, to: number, u: number): number {
  const t = Math.min(1, Math.max(0, u));
  const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  return from + (to - from) * eased;
}

/** True when `value` has just passed `threshold` going down the page (it only increases downward). */
export function crossedDown(previous: number, value: number, threshold: number): boolean {
  return previous < threshold && value >= threshold;
}
