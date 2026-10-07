/**
 * Vector illustration + icon system.
 *
 * The dataset ships no photos, so instead of ugly abstract placeholders we draw
 * clean, flat, *designed* SVG illustrations that theme themselves from the
 * business palette - a modern house-with-garage-door hero scene, a catalog of
 * garage-door styles for galleries, and a crisp stroke-icon set (no emoji).
 * Everything is self-contained (renders offline, instant paint, fully scalable).
 *
 * Gradient ids are salted per instance so multiple SVGs coexist on one page.
 */

import { esc } from '../util/html.js';

/* ------------------------------------------------------------------ icons */
/* 24x24, stroke = currentColor. Consumers set color via CSS. */
const ICON_PATHS = {
  // Clean, consistent 24×24 stroke icons (Feather/Lucide geometry).
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  door: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12.5" x2="21" y2="12.5"/><line x1="3" y1="17" x2="21" y2="17"/>',
  swap: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  chip: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M20 9h2M20 15h2M2 9h2M2 15h2"/>',
  spring: '<path d="M7 3h10M7 21h10"/><path d="M10 3c-2.6 1.9-2.6 3.7 0 5.6s2.6 3.7 0 5.6-2.6 3.7 0 5.8"/><path d="M14 3c2.6 1.9 2.6 3.7 0 5.6s2.6 3.7 0 5.6 2.6 3.7 0 5.8"/>',
  cable: '<circle cx="5" cy="4" r="1.5"/><circle cx="19" cy="20" r="1.5"/><path d="M5 5.5v4.5a5 5 0 0 0 5 5h4a5 5 0 0 1 5 5"/>',
  track: '<line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><rect x="9" y="6" width="6" height="4" rx="1"/><rect x="9" y="14" width="6" height="4" rx="1"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>',
  roller: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  gauge: '<path d="M3.5 16.5a9 9 0 1 1 17 0"/><path d="M12 15l4.5-4.5"/><circle cx="12" cy="15" r="1.5"/>',
  building: '<path d="M4 22V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v18"/><line x1="2" y1="22" x2="22" y2="22"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M10 22v-4h4v4"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  sparkle: '<path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z"/><path d="M18.5 14.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  star: '<polygon points="12 2 15 8.6 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 9 8.6 12 2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11.2 14.2 15.5 9.5"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><path d="M8.5 15l2.3 2.3 4.7-4.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

/**
 * Inline SVG icon (stroke uses currentColor).
 * @param {string} name
 * @param {object} [opts] { size, cls, strokeWidth }
 */
export function icon(name, opts = {}) {
  const { size = 24, cls = '', strokeWidth = 1.8 } = opts;
  const body = ICON_PATHS[name] || ICON_PATHS.wrench;
  return `<svg class="ico ${esc(cls)}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ----------------------------------------------------------- hero scene */

function grad(id, from, to, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
}

/**
 * A modern house + garage door hero illustration, colored from the palette.
 * @param {object} p palette
 * @param {string} uid unique suffix for gradient ids
 */
export function houseScene(p, uid) {
  const dark = p.mood === 'dark';
  const sky1 = dark ? p.surfaceAlt : mix(p.primary, p.bg, 0.86);
  const sky2 = dark ? p.surface : p.bg;
  const wall = dark ? p.surface : '#ffffff';
  const wall2 = dark ? p.surfaceAlt : mix(p.primary, '#ffffff', 0.92);
  const line = dark ? mix('#ffffff', p.surface, 0.8) : mix(p.text, '#ffffff', 0.82);
  const g = `hs-${uid}`;
  return `<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
<defs>
  ${grad(`${g}-sky`, sky1, sky2)}
  ${grad(`${g}-door`, p.primary, p.accent)}
  ${grad(`${g}-roof`, mix(p.primary, p.text, 0.35), p.primary)}
</defs>
<rect width="640" height="480" fill="url(#${g}-sky)"/>
<circle cx="536" cy="96" r="120" fill="${p.accent}" opacity="0.14"/>
<circle cx="536" cy="96" r="46" fill="${p.accent}" opacity="0.9"/>
<g opacity="0.5" fill="none" stroke="${line}" stroke-width="2">
  <path d="M70 120c30-12 54 6 84 0"/><path d="M120 150c26-10 44 6 70 0"/>
</g>
<!-- ground -->
<rect y="372" width="640" height="108" fill="${mix(p.primary, p.bg, dark ? 0.7 : 0.9)}"/>
<!-- driveway -->
<path d="M232 480l40-108h172l40 108z" fill="${mix(p.text, p.bg, dark ? 0.6 : 0.86)}"/>
<path d="M356 372v108" stroke="${mix('#ffffff', p.primary, 0.4)}" stroke-width="3" stroke-dasharray="10 12" opacity=".6"/>
<!-- house body -->
<rect x="150" y="196" width="360" height="180" fill="${wall}" stroke="${line}" stroke-width="2"/>
<!-- roof -->
<path d="M132 200 330 96l198 104z" fill="url(#${g}-roof)"/>
<!-- window + door (left) -->
<rect x="176" y="232" width="60" height="60" rx="3" fill="${wall2}" stroke="${line}" stroke-width="2"/>
<path d="M206 232v60M176 262h60" stroke="${line}" stroke-width="2"/>
<rect x="176" y="312" width="34" height="64" fill="${mix(p.primary, wall, 0.5)}" stroke="${line}" stroke-width="2"/>
<circle cx="203" cy="346" r="2.6" fill="${p.accent}"/>
<!-- GARAGE DOOR (hero element) -->
<rect x="266" y="236" width="222" height="140" rx="4" fill="url(#${g}-door)"/>
<g fill="#ffffff" opacity="0.16">
  <rect x="278" y="248" width="198" height="8" rx="4"/>
</g>
<g stroke="#ffffff" stroke-opacity="0.35" stroke-width="2">
  <path d="M266 272h222M266 304h222M266 336h222"/>
  <path d="M321 236v140M377 236v140M433 236v140"/>
</g>
<g fill="#ffffff" opacity="0.28">
  <rect x="278" y="246" width="40" height="18" rx="3"/><rect x="334" y="246" width="40" height="18" rx="3"/>
  <rect x="390" y="246" width="40" height="18" rx="3"/><rect x="446" y="246" width="30" height="18" rx="3"/>
</g>
<rect x="266" y="236" width="222" height="140" rx="4" fill="none" stroke="${mix(p.text, p.primary, 0.5)}" stroke-width="2.5"/>
<!-- little plant -->
<rect x="150" y="352" width="14" height="24" fill="${mix(p.text, p.bg, 0.5)}"/>
<circle cx="157" cy="346" r="16" fill="${p.accent}" opacity="0.85"/>
</svg>`;
}

/* --------------------------------------------------- garage-door catalog */

const DOOR_STYLES = ['sectional', 'carriage', 'modern-flush', 'full-view', 'raised-panel', 'commercial'];

/**
 * A single garage-door "style" illustration in a wall frame.
 * @param {number} i style index
 * @param {object} p palette
 * @param {string} uid
 */
export function doorStyle(i, p, uid) {
  const style = DOOR_STYLES[i % DOOR_STYLES.length];
  const dark = p.mood === 'dark';
  const wall = dark ? p.surfaceAlt : mix(p.primary, '#ffffff', 0.9);
  const frame = dark ? p.surface : '#ffffff';
  const line = 'rgba(255,255,255,0.4)';
  const g = `ds-${uid}`;
  let door = '';
  const W = 300, H = 224, x = 40, y = 34, dw = 220, dh = 168;
  const panels = (rows, cols, extra = '') => {
    let s = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      s += `<rect x="${x + 8 + c * (dw - 16) / cols}" y="${y + 8 + r * (dh - 16) / rows}" width="${(dw - 16) / cols - 6}" height="${(dh - 16) / rows - 6}" rx="3" fill="rgba(255,255,255,.10)" stroke="${line}" stroke-width="1.5"/>`;
    }
    return s + extra;
  };
  switch (style) {
    case 'carriage':
      door = panels(2, 4) +
        `<g fill="#fff" opacity=".85"><circle cx="${x + 18}" cy="${y + dh / 2}" r="3"/><circle cx="${x + dw - 18}" cy="${y + dh / 2}" r="3"/></g>` +
        `<g fill="rgba(255,255,255,.22)">${[0, 1, 2, 3].map((c) => `<rect x="${x + 12 + c * (dw - 16) / 4}" y="${y + 12}" width="${(dw - 16) / 4 - 12}" height="18" rx="2"/>`).join('')}</g>`;
      break;
    case 'modern-flush':
      door = `<g stroke="${line}" stroke-width="1.5">${[1, 2, 3].map((r) => `<path d="M${x + 8} ${y + r * dh / 4} H${x + dw - 8}"/>`).join('')}</g>`;
      break;
    case 'full-view':
      door = panels(3, 4).replace(/rgba\(255,255,255,\.10\)/g, `${p.accent}`).replace(/opacity/g, '') ;
      door = (() => { let s = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += `<rect x="${x + 8 + c * (dw - 16) / 4}" y="${y + 8 + r * (dh - 16) / 3}" width="${(dw - 16) / 4 - 6}" height="${(dh - 16) / 3 - 6}" rx="2" fill="${mix(p.accent, '#ffffff', 0.35)}" opacity=".5" stroke="${line}" stroke-width="1.5"/>`; return s; })();
      break;
    case 'raised-panel':
      door = panels(3, 3);
      break;
    case 'commercial':
      door = `<g stroke="${line}" stroke-width="1.5">${Array.from({ length: 9 }, (_, r) => `<path d="M${x + 8} ${y + 10 + r * (dh - 16) / 9} H${x + dw - 8}"/>`).join('')}</g>`;
      break;
    default: // sectional
      door = panels(4, 4);
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
<defs>${grad(`${g}`, p.primary, p.accent)}</defs>
<rect width="${W}" height="${H}" fill="${wall}"/>
<rect x="16" y="16" width="${W - 32}" height="${H - 20}" rx="6" fill="${frame}" opacity="${dark ? 0.5 : 1}"/>
<rect x="${x}" y="${y}" width="${dw}" height="${dh}" rx="5" fill="url(#${g})"/>
${door}
<rect x="${x}" y="${y}" width="${dw}" height="${dh}" rx="5" fill="none" stroke="${mix(p.text, p.primary, 0.5)}" stroke-width="2"/>
</svg>`;
}

/**
 * A stylized "coverage map" - road grid + scattered location pins with a larger
 * central pin (the business), colored from the palette. Decorative; the real
 * area list lives beside it.
 * @param {object} p palette
 * @param {string} uid
 */
export function coverageMap(p, uid) {
  const dark = p.mood === 'dark';
  const bg1 = dark ? p.surfaceAlt : mix(p.primary, '#ffffff', 0.9);
  const bg2 = dark ? p.surface : mix(p.accent, '#ffffff', 0.92);
  const road = dark ? mix('#ffffff', p.surface, 0.75) : mix(p.text, '#ffffff', 0.8);
  const g = `cm-${uid}`;
  // Deterministic pin layout (decorative).
  const pins = [[120, 130], [250, 90], [360, 150], [180, 220], [300, 250], [420, 220], [140, 320], [330, 340]];
  const pin = (x, y, s, fill) => `<g transform="translate(${x - 12 * s},${y - 22 * s}) scale(${s})"><path d="M12 22c5-6 7-9.3 7-13a7 7 0 1 0-14 0c0 3.7 2 7 7 13z" fill="${fill}"/><circle cx="12" cy="9" r="3" fill="#fff"/></g>`;
  return `<svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="520" height="420" fill="url(#${g})"/>
<g stroke="${road}" stroke-width="10" opacity="${dark ? 0.5 : 0.65}" stroke-linecap="round">
  <path d="M-10 110 H530"/><path d="M-10 250 H530"/><path d="M90 -10 V430"/><path d="M300 -10 V430"/><path d="M430 -10 V430"/>
</g>
<g stroke="${road}" stroke-width="5" opacity="${dark ? 0.4 : 0.5}"><path d="M-10 40 L530 380"/><path d="M-10 360 L360 -10"/></g>
<circle cx="250" cy="200" r="120" fill="${p.primary}" opacity="0.10"/>
<circle cx="250" cy="200" r="70" fill="${p.primary}" opacity="0.10"/>
${pins.map(([x, y], i) => pin(x, y, 0.9, i % 2 ? p.accent : p.primary)).join('')}
${pin(250, 200, 1.7, p.primary)}
</svg>`;
}

export const DOOR_STYLE_LABELS = {
  sectional: 'Sectional steel', carriage: 'Carriage house', 'modern-flush': 'Modern flush',
  'full-view': 'Full-view glass', 'raised-panel': 'Raised panel', commercial: 'Commercial roll-up',
};
export const DOOR_STYLE_KEYS = DOOR_STYLES;

/* --------------------------------------------------------------- helpers */
function toRgb(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
}
function mix(a, b, t) {
  const A = toRgb(a), B = toRgb(b);
  const c = (i) => Math.round(A[i] * (1 - t) + B[i] * t);
  return `#${[0, 1, 2].map((i) => c(i).toString(16).padStart(2, '0')).join('')}`;
}

export default { icon, houseScene, doorStyle };
