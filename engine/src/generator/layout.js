/**
 * Page shell / layout engine. Wraps page content in a full, valid, accessible
 * HTML document with head SEO, theme CSS (inlined), fonts, JSON-LD, and the
 * minimal nav-toggle script.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../../config/generation.config.js';
import { generateCss } from '../design/css.js';
import { headMeta } from '../seo/meta.js';
import { esc } from '../util/html.js';
import { faviconHref } from '../assets/images.js';

// Known Google-hosted families we can safely request. Non-Google display fonts
// (Clash/Satoshi/General Sans/Bricolage) fall back to their stacks.
const GOOGLE_FONTS = new Set([
  'Inter', 'Fraunces', 'Playfair Display', 'Sora', 'Space Grotesk', 'Poppins', 'Oswald',
  'Archivo', 'Archivo Black', 'Nunito', 'Nunito Sans', 'Bitter', 'IBM Plex Sans', 'IBM Plex Mono',
  'Cormorant Garamond', 'Barlow Semi Condensed', 'Saira Condensed', 'Playfair Display',
  'Roboto Condensed', 'Source Sans 3', 'Public Sans', 'Manrope', 'Karla', 'Prata',
  'Baloo 2', 'Quicksand', 'Zilla Slab', 'Bebas Neue', 'Teko', 'Mulish',
  'Fredoka', 'Roboto', 'Bricolage Grotesque',
]);

function familyOf(stack) {
  const m = /"([^"]+)"|'([^']+)'/.exec(stack || '');
  return m ? (m[1] || m[2]) : null;
}

function fontsLink(design) {
  const fams = new Set();
  for (const s of [design.typography.headingFont, design.typography.bodyFont]) {
    const f = familyOf(s);
    if (f && GOOGLE_FONTS.has(f)) fams.add(f);
  }
  if (!fams.size) return '';
  const spec = [...fams]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700;800`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${spec}&display=swap`;
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(href)}">`;
}

// Hamburger toggle + mobile megamenu accordion. On mobile (≤920px) tapping a
// megamenu label expands/collapses its submenu instead of navigating (the
// "View all …" link inside still goes to the section index). On desktop the
// labels navigate and the megamenu opens on hover, so we only intercept when the
// hamburger is active.
const NAV_SCRIPT = `<script>(function(){var t=document.querySelector('.nav-toggle'),l=document.getElementById('nav-links');if(t&&l){t.addEventListener('click',function(){var o=l.classList.toggle('open');t.setAttribute('aria-expanded',o);t.textContent=o?'✕':'☰'})}var mq=window.matchMedia('(max-width:920px)');Array.prototype.forEach.call(document.querySelectorAll('.nav__links .has-menu>a'),function(a){a.addEventListener('click',function(e){if(mq.matches){e.preventDefault();var li=a.parentNode,open=li.classList.toggle('open');a.setAttribute('aria-expanded',open)}})})})();</script>`;

/**
 * GSAP + ScrollTrigger load from cdnjs; section-animations.js is INLINED.
 *
 * NOTHING is served from the site's own assets/vendor/ any more. The stale
 * comment that used to sit here ("vendored locally ... never a CDN reference")
 * described the pre-2026-08-31 design and is gone; site.js no longer copies
 * those three files into a built site either, because no page referenced them
 * once the libraries moved to the CDN and this file became inline.
 *
 * WHY THE LIBRARIES MOVED OFF THIS ORIGIN. Cloudflare returns 403 for every
 * `.js` file served from the site's own domain - verified same-origin on five
 * live sites across all four batches (Dallas, Chicago, Miami, Petaluma, Reno):
 * the response has no `etag` and no `cf-cache-status`, so it never reached R2;
 * Cloudflare answered it itself with its block page. HTML, PNG, XML and TXT on
 * the same origin all return 200, and INLINE <script> still executes (the nav
 * toggle works), so the block is specifically on serving .js files. A CDN URL
 * never touches that origin, so it loads.
 *
 * This reverses the engine's "no external dependency" rule for these two files
 * - a deliberate tradeoff, on instruction, because self-hosting them does not
 * currently work in production. Fixing the Cloudflare rule would let this be
 * reverted.
 *
 * `defer` on BOTH CDN tags: deferred scripts execute in document order and are
 * guaranteed to finish before DOMContentLoaded, which is what lets the inline
 * block below assume `gsap` exists.
 *
 * onerror sets `gsap-failed` on <html> so a blocked or slow CDN is detectable
 * rather than failing silently. NOTE: no CSS currently consumes that class, and
 * none is needed - every reveal is a GSAP `.from()`, so elements are only ever
 * hidden once GSAP is actually running. If the CDN never loads, nothing hides
 * anything and the page renders fully as plain static content. Do not "fix"
 * this by pre-hiding sections in CSS: that would turn a CDN outage into a blank
 * page.
 */
