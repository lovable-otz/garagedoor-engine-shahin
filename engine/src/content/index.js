/**
 * Content resolution: merge pre-generated rich content (if present) with the
 * safe fallback builder, producing one normalized content bundle the generator
 * consumes regardless of source.
 *
 * Precedence: a page from the rich content folder always wins; anything the
 * folder doesn't provide falls back to non-fabricated builder content (when
 * enabled). We never fabricate to fill a gap - e.g. if there are no
 * neighborhood/suburb files, there are simply no service-area pages.
 *
 * ── THIS FILE OWNS EVERY INTERNAL URL ─────────────────────────────────────
 * Each entry carries a resolved `href`, and every renderer (nav, footer,
 * sidebar, area grids, sitemap, llms.txt) links to THAT rather than rebuilding
 * a path from a slug. Building the path in ~14 different renderers is how a
 * link and its page drift apart; one resolver means a page and every link to
 * it are the same string by construction.
 *
 * ── THE CANONICAL URL SCHEME (user spec, 2026-09-10) ──────────────────────
 *
 *   service pillar   /<city>/<service>/            /parsippany/garage-door-repair/
 *   suburb           /<city>/<suburb>/             /parsippany/denville/
 *   suburb service   /<city>/<suburb>/<service>/   /parsippany/denville/opener-repair/
 *   guide            /blog/<slug>/                 /blog/noises-that-mean-something/
 *   city hub         /<city>/                      /parsippany/
 *
 * The engine GENERATES these. It no longer routes on the content's own
 * `page.url` - that field is now informational only.
 *
 * This supersedes the 2026-09-09 "content URLs win everywhere" decision. That
 * held for one day and was replaced when the user supplied this spec, which
 * was the structure missing from their original message. The reason it had to
 * change: `page.url` is not consistent even within one export - the same
 * service is `garage-door-installation` on the city page and
 * `new-door-installation` on the suburb pages, so a city pillar and its
 * matching suburb page would never have shared a slug. Generating both from
 * one `serviceUrlSlug()` guarantees they pair up.
 *
 * `<city>` is the business's own city slug; `<service>` comes from
 * `serviceUrlSlug()` in config/services.js (short forms - the spec's examples
 * are `opener-repair`, not `garage-door-opener-repair`).
 */

import { loadContent } from './adapter.js';
import { buildFallbackContent } from './builder.js';
import { config } from '../../config/generation.config.js';
import { titleCase } from '../util/strings.js';
import { SERVICES } from '../../config/services.js';

import { slugify } from '../util/strings.js';
import { serviceUrlSlug } from '../../config/services.js';

/**
 * The canonical scheme. Every internal page path is built here and nowhere
 * else. Each returns a path with a leading AND trailing slash - the shape the
 * sites' Cloudflare R2 host is known to serve (see the note on
 * config.content.trailingSlashUrls).
 */
const citySlugOf = (business) => slugify(business.city) || 'service-area';
const cityHubHref = (city) => `/${city}/`;
const serviceHrefOf = (city, slug) => `/${city}/${serviceUrlSlug(slug)}/`;
const areaHrefOf = (city, slug) => `/${city}/${slug}/`;
const subServiceHrefOf = (city, areaSlug, slug) => `/${city}/${areaSlug}/${serviceUrlSlug(slug)}/`;
const guideHrefOf = (slug) => `/blog/${slug}/`;

/**
 * @param {import('../data/model.js').Business} business
 * @param {object} [opts]
 * @param {boolean} [opts.fallback] override config.content.fallbackWhenMissing
 */
