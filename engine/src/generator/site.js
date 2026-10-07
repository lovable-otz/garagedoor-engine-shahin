/**
 * Site Generator: assemble every page for one business and write a deployable
 * static site (clean URLs → <path>/index.html) plus sitemap.xml and robots.txt.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';
import { resolveContent } from '../content/index.js';
import {
  buildHome, buildAbout, buildContact, buildServicePages,
  buildAreaPages, buildSuburbServicePages, buildFaqPage, buildQuote, buildProducts, buildFinancing, buildMaintenancePlans, buildReviews,
  buildResourcesIndex, buildTopicPages, buildPrivacy, buildTerms, buildAccessibility,
} from './pages.js';
import { sitemapXml, robotsTxt } from '../seo/sitemap.js';
import { llmsTxt } from '../seo/llms.js';
import { slugify } from '../util/strings.js';
import { localImgDestName } from '../assets/images.js';

// (VENDOR_DIR / VENDOR_FILES removed 2026-08-31 - nothing is copied into a
// site's assets/vendor/ any more. See the note further down in buildSite.)

/**
 * @param {string} [basePath]  e.g. '/east-point' when a site is deployed under
 *   a subpath instead of its own domain root (temporary multi-site preview
 *   hosting) - '' (domain-root deploy, the normal/production case) otherwise.
 */
function buildUrls(basePath = '', content = null) {
  const b = basePath ? basePath.replace(/\/$/, '') : '';
  // The canonical scheme (src/content/index.js owns it):
  //   /<city>/                     city hub - the parent of both the service
  //                                pillars and the suburbs, so it replaces the
  //                                old separate /services/ and /service-areas/
  //                                indexes rather than sitting alongside them.
  //   /<city>/<service>/           service pillar
  //   /<city>/<suburb>/            suburb
  //   /<city>/<suburb>/<service>/  suburb service
  //   /blog/<slug>/                guide
  // Every other page (/about/, /contact/, /faq/, /request-a-quote/,
  // /garage-doors/, the legal pages) stays at the site root.
  const city = content?.citySlug || 'service-area';
  const hub = `${b}/${city}/`;
  return {
    base: b,
    home: `${b}/`, about: `${b}/about/`,
    // `services` and `areas` are deliberately the SAME page. Both nav
    // megamenus point at the hub; their item lists still differ.
    // Sitemap spec 2026-09-13: /<city>/ is the hub for services AND suburbs;
    // /service-areas/ is a separate areas index. areaBase stays the hub because
    // suburb pages live UNDER it (/<city>/<suburb>/).
    services: hub, serviceBase: hub,
    areas: `${b}/service-areas/`, areaBase: hub,
    cityHub: hub,
    contact: `${b}/contact/`, faq: `${b}/faq/`,
    quote: `${b}/request-a-quote/`, maintenancePlans: `${b}/maintenance-plans/`, products: `${b}/garage-doors/`, financing: `${b}/financing/`, reviews: `${b}/reviews/`,
    resources: `${b}/blog/`, resourceBase: `${b}/blog/`,
    privacy: `${b}/privacy/`, terms: `${b}/terms/`, accessibility: `${b}/accessibility/`,
  };
}

/**
 * Output folder name for a business's site: `<domain>` - the same name as the
 * site's GitHub repo (user 2026-10-07: "foldername will be with the domain
 * name as the repo name is with the domain").
 *
 * Sites built before that used `<domain>-<city>` and many of those folders
 * are local git repos of shipped sites. Pass `outRoot` and an existing legacy
 * folder keeps being used (when no `<domain>` folder exists yet), so a
 * rebuild of an old site lands in its own repo instead of a fresh copy.
 * The folder name is organizational only - sites use root-absolute links and
 * deploy to their own domain, so this never affects internal routing.
 */
export function siteFolderName(business, outRoot = null) {
  const domain = business.domain || slugify(business.name);
  const city = slugify(business.city);
  if (outRoot && city) {
    const legacy = `${domain}-${city}`;
    if (!fs.existsSync(path.join(outRoot, domain)) && fs.existsSync(path.join(outRoot, legacy))) return legacy;
  }
  return domain;
}

/**
 * Which pages this site will actually generate. This is the SINGLE SOURCE OF
 * TRUTH: both page generation (below) and every link renderer (nav, footer,
 * sidebar) gate on `ctx.has`, so the engine can never render a link to a page
 * it didn't build (no dead links).
 */
