/**
 * Page composition. Turns a business + design + content into a set of pages,
 * choosing sections intelligently based on what data actually exists. This is
 * where "don't force every component onto every homepage" and "only generate
 * pages that make sense" are enforced.
 */

import * as C from '../components/index.js';
import { newPage } from '../assets/images.js';
import { renderDocument } from './layout.js';
import { localBusiness, serviceSchema, faqSchema, breadcrumbSchema } from '../seo/schema.js';
import { esc } from '../util/html.js';
import { titleCase } from '../util/strings.js';
import { subSeed } from '../util/hash.js';

/**
 * Augment the theme's (permuted) core order with the canonical extra sections
 * competitors use, inserted at fixed positions. Core-order permutation still
 * drives uniqueness; every site also gains the richer structure.
 *
 * @param {number} [seed] used to vary where the stats band anchors (see
 *   below) - every other call site of augmentOrder in this file passes it
 *   through from ctx.design.effectiveSeed.
 */
// Text-only hero variants (fullbleed-dark / text-only-underline /
// diagnostic-panel) have no side image to fill, so hero() already builds its
// own population/services/areas-covered stat strip inline (see hero__stats in
// components/index.js). Also injecting the separate 'stats' SECTION on these
// pages repeated the same 3 numbers, reworded, directly under the hero.
const TEXT_ONLY_HEROES = new Set(['fullbleed-dark', 'text-only-underline', 'diagnostic-panel']);

// Every homepage should read as a real, complete marketing site (12-14
// sections), not a thin 8-10-section stub - but ONLY when the content is
// real: nothing here is ever fabricated, it's sections whose data already
// exists for every business (trustbar reads real city/state/license/
// estimate fields, about/faq come straight from the resolved content
// bundle, gallery renders real photos unconditionally) but got silently
// dropped because a given THEME's hand-authored sectionOrder simply never
// listed them - an authoring gap, not a data gap. 'emergency' is
// deliberately excluded from this list: it's a tone/branding choice
// (urgency-led vs. value-led opening), not a component that belongs on
// every site regardless of theme.
function augmentOrder(order, seed = 0, heroVariant = null, hasFaq = false) {
  // 'about' is deliberately never scheduled on the homepage (explicit user
  // request, 2026-08-24) - the real about() content still has its own full
  // `/about/` page (buildAbout(), a separate code path in site.js), this
  // just stops it from ALSO being duplicated as a homepage section.
  const out = order.filter((k) => k !== 'stats' && k !== 'contact' && k !== 'about');
  const insertAfter = (anchor, key, fallbackIdx) => {
    if (out.includes(key)) return;
    const i = out.indexOf(anchor);
    out.splice(i >= 0 ? i + 1 : fallbackIdx, 0, key);
  };
  // 'bold-emergency' and 'minimal-professional' never list 'cta' in their own
  // base sectionOrder (only 'contact') - meaning every site on those two
  // themes was shipping with NO closing call-to-action band at all, the
  // single most consequential section to be missing on a service business's
  // homepage. renderHomeSection's 'cta' case has no gate (always renders),
  // so this was purely a theme-authoring gap. Always ensure it's present.
  if (!out.includes('cta')) out.push('cta');
  // trustbar: real business data (city/state, licensed/insured, free
  // estimates), not gated on anything - belongs in the early-orientation
  // zone on every site, whether or not the theme's own base list has it.
  insertAfter('hero', 'trustbar', 1);
  // Both brandbar and stats are trust/credibility signals, and a modern
  // site only ever puts that kind of content in one of two sensible spots:
  // right up top in the early trust cluster (next to trustbar, reinforcing
  // the hero), or grouped with reviews further down as part of one combined
  // "proof" block. Anywhere else - mid-page on its own, wedged right before
  // areas - doesn't map to how real sites use this content, so each gets
  // exactly those two candidate anchors, not an open list.
  const earlyTrustAnchor = out.includes('trustbar') ? 'trustbar' : 'hero';
  const proofAnchor = out.includes('reviews') ? 'reviews' : earlyTrustAnchor;
  const brandbarAnchor = subSeed(seed, 'brandbarAnchor') % 2 === 0 ? earlyTrustAnchor : proofAnchor;
  insertAfter(brandbarAnchor, 'brandbar', 1);
  if (!TEXT_ONLY_HEROES.has(heroVariant)) {
    // The stats band always sitting right after brandbar (its only home for a
    // long time) made every site read as the same template with different
    // colors - visitors hit hero, trustbar, brands-we-service, THEN the same
    // stat band, in that exact order, every time. Same two-anchor treatment.
    const statsAnchor = subSeed(seed, 'statsAnchor') % 2 === 0 ? earlyTrustAnchor : proofAnchor;
    insertAfter(statsAnchor, 'stats', 2);
  }
  insertAfter('services', 'process', 3);
  // 'rescom' is NOT injected - the Residential & commercial section is removed
  // engine-wide (2026-09-10, explicit user instruction "dont show any re/com
  // sections in the UI"). Same treatment as 'financing'. Its axis slot stays in
  // SECTION_AXES for fingerprint stability; see the note in variation.js.
  // ctaBanner: mid-page nudge, now has its own 8-variant pool (SECTION_POOLS.ctaBanner)
  // picked/cooldown-enforced the same as every other axis. Anchored right
  // after 'process' - the same "insert right after whichever
  // real anchor is present" pattern used for gallery just below. Distinct
  // from the closing 'cta' band at the very end of the page.
  insertAfter(out.includes('process') ? 'process' : 'services', 'ctaBanner', out.length);
  // gallery: renders real photos unconditionally (no content gate at all -
  // see gallery() in components/index.js) - the elaboration zone, next to
  // why/process, whether or not the theme's base list has it.
  insertAfter(out.includes('why') ? 'why' : 'services', 'gallery', out.length);
  // Financing intentionally NOT injected - the financing section is removed
  // engine-wide (see config/site-content.js financing:null).
  // FAQ reads as the visitor's last objection before they commit - it belongs
  // immediately before the closing CTA band, never stranded mid-page. Force
  // it in (only when real content exists - same gate renderHomeSection
  // itself checks) if the theme's base list omitted it, then the permutation
  // step may have shuffled it anywhere in the middle regardless - pull it
  // back out here and reseat it right before 'cta' every time.
  if (hasFaq && !out.includes('faq')) out.push('faq');
  const faqIdx = out.indexOf('faq');
  if (faqIdx !== -1) {
    out.splice(faqIdx, 1);
    const ctaIdx = out.indexOf('cta');
    out.splice(ctaIdx !== -1 ? ctaIdx : out.length, 0, 'faq');
  }
  return out;
}

