import type { Lang } from './ui';

/**
 * Home page URL for a language: English at the base path, Turkish under tr/.
 */
export function localeUrl(lang: Lang, base: string): string {
  return lang === 'en' ? base : `${base}tr/`;
}

export type SectionBox = { id: string; top: number; bottom: number };

/**
 * The section the reader is looking at: the one crossing the middle of the
 * screen, or else the last one that has already scrolled past the middle.
 * Positions are relative to the viewport, as getBoundingClientRect() gives
 * them.
 */
export function currentSectionId(
  sections: SectionBox[],
  viewportHeight: number,
): string | undefined {
  const middle = viewportHeight / 2;
  const crossing = sections.find((s) => s.top <= middle && s.bottom > middle);
  if (crossing) return crossing.id;
  return sections.filter((s) => s.top <= middle).at(-1)?.id;
}
