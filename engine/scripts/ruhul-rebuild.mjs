#!/usr/bin/env node
/**
 * Rebuild a site that was designed by RUHUL's engine, keeping his design and
 * swapping in the new content + URL scheme (user, 2026-09-17).
 *
 * His engine is not available - only its built static output (the repo's
 * `main` branch). So his own pages ARE the templates: every page is produced by
 * taking the matching page type from his build and substituting content into
 * it. site.css, the JS, the <body> layout classes, hero variant, header,
 * footer, mobile bar and photos are carried over byte-for-byte. Our engine's
 * design system is never used here.
 *
 * Content, routes and rules come from OUR content pipeline (resolveContent):
 * 02 services only, only suburbs with 07 pages, suburb-service pages,
 * /<city>/..., /service-areas/, /blog/, unpublished suburb names scrubbed,
 * authored links rewritten.
 *
 * User decisions: keep his layout but neutral text for his built-in claims
 * (same-day, licensed & insured, upfront pricing, free quote, real reviews,
 * "recent projects"); nav label "Blogs"; Tulsa first.
 *
 *   node scripts/ruhul-rebuild.mjs --domain tulsagaragedoorco.com --template <cloned main dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load.js';
import { resolveContent } from '../src/content/index.js';
import { localBusiness, serviceSchema, faqSchema, breadcrumbSchema } from '../src/seo/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const DOMAIN = args.domain;
const TPL = args.template;
if (!DOMAIN || !TPL || !fs.existsSync(path.join(TPL, 'index.html'))) {
  console.error('usage: --domain <domain> --template <dir with his built main branch>');
  process.exit(1);
}

const ds = loadDataset();
const b = ds.byDomain[DOMAIN];
if (!b) { console.error('no business for', DOMAIN); process.exit(1); }
const c = resolveContent(b);
const city = b.city; const st = b.state;
const cityLoc = `${city}, ${st}`;
const citySlug = c.citySlug;
const OUT = path.join(ROOT, 'dist', `${DOMAIN}-${citySlug}`);
const ORIGIN = `https://${DOMAIN}`;
const read = (p) => fs.readFileSync(path.join(TPL, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(TPL, p));

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\$/g, '&#36;');
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function inlineMd(text) {
  let out = esc(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => (/^(\/|https?:\/\/)/.test(url) ? `<a href="${url}">${label}</a>` : label));
  return out;
}
function paras(body) {
  return String(body || '').split(/\n\n+/).map((x) => x.trim()).filter(Boolean).map((block) => {
    const lines = block.split('\n').map((l) => l.trim());
    if (lines.every((l) => /^[-•]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inlineMd(l.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
    return `<p>${inlineMd(block)}</p>`;
  }).join('\n');
}
const first = (re, s) => { const m = re.exec(s); return m ? m[0] : ''; };
function mustReplace(s, re, fn, label) {
  if (!re.test(s)) throw new Error(`template missing: ${label}`);
  re.lastIndex = 0;
  return s.replace(re, fn);
}
const PHOTOS = new Set(fs.existsSync(path.join(TPL, 'assets/photos')) ? fs.readdirSync(path.join(TPL, 'assets/photos')) : []);
function photo(...cands) {
  for (const c0 of cands) if (c0 && PHOTOS.has(c0)) return `/assets/photos/${c0}`;
  return '/assets/photos/hero.webp';
}
const cycle = (prefix, i, n) => `${prefix}-${i % n}.webp`;
// Card photos for a list longer than his svc-* set: after svc-0..N run into his
// other service photos, then gallery shots, so no photo repeats on one page.
function cardPhoto(i) {
  const pool = [...PHOTOS].filter((f) => /^svc-\d+\.webp$/.test(f)).sort((x, y) => parseInt(x.slice(4), 10) - parseInt(y.slice(4), 10))
    .concat([...PHOTOS].filter((f) => /^inner-garage-door-[a-z-]+\.webp$/.test(f)).sort())
    .concat([...PHOTOS].filter((f) => /^gal-\d+\.webp$/.test(f)).sort());
  return `/assets/photos/${pool[i % pool.length] || 'hero.webp'}`;
}
const countPrefix = (prefix) => [...PHOTOS].filter((f) => new RegExp(`^${prefix}-\\d+\\.webp$`).test(f)).length || 1;
const NSVC = countPrefix('svc'); const NGUIDE = countPrefix('guide'); const NHC = countPrefix('hc'); const NGAL = countPrefix('gal');

// Claim language that must not survive anywhere the TEMPLATE owns the text.
const CLAIM = /same[- ]day|licen[cs]ed|insured|upfront|free (quote|estimate)|real reviews|warrant|guarantee|24\/7|fully stocked|trained techs|recent (garage door )?projects/i;

// ---------------------------------------------------------------- content
const S = c.services;               // {id, service, page, href}
const A = c.areas;                  // published suburbs {name, slug, href, page, services[]}
const T = c.topics;                 // {slug, page, href}
const svcLabel = (s) => (s.service && s.service.label) || s.label || s.id;
const pageMeta = (p) => (p && (p.meta || (p.page && p.page.meta_description))) || '';

// ---------------------------------------------------------------- shell
const HOME = read('index.html');
const svgOf = (re, s = HOME) => { const m = re.exec(s); return m ? m[1] : ''; };

function navHtml() {
  const tplNav = first(/<nav class="main">[\s\S]*?<\/nav>/, HOME);
  const areasClass = /mega mega--areas/.test(tplNav) ? 'mega mega--areas' : 'mega';
  const item = (label, cls, allHref, allLabel, links) => `<div class="nav-item"><button type="button">${label}</button><div class="${cls}"><a class="mega-all" href="${allHref}">${allLabel}</a>${links.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join('')}</div></div>`;
  return `<nav class="main">${
    item('Services', 'mega', `/${citySlug}/`, 'All Services', S.map((s) => [s.href, svcLabel(s)]))
  }${item('Service Areas', areasClass, '/service-areas/', 'All Service Areas', A.map((a) => [a.href, a.name]))
  }${T.length ? item('Blogs', 'mega', '/blog/', 'All Blogs', T.map((t) => [t.href, t.page.h1 || t.slug])) : ''
  }<a href="/about/">About</a><a href="/contact/">Contact</a><a class="nav-quote" href="/request-a-quote/">Request a Quote</a></nav>`;
}

function footerFix(html) {
  // Services / Company / Service Areas link columns rebuilt; brand block kept.
  const cols = first(/<div class="gf-cols">[\s\S]*?<\/div>\s*<div class="gf-trust">/, html);
  if (cols) {
    const brand = first(/<div class="gf-brand">[\s\S]*?<\/address>\s*<\/div>/, cols);
    const newCols = `<div class="gf-cols">${brand}<div><h4>Services</h4>${S.map((s) => `<a href="${s.href}">${esc(svcLabel(s))}</a>`).join('')}<a href="/${citySlug}/">All Services</a></div><div><h4>Company</h4><a href="/about/">About Us</a><a href="/contact/">Contact</a><a href="/service-areas/">Service Areas</a>${T.length ? '<a href="/blog/">Blogs</a>' : ''}<a href="/request-a-quote/">Request a Quote</a><a href="/faq/">FAQ</a></div><div><h4>Service Areas</h4>${A.map((a) => `<a href="${a.href}">${esc(a.name)}</a>`).join('')}<a href="/service-areas/">All Service Areas</a></div></div>
<div class="gf-trust">`;
    html = html.replace(cols, newCols);
  }
  // Trust row: neutral, true items (the template's svgs kept in order).
  html = html.replace(/<div class="gf-trust">([\s\S]*?)<\/div>\s*<div class="gf-legal">/, (m, inner) => {
    const svgs = [...inner.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((x) => x[0]);
    const items = [`${S.length} garage door services`, `${A.length} service areas`, 'Diagnosis before repair', `Serving ${cityLoc}`];
    return `<div class="gf-trust">${items.map((t, i) => `<div>${svgs[i % Math.max(svgs.length, 1)] || ''}<span>${esc(t)}</span></div>`).join('')}</div>
<div class="gf-legal">`;
  });
  html = html.replace(/(<div class="gf-brand">[\s\S]*?<p>)([\s\S]*?)(<\/p>)/, (m, a, t, z) => (CLAIM.test(t) ? `${a}Garage door repair, installation and service for ${esc(city)} and nearby communities.${z}` : m));
  return html;
}

function topFix(html) {
  return html.replace(/(<div class="top">[\s\S]*?<\/div>\s*<\/div>)/, (block) => block.replace(/<span>([^<]*)<\/span>/g, (m, t) => (CLAIM.test(t) ? '<span>Repair, springs &amp; openers</span>' : m)));
}

function headFix(html, { pathname, title, desc, image, ld }) {
  const url = `${ORIGIN}${pathname}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${ORIGIN}${image}">`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${ORIGIN}${image}">`);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  // No hover underline on the tile cards (user, 2026-09-17); his site.css stays byte-identical.
  html = html.replace('</head>', () => `${ld}\n<style>a.feat:hover,a.feat:hover *{text-decoration:none}</style>\n</head>`);
  return html;
}

function shell(tplHtml, body, meta) {
  const start = tplHtml.indexOf('</header>') + '</header>'.length;
  const end = tplHtml.indexOf('<div class="mcta">');
  if (start < 9 || end < 0) throw new Error('template shell markers missing');
  let html = tplHtml.slice(0, start) + '\n' + body + '\n' + tplHtml.slice(end);
  html = html.replace(/<nav class="main">[\s\S]*?<\/nav>/, navHtml());
  html = topFix(html);
  html = footerFix(html);
  html = headFix(html, meta);
  return html;
}

// ---------------------------------------------------------------- fragments
const badgeTxt = ['Serving', cityLoc];
function heroFill(hero, { h1, lead, img, alt }) {
  let h = hero;
  h = mustReplace(h, /<h1>[\s\S]*?<\/h1>/, () => `<h1>${esc(h1)}</h1>`, 'hero h1');
  if (/<p class="lead">/.test(h)) h = h.replace(/<p class="lead">[\s\S]*?<\/p>/, lead ? `<p class="lead">${esc(lead)}</p>` : '');
  h = h.replace(/(<img\b[^>]*?)src="[^"]*"([^>]*?)alt="[^"]*"/, `$1src="${img}"$2alt="${esc(alt)}"`);
  h = h.replace(/(<div class="hero__badge">\s*<svg[\s\S]*?<\/svg>\s*<div>\s*)<b>[\s\S]*?<\/b>\s*<span>[\s\S]*?<\/span>/, `$1<b>${esc(badgeTxt[0])}</b><span>${esc(badgeTxt[1])}</span>`);
  h = h.replace(/<ul class="chips">([\s\S]*?)<\/ul>/, (m, inner) => {
    const svg = first(/<svg[\s\S]*?<\/svg>/, inner);
    const chips = ['Repair & installation', 'Springs & openers', `${S.length} services`, `Serving ${city}`];
    return `<ul class="chips">${chips.map((t) => `<li>${svg}${esc(t)}</li>`).join('')}</ul>`;
  });
  h = h.replace(/Get a Free Quote/g, 'Request a Quote');
  return h;
}
const qcardFix = (html) => html.replace(/<div class="qcard">([\s\S]*?)<\/div>/g, (m, inner) => {
  let x = inner.replace(/<h3>([^<]*)<\/h3>/, (mm, t) => (CLAIM.test(t) ? '<h3>Request a quote</h3>' : mm));
  x = x.replace(/<p>([^<]*)<\/p>/, (mm, t) => (CLAIM.test(t) ? `<p>Tell us what your door is doing in ${esc(city)}.</p>` : mm));
  return `<div class="qcard">${x}</div>`;
});
const ctaBandFix = (html) => html.replace(/<div class="cta-band">([\s\S]*?)<div class="cta">/g, (m, inner) => {
  let x = inner.replace(/<h2>([^<]*)<\/h2>/, (mm, t) => (CLAIM.test(t) ? `<h2>Need a garage door fixed in ${esc(city)}?</h2>` : mm));
  x = x.replace(/<p>([\s\S]*?)<\/p>/, (mm, t) => (CLAIM.test(t) ? '<p>Call or request a quote - tell us what your door is doing and where you are.</p>' : mm));
  return `<div class="cta-band">${x}<div class="cta">`;
});
function bodyHtml(page, { withFaq = true } = {}) {
  const secs = (page.sections || []).filter((s) => s && (s.h2 || s.body)).map((s) => `${s.h2 ? `<h2 id="${slugify(s.h2)}">${esc(s.h2)}</h2>\n` : ''}${paras(s.body)}`).join('\n');
  const faq = withFaq && (page.faq || []).filter((f) => f.q && f.a);
  const faqHtml = faq && faq.length ? `\n<h2 id="faq">Frequently asked questions</h2>\n<div class="faq">${faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div class="a">${paras(f.a)}</div></details>`).join('')}</div>` : '';
  return secs + faqHtml;
}
function crumbFix(html, trail) {
  const parts = trail.map(([label, href], i) => (i < trail.length - 1 ? `<a href="${href}">${esc(label)}</a>` : esc(label)));
  return html.replace(/<div class="crumb">[\s\S]*?<\/div>/, `<div class="crumb">${parts.join(' &rsaquo; ')}</div>`);
}

// ---------------------------------------------------------------- page types
const innerTplPath = ['services/garage-door-repair/index.html', ...fs.readdirSync(path.join(TPL, 'services')).map((d) => `services/${d}/index.html`)].find(exists);
const INNER = read(innerTplPath);
const INNER_BODY = INNER.slice(INNER.indexOf('</header>') + 9, INNER.indexOf('<div class="mcta">'));

function articlePage({ pathname, trail, h1, lead, img, alt, page, title, desc, ld, extraAfter = '', extraTop = '' }) {
  let body = INNER_BODY;
  body = crumbFix(body, trail);
  body = body.replace(/<section class="hero[\s\S]*?<\/section>/, (hero) => heroFill(hero, { h1, lead, img, alt }));
  body = mustReplace(body, /<div class="body">[\s\S]*?<\/div>(\s*<aside)/, (m, a) => `<div class="body">\n${bodyHtml(page)}\n</div>${a}`, 'article body');
  body = qcardFix(body);
  body = ctaBandFix(body);
  // Suburb pages: that suburb's services go right under the hero (user, 2026-09-17).
  if (extraTop) body = body.replace(/(<section class="hero[\s\S]*?<\/section>)/, (h) => `${h}\n${extraTop}`);
  if (extraAfter) body = body.replace(/(<section class="sec">\s*<div class="wrap">\s*<div class="cta-band">)/, `${extraAfter}\n$1`);
  return shell(INNER, body, { pathname, title, desc, image: img, ld });
}

// tiles (his service-areas index "feats feats--tiles") used for suburb lists
const AREAIDX = read('service-areas/index.html');
const TILE = first(/<a class="feat" href="[^"]*">[\s\S]*?<\/a>/, AREAIDX);
const tile = (href, h3, p) => TILE.replace(/href="[^"]*"/, `href="${href}"`).replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${esc(h3)}</h3>`).replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(p)}</p>`);
const tilesGrid = (items) => first(/<div class="grid g3 feats feats--tiles">/, AREAIDX).replace(/$/, '') + items.join('') + '</div>';
const SECHEAD = first(/<div class="sec-head">[\s\S]*?<\/div>/, HOME);
const secHead = (eyebrow, h2, p) => SECHEAD.replace(/<p class="eyebrow">[\s\S]*?<\/p>/, `<p class="eyebrow">${esc(eyebrow)}</p>`).replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${esc(h2)}</h2>`).replace(/(<\/h2>)\s*<p>[\s\S]*?<\/p>/, p ? `$1<p>${esc(p)}</p>` : '$1');
const tilesSection = (eyebrow, h2, p, items) => `<section class="sec sec--soft"><div class="wrap">${secHead(eyebrow, h2, p)}${tilesGrid(items)}</div></section>`;

// cards (his services index "guide-grid")
const SVCIDX = read('services/index.html');
const CARD = first(/<a class="guide-card" href="[^"]*">[\s\S]*?<\/a>/, SVCIDX);
const card = (href, img, h3, p, more) => CARD.replace(/href="[^"]*"/, `href="${href}"`).replace(/src="[^"]*"/, `src="${img}"`).replace(/alt="[^"]*"/, `alt="${esc(h3)}"`)
  .replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${esc(h3)}</h3>`).replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(p)}</p>`).replace(/(<span class="read-more">)[^<]*/, `$1${more} `);