/** Map a homepage section key to its renderer + availability guard. */
function renderHomeSection(key, ctx) {
  switch (key) {
    case 'hero': return C.hero(ctx);
    case 'emergency': return C.emergency(ctx);
    case 'trustbar': return C.trustbar(ctx);
    case 'brandbar': return C.brandBar(ctx);
    case 'stats': return C.stats(ctx);
    case 'services': return C.services(ctx);
    case 'process': return C.process(ctx);
    // 'rescom' renders nothing - section removed engine-wide 2026-09-10. A
    // theme's own hand-authored sectionOrder may still list it, so the case
    // stays and returns empty rather than falling through to default.
    case 'rescom': return '';
    case 'why': return C.why(ctx);
    case 'about': return ''; // never on the homepage - see augmentOrder; about() still has its own /about/ page
    case 'gallery': return C.gallery(ctx);
    case 'reviews': return C.reviews(ctx);
    case 'areas': return C.areas(ctx);
    case 'financing': return C.financing(ctx);
    case 'faq': return (ctx.content.faq && ctx.content.faq.length) ? C.faq(ctx) : '';
    case 'ctaBanner': return C.ctaBanner(ctx);
    case 'cta': return C.cta(ctx);
    default: return '';
  }
}

export function buildHome(ctx) {
  newPage(ctx);
  const order = augmentOrder(
    ctx.design.variants.sectionOrder, ctx.design.effectiveSeed, ctx.design.variants.hero,
    !!(ctx.content.faq && ctx.content.faq.length),
  );
  const main = order.map((k) => renderHomeSection(k, ctx)).filter(Boolean).join('\n');
  const home = ctx.content.home || {};
  const jsonLd = [
    localBusiness(ctx.business, servedAreas(ctx)),
    faqSchema(ctx.content.faq),
  ].filter(Boolean).join('\n');
  return renderDocument({
    ctx, pathname: '/',
    title: home.title || `${ctx.business.name} - Garage Door Service in ${ctx.business.city}`,
    description: home.meta || `Garage door repair and installation in ${ctx.business.city}.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx),
    main, jsonLd,
  });
}

/**
 * @param {string} [opts.beforeSections] extra markup placed directly under the
 *   trustbar, ABOVE the page's own authored prose - for content that is the
 *   reason the visitor is on the page (a suburb's list of its service pages).
 * @param {string} [opts.afterSections] extra markup placed after the standard
 *   section stack and before the closing CTA - for supporting navigation (a
 *   suburb-service page's siblings/parent links).
 * Both default to '' and are inert on every page type that doesn't pass them.
 */
function contentPageDoc(ctx, {
  pathname, page, crumbs, extraJsonLd = '', illustration = 'hero', excludeServiceId, excludeTopicSlug,
  showGallery = false, showServices = false, showProcess = false, showWhy = false,
  showStats = false, showTrustbar = false, showCtaBanner = false,
  showBrandbar = false, showAreas = false, showReviews = true,
  beforeSections = '', afterSections = '',
}) {
  newPage(ctx);
  const layout = `<section class="section"><div class="container"><div class="content-layout">
      <div class="content-main">${C.contentProse(ctx, page)}</div>
      ${C.sidebar(ctx, { excludeServiceId, excludeTopicSlug })}
    </div></div></section>`;
  // Reuse the SAME homepage section components (they read the per-site variant),
  // so a section's design is identical across every page of a site - e.g. if the
  // homepage "How it works" is the timeline layout, it's the timeline here too.
  // "Symptoms / what's included / safety / key-takeaways / our-story" all come
  // through as real authored `page.sections` inside contentProse() above - a
  // content author titles a section accordingly; no separate component exists
  // for these (see the door-styles.js-style "real data only" note).
  const body =
    C.breadcrumbs(ctx, crumbs) +
    C.contentHero(ctx, page, illustration) +
    (showTrustbar ? C.trustbar(ctx) : '') +
    beforeSections +
    layout +
    (showProcess ? C.process(ctx) : '') +
    (showCtaBanner ? C.ctaBanner(ctx) : '') +
    (showWhy ? C.why(ctx) : '') +
    (showStats ? C.stats(ctx) : '') +
    (showGallery ? C.gallery(ctx) : '') +
    (showBrandbar ? C.brandBar(ctx) : '') +
    (showServices ? C.services(ctx) : '') +
    (showAreas ? C.areas(ctx) : '') +
    (showReviews ? C.reviews(ctx) : '') +
    afterSections +
    (page.faq && page.faq.length ? C.faq(ctx, page.faq) : '') +
    C.cta(ctx);
  const jsonLd = [
    breadcrumbSchema(ctx.business, crumbs),
    page.faq && page.faq.length ? faqSchema(page.faq) : '',
    extraJsonLd,
  ].filter(Boolean).join('\n');
  return renderDocument({
    ctx, pathname, title: page.title || page.h1, description: page.meta || '',
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body, jsonLd,
  });
}

/** The site's real served areas for LocalBusiness schema: the city, then each
 *  published suburb's OWN authored areaServed ("Denville, NJ"). Never slugs. */
function servedAreas(ctx) {
  const b = ctx.business;
  const city = b.state ? `${b.city}, ${b.state}` : b.city;
  const subs = (ctx.content.areas || []).map((a) => a.page?.schema_facts?.areaServed).filter(Boolean);
  return [...new Set([city, ...subs])];
}

function crumbCta(ctx) {
  const c = C.primaryCta(ctx);
  return `<a href="${esc(c.href)}" class="btn btn--primary">${esc(c.label)}</a>`;
}

export function buildAbout(ctx) {
  const page = ctx.content.about;
  if (!page) return null;
  return contentPageDoc(ctx, {
    pathname: '/about/', page, crumbs: [{ label: 'Home', href: ctx.urls.home }, { label: 'About', href: ctx.urls.about }],
    showTrustbar: true, showProcess: true, showCtaBanner: true, showWhy: true, showStats: true, showGallery: true, showServices: true,
  });
}

export function buildContact(ctx) {
  newPage(ctx);
  const page = ctx.content.contact || { title: `Contact ${ctx.business.name}`, h1: `Contact ${ctx.business.name}`, meta: '', sections: [] };
  // page.sections carries real authored prose (e.g. "what happens next") when
  // an operator has written a contact-*.json content file - contentSections()
  // self-wraps each into its own <section>, so this is a no-op when empty.
  const body = C.breadcrumbs(ctx, [{ label: 'Home', href: ctx.urls.home }, { label: 'Contact', href: ctx.urls.contact }]) +
    C.contact(ctx) +
    C.trustbar(ctx) +
    // Every contact page explains how to get in touch as real numbered steps
    // (2026-08-25). When the operator's own copy has a "how to reach us"
    // section, contentSections() renders THAT one as the stepper alongside its
    // prose; when it doesn't (not every city's export writes one), the stepper
    // is added here as its own section so no contact page is left without it.
    (C.hasReachSection(page) ? '' : C.reachSection(ctx)) +
    C.contentSections(ctx, page) +
    // Neutral urgency copy (no availability claim) - no longer tied to the
    // emergency247 default, which is off since 2026-09-13.
    C.emergency(ctx) +
    C.areas(ctx) +
    (ctx.content.faq && ctx.content.faq.length ? C.faq(ctx) : '') +
    C.cta(ctx);
  return renderDocument({
    ctx, pathname: '/contact/', title: page.title, description: page.meta || `Contact ${ctx.business.name}.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: localBusiness(ctx.business, servedAreas(ctx)),
  });
}

