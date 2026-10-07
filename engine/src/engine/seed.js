/**
 * Deterministic Website Assignment.
 *
 *   business → seed → theme → palette → typography → variants → designConfig
 *
 * The seed is a stable hash of (domain + name). Given the same business, the
 * same design is produced on every run - unless `regenNonce` is supplied by the
 * uniqueness engine to deliberately re-roll a collision.
 */

import { seedFor, subSeed } from '../util/hash.js';
import { THEMES, THEME_IDS, THEME_BY_ID } from '../../config/themes.js';
import { buildPalette } from '../design/palette.js';
import { selectVariants, variantFingerprint } from './variation.js';

/**
 * Pick a theme for a business. Decorrelated from the color-derived seed axis so
 * theme and palette vary independently. In preview spread mode the caller can
 * force a specific theme.
 */
function pickTheme(seed, forceThemeId) {
  if (forceThemeId && THEME_BY_ID[forceThemeId]) return THEME_BY_ID[forceThemeId];
  const idx = subSeed(seed, 'theme') % THEMES.length;
  return THEMES[idx];
}

/**
 * @param {import('../data/model.js').Business} business
 * @param {object} [opts]
 * @param {string} [opts.forceThemeId]  preview: pin a theme
 * @param {number} [opts.regenNonce]    uniqueness: re-roll variants only
 * @param {number} [opts.divergence]    uniqueness: 0..1, push variants off defaults
 * @param {object} [opts.forceVariants] pin specific variant axes (see selectVariants)
 */
export function assignDesign(business, opts = {}) {
  const baseSeed = seedFor(business.domain, business.name);
  const seed = opts.regenNonce ? subSeed(baseSeed, `regen:${opts.regenNonce}`) : baseSeed;

  const theme = pickTheme(baseSeed, opts.forceThemeId);
  const palette = buildPalette(business.primaryColor, theme, seed);

  const variants = selectVariants(theme, seed, opts.divergence || 0, opts.forceVariants);
  const resolvedType = {
    headingFont: variants.headingFont,
    bodyFont: variants.bodyFont,
    headingWeight: theme.typography.headingWeight,
    bodyWeight: theme.typography.bodyWeight,
    scale: +(theme.typography.scale + variants.typeScaleTweak).toFixed(3),
    tracking: theme.typography.headingTracking,
    headingCase: theme.typography.headingCase,
    mono: theme.typography.mono || 'ui-monospace, SFMono-Regular, Menlo, monospace',
  };

  const fingerprint = variantFingerprint(theme.id, palette, resolvedType, variants);

  return {
    seed: baseSeed,
    effectiveSeed: seed,
    regenNonce: opts.regenNonce || 0,
    themeId: theme.id,
    themeName: theme.name,
    mood: theme.mood,
    theme,
    palette,
    typography: resolvedType,
    variants,
    fingerprint,
  };
}

export { THEME_IDS };
export default assignDesign;