function indexPage({ tplHtml, pathname, trail, h1, lead, img, sectionsHtml, title, desc, ld }) {
  const tBody = tplHtml.slice(tplHtml.indexOf('</header>') + 9, tplHtml.indexOf('<div class="mcta">'));
  let body = crumbFix(tBody, trail);
  body = body.replace(/<section class="hero[\s\S]*?<\/section>/, (hero) => heroFill(hero, { h1, lead, img, alt: `Garage door service in ${cityLoc}` }));
  // replace every content section between the hero and the CTA band
  const heroEnd = body.search(/<\/section>/) + '</section>'.length;
  const ctaStart = body.search(/<section class="sec">\s*<div class="wrap">\s*<div class="cta-band">/);
  body = body.slice(0, heroEnd) + '\n' + sectionsHtml + '\n' + body.slice(ctaStart);
  body = ctaBandFix(body);
  return shell(tplHtml, body, { pathname, title, desc, image: img, ld });
}

// page-hero pages (about / faq / legal / contact) and the quote page
function pageHeroPage({ tplPath, pathname, trail, page, title, desc, ld }) {
  const tpl = read(tplPath);
  let body = tpl.slice(tpl.indexOf('</header>') + 9, tpl.indexOf('<div class="mcta">'));
  body = body.replace(/<div class="crumb">[\s\S]*?<\/div>/, `<div class="crumb">${trail.map(([l, h], i) => (i < trail.length - 1 ? `<a href="${h}">${esc(l)}</a>` : esc(l))).join(' &rsaquo; ')}</div>`);
  body = body.replace(/(<section class="page-hero">[\s\S]*?)<h1>[\s\S]*?<\/h1>/, `$1<h1>${esc(page.h1 || title)}</h1>`);
  body = mustReplace(body, /<div class="body">[\s\S]*?<\/div>(\s*(?:<aside|<\/div>\s*<\/div>\s*<\/section>))/, (m, a) => `<div class="body">\n${bodyHtml(page)}\n</div>${a}`, 'page body');
  body = qcardFix(body);
  body = ctaBandFix(body);
  // quote page side panel + form heading
  body = body.replace(/<h2 class="qz-form__h">([^<]*)<\/h2>/, (m, t) => (CLAIM.test(t) ? '<h2 class="qz-form__h">Request your quote</h2>' : m));
  body = body.replace(/<p class="qz-form__lead">([\s\S]*?)<\/p>/, (m, t) => (CLAIM.test(t) ? `<p class="qz-form__lead">Tell us about the door and where you are in ${esc(city)}, and we will get back to you.</p>` : m));
  body = body.replace(/<div class="qz-assure">([\s\S]*?)<\/div>/, (m, inner) => {
    const svg = first(/<svg[\s\S]*?<\/svg>/, inner);
    const items = ['Tell us what the door is doing', 'We diagnose before we quote', `Serving ${cityLoc} and nearby`];
    return `<div class="qz-assure"><h3>What happens next</h3><ul>${items.map((t) => `<li>${svg}<span>${esc(t)}</span></li>`).join('')}</ul></div>`;
  });
  return shell(tpl, body, { pathname, title, desc, image: '/assets/photos/hero.webp', ld });
}

// ---------------------------------------------------------------- home
function homePage() {
  let body = HOME.slice(HOME.indexOf('</header>') + 9, HOME.indexOf('<div class="mcta">'));
  const home = c.home;
  body = body.replace(/<section class="hero[\s\S]*?<\/section>/, (hero) => heroFill(hero, { h1: `${city} Garage Door Repair`, lead: home.h1 || home.meta, img: photo('hero.webp'), alt: `Garage door service in ${cityLoc}` }));
  const unknown = [];
  body = body.replace(/<section class="(trust|sec[^"]*)">[\s\S]*?<\/section>/g, (sec, cls) => {
    if (cls === 'trust') {
      const svgs = [...sec.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((x) => x[0]);
      const items = [`<b>${S.length}</b> garage door services`, `<b>${A.length}</b> service areas`, '<b>Diagnosis</b> before repair', `Serving <b>${esc(cityLoc)}</b>`];
      const wrapOpen = first(/<section class="trust">\s*<div class="wrap">/, sec);
      return `${wrapOpen}${items.map((t, i) => `<div>${svgs[i % Math.max(svgs.length, 1)] || ''}<span>${t}</span></div>`).join('')}</div></section>`;
    }
    if (/class="grid[^"]*scards/.test(sec)) {
      const proto = first(/<a class="scard" href="[^"]*">[\s\S]*?<\/a>/, sec);
      const cards = S.map((s, i) => proto.replace(/href="[^"]*"/, `href="${s.href}"`).replace(/src="[^"]*"/, `src="${cardPhoto(i)}"`).replace(/alt="[^"]*"/, `alt="${esc(svcLabel(s))} in ${esc(city)}"`)
        .replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${esc(svcLabel(s))}</h3>`).replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(pageMeta(s.page))}</p>`)).join('');
      return sec.replace(/(<div class="grid[^"]*scards[^"]*">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)$/, `$1${cards}$2`).replace(/(<div class="sec-head">[\s\S]*?<\/h2>\s*)<p>([\s\S]*?)<\/p>/, (m, a, t) => (CLAIM.test(t) ? `${a}<p>Repair, installation and service for garage doors across ${esc(city)}.</p>` : m));
    }
    if (/class="sd__grid"/.test(sec)) {
      let x = sec.replace(/<p class="eyebrow">[\s\S]*?<\/p>/, '<p class="eyebrow">Common Problems</p>')
        .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>Garage door problems we handle in ${esc(city)}</h2>`)
        .replace(/(<\/h2>\s*)<p>[\s\S]*?<\/p>/, '$1<p>Tell us what the door is doing and where you are, and we will take it from there.</p>')
        .replace(/(<img\b[^>]*alt=")[^"]*"/, `$1Garage door service in ${esc(cityLoc)}"`)
        .replace(/(<span class="sd__badge">\s*<svg[\s\S]*?<\/svg>)[\s\S]*?(<\/span>)/, `$1<b>Serving</b> ${esc(city)}$2`);
      x = x.replace(/<li>(\s*<svg[\s\S]*?<\/svg>)([^<]*)<\/li>/g, (m, svg, t) => (CLAIM.test(t) ? `<li>${svg}Garage door repair</li>` : m));
      return x;
    }
    if (/class="grid[^"]*feats/.test(sec)) {
      const feats = [
        ['Diagnosis first', 'Every visit starts by finding what actually failed - not a pre-written parts list.'],
        ['The right part for the door', 'Springs and openers matched to the door’s weight and age, so the fix holds up.'],
        ['Straight answers', 'When a repair makes more sense than a replacement - or the reverse - you hear it plainly.'],
        ['Clean, careful work', 'Tension released safely, hardware set true, the door tested under power before we leave.'],
        [`Service across ${city}`, `${A.length} nearby communities and ${S.length} garage door services.`],
        ['Easy to reach', 'Call or request a quote online - tell us what the door is doing.'],
      ];
      let i = 0;
      let x = sec.replace(/(<div class="feat">[\s\S]*?<h3>)[\s\S]*?(<\/h3>\s*<p>)[\s\S]*?(<\/p>)/g, (m, a, bb, z) => { const f = feats[i++ % feats.length]; return `${a}${esc(f[0])}${bb}${esc(f[1])}${z}`; });
      x = x.replace(/<h2>([^<]*)<\/h2>/, (m, t) => (CLAIM.test(t) ? '<h2>Straight answers, honest fixes</h2>' : m));
      return x;
    }
    if (/class="steps/.test(sec)) {
      return sec.replace(/<p>([^<]*)<\/p>/g, (m, t) => (CLAIM.test(t) ? '<p>The fix that is needed, done and tested before we leave.</p>' : m));
    }
    if (/class="gallery/.test(sec)) {
      return sec.replace(/<p class="eyebrow">[\s\S]*?<\/p>/, '<p class="eyebrow">Gallery</p>')
        .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>Garage doors around ${esc(city)}</h2>`)
        .replace(/(<\/h2>\s*)<p>[\s\S]*?<\/p>/, '$1<p>A look at the kind of doors, openers and springs we work on.</p>')
        .replace(/alt="[^"]*"/g, `alt="Garage door in ${esc(cityLoc)}"`);
    }
    if (/class="areas-tiers"|class="areas /.test(sec)) {
      const tierProto = first(/<div class="areas-tier">[\s\S]*?<\/div>\s*<\/div>/, sec);
      const links = A.map((a) => `<a href="${a.href}">${esc(a.name)}</a>`).join('');
      // His .areas-tiers is a 2-column grid (city neighborhoods | nearby suburbs). With only
      // the published suburbs there is ONE tier, which would sit in the left half and wrap -
      // span it across both columns instead (user, 2026-09-17). site.css stays untouched.
      const tier = tierProto ? tierProto.replace('<div class="areas-tier">', '<div class="areas-tier" style="grid-column:1/-1">').replace(/<h3>[\s\S]*?<\/h3>/, '<h3>Nearby communities</h3>').replace(/(<div class="areas(?: [^"]*)?">)[\s\S]*?(<\/div>\s*<\/div>)$/, `$1${links}$2`) : `<div class="areas areas--left">${links}</div>`;
      return sec.replace(/<div class="areas-tiers">[\s\S]*?(<div class="areas-more">)/, `<div class="areas-tiers">${tier}</div>\n$1`)
        .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>Serving ${esc(city)} &amp; nearby communities</h2>`)
        .replace(/(<\/h2>\s*)<p>[\s\S]*?<\/p>/, `$1<p>The ${A.length} communities we cover around ${esc(city)}.</p>`);
    }
    if (/<div class="(areas|areas-grid|areas-cols)">/.test(sec)) {
      // Other flat area layouts in his templates: plain pills (.areas, "View all" inside),
      // icon cards (.areas-grid > a.area-card) and columns (.areas-cols > a.area-col-link).
      return sec.replace(/(<div class="(?:areas|areas-grid|areas-cols)">)([\s\S]*?)(<a class="areas__all"[\s\S]*?<\/a>)?<\/div>/, (m, open, inner, all) => {
        const proto = first(/<a (?!class="areas__all")[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/, inner);
        const links = A.map((a) => proto.replace(/href="[^"]*"/, `href="${a.href}"`).replace(/(<span>)?[^<>]*(<\/span>)?<\/a>$/, (z, s1, s2) => `${s1 || ''}${esc(a.name)}${s2 || ''}</a>`)).join('');
        return `${open}${links}${all || ''}</div>`;
      }).replace(/<h2>[\s\S]*?<\/h2>/, `<h2>Serving ${esc(city)} &amp; nearby communities</h2>`)
        .replace(/(<\/h2>\s*)<p>[\s\S]*?<\/p>/, `$1<p>The ${A.length} communities we cover around ${esc(city)}.</p>`);
    }
    if (/class="svc-grid"/.test(sec)) {
      const cardsIn = [...sec.matchAll(/<a class="svc-card" href="[^"]*">[\s\S]*?<\/a>/g)].map((x) => x[0]);
      const icons = cardsIn.map((c0) => first(/<div class="svc-card__ic">[\s\S]*?<\/div>/, c0));
      const cards = S.map((s, i) => cardsIn[i % cardsIn.length].replace(/href="[^"]*"/, `href="${s.href}"`).replace(/src="[^"]*"/, `src="${cardPhoto(i)}"`).replace(/alt="[^"]*"/, `alt="${esc(svcLabel(s))} in ${esc(city)}"`)
        .replace(/<div class="svc-card__ic">[\s\S]*?<\/div>/, icons[i % icons.length]).replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${esc(svcLabel(s))}</h3>`).replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(pageMeta(s.page))}</p>`)).join('');
      return sec.replace(/(<div class="svc-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)$/, `$1${cards}$2`).replace(/(<div class="sec-head">[\s\S]*?<\/h2>\s*)<p>([\s\S]*?)<\/p>/, (m, a, t) => (CLAIM.test(t) ? `${a}<p>Repair, installation and service for garage doors across ${esc(city)}.</p>` : m));
    }
    if (/class="hc-rows"/.test(sec)) {
      const p0 = first(/<div class="hc-row">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, sec);
      const p1 = first(/<div class="hc-row hc-row--alt">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, sec) || p0;
      const rows = (home.sections || []).filter((s) => s.h2 || s.body).map((s, i) => (i % 2 ? p1 : p0)
        .replace(/src="[^"]*"/, `src="${photo(cycle('hc', i, NHC))}"`).replace(/alt="[^"]*"/, `alt="${esc(s.h2 || 'Garage door work')} - ${esc(cityLoc)}"`)
        .replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${esc(s.h2)}</h3>`).replace(/(<div class="hc-row__b">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>)$/, `$1${paras(s.body)}$2`)).join('');
      return sec.replace(/(<div class="hc-rows">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)$/, `$1${rows}$2`);
    }
    if (/class="faq"/.test(sec)) {
      const faq = (home.faq || []).filter((f) => f.q && f.a);
      if (!faq.length) return '';
      return sec.replace(/(<div class="faq">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)$/, `$1${faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div class="a">${paras(f.a)}</div></details>`).join('')}$2`);
    }
    if (/class="cta-band"/.test(sec)) return ctaBandFix(sec);
    unknown.push(cls + ' :: ' + sec.slice(0, 120));
    return sec;
  });
  if (unknown.length) console.warn('[ruhul] home sections left untouched:', unknown);
  const ld = localBusiness(b, [cityLoc, ...A.map((a) => (a.page && a.page.schema_facts && a.page.schema_facts.areaServed) || a.name)]) + faqSchema(home.faq);
  return shell(HOME, body, { pathname: '/', title: home.title || `${city} Garage Door Repair | ${b.name}`, desc: home.meta || '', image: photo('hero.webp'), ld });
}

// ---------------------------------------------------------------- build
const pages = new Map();
const put = (pathname, html) => pages.set(pathname, html);
const bc = (trail) => breadcrumbSchema(b, trail.map(([label, href]) => ({ label, href })));

put('/', homePage());

// city hub /<city>/: services as cards + suburbs as tiles
{
  const trail = [['Home', '/'], [`${city} Garage Door Services`, `/${citySlug}/`]];
  const cards = S.map((s) => card(s.href, cardPhoto(S.indexOf(s)), svcLabel(s), pageMeta(s.page), 'Learn more'));
  const sections = `<section class="sec"><div class="wrap"><div class="guide-grid">${cards.join('')}</div></div></section>\n`
    + tilesSection('Where We Work', `Garage door service near ${city}`, `The ${A.length} communities we cover around ${city}.`, A.map((a) => tile(a.href, a.name, pageMeta(a.page))));
  const hub = c.areasHub;
  put(`/${citySlug}/`, indexPage({ tplHtml: SVCIDX, pathname: `/${citySlug}/`, trail, h1: `Garage Door Services in ${city}`, lead: `Repair, installation and service for garage doors across ${city} and ${A.length} nearby communities.`, img: photo('hero.webp'), sectionsHtml: sections, title: `Garage Door Services in ${cityLoc} | ${b.name}`, desc: (hub && hub.meta) || `Garage door services in ${cityLoc} from ${b.name}.`, ld: bc(trail) }));
}

// services
S.forEach((s, i) => {
  const trail = [['Home', '/'], [city, `/${citySlug}/`], [svcLabel(s), s.href]];
  const img = photo(`inner-${s.id}.webp`, `inner-${slugify(svcLabel(s))}.webp`, cycle('svc', i, NSVC));
  put(s.href, articlePage({ pathname: s.href, trail, h1: s.page.h1 || svcLabel(s), lead: pageMeta(s.page), img, alt: `${svcLabel(s)} in ${cityLoc}`, page: s.page, title: s.page.title || `${svcLabel(s)} in ${cityLoc}`, desc: pageMeta(s.page), ld: serviceSchema(b, s.service || { label: svcLabel(s) }, undefined, pageMeta(s.page)) + bc(trail) + faqSchema(s.page.faq) }));
});

// suburbs + suburb services
A.forEach((a) => {
  const trail = [['Home', '/'], ['Service Areas', '/service-areas/'], [a.name, a.href]];
  const img = photo(`inner-${a.slug}.webp`, 'hero.webp');
  const kids = tilesSection(`In ${a.name}`, `Garage door services in ${a.name}`, '', a.services.map((ss) => tile(ss.href, ss.label, pageMeta(ss.page))));
  put(a.href, articlePage({ pathname: a.href, trail, h1: a.page.h1 || a.name, lead: pageMeta(a.page), img, alt: `Garage door service in ${a.name}`, page: a.page, title: a.page.title || `Garage Door Service in ${a.name}`, desc: pageMeta(a.page), ld: bc(trail) + faqSchema(a.page.faq), extraTop: kids }));
  a.services.forEach((ss, j) => {
    const t2 = [['Home', '/'], ['Service Areas', '/service-areas/'], [a.name, a.href], [ss.label, ss.href]];
    const im = photo(`inner-${ss.id}.webp`, `inner-${a.slug}.webp`, cycle('svc', j, NSVC));
    const areaServed = (ss.page.schema_facts && ss.page.schema_facts.areaServed) || a.name;
    put(ss.href, articlePage({ pathname: ss.href, trail: t2, h1: ss.page.h1 || `${ss.label} in ${a.name}`, lead: pageMeta(ss.page), img: im, alt: `${ss.label} in ${a.name}`, page: ss.page, title: ss.page.title || `${ss.label} in ${a.name}`, desc: pageMeta(ss.page), ld: serviceSchema(b, ss.service || { label: ss.label }, areaServed, pageMeta(ss.page)) + breadcrumbSchema(b, t2.map(([label, href]) => ({ label, href }))) + faqSchema(ss.page.faq) }));
  });
});

// areas index
{
  const trail = [['Home', '/'], ['Service Areas', '/service-areas/']];
  const hub = c.areasHub;
  const sections = `<section class="sec"><div class="wrap">${tilesGrid(A.map((a) => tile(a.href, a.name, pageMeta(a.page))))}</div></section>`;
  put('/service-areas/', indexPage({ tplHtml: AREAIDX, pathname: '/service-areas/', trail, h1: (hub && hub.h1) || `Service Areas Around ${city}`, lead: (hub && hub.meta) || '', img: photo('hero.webp'), sectionsHtml: sections, title: (hub && hub.title) || `Service Areas | ${b.name}`, desc: (hub && hub.meta) || '', ld: bc(trail) }));
}

// blog
if (T.length) {
  const GIDX = read('guides/index.html');
  const trail = [['Home', '/'], ['Blogs', '/blog/']];
  const feat = first(/<a class="guide-feat" href="[^"]*">[\s\S]*?<\/a>/, GIDX);
  const [f0, ...rest] = T;
  const featHtml = feat.replace(/href="[^"]*"/, `href="${f0.href}"`).replace(/src="[^"]*"/, `src="${photo('guide-0.webp')}"`).replace(/alt="[^"]*"/, `alt="${esc(f0.page.h1)}"`)
    .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${esc(f0.page.h1)}</h2>`).replace(/<p>[\s\S]*?<\/p>/, `<p>${esc(pageMeta(f0.page))}</p>`);
  const cards = rest.map((t, i) => card(t.href, photo(cycle('guide', i + 1, NGUIDE)), t.page.h1, pageMeta(t.page), 'Read post'));
  const sections = `<section class="sec"><div class="wrap">${featHtml}<div class="guide-grid">${cards.join('')}</div></div></section>`;
  put('/blog/', indexPage({ tplHtml: GIDX, pathname: '/blog/', trail, h1: `Garage door blogs for ${city} homeowners`, lead: 'Plain answers on springs, openers, noises, and when a door is worth fixing.', img: photo('hero.webp'), sectionsHtml: sections.replace(/Read guide/g, 'Read post'), title: `Garage Door Blogs | ${b.name}`, desc: `Garage door articles for ${cityLoc} homeowners.`, ld: bc(trail) }));
  T.forEach((t, i) => {
    const tr = [['Home', '/'], ['Blogs', '/blog/'], [t.page.h1, t.href]];
    put(t.href, articlePage({ pathname: t.href, trail: tr, h1: t.page.h1, lead: pageMeta(t.page), img: photo(`inner-${t.slug}.webp`, cycle('guide', i, NGUIDE)), alt: t.page.h1, page: t.page, title: t.page.title || t.page.h1, desc: pageMeta(t.page), ld: bc(tr) + faqSchema(t.page.faq) }));
  });
}

// trust + legal pages
const trustPages = [['/about/', c.about, 'about/index.html', 'About'], ['/faq/', c.faqPage, 'faq/index.html', 'FAQ'], ['/contact/', c.contact, 'contact/index.html', 'Contact'], ['/request-a-quote/', c.quote, 'request-a-quote/index.html', 'Request a Quote'], ['/privacy/', c.privacy, 'privacy/index.html', 'Privacy Policy'], ['/terms/', c.terms, 'terms/index.html', 'Terms'], ['/accessibility/', c.accessibility, 'accessibility/index.html', 'Accessibility']];
for (const [p, page, tplPath, label] of trustPages) {
  if (!page || !exists(tplPath)) { console.warn('[ruhul] skipped', p, page ? '(no template)' : '(no content)'); continue; }
  const trail = [['Home', '/'], [page.h1 || label, p]];
  const ld = (p === '/contact/' ? localBusiness(b, [cityLoc]) : '') + bc(trail) + faqSchema(page.faq);
  put(p, pageHeroPage({ tplPath, pathname: p, trail, page, title: page.title || `${label} | ${b.name}`, desc: pageMeta(page), ld }));
}

// ---------------------------------------------------------------- write
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(TPL, 'assets'), path.join(OUT, 'assets'), { recursive: true });
for (const [p, html] of pages) {
  const dir = path.join(OUT, p);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...pages.keys()].map((p) => `  <url><loc>${ORIGIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), [`# ${b.name}`, '', `> Garage door repair, installation and service in ${cityLoc}.`, '',
  '## Services', ...S.map((s) => `- [${svcLabel(s)}](${ORIGIN}${s.href})`), '',
  '## Service areas', ...A.map((a) => `- [${a.name}](${ORIGIN}${a.href})`), '',
  ...(T.length ? ['## Blogs', ...T.map((t) => `- [${t.page.h1}](${ORIGIN}${t.href})`), ''] : []),
  '## Pages', `- [Request a quote](${ORIGIN}/request-a-quote/)`, `- [Contact](${ORIGIN}/contact/)`, `- [About](${ORIGIN}/about/)`, ''].join('\n'));
fs.writeFileSync(path.join(OUT, '.template-rebuild.json'), JSON.stringify({ domain: DOMAIN, name: b.name, city, state: st, designer: 'Ruhul', templateFrom: 'main branch static build', builtAt: new Date().toISOString() }, null, 2));

// ---------------------------------------------------------------- self-checks
const all = [...pages.values()].join('\n');
const claimHits = [];
for (const [p, html] of pages) {
  const bodyTxt = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  const m = bodyTxt.match(new RegExp(CLAIM.source, 'gi'));
  if (m) claimHits.push(`${p}: ${[...new Set(m.map((x) => x.toLowerCase()))].join(', ')}`);
}
const oldRoutes = (all.match(/href="\/(services|guides)\//g) || []).length + (all.match(/href="\/service-areas\/[a-z]/g) || []).length;
console.log(JSON.stringify({ domain: DOMAIN, out: path.relative(ROOT, OUT), pages: pages.size, services: S.length, suburbs: A.length, suburbServicePages: A.reduce((n, a) => n + a.services.length, 0), blogs: T.length, oldRouteLinks: oldRoutes }, null, 0));
if (claimHits.length) { console.log(`claim wording still present on ${claimHits.length} page(s) (includes authored content):`); claimHits.slice(0, 12).forEach((h) => console.log('  ' + h)); }
