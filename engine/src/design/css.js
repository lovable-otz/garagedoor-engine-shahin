/**
 * CSS Generator - modern, polished ("lovable") design system.
 *
 * Emits one self-contained stylesheet per site from resolved tokens + variant
 * keys. The baseline is intentionally high-end: gradient accents, layered
 * colored shadows, generous rhythm, rounded cards, pill badges, gradient icon
 * chips, and clearly DISTINCT section treatments (each homepage band gets its
 * own background + layout language so scrolling feels designed, not templated).
 *
 * All color/shape/type comes from CSS custom properties, so every theme + brand
 * palette flows through the same polished system while keeping its own identity
 * (a radius-0 brutalist theme stays sharp; a soft theme gets big rounding).
 */

import { resolveTokens } from './tokens.js';

/* 'full' container-width sites (variants.containerWidth, see variation.js).
   The tokens already uncap .container and the color-block-split hero grid via
   --max-w; these are the remaining layout rows that carry their own px cap
   and would otherwise sit as a narrow boxed strip inside a full-width page.
   Text-measure caps (paragraph ch/px limits) are deliberately left alone. */
const FULL_WIDTH_CSS = /* css */ `
/* ---- full container width ---- */
.brandbar--wide-spaced-grid .brandbar__row,
.brandbar--glass-panel-grid .brandbar__row{max-width:none}
`;

/** Remove CSS block comments and the blank lines they leave behind. */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n+/g, '\n');
}

export function generateCss(design) {
  const t = resolveTokens(design);
  const mood = t._mood;
  const headingCase = t._headingCase;

  const rootVars = Object.entries(t)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, val]) => `  --${k}: ${val};`)
    .join('\n');

  // Comments are authoring notes (they name other client sites and dates) -
  // stripped from the shipped stylesheet so they never reach view-source.
  return stripCssComments(/* css */ `
:root{
${rootVars}
  --container: min(var(--max-w), 100% - (var(--pad-x) * 2));
  --focus: 0 0 0 3px color-mix(in srgb, var(--c-accent) 55%, transparent);
  /* Ends on the contrast-safe band colour, not the raw accent: text sits on
     this gradient in several places (filled CTA banner, gradient-pill buttons,
     left-banner hero) and white on a bright accent measured 3.46 (Chandler,
     2026-10-12 contrast sweep). Decorative bars/dots look the same. */
  --grad-brand: linear-gradient(135deg, var(--c-primary), var(--c-grad-band-end));
  /* For background-clip:text gradient text ONLY - raw primary/accent aren't
     guaranteed readable as TEXT (that's what --c-link/--c-accent-link fix),
     so gradient text needs its own contrast-safe stops, not --grad-brand. */
  --grad-brand-text: linear-gradient(135deg, var(--c-link), var(--c-accent-link));
  --grad-band: linear-gradient(135deg, var(--c-primary), var(--c-grad-band-end));
  --grad-brand-2: linear-gradient(135deg, color-mix(in srgb,var(--c-primary) 88%, #fff), var(--c-accent));
  /* 7% primary tint fading straight back to flat bg read as almost no color
     at all on light themes (bg itself is ~98.5% lightness) - .section--tint
     ended up looking like a third shade of white. Stronger top stop, and it
     no longer fades all the way to flat - keeps a soft color presence
     through the whole band instead of dissolving halfway down. */
  --grad-soft: linear-gradient(180deg, color-mix(in srgb,var(--c-primary) 16%, var(--c-bg)), color-mix(in srgb,var(--c-primary) 5%, var(--c-bg)));
  --radius-lg: calc(var(--radius-card) + 8px);
  --radius-pill: 999px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.05);
  --shadow-md: 0 6px 16px -6px var(--shadow-tint), 0 2px 6px rgba(15,23,42,.06);
  --shadow-xl: 0 28px 60px -20px var(--shadow-tint), 0 8px 24px -12px rgba(15,23,42,.12);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--c-bg);color:var(--c-text);font-family:var(--font-body);
  font-weight:var(--weight-body);font-size:var(--fs-base);line-height:1.7;min-height:100vh;
  display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;height:auto;display:block}
a{color:var(--c-link);text-decoration:none}
h1,h2,h3,h4{overflow-wrap:break-word;font-family:var(--font-heading);font-weight:var(--weight-heading);
  letter-spacing:var(--tracking-heading);line-height:1.08;margin:0 0 .5em}
h1{font-size:var(--fs-h1)}h2{font-size:var(--fs-h2)}h3{font-size:var(--fs-h3)}
p{margin:0 0 1em}
strong{font-weight:700}
${headingCase === 'uppercase-hero' ? '.hero h1,.section-title{text-transform:uppercase;letter-spacing:.005em}' : ''}
:focus-visible{outline:none;box-shadow:var(--focus);border-radius:6px}
.skip-link{position:absolute;left:-999px;top:0;background:var(--c-primary);color:var(--c-on-primary);padding:.6rem 1rem;z-index:200;border-radius:0 0 8px 0}
.skip-link:focus{left:0;top:0}
.visually-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}

/* ---- layout & section rhythm ---- */
.container{width:var(--container);margin-inline:auto}
/* overflow-x:clip contains transient ENTRANCE-ANIMATION transforms. Several
   reveals translate a card horizontally before settling (x:+/-30,
   review cards x:+/-24). The .container is always about viewport-48px wide, so
   a POSITIVE x offset starts outside it at every width - gating on a
   breakpoint cannot fix that, it only moves which widths overflow. Measured:
   6px of real document overflow, i.e. a horizontal scrollbar and layout shift
   for the length of the tween, on every page carrying those sections.
   clip rather than hidden on purpose: hidden creates a scroll container,
   which would break the position:sticky used by .site-header, .sidebar and
   the process/faq/why intros. clip does not. Only the x axis is clipped, so
   sticky's vertical behaviour is untouched. */
main{flex:1;overflow-x:clip}
/* Two non-adjacent sections can end up with the exact same computed
   background (e.g. services/gallery all default to section--alt,
   or a plain section sits right before another plain section) because each
   component picks its own tone independently, with no awareness of its
   neighbors in the final page order. A shared hairline boundary guarantees
   every section reads as its own block on scroll regardless of whether the
   fill color happens to repeat - currentColor-relative so it stays visible
   against light/dark/tint/brand sections alike without a per-tone override. */
/* No hairline between sections. This border existed because two adjacent
   sections could compute the SAME background (each component picked its tone
   with no knowledge of its neighbours), so a rule was needed to show where one
   ended. balanceSectionTones() in generator/layout.js now guarantees every
   section differs from the one above it, which makes the hairline redundant -
   and with a real tone change on every boundary it read as an unwanted ruled
   line rather than a subtle aid. Reported on Toms River 2026-08-27:
   "there are a divider horizontal lines that not suitable with my site". */
.section{padding-block:var(--section-y);position:relative}
.section--alt{background:var(--c-surface-alt)}
.section--tint{background:var(--grad-soft)}
.section--dark{background:var(--c-secondary);color:var(--c-on-secondary)}
.section--dark .lead,.section--dark p,.section--brand .lead,.section--brand p{color:color-mix(in srgb,currentColor 92%,transparent)}
/* emergency band: heading+copy on one side, a CTA button on the other. Was
   inline styles with no responsive rule at all - flex-wrap:wrap alone just
   drops the button onto its own line at any width where the two don't fit
   side by side, and justify-content:space-between then left-aligns that
   lone wrapped button, leaving a large dead gap to its right. Explicitly
   stack + full-width the button once it wraps, instead of leaving it
   orphaned - the general fix for ANY two-item space-between row here on. */
.emergency-band__row{display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center;justify-content:space-between}
.emergency-band__copy{max-width:52ch}
.emergency-band__copy h2{margin:0 0 .3em}
.emergency-band__copy p{margin:0}
@media (max-width:720px){
  .emergency-band__row{flex-direction:column;align-items:stretch}
  .emergency-band__cta,.emergency-band__cta .btn{width:100%}
}
.section--brand{background:var(--grad-band);color:var(--c-on-primary)}

/* The sectionDivider mark system was removed 2026-08-27: "i dont need
   section divider horizontal line remove this from all sites".
   It began as a curved divider (rejected), became small flat marks, and
   several of those marks were themselves full-width rules. It is also now
   redundant: balanceSectionTones() guarantees every section paints a
   different background from the one above it, so the boundary is already
   visible without drawing anything. Do not reintroduce a per-section
   divider mark - the tone change IS the divider. */
.section-head{max-width:60ch;margin-bottom:2rem}
.section-head.center{margin-inline:auto;text-align:center}
/* Compact page header for index pages (heading only) - avoids a full empty
   padded section stacking on top of the next section. */
.page-head{padding-block:clamp(2.2rem,5vw,3.4rem) .5rem}
.page-head .section-head{margin-bottom:0}
/* A section right after a hero shouldn't add a second big top gap. */
.hero + .section,.hero + section.section{padding-top:clamp(1.4rem,3.5vw,2.4rem)}
.eyebrow{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-heading);font-weight:700;
  text-transform:uppercase;letter-spacing:.1em;font-size:var(--fs-xs);color:color-mix(in srgb,var(--c-link) 66%,var(--c-text));
  background:color-mix(in srgb,var(--c-primary) 16%, transparent);padding:.4rem .85rem;border-radius:var(--radius-pill);margin-bottom:1rem}
.section--dark .eyebrow,.section--brand .eyebrow{color:currentColor;background:color-mix(in srgb,#fff 16%,transparent)}
.lead{font-size:var(--fs-md);color:var(--c-muted);line-height:1.6}
.grid{display:grid;gap:var(--grid-gap)}
.cols-2{grid-template-columns:repeat(2,1fr)}
.cols-3{grid-template-columns:repeat(3,1fr)}
.cols-4{grid-template-columns:repeat(4,1fr)}

/* ---- buttons / CTA variants ---- */
/* min-height:44px is the standing "never under 44px tall" rule enforced ONCE,
   at the base, rather than per skin. Each ctaStyle skin restyles .btn with its
   own padding, so the height is really decided 8 different ways - and two of
   them (minimal-quiet-btn at 43.3px, and compact-condensed-btn at 33px before
   it was patched individually) drifted under the floor. A base floor makes
   that impossible for every existing AND future skin; a skin that wants a
   taller button still just raises its own min-height. */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font-family:var(--font-heading);
  font-weight:700;font-size:var(--fs-sm);line-height:1;cursor:pointer;text-decoration:none;white-space:nowrap;
  padding:.95rem 1.6rem;min-height:44px;border:var(--border) solid transparent;border-radius:var(--radius);
  transition:transform .14s ease,box-shadow .18s ease,background .18s ease,filter .18s ease}
.btn:hover{transform:translateY(-2px)}
.btn:active{transform:translateY(0)}
/* --grad-band, NOT --grad-brand. Both start at --c-primary, but --grad-brand
   ends at the RAW --c-accent, which is deliberately bright (San Diego:
   rgb(25,240,236) cyan). The label is --c-on-primary, chosen for contrast
   against --c-primary only - so on a gradient-filled button the text stayed
   readable at the primary end and washed out to roughly 1.4:1 across the
   accent end, i.e. the right-hand half of every primary button was
   effectively unreadable. --grad-band ends at --c-grad-band-end, which is
   exactly --c-accent already pushed through ensureContrast() against
   --c-on-primary, so the label clears AA along the WHOLE sweep. Never fill a
   button (or anything else carrying text) with --grad-brand. */
.btn--primary{background:var(--grad-band);color:var(--c-on-primary);box-shadow:0 10px 24px -10px var(--shadow-tint)}
.btn--primary:hover{filter:brightness(1.06);box-shadow:0 16px 30px -12px var(--shadow-tint)}
.btn--ghost{background:color-mix(in srgb,var(--c-primary) 6%,transparent);color:var(--c-ghost-text);border-color:color-mix(in srgb,var(--c-primary) 22%,transparent)}
.btn--ghost:hover{background:color-mix(in srgb,var(--c-primary) 12%,transparent)}
.btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency);box-shadow:0 10px 24px -10px color-mix(in srgb,var(--c-emergency) 60%,transparent)}
.btn--lg{padding:1.15rem 2.2rem;font-size:var(--fs-base)}
.section--dark .btn--primary,.section--brand .btn--primary{background:var(--c-on-primary);color:var(--c-primary)}
/* CTA style skins - every skin below now has its OWN distinct hover
   interaction instead of all seven sharing the base translateY(-2px) lift
   (solid-square keeps that base lift as its baseline; chunky-3d's opposite
   press-in and soft-glass's brighten were already distinct). */
.cta-solid-pill .btn{border-radius:var(--radius-pill);transition:transform .16s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease}
/* Pill "pop": lift + a slight overshoot scale (the bouncy cubic-bezier),
   instead of a flat lift - reads as a squeeze-release. */
.cta-solid-pill .btn:hover{transform:translateY(-2px) scale(1.04)}
/* Both buttons in the group share the same OUTLINE structure (transparent
   fill, colored border, solid-fill-on-hover) - only the color differs
   (brand vs. urgent-red vs. neutral), so a hero's "Schedule" +
   "Call" pair never mismatches solid-vs-outline. */
.cta-outline-square .btn--primary,.cta-outline-square .btn--emergency,.cta-outline-square .btn--ghost{
  background:transparent;box-shadow:none;transition:background-color .2s ease,color .2s ease,border-color .2s ease}
.cta-outline-square .btn--primary{color:var(--c-link);border-color:var(--c-link)}
.cta-outline-square .btn--emergency{color:var(--c-emergency-link);border-color:var(--c-emergency-link)}
.cta-outline-square .btn--ghost{color:var(--c-text);border-color:var(--c-border)}
/* Classic outline "fill sweep" - no movement at all, the outline just
   fills solid on hover. Deliberately cancels the base lift so this reads as
   a pure fill transition, not fill-plus-lift. */
.cta-outline-square .btn:hover{transform:none}
.cta-outline-square .btn--primary:hover{background:var(--c-link);color:var(--c-on-primary);border-color:var(--c-link)}
.cta-outline-square .btn--emergency:hover{background:var(--c-emergency);color:var(--c-on-emergency);border-color:var(--c-emergency)}
.cta-outline-square .btn--ghost:hover{background:var(--c-text);color:var(--c-bg);border-color:var(--c-text)}
.cta-solid-square-loud .btn{border-radius:2px;text-transform:uppercase;letter-spacing:.04em;box-shadow:4px 4px 0 var(--c-secondary)}
.cta-solid-square-loud .btn:hover{box-shadow:6px 6px 0 var(--c-secondary)}
.cta-solid-square .btn{border-radius:3px}
/* Same "both buttons share one structure" rule as outline-square, applied to
   gold's outline-plus-glow treatment. */
.cta-outline-gold .btn--primary,.cta-outline-gold .btn--emergency,.cta-outline-gold .btn--ghost{
  background:transparent;box-shadow:none;transition:box-shadow .25s ease,transform .18s ease}
.cta-outline-gold .btn--primary{border-color:var(--c-accent-link);color:var(--c-accent-link)}
.cta-outline-gold .btn--emergency{border-color:var(--c-emergency-link);color:var(--c-emergency-link)}
.cta-outline-gold .btn--ghost{border-color:var(--c-border);color:var(--c-text)}
/* Soft glow ring expanding outward - no lift, the glow itself is the
   whole effect (fits the "gold" material better than a physical movement). */
.cta-outline-gold .btn:hover{transform:none}
.cta-outline-gold .btn--primary:hover{box-shadow:0 0 0 5px color-mix(in srgb,var(--c-accent-link) 20%,transparent)}
.cta-outline-gold .btn--emergency:hover{box-shadow:0 0 0 5px color-mix(in srgb,var(--c-emergency-link) 20%,transparent)}
.cta-outline-gold .btn--ghost:hover{box-shadow:0 0 0 5px color-mix(in srgb,var(--c-text) 15%,transparent)}
/* The header "Schedule" button is always a solid, filled button. */
.btn--solid{background:var(--grad-band)!important;color:var(--c-on-primary)!important;border-color:transparent!important;box-shadow:0 10px 24px -10px var(--shadow-tint)}
/* Pill shape applies to EVERY button in the group (not just primary) so the
   hero's "Schedule" + "Call" pair share the same silhouette; only
   primary gets the extra animated-gradient shimmer flourish. */
.cta-gradient-pill .btn{border-radius:var(--radius-pill)}
.cta-gradient-pill .btn--primary{background:var(--grad-brand);
  background-size:220% 220%;background-position:0% 50%;transition:background-position .4s ease,transform .16s ease}
/* Shimmer: the oversized gradient's position slides across on hover instead
   of the button just lifting - the brand colors visibly travel. */
.cta-gradient-pill .btn--primary:hover{background-position:100% 50%}
/* Frosted/glossy fill - a lightened, theme-derived tint (not raw white-
   transparency) with an inset top highlight, so it still reads correctly on
   both light and dark sections instead of only working over a photo. */
.cta-soft-glass .btn{border-radius:14px}
/* Lightening the fill toward white (as this used to do, up to 22% on hover)
   risked breaking --c-on-primary's contrast guarantee - that token is
   computed against the FULL-STRENGTH primary color, not a lightened mix of
   it, so a business with an already-borderline-dark primary could drop
   under 4.5:1 white-on-mix. Keep the fill at guaranteed-safe full-strength
   var(--grad-brand) and express the "glass" character entirely via the
   translucent border + inset highlight instead. */
.cta-soft-glass .btn--primary{background:var(--grad-band);color:var(--c-on-primary);border:1px solid color-mix(in srgb,#fff 32%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 35%,transparent),0 8px 20px -10px var(--shadow-tint)}
.cta-soft-glass .btn--primary:hover{filter:brightness(1.08)}
/* Thick-bordered block with a hard offset shadow that the button presses
   INTO on hover (shrinks to nothing, button shifts onto it) - a tactile,
   physical-press feel, the opposite interaction from every other skin's
   hover-lift. Rounded + non-uppercase, so it doesn't read as a re-skin of
   solid-square-loud's sharp-corner brutalist shadow. */
.cta-chunky-3d .btn{border-radius:12px;border:2px solid color-mix(in srgb,var(--c-text) 82%,transparent);
  box-shadow:4px 4px 0 var(--c-secondary);transition:transform .12s ease,box-shadow .12s ease}
.cta-chunky-3d .btn:hover,.cta-chunky-3d .btn:active{transform:translate(4px,4px);box-shadow:0 0 0 transparent}
.cta-chunky-3d .btn--primary{border-color:color-mix(in srgb,var(--c-on-primary) 55%,var(--c-primary) 45%)}

/* ---- ctaStyle / button-group skins (skin-only, buttons) (12 keys) ---- */
/* ============================================================
   CTA style skins - NEW keys (12): shadow-stack-btn, soft-pill-glow,
   bordered-thick, minimal-quiet-btn, color-block-btn, ribbon-corner-btn,
   duotone-fill, glass-frost-btn, edge-line-btn, oversized-bold,
   compact-condensed-btn, layered-depth-btn.
   Every rule below either restyles '.btn' generically (covers primary/
   emergency/ghost identically) or, where noted, only ADDS a decorative
   flourish on top of a button's own existing (already contrast-safe)
   fill/text - none of them replace a button's background or text color,
   so .btn--primary/.btn--emergency keep color:var(--c-on-primary)/
   var(--c-on-emergency) from the base rules untouched. Where a per-button
   tint is needed (borders, inset sheens, divider lines, glows) 'currentColor'
   is used deliberately - it resolves to each button's OWN already-correct
   foreground color (on-primary / on-emergency / ghost text), so the same
   single rule adapts safely across all three button kinds with zero risk
   of a contrast mismatch. ============================================ */

/* shadow-stack-btn: soft, blurred, multi-layer stacked box-shadow depth (a
   hairline + two offset blurred layers) reading as a short stack of cards
   under the button - distinct from chunky-3d's single hard-edge flat-color
   offset block and from layered-depth-btn's solid pseudo-element layers
   below. Hover pushes the stack deeper (shadows grow) instead of the flat
   translateY(-2px) default. */
.cta-shadow-stack-btn .btn{border-radius:10px;
  box-shadow:0 1px 0 var(--c-border),0 6px 10px -6px color-mix(in srgb,var(--c-text) 35%,transparent),0 16px 24px -14px color-mix(in srgb,var(--c-text) 30%,transparent);
  transition:transform .18s ease,box-shadow .18s ease}
.cta-shadow-stack-btn .btn:hover{transform:translateY(-3px);
  box-shadow:0 1px 0 var(--c-border),0 10px 16px -8px color-mix(in srgb,var(--c-text) 38%,transparent),0 26px 34px -16px color-mix(in srgb,var(--c-text) 32%,transparent)}
.cta-shadow-stack-btn .btn:active{transform:translateY(-1px)}

/* soft-pill-glow: pill shape that keeps its normal solid fill and adds a
   soft ambient glow ring that only appears (blooms outward) on hover - no
   lift at all, the glow itself is the entire hover story. Differs from
   solid-pill's bounce-scale and from outline-gold's glow (which is paired
   with a fully unfilled/outline button, not a solid pill). */
.cta-soft-pill-glow .btn{border-radius:var(--radius-pill);
  box-shadow:0 0 0 0 color-mix(in srgb,var(--c-primary) 45%,transparent);
  transition:box-shadow .3s ease,transform .3s ease}
.cta-soft-pill-glow .btn:hover{transform:translateY(-1px);
  box-shadow:0 0 0 8px color-mix(in srgb,var(--c-primary) 16%,transparent),0 0 22px 4px color-mix(in srgb,var(--c-primary) 22%,transparent)}

/* bordered-thick: each button keeps its normal fill and gains a thick
   (3px) currentColor-based stroke around it - a "framed solid button",
   distinct from outline-square which drops the fill entirely to become an
   outline button. currentColor auto-adapts the frame color per button
   kind with no extra tokens needed. */
.cta-bordered-thick .btn{border-radius:8px;border-width:3px;border-style:solid;
  border-color:color-mix(in srgb,currentColor 45%,transparent);
  transition:border-color .2s ease,transform .2s ease}
.cta-bordered-thick .btn:hover{border-color:color-mix(in srgb,currentColor 75%,transparent);transform:translateY(-1px)}

/* minimal-quiet-btn: the quiet/editorial mood applied to a button that
   still has to look clickable - flat (no shadow), small radius, slightly
   tightened padding, and a restrained fade-only hover (no lift, no scale,
   no glow). The calmest skin on this axis by design. */
.cta-minimal-quiet-btn .btn{border-radius:4px;box-shadow:none;padding:.8rem 1.4rem;transition:opacity .2s ease}
.cta-minimal-quiet-btn .btn:hover{transform:none;opacity:.82}
.cta-minimal-quiet-btn .btn:active{opacity:.7}
/* Sizing .btn without restating .btn--lg leaves the large modifier DEAD - the
   2-class skin selector outranks the 1-class .btn--lg, so every "large" hero
   button silently rendered at the skin's tighter size. Measured on
   Murfreesboro: 43.3px tall, under the 44px floor. */
.cta-minimal-quiet-btn .btn--lg{padding:1.05rem 2rem;font-size:var(--fs-base);min-height:52px}

/* color-block-btn: sharp, un-rounded solid block with a subtle inset
   "shelf" line along the bottom edge (currentColor-based) and a
   press-darken hover (filter, no movement) instead of a lift - reads as a
   solid printed block, not a soft rounded pill or card. */
.cta-color-block-btn .btn{border-radius:0;padding:1rem 1.9rem;
  box-shadow:inset 0 -4px 0 color-mix(in srgb,currentColor 22%,transparent);
  transition:filter .18s ease,transform .18s ease}
.cta-color-block-btn .btn:hover{transform:none;filter:brightness(.94)}
.cta-color-block-btn .btn:active{filter:brightness(.88)}
/* Same dead-.btn--lg bug as minimal-quiet-btn above. This one cleared 44px on
   its own so it never surfaced as a tap-target failure - the defect was that
   a "large" button was indistinguishable from a normal one. */
.cta-color-block-btn .btn--lg{padding:1.25rem 2.4rem;font-size:var(--fs-base)}

/* ribbon-corner-btn: ONE square corner against three rounded ones. Static.
   The corner-ribbon FOLD this skin was named for is gone (2026-08-27, explicit
   user instruction: "this button animation dont need"). It was a rotated
   square tucked under the top-right corner that GREW on hover, and it read as
   a stray pale triangle sitting on the button rather than as decoration -
   clearly visible on Dana Point's /request-a-quote/ CTA.
   The skin keeps a corner-based identity so it stays distinct from the other
   19, but expresses it through the button's own shape instead of an overlaid
   element, so there is nothing to animate and nothing that can misread as an
   artifact. Hover falls through to the engine's standard button lift, same as
   every other skin. Do not reintroduce a growing pseudo-element here. */
.cta-ribbon-corner-btn .btn{border-radius:10px 0 10px 10px}

/* duotone-fill: a genuine structural two-zone split inside each button - a
   thin internal vertical divider line (currentColor) carves a narrow
   left-hand gutter off from the label zone. A structural split, not a
   color swap. Divider brightens on hover. */
.cta-duotone-fill .btn{position:relative;border-radius:8px;padding-left:2.1rem}
.cta-duotone-fill .btn::before{content:"";position:absolute;left:1.05rem;top:22%;bottom:22%;width:1px;
  background:color-mix(in srgb,currentColor 35%,transparent);transition:background .2s ease}
.cta-duotone-fill .btn:hover::before{background:color-mix(in srgb,currentColor 60%,transparent)}

/* glass-frost-btn: a frosted-glass RING + inset sheen + light backdrop
   blur layered on top of each button's own existing fill (the fill itself
   is never replaced, so contrast never moves) - border/highlight only, via
   currentColor so it adapts per button kind. On hover the frost ring
   expands outward slightly. */
.cta-glass-frost-btn .btn{border-radius:16px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  border:1px solid color-mix(in srgb,currentColor 28%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,currentColor 32%,transparent);
  transition:box-shadow .2s ease,border-color .2s ease}
.cta-glass-frost-btn .btn:hover{transform:none;
  box-shadow:inset 0 1px 0 color-mix(in srgb,currentColor 32%,transparent),0 0 0 4px color-mix(in srgb,currentColor 16%,transparent)}

/* edge-line-btn: thin transparent border on three sides plus one bold
   colored bottom edge (currentColor) instead of an all-around box or pure
   underline - still unmistakably a padded, shaped button. On hover the
   whole button SETTLES down 2px as the bottom edge flattens from 4px to
   2px - a press-in "grounding" motion, the opposite direction from every
   lift-based skin above. */
.cta-edge-line-btn .btn{border-radius:6px;box-shadow:none;border:2px solid transparent;
  border-bottom:4px solid color-mix(in srgb,currentColor 55%,transparent);
  transition:border-bottom-width .18s ease,transform .18s ease}
.cta-edge-line-btn .btn:hover{transform:translateY(2px);border-bottom-width:2px}

/* oversized-bold: bigger type, bigger padding, bigger radius - the most
   physically dominant skin on this axis. Hover is a strong scale-up pop
   with the shadow growing to var(--shadow-xl), not just a lift.
   THE TYPE IS CAPPED, and the cap is the point. These used to be the raw
   --fs-lg / --fs-xl tokens, but that scale is per-theme and steep on some of
   them: measured across all 18, --fs-lg runs 22.28-28.73px and --fs-xl runs
   26.29-38.5px. On neo-brutalist-bold that rendered a 38.5px, 86px-tall
   button - larger type than most headings on the same page (Springfield MA).
   min() keeps the skin's intent on gentle themes, where the token is already
   below the cap and nothing changes, and only bites on the steep ones. */
.cta-oversized-bold .btn{border-radius:var(--radius-lg);padding:1.25rem 2.4rem;font-size:min(var(--fs-lg),1.3rem);letter-spacing:.01em;
  transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease}
.cta-oversized-bold .btn:hover{transform:scale(1.06);box-shadow:var(--shadow-xl)}
.cta-oversized-bold .btn:active{transform:scale(1.02)}

/* compact-condensed-btn: the deliberate opposite of oversized-bold -
   smaller type, tighter padding, smaller radius, no shadow, and a
   restrained brightness-only hover with zero movement. */
/* min-height 44px: this skin's tight padding rendered a 33px-tall button on
   Miami at 390px - under every mobile tap-target guideline (44px Apple HIG /
   48dp Material). The compact LOOK is the point of the skin, so it stays
   tighter than the others; the min-height only stops the box collapsing
   below a thumb-sized target.
   The LABEL, however, was var(--fs-xs) = 12px, the smallest token in the
   whole system - the size used for eyebrows and figure captions - on the
   site's primary calls to action. Reported on Miami as "button text still
   small". It now uses --fs-sm, the same size the base .btn uses, so a
   button reads consistently whichever ctaStyle a site rolls; "condensed"
   comes from the tighter padding and radius, not from shrinking the type
   below every other button in the system. */
.cta-compact-condensed-btn .btn{border-radius:5px;padding:.8rem 1.5rem;font-size:var(--fs-sm);letter-spacing:.01em;box-shadow:none;min-height:46px;
  transition:filter .15s ease}
.cta-compact-condensed-btn .btn:hover{transform:none;filter:brightness(1.08)}
/* A skin that sets font-size/padding on .btn (0-2-0) outranks .btn--lg
   (0-1-0), so the large modifier silently did nothing on this skin and on
   oversized-bold - every "large" CTA rendered at base size. Any future skin
   that sizes .btn needs a matching --lg rule for the same reason. */
.cta-compact-condensed-btn .btn--lg{padding:1.05rem 2rem;font-size:var(--fs-base);min-height:54px}
.cta-oversized-bold .btn--lg{padding:1.45rem 2.8rem;font-size:min(var(--fs-xl),1.5rem)}

/* layered-depth-btn: two SOLID pseudo-element layers offset behind the
   button like a short stepped stack of physical cards (color-mix against
   var(--c-border), not a blurred shadow - the structural opposite of
   shadow-stack-btn above). On hover the layers pull IN toward the button
   (converging) rather than the button itself lifting. */
/* NO z-index here, deliberately. position:relative + z-index:1 makes the
   button its own STACKING CONTEXT, and inside one a z-index:-1 pseudo-element
   paints above the element's own background - not behind it. The two "behind"
   layers below therefore rendered as an 80%-opaque near-white veil across the
   whole button face (inset:0), burying the brand gradient and leaving white
   label text on a near-white surface: the primary CTA was effectively
   invisible on every site using this skin (user-reported on San Diego,
   2026-08-25). Contrast maths missed it because text-vs-fill is correct - the
   veil sits between them. With z-index:auto the button no longer opens a
   stacking context, so z-index:-1 puts the layers genuinely behind it. */
/* Built from two SOLID, un-blurred box-shadows rather than pseudo-elements.
   The pseudo-element version (inset:0 + z-index:-1) was fundamentally unsafe:
   it only stays behind the button while the button is NOT a stacking context,
   and anything - z-index, transform, opacity, or filter - makes it one. It
   shipped broken twice for that reason. First .btn carried z-index:1, so the
   80%-opaque layer covered the whole face at rest. That was removed, and the
   bug came straight back on hover because .btn--primary:hover applies
   filter:brightness(1.06), which also creates a stacking context - so the
   button washed out the instant the pointer touched it.
   A box-shadow cannot do this: it is always painted behind the element's own
   background, and no stacking context, filter or transform changes that. Same
   stepped-card look, same converge-on-hover motion, none of the fragility.
   Do NOT reintroduce inset:0 + z-index:-1 pseudo-layers on a button. */
.cta-layered-depth-btn .btn{position:relative;border-radius:10px;
  box-shadow:5px 5px 0 color-mix(in srgb,var(--c-border) 80%,transparent),
             10px 10px 0 color-mix(in srgb,var(--c-border) 45%,transparent);
  transition:box-shadow .2s ease,transform .2s ease}
/* Layers pull IN toward the button (converging) instead of the button lifting -
   that convergence is this skin's whole hover story. */
.cta-layered-depth-btn .btn:hover{transform:none;
  box-shadow:3px 3px 0 color-mix(in srgb,var(--c-primary) 55%,transparent),
             5px 5px 0 color-mix(in srgb,var(--c-primary) 28%,transparent)}
.cta-layered-depth-btn .btn:active{box-shadow:2px 2px 0 color-mix(in srgb,var(--c-primary) 55%,transparent),
             3px 3px 0 color-mix(in srgb,var(--c-primary) 28%,transparent)}

/* ---- ctaStyle / button-group skins (skin-only, buttons) ---- */
/* Mobile scale-down for the skins with the largest visual footprint, so
   nothing balloons/overflows or collides awkwardly once the two buttons
   are stacked/wrapped on a narrow phone viewport. */
@media (max-width:640px){
  .cta-shadow-stack-btn .btn{box-shadow:0 1px 0 var(--c-border),0 4px 8px -6px color-mix(in srgb,var(--c-text) 30%,transparent)}
  .cta-shadow-stack-btn .btn:hover{box-shadow:0 1px 0 var(--c-border),0 6px 10px -6px color-mix(in srgb,var(--c-text) 34%,transparent)}
  .cta-soft-pill-glow .btn:hover{box-shadow:0 0 0 5px color-mix(in srgb,var(--c-primary) 14%,transparent),0 0 14px 2px color-mix(in srgb,var(--c-primary) 18%,transparent)}
  /* Shallower offsets on a phone, same box-shadow construction as the desktop
     rule above (the pseudo-element version these replaced is gone - see the
     note there for why it must not come back). */
  .cta-layered-depth-btn .btn{box-shadow:3px 3px 0 color-mix(in srgb,var(--c-border) 80%,transparent),
             6px 6px 0 color-mix(in srgb,var(--c-border) 45%,transparent)}
  .cta-layered-depth-btn .btn:hover{box-shadow:2px 2px 0 color-mix(in srgb,var(--c-primary) 55%,transparent),
             3px 3px 0 color-mix(in srgb,var(--c-primary) 28%,transparent)}
  .cta-oversized-bold .btn{padding:1.05rem 1.8rem;font-size:min(var(--fs-md),1.15rem)}
}
@media (max-width:560px){
  .cta-duotone-fill .btn{padding-left:1.6rem}
  .cta-duotone-fill .btn::before{left:.8rem}
  .cta-bordered-thick .btn{border-width:2px}
}

/* ---- header / nav ---- */
.site-header{position:sticky;top:0;z-index:1000;background:color-mix(in srgb,var(--c-bg) 88%,transparent);
  backdrop-filter:saturate(1.6) blur(12px);-webkit-backdrop-filter:saturate(1.6) blur(12px);border-bottom:1px solid color-mix(in srgb,var(--c-border) 70%,transparent);
  transition:box-shadow .2s ease}
.nav__mcall{display:none}
.nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-block:.9rem}
/* Brand is the only flexible element - nav links + call button keep their
   natural width (flex-shrink:0), so a long business name shrinks/truncates
   instead of wrapping onto a second line and breaking the header height. */
.nav>nav,.nav__cta{flex-shrink:0}
.brand{display:flex;align-items:center;gap:.65rem;font-family:var(--font-heading);font-weight:800;font-size:var(--fs-md);color:var(--c-text);text-decoration:none;
  flex:1 1 auto;min-width:0}
/* THE 2-LINE CLAMP IS A HEADER CONSTRAINT AND MUST STAY SCOPED TO IT.
   In the sticky header the nav links and call button are flex-shrink:0, so the
   brand is the only elastic element - an unclamped long name wraps and grows
   the header's height on every page. That is what this rule protects.
   The FOOTER shares the same .brand markup but has none of that pressure: the
   name sits in its own grid column with the whole footer free to grow. Left
   unscoped, the clamp truncated real business names there - measured on
   Duncanville, "Duncanville Garage Door Pros" rendered as "Duncanville Garage
   Door..." with the last word cut. A footer is where the full legal-ish name
   most needs to be readable, so it wraps in full instead (user request,
   2026-09-01: "show full brand name properly with responsive"). */
.site-header .brand>span:last-child{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;text-overflow:ellipsis;min-width:0;line-height:1.18}
.site-footer .brand>span:last-child{min-width:0;line-height:1.18;overflow-wrap:break-word}
.brand__mark{width:38px;height:38px;flex:0 0 auto;border-radius:11px;display:grid;place-items:center;background:var(--grad-band);color:var(--c-on-primary);font-weight:800;box-shadow:0 6px 14px -6px var(--shadow-tint)}
/* The real logo renders TRANSPARENT - no plate, no ring, no shadow.
   It used to get background:#fff plus a 1px ring and a drop shadow, which
   defeated the whole point: every supplied logo is a genuine RGBA file
   (measured 71-85% fully transparent pixels, corners at alpha 0), and the
   white plate turned it into a sticker pasted on the header - clearly wrong
   on a dark theme, where a white rounded box floated on a dark bar.
   It was also SQUEEZED: a 200x200 badge into the monogram's 38px box minus
   4px padding, i.e. 30x30, so the wordmark inside was an unreadable smudge.
   The monogram tile keeps its brand fill and rounding - that IS a tile. A
   photographic/vector logo is not, so it overrides all of it and gets more
   room. User instruction 2026-08-30: "use transparent logo in both header and
   footer". Both call the same brandMark(), so this one rule covers both. */
.brand__mark--logo{background:none;border-radius:0;box-shadow:none;padding:0;
  width:auto;height:46px;max-width:170px;object-fit:contain;object-position:left center}
/* ON A DARK SURFACE the logo gets its light card back - but ONLY there.
   These logos are drawn for light backgrounds: an icon over the city name in
   dark type. Transparent on a dark bar keeps the icon and loses the wordmark
   (measured: 11-36% of each logo's visible ink drops below readable contrast).
   The header only hits this on a dark theme, but EVERY footer does - all 56
   sites paint the footer var(--c-secondary), and all 56 secondaries measure
   dark - so this is a dark-SURFACE rule, not a dark-theme one. components/
   index.js decides per call site from the real palette colour via isDark(),
   so it stays correct for any future theme or brand colour.
   Deliberately NOT the old treatment: no ring, no drop shadow, and the logo
   is still 46px rather than squeezed into a 38px monogram tile. */
.brand__mark--logo.brand__mark--on-dark{background:#fff;padding:5px 8px;border-radius:10px}
.nav__links{display:flex;gap:.4rem;align-items:center;list-style:none;margin:0;padding:0}
/* white-space:nowrap - a NAV LABEL MUST NEVER WRAP. "Service Areas" was
   breaking onto two lines with its arrow stranded on the second, which made
   the whole bar two rows tall (Philadelphia, 2026-08-30). It was not a width
   problem: measured identically at 960px AND 1740px, so more room would never
   have fixed it. Two-word labels are normal here ("Service Areas"), and the
   nav collapses to a hamburger at 920px, below which these sit in a
   full-width stacked menu where nowrap costs nothing.
   This is the nav only - the BRAND name is deliberately still allowed to wrap
   to two lines, which is wanted for long business names. */
.nav__links a{color:var(--c-text);text-decoration:none;font-weight:600;font-size:var(--fs-sm);padding:.5rem .85rem;border-radius:var(--radius-pill);white-space:nowrap;transition:background .15s,color .15s}
.nav__links a:hover{color:var(--c-primary);background:color-mix(in srgb,var(--c-primary) 9%,transparent)}
.nav__cta{display:flex;gap:.6rem;align-items:center}
.nav-toggle{display:none;background:none;border:1px solid var(--c-border);border-radius:10px;padding:.5rem .65rem;color:var(--c-text);font-size:1.1rem}
/* centered-serif: links visually centered in the bar (brand left, call
   right) - was flex-direction:column, which stacked the nav onto a SECOND
   row and broke the "always one row" requirement. brand stops growing
   (flex:0 1 auto) so the links wrapper is the only flex:1 grower and
   centers within whatever space is actually left between brand and CTA -
   still a single row, just re-balanced instead of restacked. */
.nav--centered-serif .brand{flex:0 1 auto;font-family:Georgia,"Times New Roman",serif;font-style:italic}
.nav--centered-serif .nav>nav{flex:1 1 auto;display:flex;justify-content:center}
.nav--minimal-underline .nav__links a{border-radius:0;border-bottom:2px solid transparent;padding-bottom:.45rem}
.nav--minimal-underline .nav__links a:hover{background:none;color:var(--c-primary);border-bottom-color:var(--c-primary)}
/* The pill floats free of the page, so it needs breathing room on BOTH sides -
   padding-top alone (the original) left it sitting flush against whatever
   section follows, so the bar looked inset from the top of the page but glued
   to the content below it (user-reported, 2026-08-25). Symmetric padding is
   the whole point of a detached/floating bar; keep these two values equal. */
.site-header.nav--floating-pill{background:transparent;border:0;padding-top:.6rem;padding-bottom:.6rem}
.nav--floating-pill .nav{background:color-mix(in srgb,var(--c-surface) 88%,transparent);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.55rem 1rem;box-shadow:var(--shadow-md)}
/* bordered-frame: a solid (non-blurred) bar with a heavy brand-colored
   bottom rule instead of the default soft hairline - links trade the pill
   hover for a bottom-border accent, echoing the frame line. */
.site-header.nav--bordered-frame{background:var(--c-surface);backdrop-filter:none;-webkit-backdrop-filter:none;border-bottom:3px solid var(--c-primary)}
.nav--bordered-frame .nav__links a{border-radius:0;border-bottom:2px solid transparent}
.nav--bordered-frame .nav__links a:hover{background:none;color:var(--c-primary);border-bottom-color:var(--c-primary)}
/* uppercase-tracked: confident, editorial typographic treatment - no
   structural change, just letter-spaced uppercase links at a smaller size. */
.nav--uppercase-tracked .nav__links a{text-transform:uppercase;letter-spacing:.06em;font-size:var(--fs-xs);font-weight:700;padding:.55rem 1rem}
.util-bar{background:var(--c-secondary);color:var(--c-on-primary);font-size:var(--fs-xs)}
.util-bar .container{display:flex;justify-content:space-between;gap:1rem;padding-block:.45rem;flex-wrap:wrap}
.util-bar a{color:inherit;text-decoration:none;font-weight:700}

/* ---- hero (polished, with mesh + badge + glow) ---- */
.hero{position:relative;overflow:hidden;isolation:isolate}
.hero::before{content:"";position:absolute;inset:0;z-index:-1;
  background:radial-gradient(60% 60% at 12% 0%, color-mix(in srgb,var(--c-primary) 16%,transparent), transparent 70%),
             radial-gradient(50% 60% at 100% 30%, color-mix(in srgb,var(--c-accent) 16%,transparent), transparent 70%)}
.hero .container{padding-block:clamp(1.8rem,3.5vw,3rem)}
/* Text-only heroes (no side media) get a full-bleed photo behind the section
   instead of leaving the un-used width blank. A scrim (same solid color the
   text already sat on) stays fully opaque under the copy column so contrast
   is UNCHANGED from the no-photo version, fading out toward the edges to
   reveal the photo - the fix never trades legibility for decoration. */
.hero__bg{position:absolute;inset:0;z-index:-2;overflow:hidden}
.hero__bg img,.hero__bg .ph{width:100%;height:100%;object-fit:cover;display:block}
.hero__grid{display:grid;gap:clamp(1.5rem,4vw,3.5rem);align-items:stretch}
.hero__badge{display:inline-flex;align-items:center;gap:.5rem;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-xs);
  letter-spacing:.06em;text-transform:uppercase;padding:.5rem .9rem;border-radius:var(--radius-pill);
  background:color-mix(in srgb,var(--c-primary) 12%,transparent);color:color-mix(in srgb,var(--c-link) 80%,var(--c-text));border:1px solid color-mix(in srgb,var(--c-primary) 20%,transparent);margin-bottom:1.4rem}
.hero__badge .dot{width:8px;height:8px;border-radius:50%;background:var(--grad-brand)}
/* Was clamp(2.1rem,5.2vw,var(--fs-h1)) - var(--fs-h1) is the theme's raw
   display size (uncapped, meant for a FULL-width headline), so at wide
   viewports this resolved the H1 to ~93px in a split-hero copy column only
   ~600px wide - the heading alone wrapped to 4-5 lines and made the whole
   hero absurdly tall. A fixed, reasonable ceiling instead - still a bold
   display size, just sized for a half-width column, not the full
   viewport. */
.hero h1{margin-bottom:.35em;font-size:clamp(2rem,3.6vw,3.4rem)}
.hero__sub{font-size:var(--fs-md);color:var(--c-muted);max-width:54ch;line-height:1.65}
.hero__cta{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:1.8rem}
.hero__chips{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;margin-top:1.6rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}
.hero__chips span{display:inline-flex;align-items:center;gap:.4rem}
/* max-width:100% (2026-09-13): with aspect-ratio 4/3 AND a 260px min-height, a narrow
   column let the min-height FORCE the width to 260*4/3 = 346.67px - wider than the
   264px grid track on a 320px phone, so the hero photo was clipped ~83px on the right
   by the section overflow:hidden (measured on Irving, color-pop-badge). Capping the
   width keeps it inside the column; height still honours the min and the image
   keeps object-fit:cover. No effect wherever the column is already wide enough. */
.hero__media{max-width:100%;position:relative;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-xl);min-height:clamp(260px,30vw,400px);aspect-ratio:4/3;align-self:start;background:var(--c-surface-alt)}
.hero__copy{align-self:center}
.hero__media::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 1px color-mix(in srgb,#fff 10%,transparent);border-radius:inherit;pointer-events:none}
.hero__media .ph,.hero__media img{width:100%;height:100%;object-fit:cover}
.hero--split-image-right .hero__grid{grid-template-columns:1.05fr .95fr}
.hero--split-image-left .hero__grid{grid-template-columns:.95fr 1.05fr}
.hero--split-image-left .hero__copy{order:2}
.hero--centered-overlay{text-align:center}
.hero--centered-overlay .hero__grid{grid-template-columns:minmax(0,1fr)}
.hero--centered-overlay .hero__sub{margin-inline:auto}
.hero--centered-overlay .hero__cta,.hero--centered-overlay .hero__chips{justify-content:center}
.hero--centered-overlay .hero__badge{margin-inline:auto}
.hero--centered-overlay .hero__media{margin-top:2.5rem;aspect-ratio:16/6}
.hero--left-banner-cta{color:var(--c-on-primary)}
.hero--left-banner-cta::before{background:var(--grad-brand);opacity:1}
.hero--left-banner-cta .hero__sub{color:var(--c-on-primary)}
.hero--left-banner-cta .hero__grid{grid-template-columns:1.15fr .85fr}
.hero--left-banner-cta .hero__badge{background:color-mix(in srgb,#fff 18%,transparent);color:var(--c-on-primary);border-color:transparent}
.hero--left-banner-cta .btn--primary{background:var(--c-on-primary);color:var(--c-primary)}
/* Same gap as .cta-band/.hero--color-block-split above, just missed on this
   hero variant the first pass through: its ::before IS var(--grad-brand)
   full-bleed, so the second button (Call/Our services) needs the same
   on-primary-outline treatment or an outline-skin's normal color sits
   almost invisibly on top of the same gradient it's rendered over. */
.hero--left-banner-cta .btn--emergency,.hero--left-banner-cta .btn--ghost{background:transparent;border-width:max(var(--border),2px);border-style:solid;border-color:var(--c-on-primary);color:var(--c-on-primary);box-shadow:none}
.hero--left-banner-cta .btn--emergency:hover,.hero--left-banner-cta .btn--ghost:hover{background:var(--c-on-primary);color:var(--c-primary)}
/* These three variants put copy and photo in plain side-by-side grid columns
   (no rotation/overlap styling to justify a mismatch) - but the base
   .hero__media rule above is align-self:start with a fixed 4/3 aspect-ratio,
   so the photo card floats at its own short height while the text column
   (headline + sub + CTAs + chips) runs taller, leaving visible dead space
   under the photo. Stretch the photo to match the copy column's height
   instead of locking it to an aspect ratio. */
/* align-self:stretch + aspect-ratio:auto lets the photo match the copy
   column's own height - with no cap, a tall copy column (long subhead +
   chips + stats) stretched the photo into an unnaturally elongated portrait
   instead of a normal landscape photo. object-fit:cover already crops
   cleanly, so a max-height is a pure safety cap, never a distortion. */
/* max-height lived on the .hero__media DIV itself here, which stretches
   to match the copy column's row height - when copy is unusually tall
   (a long localized subhead), the div's OWN box shrank to the capped
   height and left the rest of the stretched grid row as bare, unfilled
   space (the section's raw background showing through, not a "proper
   hero"). Moving the cap to the IMG/.ph instead - the outer .hero__media
   div keeps stretching to the full row (so ITS OWN background fills any
   leftover space) while the photo inside stays capped and centered. */
.hero--split-image-right .hero__media,.hero--split-image-left .hero__media,.hero--left-banner-cta .hero__media{align-self:stretch;aspect-ratio:auto;display:grid;place-items:center;overflow:hidden;background:var(--c-surface-alt)}
.hero--split-image-right .hero__media img,.hero--split-image-left .hero__media img,.hero--left-banner-cta .hero__media img,.hero--split-image-right .hero__media .ph,.hero--split-image-left .hero__media .ph,.hero--left-banner-cta .hero__media .ph{height:clamp(360px,42vw,560px);max-height:100%;width:100%}
/* Text-only heroes (fullbleed-dark / text-only-underline / diagnostic-panel)
   all sit on a full-bleed photo now - a flat, fairly dark, fairly opaque
   overlay (not a brand-color wash) sits between the photo and the text,
   sized so white text clears 4.5:1 against ANY photo (verified against a
   worst-case near-white photo: 60% black overlay -> ~5.7:1, safe margin -
   see contrast-convention memory). No card/blur - text sits directly on the
   photo, matching a standard full-bleed-photo-hero pattern. */
/* Fixed white, NOT var(--c-on-primary) - on-primary means "whatever contrasts
   against THIS business's primary color", which for a light-colored brand
   (e.g. a tan/orange primary) correctly resolves to DARK text against that
   color as a background. Here the actual background is the fixed dark photo
   overlay above, completely unrelated to the brand color, so the token
   resolved to near-black text on a dark photo - invisible. Always white. */
.hero--fullbleed-dark,.hero--text-only-underline,.hero--diagnostic-panel{color:#ffffff}
/* These three are the only hero variants with the FULL container width
   available (single-column grid, no split copy/media column) - safe to
   use a taller heading cap than the universal split-hero default above,
   verified against the same wrap-length math (a full ~1200px+ line fits
   this size without the excessive-wrap problem the universal cap exists
   to prevent). */
.hero--fullbleed-dark h1,.hero--text-only-underline h1,.hero--diagnostic-panel h1{font-size:clamp(2.2rem,4.2vw,4rem)}
.hero--fullbleed-dark::before,.hero--text-only-underline::before,.hero--diagnostic-panel::before{background:rgba(8,10,14,.6)}
.hero--fullbleed-dark::before{background:radial-gradient(70% 90% at 80% -10%,color-mix(in srgb,var(--c-primary) 35%,transparent),transparent 60%),rgba(8,10,14,.6)}
/* .hero__sub already has its own dedicated max-width:54ch (below) for
   paragraph readability - capping the ENTIRE grid (headline, buttons, chips,
   stat strip included) to the same ~60ch on top of that was redundant, and
   left it centered in a narrow column with ~400px of unused photo on each
   side at desktop widths. Let the grid fill the container; only the stat
   strip keeps a (much wider) cap so its 4 numbers don't sprawl with huge
   gaps between them on ultra-wide screens. */
.hero--fullbleed-dark .hero__stats,.hero--text-only-underline .hero__stats,.hero--diagnostic-panel .hero__stats{max-width:60rem;margin-inline:auto}
.hero--fullbleed-dark .hero__grid,.hero--text-only-underline .hero__grid,.hero--diagnostic-panel .hero__grid{grid-template-columns:minmax(0,1fr)}
/* .82/.88 opacity measured 4.16:1 / 4.51:1 against a worst-case (near-white)
   photo behind the standard .6 dark overlay - the .82 sub-text value was
   actually BELOW the 4.5:1 AA minimum for normal text (only the full-white h1
   had been checked before). Raised both to .92, which clears 4.5:1 with a
   real margin (~4.75:1) instead of sitting at or under the line. */
.hero--fullbleed-dark .hero__sub,.hero--text-only-underline .hero__sub,.hero--diagnostic-panel .hero__sub{color:rgba(255,255,255,.92)}
.hero--fullbleed-dark .hero__chips,.hero--text-only-underline .hero__chips,.hero--diagnostic-panel .hero__chips{color:rgba(255,255,255,.92)}
/* Same missing-override bug as the buttons above, on the SAME two
   grad-brand-panel heroes: .hero__chips defaults to --c-muted text (a gray
   calibrated for the normal page bg, not this saturated gradient) and its
   icon defaults to --c-primary - which on color-block-split/left-banner-cta
   is the exact color the panel's own gradient STARTS at (measured 1.00:1
   contrast - completely invisible at that end of the gradient, ~1.3:1 at
   the other end. WCAG AA needs 4.5:1). Use --c-on-primary for both, same
   token already proven safe for this panel's buttons/heading/badge. */
.hero--color-block-split .hero__chips,.hero--left-banner-cta .hero__chips{color:var(--c-on-primary)}
.hero--color-block-split .hero__chips .chip-ico,.hero--left-banner-cta .hero__chips .chip-ico{color:var(--c-on-primary)}
/* Found while auditing the new hero-stats cards variant: this badge used the
   same lightening-tint pattern (14% white) as that variant, measuring
   3.96:1 against white text on a worst-case photo - under 4.5:1 AA and
   never actually checked before now. Same fix: darken instead of lighten. */
.hero--fullbleed-dark .hero__badge,.hero--text-only-underline .hero__badge,.hero--diagnostic-panel .hero__badge{background:rgba(0,0,0,.3);color:#ffffff;border-color:rgba(255,255,255,.25)}
/* Outline-style CTA buttons color their (transparent-background) text/border
   from a brand/emergency/neutral token - each guaranteed readable against
   this theme's own bg/surface tokens, but NONE of those tokens account for
   THIS specific background: an arbitrary photo behind a fixed 60% black
   overlay. A dark/saturated brand color here can drop as low as ~1.8:1.
   Force safe white for every button kind in this one context specifically,
   rather than trust any of the token-based colors. */
.hero--fullbleed-dark .cta-outline-square .btn--primary,.hero--text-only-underline .cta-outline-square .btn--primary,.hero--diagnostic-panel .cta-outline-square .btn--primary,
.hero--fullbleed-dark .cta-outline-square .btn--emergency,.hero--text-only-underline .cta-outline-square .btn--emergency,.hero--diagnostic-panel .cta-outline-square .btn--emergency,
.hero--fullbleed-dark .cta-outline-square .btn--ghost,.hero--text-only-underline .cta-outline-square .btn--ghost,.hero--diagnostic-panel .cta-outline-square .btn--ghost,
.hero--fullbleed-dark .cta-outline-gold .btn--primary,.hero--text-only-underline .cta-outline-gold .btn--primary,.hero--diagnostic-panel .cta-outline-gold .btn--primary,
.hero--fullbleed-dark .cta-outline-gold .btn--emergency,.hero--text-only-underline .cta-outline-gold .btn--emergency,.hero--diagnostic-panel .cta-outline-gold .btn--emergency,
.hero--fullbleed-dark .cta-outline-gold .btn--ghost,.hero--text-only-underline .cta-outline-gold .btn--ghost,.hero--diagnostic-panel .cta-outline-gold .btn--ghost{
  color:#ffffff;border-color:#ffffff}
/* GHOST BUTTON ON A DARK PHOTO HERO (user 2026-10-12, Georgetown inner
   pages): the secondary "All services" button kept the light-page ghost
   style - brand-red text on a 6% red tint - which all but vanished on the
   dark photo overlay. Every CTA skin, every one of the three dark heroes:
   white text + white outline on a light glass fill; fills white on hover. */
:is(.hero--fullbleed-dark,.hero--text-only-underline,.hero--diagnostic-panel) .hero__cta .btn--ghost{
  color:#ffffff;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.85);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:none}
:is(.hero--fullbleed-dark,.hero--text-only-underline,.hero--diagnostic-panel) .hero__cta .btn--ghost:hover{
  background:#ffffff;color:#14161b;border-color:#ffffff}
.hero--text-only-underline h1 span.hl,.hero h1 .hl{background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero--color-block-split{padding:0}
.hero--color-block-split::before{display:none}
/* Full-bleed edge-to-edge was a deliberate earlier fix for a DIFFERENT bug
   (this variant used to be squeezed into a narrow centered column with huge
   side gaps) - but the fix over-corrected: it made the grid span the raw
   viewport, wider than every other section's own --max-w cap (the same
   token .container uses), so the hero visibly overshot the rest of the
   page's content width. Cap it to that same --max-w, centered - the two
   halves still touch with zero gap between them, same as before, they just
   don't run past where the rest of the page's content stops. */
.hero--color-block-split .hero__grid{grid-template-columns:1fr 1fr;gap:0;align-items:stretch;
  max-width:var(--max-w);margin-inline:auto}
.hero--color-block-split .hero__copy{background:var(--grad-band);color:var(--c-on-primary);padding:clamp(2.2rem,5vw,4.5rem);display:flex;flex-direction:column;justify-content:center}
.hero--color-block-split .hero__sub{color:var(--c-on-primary)}
.hero--color-block-split .hero__badge{background:color-mix(in srgb,#fff 18%,transparent);color:var(--c-on-primary);border-color:transparent}
/* min-height:100% + align-self:stretch with NO cap let this match whatever
   height .hero__copy's own content computes to - a long business/city name
   wrapping the H1 across several lines (narrow half-width column) stretched
   the photo into an absurdly tall panel, well past a normal hero's height.
   max-height caps it the same way the other stretch-based hero variants
   already are, purely a safety bound - object-fit:cover still crops clean. */
/* min-height:100% ALWAYS wins over max-height when the two conflict (CSS
   spec: min-height clamps the result upward regardless of max-height) - so
   the max-height cap above silently did nothing while min-height:100% was
   still here, and the photo kept matching the full (sometimes 900px+) row
   height. align-self:stretch already fills the row on its own; min-height
   was redundant with it and is what has to go, not the cap. */
/* Same fix as split-image-right/left/left-banner-cta above: cap the
   photo, not the stretched outer div, so a tall copy column (long
   localized subhead) doesn't leave bare background showing below a
   shorter, capped image. */
/* The photo must fill the panel beside it. This variant stretches the media
   column to the copy column's height (align-self:stretch, and the copy is the
   tall one - a five-line H1 plus sub, buttons and chips ran 836px), but it
   also centred the image with place-items:center and gave it a FIXED
   height:clamp(380px,60vh,640px). So the image capped at ~604px inside an
   836px column and the container's own --c-surface-alt showed as bands above
   and below it - reported 2026-08-25 on Kansas City as a height mismatch
   between the image and the text panel.
   Dropping the grid centring lets the base
   .hero__media img{width:100%;height:100%;object-fit:cover} apply, so the
   photo tracks the copy's height exactly at any headline length. min-height
   keeps a sensible floor when the copy is short. */
.hero--color-block-split .hero__media{border-radius:0;box-shadow:none;aspect-ratio:auto;align-self:stretch;overflow:hidden;background:var(--c-surface-alt);min-height:clamp(380px,60vh,640px)}
.hero--color-block-split .hero__media img,.hero--color-block-split .hero__media .ph{height:100%;width:100%;object-fit:cover}
/* wide-spaced service cards on the 9/14 batch (user 2026-09-14, reported on Pasadena):
   narrow inset photo, a redundant icon tile and a long blurb made tall, thin cards.
   Photo now runs edge to edge at 16/10, icon hidden (the photo carries the card),
   tighter padding, blurb clamped to 3 lines. Scoped to the new sites on this skin -
   the live sites that also use wide-spaced are untouched. */
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced{padding:0 0 1.2rem;overflow:hidden}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced .svc__media{margin:0 0 1rem;width:100%;aspect-ratio:16/10;border-radius:0}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced .svc__media img{width:100%;height:100%;object-fit:cover}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced .svc__icon{display:none}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced h3{padding-inline:1.25rem;margin-bottom:.5rem}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced p{padding-inline:1.25rem;line-height:1.6;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}
:is([data-site="paysongaragedoorpros.com"],[data-site="pasadenagaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced .svc__more{margin-inline:1.25rem}
/* Miami only (user 2026-09-14): the ghost "All services" button sat on the dark
   hero photo as purple text on a near-transparent fill - it read as plain text. */
[data-site="miamigaragedoorco.com"] .hero .btn--ghost{background:rgba(255,255,255,.14);color:#fff;border:2px solid rgba(255,255,255,.85);box-shadow:0 6px 18px -10px rgba(0,0,0,.6);backdrop-filter:blur(4px);text-shadow:none}
[data-site="miamigaragedoorco.com"] .hero .btn--ghost:hover{background:#fff;color:var(--c-primary);border-color:#fff}
/* Murfreesboro only (user 2026-09-14, "hero all needs to same height for this site"):
   the photo ran taller than the colour block on inner pages. One fixed hero height,
   copy and photo both stretch to it. Scoped by data-site so Kansas City Pros,
   which shares this variant, is untouched. */
:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__grid{align-items:stretch;height:680px;min-height:0;overflow:hidden}
/* The entrance animation scaled the photo ~1.03, so it poked past the colour block. */
:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__media{transform:none!important}
:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__copy{align-self:stretch;height:100%}
:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__media{min-height:0;height:auto;align-self:stretch;position:relative}
:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__media img,:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__media .ph{position:absolute;inset:0;height:100%;width:100%;object-fit:cover}
.hero--color-block-split .btn--primary{background:var(--c-on-primary);color:var(--c-primary)}
/* Same reasoning as .cta-band .btn--emergency/.btn--ghost above - this
   panel's own background IS var(--grad-brand), so the second hero button's
   normal color would sit on top of nearly the same color it is. */
.hero--color-block-split .btn--emergency,.hero--color-block-split .btn--ghost{background:transparent;border-width:max(var(--border),2px);border-style:solid;border-color:var(--c-on-primary);color:var(--c-on-primary);box-shadow:none}
.hero--color-block-split .btn--emergency:hover,.hero--color-block-split .btn--ghost:hover{background:var(--c-on-primary);color:var(--c-primary)}
.hero--asymmetric-overlap .hero__grid{grid-template-columns:1fr .82fr}
.hero--asymmetric-overlap .hero__media{transform:rotate(-1.4deg)}

/* ---- trust bar (pills) ---- */
/* border-block dropped with the .section hairline above - the trustbar's own
   surface-alt fill already separates it from its neighbours. */
.trustbar{background:var(--c-surface-alt)}
.trustbar .container{display:flex;flex-wrap:wrap;gap:.7rem 1rem;justify-content:center;padding-block:1.2rem}
.trust-item{display:inline-flex;align-items:center;gap:.6rem;color:var(--c-text);font-weight:600;font-size:var(--fs-sm);
  background:var(--c-surface);border:1px solid var(--c-border);padding:.5rem 1rem .5rem .5rem;border-radius:var(--radius-pill);
  box-shadow:var(--shadow-sm);transition:transform .14s ease,box-shadow .14s ease}
.trust-item b{color:color-mix(in srgb,var(--c-link) 52%,var(--c-text))}
/* A bare icon sitting next to text read as unfinished/placeholder-ish - an
   icon in its own tinted badge is the standard "modern SaaS trust bar"
   treatment. Scoped to the default pills layout (inline/stacked keep their
   own already-distinct icon treatments below). */
.trustbar--pills .trust-item .ico{display:flex;align-items:center;justify-content:center;width:1.9rem;height:1.9rem;
  border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex:none;padding:.4rem;box-sizing:border-box}
.trustbar--pills .trust-item:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}

/* ---- stats band ---- */
/* Shared icon badge - every stats variant renders one of these ahead of its
   number (flat tint, no gradient - same convention as .svc__icon etc.).
   Brand/dark panels get the on-color-tint override every other icon-in-a-
   panel context needs (see CLAUDE.md "brand-colored panel" note) - .stats
   is the only stats markup that ever sits inside .section--brand/--dark. */
.stat-ic{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;flex:none;width:2.3rem;height:2.3rem;
  border-radius:50%;margin-bottom:.7rem;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);
  transition:transform .18s ease,background .18s ease,color .18s ease}
.section--brand .stat-ic{background:color-mix(in srgb,var(--c-on-primary) 20%,transparent);color:var(--c-on-primary)}
.section--dark .stat-ic{background:color-mix(in srgb,var(--c-on-secondary) 20%,transparent);color:var(--c-on-secondary)}
/* Hover feedback, applied the same way across every stats layout: the cell
   lifts slightly and its icon fills solid. Brand/dark cells invert instead
   (fill to the on-color, glyph becomes the panel's own base color) so it
   never loses contrast the way a flat var(--c-primary) fill would. */
.stat,.ss-cell,.ssp-cell,.ssp-lead,.st-cell,.sr-cell,.stats-g__cell{transition:transform .18s ease}
.stat:hover,.ss-cell:hover,.ssp-cell:hover,.ssp-lead:hover,.st-cell:hover,.sr-cell:hover,.stats-g__cell:hover{transform:translateY(-3px)}
.stat:hover .stat-ic,.ss-cell:hover .stat-ic,.ssp-cell:hover .stat-ic,.ssp-lead:hover .stat-ic,
.st-cell:hover .stat-ic,.sr-cell:hover .stat-ic,.stc-cell:hover .stat-ic,.stats-g__cell:hover .stat-ic{
  background:var(--c-primary);color:var(--c-on-primary);transform:scale(1.1)}
.section--brand .stat:hover .stat-ic{background:var(--c-on-primary);color:var(--c-primary)}
.section--dark .stat:hover .stat-ic{background:var(--c-on-secondary);color:var(--c-secondary)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--grid-gap)}
.stat{text-align:center;padding:1.4rem 1rem;min-width:0}
.stat .stat-ic{margin-inline:auto}
.stat__n{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,5.5vw,2.8rem);line-height:1;overflow-wrap:anywhere;
  background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.section--dark .stat__n,.section--brand .stat__n{background:none;color:currentColor;-webkit-text-fill-color:currentColor}
.stat__l{margin-top:.5rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}
.section--dark .stat__l,.section--brand .stat__l{color:inherit}
.stats--cards .stat:hover{box-shadow:var(--shadow-md);border-color:color-mix(in srgb,var(--c-primary) 30%,var(--c-border))}
/* Asymmetric: one lead number carries the visual weight, the rest sit as
   small cells beside it - reads as "the number that matters" rather than
   four equal tiles (that's what .stats already covers). */
.stats-spotlight{display:grid;grid-template-columns:auto 1fr;gap:clamp(1.6rem,4vw,3rem);align-items:center;
  padding:clamp(1.6rem,3.2vw,2.4rem);background:var(--c-surface-alt);border-radius:var(--radius-lg)}
.ssp-lead{padding-right:clamp(1.6rem,4vw,3rem);border-right:1px solid var(--c-border)}
.ssp-n{font-family:var(--font-heading);font-weight:800;font-size:clamp(2.4rem,7vw,4rem);line-height:1;
  background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.ssp-l{margin-top:.4rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600;max-width:18ch}
.ssp-rest{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1.2rem 1.6rem}
.ssp-cell{display:flex;flex-direction:column;gap:.35rem;min-width:0}
.ssp-cell b{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.15rem,2.4vw,1.5rem)}
.ssp-cell span{color:var(--c-muted);font-size:var(--fs-xs)}
.ssp-lead .stat-ic,.ssp-cell .stat-ic{margin-bottom:0}
.ssp-lead .stat-ic{width:2.7rem;height:2.7rem;margin-bottom:.5rem}
.ssp-cell .stat-ic{width:1.9rem;height:1.9rem}
@media (max-width:640px){.stats-spotlight{grid-template-columns:minmax(0,1fr)}
  .ssp-lead{border-right:0;border-bottom:1px solid var(--c-border);padding-right:0;padding-bottom:1.2rem}}
/* Unboxed, edge-to-edge divided row - sits directly on the page background
   (no card, no gradient) so it reads as a thin data rail, not another block. */
.stats-ticker{display:flex;flex-wrap:wrap;justify-content:center;border-top:1px solid var(--c-border);border-bottom:1px solid var(--c-border)}
.st-cell{display:flex;align-items:center;gap:.6rem;padding:1.1rem 1.6rem;flex:1 1 200px;justify-content:center;border-left:1px solid var(--c-border);transition:background .18s ease}
.st-cell:first-child{border-left:0}
.st-cell:hover{background:color-mix(in srgb,var(--c-primary) 6%,transparent)}
.st-cell .stat-ic{width:1.8rem;height:1.8rem;margin-bottom:0}
.st-dot{width:7px;height:7px;border-radius:50%;background:var(--grad-brand);flex:none}
.st-cell b{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-md)}
.st-l{color:var(--c-muted);font-size:var(--fs-xs)}
@media (max-width:640px){.st-cell{flex:1 1 45%;border-left:0;border-top:1px solid var(--c-border)}}

/* stats - RING: number inside a circular outline badge */
/* RING STATS - redesigned 2026-10-12 (user, Addison): four small thin rings
   bunched in the middle of a wide band, icons floating above them as tiny
   chips, muted 12ch labels. Now: four equal columns across the container
   (2x2 on phones), each a filled disc with a brand-gradient ring, the icon
   INSIDE the disc above a bigger number, and a full-colour label.
   EVERY RING IS THE SAME CIRCLE (fixed size, never value-driven) and must
   hold a six-character population like "60,438" - see the earlier Petaluma
   note: shrink the number, never grow the box. */
.stats-ring{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(1.4rem,3vw,2.6rem);align-items:start}
.sr-cell{display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center}
.sr-circle{position:relative;width:160px;height:160px;flex:0 0 auto;box-sizing:border-box;border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;
  background:radial-gradient(closest-side,var(--c-surface) calc(100% - 5px),transparent calc(100% - 4px)),
    conic-gradient(from 200deg,var(--c-primary),var(--c-accent),var(--c-primary));
  box-shadow:0 14px 34px -18px var(--shadow-tint),0 0 0 6px color-mix(in srgb,var(--c-primary) 10%,transparent);
  transition:transform .18s ease,box-shadow .18s ease}
.sr-cell:hover .sr-circle{box-shadow:0 18px 40px -16px var(--shadow-tint),0 0 0 8px color-mix(in srgb,var(--c-primary) 16%,transparent)}
/* Icon = a real round chip inside the disc (not a bare glyph): the shared
   stats hover rule (.sr-cell:hover .stat-ic, 0,3,0) fills the icon solid,
   and on a width:auto bare glyph that fill showed up as a tiny misshapen
   blob (user 2026-10-12). Sized chip + matching hover, no scale-up so it
   never crowds the number. */
.sr-circle .stat-ic{width:2.9rem;height:2.9rem;margin:0;border:0;box-shadow:none;padding:0;
  background:color-mix(in srgb,var(--c-primary) 14%,transparent);color:var(--c-link)}
.sr-cell:hover .sr-circle .stat-ic{background:var(--c-primary);color:var(--c-on-primary);transform:none}
.sr-circle .stat-ic::before,.sr-circle .stat-ic::after{display:none}
.sr-n{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.25rem,2.1vw,1.6rem);line-height:1;color:var(--c-text);white-space:nowrap;letter-spacing:-.01em}
.sr-l{color:var(--c-text);font-size:var(--fs-sm);font-weight:600;line-height:1.4;max-width:18ch}
@media (max-width:820px){.stats-ring{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:2.2rem}}

/* stats - COLUMNS: spec-sheet style, one label row (icon + label) + one value row */
.stats-table{border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden}
.stc-row{display:grid;grid-template-columns:repeat(4,1fr)}
.stc-row--labels{background:var(--c-surface-alt);border-bottom:1px solid var(--c-border)}
.stc-row--labels .stc-cell{display:flex;align-items:center;justify-content:center;gap:.4rem;color:var(--c-muted);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.stc-row--values .stc-cell{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.2rem,3vw,1.7rem)}
.stc-cell{padding:1rem 1.2rem;text-align:center;border-left:1px solid var(--c-border);transition:background .18s ease}
.stc-cell:first-child{border-left:0}
.stc-row--labels .stc-cell:hover{background:color-mix(in srgb,var(--c-primary) 6%,transparent)}
.stc-cell .stat-ic{width:1.6rem;height:1.6rem;margin-bottom:0}

/* stats - BIGNUM-LIST: vertical edge-to-edge rows, big number left */
.stats-bignum{display:grid;max-width:52rem;margin-inline:auto}
/* justify-content:space-between here stretched a big-number+label pair
   (e.g. "240,126" ... "Residents in Glendale") across the full 52rem row,
   leaving a ~560px blank gap between them - same bug class as
   hero__stats--ledger-rows. Compact/left-aligned instead. */
.sbn-row{display:flex;align-items:baseline;justify-content:flex-start;gap:1.2rem;padding:1.1rem 0;border-top:1px solid var(--c-border)}
.stats-bignum .sbn-row:last-child{border-bottom:1px solid var(--c-border)}
.sbn-row b{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,3.4vw,2.1rem)}
.sbn-row span{color:var(--c-muted);font-size:var(--fs-sm)}

/* ---- service cards ---- */
.svc-grid{display:grid;gap:var(--grid-gap);grid-template-columns:repeat(3,1fr)}
/* .svc is an <a> - the ENTIRE card is the click target, not just the
   "Learn more" line (2026-08-25). display:block + inherited colour are what
   stop an anchor from collapsing to an inline run of link-blue text. */
.svc{display:block;color:inherit;text-decoration:none;
  position:relative;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);
  padding:1.7rem;box-shadow:var(--shadow-sm);transition:transform .16s ease,box-shadow .18s ease,border-color .18s ease;overflow:hidden}
.svc:hover{transform:translateY(-4px);box-shadow:var(--shadow-xl);border-color:color-mix(in srgb,var(--c-primary) 40%,var(--c-border))}
.svc h3{font-size:var(--fs-md);margin-bottom:.4rem}
.svc p{color:var(--c-muted);margin:0;font-size:var(--fs-sm)}
.svc__icon{width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);
  display:grid;place-items:center;margin-bottom:1.1rem;font-size:1.5rem}
.svc__more{display:inline-flex;align-items:center;gap:.35rem;margin-top:1.1rem;font-weight:700;font-size:var(--fs-sm);color:color-mix(in srgb,var(--c-link) 80%,var(--c-text));text-decoration:none}
.svc__more:hover{gap:.6rem}
.svc--editorial-row{border:0;border-top:2px solid var(--c-border);border-radius:0;box-shadow:none;background:none;padding:1.6rem 0}
.svc--editorial-row:hover{transform:none;box-shadow:none;border-color:var(--c-primary)}
/* width:max-content, NOT width:auto. The base .svc__icon is a 52px
   display:grid + place-items:center tile. Dropping to width:auto keeps it
   display:grid, so the box stretches to the FULL card width and place-items
   then centres the glyph inside it - the icon floated in the middle of a
   card whose heading, copy and link are all left-aligned (reported on
   Longmont, 2026-08-27). Shrink-wrapping the box puts the glyph back on the
   card's left edge and makes the inherited centring a no-op.
   Any skin that strips this icon's fixed width must do the same. Skins that
   centre the icon ON PURPOSE (circle-icon) also set text-align:center on the
   whole card, so icon, heading and link agree - that is not this bug. */
.svc--editorial-row .svc__icon{width:max-content;height:auto;background:none;color:var(--c-primary);box-shadow:none;font-size:1.6rem;margin-bottom:.6rem}
.svc--bordered-badge{border-width:2px;box-shadow:none}
.svc--list-dense{padding:1.2rem;border-radius:var(--radius-card)}
.svc--soft-rounded{border:0;border-radius:26px;background:var(--c-surface-alt)}
.svc--text-list{background:none;border:0;box-shadow:none;padding:1.1rem 0;border-bottom:1px solid var(--c-border);border-radius:0}
.svc--text-list:hover{transform:none;box-shadow:none}
.svc--text-list .svc__icon{display:none}
.svc--blocky-numbered{border-width:3px;border-radius:0;box-shadow:none}
.svc--blocky-numbered:hover{transform:translateY(-4px);box-shadow:6px 6px 0 var(--c-primary)}
/* offset-number keeps its no-icon composition: with the counter gone (below)
   its identity is the square 1:1 photo + typography, no badge. */
.svc--blocky-numbered .svc__icon,.svc--offset-number .svc__icon{display:none}
.svc--spec-row{border-radius:var(--radius-card)}
.svc--spec-row .svc__icon{border-radius:8px;font-family:var(--font-mono)}
.svc--glass{background:color-mix(in srgb,var(--c-surface) 60%,transparent);border-color:color-mix(in srgb,#fff 14%,transparent);backdrop-filter:blur(10px)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--glass{display:flex;flex-direction:column;height:100%}
.svc--glass .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
.svc--gradient-top{border-top:0}
.svc--gradient-top::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:var(--grad-brand)}
/* The "01/02/03" counter that used to sit at the top of the offset-number and
   blocky-numbered cards is REMOVED (2026-08-25, explicit user request: "from
   service card remove number"). A service is not a step in a sequence, so
   numbering it added an ordering the content does not have - and it collided
   with the real numbering used by the process/"How it works" steps. The
   .svc-grid counter-reset that fed it is gone too. Both skins keep their own
   identity without it: offset-number is the square-photo, no-icon, no-badge
   composition; blocky-numbered is the 3px square border with the hard offset
   shadow on hover. Do not re-add a counter here. */

/* ---- why / features ---- */
.feat{display:flex;gap:1rem;align-items:flex-start;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.5rem;box-shadow:var(--shadow-sm);transition:transform .16s,box-shadow .18s}
.feat:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}
.feat__dot{flex:0 0 auto;width:44px;height:44px;border-radius:13px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;font-size:1.05rem}
.feat h3{font-size:var(--fs-md);margin-bottom:.3em}
.feat p{color:var(--c-muted);margin:0;font-size:var(--fs-sm)}

/* ---- reviews ---- */
.rev{position:relative;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.7rem;box-shadow:var(--shadow-sm);
  transition:border-color .2s ease,box-shadow .2s ease}
/* Testimonials aren't links - a lift would wrongly imply they're clickable.
   A quiet highlight (border + shadow bloom, no movement) still says "the
   cursor found this" without the affordance mismatch. */
.rev:hover{border-color:color-mix(in srgb,var(--c-primary) 32%,var(--c-border));box-shadow:var(--shadow-md)}
.rev__stars{color:var(--c-accent);letter-spacing:2px;margin-bottom:.7rem;font-size:1.05rem}
.rev__text{margin:0 0 1.1rem;color:var(--c-text)}
.rev__who{font-weight:700;font-size:var(--fs-sm)}
.rev--quote-plain{border:0;background:none;padding:0 0 0 1.3rem;box-shadow:none;border-left:3px solid var(--c-accent)}
.rev--big-quote{border:0;background:none;box-shadow:none}
.rev--big-quote .rev__text{font-family:var(--font-heading);font-size:var(--fs-lg);line-height:1.4}
.rev--bubble{border-radius:24px}

/* ---- gallery ---- */
.gallery{display:grid;gap:var(--grid-gap)}
.gallery--grid-3{grid-template-columns:repeat(3,1fr)}
.gallery--grid-2{grid-template-columns:repeat(2,1fr)}
.gallery--masonry{grid-template-columns:repeat(3,1fr)}
.gallery--wide-strip{grid-template-columns:repeat(4,1fr)}
.gallery--asymmetric{grid-template-columns:2fr 1fr 1fr}
/* .gallery--polaroid had no grid-template-columns of its own, so it silently
   inherited the base .gallery{display:grid} rule's implicit ONE-column
   auto-placement - 6 photos stacked in a single tall column instead of a
   grid. Every gallery variant must set an explicit multi-column layout. */
.gallery--polaroid{grid-template-columns:repeat(3,1fr)}
.gallery figure{position:relative;margin:0;border-radius:var(--radius-lg);overflow:hidden;background:var(--c-surface-alt);box-shadow:var(--shadow-sm)}
.gallery figure figcaption{position:absolute;left:.8rem;bottom:.8rem;background:color-mix(in srgb,var(--c-bg) 82%,transparent);backdrop-filter:blur(6px);color:var(--c-text);font-size:var(--fs-xs);font-weight:700;padding:.35rem .7rem;border-radius:var(--radius-pill)}
.gallery--polaroid figure{background:#fff;padding:.6rem .6rem 1.6rem;box-shadow:var(--shadow-md);border-radius:6px;transform:rotate(-1.5deg)}
.gallery--masonry figure:nth-child(3n){grid-row:span 1}
.gallery img,.gallery .ph{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;display:block}

/* ---- faq ---- */
.faq{max-width:64rem}
.faq details{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.1rem 1.4rem;margin-bottom:.8rem;box-shadow:var(--shadow-sm);transition:border-color .15s}
.faq details[open]{border-color:color-mix(in srgb,var(--c-primary) 35%,var(--c-border))}
.faq summary{cursor:pointer;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";color:var(--c-primary);font-size:1.3em;font-weight:400;transition:transform .2s}
.faq details[open] summary::after{content:"–"}
.faq p{color:var(--c-muted);margin:.9rem 0 0}

/* ---- faq variants (20 keys, see SECTION_POOLS.faq in variation.js) ----
   14 are pure CSS skins on .faq-split--KEY (same intro+accordion markup as
   the split-sticky default); numbered/circle-badge-grid add a small badge
   before each question; single-column/two-col-grid/flat-cards drop the
   sticky intro sidebar entirely (see faq() in components/index.js). ---- */
.faq--numbered summary,.faq--circle-badge-grid summary{justify-content:flex-start}
.faq--numbered summary::after,.faq--circle-badge-grid summary::after{margin-left:auto}
.faq__n,.faq__badge{flex:0 0 auto;width:2rem;height:2rem;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center;font-size:var(--fs-xs);font-weight:800}
.faq__q{flex:1}

.faq-single__head{max-width:52ch;margin:0 auto 2.4rem;text-align:center}
/* text-align:center CANNOT centre the button here. The button sits inside
   .hero__cta, which is display:flex (see the hero CTA rule), and text-align
   has no effect on how a flex container places its items - they pack to
   flex-start regardless. So the head was centred, the CTA wrapper was centred,
   and the button still sat hard left (reported on Sun Prairie, 2026-09-01).
   justify-content is the property that actually moves flex items.
   Kept scoped to .faq-single so the hero's own left-aligned CTA row, which
   shares the .hero__cta class, is untouched. */
.faq-single__cta{margin-top:1.8rem;text-align:center}
.faq-single__cta .hero__cta{justify-content:center}
/* .faq carries max-width:64rem with no margin-inline:auto. Inside .faq-split
   that is fine - .faq-split .faq{max-width:none} removes it and the split
   positions the column - which is why .faq sits in the QA check's
   SAFE_UNCENTERED_MAXWIDTH allowlist. That allowlist entry assumes .faq is
   ALWAYS inside a split; in .faq-single it is not, so the 64rem cap
   left-aligned the cards under a centred heading: measured 1024px of cards in
   a 1240px container, 0px gap left and 216px right. Centre it here only. */
.faq-single .faq{margin-inline:auto}
.faq--two-col-grid{columns:2;column-gap:2.4rem}
.faq--two-col-grid details{break-inside:avoid}
.faq-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:1.2rem}
.faq-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.4rem 1.6rem;box-shadow:var(--shadow-sm)}
.faq-card h3{font-family:var(--font-heading);font-size:var(--fs-md);margin:0 0 .6em}
.faq-card p{color:var(--c-muted);margin:0}

.faq-split--framed-outline .faq details{background:transparent;box-shadow:none;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
.faq-split--shadow-stack .faq details{box-shadow:4px 4px 0 0 var(--c-surface-alt),8px 8px 0 0 var(--c-border)}
.faq-split--alternating-tint .faq details{background:transparent;border:0;box-shadow:none;border-radius:0}
.faq-split--alternating-tint .faq details:nth-child(odd){background:var(--c-surface-alt)}
.faq-split--quiet-editorial .faq details{background:transparent;border:0;box-shadow:none;border-radius:0;border-bottom:1px solid var(--c-border);padding:1.2rem 0;margin-bottom:0}
.faq-split--quiet-editorial .faq details:last-child{border-bottom:0}
.faq-split--boxed-diagonal .faq details{border-radius:0;position:relative;clip-path:polygon(0 0,100% 0,100% 100%,14px 100%,0 calc(100% - 14px))}
.faq-split--boxed-diagonal .faq details[open]{background:color-mix(in srgb,var(--c-primary) 5%,var(--c-surface))}
.faq-split--wide-spaced-grid .faq details{padding:1.6rem 2rem;margin-bottom:1.3rem}
.faq-split--underline-accent-list .faq details{border:0;border-left:3px solid var(--c-primary);border-radius:0;background:var(--c-surface-alt);box-shadow:none}
.faq-split--glass-panel-grid .faq details{background:color-mix(in srgb,var(--c-surface) 70%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid color-mix(in srgb,var(--c-border) 60%,transparent)}
.faq-split--split-duotone .faq{columns:2;column-gap:2rem}
.faq-split--split-duotone .faq details{break-inside:avoid}
.faq-split--outline-only .faq details{background:transparent;box-shadow:none;border:2px solid var(--c-text);border-radius:0}
.faq-split--minimal-text-row .faq details{background:transparent;border:0;box-shadow:none;border-radius:0;padding:.9rem 0;margin-bottom:0}
.faq-split--divider-line-row .faq details{background:transparent;border:0;border-top:1px solid var(--c-border);box-shadow:none;border-radius:0;padding:1.1rem 0;margin-bottom:0}
.faq-split--divider-line-row .faq details:first-child{border-top:0}
.faq-split--ledger-rows .faq details{background:transparent;border:0;border-top:1px solid var(--c-border);box-shadow:none;border-radius:0;padding:.9rem .2rem;margin-bottom:0}
.faq-split--ledger-rows .faq details:first-child{border-top:0}
.faq-split--ledger-rows .faq summary{font-weight:600}
.faq-split--compact-dense .faq details{padding:.7rem 1rem;margin-bottom:.5rem}
.faq-split--compact-dense .faq summary{font-size:var(--fs-sm)}
.faq-split--compact-dense .faq p{font-size:var(--fs-sm);margin-top:.5rem}

/* ---- quote / contact form ---- */
.quote{display:grid;gap:var(--grid-gap);grid-template-columns:1fr 1.05fr;align-items:start}
.form{display:grid;gap:1rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.9rem;box-shadow:var(--shadow-xl)}
.field{display:grid;gap:.4rem}
.field label{font-weight:600;font-size:var(--fs-sm)}
.field input,.field textarea,.field select{font:inherit;padding:.85rem 1rem;border:1px solid var(--c-border);border-radius:var(--radius);background:var(--c-bg);color:var(--c-text);width:100%}
.field input:focus,.field textarea:focus{outline:none;box-shadow:var(--focus);border-color:var(--c-primary)}

/* ---- CTA band ---- */
.cta-band{position:relative;overflow:hidden;background:var(--grad-band);color:var(--c-on-primary);text-align:center}
/* theme.decor patterns - every site used this exact corner-glow regardless
   of theme before; 'none' keeps it as the explicit baseline, the other 9
   values below are the field's declared-but-never-rendered options, now
   wired in. All are additive (white mixed toward transparent, never a flat
   darkening layer) so the already-established CTA-band text contrast is
   never at risk - this is a decorative pattern layer, not a scrim. */
.cta-band::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 120% at 50% -20%,color-mix(in srgb,#fff 22%,transparent),transparent 60%)}
.cta-band.decor-hairline-rules::before{background:repeating-linear-gradient(48deg,color-mix(in srgb,#fff 13%,transparent) 0 1px,transparent 1px 25px)}
.cta-band.decor-diagonal-accents::before{background:repeating-linear-gradient(118deg,transparent 0 54px,color-mix(in srgb,#fff 11%,transparent) 54px 70px)}
.cta-band.decor-grid-lines::before{background:
  repeating-linear-gradient(0deg,color-mix(in srgb,#fff 10%,transparent) 0 1px,transparent 1px 34px),
  repeating-linear-gradient(90deg,color-mix(in srgb,#fff 10%,transparent) 0 1px,transparent 1px 34px)}
.cta-band.decor-dotted-grid::before{background-image:radial-gradient(color-mix(in srgb,#fff 30%,transparent) 1.6px,transparent 1.6px);
  background-size:22px 22px}
.cta-band.decor-blob::before{background:
  radial-gradient(38% 55% at 12% 20%,color-mix(in srgb,#fff 20%,transparent),transparent 70%),
  radial-gradient(46% 60% at 92% 85%,color-mix(in srgb,#fff 16%,transparent),transparent 70%)}
.cta-band.decor-color-blocks::before{background:
  linear-gradient(100deg,transparent 0 62%,color-mix(in srgb,#fff 12%,transparent) 62% 78%,transparent 78%),
  linear-gradient(100deg,transparent 0 8%,color-mix(in srgb,#fff 9%,transparent) 8% 18%,transparent 18%)}
.cta-band.decor-underline-marker::before{background:linear-gradient(100deg,transparent 0 30%,color-mix(in srgb,#fff 16%,transparent) 30% 42%,transparent 42%)}
.cta-band.decor-soft-glow::before{background:
  radial-gradient(55% 90% at 50% -10%,color-mix(in srgb,#fff 28%,transparent),transparent 65%),
  radial-gradient(45% 70% at 50% 110%,color-mix(in srgb,#fff 14%,transparent),transparent 70%)}
.cta-band.decor-oversized-index::before{background-image:radial-gradient(circle at 88% 50%,transparent 0 42%,color-mix(in srgb,#fff 10%,transparent) 42% 43%,transparent 43%);
  background-size:130% 130%;background-position:center}
.cta-band .container{position:relative}
.cta-band h2{color:var(--c-on-primary)}
.cta-band p{color:var(--c-on-primary);max-width:52ch;margin-inline:auto}
.cta-band .btn--primary{background:var(--c-on-primary);color:var(--c-primary)}
/* The band's own background IS var(--grad-brand) (primary→accent) - the
   emergency button's normal solid red and the ghost button's normal
   primary-tinted fill both sit almost exactly on top of that same color,
   reading as barely-there or invisible (worst case: a business whose brand
   color is itself red/orange, same hue family as --c-emergency). Both use
   the band's own already-proven-readable foreground (--c-on-primary, same
   token .cta-band h2/p already rely on) instead of their normal page-context
   color - filled-white for primary, white-outline for the others, so every
   button in the group stays clearly visible regardless of brand hue, and
   still reads as a deliberate hierarchy (filled = primary action). This
   wins over any ctaStyle skin rule via source order, same as the .btn--primary
   line above already relies on. */
/* border-WIDTH is set explicitly here, not just border-color. These
   brand-panel rules turn a filled button into an outlined one, but they only
   ever set the colour - the width came from the base .btn{border:var(--border)
   solid transparent}. Three of the 18 themes ship shape.border:0
   (local-neighborhood, and the themes on Newark and Orlando), so on those the
   outline had zero width and the button rendered as transparent fill + no
   border + bare text: on Fort Lauderdale's green CTA band the "Call ..."
   button was literally invisible as a button, which is how it was reported
   (2026-08-25). max(var(--border),2px) keeps a thicker theme border where one
   exists and guarantees a visible outline where the theme has none.
   Applies to all five brand-panel rules (hero left-banner-cta /
   color-block-split, cta-band, section--dark, cta-banner--filled-brand) - if
   a new brand-coloured panel is added, it needs the same explicit width. */
.cta-band .btn--emergency,.cta-band .btn--ghost{background:transparent;border-width:max(var(--border),2px);border-style:solid;border-color:var(--c-on-primary);color:var(--c-on-primary);box-shadow:none}
.cta-band .btn--emergency:hover,.cta-band .btn--ghost:hover{background:var(--c-on-primary);color:var(--c-primary)}
/* THE HOVER STATE NEEDS THE SAME PROTECTION AS THE REST STATE.
   Every brand panel above fixed .btn--primary at rest but never wrote a
   :hover, so on hover the ctaStyle skin's own rule took over - and a skin
   selector plus :hover is (0,3,0), which outranks the (0,2,0) rest rule here.
   outline-square repaints it background:var(--c-link), a primary-derived
   blue, directly onto the primary-derived brand band: the button vanished
   into the background the moment the pointer touched it (reported on Parma,
   2026-08-27). Every outline-style skin does the same thing.
   The fix keeps the button on the band's own proven-readable --c-on-primary
   and shifts it only slightly, so there is clear feedback without ever
   entering the band's colour family. Emergency/ghost already had this.
   These must stay AFTER all ctaStyle skin rules in source order (those end at
   ~line 448) - equal specificity, later wins. The quiet .cta-band--KEY skins
   deliberately override this again further down, which is correct: their
   bands are light, so a grad-band fill reads fine there. */
.cta-band .btn--primary:hover,
.hero--left-banner-cta .btn--primary:hover,
.hero--color-block-split .btn--primary:hover,
.cta-banner--filled-brand .btn--primary:hover{
  background:color-mix(in srgb,var(--c-on-primary) 88%,var(--c-primary));
  color:var(--c-primary);border-color:transparent}

/* .section--dark (e.g. the emergency() "door stuck open" band) uses
   background:var(--c-secondary) - a surface link/accentLink/emergencyLink
   were never verified against (see the note in palette.js on why that
   surface isn't folded into the shared text-contrast guarantee). Any
   outline-style ctaStyle skin (outline-square/outline-gold) that colors a
   button via those tokens would otherwise paint it directly on secondary
   with no guarantee. Use --c-on-secondary instead, which IS guaranteed safe
   against secondary specifically (readableOn(secondary) in palette.js) -
   placed after the CTA style skins block so it wins on source order. */
.section--dark .btn--primary,.section--dark .btn--emergency,.section--dark .btn--ghost{
  background:transparent;border-width:max(var(--border),2px);border-style:solid;border-color:var(--c-on-secondary);color:var(--c-on-secondary);box-shadow:none}
.section--dark .btn--primary:hover,.section--dark .btn--emergency:hover,.section--dark .btn--ghost:hover{
  background:var(--c-on-secondary);color:var(--c-secondary)}
.cta-band--split .container,.cta-band--bar .container{text-align:left}
.cta-split{display:grid;grid-template-columns:1.3fr .7fr;gap:clamp(2rem,4vw,3.5rem);align-items:center}
.cta-split__copy p{margin-inline:0}
.cta-split__copy .cta-band__btns{justify-content:flex-start}
.cta-split__panel{display:flex;flex-direction:column;gap:1.1rem;background:color-mix(in srgb,#fff 12%,transparent);border:1px solid color-mix(in srgb,#fff 20%,transparent);border-radius:var(--radius-lg);padding:1.6rem}
/* justify-content:space-between with a short number (e.g. a single digit
   "4") and a longer label stretched a 234px gap across an already-narrow
   330px panel - same bug class as the other space-between fixes above.
   Fixed-width number column instead keeps the label snug beside it. */
.cta-split__stat{display:flex;justify-content:flex-start;align-items:baseline;gap:1rem;padding-block:.5rem;border-bottom:1px solid color-mix(in srgb,#fff 16%,transparent)}
.cta-split__stat b{min-width:2.4ch}
.cta-split__stat:last-child{border-bottom:0}
.cta-split__stat b{font-family:var(--font-heading);font-size:1.3rem;font-weight:800}
.cta-split__stat span{font-size:var(--fs-sm);opacity:.85;text-align:right}
.cta-bar{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;padding-block:1.6rem}
.cta-bar h2{font-size:clamp(1.3rem,2.6vw,1.7rem);margin:0}
.cta-bar__btns{margin-top:0}

/* ---- cta banner (mid-page nudge, still lighter than the full cta-band but
   NOT thin any more - was a single 1.1rem-padding bordered strip with no
   variants at all). Redesigned again 2026-08-20: the first pass (soft
   bordered card + small tinted circle icon + rounded pill) still read as a
   generic templated SaaS widget even at fuller padding - "thin" wasn't the
   only problem, the whole soft-neutral-card language was. Flat solid color
   blocks, sharp/angular geometry (clip-path cuts, square corners, thick
   rules), and asymmetric composition instead - reusing the SAME bold
   patterns already proven elsewhere in this engine (boxed-diagonal's
   clip-path corner, shadow-stack's offset shadow), not a generic look. */
.cta-banner{padding-block:2.2rem}
.cta-banner__inner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.4rem}
.cta-banner__text{margin:0;font-weight:700;font-size:var(--fs-md);color:var(--c-text);max-width:56ch}
/* Both CTA buttons (request + call) live in one group so the banner's
   space-between row treats them as a single unit - as two loose children they
   would be shoved to opposite ends of the banner with the copy in between. */
.cta-banner__actions{display:flex;flex-wrap:wrap;align-items:center;gap:.7rem;flex:0 0 auto}
@media (max-width:640px){
  .cta-banner__inner{flex-direction:column;align-items:stretch}
  .cta-banner__actions{width:100%}
  .cta-banner__actions .btn{flex:1 1 100%;justify-content:center}
}

/* bold-strip: sharp square corners, a thick rule above and below in brand
   color instead of a soft all-around border - reads as a deliberate divider
   band, not a floating rounded card. */
.cta-banner--bold-strip .cta-banner__inner{background:var(--c-surface);border-top:3px solid var(--c-primary);border-bottom:3px solid var(--c-primary);border-radius:0;padding:1.8rem 2.2rem}
.cta-banner--bold-strip .cta-banner__text{font-family:var(--font-heading);font-size:var(--fs-lg)}
/* CENTRED STACK (user 2026-10-12, Henderson). At --fs-lg the 56ch text is too
   wide to share a row, so the buttons wrapped underneath, hard left, leaving
   the right half of the strip empty. Stack and centre both instead. */
.cta-banner--bold-strip .cta-banner__inner{flex-direction:column;justify-content:center;text-align:center;gap:1.2rem}
.cta-banner--bold-strip .cta-banner__text{max-width:52ch;margin-inline:auto}
.cta-banner--bold-strip .cta-banner__actions{justify-content:center}

/* filled-brand: solid gradient fill with one corner cut at an angle (same
   clip-path technique as boxed-diagonal elsewhere) instead of a plain
   rounded rectangle - reuses the proven contrast-safe on-primary override
   for every button kind. */
/* SPLIT BANNER (user 2026-10-12, Chandler): text and buttons both sat hard
   left with half the gradient empty, and the clipped corner read as a
   rendering glitch. Now: larger 2-line message left, buttons right on the
   same row, vertically centred; a soft on-primary glow in the top-right
   corner gives the panel depth. Stacks + centres below 1100px (at 1024 the
   side-by-side text column was squeezed to 5 lines). */
.cta-banner--filled-brand .cta-banner__inner{position:relative;overflow:hidden;flex-wrap:nowrap;justify-content:space-between;gap:1.6rem 3rem;
  background:radial-gradient(circle at 100% 0,color-mix(in srgb,var(--c-on-primary) 10%,transparent) 0 30%,transparent 30.5%),var(--grad-brand);
  border:0;border-radius:var(--radius-lg);padding:clamp(1.8rem,3.4vw,2.6rem) clamp(1.6rem,4vw,3.2rem);box-shadow:0 18px 40px -20px var(--shadow-tint)}
.cta-banner--filled-brand .cta-banner__text{flex:1 1 auto;max-width:36ch;color:var(--c-on-primary);font-family:var(--font-heading);font-size:clamp(1.15rem,1rem + 1vw,1.65rem);line-height:1.3;text-wrap:balance}
.cta-banner--filled-brand .cta-banner__actions{flex:none;justify-content:flex-end}
@media (max-width:1100px){
  .cta-banner--filled-brand .cta-banner__inner{flex-direction:column;flex-wrap:wrap;text-align:center}
  .cta-banner--filled-brand .cta-banner__text{max-width:40ch;margin-inline:auto}
  .cta-banner--filled-brand .cta-banner__actions{justify-content:center}
}
.cta-banner--filled-brand .btn--primary{background:var(--c-on-primary);color:var(--c-primary)}
.cta-banner--filled-brand .btn--emergency,.cta-banner--filled-brand .btn--ghost{background:transparent;border-width:max(var(--border),2px);border-style:solid;border-color:var(--c-on-primary);color:var(--c-on-primary);box-shadow:none}
.cta-banner--filled-brand .btn--emergency:hover,.cta-banner--filled-brand .btn--ghost:hover{background:var(--c-on-primary);color:var(--c-primary)}

/* .btn--solid INSIDE A BRAND PANEL - the last hole in the brand-panel rules.
   .btn--solid (see the button block above) force-fills with
   var(--grad-band) marked !important. Every panel rule above sets .btn--primary
   WITHOUT !important, so a button carrying BOTH classes ignores the panel fix
   and paints the gradient - on a panel whose own background is that same
   gradient. Measured on Cheyenne's /services/ hero: the .hero::before and the
   button both painted linear-gradient(135deg, rgb(56,49,165), rgb(61,22,243)),
   byte-identical, 1.00:1 - the button was invisible.
   The .cov-panel rule already had this guard and was the model for it; these five
   panels did not. Same shape: match the !important and cover both classes.
   Any NEW brand-coloured panel needs this third rule as well as the rest/hover
   pair, or it inherits the same hole. */
.section--dark .btn--solid,.section--brand .btn--solid,
.hero--left-banner-cta .btn--solid,.hero--color-block-split .btn--solid,
.cta-band .btn--solid,.cta-banner--filled-brand .btn--solid{
  background:var(--c-on-primary)!important;color:var(--c-primary)!important;
  border-color:var(--c-on-primary)!important}

/* icon-badge: the icon block is a SOLID full-height color tab flush with the
   card's own left edge (negative-margin bleed), not a small floating tinted
   circle - high contrast, reads as one designed panel with two zones. */
.cta-banner--icon-badge .cta-banner__inner{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:0 2.2rem 0 0;box-shadow:var(--shadow-md);min-height:5.5rem}
.cta-banner__badge{flex:0 0 auto;align-self:stretch;width:72px;background:var(--c-primary);color:var(--c-on-primary);display:grid;place-items:center;border-radius:var(--radius-card) 0 0 var(--radius-card);margin-right:.4rem}
.cta-banner--icon-badge .cta-banner__text{flex:1 1 220px;padding-block:1.5rem}
@media (max-width:640px){
  .cta-banner--icon-badge .cta-banner__inner{padding:0 1.6rem 1.6rem}
  .cta-banner__badge{align-self:auto;width:100%;height:56px;border-radius:var(--radius-card) var(--radius-card) 0 0;margin-right:0}
  .cta-banner--icon-badge .cta-banner__text{padding-block:1.2rem 0}
}

/* split-stat: the number sits in its own solid-fill block (not a thin
   border-left divider) - a real second zone, not just a hairline. */
.cta-banner--split-stat .cta-banner__inner{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:0;overflow:hidden}
.cta-banner--split-stat .cta-banner__copy{display:flex;flex-direction:column;gap:1.1rem;flex:1 1 auto;padding:1.8rem 2.2rem}
.cta-banner--split-stat .cta-banner__copy>.btn,.cta-banner--split-stat .cta-banner__copy>.cta-banner__actions{align-self:flex-start}
.cta-banner__stat{flex:0 0 auto;align-self:stretch;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15rem;padding:1.8rem 2rem;background:color-mix(in srgb,var(--c-primary) 13%,transparent);min-width:9rem}
.cta-banner__stat b{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.7rem,3vw,2.2rem);color:var(--c-primary)}
.cta-banner__stat span{color:var(--c-muted);font-size:var(--fs-xs);text-align:center}
@media (max-width:640px){.cta-banner--split-stat .cta-banner__inner{flex-direction:column}.cta-banner__stat{width:100%;padding:1.2rem}}

/* outline-bold: thick square-cornered border + a solid corner flag tab
   (small triangle-clipped block) instead of a plain outlined rectangle. */
.cta-banner--outline-bold .cta-banner__inner{position:relative;background:transparent;border:2.5px solid var(--c-text);border-radius:0;padding:2rem 2.2rem}
.cta-banner--outline-bold .cta-banner__inner::before{content:"";position:absolute;top:-2.5px;right:-2.5px;width:0;height:0;border-style:solid;border-width:0 34px 34px 0;border-color:transparent var(--c-primary) transparent transparent}
.cta-banner--outline-bold .cta-banner__copy{display:flex;flex-direction:column;gap:.5rem}
.cta-banner__eyebrow{font-family:var(--font-heading);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:var(--fs-xs);color:var(--c-primary)}

/* tinted-panel: a diagonal two-tone split (flat primary-tint wedge behind
   the copy) instead of a soft uniform gradient wash. */
.cta-banner--tinted-panel .cta-banner__inner{position:relative;background:var(--c-surface);border:1px solid color-mix(in srgb,var(--c-primary) 22%,transparent);border-radius:var(--radius-card);padding:2rem 2.2rem;overflow:hidden}
.cta-banner--tinted-panel .cta-banner__inner::before{content:"";position:absolute;inset:0;background:color-mix(in srgb,var(--c-primary) 10%,transparent);clip-path:polygon(0 0,42% 0,30% 100%,0 100%);z-index:0}
.cta-banner--tinted-panel .cta-banner__inner>*{position:relative;z-index:1}
@media (max-width:640px){.cta-banner--tinted-panel .cta-banner__inner::before{display:none}}

/* corner-accent: a full solid-color block on the left (not a thin 6px
   hairline) - same weight as icon-badge's tab but plain, no icon. */
.cta-banner--corner-accent .cta-banner__inner{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.9rem 2.2rem 1.9rem 1.9rem;border-left:10px solid var(--c-primary)}

/* centered-stack: bold heading-style text with a short brand-color rule
   underneath, not just centered body text. */
.cta-banner--centered-stack .cta-banner__inner{flex-direction:column;text-align:center;background:var(--c-surface);border:2px solid var(--c-border);border-radius:var(--radius-card);padding:2.4rem 2rem;gap:1rem}
.cta-banner--centered-stack .cta-banner__text{max-width:60ch;margin-inline:auto;font-family:var(--font-heading);font-size:var(--fs-lg)}
.cta-banner--centered-stack .cta-banner__text::after{content:"";display:block;width:52px;height:3px;background:var(--c-primary);margin:.9rem auto 0}
.cta-banner--centered-stack .cta-banner__actions{justify-content:center}

/* ---- prose (content pages) ---- */
/* Was max-width + a bare heading size + flat text color - real authored
   long-form copy (FAQ/Quote/Contact/Service-Areas-hub sections, e.g. "The
   Towns We Get To") rendered as an undifferentiated wall of text with no
   typographic hierarchy at all (confirmed real complaint, 2026-08-24).
   Editorial treatment, not a card: a colored accent bar on the heading
   (same device .prose-block already uses, kept consistent site-wide), the
   opening paragraph set larger as a real lede so a reader's eye has
   somewhere to land first, and proper paragraph rhythm (line-height +
   spacing) instead of relying on the browser's bare default margins. */
.prose{max-width:68ch;margin-inline:auto}
.prose h2{margin-top:0;margin-bottom:1.3rem;font-size:var(--fs-h3);position:relative;padding-left:1.1rem}
.prose h2::before{content:"";position:absolute;left:0;top:.14em;bottom:.14em;width:4px;border-radius:4px;background:var(--grad-brand)}
.prose p{color:var(--c-text);line-height:1.75;margin:0 0 1.3rem}
.prose p:first-of-type{font-size:var(--fs-md);line-height:1.65}
.prose p:last-child{margin-bottom:0}
.prose ul{padding-left:1.2rem;color:var(--c-text);line-height:1.7}
.prose li{margin-bottom:.5rem}

/* ---- contentProse structural variants (2026-08-24) - real layout
   differences for authored long-form sections, not the same "stacked"
   shape everywhere. See SECTION_POOLS.contentProse in variation.js and the
   matching branches in contentSections()/contentProse() in components. ---- */

/* boxed-cards: each section a real bordered/shadowed card, own surface
   color - a much stronger visual break than the plain alternating tint. */
.prose--boxed{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);
  padding:clamp(1.8rem,4vw,2.8rem);box-shadow:var(--shadow-sm)}
.prose-block--boxed{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);
  padding:1.6rem 1.8rem}

/* numbered-index: each section carries a large translucent ghost number -
   the reader always knows how far through the guide they are. */
.prose--numbered{position:relative}
.prose--numbered h2{padding-left:0}
.prose--numbered h2::before{content:none}
.prose--numbered::before{content:var(--n);position:absolute;top:-.3em;right:0;font-family:var(--font-heading);
  font-weight:800;font-size:clamp(3.4rem,9vw,5.5rem);line-height:1;color:color-mix(in srgb,var(--c-primary) 11%,transparent);
  pointer-events:none;z-index:0}
.prose--numbered h2,.prose--numbered p,.prose--numbered ul{position:relative;z-index:1}
.prose-block--numbered{position:relative;padding-left:2.6rem}
.prose-block--numbered::before{content:var(--n);position:absolute;top:-.05em;left:0;font-family:var(--font-heading);
  font-weight:800;font-size:1.3rem;color:var(--c-primary);line-height:1}
.prose-block--numbered h2{padding-left:0}
.prose-block--numbered h2::before{content:none}

/* magazine-columns: body copy flows in a real 2-column text block on wide
   screens (CSS multi-column, not a grid) - a genuinely different reading
   rhythm from a single centered column. Heading spans the full width. */
.prose--magazine{max-width:none}
.prose--magazine h2{max-width:68ch;margin-inline:auto}
.prose__columns{columns:2;column-gap:clamp(2rem,4vw,3.4rem)}
/* break-inside:avoid on a real multi-paragraph body of running text was
   wrong - it forbids the column flow from splitting a LONG paragraph at
   all, so the whole paragraph (and everything after it) gets forced into
   column 1 while column 2 sits empty (confirmed real, 2026-08-24: a single
   authored paragraph, several lines long, produced exactly this). A real
   magazine column is SUPPOSED to break paragraphs across the column
   boundary - only keep list items intact, where a mid-item split would
   look broken. */
.prose__columns ul{break-inside:avoid}
.prose__columns li{break-inside:avoid}

/* side-label: heading above the copy at full width, like every other prose
   template. It used to put the heading in a narrow "marginalia" column beside
   the body, which does not survive real content: these are AUTHORED headings
   (sections[].h2) of unbounded length - across one site's 17 distinct labels
   they run from "What We Check" to "If the website is the barrier, use the
   phone". A gutter sized for the longest swallows the body column; sized for
   the common case the long ones wrap to two cramped lines, and the original
   120px cap wrapped even three-word headings one word per line.
   The heading is now a real <h2> (like the lede/numbered/accent templates
   already emitted) with no size or transform override, so it renders exactly
   as every other section heading on the site - which is what was asked for
   after the gutter was removed. */
.prose--side-label{display:block;max-width:none}
.prose__body p:first-of-type{font-size:var(--fs-md);line-height:1.65}
.prose__body p{color:var(--c-text);line-height:1.75;margin:0 0 1.3rem}
.prose__body p:last-child{margin-bottom:0}
/* The label column was capped at 120px, but these labels are AUTHORED section
   headings (sections[].h2 in the content JSON), not fixed short words.
   Measured on Pasadena's /services/garage-door-repair/: "How It Shows Up"
   needs 133px on one line and "What the Fix Involves" needs 176px, so both
   wrapped to two cramped lines in a 120px gutter and read as broken rather
   than as marginalia. Widened to match the outer .prose--side-label column
   (200px) with headroom, so realistic headings sit on one line; text-wrap
   balance keeps a genuinely long one from breaking to a single orphan word. */
/* Same as the outer .prose--side-label above: stacked, full width, and the
   heading is a plain <h2> so it matches every other section heading on the
   site rather than being a 14px uppercase span in a gutter. */
.prose-block--side-label{display:block}
.prose-block__body p{color:var(--c-text);line-height:1.7;margin:0 0 1rem}
.prose-block__body p:last-child{margin-bottom:0}

/* media-left/media-right: real photo + text side by side - the per-section
   rotation's guaranteed "this is not just another wall of text" slot. */
.prose-media{display:grid;grid-template-columns:minmax(260px,38%) 1fr;gap:clamp(1.8rem,4vw,3.2rem);align-items:center}
.prose-media--rev{grid-template-columns:1fr minmax(260px,38%)}
.prose-media--rev .prose-media__fig{order:2}
.prose-media__fig{margin:0;border-radius:var(--radius-lg);overflow:hidden;aspect-ratio:4/3;background:var(--c-surface-alt)}
.prose-media__fig img,.prose-media__fig .ph{width:100%;height:100%;object-fit:cover;display:block}
.prose-media__body h2{margin-top:0}
@media (max-width:780px){.prose-media,.prose-media--rev{grid-template-columns:minmax(0,1fr)}.prose-media--rev .prose-media__fig{order:0}}
/* HOMEPAGE ABOUT (user 2026-10-12): on tablets the photo sat squeezed beside
   a tall text column. Phones AND tablets: photo full width on top, then the
   text - a wider 16:9 crop so it doesn't dominate the stacked layout. */
@media (max-width:1024px){.home-about .prose-media,.home-about .prose-media--rev{grid-template-columns:minmax(0,1fr);gap:1.6rem}.home-about .prose-media__fig,.home-about .prose-media--rev .prose-media__fig{order:0;aspect-ratio:16/9}}

/* Shared icon badge - EVERY content-section template gets one now (2026-08-24,
   explicit complaint: lede/accent's typography-only treatment still read as
   "plain text" even though it's a real, deliberate design choice). Not
   scoped to boxed-icon anymore - applies wherever .prose__ic/.prose-block__ic
   appears, so lede/accent get the exact same flat-tint circle badge. */
.prose__ic,.prose-block__ic{display:inline-flex;align-items:center;
  justify-content:center;width:2.6rem;height:2.6rem;border-radius:50%;margin-bottom:1rem;
  background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.prose-block__ic{width:2rem;height:2rem;margin-bottom:.7rem}

/* lede: typographic emphasis (the opening line reads like a real editorial
   lede/pull-statement) PLUS the shared icon badge above - no longer purely
   typographic-only. */
.prose--lede p:first-of-type,.prose-block--lede p:first-of-type{font-size:clamp(1.15rem,2.2vw,1.4rem);
  font-weight:600;color:var(--c-text);line-height:1.5;max-width:56ch}

/* accent: the 'stacked'/'boxed-cards' flavor slot - a colored left border
   bar plus the shared icon badge (icon sits above the bar/heading, outside
   the padding-left so it isn't awkwardly indented with the text). */
.prose--accent,.prose-block--accent{border-left:3px solid var(--c-primary);padding-left:clamp(1.1rem,2.4vw,1.6rem)}
.prose--accent .prose__ic,.prose-block--accent .prose-block__ic{margin-left:clamp(1.1rem,2.4vw,1.6rem)}

/* prose-combo: two real content sections presented as ONE combined design
 * (Dallas-only, see contentSections() in components/index.js) - a shared
 * bordered card split by a vertical divider. */
.prose-combo{display:grid;grid-template-columns:1fr auto 1fr;gap:0;border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,2.8rem)}
.prose-combo__half{padding:0 clamp(1rem,3vw,2rem);min-width:0}
.prose-combo__ic{display:inline-flex;align-items:center;justify-content:center;width:2.6rem;height:2.6rem;
  border-radius:50%;margin-bottom:1rem;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.prose-combo__half h3{font-family:var(--font-heading);font-weight:700;font-size:var(--fs-lg);margin:0 0 .8em;color:var(--c-text)}
.prose-combo__half p{color:var(--c-text);line-height:1.75;margin:0 0 1.2rem}
.prose-combo__half p:last-child{margin-bottom:0}
.prose-combo__div{width:1px;background:var(--c-border);align-self:stretch}
@media (max-width:780px){.prose-combo{grid-template-columns:minmax(0,1fr)}.prose-combo__div{width:100%;height:1px;margin-block:1.6rem}.prose-combo__half{padding:0}}

/* ---- area chips ---- */
.area-grid{display:flex;flex-wrap:wrap;gap:.65rem}
.area-chip{display:inline-flex;align-items:center;gap:.45rem;padding:.6rem 1rem;background:var(--c-surface);
  border:1px solid var(--c-border);border-radius:var(--radius-pill);text-decoration:none;color:var(--c-text);
  font-weight:600;font-size:var(--fs-sm);box-shadow:var(--shadow-sm);transition:border-color .15s,color .15s,transform .12s}
.area-chip:hover{border-color:var(--c-primary);color:var(--c-primary);transform:translateY(-2px)}
.area-chip .ico{color:var(--c-primary)}

/* ---- "Where we work" coverage map + directory ---- */
.coverage{display:grid;grid-template-columns:1fr 1.1fr;gap:2.6rem;align-items:start}
/* The directory column runs several times the map's height - measured on
   Miami's /service-areas/: a 2342px list beside a 458px map, i.e. 1884px of
   empty column under it. Sticking the map keeps it beside the list the whole
   way down instead of stranding it at the top (explicit user request: "map
   sticky and the list scrolled").
   align-self:start is load-bearing - a stretched grid item fills the row and
   cannot move, so sticky would silently do nothing. The offset clears the
   sticky .site-header (71px on Miami, taller on some themes).
   This also depends on main{overflow-x:clip} rather than overflow:hidden -
   hidden would create a scroll container and kill sticky outright. */
.coverage__map{position:sticky;top:clamp(5.5rem,7vw,6.75rem);align-self:start;
  border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-md);aspect-ratio:5/4;background:var(--c-surface);border:1px solid var(--c-border)}
.coverage__map > svg,.coverage__map > iframe,.coverage__map > img{width:100%;height:100%;display:block;border:0;object-fit:cover}
.coverage__badge{position:absolute;left:1rem;bottom:1rem;display:inline-flex;align-items:center;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.55rem 1rem;font-weight:700;font-size:var(--fs-sm);box-shadow:var(--shadow-sm)}
.coverage__badge .ico{color:var(--c-primary)}
.coverage__body{display:flex;flex-direction:column;gap:1.5rem}
.coverage__list{display:grid;gap:1.4rem}
.cov-group h3{font-size:var(--fs-md);margin:0 0 .8rem}
.cov-list{list-style:none;margin:0;padding:0;columns:2;column-gap:1.5rem}
/* display:flex on the li is what makes every card in a row the SAME HEIGHT.
   The li is the grid item, so it already stretches to the tallest cell in its
   row - but the <a> inside it sized to its own content, so a genuinely long
   real area name ("Avalon Park and the surrounding south side Chicago service
   area", 3 lines) left a tall card sitting beside short ones with visible gaps
   under them (user-reported on Chicago, 2026-08-25). Making the li a flex
   container lets the anchor stretch to fill it. */
.cov-list li{break-inside:avoid;margin-bottom:.55rem;display:flex}
/* Every area in the coverage directory is a REAL CARD with a real hover, not
   a pin glyph next to a run of text (user-reported on Chicago, 2026-08-25:
   "dont has proper area card and hover effect, its just looks plain text").
   This is the BASE, so it fixes every areas variant that doesn't draw its own
   box - stacked-two-row (Chicago), framed-outline, shadow-stack,
   quiet-editorial, glass-panel-grid, split-duotone, plus the map/directory
   layouts. The variants that DO draw their own box (pill-tags, outline-only,
   boxed-diagonal, circle-badge-grid) still win on source order below, and the
   two grid-line variants opt out explicitly - see their own rules. */
.cov-list a{display:flex;align-items:center;gap:.55rem;flex:1 1 auto;
  background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);
  padding:.7rem .9rem;box-shadow:var(--shadow-sm);
  color:var(--c-text);text-decoration:none;font-weight:600;font-size:var(--fs-sm);
  transition:border-color .16s ease,box-shadow .18s ease,transform .16s ease,background-color .18s ease,color .16s ease}
.cov-list a:hover{border-color:var(--c-primary);color:var(--c-link);
  background:color-mix(in srgb,var(--c-primary) 5%,var(--c-surface));
  box-shadow:var(--shadow-md);transform:translateY(-2px)}
.cov-list .ico{color:var(--c-primary);flex:0 0 auto;transition:transform .16s ease}
.cov-list a:hover .ico{transform:scale(1.15)}
.coverage__cta{align-self:flex-start}
/* areas - directory variant (gradient panel + wide 3-col directory) */
.coverage--directory{grid-template-columns:.9fr 1.5fr}
/* STICK THE PANEL - the two columns are wildly different heights.
   The panel is a fixed-size card (count + one line + a button) while the list
   is every area the business covers, so the taller the list the more dead
   space sat under the panel: measured on Rochester Hills, panel 244px against
   a 1601px list left 1357px of empty left column. .coverage already sets
   align-items:start, so the panel does not stretch to fill it either.
   Sticky keeps the count and the Check-your-area CTA in view for the whole
   scroll instead, which is the one thing that column is for.
   top clears the 69px sticky header with room to spare.
   ONLY above the collapse breakpoint: at max-width:920px .coverage is forced
   to a single column (with !important), where a sticky panel would pin itself
   over the list it is supposed to introduce.
   Sticky survives the section animation: GSAP parks .coverage and .cov-panel
   at matrix(0.97) pre-reveal and a transformed ancestor CONFINES sticky, but
   the presets pass clearProps:'all', so both inline transforms are gone once
   the reveal finishes - verified in the browser, not assumed. Never drop
   clearProps from the coverage preset or this silently stops working. */
@media (min-width:921px){
  .coverage--directory .cov-panel{position:sticky;top:5.5rem;align-self:start}
}
.cov-panel{background:var(--grad-band);color:var(--c-on-primary);border-radius:var(--radius-lg);padding:2rem;display:flex;flex-direction:column;gap:.7rem;box-shadow:var(--shadow-md)}
/* A .btn--solid inside this panel !important-forces
   var(--grad-brand) - identical to this panel's own background, so the
   button would otherwise vanish into the panel with no visible edge
   (.btn--solid also zeroes the border). Match the !important so this
   actually wins. */
.cov-panel .btn--primary,.cov-panel .btn--solid{background:var(--c-on-primary)!important;color:var(--c-primary)!important;border-color:var(--c-on-primary)!important}
.cov-panel__n{font-family:var(--font-heading);font-weight:800;font-size:clamp(2.4rem,6vw,3.6rem);line-height:1}
.cov-panel p{margin:0;opacity:.92}
.cov-panel .btn{margin-top:.5rem;align-self:flex-start;background:var(--c-on-primary)!important;color:var(--c-primary)!important}
.coverage__list--wide .cov-list{columns:2}

/* stats - cards variant */
.stats--cards .stat{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}

/* trustbar - inline variant */
.trustbar--inline .container{gap:0 .4rem}
.trustbar--inline .trust-item{background:none;border:0;box-shadow:none;padding:.4rem 1.2rem;position:relative}
.trustbar--inline .trust-item + .trust-item::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:1px;height:1.1em;background:var(--c-border)}

/* why - rows variant */
.feat-rows{display:grid;gap:0;max-width:72rem}
.feat-row{display:grid;grid-template-columns:auto 1fr;gap:1.3rem;align-items:center;padding:1.4rem 0;border-top:1px solid var(--c-border)}
.feat-row:last-child{border-bottom:1px solid var(--c-border)}
.feat-row__ic{width:52px;height:52px;border-radius:14px;background:var(--c-tint);color:var(--c-primary);display:grid;place-items:center}
.feat-row h3{margin:0 0 .2em;font-size:var(--fs-md)}
.feat-row p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}
.feat-row__n{font-family:var(--font-heading);font-weight:800;color:var(--c-link);font-size:clamp(1.4rem,2.6vw,1.8rem);min-width:2.2rem;text-align:center}

/* 2-column "split" sections (intro left, content right) - fill the full width
   so narrow content never leaves the right side blank. */
.process-split,.faq-split,.why-split{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(2rem,5vw,4rem);align-items:start}
.process-intro,.faq-intro,.why-intro{position:sticky;top:96px}
.process-intro .lead{margin-bottom:0}
.faq-split .faq{max-width:none}
.why-split .feat-rows{max-width:none}
.timeline{list-style:none;margin:0;padding:0;position:relative}
.timeline::before{content:"";position:absolute;left:20px;top:8px;bottom:26px;width:2px;background:var(--c-border)}
.tl-step{position:relative;display:grid;grid-template-columns:auto 1fr;gap:1.1rem;padding:0 0 1.6rem}
.tl-step__n{position:relative;z-index:1;width:42px;height:42px;border-radius:50%;background:var(--grad-band);color:var(--c-on-primary);display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;box-shadow:0 6px 14px -6px var(--shadow-tint)}
.tl-step__c h3{margin:.3rem 0 .2em;font-size:var(--fs-md);display:flex;align-items:center;gap:.5rem}
.tl-step__c h3 .ico{color:var(--c-primary)}
.tl-step__c p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* services - feature-first variant (first card spans wider + is emphasized) */
.svc-grid--feature .svc:first-child{grid-column:span 2;background:var(--c-tint)}
.svc-grid--feature .svc:first-child h3{font-size:var(--fs-lg)}
.svc-grid--feature .svc:first-child .svc__icon{width:60px;height:60px;font-size:1.7rem}
@media (max-width:1000px){.svc-grid--feature .svc:first-child{grid-column:span 2}}
@media (max-width:720px){.svc-grid--feature .svc:first-child{grid-column:span 1}}

/* ---- 2-column content layout ---- */
.content-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:3rem;align-items:start}
.content-main{min-width:0}
.prose-block{margin-bottom:2.6rem;max-width:68ch}
/* NEXT TO A SIDEBAR the main column is already a reading-width column
   (~830px beside the 320px sidebar at desktop), so the 68ch cap left ~300px
   of dead space between the text and the sidebar on every inner page with
   one (user 2026-10-12, Addison /addison/murphy/). Fill the column there;
   full-width pages (no sidebar) keep the 68ch measure. */
.content-layout .content-main .prose-block,.content-layout .content-main .prose-block p{max-width:none}
.prose-block:last-child{margin-bottom:0}
.prose-block h2{margin-bottom:1.2rem;font-size:var(--fs-h3);position:relative;padding-left:1rem}
.prose-block h2::before{content:"";position:absolute;left:0;top:.1em;bottom:.1em;width:4px;border-radius:4px;background:var(--grad-brand)}
.prose-block p{color:var(--c-text);line-height:1.75;margin:0 0 1.2rem}
.prose-block p:first-of-type{font-size:var(--fs-md);line-height:1.65}
.prose-block p:last-child{margin-bottom:0}
.prose-block ul{padding-left:1.2rem;line-height:1.7}.prose-block li{margin-bottom:.5rem}
/* compact why-choose-us block inside the content column */
.why-compact{margin-top:2.6rem;padding-top:2rem;border-top:1px solid var(--c-border);max-width:68ch}
.why-compact h2{font-size:var(--fs-h3);margin-bottom:1.3rem}
.wc-list{list-style:none;margin:0;padding:0;display:grid;gap:1.1rem}
.wc-list li{display:grid;grid-template-columns:auto 1fr;gap:.9rem;align-items:start}
.wc-ic{width:44px;height:44px;border-radius:12px;background:var(--c-tint);color:var(--c-primary);display:grid;place-items:center}
.wc-list b{display:block;margin-bottom:.15rem}
.wc-list span{color:var(--c-muted);font-size:var(--fs-sm)}
.sidebar{position:sticky;top:88px;display:grid;gap:1.2rem}
.side-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.5rem;box-shadow:var(--shadow-md)}
.side-card h4{font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.08em;color:var(--c-muted);margin:0 0 .9rem}
.side-card--cta{background:var(--grad-band);color:var(--c-on-primary);border:0}
.side-card--cta h3{color:var(--c-on-primary);margin:0 0 .4rem}
.side-card--cta p{color:var(--c-on-primary);font-size:var(--fs-sm);margin-bottom:1rem}
.side-card--cta .btn{background:var(--c-on-primary);color:var(--c-primary);width:100%}
/* both card buttons one height, whatever each skin's border width */
.side-card--cta .btn--primary,.side-card--cta .btn.side-card__call{display:flex;align-items:center;justify-content:center;height:48px;box-sizing:border-box;padding-block:0}
/* Phone is a real button (user 2026-10-12: "phone number as a plain text it
   should be like a button") - outlined secondary under the solid quote button,
   same width and height, so both read as actions. Specificity beats the
   .side-card--cta .btn fill above. */
.side-card--cta .btn.side-card__call{display:flex;align-items:center;justify-content:center;gap:.5rem;margin-top:.7rem;
  background:transparent;color:var(--c-on-primary);border:2px solid color-mix(in srgb,var(--c-on-primary) 80%,transparent);box-shadow:none}
.side-card--cta .btn.side-card__call:hover,.side-card--cta .btn.side-card__call:focus-visible{background:color-mix(in srgb,var(--c-on-primary) 14%,transparent);color:var(--c-on-primary)}
.side-card--cta .btn.side-card__call .ico{color:currentColor}
.side-links{list-style:none;margin:0;padding:0;display:grid;gap:.55rem}
.side-links a{display:inline-flex;align-items:center;gap:.45rem;color:var(--c-text);text-decoration:none;font-weight:600;font-size:var(--fs-sm)}
.side-links a:hover{color:var(--c-primary)}
.side-links .ico{color:var(--c-primary)}
.side-card--areas{background:var(--c-surface-alt)}
.side-areas{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:.3rem .8rem}
.side-areas li{break-inside:avoid}
.side-areas a{display:flex;align-items:center;gap:.35rem;color:var(--c-text);text-decoration:none;font-weight:600;font-size:var(--fs-xs);padding:.3rem 0}
.side-areas a:hover{color:var(--c-primary)}
.side-areas .ico{color:var(--c-primary);flex:0 0 auto}
.side-areas__more{display:inline-flex;align-items:center;gap:.35rem;margin-top:.9rem;font-size:var(--fs-xs);font-weight:700;color:var(--c-link);text-decoration:none}
.side-areas__more:hover{color:var(--c-primary)}
@media (max-width:600px){.side-areas{grid-template-columns:minmax(0,1fr)}}
@media (max-width:960px){.content-layout{grid-template-columns:minmax(0,1fr);gap:2rem}.sidebar{position:static;grid-template-columns:1fr 1fr;display:grid}}
@media (max-width:780px){
  /* side-label is display:block at every width now, so its old
     grid-template-columns / sticky-label overrides here are dead. */
  .prose__columns{columns:1}
}
@media (max-width:600px){.sidebar{grid-template-columns:minmax(0,1fr)}}

/* ---- footer ---- */
.site-footer{background:var(--c-secondary);color:var(--c-on-secondary);margin-top:auto}
.site-footer a{color:color-mix(in srgb,var(--c-on-secondary) 82%,transparent);text-decoration:none}
.site-footer a:hover{color:var(--c-on-secondary)}
/* Footer renders a brand block + a variable number of link columns (2-4
   depending on whether the site has services/areas). Flex (not grid) is
   deliberate here - 15 of the 20 footer skins below restyle these columns
   with their own flex-basis/flex-direction rules, so switching the base to
   grid would silently break every one of them. Equal flex-basis on every
   column (including the brand block, previously double-width) is what
   makes 4 real columns actually land as 4 clean, evenly-sized columns
   instead of wrapping raggedly - the OLD "grid-template-columns" responsive
   rule below was a no-op on this flex container and never actually
   collapsed anything; fixed with real flex-basis overrides instead. */
.footer-grid{display:flex;flex-wrap:wrap;gap:1.8rem 3rem;padding-block:2.8rem;align-items:flex-start}
.footer-grid > div{flex:1 1 0;min-width:200px}
/* THE BRAND COLUMN CARRIES FAR MORE THAN A LINK LIST - give it the extra room.
   Every column shared one flex:1 1 220px, but column one holds the logo, the
   full business name, a description, a street address, a phone and the hours,
   while the others hold 3-6 short links. Equal widths therefore wrapped the
   address and the description onto extra lines while the link columns sat with
   dead space to their right (reported on Duncanville, 2026-09-01).
   1.7 of the free space vs 1 gives the brand roughly 1.5x a link column and
   leaves the link columns wide enough for a two-line service-area name.
   SCOPED ABOVE THE COLLAPSE BREAKPOINT ON PURPOSE: at <=1000px the footer goes
   two-up via .footer-grid > div{flex-basis:calc(50% - 1.5rem)} and at <=600px
   one-up, both (0,1,1). An unscoped rule here is (0,2,1) and would outrank
   them, pinning the brand column at 320px and breaking both collapses.
   BASIS IS ZERO ON ALL FOUR COLUMNS - that is what makes the ratio work.
   A 320px basis on the brand alone was tried first and broke
   footer--wide-spaced, whose own column-gap is 5rem: 320 + 3x220 + 3x80 came to
   1220px against a 1200px container, so the fourth column wrapped onto its own
   row and spanned the full width (Springfield MA). Setting basis 0 on only the
   brand was worse: the other three kept their 220px basis, so the brand grew
   from nothing and finished NARROWEST at 200px, its min-width. With basis 0
   everywhere the free space is split purely 1.7:1:1:1, the skin's own gap can
   never push the row over, and wrapping is governed by the shared
   min-width:200px, which needs only 800px plus gaps.
   It cannot exceed the page container: .footer-grid lives inside .container,
   whose width is min(--max-w, 100% - 2*--pad-x), and these are shrinkable,
   wrappable flex items - measured below.
   Skins that already size column one (dark-split 34%, quiet-editorial 300px,
   split-duotone 290px) are (0,3,1) and still win. */
@media (min-width:1001px){
  .footer-grid > div:first-child{flex:1.7 1 0}
}
.footer--bold-cta-band .footer-cta{background:var(--grad-band);color:var(--c-on-primary);text-align:center;padding-block:2.6rem}
.footer--bold-cta-band .footer-cta h2{color:var(--c-on-primary)}
.site-footer h4{font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.1em;opacity:.85;margin-bottom:.9rem}
.site-footer ul{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}
.site-footer li{margin:0}
/* Always exactly 1-2 direct children (meta group, optionally + legal-links
   group) regardless of how many legal pages exist - never raw individual
   spans - so space-between can't split into an oversized gap the way it
   would with a variable flat item count (see js-engine-css-bugs memory). */
.footer__legal{border-top:1px solid color-mix(in srgb,var(--c-on-secondary) 16%,transparent);padding-block:1.4rem;font-size:var(--fs-xs);opacity:.8;display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem 1.5rem}
.footer__legal-meta{display:flex;gap:.5rem;flex-wrap:wrap}
.footer__legal-links{display:flex;gap:1.1rem;flex-wrap:wrap}
.footer__legal-links a{color:inherit;text-decoration:none;opacity:.85}
.footer__legal-links a:hover{opacity:1}

/* ---- unified footer (.sfoot) - the ONE footer every site renders
   (2026-10-07, Temecula reference). Layout is fixed; colour is per site:
   the near-black base is tinted with the site's own --c-secondary and the
   badge icons take its --c-accent. Base is always dark, so light text is
   always the readable choice regardless of theme mood. */
.site-footer.sfoot{--sf-bg:color-mix(in srgb,var(--c-secondary) 42%,#06080d);--sf-text:#f3f5f8;--sf-muted:color-mix(in srgb,#f3f5f8 66%,var(--sf-bg));--sf-line:color-mix(in srgb,#f3f5f8 13%,transparent);--sf-ico:color-mix(in srgb,var(--c-accent) 78%,#fff);
  background:var(--sf-bg);color:var(--sf-muted);font-size:.9rem}
.sfoot a{color:var(--sf-muted);text-decoration:none;transition:color .15s}
.sfoot a:hover,.sfoot a:focus-visible{color:var(--sf-text)}
.sfoot__grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:2.4rem 3rem;padding-block:3.4rem 2.6rem;align-items:start}
.sfoot .sfoot__logo{display:inline-flex;align-items:center;gap:.6rem;color:var(--sf-text)}
.sfoot__logo .brand__mark--logo{height:52px;width:auto;max-width:140px;flex:none}
.sfoot .sfoot__logo>span{font-family:var(--font-heading);font-weight:800;font-size:1.15rem;line-height:1.2;color:var(--sf-text)}
.sfoot__desc{margin:1.3rem 0 0;line-height:1.75;max-width:36ch}
.sfoot__addr{font-style:normal;margin-top:1.1rem;line-height:1.75}
.sfoot .sfoot__phone{display:inline-block;margin-top:.5rem;font-weight:700;color:var(--sf-text)}
.sfoot h4{margin:0 0 1.3rem;font-family:var(--font-body);font-size:.78rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--sf-text);opacity:1}
.sfoot ul{list-style:none;margin:0;padding:0;display:grid;gap:.25rem}
/* every footer link is a 24px+ tap target at every width (short ones like
   "FAQ" were 17px tall on desktop); the list gap shrinks to keep the rhythm */
.sfoot__col a,.sfoot__legal a,.sfoot__contact a,.sfoot .sfoot__phone{display:inline-block;padding-block:.35rem}
.sfoot__col a{font-size:.88rem}
.sfoot .sfoot__badges{display:flex;flex-wrap:wrap;gap:1rem 2.4rem;padding-block:1.5rem;border-top:1px solid var(--sf-line);border-bottom:1px solid var(--sf-line)}
.sfoot__badges li{display:flex;align-items:center;gap:.6rem;color:var(--sf-text);font-size:.85rem;font-weight:500}
.sfoot__badges .ico{color:var(--sf-ico)}
.sfoot__bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.6rem 2rem;padding-block:1.5rem 1.8rem;font-size:.78rem}
.sfoot__bar p{margin:0}
.sfoot__legal a,.sfoot__contact a{color:var(--sf-text);font-weight:600}
@media (max-width:1000px){
  .sfoot__grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .sfoot__brand{grid-column:1 / -1}
}
@media (max-width:600px){
  .sfoot__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem 1.5rem;padding-block:2.6rem 2rem}
  .sfoot .sfoot__badges{display:grid;grid-template-columns:minmax(0,1fr);gap:.85rem}
  .sfoot__bar{flex-direction:column;align-items:flex-start}
}

/* ---- breadcrumbs ---- */
.crumbs{font-size:var(--fs-sm);color:var(--c-muted);padding-block:.9rem}
/* 24px+ tap target (was 17px tall); block padding trimmed so the bar keeps its height */
.crumbs a{color:var(--c-muted);text-decoration:none;display:inline-block;padding-block:.35rem}
.crumbs a:hover{color:var(--c-primary)}

/* ---- icons ---- */
.ico{display:inline-block;vertical-align:middle;flex:0 0 auto}
.svc__icon .ico,.feat__dot .ico{color:var(--c-primary)}
.svc--editorial-row .svc__icon .ico,.svc--text-list .svc__icon .ico,.svc--blocky-numbered .svc__icon .ico,.svc--offset-number .svc__icon .ico{color:var(--c-accent)}
.trust-item .ico{color:var(--c-link)}
.hero__chips .chip-ico{color:var(--c-primary);margin-right:.1rem}
.svc__more .ico,.btn .ico{color:currentColor}

/* ---- illustration art + photos ---- */
.ph{display:block;width:100%;height:100%;line-height:0}
.ph svg{width:100%;height:100%;display:block}
.hero__media img,.product-card__media img,.post-card__media img,.gallery figure img{width:100%;height:100%;object-fit:cover;display:block}

/* ---- sticky mobile CTA ---- */
.mobile-cta{position:fixed;left:0;right:0;bottom:0;z-index:120;display:none;gap:.6rem;padding:.7rem;
  padding-bottom:calc(.7rem + env(safe-area-inset-bottom,0px));
  background:color-mix(in srgb,var(--c-bg) 94%,transparent);border-top:1px solid var(--c-border);backdrop-filter:blur(10px);box-shadow:0 -8px 24px -12px var(--shadow-tint)}
.mobile-cta .btn{flex:1;min-width:0}
/* 320-360px phones: the two buttons' natural widths (~188 + 105px + gap)
   overran a 305px bar and clipped "Call" (2026-10-12 responsive sweep). */
@media (max-width:360px){.mobile-cta{gap:.45rem;padding-inline:.5rem}.mobile-cta .btn{padding-inline:.55rem;font-size:.85rem;gap:.35rem}}
.mobile-cta .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem}
.mobile-cta .btn .ico{flex:0 0 auto;width:18px;height:18px;stroke:currentColor}
/* No ctaStyle skin class on this bar (see mobileCta() comment) - always
   solid/high-contrast, since this is a persistent overlay whose only job
   is an unmissable tap target, regardless of which button skin the rest
   of the page uses. */
.mobile-cta .btn--primary{background:var(--grad-band);color:var(--c-on-primary);border-color:transparent}
.mobile-cta .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency);border-color:transparent}
.mobile-cta .btn--ghost{background:var(--c-surface);color:var(--c-text);border-color:var(--c-border)}
.mobile-cta .btn--primary:hover{filter:brightness(1.1)}
.mobile-cta .btn--emergency:hover{filter:brightness(1.1)}
/* Shown on tablet + mobile only - desktop keeps the header's own Call button
   and quote CTA visible without a second, redundant fixed bar. Body gets
   matching bottom padding so the fixed bar never covers the real footer. */
@media (max-width:960px){
  .mobile-cta{display:flex}
  body:has(.mobile-cta){padding-bottom:calc(4.6rem + env(safe-area-inset-bottom,0px))}
}

/* ---- announcement / utility bar ---- */
.announce{background:var(--c-secondary);color:var(--c-on-secondary);font-size:var(--fs-xs)}
.announce .container{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-block:.5rem;flex-wrap:wrap}
.announce .ann__left{display:flex;gap:1.2rem;flex-wrap:wrap;align-items:center}
.announce .ann__left span{display:inline-flex;align-items:center;gap:.35rem}
.announce .ann__badge{color:var(--c-on-secondary);font-weight:700}
.announce .ann__phone{color:var(--c-on-secondary);font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:.35rem}
.announce .ico{color:currentColor;opacity:.9}

/* ---- header call button + services mega dropdown ---- */
.btn-call{display:inline-flex;align-items:center;gap:.5rem;text-decoration:none;font-family:var(--font-heading);font-weight:800;
  /* min-height matches the .btn floor - at .7rem padding this pill measured
     41px, under the 44px tap-target guideline, and sat visibly shorter than
     every other button on the page. */
  font-size:var(--fs-sm);line-height:1;padding:.7rem 1.25rem;min-height:44px;border-radius:var(--radius-pill);
  /* SOLID, not a translucent ghost pill. Two earlier revisions of this were
     both rejected as hard to read and the reason is not the contrast ratio:
     the label was brand-coloured text sitting on a 12% tint of the same hue.
     v1 was color-mix(--c-emergency 76%, --c-text) = 3.18:1 on a dark header,
     a real AA failure. v2 moved to --c-emergency-link and measured 5.92:1,
     which PASSES AA - and the user still could not read it, because saturated
     purple-on-near-black at 14.5px is hard to read whatever the ratio says.
     A filled button puts --c-on-emergency (a guaranteed contrast partner of
     --c-emergency) on the fill itself: 8.87:1 on the same site, and the same
     guarantee on every theme because both tokens come from palette.js.
     Do not return this to a tinted/outline treatment - it is the header's
     primary phone CTA and has to be legible at a glance. */
  color:var(--c-on-emergency);background:var(--c-emergency);
  border:1.5px solid color-mix(in srgb,var(--c-on-emergency) 30%,transparent);transition:.15s;white-space:nowrap;
  box-shadow:0 2px 10px -4px color-mix(in srgb,var(--c-emergency) 70%,transparent)}
/* rest is already solid, so hover deepens the fill instead of filling it */
.btn-call:hover{background:color-mix(in srgb,var(--c-emergency) 84%,#000);color:var(--c-on-emergency);transform:translateY(-1px);box-shadow:0 8px 18px -8px color-mix(in srgb,var(--c-emergency) 55%,transparent)}
.btn-call .ico{color:currentColor}
.nav__links .has-menu{position:relative}
.nav__links .has-menu>a{display:inline-flex;align-items:center;gap:.3rem}
.nav__links .has-menu>a .chev{transition:transform .15s}
.nav__links .has-menu:hover>a .chev,.nav__links .has-menu:focus-within>a .chev{transform:rotate(90deg)}
.mega{position:absolute;top:calc(100% + 8px);left:0;min-width:520px;background:var(--c-surface);border:1px solid var(--c-border);
  border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);padding:1rem;opacity:0;visibility:hidden;transform:translateY(6px);transition:.15s;z-index:120}
.has-menu:hover .mega,.has-menu:focus-within .mega{opacity:1;visibility:visible;transform:translateY(0)}
.mega--wide{min-width:640px}
.mega--right{left:auto;right:0}
.mega__grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.2rem}
.mega__grid--3{grid-template-columns:repeat(3,1fr)}
.mega__grid a{display:flex;align-items:center;gap:.6rem;padding:.6rem .7rem;border-radius:10px;color:var(--c-text);text-decoration:none;font-weight:600;font-size:var(--fs-sm);min-width:0}
/* Real area names vary a lot in length ("Bridgeport" vs "Avalon Park and
   the surrounding south side Chicago service area") - a long one wrapping
   to 2-3 lines blows up its whole grid row's height and throws off every
   other item's alignment in that row. Keep every item to exactly one line
   with an ellipsis - the "View all N areas" link already covers full
   detail, the megamenu itself only needs a fast-scan shortlist. */
.mega__grid a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.mega__grid a:hover{background:var(--c-tint)}
.mega__grid .ico{color:var(--c-primary)}
.mega__all{display:inline-flex;align-items:center;gap:.4rem;margin-top:.6rem;padding:.5rem .7rem;font-weight:700;color:var(--c-link);text-decoration:none}

/* ---- brand / badge bar ---- */
.brandbar{background:var(--c-bg);padding-block:1.4rem}
.brandbar__label{text-align:center;color:var(--c-muted);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.1em;margin:0 0 .9rem}
.brandbar__row{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;align-items:center}
.brandbar__row--badges{margin-top:1rem}
/* Auto-scrolling marquee: the track holds the chip list TWICE back-to-back
   (width:max-content) and animates translateX by exactly one copy's width
   (-50%), so the loop point is invisible. Edges fade via mask so chips don't
   look like they're cut off mid-shape. */
.brandbar__marquee{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.brandbar__track{display:flex;gap:.6rem;width:max-content;animation:brandbar-scroll-ltr 26s linear infinite}
.brandbar__track--rtl{animation-name:brandbar-scroll-rtl}
.brandbar__dual{display:flex;flex-direction:column;gap:.7rem}
@keyframes brandbar-scroll-ltr{from{transform:translateX(-50%)}to{transform:translateX(0)}}
@keyframes brandbar-scroll-rtl{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.brandbar__marquee:hover .brandbar__track{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.brandbar__track{animation:none}}
.brand-chip{display:inline-flex;align-items:center;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.5rem 1.05rem;font-weight:700;color:color-mix(in srgb,var(--c-text) 78%,transparent);font-size:var(--fs-sm);box-shadow:var(--shadow-sm);
  transition:border-color .18s ease,transform .18s ease}
.brand-chip__ico{color:var(--c-primary);transition:transform .18s ease}
/* Not a link either - a small 1px nudge (not the usual 2-4px card lift)
   plus the icon nudging further reads as "acknowledged" without claiming
   to be clickable. */
.brand-chip:hover{border-color:var(--c-primary);transform:translateY(-1px)}
.brand-chip:hover .brand-chip__ico{transform:scale(1.15)}
.rev-badge{display:inline-flex;align-items:center;gap:.35rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.5rem 1rem;font-size:var(--fs-sm)}
.rev-badge__stars{color:var(--c-accent)}

/* ---- process steps ---- */
.steps{margin-top:1rem}
.step{position:relative;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.7rem 1.4rem 1.4rem;box-shadow:var(--shadow-sm)}
.step__n{position:absolute;top:-16px;left:1.3rem;width:34px;height:34px;border-radius:50%;background:var(--grad-band);color:var(--c-on-primary);display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;box-shadow:0 8px 16px -8px var(--shadow-tint)}
.step__ic{color:var(--c-primary);margin:.4rem 0 .7rem}
.step h3{font-size:var(--fs-md);margin-bottom:.3em}
.step p{color:var(--c-muted);margin:0;font-size:var(--fs-sm)}

/* ---- about media ---- */
/* The five res/com layouts and their CSS were deleted 2026-09-10; that section
   no longer renders anywhere. .about__media stayed because about() uses it. */
.about__media{margin:0;border-radius:var(--radius-card);overflow:hidden;aspect-ratio:4/3;background:var(--c-surface-alt)}
.about__media img,.about__media .ph{width:100%;height:100%;object-fit:cover;display:block}


/* ---- financing ---- */
.finance{display:grid;grid-template-columns:1.5fr 1fr;gap:2rem;align-items:center;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:2rem;box-shadow:var(--shadow-md)}
.finance__cta{display:flex;flex-wrap:wrap;gap:.9rem;justify-content:flex-end}

/* ---- products / item catalog ---- */
.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--grid-gap)}
.product-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .16s,box-shadow .18s}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-xl)}
.product-card__media{aspect-ratio:4/3;background:var(--c-surface-alt)}
.product-card__body{padding:1.2rem 1.4rem}
.product-card__body h3{font-size:var(--fs-md);margin:0 0 .4rem}
.product-card[hidden]{display:none}

.style-filter{display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:1.6rem}
.style-filter__pill{font:inherit;font-weight:600;font-size:var(--fs-sm);padding:.5rem 1rem;border-radius:var(--radius-pill);
  border:1px solid var(--c-border);background:var(--c-surface);color:var(--c-text);cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.style-filter__pill:hover{border-color:var(--c-primary)}
.style-filter__pill.is-active{background:var(--c-primary);border-color:var(--c-primary);color:var(--c-on-primary)}

.style-compare{display:grid;gap:1.4rem}
.style-compare__row{padding-block:1.2rem;border-top:1px solid var(--c-border)}
.style-compare__row:first-child{border-top:0;padding-top:0}
.style-compare__row h3{margin:0 0 .3rem;font-size:var(--fs-md)}
.style-compare__material{color:var(--c-link);font-weight:700;font-size:var(--fs-sm);margin:0 0 .5rem}
.style-compare__row p:not(.style-compare__material){color:var(--c-muted);margin:0;max-width:70ch}

/* ---- resources / blog cards ---- */
.post-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--grid-gap)}
.post-card{display:flex;flex-direction:column;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);text-decoration:none;color:inherit;transition:transform .16s,box-shadow .18s}
.post-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-xl)}
.post-card__media{aspect-ratio:16/9;background:var(--c-surface-alt);overflow:hidden}
.post-card__media .media-fill,.post-card__media .ph{width:100%;height:100%}
/* EQUAL CARDS, ALIGNED LINK (user 2026-10-12, Chandler homepage blog): the
   card already stretches to the row height, but its body did not, so
   "Learn more" floated at a different height on every card. Body fills the
   card and the link is pushed to its bottom edge. */
.post-card{height:100%}
.post-card__body{padding:1.3rem 1.4rem 1.5rem;flex:1 1 auto;display:flex;flex-direction:column}
.post-card__more{margin-top:auto;padding-top:.2rem}
.post-card__body h3{font-size:var(--fs-md);margin:0 0 .5rem}
.post-card__body p{color:var(--c-muted);font-size:var(--fs-sm);margin:0 0 .9rem}
.post-card__more{font-weight:700;color:var(--c-link);font-size:var(--fs-sm)}
.post-featured{margin-bottom:1.6rem}
.post-featured .post-card--featured{flex-direction:row}
/* Same stretch-with-no-cap risk as the hero variants above - a long
   featured-post description can stretch this row taller than a normal
   photo should ever go. */
.post-featured .post-card__media{width:44%;aspect-ratio:auto;max-height:420px}
.post-featured .post-card__body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:1.8rem 2rem}
.post-featured .post-card__more{margin-top:0}
.post-featured .post-card__body h3{font-size:var(--fs-lg)}
@media (max-width:720px){.post-featured .post-card--featured{flex-direction:column}.post-featured .post-card__media{width:100%;aspect-ratio:16/9}}

/* homepage latest-posts section (homeBlog in components/index.js): 3 cards,
   4 on full-width sites, fewer when a site has fewer posts. Desktop-only
   column counts - the 1000px/720px .post-grid rules below take over on
   smaller screens. */
@media (min-width:1001px){
  .post-grid--n4{grid-template-columns:repeat(4,1fr)}
  .post-grid--n2{grid-template-columns:repeat(2,1fr)}
  .post-grid--n1{grid-template-columns:minmax(0,560px);justify-content:center}
}
.home-blog__all{display:flex;justify-content:center;margin-top:2rem}
/* 3 cards: stay 3-across on tablets - the shared 1000px rule would make it
   2 + 1 with the third card stranded on its own row. */
@media (min-width:721px) and (max-width:1000px){.post-grid.post-grid--n3{grid-template-columns:repeat(3,1fr)}}

}
.media-fill{width:100%;height:100%;object-fit:cover;display:block}

/* ---- review badge cards + contact + cta band buttons ---- */
.rev-badges .rev-card{text-align:center;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.6rem;box-shadow:var(--shadow-sm)}
.rev-card__n{font-family:var(--font-heading);font-weight:800;font-size:2rem;color:var(--c-primary);line-height:1}
.rev-card__p{font-weight:700;margin-top:.4rem}
.rev-card__c{color:var(--c-muted);font-size:var(--fs-sm)}
.contact-line{display:flex;align-items:center;gap:.55rem;margin:.4rem 0}
.contact-line .ico{color:var(--c-primary)}
.contact-cta{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:1.2rem}
/* contact page: info + map */
.contact-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:2.6rem;align-items:stretch}
.contact-list{list-style:none;margin:1.4rem 0;padding:0;display:grid;gap:.9rem}
.contact-list li{display:flex;align-items:center;gap:.6rem;font-weight:600}
.contact-list .ico{color:var(--c-primary);flex:0 0 auto}
.contact-list a{color:var(--c-text);text-decoration:none}
.contact-list a:hover{color:var(--c-primary)}
.map-embed{position:relative;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-md);background:var(--c-surface-alt);min-height:380px}
.map-embed iframe{width:100%;height:100%;min-height:380px;border:0;display:block}
.map-embed__link{position:absolute;right:.7rem;bottom:.7rem;background:var(--c-surface);color:var(--c-link);font-weight:700;font-size:var(--fs-xs);padding:.4rem .8rem;border-radius:var(--radius-pill);text-decoration:none;box-shadow:var(--shadow-sm)}
@media (max-width:900px){.contact-grid{grid-template-columns:minmax(0,1fr)}}
.cta-band__btns{display:flex;gap:.9rem;justify-content:center;flex-wrap:wrap;margin-top:1.6rem}
/* layered-depth buttons cast a 10px offset shadow right/down: widen the gap so it never sits on the next button. */
.cta-band__btns.cta-layered-depth-btn,.cta-banner__actions.cta-layered-depth-btn{column-gap:calc(.9rem + 12px);row-gap:calc(.9rem + 12px)}
.footer__address{display:flex;align-items:flex-start;gap:.5rem;margin-top:.8rem;opacity:.9}
.footer__address .ico{flex:none;margin-top:.15rem}
.footer__phone{margin-top:.8rem}
.footer__phone a{display:inline-flex;align-items:center;gap:.4rem;font-weight:700;color:var(--c-on-secondary)}
.footer__phone .ico{color:var(--c-on-secondary)}
/* background:#fff, matching the embedded form's own canvas - var(--c-surface)
   framed a white form in a dark card on the dark themes. */
.ghl-embed{box-shadow:var(--shadow-xl);border-radius:var(--radius-lg);overflow:hidden;position:relative;background:#fff}
/* Loading skeleton for the third-party quote form.
   HIDDEN BY DEFAULT and revealed only while .is-loading is present, which is
   added by script (see quoteEmbed in components/index.js). With JS off the
   class is never added, so the skeleton stays hidden and the real iframe shows
   - the opposite default would strand a skeleton over a working form. */
/* THE CONTAINER RESERVES ITS OWN HEIGHT WHILE LOADING.
   LeadConnector's form_embed.js parks the iframe at
   position:absolute;visibility:hidden;left:-9999px while it initialises, which
   takes it OUT OF FLOW - so .ghl-embed collapsed to 0 and the skeleton, being
   inset:0 inside it, rendered as a 77px sliver instead of filling the space
   (measured 2026-08-30). The floor comes from --ghl-h, set inline from
   ghlFormHeight, so it always matches the iframe's own min-height rather than
   hardcoding a second copy of that number.
   Only while .is-loading: once the form is ready the iframe returns to flow
   and the container must size to whatever height the resizer set, not to a
   stale floor. */
/* UNCONDITIONAL, not just while loading. form_embed.js takes the iframe out
   of flow, so without a floor here the container measures 0 - and if the form
   never arrives (blocked, offline, or the 20s giveup fires) the page is left
   with a collapsed empty box where the form should be. The floor guarantees
   the slot always occupies its space. The resizer sets an explicit height
   above this once the form renders, so it only ever acts as a minimum. */
.ghl-embed{min-height:var(--ghl-h,980px)}
/* Floor released once form_embed.js has sized the iframe (see fit() in quoteEmbed) - otherwise the 1336px placeholder left a white tail under the shorter real form. */
.ghl-embed.is-sized{min-height:0}
.ghl-embed__skeleton{display:none}
/* The skeleton COVERS the iframe (z-index) rather than the iframe being faded
   in underneath it. The iframe's own opacity is never touched.
   An earlier version faded the iframe in from opacity 0 with a transition to
   1 - and a throttled/hidden tab leaves that transition "running" but frozen
   at 0, i.e. an invisible form. Never gate critical content behind a
   transition completing; hide the covering layer instead. */
/* WHITE, and grey bars - deliberately NOT the site's theme tokens.
   A skeleton is a promise about what is arriving, so it has to resemble the
   real thing. The embedded form always renders on #FFFFFF with grey inputs
   (confirmed in the widget's own stylesheet: background-color:#FFFFFFFF), so
   painting the skeleton with var(--c-surface) meant a DARK placeholder
   snapping to a WHITE form on the six dark-theme sites. Theme-neutral here is
   the correct choice precisely because the content is theme-neutral. */
.ghl-embed.is-loading .ghl-embed__skeleton{display:flex;flex-direction:column;gap:.55rem;
  position:absolute;inset:0;padding:clamp(1.5rem,4vw,2.6rem);background:#fff;z-index:1;
  overflow:hidden}
/* Fixed greys, not theme tokens - see the note on the skeleton above. These
   sit on the white card and approximate the widget's own #d0d5dd input
   borders and grey label text. */
.ghl-sk{display:block;border-radius:6px;
  background:linear-gradient(90deg,#eceff3 0%,#f6f8fa 50%,#eceff3 100%);
  background-size:200% 100%;animation:ghl-sk-shimmer 1.4s ease-in-out infinite}
/* Sized to the real widget, not to a generic form: 52px inputs, a title line,
   six fields, a message textarea and a full-width submit. Together with the
   --ghl-h floor this lands close to the ~1170-1190px the form actually renders
   at, so the handover is not a jump. */
.ghl-sk--title{width:54%;height:22px;margin-bottom:.6rem}
.ghl-sk--label{width:30%;height:11px;margin-top:.9rem}
.ghl-sk--field{width:100%;height:52px;border-radius:8px}
.ghl-sk--area{width:100%;height:118px;border-radius:8px}
.ghl-sk--btn{width:100%;height:52px;margin-top:1.5rem;border-radius:8px}
@keyframes ghl-sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
/* The shimmer is decoration, not information - the skeleton still reads as a
   form without it. */
@media (prefers-reduced-motion:reduce){.ghl-sk{animation:none}}
/* Request-a-Quote page: copy + trust points beside the form (fills the hero). */
.quote-layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(1.6rem,3.5vw,3.4rem);align-items:start}
.quote-copy{position:sticky;top:96px}
.quote-copy h1{margin:.4rem 0 .6rem}
.quote-points{list-style:none;margin:1.4rem 0 0;padding:0;display:flex;flex-direction:column;gap:.7rem}
.quote-points li{position:relative;padding-left:1.9rem;color:var(--c-text)}
.quote-points li::before{content:"";position:absolute;left:0;top:.18em;width:1.2rem;height:1.2rem;background:var(--grad-brand);
  -webkit-mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='black' d='M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4z'/></svg>") center/contain no-repeat;
  mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='black' d='M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4z'/></svg>") center/contain no-repeat}
.quote-copy__call{margin-top:1.4rem;color:var(--c-muted);display:flex;align-items:center;flex-wrap:wrap;gap:.6rem 1rem}
/* "Prefer to talk?" call button - the site's own primary button skin */
.quote-copy__call .quote-call-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:48px}
.quote-copy__call .quote-call-btn .ico{color:currentColor}
@media (max-width:820px){.quote-layout{grid-template-columns:minmax(0,1fr)}.quote-copy{position:static}}

/* ============ SECTION-LAYOUT VARIANTS (per-site structural variety) ============ */
/* Each major band ships several genuinely different skeletons; the variation
   engine picks one per site so the same section looks structurally different
   across sites - not just recolored. */

/* services - LIST: sticky intro column + vertical service rows */
.svc-listing{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(1.6rem,3vw,3rem);align-items:start}
.svc-list-intro{position:sticky;top:96px}
.svc-rows{display:flex;flex-direction:column;gap:.6rem}
.svc-rows--full{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem}
@media (max-width:760px){.svc-rows--full{grid-template-columns:minmax(0,1fr)}}
.svc-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem;padding:1.05rem 1.2rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);text-decoration:none;color:inherit;transition:border-color .15s,transform .15s,box-shadow .15s}
.svc-row:hover{border-color:var(--c-primary);transform:translateX(4px);box-shadow:var(--shadow-md)}
.svc-row__n{font-family:var(--font-heading);font-weight:800;color:var(--c-link);font-size:1.25rem}
.svc-row__ic{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c-primary) 12%,transparent)}
.svc-row__ic .ico{color:var(--c-primary)}
.svc-row__c{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.svc-row__c b{font-family:var(--font-heading);font-size:var(--fs-md)}
.svc-row__c span{color:var(--c-muted);font-size:var(--fs-sm)}
.svc-row__go{color:var(--c-primary);opacity:.55;transition:opacity .15s,transform .15s}
.svc-row__go .ico{color:var(--c-primary)}
.svc-row:hover .svc-row__go{opacity:1;transform:translateX(3px)}

/* services - ROWS: full-width alternating zig-zag with imagery */
.svc-zzwrap{display:flex;flex-direction:column;gap:clamp(1.6rem,3.4vw,3rem)}
.svc-zz{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.4rem,3vw,2.8rem);align-items:center}
.svc-zz--rev .svc-zz__media{order:2}
.svc-zz__media{border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-md);aspect-ratio:16/10}
.svc-zz__media img,.svc-zz__media svg{width:100%;height:100%;object-fit:cover;display:block}
.svc-zz__ic{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);margin-bottom:.8rem}
.svc-zz__ic .ico{color:var(--c-primary)}
.svc-zz__body h3{margin:0 0 .4rem;font-size:var(--fs-h3)}
.svc-zz__body p{margin:0 0 1rem;color:var(--c-muted)}

/* services - BENTO: first cell large, rest small */
.svc-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;grid-auto-flow:dense}
/* Wide feature cell (no 2-row span - that left large vertical gaps). */
.bento-cell--lg{grid-column:span 2;display:flex;flex-direction:column;justify-content:center;gap:.25rem}
.bento-cell--lg .svc__icon{width:58px;height:58px}
.bento-cell--lg h3{font-size:var(--fs-h2)}
.bento-cell--lg p{max-width:54ch;font-size:var(--fs-md)}

/* services - HCARDS: horizontal cards, icon pinned in its own column */
.svc-hcards{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--grid-gap)}
.svc-hcard{display:flex;gap:1.1rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.5rem;box-shadow:var(--shadow-sm);transition:transform .16s,box-shadow .18s}
.svc-hcard:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}
.svc-hcard__ic{flex:0 0 auto;width:50px;height:50px;border-radius:13px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center}
.svc-hcard__body h3{font-size:var(--fs-md);margin-bottom:.3em}
.svc-hcard__body p{color:var(--c-muted);margin:0;font-size:var(--fs-sm)}

/* services - ACCORDION: one expandable row per service */
.svc-accordion{max-width:64rem;margin-inline:auto}
.svc-acc{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.1rem 1.4rem;margin-bottom:.8rem;box-shadow:var(--shadow-sm);transition:border-color .15s}
.svc-acc[open]{border-color:color-mix(in srgb,var(--c-primary) 35%,var(--c-border))}
.svc-acc summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:.8rem;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md)}
.svc-acc summary::-webkit-details-marker{display:none}
.svc-acc__ic{flex:0 0 auto;color:var(--c-primary)}
.svc-acc__t{flex:1}
.svc-acc__body{padding:.9rem 0 0 2.3rem;color:var(--c-muted)}
.svc-acc__body p{margin:0 0 .6rem}

/* services - DIVIDED-BAND: unboxed full-width divided rows */
.svc-divided{max-width:74rem;margin-inline:auto}
.svc-div-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.1rem;padding:1.2rem 0;border-top:1px solid var(--c-border);text-decoration:none;color:inherit;transition:padding-left .15s}
.svc-divided .svc-div-row:last-child{border-bottom:1px solid var(--c-border)}
.svc-div-row:hover{padding-left:.5rem}
.svc-div-row__ic{color:var(--c-primary)}
.svc-div-row__c{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.svc-div-row__c b{font-family:var(--font-heading);font-size:var(--fs-md)}
.svc-div-row__c span{color:var(--c-muted);font-size:var(--fs-sm)}
.svc-div-row__go{color:var(--c-primary);opacity:.6}

/* services - NUMBERED-COMPACT: dense multi-column numbered text list */
.svc-numlist{list-style:none;margin:0;padding:0;columns:2;column-gap:2.4rem}
.svc-numlist li{break-inside:avoid;margin-bottom:.9rem}
.svc-numlist a{display:flex;align-items:baseline;gap:.8rem;color:var(--c-text);text-decoration:none;font-weight:700}
.svc-numlist a:hover{color:var(--c-primary)}
.svc-numlist__n{font-family:var(--font-heading);font-weight:800;color:color-mix(in srgb,var(--c-primary) 55%,transparent);font-size:var(--fs-sm)}
.svc-numlist__t{font-size:var(--fs-md)}

/* why - STAT-INLINE: 4-up flow with round icon medallions */
.why-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem}
.wf-cell{text-align:center;padding:1.5rem 1.1rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card)}
.wf-ic{display:inline-grid;place-items:center;width:58px;height:58px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);margin-bottom:.85rem}
.wf-ic .ico{color:var(--c-primary)}
.wf-cell h3{margin:0 0 .35rem;font-size:var(--fs-md)}
.wf-cell p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* why - BORDERED-LIST: stacked full-width bordered boxes */
.why-blist{display:grid;gap:1rem;max-width:74rem;margin-inline:auto}
.why-blist__row{display:flex;gap:1.2rem;align-items:flex-start;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.4rem 1.6rem;box-shadow:var(--shadow-sm)}
.why-blist__ic{flex:0 0 auto;color:var(--c-primary)}
.why-blist__c h3{margin:0 0 .3em;font-size:var(--fs-md)}
.why-blist__c p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* why - SPOTLIGHT: RETIRED 2026-08-30, CSS deleted. See the note in why() in
   components/index.js. Do not confuse with .stats-spotlight, which is a
   different axis and still live. */

/* why - ICON-BAND: flowing wrapped band of pill items */
/* Items used to be plain flex children (flex:0 1 auto), so every pill sized
   itself to its own text. Measured on Pasadena inside a 1040px container:
   508 / 528 / 587 / 584px - unequal widths with a ragged right edge, and
   because no two ever fitted side by side they stacked one per row, each
   leaving 453-532px of empty space beside it. Reported as "too much blank
   spaces".
   feats in why() is a hard-coded FOUR, so an explicit 2-column grid gives a
   balanced 2x2: equal widths, full row, and no orphan. Do not swap this for
   auto-fit - at this container width that resolves to 3 columns and puts the
   fourth item alone on a row of its own, which is the same defect again. */
.why-iband{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.9rem}
@media (max-width:720px){.why-iband{grid-template-columns:minmax(0,1fr)}}
.why-iband__item{display:flex;gap:.7rem;align-items:center;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.7rem 1.3rem .7rem .8rem;box-shadow:var(--shadow-sm)}
.why-iband__ic{flex:0 0 auto;width:32px;height:32px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center}
.why-iband__item b{display:block;font-size:var(--fs-sm)}
.why-iband__item span{color:var(--c-muted);font-size:var(--fs-xs)}

/* why - ACCORDION */

/* why - CHECKLIST: plain 2-col checklist, no cards */
.why-checklist{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:1.2rem 2rem}
.why-checklist li{display:flex;gap:.8rem;align-items:flex-start}
.why-check__ic{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:color-mix(in srgb,var(--c-accent) 18%,transparent);color:var(--c-accent);display:grid;place-items:center}
.why-checklist b{display:block;font-size:var(--fs-sm)}
.why-checklist span{color:var(--c-muted);font-size:var(--fs-xs)}

/* process - HORIZONTAL: connected numbered step flow */
.hflow{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
.hstep{position:relative;padding:1.5rem 1.25rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card)}
.hstep__n{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--grad-band);color:var(--c-on-primary);font-family:var(--font-heading);font-weight:800;flex:none;margin-bottom:.9rem}
.hstep h3{margin:0 0 .3rem;font-size:var(--fs-md)}
.hstep p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}
.hstep:not(:last-child)::after{content:"";position:absolute;top:2.25rem;right:-.62rem;width:.62rem;height:2px;background:var(--c-border);z-index:1}

/* process - NUMBERED-LIST: plain vertical numbered list */
/* TWO columns on desktop, not one 60rem column.
   As a single column this skin left ~25% of every row empty and stacked four
   one-line steps into a 724px-tall section: measured on Loveland at 1440px,
   each 960px row carried only 682-724px of content, so 236-278px of every row
   was void and the whole block sat left-of-centre inside a much wider section.
   User-reported as too much blank space, 2026-08-27.
   Two columns consume that width instead of leaving it, and halve the height.
   It stays a NUMBERED LIST - small numeral, square photo, text - so it does not
   collapse into oversized-index, which is a 2-col grid of huge display numerals
   with no photo. Collapses back to one column under 900px. */
.proc-numlist{list-style:none;margin-block:0;margin-inline:auto;padding:0;
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.6rem 2.6rem}
.proc-numlist li{display:flex;gap:1.2rem;align-items:flex-start}
/* The text block is the last child (number, photo, then <div><h3><p>). Without
   flex:1 it sizes to its own content, so a short one-line step left a ragged
   gap on the right of the row - 155px still remained in single-column mode
   after the two-column fix above. min-width:0 lets it shrink rather than
   overflow when the text is long. */
.proc-numlist li>div{flex:1 1 auto;min-width:0}
.proc-numlist__n{flex:0 0 auto;font-family:var(--font-heading);font-weight:800;font-size:var(--fs-xl);color:color-mix(in srgb,var(--c-primary) 55%,transparent)}
.proc-numlist h3{margin:0 0 .2em;font-size:var(--fs-md)}
.proc-numlist p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - STACKED-PANEL: full-width alternating panels, number watermark */
.proc-stacked{display:grid;gap:.9rem}
.proc-stack__row{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:1.6rem;padding:1.6rem clamp(1.4rem,3vw,2.4rem);border-radius:var(--radius-lg);background:var(--c-surface-alt);overflow:hidden}
/* The copy block wraps to its OWN line as soon as it cannot hold ~260px.
   The row is number + fixed-width media + copy, and the first two never shrink
   (flex:none on the number, flex:0 0 on the media), so on a phone the copy was
   handed whatever was left: measured on Rochester Hills at 375px, a 278px row
   gave 50px to the number, 110px to the media, 51px to gaps and left the copy
   67px - the paragraph wrapped to TWELVE lines, one word each, and the row's
   own overflow:hidden clipped the next step's heading.
   flex-basis rather than a breakpoint because the trigger is the row's own
   width, which varies with container padding and the media's clamp - a fixed
   max-width query would be right at one viewport and wrong at the next.
   min-width:0 lets it shrink instead of overflowing once it does have the row
   to itself. */
.proc-stack__row>div:last-child{flex:1 1 260px;min-width:0}
.proc-stack__row:nth-child(even){background:var(--c-surface);border:1px solid var(--c-border)}
.proc-stack__n{font-family:var(--font-heading);font-weight:800;font-size:clamp(2.6rem,6vw,4rem);line-height:1;color:color-mix(in srgb,var(--c-primary) 22%,transparent);flex:none}
.proc-stack__row h3{margin:0 0 .25em;font-size:var(--fs-md)}
.proc-stack__row p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* (process CHAT-BUBBLES removed 2026-08-25 - see SECTION_POOLS.process.) */

/* process - DOTS-TRACK: horizontal dot-and-line track */
.proc-track{position:relative}
.proc-track__line{position:absolute;left:0;right:0;top:14px;height:2px;background:var(--c-border)}
.proc-track__items{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem}
.proc-track__dot{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--grad-band);color:var(--c-on-primary);font-family:var(--font-heading);font-weight:800;font-size:var(--fs-xs);margin-bottom:.9rem;position:relative}
.proc-track__item h3{margin:0 0 .25em;font-size:var(--fs-md)}
.proc-track__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* (process ACCORDION removed 2026-08-25 - see SECTION_POOLS.process.) */

/* stats - STRIP: thin inline divided row */
.stats-strip{display:flex;flex-wrap:wrap;gap:1rem;padding:1.5rem clamp(1.2rem,3vw,2.4rem);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg)}
.ss-cell{display:flex;flex-direction:column;gap:.35rem;flex:1 1 160px;padding:0 1.1rem;border-left:3px solid color-mix(in srgb,var(--c-primary) 45%,transparent);transition:border-color .18s ease}
.ss-cell:first-child{border-left:0;padding-left:0}
.ss-cell:hover{border-left-color:var(--c-primary)}
.ss-cell .stat-ic{width:1.9rem;height:1.9rem;margin-bottom:0}
.ss-n{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,3vw,2rem);background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.ss-l{color:var(--c-muted);font-size:var(--fs-sm)}

/* trustbar - STACKED: centered icon-over-text */
.trustbar--stacked .container{display:flex;flex-wrap:wrap;justify-content:center;align-items:stretch;gap:1rem}
.trustbar--stacked .trust-item{flex:1 1 150px;max-width:210px;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;gap:.75rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.3rem 1rem}
/* Solid gradient icon medallion - the icon reads clearly (on-primary) at a
   consistent 44px, instead of a faint tint circle. */
.trustbar--stacked .trust-item .ico{width:44px;height:44px;padding:11px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);box-sizing:border-box;flex:none}
.trustbar--stacked .trust-item b{display:block}

/* areas - COMPACT: big count headline + chip cloud */
.cov-compact{display:flex;flex-direction:column;gap:1.5rem}
.cov-compact__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.5rem}
.cov-compact__head .cov-panel__n{font-family:var(--font-heading);font-weight:800;font-size:clamp(2.4rem,6vw,3.6rem);line-height:1;background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.cov-compact__head p{margin:0;flex:1 1 240px;color:var(--c-muted)}
.cov-compact{gap:1.2rem}
.cov-cloud-group h4{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;color:var(--c-muted);margin:0 0 .7rem}
.cov-cloud-group+.cov-cloud-group{margin-top:1.2rem}
.cov-cloud{display:flex;flex-wrap:wrap;gap:.55rem;background:var(--c-surface-alt);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:clamp(1.1rem,2.4vw,1.6rem)}
.cov-cloud .area-chip .ico{color:color-mix(in srgb,var(--c-primary) 78%,var(--c-text))}

/* areas - CARDS: same coverage list, shaped as a grid of individual cards
   (pin + name + trailing arrow) instead of an inline pill cloud. */
.cov-cards{display:flex;flex-direction:column;gap:1.5rem}
.cov-cardgrid-group h4{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;color:var(--c-muted);margin:0 0 .8rem}
.cov-cardgrid-group+.cov-cardgrid-group{margin-top:1.4rem}
.cov-cardgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.8rem}
.area-card{display:flex;align-items:center;gap:.6rem;background:var(--c-surface);border:1px solid var(--c-border);
  border-radius:var(--radius-lg);padding:.9rem 1.05rem;font-weight:700;color:var(--c-text);box-shadow:var(--shadow-sm);
  transition:transform .14s ease,border-color .14s ease,color .14s ease}
.area-card .ico:first-child{color:var(--c-primary);flex:none}
.area-card span{flex:1;min-width:0}
.area-card__arrow{color:var(--c-muted);flex:none;transition:transform .14s ease}
.area-card:hover{transform:translateY(-2px);border-color:var(--c-primary);color:var(--c-primary)}
.area-card:hover .area-card__arrow{transform:translateX(2px);color:var(--c-primary)}

/* hero - stat strip fills the space under text-only heroes */
/* The hero's own dark overlay (::before, checked and confirmed covering the
   full section) still leaves the strip sitting directly on raw photo
   content with nothing marking it as its own UI element - on a bright
   patch of photo it read as text floating with no backing at all. A real
   panel backdrop, on top of that overlay, fixes it for BOTH variants below
   (not just a hairline top border like before). Contrast math: the shared
   overlay already darkens a worst-case near-white photo pixel to ~107;
   this panel's extra 30% black takes that to ~75 - comfortably safe, this
   is a visual-polish layer on top of an already-passing contrast baseline,
   not the thing carrying the contrast requirement. */
.hero__stats{display:flex;flex-wrap:wrap;gap:1rem 2.6rem;margin-top:2rem;
  background:rgba(0,0,0,.3);border:1px solid color-mix(in srgb,currentColor 14%,transparent);
  border-radius:var(--radius-lg);padding:1.3rem 1.6rem}
.hstat{display:flex;flex-direction:column;gap:.1rem}
.hstat b{font-family:var(--font-heading);font-weight:800;font-size:clamp(1.4rem,3vw,1.9rem)}
.hstat span{font-size:var(--fs-sm);opacity:.78}
/* Each stat previously had nothing but a bold number + label - bare enough
   to read as unfinished even inside the boxed cards/divided treatments. A
   real icon per stat (see hero() in components/index.js) fixes that. */
.hstat__ico{display:block;margin-bottom:.5rem;opacity:.85}
/* CARDS: each stat gets its own outlined tile within the shared dark panel
   above (no separate per-item fill - the panel already provides the dark
   backdrop, a second overlapping tint here would just make the tiles
   harder to tell apart from the panel behind them). */
.hero__stats--cards{gap:.9rem}
.hero__stats--cards .hstat{flex:1 1 130px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);
  border-radius:var(--radius-lg);padding:1rem 1.2rem}
/* Icon sits in its own tinted circle badge (same pattern used on the
   trustbar and brand chips elsewhere) rather than floating loose. */
.hero__stats--cards .hstat__ico{width:2.1rem;height:2.1rem;padding:.5rem;box-sizing:border-box;
  border-radius:50%;background:color-mix(in srgb,currentColor 14%,transparent);opacity:1}
/* DIVIDED: no cards - a single editorial line of numbers separated by hard
   vertical rules, bigger type, reads like a stat ticker rather than a list -
   still sitting on the same shared dark panel now, instead of nothing. */
.hero__stats--divided{flex-wrap:nowrap;overflow-x:auto}
.hero__stats--divided .hstat{padding-inline:1.5rem;border-left:1px solid color-mix(in srgb,currentColor 24%,transparent);flex:none}
.hero__stats--divided .hstat:first-child{padding-left:0;border-left:0}
.hero__stats--divided .hstat b{font-size:clamp(1.6rem,3.6vw,2.3rem)}
@media (max-width:900px){.hero__stats--divided{flex-wrap:wrap;overflow-x:visible;row-gap:1rem}
  .hero__stats--divided .hstat{border-left:0;padding-left:0;padding-right:1.2rem}}

/* new-layout responsive collapses */
@media (max-width:900px){
  .svc-listing{grid-template-columns:minmax(0,1fr)}
  .svc-list-intro{position:static}
  .svc-zz,.svc-zz--rev .svc-zz__media{grid-template-columns:minmax(0,1fr)}
  .svc-zz--rev .svc-zz__media{order:0}
  .svc-bento{grid-template-columns:repeat(2,1fr)}
  .bento-cell--lg{grid-column:span 2;grid-row:auto}
  .why-flow{grid-template-columns:repeat(2,1fr)}
  .hflow{grid-template-columns:repeat(2,1fr)}
  .hstep:not(:last-child)::after{display:none}
  .svc-hcards{grid-template-columns:minmax(0,1fr)}
  .svc-numlist{columns:1}
  .why-checklist{grid-template-columns:minmax(0,1fr)}
  .proc-track__items{grid-template-columns:repeat(2,1fr);gap:1.6rem 1.2rem}
  .proc-track__line{display:none}
  .stc-row{grid-template-columns:repeat(2,1fr)}
  .stc-cell:nth-child(2){border-left:1px solid var(--c-border)}
  .stc-cell:nth-child(3){border-left:0}
}
@media (max-width:560px){
  .svc-bento,.why-flow,.hflow{grid-template-columns:minmax(0,1fr)}
  .bento-cell--lg{grid-column:auto}
  .svc-row{grid-template-columns:auto 1fr auto}
  .proc-track__items{grid-template-columns:minmax(0,1fr)}
  .stc-row{grid-template-columns:minmax(0,1fr)}
  .stc-cell{border-left:0!important;border-top:1px solid var(--c-border)}
  .stc-row--labels .stc-cell:first-child,.stc-row--values .stc-cell:first-child{border-top:0}
  .sr-circle{width:124px;height:124px;gap:.25rem}
  .sr-circle .stat-ic{width:2.35rem;height:2.35rem}
  .sr-n{font-size:1.2rem}
}

/* ---- responsive ---- */
@media (max-width:1000px){
  .product-grid,.post-grid{grid-template-columns:repeat(2,1fr)}
  .finance{grid-template-columns:minmax(0,1fr)}
  .finance__cta{justify-content:flex-start}
  .cols-4,.gallery--wide-strip{grid-template-columns:repeat(2,1fr)}
  .cols-3,.svc-grid,.gallery--grid-3,.gallery--masonry,.gallery--asymmetric,.gallery--polaroid{grid-template-columns:repeat(2,1fr)}
  .quote{grid-template-columns:minmax(0,1fr)}
  /* Was "grid-template-columns:1fr 1fr" here - a complete no-op, since
     .footer-grid is display:flex (see the base rule's own comment for why),
     never display:grid. That silently meant the footer NEVER actually
     collapsed to 2 columns on tablets - real flex-basis override instead. */
  .footer-grid > div{flex-basis:calc(50% - 1.5rem)}
}
@media (max-width:600px){
  .footer-grid > div{flex-basis:100%}
}
/* Collapse the nav to a hamburger for tablets + phones (before the desktop nav
   would overflow). Keeps the megamenu inline and moves Call into the menu. */
@media (max-width:920px){
  .nav__links{position:absolute;inset:auto 0 auto 0;top:100%;flex-direction:column;align-items:stretch;background:var(--c-surface);border-bottom:1px solid var(--c-border);padding:1rem var(--pad-x);gap:.3rem;display:none;box-shadow:var(--shadow-xl);max-height:82vh;overflow:auto}
  .nav__links.open{display:flex}
  .nav__links a{padding:.7rem .85rem}
  .nav-toggle{display:inline-flex}
  .nav{gap:.55rem}
  .brand{font-size:1.05rem;line-height:1.15}
  .brand__mark{width:36px;height:36px;border-radius:9px}
  /* Must be restated: the rule above is 1 class and would otherwise re-impose
     a 36px SQUARE on the logo, undoing the auto-width above. */
  .brand__mark--logo{width:auto;height:38px;max-width:140px;border-radius:0}
  /* Hamburger sits at the far right: the (now call-in-menu) CTA area is hidden
     so only brand + toggle remain, pushed apart by space-between. */
  .nav__cta{display:none}
  .nav-toggle{margin-left:auto}
  /* Megamenus become COLLAPSIBLE accordions - hidden until their label is tapped
     (JS toggles .open on the .has-menu li). */
  .nav__links .has-menu>a{display:flex;justify-content:space-between;align-items:center;width:100%}
  .nav__links .has-menu>a .chev{transform:rotate(90deg);transition:transform .18s}
  .nav__links .has-menu.open>a .chev{transform:rotate(-90deg)}
  .mega{position:static;min-width:0;box-shadow:none;border:0;padding:.15rem 0 .5rem .6rem;transform:none;background:transparent;opacity:1;visibility:visible;display:none}
  .nav__links .has-menu.open>.mega{display:block}
  .mega--wide{min-width:0}
  .mega__grid,.mega__grid--3{grid-template-columns:minmax(0,1fr)}
  .mega__all{padding-left:.7rem}
  /* Call button moves INTO the hamburger menu, with the number. */
  .nav__mcall{display:block;margin-top:.5rem;padding-top:.6rem;border-top:1px solid var(--c-border)}
  .nav__mcall a{display:flex;align-items:center;justify-content:center;gap:.5rem;background:var(--c-emergency);color:var(--c-on-emergency);
    font-family:var(--font-heading);font-weight:800;padding:.85rem 1rem;border-radius:var(--radius);text-decoration:none}
  .nav__mcall .ico{color:currentColor}
  /* .nav__links a:hover (generic nav-link hover: primary-tinted, near-white)
     otherwise wins on hover - same specificity as a plain .nav__mcall a:hover
     would have, so it's a toss-up by source order; the extra .nav__links
     ancestor qualifier here guarantees this wins instead, keeping the Call
     button solid-red (darkened for feedback) instead of fading to a
     primary-tinted background that's nearly invisible against the white
     mobile-menu panel behind it. */
  .nav__links .nav__mcall a:hover{background:color-mix(in srgb,var(--c-emergency) 85%,#000 15%);color:var(--c-on-emergency)}
  /* minmax(0,1fr), not 1fr: a bare 1fr track is at least its content's
     min-content width, so one long FAQ row made Fort Mill's /faq/ 384px wide
     at 375px and clipped the right edge (2026-10-12 responsive sweep). */
  .hero__grid,.hero--color-block-split .hero__grid,.quote,.coverage,.process-split,.faq-split,.why-split,.cta-split{grid-template-columns:minmax(0,1fr)!important}
  /* Stacked, the map sits ABOVE the list rather than beside it, so sticking it
     would pin it over the content it is meant to accompany. */
  .coverage__map{position:static}
  .process-intro,.faq-intro,.why-intro{position:static}
  /* Stacked: the media no longer sits beside the copy, so there is no column
     height to track. Bound the CONTAINER instead of the image - the image is
     height:100% now, so capping the image alone would leave the container
     unsized and collapse it. */
  .hero--color-block-split .hero__media{min-height:0;height:clamp(220px,42vw,320px)}
  :is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__grid{min-height:0;height:auto}
  /* A long uppercase heading word ("SPRINGFIELD") set the column's min-content to 332px
     on a 320px phone, pushing the photo 12px past the screen (Springfield MA, 2026-09-17). */
  :is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__grid{grid-template-columns:minmax(0,1fr)!important}
  :is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__copy{min-width:0}
  :is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__copy h1{overflow-wrap:anywhere}
  :is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"],[data-site="springfieldgaragedoorco.com"],[data-site="strongsvillegaragedoorpros.com"]) .hero--color-block-split .hero__media{height:clamp(220px,42vw,320px)}
  .cta-band--split .container,.cta-band--bar .container{text-align:center}
  .cta-split__copy .cta-band__btns,.cta-bar{justify-content:center}
  .cta-bar{flex-direction:column;text-align:center}
  .faq--two-col-grid,.faq-split--split-duotone .faq{columns:1}
  .faq-cards{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:720px){
  .announce{display:none}
  .cov-list{columns:1}
  .brand{font-size:1rem}
  .product-grid,.steps,.post-grid{grid-template-columns:minmax(0,1fr)}
  .cols-2,.cols-3,.cols-4,.svc-grid,.gallery,.gallery--grid-3,.gallery--grid-2,.gallery--masonry,.gallery--asymmetric,.gallery--wide-strip,.gallery--polaroid{grid-template-columns:minmax(0,1fr)}
}

/* ============ GENERATED SKIN VARIANTS (Workflow, 2026-08-20) ============ */
/* ~200 new variant keys across 15 axes, one Workflow agent per axis wrote the
   CSS for its axis (all agents given the same contrast-safety + responsive
   constraints - see CLAUDE.md). Applied here verbatim after key-coverage +
   brace-balance verification. Do not hand-edit without re-verifying both. */

/* ---- services (structural) (12 keys) ---- */
/* ============================================================
   services (structural) — 12 new "generic skin" variants
   Markup: .svc-generic.svc-generic--KEY > a.svc-g > span.svc-g__ic + span.svc-g__body > b + span
   ============================================================ */

/* ---------- framed-outline: no fill, just an airy border frame ---------- */
.svc-generic--framed-outline{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--grid-gap)}
.svc-generic--framed-outline .svc-g{display:flex;flex-direction:column;align-items:flex-start;gap:1rem;background:transparent;border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:2rem 1.8rem;color:inherit;text-decoration:none;transition:border-color .18s ease,transform .18s ease}
.svc-generic--framed-outline .svc-g:hover{border-color:var(--c-primary);transform:translateY(-3px)}
.svc-generic--framed-outline .svc-g__ic{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent);color:var(--c-primary);flex-shrink:0;transition:border-color .18s ease}
.svc-generic--framed-outline .svc-g:hover .svc-g__ic{border-color:var(--c-primary)}
.svc-generic--framed-outline .svc-g__body{display:flex;flex-direction:column;gap:.4rem}
.svc-generic--framed-outline .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--framed-outline .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.55}

/* ---------- shadow-stack: layered offset shadows suggest stacked cards ---------- */
.svc-generic--shadow-stack{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--grid-gap)}
.svc-generic--shadow-stack .svc-g{display:flex;flex-direction:column;gap:.9rem;background:var(--c-surface);border-radius:var(--radius-lg);padding:1.6rem;color:inherit;text-decoration:none;box-shadow:5px 5px 0 0 var(--c-surface-alt),10px 10px 0 0 var(--c-border),var(--shadow-md);transition:transform .2s ease,box-shadow .2s ease}
.svc-generic--shadow-stack .svc-g:hover{transform:translate(-3px,-3px);box-shadow:8px 8px 0 0 var(--c-surface-alt),14px 14px 0 0 var(--c-border),var(--shadow-xl)}
.svc-generic--shadow-stack .svc-g__ic{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--shadow-stack .svc-g__body{display:flex;flex-direction:column;gap:.35rem}
.svc-generic--shadow-stack .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--shadow-stack .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.5}

/* ---------- alternating-tint: nth-child striped rhythm, no borders ---------- */
.svc-generic--alternating-tint{display:flex;flex-direction:column}
.svc-generic--alternating-tint .svc-g{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:1.1rem;padding:1.15rem 1.3rem;color:inherit;text-decoration:none;transition:padding-left .15s ease}
.svc-generic--alternating-tint .svc-g:nth-child(even){background:var(--c-surface-alt)}
.svc-generic--alternating-tint .svc-g:nth-child(odd){background:transparent}
.svc-generic--alternating-tint .svc-g:hover{padding-left:1.6rem}
.svc-generic--alternating-tint .svc-g__ic{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:11px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--alternating-tint .svc-g__body{display:flex;flex-direction:column;gap:.25rem;min-width:0}
.svc-generic--alternating-tint .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--alternating-tint .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted)}

/* ---------- pill-tags: rounded chips in a flex-wrap row ---------- */
.svc-generic--pill-tags{display:flex;flex-wrap:wrap;gap:.9rem}
.svc-generic--pill-tags .svc-g{display:inline-flex;align-items:center;gap:.75rem;flex:1 1 260px;max-width:100%;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);padding:.6rem 1.4rem .6rem .6rem;color:inherit;text-decoration:none;transition:border-color .15s ease,box-shadow .15s ease}
.svc-generic--pill-tags .svc-g:hover{border-color:var(--c-primary);box-shadow:var(--shadow-sm)}
.svc-generic--pill-tags .svc-g__ic{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--pill-tags .svc-g__body{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.svc-generic--pill-tags .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-sm);color:var(--c-text)}
.svc-generic--pill-tags .svc-g__body span{font-size:var(--fs-xs);color:var(--c-muted)}

/* ---------- circle-badge-grid: prominent circular icon badge, centered ---------- */
.svc-generic--circle-badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--grid-gap)}
.svc-generic--circle-badge-grid .svc-g{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.9rem;padding:1.4rem 1.1rem;color:inherit;text-decoration:none}
.svc-generic--circle-badge-grid .svc-g__ic{display:inline-grid;place-items:center;width:68px;height:68px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0;transition:transform .18s ease}
.svc-generic--circle-badge-grid .svc-g:hover .svc-g__ic{transform:scale(1.08)}
.svc-generic--circle-badge-grid .svc-g__body{display:flex;flex-direction:column;gap:.4rem}
.svc-generic--circle-badge-grid .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--circle-badge-grid .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.5}

/* ---------- ledger-rows: two-column ledger split with a vertical rule, hairline separators ---------- */
.svc-generic--ledger-rows{display:flex;flex-direction:column}
.svc-generic--ledger-rows .svc-g{display:grid;grid-template-columns:auto 1fr;align-items:baseline;gap:1rem;padding:1.05rem 0;border-top:1px solid var(--c-border);color:inherit;text-decoration:none}
.svc-generic--ledger-rows .svc-g:last-child{border-bottom:1px solid var(--c-border)}
.svc-generic--ledger-rows .svc-g__ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;color:var(--c-primary);flex-shrink:0}
.svc-generic--ledger-rows .svc-g__body{display:grid;grid-template-columns:1fr 1fr;align-items:baseline;gap:.5rem 1.4rem}
.svc-generic--ledger-rows .svc-g__body b{grid-column:1;font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--ledger-rows .svc-g__body span{grid-column:2;font-size:var(--fs-sm);color:var(--c-muted);text-align:right;border-left:1px solid var(--c-border);padding-left:1rem}

/* ---------- zigzag-offset: text cards alternate left/right with vertical stagger ---------- */
.svc-generic--zigzag-offset{display:flex;flex-direction:column;gap:1.3rem}
.svc-generic--zigzag-offset .svc-g{display:flex;align-items:flex-start;gap:1rem;width:min(78%,560px);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.3rem 1.5rem;box-shadow:var(--shadow-sm);color:inherit;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
.svc-generic--zigzag-offset .svc-g:hover{box-shadow:var(--shadow-md)}
.svc-generic--zigzag-offset .svc-g:nth-child(odd){align-self:flex-start}
.svc-generic--zigzag-offset .svc-g:nth-child(even){align-self:flex-end;flex-direction:row-reverse;margin-top:1.6rem}
.svc-generic--zigzag-offset .svc-g:nth-child(even) .svc-g__body{text-align:right}
.svc-generic--zigzag-offset .svc-g__ic{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--zigzag-offset .svc-g__body{display:flex;flex-direction:column;gap:.35rem}
.svc-generic--zigzag-offset .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--zigzag-offset .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.5}

/* ---------- quiet-editorial: text-forward, zero borders/boxes/shadows, generous whitespace ---------- */
.svc-generic--quiet-editorial{display:flex;flex-direction:column;gap:2.2rem}
.svc-generic--quiet-editorial .svc-g{display:flex;align-items:flex-start;gap:1.2rem;color:inherit;text-decoration:none}
.svc-generic--quiet-editorial .svc-g__ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;color:var(--c-primary);flex-shrink:0;margin-top:.2rem}
.svc-generic--quiet-editorial .svc-g__body{display:flex;flex-direction:column;gap:.5rem;max-width:60ch}
.svc-generic--quiet-editorial .svc-g__body b{font-family:var(--font-heading);font-weight:700;font-size:var(--fs-lg);color:var(--c-text)}
.svc-generic--quiet-editorial .svc-g__body span{font-size:var(--fs-md);color:var(--c-muted);line-height:1.7}

/* ---------- boxed-diagonal: bordered box, one corner cut via clip-path with a colored accent ---------- */
.svc-generic--boxed-diagonal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:var(--grid-gap)}
.svc-generic--boxed-diagonal .svc-g{position:relative;display:flex;flex-direction:column;gap:.9rem;background:var(--c-surface);border:1px solid var(--c-border);padding:1.6rem;color:inherit;text-decoration:none;clip-path:polygon(0 0,calc(100% - 26px) 0,100% 26px,100% 100%,0 100%);transition:border-color .18s ease}
.svc-generic--boxed-diagonal .svc-g::after{content:"";position:absolute;top:0;right:0;width:26px;height:26px;background:var(--c-primary);clip-path:polygon(0 0,100% 0,100% 100%)}
.svc-generic--boxed-diagonal .svc-g:hover{border-color:var(--c-primary)}
.svc-generic--boxed-diagonal .svc-g__ic{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--boxed-diagonal .svc-g__body{display:flex;flex-direction:column;gap:.35rem}
.svc-generic--boxed-diagonal .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--boxed-diagonal .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.5}

/* ---------- wide-spaced-grid: default grid shape, noticeably larger gaps, minimal decoration ---------- */
.svc-generic--wide-spaced-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:calc(var(--grid-gap) * 1.8)}
.svc-generic--wide-spaced-grid .svc-g{display:flex;flex-direction:column;gap:1rem;padding:.4rem 0;color:inherit;text-decoration:none}
.svc-generic--wide-spaced-grid .svc-g__ic{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:13px;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--wide-spaced-grid .svc-g__body{display:flex;flex-direction:column;gap:.45rem}
.svc-generic--wide-spaced-grid .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--wide-spaced-grid .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.55}

/* ---------- underline-accent-list: plain list, colored border-bottom accent instead of a box ---------- */
.svc-generic--underline-accent-list{display:flex;flex-direction:column}
.svc-generic--underline-accent-list .svc-g{display:flex;align-items:center;gap:1rem;padding:1.05rem .1rem;border-bottom:2px solid var(--c-primary);color:inherit;text-decoration:none;transition:gap .15s ease}
.svc-generic--underline-accent-list .svc-g:hover{gap:1.3rem}
.svc-generic--underline-accent-list .svc-g__ic{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;color:var(--c-primary);flex-shrink:0}
.svc-generic--underline-accent-list .svc-g__body{display:flex;align-items:baseline;flex-wrap:wrap;gap:.5rem 1rem}
.svc-generic--underline-accent-list .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--underline-accent-list .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted)}

/* ---------- glass-panel-grid: frosted translucent panel with a border ---------- */
.svc-generic--glass-panel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--grid-gap)}
.svc-generic--glass-panel-grid .svc-g{display:flex;flex-direction:column;gap:.9rem;background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.6rem;color:inherit;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
.svc-generic--glass-panel-grid .svc-g:hover{transform:translateY(-3px);box-shadow:var(--shadow-md)}
.svc-generic--glass-panel-grid .svc-g__ic{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c-primary) 16%,transparent);color:var(--c-primary);flex-shrink:0}
.svc-generic--glass-panel-grid .svc-g__body{display:flex;flex-direction:column;gap:.35rem}
.svc-generic--glass-panel-grid .svc-g__body b{font-family:var(--font-heading);font-size:var(--fs-md);color:var(--c-text)}
.svc-generic--glass-panel-grid .svc-g__body span{font-size:var(--fs-sm);color:var(--c-muted);line-height:1.5}

/* ---- why (structural) (12 keys) ---- */
/* ============================= why-generic: framed-outline ============================= */
.why-generic--framed-outline{display:grid;grid-template-columns:repeat(2,1fr);gap:1.8rem 2rem}
.why-generic--framed-outline .why-g__item{display:flex;flex-direction:column;align-items:flex-start;gap:1rem;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-card);padding:2rem 1.9rem;background:transparent}
.why-generic--framed-outline .why-g__ic{display:inline-flex;align-items:center;justify-content:center;padding:.6rem;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-card);color:var(--c-primary)}
.why-generic--framed-outline .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.4em;color:var(--c-text)}
.why-generic--framed-outline .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: shadow-stack ================================ */
.why-generic--shadow-stack{display:grid;grid-template-columns:repeat(2,1fr);gap:2.6rem 2.2rem;padding-top:.4rem}
.why-generic--shadow-stack .why-g__item{position:relative;isolation:isolate;display:flex;gap:1rem;align-items:flex-start;background:var(--c-surface);border-radius:var(--radius-card);padding:1.6rem 1.7rem;box-shadow:var(--shadow-md)}
.why-generic--shadow-stack .why-g__item::before,.why-generic--shadow-stack .why-g__item::after{content:'';position:absolute;inset:0;border-radius:var(--radius-card);background:var(--c-surface);border:1px solid var(--c-border)}
.why-generic--shadow-stack .why-g__item::before{transform:translate(7px,7px);z-index:-1;opacity:.75}
.why-generic--shadow-stack .why-g__item::after{transform:translate(14px,14px);z-index:-2;opacity:.45}
.why-generic--shadow-stack .why-g__ic{flex:0 0 auto;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center}
.why-generic--shadow-stack .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.35em;color:var(--c-text)}
.why-generic--shadow-stack .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: circle-badge-grid =========================== */
.why-generic--circle-badge-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2.4rem 2rem}
.why-generic--circle-badge-grid .why-g__item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.9rem}
.why-generic--circle-badge-grid .why-g__ic{width:60px;height:60px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center;box-shadow:var(--shadow-sm)}
.why-generic--circle-badge-grid .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.35em;color:var(--c-text)}
.why-generic--circle-badge-grid .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: boxed-diagonal ============================== */
.why-generic--boxed-diagonal{display:grid;grid-template-columns:repeat(2,1fr);gap:1.8rem}
.why-generic--boxed-diagonal .why-g__item{display:flex;flex-direction:column;gap:.9rem;border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.7rem 1.8rem;background:var(--c-surface);clip-path:polygon(0 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%)}
.why-generic--boxed-diagonal .why-g__ic{color:var(--c-primary)}
.why-generic--boxed-diagonal .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.35em;color:var(--c-text)}
.why-generic--boxed-diagonal .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: wide-spaced-grid ============================ */
.why-generic--wide-spaced-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3.4rem 3.2rem}
.why-generic--wide-spaced-grid .why-g__item{display:flex;gap:1.3rem;align-items:flex-start;padding:.4rem 0}
.why-generic--wide-spaced-grid .why-g__ic{flex:0 0 auto;width:44px;height:44px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center}
.why-generic--wide-spaced-grid .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.4em;color:var(--c-text)}
.why-generic--wide-spaced-grid .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: glass-panel-grid ============================ */
.why-generic--glass-panel-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.6rem}
.why-generic--glass-panel-grid .why-g__item{display:flex;gap:1rem;align-items:flex-start;background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.6rem 1.7rem}
.why-generic--glass-panel-grid .why-g__ic{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center}
.why-generic--glass-panel-grid .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.3em;color:var(--c-text)}
.why-generic--glass-panel-grid .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: split-duotone ================================ */
.why-generic--split-duotone{display:grid;grid-template-columns:1fr 1fr;column-gap:2.6rem;row-gap:1.8rem}
.why-generic--split-duotone .why-g__item{display:flex;gap:1rem;align-items:flex-start}
.why-generic--split-duotone .why-g__item:nth-child(odd){border-right:1px solid var(--c-border);padding-right:2.2rem}
.why-generic--split-duotone .why-g__item:nth-child(even){padding-left:.4rem}
.why-generic--split-duotone .why-g__ic{flex:0 0 auto;color:var(--c-primary)}
.why-generic--split-duotone .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-md);margin-bottom:.3em;color:var(--c-text)}
.why-generic--split-duotone .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* ============================= why-generic: outline-only ================================= */
.why-generic--outline-only{display:flex;flex-wrap:wrap;gap:1rem}
.why-generic--outline-only .why-g__item{display:flex;align-items:center;gap:.9rem;flex:1 1 260px;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-pill);padding:1rem 1.3rem;background:transparent}
.why-generic--outline-only .why-g__ic{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1.5px solid var(--c-primary);color:var(--c-primary);display:grid;place-items:center;background:transparent}
.why-generic--outline-only .why-g__item>div>b{display:block;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-sm);margin-bottom:.2em;color:var(--c-text)}
.why-generic--outline-only .why-g__item>div>span{display:block;color:var(--c-muted);font-size:var(--fs-xs);line-height:1.5}

/* ---- process (structural) (12 keys) ---- */
/* ============================================================
   process (structural) - 12 new generic variants
   Wrapper: .proc-generic.proc-generic--KEY > .proc-g__item (x4)
   Item children (fixed order): .proc-g__n, div>h3+p - number only, no
   icon (a step badge showing both read as cluttered - see 2026-08-20 fix).
   .proc-g__ic selectors below are inert leftovers from before that fix;
   harmless (never match anything) but don't reintroduce the icon markup.
   ============================================================ */

/* process - FRAMED-OUTLINE: single outer frame, cross-divided quadrants, no fill */
.proc-generic--framed-outline{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);overflow:hidden;display:grid;grid-template-columns:repeat(2,1fr)}
.proc-generic--framed-outline .proc-g__item{display:flex;flex-direction:column;gap:.8rem;padding:2.1rem 2rem;border-right:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-bottom:1px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
.proc-generic--framed-outline .proc-g__item:nth-child(2n){border-right:0}
.proc-generic--framed-outline .proc-g__item:nth-child(n+3){border-bottom:0}
.proc-generic--framed-outline .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-sm);color:var(--c-muted);letter-spacing:.04em}
.proc-generic--framed-outline .proc-g__ic{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--framed-outline .proc-g__item h3{margin:.3rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--framed-outline .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - SHADOW-STACK: layered offset box-shadows suggest a stacked deck of cards */
.proc-generic--shadow-stack{display:grid;grid-template-columns:repeat(4,1fr);gap:1.7rem}
.proc-generic--shadow-stack .proc-g__item{position:relative;display:flex;flex-direction:column;gap:.75rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.6rem 1.4rem;box-shadow:6px 6px 0 -1px color-mix(in srgb,var(--c-primary) 9%,var(--c-surface)),12px 12px 0 -2px color-mix(in srgb,var(--c-primary) 6%,var(--c-surface)),var(--shadow-md)}
.proc-generic--shadow-stack .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-lg);color:color-mix(in srgb,var(--c-primary) 78%,transparent)}
.proc-generic--shadow-stack .proc-g__ic{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--shadow-stack .proc-g__item h3{margin:.2rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--shadow-stack .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - ALTERNATING-TINT: one-row strip, nth-child column tint stripes */
.proc-generic--alternating-tint{display:grid;grid-template-columns:repeat(4,1fr)}
.proc-generic--alternating-tint .proc-g__item{display:flex;flex-direction:column;gap:.7rem;padding:1.8rem 1.4rem;background:transparent}
.proc-generic--alternating-tint .proc-g__item:nth-child(even){background:var(--c-surface-alt)}
.proc-generic--alternating-tint .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-sm);color:var(--c-muted)}
.proc-generic--alternating-tint .proc-g__ic{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--alternating-tint .proc-g__item h3{margin:.3rem 0 .25rem;font-size:var(--fs-md)}
.proc-generic--alternating-tint .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - CIRCLE-BADGE-GRID: 2x2 grid, large circular icon badge with a small overlapping number chip */
/* The number IS the circle badge now (was a small overlay ON an icon
   circle - number-only markup means there's no icon to overlay any more,
   so the number takes the badge role directly instead). */
.proc-generic--circle-badge-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem 1.6rem;text-align:center}
.proc-generic--circle-badge-grid .proc-g__item{display:flex;flex-direction:column;align-items:center;gap:.7rem;padding:1rem 1rem 1.2rem}
.proc-generic--circle-badge-grid .proc-g__n{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);font-family:var(--font-heading);font-weight:800;font-size:var(--fs-lg)}
.proc-generic--circle-badge-grid .proc-g__item h3{margin:.3rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--circle-badge-grid .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - QUIET-EDITORIAL: text-forward, zero borders/boxes/shadows, generous whitespace */
/* TWO columns, and no 42rem cap.
   The cap plus margin-inline:auto pinned this list to 672px inside a 1280px
   container - 304px of dead space on EACH side - and stacked four one-line
   steps into a 1203px-tall section, each row 191px because of the portrait
   media. Measured on Livonia, reported as too much blank space 2026-08-30.
   Two columns spend that width instead of leaving it and roughly halve the
   height. The skin keeps its identity - text-forward, no borders, no boxes,
   generous gaps - it just stops being a narrow ribbon in a wide section.
   Same fix as numbered-list, and for the same reason. */
.proc-generic--quiet-editorial{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:2rem 3rem;max-width:none;margin-inline:0}
.proc-generic--quiet-editorial .proc-g__item{display:flex;align-items:flex-start;gap:1.1rem;padding:1rem 1.1rem}
/* Without this the text block sizes to its own content and leaves a ragged
   right edge inside each cell - the same trap numbered-list had. */
.proc-generic--quiet-editorial .proc-g__item>div{flex:1 1 auto;min-width:0}
.proc-generic--quiet-editorial .proc-g__n{flex:0 0 auto;font-family:var(--font-heading);font-weight:700;font-size:var(--fs-sm);color:var(--c-muted);padding-top:.2rem}
.proc-generic--quiet-editorial .proc-g__ic{flex:0 0 auto;color:var(--c-primary);display:grid;place-items:center;padding-top:.1rem}
.proc-generic--quiet-editorial .proc-g__item h3{margin:0 0 .4rem;font-size:var(--fs-lg);font-weight:600}
.proc-generic--quiet-editorial .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm);line-height:1.6}

/* process - BOXED-DIAGONAL: bordered box per item, one corner cut via clip-path with a tint accent peeking through */
.proc-generic--boxed-diagonal{display:grid;grid-template-columns:repeat(2,1fr);gap:1.4rem}
.proc-generic--boxed-diagonal .proc-g__item{position:relative;display:flex;flex-direction:column;gap:.7rem;padding:1.6rem 1.4rem}
.proc-generic--boxed-diagonal .proc-g__item::before{content:"";position:absolute;inset:0;background:var(--c-surface);border:1px solid var(--c-border);clip-path:polygon(0 0,100% 0,100% calc(100% - 26px),calc(100% - 26px) 100%,0 100%);z-index:-2}
.proc-generic--boxed-diagonal .proc-g__item::after{content:"";position:absolute;right:0;bottom:0;width:26px;height:26px;background:color-mix(in srgb,var(--c-primary) 30%,transparent);clip-path:polygon(100% 0,100% 100%,0 100%);z-index:-1}
.proc-generic--boxed-diagonal .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-sm);color:var(--c-muted)}
.proc-generic--boxed-diagonal .proc-g__ic{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--boxed-diagonal .proc-g__item h3{margin:.2rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--boxed-diagonal .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - WIDE-SPACED-GRID: default 4-col grid shape, noticeably larger gaps/padding, minimal decoration */
.proc-generic--wide-spaced-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2.8rem 2.2rem}
/* Padding is here for the HOVER WASH, not for decoration - see the
   "hover needs geometry to fill" note above .proc-g__item:hover. */
.proc-generic--wide-spaced-grid .proc-g__item{display:flex;flex-direction:column;gap:.9rem;padding:1.1rem 1rem 1.3rem}
.proc-generic--wide-spaced-grid .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-sm);color:var(--c-muted)}
.proc-generic--wide-spaced-grid .proc-g__ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--wide-spaced-grid .proc-g__item h3{margin:.2rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--wide-spaced-grid .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - GLASS-PANEL-GRID: frosted translucent panels, 2x2 grid */
.proc-generic--glass-panel-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.4rem}
.proc-generic--glass-panel-grid .proc-g__item{display:flex;flex-direction:column;gap:.8rem;padding:1.6rem 1.4rem;background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg)}
.proc-generic--glass-panel-grid .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-sm);color:var(--c-muted)}
.proc-generic--glass-panel-grid .proc-g__ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--glass-panel-grid .proc-g__item h3{margin:.2rem 0 .3rem;font-size:var(--fs-md)}
.proc-generic--glass-panel-grid .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - OVERSIZED-INDEX: 2x2 grid, a large index numeral dominates the left of each item via CSS grid placement */
.proc-generic--oversized-index{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem 1.8rem}
.proc-generic--oversized-index .proc-g__item{display:grid;grid-template-columns:auto 1fr;column-gap:1rem;align-items:center;padding:1rem 1.1rem}
.proc-generic--oversized-index .proc-g__n{grid-column:1;align-self:start;font-family:var(--font-heading);font-weight:800;font-size:clamp(2.4rem,4.5vw,3.4rem);line-height:1;color:color-mix(in srgb,var(--c-primary) 32%,transparent)}
.proc-generic--oversized-index .proc-g__item>div{grid-column:2}
.proc-generic--oversized-index .proc-g__item h3{margin:0 0 .25rem;font-size:var(--fs-md)}
.proc-generic--oversized-index .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}

/* process - COMPACT-DENSE: tighter spacing, smaller type, denser packing */
.proc-generic--compact-dense{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem}
.proc-generic--compact-dense .proc-g__item{display:flex;flex-direction:column;gap:.3rem;padding:.85rem .8rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card)}
.proc-generic--compact-dense .proc-g__n{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-xs);color:color-mix(in srgb,var(--c-primary) 55%,transparent)}
.proc-generic--compact-dense .proc-g__ic{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}
.proc-generic--compact-dense .proc-g__item h3{margin:.15rem 0 .1rem;font-size:var(--fs-sm)}
.proc-generic--compact-dense .proc-g__item p{margin:0;color:var(--c-muted);font-size:var(--fs-xs);line-height:1.4}

/* ---- "how to reach us" stepper (Contact / Service-Areas prose) ----
   A section whose heading is about reaching the business renders as real
   numbered steps beside its authored copy instead of another block of
   paragraphs (2026-08-25). Steps come from the site's own real routes - see
   reachSteps() in components/index.js - never from splitting up the prose. */
.reach-layout{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.6rem,4vw,3rem);align-items:start}
.reach-copy h2{margin:0 0 .6em}
.reach-copy p{color:var(--c-muted);margin:0 0 .8rem}
.reach-copy p:last-child{margin-bottom:0}
.reach-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.7rem;counter-reset:reach}
/* Two columns, not three: a step carries EITHER its number OR its icon, never
   both (see REACH_MARKER in components/index.js - explicit user instruction
   2026-08-25). The third column used to hold the second marker and would now
   collapse to a dead gap. */
.reach-step{display:grid;grid-template-columns:auto 1fr;align-items:start;gap:.9rem;
  background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);
  padding:1.05rem 1.2rem;box-shadow:var(--shadow-sm);
  transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease}
.reach-step:hover{border-color:var(--c-primary);box-shadow:var(--shadow-md)}
.reach-step__n{width:26px;height:26px;border-radius:50%;background:var(--grad-band);color:var(--c-on-primary);
  display:grid;place-items:center;font-family:var(--font-heading);font-weight:800;font-size:var(--fs-xs);flex:none}
.reach-step__ic{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;
  background:color-mix(in srgb,var(--c-primary) 13%,transparent);flex:none}
.reach-step__ic .ico{color:var(--c-primary)}
.reach-step__c{min-width:0}
.reach-step__c h3{margin:0 0 .15em;font-size:var(--fs-sm)}
.reach-step__c p{margin:0;color:var(--c-muted);font-size:var(--fs-sm)}
.reach-step__c a{color:var(--c-link);font-weight:700}
/* ---- reach stepper: one layout per site (SECTION_POOLS.reachSteps) ----
   Without an axis this section rendered identically on every site (reported
   2026-08-25). CSS-only, one shared markup shape - the variants differ in
   where the copy sits, how the steps flow, and how each step is framed.
   Each key shows the number OR the icon, never both - the choice lives in
   REACH_MARKER (components/index.js), so any rule here that targets
   .reach-step__n or .reach-step__ic only applies on the keys that render it. */
/* timeline-rail: full width, steps on a connected vertical rail */
.reach-layout--timeline-rail{grid-template-columns:minmax(0,1fr);gap:1.6rem}
.reach-layout--timeline-rail .reach-steps{position:relative;padding-left:1.15rem;gap:1.1rem}
.reach-layout--timeline-rail .reach-steps::before{content:"";position:absolute;left:.35rem;top:.6rem;bottom:.6rem;
  width:2px;background:color-mix(in srgb,var(--c-primary) 30%,transparent)}
.reach-layout--timeline-rail .reach-step{background:transparent;border:0;box-shadow:none;padding:.2rem 0 .2rem .6rem}
.reach-layout--timeline-rail .reach-step:hover{box-shadow:none;background:transparent}
.reach-layout--timeline-rail .reach-step__n{outline:4px solid var(--c-bg)}
/* numbered-grid: copy on top, steps as a 2x2 card grid */
.reach-layout--numbered-grid{grid-template-columns:minmax(0,1fr);gap:1.5rem}
.reach-layout--numbered-grid .reach-steps{display:grid;grid-template-columns:repeat(2,1fr);gap:.9rem}
/* horizontal-track: copy on top, four steps across a single row */
.reach-layout--horizontal-track{grid-template-columns:minmax(0,1fr);gap:1.6rem}
.reach-layout--horizontal-track .reach-copy{max-width:64ch}
.reach-layout--horizontal-track .reach-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:.9rem}
.reach-layout--horizontal-track .reach-step{grid-template-columns:auto 1fr;grid-template-rows:auto auto;
  align-content:start;row-gap:.7rem}
.reach-layout--horizontal-track .reach-step__c{grid-column:1 / -1}
/* stacked-panels: full-width rows, tinted, no border - reads as bands */
.reach-layout--stacked-panels{grid-template-columns:minmax(0,1fr);gap:1.4rem}
.reach-layout--stacked-panels .reach-step{background:var(--c-surface-alt);border:0;box-shadow:none;
  border-radius:var(--radius-lg);padding:1.2rem 1.4rem}
.reach-layout--stacked-panels .reach-step:hover{background:color-mix(in srgb,var(--c-primary) 8%,var(--c-surface-alt));box-shadow:none}
/* compact-rows: dense hairline-separated rows, no card fill */
.reach-layout--compact-rows .reach-steps{gap:0}
.reach-layout--compact-rows .reach-step{background:transparent;border:0;border-bottom:1px solid var(--c-border);
  border-radius:0;box-shadow:none;padding:.85rem .2rem}
.reach-layout--compact-rows .reach-step:last-child{border-bottom:0}
.reach-layout--compact-rows .reach-step:hover{background:color-mix(in srgb,var(--c-primary) 6%,transparent);box-shadow:none}
.reach-layout--compact-rows .reach-step__c p{display:none}
/* boxed-outline: drawn outline cards, no fill, hard corners */
.reach-layout--boxed-outline .reach-step{background:transparent;box-shadow:none;border-radius:0;
  border:1.5px solid color-mix(in srgb,var(--c-text) 20%,transparent)}
.reach-layout--boxed-outline .reach-step:hover{background:transparent;box-shadow:none;border-color:var(--c-primary)}
.reach-layout--boxed-outline .reach-step__n{background:transparent;color:var(--c-link);
  border:1.5px solid color-mix(in srgb,var(--c-primary) 45%,transparent)}
/* circle-badge: centered column, the icon alone as one large round badge.
   It used to stack the number above the icon and pull the icon up with a
   negative margin so the two overlapped into a single badge; with only the
   icon rendering, that negative margin had nothing to overlap and just
   dragged the badge out of place, so it is gone. */
.reach-layout--circle-badge{grid-template-columns:minmax(0,1fr);gap:1.5rem}
.reach-layout--circle-badge .reach-copy{text-align:center;margin-inline:auto;max-width:60ch}
.reach-layout--circle-badge .reach-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem}
.reach-layout--circle-badge .reach-step{grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center;
  background:transparent;border:0;box-shadow:none;padding:.4rem}
.reach-layout--circle-badge .reach-step:hover{background:transparent;box-shadow:none}
.reach-layout--circle-badge .reach-step__ic{width:56px;height:56px;border-radius:50%}
@media (max-width:820px){
  .reach-layout{grid-template-columns:minmax(0,1fr)}
  .reach-layout--horizontal-track .reach-steps,
  .reach-layout--circle-badge .reach-steps{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:560px){
  /* The icon stays. It is half of the number+icon pair this component is
     built on, and hiding it below a breakpoint is exactly the kind of
     silent per-width divergence that made the section look unfinished. */
  .reach-layout--numbered-grid .reach-steps,
  .reach-layout--horizontal-track .reach-steps,
  .reach-layout--circle-badge .reach-steps{grid-template-columns:minmax(0,1fr)}
  .reach-step{padding:.9rem 1rem}
}

/* ---- process step PHOTO: a different shape per layout ----
   "How it works" had no imagery at all on any of its 20 variants - four
   number-and-text blocks, nothing else (user request, 2026-08-25: different
   layouts/shapes with relevant images). Markup comes from procMedia() in
   components/index.js; WHICH photo each step gets is decided in
   assets/images.js (step 1 the door, 2 a technician diagnosing, 3 the
   hardware, 4 the finished repair), and the crop/framing below is per LAYOUT
   so the 20 variants stay visually distinct from one another. */
/* margin:0 because these are <figure> elements (see procMedia in
   components/index.js) and a figure carries a default margin:1em 40px. */
.step__media,.hstep__media,.tl-step__media,.proc-numlist__media,.proc-stack__media,
.proc-track__media,.proc-g__media{
  margin:0;overflow:hidden;background:var(--c-surface-alt);flex-shrink:0}
.step__media img,.step__media .ph,.hstep__media img,.hstep__media .ph,
.tl-step__media img,.tl-step__media .ph,.proc-numlist__media img,.proc-numlist__media .ph,
.proc-stack__media img,.proc-stack__media .ph,
.proc-track__media img,.proc-track__media .ph,
.proc-g__media img,.proc-g__media .ph{width:100%;height:100%;object-fit:cover;display:block}

/* CARDS: inset landscape above the copy. NOT full-bleed and .step gets no
   overflow:hidden - .step__n is absolutely positioned at top:-16px, deliberately
   hanging outside the card, and clipping the card would cut that badge in half. */
.step__media{display:block;width:100%;aspect-ratio:16/10;border-radius:var(--radius-card);margin:.2rem 0 1rem}
/* HORIZONTAL: photo moved to the BOTTOM of the card via flex order. The
   connector line (.hstep::after) is pinned at top:2.25rem to line up with the
   number badge - a photo above the number would push the badge down and leave
   the connector pointing at empty space. */
.hstep{display:flex;flex-direction:column}
.hstep__media{order:3;width:100%;aspect-ratio:16/9;border-radius:var(--radius-card);margin-top:.9rem}
/* TIMELINE: sits in the rail's content column, letterboxed. */
.tl-step__media{width:100%;aspect-ratio:21/9;border-radius:var(--radius-card);margin-bottom:.7rem}
/* NUMBERED-LIST: square thumbnail between the numeral and the copy. */
.proc-numlist__media{flex:0 0 104px;width:104px;aspect-ratio:1/1;border-radius:var(--radius-card)}
/* STACKED-PANEL: wide strip beside the oversized number watermark. */
.proc-stack__media{flex:0 0 168px;width:168px;aspect-ratio:16/10;border-radius:var(--radius-card)}
/* DOTS-TRACK: photo under the rail dot, above the caption. */
.proc-track__media{width:100%;aspect-ratio:4/3;border-radius:var(--radius-card);margin-bottom:.8rem}

/* GENERIC skins - 12 of the 20 variants share one markup shape, so the photo
   treatment is what keeps them apart. One distinct crop/frame per key. */
.proc-g__media{display:block;width:100%;aspect-ratio:16/10;border-radius:var(--radius-card);margin-bottom:.9rem}
.proc-generic--framed-outline .proc-g__media{aspect-ratio:21/9;border-radius:0}
.proc-generic--shadow-stack .proc-g__media{aspect-ratio:3/2;border-radius:0;box-shadow:4px 4px 0 var(--c-surface-alt)}
/* Full column width, not an 88px square. The item is a full-height column in
   a 4-up grid (padding 1.4rem each side), so an 88px thumbnail sat as a small
   tile with most of the column's width empty beside it - reported 2026-08-25
   on Irving: "needs to take proper width of the image". 4/3 keeps the four
   photos from dominating the copy the way a 16/9 band would at this column
   width, while still filling it edge to edge. */
.proc-generic--alternating-tint .proc-g__media{width:100%;aspect-ratio:4/3;border-radius:var(--radius-card)}
.proc-generic--circle-badge-grid .proc-g__media{width:96px;aspect-ratio:1/1;border-radius:50%;margin-inline:auto}
.proc-generic--quiet-editorial .proc-g__media{flex:0 0 auto;align-self:flex-start;width:132px;aspect-ratio:4/5;border-radius:0;margin-bottom:0}
.proc-generic--boxed-diagonal .proc-g__media{aspect-ratio:3/2;border-radius:0;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%)}
.proc-generic--wide-spaced-grid .proc-g__media{aspect-ratio:16/9;margin-bottom:1.4rem}
.proc-generic--glass-panel-grid .proc-g__media{aspect-ratio:16/10;
  border:1px solid color-mix(in srgb,#fff 18%,transparent)}
.proc-generic--oversized-index .proc-g__media{width:100%;aspect-ratio:5/3;border-radius:var(--radius-card)}
.proc-generic--compact-dense .proc-g__media{aspect-ratio:2/1;border-radius:calc(var(--radius-card) * .6);margin-bottom:.5rem}
/* oversized-index places children on explicit grid cells, so the photo needs
   its own placement or it auto-flows into (and displaces) the numeral's cell. */
.proc-generic--oversized-index .proc-g__item{grid-template-rows:auto auto}
.proc-generic--oversized-index .proc-g__media{grid-column:1 / -1;grid-row:1;margin-bottom:.8rem}
.proc-generic--oversized-index .proc-g__n{grid-row:2}
.proc-generic--oversized-index .proc-g__item>div{grid-row:2}
@media (max-width:900px){
  /* Back to one column - two columns of [number + 104px photo + text] cannot
     hold their line length below this. */
  .proc-numlist{grid-template-columns:minmax(0,1fr);gap:1.4rem}
}
@media (max-width:1000px){
  /* quiet-editorial collapses EARLIER than numbered-list: its media is a
     132px PORTRAIT crop, so each cell loses more width to the image and the
     copy beside it runs out of line length sooner. */
  .proc-generic--quiet-editorial{grid-template-columns:minmax(0,1fr);gap:1.6rem}
}
@media (max-width:760px){
  .proc-numlist__media{flex-basis:76px;width:76px}
  .proc-stack__media{flex-basis:110px;width:110px}
}

/* ---- process: HOVER states, all 20 variants ----
   Every process variant shipped with NO :hover rule of any kind - the whole
   "How it works" section was inert on every one of the 1000 sites, which on
   the flattest variants (framed-outline, quiet-editorial, underline-accent-
   list: plain text inside a hairline border) read as an unfinished block of
   text. User-reported on Dallas, 2026-08-25; fixed for the section as a
   whole, not that one variant.

   DIVISION OF LABOUR - important, do not break it: these rules change COLOR,
   BACKGROUND, BORDER and SHADOW only. They deliberately never set transform,
   because GSAP owns transform on these same elements (the hover lift + number
   pop in assets/vendor/section-animations.js). GSAP writes an INLINE
   transform, which always beats a stylesheet rule - so a transform added here
   would silently do nothing, exactly the failure mode already documented for
   .svc/.rev in engine/CLAUDE.md. Colour here, motion in GSAP. */
.proc-g__item,.step,.hstep,.tl-step,.proc-stack__row,.proc-numlist>li,.proc-track__item{transition:background-color .25s ease,border-color .25s ease,box-shadow .25s ease,color .25s ease}
.proc-g__n,.step__n,.hstep__n,.tl-step__n,.proc-stack__n,.proc-numlist__n,.proc-track__dot{transition:color .25s ease,background-color .25s ease,border-color .25s ease}
/* The step number is a bare <span> inside a flex-COLUMN item, so the default
   align-items:stretch blows it out to the item's full width - the box is
   ~534px wide even though the glyphs are ~20px. Invisible at rest (no fill),
   but the hover pop scales the BOX, so it grew ~160px past the cell edge and
   over the neighbouring column (user-reported as overlapping numbers on
   Dallas, 2026-08-25). Shrink-wrap it so the scale only ever affects the
   number itself. Variants whose item is align-items:center (circle-badge-grid)
   or a grid (oversized-index) already shrink-wrap, so this is a no-op there. */
.proc-g__n,.proc-stack__n,.proc-numlist__n{width:max-content;max-width:100%}
/* Generic skins (12 of the 20 variants, incl. framed-outline): a soft brand
   wash + the step number resolving from muted to full brand colour. Uses
   --c-link, not raw --c-primary, per the engine's small-brand-text contrast
   rule.

   A HOVER WASH NEEDS GEOMETRY TO FILL. This one rule covers every generic
   skin, but four of them originally set NO padding on .proc-g__item
   (wide-spaced-grid, quiet-editorial, oversized-index, and circle-badge-grid
   which had padding-bottom:0). With nothing to fill, the wash painted a hard
   square block hugging the text and butting straight into the rounded
   .proc-g__media above it - square tint corners sticking out past a rounded
   photo. User-reported on Dana Point (wide-spaced-grid), 2026-08-27.
   Each of those four now carries resting padding - invisible at rest, it
   exists purely so the wash has margin - and the wash is rounded and eased
   here. When adding a NEW generic process skin, give .proc-g__item padding
   (>= ~1rem) or it inherits this same defect. */
.proc-g__item{border-radius:var(--radius-card);transition:background .18s ease,border-color .18s ease,box-shadow .18s ease}
.proc-g__item:hover{background:color-mix(in srgb,var(--c-primary) 7%,transparent)}
.proc-g__item:hover .proc-g__n{color:var(--c-link)}
.proc-generic--framed-outline .proc-g__item:hover,
.proc-generic--boxed-diagonal .proc-g__item:hover,
.proc-generic--glass-panel-grid .proc-g__item:hover,
.proc-generic--shadow-stack .proc-g__item:hover,
.proc-generic--compact-dense .proc-g__item:hover{border-color:var(--c-primary)}
/* Three skins are square BY DESIGN and must not inherit the rounded wash:
   framed-outline draws a ruled grid with borders (a radius bows the rules
   where they meet), alternating-tint paints edge-to-edge banded panels
   (a radius punches gaps in the band), and boxed-diagonal's box shape is a
   clip-path corner cut that a rounded rect would not follow. */
.proc-generic--framed-outline .proc-g__item,
.proc-generic--alternating-tint .proc-g__item,
.proc-generic--boxed-diagonal .proc-g__item{border-radius:0}
/* alternating-tint's resting tint is .proc-g__item:nth-child(even), which at
   (0,3,0) outranks the (0,2,0) shared hover rule - so every SECOND step had
   no hover response at all. Restated at matching specificity. */
.proc-generic--alternating-tint .proc-g__item:nth-child(even):hover{background:color-mix(in srgb,var(--c-primary) 12%,var(--c-surface-alt))}
/* Bespoke shapes get their own accent so the hover matches the shape's logic:
   a card lifts into a shadow, a rail dot fills, a bubble tints. */
.step:hover,.hstep:hover{background:color-mix(in srgb,var(--c-primary) 7%,transparent);box-shadow:var(--shadow-md)}
.step:hover .step__n,.hstep:hover .hstep__n{color:var(--c-on-primary);background:var(--c-primary)}
.tl-step:hover .tl-step__n{color:var(--c-on-primary);background:var(--c-primary)}
.tl-step:hover h3{color:var(--c-link)}
.proc-stack__row:hover{background:color-mix(in srgb,var(--c-primary) 6%,transparent)}
.proc-stack__row:hover .proc-stack__n{color:var(--c-link)}
/* Colour-only, NO background fill. step__n / hstep__n / tl-step__n are real
   circular badges (34-42px, border-radius:50%), so filling them on hover paints
   a proper shape. proc-numlist__n is a BARE numeral with no width, padding or
   radius - the same fill painted a tight rectangle hugging the digit, which
   read as a stray dark box on one step rather than a hover state (visible on
   step 3 of Loveland, 2026-08-27). Same defect class as the process hover wash
   that had no padding to fill: a background needs geometry. proc-stack__n is
   bare too and already does colour-only, one line above. */
.proc-numlist>li:hover .proc-numlist__n{color:var(--c-link)}
.proc-track__item:hover .proc-track__dot{background:var(--c-primary);color:var(--c-on-primary);border-color:var(--c-primary)}
.proc-track__item:hover h3{color:var(--c-link)}

/* ---- stats (structural) (12 keys) ---- */
/* stats - FRAMED-OUTLINE: airy bordered frame per item, no fill */
.stats-generic--framed-outline{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.2rem}
.stats-generic--framed-outline .stats-g__cell{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:clamp(1.6rem,3.4vw,2.4rem) 1.4rem;text-align:center;background:transparent}
.stats-generic--framed-outline .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.7rem,4.6vw,2.5rem);line-height:1;color:var(--c-text)}
.stats-generic--framed-outline .stats-g__cell span:not(.stat-ic){display:block;margin-top:.6rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - SHADOW-STACK: layered offset boxes read as a stack of cards */
.stats-generic--shadow-stack{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:clamp(1.8rem,3.6vw,2.6rem);padding:.2rem .9rem .9rem .2rem}
.stats-generic--shadow-stack .stats-g__cell{position:relative;z-index:0;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:1.6rem 1.2rem;text-align:center;box-shadow:var(--shadow-sm)}
.stats-generic--shadow-stack .stats-g__cell::before{content:'';position:absolute;inset:0;border-radius:inherit;background:var(--c-surface-alt);border:1px solid var(--c-border);z-index:-1;transform:translate(7px,7px)}
.stats-generic--shadow-stack .stats-g__cell::after{content:'';position:absolute;inset:0;border-radius:inherit;background:var(--c-surface-alt);border:1px solid var(--c-border);z-index:-2;opacity:.7;transform:translate(14px,14px)}
.stats-generic--shadow-stack .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,4vw,2.2rem);color:var(--c-text)}
.stats-generic--shadow-stack .stats-g__cell span:not(.stat-ic){display:block;margin-top:.4rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - ALTERNATING-TINT: centered zebra-striped banner rows inside one bordered rail */
.stats-generic--alternating-tint{display:flex;flex-direction:column;border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden}
.stats-generic--alternating-tint .stats-g__cell{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.3rem;padding:1.1rem 1rem;background:transparent}
.stats-generic--alternating-tint .stats-g__cell:nth-child(even){background:var(--c-surface-alt)}
.stats-generic--alternating-tint .stats-g__cell:nth-child(odd){background:transparent}
.stats-generic--alternating-tint .stats-g__cell b{font-family:var(--font-heading);font-weight:800;font-size:var(--fs-lg);color:var(--c-text)}
.stats-generic--alternating-tint .stats-g__cell span:not(.stat-ic){color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - CIRCLE-BADGE-GRID: number sits inside a prominent filled circular badge */
.stats-generic--circle-badge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:clamp(1.4rem,3vw,2.2rem)}
.stats-generic--circle-badge-grid .stats-g__cell{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:.8rem}
/* The circles were always equal 124x124 - what looked stretched was the
   longest value nearly filling one. Measured on Orlando: "334,854" rendered
   109px wide inside a 124px circle with padding-inline:0, leaving 8px a side,
   against 48-53px for "4"/"51"/"FL". Worse, the top padding puts the number
   in the upper part of the circle where the chord is narrower than the full
   diameter, so it crowded the curve on both sides.
   The circle is slightly larger, the type slightly smaller, and there is now
   a real horizontal gutter - a 7-character population figure clears the curve
   with room to spare, and the short values are unaffected because they were
   never near the edge. Population is the longest value this badge ever
   carries, so size it for that, not for a single digit. */
.stats-generic--circle-badge-grid .stats-g__cell b{display:flex;align-items:center;justify-content:center;padding:0 .9rem;width:clamp(96px,17vw,132px);height:clamp(96px,17vw,132px);border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);font-family:var(--font-heading);font-weight:800;font-size:clamp(1rem,2.5vw,1.35rem);box-sizing:border-box;line-height:1;transition:transform .18s ease,background .18s ease}
.stats-generic--circle-badge-grid .stats-g__cell span:not(.stat-ic){color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}
/* NO ICON IN THIS VARIANT (2026-09-01, user request: "remove the icon from
   the stats sections", reported on Daphne).
   stats() emits .stat-ic for EVERY stats variant from one shared statIcon()
   helper, so it cannot be dropped per-variant in the render path without
   putting variant-specific branching into the generic skin - the whole point
   of that architecture is that generic skins differ by CSS only. Hiding it
   here keeps that intact. The span is aria-hidden and purely decorative, so
   display:none removes it from the a11y tree as well as the page.

   THE PADDING ABOVE MOVED WITH IT. The circle carried padding:1.15rem .9rem 0
   whose ONLY job was to push the number down clear of this icon; measured on
   Hanford, that left the value sitting 9.2px below the circle's true centre.
   With no icon that offset is just a lopsided number, so the padding is now
   symmetric (0 .9rem) and the value centres properly. The horizontal gutter
   stays - it is what keeps a 7-character population figure off the curve.

   The former :hover opt-out for .stat-ic is gone with the icon. It existed
   because the shared .stats-g__cell:hover .stat-ic rule (0,3,0) outranked this
   variant's own (0,2,0) and hijacked the icon's centring and background. If
   the icon is ever restored here, that opt-out must come back with it. */
.stats-generic--circle-badge-grid .stat-ic{display:none}
/* HOVER: fill only - the circle must NOT scale. Scaling b used to drag the
   circle out from under the (then-present) icon; the scale is gone and stays
   gone, because the shared cell lift (.stats-g__cell:hover) already moves the
   whole cell as one unit. Deepening the fill 13% -> 20% is the feedback. */
.stats-generic--circle-badge-grid .stats-g__cell:hover b{background:color-mix(in srgb,var(--c-primary) 20%,transparent)}

/* stats - LEDGER-ROWS: full-width rows, hairline dividers, dotted leader like an accounting ledger */
.stats-generic--ledger-rows{display:flex;flex-direction:column}
.stats-generic--ledger-rows .stats-g__cell{display:flex;align-items:baseline;padding:1rem 0;border-top:1px solid var(--c-border)}
.stats-generic--ledger-rows .stats-g__cell:last-child{border-bottom:1px solid var(--c-border)}
.stats-generic--ledger-rows .stats-g__cell span:not(.stat-ic){order:1;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600;white-space:nowrap}
.stats-generic--ledger-rows .stats-g__cell::after{content:'';order:2;flex:1;align-self:center;margin:0 .8rem;border-bottom:1px dotted var(--c-border);min-width:1rem}
.stats-generic--ledger-rows .stats-g__cell b{order:3;font-family:var(--font-heading);font-weight:800;font-size:var(--fs-lg);color:var(--c-text);white-space:nowrap}

/* stats - QUIET-EDITORIAL: understated text-forward row, generous whitespace, zero decoration */
.stats-generic--quiet-editorial{display:flex;flex-wrap:wrap;gap:clamp(2.2rem,5vw,4rem);justify-content:flex-start}
.stats-generic--quiet-editorial .stats-g__cell{display:flex;flex-direction:column;gap:.5rem;min-width:9rem;flex:1 1 9rem}
.stats-generic--quiet-editorial .stats-g__cell b{font-family:var(--font-heading);font-weight:700;font-size:clamp(1.5rem,3.4vw,2rem);color:var(--c-text);line-height:1.1}
.stats-generic--quiet-editorial .stats-g__cell span:not(.stat-ic){color:var(--c-muted);font-size:var(--fs-sm);font-weight:400;letter-spacing:.01em;max-width:22ch}

/* stats - BOXED-DIAGONAL: bordered box per item, one corner cut via clip-path, primary accent bar opposite the cut */
.stats-generic--boxed-diagonal{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.2rem}
.stats-generic--boxed-diagonal .stats-g__cell{position:relative;border:1px solid var(--c-border);background:var(--c-surface);padding:1.7rem 1.3rem 1.4rem;clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,0 100%)}
.stats-generic--boxed-diagonal .stats-g__cell b{display:block;padding-left:.9rem;border-left:3px solid var(--c-primary);font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,4vw,2.1rem);color:var(--c-text)}
.stats-generic--boxed-diagonal .stats-g__cell span:not(.stat-ic){display:block;margin-top:.6rem;padding-left:.9rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - WIDE-SPACED-GRID: the default grid shape pushed out with large gaps + padding, minimal decoration */
.stats-generic--wide-spaced-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:clamp(2.4rem,5vw,4.4rem);padding:clamp(1rem,3vw,2rem) 0}
.stats-generic--wide-spaced-grid .stats-g__cell{text-align:center;padding:.4rem;min-width:0}
.stats-generic--wide-spaced-grid .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.8rem,5vw,3rem);line-height:1;background:var(--grad-brand-text);-webkit-background-clip:text;background-clip:text;color:transparent}
.stats-generic--wide-spaced-grid .stats-g__cell span:not(.stat-ic){display:block;margin-top:.6rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - UNDERLINE-ACCENT-LIST: plain left-aligned block list, colored border-bottom accent per item instead of a box */
.stats-generic--underline-accent-list{display:flex;flex-direction:column}
.stats-generic--underline-accent-list .stats-g__cell{padding:.9rem .2rem 1.1rem;border-bottom:3px solid var(--c-primary)}
.stats-generic--underline-accent-list .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.4rem,3.6vw,1.9rem);color:var(--c-text)}
.stats-generic--underline-accent-list .stats-g__cell span:not(.stat-ic){display:block;margin-top:.3rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - GLASS-PANEL-GRID: frosted translucent panel per item */
.stats-generic--glass-panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.2rem}
.stats-generic--glass-panel-grid .stats-g__cell{background:color-mix(in srgb,var(--c-surface) 60%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.6rem 1.3rem;text-align:center}
.stats-generic--glass-panel-grid .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,4vw,2.2rem);color:var(--c-text)}
.stats-generic--glass-panel-grid .stats-g__cell span:not(.stat-ic){display:block;margin-top:.5rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - OVERSIZED-INDEX: ghost index numeral (CSS counter) dominates behind each stat */
.stats-generic--oversized-index{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:clamp(1.6rem,3.4vw,2.6rem);counter-reset:sgidx}
.stats-generic--oversized-index .stats-g__cell{position:relative;counter-increment:sgidx;padding:2.2rem 1rem .8rem;text-align:center;overflow:hidden}
.stats-generic--oversized-index .stats-g__cell::before{content:counter(sgidx,decimal-leading-zero);position:absolute;top:-.35em;left:50%;transform:translateX(-50%);font-family:var(--font-heading);font-weight:800;font-size:clamp(4.2rem,13vw,7.5rem);line-height:1;color:color-mix(in srgb,var(--c-primary) 10%,transparent);z-index:0;pointer-events:none}
.stats-generic--oversized-index .stats-g__cell b{position:relative;z-index:1;display:block;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.5rem,4vw,2.1rem);color:var(--c-text)}
.stats-generic--oversized-index .stats-g__cell span:not(.stat-ic){position:relative;z-index:1;display:block;margin-top:.3rem;color:var(--c-muted);font-size:var(--fs-sm);font-weight:600}

/* stats - COMPACT-DENSE: tight spacing, smaller type, dense packing */
.stats-generic--compact-dense{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:.5rem}
.stats-generic--compact-dense .stats-g__cell{border:1px solid var(--c-border);border-radius:calc(var(--radius-card) * .6);padding:.6rem .5rem;text-align:center;background:var(--c-surface-alt)}
.stats-generic--compact-dense .stats-g__cell b{display:block;font-family:var(--font-heading);font-weight:800;font-size:var(--fs-md);line-height:1.1;color:var(--c-text)}
.stats-generic--compact-dense .stats-g__cell span:not(.stat-ic){display:block;margin-top:.15rem;color:var(--c-muted);font-size:var(--fs-xs);font-weight:600}

/* ---- trustbar (skin-only) (17 keys) ---- */
/* trustbar - FRAMED OUTLINE: no fill, just a border frame per item, airy padding */
.trustbar--framed-outline .container{display:flex;flex-wrap:wrap;justify-content:center;align-items:stretch;gap:1.4rem 1.8rem;padding-block:1.6rem}
.trustbar--framed-outline .trust-item{background:transparent;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);box-shadow:none;border-radius:var(--radius-lg);padding:1.15rem 1.5rem;gap:.75rem}
.trustbar--framed-outline .trust-item .ico{color:var(--c-primary);flex:none}
.trustbar--framed-outline .trust-item:hover{border-color:var(--c-primary)}

/* trustbar - SHADOW STACK: two offset ghost layers behind each card suggest a deck of stacked cards */
.trustbar--shadow-stack .container{display:flex;flex-wrap:wrap;justify-content:center;gap:1.7rem 1.6rem;padding-block:1.7rem}
.trustbar--shadow-stack .trust-item{position:relative;background:var(--c-surface);border:1px solid var(--c-border);box-shadow:var(--shadow-md);border-radius:var(--radius-card);padding:.9rem 1.2rem;gap:.6rem;z-index:1}
.trustbar--shadow-stack .trust-item::before,.trustbar--shadow-stack .trust-item::after{content:"";position:absolute;inset:0;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-card);z-index:-1}
.trustbar--shadow-stack .trust-item::before{transform:translate(5px,5px)}
.trustbar--shadow-stack .trust-item::after{transform:translate(10px,10px);box-shadow:var(--shadow-sm)}

/* trustbar - PILL TAGS: small tinted tag chips (no icon-badge, no shadow) in a wrapping cloud */
.trustbar--pill-tags .container{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;padding-block:1.2rem}
.trustbar--pill-tags .trust-item{background:var(--c-surface-alt);border:1px solid var(--c-border);box-shadow:none;border-radius:var(--radius-pill);padding:.4rem .9rem .4rem .65rem;gap:.4rem;font-size:var(--fs-xs)}
.trustbar--pill-tags .trust-item .ico{width:14px;height:14px;color:var(--c-primary);flex:none}
.trustbar--pill-tags .trust-item:hover{border-color:var(--c-primary)}

/* trustbar - CIRCLE BADGE GRID: no card box at all, just a big circular icon badge over centered text */
.trustbar--circle-badge-grid .container{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1.5rem 1rem;padding-block:1.7rem}
.trustbar--circle-badge-grid .trust-item{flex-direction:column;align-items:center;text-align:center;justify-content:flex-start;gap:.7rem;background:transparent;border:0;box-shadow:none;border-radius:0;padding:0}
.trustbar--circle-badge-grid .trust-item .ico{width:52px;height:52px;padding:13px;box-sizing:border-box;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex:none;display:flex;align-items:center;justify-content:center}
.trustbar--circle-badge-grid .trust-item b{display:block}

/* trustbar - QUIET EDITORIAL: text-forward, zero borders/boxes/shadows, generous editorial whitespace */
/* ONE LINE PER ITEM (user 2026-10-12, Chandler): fixed 230px grid columns at
   --fs-md wrapped "Diagnosis first, then the fix" onto two lines. Now a
   centred flex row, items never wrap, and the type steps down slightly. */
.trustbar--quiet-editorial .container{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:1.1rem clamp(1.6rem,4vw,3.6rem);padding-block:1.7rem}
.trustbar--quiet-editorial .trust-item{background:none;border:0;box-shadow:none;border-radius:0;padding:0;gap:.6rem;font-size:clamp(.95rem,1.15vw,1.08rem);white-space:nowrap}
.trustbar--quiet-editorial .trust-item .ico{color:var(--c-muted);flex:none}
.trustbar--quiet-editorial .trust-item b{font-family:var(--font-heading)}

/* trustbar - BOXED DIAGONAL: bordered card with one corner cut on the diagonal, plus a small tinted corner accent */
.trustbar--boxed-diagonal .container{display:flex;flex-wrap:wrap;justify-content:center;gap:1.2rem;padding-block:1.6rem}
.trustbar--boxed-diagonal .trust-item{position:relative;background:var(--c-surface);border:1px solid var(--c-border);box-shadow:none;border-radius:0;padding:1rem 1.3rem 1rem 1.1rem;clip-path:polygon(0 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)}
.trustbar--boxed-diagonal .trust-item::after{content:"";position:absolute;right:0;bottom:0;width:16px;height:16px;background:color-mix(in srgb,var(--c-primary) 22%,transparent);clip-path:polygon(100% 0,100% 100%,0 100%)}

/* trustbar - WIDE SPACED GRID: the default grid shape, blown out with much bigger gaps/padding, zero decoration */
.trustbar--wide-spaced-grid .container{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:2.4rem 2.2rem;padding-block:2.2rem}
.trustbar--wide-spaced-grid .trust-item{background:none;border:0;box-shadow:none;border-radius:0;padding:0}

/* trustbar - UNDERLINE ACCENT LIST: plain wrapping list, each item gets a colored bottom-border accent instead of a box */
.trustbar--underline-accent-list .container{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem 2.2rem;padding-block:1.4rem}
.trustbar--underline-accent-list .trust-item{background:none;border:0;box-shadow:none;border-radius:0;padding:0 0 .55rem;border-bottom:2px solid color-mix(in srgb,var(--c-primary) 55%,transparent)}

/* trustbar - GLASS PANEL GRID: frosted translucent panels in a grid */
.trustbar--glass-panel-grid .container{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:1rem;padding-block:1.4rem}
.trustbar--glass-panel-grid .trust-item{background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--c-border);box-shadow:var(--shadow-sm);border-radius:var(--radius-lg);padding:1.1rem 1.2rem}

/* trustbar - OUTLINE ONLY: no filled backgrounds anywhere, primary-tinted border frame only, in a tight grid */
.trustbar--outline-only .container{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;padding-block:1.4rem}
.trustbar--outline-only .trust-item{background:none;border:1px solid color-mix(in srgb,var(--c-primary) 35%,color-mix(in srgb,var(--c-text) 22%,transparent));box-shadow:none;border-radius:var(--radius-card);padding:.75rem 1rem}
.trustbar--outline-only .trust-item .ico{color:var(--c-primary)}

/* trustbar - MINIMAL TEXT ROW: single-line text-only row, evenly spaced, no boxes, no dividers */
.trustbar--minimal-text-row .container{display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:center;gap:1.6rem;padding-block:1rem;overflow-x:auto}
.trustbar--minimal-text-row .trust-item{background:none;border:0;box-shadow:none;border-radius:0;padding:0;flex:none;font-size:var(--fs-xs)}
.trustbar--minimal-text-row .trust-item .ico{width:14px;height:14px;color:var(--c-muted);flex:none}

/* trustbar - DIVIDER LINE ROW: full-height stretched vertical rules between items, generous spacing, no boxes */
.trustbar--divider-line-row .container{display:flex;flex-wrap:wrap;justify-content:center;align-items:stretch;gap:0;padding-block:1.4rem}
.trustbar--divider-line-row .trust-item{background:none;border:0;box-shadow:none;border-radius:0;padding:.3rem 1.8rem;border-left:1px solid var(--c-border);font-size:var(--fs-md)}
.trustbar--divider-line-row .trust-item:first-child{border-left:0}

/* trustbar - BOXED GRID TABLE: bordered spreadsheet-like grid, 1px internal dividing lines via gap+bg trick */
.trustbar--boxed-grid-table .container{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;background:var(--c-border);border:1px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden;padding-block:0}
.trustbar--boxed-grid-table .trust-item{background:var(--c-surface);border:0;box-shadow:none;border-radius:0;padding:1rem 1.1rem;margin:0}

/* "View all N areas" link to /service-areas/ - appended after every areas()
   variant's own body when the real list is longer than the homepage preview
   cap (see AREA_PREVIEW_CAP in components/index.js). Sits as its own row
   below whatever the variant rendered, so it works regardless of which
   variant's markup precedes it. */
.cov-viewall{display:flex;align-items:center;justify-content:center;gap:.4rem;margin-top:1.6rem;padding-top:1.4rem;border-top:1px solid var(--c-border);font-size:var(--fs-sm);font-weight:700;color:var(--c-link);text-decoration:none}
.cov-viewall:hover{color:var(--c-primary)}

/* ---- areas (structural, wraps existing directory list) (17 keys) ---- */
/* areas() generic-skin CSS - .cov-generic--KEY rulesets (17 new variants) */

/* framed-outline: airy border frame around the whole block + nested bordered groups, no fill */
.cov-generic--framed-outline{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:clamp(1.6rem,4vw,2.6rem)}
.cov-generic--framed-outline .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;padding-bottom:1.8rem;margin-bottom:1.8rem;border-bottom:1px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
.cov-generic--framed-outline .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--framed-outline .cov-generic__list{display:flex;flex-direction:column;gap:1.2rem}
.cov-generic--framed-outline .cov-group{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-card);padding:1.4rem 1.6rem}
.cov-generic--framed-outline .cov-group h3{font-size:var(--fs-md);margin:0 0 .9rem}
.cov-generic--framed-outline .cov-list{column-gap:1.6rem}

/* shadow-stack: layered offset box-shadows suggesting stacked cards, on head + each group */
.cov-generic--shadow-stack .cov-generic__head{background:var(--c-surface);border-radius:var(--radius-lg);padding:1.7rem 2rem;box-shadow:0 3px 0 var(--c-border),0 11px 0 -4px var(--c-surface-alt),var(--shadow-md);display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:2.4rem}
.cov-generic--shadow-stack .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--shadow-stack .cov-generic__list{display:flex;flex-direction:column;gap:1.8rem}
.cov-generic--shadow-stack .cov-group{background:var(--c-surface);border-radius:var(--radius-card);padding:1.5rem 1.7rem;box-shadow:0 2px 0 var(--c-border),0 8px 0 -3px var(--c-surface-alt),var(--shadow-sm)}
.cov-generic--shadow-stack .cov-group h3{font-size:var(--fs-md);margin:0 0 1rem}

/* alternating-tint: single-column rows, odd items get a subtle surface-alt stripe */
.cov-generic--alternating-tint .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:1.6rem}
.cov-generic--alternating-tint .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--alternating-tint .cov-generic__list{display:flex;flex-direction:column;gap:1rem}
.cov-generic--alternating-tint .cov-group h3{font-size:var(--fs-md);margin:0 0 .6rem}
.cov-generic--alternating-tint .cov-list{columns:auto;display:block}
.cov-generic--alternating-tint .cov-list li{display:block;margin:0;break-inside:auto}
.cov-generic--alternating-tint .cov-list li:nth-child(odd){background:var(--c-surface-alt)}
.cov-generic--alternating-tint .cov-list a{display:flex;width:100%;padding:.65rem 1rem}

/* pill-tags: rounded pill/tag chips in a wrapping flex row */
.cov-generic--pill-tags .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:1.8rem}
.cov-generic--pill-tags .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--pill-tags .cov-generic__list{display:flex;flex-direction:column;gap:1.4rem}
.cov-generic--pill-tags .cov-group h3{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.06em;color:var(--c-muted);margin:0 0 .8rem}
.cov-generic--pill-tags .cov-list{columns:unset;display:flex;flex-wrap:wrap;gap:.6rem}
.cov-generic--pill-tags .cov-list li{margin:0;break-inside:auto}
.cov-generic--pill-tags .cov-list a{display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1.05rem;border:1px solid var(--c-border);border-radius:var(--radius-pill);background:var(--c-surface);font-size:var(--fs-sm);font-weight:600}
.cov-generic--pill-tags .cov-list a:hover{border-color:var(--c-primary);color:var(--c-primary)}

/* circle-badge-grid: prominent circular flat-tint icon badge above each item, in a grid */
.cov-generic--circle-badge-grid .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:2rem}
.cov-generic--circle-badge-grid .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--circle-badge-grid .cov-generic__list{display:flex;flex-direction:column;gap:1.8rem}
.cov-generic--circle-badge-grid .cov-group h3{font-size:var(--fs-md);margin:0 0 1rem}
.cov-generic--circle-badge-grid .cov-list{columns:unset;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem}
.cov-generic--circle-badge-grid .cov-list li{margin:0;break-inside:auto}
.cov-generic--circle-badge-grid .cov-list a{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.6rem;padding:1rem .6rem}
.cov-generic--circle-badge-grid .cov-list .ico{display:flex;align-items:center;justify-content:center;width:2.6rem;height:2.6rem;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);flex:none}
.cov-generic--circle-badge-grid .cov-list a span{font-size:var(--fs-sm);font-weight:600}

/* ledger-rows: plain full-width rows, thin border-top hairlines only, no boxes/shadows */
.cov-generic--ledger-rows .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;padding-bottom:1.4rem;margin-bottom:.4rem;border-bottom:2px solid var(--c-border)}
.cov-generic--ledger-rows .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--ledger-rows .cov-group h3{font-size:var(--fs-md);margin:1.6rem 0 .2rem;padding-top:1.2rem;border-top:2px solid var(--c-border)}
.cov-generic--ledger-rows .cov-group:first-child h3{margin-top:1.2rem;padding-top:0;border-top:0}
.cov-generic--ledger-rows .cov-list{columns:unset;display:block}
.cov-generic--ledger-rows .cov-list li{display:block;margin:0;border-top:1px solid var(--c-border)}
.cov-generic--ledger-rows .cov-list li:first-child{border-top:0}
.cov-generic--ledger-rows .cov-list a{display:flex;align-items:center;gap:.6rem;padding:.75rem 0;width:100%}

/* quiet-editorial: understated, generous whitespace, zero borders/boxes, text-forward */
/* The head used to be flex-direction:column with max-width:640px, i.e. a
   narrow left-hand stack under an already-narrow section heading - so on a
   1160px container the whole right half of the band was empty (reported on
   Sun Prairie, 2026-09-01). Every sibling generic areas skin lays this block
   out as a full-width row; this one now does too, and above 900px it is
   COMBINED with the section heading into a single two-column band.
   The list keeps its own 3 -> 2 -> 1 column rules further down. */
.cov-generic--quiet-editorial .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:2.6rem}
.cov-generic--quiet-editorial .cov-generic__head .btn{margin-inline-start:auto;flex:0 0 auto}
/* COMBINED BAND (desktop only): section heading left, count + copy + CTA right,
   chip list spanning both underneath.
   .section-head and the areas body are SIBLINGS inside .container (see
   section() in components/index.js), so the container itself becomes the grid.
   .cov-generic carries no box styling of its own - no .cov-generic{} rule and
   no --quiet-editorial{} rule exist - so display:contents can safely promote
   its two children into that grid without losing a background, border or pad.
   :has() keeps this scoped to sections that actually contain this variant, so
   no markup or component change is needed.
   Below 901px none of it applies: the container returns to normal block flow
   and the head is the plain wrapping row defined above, which is the mobile
   fallback a two-item row must always have. */
@media (min-width:901px){
  .section:has(> .container > .cov-generic--quiet-editorial) > .container{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:clamp(2rem,4vw,4rem);align-items:start}
  /* Everything in this container spans BOTH columns by default; only the
     heading and the count/CTA block opt into a single column. Without this
     catch-all the optional "View all N areas" link auto-placed into column 1
     and sat at half width with the right half empty - the exact defect this
     band exists to remove, reintroduced one element lower down. Any future
     sibling section() grows into the full width instead of half. */
  .section:has(> .container > .cov-generic--quiet-editorial) > .container > *{grid-column:1 / -1}
  .section:has(> .container > .cov-generic--quiet-editorial) > .container > .section-head{grid-column:1;margin-bottom:0}
  .cov-generic--quiet-editorial{display:contents}
  .cov-generic--quiet-editorial .cov-generic__head{grid-column:2;flex-direction:column;align-items:flex-start;gap:.9rem;margin-bottom:0}
  .cov-generic--quiet-editorial .cov-generic__head .btn{margin-inline-start:0}
  .cov-generic--quiet-editorial .cov-generic__list{grid-column:1 / -1;margin-top:clamp(2rem,4vw,3rem)}
}
.cov-generic--quiet-editorial .cov-panel__n{font-size:var(--fs-xl);font-weight:700;color:var(--c-muted)}
.cov-generic--quiet-editorial .cov-generic__head p{margin:0;font-family:var(--font-heading);font-size:var(--fs-lg);line-height:1.45;color:var(--c-text)}
.cov-generic--quiet-editorial .cov-generic__list{display:flex;flex-direction:column;gap:2rem}
.cov-generic--quiet-editorial .cov-group h3{font-weight:600;font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.08em;color:var(--c-muted);margin:0 0 1rem}
.cov-generic--quiet-editorial .cov-list{columns:3;column-gap:2.2rem}
.cov-generic--quiet-editorial .cov-list li{margin-bottom:.9rem}
.cov-generic--quiet-editorial .cov-list a{font-weight:400;color:var(--c-text)}
/* Icon shown (was display:none). Explicit user request 2026-08-25 on Newark:
   "update this variant design, use icons also". The pin is what marks each
   entry as a place rather than a generic link. */
.cov-generic--quiet-editorial .cov-list .ico{display:inline-flex;color:var(--c-link)}

/* boxed-diagonal: bordered box per item, one corner cut via clip-path */
.cov-generic--boxed-diagonal .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:1.8rem}
.cov-generic--boxed-diagonal .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--boxed-diagonal .cov-generic__list{display:flex;flex-direction:column;gap:1.6rem}
.cov-generic--boxed-diagonal .cov-group h3{font-size:var(--fs-md);margin:0 0 1rem}
.cov-generic--boxed-diagonal .cov-list{columns:unset;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.9rem}
.cov-generic--boxed-diagonal .cov-list li{margin:0;break-inside:auto}
.cov-generic--boxed-diagonal .cov-list a{display:flex;align-items:center;gap:.5rem;border:1px solid var(--c-border);padding:.8rem 1.1rem;clip-path:polygon(0 0,100% 0,100% 100%,14px 100%,0 calc(100% - 14px))}
.cov-generic--boxed-diagonal .cov-list a:hover{border-color:var(--c-primary);color:var(--c-primary)}

/* wide-spaced-grid: default grid shape, noticeably larger gaps/padding, minimal decoration */
.cov-generic--wide-spaced-grid .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1.4rem 2.4rem;margin-bottom:2.4rem}
.cov-generic--wide-spaced-grid .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--wide-spaced-grid .cov-generic__list{display:flex;flex-direction:column;gap:2.4rem}
.cov-generic--wide-spaced-grid .cov-group h3{font-size:var(--fs-md);margin:0 0 1.4rem}
.cov-generic--wide-spaced-grid .cov-list{columns:unset;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.6rem 2.2rem}
.cov-generic--wide-spaced-grid .cov-list li{margin:0}
.cov-generic--wide-spaced-grid .cov-list a{padding:.3rem 0}

/* underline-accent-list: plain list, colored border-bottom accent per item instead of a box */
.cov-generic--underline-accent-list .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:1.8rem}
.cov-generic--underline-accent-list .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--underline-accent-list .cov-generic__list{display:flex;flex-direction:column;gap:1.2rem}
.cov-generic--underline-accent-list .cov-group h3{font-size:var(--fs-md);margin:0 0 .8rem}
.cov-generic--underline-accent-list .cov-list{columns:2;column-gap:1.8rem}
.cov-generic--underline-accent-list .cov-list li{margin-bottom:.8rem}
.cov-generic--underline-accent-list .cov-list a{display:flex;width:100%;padding-bottom:.5rem;border-bottom:2px solid var(--c-border)}
.cov-generic--underline-accent-list .cov-list a:hover{border-bottom-color:var(--c-primary);color:var(--c-primary)}

/* glass-panel-grid: frosted translucent panels (head + each group) with a border */
.cov-generic--glass-panel-grid .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.5rem 1.8rem;margin-bottom:1.6rem}
.cov-generic--glass-panel-grid .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
/* The two groups used to sit SIDE BY SIDE in an auto-fit 2-column grid, each
   group's own list forced to columns:1. Grid rows stretch, so both panels
   were sized to the taller one - and these two groups are never comparable:
   measured on Fort Lauderdale's /service-areas/, "Fort Lauderdale
   neighborhoods" holds 10 items (582px of list) while "Nearby communities"
   holds 32 (1863px), so the short panel was stretched to 1953px and carried
   1307px of empty glass. Reported 2026-08-25 as "too much blank spaces".
   align-items:start alone would not fix it - it only stops the short panel
   stretching, leaving the same 1300px hole beside the long list. The real
   problem is a single-file list of 32 links being 1863px tall in the first
   place, so each group now spans the FULL width and flows its own items into
   a responsive item grid. Both panels end up short, and neither can strand
   the other because they no longer share a row. */
.cov-generic--glass-panel-grid .cov-generic__list{display:grid;grid-template-columns:minmax(0,1fr);gap:1.4rem;align-items:start}
.cov-generic--glass-panel-grid .cov-group{background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:1.6rem}
.cov-generic--glass-panel-grid .cov-group h3{font-size:var(--fs-md);margin:0 0 1rem}
/* Items flow as a grid rather than a CSS column flow: with columns:N the
   browser balances by HEIGHT and two items at the same y can land in different
   columns, which is what made an earlier "unequal card heights" report a false
   positive on San Diego. A real grid keeps rows honest. auto-fill (not
   auto-fit) so a group with only 2-3 items keeps normal-width cards instead
   of stretching them across the whole panel. */
.cov-generic--glass-panel-grid .cov-list{columns:auto;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.55rem .8rem}
.cov-generic--glass-panel-grid .cov-list li{margin-bottom:0}

/* split-duotone: block splits into two halves via a structural vertical divider line */
.cov-generic--split-duotone .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:2rem}
.cov-generic--split-duotone .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--split-duotone .cov-generic__list{display:grid;grid-template-columns:1fr 1fr;gap:0}
.cov-generic--split-duotone .cov-group{padding:0 2.2rem}
.cov-generic--split-duotone .cov-group:first-child{padding-left:0;border-right:1px solid var(--c-border)}
.cov-generic--split-duotone .cov-group:last-child{padding-right:0}
.cov-generic--split-duotone .cov-group:only-child{grid-column:1/-1;border-right:0;padding:0}
.cov-generic--split-duotone .cov-group h3{font-size:var(--fs-md);margin:0 0 1rem}
.cov-generic--split-duotone .cov-list{columns:1}

/* outline-only: no filled backgrounds anywhere, thin bordered head panel + outlined pill items */
.cov-generic--outline-only .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:1.5rem 1.8rem;margin-bottom:1.8rem}
.cov-generic--outline-only .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--outline-only .btn--solid{background:transparent!important;color:var(--c-primary)!important;border:2px solid var(--c-primary)!important}
.cov-generic--outline-only .cov-generic__list{display:flex;flex-direction:column;gap:1.4rem}
.cov-generic--outline-only .cov-group h3{font-size:var(--fs-md);margin:0 0 .9rem}
.cov-generic--outline-only .cov-list{columns:unset;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.7rem}
.cov-generic--outline-only .cov-list li{margin:0}
.cov-generic--outline-only .cov-list a{display:flex;align-items:center;gap:.45rem;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-pill);padding:.5rem .95rem;background:transparent}
.cov-generic--outline-only .cov-list a:hover{border-color:var(--c-primary);color:var(--c-primary)}

/* stacked-two-row: forces the list into exactly two flowing rows via grid-auto-flow:column */
.cov-generic--stacked-two-row .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;margin-bottom:1.8rem}
.cov-generic--stacked-two-row .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--stacked-two-row .cov-generic__list{display:flex;flex-direction:column;gap:1.6rem}
.cov-generic--stacked-two-row .cov-group h3{font-size:var(--fs-md);margin:0 0 .9rem}
/* Was grid-auto-flow:column + overflow-x:auto - a two-row strip you scrolled
   SIDEWAYS. That is wrong for this section at every size, and badly wrong on
   the /service-areas/ index page, which deliberately renders the FULL list
   (areas() is called with full:true there, so no 10-item cap): a real city
   like Chicago has 110 areas, which became a ~9000px-wide horizontal scroll
   holding the entire directory off-screen. An area directory is a list to
   scan, not a carousel. Now a normal wrapping grid that fills the width and
   grows downward, so 10 items (the preview on other pages) and 110 (the
   index page) both just work. white-space stays normal so long real area
   names wrap instead of forcing the page wide - see the note in the areas
   responsive block below. */
.cov-generic--stacked-two-row .cov-list{columns:unset;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.6rem 1.6rem;padding-bottom:.5rem}
.cov-generic--stacked-two-row .cov-list li{margin:0;min-width:0}
.cov-generic--stacked-two-row .cov-list a{white-space:normal;overflow-wrap:anywhere}

/* minimal-text-row: text-only single-line rows, minimal decoration, icon dropped */
.cov-generic--minimal-text-row .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:.8rem 1.4rem;margin-bottom:1.2rem}
.cov-generic--minimal-text-row .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted);font-size:var(--fs-sm)}
.cov-generic--minimal-text-row .cov-generic__list{display:flex;flex-direction:column}
.cov-generic--minimal-text-row .cov-group h3{font-size:var(--fs-sm);font-weight:600;color:var(--c-muted);margin:.4rem 0 .4rem}
.cov-generic--minimal-text-row .cov-list{columns:unset;display:block}
.cov-generic--minimal-text-row .cov-list li{margin:0}
.cov-generic--minimal-text-row .cov-list a{display:block;padding:.35rem 0;font-size:var(--fs-sm);font-weight:500}
.cov-generic--minimal-text-row .cov-list .ico{display:none}

/* divider-line-row: multi-column flow with vertical column-rule + horizontal rule lines, no boxes */
.cov-generic--divider-line-row .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;padding-bottom:1.4rem;margin-bottom:1.4rem;border-bottom:1px solid var(--c-border)}
.cov-generic--divider-line-row .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--divider-line-row .cov-group+.cov-group{margin-top:1.4rem;padding-top:1.4rem;border-top:1px solid var(--c-border)}
.cov-generic--divider-line-row .cov-group h3{font-size:var(--fs-md);margin:0 0 .8rem}
/* Was multi-column (columns:3). CSS columns balance items VERTICALLY, so a short
   list leaves whole columns empty - Dallas's 4 suburbs flowed 2+2+(empty) and left
   409px blank at 1440px (reported 2026-09-13). With suburbs now pruned to the
   3-8 that carry service pages, short lists are the norm. An auto-fit grid fills
   the row at any count: 4 suburbs = 4 cards across, 8 = two rows of 4. */
.cov-generic--divider-line-row .cov-list{columns:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.6rem 1.2rem}
.cov-generic--divider-line-row .cov-list li{margin:0;border-bottom:1px solid var(--c-border)}
.cov-generic--divider-line-row .cov-list li:last-child{border-bottom:0}
.cov-generic--divider-line-row .cov-list a{display:flex;align-items:center;gap:.5rem;padding:.65rem 0;width:100%}

/* boxed-grid-table: bordered container, spreadsheet-like internal cell dividers */
.cov-generic--boxed-grid-table{border:1px solid var(--c-border);border-radius:var(--radius-card);overflow:hidden}
.cov-generic--boxed-grid-table .cov-generic__head{display:flex;flex-wrap:wrap;align-items:center;gap:1rem 1.6rem;border-bottom:1px solid var(--c-border);padding:1.4rem 1.6rem;margin:0}
.cov-generic--boxed-grid-table .cov-generic__head p{margin:0;flex:1 1 220px;color:var(--c-muted)}
.cov-generic--boxed-grid-table .cov-generic__list{padding:0}
.cov-generic--boxed-grid-table .cov-group+.cov-group{border-top:1px solid var(--c-border)}
.cov-generic--boxed-grid-table .cov-group h3{margin:0;padding:.7rem 1.2rem;font-size:var(--fs-sm);text-transform:uppercase;letter-spacing:.05em;color:var(--c-muted);background:var(--c-surface-alt);border-bottom:1px solid var(--c-border)}
.cov-generic--boxed-grid-table .cov-list{columns:unset;display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.cov-generic--boxed-grid-table .cov-list li{margin:0;padding:.7rem 1.2rem;border-bottom:1px solid var(--c-border);border-right:1px solid var(--c-border)}
.cov-generic--boxed-grid-table .cov-list li:nth-child(3n){border-right:0}

/* ---- area card: a DIFFERENT card shape per areas variant ----
   The base .cov-list a above turns every area into a real card with a real
   hover. On its own that would make the "Where we work" section look the same
   on every site (user-reported immediately after, 2026-08-25: "3 sites looks
   similar, i dont find unique for this sections") - the same trap the
   serviceCard skins had. So the card is universal; its FRAMING is per-variant.
   Same division as everywhere else in this file: these rules must stay after
   the .cov-generic--* rules above to win on source order. */
/* framed-outline: drawn outline, no fill, hard corners */
.cov-generic--framed-outline .cov-list a{background:transparent;border-radius:0;box-shadow:none;
  border:1.5px solid color-mix(in srgb,var(--c-text) 20%,transparent)}
.cov-generic--framed-outline .cov-list a:hover{background:transparent;border-color:var(--c-primary);box-shadow:none}
/* shadow-stack: solid offset shadow, squared off - reads as a stack */
.cov-generic--shadow-stack .cov-list a{border-radius:0;box-shadow:4px 4px 0 var(--c-surface-alt)}
.cov-generic--shadow-stack .cov-list a:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 color-mix(in srgb,var(--c-primary) 35%,var(--c-surface-alt))}
/* quiet-editorial: no border or shadow at all - a soft tinted plate, and it
   keeps its own hidden icon, so the restraint that names it survives */
/* The chip stripped BOTH the base .cov-list a's border and its shadow, leaving
   only a --c-surface-alt fill - which measures 1.15:1 against this section's
   background on Newark, i.e. no visible chip at all. The label itself was
   fine (14.29:1); what was missing was the boundary, so the areas read as
   loose text floating in a vague grid rather than as a list of places.
   Reported as "each area are not properly visible".
   A hairline edge in a brand tint gives every chip a real outline on any
   theme without bringing back the shadow this skin deliberately drops - the
   quiet identity stays in the flat fill and the light 500 weight. */
.cov-generic--quiet-editorial .cov-list a{background:var(--c-surface-alt);
  border:1px solid color-mix(in srgb,var(--c-link) 80%,var(--c-border));
  box-shadow:none;border-radius:var(--radius-card);font-weight:500}
.cov-generic--quiet-editorial .cov-list a:hover{background:color-mix(in srgb,var(--c-primary) 10%,var(--c-surface-alt));border-color:var(--c-primary);transform:none;box-shadow:none}
/* glass-panel-grid: frosted translucent panel */
.cov-generic--glass-panel-grid .cov-list a{background:color-mix(in srgb,var(--c-surface) 58%,transparent);
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-color:color-mix(in srgb,#fff 20%,transparent)}
/* split-duotone: a thick brand bar down the leading edge of each card */
.cov-generic--split-duotone .cov-list a{border-radius:0 var(--radius-card) var(--radius-card) 0;
  border-left:4px solid color-mix(in srgb,var(--c-primary) 55%,transparent)}
.cov-generic--split-duotone .cov-list a:hover{border-left-color:var(--c-primary)}
/* stacked-two-row: compact card, brand accent on the underside */
.cov-generic--stacked-two-row .cov-list a{padding:.6rem .8rem;border-radius:calc(var(--radius-card) * .7);
  border-bottom:2px solid color-mix(in srgb,var(--c-primary) 30%,transparent)}
.cov-generic--stacked-two-row .cov-list a:hover{border-bottom-color:var(--c-primary)}
/* wide-spaced-grid: the airiest card - generous padding, hairline only */
.cov-generic--wide-spaced-grid .cov-list a{padding:1.1rem 1.2rem;box-shadow:none;
  border-color:color-mix(in srgb,var(--c-text) 12%,transparent)}
.cov-generic--wide-spaced-grid .cov-list a:hover{box-shadow:var(--shadow-sm)}
/* boxed-diagonal: square the base radius so it can't fight the clipped corner */
.cov-generic--boxed-diagonal .cov-list a{border-radius:0}
/* divider-line-row: converted to real cards too. Its own row-divider +
   column-rule lines are dropped here rather than kept ALONGSIDE the card - a
   bordered card sitting on a ruled row is a double frame, and the ruled row on
   its own was one of the "just looks plain text" cases being fixed. It stays
   distinct as the densest of the card variants: 3 tight columns, hard corners,
   no shadow, brand rule down the leading edge. */
.cov-generic--divider-line-row .cov-list{column-rule:none}
.cov-generic--divider-line-row .cov-list li{border-bottom:0;margin-bottom:0}
.cov-generic--divider-line-row .cov-list a{border-radius:0;box-shadow:none;padding:.6rem .85rem;width:100%;
  border-left:3px solid color-mix(in srgb,var(--c-primary) 45%,transparent)}
.cov-generic--divider-line-row .cov-list a:hover{border-left-color:var(--c-primary);transform:translateX(3px);box-shadow:none}
/* boxed-grid-table keeps its table: the CELL is the card - the table's own
   grid lines already draw every edge, so boxing a card inside each cell would
   be a double frame. It gets a full-cell fill-on-hover target instead, which
   is what it was actually missing. */
.cov-generic--boxed-grid-table .cov-list li{padding:0}
.cov-generic--boxed-grid-table .cov-list a{background:transparent;border:0;border-radius:0;box-shadow:none;padding:.75rem 1.2rem;width:100%}
.cov-generic--boxed-grid-table .cov-list a:hover{background:color-mix(in srgb,var(--c-primary) 9%,transparent);transform:none;box-shadow:none}

/* ---- cta band / closing CTA (structural, fixed shape) (17 keys) ---- */
/* ============================================================
   CTA band - generic structural keys (cta-band--generic .cta-band--KEY)
   17 keys. Base .cta-band (full-bleed var(--grad-brand), on-primary text,
   ::before decor pattern, centered h2/p/btns) still applies unless
   overridden below. "Loud" keys keep the gradient and layer framing/shape
   decoration on top; "quiet" keys flip to a flat surface/bg/transparent
   panel and restore h2/p/button colors to their normal page-context look.
   Any rule that REPLACES the ::before decor-pattern background (rather
   than disabling it via content:none) uses the two-class selector
   ".cta-band.cta-band--KEY::before" to match the specificity of the
   existing ".cta-band.decor-*::before" rules, so it wins regardless of
   which theme decor pattern is active on a given site. */

/* ---- boxed (loud): an inset bordered panel floating on the gradient ---- */
.cta-band--boxed .container{background:color-mix(in srgb,var(--c-primary) 20%,transparent);
  border:1px solid color-mix(in srgb,var(--c-on-primary) 28%,transparent);border-radius:var(--radius-lg);
  padding:clamp(2rem,5vw,3.2rem) clamp(1.5rem,4vw,2.8rem)}

/* ---- diagonal (loud): the whole band is clipped into a slanted parallelogram ---- */
/* clip-path removed 2026-08-27. It sliced the band's top and bottom edges
   into diagonals, so the PAGE BACKGROUND showed through the cut - a white
   wedge between the CTA and the footer, and another above it. Reported on
   Searcy: "remove the white shape divider between the cta and footer".
   This is the same defect class as the curved section dividers already
   retired: a shape that cuts a section's own edge always reveals whatever
   sits behind it, and the band cannot know what that is.
   The skin keeps its diagonal identity through the decor-diagonal-accents
   stripe pattern it already carries, which lives INSIDE the band. Do not
   reintroduce an edge clip here. */
.cta-band--diagonal{padding-block:clamp(4.5rem,10vw,7rem)}

/* ---- stacked-icon (loud): a decorative ring-and-dot badge stacks above the heading ---- */
.cta-band--stacked-icon .container::before{content:"";display:block;width:58px;height:58px;margin:0 auto 1.3rem;
  border-radius:50%;background:radial-gradient(circle at center,var(--c-on-primary) 0 6px,transparent 6px 100%);
  border:1.5px solid color-mix(in srgb,var(--c-on-primary) 45%,transparent)}

/* ---- minimal-line (quiet): centered copy under a short brand rule ---- */
/* NO CTA VARIANT MAY RENDER ON WHITE (standing rule, 2026-08-27: "i dont want
   any variant of CTA show white color"). Seven "quiet" skins used to flip the
   band to transparent / --c-bg / --c-surface, which is the page's own
   near-white - so the closing CTA, the single most important block on the
   page, read as unstyled empty space. Each of the seven now carries its own
   tinted background, deliberately DIFFERENT from the others so the skins stay
   distinguishable. All stay light, because the copy on top is --c-text /
   --c-muted; a dark or brand fill would require restyling every descendant
   (see the brand-colored-panel rule) and is not what these quiet skins are
   for. Reported on Brownsville (minimal-line).

   EVERY tint is --c-primary mixed into --c-surface-alt. Nothing else.
   The first pass reached for --c-accent on the far stop of the gradients to
   make the skins differ more, and that was wrong: --c-accent is the RAW
   accent, deliberately saturated and never shown as a surface anywhere else
   on the site (it only appears via --c-grad-band-end, already pushed through
   ensureContrast). Mixed into a background it introduces a hue the site does
   not otherwise have - measured: Loveland, a warm cream site, rendered a
   PINK/LAVENDER CTA band, and Toms River a cyan one. User-reported as a
   colour mismatch, 2026-08-27. Distinction between skins comes from tint
   STRENGTH and gradient GEOMETRY (vertical / diagonal / radial / flat / hard
   two-stop), never from a second hue. --c-surface-alt as the base is also
   what makes these resolve correctly on the DARK themes - it is a dark
   surface there, so the band tints dark rather than punching a white hole.
   This one also loses the two full-width hairlines that used to sandwich the
   copy: a tinted band declares its own edges, and full-width horizontal rules
   are banned. The "line" identity moves to the short centred brand rule above
   the heading - the same device quiet-editorial already uses. */
.cta-band--minimal-line{color:var(--c-text);
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--c-primary) 10%,var(--c-surface-alt)) 0%,
    color-mix(in srgb,var(--c-primary) 3%,var(--c-surface-alt)) 100%)}
.cta-band--minimal-line::before{content:none}
.cta-band--minimal-line h2{color:var(--c-text)}
.cta-band--minimal-line h2::before{content:"";display:block;width:52px;height:3px;
  margin:0 auto 1.1rem;background:var(--c-primary)}
.cta-band--minimal-line p{color:var(--c-muted)}
.cta-band--minimal-line .container{padding-block:clamp(2.2rem,5vw,3rem)}
.cta-band--minimal-line .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--minimal-line .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--minimal-line .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--minimal-line .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- framed-outline (quiet): no fill, a single rectangular border frame, airy padding ---- */
/* no-white rule (see minimal-line): was transparent. Corner-to-corner tint. */
.cta-band--framed-outline{color:var(--c-text);
  background:linear-gradient(135deg,
    color-mix(in srgb,var(--c-primary) 14%,var(--c-surface-alt)) 0%,
    var(--c-surface-alt) 58%,
    color-mix(in srgb,var(--c-primary) 6%,var(--c-surface-alt)) 100%)}
.cta-band--framed-outline::before{content:none}
.cta-band--framed-outline h2{color:var(--c-text)}
.cta-band--framed-outline p{color:var(--c-muted)}
.cta-band--framed-outline .container{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);
  padding:clamp(2.6rem,6vw,4rem) clamp(1.6rem,5vw,3rem)}
.cta-band--framed-outline .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--framed-outline .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--framed-outline .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--framed-outline .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- shadow-stack (quiet): a surface card floating on the page with 3 offset shadows ---- */
/* no-white rule (see minimal-line): was var(--c-bg), the page's own near-white,
   so a near-white card sat on a near-white band and the offset shadows were
   the only thing separating them. A flat tint gives the card something to
   sit ON. */
.cta-band--shadow-stack{color:var(--c-text);
  background:color-mix(in srgb,var(--c-primary) 12%,var(--c-surface-alt))}
.cta-band--shadow-stack::before{content:none}
.cta-band--shadow-stack h2{color:var(--c-text)}
.cta-band--shadow-stack p{color:var(--c-muted)}
.cta-band--shadow-stack .container{background:var(--c-surface);border:1px solid var(--c-border);
  border-radius:var(--radius-lg);padding:clamp(2.2rem,5vw,3rem);max-width:min(100%,860px);
  box-shadow:var(--shadow-sm),10px 10px 0 color-mix(in srgb,var(--c-border) 90%,transparent),
    20px 20px 0 color-mix(in srgb,var(--c-border) 55%,transparent)}
.cta-band--shadow-stack .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--shadow-stack .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--shadow-stack .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--shadow-stack .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- quiet-editorial (quiet): understated, left-aligned, text-forward, zero boxes ---- */
/* Was a flat var(--c-bg) - i.e. the page's own near-white - with ::before
   disabled, so the band had no colour of its own AND nothing occupying the
   space beside its left-aligned copy. Reported on Northbrook 2026-08-27:
   "too much white spaces fix it with bg gradiant, shape".
   Now a soft diagonal brand gradient plus one flat angular panel filling the
   right side where the copy does not reach. Both stay light because the copy
   is --c-text/--c-muted - contrast measured, not assumed. The shape is
   angular, never a curve (standing rule), and sits inside the band's own
   overflow:hidden so it cannot escape into a neighbouring section. */
.cta-band--quiet-editorial{color:var(--c-text);
  background:linear-gradient(118deg,
    color-mix(in srgb,var(--c-primary) 12%,var(--c-surface-alt)) 0%,
    var(--c-surface-alt) 52%,
    color-mix(in srgb,var(--c-primary) 5%,var(--c-surface-alt)) 100%)}
.cta-band--quiet-editorial::before{content:"";position:absolute;z-index:0;pointer-events:none;
  right:0;top:0;width:min(44%,540px);height:100%;
  background:color-mix(in srgb,var(--c-primary) 7%,transparent);
  clip-path:polygon(24% 0,100% 0,100% 100%,0 100%)}
.cta-band--quiet-editorial .container{position:relative;z-index:1}
.cta-band--quiet-editorial .container{text-align:left;max-width:min(100%,64ch)}
.cta-band--quiet-editorial h2{color:var(--c-text);position:relative;padding-top:1.2rem}
.cta-band--quiet-editorial h2::before{content:"";position:absolute;top:0;left:0;width:48px;height:3px;background:var(--c-primary)}
.cta-band--quiet-editorial p{color:var(--c-muted);margin-inline:0;max-width:60ch}
.cta-band--quiet-editorial .cta-band__btns{justify-content:flex-start}
.cta-band--quiet-editorial .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--quiet-editorial .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--quiet-editorial .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--quiet-editorial .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- glass-panel (quiet): frosted translucent panel with a border ---- */
/* no-white rule (see minimal-line): was var(--c-bg). This skin needed it most -
   a frosted panel over a flat near-white band has nothing to frost, so the
   blur and translucency were invisible and it rendered as a plain white box.
   The gradient is the strongest of the seven for exactly that reason. */
.cta-band--glass-panel{color:var(--c-text);
  background:linear-gradient(120deg,
    color-mix(in srgb,var(--c-primary) 24%,var(--c-surface-alt)) 0%,
    color-mix(in srgb,var(--c-primary) 10%,var(--c-surface-alt)) 100%)}
.cta-band--glass-panel::before{content:none}
.cta-band--glass-panel h2{color:var(--c-text)}
.cta-band--glass-panel p{color:var(--c-muted)}
.cta-band--glass-panel .container{background:color-mix(in srgb,var(--c-surface) 60%,transparent);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--c-border);
  border-radius:var(--radius-lg);padding:clamp(2.2rem,5vw,3.2rem);max-width:min(100%,860px)}
.cta-band--glass-panel .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--glass-panel .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--glass-panel .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--glass-panel .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- split-duotone (quiet): one uniform panel split into two halves by a divider line ---- */
/* The name promised a duotone split; the skin rendered a flat --c-surface.
   It now has one: two flat tones meeting on a crisp diagonal (a hard-stop
   gradient, so it reads as DIVIDED colour rather than a soft blend), plus one
   angular accent shape.
   Both tones stay light because the copy on top is --c-text / --c-muted, so
   contrast is unaffected - verified, not assumed. The shape is a flat
   parallelogram, never a curve (standing rule), and the band's own
   overflow:hidden clips it, so decoration can never escape into a neighbouring
   section the way an earlier divider did.
   z-index: .container is raised above ::after, which would otherwise paint over
   the heading - ::after is the element's last child and both are positioned. */
.cta-band--split-duotone{color:var(--c-text);
  background:linear-gradient(100deg,
    color-mix(in srgb,var(--c-primary) 16%,var(--c-surface-alt)) 0 46%,
    color-mix(in srgb,var(--c-primary) 5%,var(--c-surface-alt)) 46% 100%)}
.cta-band--split-duotone::before{content:none}
.cta-band--split-duotone::after{content:"";position:absolute;z-index:0;pointer-events:none;
  right:-3%;top:-20%;width:min(34%,380px);height:140%;
  background:color-mix(in srgb,var(--c-primary) 6%,transparent);
  clip-path:polygon(30% 0,100% 0,70% 100%,0 100%)}
.cta-band--split-duotone .container{position:relative;z-index:1}
/* The right column is sized to its CONTENT (auto), not a fixed .85fr share.
   A fixed share assumes every ctaStyle produces buttons of similar width, and
   they do not: oversized-bold renders them 278px + 315px = 609px, which did
   not fit the 465px the .85fr share gave it, so they wrapped to two rows. That
   pushed the band to 479px tall and left the vertically-centred heading
   floating alone in ~210px of slack with the divider running past it - the
   layout read as broken rather than as a split.
   auto lets the button row stay on ONE line whatever the ctaStyle, and
   minmax(0,1fr) lets the heading column absorb the remainder and shrink
   instead of overflowing. */
.cta-band--split-duotone .container{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;
  gap:clamp(2rem,4vw,3rem);text-align:left;padding-block:clamp(1rem,2vw,1.6rem)}
.cta-band--split-duotone h2{grid-column:1;grid-row:1/3;color:var(--c-text);margin:0;
  padding-right:clamp(1.5rem,3vw,2.4rem);border-right:1px solid var(--c-border)}
/* --c-muted is tuned against the flat page surfaces, not against this skin's
   tinted half with a decorative shape over it - it measured 4.2:1 there, under
   the 4.5 AA floor. A darker mix of --c-text restores it without making the
   sub-copy compete with the heading. */
.cta-band--split-duotone p{grid-column:2;grid-row:1;color:color-mix(in srgb,var(--c-text) 78%,var(--c-surface-alt));margin:0}
.cta-band--split-duotone .cta-band__btns{grid-column:2;grid-row:2;justify-content:flex-start;margin-top:1.1rem;flex-wrap:nowrap}
.cta-band--split-duotone .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--split-duotone .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--split-duotone .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--split-duotone .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- outline-only (quiet): no filled backgrounds, a pill-shaped double outline ring ---- */
/* no-white rule (see minimal-line): was transparent. A soft radial pool behind
   the pill, so the double outline reads as a ring on a surface. */
.cta-band--outline-only{color:var(--c-text);
  background:radial-gradient(120% 90% at 50% 0%,
    color-mix(in srgb,var(--c-primary) 15%,var(--c-surface-alt)) 0%,
    var(--c-surface-alt) 72%)}
.cta-band--outline-only::before{content:none}
.cta-band--outline-only h2{color:var(--c-text)}
.cta-band--outline-only p{color:var(--c-muted)}
.cta-band--outline-only .container{border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-pill);
  outline:1px solid color-mix(in srgb,var(--c-border) 55%,transparent);outline-offset:6px;
  padding:clamp(2.2rem,5vw,3rem) clamp(1.8rem,5vw,3.4rem);max-width:min(100%,760px);margin-inline:auto}
.cta-band--outline-only .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--outline-only .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--outline-only .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--outline-only .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- oversized-badge (loud): a large ring mark sits behind the heading ---- */
/* Was centred behind the copy, so the ring ran through the heading, text and
   buttons. Now it sits on the band's right edge, half off-canvas, clear of
   the centred copy; hidden below 900px where no edge room is left. */
.cta-band.cta-band--oversized-badge::before{inset:auto;top:50%;left:auto;right:0;
  width:clamp(220px,32vw,420px);height:clamp(220px,32vw,420px);transform:translate(50%,-50%);
  border-radius:50%;border:2px solid color-mix(in srgb,var(--c-on-primary) 22%,transparent);background:none}

/* ---- ribbon-corner (loud): a small triangular flag tucked in the top corner ---- */
.cta-band--ribbon-corner::after{content:"";position:absolute;top:0;right:0;width:0;height:0;
  border-style:solid;border-width:0 96px 96px 0;
  border-color:transparent color-mix(in srgb,var(--c-on-primary) 24%,transparent) transparent transparent}

/* ---- color-block (loud): a translucent panel on top of the band's own gradient ----
   Third and final root-cause fix, 2026-08-24 (the previous two - a fixed
   rem offset, then a top+bottom inset pair scaled off --section-y - both
   sized this box INDEPENDENTLY of the actual h2+p+buttons it's meant to
   frame, calculated purely from section padding). Any real business whose
   heading or lead paragraph wraps to a different number of lines than
   whatever was tested breaks that math - confirmed real: a 2-line-wrapped
   lead paragraph needed more height than the box's own independent
   calculation budgeted for, so the text overlapped/spilled past the
   border. Every OTHER boxed cta-band variant (framed-outline, shadow-stack,
   outline-only, ghost-frame, glass-panel) already avoids this whole bug
   class by putting the border/background/padding directly ON .container
   (the REAL element wrapping the actual content) instead of a separately
   positioned/sized decorative layer - .container's height is then just
   normal document flow around its own children, so it is IMPOSSIBLE for
   the box to be too short (or too tall) for whatever text it contains, at
   any viewport, in any language, at any length. color-block now follows
   that same established pattern - only difference from framed-outline is
   width (max-width narrower than the full content column, for its own
   distinct "focused panel" identity) and that the OUTER band keeps its
   full gradient (not transparent) with a translucent panel on top of it. */
.cta-band.cta-band--color-block::before{content:none}
.cta-band--color-block .container{max-width:min(680px,88%);
  background:color-mix(in srgb,var(--c-primary) 18%,transparent);
  border:2px solid color-mix(in srgb,var(--c-on-primary) 26%,transparent);border-radius:var(--radius-lg);
  padding:clamp(2.6rem,6vw,4rem) clamp(1.6rem,5vw,3rem)}

/* ---- wide-spaced (loud): default centered composition, just dramatically airier ---- */
.cta-band--wide-spaced{padding-block:clamp(5rem,11vw,8.5rem)}
.cta-band--wide-spaced h2{letter-spacing:.02em;max-width:22ch;margin-inline:auto}
.cta-band--wide-spaced p{margin-top:1.2rem}
.cta-band--wide-spaced .cta-band__btns{gap:1.6rem;margin-top:2.6rem}

/* ---- ledger-style (quiet): plain full-width rows divided by hairlines, no boxes, no shadows ---- */
/* no-white rule (see minimal-line): was var(--c-surface), the card near-white.
   Accent-leaning flat tint - the one accent-dominant fill of the seven, which
   is what keeps it distinct from shadow-stack's primary-leaning flat tint.
   The internal hairlines stay: they are the ledger ROWS, this skin's whole
   identity, not section dividers. */
.cta-band--ledger-style{color:var(--c-text);
  background:color-mix(in srgb,var(--c-primary) 7%,var(--c-surface-alt))}
/* Decoration: two FLAT angular blocks stacked into the right-hand corner,
   behind the button column - the side that used to be empty. Deliberately
   different geometry from the other decorated CTA skins so they never read as
   the same band: quiet-editorial has one right-side wedge, split-duotone a
   tilted parallelogram that bleeds past the top and bottom edges. This one is
   a nested corner step.
   Standing rules both respected: nothing curved, and both shapes sit INSIDE
   the band's own overflow:hidden, so decoration can never land on a
   neighbouring section's content the way the retired dividers did.
   The two-class selector on ::before is required to outrank the
   .cta-band.decor-<pattern>::before theme pattern rules. */
.cta-band.cta-band--ledger-style::before{content:"";position:absolute;z-index:0;pointer-events:none;
  right:0;top:0;height:100%;width:min(40%,480px);
  background:color-mix(in srgb,var(--c-primary) 8%,transparent);
  clip-path:polygon(34% 0,100% 0,100% 100%,0 100%)}
.cta-band--ledger-style::after{content:"";position:absolute;z-index:0;pointer-events:none;
  right:0;bottom:0;width:min(22%,260px);height:48%;
  background:color-mix(in srgb,var(--c-primary) 13%,transparent);
  clip-path:polygon(30% 0,100% 0,100% 100%,0 100%)}
/* TWO columns: copy left, actions right. Was three stacked FULL-WIDTH rows
   separated by hairlines, everything left-aligned - so on a 1178px container
   the heading left 693px empty, the sub-copy 620px, and the button row 842px,
   i.e. 71% of its own row. User-reported as huge blank space on the other
   side, 2026-08-27. Putting the buttons in a right-hand column gives that
   space something to hold instead of leaving it void.
   The full-width hairlines went with it: they are exactly the horizontal rules
   banned elsewhere, and they were what stretched each row edge-to-edge in the
   first place.
   Distinct from split-duotone, which also uses a 1fr/auto grid but stacks p AND
   the buttons in the right column behind a vertical divider, over a two-tone
   gradient - this one keeps its flat tint and puts all the copy on the left.
   Right column is auto-sized, never a fixed share: button width varies a lot by
   ctaStyle, and a fixed share wraps them onto two rows (learned on
   split-duotone). */
/* position/z-index lift the content above the two ::before/::after shapes,
   which are positioned and would otherwise paint over the copy. */
.cta-band--ledger-style .container{position:relative;z-index:1;
  display:grid;grid-template-columns:minmax(0,1fr) auto;
  column-gap:clamp(2rem,5vw,4rem);row-gap:.5rem;align-items:center;text-align:left}
.cta-band--ledger-style h2{grid-column:1;grid-row:1;color:var(--c-text);margin:0}
.cta-band--ledger-style p{grid-column:1;grid-row:2;color:var(--c-muted);margin:0;max-width:60ch}
.cta-band--ledger-style .cta-band__btns{grid-column:2;grid-row:1/3;justify-content:flex-end;
  margin-top:0;flex-wrap:nowrap}
.cta-band--ledger-style .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--ledger-style .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--ledger-style .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--ledger-style .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- ribbon-diagonal (loud): a wide diagonal stripe crosses through the band ---- */
.cta-band.cta-band--ribbon-diagonal::before{background:linear-gradient(18deg,
    transparent 0 38%,color-mix(in srgb,var(--c-primary) 20%,transparent) 38% 58%,transparent 58%)}

/* ---- ghost-frame (quiet): a faint duplicate outline peeks out from behind the real frame ---- */
/* no-white rule (see minimal-line): was transparent. Runs the opposite
   diagonal to framed-outline's so the two never read as the same skin. */
.cta-band--ghost-frame{color:var(--c-text);
  background:linear-gradient(60deg,
    color-mix(in srgb,var(--c-primary) 6%,var(--c-surface-alt)) 0%,
    var(--c-surface-alt) 55%,
    color-mix(in srgb,var(--c-primary) 16%,var(--c-surface-alt)) 100%)}
.cta-band--ghost-frame::before{content:none}
.cta-band--ghost-frame h2{color:var(--c-text)}
.cta-band--ghost-frame p{color:color-mix(in srgb,var(--c-muted) 45%,var(--c-text))}
.cta-band--ghost-frame .container{border:1px solid var(--c-border);border-radius:var(--radius-lg);
  padding:clamp(2.2rem,5vw,3.2rem) clamp(1.6rem,4vw,2.6rem);
  box-shadow:10px 10px 0 0 color-mix(in srgb,var(--c-border) 45%,transparent)}
.cta-band--ghost-frame .btn--primary{background:var(--grad-band);color:var(--c-on-primary)}
.cta-band--ghost-frame .btn--emergency{background:var(--c-emergency);color:var(--c-on-emergency)}
.cta-band--ghost-frame .btn--primary:hover{background:var(--grad-band);filter:brightness(1.1);color:var(--c-on-primary)}
.cta-band--ghost-frame .btn--emergency:hover{background:var(--c-emergency);filter:brightness(1.1);color:var(--c-on-emergency)}

/* ---- brandbar (skin-only, non-marquee) (16 keys) ---- */
/* ============================================================
   brandbar — skin-only section-layout axis
   16 new variants (existing: static, marquee-ltr, marquee-rtl, marquee-dual)
   ============================================================ */

/* ---- framed-outline: single airy frame around the whole block, chips are plain text ---- */
.brandbar.brandbar--framed-outline{background:var(--c-bg);padding-block:2rem}
.brandbar--framed-outline .container{border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:1.8rem 2.2rem;box-sizing:border-box}
.brandbar--framed-outline .brandbar__label{margin-bottom:1rem}
.brandbar--framed-outline .brandbar__row{display:flex;flex-wrap:wrap;gap:.7rem 1.6rem;justify-content:center;align-items:center}
.brandbar--framed-outline .brand-chip,.brandbar--framed-outline .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:transparent;border:0;box-shadow:none;border-radius:0;padding:.2rem 0;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--framed-outline .brand-chip__ico{color:var(--c-primary)}

/* ---- shadow-stack: layered offset box-shadows read as stacked cards ---- */
.brandbar.brandbar--shadow-stack{background:var(--c-bg)}
.brandbar--shadow-stack .brandbar__row{display:flex;flex-wrap:wrap;gap:1.2rem;justify-content:center;align-items:center}
.brandbar--shadow-stack .brand-chip,.brandbar--shadow-stack .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-lg);padding:.65rem 1.2rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text);box-shadow:4px 4px 0 0 var(--c-surface-alt),8px 8px 0 0 var(--c-border),var(--shadow-md);transition:transform .18s ease}
.brandbar--shadow-stack .brand-chip:hover,.brandbar--shadow-stack .rev-badge:hover{transform:translate(-2px,-2px)}
.brandbar--shadow-stack .brand-chip__ico{color:var(--c-primary)}

/* ---- alternating-tint: touching flat segments forming one continuous striped bar ---- */
.brandbar.brandbar--alternating-tint{padding-block:0}
.brandbar--alternating-tint .brandbar__row{display:flex;flex-wrap:wrap;gap:0;justify-content:center;align-items:stretch}
.brandbar--alternating-tint .brand-chip,.brandbar--alternating-tint .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:transparent;border:0;box-shadow:none;border-radius:0;padding:1rem 1.3rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--alternating-tint .brand-chip:nth-child(odd),.brandbar--alternating-tint .rev-badge:nth-child(odd){background:var(--c-surface-alt)}
.brandbar--alternating-tint .brand-chip__ico{color:var(--c-primary)}

/* ---- pill-tags: tight, primary-tinted tag pills in a loose wrap row ---- */
.brandbar--pill-tags .brandbar__row{display:flex;flex-wrap:wrap;gap:.55rem;justify-content:center;align-items:center}
.brandbar--pill-tags .brand-chip,.brandbar--pill-tags .rev-badge{display:inline-flex;align-items:center;gap:.35rem;background:color-mix(in srgb,var(--c-primary) 8%,var(--c-surface));border:1px solid color-mix(in srgb,var(--c-primary) 35%,var(--c-border));border-radius:var(--radius-pill);padding:.4rem .95rem;font-weight:700;font-size:var(--fs-xs);box-shadow:none;color:color-mix(in srgb,var(--c-link) 66%,var(--c-text))}
.brandbar--pill-tags .brand-chip__ico{color:var(--c-primary)}

/* ---- circle-badge-grid: icon in a prominent tint circle, label stacked below ---- */
.brandbar--circle-badge-grid .brandbar__row{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:1.5rem 1rem;justify-items:center;max-width:800px;margin-inline:auto}
.brandbar--circle-badge-grid .brand-chip,.brandbar--circle-badge-grid .rev-badge{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:.55rem;background:transparent;border:0;box-shadow:none;border-radius:0;padding:0;font-weight:700;font-size:var(--fs-xs);text-align:center;color:var(--c-text)}
.brandbar--circle-badge-grid .brand-chip__ico{width:46px;height:46px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}

/* ---- ledger-rows: 2-col grid of rows separated by hairline top borders.
   Was width:100% per chip in a flex-column (same bug as
   trustbar--ledger-rows/alternating-tint: a short brand name like
   "LiftMaster" stuck at the left of a 680px-wide row with nothing to fill
   the rest). ---- */

/* ---- quiet-editorial: text-forward, zero boxes, generous whitespace ---- */
.brandbar.brandbar--quiet-editorial{padding-block:2.4rem}
.brandbar--quiet-editorial .brandbar__label{font-family:var(--font-heading);font-style:italic;text-transform:none;letter-spacing:.02em;margin-bottom:1.3rem}
.brandbar--quiet-editorial .brandbar__row{display:flex;flex-wrap:wrap;gap:1.5rem 2.4rem;justify-content:center;align-items:center}
.brandbar--quiet-editorial .brand-chip,.brandbar--quiet-editorial .rev-badge{display:inline-flex;align-items:center;background:transparent;border:0;box-shadow:none;border-radius:0;padding:0;font-family:var(--font-body);font-weight:600;font-size:var(--fs-md);color:var(--c-muted)}
.brandbar--quiet-editorial .brand-chip__ico{display:none}

/* ---- boxed-diagonal: bordered box per item with a clipped top-right corner ---- */
.brandbar--boxed-diagonal .brandbar__row{display:flex;flex-wrap:wrap;gap:.9rem;justify-content:center;align-items:center}
.brandbar--boxed-diagonal .brand-chip,.brandbar--boxed-diagonal .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:0;box-shadow:none;padding:.65rem 1.3rem .65rem 1rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text);clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)}
.brandbar--boxed-diagonal .brand-chip__ico{color:var(--c-primary)}

/* ---- wide-spaced-grid: plain grid, no decoration, deliberately oversized gaps ---- */
/* One row, not auto-fit. auto-fit with a 140px minimum resolved to five
   columns here and dropped the sixth brand onto a row of its own - the
   same 5+1 orphan fixed on glass-panel-grid. The brand list is a fixed
   six; put them all on one line and let them share the width. */
/* SIX brands, laid out as an explicit column COUNT - never grid-auto-flow:column.
   auto-flow:column forces all six into one row and sizes them from
   grid-auto-columns:minmax(0,1fr), which is allowed to shrink BELOW the content
   width - so once the row is narrower than 6 x longest-chip the labels simply
   overlap each other. Measured on Daphne at 384px: the tracks resolved to
   "110px 110px 7px 7px 7px 7px" (auto-fit gave two real tracks, auto-flow then
   appended four 7px implicit ones) and SEVEN pairs of brand names overlapped.
   The @media rule that set grid-template-columns could never fix it, because
   auto-fit is inert while auto-flow is column.
   Counts are explicit and even at every width, per the standing brandbar rule
   (one line, or an even 3x2 - never a narrow stack, never a sideways scroller).
   The longest chip measures ~109px, so: 6-across needs ~782px of row, 3-across
   ~378px, 2-across ~234px. The breakpoints below sit clear of each. */
.brandbar--wide-spaced-grid .brandbar__row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2.2rem 1.6rem;justify-items:center;align-items:center;max-width:920px;margin-inline:auto}
.brandbar--wide-spaced-grid .brand-chip,.brandbar--wide-spaced-grid .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:transparent;border:0;box-shadow:none;border-radius:0;padding:.3rem 0;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--wide-spaced-grid .brand-chip__ico{color:var(--c-primary)}

/* ---- underline-accent-list: plain items, colored border-bottom accent instead of a box ---- */
.brandbar--underline-accent-list .brandbar__row{display:flex;flex-wrap:wrap;gap:1rem 1.7rem;justify-content:center;align-items:center}
.brandbar--underline-accent-list .brand-chip,.brandbar--underline-accent-list .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:transparent;border:0;border-bottom:2px solid var(--c-primary);box-shadow:none;border-radius:0;padding:.3rem .1rem .55rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--underline-accent-list .brand-chip__ico{color:var(--c-primary)}

/* ---- glass-panel-grid: frosted translucent panels in a grid ---- */
/* All brands on ONE row. auto-fit with a 150px minimum inside a 920px cap
   resolved to exactly 5 columns, so the 6th brand always dropped onto a row of
   its own with nothing beside it - reported 2026-08-25 on Irving: "for a
   single brand item dont need to go next row ... so all brand inline".
   grid-auto-flow:column puts every chip on a single row whatever the count,
   and grid-auto-columns:minmax(0,1fr) lets them share the width evenly and
   shrink rather than overflow. The cap is raised so six chips have room. */
/* align-items:stretch overrides the base .brandbar__row's align-items:center.
   Once the chips share a fixed column width, a longer label ("Wayne Dalton")
   wraps to two lines and gets taller than the rest - centred, that chip then
   sits 12px higher than its neighbours and the row looks misaligned. Stretch
   makes every chip the height of the tallest, so a wrap stays invisible. */
.brandbar--glass-panel-grid .brandbar__row{display:grid;grid-auto-flow:column;
  grid-auto-columns:minmax(0,1fr);gap:.7rem;max-width:1100px;margin-inline:auto;align-items:stretch}
.brandbar--glass-panel-grid .brand-chip,.brandbar--glass-panel-grid .rev-badge{display:flex;align-items:center;justify-content:center;gap:.4rem;background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--c-border);border-radius:var(--radius-card);box-shadow:none;padding:.8rem 1rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--glass-panel-grid .brand-chip__ico{color:var(--c-primary)}

/* ---- split-duotone: content splits into two columns via a structural vertical rule ---- */

/* ---- outline-only: every item individually bordered, no fill anywhere ---- */
.brandbar--outline-only .brandbar__row{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;align-items:center}
.brandbar--outline-only .brand-chip,.brandbar--outline-only .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:transparent;border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-pill);box-shadow:none;padding:.5rem 1.15rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--outline-only .brand-chip__ico{color:var(--c-text)}

/* ---- stacked-two-row: forced into exactly two rows via grid auto-flow ---- */
.brandbar--stacked-two-row .brandbar__row{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:max-content;gap:.7rem 1.1rem;justify-content:center;align-items:center}
.brandbar--stacked-two-row .brand-chip,.brandbar--stacked-two-row .rev-badge{display:inline-flex;align-items:center;gap:.4rem;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius-pill);box-shadow:var(--shadow-sm);padding:.5rem 1.05rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text);white-space:nowrap}
.brandbar--stacked-two-row .brand-chip__ico{color:var(--c-primary)}

/* ---- minimal-text-row: single-line, text-only, no chip shapes ---- */
.brandbar--minimal-text-row .brandbar__row{display:flex;flex-wrap:nowrap;gap:1.6rem;justify-content:center;align-items:center;overflow-x:auto}
.brandbar--minimal-text-row .brand-chip,.brandbar--minimal-text-row .rev-badge{display:inline-flex;align-items:center;background:transparent;border:0;box-shadow:none;border-radius:0;padding:0;font-weight:600;font-size:var(--fs-sm);color:var(--c-muted);white-space:nowrap;flex:none}
.brandbar--minimal-text-row .brand-chip__ico{display:none}

/* ---- divider-line-row: inline row, items separated by thin vertical rule lines ---- */
.brandbar--divider-line-row .brandbar__row{display:flex;flex-wrap:wrap;gap:0;justify-content:center;align-items:center}
.brandbar--divider-line-row .brand-chip,.brandbar--divider-line-row .rev-badge{display:inline-flex;align-items:center;gap:.4rem;position:relative;background:transparent;border:0;box-shadow:none;border-radius:0;padding:.3rem 1.3rem;font-weight:700;font-size:var(--fs-sm);color:var(--c-text)}
.brandbar--divider-line-row .brand-chip:not(:first-child)::before,.brandbar--divider-line-row .rev-badge:not(:first-child)::before{content:"";position:absolute;left:0;top:50%;width:1px;height:1.3em;background:var(--c-border);transform:translateY(-50%)}
.brandbar--divider-line-row .brand-chip__ico{color:var(--c-primary)}

/* ---- heroStats (skin-only, fixed shape) (18 keys) ---- */
/* ============================================================
   hero__stats — skin-only fixed-shape variants (18 new keys)
   Existing keys NOT duplicated here: cards, divided
   Shared base already applied via .hero__stats/.hstat/.hstat__ico
   (dark rgba(0,0,0,.3) panel, flex-wrap row, icon, bold number,
   label span) - each block below only adds/overrides deltas,
   same pattern as the existing --cards/--divided rulesets.
   ============================================================ */

/* FRAMED-OUTLINE: one outer frame around the whole block, dashed
   inner separators between items instead of individual boxes -
   airy padding, no per-item fill. */
.hero__stats--framed-outline{background:transparent;border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:var(--radius-lg);padding:1.7rem 1.9rem;gap:1.5rem 2.6rem}
.hero__stats--framed-outline .hstat{border-left:1px dashed color-mix(in srgb,currentColor 26%,transparent);padding-left:1.2rem;flex:1 1 140px}
.hero__stats--framed-outline .hstat:first-child{border-left:0;padding-left:0}

/* SHADOW-STACK: each item reads as a small stack of cards via
   layered offset shadows - no wrapper panel, the depth carries it. */
.hero__stats--shadow-stack{background:transparent;border:none;padding:0;gap:1.3rem 1.6rem}
.hero__stats--shadow-stack .hstat{background:rgba(0,0,0,.4);border-radius:var(--radius-card);padding:1.1rem 1.3rem;flex:1 1 150px;box-shadow:0 4px 0 rgba(0,0,0,.22),0 9px 0 rgba(0,0,0,.14),var(--shadow-md)}

/* ALTERNATING-TINT: a striped rhythm via nth-child. Uses currentColor
   mixes, never var(--c-surface-alt) - this sits on a dark photo
   overlay, not a light page background. */
.hero__stats--alternating-tint{gap:0;background:transparent;border:none;padding:0}
.hero__stats--alternating-tint .hstat{padding:.9rem 1.3rem;flex:1 1 140px}
.hero__stats--alternating-tint .hstat:nth-child(even){background:color-mix(in srgb,currentColor 11%,transparent)}
.hero__stats--alternating-tint .hstat:nth-child(odd){background:transparent}

/* PILL-TAGS: each stat collapses to a single rounded pill, icon +
   number + label inline, wrapping freely as a tag row. */
.hero__stats--pill-tags{background:transparent;border:none;padding:0;gap:.7rem;align-items:center}
.hero__stats--pill-tags .hstat{flex-direction:row;align-items:center;gap:.5rem;background:rgba(0,0,0,.32);border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:var(--radius-pill);padding:.5rem 1.1rem .5rem .7rem}
.hero__stats--pill-tags .hstat__ico{margin-bottom:0;width:1rem;height:1rem;flex:none}
.hero__stats--pill-tags .hstat b{font-size:var(--fs-md)}
.hero__stats--pill-tags .hstat span{font-size:var(--fs-xs);opacity:.75}

/* CIRCLE-BADGE-GRID: a bigger, bordered circular badge per item with
   everything centered underneath - distinct from --cards' small
   left-aligned icon chip inside a bordered tile. */
.hero__stats--circle-badge-grid{gap:1.6rem 2rem}
.hero__stats--circle-badge-grid .hstat{align-items:center;text-align:center;flex:1 1 120px}
.hero__stats--circle-badge-grid .hstat__ico{width:3.1rem;height:3.1rem;padding:.8rem;box-sizing:border-box;border-radius:50%;background:color-mix(in srgb,currentColor 16%,transparent);border:1px solid color-mix(in srgb,currentColor 26%,transparent);margin-bottom:.7rem;opacity:1}

/* 'ledger-rows' was removed from SECTION_POOLS.heroStats entirely (see
   variation.js) - row-stacked stats measured 325px tall, 42% of the whole
   hero, in space-constrained above-the-fold real estate. Its CSS is
   deliberately not kept around as dead code (unlike trustbar/brandbar's
   own, still-active, ledger-rows rules further down - same name, different
   axis, not the same fix): a stray forced-variant test would otherwise
   render unstyled markup with no indication why.
*/

/* QUIET-EDITORIAL: no panel, no borders, no boxes - just generous
   space and restrained type, magazine-caption feel. */
.hero__stats--quiet-editorial{background:transparent;border:none;padding:.4rem 0;gap:2rem 3.4rem}
.hero__stats--quiet-editorial .hstat{gap:.3rem}
.hero__stats--quiet-editorial .hstat__ico{opacity:.55;margin-bottom:.6rem}
.hero__stats--quiet-editorial .hstat b{font-weight:700;font-size:clamp(1.3rem,2.6vw,1.7rem)}
.hero__stats--quiet-editorial .hstat span{opacity:.65}

/* BOXED-DIAGONAL: a bordered tile per item with one corner clipped
   away for an angular accent. */
.hero__stats--boxed-diagonal{gap:1.1rem}
.hero__stats--boxed-diagonal .hstat{border:1px solid color-mix(in srgb,currentColor 26%,transparent);background:color-mix(in srgb,currentColor 8%,transparent);padding:1.1rem 1.3rem 1.3rem 1.1rem;flex:1 1 140px;clip-path:polygon(0 0,100% 0,100% 100%,16px 100%,0 calc(100% - 16px))}

/* WIDE-SPACED-GRID: the same panel shape as the default, just
   noticeably roomier - spacing is the only decoration. */
.hero__stats--wide-spaced-grid{gap:2.2rem 3.6rem;padding:2rem 2.4rem}
.hero__stats--wide-spaced-grid .hstat{flex:1 1 160px}

/* UNDERLINE-ACCENT-LIST: plain wrapped list, each item gets its own
   accent-colored underline instead of a box. */
.hero__stats--underline-accent-list{background:transparent;border:none;padding:0;gap:1.4rem 2.6rem}
.hero__stats--underline-accent-list .hstat{border-bottom:2px solid var(--c-accent);padding-bottom:.6rem;flex:1 1 130px}

/* GLASS-PANEL-GRID: frosted per-item panels. Adapted from the shared
   glossary recipe (var(--c-surface) mix) to a currentColor mix
   instead - this hero sits on a dark photo overlay, not a light
   page background, so surface-toned glass would wash out the white
   stat text; currentColor keeps the same frosted-blur effect while
   staying legible (see hard contrast rule for this axis). */
.hero__stats--glass-panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;background:transparent;border:none;padding:0}
.hero__stats--glass-panel-grid .hstat{background:color-mix(in srgb,currentColor 10%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,currentColor 24%,transparent);border-radius:var(--radius-lg);padding:1.1rem 1.2rem}

/* SPLIT-DUOTONE: one structural divider line splits the whole block
   into two halves - a single center split, not a per-item rule. */
/* This many real stats (population/services/areas/diagnosis) only exist
   when the underlying data does - the count genuinely varies 2-4 per
   business, not always a clean even split. flex:1 1 45% in a wrapping row
   broke for 3 items: the divider line implies two matched halves, but the
   3rd item wrapped onto its own line below with nothing to visually pair
   it with - CSS grid's own column boundary stays coherent regardless of
   how many items land in the last row. */
.hero__stats--split-duotone{position:relative;background:transparent;border:none;padding:1.3rem 0;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2.6rem;row-gap:1.2rem}
.hero__stats--split-duotone::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:color-mix(in srgb,currentColor 26%,transparent)}

/* OUTLINE-ONLY: no wrapper panel at all, each item is its own thin
   outline box - border and text only, nothing filled. */
.hero__stats--outline-only{background:transparent;border:none;padding:0;gap:1rem 1.8rem}
.hero__stats--outline-only .hstat{border:1px solid color-mix(in srgb,currentColor 30%,transparent);border-radius:var(--radius-card);padding:.9rem 1.2rem;flex:1 1 130px;background:transparent}

/* STACKED-TWO-ROW: grid-auto-flow:column over exactly 2 explicit
   rows forces 2-4 items into a fixed two-row shape column-major,
   regardless of item count. */
/* grid-auto-flow:column with a rigid 2-row template put a 3rd item (a real,
   common count - not every business has all 4 possible stats) into a
   column of its own with the whole second row empty beside it. Plain
   row-flowing 2-column grid instead - a short trailing row reads as a
   normal "odd item count" grid, not a broken one. */
.hero__stats--stacked-two-row{display:grid;grid-template-columns:repeat(2,1fr);gap:.9rem 2.2rem;align-items:start;background:transparent;border:none;padding:0}
.hero__stats--stacked-two-row .hstat{border-top:1px solid color-mix(in srgb,currentColor 16%,transparent);padding-top:.6rem}

/* MINIMAL-TEXT-ROW: text-only single line, icon dropped entirely,
   numbers and labels run inline separated by generous margin. */
.hero__stats--minimal-text-row{background:transparent;border:none;padding:0;flex-wrap:wrap;gap:.6rem 0;align-items:baseline}
.hero__stats--minimal-text-row .hstat{flex-direction:row;align-items:baseline;gap:.4rem;flex:none;margin-right:2.2rem}
.hero__stats--minimal-text-row .hstat:last-child{margin-right:0}
.hero__stats--minimal-text-row .hstat__ico{display:none}
.hero__stats--minimal-text-row .hstat b{font-size:var(--fs-md)}
.hero__stats--minimal-text-row .hstat span{opacity:.7}

/* DIVIDER-LINE-ROW: framed top/bottom by hairlines, items separated
   by a thin absolute rule between them - no boxes, no per-item
   border (unlike --divided, which uses real borders in a nowrap
   scrolling row with enlarged numbers). */
.hero__stats--divider-line-row{background:transparent;border:none;border-top:1px solid color-mix(in srgb,currentColor 20%,transparent);border-bottom:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:0;padding:1rem 0;gap:0}
.hero__stats--divider-line-row .hstat{position:relative;padding:0 1.4rem;flex:1 1 120px}
.hero__stats--divider-line-row .hstat:first-child{padding-left:0}
.hero__stats--divider-line-row .hstat:last-child{padding-right:0}
.hero__stats--divider-line-row .hstat:not(:last-child)::after{content:"";position:absolute;right:0;top:0;bottom:0;width:1px;background:color-mix(in srgb,currentColor 20%,transparent)}

/* BOXED-GRID-TABLE: a real 2-column grid with collapsed internal
   rule lines and one outer frame - spreadsheet-like. Uses a
   collapsed-border technique (top+left only, cleared on the first
   row/column) so the grid works correctly at 2, 3, or 4 items. */
.hero__stats--boxed-grid-table{display:grid;grid-template-columns:repeat(2,1fr);gap:0;background:transparent;border:1px solid color-mix(in srgb,currentColor 26%,transparent);border-radius:var(--radius-lg);padding:0;overflow:hidden}
.hero__stats--boxed-grid-table .hstat{padding:1rem 1.2rem;border-top:1px solid color-mix(in srgb,currentColor 20%,transparent);border-left:1px solid color-mix(in srgb,currentColor 20%,transparent)}
.hero__stats--boxed-grid-table .hstat:nth-child(-n+2){border-top:none}
.hero__stats--boxed-grid-table .hstat:nth-child(odd){border-left:none}
/* VISIBLE + ALIGNED (user 2026-10-12, Georgetown): the panel was fully
   transparent over a busy hero photo, labels at 78% opacity were hard to
   read, and a wide 2x2 left each cell mostly empty. Now a tinted, blurred
   glass panel on dark heroes (solid surface elsewhere), all stats in ONE row
   on desktop (2x2 on tablets), centred cells, full-strength labels. */
.hero__stats--boxed-grid-table{background:var(--c-surface);box-shadow:0 18px 40px -22px rgba(0,0,0,.55)}
:is(.hero--fullbleed-dark,.hero--text-only-underline,.hero--diagnostic-panel) .hero__stats--boxed-grid-table{background:rgba(10,12,16,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-color:rgba(255,255,255,.22)}
@media (min-width:901px){
  .hero__stats--boxed-grid-table{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
  .hero__stats--boxed-grid-table .hstat{border-top:none!important;border-left:1px solid color-mix(in srgb,currentColor 20%,transparent)!important}
  .hero__stats--boxed-grid-table .hstat:first-child{border-left:none!important}
}
.hero__stats--boxed-grid-table .hstat{align-items:center;text-align:center;justify-content:center;padding:1.15rem 1rem;gap:.2rem}
.hero__stats--boxed-grid-table .hstat__ico{margin:0 0 .35rem}
.hero__stats--boxed-grid-table .hstat b{line-height:1.1}
.hero__stats--boxed-grid-table .hstat span{opacity:1;color:inherit;font-weight:500;line-height:1.35}

/* OVERSIZED-INDEX: a large translucent index numeral (CSS counter,
   01/02/03...) sits behind each item and dominates it; the real
   icon steps aside. z-index:-1 keeps the numeral behind the actual
   in-flow number/label text instead of painting over it. */
.hero__stats--oversized-index{counter-reset:hstat;gap:1.5rem 2.4rem;background:transparent;border:none;padding:0}
.hero__stats--oversized-index .hstat{position:relative;padding-left:0;counter-increment:hstat;flex:1 1 150px}
/* Index number sits ABOVE the value (was absolute behind it, and the 2-digit
   index at 3.2rem overran the 2.7rem gutter into the stat - Madison 2026-09-14). */
.hero__stats--oversized-index .hstat::before{content:counter(hstat,decimal-leading-zero);display:block;position:static;margin-bottom:.35rem;font-family:var(--font-heading);font-weight:800;font-size:clamp(1.1rem,2vw,1.4rem);line-height:1;letter-spacing:.04em;opacity:.45;pointer-events:none}
.hero__stats--oversized-index .hstat__ico{display:none}
/* Madison (the only oversized-index site), 2026-09-14: no 01-04 index at all,
   and a stronger overlay so the hero copy and stats read on the photo. Scoped
   with :has() so no other hero is affected. */
.hero__stats--oversized-index .hstat::before{content:none}
.hero:has(.hero__stats--oversized-index) .hero__bg::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(6,10,18,.7) 0%,rgba(6,10,18,.45) 45%,rgba(6,10,18,.12) 80%,rgba(6,10,18,0) 100%)}
/* The variant's own flat .6 layer (.hero--diagnostic-panel::before) stacked under the gradient above
   and buried the photo - Madison only uses the gradient. */
.hero--diagnostic-panel:has(.hero__stats--oversized-index)::before{background:transparent}
/* TALLER FULL-IMAGE HERO (user 2026-10-12, Georgetown 8903): the photo
   hero sized only to its content - 509px on a 900px-tall desktop, so the
   image read as a short banner. Now ~85% of the viewport (600-900px) with
   the content vertically centred; phones get a smaller floor. */
.hero--diagnostic-panel{min-height:clamp(600px,85svh,900px);display:flex;flex-direction:column;justify-content:center}
@media (max-width:720px){.hero--diagnostic-panel{min-height:clamp(520px,78svh,720px)}}
.hero:has(.hero__stats--oversized-index) .hero__bg{position:absolute}
.hero:has(.hero__stats--oversized-index) :is(h1,.hero__sub,.hero__badge,.hstat b,.hstat span){text-shadow:0 2px 12px rgba(0,0,0,.55)}
.hero__stats--oversized-index .hstat span{color:rgba(255,255,255,.88)}

/* ---- hero (skin-only reskins of the split-image grid) (12 keys) ---- */
/* ---- hero: tilted-frame - rotated polaroid-style photo with a thick surface-color mat border, no dark overlay, copy stays on normal page background ---- */
.hero--tilted-frame .hero__grid{grid-template-columns:1fr 1fr}
.hero--tilted-frame .hero__media{align-self:center;transform:rotate(-2.5deg);box-shadow:0 0 0 10px var(--c-surface),0 0 0 11px var(--c-border),var(--shadow-xl)}

/* ---- hero: soft-glow-edge - a blurred color-tinted halo behind the media via box-shadow (escapes the media's own overflow:hidden, no dark overlay) ---- */
.hero--soft-glow-edge .hero__grid{grid-template-columns:1.08fr .92fr}
.hero--soft-glow-edge .hero__media{border-radius:var(--radius-lg);box-shadow:0 0 50px 6px color-mix(in srgb,var(--c-primary) 32%,transparent),0 0 0 1px color-mix(in srgb,var(--c-border) 55%,transparent),var(--shadow-md)}

/* ---- hero: duotone-media - the photo itself is grayscale + primary-tinted via mix-blend-mode; stretched to match the copy column's height like a full editorial photo ---- */
.hero--duotone-media .hero__grid{grid-template-columns:1fr 1.08fr}
/* Same fix as split-image-right/left/left-banner-cta/color-block-split:
   cap the photo, not the stretched outer div. */
.hero--duotone-media .hero__media{align-self:stretch;aspect-ratio:auto;display:grid;place-items:center;overflow:hidden;border-radius:var(--radius-lg);box-shadow:var(--shadow-md);background:var(--c-surface-alt)}
.hero--duotone-media .hero__media img,.hero--duotone-media .hero__media .ph{filter:grayscale(1) contrast(1.08);height:clamp(360px,42vw,560px);max-height:100%;width:100%}
.hero--duotone-media .hero__media::after{background:color-mix(in srgb,var(--c-primary) 45%,transparent);mix-blend-mode:color}

/* ---- hero: bordered-card-media - flat (no rotation) multi-ring card mat around the photo, sharper radius than tilted-frame, lighter shadow ---- */
.hero--bordered-card-media .hero__grid{grid-template-columns:1.12fr .88fr}
.hero--bordered-card-media .hero__media{border-radius:var(--radius-card);box-shadow:0 0 0 9px var(--c-surface),0 0 0 10px var(--c-border),var(--shadow-sm)}

/* ---- hero: oversized-badge - the eyebrow badge becomes the dominant visual element (large pill, bold, roomy), media stays a normal simple card ---- */
.hero--oversized-badge .hero__grid{grid-template-columns:1.05fr .95fr}
.hero--oversized-badge .hero__badge{font-size:var(--fs-lg);font-weight:800;padding:.9rem 1.5rem;gap:.75rem;margin-bottom:1.6rem;box-shadow:var(--shadow-sm)}
.hero--oversized-badge .hero__badge .dot{width:12px;height:12px}
.hero--oversized-badge .hero__media{min-height:clamp(280px,32vw,420px)}

/* ---- hero: minimal-quiet - understated editorial treatment: no badge box, no media shadow/ring, generous gap, text-forward ---- */
.hero--minimal-quiet .hero__grid{grid-template-columns:1fr 1fr;gap:clamp(2.4rem,5.5vw,4.5rem)}
.hero--minimal-quiet .hero__media{align-self:center;border-radius:var(--radius-card);box-shadow:none}
.hero--minimal-quiet .hero__media::after{box-shadow:none}
.hero--minimal-quiet .hero__badge{background:transparent;border:none;padding:0;color:var(--c-muted)}
.hero--minimal-quiet .hero__badge .dot{background:var(--c-primary)}
.hero--minimal-quiet .hero__sub{max-width:58ch}

/* ---- hero: split-narrow - the media column is deliberately narrow, portrait-oriented photo ---- */
.hero--split-narrow .hero__grid{grid-template-columns:1.65fr .85fr}
.hero--split-narrow .hero__media{aspect-ratio:3/4;align-self:center;min-height:clamp(240px,26vw,380px)}

/* ---- hero: split-wide - the media column is deliberately wide/dominant, widescreen photo ---- */
.hero--split-wide .hero__grid{grid-template-columns:.82fr 1.18fr}
.hero--split-wide .hero__media{aspect-ratio:16/10;min-height:clamp(280px,34vw,440px)}

/* ---- hero: circle-accent-media - the photo is cropped into a circle with a soft primary-tint ring around it via box-shadow (ring escapes the circle's own overflow:hidden) ---- */
.hero--circle-accent-media .hero__grid{grid-template-columns:1.15fr .85fr;align-items:center}
.hero--circle-accent-media .hero__media{aspect-ratio:1/1;border-radius:50%;min-height:0;width:min(360px,100%);margin-inline:auto;align-self:center;box-shadow:0 0 0 12px color-mix(in srgb,var(--c-primary) 12%,transparent),var(--shadow-xl)}

/* ---- hero: layered-depth - stacked solid-color offset shadows behind the media suggest a stack of cards (no blur, hard offset layers) ---- */
.hero--layered-depth .hero__grid{grid-template-columns:1fr 1fr}
.hero--layered-depth .hero__media{box-shadow:10px 10px 0 var(--c-surface-alt),20px 20px 0 var(--c-border),var(--shadow-sm)}

/* ---- hero: edge-line-media - flat photo card, single colored accent line along one inner edge instead of a full frame ---- */
.hero--edge-line-media .hero__grid{grid-template-columns:1.06fr .94fr}
.hero--edge-line-media .hero__media{border-radius:var(--radius-card);box-shadow:inset 5px 0 0 var(--c-primary),var(--shadow-sm)}

/* ---- hero: color-pop-badge - the eyebrow badge flips to a solid primary fill (paired on-primary text/dot) for a strong color pop; small matching accent dot echoes it on the photo corner ---- */
.hero--color-pop-badge .hero__grid{grid-template-columns:1.04fr .96fr}
.hero--color-pop-badge .hero__badge{background:var(--c-primary);color:var(--c-on-primary);border-color:transparent;box-shadow:var(--shadow-sm)}
.hero--color-pop-badge .hero__badge .dot{background:var(--c-on-primary)}
.hero--color-pop-badge .hero__media{position:relative}
.hero--color-pop-badge .hero__media::before{content:"";position:absolute;top:14px;left:14px;width:14px;height:14px;border-radius:50%;background:var(--c-primary);box-shadow:0 0 0 4px color-mix(in srgb,var(--c-surface) 85%,transparent);z-index:2}

/* ---- serviceCard (skin-only) (9 keys) ---- */
/* ---- service cards: new skin-only layout variants ---- */

/* ('ledger-rows' serviceCard skin removed entirely 2026-08-25 - retired from
   POOLS.serviceCard at the user's request, and its CSS deleted rather than
   left dead, since the stylesheet is INLINED into every page of every site:
   an unrollable skin's rules would otherwise ship 1000 times over. The
   same-named variants on other axes are unaffected and still live.) */

/* ribbon-corner: a solid folded-ribbon triangle clipped into the card's top-right corner as a decorative accent */
.svc--ribbon-corner{position:relative;padding-top:2.1rem}
.svc--ribbon-corner::after{content:"";position:absolute;top:0;right:0;width:0;height:0;
  border-style:solid;border-width:0 44px 44px 0;border-color:transparent var(--c-primary) transparent transparent}

/* duotone-icon: a single clean tint-filled circle. NO second layer behind it.
   The skin originally stacked an offset outlined shape behind the icon (first
   a rounded square, then a matched circle). Both were rejected on Dana Point
   2026-08-27 - at this size an offset ring behind a filled circle reads as one
   badge printed twice out of register, not as a duotone mark, whatever shape
   it is. The offset layer is gone; do not reintroduce it.
   The skin keeps its "duotone" identity where it actually works - on the PHOTO
   (desaturated image under a multiply-blended brand gradient, plus the arched
   media radius further down) - not on a 52px badge. */
.svc--duotone-icon .svc__icon{position:relative;width:52px;height:52px;border-radius:50%;
  background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary)}

/* outline-only: zero fill anywhere — card and icon are both border-and-text only */
.svc--outline-only{background:none;box-shadow:none;border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
.svc--outline-only:hover{box-shadow:none;border-color:var(--c-primary)}
.svc--outline-only .svc__icon{background:none;border:1.5px solid var(--c-primary);color:var(--c-primary)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--outline-only{display:flex;flex-direction:column;height:100%}
.svc--outline-only .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}

/* shadow-stack: two solid offset shadows always visible behind the card, reading as a stack of cards */
.svc--shadow-stack{border:1px solid var(--c-border);
  box-shadow:6px 6px 0 var(--c-surface-alt),12px 12px 0 var(--c-border)}
.svc--shadow-stack:hover{transform:translate(-3px,-3px);
  box-shadow:9px 9px 0 var(--c-surface-alt),16px 16px 0 var(--c-border)}

/* minimal-quiet: the most restrained of the 20 card skins - but still a CARD.
   It used to undo every card property the base .svc sets (background:none,
   border:0, box-shadow:none) AND cancel the hover outright
   (:hover{transform:none;box-shadow:none}). Three of them side by side
   therefore rendered as three columns of plain text under three photos, with
   nothing marking where one card ended and the next began and no feedback on
   a card that is a full <a>. Reported 2026-08-25 on Albuquerque: "each card
   has no separation, no hover effect now so its looks as plain text".
   It keeps its quiet identity through a hairline edge and a flat surface
   instead of a heavy shadow, and the photo runs edge to edge under the card's
   own radius - restrained, but unmistakably bounded and interactive.
   Do not restore the cardless version: a serviceCard skin that renders no
   card is the same defect already retired from the services LAYOUT pool. */
.svc--minimal-quiet{background:var(--c-surface);border:1px solid var(--c-border);box-shadow:none;
  padding:0 0 1.5rem;border-radius:var(--radius-card)}
.svc--minimal-quiet:hover{transform:translateY(-3px);box-shadow:0 12px 28px -16px var(--shadow-tint);
  border-color:color-mix(in srgb,var(--c-primary) 45%,var(--c-border))}
.svc--minimal-quiet .svc__icon{display:none}
/* the photo is flush to the card edges, so only the copy carries the inset */
.svc--minimal-quiet h3{font-size:var(--fs-lg);font-weight:600;margin-bottom:.6rem;padding-inline:1.5rem}
.svc--minimal-quiet p{font-size:var(--fs-md);line-height:1.65;padding-inline:1.5rem}
.svc--minimal-quiet .svc__more{margin-inline:1.5rem}
.svc--minimal-quiet{display:flex;flex-direction:column;height:100%}
/* Long authored blurbs made quiet cards uneven towers: clamp to 3 lines, smaller body, link pinned to the card foot so every card in a row aligns. */
.svc--minimal-quiet p{font-size:var(--fs-sm);line-height:1.6;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}
.svc--minimal-quiet h3{line-height:1.25}
.svc--minimal-quiet .svc__more{margin-top:auto;padding-top:1rem}

/* boxed-diagonal: a bordered box with its bottom-right corner cut by clip-path, echoed by a small angular accent fill */
.svc--boxed-diagonal{position:relative;border:1.5px solid var(--c-border);border-radius:0;box-shadow:none;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 30px),calc(100% - 30px) 100%,0 100%);padding:1.7rem 1.7rem 2.1rem}
.svc--boxed-diagonal:hover{border-color:var(--c-primary);box-shadow:none}
.svc--boxed-diagonal::after{content:"";position:absolute;right:0;bottom:0;width:0;height:0;border-style:solid;
  border-width:0 0 30px 30px;border-color:transparent transparent color-mix(in srgb,var(--c-primary) 18%,transparent) transparent}
.svc--boxed-diagonal .svc__icon{border-radius:8px}
/* Uneven blurb lengths left Learn more at different heights: flex column, link pinned to the card foot. */
.svc--boxed-diagonal{display:flex;flex-direction:column;height:100%}
.svc--boxed-diagonal .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}

/* wide-spaced: the default composition, but with noticeably larger padding/whitespace and minimal decoration */
.svc--wide-spaced{padding:2.6rem 2.2rem;border:1px solid var(--c-border);box-shadow:none;border-radius:var(--radius-lg)}
.svc--wide-spaced:hover{box-shadow:var(--shadow-sm);transform:translateY(-2px)}
.svc--wide-spaced .svc__icon{width:44px;height:44px;margin-bottom:1.6rem;border-radius:12px;font-size:1.3rem}
.svc--wide-spaced h3{margin-bottom:.7rem}
.svc--wide-spaced p{line-height:1.7}

/* circle-icon: content centers around one large circular icon badge dominating the top of the card */
.svc--circle-icon{text-align:center;padding-top:2.2rem}
.svc--circle-icon .svc__icon{width:72px;height:72px;border-radius:50%;margin:0 auto 1.2rem;font-size:1.8rem}
.svc--circle-icon .svc__more{justify-content:center}

/* ---- service-card PHOTO (engine-wide, every layout + every skin) ----
   Explicit user request (2026-08-25): a service card always shows a real
   photo, not just an icon badge - on every services() layout variant
   (grid/bento/list/hcards/accordion/rows + the 6 generic skins) and every one
   of the 20 serviceCard skins. Markup comes from svcMedia() in
   components/index.js.

   The media block is INSET (inside the card's own padding), never bled to the
   card edge, ON PURPOSE: several skins decorate their own top/corner edges -
   .svc--gradient-top's ::before bar, .svc--ribbon-corner's ::after triangle,
   .svc--boxed-diagonal's clip-path corner, .svc-generic--boxed-diagonal's
   ::after wedge - and a full-bleed image would render straight over them.
   aspect-ratio + object-fit:cover means it never distorts and never needs a
   fixed height, so it survives every card width in every grid variant.

   These rules MUST stay after all .svc--*/.svc-row/.svc-hcard/.svc-acc/
   .svc-g rules above: the ledger-rows and svc-row overrides below are
   equal-specificity and win on source order only. */
/* Uniform services grid - one row holding ALL the services when there are 3
   or 4 of them, on every site (see the 'cols' calculation in services(),
   components/index.js). These override the base .svc-grid repeat(3,1fr)
   near the top of this file purely on source order, which means the two
   existing collapse breakpoints (1000px -> 2 across, 720px -> 1) have to be
   restated at the bottom of this block as well - otherwise these later rules
   out-rank them and every site stays 3/4-across on a phone. */
.svc-grid--cols-1{grid-template-columns:minmax(0,1fr)}
.svc-grid--cols-2{grid-template-columns:repeat(2,1fr)}
.svc-grid--cols-3{grid-template-columns:repeat(3,1fr)}
.svc-grid--cols-4{grid-template-columns:repeat(4,1fr)}

.svc__media,.svc-row__media,.svc-hcard__media,.svc-acc__media,.svc-g__media,.svc-zz__media{
  overflow:hidden;background:var(--c-surface-alt);flex-shrink:0}
.svc__media img,.svc__media .ph,.svc-row__media img,.svc-row__media .ph,
.svc-hcard__media img,.svc-hcard__media .ph,.svc-acc__media img,.svc-acc__media .ph,
.svc-g__media img,.svc-g__media .ph{width:100%;height:100%;object-fit:cover;display:block}
/* Card shapes: full-width photo above the icon/title stack. */
.svc__media{display:block;width:100%;aspect-ratio:16/10;border-radius:var(--radius-card);margin-bottom:1.15rem}
/* (per-skin crops/framing for all 20 serviceCard skins are further down, in
   the "per-SKIN photo treatment" block - the rules above are only the shared
   defaults those build on.) */
.svc--circle-icon{padding-top:1.7rem}
/* bento's wide feature cell is a centered flex column - keep the photo from
   being stretched or squeezed by justify-content:center. */
.bento-cell--lg .svc__media{flex:0 0 auto;aspect-ratio:21/9}
/* LIST rows: leading thumbnail, icon badge shrinks so both fit one line. */
.svc-row{grid-template-columns:auto auto 1fr auto}
.svc-row__media{width:76px;aspect-ratio:4/3;border-radius:calc(var(--radius-card) * .7)}
.svc-row__ic{width:36px;height:36px;border-radius:10px}
/* HCARDS: photo as a fixed left column ahead of the icon. */
.svc-hcard__media{flex:0 0 116px;aspect-ratio:4/3;border-radius:var(--radius-card)}
/* ACCORDION: thumbnail lives in the <summary>, so it shows whether or not the
   row is expanded - a photo only visible after a click isn't "always shown". */
.svc-acc__media{width:58px;aspect-ratio:4/3;border-radius:calc(var(--radius-card) * .7)}
/* GENERIC skins: full-width photo by default; the two non-column shapes
   (pill / zigzag row) get their own sizing below. */
.svc-g__media{display:block;width:100%;align-self:stretch;aspect-ratio:16/10;border-radius:var(--radius-card)}
.svc-generic--pill-tags .svc-g__media{width:42px;aspect-ratio:1;border-radius:50%;align-self:center}
.svc-generic--zigzag-offset .svc-g__media{flex:0 0 100px;width:100px;aspect-ratio:4/3;align-self:flex-start}
/* ---- per-SKIN photo treatment ----
   The services LAYOUT is locked to one grid for every site, so the
   serviceCard skin is now the ONLY thing that makes one site's service cards
   look different from another's (explicit user requirement, 2026-08-25:
   "card design can be different site to sites, dont show similar card but
   always show photo"). A single shared media style across all 20 skins would
   have worked against exactly that - it would flatten 20 distinct card
   designs into "the same photo card, 20 border styles". So the photo's own
   crop, radius, framing and placement is part of each skin's identity here.
   Every one of the 20 still shows a photo; no two show it the same way.

   Full-bleed treatments use negative margins equal to that skin's OWN
   padding - only applied to skins that keep .svc's base 1.7rem (icon-top,
   soft-rounded, glass). Any skin that overrides padding stays inset, because
   a hardcoded -1.7rem would not line up with its edges. */
/* photo runs edge-to-edge under the card's top corners, icon badge lifts onto it */
.svc--icon-top .svc__media{margin:-1.7rem -1.7rem 1.15rem;width:auto;border-radius:0;aspect-ratio:16/9}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--icon-top{display:flex;flex-direction:column;height:100%}
.svc--icon-top .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* borderless editorial row: a wide letterbox band, hard corners */
/* Was 21/9 - same thin-strip crop as minimal-quiet and list-dense (2026-09-13):
   measured on Longmont 284x122 and Arvada 267x114 on ordinary vertical cards.
   16/10 matches the base card media ratio. */
.svc--editorial-row .svc__media{aspect-ratio:16/10;border-radius:0}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--editorial-row{display:flex;flex-direction:column;height:100%}
.svc--editorial-row .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* heavy 2px card border, echoed as a frame around the photo */
.svc--bordered-badge .svc__media{aspect-ratio:4/3;border:2px solid var(--c-border);border-radius:var(--radius-card)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass, added 2026-09-14 when a site first used this skin). */
.svc--bordered-badge{display:flex;flex-direction:column;height:100%}
.svc--bordered-badge .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* dense card: short banner, tight rhythm */
/* Was 21/9 - same defect as minimal-quiet (2026-09-13): measured on Denver as a 216x92
   box on a 256px card, cropping the 16:9 service photos to a thin band. 16/10 matches
   the base card media ratio. */
.svc--list-dense .svc__media{aspect-ratio:16/10;margin-bottom:.85rem;border-radius:calc(var(--radius-card) * .8)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--list-dense{display:flex;flex-direction:column;height:100%}
.svc--list-dense .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* pillowy 26px card: photo bleeds out and carries the same big rounding */
.svc--soft-rounded .svc__media{margin:-1.7rem -1.7rem 1.1rem;width:auto;border-radius:26px 26px 0 0;aspect-ratio:3/2}
/* Uneven blurb lengths left Learn more at different heights: flex column, link pinned to the card foot. */
.svc--soft-rounded{display:flex;flex-direction:column;height:100%}
.svc--soft-rounded .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* text-first list: a thin photo rule, not a poster */
/* 21/9, not 32/9. The photo library is a fixed 1376x768 (1.79:1), so a 32/9
   (3.56:1) frame discarded HALF the image height under object-fit:cover -
   at a 353px card that rendered a 99px slit with subjects' heads cropped
   out. Reported on Manhattan Beach 2026-08-27 as an image ratio issue.
   21/9 keeps the wide banner this text-forward skin wants (it matches its
   siblings list-dense and editorial-row) while cutting the crop loss from
   50% to 23%. Never set a service-card frame wider than ~21/9: the source
   photos cannot fill it without losing the subject. */
.svc--text-list .svc__media{aspect-ratio:16/10;border-radius:0;margin-bottom:.9rem}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass, added 2026-09-14 when a site first used this skin). */
.svc--text-list{display:flex;flex-direction:column;height:100%}
.svc--text-list .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* brutalist: hard-edged photo, thick rule under it */
.svc--blocky-numbered .svc__media{aspect-ratio:3/2;border-radius:0;border-bottom:3px solid var(--c-text);margin-bottom:1rem}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--blocky-numbered{display:flex;flex-direction:column;height:100%}
.svc--blocky-numbered .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* spec sheet: small radius, hairline frame, technical feel */
.svc--spec-row .svc__media{aspect-ratio:4/3;border-radius:8px;border:1px solid var(--c-border)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--spec-row{display:flex;flex-direction:column;height:100%}
.svc--spec-row .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* frosted panel: photo bleeds to the glass edge, translucent hairline under it */
.svc--glass .svc__media{margin:-1.7rem -1.7rem 1.1rem;width:auto;border-radius:0;aspect-ratio:16/9;
  border-bottom:1px solid color-mix(in srgb,#fff 18%,transparent)}
/* gradient-top keeps the inset crop - its brand bar is the top-edge identity */
.svc--gradient-top .svc__media{aspect-ratio:16/10}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--gradient-top{display:flex;flex-direction:column;height:100%}
.svc--gradient-top .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* oversized index number reads against a square photo */
.svc--offset-number .svc__media{aspect-ratio:1/1;border-radius:var(--radius-card)}
/* Uneven blurb lengths left each card's Learn more at a different height: flex column at full height, link pinned to the card foot. */
.svc--offset-number{display:flex;flex-direction:column;height:100%}
.svc--offset-number .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* ribbon corner needs the top-right clear, so the photo sits low and square */
.svc--ribbon-corner .svc__media{aspect-ratio:3/2;border-radius:0}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--ribbon-corner{display:flex;flex-direction:column;height:100%}
.svc--ribbon-corner .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* duotone: the photo itself carries the brand tint, matching the icon mark */
.svc--duotone-icon .svc__media{position:relative;aspect-ratio:4/3;border-radius:50% 50% var(--radius-card) var(--radius-card)/18% 18% var(--radius-card) var(--radius-card)}
.svc--duotone-icon .svc__media img{filter:saturate(.4) contrast(1.05)}
.svc--duotone-icon .svc__media::after{content:"";position:absolute;inset:0;background:var(--grad-brand);opacity:.34;mix-blend-mode:multiply;pointer-events:none}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--duotone-icon{display:flex;flex-direction:column;height:100%}
.svc--duotone-icon .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* outline-only: nothing is filled anywhere, so the photo gets a drawn frame */
.svc--outline-only .svc__media{aspect-ratio:4/3;border-radius:0;
  border:1.5px solid color-mix(in srgb,var(--c-text) 22%,transparent);padding:0}
/* the card sits on stacked offset shadows - the photo repeats the motif */
.svc--shadow-stack .svc__media{aspect-ratio:3/2;border-radius:0;box-shadow:5px 5px 0 var(--c-surface-alt)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--shadow-stack{display:flex;flex-direction:column;height:100%}
.svc--shadow-stack .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* quiet editorial: widest, flattest crop of all 20 */
/* Same defect as text-list above: 3/1 threw away 40% of every photo. */
/* Was 21/9 (2026-09-13 user report on Albuquerque): on a 272px-wide card that is a
   272x117 strip, and object-fit:cover cropped the 16:9 service photos to a thin band -
   heads and doors cut off. 16/10 matches the base card media ratio and shows the
   whole subject. */
.svc--minimal-quiet .svc__media{aspect-ratio:16/10;border-radius:0;margin-bottom:1.4rem}
/* the photo is cut by the same diagonal that cuts the card */
.svc--boxed-diagonal .svc__media{aspect-ratio:3/2;border-radius:0;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%)}
/* airy card: large photo, matching generous spacing below */
.svc--wide-spaced .svc__media{aspect-ratio:3/2;margin-bottom:1.8rem;border-radius:var(--radius-card)}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--wide-spaced{display:flex;flex-direction:column;height:100%}
.svc--wide-spaced .svc__more{margin-top:auto;padding-top:1.1rem;align-self:flex-start}
/* centered circular composition - the photo is the circle, icon sits under it */
.svc--circle-icon .svc__media{width:min(160px,72%);aspect-ratio:1/1;border-radius:50%;margin:0 auto 1rem}
.svc--circle-icon .svc__icon{width:44px;height:44px;font-size:1.1rem;margin-bottom:1rem}
/* Learn more pinned to the card foot so it aligns across a row (all-variant pass). */
.svc--circle-icon{display:flex;flex-direction:column;height:100%}
.svc--circle-icon .svc__more{margin-top:auto;padding-top:1.1rem;align-self:center}

@media (max-width:1200px){
  /* 4 cards across needs real width - step to 3 before the shared 1000px
     collapse rather than jumping 4 -> 2 in one go. */
  .svc-grid--cols-4{grid-template-columns:repeat(3,1fr)}
}
@media (max-width:1000px){
  .svc-grid--cols-3,.svc-grid--cols-4{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:900px){
  .svc-hcard__media{flex-basis:96px}
}
@media (max-width:720px){
  .svc-grid--cols-2,.svc-grid--cols-3,.svc-grid--cols-4{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:560px){
  /* One line can't hold thumb + badge + copy + arrow at phone widths - the
     photo stays (it's the point of this change), the badge is what gives. */
  .svc-row{grid-template-columns:auto 1fr auto}
  .svc-row__ic{display:none}
  .svc-row__media{width:64px}
  .svc-hcard__media{flex-basis:84px}
  .svc-generic--zigzag-offset .svc-g__media{flex-basis:84px;width:84px}
}

/* ---- reviewCard (skin-only) (16 keys) ---- */
.rev--framed-outline{background:none;box-shadow:none;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);padding:2.2rem}

.rev--shadow-stack{border:1px solid var(--c-border);box-shadow:7px 7px 0 0 var(--c-surface-alt),14px 14px 0 0 var(--c-border)}
.rev--shadow-stack:hover{border-color:var(--c-border);box-shadow:7px 7px 0 0 var(--c-surface-alt),14px 14px 0 0 var(--c-border)}

.rev--avatar-card .rev__who{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem}
.rev--avatar-card .rev__who::before{content:"";width:2.3rem;height:2.3rem;border-radius:50%;flex:0 0 auto;background:color-mix(in srgb,var(--c-primary) 13%,transparent);border:1px solid color-mix(in srgb,var(--c-primary) 30%,transparent)}
.rev--avatar-card .rev__text{margin-bottom:1.3rem}

.rev--highlight-panel{background:var(--c-surface-alt);border:0;border-left:4px solid var(--c-primary);box-shadow:none}

.rev--compact-row{display:flex;align-items:center;gap:1.2rem;padding:1.1rem 1.5rem}
.rev--compact-row .rev__stars{margin-bottom:0;flex:0 0 auto;white-space:nowrap}
.rev--compact-row .rev__text{margin:0;flex:1 1 auto;font-size:var(--fs-sm)}
.rev--compact-row .rev__who{flex:0 0 auto;white-space:nowrap;border-left:1px solid var(--c-border);padding-left:1.1rem}

.rev--numbered-badge{padding-top:2.3rem}
.rev--numbered-badge::before{content:"\\201C";position:absolute;top:-.9rem;left:1.4rem;width:2.4rem;height:2.4rem;border-radius:50%;background:color-mix(in srgb,var(--c-primary) 13%,transparent);color:var(--c-primary);display:grid;place-items:center;font-family:var(--font-heading);font-size:1.3rem;font-weight:800;line-height:1;box-shadow:var(--shadow-sm)}

.rev--quiet-editorial{border:0;background:none;box-shadow:none;padding:2.4rem .2rem}
.rev--quiet-editorial .rev__stars{margin-bottom:1rem}
.rev--quiet-editorial .rev__text{font-family:var(--font-heading);font-size:var(--fs-lg);line-height:1.6;font-style:italic;font-weight:400}
.rev--quiet-editorial .rev__who{margin-top:.9rem;font-weight:400;color:var(--c-muted);text-transform:uppercase;letter-spacing:.06em;font-size:var(--fs-xs)}

.rev--boxed-diagonal{border:1px solid var(--c-border);box-shadow:none;clip-path:polygon(0 0,calc(100% - 28px) 0,100% 28px,100% 100%,0 100%)}

.rev--glass-panel{background:color-mix(in srgb,var(--c-surface) 60%,transparent);backdrop-filter:blur(10px);border:1px solid var(--c-border);box-shadow:var(--shadow-sm)}

.rev--split-duotone{display:grid;grid-template-columns:1fr 9rem;column-gap:1.4rem}
.rev--split-duotone .rev__stars{grid-column:1;grid-row:1;margin-bottom:.5rem}
.rev--split-duotone .rev__text{grid-column:1;grid-row:2;margin-bottom:0}
.rev--split-duotone .rev__who{grid-column:2;grid-row:1 / span 2;align-self:center;border-left:1px solid var(--c-border);padding-left:1.4rem;font-size:var(--fs-sm)}

.rev--outline-only{background:none;box-shadow:none;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
.rev--outline-only .rev__who{display:inline-block;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-pill);padding:.3rem .9rem;font-size:var(--fs-xs);font-weight:700;margin-top:.4rem;max-width:100%;overflow-wrap:break-word}

.rev--stacked-divide{border:0;background:none;box-shadow:none;padding:0;display:flex;flex-direction:column}
.rev--stacked-divide .rev__stars{padding:1.1rem 0;margin-bottom:0;border-bottom:1px solid var(--c-border)}
.rev--stacked-divide .rev__text{padding:1.1rem 0;margin:0;border-bottom:1px solid var(--c-border)}
.rev--stacked-divide .rev__who{padding:1.1rem 0 0}

.rev--minimal-text{border:0;background:none;box-shadow:none;padding:.9rem 0}
.rev--minimal-text .rev__stars{font-size:var(--fs-xs);margin-bottom:.35rem}
.rev--minimal-text .rev__text{font-size:var(--fs-sm);margin-bottom:.4rem;line-height:1.5}
.rev--minimal-text .rev__who{font-size:var(--fs-xs);font-weight:400;color:var(--c-muted)}

.rev--oversized-quote-mark{padding-top:3.4rem;overflow:hidden}
.rev--oversized-quote-mark::before{content:"\\201C";position:absolute;top:-.5rem;left:1rem;font-family:var(--font-heading);font-size:clamp(4rem,12vw,6rem);line-height:1;color:color-mix(in srgb,var(--c-primary) 16%,transparent);font-weight:800;pointer-events:none;z-index:0}
.rev--oversized-quote-mark .rev__stars,.rev--oversized-quote-mark .rev__text,.rev--oversized-quote-mark .rev__who{position:relative;z-index:1}

.rev--ribbon-corner{overflow:hidden}
.rev--ribbon-corner::after{content:"";position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 42px 42px 0;border-color:transparent var(--c-primary) transparent transparent}

.rev--color-block{padding:0;overflow:hidden}
.rev--color-block .rev__stars{background:var(--c-primary);color:var(--c-on-primary);margin:0;padding:.9rem 1.7rem}
.rev--color-block .rev__text{margin:1.1rem 0;padding:0 1.7rem}
.rev--color-block .rev__who{padding:0 1.7rem 1.7rem}

/* ---- gallery (skin-only, must set own grid-template-columns) (14 keys) ---- */
/* ---- gallery: new layout-axis variants (skins on top of the shared
   .gallery / .gallery figure / .gallery figcaption / .gallery img base) ---- */

/* grid-4: plain 4-up grid but the first photo spans 2x2 as a featured lead
   tile - distinct from the uniform, single-row .gallery--wide-strip. */
.gallery--grid-4{grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr}
.gallery--grid-4 figure:first-child{grid-column:span 2;grid-row:span 2}

/* grid-5: dense 5-up contact-sheet grid, square thumbnails, tight rhythm. */
.gallery--grid-5{grid-template-columns:repeat(5,1fr);gap:calc(var(--grid-gap) * .5)}
.gallery--grid-5 img,.gallery--grid-5 .ph{aspect-ratio:1/1}
.gallery--grid-5 figure figcaption{font-size:var(--fs-xs);padding:.3rem .6rem}

/* carousel-row: deliberate exception to the "own grid-template-columns" rule
   (per spec) - this is a horizontally scrolling flex row with native
   scroll-snap, not a CSS grid, so grid-template-columns would be meaningless
   here; display:flex replaces the base display:grid instead. */
/* ('stacked-list' removed 2026-08-25 - thumbnail-beside-caption put the photo
   at 14% of each tile, the sole outlier among 20 gallery variants. See
   POOLS.gallery in variation.js. The caption-specificity note it carried
   still applies to framed-outline/rounded-blob below: a figcaption override
   must include the figure element to beat the base .gallery figure
   figcaption rule, or position:static silently never applies.) */
/* framed-outline: no fill anywhere - just an airy border frame per item. */
.gallery--framed-outline{grid-template-columns:repeat(3,1fr)}
.gallery--framed-outline figure{background:transparent;box-shadow:none;border:1px solid color-mix(in srgb,var(--c-text) 22%,transparent);border-radius:var(--radius-lg);padding:.9rem}
.gallery--framed-outline figure img,.gallery--framed-outline figure .ph{border-radius:calc(var(--radius-lg) - .5rem)}
.gallery--framed-outline figure figcaption{position:static;background:transparent;backdrop-filter:none;color:var(--c-muted);font-weight:700;font-size:var(--fs-sm);padding:.6rem 0 0;border-radius:0;text-align:center}

/* shadow-stack: a soft ambient shadow plus two hard-edged offset "card"
   layers behind each figure, reading as stacked depth. box-shadow paints
   outside the element's own border box regardless of its overflow:hidden,
   so this needs no structural change to the figure at all. */
.gallery--shadow-stack{grid-template-columns:repeat(3,1fr);gap:2.2rem}
.gallery--shadow-stack figure{background:var(--c-surface);box-shadow:var(--shadow-md),9px 9px 0 0 var(--c-surface-alt),18px 18px 0 0 var(--c-border)}

/* duotone-overlay: the figure splits into two structural rows - photo, then
   a caption band separated off by a solid primary-colored rule line. */
.gallery--duotone-overlay{grid-template-columns:repeat(3,1fr)}
.gallery--duotone-overlay figure{display:grid;grid-template-rows:auto auto;background:var(--c-surface);box-shadow:var(--shadow-sm)}
.gallery--duotone-overlay figure figcaption{position:static;background:var(--c-surface);backdrop-filter:none;color:var(--c-text);border-top:3px solid var(--c-primary);border-radius:0;padding:.65rem .9rem;font-size:var(--fs-sm)}

/* rounded-blob: organic asymmetric-radius blob shape per photo, alternating
   orientation, no rectangular card frame around it. */
.gallery--rounded-blob{grid-template-columns:repeat(3,1fr);row-gap:2.2rem}
.gallery--rounded-blob figure{background:transparent;box-shadow:none;overflow:visible;border-radius:0;text-align:center}
.gallery--rounded-blob figure img,.gallery--rounded-blob figure .ph{aspect-ratio:1/1;border-radius:60% 40% 55% 45%/45% 55% 40% 60%;box-shadow:var(--shadow-md)}
.gallery--rounded-blob figure:nth-child(even) img,.gallery--rounded-blob figure:nth-child(even) .ph{border-radius:40% 60% 45% 55%/55% 45% 60% 40%}
.gallery--rounded-blob figure figcaption{position:static;background:transparent;backdrop-filter:none;color:var(--c-text);font-weight:700;font-size:var(--fs-sm);padding:.7rem 0 0;border-radius:0}

/* ribbon-corner: a diagonal numbered ribbon folded across the top-left
   corner of each photo (the figure's own overflow:hidden clips its ends
   flush with the card edges for the classic folded-ribbon look). */
.gallery--ribbon-corner{grid-template-columns:repeat(4,1fr);counter-reset:ribbon}
.gallery--ribbon-corner figure{position:relative;counter-increment:ribbon}
.gallery--ribbon-corner figure::before{content:counter(ribbon,decimal-leading-zero);position:absolute;top:.9rem;left:-2.3rem;width:8rem;padding:.3rem 0;background:var(--c-primary);color:var(--c-on-primary);font-family:var(--font-heading);font-weight:800;font-size:var(--fs-xs);letter-spacing:.05em;text-align:center;transform:rotate(-45deg);box-shadow:var(--shadow-sm);z-index:2}

/* minimal-gap: edge-to-edge tile wall, square corners, near-zero gap. */
.gallery--minimal-gap{grid-template-columns:repeat(4,1fr);gap:2px}
.gallery--minimal-gap figure{border-radius:0;box-shadow:none}
.gallery--minimal-gap figure figcaption{left:0;right:0;bottom:0;width:auto;text-align:center;border-radius:0}

/* wide-hero-strip: first photo runs full width as a wide hero band, the
   rest fall into a smaller row beneath it. */
.gallery--wide-hero-strip{grid-template-columns:repeat(4,1fr)}
.gallery--wide-hero-strip figure:first-child{grid-column:1/-1}
.gallery--wide-hero-strip figure:first-child img,.gallery--wide-hero-strip figure:first-child .ph{aspect-ratio:21/9}
.gallery--wide-hero-strip figure:first-child figcaption{font-size:var(--fs-md);padding:.5rem 1rem}

/* staggered-offset: even items drop down for a zigzag rhythm across the row. */
.gallery--staggered-offset{grid-template-columns:repeat(3,1fr);align-items:start}
.gallery--staggered-offset figure:nth-child(even){margin-top:2.6rem}

/* bordered-frame: ONE outer frame around the whole block with collapsed
   internal divider lines, spreadsheet-like - unlike framed-outline's airy
   per-item border, this is a single bordered panel. */
.gallery--bordered-frame{grid-template-columns:repeat(3,1fr);gap:0;border:2px solid var(--c-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--c-surface)}
.gallery--bordered-frame figure{border-radius:0;box-shadow:none;background:transparent;border-right:1px solid var(--c-border);border-bottom:1px solid var(--c-border)}

/* mosaic-mixed: two larger 2x2 tiles mixed with 1x1 tiles in dense auto-flow
   for an irregular mosaic wall. */
.gallery--mosaic-mixed{grid-template-columns:repeat(4,1fr);grid-auto-rows:110px;grid-auto-flow:dense}
.gallery--mosaic-mixed figure:nth-child(1),.gallery--mosaic-mixed figure:nth-child(4){grid-column:span 2;grid-row:span 2}
.gallery--mosaic-mixed img,.gallery--mosaic-mixed .ph{height:100%;aspect-ratio:auto}

/* ---- footer (skin-only) (14 keys) ---- */
/* ---- footer (skin-only): dark-split, boxed-panel, framed-outline,
   shadow-stack, ledger-rows, quiet-editorial, boxed-diagonal, wide-spaced,
   underline-accent, glass-panel, split-duotone, outline-only, stacked-two-row,
   minimal-text-row ---- */

/* dark-split: vertical divider splits brand block (left) from the link
   columns (right) - a real structural split, not a color change. */
/* The brand rail used to take a hard flex:0 0 42%, leaving 58% for the three
   link columns - which then inherited the base flex:1 1 220px;min-width:200px.
   At the 1100px container that is 638px for three columns each needing
   200px + 2.2rem of inner padding, so only two fitted and the third (COMPANY)
   wrapped onto a row of its own and stretched, with the whole right half of
   that row empty. Reported 2026-08-25 on Fort Lauderdale: "too much blank
   spaces". Same stranded-column failure as footer--split-duotone.
   The rail is now proportional and shrinkable, and the link columns get an
   explicit basis that adds up: 34% + 3x22% = 100%. gap is 0 here and
   box-sizing is border-box, so the inner padding is already inside those
   percentages and no gap subtraction is needed. */
.footer--dark-split .footer-grid{gap:0;padding-block:0}
.footer--dark-split .footer-grid>div:first-child{flex:0 1 34%;min-width:280px;padding:2.4rem 2.2rem 2.4rem 0;border-right:1px solid color-mix(in srgb,var(--c-on-secondary) 18%,transparent)}
.footer--dark-split .footer-grid>div:not(:first-child){flex:1 1 22%;min-width:150px;padding:2.4rem 0 2.4rem 2.2rem}
/* Under ~490px of container the 150px floor only fits two of the three link
   columns, so the third wrapped alone and stretched full width - measured at
   390px as 1x + 2x + 1x. Three columns never split evenly two-up, so the one
   arrangement with no orphan is a column each. */
@media (max-width:560px){
  .footer--dark-split .footer-grid>div:not(:first-child){flex:1 1 100%;min-width:0}
}

/* boxed-panel: the whole grid floats as one bordered/tinted panel. */
.footer--boxed-panel .footer-grid{padding:2.2rem 2rem;margin-block:1.6rem;background:color-mix(in srgb,var(--c-on-secondary) 6%,transparent);border:1px solid color-mix(in srgb,var(--c-on-secondary) 16%,transparent);border-radius:var(--radius-lg)}

/* framed-outline: no fill, just an airy border frame around each column. */
/* align-items:stretch is the point of this skin. The base .footer-grid uses
   align-items:flex-start, which sizes every column to its own content - fine
   when the columns are invisible, but this skin draws a VISIBLE frame around
   each one, and four boxes ending at four different depths reads as broken.
   Measured on Northbrook: 344 / 187 / 293 / 258px, a 157px spread.
   The frame is also lifted from 22% to 34% of --c-on-secondary: at 22% it
   measured 1.8:1 against the footer background, which is barely visible for
   the one element the whole skin is named after. */
.footer--framed-outline .footer-grid{gap:1.6rem;align-items:stretch}
.footer--framed-outline .footer-grid>div{border:1px solid color-mix(in srgb,var(--c-on-secondary) 34%,transparent);border-radius:var(--radius-card);padding:1.8rem 1.6rem}

/* shadow-stack: layered box-shadow depth per column, like stacked cards. */
.footer--shadow-stack .footer-grid{gap:2rem 1.8rem}
.footer--shadow-stack .footer-grid>div{background:color-mix(in srgb,var(--c-on-secondary) 6%,transparent);border-radius:var(--radius-card);padding:1.7rem 1.5rem;box-shadow:var(--shadow-sm),var(--shadow-md)}
.footer--shadow-stack .footer-grid>div:first-child{box-shadow:var(--shadow-sm),var(--shadow-md),var(--shadow-xl)}

/* ledger-rows: plain full-width rows, thin hairlines, no boxes or shadows. */
/* flex:0 0 auto is load-bearing. The base rule is
   .footer-grid>div{flex:1 1 220px}, written for the default ROW direction
   where 220px is a width. This skin flips .footer-grid to
   flex-direction:column, which makes 220px a HEIGHT floor on every row - and
   flex-grow:1 then shared the leftover space out on top of that. Measured on
   Denver: each link row was 220px tall around a 27px tall list, 193px of dead
   space per row, and the footer came to 1092px of which ~890px was empty.
   Any future footer skin that sets flex-direction:column must reset the base
   flex the same way (the mobile column skins already do it via flex:none). */

/* quiet-editorial: understated, generous whitespace, zero borders/boxes, text-forward. */
/* The brand column took flex:1.8 1 340px while the three link columns kept the
   base flex:1 1 220px;min-width:200px, and the row gap was 4rem. In an 1100px
   container that needs 340 + 3x220 + 3x64 = 1192px, so the last column
   (Company) wrapped onto a row of its own with the entire width empty beside
   it - the same stranded-column defect already fixed on split-duotone and
   dark-split. The 3.2rem/4rem gaps and 4rem block padding compounded it.
   Bases now add up at the real container width: 320 + 3x220 + 3x40 = 1100. */
.footer--quiet-editorial .footer-grid{gap:2.4rem 2.5rem;padding-block:3rem}
/* min-width has to sit well BELOW the basis or the columns wrap instead of
   compressing: with min-width:190px the four still overflowed a 917px
   container at a 981px viewport and Company stranded again (measured
   3x+1x). Low floors let flex shrink them to fit down to the breakpoint. */
.footer--quiet-editorial .footer-grid>div:first-child{flex:0 1 300px;min-width:240px}
.footer--quiet-editorial .footer-grid>div:not(:first-child){flex:1 1 190px;min-width:150px}
/* Below ~980px the four no longer fit on one line, so the brand drops to its
   own full-width row FIRST and the three link columns share the row under it,
   rather than letting one column strand. */
/* 1050, not 980: the container is the viewport minus its padding, so at a
   981px viewport it is only ~917px - narrower than the four columns need even
   after shrinking, and Company stranded again (measured 3x+1x). The
   breakpoint has to clear the widest viewport at which the row cannot fit,
   not the column total itself. */
@media (max-width:1050px){
  .footer--quiet-editorial .footer-grid>div:first-child{flex:1 1 100%;min-width:0}
  .footer--quiet-editorial .footer-grid>div:not(:first-child){flex:1 1 calc(33.333% - 1.7rem);min-width:0}
}
.footer--quiet-editorial .footer-grid h4{font-family:var(--font-heading);text-transform:none;letter-spacing:0;font-size:var(--fs-md);opacity:1;font-weight:600;margin-bottom:1.1rem}
.footer--quiet-editorial .footer-grid ul{gap:.8rem}
.footer--quiet-editorial .footer__legal{border-top:0;opacity:.65;padding-block:2rem}

/* boxed-diagonal: bordered box per column with one corner cut for an angular accent. */
/* Borders removed on request (2026-08-25, Colorado Springs: "remove this
   footer border"). They were a genuine defect, not just a taste call: each
   column carried a 1px border AND a clip-path slicing 22px off its own
   bottom-right corner, and a clip-path cuts straight through the border it
   is clipping - so every box's outline simply stopped mid-stroke along the
   diagonal. Footer columns are also naturally very unequal (measured here at
   389/178/310/248px), so four ragged bordered boxes of different heights read
   as misaligned even before the cut corners.
   The clip-path goes with the border: with no outline and no fill it shapes
   nothing visible, while still silently clipping anything that reaches the
   corner. Columns now sit on the footer's own background, which is what the
   unequal heights actually want. */
.footer--boxed-diagonal .footer-grid{gap:1.6rem 3rem}
.footer--boxed-diagonal .footer-grid>div{border:0;padding:0;clip-path:none}

/* wide-spaced: default column shape, noticeably larger gaps/padding, minimal decoration. */
.footer--wide-spaced .footer-grid{gap:3rem 5rem;padding-block:4.2rem}
.footer--wide-spaced .footer-grid h4{margin-bottom:1.3rem}
.footer--wide-spaced .footer-grid ul{gap:.75rem}

/* underline-accent: plain list, each item gets an emphasized border-bottom accent. */
.footer--underline-accent .footer-grid ul{gap:0}
.footer--underline-accent .footer-grid li{border-bottom:2px solid color-mix(in srgb,var(--c-on-secondary) 30%,transparent)}
.footer--underline-accent .footer-grid li a{display:block;padding:.6rem .05rem}

/* glass-panel: frosted translucent panel with internal pane dividers. */
.footer--glass-panel .footer-grid{padding:2.2rem 2rem;margin-block:1.4rem;background:color-mix(in srgb,var(--c-on-secondary) 8%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--c-on-secondary) 22%,transparent);border-radius:var(--radius-lg)}
.footer--glass-panel .footer-grid>div:not(:last-child){border-right:1px solid color-mix(in srgb,var(--c-on-secondary) 16%,transparent);padding-right:1.6rem}

/* split-duotone: brand forms a full-width top zone, link columns form the
   bottom zone below a horizontal divider - a structural split, not a color one. */
/* "split" is meant to be a real two-column split: a brand rail on one side,
   the link columns beside it. It previously forced the brand block to
   flex:1 1 100%, handing it an entire row of its own - and because that block
   only holds the name, tagline, address, phone and hours, its content fills
   roughly a third of the container while the other two thirds rendered as a
   large empty band above the columns. Reported 2026-08-25 on Albuquerque:
   "too much blank spaces, update this variant compact footer".
   The brand block is now a bounded rail the columns sit next to, so the row
   is actually filled, and the vertical rhythm is tightened to match. The
   divider moves from a full-width horizontal rule to the rail's inline edge,
   which is what makes the two halves read as a split rather than as two
   stacked bands. */
.footer--split-duotone .footer-grid{padding-block:2.1rem;gap:1.3rem 2.4rem}
.footer--split-duotone .footer-grid>div:first-child{flex:0 1 290px;min-width:230px;
  padding-inline-end:2.2rem;border-inline-end:1px solid color-mix(in srgb,var(--c-on-secondary) 20%,transparent)}
.footer--split-duotone .footer-grid>div:not(:first-child){flex:1 1 145px;min-width:135px}
/* footer--KEY sits ON .site-footer, so ".footer--split-duotone .site-footer"
   can never match - scope through .footer-grid instead (same class-on-the-
   element trap that hid the nav skins, see CLAUDE.md). */
.footer--split-duotone .footer-grid ul{gap:.42rem}
.footer--split-duotone .footer-grid h4{margin-bottom:.7rem}
/* Below ~900px the 290px rail plus three min-width columns no longer fit on
   one line, and the third column wraps onto a row of its own and stretches
   to the full container - measured at 768px as [290,169,169,705], i.e. a
   stranded full-width column with nothing beside it. That is the same dead-
   space failure this variant was being fixed for, so the rail drops to its
   own full-width row FIRST and the three columns share the row below it. */
@media (max-width:900px){
  .footer--split-duotone .footer-grid>div:first-child{flex:1 1 100%;padding-inline-end:0;border-inline-end:0;
    padding-bottom:1.2rem;border-bottom:1px solid color-mix(in srgb,var(--c-on-secondary) 20%,transparent)}
  /* Basis has to subtract its share of the gaps or three "33%" columns total
     more than 100% and one wraps: at 768px a flat 30% basis still overflowed
     by 4px and dropped the third column onto a stretched row of its own.
     gap here is 2.4rem, so two gaps spread over three columns is 1.6rem each. */
  .footer--split-duotone .footer-grid>div:not(:first-child){flex:1 1 calc(33.333% - 1.6rem);min-width:0}
}

/* outline-only: one continuous sharp-cornered frame with no fill, columns
   separated by internal border lines only. */
.footer--outline-only .footer-grid{gap:0;padding:0;border:1px solid color-mix(in srgb,var(--c-on-secondary) 24%,transparent)}
.footer--outline-only .footer-grid>div{padding:1.8rem 1.6rem}
.footer--outline-only .footer-grid>div:not(:last-child){border-right:1px solid color-mix(in srgb,var(--c-on-secondary) 24%,transparent)}

/* stacked-two-row: a strict 2-column grid, so 3-4 items always resolve to
   exactly two visual rows instead of one long row. */
/* FOUR columns on desktop, like every other footer skin. Standing rule from
   the user 2026-08-27: "footer always be with 4 columns in desktop".
   This was the only skin with an explicit 2-column grid - it laid the four
   groups out 2x2, so brand+Services sat on one row and Service Areas+Company
   dropped to a second. The key name is now a misnomer; it is kept because the
   design registry and every existing fingerprint reference it, and renaming
   would orphan them.
   Its identity moves from "two rows" to the hairline rule above each column,
   which is a motif that survives in a single row. */
.footer--stacked-two-row .footer-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2rem 2.6rem;padding-block:2.8rem}
.footer--stacked-two-row .footer-grid>div{min-width:0;padding-top:1.1rem;
  border-top:1px solid color-mix(in srgb,var(--c-on-secondary) 20%,transparent)}
/* 4 columns is the desktop rule; below ~1000px four link columns get too
   narrow for labels like "Garage Door Installation", so step down 4 -> 2 -> 1
   rather than letting them squeeze. */
@media (max-width:1000px){
  .footer--stacked-two-row .footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}

/* minimal-text-row: text-only, minimal decoration - labels go inline and
   each column's list flows as a single horizontal line instead of a stack. */

/* ---- responsive rules for the generated skin variants above ---- */

/* ---- services (structural) ---- */
@media (max-width:900px){
  .svc-generic--framed-outline{grid-template-columns:repeat(auto-fill,minmax(215px,1fr))}
  .svc-generic--shadow-stack{grid-template-columns:repeat(auto-fill,minmax(215px,1fr))}
  .svc-generic--circle-badge-grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
  .svc-generic--boxed-diagonal{grid-template-columns:repeat(auto-fill,minmax(205px,1fr))}
  .svc-generic--wide-spaced-grid{gap:calc(var(--grid-gap) * 1.3)}
  .svc-generic--glass-panel-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
}

@media (max-width:720px){
  .svc-generic--zigzag-offset .svc-g{width:100%}
  .svc-generic--zigzag-offset .svc-g:nth-child(even){margin-top:0}
  .svc-generic--ledger-rows .svc-g__body{grid-template-columns:minmax(0,1fr)}
  .svc-generic--ledger-rows .svc-g__body span{grid-column:1;text-align:left;border-left:0;padding-left:0}
  .svc-generic--wide-spaced-grid{gap:calc(var(--grid-gap) * 1.1)}
}

@media (max-width:640px){
  .svc-generic--zigzag-offset .svc-g,.svc-generic--zigzag-offset .svc-g:nth-child(even){flex-direction:row;align-self:stretch;text-align:left}
  .svc-generic--zigzag-offset .svc-g:nth-child(even) .svc-g__body{text-align:left}
  .svc-generic--pill-tags .svc-g{flex:1 1 100%}
}

@media (max-width:560px){
  .svc-generic--framed-outline,.svc-generic--shadow-stack,.svc-generic--circle-badge-grid,.svc-generic--boxed-diagonal,.svc-generic--wide-spaced-grid,.svc-generic--glass-panel-grid{grid-template-columns:minmax(0,1fr)}
  .svc-generic--framed-outline .svc-g{padding:1.5rem}
  .svc-generic--shadow-stack .svc-g{box-shadow:3px 3px 0 0 var(--c-surface-alt),6px 6px 0 0 var(--c-border),var(--shadow-sm)}
  .svc-generic--shadow-stack .svc-g:hover{transform:translate(-2px,-2px)}
  .svc-generic--circle-badge-grid .svc-g__ic{width:56px;height:56px}
  .svc-generic--boxed-diagonal .svc-g{clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,0 100%);padding:1.4rem}
  .svc-generic--boxed-diagonal .svc-g::after{width:18px;height:18px}
  .svc-generic--wide-spaced-grid{gap:1.6rem}
  .svc-generic--quiet-editorial{gap:1.6rem}
  .svc-generic--glass-panel-grid .svc-g{padding:1.3rem}
}

/* ---- why (structural) ---- */
@media (max-width:900px){
  .why-generic--wide-spaced-grid{gap:2.4rem 2rem}
}
@media (max-width:720px){
  .why-generic--wide-spaced-grid{grid-template-columns:minmax(0,1fr);gap:1.8rem}
}
@media (max-width:640px){
  .why-generic--framed-outline{grid-template-columns:minmax(0,1fr)}
  .why-generic--framed-outline .why-g__item{padding:1.6rem 1.5rem}
  .why-generic--shadow-stack{grid-template-columns:minmax(0,1fr);gap:2rem}
  .why-generic--shadow-stack .why-g__item::before{transform:translate(5px,5px)}
  .why-generic--shadow-stack .why-g__item::after{transform:translate(10px,10px)}
  .why-generic--circle-badge-grid{grid-template-columns:minmax(0,1fr);gap:2rem}
  .why-generic--circle-badge-grid .why-g__ic{width:52px;height:52px}
  .why-generic--boxed-diagonal{grid-template-columns:minmax(0,1fr)}
  .why-generic--glass-panel-grid{grid-template-columns:minmax(0,1fr)}
  .why-generic--split-duotone{grid-template-columns:minmax(0,1fr);row-gap:0}
  .why-generic--split-duotone .why-g__item:nth-child(odd){border-right:0;padding-right:0;border-bottom:1px solid var(--c-border);padding-bottom:1.4rem;margin-bottom:1.4rem}
  .why-generic--split-duotone .why-g__item:nth-child(even){padding-left:0}
  .why-generic--outline-only .why-g__item{flex:1 1 100%}
}
@media (max-width:560px){
}

/* ---- process (structural) ---- */
@media (max-width:1000px){
  .proc-generic--shadow-stack,.proc-generic--alternating-tint,.proc-generic--wide-spaced-grid,.proc-generic--compact-dense{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:900px){
  .proc-generic--wide-spaced-grid{gap:2rem 1.4rem}
}
@media (max-width:720px){
  .proc-generic--framed-outline,.proc-generic--circle-badge-grid,.proc-generic--boxed-diagonal,.proc-generic--glass-panel-grid,.proc-generic--oversized-index,.proc-generic--shadow-stack,.proc-generic--alternating-tint,.proc-generic--wide-spaced-grid,.proc-generic--compact-dense{grid-template-columns:minmax(0,1fr)}
  .proc-generic--framed-outline .proc-g__item{border-right:0}
  .proc-generic--framed-outline .proc-g__item:nth-child(n+3){border-bottom:1px solid color-mix(in srgb,var(--c-text) 22%,transparent)}
  .proc-generic--framed-outline .proc-g__item:last-child{border-bottom:0}
  .proc-generic--oversized-index .proc-g__item{grid-template-columns:auto 1fr}
  .proc-generic--wide-spaced-grid{gap:1.6rem}
  .proc-generic--shadow-stack .proc-g__item{box-shadow:4px 4px 0 -1px color-mix(in srgb,var(--c-primary) 9%,var(--c-surface)),8px 8px 0 -2px color-mix(in srgb,var(--c-primary) 6%,var(--c-surface)),var(--shadow-md)}
}
@media (max-width:640px){
  .proc-generic--circle-badge-grid{gap:1.6rem 1rem}
  .proc-generic--circle-badge-grid .proc-g__ic{width:52px;height:52px}
}
@media (max-width:560px){
  .proc-generic--framed-outline .proc-g__item{padding:1.5rem 1.3rem}
  .proc-generic--glass-panel-grid .proc-g__item{padding:1.3rem 1.1rem}
  .proc-generic--quiet-editorial{gap:1.7rem;grid-template-columns:minmax(0,1fr)}
  .proc-generic--boxed-diagonal .proc-g__item{padding:1.3rem 1.1rem}
  .proc-generic--oversized-index .proc-g__n{font-size:clamp(2rem,9vw,2.6rem)}
  .proc-generic--oversized-index .proc-g__item{column-gap:.8rem}
}

/* ---- stats (structural) ---- */
@media (max-width:900px){
  .stats-generic--shadow-stack{gap:1.8rem}
  .stats-generic--wide-spaced-grid{gap:clamp(1.8rem,6vw,2.8rem)}
}
@media (max-width:720px){
  /* same reasoning at phone size - 80px with a .95rem population figure left
     no gutter at all, so the badge grows a little and keeps its inline pad */
  .stats-generic--circle-badge-grid .stats-g__cell b{width:88px;height:88px;font-size:.95rem;padding:0 .6rem}
  .stats-generic--oversized-index .stats-g__cell::before{font-size:clamp(3.2rem,16vw,5rem)}
  .stats-generic--quiet-editorial{gap:1.6rem}
}
@media (max-width:640px){
  .stats-generic--framed-outline{grid-template-columns:repeat(2,1fr);gap:.9rem}
  .stats-generic--framed-outline .stats-g__cell{padding:1.4rem 1rem}
  .stats-generic--shadow-stack{grid-template-columns:minmax(0,1fr);padding:.2rem .6rem .6rem .2rem}
  .stats-generic--boxed-diagonal{grid-template-columns:repeat(2,1fr);gap:.9rem}
  .stats-generic--glass-panel-grid{grid-template-columns:repeat(2,1fr)}
  .stats-generic--ledger-rows .stats-g__cell{padding:.8rem 0}
  .stats-generic--ledger-rows .stats-g__cell b{font-size:var(--fs-md)}
  .stats-generic--underline-accent-list .stats-g__cell{padding:.7rem .1rem .9rem}
}
@media (max-width:560px){
  .stats-generic--framed-outline{grid-template-columns:minmax(0,1fr)}
  .stats-generic--shadow-stack .stats-g__cell{padding:1.3rem 1rem}
  .stats-generic--alternating-tint .stats-g__cell{padding:.9rem 1rem}
  .stats-generic--circle-badge-grid{grid-template-columns:repeat(2,1fr)}
  .stats-generic--boxed-diagonal{grid-template-columns:minmax(0,1fr)}
  .stats-generic--wide-spaced-grid{grid-template-columns:minmax(0,1fr);gap:1.8rem}
  .stats-generic--glass-panel-grid{grid-template-columns:minmax(0,1fr)}
  .stats-generic--oversized-index{grid-template-columns:repeat(2,1fr);gap:1.2rem}
  .stats-generic--compact-dense{grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:.4rem}
}

/* ---- trustbar (skin-only) ---- */
@media (max-width:900px){
  .trustbar--circle-badge-grid .container{grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}
  .trustbar--glass-panel-grid .container{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
  .trustbar--wide-spaced-grid .container{gap:1.6rem 1.4rem}
  .trustbar--outline-only .container{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
  .trustbar--boxed-grid-table .container{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
  .trustbar--minimal-text-row .container{gap:1.1rem}
}
@media (max-width:720px){
  .trustbar--quiet-editorial .container{flex-direction:column;align-items:flex-start;gap:1rem}
  .trustbar--quiet-editorial .trust-item{white-space:normal}
  .trustbar--divider-line-row .container{justify-content:flex-start}
  .trustbar--divider-line-row .trust-item{border-left:0;border-top:1px solid var(--c-border);padding:.7rem 0;width:100%}
  .trustbar--divider-line-row .trust-item:first-child{border-top:0}
  .trustbar--underline-accent-list .container{justify-content:flex-start;gap:1.2rem 1.6rem}
}
@media (max-width:640px){
  .trustbar--minimal-text-row .container{flex-wrap:wrap;overflow-x:visible;justify-content:flex-start;gap:.8rem 1.4rem}
  .trustbar--framed-outline .container{gap:.9rem}
  .trustbar--framed-outline .trust-item{padding:.9rem 1.1rem}
  .trustbar--shadow-stack .container{gap:1.3rem 1.2rem}
  .trustbar--shadow-stack .trust-item{padding:.75rem 1rem}
  .trustbar--boxed-diagonal .trust-item{padding:.85rem 1.05rem .85rem .9rem}
  .trustbar--wide-spaced-grid .container{gap:1.3rem 1.1rem;padding-block:1.6rem}
}
@media (max-width:560px){
  .trustbar--circle-badge-grid .container{grid-template-columns:repeat(2,1fr)}
  .trustbar--wide-spaced-grid .container{grid-template-columns:minmax(0,1fr)}
  .trustbar--glass-panel-grid .container{grid-template-columns:minmax(0,1fr)}
  .trustbar--outline-only .container{grid-template-columns:minmax(0,1fr)}
  .trustbar--boxed-grid-table .container{grid-template-columns:minmax(0,1fr)}
  .trustbar--pill-tags .container{gap:.5rem}
  .trustbar--circle-badge-grid .trust-item .ico{width:46px;height:46px;padding:11px}
}

/* ---- areas (structural, wraps existing directory list) ---- */
@media (max-width:900px){
  .cov-generic--quiet-editorial .cov-list{columns:2}
  .cov-generic--divider-line-row .cov-list{columns:auto;display:grid;grid-template-columns:repeat(2,1fr)}
}
@media (max-width:720px){
  .cov-generic--framed-outline{padding:1.4rem}
  .cov-generic--framed-outline .cov-group{padding:1.1rem 1.3rem}
  .cov-generic--underline-accent-list .cov-list{columns:1}
  .cov-generic--split-duotone .cov-generic__list{grid-template-columns:minmax(0,1fr)}
  .cov-generic--split-duotone .cov-group:first-child{border-right:0;border-bottom:1px solid var(--c-border);padding:0 0 1.6rem}
  .cov-generic--split-duotone .cov-group:last-child{padding:1.6rem 0 0}
  /* Pin to exactly 2 columns here rather than letting auto-fill decide - at
     phone widths minmax(190px,1fr) would collapse to a single column and
     make a 110-area index page enormously tall. The base rule already sets
     white-space:normal + min-width:0, which is what keeps a long real area
     name ("Avalon Park and the surrounding south side Chicago service area")
     from forcing the page wide: originally this variant was nowrap (safe
     only inside its old overflow-x:auto), and dropping the overflow here
     without releasing the nowrap produced 262px of real document overflow on
     Chicago at 390px. Both are handled in the base rule now. */
  .cov-generic--stacked-two-row .cov-list{grid-template-columns:repeat(2,1fr)}
  .cov-generic--boxed-grid-table .cov-list{grid-template-columns:repeat(2,1fr)}
  .cov-generic--boxed-grid-table .cov-list li:nth-child(3n){border-right:1px solid var(--c-border)}
  .cov-generic--boxed-grid-table .cov-list li:nth-child(2n){border-right:0}
  .cov-generic--glass-panel-grid .cov-generic__list{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:640px){
  .cov-generic--quiet-editorial .cov-list{columns:1}
  .cov-generic--divider-line-row .cov-list{columns:auto;display:grid;grid-template-columns:minmax(0,1fr);column-rule:none}
  .cov-generic--wide-spaced-grid .cov-generic__list{gap:1.6rem}
  .cov-generic--wide-spaced-grid .cov-list{gap:1rem 1.4rem}
}
@media (max-width:560px){
  .cov-generic--boxed-grid-table .cov-list{grid-template-columns:minmax(0,1fr)}
  .cov-generic--boxed-grid-table .cov-list li:nth-child(2n),.cov-generic--boxed-grid-table .cov-list li:nth-child(3n){border-right:0}
  .cov-generic--circle-badge-grid .cov-list{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
  .cov-generic--boxed-diagonal .cov-list{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .cov-generic--pill-tags .cov-list a{padding:.5rem .85rem}
  .cov-generic--shadow-stack .cov-generic__head{padding:1.3rem 1.4rem}
  .cov-generic--shadow-stack .cov-group{padding:1.2rem 1.3rem}
  .cov-generic--glass-panel-grid .cov-generic__head{padding:1.2rem 1.4rem}
  .cov-generic--glass-panel-grid .cov-group{padding:1.2rem 1.4rem}
  .cov-generic--outline-only .cov-generic__head{padding:1.2rem 1.4rem}
}

/* ---- cta band / closing CTA (structural, fixed shape) ---- */
/* ---- split-duotone: 2-col grid + vertical divider collapses to a single
   stacked column with a horizontal divider under the heading ---- */
@media (max-width:720px){
  .cta-band--split-duotone .container{display:block;padding-block:clamp(1rem,4vw,1.6rem)}
  .cta-band--split-duotone h2{border-right:0;border-bottom:1px solid var(--c-border);
    padding-right:0;padding-bottom:1.2rem;margin-bottom:1.2rem}
  .cta-band--split-duotone p{margin-bottom:.4rem}
  /* wrap: the desktop rule is nowrap, and two large buttons (~170 + 183px)
     overran a 289px column and clipped "Call" (Longview, 2026-10-12 sweep) */
  .cta-band--split-duotone .cta-band__btns{justify-content:center;margin-top:1.1rem;flex-wrap:wrap}
}
@media (max-width:560px){
  .cta-band--split-duotone .cta-band__btns{justify-content:center}
}
/* ---- ledger-style: copy-left / actions-right collapses to a single stacked
   column. 900px, not 720px: the right column holds a full button PAIR (two
   buttons side by side, ~336px measured), so it runs out of room well before
   a skin whose right column only holds a line of text. ---- */
@media (max-width:900px){
  .cta-band--ledger-style .container{display:block}
  .cta-band--ledger-style h2{margin-bottom:.5rem}
  .cta-band--ledger-style p{max-width:none;margin-bottom:1.2rem}
  .cta-band--ledger-style .cta-band__btns{justify-content:flex-start;flex-wrap:wrap;margin-top:0}
}

/* ---- diagonal: ease the slant + trim padding so the clipped corners never
   crowd the heading/buttons on short mobile viewports ---- */
@media (max-width:640px){
  .cta-band--diagonal{padding-block:clamp(3.4rem,12vw,4.5rem)}
}

/* ---- oversized-badge: the ring behind the heading is clamped down further
   so it never crowds the wrapped heading text on a narrow phone ---- */
@media (max-width:640px){
  .cta-band.cta-band--oversized-badge::before{content:none}
}
@media (max-width:900px){
  .cta-band.cta-band--oversized-badge::before{content:none}
}

/* ---- ribbon-corner: shrink the corner flag so it stays a small accent
   instead of crowding a narrow band ---- */
@media (max-width:640px){
  .cta-band--ribbon-corner::after{border-width:0 56px 56px 0}
}

/* ---- shadow-stack: trim the stacked offset shadows on small screens so
   they don't visually collide with the section edge ---- */
@media (max-width:560px){
  .cta-band--shadow-stack .container{padding:clamp(1.8rem,7vw,2.2rem);
    box-shadow:var(--shadow-sm),6px 6px 0 color-mix(in srgb,var(--c-border) 90%,transparent),
      12px 12px 0 color-mix(in srgb,var(--c-border) 55%,transparent)}
}

/* ---- ghost-frame: smaller offset on small screens to match the tighter
   container padding ---- */
@media (max-width:560px){
  .cta-band--ghost-frame .container{padding:clamp(1.8rem,7vw,2.2rem);
    box-shadow:6px 6px 0 0 color-mix(in srgb,var(--c-border) 45%,transparent)}
}

/* ---- wide-spaced: the deliberately oversized padding/gaps ease off on
   phones so the band doesn't dominate the whole viewport ---- */
@media (max-width:640px){
  .cta-band--wide-spaced{padding-block:clamp(3.4rem,14vw,4.5rem)}
  .cta-band--wide-spaced .cta-band__btns{gap:1rem;margin-top:1.8rem}
}

/* ---- boxed / framed-outline / glass-panel / outline-only: ease inset
   padding so the frame/panel content never feels cramped against a phone
   edge (widths already flex via the shared .container rules) ---- */
@media (max-width:560px){
  .cta-band--boxed .container{padding:clamp(1.6rem,7vw,2rem)}
  .cta-band--framed-outline .container{padding:clamp(1.8rem,7vw,2.2rem)}
  .cta-band--glass-panel .container{padding:clamp(1.6rem,7vw,2rem)}
  .cta-band--outline-only .container{padding:clamp(1.8rem,8vw,2.2rem) clamp(1.4rem,6vw,1.8rem)}
}

/* ---- quiet-editorial: keep the left-aligned kicker/heading readable at
   narrow widths without an oversized top offset ---- */
@media (max-width:640px){
  .cta-band--quiet-editorial h2{padding-top:1rem}
}

/* ---- brandbar (skin-only, non-marquee) ---- */
/* framed-outline */
@media (max-width:640px){.brandbar--framed-outline .container{padding:1.3rem 1.2rem}.brandbar--framed-outline .brandbar__row{gap:.6rem 1.1rem}}

/* shadow-stack */
@media (max-width:640px){.brandbar--shadow-stack .brandbar__row{gap:1rem}.brandbar--shadow-stack .brand-chip,.brandbar--shadow-stack .rev-badge{box-shadow:3px 3px 0 0 var(--c-surface-alt),6px 6px 0 0 var(--c-border),var(--shadow-sm)}}

/* alternating-tint */
@media (max-width:640px){.brandbar--alternating-tint .brandbar__row{flex-direction:column}.brandbar--alternating-tint .brand-chip,.brandbar--alternating-tint .rev-badge{width:100%;justify-content:center;box-sizing:border-box}}

/* pill-tags */
@media (max-width:560px){.brandbar--pill-tags .brandbar__row{gap:.45rem}.brandbar--pill-tags .brand-chip,.brandbar--pill-tags .rev-badge{padding:.35rem .8rem}}

/* circle-badge-grid */
@media (max-width:640px){.brandbar--circle-badge-grid .brandbar__row{grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:1.1rem .8rem}.brandbar--circle-badge-grid .brand-chip__ico{width:40px;height:40px}}

/* ledger-rows */

/* quiet-editorial */
@media (max-width:640px){.brandbar.brandbar--quiet-editorial{padding-block:1.8rem}.brandbar--quiet-editorial .brandbar__row{gap:1rem 1.5rem}.brandbar--quiet-editorial .brand-chip,.brandbar--quiet-editorial .rev-badge{font-size:var(--fs-sm)}}

/* boxed-diagonal */
@media (max-width:560px){.brandbar--boxed-diagonal .brand-chip,.brandbar--boxed-diagonal .rev-badge{padding:.55rem 1rem .55rem .8rem;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)}}

/* wide-spaced-grid */
@media (max-width:900px){.brandbar--wide-spaced-grid .brandbar__row{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:520px){.brandbar--wide-spaced-grid .brandbar__row{grid-template-columns:repeat(2,minmax(0,1fr));gap:1.3rem 1rem}}

/* underline-accent-list */
@media (max-width:560px){.brandbar--underline-accent-list .brandbar__row{gap:.8rem 1.2rem}}

/* glass-panel-grid */
/* One row is right on desktop but far too tight on a phone, so the flow goes
   back to rows below 820px. Fixed column counts (not auto-fit) on purpose:
   auto-fit is what produced the 5+1 orphan in the first place, and the brand
   list is a fixed six, which divides cleanly by both 3 and 2. */
@media (max-width:820px){
  .brandbar--glass-panel-grid .brandbar__row{grid-auto-flow:row;grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:520px){
  .brandbar--glass-panel-grid .brandbar__row{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}
  .brandbar--glass-panel-grid .brand-chip,.brandbar--glass-panel-grid .rev-badge{padding:.65rem .7rem}
}

/* split-duotone: hard requirement - collapse the two-column split to one column */

/* outline-only */
@media (max-width:560px){.brandbar--outline-only .brand-chip,.brandbar--outline-only .rev-badge{padding:.42rem .9rem}}

/* stacked-two-row: two-row column-flow overflows on narrow screens - fall back to a 2-col wrap grid */
@media (max-width:720px){.brandbar--stacked-two-row .brandbar__row{grid-auto-flow:row;grid-template-rows:none;grid-template-columns:repeat(2,1fr);justify-items:center;gap:.6rem}.brandbar--stacked-two-row .brand-chip,.brandbar--stacked-two-row .rev-badge{white-space:normal;text-align:center}}

/* minimal-text-row */
@media (max-width:560px){.brandbar--minimal-text-row .brandbar__row{flex-wrap:wrap;overflow-x:visible;gap:.7rem 1.2rem}}

/* divider-line-row: side rules read badly once items wrap - switch to stacked rows with a top rule */
@media (max-width:640px){.brandbar--divider-line-row .brandbar__row{flex-direction:column;align-items:stretch}.brandbar--divider-line-row .brand-chip,.brandbar--divider-line-row .rev-badge{justify-content:center;padding:.6rem .2rem}.brandbar--divider-line-row .brand-chip:not(:first-child)::before,.brandbar--divider-line-row .rev-badge:not(:first-child)::before{left:50%;top:0;width:70%;height:1px;transform:translateX(-50%)}}

/* ---- heroStats (skin-only, fixed shape) ---- */
@media (max-width:900px){
  .hero__stats--glass-panel-grid{grid-template-columns:repeat(auto-fit,minmax(115px,1fr))}
}

@media (max-width:720px){
  .hero__stats--wide-spaced-grid{gap:1.4rem 2rem;padding:1.4rem 1.6rem}
  .hero__stats--quiet-editorial{gap:1.4rem 2rem}
}

@media (max-width:640px){
  .hero__stats--framed-outline .hstat{border-left:0;padding-left:0;border-top:1px dashed color-mix(in srgb,currentColor 26%,transparent);padding-top:1rem}
  .hero__stats--framed-outline .hstat:first-child{border-top:0;padding-top:0}

  .hero__stats--split-duotone{grid-template-columns:minmax(0,1fr);padding:1rem 0;row-gap:0}
  .hero__stats--split-duotone::before{display:none}
  .hero__stats--split-duotone .hstat{padding:.9rem 0;border-top:1px solid color-mix(in srgb,currentColor 18%,transparent)}
  .hero__stats--split-duotone .hstat:first-child{border-top:0;padding-top:0}

  .hero__stats--stacked-two-row{grid-auto-flow:row;grid-template-rows:none;grid-template-columns:minmax(0,1fr)}

  .hero__stats--minimal-text-row{flex-wrap:wrap;overflow-x:visible}
  .hero__stats--minimal-text-row .hstat{margin-right:1.4rem}

  .hero__stats--divider-line-row{flex-direction:column}
  .hero__stats--divider-line-row .hstat{padding:.9rem 0}
  .hero__stats--divider-line-row .hstat:first-child{padding-top:0;padding-left:0}
  .hero__stats--divider-line-row .hstat:last-child{padding-bottom:0;padding-right:0}
  .hero__stats--divider-line-row .hstat:not(:last-child)::after{right:0;left:0;top:auto;bottom:0;width:auto;height:1px}

  /* Phone: 2x2, not a 4-row stack (457px tall at 375px) - compact, still
     roomy enough for "Georgetown residents" to wrap inside its cell. */
  .hero__stats--boxed-grid-table.hero__stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero__stats--boxed-grid-table.hero__stats .hstat{padding:.95rem .7rem}
}

@media (max-width:560px){
  .hero__stats--circle-badge-grid .hstat__ico{width:2.6rem;height:2.6rem;padding:.65rem}
  .hero__stats--oversized-index .hstat{padding-left:0}
  .hero__stats--oversized-index .hstat::before{content:none}
  .hero__stats--pill-tags .hstat{padding:.45rem .9rem .45rem .6rem}
}

/* ---- hero (skin-only reskins of the split-image grid) ---- */
/* Note: .hero__grid already collapses to a single column universally at
   max-width:1000px via the existing '.hero__grid{grid-template-columns:minmax(0,1fr)!important}'
   rule elsewhere in css.js (the !important beats any .hero--KEY .hero__grid
   desktop ratio regardless of source order/specificity) - these rules only
   tune decoration sizing so nothing looks oversized/cramped on small screens. */
@media (max-width:720px){
  .hero--tilted-frame .hero__media{transform:rotate(-1.2deg);box-shadow:0 0 0 7px var(--c-surface),0 0 0 8px var(--c-border),var(--shadow-md)}
  .hero--soft-glow-edge .hero__media{box-shadow:0 0 28px 3px color-mix(in srgb,var(--c-primary) 30%,transparent),0 0 0 1px color-mix(in srgb,var(--c-border) 55%,transparent),var(--shadow-sm)}
  .hero--bordered-card-media .hero__media{box-shadow:0 0 0 6px var(--c-surface),0 0 0 7px var(--c-border),var(--shadow-sm)}
  .hero--oversized-badge .hero__badge{font-size:var(--fs-md);padding:.7rem 1.1rem;gap:.6rem;margin-bottom:1.2rem}
  .hero--oversized-badge .hero__badge .dot{width:10px;height:10px}
  .hero--oversized-badge .hero__media{min-height:clamp(220px,52vw,320px)}
  .hero--minimal-quiet .hero__grid{gap:2rem}
  .hero--split-narrow .hero__media{aspect-ratio:4/3;min-height:clamp(220px,48vw,320px)}
  .hero--split-wide .hero__media{aspect-ratio:4/3;min-height:clamp(220px,55vw,340px)}
  .hero--circle-accent-media .hero__media{width:min(240px,68vw);box-shadow:0 0 0 8px color-mix(in srgb,var(--c-primary) 12%,transparent),var(--shadow-md)}
  .hero--layered-depth .hero__media{box-shadow:6px 6px 0 var(--c-surface-alt),12px 12px 0 var(--c-border),var(--shadow-sm)}
  .hero--edge-line-media .hero__media{box-shadow:inset 4px 0 0 var(--c-primary),var(--shadow-sm)}
  .hero--color-pop-badge .hero__media::before{top:10px;left:10px;width:12px;height:12px;box-shadow:0 0 0 3px color-mix(in srgb,var(--c-surface) 85%,transparent)}
}

/* ---- serviceCard (skin-only) ---- */
@media (max-width:900px){
  .svc--wide-spaced{padding:2rem 1.7rem}
}
@media (max-width:720px){
  .svc--shadow-stack{box-shadow:4px 4px 0 var(--c-surface-alt),8px 8px 0 var(--c-border)}
  .svc--shadow-stack:hover{box-shadow:6px 6px 0 var(--c-surface-alt),11px 11px 0 var(--c-border)}
}
@media (max-width:640px){
  /* keep the top flush so the photo still meets the card edge - only the
     bottom pad and the copy inset tighten up */
  .svc--minimal-quiet{padding:0 0 1.2rem}
  .svc--minimal-quiet h3{font-size:var(--fs-md);padding-inline:1.2rem}
  .svc--minimal-quiet p{padding-inline:1.2rem}
  .svc--minimal-quiet .svc__more{margin-inline:1.2rem}
  .svc--wide-spaced{padding:1.6rem 1.4rem}
  .svc--wide-spaced .svc__icon{margin-bottom:1.1rem}
  .svc--circle-icon{padding-top:1.8rem}
  .svc--circle-icon .svc__icon{width:60px;height:60px;font-size:1.5rem;margin-bottom:1rem}
}
@media (max-width:560px){
  .svc--ribbon-corner{padding-top:1.9rem}
  .svc--ribbon-corner::after{border-width:0 32px 32px 0}
  .svc--duotone-icon .svc__icon{width:44px;height:44px}
  .svc--boxed-diagonal{clip-path:polygon(0 0,100% 0,100% calc(100% - 20px),calc(100% - 20px) 100%,0 100%);padding-bottom:1.8rem}
  .svc--boxed-diagonal::after{border-width:0 0 20px 20px}
}

/* ---- reviewCard (skin-only) ---- */
@media (max-width:640px){
  .rev--compact-row{flex-direction:column;align-items:flex-start;gap:.6rem}
  .rev--compact-row .rev__who{border-left:0;padding-left:0;border-top:1px solid var(--c-border);padding-top:.6rem;width:100%}
  .rev--split-duotone{grid-template-columns:minmax(0,1fr)}
  .rev--split-duotone .rev__who{grid-column:1;grid-row:3;align-self:auto;border-left:0;border-top:1px solid var(--c-border);padding-left:0;padding-top:1rem;margin-top:.3rem}
}

/* ---- gallery (skin-only, must set own grid-template-columns) ---- */
@media (max-width:1000px){
  .gallery--grid-4{grid-template-columns:repeat(2,1fr)}
  .gallery--grid-5{grid-template-columns:repeat(3,1fr)}
  .gallery--framed-outline,.gallery--shadow-stack,.gallery--duotone-overlay,.gallery--rounded-blob,.gallery--staggered-offset,.gallery--bordered-frame{grid-template-columns:repeat(2,1fr)}
  .gallery--ribbon-corner,.gallery--minimal-gap,.gallery--wide-hero-strip{grid-template-columns:repeat(2,1fr)}
  .gallery--shadow-stack{gap:1.6rem}
  .gallery--mosaic-mixed{grid-template-columns:repeat(3,1fr);grid-auto-rows:96px}
}
@media (max-width:720px){
  .gallery--grid-4,.gallery--framed-outline,.gallery--shadow-stack,.gallery--duotone-overlay,.gallery--rounded-blob,.gallery--staggered-offset,.gallery--bordered-frame,.gallery--ribbon-corner,.gallery--wide-hero-strip{grid-template-columns:minmax(0,1fr)}
  .gallery--grid-4 figure:first-child,.gallery--mosaic-mixed figure:nth-child(1),.gallery--mosaic-mixed figure:nth-child(4){grid-column:span 1;grid-row:span 1}
  .gallery--grid-5,.gallery--minimal-gap{grid-template-columns:repeat(2,1fr)}
  .gallery--shadow-stack{gap:1.4rem}
  .gallery--staggered-offset figure:nth-child(even){margin-top:0}
  .gallery--mosaic-mixed{grid-template-columns:minmax(0,1fr);grid-auto-rows:auto}
  .gallery--mosaic-mixed img,.gallery--mosaic-mixed .ph{aspect-ratio:4/3;height:auto}
  .gallery--wide-hero-strip figure:first-child img,.gallery--wide-hero-strip figure:first-child .ph{aspect-ratio:16/9}
}
@media (max-width:560px){
  .gallery--ribbon-corner figure::before{width:6.4rem;left:-1.9rem;top:.7rem}
}

/* ---- footer (skin-only) ---- */
@media (max-width:900px){
  .footer--dark-split .footer-grid>div:first-child{flex:1 1 100%;min-width:0;border-right:0;border-bottom:1px solid color-mix(in srgb,var(--c-on-secondary) 18%,transparent);padding:2rem 0}
  .footer--dark-split .footer-grid>div:not(:first-child){padding:1.6rem 0 0}
}
@media (max-width:720px){
  .footer--boxed-panel .footer-grid,.footer--framed-outline .footer-grid,.footer--shadow-stack .footer-grid,.footer--quiet-editorial .footer-grid,.footer--boxed-diagonal .footer-grid,.footer--underline-accent .footer-grid,.footer--outline-only .footer-grid,.footer--glass-panel .footer-grid{flex-direction:column}
  .footer--boxed-panel .footer-grid>div,.footer--framed-outline .footer-grid>div,.footer--shadow-stack .footer-grid>div,.footer--quiet-editorial .footer-grid>div,.footer--boxed-diagonal .footer-grid>div,.footer--underline-accent .footer-grid>div,.footer--outline-only .footer-grid>div,.footer--glass-panel .footer-grid>div{flex:none;width:100%}
  .footer--boxed-panel .footer-grid>div:first-child,.footer--framed-outline .footer-grid>div:first-child,.footer--shadow-stack .footer-grid>div:first-child,.footer--quiet-editorial .footer-grid>div:first-child,.footer--boxed-diagonal .footer-grid>div:first-child,.footer--underline-accent .footer-grid>div:first-child,.footer--outline-only .footer-grid>div:first-child,.footer--glass-panel .footer-grid>div:first-child{flex:none;width:100%}
  .footer--boxed-panel .footer-grid{padding:1.8rem 1.5rem;margin-block:1.4rem}
  .footer--glass-panel .footer-grid{padding:1.8rem 1.6rem;margin-block:1.2rem}
  /* the mobile copy of the corner cut goes with the desktop one - see the
     boxed-diagonal note above; there is no border left for it to shape. */
  .footer--outline-only .footer-grid>div:not(:last-child){border-right:0;border-bottom:1px solid color-mix(in srgb,var(--c-on-secondary) 24%,transparent)}
  .footer--glass-panel .footer-grid>div:not(:last-child){border-right:0;border-bottom:1px solid color-mix(in srgb,var(--c-on-secondary) 16%,transparent);padding-right:0;padding-bottom:1.4rem}
}
@media (max-width:640px){
  .footer--wide-spaced .footer-grid{flex-direction:column;gap:1.8rem;padding-block:2.4rem}
  .footer--wide-spaced .footer-grid>div,.footer--wide-spaced .footer-grid>div:first-child{flex:none;width:100%}
  .footer--stacked-two-row .footer-grid{grid-template-columns:minmax(0,1fr);gap:1.4rem}
  /* Phone: 3-up is too cramped for link text like "Garage Door Installation",
     and 2-up strands the third column at half width with dead space beside
     it. Full-width rows each - the one arrangement with no orphan. The rail's
     border flip is already handled by the max-width:900px block above. */
  .footer--split-duotone .footer-grid>div:not(:first-child){flex:1 1 100%;min-width:0}
}
@media (max-width:560px){
}
${design.variants.containerWidth === 'full' ? FULL_WIDTH_CSS : ''}
`.trim());
}

export default generateCss;