export function resolveContent(business, opts = {}) {
  const useFallback = opts.fallback ?? config.content.fallbackWhenMissing;
  const rich = loadContent(business);
  const fb = useFallback ? buildFallbackContent(business) : null;
  const city = citySlugOf(business);

  const emptyExtras = {
    faqPage: null, quote: null, privacy: null, terms: null, accessibility: null,
    areasHub: null, areasHubHref: '/service-areas/', citySlug: city, financing: null, maintenancePlans: null,
    droppedAreas: [],
  };

  if (!rich.found) {
    if (fb) return { ...fb, ...emptyExtras, ...withSchemeHrefs(fb, city), source: 'fallback', hasRich: false };
    // No content at all - minimal home only.
    return {
      source: 'none', hasRich: false,
      home: buildFallbackContent(business).home,
      about: null, contact: null, services: [], areas: [], topics: [], faq: [],
      ...emptyExtras,
    };
  }

  // Rich content present. Merge.
  const home = rich.home || fb?.home || buildFallbackContent(business).home;

  // Services are CONTENT-DRIVEN on rich sites: list only the services that have a
  // real content page. Core-catalog services with no content (e.g. Broken Spring
  // Repair, Opener Repair) are NOT shown unless the city actually wrote them.
  // (Data-less fallback sites still get the universal core set - see builder.js.)
  const svcOrder = (id) => { const i = SERVICES.findIndex((s) => s.id === id); return i < 0 ? 999 : i; };
  const services = rich.services
    .filter((r) => r.page)
    .map((r) => ({
      id: r.id,
      service: r.service || business.services.find((s) => s.id === r.id) || { id: r.id, label: titleCase(r.id.replace(/-/g, ' ')), icon: 'wrench', blurb: '' },
      page: r.page,
      // From the id, NOT the export's raw filename slug - see serviceUrlSlug().
      href: serviceHrefOf(city, r.id),
      contentUrl: r.url,
    }))
    .sort((a, b) => svcOrder(a.id) - svcOrder(b.id));

  // Suburbs FIRST, so a suburb wins any slug clash against a neighborhood of
  // the same name - see dedupeAreas().
  const { areas: allAreas, dropped } = dedupeAreas([
    ...rich.suburbs.map((n) => makeArea(n, 'suburb', city)),
    ...rich.neighborhoods.map((n) => makeArea(n, 'neighborhood', city)),
  ], services, business);
  const areas = allAreas;

  attachSuburbServices(areas, rich.suburbServices || [], city, business, services);
  const pruned = pruneChildlessAreas(areas, rich.suburbServices || [], business);
  dropped.push(...pruned);

  // Rich topic guides win; if the export shipped none, fall back to the
  // universal (category-knowledge) guides so the Guides menu is never empty.
  const topics = rich.topics.length
    ? rich.topics.map((t) => ({ slug: t.slug, name: areaName(t.page, t.slug), page: t.page, href: guideHrefOf(t.slug), contentUrl: t.url }))
    : (fb?.topics || buildFallbackContent(business).topics).map((t) => ({ ...t, href: guideHrefOf(t.slug) }));

  const hub = rich.hub['service-areas'];

  rewriteAuthoredLinks({ services, areas, topics, dropped, hub, home, trust: rich.trust, legal: rich.legal }, city);
  scrubUnpublishedNames({ services, areas, topics, hub, home, trust: rich.trust, legal: rich.legal }, dropped, areas, business);
  if (DISTANCE_LIST_SITES.has(business.domain)) distanceListsToBullets({ services, areas, topics, hub, home, trust: rich.trust, legal: rich.legal });

  return {
    source: 'content',
    hasRich: true,
    dir: rich.dir,
    citySlug: city,
    home,
    // Real per-page trust content wins over the generic fallback builder's
    // about/contact copy - see adapter.js's -trust- marker handling.
    about: rich.trust.about || fb?.about || null,
    contact: rich.trust.contact || fb?.contact || null,
    services,
    areas,
    topics,
    faq: Array.isArray(home.faq) ? home.faq : [],
    // Dedicated /faq/ page content (title/h1/meta/prose sections + its OWN
    // faq array, richer than the flat home.faq list used elsewhere) - null
    // when the export didn't ship one, buildFaqPage() falls back to the
    // generic composed page it already builds.
    faqPage: rich.trust.faq || null,
    quote: rich.trust.quote || null,
    privacy: rich.legal.privacy || null,
    terms: rich.legal.terms || null,
    accessibility: rich.legal.accessibility || null,
    // The export's `-hub-service-areas` copy now introduces the CITY HUB at
    // /<city>/, which is the parent of both the service pillars and the
    // suburbs rather than an areas-only index.
    areasHub: hub?.page || null,
    // Sitemap spec 2026-09-13: /service-areas/ is back as its own areas index
    // (all suburbs visible), separate from the /<city>/ hub. The export's
    // -hub-service-areas copy introduces THAT page.
    areasHubHref: '/service-areas/',
    // Build only from real content - no export ships either today.
    financing: rich.trust.financing || null,
    maintenancePlans: rich.trust.maintenancePlans || null,
    // Surfaced so the generator can report it rather than silently losing pages.
    droppedAreas: dropped,
  };
}

