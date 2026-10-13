import { describe, expect, it } from 'vitest';
import { INTRO_SECONDS, introState } from './intro';

describe('introState', () => {
  it('starts with the sun below the screen and the text hidden', () => {
    expect(introState(0)).toEqual({ rise: 0, text: 0, done: false });
  });

  it('has the sun fully risen at the end', () => {
    expect(introState(INTRO_SECONDS).rise).toBe(1);
  });

  it('rises quickly at first and settles gently (ease-out)', () => {
    const firstHalf = introState(INTRO_SECONDS * 0.5).rise;
    expect(firstHalf).toBeGreaterThan(0.7);
  });

  it('only fades the text in once the sun has mostly risen', () => {
    expect(introState(INTRO_SECONDS * 0.5).text).toBe(0);
    expect(introState(INTRO_SECONDS).text).toBe(1);
  });

  it('takes between 2 and 2.5 seconds in total', () => {
    expect(INTRO_SECONDS).toBeGreaterThanOrEqual(2);
    expect(INTRO_SECONDS).toBeLessThanOrEqual(2.5);
  });

  it('is done at the end and stays finished', () => {
    expect(introState(INTRO_SECONDS).done).toBe(true);
    expect(introState(60)).toEqual({ rise: 1, text: 1, done: true });
  });

  it('never goes backwards', () => {
    let previous = introState(0);
    for (let t = 0.05; t <= INTRO_SECONDS; t += 0.05) {
      const now = introState(t);
      expect(now.rise).toBeGreaterThanOrEqual(previous.rise);
      expect(now.text).toBeGreaterThanOrEqual(previous.text);
      previous = now;
    }
  });
});
