/**
 * Central generation configuration. Nothing important is hardcoded in the
 * engine internals - tune behaviour here.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const config = {
  paths: {
    root: ROOT,
    // Source workbook. Never written to. Resolved relative to repo parent.
    workbook: path.resolve(ROOT, '..', 'GarageDoor_1000_SITE_BUILD_SHEET.xlsx'),
    // Pre-generated rich content lives in the sibling `contents/` folder.
    // Layout (Dallas is the reference sample): contents/<city>-<state>/<prefix>-<type>-<slug>.json
    // Lookups fall back across contents/<domain>/, contents/<city>-<state>/, contents/<city>/
    contentDir: path.resolve(ROOT, '..', 'contents'),
    // Where generated static sites are written - one folder per business
    // DIRECTLY under dist/ (e.g. dist/dallasdoorpros.com-dallas/).
    outDir: path.resolve(ROOT, 'dist'),
    // Reports (control sheet, errors, uniqueness) go here.
    reportDir: path.resolve(ROOT, 'dist', '_reports'),
    // Persistent design registry: every generated site's resolved design is
    // recorded here so re-runs and incremental batches stay globally
    // non-conflicting (see src/engine/registry.js).
    registry: path.resolve(ROOT, 'dist', '_reports', 'design-registry.json'),
    // Persistent cross-site image usage counts (src/engine/image-usage.js) -
    // lets photo selection prefer images no other business has used yet,
    // instead of picking independently per business and colliding by chance.
    imageUsageRegistry: path.resolve(ROOT, 'dist', '_reports', 'image-usage.json'),
  },

  // Which sheet holds the authoritative business list, and its header aliases.
  // The mapping layer is alias-driven so renamed columns keep working.
  excel: {
    businessSheet: 'Site Build Sheet',
    citySheet: 'GDR-1000-TAB1-CITIES',
    // Canonical field -> accepted header names (case/space-insensitive match).
    columnAliases: {
      serial: ['#', 'no', 'serial', 'id'],
      domain: ['domain (purchased)', 'domain', 'purchased domain', 'website', 'url'],
      name: ['business name', 'company name', 'name', 'suggested business name'],
      city: ['city'],
      address: ['address'],
      state: ['state', 'st'],
      primaryColor: ['primary color', 'brand color', 'color'],
    },
    cityColumnAliases: {
      city: ['city'],
      state: ['state'],
      population: ['population', 'pop'],
      lat: ['lat', 'latitude'],
      lng: ['lng', 'longitude', 'lon'],
      countyFips: ['county_fips', 'county fips'],
      tier: ['tier'],
      demand: ['demand_per_mo', 'demand'],
      winnability: ['winnability'],
      suburbsFound: ['suburbs_found', 'suburbs'],
      neighborhoodsFound: ['neighborhoods_found', 'neighborhoods'],
      domain: ['purchased domain', 'domain 1 (.com avail)'],
    },
  },

  uniqueness: {
    // Minimum acceptable pairwise distance (0..100). Below this, the losing
    // site's variant config is deterministically re-rolled. Same-theme sites
    // realistically reach ~40-70 via color/font/layout/variant divergence;
    // different-theme sites score 70-100. Across 1000 sites the AVERAGE pairwise
    // difference is ~78; this bar targets the closest-neighbour floor so no site
    // is a near-copy of a recent one.
    // Raised 46->70 (2026-08-24, explicit user requirement: "unique score
    // need to 70% for all sites"). Caveat worth knowing before raising this
    // further: THEME itself is picked from baseSeed only (see pickTheme() in
    // seed.js) and is never touched by the reroll loop - only
    // section/component variants and palette get rerolled. Two businesses
    // that happen to hash to the SAME theme therefore have a real ceiling
    // on how far apart variant/palette divergence alone can push them,
    // and maxRerolls exhausting without reaching 70 is possible for an
    // unlucky same-theme pair (the loop still returns its best-effort
    // result, it does not error). For small batches (a handful of
    // businesses at a time, e.g. one Shahin assignment run) this is safe -
    // verify actual scores after generating and manually re-roll/force a
    // different theme for any site that still lands below 70, same as the
    // 2026-08-24 assignment-generation-process memory's mandatory QA step.
    minScore: 70,
    // Max re-roll attempts before we accept the best-effort config.
    maxRerolls: 14,
    // HARD cooldown: once a site uses a given variant on a per-section or
    // per-component axis (services/why/process/.../hero/nav/.../ctaStyle -
    // see SECTION_AXES/PRIMARY_AXES in uniqueness.js), that variant is
    // EXCLUDED from the axis's candidate pool for this many subsequent
    // sites - not just "avoid the immediately preceding site" (the old
    // behavior). Clamped per-axis to `poolSize - 1` so a small pool (e.g. a
    // 2-option axis) can never lock generation up entirely; see
    // dist/_reports/section-variant-usage.md for which axes are actually
    // capacity-limited below this window and need more real variants added
    // to POOLS/SECTION_POOLS before they can honor the full cooldown.
    sectionCooldown: 12,
    // How many previously-generated configs to compare against. For big runs
    // we compare within a sliding window for O(n·window) instead of O(n^2).
    compareWindow: 400,
    // Weight of each axis in the 0..100 difference score (sums to 100).
    // `layout` is weighted up because it carries the per-section STRUCTURAL
    // layouts (services/why/process/stats/areas skeletons) - the axis the user
    // most wants distinct across sites - see sectionsDist in uniqueness.js.
    weights: {
      theme: 15,
      layout: 18,
      components: 13,
      typography: 9,
      colors: 10,
      hero: 10,
      sectionOrder: 10,
      contentStructure: 10,
      footer: 5,
    },
  },

  content: {
    // If true and no rich content JSON exists, still emit safe fallback pages.
    fallbackWhenMissing: true,
    // Content-declared URLs (`page.url`) are authoritative for every page's
    // PATH. This flag governs only the trailing slash on that path.
    //
    // Real exports are inconsistent about it: the Parsippany and Abilene
    // exports publish their nine service pages with NO trailing slash
    // (`/garage-door-repair-parsippany-nj`) while every other page type has
    // one. Both forms are written to the same file, `<path>/index.html`, so
    // the difference is purely about whether the HOST resolves an
    // extensionless path to that directory's index.
    //
    // Sites deploy to Cloudflare R2 (see a site repo's
    // `.github/workflows/deploy.yml`), and every URL known to serve there
    // today ends in `/`. Whether `/foo` also resolves is UNVERIFIED - it could
    // not be checked from here, because every origin sits behind a Cloudflare
    // bot challenge that neither curl nor a headless browser passes.
    //
    // So the trailing slash is normalized ON by default: same path segments
    // the content authored, in the one shape this host is known to serve.
    // Set to false to emit each URL exactly as authored - only once someone
    // has loaded an extensionless URL on a live site in a real browser and
    // confirmed it returns the page rather than a 404.
    trailingSlashUrls: true,
    // Hard rule: fields the engine will NEVER invent. If not present in data or
    // an approved content file, the related component is omitted entirely.
    neverFabricate: [
      'phone', 'email', 'address', 'reviews', 'rating', 'reviewCount',
      'yearsInBusiness', 'licenses', 'certifications', 'warranties',
      'guarantees', 'pricing', 'emergency247', 'sameDay', 'financing',
      'brands', 'awards', 'hours', 'serviceAreaList',
    ],
  },

  seo: {
    // Sites are generated as domain-relative static files; canonical uses https.
    scheme: 'https',
    twitterCard: 'summary_large_image',
    generateSitemap: true,
    generateRobots: true,
    // llms.txt at the site root (https://llmstxt.org) - a markdown index of
    // the site for LLMs: identity + real NAP, the export's researched local
    // facts, and every generated page grouped by kind. Built from the pages
    // actually written, so its links stay correct (src/seo/llms.js).
    generateLlmsTxt: true,
    jsonLd: true,
  },

  features: {
    // Sticky bottom call/quote bar on tablet + mobile widths (see
    // .mobile-cta's media query in design/css.js for the breakpoint).
    stickyMobileCta: true,
    breadcrumbs: true,
    faqSchema: true,        // only emitted when real FAQ content exists
    lazyImages: true,
    inlineCriticalCss: true,
    minifyHtml: true,
    // Section-wise scroll entrance animations (GSAP + ScrollTrigger, vendored
    // locally - see src/assets/vendor/ - no CDN, works offline like every
    // other asset). Off entirely honors prefers-reduced-motion at runtime
    // regardless of this flag; this flag controls whether the ~120KB of
    // vendored JS ships at all.
    sectionAnimations: true,
  },

  // Preview mode picks businesses that maximise theme spread.
  preview: {
    defaultCount: 5,
    spreadByTheme: true,
  },
};

export default config;
