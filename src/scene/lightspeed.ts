// Lightspeed jumps: when stars stretch into streaks, how strongly, and in which direction.
// Two zones — a big jump leaving the sun, a small one into the star chart — and the
// streaks only appear while you're actually scrolling through them.

import { smoothstep } from './director';

/** Scroll speed (px/s) that gives full-length streaks. Faster than this is capped. */
const FULL_SPEED = 2500;
/** The small jump's strength relative to the big one. */
const SMALL_JUMP = 0.45;

export type LightspeedInput = {
  /** Hero departure progress, 0..1. */
  departure: number;
  /** Top of the projects section relative to the viewport, px. */
  projectsTop: number;
  viewport: number;
  /** Scroll velocity, px/s (either direction). */
  velocity: number;
};

export type Lightspeed = {
  /** 0 = no streaks, 1 = full-length streaks. */
  strength: number;
  /** 1 = streaks point out from the centre (flying away), 0 = vertical (drifting). */
  radial: number;
};

export function lightspeed({ departure, projectsTop, viewport, velocity }: LightspeedInput): Lightspeed {
  // Big jump: the middle stretch of the departure, after the name has gone.
  const big = smoothstep(0.3, 0.5, departure) * (1 - smoothstep(0.85, 1, departure));
  // Small jump: while the projects section scrolls up into view.
  const small =
    smoothstep(viewport, viewport * 0.7, projectsTop) * (1 - smoothstep(viewport * 0.5, viewport * 0.2, projectsTop));

  const speed = Math.min(1, Math.abs(velocity) / FULL_SPEED);
  const strength = Math.min(1, Math.max(big, small * SMALL_JUMP) * speed);
  const radial = big + small > 0 ? (big * 0.85 + small * 0.15) / (big + small) : 0;
  return { strength, radial };
}
