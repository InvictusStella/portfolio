// Solar activity schedule: where prominences and flares are at a given moment.
// Pure functions of time (no randomness at runtime), so they're testable and the
// same moment always looks the same.

import { smoothstep } from './director';

export const PROMINENCE_COUNT = 5;
export const FLARE_COUNT = 2;

/** Nothing appears within this angle of horizontal: that's where the name and tagline sit. */
const KEEP_OUT = (25 * Math.PI) / 180;

/** Repeatable pseudo-random number in [0, 1) for a given (slot, cycle) pair. */
function hash(slot: number, cycle: number, salt: number): number {
  const x = Math.sin(slot * 127.1 + cycle * 311.7 + salt * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Nothing appears within this angle of straight down: the scroll hint sits just below the sun. */
const HINT_KEEP_OUT = (30 * Math.PI) / 180;

/**
 * Stretches of the sun's edge where activity may appear (0 = right, π/2 = top): the whole
 * top, and two shorter stretches at the bottom either side of the gap above the scroll hint.
 */
const ALLOWED: [number, number][] = [
  [KEEP_OUT, Math.PI - KEEP_OUT],
  [Math.PI + KEEP_OUT, 1.5 * Math.PI - HINT_KEEP_OUT],
  [1.5 * Math.PI + HINT_KEEP_OUT, 2 * Math.PI - KEEP_OUT],
];

/**
 * An angle whose whole span (± margin) fits inside an allowed stretch. Stretches too short
 * for the span are skipped (wide arcs then always go on top); the rest are picked in
 * proportion to their length.
 */
function allowedAngle(u: number, margin: number): number {
  const fits = ALLOWED.map(([a, b]) => [a + margin, b - margin] as const).filter(([a, b]) => b > a);
  const total = fits.reduce((sum, [a, b]) => sum + (b - a), 0);
  let along = u * total;
  for (const [a, b] of fits) {
    if (along <= b - a) return a + along;
    along -= b - a;
  }
  return fits[fits.length - 1][1];
}

/** Where cycle `k` of a slot is, and how far through it we are (0..1). */
function cycleAt(time: number, duration: number, offset: number) {
  const t = time / duration + offset;
  const cycle = Math.floor(t);
  return { cycle, phase: t - cycle };
}

export type Prominence = {
  /** Centre of the arc around the edge, radians. */
  angle: number;
  /** Half the angular span between the arc's two feet, radians. */
  width: number;
  /** Peak height above the surface, in sun radii. */
  height: number;
  /** 0 (invisible) → 1 (fully visible). */
  life: number;
  /** Per-arc random value for shader variation. */
  seed: number;
};

/** State of prominence `slot` at `time` seconds. */
export function prominenceState(slot: number, time: number): Prominence {
  const duration = 9 + 3 * slot;
  const { cycle, phase } = cycleAt(time, duration, slot * 0.37);
  const width = 0.16 + 0.2 * hash(slot, cycle, 1);
  const maxHeight = 0.15 + 0.18 * hash(slot, cycle, 2);
  return {
    angle: allowedAngle(hash(slot, cycle, 3), width),
    width,
    // Rises out of the surface over the first 40% of its life.
    height: maxHeight * smoothstep(0, 0.4, phase),
    // Fades in, holds, fades out — then a short gap before it reappears elsewhere.
    life: smoothstep(0, 0.2, phase) * (1 - smoothstep(0.7, 0.9, phase)),
    seed: hash(slot, cycle, 4),
  };
}

export type Flare = {
  /** Where on the edge the flare happens, radians. */
  angle: number;
  /** 0 (nothing) → 1 (peak). */
  strength: number;
};

/** State of flare `slot` at `time` seconds: a quick flash that decays over a couple of seconds. */
export function flareState(slot: number, time: number): Flare {
  const duration = 11 + 6 * slot;
  const { cycle, phase } = cycleAt(time, duration, 0.5 + slot * 0.21);
  const start = 0.1 + 0.6 * hash(slot, cycle, 5); // when in the cycle it goes off
  const since = (phase - start) * duration; // seconds since it went off
  const strength =
    since < 0 ? 0 : smoothstep(0, 0.4, since) * Math.exp(-Math.max(0, since - 0.4) / 0.8);
  return { angle: allowedAngle(hash(slot, cycle, 6), 0), strength };
}
