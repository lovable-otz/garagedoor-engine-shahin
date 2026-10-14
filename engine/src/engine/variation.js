/**
 * Variation Engine.
 *
 * The theme sets a coherent baseline. This module rolls per-business variations
 * on each design axis from the deterministic seed, weighted heavily toward the
 * theme's own defaults so the theme identity dominates but no two sites are
 * identical. It also permutes the homepage section order within safe bounds
 * (hero stays first; contact/cta anchor the end).
 *
 * Every value chosen here is renderer-supported (components/index.js + css.js).
 */

import { stream, subSeed } from '../util/hash.js';

/**
 * Alternate font pairings per theme. Each theme's own default pair is included
 * so the theme identity dominates, but same-theme businesses can diverge
 * typographically - a real uniqueness axis, not a color swap. All alternates
 * are chosen to stay on-brief for that theme's mood.
 */
export const FONT_ALTERNATES = {
  'modern-contractor': [
    ['"Barlow Semi Condensed", "Arial Narrow", sans-serif', 'Inter, system-ui, sans-serif'],
    ['"Archivo", system-ui, sans-serif', '"Public Sans", system-ui, sans-serif'],
    ['"Sora", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
  ],
  'premium-home-services': [
    ['"Fraunces", Georgia, serif', '"Inter", system-ui, sans-serif'],
    ['"Playfair Display", Georgia, serif', '"Source Sans 3", system-ui, sans-serif'],
    ['"Cormorant Garamond", serif', '"Nunito Sans", system-ui, sans-serif'],
  ],
  'bold-emergency': [
    ['"Archivo", "Arial Black", sans-serif', 'system-ui, sans-serif'],
    // 'Anton' removed engine-wide - flagged as reading too heavy/bold at
    // hero size. 'Archivo Black' keeps the same assertive, urgent weight
    // this theme wants without Anton's extreme ultra-condensed poster look.
    ['"Archivo Black", "Arial Black", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Saira Condensed", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
  ],
  'industrial-commercial': [
    ['"Saira Condensed", "Oswald", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
    ['"Oswald", sans-serif', '"Roboto", system-ui, sans-serif'],
    ['"Teko", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
  ],
  'local-neighborhood': [
    ['"Nunito", system-ui, sans-serif', '"Nunito Sans", system-ui, sans-serif'],
    ['"Baloo 2", system-ui, sans-serif', '"Karla", system-ui, sans-serif'],
    ['"Quicksand", system-ui, sans-serif', '"Source Sans 3", system-ui, sans-serif'],
  ],
  'minimal-professional': [
    ['"Space Grotesk", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"General Sans", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Manrope", system-ui, sans-serif', '"Manrope", system-ui, sans-serif'],
  ],
  'high-contrast-service': [
    ['"Sora", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Clash Display", "Space Grotesk", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Archivo Expanded", "Archivo", sans-serif', '"Public Sans", system-ui, sans-serif'],
  ],
  'family-owned-friendly': [
    ['"Bitter", Georgia, serif', '"Source Sans 3", system-ui, sans-serif'],
    ['"Zilla Slab", serif', '"Karla", system-ui, sans-serif'],
    ['"Fraunces", serif', '"Nunito Sans", system-ui, sans-serif'],
  ],
  'technical-expert': [
    ['"IBM Plex Sans", system-ui, sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
    ['"Space Grotesk", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
    ['"JetBrains Mono", monospace', '"Inter", system-ui, sans-serif'],
  ],
  'premium-dark': [
    ['"Cormorant Garamond", Georgia, serif', '"Inter", system-ui, sans-serif'],
    ['"Fraunces", serif', '"Manrope", system-ui, sans-serif'],
    ['"Prata", Georgia, serif', '"Inter", system-ui, sans-serif'],
  ],
  'bright-residential': [
    ['"Poppins", system-ui, sans-serif', '"Poppins", system-ui, sans-serif'],
    ['"Baloo 2", system-ui, sans-serif', '"Nunito Sans", system-ui, sans-serif'],
    ['"Fredoka", system-ui, sans-serif', '"Mulish", system-ui, sans-serif'],
  ],
  'contemporary-local': [
    ['"Clash Grotesk", "Space Grotesk", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Satoshi", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Sora", system-ui, sans-serif', '"Manrope", system-ui, sans-serif'],
  ],
  'editorial-broadsheet': [
    ['"Fraunces", "Playfair Display", Georgia, serif', '"Inter", system-ui, sans-serif'],
    ['"Playfair Display", Georgia, serif', '"Source Sans 3", system-ui, sans-serif'],
    ['"Prata", Georgia, serif', '"Karla", system-ui, sans-serif'],
  ],
  'bento-showcase': [
    ['"Space Grotesk", "Inter", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Sora", system-ui, sans-serif', '"Manrope", system-ui, sans-serif'],
    ['"General Sans", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
  ],
  'neo-brutalist-bold': [
    ['"Archivo", "Arial Black", sans-serif', '"Archivo", "Helvetica Neue", sans-serif'],
    ['"Space Grotesk", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
    // 'Anton' removed (see 'bold-emergency' above - same engine-wide fix).
    ['"Archivo Black", "Arial Black", sans-serif', '"Public Sans", system-ui, sans-serif'],
  ],
  'warm-artisan-eco': [
    ['"Bricolage Grotesque", "Segoe UI", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Fraunces", serif', '"Nunito Sans", system-ui, sans-serif'],
    ['"Quicksand", system-ui, sans-serif', '"Karla", system-ui, sans-serif'],
  ],
  'glass-nocturne': [
    ['"Sora", "Inter", sans-serif', '"Inter", system-ui, sans-serif'],
    ['"Space Grotesk", sans-serif', '"Manrope", system-ui, sans-serif'],
    ['"Manrope", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
  ],
  'retro-industrial-badge': [
    ['"Oswald", "Bebas Neue", Impact, sans-serif', '"Roboto Condensed", system-ui, sans-serif'],
    ['"Saira Condensed", sans-serif', '"Roboto Condensed", system-ui, sans-serif'],
    ['"Teko", sans-serif', '"IBM Plex Sans", system-ui, sans-serif'],
  ],
};

/**
 * Per-SECTION structural layout pools. Order of SECTION_AXES is the canonical
 * position order used everywhere the section variants are serialized (fingerprint
 * `sections` string) - keep it stable.
 */
/**
 * Page-wide container width axis (see selectVariants). FULL_WIDTH_SHARE is the
 * percentage of NEW sites that roll 'full'. Sites already in the design
 * registry before this axis existed are held at 'boxed' by batch.js.
 */
export const CONTAINER_WIDTHS = ['boxed', 'full'];
export const FULL_WIDTH_SHARE = 25;


export const SECTION_AXES = ['services', 'why', 'process', 'stats', 'trustbar', 'areas', 'cta', 'brandbar', 'heroStats', 'ctaBanner', 'faq', 'contentProse', 'rescom', 'reachSteps'];
// Shared vocabulary of "generic skin" keys: each renders through a SINGLE
// shared markup shape for its axis (see the matching GENERIC_*_KEYS branch in
// components/index.js) - visual variety comes entirely from CSS in css.js
// (search the key name, e.g. `--framed-outline`). This is what makes it safe
// to reach 20 real variants per axis without a bespoke JS branch per key.
/** Section layouts removed from their pools that pinned sites may still carry. */
// `use` = the replacements: the two full coverage designs (map + directory,
// directory panel + wide list), NOT another pill/chip skin - the chip skins
// strand a few short pills on one side of an empty row the same way.
const RETIRED_SECTION_VARIANTS = { areas: { banned: ['quiet-editorial'], use: ['map', 'directory'] } };

export const SECTION_POOLS = {
  // 'divided-band'/'numbered-compact' retired (2026-08-24, explicit user
  // complaint - "service card need to proper card design") - both were
  // self-documented as intentionally cardless ("unboxed, no card, no
  // border" / "no icons/cards"), and 'alternating-tint'/'circle-badge-grid'/
  // 'ledger-rows'/'quiet-editorial'/'wide-spaced-grid'/'underline-accent-list'
  // are bare icon+text rows with no border/background/shadow of their own -
  // none of them read as a "card". The remaining generic skins
  // (framed-outline/shadow-stack/pill-tags/zigzag-offset/boxed-diagonal/
  // glass-panel-grid) all have a real bordered or shadowed box. Do not
  // re-add any of the removed keys here without also giving them genuine
  // card styling in css.js first.
  // LOCKED to 'grid' (2026-08-25, explicit user request: "show service card
  // grid wise if 3/4 services show in a row for all sites in desktop") - the
  // services section is now the same uniform card grid on every one of the
  // 1000 sites, one row of 3 or 4 cards on desktop. Same treatment nav got
  // earlier, and for the same reason: a section the user wants CONSISTENT
  // across sites, not varied. Per-site variety for this section now comes
  // entirely from the 20 `serviceCard` SKINS (POOLS.serviceCard below), which
  // restyle the card itself - that axis is untouched.
  // The other layouts are still fully implemented in services()
  // (components/index.js) and still render in the section catalog - they are
  // just no longer rollable. To re-open, restore:
  //   ['grid', 'list', 'rows', 'bento', 'hcards', 'accordion',
  //    'framed-outline', 'shadow-stack', 'pill-tags', 'zigzag-offset',
  //    'boxed-diagonal', 'glass-panel-grid']
  services: ['grid'],
  // RETIRED 2026-08-25, same measured reason as trustbar above: each puts one
  // short feature per full-width 960-1160px row, stranding 519-656px of empty
  // space to the right of every item. Do not re-add.
  // 'accordion' retired (2026-08-25, explicit user instruction on Newark:
  // "why description collapses? ... dont use this collapses variant on any
  // other sites"). It rendered each reason as a native <details>/<summary>,
  // so all four descriptions were real content sitting at height 0 until
  // clicked - the section showed four bare headings and nothing else. This is
  // a "why choose us" block: the copy IS the section, and hiding it behind a
  // click also buries it for search. It additionally capped itself at
  // max-width:1024px inside a wider container.
  // NOTE: this removes 'accordion' from every ACTIVE pool - it was already
  // retired from services and process. A real FAQ accordion is a different
  // component (faq()), not this key, and is unaffected.
  // 'spotlight' retired 2026-08-30 (explicit user request: "this is not a
  // suitable variant, so dont use this variant anymore") - a 1fr/1fr split
  // gave ONE reason half the section and squeezed the other three into the
  // right column, leaving the lead cell mostly empty. Render branch and CSS
  // deleted too. Still a live key on the `stats` axis below - per-axis.
  why: ['cards', 'rows', 'stat-inline', 'bordered-list', 'icon-band', 'checklist',
    'framed-outline', 'shadow-stack', 'circle-badge-grid', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'split-duotone', 'outline-only'],
  // 'chat-bubbles' retired (2026-08-25, explicit user request: "how its works
  // chicago site variant not suitable for my any sites"). It rendered the four
  // steps as alternating left/right message bubbles - a messaging-app idiom
  // that reads as a chat transcript rather than a company's service process,
  // and it was the only process variant capped to a narrow 44rem column, so it
  // left large empty margins on a desktop page. Its markup branch, CSS and
  // GSAP preset were all removed with it. Do not re-add.
  // 'accordion' retired (2026-08-25, explicit user request: "phonix site How
  // it works section not suitable for my sites"). A process is a sequence you
  // read straight through - collapsing it behind four click-to-open rows hid
  // the actual explanation by default and made the section read as an FAQ,
  // which the site already has as its own section. Markup, CSS and its GSAP
  // preset removed with it. Do not re-add.
  // RETIRED 2026-08-25: both strand 322-482px of one-sided dead space per
  // step (measured), and both were ALSO the row-direction skins whose photo
  // had to be special-cased. Do not re-add.
  process: ['cards', 'timeline', 'horizontal', 'numbered-list', 'stacked-panel', 'dots-track',
    'framed-outline', 'shadow-stack', 'alternating-tint', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'oversized-index', 'compact-dense'],
  // 'bignum-list'/'alternating-tint'/'ledger-rows'/'underline-accent-list'
  // retired (2026-08-24, explicit user complaint - "why row wise for this
  // too much white spaces") - all 4 stack each stat as its own full-width
  // horizontal row instead of a compact grid, so 4 short stats end up
  // spanning far more page height than the content needs. The remaining
  // keys are all grid/wrap layouts that keep the 4 stats side by side.
  stats: ['band', 'cards', 'strip', 'spotlight', 'ticker', 'ring', 'columns',
    'framed-outline', 'shadow-stack', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'oversized-index', 'compact-dense'],
  // RETIRED 2026-08-25 (measured, not guessed): 'ledger-rows',
  // 'split-duotone', 'alternating-tint' and 'stacked-two-row' each stretch a
  // .trust-item to a ~580px box to hold a ~65px label like "Miami, FL",
  // leaving 390-460px of dead space on ONE side of every item. Measured in
  // the section catalog by comparing each item's ink extent against its box:
  // left gap ~30-47px vs right gap ~438-460px. This is the "too much blank
  // space" the user kept reporting, and the same bug class already retired
  // once for heroStats--ledger-rows. A row-per-item shape is simply wrong for
  // a 2-4 word trust label. Do not re-add.
  trustbar: ['pills', 'inline', 'stacked',
    'framed-outline', 'shadow-stack', 'pill-tags', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'outline-only', 'minimal-text-row', 'divider-line-row', 'boxed-grid-table'],
  // 'compact' retired (2026-08) - a flat cloud of pill chips (pin icon +
  // name) read as an unfinished placeholder rather than a designed section.
  // 'cards' covers the exact same content (same count headline, same
  // grouped neighborhoods/nearby-communities layout, same CTA) with real
  // bordered cards per item instead of pills. Do not re-add 'compact'.
  // 'minimal-text-row'/'ledger-rows'/'alternating-tint' retired (2026-08-24,
  // explicit user complaint - "take too much height and too much blank
  // spaces on the right") - a business's real neighborhood/suburb list can
  // run 20-31 items, and all 3 rendered every one as its own full-width
  // row - by far the tallest section on the page, one narrow column of
  // text. areas() now also caps the homepage preview to 10 items + a real
  // "View all N areas" link to /service-areas/ regardless of variant, so
  // this isn't just about which 3 keys are banned - see components/index.js.
  // 'quiet-editorial' RETIRED 2026-10-12 (user, Chandler /chandler/: "what
  // kind of design is this? dont add this kind of design in any pages") - no
  // section heading, a lone count + caption floating on one side and a few
  // outline pills stranded on the other. Pinned sites that had it are
  // remapped below (RETIRED_SECTION_VARIANTS). Do not re-add.
  areas: ['map', 'directory', 'cards',
    'framed-outline', 'shadow-stack', 'pill-tags', 'circle-badge-grid', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'split-duotone', 'outline-only', 'stacked-two-row', 'divider-line-row', 'boxed-grid-table'],
  cta: ['centered', 'split', 'bar',
    'boxed', 'diagonal', 'stacked-icon', 'minimal-line', 'framed-outline', 'shadow-stack', 'quiet-editorial', 'glass-panel', 'split-duotone', 'outline-only', 'oversized-badge', 'ribbon-corner', 'color-block', 'wide-spaced', 'ledger-style', 'ribbon-diagonal', 'ghost-frame'],
  // Static row vs. auto-scrolling marquee (single direction, or two rows
  // running opposite ways) - see brandBar() in components/index.js.
  // The brand list is a fixed SIX (config/generation.config.js), so any
  // brandbar skin that boxes them into a narrow 1-2 column strip wastes the
  // whole row. 'ledger-rows' retired 2026-08-25 on explicit user instruction
  // (Kansas City): "dont use any site this brand variant, i have only 6 brand
  // why its 2 column and too much blank spaces" - it hard-coded
  // grid-template-columns:repeat(2,1fr) inside max-width:680px, so six brands
  // rendered as three short rows centred in a narrow column with most of the
  // bar empty either side.
  // When adding a brandbar skin, lay the six out across the row (one line, or
  // an even 3x2 / 2x3), never a tall narrow stack and never a sideways
  // scroller.
  // 'split-duotone' retired from the BRANDBAR pool at the same time: it is the
  // identical shape, a column-count:2 flow inside max-width:660px, which
  // measured as three rows of two using 36% of the bar. It was not live on any
  // site as a brandbar, so retiring it changed nothing - it just cannot be
  // rolled onto a future one. (split-duotone remains valid on the footer,
  // areas, faq, why and reviewCard pools - different class prefixes,
  // different layouts.)
  brandbar: ['static', 'marquee-ltr', 'marquee-rtl', 'marquee-dual',
    'framed-outline', 'shadow-stack', 'alternating-tint', 'pill-tags', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'outline-only', 'stacked-two-row', 'minimal-text-row', 'divider-line-row'],
  // The inline population/services/areas strip text-only heroes show in
  // place of a side image (hero__stats) - was a single plain layout with no
  // variation at all. See hero() in components/index.js.
  // 'plain' retired (2026-08) - bare numbers with only a hairline top
  // border, no real visual structure; read as unfinished. 'cards' and
  // 'divided' both give the same numbers real presence. Do not re-add.
  // 'ledger-rows' removed (2026-08-20) - stacking N full-width rows inside
  // a hero (space-constrained, above-the-fold real estate) measured at
  // 325px tall for just 4 stats, ~42% of the whole hero's height and
  // roughly equal to the ENTIRE rest of the hero content combined. That's
  // not a padding/gap problem fixable in place - vertically stacking rows
  // is fundamentally the wrong shape for this context (it's fine for
  // trustbar--ledger-rows, which isn't height-constrained the same way -
  // don't assume a fix for one axis's variant applies to another's
  // same-named one just because the CSS pattern looks similar). Do not
  // re-add a row-stacking heroStats variant without checking its actual
  // rendered height against the hero's other content first.
  heroStats: ['cards', 'divided',
    'framed-outline', 'shadow-stack', 'alternating-tint', 'pill-tags', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'split-duotone', 'outline-only', 'stacked-two-row', 'minimal-text-row', 'divider-line-row', 'boxed-grid-table', 'oversized-index'],
  // Mid-page CTA nudge (ctaBanner() in components/index.js) - was a single
  // fixed thin design with no variant pool at all (2026-08-20 fix). All 8
  // are bolder than the old design; visual variety is entirely CSS except
  // icon-badge/split-stat/outline-bold, which have their own real markup.
  ctaBanner: ['bold-strip', 'filled-brand', 'icon-badge', 'split-stat', 'outline-bold', 'tinted-panel', 'corner-accent', 'centered-stack'],
  // FAQ previously had NO variant pool at all (one fixed design, sticky
  // intro + accordion) - explicit user request. 'split-sticky' is that
  // original design, kept as the default/first key so nothing shifts for
  // existing sites' fingerprints beyond what re-rolling naturally does.
  // 14 of these reuse split-sticky's exact intro+accordion markup (CSS-only,
  // see FAQ_GENERIC_KEYS in components/index.js); single-column/two-col-grid
  // share one "no sidebar" markup shape; numbered/circle-badge-grid/
  // flat-cards each have their own real markup difference.
  faq: ['split-sticky', 'framed-outline', 'shadow-stack', 'alternating-tint', 'quiet-editorial',
    'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'split-duotone',
    'outline-only', 'minimal-text-row', 'divider-line-row', 'ledger-rows', 'compact-dense',
    'single-column', 'two-col-grid', 'numbered', 'circle-badge-grid', 'flat-cards'],
  // Real authored long-form prose (contentSections()/contentProse() in
  // components/index.js) - used on About, Contact, Service-Areas hub, FAQ
  // and Quote pages wherever an operator wrote real per-section copy.
  // Explicit user complaint, 2026-08-24: these always rendered as the exact
  // same plain stacked heading+paragraphs shape on every business/page,
  // completely unvaried - added a real structural axis, same pattern as
  // every other section. 'stacked' is the pre-existing default (kept, now
  // one option among several instead of the only one). Each key is a
  // genuine layout difference, not just a color swap - see the matching
  // branch in contentSections()/contentProse() and the CSS in css.js.
  contentProse: ['stacked', 'boxed-cards', 'numbered-index', 'magazine-columns', 'side-label'],
  // INERT since 2026-09-10. The "Residential & commercial" section was removed
  // engine-wide (user: "dont show any re/com sections in the UI") - resCom()
  // and all its CSS are gone, so whichever key gets rolled here renders
  // nothing.
  //
  // The AXIS AND ITS KEYS MUST STAY. SECTION_AXES is the positional format of
  // the `sections` fingerprint string stored for all 81 registry rows, and
  // `rescom` sits at index 12 of 14 - deleting the slot would shift
  // `reachSteps` down one and silently redesign the reach stepper on every
  // site the next time repin.mjs rebuilds it from a stored fingerprint. It
  // costs one unused word per fingerprint; that is the correct trade.
  rescom: ['cards', 'split-banner', 'stacked-rows', 'comparison-list', 'framed-quiet'],
  // The "How to reach us" stepper on Contact (see reachSection()/the
  // 'reach-steps' template in components/index.js). Added 2026-08-25 as its
  // own axis for the usual reason: without one it rendered identically on all
  // 1000 sites. Every key keeps BOTH the step number and its icon - that pair
  // is the component's identity, not a variant choice - and differs by layout
  // (where the copy sits, how the steps flow, how each step is framed).
  // CSS-only, one shared markup shape (see .reach-layout--* in css.js).
  reachSteps: ['split-list', 'timeline-rail', 'numbered-grid', 'horizontal-track',
    'stacked-panels', 'compact-rows', 'boxed-outline', 'circle-badge'],
};

/** Variant pools per axis. Order is irrelevant; weighting handles bias. */
export const POOLS = {
  // 'centered-overlay' retired (2026-08) - judged not professional-looking
  // (centered text stack over a squashed 16:6 photo banner, generic SaaS-
  // template feel) and dropped from generation entirely. Do not re-add.
  hero: [
    'split-image-right', 'split-image-left', 'left-banner-cta',
    'fullbleed-dark', 'text-only-underline', 'color-block-split', 'diagnostic-panel',
    'asymmetric-overlap',
    'tilted-frame', 'soft-glow-edge', 'duotone-media', 'bordered-card-media', 'oversized-badge', 'minimal-quiet', 'split-narrow', 'split-wide', 'circle-accent-media', 'layered-depth', 'edge-line-media', 'color-pop-badge',
  ],
  // Re-opened to 6 (explicit user request, reversing the 2026-08-20 lock
  // below) - EVERY value here must still render as ONE ROW (logo left,
  // links + call button right, no stacking, no hamburger-forced-open,
  // no second bar) - that constraint was the whole point of the original
  // lock and still applies, it's just no longer enforced by shrinking the
  // pool to 1. 'inline-solid' has zero CSS overrides of its own (the
  // untouched base .nav row). The other 5 are real single-row skins
  // (background/border/typography only, verified no flex-direction:column
  // or any structural stack anywhere in their CSS - centered-serif WAS
  // flex-direction:column pre-fix, see js-engine-css-bugs memory).
  // Originally locked 2026-08-20 ("navbar will be same inline single
  // variant for all sites") - if reverting to locked again, restore
  // `nav: ['inline-solid']` and rely on rollAxis()'s pool.length===1
  // short-circuit below to keep it truly single-valued.
  nav: ['inline-solid', 'centered-serif', 'minimal-underline', 'floating-pill', 'bordered-frame', 'uppercase-tracked'],
  // 'ledger-rows' retired (2026-08-25, explicit user request: "remove
  // ledger-rows service variant, i dont want to use it for any sites"). It
  // was the one serviceCard skin that wasn't a card at all - a borderless
  // full-width ledger row with the photo forced into a narrow 88px left
  // column, which reads as a list item next to the other 19 real cards. Do
  // not re-add. (The same-named variants on OTHER axes - why/process/
  // trustbar/brandbar/footer/reviewCard/faq - are untouched; this removal is
  // scoped to serviceCard only, which is what was asked for.)
  serviceCard: [
    'icon-top', 'editorial-row', 'bordered-badge', 'list-dense', 'soft-rounded',
    'text-list', 'blocky-numbered', 'spec-row', 'glass', 'gradient-top', 'offset-number',
    'ribbon-corner', 'duotone-icon', 'outline-only', 'shadow-stack', 'minimal-quiet', 'boxed-diagonal', 'wide-spaced', 'circle-icon',
  ],
  reviewCard: ['quote-plain', 'big-quote', 'card-rating', 'bubble',
    'framed-outline', 'shadow-stack', 'avatar-card', 'highlight-panel', 'compact-row', 'numbered-badge', 'quiet-editorial', 'boxed-diagonal', 'glass-panel', 'split-duotone', 'outline-only', 'stacked-divide', 'minimal-text', 'oversized-quote-mark', 'ribbon-corner', 'color-block'],
  // 'stacked-list' retired (2026-08-25, explicit user request: "gallery should
  // always focus on the image ... dont use this variant anywhere for next
  // generations"). It laid each figure out as `100px 1fr` - a fixed 100px
  // thumbnail beside a full-width text label - so the PHOTO occupied just 14%
  // of each tile while the caption dominated. Measured against all 20 gallery
  // variants in the section catalog: every other key sits at 83-100% image
  // area, making this the sole outlier, not a stylistic edge case. A gallery
  // whose images are incidental is not a gallery. Do not re-add.
  // 'carousel-row' retired (2026-08-25, explicit user request: "dont
  // scrolled"). It was the only gallery variant that scrolled sideways
  // (display:flex + overflow-x:auto + scroll-snap), so most of the photos sat
  // off-screen behind a horizontal scrollbar. Same call already made for the
  // service-areas directory: content a visitor is meant to scan should grow
  // DOWN the page, never hide behind a sideways scroll. Not converted to a
  // wrapping row, because without the scroll its fixed-width tiles would just
  // duplicate the existing grid-*/minimal-gap looks. Do not re-add.
  gallery: ['masonry', 'wide-strip', 'grid-3', 'grid-2', 'polaroid', 'asymmetric',
    'grid-4', 'grid-5', 'framed-outline', 'shadow-stack', 'duotone-overlay', 'rounded-blob', 'ribbon-corner', 'minimal-gap', 'wide-hero-strip', 'staggered-offset', 'bordered-frame', 'mosaic-mixed'],
  // 'centered-stacked' removed: forced every footer column (brand info,
  // Services, Company) into one narrow (max-width:420px) centered block
  // regardless of viewport width - on a real desktop width that reads as a
  // stray floating column with huge dead margins on both sides, and
  // centering a heading over a list of centered links doesn't read as an
  // aligned link list the way a real business site's footer does. User
  // flagged this by screenshot as "not proper aligned" - same treatment as
  // the earlier heroStats--ledger-rows removal (retire the variant, not a
  // CSS patch) since the problem is the whole layout concept, not a tunable
  // detail.
  // STANDING RULE (2026-08-25, explicit user instruction): "footer always
  // column wise". A footer must lay its link groups out as COLUMNS with each
  // list stacked vertically. Never add a skin that runs a group's links
  // horizontally, or that collapses groups into inline "Label: a b c" runs -
  // that reads as a paragraph of plain text rather than a navigable footer.
  // The base .site-footer ul is display:grid (a vertical stack), so a new
  // skin is column-wise by default; it only breaks the rule if it explicitly
  // overrides the list to display:flex/inline-flex. Grep
  // "footer--.*ul{" before adding one.
  // Two keys retired under this rule, both row-style:
  //   'minimal-text-row' - inline label+link runs across the full width.
  //   'ledger-rows'      - groups stacked as full-width rows with the links
  //                        flowing horizontally beside a left-hand label.
  // NOTE: both names ALSO exist as keys on other axes (heroStats, brandbar,
  // faq, and ledger-rows elsewhere) - those are separate pools and are NOT
  // retired by this. Only the footer skins are gone.
  footer: ['columns-4', 'editorial-2col', 'bold-cta-band', 'friendly-3col', 'minimal-1row',
    'dark-split', 'boxed-panel', 'framed-outline', 'shadow-stack', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced', 'underline-accent', 'glass-panel', 'split-duotone', 'outline-only', 'stacked-two-row'],
  // Note: no 'text-arrow' here - primary CTAs must always look like buttons
  // (still true of every skin added below - all keep a fill/border/padding,
  // just a different material/interaction than the existing eight).
  ctaStyle: [
    'solid-pill', 'outline-square', 'solid-square-loud', 'solid-square', 'outline-gold', 'gradient-pill',
    'soft-glass', 'chunky-3d',
    'shadow-stack-btn', 'soft-pill-glow', 'bordered-thick', 'minimal-quiet-btn', 'color-block-btn', 'ribbon-corner-btn', 'duotone-fill', 'glass-frost-btn', 'edge-line-btn', 'oversized-bold', 'compact-condensed-btn', 'layered-depth-btn',
  ],
};

/**
 * Some variants only read well on a given mood. Filter incompatible ones.
 */
const MOOD_ONLY = {
  'outline-gold': 'dark',
  glass: 'dark',
  'fullbleed-dark': 'dark',
};

export function compatiblePool(axis, theme) {
  return POOLS[axis].filter((v) => {
    const need = MOOD_ONLY[v];
    return !need || need === theme.mood;
  });
}

/**
 * Weighted pick that biases toward the theme's declared default for an axis.
 * @param {object} s stream
 * @param {string} axis
 * @param {object} theme
 * @param {number} defaultBias 0..1 probability mass reserved for the default
 */
function rollAxis(s, axis, theme, defaultBias = 0.5) {
  // A single-value POOLS[axis] means "locked, no variation" (e.g. nav today)
  // - short-circuit BEFORE the theme-default logic below, which otherwise
  // pushes the theme's own declared default back in as a second option
  // whenever it isn't already in the pool. Without this, shrinking a pool
  // to one entry silently doesn't work for any axis whose themes declare a
  // different default.
  if (POOLS[axis].length === 1) return POOLS[axis][0];
  const def = theme[axisToThemeKey(axis)];
  const pool = compatiblePool(axis, theme);
  if (!pool.includes(def) && def) pool.push(def);
  const others = pool.filter((v) => v !== def);
  // Reserve defaultBias for default; spread the rest.
  const pairs = [];
  if (def) pairs.push([def, Math.round(defaultBias * 100)]);
  const each = others.length ? Math.round(((1 - defaultBias) * 100) / others.length) : 0;
  for (const o of others) pairs.push([o, Math.max(1, each)]);
  return s.weighted(pairs);
}

function axisToThemeKey(axis) {
  return axis === 'ctaStyle' ? 'ctaStyle' : axis;
}

/**
 * Section ordering follows a fixed "modern local-service site" spine -
 * hero → early orientation → core offering → elaboration → validation →
 * coverage → objections → close - the same shape every one of the 18
 * themes' own hand-authored sectionOrder already independently converges on
 * (audited all 18: every single one is hero, [trustbar/about], services,
 * [why/gallery], reviews, areas, [faq], cta, contact, in that relative
 * order). The OLD version threw most of that away with a near-total random
 * shuffle (only the first section and "services in the top 3" were
 * enforced) - reviews could land before the hero's own trust bar, FAQ could
 * land before services, etc. Uniqueness across sites still comes from
 * shuffling WITHIN each zone (which of trustbar/about leads, whether why
 * comes before gallery, ...) - never from scrambling the zone order itself.
 * @param {string[]} order
 * @param {object} s
 */
const SECTION_ZONE = {
  trustbar: 1, about: 1,       // early orientation, right after hero
  services: 2,                 // core offering - always high on the page
  why: 3, gallery: 3,          // elaboration / differentiation
  reviews: 4,                  // validation
  areas: 5,                    // coverage
  faq: 6,                      // last objection before the close
};

function permuteSections(order, s) {
  // hero/emergency: keep the theme's own relative order for whichever of
  // the two lead (urgency-first vs value-first is an intentional per-theme
  // choice, not shuffle noise) - but ALWAYS keep both pinned to the very
  // front. Previously only the single first element was anchored, so on
  // themes where emergency leads, hero itself could get shuffled anywhere
  // in the middle of the page.
  const leadCount = ['hero', 'emergency'].includes(order[0]) && ['hero', 'emergency'].includes(order[1]) ? 2 : 1;
  // The HERO is always the first section after the nav - standing user rule
  // 2026-08-27: "after navbar always there is hero section ... dont make this
  // issue again in next generations".
  // The comment above describes urgency-first as an intentional per-theme
  // choice, and one theme (bold-emergency) does author `emergency > hero`.
  // That is now overridden: leading with the emergency band pushed the hero
  // below a dark strip on Searcy, so the page opened on a secondary message
  // instead of the business. Emergency keeps its place immediately after.
  const anchoredFront = order.slice(0, leadCount);
  if (anchoredFront.includes('hero') && anchoredFront[0] !== 'hero') {
    anchoredFront.splice(anchoredFront.indexOf('hero'), 1);
    anchoredFront.unshift('hero');
  }
  const tail = [];
  const rest = [];
  for (const sec of order.slice(leadCount)) {
    if (sec === 'cta' || sec === 'contact') tail.push(sec);
    else rest.push(sec);
  }
  // Bucket by zone (anything unrecognized falls into zone 3, the broad
  // "elaboration" band, rather than being dropped or breaking the sort).
  const buckets = new Map();
  for (const sec of rest) {
    const z = SECTION_ZONE[sec] ?? 3;
    if (!buckets.has(z)) buckets.set(z, []);
    buckets.get(z).push(sec);
  }
  const ordered = [];
  for (const z of [...buckets.keys()].sort((a, b) => a - b)) ordered.push(...s.shuffle(buckets.get(z)));
  return [...anchoredFront, ...ordered, ...tail];
}

/**
 * Produce the full variant selection for a business.
 *
 * `divergence` (0..1) is raised by the uniqueness engine on collision re-rolls:
 * higher divergence lowers the bias toward theme defaults so re-rolls actually
 * move to different variants, fonts, and layout instead of re-picking the same
 * design.
 *
 * @param {object} theme
 * @param {number} seed
 * @param {number} [divergence]
 * @param {object} [forceVariants] optional pins for specific axes (hero/nav/
 *   serviceCard/reviewCard/gallery/footer/ctaStyle and/or sectionVariants.*) -
 *   applied AFTER the normal seed-derived roll, so unspecified axes are
 *   unaffected. Used sparingly to break a confirmed cross-site collision
 *   cluster by restoring a business to its own theme's declared default for
 *   just that axis (see cli.js --variants).
 */
export function selectVariants(theme, seed, divergence = 0, forceVariants = null) {
  const s = stream(subSeed(seed, 'variation'));
  // As divergence rises, default bias falls (min 0.2) so re-rolls diverge.
  const bias = (b) => Math.max(0.2, b - divergence * 0.5);

  const variants = {
    hero: rollAxis(s, 'hero', theme, bias(0.55)),
    nav: rollAxis(s, 'nav', theme, bias(0.6)),
    serviceCard: rollAxis(s, 'serviceCard', theme, bias(0.5)),
    reviewCard: rollAxis(s, 'reviewCard', theme, bias(0.55)),
    gallery: rollAxis(s, 'gallery', theme, bias(0.55)),
    footer: rollAxis(s, 'footer', theme, bias(0.6)),
    ctaStyle: rollAxis(s, 'ctaStyle', theme, bias(0.6)),
  };
  if (forceVariants) {
    for (const k of ['hero', 'nav', 'serviceCard', 'reviewCard', 'gallery', 'footer', 'ctaStyle']) {
      if (forceVariants[k]) variants[k] = forceVariants[k];
    }
  }

  // Typography pairing (real per-business axis within a theme).
  const fontPairs = FONT_ALTERNATES[theme.id] || [[theme.typography.headingFont, theme.typography.bodyFont]];
  const fontIdx = s.weighted(fontPairs.map((_, i) => [i, i === 0 ? Math.round(bias(0.5) * 100) : 40]));
  const [headingFont, bodyFont] = fontPairs[fontIdx];

  // Layout + shape micro-variation (kept within readable/branded bounds).
  const typeScaleTweak = s.pick([-0.04, -0.02, 0, 0, 0.02, 0.04]);
  const radiusTweak = s.pick([0.7, 0.85, 1, 1, 1.2, 1.4]);
  const densityTweak = s.pick(['tight', 'regular', 'regular', 'airy']);
  const widthTweak = s.pick([0.92, 1, 1, 1.06]);

  const sectionOrder = permuteSections(theme.sectionOrder, s);

  // Per-section LAYOUT variants - different sites render the same section in
  // different layouts, so no two sites share the same section designs.
  // Each key has 3–4 genuinely different STRUCTURAL layouts (implemented in
  // components/index.js + css.js), so the same section renders with a different
  // skeleton on different sites. The stream folds in the (nonce-mutated) seed,
  // so uniqueness re-rolls also move the section layouts. The uniqueness engine
  // additionally REBALANCES these across the recent window (see rebalanceSections
  // in uniqueness.js) so no one layout dominates a batch of sites.
  const s2 = stream(subSeed(seed, 'sectionlayouts'));
  const sectionVariants = {};
  for (const axis of SECTION_AXES) sectionVariants[axis] = s2.pick(SECTION_POOLS[axis]);
  if (forceVariants && forceVariants.sectionVariants) {
    Object.assign(sectionVariants, forceVariants.sectionVariants);
  }
  // A retired layout can still arrive through a pinned/forced variant (sites
  // built before it was retired). Swap it for a live one from the same pool,
  // deterministically, so a rebuild never re-renders a banned design.
  for (const [axis, { banned, use }] of Object.entries(RETIRED_SECTION_VARIANTS)) {
    if (banned.includes(sectionVariants[axis])) sectionVariants[axis] = stream(subSeed(seed, `retired-${axis}`)).pick(use);
  }

  // Page-wide container width: 'boxed' (capped at the theme's maxWidth) or
  // 'full' (every .container spans the viewport minus side padding). It is
  // site-wide by design - a full-width site never mixes in boxed sections.
  // Own stream so adding this axis did not move any existing axis's roll.
  const s3 = stream(subSeed(seed, 'containerwidth'));
  let containerWidth = s3.weighted(CONTAINER_WIDTHS.map((w) => [w, w === 'full' ? FULL_WIDTH_SHARE : 100 - FULL_WIDTH_SHARE]));
  if (forceVariants && CONTAINER_WIDTHS.includes(forceVariants.containerWidth)) containerWidth = forceVariants.containerWidth;

  return {
    ...variants, headingFont, bodyFont, fontIdx,
    typeScaleTweak, radiusTweak, densityTweak, widthTweak, sectionOrder, sectionVariants,
    containerWidth,
  };
}

/**
 * A compact fingerprint capturing all uniqueness-relevant axes for a business's
 * resolved design. Used by the uniqueness engine.
 */
export function variantFingerprint(themeId, palette, typography, variants) {
  return {
    theme: themeId,
    hero: variants.hero,
    nav: variants.nav,
    serviceCard: variants.serviceCard,
    reviewCard: variants.reviewCard,
    gallery: variants.gallery,
    footer: variants.footer,
    cta: variants.ctaStyle,
    sectionOrder: variants.sectionOrder.join('>'),
    headingFont: typography.headingFont,
    bodyFont: typography.bodyFont,
    // layout signature: density + rounded radius bucket + width band
    layout: `${variants.densityTweak}:${Math.round(variants.radiusTweak * 10)}:${Math.round(variants.widthTweak * 100)}`,
    // per-section layout variants (positional by SECTION_AXES, '|'-joined)
    sections: SECTION_AXES.map((a) => (variants.sectionVariants || {})[a] || '').join('|'),
    // recorded so repin.mjs can pin it; NOT part of differenceScore, so
    // existing uniqueness scores are unchanged
    containerWidth: variants.containerWidth || 'boxed',
    primary: palette.primary,
    accent: palette.accent,
    mood: palette.mood,
  };
}