function makeArea(entry, type, city) {
  return {
    slug: entry.slug,
    name: areaName(entry.page, entry.slug),
    type,
    page: entry.page,
    href: areaHrefOf(city, entry.slug),
    contentUrl: entry.url,
    file: entry.file,
    services: [],
  };
}

/**
 * `/<city>/<slug>/` is ONE namespace shared by suburbs, neighborhoods and the
 * service pillars, so a slug can only be spent once. Two real collisions:
 *
 * 1. **A place published as both a suburb and a neighborhood.** Parsippany
 *    ships 9 of these (whippany, towaco, oak-ridge, pine-brook,
 *    pompton-plains, lake-hiawatha, lake-telemark, newfoundland,
 *    white-meadow-lake) - near-duplicate copy for the same town, written once
 *    as "a Parsippany neighborhood" and once as "<Town>, NJ homes". The
 *    SUBURB wins: it is the type that carries the nested service pages
 *    (Whippany has eight), and hanging those under the discarded copy would
 *    orphan them.
 * 2. **An area whose slug equals a service slug.** Never seen in real data,
 *    but `/parsippany/roller-replacement/` can only be one page, and the
 *    service pillar is the more valuable of the two.
 *
 * Callers get the dropped entries back so the run can report them - losing a
 * page silently is how a content gap goes unnoticed for weeks.
 */
function dedupeAreas(list, services, business) {
  const serviceSlugs = new Set(services.map((s) => s.href));
  const seen = new Map();
  const areas = [];
  const dropped = [];
  for (const a of list) {
    if (serviceSlugs.has(a.href)) {
      dropped.push({ ...a, reason: 'slug taken by a service pillar' });
      continue;
    }
    const winner = seen.get(a.href);
    if (winner) {
      dropped.push({ ...a, reason: `duplicate of the ${winner.type} page for the same place` });
      continue;
    }
    seen.set(a.href, a);
    areas.push(a);
  }
  if (dropped.length) {
    console.warn(`[content] ${business.domain}: ${dropped.length} area page(s) dropped to a slug clash: ${dropped.slice(0, 4).map((d) => d.slug).join(', ')}${dropped.length > 4 ? ', ...' : ''}`);
  }
  return { areas, dropped };
}

/**
 * Publish ONLY the suburbs that have their own service pages.
 *
 * User instruction, 2026-09-10: *"use only these suburb which has contents
 * inside suburb services folder"*. Parsippany's export lists 166 areas but
 * authored nested services for just five (denville, east-hanover, hanover,
 * livingston, whippany) - the other 161 were thin, near-identical pages with
 * nothing under them. Five is also what the URL spec asks for ("approximately
 * 4-8 suburb/service-area pages").
 *
 * GATED on the export actually having a `07-suburb-services/` folder. Every
 * older export has none, and pruning on "no children" there would delete that
 * site's entire service-areas tree - all 79 content folders in `contents/`
 * predate this folder. So: no suburb-service content, no pruning.
 *
 * Mutates `areas` in place, and returns what it removed so the run can report
 * it rather than silently shipping a smaller site.
 */
function pruneChildlessAreas(areas, suburbServices, business) {
  if (!suburbServices.length) return [];
  const keep = areas.filter((a) => a.services.length);
  if (!keep.length) return [];
  const removed = areas
    .filter((a) => !a.services.length)
    .map((a) => ({ ...a, reason: 'no pages in 07-suburb-services/' }));
  areas.length = 0;
  areas.push(...keep);
  if (removed.length) {
    console.warn(`[content] ${business.domain}: ${removed.length} area page(s) not published - no suburb-service content (kept ${keep.length}: ${keep.map((a) => a.slug).join(', ')})`);
  }
  return removed;
}

/**
 * Hang each suburb-service page off its parent area.
 *
 * Matched on the SLUG out of `page.custom_id`
 * (`parsippany-nj|ss|east-hanover|garage-door-repair`), which is the only
 * reliable split - the filename `ss-east-hanover-garage-door-repair` has no
 * findable boundary between suburb and service.
 *
 * dedupeAreas() has already run, so exactly one area owns each slug and the
 * old neighborhood/suburb ambiguity cannot reach this point.
 *
 * A child whose parent page does not exist is DROPPED, with a warning - the
 * export refuses to write a suburb page when it has no real local fact for it
 * (4 such refusals in Parsippany), and a service page nested under a parent
 * that 404s is worse than no page at all.
 */
