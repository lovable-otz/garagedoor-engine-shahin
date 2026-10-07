/** String helpers: slugs, titles, safe joins. */

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function titleCase(s) {
  const small = new Set(['a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'on', 'at', 'by']);
  return String(s || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** Join list with Oxford comma: [a,b,c] -> "a, b, and c" */
export function humanList(arr, conj = 'and') {
  const a = (arr || []).filter(Boolean);
  if (a.length === 0) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ${conj} ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, ${conj} ${a[a.length - 1]}`;
}

/** Compact number for display, e.g. 471825 -> "471,825". */
export function commas(n) {
  if (n == null || Number.isNaN(Number(n))) return '';
  return Number(n).toLocaleString('en-US');
}

/**
 * Format a raw phone number into US display form: "(214) 555-0100".
 * Accepts any punctuation/spacing and a leading country code (1 or +1).
 * Returns the input unchanged (trimmed) if it isn't a recognizable 10-digit
 * US number - callers should never see a number get silently mangled.
 */
export function formatPhoneUS(raw) {
  const s = clean(raw);
  if (!s) return s;
  let digits = s.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return s;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Best-effort clean of a business/city string. */
export function clean(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

export function truncate(s, n) {
  const t = clean(s);
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}
