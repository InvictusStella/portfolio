import { describe, expect, it } from 'vitest';
import { FLARE_COUNT, flareState, PROMINENCE_COUNT, prominenceState } from './activity';

/** Angle (radians) measured from the nearest horizontal direction, 0..π/2. */
const fromHorizontal = (angle: number) => {
  const a = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))); // 0..π
  return Math.min(a, Math.PI - a);
};
const KEEP_OUT = (25 * Math.PI) / 180;
/** Angle (radians) from straight down, 0..π. */
const fromBottom = (angle: number) => {
  const a = Math.atan2(Math.sin(angle), Math.cos(angle)); // -π..π
  return Math.abs(a + Math.PI / 2) > Math.PI ? 2 * Math.PI - Math.abs(a + Math.PI / 2) : Math.abs(a + Math.PI / 2);
};
const HINT_KEEP_OUT = (30 * Math.PI) / 180;
const times = Array.from({ length: 2000 }, (_, i) => i * 0.37); // ~12 minutes of samples

describe('prominenceState', () => {
  it('is deterministic: the same time always gives the same arcs', () => {
    expect(prominenceState(2, 41.3)).toEqual(prominenceState(2, 41.3));
  });

  it('never appears near the horizontal band where the name sits', () => {
    for (let i = 0; i < PROMINENCE_COUNT; i++) {
      for (const t of times) {
        const p = prominenceState(i, t);
        if (p.life > 0) expect(fromHorizontal(p.angle)).toBeGreaterThanOrEqual(KEEP_OUT - 1e-9);
      }
    }
  });

  it('keeps its whole span (both feet) out of the name band and away from the scroll hint below', () => {
    for (let i = 0; i < PROMINENCE_COUNT; i++) {
      for (const t of times) {
        const p = prominenceState(i, t);
        if (p.life <= 0) continue;
        for (const edge of [p.angle - p.width, p.angle, p.angle + p.width]) {
          expect(fromHorizontal(edge)).toBeGreaterThanOrEqual(KEEP_OUT - 1e-9);
          expect(fromBottom(edge)).toBeGreaterThanOrEqual(HINT_KEEP_OUT - 1e-9);
        }
      }
    }
  });

  it('still appears on the lower half sometimes (not only on top)', () => {
    const lower = times.filter((t) => Math.sin(prominenceState(1, t).angle) < 0).length;
    expect(lower).toBeGreaterThan(0);
  });

  it('keeps its size in a sensible range (arcs, not giant loops)', () => {
    for (let i = 0; i < PROMINENCE_COUNT; i++) {
      for (const t of times) {
        const p = prominenceState(i, t);
        expect(p.height).toBeGreaterThanOrEqual(0);
        expect(p.height).toBeLessThanOrEqual(0.35);
        expect(p.width).toBeGreaterThan(0.05);
        expect(p.width).toBeLessThan(0.4);
      }
    }
  });

  it('fades in and out instead of popping (life changes gradually)', () => {
    for (let i = 0; i < PROMINENCE_COUNT; i++) {
      let previous = prominenceState(i, 0).life;
      for (let t = 0.05; t < 120; t += 0.05) {
        const life = prominenceState(i, t).life;
        expect(Math.abs(life - previous)).toBeLessThan(0.05);
        previous = life;
      }
    }
  });

  it('moves to a new place after each lifetime', () => {
    const angles = new Set(times.map((t) => prominenceState(0, t).angle.toFixed(3)));
    expect(angles.size).toBeGreaterThan(5);
  });
});

describe('flareState', () => {
  it('is quiet most of the time (flares are occasional)', () => {
    for (let i = 0; i < FLARE_COUNT; i++) {
      const active = times.filter((t) => flareState(i, t).strength > 0.05).length;
      expect(active / times.length).toBeLessThan(0.3);
    }
  });

  it('does happen', () => {
    const peak = Math.max(...times.map((t) => flareState(0, t).strength));
    expect(peak).toBeGreaterThan(0.8);
  });

  it('never flares in the horizontal band where the name sits', () => {
    for (let i = 0; i < FLARE_COUNT; i++) {
      for (const t of times) {
        const f = flareState(i, t);
        if (f.strength > 0) {
          expect(fromHorizontal(f.angle)).toBeGreaterThanOrEqual(KEEP_OUT - 1e-9);
          expect(fromBottom(f.angle)).toBeGreaterThanOrEqual(HINT_KEEP_OUT - 1e-9);
        }
      }
    }
  });

  it('stays between 0 and 1', () => {
    for (const t of times) {
      const s = flareState(0, t).strength;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});