/**
 * section-animations.js is INLINED, not linked.
 *
 * It is our own file so no CDN hosts it, and served from the site's own origin
 * it returns 403 like every other .js there - so the libraries loaded but
 * nothing ever drove them (measured live on Reno: gsap 3.12.5 present,
 * ScrollTrigger present, 0 triggers). Inline <script> executes fine on these
 * sites, which is what makes this work.
 *
 * WRAPPED IN DOMContentLoaded, and that wrapper is load-bearing. `defer` is
 * IGNORED on an inline script, so without the wrapper this would execute
 * during parsing - BEFORE the deferred CDN libraries run - and the file's own
 * `if (!window.gsap || !window.ScrollTrigger) return;` guard would silently
 * bail. Deferred scripts are guaranteed to finish before DOMContentLoaded
 * fires, so listening for it restores the ordering the linked version had.
 *
 * Costs ~16 KB per page and loses cross-page caching for this file. That is
 * the price of the origin refusing to serve .js; revert to a plain
 * <script src> the day that rule is fixed.
 */
const SECTION_ANIM_JS = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'vendor', 'section-animations.js'),
  'utf8',
);
const ANIM_SCRIPTS = `<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" onerror="document.documentElement.classList.add('gsap-failed')"></script><script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" onerror="document.documentElement.classList.add('gsap-failed')"></script><script>document.addEventListener('DOMContentLoaded',function(){${SECTION_ANIM_JS}});</script>`;

/**
 * @param {object} args
 * @param {object} args.ctx        render context (business, design, ...)
 * @param {string} args.pathname
 * @param {string} args.title
 * @param {string} args.description
 * @param {string} args.body       inner HTML (header + main + footer are added here)
 * @param {string} [args.jsonLd]   concatenated JSON-LD scripts
 * @param {string} [args.ogImage]
 */
/**
 * Stop two adjacent sections painting the SAME background.
 *
 * Each section component decides its own tone independently, with no knowledge
 * of what ends up next to it in the final page order. When several in a row
 * each pick "no tone" they all fall through to the page background and merge
 * into one undifferentiated block - the reader cannot tell where one section
 * ends and the next begins. Measured across the 9 sites generated 2026-08-27:
 * 4 of them had runs of identical backgrounds, the worst being FOUR
 * consecutive page-background sections on Venice.
 *
 * This runs on the assembled body in renderDocument(), which is the one place
 * every page type passes through, so the guarantee holds for home, service,
 * area, topic, trust and legal pages alike rather than per-builder.
 *
 * Only PLAIN `.section` elements are ever changed - a section that already
 * declares a tone (--alt/--tint/--dark/--brand) or owns its background
 * (hero, cta-band, trustbar, brandbar) is left exactly as authored. The
 * injected tone is always chosen to differ from the previous section's.
 */
