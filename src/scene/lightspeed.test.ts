import { describe, expect, it } from 'vitest';
import { lightspeed } from './lightspeed';

const viewport = 800;
const fast = 4000; // px/s — a quick flick
const below = 5000; // projects section far below the screen
const inBigJump = { departure: 0.65, projectsTop: below, viewport };
const inSmallJump = { departure: 1, projectsTop: viewport * 0.6, viewport };
const quiet = { departure: 1, projectsTop: below, viewport }; // reading About

describe('lightspeed', () => {
  it('does nothing when you are not scrolling', () => {
    expect(lightspeed({ ...inBigJump, velocity: 0 }).strength).toBe(0);
  });

  it('does nothing outside the two jump zones, however fast you scroll', () => {
    expect(lightspeed({ ...quiet, velocity: fast }).strength).toBe(0);
    expect(lightspeed({ departure: 0.1, projectsTop: below, viewport, velocity: fast }).strength).toBe(0);
  });

  it('streaks more the faster you scroll', () => {
    const slow = lightspeed({ ...inBigJump, velocity: 500 }).strength;
    const quick = lightspeed({ ...inBigJump, velocity: 2000 }).strength;
    expect(slow).toBeGreaterThan(0);
    expect(quick).toBeGreaterThan(slow);
  });

  it('is capped, so a huge flick never goes beyond full strength', () => {
    expect(lightspeed({ ...inBigJump, velocity: 1e6 }).strength).toBeLessThanOrEqual(1);
  });

  it('makes the hero → About jump bigger than the About → projects one', () => {
    const big = lightspeed({ ...inBigJump, velocity: fast }).strength;
    const small = lightspeed({ ...inSmallJump, velocity: fast }).strength;
    expect(small).toBeGreaterThan(0);
    expect(big).toBeGreaterThan(small * 1.5);
  });

  it('streaks radially in the big jump (flying away) and vertically in the small one (drifting)', () => {
    expect(lightspeed({ ...inBigJump, velocity: fast }).radial).toBeGreaterThan(0.6);
    expect(lightspeed({ ...inSmallJump, velocity: fast }).radial).toBeLessThan(0.4);
  });

  it('works the same scrolling back up', () => {
    expect(lightspeed({ ...inBigJump, velocity: -fast }).strength).toBe(
      lightspeed({ ...inBigJump, velocity: fast }).strength,
    );
  });
});
