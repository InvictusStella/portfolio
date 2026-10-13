// The sunrise intro: on a visitor's first load, the sun rises into place, then the
// name and tagline fade in. Pure timing, so it's testable.

import { smoothstep } from './director';

/** Total length of the intro, in seconds. */
export const INTRO_SECONDS = 2.2;
/** The sun's rise takes this long; the text fades in over the rest. */
const RISE_SECONDS = 1.8;

/** Session storage key: the intro plays once per visit (survives reloads and language switches). */
export const INTRO_PLAYED_KEY = 'intro-played';

export type IntroState = {
  /** 0 = sun below the screen, 1 = sun in its place. */
  rise: number;
  /** 0 = name and tagline hidden, 1 = fully shown. */
  text: number;
  done: boolean;
};

export function introState(seconds: number): IntroState {
  const t = Math.min(1, Math.max(0, seconds / RISE_SECONDS));
  const rise = 1 - (1 - t) ** 3; // ease-out: quick at first, settling gently
  const text = smoothstep(1.6, INTRO_SECONDS, seconds);
  return { rise, text, done: seconds >= INTRO_SECONDS };
}
