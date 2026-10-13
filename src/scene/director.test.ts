import { describe, expect, it } from 'vitest';
import { cameraDistanceForDiameter, damp, departureProgress, textOpacity } from './director';

describe('departureProgress', () => {
  // Hero is 2 screens tall (1600px) in an 800px viewport, so there is 800px of pinned scrolling.
  const heroHeight = 1600;
  const viewport = 800;

  it('is 0 while the hero top is at the top of the screen', () => {
    expect(departureProgress(0, heroHeight, viewport)).toBe(0);
  });

  it('is 0.5 halfway through the pinned scroll', () => {
    expect(departureProgress(-400, heroHeight, viewport)).toBe(0.5);
  });

  it('is 1 when About arrives (pinned scroll used up)', () => {
    expect(departureProgress(-800, heroHeight, viewport)).toBe(1);
  });

  it('stays at 1 after scrolling past the hero', () => {
    expect(departureProgress(-3000, heroHeight, viewport)).toBe(1);
  });

  it('is 0 when the hero is not taller than the screen (no departure zone)', () => {
    expect(departureProgress(-200, 800, 800)).toBe(0);
  });
});

describe('textOpacity', () => {
  it('is fully visible at the start', () => {
    expect(textOpacity(0)).toBe(1);
  });

  it('is gone by 30% of the departure', () => {
    expect(textOpacity(0.3)).toBe(0);
    expect(textOpacity(0.8)).toBe(0);
  });

  it('fades smoothly in between', () => {
    const mid = textOpacity(0.15);
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.8);
  });
});

describe('damp', () => {
  it('moves part of the way toward the target each frame', () => {
    const next = damp(0, 10, 6, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it('gives the same result regardless of frame rate', () => {
    let at30 = 0;
    for (let i = 0; i < 30; i++) at30 = damp(at30, 10, 6, 1 / 30);
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = damp(at60, 10, 6, 1 / 60);
    expect(at30).toBeCloseTo(at60, 6);
  });
});

describe('cameraDistanceForDiameter', () => {
  it('places the camera so a sphere appears at the requested size on screen', () => {
    // radius 1, 45° vertical field of view, 800px tall viewport, 400px wanted
    const d = cameraDistanceForDiameter(1, 45, 800, 400);
    const pixelsPerUnit = 800 / 2 / (d * Math.tan((45 * Math.PI) / 360));
    expect(2 * pixelsPerUnit).toBeCloseTo(400, 6);
  });
});
