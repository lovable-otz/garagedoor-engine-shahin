# Garage-Door Site Engine

A **data-driven generation engine** that turns one Excel dataset into 1,000+
unique, production-quality garage-door websites — each using the correct
business information from its row, each looking like an independently designed
site rather than a re-skinned template.

> **This repo is the engine.** It is built to demonstrate with a small preview
> batch first; generating all 1,000 sites is a single flag away but intentionally
> not run by default.

---

## What it does

```
Excel workbook
   ↓  excel parser (zero-dependency .xlsx reader)
   ↓  data normalizer  → Business Data Model  (+ market facts join, validation)
   ↓  deterministic seed  (hash of domain+name)
   ↓  theme engine        (18 distinct themes)
   ↓  palette engine      (full accessible palette from the 1 brand color)
   ↓  variation engine    (per-business hero/nav/cards/footer/cta/fonts/layout/order)
   ↓  uniqueness engine    (scoring + collision re-roll, persistent registry)
   ↓  content engine      (pluggable rich JSON  ·  safe non-fabricated fallback)
   ↓  component library    (theme-variant-aware, data-gated)
   ↓  SEO engine          (meta, OG/Twitter, JSON-LD, sitemap, robots)
   ↓  asset engine        (theme-colored inline-SVG placeholders)
   ↓  site generator       (clean-URL static HTML)  → QA/validation
   ↓  control sheet        (Excel with painted color cells) + error report
Generated static sites
```

## Quick start

Requires **Node ≥ 18** (tested on Node 20). No install step — zero dependencies.

```bash
cd engine

# 5 representative sites across 5 different themes (the default demo)
node src/cli.js --preview 5

# one representative site for every one of the 18 themes
node src/cli.js --theme-gallery

# a single business by domain
node src/cli.js --business dallasdoorpros.com

# the first N businesses
node src/cli.js --limit 25

# the whole workbook (1,000 sites) — only when you're ready
node src/cli.js --all --fresh-registry
```

Outputs land in `dist/`:

- `dist/generated-sites/…` — one folder per business, deployable static HTML
  (`index.html`, `about/`, `services/…`, `service-areas/…`, `contact/`, `faq/`,
  `sitemap.xml`, `robots.txt`), plus a browsable `index.html` gallery.
- `dist/reports/generation-report.xlsx` — the **control sheet** (one row per
  business; primary/secondary/accent/background cells are painted with the
  actual colors) + a `.csv` mirror.
- `dist/reports/design-registry.json` — the **persistent design registry** so
  re-runs and incremental batches stay globally non-conflicting.
- `dist/reports/errors.md` — data + generation error/warning report.

### Preview the output locally

The sites use root-absolute links (`/services/`), so serve the folder:

```bash
node - <<'EOF'
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2]||'dist/generated-sites/preview';
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
fs.readFile(path.join(root,p),(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200);s.end(d)})}).listen(8199,()=>console.log('http://localhost:8199'));
EOF
```

---

## Why this stack

**Zero-dependency Node ESM producing static HTML/CSS.** The engine reads and
writes `.xlsx` itself (a workbook is just zipped XML) and emits plain static
files. Rationale:

| Requirement | Why this choice satisfies it |
|---|---|
| **Determinism** | No `Math.random()`, no build nondeterminism — every design is a pure function of `hash(domain+name)`. |
| **Scale (1→10,000+)** | Pure string generation; ~0.02s/site, near-linear. No per-site framework overhead. |
| **SEO / static** | Fully static HTML with clean URLs, JSON-LD, sitemaps — nothing to hydrate. |
| **Performance** | Inlined critical CSS, inline-SVG images (no network round-trips), minimal JS (one tiny nav toggle). |
| **No install / offline / reproducible** | No `npm install`; runs anywhere Node runs. Ideal for reproducible batch runs. |
| **Maintainability / extensibility** | Config-driven themes/services/page-types; adding a theme or service needs no core changes. |

A framework (Astro/Next) was considered and rejected for this job: the output is
static, the variation logic is bespoke, and avoiding a dependency tree keeps
1,000-site runs fast and reproducible. Types are provided via JSDoc so the code
is checkable with `tsc --checkJs` without a build step; migrating to `.ts` later
is mechanical.

---

## The most important rule: no fabrication

The supplied dataset contains only **domain, business name, city, state, brand
color** (+ per-city population/geo). It has **no phone, address, reviews,
ratings, hours, years-in-business, licenses, warranties, or service-area lists.**

The engine therefore **never invents** any of those. Concretely:

- Review, rating, phone, and service-area components are **omitted** unless the
  data is actually present.
- CTAs fall back to “Get a Quote” (→ contact) rather than a fake phone number.
- The “emergency” section is framed as *situation urgency* (a stuck door leaves
  your home open), never as a claimed 24/7 / same-day availability.
- Structured data emits only real fields — **no `aggregateRating`/review markup.**
- A QA scan flags claim phrases (`24/7`, `licensed`, `warranty`, …) so any that
  appear (e.g. inside approved rich content) get human review.

See [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) for the full data-reality
analysis and every decision that followed from it.

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — modules, data model, pipeline.
- [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) — dataset reality + no-fabrication policy + content model.
- [`docs/ADDING.md`](docs/ADDING.md) — add a theme, service, page type, or column.

## CLI reference

| Command | Effect |
|---|---|
| `--preview [N]` | N representative sites across N themes (default 5) |
| `--business <domain>` | one business |
| `--limit <N>` | first N businesses |
| `--all` | every business |
| `--theme-gallery` | one site per theme (all 18) |
| `--plan` | uniqueness plan + control sheet only, no site files |
| `--out <dir>` | output directory |
| `--workbook <path>` | source `.xlsx` |
| `--fresh-registry` | ignore the persisted registry (fresh uniqueness plan) |
| `--no-qa` | skip QA |
| `--year <YYYY>` | footer/copyright year |