function toneOf(cls) {
  if (/section--alt/.test(cls)) return 'ALT';
  if (/section--tint/.test(cls)) return 'TINT';
  if (/section--dark/.test(cls)) return 'DARK';
  if (/section--brand/.test(cls)) return 'BRAND';
  if (/cta-band/.test(cls)) return 'CTABAND';
  // These two are classified by the colour they actually PAINT, not by what
  // they are. .trustbar fills --c-surface-alt (identical to section--alt) and
  // .brandbar fills --c-bg (identical to a page-background section). Treating
  // them as their own tones meant a section--alt directly under the trustbar
  // counted as "different" while rendering the exact same #e7ebf3 - invisible
  // only because a 1px hairline used to sit between them. With that hairline
  // gone the merge became visible, so the classifier has to match reality.
  if (/\btrustbar\b/.test(cls)) return 'ALT';
  if (/\bbrandbar\b/.test(cls)) return 'PAGE';
  // The cta-banner <section> is itself transparent, but it always renders a
  // filled or outlined .cta-banner__inner panel on top, so it reads as its own
  // band rather than merging with a plain section beside it. Treating it as
  // PAGE produced 17 false positives.
  if (/cta-banner/.test(cls)) return 'CTABANNER';
  if (/\bhero\b/.test(cls)) return 'HERO';
  return 'PAGE';
}

export function balanceSectionTones(html) {
  let prev = null;
  return String(html).replace(/<section class="([^"]*)"/g, (m, cls) => {
    const tone = toneOf(cls);
    const generic0 = /(^|\s)section(\s|$)/.test(cls)
      && !/section--dark|section--brand|cta-band|trustbar|brandbar|\bhero\b|cta-banner/.test(cls);
    // EVERY generic section is toned, not just the ones that repeat. Leaving
    // untoned sections at the page background made the page read washed out:
    // measured on Northbrook, 7 of 13 sections painted the near-white #fcfbfa,
    // which the user reported as "too much white blank space". There is no
    // dead space to remove - every section's slack was ~1px beyond its own
    // padding - so the fix is banding, not spacing.
    if (!generic0) { prev = tone; return m; }

    // Same background as the section above it. A generic .section may be
    // retoned whether it is currently plain, --alt or --tint - a run of three
    // --alt sections is just as unreadable as a run of three plain ones, and
    // an earlier version of this only rescued the plain case. Sections that
    // genuinely own their look (--dark, --brand, hero, cta-band, trustbar,
    // brandbar) are never touched.
    const generic = /(^|\s)section(\s|$)/.test(cls)
      && !/section--dark|section--brand|cta-band|trustbar|brandbar|\bhero\b/.test(cls);
    if (!generic) { prev = tone; return m; }

    const next = prev === 'ALT' ? 'TINT' : 'ALT';
    const stripped = cls.replace(/\s*section--(alt|tint)\b/g, '').trim();
    prev = next;
    return `<section class="${stripped} ${next === 'ALT' ? 'section--alt' : 'section--tint'}"`;
  });
}

export function renderDocument({ ctx, pathname, title, description, main, header, footer, mobileCta, jsonLd = '', ogImage }) {
  const { business, design } = ctx;
  const css = generateCss(design);
  const meta = headMeta({ business, pathname, title, description, ogImage });
  const langAttr = 'en';
  const favicon = faviconHref(ctx);

  const doc = `<!doctype html>
<html lang="${langAttr}" data-theme="${esc(design.mood)}" data-site="${esc(business.domain)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${esc(design.palette.primary)}">
<link rel="icon" href="${esc(favicon)}">
<link rel="shortcut icon" href="${esc(favicon)}">
${meta}
${fontsLink(design)}
${config.features.inlineCriticalCss ? `<style>${css}</style>` : `<link rel="stylesheet" href="/styles.css">`}
${jsonLd}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${header}
<main id="main">
${balanceSectionTones(main)}
</main>
${footer}
${mobileCta || ''}
${NAV_SCRIPT}
${config.features.sectionAnimations ? ANIM_SCRIPTS : ''}
</body>
</html>`;
  return config.features.minifyHtml ? minify(doc) : doc;
}

/** Conservative HTML minify: collapse inter-tag whitespace, keep it safe. */
function minify(html) {
  return html
    .replace(/\n\s*\n/g, '\n')
    .replace(/>\n\s+</g, '><')
    .trim();
}

export { generateCss };
export default renderDocument;