function attachSuburbServices(areas, suburbServices, city, business, cityServices = []) {
  if (!suburbServices.length) return;
  const bySlug = new Map(areas.map((a) => [a.slug, a]));
  // User rule, 2026-09-13: "services list (all the services in service-lines
  // folder) ... only these needs to generate, drop others". A suburb-service
  // is published ONLY if its service is one of the city's own services from
  // 02-service-lines/. Compared on the canonical URL segment, so export naming
  // differences (new-door-installation vs garage-door-installation) still match.
  const allowed = new Set(cityServices.map((s) => s.href.split('/').filter(Boolean).pop()));
  const offList = [];

  const orphans = [];
  const seenHrefs = new Set();
  for (const ss of suburbServices) {
    const parent = bySlug.get(ss.areaSlug);
    if (!parent) { orphans.push(ss.file); continue; }
    if (allowed.size && !allowed.has(serviceUrlSlug(ss.serviceSlug))) { offList.push(`${ss.areaSlug}/${ss.serviceSlug}`); continue; }
    // Built from the parent's OWN slug and the canonical service slug, so the
    // child path is always exactly the parent path plus one segment.
    const href = subServiceHrefOf(city, parent.slug, ss.serviceSlug);
    // Two export slugs can canonicalize onto one service (installation is
    // `new-door-installation` on suburb pages, `garage-door-installation` on
    // the city page). Within ONE suburb that would be two files at one URL.
    if (seenHrefs.has(href)) { orphans.push(ss.file); continue; }
    seenHrefs.add(href);

    parent.services.push({
      id: ss.id,
      slug: ss.serviceSlug,
      service: ss.service,
      label: ss.service?.label || titleCase(String(ss.serviceSlug).replace(/-/g, ' ')),
      page: ss.page,
      href,
      contentUrl: ss.url,
      area: parent,
    });
  }

  // Keep each suburb's child services in the catalog's own order so every
  // suburb lists them identically, rather than in directory-read order.
  const order = (id) => { const i = SERVICES.findIndex((s) => s.id === id); return i < 0 ? 999 : i; };
  for (const a of areas) a.services.sort((x, y) => order(x.id) - order(y.id) || x.label.localeCompare(y.label));

  if (offList.length) {
    console.warn(`[content] ${business.domain}: ${offList.length} suburb-service page(s) dropped - service not in 02-service-lines: ${offList.slice(0, 4).join(', ')}${offList.length > 4 ? ', ...' : ''}`);
  }
  if (orphans.length) {
    console.warn(`[content] ${business.domain}: ${orphans.length} suburb-service page(s) have no parent suburb page, skipped: ${orphans.slice(0, 3).join(', ')}${orphans.length > 3 ? ', ...' : ''}`);
  }
}

/** Fallback-content bundles carry no URLs of their own - put them on the scheme. */
function withSchemeHrefs(fb, city) {
  return {
    services: (fb.services || []).map((s) => ({ ...s, href: serviceHrefOf(city, s.id) })),
    areas: (fb.areas || []).map((a) => ({ ...a, href: areaHrefOf(city, a.slug), services: a.services || [] })),
    topics: (fb.topics || []).map((t) => ({ ...t, href: guideHrefOf(t.slug) })),
  };
}

/**
 * Rewrite the links the CONTENT AUTHORS wrote inside their prose.
 *
 * Authored bodies carry inline markdown links to the export's own URLs -
 * `[a new door](/garage-doors-hanover/)`, `[opener repair](/garage-door-opener-repair-parsippany-nj)`.
 * The engine now publishes those pages at generated paths instead, so every
 * one of those links would 404. Measured on Parsippany before this ran: 8 dead
 * internal links, a site-wide QA FAIL.
 *
 * Rewritten HERE, once, on the loaded bundle rather than in the renderers -
 * same place and same reason as normalizePhoneStrings() in adapter.js: the
 * `contents/` folder is re-pulled from each repo's content branch, so an edit
 * there is overwritten on the next pull.
 *
 * A page DROPPED to a slug clash maps to the page that won it - both describe
 * the same town, so a link to the discarded copy still lands on real, correct
 * content instead of nowhere.
 *
 * Only exact, whole `](/path)` targets that appear in the map are touched;
 * anything unrecognized is left alone rather than guessed at.
 */
