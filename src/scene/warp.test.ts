import { describe, expect, it } from 'vitest';
import { crossedDown, scrollDrive, WARP_ZONES, warpProgress, WARPS, warpState, warpStateAt } from './warp';

describe('warpState', () => {
  it('starts calm', () => {
    const s = warpState('big', 0);
    expect(s.stretch).toBe(0);
    expect(s.flash).toBe(0);
    expect(s.fov).toBe(0);
  });

  it('anticipates first: a slight stretch and a tighter view before the burst', () => {
    const s = warpState('big', 0.2);
    expect(s.stretch).toBeGreaterThan(0);
    expect(s.stretch).toBeLessThan(0.25);
    expect(s.fov).toBeLessThan(0);
  });

  it('bursts into full-length streaks with a wide view', () => {
    const s = warpState('big', 0.75);
    expect(s.stretch).toBeGreaterThan(0.9);
    expect(s.fov).toBeGreaterThan(8);
  });

  it('flashes near the end of the burst', () => {
    const peak = Math.max(...[0.7, 0.75, 0.8, 0.85, 0.9].map((t) => warpState('big', t).flash));
    expect(peak).toBeGreaterThan(0.4);
    expect(warpState('big', 0.3).flash).toBe(0);
  });

  it('settles back to nothing and reports done', () => {
    const end = warpState('big', WARPS.big.duration);
    expect(end).toEqual({ stretch: 0, fov: 0, flash: 0, done: true });
    expect(warpState('big', 10).done).toBe(true);
  });

  it('takes about 1.6 s for the big jump and 0.9 s for the small one', () => {
    expect(WARPS.big.duration).toBeCloseTo(1.6, 5);
    expect(WARPS.small.duration).toBeCloseTo(0.9, 5);
  });

  it('makes the small jump clearly gentler than the big one', () => {
    const bigPeak = Math.max(...Array.from({ length: 33 }, (_, i) => warpState('big', i * 0.05).stretch));
    const smallPeak = Math.max(...Array.from({ length: 19 }, (_, i) => warpState('small', i * 0.05).stretch));
    expect(smallPeak).toBeGreaterThan(0.3);
    expect(smallPeak).toBeLessThan(bigPeak * 0.7);
  });

  it('never jumps abruptly (smooth from frame to frame)', () => {
    for (const kind of ['big', 'small'] as const) {
      let previous = warpState(kind, 0);
      for (let t = 1 / 60; t <= WARPS[kind].duration + 0.1; t += 1 / 60) {
        const now = warpState(kind, t);
        expect(Math.abs(now.stretch - previous.stretch)).toBeLessThan(0.12);
        previous = now;
      }
    }
  });
});

describe('warpProgress', () => {
  it('follows the clock when you scroll slowly', () => {
    expect(warpProgress(0.6, 0.2)).toBe(0.6);
  });

  it('is pushed along by the scroll when you scroll fast, so it ends as the next section arrives', () => {
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

describe('warpStateAt (progress-based)', () => {
  it('matches the timed version at the same point', () => {
    expect(warpStateAt('big', 0.5)).toEqual(warpState('big', WARPS.big.duration * 0.5));
  });

  it('is done at 1', () => {
    expect(warpStateAt('small', 1).done).toBe(true);
  });
});

describe('WARP_ZONES', () => {
  it('starts the big warp right after the name has faded (30%) and ends it before About', () => {
    expect(WARP_ZONES.big.start).toBeGreaterThanOrEqual(0.3);
    expect(WARP_ZONES.big.start).toBeLessThan(0.4);
    expect(WARP_ZONES.big.end).toBeLessThan(1);
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
