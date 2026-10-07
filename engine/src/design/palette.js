/**
 * Palette Engine.
 *
 * Input: one brand color (Excel "Primary Color") + the theme's palette strategy
 * + a per-business seed. Output: a complete, WCAG-checked palette. Every color
 * beyond the brand hue is *derived*, so two businesses with the same theme but
 * different brand colors produce visibly different sites, while a single
 * business is fully deterministic.
 */

import {
  hexToHsl, hslToHex, rotate, withLightness, ensureContrast, readableOn, isDark, contrast,
  hexToRgb, rgbToHex,
} from '../util/color.js';
import { stream, subSeed } from '../util/hash.js';

const NEUTRAL_HUE = { cool: 220, warm: 32, steel: 210, ink: 240 };

/**
 * @param {string} brand  #hex
 * @param {object} theme  from themes.js
 * @param {number} seed
 */
export function buildPalette(brand, theme, seed) {
  const s = stream(subSeed(seed, 'palette'));
  const strat = theme.palette?.strategy || 'brand-anchored';
  const accentShift = theme.palette?.accentShift ?? 24;
  const neutralHue = NEUTRAL_HUE[theme.palette?.neutral] ?? 220;
  const dark = theme.mood === 'dark';

  const bh = hexToHsl(brand);

  // Primary: keep the brand hue; normalize lightness into a usable band so
  // very light or very dark brand colors still work as UI primaries.
  // Light-mood ceiling pulled 0.50 -> 0.42 (2026-08-25). `--c-primary` is a
  // BUTTON FILL, and readableOn() picks whichever of white / near-black scores
  // higher on it. At l=0.47 a mid-blue brand like #118ab2 gave white 3.1:1 and
  // near-black 4.84:1, so every primary button rendered near-black text on
  // saturated mid-blue - AA-passing but muddy and unprofessional, and reported
  // as a visibility problem. Capping lightness at 0.42 keeps the brand hue but
  // makes white text clear AA on the fill, which is what a brand button should
  // look like. The floor stays 0.34 so a very dark brand doesn't go black.
  const primaryL = dark
    ? clamp(bh.l, 0.42, 0.62)
    : clamp(bh.l, 0.34, 0.42);
  let primary = hslToHex({ h: bh.h, s: clamp(bh.s, 0.5, 0.92), l: primaryL });

  // Escape the "muddy middle". readableOn() picks whichever of white or
  // near-black scores higher on the fill. For a genuinely BRIGHT hue (cyan,
  // lime) dark text wins by a mile and looks right, and for a dark hue white
  // wins and looks right - both fine. The bad band is in between, where
  // NEITHER is comfortable: San Diego's #118ab2 gave white 3.1:1 and
  // near-black 4.84:1, so it settled for dark text on saturated mid-blue -
  // AA-passing but muddy, and reported as unreadable. When the best available
  // option is this weak, the fill itself is the problem: darken it (hue and
  // saturation untouched) until WHITE clears AA properly. Bright-hue brands
  // are left alone because their dark-text result is already strong.
  if (!dark) {
    const best = Math.max(contrast(primary, '#ffffff'), contrast(primary, '#0b0f19'));
    if (best < 5.5) {
      // Target 5.6, not a bare 4.6 pass: stopping at the AA line left buttons
      // at 4.6-4.8:1, which is still visibly weak white-on-colour. This lands
      // them in the same comfortable band the naturally-dark brands already
      // sit in.
      let l = primaryL;
      while (l > 0.2 && contrast(primary, '#ffffff') < 5.6) {
        l -= 0.02;
        primary = hslToHex({ h: bh.h, s: clamp(bh.s, 0.5, 0.92), l });
      }
    }
  }

  // Blended neutral hue (see full rationale further down, by `bg`/`surface`):
  // computed here too because 'steel-dark' and 'monochrome-accent' below
  // build --c-secondary (the footer + .section--dark + emergency-band
  // background) straight off the theme's fixed neutralHue at very low
  // saturation - same "generic gray, independent of this business's actual
  // brand color" bug as bg/surface had, just on a different token. Flagged
  // directly: a monochrome-accent footer read as flat muddy gray-brown with
  // no visible brand character at all.
  const darkNeutralHue = dark ? blendHue(neutralHue, bh.h, 0.65) : neutralHue;

  // Secondary + accent by strategy.
  let secondary, accent;
  switch (strat) {
    case 'muted-luxe':
      secondary = hslToHex({ h: bh.h, s: clamp(bh.s * 0.55, 0.12, 0.4), l: dark ? 0.3 : 0.28 });
      accent = adjustHue(primary, accentShift, { s: 0.7, l: dark ? 0.6 : 0.5 });
      break;
    case 'high-energy':
      secondary = rotate(primary, -accentShift * 0.5);
      accent = adjustHue(primary, accentShift, { s: 0.95, l: 0.55 });
      break;
    case 'steel-dark':
      secondary = hslToHex({ h: darkNeutralHue, s: 0.14, l: 0.24 });
      accent = adjustHue(primary, accentShift, { s: 0.85, l: 0.6 });
      break;
    case 'monochrome-accent':
      // s:0.08 read as flat, brand-less gray (the actual complaint) - 0.16
      // plus the brand-blended hue keeps this strategy's signature restraint
      // (still clearly the most neutral of the four) while giving the
      // footer/dark-band real, visible color character instead of none.
      secondary = hslToHex({ h: dark ? darkNeutralHue : neutralHue, s: dark ? 0.16 : 0.08, l: dark ? 0.32 : 0.2 });
      accent = accentShift === 0 ? primary : adjustHue(primary, accentShift, { s: 0.9, l: 0.52 });
      break;
    case 'brand-anchored':
    default:
      secondary = withLightness(primary, dark ? 0.34 : 0.24);
      accent = adjustHue(primary, accentShift, { s: 0.88, l: dark ? 0.62 : 0.52 });
  }

  // Small deterministic jitter so same-theme same-brand-family sites still vary.
  const jitter = s.int(-6, 6);
  accent = rotate(accent, jitter);
  // Harmonize: yellow/lime hues go neon at high lightness - deepen them so the
  // accent reads as rich gold/amber rather than a garish highlighter.
  accent = harmonize(accent);
  secondary = harmonize(secondary, true);

  // Surfaces + text.
  // DARK-mood surfaces used to be `neutralHue` alone - a fixed 4-value
  // per-THEME category (cool/warm/steel/ink), completely independent of the
  // business's own brand color. Every business on the same dark theme got
  // the exact same near-black background regardless of what's in the Excel
  // sheet's Primary Color column - it read as generic "deep gray" rather
  // than a color derived from that business's own brand. Blending in the
  // business's own hue (65% weight, shortest-arc so it never wraps the
  // wrong way around the color wheel) keeps the theme's neutral character
  // as a stabilizing influence while making the actual background/surface
  // colors visibly belong to THIS business, not just the theme.
  // (`darkNeutralHue` itself is computed earlier, above the secondary/accent
  // switch, so 'steel-dark'/'monochrome-accent' can share it too.)
  const bg = dark
    ? hslToHex({ h: darkNeutralHue, s: 0.22, l: 0.07 })
    : hslToHex({ h: neutralHue, s: 0.28, l: 0.985 });
  const surface = dark
    ? hslToHex({ h: darkNeutralHue, s: 0.2, l: 0.12 })
    : '#ffffff';
  // Light-mood surfaceAlt sat at l:0.965 - only 2 points below bg's 0.985 and
  // a literal #ffffff surface, so alternating .section/.section--alt bands
  // (and every white card on top of them) were visually indistinguishable -
  // "too much white" across a whole page. Same hue as before, just enough
  // saturation + lightness drop to read as a genuine soft-tinted band.
  const surfaceAlt = dark
    ? hslToHex({ h: darkNeutralHue, s: 0.2, l: 0.16 })
    : hslToHex({ h: neutralHue, s: 0.34, l: 0.93 });

  const text = dark
    ? hslToHex({ h: darkNeutralHue, s: 0.12, l: 0.94 })
    : hslToHex({ h: neutralHue, s: 0.28, l: 0.12 });
  // Text sits on bg, surface AND surfaceAlt (tinted bands: stats, trustbar,
  // coverage cloud, footer…). A color readable on `bg` alone can dip below AA on
  // the lighter surfaceAlt, so guarantee readability on the HARDEST of the three.
  // Also include `section--tint`'s actual rendered background (`--grad-soft`'s
  // top stop, a 16% primary tint over bg - raised from 7% so the tint band
  // reads as an actual color instead of a third shade of white; kept in sync
  // with the CSS value here so the contrast guarantee below still matches
  // what's really on screen) - text (e.g. `.cov-panel__n`) sits directly on
  // it, and a tint shift is enough to erode an exactly-4.5-targeted color for
  // darker/saturated brand colors (found via a full 1000-business sweep:
  // 229/1000 failed as low as 4.13:1 before this, at the old 7% value).
  const textSurfaces = [bg, surface, surfaceAlt, mixSrgb(primary, bg, 0.16)];
  // NOTE: `secondary` is deliberately NOT in this list. `ensureContrast`
  // adjusts lightness toward passing ONE target surface at a time; bg and
  // secondary often need adjustment in OPPOSITE directions (e.g. light-mood
  // bg wants a darker fg, but secondary is itself dark and wants a lighter
  // fg) - adding secondary here was tried and made mutedText/text FAIL
  // against the much more common bg/surface/surfaceAlt (measured as low as
  // 1.44:1) to chase a narrower problem (an outline-skin button's text
  // sitting directly on `.section--dark`, which uses --c-secondary). That
  // narrower case is fixed below with `onSecondary` directly (already
  // guaranteed safe against secondary specifically via readableOn), not by
  // making the shared text tokens try to satisfy every surface at once.
  const hardestFor = (fg) => textSurfaces.reduce((a, b) => (contrast(fg, a) <= contrast(fg, b) ? a : b));
  const mutedBase = dark ? hslToHex({ h: darkNeutralHue, s: 0.1, l: 0.72 }) : hslToHex({ h: neutralHue, s: 0.16, l: 0.42 });
  const mutedText = ensureContrast(mutedBase, hardestFor(mutedBase), 4.5);
  const border = dark
    ? hslToHex({ h: darkNeutralHue, s: 0.14, l: 0.24 })
    : hslToHex({ h: neutralHue, s: 0.2, l: 0.9 });

  // Semantic.
  const success = '#16A34A';
  const emergency = pickEmergency(primary);

  // Accessible on-color foregrounds.
  const onPrimary = readableOn(primary);
  const onAccent = readableOn(accent);
  const onEmergency = readableOn(emergency);
  // The footer sits on --c-secondary, whose lightness varies by strategy, so it
  // needs its OWN readable foreground (not onPrimary, which only guarantees
  // contrast against --c-primary).
  const onSecondary = readableOn(secondary);

  // Link/brand-text color: guaranteed readable on the HARDEST surface (so small
  // brand text passes on surface and surfaceAlt too, not just bg).
  const link = ensureContrast(primary, hardestFor(primary), 4.5);
  // Same guarantee for ACCENT-as-text (the `outline-gold` CTA style paints its
  // button text/border in raw accent - accent is only mood-gated to dark
  // themes, and on a truly dark `bg` (l≈0.08) a mid-lightness accent can still
  // land under 4.5:1 for some hues).
  const accentLink = ensureContrast(accent, hardestFor(accent), 4.5);
  // Same guarantee for EMERGENCY-as-text (the outline CTA skins paint the
  // "Call" button's text/border in raw emergency red so both hero buttons
  // share the same outline structure as the primary button - see css.js
  // `.cta-outline-square`/`.cta-outline-gold`). `emergency` itself is only
  // tuned so WHITE TEXT reads on it as a solid fill (onEmergency); as a
  // foreground color on the page's own surfaces it needs its own guarantee.
  const emergencyLink = ensureContrast(emergency, hardestFor(emergency), 4.5);
  // `.btn--ghost` paints its text on a `color-mix(in srgb, primary 6%, ...)`
  // tinted background, not on a raw bg/surface/surfaceAlt token - a 6% brand
  // tint shifts luminance just enough that `link` (guaranteed only against the
  // RAW surfaces) can drop under 4.5:1 for darker/more-saturated brand colors
  // (found via a full 1000-business sweep: 90/1000 failed as low as 4.34:1).
  // Precompute the actual tinted background for each surface and guarantee
  // against the hardest of THOSE instead.
  const ghostBgs = textSurfaces.map((s) => mixSrgb(primary, s, 0.06));
  const hardestGhostBg = ghostBgs.reduce((a, b) => (contrast(primary, a) <= contrast(primary, b) ? a : b));
  const ghostText = ensureContrast(primary, hardestGhostBg, 4.5);
  // Brand BAND gradient far-end: an accent-hued color that on-primary text can
  // read on, so a full-width `section--brand` band (primary→gradBandEnd) stays
  // readable end-to-end even when the raw accent is light.
  const gradBandEnd = ensureContrast(accent, onPrimary, 4.5);

  return {
    strategy: strat,
    mood: theme.mood,
    primary, secondary, accent,
    bg, surface, surfaceAlt,
    text, mutedText, border,
    success, emergency,
    onPrimary, onAccent, onEmergency, onSecondary,
    link, gradBandEnd, ghostText, accentLink, emergencyLink,
    // A soft tint of the brand for section washes.
    tint: dark ? withLightness(primary, 0.18) : mixToward(primary, bg, 0.9),
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Circular hue interpolation (shortest arc) - a plain weighted average of
 *  two hues can go the WRONG way around the wheel (e.g. averaging 10 and
 *  350 naively gives 180, a teal, instead of 0, red). */
function blendHue(h1, h2, t) {
  const diff = ((h2 - h1 + 540) % 360) - 180;
  return (h1 + diff * t + 360) % 360;
}

/** Tame neon yellow/lime accents into rich gold/amber. */
function harmonize(hex, isSecondary = false) {
  const c = hexToHsl(hex);
  if (c.h >= 42 && c.h <= 100) {
    return hslToHex({
      h: c.h < 60 ? c.h : Math.max(48, c.h - 12), // pull lime back toward gold
      s: Math.min(c.s, isSecondary ? 0.6 : 0.82),
      l: Math.min(c.l, isSecondary ? c.l : 0.46),
    });
  }
  return hex;
}

function adjustHue(hex, shift, { s, l }) {
  const c = hexToHsl(hex);
  return hslToHex({ h: c.h + shift, s, l });
}

function mixToward(hex, target, t) {
  const a = hexToHsl(hex), b = hexToHsl(target);
  return hslToHex({ h: a.h, s: a.s * (1 - t) + b.s * t, l: a.l * (1 - t) + b.l * t });
}

/** Matches CSS `color-mix(in srgb, hex pct%, base)` - a plain per-channel
 *  weighted average in gamma-encoded sRGB (NOT the HSL-space `mixToward`
 *  above), so this precomputes the exact color a `color-mix(in srgb, ...)`
 *  CSS background will render as. */
function mixSrgb(hex, base, pct) {
  const a = hexToRgb(hex), b = hexToRgb(base);
  return rgbToHex({
    r: Math.round(a.r * pct + b.r * (1 - pct)),
    g: Math.round(a.g * pct + b.g * (1 - pct)),
    b: Math.round(a.b * pct + b.b * (1 - pct)),
  });
}

/**
 * The "urgent" action colour - the Call button, the header call button and the
 * emergency band.
 *
 * This USED to return a fixed red (hue 4, or 8 for red/orange brands) no matter
 * what the business's brand colour was. The result: `#d1261a` on 12 of 13
 * generated sites, so the single most prominent button on every page was the
 * same red everywhere and the brand colour never reached it (user-reported,
 * 2026-08-25: "why my all sites use the same red color?"). The Excel brand
 * colour is the one piece of per-business identity this dataset actually has -
 * it should own the primary AND the urgent action, not just the primary.
 *
 * Now derived from the brand hue: same hue family, pushed saturated and a step
 * darker than `primary`, so it reads as the heavier of the two actions while
 * still obviously belonging to this site. Lightness is held at/below 0.46
 * because that is what lets `readableOn()` land white text safely above the
 * 4.5:1 AA threshold - the reason the old fixed red used 0.46 rather than 0.5,
 * and the constraint that matters most here.
 */
function pickEmergency(primary) {
  const p = hexToHsl(primary);
  return hslToHex({
    h: p.h,
    // Always clearly saturated so it still reads as a deliberate call-to-
    // action rather than a muted tint of the primary.
    s: clamp(Math.max(p.s * 1.15, 0.68), 0.68, 0.92),
    // Clearly darker than primary (clamped to 0.34-0.62 above), not just a
    // shade off it: at -0.10 a mid-teal brand produced #149a8f primary and
    // #099085 emergency, near-identical on screen, so the Call button stopped
    // reading as a distinct action. Floored at 0.24 so it never reads black.
    l: clamp(p.l - 0.17, 0.24, 0.44),
  });
}

/** A compact signature of the palette for uniqueness comparison. */
export function paletteSignature(p) {
  return [p.primary, p.accent, p.bg, p.mood].join('|');
}

export default buildPalette;
