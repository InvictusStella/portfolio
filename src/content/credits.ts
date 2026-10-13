// Credits for imagery used on the site (details and licences: docs/credits.md).
// `credit` is the wording the source requires, so it stays as-is in both
// languages.

import type { Localized } from './profile';

export type Credit = {
  subject: Localized;
  credit: string;
  /** The image's page at its source. */
  url?: string;
  /** Licence, when it has one (CC BY needs a link to it). */
  licence?: { name: string; url: string };
  /** What we changed, when the licence asks for it. */
  changes?: Localized;
};

const CC_BY = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
};
const CHANGED: Localized = {
  en: 'cropped, resized and colour-adjusted',
  tr: 'kırpıldı, yeniden boyutlandırıldı ve renk ayarı yapıldı',
};

export const credits: Credit[] = [
  {
    subject: { en: 'Sun', tr: 'Güneş' },
    credit: 'Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams.',
    url: 'https://sdo.gsfc.nasa.gov/',
  },
  {
    subject: { en: 'Milky Way', tr: 'Samanyolu' },
    credit: 'ESO/S. Brunier',
    url: 'https://www.eso.org/public/images/eso0932a/',
    licence: CC_BY,
    changes: CHANGED,
  },
  {
    subject: { en: 'Southern Ring Nebula', tr: 'Güney Halka Bulutsusu' },
    credit: 'NASA, ESA, CSA, STScI, and the Webb ERO Production Team',
    url: 'https://esawebb.org/images/weic2207b/',
    licence: CC_BY,
    changes: CHANGED,
  },
  {
    subject: { en: 'Ring Nebula', tr: 'Halka Bulutsusu' },
    credit: 'ESA/Webb, NASA, CSA, M. Barlow, N. Cox, R. Wesson',
    url: 'https://esawebb.org/images/weic2320b/',
    licence: CC_BY,
    changes: CHANGED,
  },
];
