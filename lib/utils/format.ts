/**
 * Centralized formatting utility functions for the Ultimatum platform.
 */

/**
 * Formats a date or ISO string into a human-readable date (e.g. "Aug 24, 2026").
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Formats a date or ISO string into a full date and time string (e.g. "Aug 24, 2026, 10:30 AM").
 */
export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * Formats a number with comma separators (e.g. 12,500).
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Formats an XP score with comma separators and 'XP' suffix (e.g. "4,850 XP").
 */
export function formatXP(points: number | string | null | undefined): string {
  return `${formatNumber(points)} XP`;
}
