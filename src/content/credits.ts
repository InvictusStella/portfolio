// Credits for imagery used on the site (details and licences: docs/credits.md).
// `credit` is the wording the source requires, so it stays as-is in both languages.

import type { Localized } from './profile';

export type Credit = { subject: Localized; credit: string };

export const credits: Credit[] = [
  {
    subject: { en: 'Sun', tr: 'Güneş' },
    credit: 'Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams.',
  },
];