// buildServicesIndex() was REMOVED 2026-09-10. Under the canonical URL scheme
// there is no /services/ page: the city hub at /<city>/ is the single parent of
// both the service pillars and the suburbs, and it renders the services grid
// itself (see the hub block in buildAreaPages below). Deleted rather than left
// unused so nothing can accidentally start recording a second index page.

export function buildServicePages(ctx) {
  return ctx.content.services.filter((s) => s.page).map((s, i) => {
    const pathname = s.href;
    const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: ctx.business.city, href: ctx.urls.cityHub }, { label: (s.service || {}).label || titleCase(s.id.replace(/-/g, ' ')), href: ctx.urls.base + pathname }];
    const extra = s.service ? serviceSchema(ctx.business, s.service, undefined, s.page?.meta) : '';
    return {
      pathname,
      html: contentPageDoc(ctx, {
        pathname, page: s.page, crumbs, extraJsonLd: extra, illustration: `gallery-${i}`, excludeServiceId: s.id,
        showTrustbar: true, showProcess: true, showCtaBanner: true, showWhy: true, showGallery: true,
        showBrandbar: true, showStats: true, showServices: true, showAreas: true,
      }),
    };
  });
}

export function buildAreaPages(ctx) {
  newPage(ctx);
  // The Service Areas index ALWAYS builds so the nav item is never a dead link.
  // With real neighborhoods it shows the coverage map/directory; without them it
  // honestly describes city-wide coverage (no invented neighborhood names).
  const hasAreas = ctx.content.areas.length > 0;
  const st = ctx.business.state ? `, ${ctx.business.state}` : '';
  // Coverage block shared by both index pages. With real suburbs it is the
  // coverage directory; without them it honestly describes city-wide coverage
  // (no invented neighborhood names).
  const coverage = () => hasAreas
    ? C.areas(ctx, { noHead: true, full: true })
    : C.section(ctx, {
        id: 'areas', tone: 'tint', eyebrow: 'Where we work',
        title: `Serving ${esc(ctx.business.city)}${esc(st)} & nearby`,
        lead: `Local garage door repair and installation across ${esc(ctx.business.city)} and the surrounding communities.`,
        body: `<p style="max-width:60ch">We cover ${esc(ctx.business.city)}${esc(st)} and the neighboring communities for garage door repair, spring and opener service, and new door installation. Tell us where you are and what your door’s doing, and we’ll let you know how soon we can help.</p>`,
      });
  const hub = ctx.content.areasHub;

  // ── /<city>/ CITY HUB (sitemap spec 2026-09-13) ───────────────────────────
  // The parent of both URL trees: links every service pillar and every suburb.
  const cityHub = (() => {
    newPage(ctx);
    const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: ctx.business.city, href: ctx.urls.cityHub }];
    const body = C.breadcrumbs(ctx, crumbs) +
      C.indexHero(ctx, {
        eyebrow: 'Services & service areas',
        h1: `Garage door service in ${ctx.business.city}`,
        sub: hasAreas
          ? `Every service we offer in ${ctx.business.city}, and the ${ctx.content.areas.length} nearby communities we cover.`
          : `Every service we offer across ${ctx.business.city}${st}.`,
      }) +
      C.trustbar(ctx) +
      C.services(ctx, {
        eyebrow: 'What we do',
        title: `Garage door services in ${esc(ctx.business.city)}`,
        lead: 'Every job starts with a diagnosis, so you know what’s actually wrong before any work begins.',
      }) +
      coverage() +
      C.ctaBanner(ctx, { text: `Don’t see your area covered above? We may still reach you - tell us where you are.` }) +
      C.process(ctx) +
      C.why(ctx) +
      C.stats(ctx) +
      C.reviews(ctx) +
      C.cta(ctx);
    return renderDocument({
      ctx, pathname: ctx.urls.cityHub, title: `Garage Door Service in ${ctx.business.city} - ${ctx.business.name}`,
      description: `Garage door services and the nearby communities served by ${ctx.business.name} around ${ctx.business.city}.`,
      header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
      jsonLd: breadcrumbSchema(ctx.business, crumbs),
    });
  })();

  // ── /service-areas/ AREAS INDEX (sitemap spec 2026-09-13) ─────────────────
  // All suburbs visible, introduced by the export's own -hub-service-areas copy.
  const index = (() => {
    newPage(ctx);
    const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Service Areas', href: ctx.urls.areas }];
    const sub = hub?.meta || (hasAreas
      ? `Local repair and installation across ${ctx.content.areas.length} ${ctx.business.city}-area communities.`
      : `Local repair and installation across ${ctx.business.city}${st} and the surrounding communities.`);
    const body = C.breadcrumbs(ctx, crumbs) +
      C.indexHero(ctx, {
        eyebrow: 'Service areas',
        h1: hub?.h1 || `Garage door service areas around ${ctx.business.city}`,
        sub,
      }) +
      C.trustbar(ctx) +
      coverage() +
      (hub ? C.contentSections(ctx, hub, { combineFirstTwo: true }) : '') +
      C.ctaBanner(ctx, { text: `Don’t see your area covered above? We may still reach you - tell us where you are.` }) +
      C.why(ctx) +
      C.reviews(ctx) +
      (ctx.content.faq && ctx.content.faq.length ? C.faq(ctx) : '') +
      C.cta(ctx);
    return renderDocument({
      ctx, pathname: ctx.urls.areas, title: hub?.title || `Service Areas - ${ctx.business.name}`,
      description: hub?.meta || `Communities served by ${ctx.business.name} around ${ctx.business.city}.`,
      header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
      jsonLd: breadcrumbSchema(ctx.business, crumbs),
    });
  })();
  const pages = ctx.content.areas.map((a) => {
    const pathname = a.href;
    const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: ctx.business.city, href: ctx.urls.cityHub }, { label: a.name, href: ctx.urls.base + pathname }];
    return {
      pathname,
      html: contentPageDoc(ctx, {
        pathname, page: a.page, crumbs,
        // A suburb with its own nested service pages leads with them: they are
        // the reason a visitor is on this page, and they are the ONLY link
        // path to those pages from anywhere on the site. Rendered with the
        // normal services() component (same card skin, same variant) pointed
        // at this suburb's children, so it inherits the site's design rather
        // than introducing a layout of its own.
        beforeSections: a.services && a.services.length ? C.services(ctx, {
          items: a.services.map((s) => ({
            id: s.id,
            href: s.href,
            label: s.label,
            // Content meta only - never the engine catalog's generic blurb (no fake data, 2026-09-13).
            blurb: (s.page && s.page.meta) || '',
            icName: s.service && s.service.icon ? s.service.icon : 'wrench',
          })),
          eyebrow: 'In this area',
          title: `What we do in ${a.name}`,
          lead: `Each of these covers what the work involves for ${a.name} specifically - the housing stock, the common failures, and what drives the cost.`,
        }) : '',
        showTrustbar: true, showProcess: true, showCtaBanner: true,
        showWhy: true, showStats: true, showGallery: true,
        // The generic city-wide services grid would sit directly under this
        // suburb's own service list and repeat it in weaker form.
        showServices: !(a.services && a.services.length),
      }),
    };
  });
  return { cityHub, index, pages };
}

