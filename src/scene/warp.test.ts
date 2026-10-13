import { describe, expect, it } from 'vitest';
import {
  BEGIN_SECONDS,
  crossedDown,
  RETURN_SECONDS,
  scrollDrive,
  travelScroll,
  WARP,
  WARP_ZONE,
  warpProgress,
  warpState,
  warpStateAt,
} from './warp';

describe('warpState', () => {
  it('starts calm', () => {
    const s = warpState(0);
    expect(s.stretch).toBe(0);
    expect(s.flash).toBe(0);
    expect(s.fov).toBe(0);
  });

  it('anticipates first: a slight stretch and a tighter view before the burst', () => {
    const s = warpState(0.2);
    expect(s.stretch).toBeGreaterThan(0);
    expect(s.stretch).toBeLessThan(0.25);
    expect(s.fov).toBeLessThan(0);
  });

  it('bursts into full-length streaks with a wide view', () => {
    const s = warpState(0.75);
    expect(s.stretch).toBeGreaterThan(0.9);
    expect(s.fov).toBeGreaterThan(8);
  });

  it('flashes near the end of the burst', () => {
    const peak = Math.max(...[0.7, 0.75, 0.8, 0.85, 0.9].map((t) => warpState(t).flash));
    expect(peak).toBeGreaterThan(0.4);
    expect(warpState(0.3).flash).toBe(0);
  });

  it('settles back to nothing and reports done', () => {
    expect(warpState(WARP.duration)).toEqual({ stretch: 0, fov: 0, flash: 0, done: true });
    expect(warpState(10).done).toBe(true);
  });

  it('never jumps abruptly (smooth from frame to frame)', () => {
    let previous = warpState(0);
    for (let t = 1 / 60; t <= WARP.duration + 0.1; t += 1 / 60) {
      const now = warpState(t);
      expect(Math.abs(now.stretch - previous.stretch)).toBeLessThan(0.12);
      previous = now;
    }
  });
});

describe('warpStateAt (progress-based)', () => {
  it('matches the timed version at the same point', () => {
    expect(warpStateAt(0.5)).toEqual(warpState(WARP.duration * 0.5));
  });

  it('is done at 1', () => {
    expect(warpStateAt(1).done).toBe(true);
  });
});

describe('button warps', () => {
  it('"Scroll to begin" takes 1.5 s — long enough to see', () => {
    expect(BEGIN_SECONDS).toBe(1.5);
  });

  it('"Return to Sun" takes between 1.5 and 2 s', () => {
    expect(RETURN_SECONDS).toBeGreaterThanOrEqual(1.5);
    expect(RETURN_SECONDS).toBeLessThanOrEqual(2);
  });
});

describe('travelScroll', () => {
  it('starts where you are and ends at the destination', () => {
    expect(travelScroll(100, 2000, 0)).toBe(100);
    expect(travelScroll(100, 2000, 1)).toBe(2000);
  });

  it('eases: slow start, fast middle, gentle arrival', () => {
    const early = travelScroll(0, 1000, 0.1);
    const middle = travelScroll(0, 1000, 0.5);
    expect(early).toBeLessThan(100); // slower than linear at first
    expect(middle).toBeCloseTo(500, 6);
  });

  it('works going back up', () => {
    expect(travelScroll(3000, 0, 0.5)).toBeCloseTo(1500, 6);
    expect(travelScroll(3000, 0, 1)).toBe(0);
  });

  it('never overshoots', () => {
    for (let u = 0; u <= 1; u += 0.01) {
      const y = travelScroll(0, 1000, u);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1000);
    }
  });
});

describe('warpProgress', () => {
  it('follows the clock when you scroll slowly', () => {
    expect(warpProgress(0.6, 0.2)).toBe(0.6);
  });

  it('is pushed along by the scroll when you scroll fast', () => {
    expect(warpProgress(0.2, 0.9)).toBe(0.9);
  });

  it('never goes past the end', () => {
    expect(warpProgress(3, 2)).toBe(1);
  });
});

describe('scrollDrive', () => {
  it('maps the stretch of scroll the warp lives in onto 0..1', () => {
    expect(scrollDrive(0.35, 0.35, 0.95)).toBe(0);
    expect(scrollDrive(0.65, 0.35, 0.95)).toBeCloseTo(0.5, 6);
    expect(scrollDrive(0.95, 0.35, 0.95)).toBe(1);
  });

  it('stays within 0..1 outside that stretch', () => {
    expect(scrollDrive(0.1, 0.35, 0.95)).toBe(0);
    expect(scrollDrive(1.4, 0.35, 0.95)).toBe(1);
  });
});

describe('WARP_ZONE', () => {
  it('starts the sun warp right after the name has faded (30%) and ends it before About', () => {
    expect(WARP_ZONE.start).toBeGreaterThanOrEqual(0.3);
    expect(WARP_ZONE.start).toBeLessThan(0.4);
    expect(WARP_ZONE.end).toBeLessThan(1);
  });
});

describe('crossedDown', () => {
  it('fires when a value passes the threshold going down the page', () => {
    expect(crossedDown(0.4, 0.55, 0.5)).toBe(true);
  });

  it('does not fire going back up', () => {
    expect(crossedDown(0.55, 0.4, 0.5)).toBe(false);
  });

  it('does not fire while already past the threshold', () => {
    expect(crossedDown(0.6, 0.7, 0.5)).toBe(false);
  });

  it('fires once when a big scroll jumps right over the threshold', () => {
    expect(crossedDown(0, 1, 0.5)).toBe(true);
  });
});
