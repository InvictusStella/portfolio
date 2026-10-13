import { describe, expect, it } from 'vitest';
import { currentSectionId, localeUrl } from './routes';

describe('localeUrl', () => {
  it('puts English at the base path', () => {
    expect(localeUrl('en', '/portfolio/')).toBe('/portfolio/');
  });

  it('puts Turkish under tr/', () => {
    expect(localeUrl('tr', '/portfolio/')).toBe('/portfolio/tr/');
  });

  it('works when the site is served from the root', () => {
    expect(localeUrl('tr', '/')).toBe('/tr/');
  });
});

describe('currentSectionId', () => {
  const viewportHeight = 800; // middle of the screen is y = 400

  it('picks the section crossing the middle of the screen', () => {
    const sections = [
      { id: 'top', top: -900, bottom: -100 },
      { id: 'about', top: -100, bottom: 1200 },
      { id: 'contact', top: 1200, bottom: 1600 },
    ];
    expect(currentSectionId(sections, viewportHeight)).toBe('about');
  });

  it('picks the last section that started above the middle when the middle falls in a gap', () => {
    const sections = [
      { id: 'about', top: -500, bottom: 300 },
      { id: 'contact', top: 500, bottom: 900 },
    ];
    expect(currentSectionId(sections, viewportHeight)).toBe('about');
  });

  it('returns undefined at the very top, before any section reaches the middle', () => {
    const sections = [{ id: 'about', top: 900, bottom: 2000 }];
    expect(currentSectionId(sections, viewportHeight)).toBeUndefined();
  });
});