/**
 * Suburb-service pages: one per (suburb x service) the export authored,
 * published UNDER the suburb at `/<suburb>/<service>/`.
 *
 * New page type, 2026-09-09. It renders through the SAME contentPageDoc() as
 * every other content page - no new component, no new CSS, no new design axis.
 * The only things specific to it are the four-level breadcrumb and the sibling
 * list, which is the whole point of the nesting: from any one of these you can
 * reach the parent suburb, the city-wide version of the same service, and the
 * other services in that suburb.
 */
export function buildSuburbServicePages(ctx) {
  const out = [];
  for (const area of ctx.content.areas) {
    if (!area.services || !area.services.length) continue;
    for (const s of area.services) {
      newPage(ctx);
      const pathname = s.href;
      const crumbs = [
        { label: 'Home', href: ctx.urls.home },
        { label: ctx.business.city, href: ctx.urls.cityHub },
        { label: area.name, href: ctx.urls.base + area.href },
        { label: s.label, href: ctx.urls.base + pathname },
      ];
      // areaServed comes from the page's OWN schema_facts, never assembled
      // from the slug - it is a real authored fact ("Denville, NJ").
      const extra = s.service ? serviceSchema(ctx.business, s.service, s.page?.schema_facts?.areaServed || area.name, s.page?.meta) : '';
      const siblings = area.services.filter((x) => x.href !== s.href);
      const cityWide = ctx.content.services.find((c) => c.id === s.id);
      out.push({
        pathname,
        html: contentPageDoc(ctx, {
          pathname, page: s.page, crumbs, extraJsonLd: extra, excludeServiceId: s.id,
          afterSections: relatedLinks(ctx, area, siblings, cityWide),
          showTrustbar: true, showProcess: true, showCtaBanner: true, showWhy: true, showStats: true, showGallery: true,
          // showServices/showAreas are off: the sibling block below already
          // links every service in this suburb, and the full city-wide area
          // directory is a long list that belongs on the parent, not here.
        }),
      });
    }
  }
  return out;
}

