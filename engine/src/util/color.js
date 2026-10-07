/**
 * Color science for the palette engine.
 *
 * The Excel gives us ONE authoritative brand color per business (the
 * "Primary Color" column). Everything else in a palette is derived from it in
 * a controlled, accessible way - we never store arbitrary color soup. This
 * module handles hex<->hsl conversion, WCAG contrast, and readable text/border
 * selection so generated sites always meet contrast targets.
 */

/** @param {string} hex @returns {{r:number,g:number,b:number}} */
export function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 15, g: 23, b: 42 }; // fallback slate-900
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** @returns {string} #rrggbb */
export function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** @returns {{h:number,s:number,l:number}} h in [0,360), s/l in [0,1] */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R: h = (G - B) / d + (G < B ? 6 : 0); break;
      case G: h = (B - R) / d + 2; break;
      default: h = (R - G) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

/** @returns {string} */
export function hslToHex({ h, s, l }) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

export function adjust(hex, { h = 0, s = 0, l = 0 } = {}) {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h + h, s: c.s + s, l: c.l + l });
}

export function withLightness(hex, l) {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h, s: c.s, l });
}

export function rotate(hex, deg) {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h + deg, s: c.s, l: c.l });
}

/** Relative luminance per WCAG 2.x. */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors (1..21). */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Choose black or white text for best contrast on a background.
 *
 * Prefers the softer near-black (#0b0f19) over true black for aesthetics, but
 * for backgrounds where NEITHER #ffffff nor #0b0f19 clears `target`, falls
 * back to true #000000 - for true black/white, contrast(white,bg) *
 * contrast(black,bg) === 21 always (WCAG contrast-ratio identity), so the
 * better of the two is mathematically guaranteed to be >= sqrt(21) ≈ 4.58,
 * clearing the default 4.5 target for any background.
 */
export function readableOn(bg, target = 4.5) {
  const cw = contrast(bg, '#ffffff');
  const cSoftBlack = contrast(bg, '#0b0f19');
  if (Math.max(cw, cSoftBlack) >= target) return cw >= cSoftBlack ? '#ffffff' : '#0b0f19';
  return cw >= contrast(bg, '#000000') ? '#ffffff' : '#000000';
}

/**
 * Nudge a foreground color until it hits a target contrast on the given
 * background, walking lightness. Guarantees accessible text without discarding
 * the brand hue entirely.
 */
export function ensureContrast(fg, bg, target = 4.5) {
  if (contrast(fg, bg) >= target) return fg;
  const bgLum = luminance(bg);
  const step = bgLum > 0.5 ? -0.04 : 0.04; // darken on light bg, lighten on dark bg
  let c = hexToHsl(fg);
  for (let i = 0; i < 24; i++) {
    c = { ...c, l: Math.max(0, Math.min(1, c.l + step)) };
    const candidate = hslToHex(c);
    if (contrast(candidate, bg) >= target) return candidate;
  }
  // Last resort: pure black/white.
  return readableOn(bg);
}

export function isDark(hex) {
  return luminance(hex) < 0.4;
}
