import { describe, expect, it } from 'vitest';
import {
  cameraDistanceForDiameter,
  chartCalm,
  damp,
  deepSpaceOpacity,
  departureProgress,
  shouldAnimate,
  sunOnScreen,
  sunlightOpacity,
  sunScale,
  sunScreenY,
  textOpacity,
} from './director';

describe('shouldAnimate', () => {
  it('animates while the sun is on screen', () => {
    expect(
      shouldAnimate({ reducedMotion: false, hidden: false, sunOnScreen: true }),
    ).toBe(true);
  });

  it('stops once the sun has left the screen (saves battery)', () => {
    expect(
      shouldAnimate({
        reducedMotion: false,
        hidden: false,
        sunOnScreen: false,
      }),
    ).toBe(false);
  });

  it('never animates with reduced motion', () => {
    expect(
      shouldAnimate({ reducedMotion: true, hidden: false, sunOnScreen: true }),
    ).toBe(false);
  });

  it('never animates in a hidden tab', () => {
    expect(
      shouldAnimate({ reducedMotion: false, hidden: true, sunOnScreen: true }),
    ).toBe(false);
  });
});

describe('sunScale', () => {
  it('is full size at the start', () => {
    expect(sunScale(0)).toBe(1);
  });

  it('shrinks steadily as we fly away', () => {
    expect(sunScale(0.5)).toBeLessThan(sunScale(0.2));
    expect(sunScale(1)).toBeLessThan(sunScale(0.5));
  });

  it('is still clearly visible when it leaves the screen (not a dot)', () => {
    expect(sunScale(1)).toBeGreaterThan(0.2);
  });
});

describe('sunScreenY', () => {
  // Sun starts centred at y = 400px with a 700px diameter.
  const startY = 400;
  const diameter = 700;

  it('stays put while the name fades and a little after (first 35%)', () => {
    expect(sunScreenY(0, startY, diameter)).toBe(startY);
    expect(sunScreenY(0.35, startY, diameter)).toBe(startY);
  });

  it('rises slowly at first, then faster', () => {
    const early = startY - sunScreenY(0.5, startY, diameter);
    const late =
      sunScreenY(0.85, startY, diameter) - sunScreenY(1, startY, diameter);
    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThan(early);
  });

  it('still shows its centre at 85% of the departure', () => {
    expect(sunScreenY(0.85, startY, diameter)).toBeGreaterThan(0);
  });

  it('is entirely above the top edge, glow included, at the end of the departure', () => {
    const y = sunScreenY(1, startY, diameter);
    const glowRadius = (diameter / 2) * sunScale(1) * 2;
    expect(y + glowRadius).toBeLessThan(0);
  });
});

describe('sunOnScreen', () => {
  const startY = 400;
  const diameter = 700;

  it('is on screen at the start', () => {
    expect(sunOnScreen(0, startY, diameter)).toBe(true);
  });

  it('is on screen while it rises', () => {
    expect(sunOnScreen(0.6, startY, diameter)).toBe(true);
    expect(sunOnScreen(0.85, startY, diameter)).toBe(true);
  });

  it('is off screen once it has left through the top', () => {
    expect(sunOnScreen(1, startY, diameter)).toBe(false);
  });
});

describe('deepSpaceOpacity', () => {
  it('shows only a faint sky around the sun at the start', () => {
    expect(deepSpaceOpacity(0)).toBeGreaterThan(0);
    expect(deepSpaceOpacity(0)).toBeLessThan(0.3);
  });

  it('brightens as we leave the sun', () => {
    expect(deepSpaceOpacity(0.6)).toBeGreaterThan(deepSpaceOpacity(0.3));
  });

  it('is fully there once the sun has mostly gone', () => {
    expect(deepSpaceOpacity(0.85)).toBe(1);
    expect(deepSpaceOpacity(1)).toBe(1);
  });
});

describe('chartCalm', () => {
  const viewport = 800;

  it('is 0 while the projects section is still below the screen', () => {
    expect(chartCalm(900, viewport)).toBe(0);
  });

  it('is 1 once the projects section fills the screen', () => {
    expect(chartCalm(100, viewport)).toBe(1);
    expect(chartCalm(-2000, viewport)).toBe(1);
  });

  it('changes gradually as the section scrolls in (smooth handover)', () => {
    const mid = chartCalm(500, viewport);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('sunlightOpacity', () => {
  it('is off while the sun itself is clearly on screen', () => {
    expect(sunlightOpacity(0.5, 0)).toBe(0);
    expect(sunlightOpacity(0.7, 0)).toBe(0);
  });

  it('is fully on once the sun has left the screen', () => {
    expect(sunlightOpacity(1, 0.3)).toBeGreaterThan(0.9);
  });

  it('fades as you go deeper, but never fully disappears', () => {
    const atBottom = sunlightOpacity(1, 1);
    expect(atBottom).toBeLessThan(sunlightOpacity(1, 0.3));
    expect(atBottom).toBeGreaterThan(0.2);
  });
});

describe('departureProgress', () => {
  // Hero is 2 screens tall (1600px) in an 800px viewport, so there is 800px of
  // pinned scrolling.
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
