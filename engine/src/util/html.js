/** Tiny HTML helpers. No template framework - just safe string building. */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text destined for element content or attribute values. */
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Build an attribute string from an object, skipping null/undefined/false. */
export function attrs(obj) {
  return Object.entries(obj || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
}

/** Join child fragments, dropping falsy so `cond && frag` works inline. */
export function j(...parts) {
  return parts.flat().filter(Boolean).join('\n');
}

/** Collapse redundant blank lines produced by conditional fragments. */
export function tidy(html) {
  return html.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