/**
 * The sibling / parent / city-wide link block that makes the nesting
 * navigable. Plain section markup reusing existing classes (`.side-links`,
 * `.area-chip`) so it themes itself from the site's palette with no new CSS.
 */
function relatedLinks(ctx, area, siblings, cityWide) {
  const chips = siblings.map((x) => `<a class="area-chip" href="${esc(x.href)}"><span>${esc(x.label)}</span></a>`).join('');
  const up = `<a class="area-chip" href="${esc(area.href)}"><span>All work in ${esc(area.name)}</span></a>`;
  const wide = cityWide ? `<a class="area-chip" href="${esc(cityWide.href)}"><span>${esc((cityWide.service || {}).label || cityWide.id)} across ${esc(ctx.business.city)}</span></a>` : '';
  if (!chips && !wide) return '';
  return C.section(ctx, {
    id: 'related', tone: 'tint', eyebrow: 'Nearby',
    title: `More in ${esc(area.name)}`,
    body: `<div class="cov-cloud">${up}${chips}${wide}</div>`,
  });
}

/** Request a Quote (/request-a-quote/) - embeds the operator's GoHighLevel form. Briefly /book/ "Schedule a Visit" on 2026-09-13, reverted same day (user). */
export function buildQuote(ctx) {
  newPage(ctx);
  const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Request a Quote', href: ctx.urls.quote }];
  const b = ctx.business;
  // Authored title/H1/meta are used verbatim (the export already says "Request a Quote").
  const richPage = ctx.content.quote || null;
  const points = [
    ctx.site.freeEstimate ? 'Free estimates on new-door installs' : null,
    'Diagnosis first - you hear what’s wrong before any work',
    // "Repairs and installs for residential & commercial doors" was removed
    // 2026-09-13 with the rest of the res/com messaging (user: engine-wide).
    `Local service across ${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''} and nearby`,
  ].filter(Boolean);
  const call = b.phone ? `<p class="quote-copy__call">Prefer to talk? <a href="tel:${esc(b.phone.replace(/[^0-9+]/g, ''))}">${esc(b.phone)}</a></p>` : '';
  const body = C.breadcrumbs(ctx, crumbs) +
    `<section class="section"><div class="container"><div class="quote-layout">
      <div class="quote-copy">
        <span class="hero__badge"><span class="dot" aria-hidden="true"></span>${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''}</span>
        <h1>${esc(richPage?.h1 || 'Request a quote')}</h1>
        <p class="lead">${richPage?.meta ? esc(richPage.meta) : 'Tell us what your door’s doing and we’ll get right back to you with the next step.'}</p>
        <ul class="quote-points">${points.map((p) => `<li>${p}</li>`).join('')}</ul>
        ${call}
      </div>
      <div class="quote-form-col">${C.quoteEmbed(ctx)}</div>
    </div></div></section>` +
    C.QUOTE_FORM_SCRIPT +
    (richPage ? C.contentSections(ctx, richPage) : '') +
    C.trustbar(ctx) +
    C.why(ctx) +
    C.services(ctx) +
    C.reviews(ctx) +
    (ctx.content.faq && ctx.content.faq.length ? C.faq(ctx) : '') +
    C.cta(ctx);
  return renderDocument({
    ctx, pathname: ctx.urls.quote, title: richPage?.title || `Request a Quote - ${ctx.business.name}`,
    description: richPage?.meta || `Request a garage door quote from ${ctx.business.name} in ${ctx.business.city}.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: breadcrumbSchema(ctx.business, crumbs),
  });
}

/** Garage Doors / Products - illustrated door-style catalog. */
export function buildProducts(ctx) {
  newPage(ctx);
  const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Garage Doors', href: ctx.urls.products }];
  const body = C.breadcrumbs(ctx, crumbs) +
    // Was a THIRD inline copy of the hero markup with hero--split-image-right
    // hardcoded, which is how this page kept rendering a different hero from
    // the rest of the site. Use the shared helper so there is exactly one
    // place that decides an inner page's hero variant and whether it carries
    // media.
    C.indexHero(ctx, {
      h1: 'Garage doors we install',
      sub: 'Steel, insulated, carriage, full-view, and commercial doors - sized and fitted to your opening.',
    }) +
    `<section class="section"><div class="container">${C.styleFilter(ctx)}${C.productGrid(ctx)}</div></section>` +
    C.STYLE_FILTER_SCRIPT +
    C.styleComparison(ctx) +
    C.insulationPrimer(ctx) +
    C.brandBar(ctx) +
    C.process(ctx) +
    // Warranty: only the real year-count already set by the operator (see
    // site-content.js `warrantyYears`/`warrantyDetail`) - no invented terms.
    (ctx.site.warrantyYears
      ? C.section(ctx, {
          id: 'warranty', tone: 'tint', eyebrow: 'Warranty', title: `${ctx.site.warrantyYears}-year warranty`,
          body: `<p class="lead" style="max-width:60ch">New installations are covered by a ${esc(String(ctx.site.warrantyYears))}-year warranty.</p>`,
        })
      : '') +
    C.gallery(ctx) +
    C.reviews(ctx) +
    (ctx.content.faq && ctx.content.faq.length ? C.faq(ctx) : '') +
    C.cta(ctx);
  return renderDocument({
    ctx, pathname: '/garage-doors/', title: `Garage Doors in ${ctx.business.city} - ${ctx.business.name}`,
    description: `New garage door styles installed in ${ctx.business.city}: steel, insulated, carriage, full-view, and commercial.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: breadcrumbSchema(ctx.business, crumbs),
  });
}