function rewriteAuthoredLinks(bundle, city) {
  const norm = (u) => String(u || '').replace(/\/+$/, '') || '/';
  const map = new Map();
  const add = (from, to) => { if (from && to && norm(from) !== norm(to)) map.set(norm(from), to); };

  for (const s of bundle.services) add(s.contentUrl, s.href);
  for (const t of bundle.topics) add(t.contentUrl, t.href);
  for (const a of bundle.areas) {
    add(a.contentUrl, a.href);
    for (const ss of a.services) add(ss.contentUrl, ss.href);
  }
  // A page that is no longer published still needs its authored links to land
  // somewhere real. A de-duplicated place points at whichever page kept its
  // slug (same town, correct content); an un-published suburb points at the
  // city hub, which is the coverage page that replaced it.
  const byHref = new Map(bundle.areas.map((a) => [a.href, a]));
  for (const d of bundle.dropped) {
    const winner = byHref.get(d.href);
    add(d.contentUrl, winner ? winner.href : '/service-areas/');
  }
  add(bundle.hub?.url, '/service-areas/');
  // Authored links to the retired quote URL go to the booking page.

  // Every internal path this site will actually publish. An authored link to
  // anything else is unwrapped to plain text below - see the note there.
  const valid = new Set(['/', '/contact/', '/request-a-quote/', '/garage-doors/', '/service-areas/', `/${city}/`].map(norm));
  for (const s of bundle.services) valid.add(norm(s.href));
  for (const t of bundle.topics) valid.add(norm(t.href));
  for (const a of bundle.areas) { valid.add(norm(a.href)); for (const ss of a.services) valid.add(norm(ss.href)); }
  if (bundle.topics.length) valid.add('/blog');
  if (bundle.trust?.about) valid.add('/about');
  if (bundle.trust?.faq) valid.add('/faq');
  for (const k of ['privacy', 'terms', 'accessibility']) if (bundle.legal?.[k]) valid.add(`/${k}`);

  const rewrite = (node) => {
    if (typeof node === 'string') {
      if (!node.includes('](/')) return node;
      return node.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (m, label, url) => {
        const to = map.get(norm(url));
        if (to) return `[${label}](${to})`;
        if (valid.has(norm(url))) return m;
        // Unknown target: keep the authored WORDS, drop the link. Real case,
        // 2026-09-13: Newark's granville-south installation page linked to
        // /granville-south-garage-south-repair/ - a garbled URL that matches
        // no page, so it shipped as the site's only dead link. Unwrapping
        // never invents a destination, and it only touches authored markdown
        // links, so engine-generated links still go through QA's dead-link
        // check and real engine bugs still surface.
        return label;
      });
    }
    if (Array.isArray(node)) return node.map(rewrite);
    if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) {
        // `page` is the export's own metadata block, not rendered prose, and
        // `area` is a back-reference that would recurse forever.
        if (k === 'area') continue;
        node[k] = rewrite(node[k]);
      }
      return node;
    }
    return node;
  };

  for (const s of bundle.services) s.page = rewrite(s.page);
  for (const t of bundle.topics) t.page = rewrite(t.page);
  for (const a of bundle.areas) {
    a.page = rewrite(a.page);
    for (const ss of a.services) ss.page = rewrite(ss.page);
  }
  rewrite(bundle.home);
  if (bundle.hub?.page) rewrite(bundle.hub.page);
  rewrite(bundle.trust);
  rewrite(bundle.legal);
}

/**
 * Strip the NAMES of unpublished areas out of authored copy.
 *
 * User instruction, 2026-09-13: only the suburbs with 07-suburb-services pages
 * are shown - "dont show others suburbs" - and, asked how, "Remove only the
 * names". Exports mention nearby towns they never wrote service pages for
 * ("we cover Glenn Heights, Ovilla, Lancaster..."). The sentence is kept; only
 * the unpublished names (and the list separator next to each) are removed.
 *
 * Names come from this site's own dropped area pages, so nothing is guessed.
 * A name that is part of a published area's name, or of the city or business
 * name, is never touched (Miami publishes "Coral Gables" while an unpublished
 * neighborhood is also called that). All names are matched in one longest-first
 * pass, so "North Miami Beach" is not cut down to " Beach" by "North Miami".
 * Structural fields (urls, ids, slugs) are skipped.
 */
