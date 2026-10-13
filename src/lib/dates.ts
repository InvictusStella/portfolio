import type { Lang } from '../i18n/ui';

const present: Record<Lang, string> = { en: 'Present', tr: 'Günümüz' };

/** "2024-07" → "Jul 2024" (en) / "Tem 2024" (tr). */
function formatMonth(yearMonth: string, lang: Lang): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1)),
  );
}

/** A date range like "Jul 2024 – Aug 2024"; no end date means it is ongoing. */
export function formatPeriod(start: string, end: string | undefined, lang: Lang): string {
  return `${formatMonth(start, lang)} – ${end ? formatMonth(end, lang) : present[lang]}`;
}
