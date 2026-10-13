import { describe, expect, it } from 'vitest';
import { generateStars, seededRandom } from './starfield';

describe('seededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives a different sequence for a different seed', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it('stays within [0, 1)', () => {
    const r = seededRandom(7);
    for (let i = 0; i < 10_000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateStars', () => {
  const bounds = { x: [-10, 10], y: [-50, 10], z: [-60, -5] } as const;

  it('makes the requested number of stars', () => {
    const stars = generateStars(500, 3, bounds);
    expect(stars.positions).toHaveLength(500 * 3);
    expect(stars.sizes).toHaveLength(500);
    expect(stars.colors).toHaveLength(500 * 3);
  });

  it('is identical on every visit (seeded)', () => {
    expect(generateStars(100, 3, bounds)).toEqual(
      generateStars(100, 3, bounds),
    );
  });

  it('keeps every star inside the bounds', () => {
    const { positions } = generateStars(2000, 9, bounds);
    for (let i = 0; i < positions.length; i += 3) {
      expect(positions[i]).toBeGreaterThanOrEqual(-10);
      expect(positions[i]).toBeLessThanOrEqual(10);
      expect(positions[i + 1]).toBeGreaterThanOrEqual(-50);
      expect(positions[i + 1]).toBeLessThanOrEqual(10);
      expect(positions[i + 2]).toBeGreaterThanOrEqual(-60);
      expect(positions[i + 2]).toBeLessThanOrEqual(-5);
    }
  });

  it('has mostly small stars and only a few big ones, like the real sky', () => {
    const { sizes } = generateStars(2000, 5, bounds);
    const big = sizes.filter((s) => s > 2).length;
    expect(big / sizes.length).toBeLessThan(0.1);
    expect(big).toBeGreaterThan(0);
  });
});