function scrubUnpublishedNames(bundle, dropped, areas, business) {
  const SKIP = new Set(['url', 'custom_id', 'links', 'href', 'slug', 'contentUrl', 'id', 'area', 'template', 'group', 'type', 'model', 'arm', 'status', 'last_updated', 'priority', 'words', 'target_words', 'file']);
  const keep = [...new Set([...areas.map((a) => a.name), business.city].filter(Boolean))];
  const okName = (n) => n && n.length >= 3 && n.split(/\s+/).length <= 5 && !/\d/.test(n);
  const drop = [...new Set(dropped.flatMap((d) => [d.name, titleCase(String(d.slug || '').replace(/-/g, ' '))]))]
    .filter((n) => okName(n)
      && !keep.some((k) => k.includes(n))
      && !String(business.city || '').includes(n)
      && !String(business.name || '').includes(n));
  // A place the export splits into several unpublished pages ("Lake Nona
  // Central", "Lake Nona Estates", "Lake Nona South" - Orlando, 2026-09-14) is
  // still written as just "Lake Nona" in prose. Add any leading run of 2+ words
  // shared by 2+ dropped names, unless it belongs to a published name or the city.
  const prefixCount = new Map();
  for (const n of drop) {
    const w = n.split(/\s+/);
    for (let k = 2; k < w.length; k++) { const pfx = w.slice(0, k).join(' '); prefixCount.set(pfx, (prefixCount.get(pfx) || 0) + 1); }
  }
  for (const [pfx, cnt] of prefixCount) {
    if (cnt >= 2 && !drop.includes(pfx)
      && !keep.some((k) => k.includes(pfx) || pfx.includes(k))
      && !String(business.city || '').includes(pfx) && !pfx.includes(String(business.city || '\u0000'))) drop.push(pfx);
  }
  if (!drop.length) return 0;
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const all = [...drop, ...keep].sort((a, b) => b.length - a.length);
  const any = new RegExp('(?<![\\w-])(?:' + all.map(reEsc).join('|') + ')(?![\\w-])', 'g');
  const dropSet = new Set(drop);
  // Placeholder characters that never occur in authored text.
  const D = String.fromCharCode(2);
  const K = String.fromCharCode(1);
  const KEEP_TOKEN = new RegExp(K + '(\\d+)' + K, 'g');
  let removed = 0;
  let droppedFaq = 0;
  const clean = (str) => {
    if (!drop.some((n) => str.includes(n))) return str;
    const kept = [];
    let s = str.replace(any, (m) => {
      if (dropSet.has(m)) return D;
      kept.push(m);
      return K + (kept.length - 1) + K;
    });
    const hits = s.split(D).length - 1;
    if (!hits) return str;
    removed += hits;
    // A removed name takes its own trailing parenthetical with it: in
    // "Lockeford (8 mi), Lodi Park (3 mi NNW)" the "(3 mi NNW)" belongs to the
    // removed place (Lodi service-areas, 2026-09-14).
    // ...and its trailing direction: "Alabama to the southwest" (Lehigh Acres,
    // 2026-10-12) left "closer to to the southwest" behind.
    const P = D + "(?:'s|’s)?(?:[ \\t]*\\([^)\\n]*\\))?(?:[ \\t]+to the (?:north|south|east|west)[a-z-]*)?";
    s = s
      // A place phrase whose places were ALL removed, up to its comma, goes as
      // a whole: ", closer to <A> to the southwest or <B> to the north, the
      // trip..." -> ", the trip..." (Lehigh Acres, 2026-10-12). Must run first,
      // before the list-separator rules below eat that comma.
      .replace(new RegExp(',[ \\t]*(?:closer to|nearer to|near|toward|towards|out to|as far as|between)[ \\t]+' + P + '(?:[ \\t]*(?:,|and|or|&)[ \\t]*' + P + ')*[ \\t]*,', 'g'), ',')
      .replace(new RegExp('[ \\t]*,[ \\t]*(?:(?:and|or)[ \\t]+)?' + P, 'g'), '')
      .replace(new RegExp(P + '[ \\t]*,[ \\t]*', 'g'), '')
      .replace(new RegExp('[ \\t]+(?:and|or|&)[ \\t]+' + P, 'g'), '')
      .replace(new RegExp(P + '[ \\t]+(?:and|or|&)[ \\t]+', 'g'), '')
      .replace(new RegExp('[ \\t]*' + P, 'g'), '')
      .replace(/[ \t]+([,.;:!?)])/g, '$1')
      .replace(/,(?:[ \t]*,)+/g, ',')
      .replace(/\([ \t]*\)/g, '')
      .replace(/,[ \t]*(?:and|or)[ \t]*([.;:!?])/g, '$1')
      .replace(/^[ \t]*,[ \t]*/gm, '')
      .replace(/[ \t]{2,}/g, ' ')
      // "from Todd Creek to Erie." loses Erie -> "around Todd Creek."
      .replace(/\bfrom ([^,.;:!?\n]{2,60}?) to([.,;:!?])/g, 'around $1$2')
      // A list that lost every name: "including, among others" / "out to."
      .replace(/\b(?:including|like|such as)[ \t]*,[ \t]*/g, 'including ')
      .replace(/[ \t]+(?:out to|as far as|including|like|such as|from|to|near|around|in)[ \t]*([.;:!])/g, '$1');
    // Second-order leftovers, repeated until stable: one rule's output can be
    // the next one's input ("from A to B." -> "from to." -> "from." needs two
    // passes). Seen 2026-10-12 on Henderson ("eight named pockets - from to
    // to - dates...", "built 1979-2006, from.") and Chandler ("Sun Lakes and
    // and how to reach us"). Deliberately narrow: plain "comes in." / "used
    // to." are real English and must survive.
    for (let pass = 0; pass < 4; pass++) {
      const before = s;
      s = s
        // a dashed aside that lost every name: " - from to to - " -> " "
        .replace(/[ \t]*[–—-][ \t]*from(?:[ \t]+(?:to|and|or))+[ \t]*[–—-][ \t]*/g, ' ')
        // a bare "from to (to...)" range with nothing left in it
        .replace(/[ \t]*\bfrom(?:[ \t]+to)+\b/g, '')
        // doubled conjunctions: "Sun Lakes and and how" -> "Sun Lakes and how"
        .replace(/\b(and|or)(?:[ \t]+(?:and|or))+\b/g, '$1')
        // ", from." / ", across." - a range that lost both ends
        .replace(/,[ \t]*(?:from|across|including|like|such as|out to)[ \t]*([.;:!])/g, '$1')
        // "eight named neighborhoods from." / "serving homes from." - a place
        // list after a place noun that lost every name
        .replace(/\b(neighbou?rhoods|homes|houses|areas|pockets|communities|towns|suburbs|streets|subdivisions|cities)[ \t]+(?:from|across|including|like|such as|in)[ \t]*([.;:!])/gi, '$1$2')
        .replace(/,[ \t]*([.;:!?])/g, '$1')
        // a place phrase that lost its place before a comma: ", closer to, the trip"
        .replace(/,?[ \t]*\b(?:closer to|nearer to|near|toward|towards|out to|as far as)[ \t]*,/g, ',')
        .replace(/,[ \t]*,/g, ',')
        .replace(/[ \t]{2,}/g, ' ');
      if (s === before) break;
    }
    s = s
      // Emphasis/link wrappers left empty by a removed name: "**Glenn Heights** (18 mi)" -> "**** (18 mi)".
      .replace(/\*\*[ \t]*\*\*|__[ \t]*__|\[[ \t]*\]\([^)]*\)/g, '')
      // A list item / table row that named only a removed place is dropped whole:
      // "- (18 mi)", "- : 12 miles", "| | 18 mi |".
      .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]*(?:[:\u2013\u2014-][ \t]*)?(?:\([^)]*\)|[\d.]+[ \t]*(?:mi|miles?|km)\b[^\n]*)?[ \t]*[.,;:]?[ \t]*(?:\n|$)/gm, '')
      .replace(/^[ \t]*\|[ \t]*\|[^\n]*(?:\n|$)/gm, '')
      .replace(/\n{3,}/g, '\n\n');
    return s.replace(KEEP_TOKEN, (m, i) => kept[Number(i)]);
  };
  const DANGLING_Q = /(?:\b(?:to|in|near|around|like|including|from|out to|as far as|serve|cover)|,)[ \t]*\?\s*$/i;
  const walk = (node) => {
    if (typeof node === 'string') return clean(node);
    if (Array.isArray(node)) {
      const out = [];
      for (const it of node) {
        const q0 = it && typeof it === 'object' && typeof it.q === 'string' ? it.q : null;
        const w = walk(it);
        // FAQ items are {q, a}: drop one whose question lost its place names
        // and no longer asks anything ("Do you come out to?").
        if (q0 !== null && w.q !== q0 && DANGLING_Q.test(w.q)) { droppedFaq += 1; continue; }
        out.push(w);
      }
      return out;
    }
    if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) { if (!SKIP.has(k)) node[k] = walk(node[k]); }
      return node;
    }
    return node;
  };
  for (const s of bundle.services) s.page = walk(s.page);
  for (const t of bundle.topics) t.page = walk(t.page);
  for (const a of bundle.areas) {
    a.page = walk(a.page);
    for (const ss of a.services) ss.page = walk(ss.page);
  }
  walk(bundle.home);
  if (bundle.hub?.page) walk(bundle.hub.page);
  walk(bundle.trust);
  walk(bundle.legal);
  if (removed) console.warn(`[content] ${business.domain}: removed ${removed} mention(s) of ${drop.length} unpublished area name(s) from authored copy; ${droppedFaq} FAQ question(s) that only named them dropped`);
  return removed;
}

