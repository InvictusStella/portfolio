// Solar activity schedule: where prominences and flares are at a given moment.
// Pure functions of time (no randomness at runtime), so they're testable and the
// same moment always looks the same.

import { smoothstep } from './director';

export const PROMINENCE_COUNT = 8;
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

/**
 * - loop: the classic arc; its height breathes and plasma knots slide along it.
 * - eruptive: keeps rising, lets go of its feet and dissolves into space.
 * - jet: a thin spike that shoots up and fades quickly.
 */
export type ProminenceKind = 'loop' | 'eruptive' | 'jet';

export type Prominence = {
  kind: ProminenceKind;
  /** Centre of the arc around the edge, radians. */
  angle: number;
  /** Half the angular span between the arc's two feet, radians. */
  width: number;
  /** Peak height above the surface, in sun radii. */
  height: number;
  /** 0 (invisible) → 1 (fully visible). */
  life: number;
  /** 0 = anchored at both feet → 1 = feet let go (eruptions only). */
  detach: number;
  /** Per-arc random value for shader variation. */
  seed: number;
};

/** State of prominence `slot` at `time` seconds. A new kind and place each lifetime. */
export function prominenceState(slot: number, time: number): Prominence {
  const duration = 8 + (slot % 4) * 2;
  const { cycle, phase } = cycleAt(time, duration, slot * 0.37);
  const pick = hash(slot, cycle, 7);
  const seed = hash(slot, cycle, 4);
  const r1 = hash(slot, cycle, 1);
  const r2 = hash(slot, cycle, 2);
  const placeU = hash(slot, cycle, 3);

  if (pick >= 0.75) {
    // Jet: shoots up over the first 15% of the cycle and is gone by 45%; then a gap.
    const width = 0.015 + 0.03 * r1;
    return {
      kind: 'jet',
      angle: allowedAngle(placeU, width),
      width,
      height: (0.18 + 0.2 * r2) * smoothstep(0, 0.15, phase),
      life: smoothstep(0, 0.1, phase) * (1 - smoothstep(0.3, 0.45, phase)),
      detach: 0,
      seed,
    };
  }

  if (pick >= 0.5) {
    // Eruption: accelerates upward the whole time; the feet let go from about a third in.
    const width = 0.14 + 0.2 * r1;
    return {
      kind: 'eruptive',
      angle: allowedAngle(placeU, width),
      width,
      height: 0.12 + 0.85 * phase * phase,
      life: smoothstep(0, 0.15, phase) * (1 - smoothstep(0.65, 0.9, phase)),
      detach: smoothstep(0.35, 0.85, phase),
      seed,
    };
  }

  // Loop: rises out of the surface, then its height keeps breathing gently.
  const width = 0.16 + 0.2 * r1;
  const breathing = 1 + 0.08 * Math.sin(time * 0.9 + seed * 6.2832);
  return {
    kind: 'loop',
    angle: allowedAngle(placeU, width),
    width,
    height: (0.15 + 0.18 * r2) * smoothstep(0, 0.4, phase) * breathing,
    life: smoothstep(0, 0.2, phase) * (1 - smoothstep(0.7, 0.9, phase)),
    detach: 0,
    seed,
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