/** Financing page (operator-configured). */
export function buildFinancing(ctx) {
  // Rewired 2026-09-13: builds ONLY from a real exported financing page
  // (`-trust-financing`). No export ships one today, so no site gets /financing/.
  // Financing terms are on content.neverFabricate - the engine never writes them.
  const page = ctx.content.financing;
  if (!page) return null;
  return contentPageDoc(ctx, {
    pathname: ctx.urls.financing, page,
    crumbs: [{ label: 'Home', href: ctx.urls.home }, { label: 'Financing', href: ctx.urls.financing }],
    showTrustbar: true, showCtaBanner: true, showServices: true,
  });
}

/** Maintenance plans (/maintenance-plans/) - added 2026-09-13 for the sitemap
 *  spec. Same rule as financing: real exported content only (`-trust-maintenance-plans`). */
export function buildMaintenancePlans(ctx) {
  const page = ctx.content.maintenancePlans;
  if (!page) return null;
  return contentPageDoc(ctx, {
    pathname: ctx.urls.maintenancePlans, page,
    crumbs: [{ label: 'Home', href: ctx.urls.home }, { label: 'Maintenance Plans', href: ctx.urls.maintenancePlans }],
    showTrustbar: true, showCtaBanner: true, showServices: true,
  });
}

/** Reviews page - only when real reviews or operator badges exist. */
export function buildReviews(ctx) {
  newPage(ctx);
  const hasReviews = (ctx.business.reviews && ctx.business.reviews.length) || (ctx.site.reviewBadges && ctx.site.reviewBadges.length);
  if (!hasReviews) return null;
  const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Reviews', href: ctx.urls.reviews }];
  const body = C.breadcrumbs(ctx, crumbs) +
    C.reviews(ctx, { h1: true, title: `What ${ctx.business.city} customers say` }) + C.cta(ctx);
  return renderDocument({
    ctx, pathname: '/reviews/', title: `Reviews - ${ctx.business.name}`,
    description: `Customer reviews for ${ctx.business.name} in ${ctx.business.city}.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: breadcrumbSchema(ctx.business, crumbs),
  });
}

/** Resources / guides index - lists the topic articles from the content folder. */
export function buildResourcesIndex(ctx) {
  newPage(ctx);
  const topics = ctx.content.topics || [];
  if (!topics.length) return null;
  const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Blog', href: ctx.urls.resources }];
  const card = (t, i, featured = false) => `<a class="post-card${featured ? ' post-card--featured' : ''}" href="${esc(t.href || `${ctx.urls.resourceBase}${t.slug}/`)}">
      <div class="post-card__media">${C.mediaImg(ctx, `gallery-${i}`, t.page.h1 || t.name)}</div>
      <div class="post-card__body"><h3>${esc(t.page.h1 || t.name)}</h3>${t.page.meta ? `<p>${esc(t.page.meta)}</p>` : ''}<span class="post-card__more">Read guide →</span></div>
    </a>`;
  // Featured guide: the first real topic (an editorial/authoring-order
  // choice, not fabricated data) shown larger, ahead of the regular grid.
  // No "category filter" - topic content has no category field today (see
  // door-styles.js's no-fabrication note for the same reasoning applied to
  // product specs); the grid stays a flat, real list until that data exists.
  const [featured, ...rest] = topics;
  const cards = rest.map((t, i) => card(t, i + 1)).join('');
  const body = C.breadcrumbs(ctx, crumbs) +
    C.indexHero(ctx, { eyebrow: 'Resources', h1: `Garage door guides for ${ctx.business.city} homeowners`, sub: 'Straight answers on springs, openers, noises, and when a door is worth fixing.' }) +
    `<section class="section"><div class="container">
      ${featured ? `<div class="post-featured">${card(featured, 0, true)}</div>` : ''}
      <div class="post-grid">${cards}</div>
    </div></section>` +
    C.areas(ctx) +
    C.services(ctx) +
    C.cta(ctx);
  return renderDocument({
    ctx, pathname: '/resources/', title: `Garage Door Guides & Resources - ${ctx.business.name}`,
    description: `Practical garage door guides for ${ctx.business.city} homeowners: springs, openers, noises, off-track doors, and more.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: breadcrumbSchema(ctx.business, crumbs),
  });
}