/**
 * Sites whose authored inline distance lists render as a bulleted list.
 * Per-site on purpose: user, 2026-09-14, on Lodi's /service-areas/ "The Area
 * and Its Housing" - "dont show this section distance like this plain text",
 * "only update this section of this site not other site".
 */
const DISTANCE_LIST_SITES = new Set(['lodigaragedoorpros.com']);

/**
 * "Ordered by distance from Lodi: Woodbridge (4 mi), Collierville (6 mi), ...
 * Country Club (11 mi)." -> the intro sentence, then one markdown bullet per
 * place ("- **Woodbridge** (4 mi)"), the same shape Duncanville's export
 * already authors. Only a run of at least 3 "Name (N mi...)" items is touched.
 */
function distanceListsToBullets(bundle) {
  const ITEM = "[A-Z][\\w.'’ -]{1,40}? \\(\\d+(?:\\.\\d+)?\\s*mi[^)\\n]*\\)";
  const RUN = new RegExp('^([^\\n]*?:)[ \\t]*((?:' + ITEM + ',[ \\t]*)+(?:and[ \\t]+)?' + ITEM + ')[ \\t]*\\.?[ \\t]*$', 'gm');
  const itemRe = new RegExp('(' + "[A-Z][\\w.'’ -]{1,40}?" + ') (\\(\\d+(?:\\.\\d+)?\\s*mi[^)\\n]*\\))', 'g');
  const convert = (str) => str.replace(RUN, (m, intro, run) => {
    const items = [...run.matchAll(itemRe)].map((x) => `- **${x[1].replace(/^and\s+/, '').trim()}** ${x[2]}`);
    if (items.length < 3) return m;
    return `${intro}\n\n${items.join('\n')}\n`;
  });
  const walk = (node) => {
    if (typeof node === 'string') return /\(\d+(?:\.\d+)?\s*mi/.test(node) ? convert(node) : node;
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) { if (!['url', 'custom_id', 'href', 'slug', 'contentUrl', 'area', 'links'].includes(k)) node[k] = walk(node[k]); }
      return node;
    }
    return node;
  };
  for (const s of bundle.services) s.page = walk(s.page);
  for (const t of bundle.topics) t.page = walk(t.page);
  for (const a of bundle.areas) { a.page = walk(a.page); for (const ss of a.services) ss.page = walk(ss.page); }
  walk(bundle.home);
  if (bundle.hub?.page) walk(bundle.hub.page);
  walk(bundle.trust);
  walk(bundle.legal);
}

function areaName(page, slug) {
  if (page?.schema_facts?.areaServed) return String(page.schema_facts.areaServed).split(',')[0].trim();
  if (page?.h1) return page.h1;
  return titleCase(slug.replace(/-/g, ' '));
}

export default resolveContent;
