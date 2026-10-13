import { describe, expect, it } from 'vitest';
import { layoutConstellation, SCORPIUS, toPercent } from './constellation';

describe('layoutConstellation (Scorpius)', () => {
  it('is deterministic', () => {
    expect(layoutConstellation(6)).toEqual(layoutConstellation(6));
  });

  it('uses the 15 main stars of Scorpius, from the stinger to the claws', () => {
    expect(SCORPIUS).toHaveLength(15);
    expect(SCORPIUS[0].name).toBe('Lesath');
    expect(SCORPIUS[10].name).toBe('Antares'); // the heart is the 11th project
    expect(SCORPIUS[14].name).toBe('Fang');
  });

  it('never moves existing stars when a project is added', () => {
    const before = layoutConstellation(4).points;
    const after = layoutConstellation(5).points;
    expect(after.slice(0, 4)).toEqual(before);
  });

  it('places the stinger low on the chart and the claws high (north up)', () => {
    const { points } = layoutConstellation(15);
    const antares = points[10];
    const lesath = points[0];
    const acrab = points[13];
    expect(lesath.y).toBeGreaterThan(antares.y); // screen y grows downward
    expect(acrab.y).toBeLessThan(antares.y);
  });

  it('places east on the left, as on a sky chart (the tail is east of the claws)', () => {
    const { points } = layoutConstellation(15);
    expect(points[0].x).toBeLessThan(points[14].x);
  });

  it('only draws figure lines between stars that exist', () => {
    expect(layoutConstellation(1).segments).toEqual([]);
    expect(layoutConstellation(3).segments).toEqual([
      [0, 1],
      [1, 2],
    ]);
    for (const [a, b] of layoutConstellation(9).segments) {
      expect(a).toBeLessThan(9);
      expect(b).toBeLessThan(9);
    }
  });

  it('branches the claws from Dschubba', () => {
    const { segments } = layoutConstellation(15);
    const dschubba = SCORPIUS.findIndex((s) => s.name === 'Dschubba');
    const acrab = SCORPIUS.findIndex((s) => s.name === 'Acrab');
    const fang = SCORPIUS.findIndex((s) => s.name === 'Fang');
    expect(segments).toContainEqual([dschubba, acrab]);
    expect(segments).toContainEqual([dschubba, fang]);
    expect(segments).toHaveLength(14);
  });

  for (const count of [1, 2, 4, 11, 15, 18]) {
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

  it('keeps stars far enough apart to tap separately, even past 15 projects', () => {
    for (const count of [15, 18]) {
      const { points, box } = layoutConstellation(count);
      const scale = Math.max(box.width, box.height);
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const d =
            Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) /
            scale;
          expect(d).toBeGreaterThan(0.045);
        }
      }
    }
  });

  it('frames a sensible shape, never a thin strip', () => {
    for (const count of [1, 2, 3, 4, 11, 15]) {
      const { box } = layoutConstellation(count);
      const aspect = box.width / box.height;
      expect(aspect).toBeGreaterThanOrEqual(1);
      expect(aspect).toBeLessThanOrEqual(1.8);
    }
  });

  it('gives an empty layout for no projects', () => {
    expect(layoutConstellation(0).points).toEqual([]);
    expect(layoutConstellation(0).segments).toEqual([]);
  });
});

describe('toPercent', () => {
  it('converts a point to percentages of the framed area', () => {
    const box = { x: -1, y: -2, width: 4, height: 8 };
    expect(toPercent({ x: 1, y: 2 }, box)).toEqual({ left: 50, top: 50 });
    expect(toPercent({ x: -1, y: -2 }, box)).toEqual({ left: 0, top: 0 });
  });
});
