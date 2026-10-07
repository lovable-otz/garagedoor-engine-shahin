/**
 * Component Library.
 *
 * Each component is a pure function returning an HTML fragment. Components read
 * the shared render context `ctx` (business, design, palette, content, urls,
 * image helper) and branch on the resolved variant keys. Theme differentiation
 * that isn't purely visual (structure) lives here; visual differentiation lives
 * in css.js. Both are driven by the same variant keys.
 *
 * DATA-GATING (no fabrication):
 *  - phone CTAs only when business.phone exists (it doesn't in this dataset)
 *  - reviews section only when business.reviews.length > 0
 *  - service-area pages/section only when real areas exist (rich content)
 *  - "emergency" is framed as situation-urgency (a stuck door leaves the home
 *    open), never as a claimed 24/7 / same-day availability
 */

import { esc, attrs, j } from '../util/html.js';
import { image, imageHtml, logoMark, logoImage } from '../assets/images.js';
import { icon, coverageMap, DOOR_STYLE_KEYS, DOOR_STYLE_LABELS } from '../assets/illustrations.js';
import { fnv1a } from '../util/hash.js';
import { isDark } from '../util/color.js';
import { humanList, commas, titleCase } from '../util/strings.js';
import { DOOR_STYLE_INFO, INSULATION_PRIMER } from '../../config/door-styles.js';

// ---- small helpers -------------------------------------------------------

/** The brand primary CTA: "Request a Quote" (/request-a-quote/, GoHighLevel form). Briefly "Schedule" (/book/) on 2026-09-13, reverted (user). */
function quoteCta(ctx, label) {
  return { href: ctx.urls.quote, label: label || 'Request a Quote' };
}
/** The urgent call CTA - only when the operator has set a real phone number. */
function callCta(ctx) {
  const b = ctx.business;
  if (!b.phone) return null;
  return { href: `tel:${b.phone.replace(/[^0-9+]/g, '')}`, label: `Call ${b.phone}` };
}
/** Back-compat: a single primary CTA (quote). */
function primaryCta(ctx, label) {
  return quoteCta(ctx, label);
}

function btn(href, label, kind = 'primary', extra = '') {
  return `<a href="${esc(href)}" class="btn btn--${kind} ${extra}">${esc(label)}</a>`;
}

/** Dual-CTA block: brand "Request a Quote" + urgent "Call" (if phone). */
function dualCta(ctx, { className = '', lg = false } = {}) {
  const style = ctx.design.variants.ctaStyle;
  const q = quoteCta(ctx);
  const call = callCta(ctx);
  const size = lg ? 'btn--lg' : '';
  const buttons = [
    btn(q.href, q.label, 'primary', size),
    call ? btn(call.href, call.label, 'emergency', size) : btn(ctx.urls.services, 'Our Services', 'ghost', size),
  ].join('');
  return `<div class="${className} cta-${esc(style)}">${buttons}</div>`;
}

function ctaGroup(ctx, { className = '', primaryLabel, secondary = true } = {}) {
  return dualCta(ctx, { className });
}

/**
 * Minimal inline markdown some rich-content exports use: **bold** and
 * [text](url). Escape FIRST - esc() never touches * [ ] ( ) so escaping
 * before converting is safe (raw content is never interpreted as HTML,
 * only these two specific already-escaped patterns become real tags).
 * A link target is only rendered as a real <a> when it looks like a
 * relative path or http(s) URL - anything else degrades to plain text
 * rather than emitting an unvalidated href.
 */
function inlineMd(text) {
  let out = esc(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => (/^(\/|https?:\/\/)/.test(url) ? `<a href="${url}">${label}</a>` : label));
  return out;
}

function paras(body) {
  // Convert a content body (\n\n paragraphs, "- " bullets) into HTML.
  const blocks = String(body || '').split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim());
    if (lines.every((l) => /^[-•]\s+/.test(l))) {
      return `<ul>${lines.map((l) => `<li>${inlineMd(l.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    return `<p>${inlineMd(block)}</p>`;
  }).join('\n');
}

