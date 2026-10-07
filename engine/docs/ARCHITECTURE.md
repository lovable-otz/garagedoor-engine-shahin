# Architecture

## Folder structure

```
engine/
  config/
    generation.config.js   paths, uniqueness weights/threshold, feature flags, column aliases
    themes.js              18 theme definitions (structural language, not just color)
    services.js            extensible service catalog (neutral, non-fabricated copy)
    pagetypes.js           page-type registry with data-driven `enabled` predicates
  src/
    util/
      hash.js              FNV-1a hash, mulberry32 seeded PRNG, seed helpers
      color.js             hex/hsl, WCAG contrast, ensureContrast, palette math
      strings.js           slugify, titleCase, humanList, number formatting
      html.js              escaping + fragment helpers
    excel/
      xlsx-read.js         zero-dep .xlsx reader (ZIP + shared strings + sheets)
      xlsx-write.js        zero-dep .xlsx writer with solid-color cell fills
      parse.js             worksheet → alias-mapped records (flexible mapping layer)
    data/
      model.js             Business Data Model (typedef) + empty defaults
      normalize.js         raw records → Business, city-facts join, provenance
      validate.js          per-row validation (ok/warning/error), duplicate detection
      load.js              orchestration entry point
    engine/
      seed.js              business → seed → theme → palette → typography → variants
      variation.js         variant pools, font alternates, section-order permutation
      uniqueness.js        difference scoring + collision re-roll
      registry.js          persistent design registry (cross-run non-conflict)
    design/
      palette.js           1 brand color → full accessible palette (per strategy)
      tokens.js            theme+palette+variants → flat design tokens
      css.js               tokens + variant keys → one stylesheet (all variants)
    content/
      adapter.js           load pre-generated rich JSON (Dallas-shape, prefix-agnostic)
      builder.js           safe non-fabricated fallback content
      index.js             resolve/merge rich + fallback into one bundle
    assets/
      images.js            theme-colored inline-SVG placeholders (honest, deterministic)
    seo/
      meta.js              title/description/canonical/OG/Twitter
      schema.js            JSON-LD (LocalBusiness/Service/FAQ/Breadcrumb), data-gated
      sitemap.js           sitemap.xml + robots.txt
    generator/
      layout.js            HTML document shell (head, fonts, inlined CSS, JSON-LD)
      pages.js             page composition + data-driven section selection
      site.js              build + write one full site (clean URLs)
      report.js            control-sheet rows + Excel/CSV writer + error report
      batch.js             orchestrate many: unique → build → QA → record → report
    qa/
      validate-site.js     SEO/a11y/structure/fabrication checks per site
    cli.js                 argument parsing + preview/gallery/all modes
  docs/                    this documentation
  dist/                    generated output (sites + reports); safe to delete
```

## The pipeline, end to end

1. **Parse** (`excel/`). The workbook is unzipped in-process; the *Site Build
   Sheet* and *Cities* sheet are mapped to canonical fields via an **alias map**
   (`config.excel.columnAliases`) so renamed/re-ordered columns keep working.
   Unmapped columns are preserved under `additionalData` — the schema is
   extensible.

2. **Normalize + validate** (`data/`). Records become the **Business Data
   Model**: cleaned identity fields, a joined block of real market facts
   (population/lat/lng/tier/demand from the city sheet), a default universal
   service offering, and a `provenance` map recording where each field came from
   (`excel` / `content` / `derived` / `absent`). Validation classifies each row
   `ok | warning | error`; only hard errors are skipped so one bad row never
   halts the batch.

3. **Assign a design deterministically** (`engine/seed.js`). A stable
   `seed = FNV1a(domain + name)` fans out (via `subSeed`) into independent
   decisions: theme, palette, typography pairing, and every component variant.
   Same business ⇒ same design, always.

4. **Build the palette** (`design/palette.js`). The single Excel brand color is
   expanded into a complete palette per the theme's *strategy*
   (`brand-anchored`, `muted-luxe`, `high-energy`, `steel-dark`,
   `monochrome-accent`). Text, muted text, borders, and on-color foregrounds are
   contrast-corrected to WCAG AA (`ensureContrast`).

5. **Select variations** (`engine/variation.js`). Hero, nav, service card,
   review card, gallery, footer, CTA style, font pairing, density, radius,
   width, and homepage section order are each rolled from the seed — weighted
   toward the theme's baseline so identity holds, but different per business.

6. **Enforce uniqueness** (`engine/uniqueness.js` + `registry.js`). Each design
   is scored against a sliding window of already-built designs (seeded from the
   **persistent registry**, so incremental batches don't conflict). If a design
   is too close to a neighbour, its variants are **re-rolled with rising
   divergence**, keeping the best. Weights follow the spec's rubric (theme,
   layout, components, typography, colors, hero, section-order,
   content-structure, footer).

7. **Resolve content** (`content/`). If `contents/<city>-<state>/…` rich JSON
   exists (the Dallas reference sample), it is used; anything missing falls back
   to **safe, non-fabricated** builder content. Both share one page schema
   (`title/meta/h1/sections[]/faq[]/schema_facts`), so downstream code is
   source-agnostic.

8. **Compose + render** (`components/`, `generator/`). Components branch on the
   resolved variant keys and are **data-gated** (reviews/areas/phone only when
   real). `pages.js` selects homepage sections based on available data;
   `site.js` writes clean-URL static files plus `sitemap.xml`/`robots.txt`.

9. **QA** (`qa/`). Each site is checked for SEO essentials, a single H1,
   accessibility basics, palette contrast, and unbacked claim phrases;
   status `PASS | WARN | FAIL` is recorded.

10. **Report** (`generator/report.js`). One control-sheet row per business —
    theme, variants, seed, uniqueness score, page count, statuses — with the
    actual colors **painted into their cells** as fills. CSV + JSON mirrors and
    an error report accompany it. **The source workbook is never modified.**

## Determinism & seeds

`hash.js` provides `seedFor(domain,name)` and `subSeed(seed,'axis')`. Every
stochastic decision draws from a `mulberry32` stream keyed by a sub-seed, so
axes are decorrelated (the hero choice doesn't track the footer choice) yet the
whole design is reproducible. The only non-determinism is the footer copyright
year (from the clock), overridable with `--year`.

## Extensibility surface

- **Themes** → add an object to `config/themes.js` (+ optional font alternates).
- **Services** → add to `config/services.js`; nav, grids, pages, schema update.
- **Page types** → add to `config/pagetypes.js` with an `enabled` predicate.
- **Columns** → add an alias in `config.excel`; value flows to `additionalData`.
- **Content** → drop a `contents/<city>-<state>/` folder in the Dallas shape.