export function computeHas(business, content) {
  const site = business.site || {};
  return {
    home: true, contact: true, quote: true, products: true,
    about: !!content.about,
    services: (content.services || []).length > 0,
    areas: (content.areas || []).length > 0,
    guides: (content.topics || []).length > 0,
    financing: !!site.financing,
    reviews: !!((business.reviews && business.reviews.length) || (site.reviewBadges && site.reviewBadges.length)),
    faq: (content.faq || []).length >= 3,
    privacy: !!content.privacy,
    terms: !!content.terms,
    accessibility: !!content.accessibility,
  };
}

/** Build the render context shared by all components. */
export function makeContext(business, design, content, year, basePath = '') {
  return {
    business, design, palette: design.palette, content,
    site: business.site || {}, urls: buildUrls(basePath, content), features: config.features, year,
    has: computeHas(business, content),
  };
}

/** Write a page at a clean URL path. */
function writePage(root, pathname, html) {
  const rel = pathname === '/' ? 'index.html' : path.join(pathname.replace(/^\/|\/$/g, ''), 'index.html');
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return { pathname, file, bytes: Buffer.byteLength(html) };
}

/**
 * @param {import('../data/model.js').Business} business
 * @param {object} design  assignDesign()/assignUnique().design result
 * @param {object} [opts]
 * @param {string} [opts.outDir]
 * @param {number} [opts.year]
 * @param {boolean} [opts.write]  write to disk (default true)
 * @param {string} [opts.basePath]  subpath prefix for a temporary multi-site
 *   preview deploy - see `buildUrls`. Leave unset for a normal domain-root site.
 */
