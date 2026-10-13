import { describe, expect, it } from 'vitest';
import { layoutConstellation, toPercent } from './constellation';

describe('layoutConstellation', () => {
  it('is deterministic', () => {
    expect(layoutConstellation(6)).toEqual(layoutConstellation(6));
  });

  it('never moves existing stars when a project is added', () => {
    const before = layoutConstellation(4).points;
    const after = layoutConstellation(5).points;
    expect(after.slice(0, 4)).toEqual(before);
  });

  it('starts at the centre and moves outward (first project in the middle)', () => {
    const { points } = layoutConstellation(10);
    const distance = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);
    expect(distance(points[0])).toBeLessThan(distance(points[9]));
  });

  for (const count of [1, 2, 4, 15]) {
    it(`keeps all ${count} stars inside the framed area`, () => {
      const { points, box } = layoutConstellation(count);
      expect(points).toHaveLength(count);
      for (const p of points) {
        expect(p.x).toBeGreaterThan(box.x);
        expect(p.x).toBeLessThan(box.x + box.width);
        expect(p.y).toBeGreaterThan(box.y);
        expect(p.y).toBeLessThan(box.y + box.height);
      }
    });
  }

  it('keeps stars apart so they never overlap', () => {
    const { points, box } = layoutConstellation(15);
    const scale = Math.max(box.width, box.height);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) / scale;
        expect(d).toBeGreaterThan(0.06);
      }
    }
  });

  it('frames a sensible shape, never a thin strip', () => {
    for (const count of [1, 2, 3, 4, 15]) {
      const { box } = layoutConstellation(count);
      const aspect = box.width / box.height;
      expect(aspect).toBeGreaterThanOrEqual(1);
      expect(aspect).toBeLessThanOrEqual(1.8);
    }
  });

  it('gives an empty layout for no projects', () => {
    expect(layoutConstellation(0).points).toEqual([]);
  });
});

describe('toPercent', () => {
  it('converts a point to percentages of the framed area', () => {
    const box = { x: -1, y: -2, width: 4, height: 8 };
    expect(toPercent({ x: 1, y: 2 }, box)).toEqual({ left: 50, top: 50 });
    expect(toPercent({ x: -1, y: -2 }, box)).toEqual({ left: 0, top: 0 });
  });
});