function h2Label(h2) {
  // rich content uses snake_case or Title Case h2 keys
  if (/^[a-z0-9_]+$/.test(h2)) {
    return h2.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return h2;
}

/** service.icon → icon name in the SVG set (assets/illustrations.js). */
const SVC_ICON = {
  wrench: 'wrench', door: 'door', swap: 'swap', chip: 'chip', spring: 'spring',
  cable: 'cable', track: 'track', panel: 'panel', roller: 'roller', gauge: 'gauge', building: 'building',
  bolt: 'bolt',
};

/**
 * Href for a content entry. `href` is resolved once in content/index.js from
 * the export's own `page.url` (see that file's header - content URLs are
 * authoritative and their SHAPE differs per site), so no renderer may rebuild
 * a path from a slug: that is how a link and the page it points at drift
 * apart. The `urls.*Base` fallbacks cover the entries that never came from
 * content at all - the `business.services` catalog list several of these
 * renderers drop back to when a site has no authored service pages.
 */
/**
 * Displayed counts (user rule, 2026-09-13): "services list = all the services
 * in service-lines folder; suburbs list = all the area names which have
 * suburb-services - count based on these". content.services is exactly the
 * 02-service-lines set and content.areas is exactly the suburbs with 07
 * content, so every count on the site reads from these two. The 4-item
 * default catalog (business.services) is used ONLY for a site with no service
 * content at all - it was wrongly showing "4 services" on Chicago (8).
 */
const serviceCount = (ctx) => (ctx.content.services && ctx.content.services.length) || ctx.business.services.length;
const areaCount = (ctx) => (ctx.content.areas || []).length;
const svcHref = (e, urls) => e.href || `${urls.serviceBase}${e.id}/`;
const areaHref = (a, urls) => a.href || `${urls.areaBase}${a.slug}/`;
const topicHref = (t, urls) => t.href || `${urls.resourceBase}${t.slug}/`;

// ---- header / nav --------------------------------------------------------

/** Top utility / announcement bar: hours, 24-7, service area, phone. */
export function announcementBar(ctx) {
  const { business, site, urls } = ctx;
  const left = [];
  if (site.emergency247) left.push(`<span class="ann__badge">${icon('bolt', { size: 14 })} 24/7 Emergency Service</span>`);
  if (site.hours) left.push(`<span>${icon('clock', { size: 14 })} ${esc(site.announcement || site.hours)}</span>`);
  left.push(`<span>${icon('pin', { size: 14 })} Serving ${esc(business.city)}${business.state ? ', ' + esc(business.state) : ''} &amp; nearby</span>`);
  const right = business.phone
    ? `<a href="tel:${esc(business.phone.replace(/[^0-9+]/g, ''))}" class="ann__phone">${icon('phone', { size: 14 })} ${esc(business.phone)}</a>`
    : `<a href="${esc(urls.quote)}" class="ann__phone">Request a quote ${icon('arrow', { size: 14 })}</a>`;
  return `<div class="announce"><div class="container"><div class="ann__left">${left.join('')}</div>${right}</div></div>`;
}

/** Real logo (images/logo/, matched by serial) if supplied, else the text
 * monogram - same markup slot either way so header/footer CSS doesn't care. */
/**
 * @param {object} ctx
 * @param {string} surface  the palette key of the background this mark sits on
 *   ('bg' for the header, 'secondary' for the footer).
 *
 * The supplied logos are drawn for LIGHT backgrounds: an icon plus the city
 * name set in dark type. On a dark surface the icon survives but the wordmark
 * disappears - measured on the 20 new sites, 11-36% of each logo's visible ink
 * falls below readable contrast on a dark bar.
 *
 * That is not a dark-THEME problem, it is a dark-SURFACE one. Every footer on
 * all 56 sites paints `var(--c-secondary)`, and all 56 secondaries are dark
 * (measured), so the footer needs this treatment even on a light theme. The
 * header only needs it when the theme itself is dark. Deciding from the actual
 * palette colour rather than from `mood` keeps that true for any future theme.
 */
function brandMark(ctx, surface = 'bg') {
  const logo = logoImage(ctx);
  if (logo) {
    const onDark = isDark(ctx.design.palette[surface] || ctx.design.palette.bg);
    const cls = `brand__mark brand__mark--logo${onDark ? ' brand__mark--on-dark' : ''}`;
    return `<img class="${cls}" src="${esc(logo.src)}" alt="${esc(logo.alt)}">`;
  }
  return `<span class="brand__mark">${logoMark(ctx.business)}</span>`;
}

export function header(ctx) {
  const { business, design, urls, content, site, has } = ctx;
  const nav = design.variants.nav;

  // Reusable megamenu: label + top link + item list (+ "view all").
  // `align` - the panel is position:absolute off its trigger <li>; a
  // left-anchored panel opening from a nav item positioned further right
  // (Service Areas, Guides - both after Services in the nav) runs past the
  // viewport's right edge (confirmed: up to 34px of real, reproducible
  // horizontal overflow on every page, not just on hover - visibility:hidden
  // elements still occupy layout box and contribute to scrollWidth). Only
  // 'Services' (always first, right next to the logo) is safe left-aligned.
  const mega = (label, topHref, items, viewAll, wide = false, align = 'left') => {
    if (!items.length) return '';
    return `<li class="has-menu">
      <a href="${esc(topHref)}" aria-haspopup="true">${esc(label)} ${icon('arrow', { size: 13, cls: 'chev' })}</a>
      <div class="mega${wide ? ' mega--wide' : ''}${align === 'right' ? ' mega--right' : ''}"><div class="mega__grid${wide ? ' mega__grid--3' : ''}">
        ${items.map((it) => `<a href="${esc(it.href)}">${it.icon ? icon(it.icon, { size: 18 }) : ''}<span>${esc(it.label)}</span></a>`).join('')}
      </div>${viewAll ? `<a class="mega__all" href="${esc(viewAll.href)}">${esc(viewAll.label)} ${icon('arrow', { size: 14 })}</a>` : ''}</div>
    </li>`;
  };

  const svcList = (content.services.length ? content.services : business.services.map((s) => ({ id: s.id, service: s })));
  const serviceItems = svcList.map((s) => ({
    label: (s.service || {}).label || s.id, href: svcHref(s, urls), icon: SVC_ICON[(s.service || {}).icon] || 'wrench',
  }));
  const areaItems = (content.areas || []).slice(0, 15).map((a) => ({ label: a.name, href: areaHref(a, urls), icon: 'pin' }));
  // Menu labels need to stay short - the page's own H1 is a full descriptive
  // sentence (good for SEO/on-page use, too long for a nav item), and the
  // topic's resolved "name" collapses to the city (schema_facts.areaServed
  // wins in areaName(), same for every topic on a site). Derive a short
  // label straight from the slug instead, capped to 4 words as a safety net.
  const shortGuideLabel = (t) => {
    const words = t.slug.split('-');
    return titleCase(words.slice(0, 4).join(' '));
  };
  const guideItems = (content.topics || []).map((t) => ({ label: shortGuideLabel(t), href: topicHref(t, urls), icon: 'chat' }));

  // Nav: Services, Service Areas, Guides (megamenus) + About, Contact.
  // These three are ALWAYS present. Services and Guides always have items
  // (core services + universal guides). Service Areas shows a megamenu when real
  // neighborhoods exist, otherwise a plain link to the always-built index.
  const serviceAreasNav = areaItems.length
    ? mega('Service Areas', urls.areas, areaItems, content.areas.length > 15 ? { label: `View all ${content.areas.length} areas`, href: urls.areas } : { label: 'All service areas', href: urls.areas }, true, 'right')
    : `<li><a href="${esc(urls.areas)}">Service Areas</a></li>`;
  const links = [
    mega('Services', urls.services, serviceItems, { label: 'View all services', href: urls.services }),
    serviceAreasNav,
    mega('Blogs', urls.resources, guideItems, { label: 'View all blogs', href: urls.resources }, false, 'right'),
    has.about ? `<li><a href="${esc(urls.about)}">About</a></li>` : '',
    `<li><a href="${esc(urls.contact)}">Contact</a></li>`,
    // Mobile-only: the Call action moves INTO the hamburger menu (with number).
    business.phone ? `<li class="nav__mcall"><a href="tel:${esc(business.phone.replace(/[^0-9+]/g, ''))}">${icon('phone', { size: 18 })}<span>Call ${esc(business.phone)}</span></a></li>` : '',
  ].filter(Boolean).join('');

  const call = callCta(ctx);
  // Note: the "Request a Quote" button was intentionally removed from the header
  // nav. The quote route stays reachable via the announcement bar, hero, CTA
  // bands, and footer - the navbar keeps only the Call action (when a phone is set).
  const navCta = call
    ? `<a class="btn-call" href="${esc(call.href)}" aria-label="Call ${esc(business.phone)}">${icon('phone', { size: 17 })}<span class="btn-call__num">${esc(business.phone)}</span></a>`
    : '';
  return j(
    announcementBar(ctx),
    `<header class="site-header nav--${esc(nav)}">
      <div class="container nav">
        <a class="brand" href="${esc(urls.home)}">${brandMark(ctx, 'bg')}<span>${esc(business.name)}</span></a>
        <nav aria-label="Primary">
          <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Toggle menu">☰</button>
          <ul class="nav__links" id="nav-links">${links}</ul>
        </nav>
        ${navCta ? `<div class="nav__cta">${navCta}</div>` : ''}
      </div>
    </header>`,
  );
}

// ---- hero ----------------------------------------------------------------

/** Hero variants that deliberately render NO media block - their CSS styles
 *  .hero__copy as a full-bleed / underlined text panel and assumes no photo
 *  beside it. Shared so the homepage hero and the inner-page heroes below
 *  agree on it; an inner hero that emitted media while wearing one of these
 *  classes would lay out wrong. */
const HERO_TEXT_ONLY = new Set(['text-only-underline', 'fullbleed-dark', 'diagnostic-panel']);

/** The site's own hero variant. Inner-page heroes use this too - see the note
 *  on indexHero(). */
function heroVariant(ctx) {
  return (ctx.design && ctx.design.variants && ctx.design.variants.hero) || 'split-image-right';
}

export function hero(ctx) {
  const { business, design, content, palette } = ctx;
  const variant = design.variants.hero;
  const home = content.home || {};
  // Sitemap spec 2026-09-13: the home H1 is always "<City> Garage Door Repair".
  // The export's own authored headline is kept as the subheading, not lost.
  const h1 = `${business.city} Garage Door Repair`;
  const sub = home.h1 || home.meta || `Repair, installation, springs, and openers for ${business.city}. Diagnosis first, then the fix that lasts.`;
  const img = image(ctx, 'hero', `Garage door service in ${business.city}`);
  const cta = ctaGroup(ctx, { className: 'hero__cta', primaryLabel: business.phone ? undefined : 'Request a Quote' });

  // diagnostic-panel used to show a mini service list here - dropped as
  // redundant (the site already has a dedicated Services section/page), so
  // it now shares the same text-only/photo-bg treatment as the other two.
  const textOnly = HERO_TEXT_ONLY.has(variant);
  // Text-only heroes show the hero__stats strip right below (population,
  // services offered, areas covered, diagnosis-first) - this checkmark row
  // said almost the exact same three things again ("N services" / "Diagnosis
  // before repair" duplicate two stats outright). Only show it where there
  // is no stats strip to compete with.
  const chk = icon('check', { size: 16, cls: 'chip-ico' });
  // The "Residential & commercial" chip was removed 2026-09-13 along with the
  // res/com section (user: remove it engine-wide).
  const chips = [
    `<span>${chk} ${serviceCount(ctx)} services</span>`,
    `<span>${chk} Diagnosis before repair</span>`,
  ].join('');
  const copy = `<div class="hero__copy">
      <span class="hero__badge"><span class="dot" aria-hidden="true"></span>Garage door service · ${esc(business.city)}${business.state ? ', ' + esc(business.state) : ''}</span>
      <h1>${esc(h1)}</h1>
      <p class="hero__sub">${esc(sub)}</p>
      ${cta}
      ${textOnly ? '' : `<div class="hero__chips">${chips}</div>`}
    </div>`;

  const media = `<div class="hero__media">${imageHtml(img, { lazy: false })}</div>`;

  // Text-only heroes drop the image; a quick stat strip fills the space so the
  // band never reads as a bare block of text. Each stat gets a real icon -
  // bold-number-plus-label with nothing else read as unfinished placeholder
  // text even inside the (already-boxed) cards/divided treatments.
  const hstats = [];
  if (business.population != null) hstats.push([commas(business.population), `${business.city} residents`, 'building']);
  hstats.push([`${serviceCount(ctx)}`, 'Services offered', 'wrench']);
  if (content.areas && content.areas.length) hstats.push([`${content.areas.length}`, 'Areas covered', 'pin']);
  hstats.push(['Diagnosis', 'first, then the fix', 'search']);
  // Was one plain flex row with a hairline top border, no matter the site -
  // gave the whole hero a "just some text" finish. Pick from a small pool of
  // genuinely different treatments instead (see SECTION_POOLS.heroStats).
  // 'plain' retired - fall back to 'cards', never the bare/unstructured look.
  const heroStatsVariant = (design.variants.sectionVariants || {}).heroStats || 'cards';
  const statsCls = `hero__stats hero__stats--${heroStatsVariant}`;
  const statStrip = textOnly
    ? `<div class="${statsCls}">${hstats.slice(0, 4).map(([n, l, ic]) => `<div class="hstat">${icon(ic, { size: 20, cls: 'hstat__ico' })}<b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>`
    : '';
  const grid = textOnly
    ? `<div class="hero__grid">${copy}</div>${statStrip}`
    : `<div class="hero__grid">${copy}${media}</div>`;
  // Text-only heroes drop the side image entirely - reuse the already-
  // resolved photo as a full-bleed section background instead of leaving
  // that space blank. A dark overlay (css.js) sits between the photo and
  // the (light-on-dark) text, sized to stay legible against ANY photo.
  const bgLayer = textOnly ? `<div class="hero__bg">${imageHtml(img, { lazy: false })}</div>` : '';

  // color-block-split is a full-bleed variant (padding:0, no radius/shadow,
  // media stretches to 100% height - see css.js) - wrapping it in the
  // centered, width-capped .container like every other hero variant left a
  // large empty gap on both sides and squeezed the image into an
  // unnaturally narrow, over-cropped column. Render its grid straight
  // inside the section so both halves reach the section's own edges; the
  // copy side keeps its own generous padding (css.js) instead of relying on
  // the container for inset.
  if (variant === 'color-block-split') {
    return `<section class="hero hero--${esc(variant)}">${grid}</section>`;
  }

  return `<section class="hero hero--${esc(variant)}">${bgLayer}<div class="container">${grid}</div></section>`;
}

// ---- emergency (situation-urgency, never a fabricated availability claim) --

export function emergency(ctx) {
  const cta = primaryCta(ctx, ctx.business.phone ? undefined : 'Request Service');
  return `<section class="section section--dark emergency-band" aria-label="Urgent help">
    <div class="container emergency-band__row">
      <div class="emergency-band__copy">
        <h2>Door stuck open or won’t close?</h2>
        <p>A garage door that won’t close leaves your home open. Tell us what’s happening and we’ll help you figure out the fastest way to get it secured.</p>
      </div>
      <div class="emergency-band__cta cta-${esc(ctx.design.variants.ctaStyle)}">${btn(cta.href, cta.label, 'emergency', 'btn--lg')}</div>
    </div>
  </section>`;
}

// ---- trust bar (data-backed, factual only) -------------------------------

export function trustbar(ctx) {
  const { business, site } = ctx;
  const items = [];
  // Every trust item is ONE label: the whole phrase inside a single <b>
  // (2026-09-13, user: "Diagnosis first, then the fix - dont be inline"). A
  // .trust-item is a flex row, so "<b>Diagnosis first</b>, then the fix" split
  // into THREE flex pieces - the 9.6px flex gap opened a visible break before the
  // comma, and the unbolded half was coloured differently from every other item.
  items.push(`<div class="trust-item">${icon('pin', { size: 18 })} <b>${esc(business.city)}${business.state ? ', ' + esc(business.state) : ''}</b></div>`);
  if (site.yearsInBusiness) items.push(`<div class="trust-item">${icon('shield', { size: 18 })} <b>${esc(site.yearsInBusiness)}+ years in business</b></div>`);
  if (site.insured || site.license) items.push(`<div class="trust-item">${icon('shield', { size: 18 })} <b>Licensed &amp; insured${site.license ? ` (${esc(site.license)})` : ''}</b></div>`);
  if (site.warrantyYears) items.push(`<div class="trust-item">${icon('check', { size: 18 })} <b>${esc(site.warrantyYears)}-year warranty</b></div>`);
  if (site.freeEstimate) items.push(`<div class="trust-item">${icon('check', { size: 18 })} <b>Free estimates</b></div>`);
  if (site.noServiceCallFee) items.push(`<div class="trust-item">${icon('check', { size: 18 })} <b>No service-call fee</b></div>`);
  // Fallbacks so the bar always reads well even with no operator claims set.
  // The "Residential & commercial" fallback was removed 2026-09-13 (user: remove
  // it engine-wide, following the res/com section). The bar now falls through
  // to "Diagnosis first" below.
  // Real counts from the content lists (2026-09-13): replace the unverified
  // licensed/free-estimate defaults that used to fill this bar.
  if (items.length < 4 && serviceCount(ctx)) items.push(`<div class="trust-item">${icon('wrench', { size: 18 })} <b>${serviceCount(ctx)} services</b></div>`);
  if (items.length < 4 && areaCount(ctx)) items.push(`<div class="trust-item">${icon('pin', { size: 18 })} <b>${areaCount(ctx)} service areas</b></div>`);
  if (items.length < 4) items.push(`<div class="trust-item">${icon('search', { size: 18 })} <b>Diagnosis first, then the fix</b></div>`);
  if (business.reviews.length && business.rating != null) {
    items.push(`<div class="trust-item">${icon('star', { size: 18 })} <b>${esc(business.rating)} (${esc(business.reviewCount || business.reviews.length)} reviews)</b></div>`);
  }
  const variant = (ctx.design.variants.sectionVariants || {}).trustbar || 'pills';
  return `<section class="trustbar trustbar--${esc(variant)}" aria-label="At a glance"><div class="container">${items.join('')}</div></section>`;
}

/** Brand / badge bar - brands SERVICED (operator config) + review-platform badges. */
export function brandBar(ctx) {
  const { business, site } = ctx;
  const brands = business.brands || [];
  const badges = site.reviewBadges || [];
  if (!brands.length && !badges.length) return '';
  const chip = (b) => `<span class="brand-chip">${icon('door', { size: 14, cls: 'brand-chip__ico' })}${esc(b)}</span>`;
  const brandChips = brands.map(chip).join('');
  const badgeChips = badges.map((b) => `<span class="rev-badge"><b>${esc(b.platform)}</b>${b.rating != null ? ` <span class="rev-badge__stars">${'★'.repeat(Math.round(b.rating))}</span> ${esc(b.rating)}` : ''}${b.count ? ` · ${esc(b.count)} reviews` : ''}${b.note ? ` · ${esc(b.note)}` : ''}</span>`).join('');
  const variant = (ctx.design.variants.sectionVariants || {}).brandbar || 'static';

  // Marquee variants need enough width to loop seamlessly - fall back to the
  // static row for a short brand list rather than an obviously-choppy loop.
  const canMarquee = variant.startsWith('marquee') && brands.length >= 3;
  if (canMarquee) {
    const track = (dir) => `<div class="brandbar__marquee"><div class="brandbar__track${dir === 'rtl' ? ' brandbar__track--rtl' : ''}">${brandChips}${brandChips}</div></div>`;
    const body = variant === 'marquee-dual'
      ? `<div class="brandbar__dual">${track('rtl')}${track('ltr')}</div>`
      : track(variant === 'marquee-rtl' ? 'rtl' : 'ltr');
    return `<section class="brandbar brandbar--${esc(variant)}"><div class="container">
      <p class="brandbar__label">Brands we repair &amp; install${badges.length ? ' · Rated by customers' : ''}</p>
      ${body}
      ${badgeChips ? `<div class="brandbar__row brandbar__row--badges">${badgeChips}</div>` : ''}
    </div></section>`;
  }

  return `<section class="brandbar brandbar--${esc(variant)}"><div class="container">
    <p class="brandbar__label">Brands we repair &amp; install${badges.length ? ' · Rated by customers' : ''}</p>
    <div class="brandbar__row">${brandChips}${badgeChips}</div>
  </div></section>`;
}

/** How it works - numbered process steps. */
/**
 * The photo on a "How it works" step. ENGINE-WIDE: every process layout shows
 * one (explicit user request, 2026-08-25) - the section previously had no
 * imagery at all on any of its 20 variants.
 *
 * The slot is `proc-<step index>`, which routes each step to the pool that
 * actually depicts it (see localPhotoFor in assets/images.js): the door itself,
 * a technician diagnosing, the hardware in question, the finished repair. So
 * the four photos are relevant to their own step AND different from each other.
 * `cls` is per-LAYOUT so each shape can crop/frame its photo differently -
 * see the "process step photo" block in css.js.
 */
function procMedia(ctx, i, label, cls) {
  const img = image(ctx, `proc-${i}`, label);
  // <figure>, deliberately NOT <div>. Two generic process skins style their
  // copy wrapper with `.proc-g__item>div` (ledger-rows, oversized-index) -
  // written when the copy wrapper was the only div child of an item. A photo
  // wrapped in a div is ALSO a direct div child, so those rules captured it
  // and, at 2-classes-plus-an-element, outranked the media's own 2-class rule:
  // the photo inherited flex:1 1 auto and collapsed to ~38px on Albuquerque.
  // A figure can never match `>div`, which closes the whole collision class
  // rather than patching the two selectors that exist today. Its default
  // margin is zeroed in the shared media base rule in css.js.
  return `<figure class="${cls}">${imageHtml(img)}</figure>`;
}

export function process(ctx) {
  const steps = [
    ['phone', 'Tell us what’s wrong', 'Describe the symptom - won’t open, loud bang, opener runs but the door won’t move.'],
    ['search', 'On-site diagnosis', 'A technician tests the door under power and by hand and finds what actually failed.'],
    ['wrench', 'Clear, up-front plan', 'You get the fix that’s needed and what drives the cost - before any work starts.'],
    ['check', 'Repaired &amp; tested', 'The repair is done, the door is set true and tested, and the work area left clean.'],
  ];
  // Alt text describes the STEP, not a generic "garage door" - these are real
  // photos standing in for a real stage of the job.
  const alt = (i) => `${String(steps[i][1]).replace(/&amp;/g, '&')} - ${ctx.business.city} garage door service`;
  const variant = (ctx.design.variants.sectionVariants || {}).process || 'cards';
  if (variant === 'horizontal') {
    // Connected numbered step flow across the full width.
    const cells = steps.map(([, t, d], i) =>
      `<li class="hstep">${procMedia(ctx, i, alt(i), 'hstep__media')}<span class="hstep__n">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('');
    return section(ctx, { id: 'process', tone: 'tint', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', lead: 'A quick, honest process - no guesswork and no surprises.', body: `<ol class="hflow">${cells}</ol>` });
  }
  if (variant === 'timeline') {
    // Two-column: intro on the left, the vertical step timeline on the right,
    // so the section fills the full width (no empty right side).
    const items = steps.map(([, t, d], i) =>
      `<li class="tl-step"><span class="tl-step__n">${i + 1}</span><div class="tl-step__c">${procMedia(ctx, i, alt(i), 'tl-step__media')}<h3>${t}</h3><p>${d}</p></div></li>`).join('');
    return `<section class="section section--tint" id="process"><div class="container"><div class="process-split">
      <div class="process-intro">
        <span class="eyebrow">How it works</span>
        <h2 class="section-title">From “it’s stuck” to “it’s fixed”</h2>
        <p class="lead">A quick, honest process - no guesswork and no surprises, start to finish.</p>
        <div class="hero__cta cta-${esc(ctx.design.variants.ctaStyle)}" style="margin-top:1.4rem">${btn(primaryCta(ctx).href, primaryCta(ctx).label, 'primary', 'btn--solid')}</div>
      </div>
      <ol class="timeline">${items}</ol>
    </div></div></section>`;
  }
  if (variant === 'numbered-list') {
    // Plain vertical numbered list - no card, no connecting rail.
    const items = steps.map(([, t, d], i) => `<li><span class="proc-numlist__n">${i + 1}</span>${procMedia(ctx, i, alt(i), 'proc-numlist__media')}<div><h3>${t}</h3><p>${d}</p></div></li>`).join('');
    return section(ctx, { id: 'process', tone: 'default', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', body: `<ol class="proc-numlist">${items}</ol>` });
  }
  if (variant === 'stacked-panel') {
    // Full-width alternating panels with a large number watermark.
    const rows2 = steps.map(([, t, d], i) => `<div class="proc-stack__row"><span class="proc-stack__n">${String(i + 1).padStart(2, '0')}</span>${procMedia(ctx, i, alt(i), 'proc-stack__media')}<div><h3>${t}</h3><p>${d}</p></div></div>`).join('');
    return section(ctx, { id: 'process', tone: 'default', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', body: `<div class="proc-stacked">${rows2}</div>` });
  }
  // ('chat-bubbles' removed 2026-08-25 - see SECTION_POOLS.process in
  // variation.js for why. Markup, CSS and GSAP preset all deleted.)
  if (variant === 'dots-track') {
    // Horizontal dot-and-line track, captions below each marker.
    const items = steps.map(([, t, d], i) => `<div class="proc-track__item"><span class="proc-track__dot">${i + 1}</span>${procMedia(ctx, i, alt(i), 'proc-track__media')}<h3>${t}</h3><p>${d}</p></div>`).join('');
    return section(ctx, { id: 'process', tone: 'default', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', body: `<div class="proc-track"><div class="proc-track__line" aria-hidden="true"></div><div class="proc-track__items">${items}</div></div>` });
  }
  // ('accordion' removed 2026-08-25 - see SECTION_POOLS.process in variation.js.)
  const GENERIC_PROCESS_KEYS = ['framed-outline', 'shadow-stack', 'alternating-tint', 'circle-badge-grid', 'ledger-rows', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'oversized-index', 'compact-dense'];
  if (GENERIC_PROCESS_KEYS.includes(variant)) {
    // Number only, no icon - a step badge showing both at once read as
    // cluttered/redundant (the number already carries the sequence, the
    // icon added nothing); matches how the built-in process variants
    // (cards/timeline/horizontal) already do it.
    const gitems = steps.map(([, t, d], i) => `<div class="proc-g__item">${procMedia(ctx, i, alt(i), 'proc-g__media')}<span class="proc-g__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('');
    return section(ctx, { id: 'process', tone: 'default', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', body: `<div class="proc-generic proc-generic--${esc(variant)}">${gitems}</div>` });
  }
  const body = `<div class="grid cols-4 steps">${steps.map(([, t, d], i) =>
    `<div class="step">${procMedia(ctx, i, alt(i), 'step__media')}<div class="step__n">${i + 1}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>`;
  return section(ctx, { id: 'process', tone: 'default', eyebrow: 'How it works', title: 'From “it’s stuck” to “it’s fixed”', body });
}

// resCom() ("Residential & commercial") was REMOVED 2026-09-10 - explicit user
// instruction, "dont show any re/com sections in the UI". All five layout
// variants and their CSS went with it. The `rescom` axis REMAINS in
// SECTION_AXES/SECTION_POOLS on purpose: that array's order is the positional
// format of every stored fingerprint, so dropping the slot would shift
// `reachSteps` and silently redesign all 81 registry rows on the next repin.


/** Financing callout (operator-configured). */
export function financing(ctx, opts = {}) {
  const f = ctx.site.financing;
  if (!f) return '';
  const HT = opts.h1 ? 'h1' : 'h2';
  const head = opts.noHead ? '' : `<span class="eyebrow">Financing</span><${HT} class="section-title">Fix now, pay over time</${HT}>`;
  const partners = (f.partners || []).map((p) => `<span class="brand-chip">${esc(p)}</span>`).join('');
  return `<section class="section section--tint" id="financing"><div class="container"><div class="finance">
    <div>${head}<p class="lead">${esc(f.blurb || '')}</p>
      <div class="brandbar__row" style="margin-top:1rem">${partners}</div></div>
    <div class="finance__cta">${dualCta(ctx, {})}</div>
  </div></div></section>`;
}

// ---- services ------------------------------------------------------------

/**
 * The photo every service card carries. ENGINE-WIDE: every services() layout
 * variant and every serviceCard skin renders one (explicit user request,
 * 2026-08-25 - "always show images in this service card ... engine wise"), so
 * a service card is never icon-only on any site.
 *
 * The image slot is the SERVICE ID, not the loop index - that's what routes
 * the pick through config/local-photos.js's SERVICE_CATEGORY map (repair ->
 * GD REPAIR, installation -> GD INSTALLATION, ...) instead of falling through
 * to the generic SERVICE pool for everything. Picks are deduped per page by
 * image() itself, so N cards on one page get N different photos.
 */
function svcMedia(ctx, id, label, cls = 'svc__media') {
  const img = image(ctx, `svc-${id}`, `${label} in ${ctx.business.city}`);
  return `<div class="${cls}">${imageHtml(img)}</div>`;
}

export function services(ctx, opts = {}) {
  const { design, content, urls } = ctx;
  const skin = design.variants.serviceCard;
  const gv = (design.variants.sectionVariants || {}).services || 'grid';
  // `opts.items` lets a caller point this section at a DIFFERENT set of
  // service links than the site-wide catalog - used by a suburb page to list
  // its own nested service pages (2026-09-09). Same skin, same variant, same
  // markup: only the links differ.
  const list = content.services.length ? content.services : ctx.business.services.map((s) => ({ id: s.id, service: s }));
  const items = opts.items
    ? opts.items.map((it) => ({ ...it, icName: SVC_ICON[it.icName] || SVC_ICON[it.icon] || 'wrench' }))
    : list.map((entry) => {
      const s = entry.service || {};
      return {
        id: entry.id,
        icName: SVC_ICON[s.icon] || 'wrench',
        href: svcHref(entry, urls),
        blurb: (entry.page && entry.page.meta) || '',
        label: s.label || entry.id,
      };
    });
  const nh = opts.noHead;
  const headOpts = {
    id: 'services', tone: opts.tone || 'alt', h1: opts.h1 || false,
    eyebrow: nh ? '' : (opts.eyebrow || 'What we do'),
    title: nh ? '' : (opts.title || 'Garage Door Services'),
    lead: nh ? '' : (opts.lead || `Repair and installation work for ${esc(ctx.business.city)} homes and businesses.`),
  };

  // LIST - vertical numbered service rows. With a heading it's a 2-column layout
  // (sticky intro + CTA on the left); when headerless (a sub-section on a page
  // that already has a hero CTA) the rows fill the full width - no redundant
  // intro column or duplicate "Request a Quote" button.
  if (gv === 'list') {
    const rows = items.map((it) => `<a class="svc-row" href="${esc(it.href)}">
      ${svcMedia(ctx, it.id, it.label, 'svc-row__media')}
      <span class="svc-row__ic" aria-hidden="true">${icon(it.icName, { size: 22 })}</span>
      <span class="svc-row__c"><b>${esc(it.label)}</b><span>${esc(it.blurb)}</span></span>
      <span class="svc-row__go" aria-hidden="true">${icon('arrow', { size: 18 })}</span>
    </a>`).join('');
    const toneClass = headOpts.tone === 'alt' ? ' section--alt' : headOpts.tone === 'tint' ? ' section--tint' : '';
    if (nh) {
      return `<section class="section${toneClass}" id="services"><div class="container"><div class="svc-rows svc-rows--full">${rows}</div></div></section>`;
    }
    const HT = headOpts.h1 ? 'h1' : 'h2';
    const intro = `<div class="svc-list-intro">
      ${headOpts.eyebrow ? `<span class="eyebrow">${esc(headOpts.eyebrow)}</span>` : ''}
      ${headOpts.title ? `<${HT} class="section-title">${esc(headOpts.title)}</${HT}>` : ''}
      ${headOpts.lead ? `<p class="lead">${esc(headOpts.lead)}</p>` : ''}
      <div class="hero__cta cta-${esc(design.variants.ctaStyle)}" style="margin-top:1.2rem">${btn(primaryCta(ctx).href, primaryCta(ctx).label, 'primary', 'btn--solid')}</div>
    </div>`;
    return `<section class="section${toneClass}" id="services"><div class="container"><div class="svc-listing">${intro}<div class="svc-rows">${rows}</div></div></div></section>`;
  }

  // HCARDS - horizontal cards, icon pinned in its own left column.
  if (gv === 'hcards') {
    const cards = items.map((it) => `<a class="svc-hcard" href="${esc(it.href)}">
      ${svcMedia(ctx, it.id, it.label, 'svc-hcard__media')}
      <span class="svc-hcard__ic" aria-hidden="true">${icon(it.icName, { size: 24 })}</span>
      <div class="svc-hcard__body"><h3>${esc(it.label)}</h3><p>${esc(it.blurb)}</p><span class="svc__more">Learn more ${icon('arrow', { size: 15 })}</span></div>
    </a>`).join('');
    return section(ctx, { ...headOpts, body: `<div class="svc-hcards">${cards}</div>` });
  }

  // ACCORDION - expandable rows, one detail open at a time.
  if (gv === 'accordion') {
    const items2 = items.map((it) => `<details class="svc-acc">
      <summary>${svcMedia(ctx, it.id, it.label, 'svc-acc__media')}<span class="svc-acc__ic" aria-hidden="true">${icon(it.icName, { size: 20 })}</span><span class="svc-acc__t">${esc(it.label)}</span></summary>
      <div class="svc-acc__body"><p>${esc(it.blurb)}</p><a class="svc__more" href="${esc(it.href)}">Learn more ${icon('arrow', { size: 15 })}</a></div>
    </details>`).join('');
    return section(ctx, { ...headOpts, body: `<div class="svc-accordion">${items2}</div>` });
  }

  // ROWS - full-width alternating zig-zag rows with imagery.
  if (gv === 'rows') {
    const rows = items.slice(0, 4).map((it, i) => {
      // Slot keyed by service id (not the loop index) so the photo comes from
      // that service's own category pool - same rule as svcMedia() above.
      return `<div class="svc-zz${i % 2 ? ' svc-zz--rev' : ''}">
        ${svcMedia(ctx, it.id, it.label, 'svc-zz__media')}
        <div class="svc-zz__body"><span class="svc-zz__ic" aria-hidden="true">${icon(it.icName, { size: 24 })}</span><h3>${esc(it.label)}</h3><p>${esc(it.blurb)}</p><a class="svc__more" href="${esc(it.href)}">Learn more ${icon('arrow', { size: 16 })}</a></div>
      </div>`;
    }).join('');
    return section(ctx, { ...headOpts, body: `<div class="svc-zzwrap">${rows}</div>` });
  }

  // GENERIC SKINS - shared icon+title+desc card markup; visual variety comes
  // entirely from CSS (see .svc-generic--* rules in css.js) so each of these
  // keys can be a genuinely distinct treatment without a bespoke JS branch.
  const GENERIC_SERVICE_KEYS = ['framed-outline', 'shadow-stack', 'pill-tags', 'zigzag-offset', 'boxed-diagonal', 'glass-panel-grid'];
  if (GENERIC_SERVICE_KEYS.includes(gv)) {
    const gcards = items.map((it) => `<a class="svc-g" href="${esc(it.href)}">
      ${svcMedia(ctx, it.id, it.label, 'svc-g__media')}
      <span class="svc-g__ic" aria-hidden="true">${icon(it.icName, { size: 22 })}</span>
      <span class="svc-g__body"><b>${esc(it.label)}</b><span>${esc(it.blurb)}</span></span>
    </a>`).join('');
    return section(ctx, { ...headOpts, body: `<div class="svc-generic svc-generic--${esc(gv)}">${gcards}</div>` });
  }

  // BENTO / GRID - card variants (bento makes the first card large).
  // The WHOLE card is the link (user request, 2026-08-25) - it used to be an
  // <article> whose only clickable target was the small "Learn more" line, so
  // clicking the photo, title or body text did nothing. "Learn more" is now a
  // <span>: an <a> inside an <a> is invalid HTML and browsers silently unnest
  // it, which would break the card link. This is the same shape .svc-row and
  // .svc-g already use.
  const cards = items.map((it, i) => `<a class="svc svc--${esc(skin)}${gv === 'bento' ? ` bento-cell${i === 0 ? ' bento-cell--lg' : ''}` : ''}" href="${esc(it.href)}">
      ${svcMedia(ctx, it.id, it.label)}
      <div class="svc__icon" aria-hidden="true">${icon(it.icName, { size: 26 })}</div>
      <h3>${esc(it.label)}</h3>
      <p>${esc(it.blurb)}</p>
      <span class="svc__more">Learn more ${icon('arrow', { size: 16 })}</span>
    </a>`).join('');
  // Column count is emitted as a class rather than left to the CSS: the row
  // must hold ALL the services when there are 3 or 4 of them (explicit user
  // request, 2026-08-25 - "if 3/4 services show in a row ... in desktop"),
  // and a fixed repeat(3,1fr) would orphan the 4th card of a 4-service site
  // onto its own row. Beyond 4, wrap at 3 when the count divides evenly by 3
  // (no orphan row), otherwise 4.
  const n = items.length;
  const cols = n <= 4 ? Math.max(1, n) : (n % 3 === 0 ? 3 : 4);
  return section(ctx, { ...headOpts, body: `<div class="${gv === 'bento' ? 'svc-bento' : `svc-grid svc-grid--cols-${cols}`}">${cards}</div>` });
}

// ---- stats band (real numbers only) -------------------------------------

function statIcon(key, size = 20) {
  return `<span class="stat-ic" aria-hidden="true">${icon(key, { size })}</span>`;
}

export function stats(ctx) {
  const b = ctx.business;
  const items = [];
  if (b.population != null) items.push([commas(b.population), `Residents in ${b.city}`, 'users']);
  items.push([`${serviceCount(ctx)}`, 'Garage door services', 'wrench']);
  if (ctx.content.areas && ctx.content.areas.length) items.push([`${ctx.content.areas.length}`, 'Neighborhoods & suburbs', 'pin']);
  items.push([`${b.state || 'Local'}`, b.state ? `Serving ${b.city}, ${b.state}` : `Serving ${b.city}`, 'shield']);
  // Need at least 2 numeric-ish stats to be worth a band.
  if (items.length < 3) return '';
  const variant = (ctx.design.variants.sectionVariants || {}).stats || 'band';
  const cells = items.slice(0, 4).map(([n, l, ic]) => `<div class="stat">${statIcon(ic)}<div class="stat__n">${esc(n)}</div><div class="stat__l">${esc(l)}</div></div>`).join('');
  if (variant === 'strip') {
    // Thin inline divided row on a surface card.
    const scells = items.slice(0, 4).map(([n, l, ic]) => `<div class="ss-cell">${statIcon(ic, 18)}<span class="ss-n">${esc(n)}</span><span class="ss-l">${esc(l)}</span></div>`).join('');
    return `<section class="section"><div class="container"><div class="stats-strip">${scells}</div></div></section>`;
  }
  if (variant === 'cards') {
    // Bordered stat cards on a plain band (numbers keep the gradient).
    return `<section class="section"><div class="container"><div class="stats stats--cards">${cells}</div></div></section>`;
  }
  if (variant === 'spotlight') {
    // Asymmetric: one lead number given the weight, the rest as small cells
    // beside it - reads as "the one number that matters" instead of four
    // equal-weight tiles.
    const [lead, ...rest] = items.slice(0, 4);
    const restCells = rest.map(([n, l, ic]) => `<div class="ssp-cell">${statIcon(ic, 17)}<b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('');
    return `<section class="section"><div class="container"><div class="stats-spotlight">
      <div class="ssp-lead">${statIcon(lead[2], 24)}<div class="ssp-n">${esc(lead[0])}</div><div class="ssp-l">${esc(lead[1])}</div></div>
      <div class="ssp-rest">${restCells}</div>
    </div></div></section>`;
  }
  if (variant === 'ticker') {
    // Unboxed, edge-to-edge divided row - sits directly on the page
    // background (no card, no gradient) instead of reading as its own block.
    const tcells = items.slice(0, 4).map(([n, l, ic]) => `<div class="st-cell">${statIcon(ic, 16)}<b>${esc(n)}</b><span class="st-l">${esc(l)}</span></div>`).join('');
    return `<section class="section" style="padding-block:0"><div class="container"><div class="stats-ticker">${tcells}</div></div></section>`;
  }
  if (variant === 'ring') {
    // Each number sits inside a circular outline badge instead of bare text.
    const rcells = items.slice(0, 4).map(([n, l, ic]) => `<div class="sr-cell">${statIcon(ic, 18)}<div class="sr-circle"><span>${esc(n)}</span></div><span class="sr-l">${esc(l)}</span></div>`).join('');
    return `<section class="section"><div class="container"><div class="stats-ring">${rcells}</div></div></section>`;
  }
  if (variant === 'columns') {
    // "Spec sheet" table: one row of labels (icon + label), one row of numbers.
    const labelCells = items.slice(0, 4).map(([, l, ic]) => `<div class="stc-cell">${statIcon(ic, 16)}<span>${esc(l)}</span></div>`).join('');
    const valueCells = items.slice(0, 4).map(([n]) => `<div class="stc-cell">${esc(n)}</div>`).join('');
    return `<section class="section"><div class="container"><div class="stats-table">
      <div class="stc-row stc-row--labels">${labelCells}</div>
      <div class="stc-row stc-row--values">${valueCells}</div>
    </div></div></section>`;
  }
  const GENERIC_STATS_KEYS = ['framed-outline', 'shadow-stack', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'oversized-index', 'compact-dense'];
  if (GENERIC_STATS_KEYS.includes(variant)) {
    const gcells = items.slice(0, 4).map(([n, l, ic]) => `<div class="stats-g__cell">${statIcon(ic, 19)}<b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('');
    return `<section class="section"><div class="container"><div class="stats-generic stats-generic--${esc(variant)}">${gcells}</div></div></section>`;
  }
  return `<section class="section section--brand"><div class="container"><div class="stats">${cells}</div></div></section>`;
}

// ---- why choose / approach ----------------------------------------------

export function why(ctx) {
  const feats = [
    ['search', 'Diagnosis first', 'Every visit starts by finding what actually failed - not a pre-written parts list.'],
    ['target', 'The right part for the door', 'Springs and openers matched to the door’s weight and age, so the fix holds up.'],
    ['chat', 'Straight answers', 'When a repair makes more sense than a replacement - or the reverse - you hear it plainly.'],
    ['sparkle', 'Clean, careful work', 'Tension released safely, hardware set true, the door tested under power before we leave.'],
  ];
  const variant = (ctx.design.variants.sectionVariants || {}).why || 'cards';
  if (variant === 'stat-inline') {
    // Horizontal 4-up flow with round icon medallions.
    const cells = feats.map(([ic, t, d]) =>
      `<div class="wf-cell"><span class="wf-ic" aria-hidden="true">${icon(ic, { size: 26 })}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('');
    return `<section class="section section--tint" id="why"><div class="container">
      <div class="section-head"><span class="eyebrow">How we work</span><h2 class="section-title">What to expect</h2><p class="lead">A straight, honest approach on every ${esc(ctx.business.city)} job.</p></div>
      <div class="why-flow">${cells}</div>
    </div></section>`;
  }
  if (variant === 'rows') {
    // Two-column: intro on the left, feature rows on the right (fills width).
    const rows = feats.map(([ic, t, d], i) =>
      `<div class="feat-row"><span class="feat-row__n">0${i + 1}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></div>`).join('');
    return `<section class="section" id="why"><div class="container"><div class="why-split">
      <div class="why-intro">
        <span class="eyebrow">How we work</span>
        <h2 class="section-title">What to expect</h2>
        <p class="lead">A straight, honest approach on every ${esc(ctx.business.city)} job - diagnosis first, the right parts, and clean work.</p>
      </div>
      <div class="feat-rows">${rows}</div>
    </div></div></section>`;
  }
  if (variant === 'bordered-list') {
    // Stacked full-width bordered boxes (icon left) - distinct from the
    // 2-col card grid AND the divider-only "rows" split.
    const rows = feats.map(([ic, t, d]) => `<div class="why-blist__row">
      <span class="why-blist__ic" aria-hidden="true">${icon(ic, { size: 24 })}</span>
      <div class="why-blist__c"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>
    </div>`).join('');
    return section(ctx, { id: 'why', tone: 'tint', eyebrow: 'How we work', title: 'What to expect', body: `<div class="why-blist">${rows}</div>` });
  }
  // 'spotlight' RETIRED for the why axis (2026-08-30, explicit user
  // instruction: "this is not a suitable variant, so dont use this variant
  // anymore"). A 1fr/1fr split gave ONE reason half the section and squeezed
  // the other three into the right column, so the lead cell was mostly empty
  // - vertically centred text in a half-width box next to a denser list, and
  // it read as an unbalanced layout rather than an emphasis.
  // Removed from POOLS.why, CSS deleted, and this render branch deleted so an
  // explicit --variants override cannot bring it back.
  // NOTE: 'spotlight' is still a LIVE key on the `stats` axis (stats() above,
  // .stats-spotlight in css.js) - retirement is per-axis. Do not delete that.
  if (variant === 'icon-band') {
    // Flowing wrapped band of pill items (icon + title/desc), not a fixed grid.
    const items = feats.map(([ic, t, d]) => `<div class="why-iband__item">
      <span class="why-iband__ic" aria-hidden="true">${icon(ic, { size: 20 })}</span>
      <div><b>${esc(t)}</b><span>${esc(d)}</span></div>
    </div>`).join('');
    return section(ctx, { id: 'why', tone: 'tint', eyebrow: 'How we work', title: 'What to expect', body: `<div class="why-iband">${items}</div>` });
  }
  // 'accordion' retired 2026-08-25 - see the note on POOLS.why in
  // engine/variation.js. It hid every reason's copy inside a closed <details>,
  // so the section rendered as four bare headings. Branch removed rather than
  // left dead: the key can no longer be rolled, and an explicit --variants
  // override naming it now falls through to the default instead of silently
  // rendering the collapsed layout again.
  if (variant === 'checklist') {
    const items = feats.map(([, t, d]) => `<li><span class="why-check__ic" aria-hidden="true">${icon('check', { size: 16 })}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('');
    return section(ctx, { id: 'why', tone: 'tint', eyebrow: 'How we work', title: 'What to expect', body: `<ul class="why-checklist">${items}</ul>` });
  }
  const GENERIC_WHY_KEYS = ['framed-outline', 'shadow-stack', 'alternating-tint', 'circle-badge-grid', 'ledger-rows', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'split-duotone', 'outline-only'];
  if (GENERIC_WHY_KEYS.includes(variant)) {
    const gitems = feats.map(([ic, t, d]) => `<div class="why-g__item"><span class="why-g__ic" aria-hidden="true">${icon(ic, { size: 22 })}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('');
    return section(ctx, { id: 'why', tone: 'tint', eyebrow: 'How we work', title: 'What to expect', body: `<div class="why-generic why-generic--${esc(variant)}">${gitems}</div>` });
  }
  const body = `<div class="grid cols-2">${feats.map(([ic, t, d]) =>
    `<div class="feat"><div class="feat__dot" aria-hidden="true">${icon(ic, { size: 22 })}</div><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></div>`).join('')}</div>`;
  return section(ctx, { id: 'why', tone: 'tint', eyebrow: 'How we work', title: 'What to expect', body });
}

// ---- about ---------------------------------------------------------------

export function about(ctx) {
  const page = ctx.content.about || (ctx.content.home && { sections: [] });
  if (!page) return '';
  const secs = (page.sections || []).slice(0, 2).map((s) => `<div>${paras(s.body)}</div>`).join('');
  const img = image(ctx, 'about', `About ${ctx.business.name}`);
  return section(ctx, {
    id: 'about', tone: 'tint', eyebrow: 'About', title: page.h1 || `About ${ctx.business.name}`,
    body: `<div class="grid cols-2" style="align-items:center"><div>${secs}</div><figure class="about__media">${imageHtml(img)}</figure></div>`,
  });
}

// ---- gallery (illustrative door styles; not claimed as real projects) ----

// Column count these variants render at on a normal desktop width (see
// css.js) - used below to pick an item count with no remainder, so the
// last row is never a single orphaned item floating in a mostly-empty row
// (confirmed real bug, 2026-08-24: grid-5 at the old fixed count of 6 always
// split 5+1, no matter the business - deterministic, not content-dependent -
// and read as "too much blank space" on a real screen even though every
// pixel was technically painted; a per-section content-envelope QA check
// can't catch this because the ENVELOPE (header-to-last-row) already spans
// the section correctly, the problem is DENSITY inside that envelope).
const GALLERY_FOUR_COL = new Set(['ribbon-corner', 'minimal-gap']);
/**
 * 4-column gallery variants whose FIRST tile spans extra cells - grid-4's
 * spans 2x2, wide-hero-strip's spans the whole row. That first tile therefore
 * occupies 4 grid cells on its own, so the REMAINING tiles have to be a
 * multiple of 4 for the last row to close. At the old count of 8 they came to
 * 4 + 7 = 11 cells in a 4-wide grid: two full rows plus a 3-tile row, leaving
 * a measured 297px hole at the end (user-reported, 2026-08-25). 9 tiles gives
 * 4 + 8 = 12 cells - exactly three full rows.
 */
const GALLERY_FOUR_COL_HERO = new Set(['grid-4', 'wide-hero-strip']);

export function gallery(ctx) {
  const variant = ctx.design.variants.gallery;
  const count = variant === 'wide-strip' ? 4 : variant === 'grid-2' ? 4
    : variant === 'grid-5' ? 10 // 5 cols x 2 clean rows (was 6 -> 5+1)
    : GALLERY_FOUR_COL_HERO.has(variant) ? 9 // spanning first tile: 4 + 8 = 12 cells = 3 clean rows
    : GALLERY_FOUR_COL.has(variant) ? 8 // 4 cols x 2 clean rows (was 6 -> 4+2)
    : 6; // 2- and 3-col variants already divide 6 evenly
  const labels = [
    'Sectional steel', 'Insulated panel', 'Carriage style', 'Full-view glass', 'Commercial roll-up', 'Modern flush',
    'Raised panel', 'Roll-up steel', 'Wood-look composite', 'Steel with windows',
  ];
  const figs = Array.from({ length: count }, (_, i) => {
    const img = image(ctx, `gallery-${i}`, `${labels[i % labels.length]} garage door`);
    return `<figure>${imageHtml(img)}<figcaption>${esc(labels[i % labels.length])}</figcaption></figure>`;
  }).join('');
  return section(ctx, {
    id: 'gallery', tone: 'alt', eyebrow: 'Door styles', title: 'Doors and work we handle',
    lead: 'Illustrative styles - sectional, insulated steel, carriage, and commercial doors.',
    body: `<div class="gallery gallery--${esc(variant)}">${figs}</div>`,
  });
}

// ---- reviews (ONLY with real review data) --------------------------------

export function reviews(ctx, opts = {}) {
  const b = ctx.business;
  const badges = ctx.site.reviewBadges || [];
  const variant = ctx.design.variants.reviewCard;
  // Real testimonials (never fabricated).
  if (b.reviews && b.reviews.length) {
    const cards = b.reviews.slice(0, 3).map((r) => `<article class="rev rev--${esc(variant)}">
      <div class="rev__stars" aria-label="${esc(r.rating)} out of 5">${'★'.repeat(Math.round(r.rating || 5))}</div>
      <p class="rev__text">${esc(r.text)}</p>
      <div class="rev__who">${esc(r.author)}</div>
    </article>`).join('');
    return section(ctx, { id: 'reviews', tone: 'alt', h1: opts.h1 || false, eyebrow: 'Reviews', title: opts.title || 'What customers say', body: `<div class="grid cols-3">${cards}</div>` });
  }
  // Otherwise, if the operator provided review-platform badges, show those.
  if (badges.length) {
    const cards = badges.map((bd) => `<div class="rev-card">${bd.rating != null ? `<div class="rev-card__n">${esc(bd.rating)}</div><div class="rev__stars">${'★'.repeat(Math.round(bd.rating))}</div>` : ''}<div class="rev-card__p">${esc(bd.platform)}</div>${bd.count ? `<div class="rev-card__c">${esc(bd.count)} reviews</div>` : ''}${bd.note ? `<div class="rev-card__c">${esc(bd.note)}</div>` : ''}</div>`).join('');
    return section(ctx, { id: 'reviews', tone: 'alt', h1: opts.h1 || false, eyebrow: 'Reviews', title: opts.title || 'Rated by local customers', body: `<div class="grid cols-3 rev-badges">${cards}</div>` });
  }
  return '';
}

// ---- service areas (ONLY with real areas) --------------------------------

export function areas(ctx, opts = {}) {
  const list = ctx.content.areas;
  if (!list || !list.length) return '';
  const b = ctx.business;
  const pin = icon('pin', { size: 15 });
  const link = (a) => `<li><a href="${esc(areaHref(a, ctx.urls))}">${pin}<span>${esc(a.name)}</span></a></li>`;
  // Homepage preview, not the exhaustive directory - every site already has
  // a real /service-areas/ index page with the full list (confirmed real
  // complaint, 2026-08-24: a business with 20-31 real areas rendered ALL of
  // them inline here, one per row on some variants, making the section by
  // far the tallest on the page with a lot of unused width beside a single
  // narrow column). Show a capped preview + a real "View all N areas" link
  // to that index page instead, on every variant - not just the worst-
  // offending ones (which are separately banned below).
  //
  // `opts.full` (set by buildAreaPages() for the /service-areas/ index page
  // ITSELF, see pages.js) disables the cap - that page IS the "view all"
  // destination, so truncating it and pointing its own "View all" link at
  // itself would be nonsensical (confirmed real regression, 2026-08-24: the
  // index page reuses this same areas() component with noHead:true, and
  // inherited the cap meant only for the homepage preview until this flag
  // was added). Only the homepage (and any other PREVIEW usage) should ever
  // pass a falsy/omitted `full`.
  const AREA_PREVIEW_CAP = 10;
  const shown = (!opts.full && list.length > AREA_PREVIEW_CAP) ? list.slice(0, AREA_PREVIEW_CAP) : list;
  const nbs = shown.filter((a) => a.type === 'neighborhood');
  const subs = shown.filter((a) => a.type === 'suburb');
  const viewAllLink = (!opts.full && list.length > AREA_PREVIEW_CAP)
    ? `<a class="cov-viewall" href="${esc(ctx.urls.areas)}">View all ${list.length} areas ${icon('arrow', { size: 15 })}</a>` : '';
  const group = (label, items) => items.length
    ? `<div class="cov-group"><h3>${esc(label)}</h3><ul class="cov-list">${items.map(link).join('')}</ul></div>` : '';
  const listCol = (nbs.length || subs.length)
    ? group(`${b.city} neighborhoods`, nbs) + group('Nearby communities', subs)
    : `<div class="cov-group"><ul class="cov-list">${shown.map(link).join('')}</ul></div>`;

  const uid = (fnv1a(`${b.domain}:coverage`) % 100000).toString(36);
  // The coverage-section CTA button (all 5 layouts) was removed 2026-09-13 at
  // the user's request. The header text already flexes to fill the row, so no
  // layout is left hollow.
  const variant = (ctx.design.variants.sectionVariants || {}).areas || 'map';

  let body;
  if (variant === 'compact') {
    // Count headline + pin-tagged coverage chips, grouped into labeled
    // clusters (neighborhoods / nearby communities) instead of one flat
    // cloud, so it reads as structured coverage rather than a loose pile
    // of pills - same grouping the map/directory variants already use.
    const chip = (a) => `<a class="area-chip" href="${esc(areaHref(a, ctx.urls))}">${pin}<span>${esc(a.name)}</span></a>`;
    const cloud = (label, items) => items.length
      ? `<div class="cov-cloud-group"><h4>${esc(label)}</h4><div class="cov-cloud">${items.map(chip).join('')}</div></div>` : '';
    const clouds = (nbs.length || subs.length)
      ? cloud(`${b.city} neighborhoods`, nbs) + cloud('Nearby communities', subs)
      : `<div class="cov-cloud">${shown.map(chip).join('')}</div>`;
    body = `<div class="cov-compact">
      <div class="cov-compact__head">
        <span class="cov-panel__n">${list.length}</span>
        <p>${esc(b.city)}-area neighborhoods &amp; nearby communities we cover</p>
      </div>
      ${clouds}
    </div>`;
  } else if (variant === 'cards') {
    // Grid of individual area cards (pin + name + arrow) - more visual
    // weight per item than a flat pill cloud, without the map's real
    // estate. Fixes "most sites just show a pin-icon chip list" by giving
    // that same information a genuinely different shape.
    const card = (a) => `<a class="area-card" href="${esc(areaHref(a, ctx.urls))}">${pin}<span>${esc(a.name)}</span>${icon('arrow', { size: 14, cls: 'area-card__arrow' })}</a>`;
    const grid = (label, items) => items.length
      ? `<div class="cov-cardgrid-group"><h4>${esc(label)}</h4><div class="cov-cardgrid">${items.map(card).join('')}</div></div>` : '';
    const grids = (nbs.length || subs.length)
      ? grid(`${b.city} neighborhoods`, nbs) + grid('Nearby communities', subs)
      : `<div class="cov-cardgrid">${shown.map(card).join('')}</div>`;
    body = `<div class="cov-cards">
      <div class="cov-compact__head">
        <span class="cov-panel__n">${list.length}</span>
        <p>${esc(b.city)}-area neighborhoods &amp; nearby communities we cover</p>
      </div>
      ${grids}
    </div>`;
  } else if (['framed-outline', 'shadow-stack', 'pill-tags', 'circle-badge-grid', 'quiet-editorial', 'boxed-diagonal', 'wide-spaced-grid', 'glass-panel-grid', 'split-duotone', 'outline-only', 'stacked-two-row', 'divider-line-row', 'boxed-grid-table'].includes(variant)) {
    // GENERIC SKIN - shared count-header + the same real neighborhood/suburb
    // directory (listCol) every other areas() variant uses; visual variety
    // comes entirely from CSS (see .cov-generic--* rules).
    body = `<div class="cov-generic cov-generic--${esc(variant)}">
      <div class="cov-generic__head">
        <span class="cov-panel__n">${list.length}</span>
        <p>${esc(b.city)}-area neighborhoods &amp; nearby communities we cover</p>
      </div>
      <div class="cov-generic__list">${listCol}</div>
    </div>`;
  } else if (variant === 'directory') {
    // Gradient coverage panel + wide 3-column directory (no map).
    const panel = `<div class="cov-panel">
        <span class="cov-panel__n">${list.length}</span>
        <p>${esc(b.city)}-area neighborhoods &amp; nearby communities we cover</p>
      </div>`;
    body = `<div class="coverage coverage--directory">${panel}<div class="coverage__list coverage__list--wide">${listCol}</div></div>`;
  } else {
    // Real coverage map (OpenStreetMap, centered on the city) + directory. Falls
    // back to a relevant photo if the dataset has no coordinates.
    let mapMedia;
    if (b.lat != null && b.lng != null) {
      const d = 0.09;
      const bbox = `${(b.lng - d).toFixed(4)},${(b.lat - d * 0.6).toFixed(4)},${(b.lng + d).toFixed(4)},${(b.lat + d * 0.6).toFixed(4)}`;
      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${b.lat},${b.lng}`;
      mapMedia = `<iframe title="Map of ${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''}" src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } else {
      mapMedia = imageHtml(image(ctx, 'about', `${b.city} area we serve`));
    }
    const mapCol = `<div class="coverage__map">
        ${mapMedia}
        <span class="coverage__badge">${icon('pin', { size: 15 })} ${list.length} areas covered</span>
      </div>`;
    body = `<div class="coverage">
      ${mapCol}
      <div class="coverage__body">
        <div class="coverage__list">${listCol}</div>
      </div>
    </div>`;
  }
  body += viewAllLink;
  const nh = opts.noHead;
  return section(ctx, {
    id: 'areas', tone: 'tint', h1: opts.h1 || false,
    eyebrow: nh ? '' : 'Where we work',
    title: nh ? '' : (opts.title || `Serving ${esc(b.city)} & nearby`),
    lead: nh ? '' : `Local garage door service across ${list.length} ${esc(b.city)}-area neighborhoods and communities - is your street on the list?`,
    body,
  });
}

// ---- faq -----------------------------------------------------------------

// FAQ was a single fixed design (sticky intro + accordion) with no variant
// pool at all until this axis was added - see SECTION_POOLS.faq in
// variation.js for the full 20-key list and how the 5 markup shapes below
// map to it. FAQ_GENERIC_KEYS reuse split-sticky's exact intro+accordion
// markup, CSS-only (the "generic skin" pattern used by every other axis).
const FAQ_GENERIC_KEYS = ['framed-outline', 'shadow-stack', 'alternating-tint', 'quiet-editorial',
  'boxed-diagonal', 'wide-spaced-grid', 'underline-accent-list', 'glass-panel-grid', 'split-duotone',
  'outline-only', 'minimal-text-row', 'divider-line-row', 'ledger-rows', 'compact-dense'];

export function faq(ctx, items, opts = {}) {
  const list = items || ctx.content.faq || [];
  if (!list.length) return '';
  const HT = opts.h1 ? 'h1' : 'h2';
  const c = primaryCta(ctx);
  const variant = (ctx.design.variants.sectionVariants || {}).faq || 'split-sticky';
  const toneClass = opts.tone === 'alt' ? ' section--alt' : opts.tone === 'tint' ? ' section--tint' : '';
  const eyebrow = esc(opts.eyebrow || 'Questions');
  const title = esc(opts.title || 'Frequently asked');
  const lead = esc(opts.lead || `Straight answers about garage door repair in ${ctx.business.city}. Still unsure? Ask us directly.`);
  const ctaHtml = `<div class="hero__cta cta-${esc(ctx.design.variants.ctaStyle)}" style="margin-top:1.3rem">${btn(c.href, c.label, 'primary', 'btn--solid')}</div>`;

  if (variant === 'numbered') {
    // Same split-sticky shape, but each question is prefixed with a visible
    // number badge - reads as a real, finite, "worked through" list rather
    // than an open-ended accordion.
    const acc = `<div class="faq faq--numbered">${list.map((f, i) => `<details><summary><span class="faq__n">${String(i + 1).padStart(2, '0')}</span><span class="faq__q">${esc(f.q)}</span></summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
    const intro = `<div class="faq-intro"><span class="eyebrow">${eyebrow}</span><${HT} class="section-title">${title}</${HT}><p class="lead">${lead}</p>${ctaHtml}</div>`;
    return `<section class="section${toneClass}" id="faq"><div class="container"><div class="faq-split">${intro}${acc}</div></div></section>`;
  }
  if (variant === 'circle-badge-grid') {
    // Same split-sticky shape, a circular question-mark badge instead of
    // the number/nothing before each question.
    const acc = `<div class="faq faq--circle-badge-grid">${list.map((f) => `<details><summary><span class="faq__badge" aria-hidden="true">${icon('chat', { size: 16 })}</span><span class="faq__q">${esc(f.q)}</span></summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
    const intro = `<div class="faq-intro"><span class="eyebrow">${eyebrow}</span><${HT} class="section-title">${title}</${HT}><p class="lead">${lead}</p>${ctaHtml}</div>`;
    return `<section class="section${toneClass}" id="faq"><div class="container"><div class="faq-split">${intro}${acc}</div></div></section>`;
  }
  if (variant === 'flat-cards') {
    // No accordion at all - every answer visible at once as a 2-column grid
    // of bordered cards. A genuinely different interaction model (skim
    // everything vs. click to expand), not just a CSS reskin.
    const cards = list.map((f) => `<article class="faq-card"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></article>`).join('');
    const head = `<div class="faq-single__head"><span class="eyebrow">${eyebrow}</span><${HT} class="section-title">${title}</${HT}><p class="lead">${lead}</p></div>`;
    return `<section class="section${toneClass}" id="faq"><div class="container"><div class="faq-single"><div class="faq-single__head-row">${head}</div><div class="faq-cards">${cards}</div><div class="faq-single__cta">${ctaHtml}</div></div></div></section>`;
  }
  if (variant === 'single-column' || variant === 'two-col-grid') {
    // No sidebar - centered head, then the SAME accordion markup as
    // split-sticky, either one column (single-column) or CSS-columns split
    // (two-col-grid, matches the split-duotone convention used elsewhere).
    const acc = `<div class="faq faq--${esc(variant)}">${list.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
    const head = `<div class="faq-single__head"><span class="eyebrow">${eyebrow}</span><${HT} class="section-title">${title}</${HT}><p class="lead">${lead}</p></div>`;
    return `<section class="section${toneClass}" id="faq"><div class="container"><div class="faq-single">${head}${acc}<div class="faq-single__cta">${ctaHtml}</div></div></div></section>`;
  }

  // split-sticky (default) + all FAQ_GENERIC_KEYS: identical markup, the
  // modifier class (empty for the default) carries every visual difference.
  const skinClass = variant === 'split-sticky' || !FAQ_GENERIC_KEYS.includes(variant) ? '' : ` faq-split--${esc(variant)}`;
  const acc = `<div class="faq">${list.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
  const intro = `<div class="faq-intro"><span class="eyebrow">${eyebrow}</span><${HT} class="section-title">${title}</${HT}><p class="lead">${lead}</p>${ctaHtml}</div>`;
  return `<section class="section${toneClass}" id="faq"><div class="container"><div class="faq-split${skinClass}">${intro}${acc}</div></div></section>`;
}

// ---- cta band ------------------------------------------------------------

export function cta(ctx) {
  const b = ctx.business;
  const variant = (ctx.design.variants.sectionVariants || {}).cta || 'centered';
  const heading = 'Ready to get your garage door sorted?';
  const lead = `Tell us what it’s doing and where you are in ${esc(b.city)} - we’ll take it from there.`;
  // theme.decor was declared per-theme (blob/dotted-grid/hairline-rules/
  // grid-lines/color-blocks/diagonal-accents/underline-marker/soft-glow/
  // oversized-index/none) but never actually rendered anywhere - every
  // site's CTA band used the exact same radial-gradient corner glow
  // regardless of theme. Applied here as a background pattern class; see
  // the `.cta-band.decor-*` rules in css.js.
  const decorCls = ` decor-${esc(ctx.design.theme.decor || 'none')}`;

  if (variant === 'split') {
    // Asymmetric: copy + buttons on the left, a stat panel on the right -
    // the same trust numbers the hero uses, giving the band real content
    // instead of just a centered headline.
    const stats = [
      [`${serviceCount(ctx)}`, 'Services offered'],
      ctx.content.areas && ctx.content.areas.length ? [`${ctx.content.areas.length}`, 'Areas covered'] : null,
      ['Diagnosis', 'first, then the fix'],
    ].filter(Boolean).slice(0, 3);
    return `<section class="section cta-band cta-band--split${decorCls}">
      <div class="container cta-split">
        <div class="cta-split__copy">
          <h2>${heading}</h2>
          <p>${lead}</p>
          ${dualCta(ctx, { className: 'cta-band__btns', lg: true })}
        </div>
        <div class="cta-split__panel">
          ${stats.map(([n, l]) => `<div class="cta-split__stat"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}
        </div>
      </div>
    </section>`;
  }

  if (variant === 'bar') {
    // Slim single row: short heading left, buttons right - a much more
    // compact rhythm than the tall centered/split bands.
    return `<section class="section cta-band cta-band--bar${decorCls}">
      <div class="container cta-bar">
        <h2>${heading}</h2>
        ${dualCta(ctx, { className: 'cta-band__btns cta-bar__btns' })}
      </div>
    </section>`;
  }

  const GENERIC_CTA_KEYS = ['boxed', 'diagonal', 'stacked-icon', 'minimal-line', 'framed-outline', 'shadow-stack', 'quiet-editorial', 'glass-panel', 'split-duotone', 'outline-only', 'oversized-badge', 'ribbon-corner', 'color-block', 'wide-spaced', 'ledger-style', 'ribbon-diagonal', 'ghost-frame'];
  if (GENERIC_CTA_KEYS.includes(variant)) {
    // GENERIC SKIN - same centered heading/lead/buttons every cta() variant
    // shares; visual variety comes entirely from CSS (.cta-band--* rules).
    return `<section class="section cta-band cta-band--generic cta-band--${esc(variant)}${decorCls}">
      <div class="container">
        <h2>${heading}</h2>
        <p>${lead}</p>
        ${dualCta(ctx, { className: 'cta-band__btns', lg: true })}
      </div>
    </section>`;
  }

  // 'centered' (default)
  return `<section class="section cta-band cta-band--centered${decorCls}">
    <div class="container">
      <h2>${heading}</h2>
      <p>${lead}</p>
      ${dualCta(ctx, { className: 'cta-band__btns', lg: true })}
    </div>
  </section>`;
}

/** Mid-page CTA nudge - short line + one button, still lighter than the
 *  full closing cta() band but with real visual weight now (was a single
 *  thin bordered strip with no variants - see 2026-08-20 redesign). 8
 *  genuinely different treatments, picked per-site like every other axis
 *  and cooldown-enforced the same way. Never a form/input - see
 *  quoteEmbed(), the only page with a real form. */
export function ctaBanner(ctx, opts = {}) {
  const b = ctx.business;
  const c = primaryCta(ctx);
  const call = callCta(ctx);
  const loc = `${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''}`;
  // The phone number used to be baked into this sentence as PLAIN TEXT
  // ("call (214) 555-0100 or request a quote online") - unclickable, and on a
  // phone the one number a visitor most wants to tap was the only thing here
  // they couldn't. The copy now just sets context; both actions are real
  // buttons below (user request, 2026-08-25).
  const text = opts.text || `Serving ${loc} - tell us what your door’s doing and we’ll take it from there.`;
  const variant = (ctx.design.variants.sectionVariants || {}).ctaBanner || 'bold-strip';
  const style = ctx.design.variants.ctaStyle;
  // BOTH actions, on every variant: request-a-quote plus a tel: call button
  // whenever the operator has set a real number. When there is no phone (the
  // engine never invents one) the second slot falls back to Our Services, the
  // same rule dualCta() uses everywhere else - the group is never one lone
  // button, and never a dead "call" with nothing behind it.
  // Wrapped as one group so the flex row treats the pair as a single unit -
  // two loose children in a justify-content:space-between row would be pushed
  // to opposite ends of the banner. The cta-<style> skin still applies: it
  // sits on .cta-banner__inner, an ancestor of this group.
  const btnHtml = `<div class="cta-banner__actions">${
    btn(c.href, c.label, 'primary', 'btn--lg')
  }${
    call ? btn(call.href, call.label, 'emergency', 'btn--lg') : btn(ctx.urls.services, 'Our Services', 'ghost', 'btn--lg')
  }</div>`;

  if (variant === 'icon-badge') {
    return `<section class="cta-banner cta-banner--icon-badge"><div class="container">
      <div class="cta-banner__inner cta-${esc(style)}">
        <span class="cta-banner__badge" aria-hidden="true">${icon('chat', { size: 24 })}</span>
        <p class="cta-banner__text">${text}</p>
        ${btnHtml}
      </div>
    </div></section>`;
  }
  if (variant === 'split-stat') {
    // Real data only - reuse whichever count the site actually has, same
    // pattern as the closing cta() band's own 'split' stat panel.
    const stat = (ctx.content.areas && ctx.content.areas.length)
      ? [`${ctx.content.areas.length}`, 'areas covered']
      : [`${serviceCount(ctx)}`, 'services offered'];
    return `<section class="cta-banner cta-banner--split-stat"><div class="container">
      <div class="cta-banner__inner cta-${esc(style)}">
        <div class="cta-banner__copy"><p class="cta-banner__text">${text}</p>${btnHtml}</div>
        <div class="cta-banner__stat"><b>${esc(stat[0])}</b><span>${esc(stat[1])}</span></div>
      </div>
    </div></section>`;
  }
  if (variant === 'outline-bold') {
    return `<section class="cta-banner cta-banner--outline-bold"><div class="container">
      <div class="cta-banner__inner cta-${esc(style)}">
        <div class="cta-banner__copy"><span class="cta-banner__eyebrow">Next step</span><p class="cta-banner__text">${text}</p></div>
        ${btnHtml}
      </div>
    </div></section>`;
  }
  // Shared markup for the rest (bold-strip / filled-brand / tinted-panel /
  // corner-accent / centered-stack) - visual variety is entirely CSS, same
  // "generic skin" pattern as every other axis this engine now uses.
  return `<section class="cta-banner cta-banner--${esc(variant)}"><div class="container">
    <div class="cta-banner__inner cta-${esc(style)}">
      <p class="cta-banner__text">${text}</p>
      ${btnHtml}
    </div>
  </div></section>`;
}

// ---- GoHighLevel quote embed --------------------------------------------

export function quoteEmbed(ctx) {
  const url = ctx.site.ghlFormUrl;
  const h = Number(ctx.site.ghlFormHeight) || 720;
  if (url) {
    // The embed is a third-party widget and is slow to appear - until it
    // paints, the page showed a tall empty box with no sign anything was
    // coming. A skeleton stands in for it (user request 2026-08-30: "as its
    // take time while loading so show skeleton while loading").
    //
    // DEGRADES SAFELY WITHOUT JS. The loading state is ADDED by script rather
    // than being the default: with JS off, `is-loading` is never applied, so
    // the skeleton stays hidden and the iframe is visible exactly as before.
    // Doing it the other way round - default to loading, remove on load -
    // would leave a permanent skeleton over a working form for anyone whose
    // script did not run.
    //
    // NO loading="lazy" ON THIS IFRAME. It is the reason the page exists, so
    // there is nothing to defer - and lazy here DEADLOCKS IN SAFARI.
    // form_embed.js parks the frame at
    // position:absolute;opacity:0;visibility:hidden;left:-9999px the moment it
    // runs, and only un-parks it once the form inside reports it initialised.
    // WebKit's lazy-load is a plain intersection test, so a frame parked at
    // -9999px never intersects the viewport and is never fetched: it cannot
    // initialise, so it is never un-parked - and our own 20s give-up below
    // then strips the skeleton, leaving an empty box the height of the form.
    // Chromium hides this because it refuses to defer frames it considers
    // hidden and loads them immediately (verified in the browser pane: the
    // parked frame is fetched anyway). Reported on Safari, 2026-09-06.
    // AUTO-HEIGHT, not a fixed frame. A fixed height meant any form taller
    // than it scrolled INSIDE the iframe - a nested scrollbar in the middle of
    // the page, reported 2026-08-30. LeadConnector's own form_embed.js listens
    // for the height the form posts back and resizes the iframe to fit, so the
    // page scrolls as one document and the form is never boxed.
    //
    // That script needs the data-* attributes below (id/data-form-id/
    // data-layout) to recognise the frame; without them it silently does
    // nothing. It is the one external script the engine loads, and only on
    // this page - unavoidable, since the form itself is already third-party
    // and only its own script knows the rendered height.
    //
    // `height` is left OFF the inline style on purpose - min-height carries
    // the initial size so the skeleton has something to cover, and the script
    // is then free to set an exact height. An inline `height` would fight it.
    const formId = String(url).split('/').filter(Boolean).pop();
    return `<div class="ghl-embed" style="--ghl-h:${h}px">
      <div class="ghl-embed__skeleton" aria-hidden="true">
        <span class="ghl-sk ghl-sk--title"></span>
        ${'<span class="ghl-sk ghl-sk--label"></span><span class="ghl-sk ghl-sk--field"></span>'.repeat(6)}
        <span class="ghl-sk ghl-sk--label"></span><span class="ghl-sk ghl-sk--area"></span>
        <span class="ghl-sk ghl-sk--btn"></span>
      </div>
      <iframe src="${esc(url)}" title="Request a quote"
        id="inline-${esc(formId)}" data-form-id="${esc(formId)}" data-layout='{"id":"INLINE"}'
        data-trigger-type="alwaysShow" data-activation-type="alwaysActivated" data-deactivation-type="neverDeactivate"
        style="width:100%;min-height:${h}px;border:0;border-radius:var(--radius-lg);background:transparent;display:block"></iframe>
    </div>
    <script src="https://link.msgsndr.com/js/form_embed.js" async></script>
    <script>(function(){
      var e=document.currentScript.parentNode.querySelector('.ghl-embed');if(!e)return;
      var f=e.querySelector('iframe');if(!f)return;
      e.classList.add('is-loading');
      var obs,iv,to;
      var done=function(){e.classList.remove('is-loading');if(obs)obs.disconnect();clearInterval(iv);clearTimeout(to)};
      // NOT the iframe's load event. form_embed.js keeps the frame at
      // position:absolute;visibility:hidden until the form has rendered, and
      // load fires long before that - so hiding the skeleton on load produced
      // a flash of skeleton followed by an EMPTY collapsed box. Wait for the
      // frame to actually be in flow and visible.
      // Two conditions, BOTH required. Checking visibility alone fails at
      // t=0: this script runs before form_embed.js has hidden the frame, so
      // the iframe still looks visible and the skeleton was torn down
      // instantly - the blink. Checking load alone fails too, because load
      // fires while the frame is still hidden. So: loaded AND revealed.
      var loaded=false;
      var visible=function(){var cs=getComputedStyle(f);
        return cs.visibility!=='hidden'&&cs.position!=='absolute'&&f.getBoundingClientRect().height>40};
      var check=function(){if(loaded&&visible())done()};
      f.addEventListener('load',function(){loaded=true;check()});
      obs=new MutationObserver(check);
      obs.observe(f,{attributes:true,attributeFilter:['style','class']});
      iv=setInterval(check,200);
      // LAST RESORT: if we are giving up because form_embed.js never un-parked
      // the frame, un-park it ourselves. Plain done() only removes the
      // skeleton, which left a blank box where the form should be - the exact
      // thing the visitor reports as "the form is not loading".
      var giveup=function(){if(!visible()){f.style.opacity='';f.style.visibility='';
        f.style.pointerEvents='';f.style.left='';f.style.position='relative'}done()};
      to=setTimeout(giveup,20000);
    })();</script>`;
  }
  // No per-business form backend connected yet - a real quote form (real
  // fields, not a placeholder note) that hands off to the business's own
  // real email or phone on submit, so nothing is silently lost.
  const b = ctx.business;
  const svcList = (ctx.content.services.length ? ctx.content.services : b.services.map((s) => ({ id: s.id, service: s })));
  const serviceOptions = svcList.slice(0, 12).map((s) => `<option>${esc((s.service || {}).label || s.id)}</option>`).join('');
  const target = b.email ? `mailto:${b.email}` : (b.phone ? `tel:${b.phone.replace(/[^0-9+]/g, '')}` : '');
  return `<form class="form quote-form" id="quote-form" data-target="${esc(target)}" data-mode="${b.email ? 'mail' : 'tel'}" novalidate>
    <div class="field"><label for="qf-name">Full name</label><input type="text" id="qf-name" name="name" required autocomplete="name"></div>
    <div class="field"><label for="qf-phone">Phone</label><input type="tel" id="qf-phone" name="phone" required autocomplete="tel"></div>
    ${serviceOptions ? `<div class="field"><label for="qf-service">What do you need?</label><select id="qf-service" name="service"><option value="">Select a service</option>${serviceOptions}<option>Not sure / other</option></select></div>` : ''}
    <div class="field"><label for="qf-message">Tell us what’s going on</label><textarea id="qf-message" name="message" rows="4" required placeholder="Door won’t open, spring snapped, opener acting up..."></textarea></div>
    <button type="submit" class="btn btn--primary btn--lg">Send request</button>
  </form>`;
}

export const QUOTE_FORM_SCRIPT = `<script>(function(){var f=document.getElementById('quote-form');if(!f)return;f.addEventListener('submit',function(e){e.preventDefault();var t=f.dataset.target;if(!t)return;var name=(f.name&&f.name.value||'').trim();var phone=(f.phone&&f.phone.value||'').trim();var service=f.service?f.service.value:'';var message=(f.message&&f.message.value||'').trim();if(f.dataset.mode==='mail'){var lines=['Name: '+name,'Phone: '+phone];if(service)lines.push('Service: '+service);lines.push('',message);var subject=encodeURIComponent('Quote request from '+name);var body=encodeURIComponent(lines.join('\\n'));window.location.href=t+'?subject='+subject+'&body='+body}else{window.location.href=t}})})();</script>`;

// ---- products / door styles ---------------------------------------------

function doorStyleKeys(ctx) {
  return (ctx.site.doorStyles && ctx.site.doorStyles.length) ? ctx.site.doorStyles : DOOR_STYLE_KEYS;
}

export function productGrid(ctx) {
  const keys = doorStyleKeys(ctx);
  const cards = keys.map((key) => {
    const i = Math.max(0, DOOR_STYLE_KEYS.indexOf(key));
    const img = image(ctx, `gallery-${i}`, `${DOOR_STYLE_LABELS[key] || key} garage door`);
    return `<article class="product-card" data-style="${esc(key)}">
      <div class="product-card__media">${imageHtml(img)}</div>
      <div class="product-card__body"><h3>${esc(DOOR_STYLE_LABELS[key] || key)}</h3>
        <a class="svc__more" href="${esc(ctx.urls.quote)}">Request a quote ${icon('arrow', { size: 15 })}</a></div>
    </article>`;
  }).join('');
  return `<div class="product-grid">${cards}</div>`;
}

/** Client-side pill filter for the product grid above (real DOM filtering,
 *  not a fabricated data axis - just show/hide over the same real cards). */
export function styleFilter(ctx) {
  const keys = doorStyleKeys(ctx);
  if (keys.length < 2) return '';
  const pills = [`<button type="button" class="style-filter__pill is-active" data-filter="all">All styles</button>`]
    .concat(keys.map((k) => `<button type="button" class="style-filter__pill" data-filter="${esc(k)}">${esc(DOOR_STYLE_LABELS[k] || k)}</button>`))
    .join('');
  return `<div class="style-filter" role="group" aria-label="Filter by door style">${pills}</div>`;
}

export const STYLE_FILTER_SCRIPT = `<script>(function(){var w=document.querySelector('.style-filter'),g=document.querySelector('.product-grid');if(!w||!g)return;w.addEventListener('click',function(e){var b=e.target.closest('.style-filter__pill');if(!b)return;Array.prototype.forEach.call(w.querySelectorAll('.style-filter__pill'),function(p){p.classList.toggle('is-active',p===b)});var f=b.dataset.filter;Array.prototype.forEach.call(g.querySelectorAll('.product-card'),function(c){c.hidden=f!=='all'&&c.dataset.style!==f})})})();</script>`;

/** Real, generic (category-level, not per-business) door-style / materials
 *  reference - see config/door-styles.js for the no-fabrication rationale. */
export function styleComparison(ctx) {
  const keys = doorStyleKeys(ctx);
  const rows = keys.map((key) => {
    const info = DOOR_STYLE_INFO[key];
    if (!info) return '';
    return `<div class="style-compare__row">
      <h3>${esc(DOOR_STYLE_LABELS[key] || key)}</h3>
      <p class="style-compare__material">${esc(info.material)}</p>
      <p>${esc(info.detail)}</p>
    </div>`;
  }).join('');
  if (!rows) return '';
  return section(ctx, {
    id: 'style-comparison', tone: 'alt', eyebrow: 'Materials & styles', title: 'Comparing door styles',
    lead: 'General characteristics of each style - your exact options depend on the manufacturer and product line.',
    body: `<div class="style-compare">${rows}</div>`,
  });
}

/** Real, generic insulation/options primer (see config/door-styles.js). */
export function insulationPrimer(ctx) {
  return section(ctx, {
    id: 'insulation', tone: 'default', eyebrow: 'Options', title: INSULATION_PRIMER.h2,
    body: `<div class="prose prose--boxed prose--boxed-icon">
      <span class="prose__ic" aria-hidden="true">${icon('shield', { size: 22 })}</span>
      ${paras(INSULATION_PRIMER.body)}
    </div>`,
  });
}

// ---- contact + quote form ------------------------------------------------

/** An embedded map of the business location (key-free, no API key required).
 *
 * Order matters here. `b.lat`/`b.lng` are NOT the business's coordinates -
 * indexCityRecords() reads them off the CITY sheet alongside population/tier/
 * demand, so they are the city centroid. Using them put every marker on the
 * downtown of the metro instead of on the business: Denver's map pinned
 * 39.739,-104.985 (downtown) while its real address is 720 S Colorado Blvd,
 * about 4km away. The contact page prints the real street address as text
 * directly beside the map, so the two disagreed on screen.
 * A real street address, where the sheet has one, is therefore preferred over
 * the centroid - and zoomed to street level rather than the whole metro.
 * Falls back to the centroid and then to a plain city query, so a business
 * with no address on the sheet still gets a sensible map and NO address is
 * ever invented for one (see config/generation.config.js -> neverFabricate). */
export function contactMap(ctx) {
  const b = ctx.business;
  const cityLabel = `${b.city}${b.state ? ', ' + b.state : ''}`;
  if (b.address) {
    const q = encodeURIComponent(b.address);
    const src = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
    const link = `https://www.google.com/maps/search/?api=1&query=${q}`;
    return `<div class="map-embed"><iframe title="${esc(`Map of ${b.address}`)}" src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a class="map-embed__link" href="${esc(link)}" target="_blank" rel="noopener">View larger map</a></div>`;
  }
  const label = `Map of ${cityLabel}`;
  if (b.lat != null && b.lng != null) {
    const d = 0.09;
    const bbox = `${(b.lng - d).toFixed(4)},${(b.lat - d * 0.6).toFixed(4)},${(b.lng + d).toFixed(4)},${(b.lat + d * 0.6).toFixed(4)}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${b.lat},${b.lng}`;
    const link = `https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lng}#map=12/${b.lat}/${b.lng}`;
    return `<div class="map-embed"><iframe title="${esc(label)}" src="${esc(src)}" loading="lazy"></iframe><a class="map-embed__link" href="${esc(link)}" target="_blank" rel="noopener">View larger map</a></div>`;
  }
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(cityLabel)}&z=11&output=embed`;
  return `<div class="map-embed"><iframe title="${esc(label)}" src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
}

export function contact(ctx) {
  const b = ctx.business;
  const call = callCta(ctx);
  const q = quoteCta(ctx);
  const info = `<div>
      <h1>Contact ${esc(b.name)}</h1>
      <p class="lead">Serving ${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''} and the surrounding area.</p>
      <ul class="contact-list">
        <li>${icon('pin', { size: 18 })} <span>${b.address ? esc(b.address) : `${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''} &amp; nearby communities`}</span></li>
        ${b.phone ? `<li>${icon('phone', { size: 18 })} <a href="${esc(call.href)}">${esc(b.phone)}</a></li>` : ''}
        ${b.hours ? `<li>${icon('clock', { size: 18 })} <span>${esc(b.hours)}</span></li>` : ''}
        ${b.email ? `<li>${icon('chat', { size: 18 })} <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>` : ''}
      </ul>
      <p class="lead">Ready to get started? <a href="${esc(q.href)}">Request a quote</a> and tell us what your door’s doing - the more detail, the faster we can help.</p>
      ${dualCta(ctx, { className: 'contact-cta' })}
    </div>`;
  return `<section class="section" id="contact"><div class="container"><div class="contact-grid">${info}${contactMap(ctx)}</div></div></section>`;
}

// ---- footer --------------------------------------------------------------

/**
 * ONE footer layout for every site (user instruction 2026-10-07, from the
 * Temecula reference screenshot): "make the all footer same like this, color
 * will be sitewise varied, but design and content needs to same". The
 * per-business `footer` variant is no longer rendered - its fingerprint value
 * is still rolled and recorded, it just has no visual effect. Colour comes
 * from the site's own --c-secondary/--c-accent (see .sfoot in css.js).
 *
 *   brand (logo, one-line description, street / city line, phone)
 *   | SERVICES (5 + All Services) | COMPANY | SERVICE AREAS (up to 6)
 *   ── trust badges row ──
 *   © year Name. All rights reserved. · Privacy · Terms · Accessibility   |   address · phone
 *
 * Badges stay under the no-fabrication rule: each claim renders only when the
 * operator has set its flag (site-content.js insured/license, sameDay,
 * upfrontPricing; real reviews for the last one). Missing slots are filled
 * with the same real, data-derived facts the trustbar uses.
 */
export function footer(ctx) {
  const { business, urls, content, has, site } = ctx;
  const year = ctx.year;
  const cityState = `${business.city}${business.state ? ', ' + business.state : ''}`;
  const tel = business.phone ? business.phone.replace(/[^0-9+]/g, '') : '';

  const services = (content.services.length ? content.services : business.services.map((s) => ({ id: s.id, service: s })))
    .map((e) => ({ href: svcHref(e, urls), label: (e.service || {}).label || e.id, id: e.id || '' }));
  const serviceLinks = services.slice().sort((a, b) => a.label.localeCompare(b.label)).slice(0, 5)
    .map((s) => `<li><a href="${esc(s.href)}">${esc(s.label)}</a></li>`).join('')
    + `<li><a href="${esc(urls.services)}">All Services</a></li>`;
  const areaLinks = content.areas.slice(0, 6).map((a) => `<li><a href="${esc(areaHref(a, urls))}">${esc(a.name)}</a></li>`).join('');
  const companyLinks = [
    has.about ? `<li><a href="${esc(urls.about)}">About Us</a></li>` : '',
    `<li><a href="${esc(urls.contact)}">Contact</a></li>`,
    has.areas ? `<li><a href="${esc(urls.areas)}">Service Areas</a></li>` : '',
    has.guides ? `<li><a href="${esc(urls.resources)}">Blog</a></li>` : '',
    `<li><a href="${esc(urls.quote)}">Request a Quote</a></li>`,
    has.faq ? `<li><a href="${esc(urls.faq)}">FAQ</a></li>` : '',
  ].join('');

  // Description names only the work this site actually publishes pages for.
  const offers = (re) => services.some((s) => re.test(s.id) || re.test(s.label));
  const extras = [offers(/spring/i) && 'spring', offers(/opener/i) && 'opener'].filter(Boolean);
  const desc = `Garage door repair${extras.length ? `, ${extras.join(' and ')} service` : ''}${offers(/install/i) ? ', and new-door installation' : ''} across ${esc(business.city)} and the surrounding metro.`;

  // "1 Ridgegate Dr, Temecula, CA 92590" -> street / "Temecula, CA 92590"
  const addr = business.address || '';
  const cut = addr.indexOf(',');
  const street = cut > 0 ? addr.slice(0, cut).trim() : '';
  const locality = cut > 0 ? addr.slice(cut + 1).trim() : cityState;

  const logo = logoImage(ctx);
  const brand = logo
    ? `<a class="sfoot__logo" href="${esc(urls.home)}" aria-label="${esc(business.name)} home">${brandMark(ctx, 'secondary')}</a>`
    : `<a class="brand sfoot__logo" href="${esc(urls.home)}" style="color:inherit">${brandMark(ctx, 'secondary')}<span>${esc(business.name)}</span></a>`;

  const badge = (ico, text) => `<li>${icon(ico, { size: 16 })}<span>${text}</span></li>`;
  const badges = [];
  if (site.insured || site.license) badges.push(badge('shield', 'Licensed &amp; fully insured'));
  if (site.sameDay) badges.push(badge('clock', 'Same-day service available'));
  if (site.upfrontPricing) badges.push(badge('tag', 'Upfront, written pricing'));
  if (business.reviews.length) badges.push(badge('star', 'Local crew, real reviews'));
  if (badges.length < 4) badges.push(badge('pin', `Based in ${esc(cityState)}`));
  if (badges.length < 4 && serviceCount(ctx)) badges.push(badge('wrench', `${serviceCount(ctx)} garage door services`));
  if (badges.length < 4 && areaCount(ctx)) badges.push(badge('users', `${areaCount(ctx)} nearby communities served`));
  if (badges.length < 4) badges.push(badge('search', 'Diagnosis first, then the fix'));

  const legal = [
    has.privacy ? `<a href="${esc(urls.privacy)}">Privacy</a>` : '',
    has.terms ? `<a href="${esc(urls.terms)}">Terms</a>` : '',
    has.accessibility ? `<a href="${esc(urls.accessibility)}">Accessibility</a>` : '',
  ].filter(Boolean).join(' · ');
  const contactLine = [addr ? esc(addr) : esc(cityState), tel ? `<a href="tel:${esc(tel)}">${esc(business.phone)}</a>` : ''].filter(Boolean).join(' · ');

  return `<footer class="site-footer sfoot">
    <div class="container">
      <div class="sfoot__grid">
        <div class="sfoot__brand">
          ${brand}
          <p class="sfoot__desc">${desc}</p>
          <address class="sfoot__addr">${street ? `${esc(street)}<br>` : ''}${esc(locality)}</address>
          ${tel ? `<a class="sfoot__phone" href="tel:${esc(tel)}">${esc(business.phone)}</a>` : ''}
        </div>
        ${services.length ? `<nav class="sfoot__col" aria-label="Services"><h4>Services</h4><ul>${serviceLinks}</ul></nav>` : ''}
        <nav class="sfoot__col" aria-label="Company"><h4>Company</h4><ul>${companyLinks}</ul></nav>
        ${has.areas ? `<nav class="sfoot__col" aria-label="Service areas"><h4>Service Areas</h4><ul>${areaLinks}</ul></nav>` : ''}
      </div>
      <ul class="sfoot__badges" aria-label="Why choose us">${badges.slice(0, 4).join('')}</ul>
      <div class="sfoot__bar">
        <p>© ${year} ${esc(business.name)}. All rights reserved.${legal ? ` · <span class="sfoot__legal">${legal}</span>` : ''}</p>
        <p class="sfoot__contact">${contactLine}</p>
      </div>
    </div>
  </footer>`;
}

// ---- breadcrumbs + mobile sticky CTA -------------------------------------

export function breadcrumbs(ctx, crumbs) {
  if (!ctx.features.breadcrumbs || !crumbs || crumbs.length < 2) return '';
  const items = crumbs.map((c, i) => i < crumbs.length - 1
    ? `<a href="${esc(c.href)}">${esc(c.label)}</a> <span aria-hidden="true">›</span> `
    : `<span aria-current="page">${esc(c.label)}</span>`).join('');
  return `<nav class="container crumbs" aria-label="Breadcrumb">${items}</nav>`;
}

/** Sticky bottom bar (tablet + mobile) - deliberately does NOT inherit the
 * page's cta-<ctaStyle> skin class. Several of those ~20 skins are outline/
 * transparent by design (fine for an in-content button surrounded by page
 * background, unreadable on a persistent translucent overlay bar whose
 * whole job is an unmissable tap target). Always solid, regardless of skin. */
export function mobileCta(ctx) {
  if (!ctx.features.stickyMobileCta) return '';
  const q = quoteCta(ctx);
  const call = callCta(ctx);
  return `<div class="mobile-cta" aria-label="Quick contact">
    <a href="${esc(q.href)}" class="btn btn--primary">${icon('calendar', { size: 18 })}<span>${esc(q.label)}</span></a>
    ${call ? `<a href="${esc(call.href)}" class="btn btn--emergency">${icon('phone', { size: 18 })}<span>Call</span></a>` : `<a href="${esc(ctx.urls.services)}" class="btn btn--ghost">${icon('wrench', { size: 18 })}<span>Services</span></a>`}
  </div>`;
}

// ---- generic section wrapper ---------------------------------------------

export function section(ctx, { id, tone, eyebrow, title, lead, body, h1 = false }) {
  const toneClass = tone === 'alt' ? ' section--alt' : tone === 'tint' ? ' section--tint' : tone === 'dark' ? ' section--dark' : '';
  const HT = h1 ? 'h1' : 'h2';
  return `<section class="section${toneClass}"${id ? ` id="${esc(id)}"` : ''}>
    <div class="container">
      ${(eyebrow || title || lead) ? `<div class="section-head">
        ${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}
        ${title ? `<${HT} class="section-title">${esc(title)}</${HT}>` : ''}
        ${lead ? `<p class="lead">${lead}</p>` : ''}
      </div>` : ''}
      ${body}
    </div>
  </section>`;
}

/** Render a content page's sections generically (for service/area/topic pages).
 * `variant` picks a real structural layout (see SECTION_POOLS.contentProse
 * in variation.js) - "stacked" is the plain original, the rest are genuine
 * layout differences, not just a color/skin swap. */
// Explicit user complaint, 2026-08-24: real authored content sections
// (Service Areas hub, Contact, FAQ, Quote pages) rendered 2-3 sections in a
// row with the SAME single picked treatment applied to every one of them -
// "The Towns We Get To" / "What Gets Built Around Here" / "The Jobs That
// Come Up Most" all showing as three identical stacked walls of paragraph
// text, regardless of which of the 5 contentProse variants was picked (even
// "boxed-cards"/"magazine-columns" still repeat the SAME box/column three
// times - a real structural container difference from OTHER businesses'
// picks, but no difference SECTION TO SECTION on any one business's own
// page, which is what actually reads as "plain text, one after another").
// Fixed by rotating through a fixed sequence of genuinely different
// per-section templates (photo+text, bordered icon card, lede emphasis,
// plus a per-business "flavor" slot) instead of applying one pick
// uniformly - no two adjacent sections on the same page ever match, and at
// least one of every 3 consecutive sections carries a real photo (never a
// placeholder - see `image()`'s existing local-photo-library precedence).
// The business's own contentProse pick still matters twice: it sets the
// ROTATION'S STARTING OFFSET (so which template opens the page differs by
// business) and it picks the specific "flavor" sub-template (position 2).
const CONTENT_TEMPLATES = ['media-left', 'boxed-icon', 'flavor', 'media-right', 'lede'];
const CONTENT_START_OFFSET = { stacked: 0, 'boxed-cards': 1, 'numbered-index': 2, 'magazine-columns': 3, 'side-label': 4 };

// Template choice by POSITION rather than by rotating the whole 5-slot cycle.
// The rotation only guaranteed "one photo in every 3 sections", and with the
// 3-4 sections these pages actually carry, most offsets landed exactly ONE
// photo on the page - so Contact and Service Areas still read as a stack of
// text blocks (user-reported, 2026-08-25: "too much plain text section, use
// image"). Every EVEN section is now a real photo+text split, alternating
// which side the photo sits on; the odd ones cycle the non-media treatments.
// Per-business variety is preserved: the contentProse pick still chooses
// WHICH non-media treatment and which flavor sub-template.
const NON_MEDIA_TEMPLATES = ['boxed-icon', 'lede', 'flavor'];
function contentTemplateFor(i, variant) {
  if (i % 2 === 0) return i % 4 === 0 ? 'media-left' : 'media-right';
  const off = CONTENT_START_OFFSET[variant] ?? 0;
  return NON_MEDIA_TEMPLATES[(off + ((i - 1) / 2)) % NON_MEDIA_TEMPLATES.length];
}

/**
 * A "how to reach us" section gets a real STEPPER instead of paragraphs
 * (user request, 2026-08-25). The steps are NOT derived from the authored
 * copy - these bodies are 1-4 paragraphs of prose with no list structure, so
 * numbering the paragraphs would invent an order the writing does not have.
 * They are the site's OWN real contact routes instead: the operator's actual
 * phone number (only when one is set - never invented), the real
 * /request-a-quote/ page, and the diagnosis-first visit the process section
 * already describes. The authored prose is kept and shown alongside, not
 * replaced - it is real, city-specific writing.
 */
const REACH_H2 = /\b(reach|contact|get(ting)?\s+(hold|in\s+touch)|call\s+us|book|touch)\b/i;

/** Does this page's authored copy already carry a "how to reach us" section?
 *  Used by buildContact() to decide whether the stepper needs its own section
 *  or is already folded into the prose (see reachSection below). */
export function hasReachSection(page) {
  return (page && page.sections || []).some((s) => REACH_H2.test(h2Label(s.h2)));
}

/** The reach stepper as a STANDALONE section, for a Contact page whose export
 *  didn't happen to write a "how to reach" heading (Chicago's, for one). Every
 *  contact page then explains how to get in touch as real steps, not only as a
 *  block of prose. */
/** Which marker each stepper layout shows: 'n' = the step number, 'ic' = the
 *  step's icon. EXACTLY ONE, never both - explicit user instruction
 *  2026-08-25: "use number or icon, dont use both this for all sites, all
 *  variant of this sections". An earlier instruction had asked for the pair,
 *  and the component was written to force both on every variant; that is
 *  reversed here. If a new reachSteps key is added it MUST be listed below,
 *  or it silently falls back to the number.
 *  The split is 4/4 and follows each layout's own logic: sequence-flavoured
 *  layouts (a rail, a numbered grid, a track, dense ordered rows) carry the
 *  number; the framed/badge layouts carry the icon. */
const REACH_MARKER = {
  'timeline-rail': 'n',
  'numbered-grid': 'n',
  'horizontal-track': 'n',
  'compact-rows': 'n',
  'split-list': 'ic',
  'stacked-panels': 'ic',
  'boxed-outline': 'ic',
  'circle-badge': 'ic',
};

/** The step list itself. Shared by both call sites (the standalone section
 *  below and the 'reach-steps' content template) so a site's stepper is the
 *  same design wherever it appears. */
function reachStepsList(ctx) {
  const marker = REACH_MARKER[reachVariant(ctx)] || 'n';
  return `<ol class="reach-steps reach-steps--${marker}">${reachSteps(ctx).map(([ic, t, d], n) => `<li class="reach-step">
    ${marker === 'n'
      ? `<span class="reach-step__n">${n + 1}</span>`
      : `<span class="reach-step__ic" aria-hidden="true">${icon(ic, { size: 18 })}</span>`}
    <div class="reach-step__c"><h3>${esc(t)}</h3><p>${d}</p></div>
  </li>`).join('')}</ol>`;
}

/** Per-site layout key for the stepper - see SECTION_POOLS.reachSteps. */
function reachVariant(ctx) {
  return (ctx.design.variants.sectionVariants || {}).reachSteps || 'split-list';
}

export function reachSection(ctx) {
  const v = reachVariant(ctx);
  return `<section class="section section--tint" id="how-to-reach"><div class="container"><div class="reach-layout reach-layout--${esc(v)}">
    <div class="reach-copy">
      <span class="eyebrow">Getting started</span>
      <h2 class="section-title">How to reach us</h2>
      <p>Tell us what the door is doing and roughly where you are - that is enough to know whether it is a same-visit fix or something that needs a part ordered first.</p>
    </div>
    ${reachStepsList(ctx)}
  </div></div></section>`;
}
function reachSteps(ctx) {
  const b = ctx.business;
  const call = callCta(ctx);
  const out = [];
  if (call) {
    out.push(['phone', 'Call and tell us what it’s doing',
      `${esc(b.phone)} - describe the symptom and roughly where you are.`]);
  }
  out.push(['chat', 'Or send it in writing',
    `Use the <a href="${esc(ctx.urls.quote)}">request form</a> if it’s easier than talking.`]);
  out.push(['search', 'We diagnose on site',
    'A technician tests the door under power and by hand before anything is quoted or replaced.']);
  out.push(['check', 'You approve the plan',
    'You hear what failed and what it takes to fix it - the work starts only after that.']);
  return out;
}

function contentFlavorBlock(variant, s, i) {
  if (variant === 'numbered-index') {
    return `<div class="prose prose--numbered" style="--n:'${String(i + 1).padStart(2, '0')}'"><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>`;
  }
  if (variant === 'magazine-columns') {
    return `<div class="prose prose--magazine"><h2>${esc(h2Label(s.h2))}</h2><div class="prose__columns">${paras(s.body)}</div></div>`;
  }
  if (variant === 'side-label') {
    return `<div class="prose prose--side-label"><h2>${esc(h2Label(s.h2))}</h2><div class="prose__body">${paras(s.body)}</div></div>`;
  }
  // stacked / boxed-cards flavor to a left-accent-bar block - NOT 'lede'
  // (found via the content.plainTextSections QA check itself, 2026-08-24:
  // 'lede' is ALSO its own dedicated rotation slot, so reusing it here as
  // the flavor too meant these two would render with the IDENTICAL class
  // whenever they landed adjacent in the cycle - "same template repeated
  // back-to-back" is exactly the bug this rotation exists to prevent).
  return `<div class="prose prose--accent"><span class="prose__ic" aria-hidden="true">${icon('check', { size: 18 })}</span><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>`;
}

/** Two real content sections presented as ONE combined design - a shared
 * bordered card, split into two halves by a divider, each with its own
 * icon + sub-heading (found real, 2026-08-24: the first version of this had
 * no icon at all - plain h3+paragraphs either side of a divider is still
 * "plain text" even inside a nicer box, exactly the complaint that keeps
 * coming back whenever a treatment has zero non-text visual element).
 * Dallas-only (see contentSections() below) - explicit, scoped user
 * request, not an engine-wide pattern. */
function combinedProsePair(ctx, a, b, id) {
  const half = (s, ic) => `<div class="prose-combo__half">
    <span class="prose-combo__ic" aria-hidden="true">${icon(ic, { size: 20 })}</span>
    <h3>${esc(h2Label(s.h2))}</h3>
    ${paras(s.body)}
  </div>`;
  return `<section class="section" id="${id}"><div class="container">
    <div class="prose-combo">${half(a, 'pin')}<div class="prose-combo__div" aria-hidden="true"></div>${half(b, 'phone')}</div>
  </div></section>`;
}

function renderContentTemplate(ctx, s, i, tpl, id, variant) {
  const tint = i % 2 === 1 ? ' section--tint' : '';
  if (tpl === 'reach-steps') {
    return `<section class="section${tint}" id="${id}"><div class="container"><div class="reach-layout reach-layout--${esc(reachVariant(ctx))}">
      <div class="reach-copy"><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>
      ${reachStepsList(ctx)}
    </div></div></section>`;
  }
  if (tpl === 'media-left' || tpl === 'media-right') {
    const img = image(ctx, `gallery-${i}`, `${esc(ctx.business.city)} garage door`);
    const rev = tpl === 'media-right' ? ' prose-media--rev' : '';
    return `<section class="section${tint}" id="${id}"><div class="container"><div class="prose-media${rev}">
      <figure class="prose-media__fig">${imageHtml(img)}</figure>
      <div class="prose-media__body"><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>
    </div></div></section>`;
  }
  if (tpl === 'boxed-icon') {
    return `<section class="section${tint}" id="${id}"><div class="container"><div class="prose prose--boxed prose--boxed-icon">
      <span class="prose__ic" aria-hidden="true">${icon('pin', { size: 22 })}</span>
      <h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}
    </div></div></section>`;
  }
  if (tpl === 'lede') {
    return `<section class="section${tint}" id="${id}"><div class="container"><div class="prose prose--lede">
      <span class="prose__ic" aria-hidden="true">${icon('target', { size: 22 })}</span>
      <h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}
    </div></div></section>`;
  }
  // 'flavor'
  return `<section class="section${tint}" id="${id}"><div class="container">${contentFlavorBlock(variant, s, i)}</div></section>`;
}

export function contentSections(ctx, page, opts = {}) {
  const items = page.sections || [];
  const variant = (ctx.design.variants.sectionVariants || {}).contentProse || 'stacked';
  // (the per-variant offset now lives inside contentTemplateFor)
  const slug = (s, i) => `prose-${i}-${(fnv1a(h2Label(s.h2)) % 100000).toString(36)}`;

  // The Dallas-only `combineFirstTwo` pair (2026-08-24) is GONE as of
  // 2026-08-25. It merged the first two sections of Contact and Service Areas
  // into one bordered two-half card - a treatment with no photo in it, and on
  // Contact it swallowed Dallas's "How to Reach Us" section, so that site
  // alone got neither the reach stepper nor the alternating photo+text
  // layout the user has now asked for across ALL sites. Since it was itself a
  // text-only design, keeping it would have preserved on Dallas exactly the
  // "too much plain text section" complaint that motivated the replacement.
  // combinedProsePair() and the combineFirstTwo option are no longer used;
  // the call sites in pages.js still pass the flag harmlessly.
  return items.map((s, i) => {
    // A "how to reach us" / "getting hold of us" section always becomes the
    // stepper, wherever it falls in the page order.
    const tpl = REACH_H2.test(h2Label(s.h2)) ? 'reach-steps' : contentTemplateFor(i, variant);
    return renderContentTemplate(ctx, s, i, tpl, slug(s, i), variant);
  }).join('');
}

/** Inner prose blocks (no section wrappers) - for the 2-column content layout.
 * Narrower context than contentSections() (shares a row with the sidebar,
 * roughly 60-70% of the content width) - no room for a real photo+text
 * split here, so the rotation drops the two media slots and cycles the
 * remaining 3 (boxed-icon/flavor/lede) instead. Same underlying fix as
 * contentSections() - no two adjacent sections repeat the same look. */
const CONTENT_BLOCK_TEMPLATES = ['boxed-icon', 'flavor', 'lede'];

export function contentProse(ctx, page) {
  const items = page.sections || [];
  const variant = (ctx.design.variants.sectionVariants || {}).contentProse || 'stacked';
  const offset = CONTENT_START_OFFSET[variant] ?? 0;

  return items.map((s, i) => {
    const tpl = CONTENT_BLOCK_TEMPLATES[(offset + i) % CONTENT_BLOCK_TEMPLATES.length];
    if (tpl === 'boxed-icon') {
      return `<div class="prose-block prose-block--boxed prose-block--boxed-icon">
        <span class="prose-block__ic" aria-hidden="true">${icon('pin', { size: 18 })}</span>
        <h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}
      </div>`;
    }
    if (tpl === 'lede') {
      return `<div class="prose-block prose-block--lede"><span class="prose-block__ic" aria-hidden="true">${icon('target', { size: 16 })}</span><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>`;
    }
    // 'flavor'
    if (variant === 'numbered-index') {
      return `<div class="prose-block prose-block--numbered" style="--n:'${String(i + 1).padStart(2, '0')}'"><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>`;
    }
    if (variant === 'side-label') {
      return `<div class="prose-block prose-block--side-label"><h2>${esc(h2Label(s.h2))}</h2><div class="prose-block__body">${paras(s.body)}</div></div>`;
    }
    // 'magazine-columns' isn't offered here - two nested columns inside the
    // already-narrow content-main column reads as cramped, not magazine-like.
    // stacked/boxed-cards flavor to accent, not lede (see contentFlavorBlock
    // above for why reusing 'lede' here caused an adjacent-repeat bug).
    return `<div class="prose-block prose-block--accent"><span class="prose-block__ic" aria-hidden="true">${icon('check', { size: 16 })}</span><h2>${esc(h2Label(s.h2))}</h2>${paras(s.body)}</div>`;
  }).join('');
}

/** A balanced 2-column hero for index pages (heading + CTA left, image right)
 *  - fills the empty-right space a bare heading leaves. */
export function indexHero(ctx, { eyebrow, h1, sub, slot = 'hero' } = {}) {
  const b = ctx.business;
  const c = primaryCta(ctx);
  const call = callCta(ctx);
  const style = ctx.design.variants.ctaStyle;
  // The site's OWN hero variant, not a hardcoded one. These index/content
  // heroes used to emit hero--split-image-right unconditionally, so every
  // site rendered its assigned hero on the homepage and a DIFFERENT hero on
  // all ~99 inner pages - one section wearing two variants within a single
  // site. Reported 2026-08-25: "same section in the same site dont use 2
  // variant".
  const hv = heroVariant(ctx);
  return `<section class="hero hero--${esc(hv)}"><div class="container"><div class="hero__grid">
    <div class="hero__copy">
      <span class="hero__badge"><span class="dot" aria-hidden="true"></span>${esc(eyebrow || (b.city + (b.state ? ', ' + b.state : '')))}</span>
      <h1>${esc(h1)}</h1>
      ${sub ? `<p class="hero__sub">${esc(sub)}</p>` : ''}
      <div class="hero__cta cta-${esc(style)}"><a class="btn btn--primary btn--solid" href="${esc(c.href)}">${esc(c.label)}</a>${call ? btn(call.href, call.label, 'emergency') : btn(ctx.urls.services, 'Our services', 'ghost')}</div>
    </div>
    ${HERO_TEXT_ONLY.has(hv) ? '' : heroMedia(ctx, slot, h1)}
  </div>${HERO_TEXT_ONLY.has(hv) ? heroBg(ctx, slot, h1) : ''}</div></section>`;
}

/** The full-bleed background photo layer used by the text-only hero variants.
 *  Those three drop the side image and use the photo as the section background
 *  instead (see hero()). Inner-page heroes have to emit the SAME layer or a
 *  site on one of those variants ends up with no hero image anywhere except
 *  its homepage - reported on Longmont 2026-08-27, where all 41 pages rendered
 *  imageless after the hero variant was made consistent site-wide. */
export function heroBg(ctx, slot = 'hero', alt = 'Garage doors') {
  return `<div class="hero__bg">${imageHtml(image(ctx, slot, alt), { lazy: false })}</div>`;
}

/** Just the hero illustration media block (for pages that build their own hero). */
export function heroMedia(ctx, slot = 'hero', alt = 'Garage doors') {
  const img = image(ctx, slot, alt);
  return `<div class="hero__media">${imageHtml(img, { lazy: false })}</div>`;
}

/** The bare image/illustration for a slot (no wrapper) - for cards. */
export function mediaImg(ctx, slot, alt = 'Garage door') {
  return imageHtml(image(ctx, slot, alt), { className: 'media-fill' });
}

/** A two-column hero for content pages: copy + illustration (never empty). */
export function contentHero(ctx, page, slot = 'hero') {
  const b = ctx.business;
  const c = primaryCta(ctx);
  const img = image(ctx, slot, page.h1 || page.title);
  const hv = heroVariant(ctx);   // same reasoning as indexHero() above
  return `<section class="hero hero--${esc(hv)}"><div class="container"><div class="hero__grid">
    <div class="hero__copy">
      <span class="hero__badge"><span class="dot" aria-hidden="true"></span>${esc(b.city)}${b.state ? ', ' + esc(b.state) : ''}</span>
      <h1>${esc(page.h1 || page.title)}</h1>
      ${page.meta ? `<p class="hero__sub">${esc(page.meta)}</p>` : ''}
      <div class="hero__cta cta-${esc(ctx.design.variants.ctaStyle)}">${btn(c.href, c.label, 'primary')}${btn(ctx.urls.services, 'All services', 'ghost')}</div>
    </div>
    ${HERO_TEXT_ONLY.has(hv) ? '' : `<div class="hero__media">${imageHtml(img, { lazy: false })}</div>`}
  </div>${HERO_TEXT_ONLY.has(hv) ? `<div class="hero__bg">${imageHtml(img, { lazy: false })}</div>` : ''}</div></section>`;
}

/** Compact "why choose us" block - fits the narrow content column, filling the
 *  left whitespace next to the sticky sidebar on short pages. */
export function whyCompact(ctx) {
  const feats = [
    ['search', 'Diagnosis first', 'Every visit starts by finding what actually failed - not a pre-written parts list.'],
    ['target', 'The right part for the door', 'Springs and openers matched to your door’s weight and age, so the fix holds up.'],
    ['chat', 'Straight answers', 'You hear when a repair beats a replacement - and when it doesn’t.'],
    ['sparkle', 'Clean, careful work', 'Tension released safely, hardware set true, the door tested before we leave.'],
  ];
  return `<div class="why-compact">
    <h2>Why ${esc(ctx.business.city)} homeowners call us</h2>
    <ul class="wc-list">${feats.map(([ic, t, d]) =>
    `<li><span class="wc-ic">${icon(ic, { size: 20 })}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ul>
  </div>`;
}

/** Sticky sidebar: quote card (button + real phone, never a form) + related
 *  services + related guides + nearby areas. */
export function sidebar(ctx, { excludeServiceId, excludeTopicSlug } = {}) {
  const b = ctx.business;
  const c = primaryCta(ctx);
  const call = callCta(ctx);
  // Capped shorter than the content column can typically run (a topic/guide
  // article can be as little as 2-3 short paragraphs) - a sticky sidebar
  // taller than the main content stretches the shared grid row to match it
  // (CSS grid rows size to their tallest cell regardless of align-items),
  // leaving a large dead gap under the shorter main column before the next
  // page section starts. Fewer, more relevant items keeps the sidebar from
  // routinely dominating that row height instead of trying to out-grow it.
  const svcs = (ctx.content.services || []).filter((s) => s.id !== excludeServiceId).slice(0, 3);
  const guides = (ctx.content.topics || []).filter((t) => t.slug !== excludeTopicSlug).slice(0, 2);
  const ars = (ctx.content.areas || []).slice(0, 2);
  return `<aside class="sidebar">
    <div class="side-card side-card--cta">
      <h3>Get a quote</h3>
      <p>Tell us what your door’s doing in ${esc(b.city)} - we’ll take it from there.</p>
      <a class="btn btn--primary" href="${esc(c.href)}">${esc(c.label)}</a>
      ${call ? `<a class="side-card__phone" href="${esc(call.href)}">${icon('phone', { size: 15 })}${esc(b.phone)}</a>` : ''}
    </div>
    ${svcs.length ? `<div class="side-card"><h4>Services</h4><ul class="side-links">${svcs.map((s) => `<li><a href="${esc(svcHref(s, ctx.urls))}">${icon('arrow', { size: 14 })}${esc((s.service || {}).label || s.id)}</a></li>`).join('')}</ul></div>` : ''}
    ${guides.length ? `<div class="side-card"><h4>Guides</h4><ul class="side-links">${guides.map((t) => `<li><a href="${esc(topicHref(t, ctx.urls))}">${icon('arrow', { size: 14 })}${esc(t.page.h1 || t.name)}</a></li>`).join('')}</ul></div>` : ''}
    ${ars.length ? `<div class="side-card side-card--areas"><h4>Nearby areas</h4><ul class="side-areas">${ars.map((a) => `<li><a href="${esc(areaHref(a, ctx.urls))}">${icon('pin', { size: 13 })}<span>${esc(a.name)}</span></a></li>`).join('')}</ul>${ctx.content.areas.length > ars.length ? `<a class="side-areas__more" href="${esc(ctx.urls.areas)}">View all ${ctx.content.areas.length} areas ${icon('arrow', { size: 13 })}</a>` : ''}</div>` : ''}
  </aside>`;
}

export { paras, h2Label, primaryCta };