/** Individual topic/guide article pages. */
export function buildTopicPages(ctx) {
  return (ctx.content.topics || []).map((t, i) => {
    const pathname = t.href || `${ctx.urls.resourceBase}${t.slug}/`;
    const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label: 'Blog', href: ctx.urls.resources }, { label: t.page.h1 || t.name, href: ctx.urls.base + pathname }];
    return {
      pathname,
      html: contentPageDoc(ctx, {
        pathname, page: t.page, crumbs, illustration: `gallery-${i}`, excludeTopicSlug: t.slug,
        showProcess: true, showCtaBanner: true, showWhy: true, showServices: true, showReviews: false,
      }),
    };
  });
}

export function buildFaqPage(ctx) {
  newPage(ctx);
  // A real per-site FAQ export (see content/adapter.js's -trust-faq marker)
  // carries its OWN, usually larger, faq array plus real prose sections -
  // prefer it, falling back to the flat home.faq list used elsewhere.
  const richPage = ctx.content.faqPage;
  const items = (richPage && richPage.faq && richPage.faq.length ? richPage.faq : ctx.content.faq) || [];
  if (items.length < 3) return null;
  const body = C.breadcrumbs(ctx, [{ label: 'Home', href: ctx.urls.home }, { label: 'FAQ', href: ctx.urls.faq }]) +
    C.faq(ctx, items, {
      h1: true,
      title: richPage?.h1 || `Garage door questions - ${ctx.business.city}`,
      lead: richPage?.meta || `Common questions from ${ctx.business.city} homeowners about springs, openers, and repairs.`,
    }) +
    (richPage ? C.contentSections(ctx, richPage) : '') +
    C.services(ctx) + C.cta(ctx);
  return renderDocument({
    ctx, pathname: '/faq/', title: richPage?.title || `Garage Door FAQ - ${ctx.business.name}`,
    description: richPage?.meta || `Common garage door questions for ${ctx.business.city} homeowners.`,
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: faqSchema(items),
  });
}

