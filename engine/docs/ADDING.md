# Extending the engine

Everything below is additive — no core code changes required.

## Add a theme

Append an object to `THEMES` in `config/themes.js`:

```js
{
  id: 'my-theme',                 // kebab-case, unique
  name: 'My Theme',
  mood: 'light',                  // 'light' | 'dark'
  tags: ['...'],
  palette: { strategy: 'brand-anchored', accentShift: 24, neutral: 'cool' },
  //         strategy ∈ brand-anchored | muted-luxe | high-energy | steel-dark | monochrome-accent
  //         neutral  ∈ cool | warm | steel | ink
  typography: {
    headingFont: '"Sora", system-ui, sans-serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    headingWeight: 700, bodyWeight: 400, scale: 1.24,
    headingTracking: '-0.01em', headingCase: 'none', // or 'uppercase-hero'
  },
  layout: { maxWidth: 1200, sectionSpacing: 88, containerPad: 24, gridGap: 24, density: 'regular' },
  shape:  { radius: 10, cardRadius: 14, shadow: 'soft', border: 1 },
  //        shadow ∈ none | soft | soft-color | hard | ring | glow
  hero: 'split-image-right',      // keys below must exist in the variant vocabulary
  nav: 'inline-solid', serviceCard: 'icon-top', reviewCard: 'quote-plain',
  gallery: 'masonry', footer: 'columns-4', ctaStyle: 'solid-pill',
  decor: 'none',
  sectionOrder: ['hero','trustbar','services','why','areas','reviews','faq','cta','contact'],
}
```

Optionally add 2–3 font pairings under the theme's id in `FONT_ALTERNATES`
(`src/engine/variation.js`) so same-theme sites diverge typographically.

**Variant vocabulary** (implemented in `components/index.js` + `design/css.js`):

- hero: `split-image-right`, `split-image-left`, `centered-overlay`,
  `left-banner-cta`, `fullbleed-dark`, `text-only-underline`,
  `color-block-split`, `diagnostic-panel`, `asymmetric-overlap`
- nav: `inline-solid`, `centered-serif`, `utility-bar-phone`, `rounded-pill`,
  `minimal-underline`, `floating-pill`
- serviceCard: `icon-top`, `editorial-row`, `bordered-badge`, `list-dense`,
  `soft-rounded`, `text-list`, `blocky-numbered`, `spec-row`, `glass`,
  `gradient-top`, `offset-number`
- reviewCard: `quote-plain`, `big-quote`, `card-rating`, `bubble`
- gallery: `masonry`, `wide-strip`, `grid-3`, `grid-2`, `polaroid`, `asymmetric`
- footer: `columns-4`, `editorial-2col`, `bold-cta-band`, `friendly-3col`, `minimal-1row`
- ctaStyle: `solid-pill`, `outline-square`, `solid-square-loud`, `solid-square`,
  `text-arrow`, `outline-gold`, `gradient-pill`

To invent a *new* variant key, add its structural branch in
`components/index.js` (if the HTML differs) and its `.<axis>--<key>` rules in
`design/css.js`, then add the key to the relevant pool in
`src/engine/variation.js`.

## Add a service

Append to `SERVICES` in `config/services.js` (keep copy neutral — no fabricated
claims). If it should be offered by every business by default, add its `id` to
`CORE_SERVICE_IDS`. Navigation, the services grid, `/services/<id>/` pages, and
Service schema pick it up automatically.

## Add a page type

Add an entry to `PAGE_TYPES` in `config/pagetypes.js` with a URL builder and an
`enabled(business, ctx)` predicate (return `false` when the backing data is
absent so no thin pages are produced), then render it in `generator/pages.js`
and register it in `generator/site.js`.

## Add a spreadsheet column

Add the header's accepted names to `config.excel.columnAliases` (or
`cityColumnAliases`). Mapped values appear on the record; unmapped columns are
still preserved on `business.additionalData`. Surface it in `data/normalize.js`
if it should become a first-class model field.

## Tune uniqueness

`config.uniqueness` controls the threshold (`minScore`), re-roll budget
(`maxRerolls`), comparison `compareWindow`, and per-axis `weights`. Raising
`minScore` forces more divergence (more re-rolls / more distinct designs);
adding themes raises the achievable floor automatically.

## Wire up real content / contact

- **Rich content:** drop `contents/<city>-<state>/<prefix>-<type>-<slug>.json`
  files in the Dallas shape; the adapter is prefix-agnostic.
- **Contact form:** the form in `components/index.js` posts to `#` (the dataset
  has no endpoint). Point its `action` at the business's real handler on deploy.
- **Real business data** (phone/reviews/images): populate those fields in
  `data/normalize.js` from your source — the components un-hide automatically
  and the no-fabrication guard stops applying because the data is now real.
