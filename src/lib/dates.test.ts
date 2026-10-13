import { describe, expect, it } from 'vitest';
import { formatPeriod } from './dates';

describe('formatPeriod', () => {
  it('formats a finished period in English', () => {
    expect(formatPeriod('2024-07', '2024-08', 'en')).toBe(
      'Jul 2024 – Aug 2024',
    );
  });

  it('formats a finished period in Turkish', () => {
    expect(formatPeriod('2024-07', '2024-08', 'tr')).toBe(
      'Tem 2024 – Ağu 2024',
    );
  });

  it('shows "Present" when there is no end date', () => {
    expect(formatPeriod('2025-10', undefined, 'en')).toBe('Oct 2025 – Present');
  });

  it('shows "Günümüz" when there is no end date in Turkish', () => {
    expect(formatPeriod('2025-10', undefined, 'tr')).toBe('Eki 2025 – Günümüz');
  });
});