/** Simple utility page (Privacy/Terms/Accessibility) - real content only,
 * from contents/<city>/{privacy,terms,accessibility}.json (see
 * content/adapter.js LEGAL_FILES). No content, no page - never fabricated
 * boilerplate. Deliberately no marketing sections (cta/reviews/etc.) - these
 * are utility pages, not conversion pages. */
function buildLegalPage(ctx, { key, pathname, label, fallbackTitle }) {
  newPage(ctx);
  const page = ctx.content[key];
  if (!page) return null;
  const crumbs = [{ label: 'Home', href: ctx.urls.home }, { label, href: ctx.urls.base + pathname }];
  const body = C.breadcrumbs(ctx, crumbs) +
    C.section(ctx, { id: key, title: page.h1 || label, h1: true, body: C.contentProse(ctx, page) });
  return renderDocument({
    ctx, pathname, title: page.title || fallbackTitle, description: page.meta || '',
    header: C.header(ctx), footer: C.footer(ctx), mobileCta: C.mobileCta(ctx), main: body,
    jsonLd: breadcrumbSchema(ctx.business, crumbs),
  });
}

export function buildPrivacy(ctx) {
  return buildLegalPage(ctx, { key: 'privacy', pathname: '/privacy/', label: 'Privacy Policy', fallbackTitle: `Privacy Policy - ${ctx.business.name}` });
}
export function buildTerms(ctx) {
  return buildLegalPage(ctx, { key: 'terms', pathname: '/terms/', label: 'Terms of Service', fallbackTitle: `Terms of Service - ${ctx.business.name}` });
}
export function buildAccessibility(ctx) {
  return buildLegalPage(ctx, { key: 'accessibility', pathname: '/accessibility/', label: 'Accessibility', fallbackTitle: `Accessibility - ${ctx.business.name}` });
}
