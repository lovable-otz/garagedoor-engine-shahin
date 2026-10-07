/**
 * Design-Token Engine.
 *
 * Resolves a business's theme + palette + typography + variation tweaks into a
 * single flat token object. These tokens become CSS custom properties, so the
 * entire site is themed from one `:root` block - no styling is hardcoded in
 * markup.
 */

/** Widest a 'full' container-width site's content ever gets (see 'max-w'). */
export const FULL_MAX_WIDTH = 1920;

const SHADOWS = {
  none: 'none',
  soft: '0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.08)',
  'soft-color': '0 8px 30px var(--shadow-tint)',
  hard: '4px 4px 0 rgba(15,23,42,.9)',
  ring: '0 0 0 1px var(--c-border), 0 1px 2px rgba(15,23,42,.05)',
  glow: '0 0 0 1px rgba(255,255,255,.06), 0 20px 60px rgba(0,0,0,.45)',
};

/**
 * @param {object} design result of assignDesign()
 */
export function resolveTokens(design) {
  const { theme, palette, typography, variants } = design;
  const L = theme.layout;
  const base = 16;
  const scale = typography.scale;

  // Modular type scale.
  const size = (step) => +(base * Math.pow(scale, step)).toFixed(2);
  const type = {
    // fs-xs is FLOORED at 12px. It comes from size(-1.5), i.e. base / scale^1.5,
    // so a theme with a big display scale drives it down hard: 13 of the 18
    // themes landed under 12px and premium-dark / neo-brutalist-bold bottomed
    // out at 10.3px. That token is not decorative - it carries eyebrows, tags,
    // figure captions, stat labels and chips, so on those themes real content
    // was rendering at 10-11px on a phone. The scale still drives every other
    // step; this only stops the smallest one going below a legible size.
    xs: Math.max(12, size(-1.5)), sm: size(-0.5), base: base, md: size(1), lg: size(2),
    xl: size(3), h3: size(3), h2: size(4.2), h1: size(6),
  };

  // Density affects vertical rhythm. Section padding is capped so stacked
  // sections never produce excessive white space (two full-padded sections
  // otherwise double up).
  const densMul = { tight: 0.72, regular: 0.82, airy: 0.95 }[variants.densityTweak] || 0.82;
  // Clamp to a sane band: never 0 (sections must breathe), never excessive.
  const sectionY = Math.max(44, Math.round(Math.min(96, theme.layout.sectionSpacing || 88) * densMul));

  const radius = Math.max(0, Math.round(theme.shape.radius * variants.radiusTweak));
  const cardRadius = Math.max(0, Math.round(theme.shape.cardRadius * variants.radiusTweak));

  return {
    // colors
    'c-primary': palette.primary,
    'c-secondary': palette.secondary,
    'c-accent': palette.accent,
    'c-bg': palette.bg,
    'c-surface': palette.surface,
    'c-surface-alt': palette.surfaceAlt,
    'c-text': palette.text,
    'c-muted': palette.mutedText,
    'c-border': palette.border,
    'c-success': palette.success,
    'c-emergency': palette.emergency,
    'c-on-primary': palette.onPrimary,
    'c-on-accent': palette.onAccent,
    'c-on-emergency': palette.onEmergency,
    'c-on-secondary': palette.onSecondary,
    'c-link': palette.link,
    'c-ghost-text': palette.ghostText,
    'c-accent-link': palette.accentLink,
    'c-emergency-link': palette.emergencyLink,
    'c-grad-band-end': palette.gradBandEnd,
    'c-tint': palette.tint,
    'shadow-tint': hexA(palette.primary, 0.22),

    // typography
    'font-heading': typography.headingFont,
    'font-body': typography.bodyFont,
    'font-mono': typography.mono,
    'weight-heading': String(typography.headingWeight),
    'weight-body': String(typography.bodyWeight),
    'tracking-heading': typography.tracking || '0',
    'fs-xs': `${type.xs}px`, 'fs-sm': `${type.sm}px`, 'fs-base': `${type.base}px`,
    'fs-md': `${type.md}px`, 'fs-lg': `${type.lg}px`, 'fs-xl': `${type.xl}px`,
    'fs-h3': `clamp(${(type.h3 * 0.8).toFixed(0)}px, 2.4vw, ${type.h3.toFixed(0)}px)`,
    'fs-h2': `clamp(${(type.h2 * 0.72).toFixed(0)}px, 3.6vw, ${type.h2.toFixed(0)}px)`,
    'fs-h1': `clamp(${(type.h1 * 0.6).toFixed(0)}px, 6vw, ${type.h1.toFixed(0)}px)`,

    // layout
    // 'full' container width: --container resolves to 100% - 2*pad-x on every
    // section; side padding grows with the viewport so content never sits
    // against the screen edge. Capped at FULL_MAX_WIDTH (1920px, user
    // 2026-10-07) so 2560px / 4K screens get a centred 1920px page instead
    // of lines stretched across the whole monitor.
    'max-w': variants.containerWidth === 'full' ? `${FULL_MAX_WIDTH}px` : `${L.maxWidth}px`,
    'pad-x': variants.containerWidth === 'full' ? `clamp(${L.containerPad}px, 4vw, 64px)` : `${L.containerPad}px`,
    'section-y': `${sectionY}px`,
    'grid-gap': `${L.gridGap}px`,

    // shape
    radius: `${radius}px`,
    'radius-card': `${cardRadius}px`,
    border: `${theme.shape.border}px`,
    shadow: SHADOWS[theme.shape.shadow] || SHADOWS.soft,

    // meta (not emitted as CSS var but handy)
    _mood: palette.mood,
    _headingCase: typography.headingCase,
  };
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export { hexA };
export default resolveTokens;