export function buildSite(business, design, opts = {}) {
  const outRoot = opts.outDir || config.paths.outDir;
  const year = opts.year || new Date().getFullYear();
  const write = opts.write !== false;
  const content = resolveContent(business);
  const ctx = makeContext(business, design, content, year, opts.basePath || '');

  const dirName = siteFolderName(business, outRoot);
  const siteDir = path.join(outRoot, dirName);
  // Clean the site's output folder first so pages removed since the last run
  // (e.g. a disabled Financing page, or area pages whose slugs changed after a
  // content rewrite) don't linger as stale orphans. Never touch a `.git` here -
  // per-site output dirs get their own git repo (see generate-assignment.mjs),
  // and wiping it on every regeneration silently resets commit history back to
  // one fresh commit each time, which is real, unrecoverable data loss.
  if (write) {
    try {
      for (const entry of fs.readdirSync(siteDir)) {
        if (entry === '.git') continue;
        fs.rmSync(path.join(siteDir, entry), { recursive: true, force: true });
      }
    } catch { /* siteDir doesn't exist yet - nothing to clean */ }
  }
  const pages = [];
  const seenPaths = new Set();
  const duplicatePaths = [];
  /**
   * Two content entries can slugify onto the SAME pathname - real export data
   * does this whenever a neighbourhood is listed under two spellings or a
   * suburb appears in both the areas list and the suburb folder. Measured
   * 2026-08-27: 5 of 36 sites, Toms River worst at 15 collisions all landing
   * on /service-areas/allenwood/.
   *
   * WRITING the page twice is harmless (the second overwrites the first), but
   * RECORDING it twice put the same <loc> in sitemap.xml twice and the same
   * link in llms.txt twice - a real SEO defect, and it inflated pageCount.
   * Deduped here, at the single chokepoint every page type passes through, so
   * no individual builder can reintroduce it.
   */
  const record = (pathname, html) => {
    // Keyed WITHOUT the trailing slash: content-declared service URLs carry no
    // trailing slash while every other type does, so `/x` and `/x/` are the
    // same output file (`x/index.html`) and must collide as one.
    const key = pathname.replace(/\/+$/, '') || '/';
    if (seenPaths.has(key)) { duplicatePaths.push(pathname); return; }
    seenPaths.add(key);
    if (write) pages.push(writePage(siteDir, pathname, html));
    // When not writing, keep HTML in memory so QA and previews still work.
    else pages.push({ pathname, bytes: Buffer.byteLength(html), html });
  };

  // Core pages (always).
  record('/', buildHome(ctx));
  const about = buildAbout(ctx); if (about) record('/about/', about);
  record('/contact/', buildContact(ctx));
  record(ctx.urls.quote, buildQuote(ctx));
  record('/garage-doors/', buildProducts(ctx));
  // Both build ONLY from real exported content (none exists today) - see
  // buildFinancing / buildMaintenancePlans.
  const fin = buildFinancing(ctx); if (fin) record(ctx.urls.financing, fin);
  const plans = buildMaintenancePlans(ctx); if (plans) record(ctx.urls.maintenancePlans, plans);
  const rev = buildReviews(ctx); if (rev) record('/reviews/', rev);

  // Service pillar pages. There is no separate /services/ index any more -
  // the city hub at /<city>/ lists the services AND the suburbs, and
  // ctx.urls.services points at it.
  for (const s of buildServicePages(ctx)) record(s.pathname, s.html);

  // Service areas - only when real areas exist.
  const areaOut = buildAreaPages(ctx);
  if (areaOut.cityHub) record(ctx.urls.cityHub, areaOut.cityHub);
  if (areaOut.index) record(ctx.urls.areas, areaOut.index);
  for (const a of areaOut.pages) record(a.pathname, a.html);

  // Suburb-service pages (07-suburb-services/), nested under their suburb.
  // Recorded AFTER the suburb pages so a parent is always written before its
  // children - not required by anything, but it keeps sitemap.xml in the order
  // a reader would expect.
  for (const s of buildSuburbServicePages(ctx)) record(s.pathname, s.html);

  // Resources / guides - only when topic articles exist in the content folder.
  const resIndex = buildResourcesIndex(ctx);
  if (resIndex) {
    record(ctx.urls.resources, resIndex);
    for (const t of buildTopicPages(ctx)) record(t.pathname, t.html);
  }

  // FAQ page - only with genuine FAQ content.
  const faqPage = buildFaqPage(ctx); if (faqPage) record('/faq/', faqPage);

  // Legal/utility pages - only when the operator's export actually shipped
  // real copy (see content/adapter.js LEGAL_FILES) - never fabricated.
  const priv = buildPrivacy(ctx); if (priv) record('/privacy/', priv);
  const terms = buildTerms(ctx); if (terms) record('/terms/', terms);
  const a11y = buildAccessibility(ctx); if (a11y) record('/accessibility/', a11y);

  // Real local photos this site actually referenced (config/local-photos.js,
  // via src/assets/images.js) - copy them into the site's own assets/img/
  // now that every page has been rendered (a static deployable site can't
  // reach back into this repo's source tree for them).
  if (write && ctx._localPhotosUsed && ctx._localPhotosUsed.size) {
    const imgDir = path.join(siteDir, 'assets', 'img');
    fs.mkdirSync(imgDir, { recursive: true });
    for (const src of ctx._localPhotosUsed) {
      try { fs.copyFileSync(src, path.join(imgDir, localImgDestName(src))); }
      catch { /* source photo missing/unreadable - page still has its src attr, just 404s the image */ }
    }
  }

  // NO assets/vendor/ is written any more (removed 2026-08-31).
  //
  // This used to copy gsap.min.js + ScrollTrigger.min.js + section-animations.js
  // (136 KB) into every site. All three became unreachable dead weight when the
  // animation wiring changed: the two libraries now load from cdnjs and
  // section-animations.js is inlined into each page by layout.js (see the long
  // comment there for why - Cloudflare 403s every .js on the sites' own origin).
  // Verified before deleting: across the 10 newest sites' 522 pages, ZERO
  // `<script src>` pointed at assets/vendor/. The only textual hits were a CSS
  // comment and this file's own header, not live references.
  //
  // They are NOT a fallback: a local copy cannot help when the origin refuses to
  // serve .js at all, which is the exact failure this design works around.
  // src/assets/vendor/section-animations.js still exists and is REQUIRED -
  // layout.js reads it at build time to inline it. It is just never copied out.

  // SEO files.
  const paths = pages.map((p) => p.pathname);
  if (write && config.seo.generateSitemap) fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), sitemapXml(business, paths));
  if (write && config.seo.generateRobots) fs.writeFileSync(path.join(siteDir, 'robots.txt'), robotsTxt(business));
  // llms.txt - written AFTER every page is recorded, because it indexes the
  // pages that were actually built (see seo/llms.js) rather than a predicted
  // list, so its links can never point at a page this run didn't produce.
  if (write && config.seo.generateLlmsTxt) fs.writeFileSync(path.join(siteDir, 'llms.txt'), llmsTxt(ctx, pages));

  return {
    domain: business.domain,
    slug: business.slug,
    dirName,
    dir: siteDir,
    contentSource: content.source,
    pageCount: pages.length,
    // Surfaced rather than silently swallowed: a collision means two content
    // entries share a slug, which is worth knowing about even though the
    // output is now correct either way.
    duplicatePaths,
    pages,
    totalBytes: pages.reduce((s, p) => s + p.bytes, 0),
  };
}

export default buildSite;
