/**
 * QA / Validation Engine.
 *
 * Runs automated checks over a generated site's HTML: SEO essentials,
 * accessibility basics, structural integrity, and a fabrication-claim scan.
 * Returns a pass/warn/fail breakdown and an overall QA status used by the
 * control sheet.
 *
 * Severity:
 *  - fail  : must-fix structural/SEO problems (missing title/h1/canonical, etc.)
 *  - warn  : worth a human look (e.g. a claim phrase that must be data-backed)
 *  - pass  : ok
 */

import fs from 'node:fs';
import { contrast } from '../util/color.js';
import { generateCss } from '../design/css.js';

/**
 * Resolve the color the stylesheet gives element `.el` inside a `.section--band`
 * context: a band-scoped rule wins over the base rule (higher specificity). Then
 * extract the first `var(--c-*)` (color-mix's dominant color) so we can map it to
 * a palette value. Returns the token name (e.g. 'c-muted') or null.
 */
function bandTextToken(css, band, el) {
  const rules = css.split('}');
  let base = null, scoped = null;
  for (const r of rules) {
    const bi = r.indexOf('{');
    if (bi < 0) continue;
    const sel = r.slice(0, bi), body = r.slice(bi + 1);
    const cm = /(?:^|;|\s)color:\s*([^;]+)/.exec(body);
    if (!cm) continue;
    // Resolve to a palette token name, or 'INHERIT' for currentColor/inherit
    // (element follows the section's own color, which is checked separately).
    const val = cm[1];
    let color = (/var\(--(c-[a-z0-9-]+)\)/.exec(val) || [])[1];
    if (!color && /currentcolor|inherit/i.test(val)) color = 'INHERIT';
    if (!color) continue; // literal / unresolvable
    for (const s of sel.split(',').map((x) => x.trim())) {
      if (s.includes(`.section--${band}`) && s.includes(`.${el}`)) scoped = color;
      else if (new RegExp(`\\.${el}(?![\\w-])`).test(s) && !s.includes('.section--')) base = color;
    }
  }
  return scoped || base; // 'INHERIT' → tok[] undefined → skipped as safe
}

// Phrases that would be fabricated claims if not backed by real data. The
// engine's own fallback copy never uses these; occurrences almost always come
// from approved rich content and are surfaced as warnings for human review.
const CLAIM_PHRASES = [
  '24/7', '24-7', 'same day', 'same-day', 'licensed', 'insured', 'bonded',
  'family owned', 'family-owned', 'years of experience', 'years in business',
  'free estimate', 'free quote', 'financing', 'warranty', 'guaranteed',
  'bbb', 'award-winning', 'award winning', 'certified', 'voted best',
];

function countMatches(html, re) {
  const m = html.match(re);
  return m ? m.length : 0;
}

/**
 * @param {object} args
 * @param {import('../data/model.js').Business} args.business
 * @param {object} args.design
 * @param {Array<{pathname:string,file?:string,html?:string}>} args.pages
 */
export function validateSite({ business, design, pages }) {
  const checks = [];
  const add = (id, sev, ok, detail) => checks.push({ id, sev, ok, detail });

  // Load home HTML (first page).
  const homeEntry = pages.find((p) => p.pathname === '/') || pages[0];
  const readHtml = (p) => p.html || (p.file && fs.existsSync(p.file) ? fs.readFileSync(p.file, 'utf8') : '');
  const home = readHtml(homeEntry);

  // --- SEO ---
  const title = (/<title>([\s\S]*?)<\/title>/.exec(home) || [])[1] || '';
  add('seo.title', 'fail', title.length > 0 && title.length <= 65, `title "${title.slice(0, 40)}…" (${title.length} chars)`);
  const descM = /<meta name="description" content="([\s\S]*?)">/.exec(home);
  const descLen = descM ? descM[1].length : 0;
  add('seo.description', 'fail', descLen >= 40 && descLen <= 165, `meta description ${descLen} chars`);
  add('seo.canonical', 'fail', /<link rel="canonical"/.test(home), 'canonical link');
  add('seo.og', 'warn', /property="og:title"/.test(home), 'Open Graph tags');
  add('seo.jsonld', 'warn', /application\/ld\+json/.test(home), 'JSON-LD structured data');

  // --- Structure / a11y ---
  const h1s = countMatches(home, /<h1[\s>]/g);
  add('a11y.singleH1', 'fail', h1s === 1, `${h1s} <h1> element(s)`);
  add('a11y.viewport', 'fail', /name="viewport"/.test(home), 'viewport meta');
  add('a11y.skipLink', 'warn', /skip-link/.test(home), 'skip-to-content link');
  add('a11y.lang', 'fail', /<html lang="/.test(home), 'html lang attribute');
  // Images missing alt (real <img> only).
  const imgs = home.match(/<img\b[^>]*>/g) || [];
  const imgsNoAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  add('a11y.imgAlt', 'fail', imgsNoAlt === 0, `${imgsNoAlt}/${imgs.length} <img> missing alt`);

  // --- Conversion / mobile ---
  add('cvr.mobileCta', 'warn', /mobile-cta/.test(home), 'sticky mobile CTA');
  add('cvr.contact', 'warn', pages.some((p) => p.pathname === '/contact/'), 'contact page');

  // --- Contrast: every palette token pair that carries TEXT must meet WCAG AA
  // (4.5:1). This is the engine-level guard - if a section uses a token pair,
  // it's checked here regardless of theme/brand color. ---
  const p = design.palette;
  const PAIRS = [
    ['text/bg', p.text, p.bg], ['text/surface', p.text, p.surface], ['text/surfaceAlt', p.text, p.surfaceAlt],
    ['muted/bg', p.mutedText, p.bg], ['muted/surface', p.mutedText, p.surface], ['muted/surfaceAlt', p.mutedText, p.surfaceAlt],
    ['onPrimary/primary', p.onPrimary, p.primary], ['onPrimary/gradBandEnd', p.onPrimary, p.gradBandEnd],
    ['onSecondary/secondary', p.onSecondary, p.secondary], ['onEmergency/emergency', p.onEmergency, p.emergency],
    ['link/bg', p.link, p.bg], ['link/surface', p.link, p.surface], ['link/surfaceAlt', p.link, p.surfaceAlt],
  ];
  const cFails = PAIRS.map(([n, fg, bg]) => [n, contrast(fg, bg)]).filter(([, r]) => r < 4.5);
  add('a11y.contrast', 'fail', cFails.length === 0,
    cFails.length ? `low-contrast text pairs: ${cFails.map(([n, r]) => `${n} ${r.toFixed(2)}:1`).join(', ')}` : `all ${PAIRS.length} text/background pairs ≥ 4.5:1`);

  // Band text: resolve the ACTUAL color the stylesheet gives text inside the
  // gradient/secondary bands and check it against the band background. Catches a
  // text element that falls back to a dark token (e.g. --c-muted) on a brand band
  // because a band override was missing - which a solid-token pair check misses.
  const css = generateCss(design);
  const tok = {
    'c-primary': p.primary, 'c-secondary': p.secondary, 'c-accent': p.accent, 'c-bg': p.bg,
    'c-surface': p.surface, 'c-surface-alt': p.surfaceAlt, 'c-text': p.text, 'c-muted': p.mutedText,
    'c-on-primary': p.onPrimary, 'c-on-secondary': p.onSecondary, 'c-on-accent': p.onAccent,
    'c-on-emergency': p.onEmergency, 'c-link': p.link, 'c-tint': p.tint, 'c-emergency': p.emergency,
  };
  const BANDS = [
    { band: 'brand', bgs: [p.primary, p.gradBandEnd] }, // grad-band endpoints (contrast-safe)
    { band: 'dark', bgs: [p.secondary] },
  ];
  const BAND_ELS = ['stat__l', 'stat__n', 'lead', 'eyebrow', 'section-title'];
  const bandFails = [];
  for (const { band, bgs } of BANDS) {
    for (const el of BAND_ELS) {
      const t = bandTextToken(css, band, el);
      const fg = t && tok[t];
      if (!fg) continue; // inherits section color (safe) or unresolved
      const r = Math.min(...bgs.map((bg) => contrast(fg, bg)));
      if (r < 4.5) bandFails.push(`${band}/.${el}→${t} ${r.toFixed(2)}:1`);
    }
  }
  add('a11y.bandContrast', 'fail', bandFails.length === 0,
    bandFails.length ? `low-contrast text on brand/dark bands: ${bandFails.join(', ')}` : 'band text (stats, leads) readable on gradient/dark bands');

  // --- Layout: no un-centered max-width container. A block with
  // max-width:Nrem/px but no margin-inline:auto LEFT-ALIGNS inside its
  // full-width parent instead of centering - the exact bug that put a
  // half-viewport blank gap next to a "What we do" services list
  // (2026-08-20). `ch`-unit caps are exempt - those are always a
  // legitimate text-reading-width cap on left-aligned copy (e.g.
  // .hero__sub, .section-head), never a container meant to center. A
  // handful of selectors are legitimately centered by their PARENT's own
  // flex/grid alignment (not their own margin) - allowlisted below since a
  // static per-rule regex can't see the parent; re-verify by hand before
  // adding more entries rather than widening the match to hide real bugs. */
  const SAFE_UNCENTERED_MAXWIDTH = [
    '.trust-item', '.footer-grid>div', '.footer-grid > div', '.brandbar__row', '.cta-banner__text',
    '.sfoot__logo .brand__mark--logo', // logo <img> inside an inline-flex link: sized, not a centred block
    '.emergency-band__copy', '.section-head', '.hero__sub', '.cov-generic__head', '.svc-g__body',
    // .faq and .feat-rows are always nested inside a 2-col split
    // (.faq-split / .why-split) that already positions them - verified by
    // reading faq()/why() in components/index.js, not assumed.
    '.faq', '.feat-rows',
  ];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  const orphanRules = [];
  let rm;
  while ((rm = ruleRe.exec(css))) {
    const [, selRaw, body] = rm;
    if (!/max-width\s*:\s*[\d.]+(rem|px)\b/.test(body)) continue;
    if (/margin-inline\s*:\s*auto/.test(body) || /margin\s*:\s*[^;]*auto/.test(body)) continue;
    const sels = selRaw.split(',').map((s) => s.trim());
    if (sels.some((s) => SAFE_UNCENTERED_MAXWIDTH.some((safe) => s.includes(safe)))) continue;
    orphanRules.push(sels[0]);
  }
  add('layout.noOrphanMaxWidth', 'warn', orphanRules.length === 0,
    orphanRules.length
      ? `max-width block(s) likely missing margin-inline:auto (left-aligns, leaving blank space on the other side): ${orphanRules.slice(0, 6).join(', ')}${orphanRules.length > 6 ? '…' : ''}`
      : 'every rem/px max-width container centers itself');

  // --- Layout: no space-between on a row of small/sparse items. Confirmed
  // real bug (2026-08-20): hero__stats--ledger-rows put icon+number+label
  // (~260px of actual content) in a row up to 60rem wide with
  // justify-content:space-between, which stretched the gaps between them
  // to ~350px each - technically correct flex behavior, but reads as a
  // data point torn apart across empty space. space-between is the right
  // tool ONLY for a small number of genuinely substantial/wide children
  // (e.g. a copy block + a button - see emergency-band__row, cta-bar);
  // it's the wrong tool for a row of short icon+text items. New rules are
  // WARN until manually verified (by rendering + measuring actual gaps,
  // not just reading the CSS) and added to this allowlist. */
  const SAFE_SPACE_BETWEEN = [
    '.nav', '.util-bar .container', '.cta-bar', '.cta-banner__inner', '.footer__legal', '.sfoot__bar',
    '.announce .container', '.trustbar--minimal-text-row .container', '.emergency-band__row',
    '.faq summary',
  ];
  const spaceBetweenRules = [];
  const sbRuleRe = /([^{}]+)\{([^{}]*)\}/g;
  let sbm;
  while ((sbm = sbRuleRe.exec(css))) {
    const [, selRaw, body] = sbm;
    if (!/justify-content\s*:\s*space-between/.test(body)) continue;
    const sels = selRaw.split(',').map((s) => s.trim());
    if (sels.some((s) => SAFE_SPACE_BETWEEN.some((safe) => s.includes(safe)))) continue;
    spaceBetweenRules.push(sels[0]);
  }
  add('layout.noSparseSpaceBetween', 'warn', spaceBetweenRules.length === 0,
    spaceBetweenRules.length
      ? `justify-content:space-between on unreviewed selector(s) - verify by rendering + measuring actual gaps, not just reading the CSS: ${spaceBetweenRules.slice(0, 6).join(', ')}${spaceBetweenRules.length > 6 ? '…' : ''}`
      : 'every space-between row is a reviewed, substantial-content case');

  // --- Layout: no width:100% forced on an item that's normally
  // content-sized. Confirmed real bug (2026-08-20): .trust-item is
  // display:inline-flex (sizes to its own icon+text) by default;
  // trustbar--ledger-rows set width:100% on it to make a full-width
  // divider row, but nothing inside grows to fill that width - the icon
  // and text stayed at the left with a large blank gap to the right (a
  // different root cause from the space-between case above, same visual
  // symptom). New rules are WARN until manually verified and allowlisted. */
  const SAFE_WIDTH_100 = [
    '.footer-grid', '.sidebar', '.side-areas', '.gallery--stacked-list', '.hero__grid',
    '.mobile-cta', '.cta-banner__inner', '.emergency-band__cta',
    // CSS multi-column layouts: width:100% means "fill this column" (a
    // narrow ~1/N share), not "fill the row" - verified by rendering.
    // '.trustbar--split-duotone' was allowlisted here on that reasoning and it
    // was WRONG: measured 2026-08-25 in the section catalog, its .trust-item
    // renders a 559px box holding ~65px of label - 442px of dead space on one
    // side, 28px on the other. The variant is now retired from
    // SECTION_POOLS.trustbar entirely, so this entry is gone rather than
    // silencing the check that was correctly complaining. Before adding
    // anything here, MEASURE the item's ink extent against its box width in a
    // real render - "it's a column so it's fine" is not verification.
    '.brandbar--split-duotone',
    // Mobile-only (max-width:640px) stacks where the parent also switches
    // to flex-direction:column in the same media query - items are meant
    // to go full-width there, verified by reading the paired rule.
    '.trustbar--divider-line-row', '.brandbar--alternating-tint',
  ];
  const COMPACT_ITEM_CLASSES = ['.trust-item', '.hstat', '.brand-chip', '.area-chip', '.rev-badge', '.style-filter__pill'];
  const stretchedItemRules = [];
  const w100RuleRe = /([^{}]+)\{([^{}]*)\}/g;
  let w100m;
  while ((w100m = w100RuleRe.exec(css))) {
    const [, selRaw, body] = w100m;
    if (!/(?:^|[^-])width\s*:\s*100%/.test(body)) continue;
    const sels = selRaw.split(',').map((s) => s.trim());
    if (sels.some((s) => SAFE_WIDTH_100.some((safe) => s.includes(safe)))) continue;
    for (const s of sels) {
      if (COMPACT_ITEM_CLASSES.some((c) => s.includes(c))) stretchedItemRules.push(s);
    }
  }
  add('layout.noStretchedCompactItem', 'warn', stretchedItemRules.length === 0,
    stretchedItemRules.length
      ? `width:100% forced on a normally content-sized item - verify content actually fills the row (icon/text can stay stuck at one edge otherwise): ${stretchedItemRules.slice(0, 6).join(', ')}${stretchedItemRules.length > 6 ? '…' : ''}`
      : 'no compact item (trust-item, hstat, chip, …) is force-stretched');

  // --- Layout: a `left:50%` + `transform:translateX(N%)` pair is the
  // standard idiom for centering an absolutely-positioned box - N must be
  // exactly -50%. Confirmed real bug (2026-08-24): the CTA band's
  // decorative frame used translateX(-45%), a plain wrong number that
  // doesn't error or warn visually at a narrow test viewport (the drift is
  // a few px there) but grows with the element's own width and becomes
  // visibly off-center at a real desktop screen - exactly the kind of
  // "looks fine in a quick check, wrong on the user's actual monitor" bug
  // this checklist exists to catch automatically instead of by chance. */
  const centerRuleRe = /([^{}]+)\{([^{}]*)\}/g;
  const offCenterRules = [];
  let ctm;
  while ((ctm = centerRuleRe.exec(css))) {
    const [, selRaw, body] = ctm;
    if (!/left\s*:\s*50%/.test(body)) continue;
    const txm = /transform\s*:[^;]*translateX\(\s*(-?[\d.]+)%\s*\)/.exec(body);
    if (!txm) continue;
    if (Math.abs(parseFloat(txm[1]) - -50) < 0.01) continue; // correct
    offCenterRules.push(`${selRaw.trim().split(',')[0]} (translateX(${txm[1]}%), should be -50%)`);
  }
  add('layout.centeredTransformCorrect', 'fail', offCenterRules.length === 0,
    offCenterRules.length
      ? `left:50% paired with a translateX() that isn't -50% (off-center, worse at wider viewports): ${offCenterRules.slice(0, 6).join(', ')}`
      : 'every left:50%+translateX() pair centers correctly');

  // --- Content design: flag plain-text-only prose sections. Confirmed real
  // complaint (2026-08-24): real authored content sections (Service Areas
  // hub, Contact, FAQ, Quote pages) rendered as 2-3 sections in a row, each
  // just paragraphs of text with no visual break - "not a proper design,"
  // reported independently on two different sites. contentSections()/
  // contentProse() now rotate through genuinely different per-section
  // templates (photo+text, bordered icon card, lede emphasis, ...) so no
  // two adjacent sections share the same treatment by construction - this
  // check catches the two ways that could regress: (a) the SAME class
  // repeated on two adjacent sections (the exact bug reported - one
  // template applied uniformly down the page again), and (b) a fully
  // unmodified `.prose`/`.prose-block` with no named treatment at all and
  // 2+ paragraphs (the "just default paragraphs, zero design" case). Does
  // NOT flag a single named-but-photo-less treatment like `.prose--lede`
  // in isolation - that's a legitimate typographic design choice, not a
  // bug, and flagging it would just be noise on every generation. Heuristic
  // regex scan (this file only ever does string scanning, zero deps), not
  // a full DOM parse - fine for a warn-level design-review flag.
  const plainTextIssues = [];
  for (const pg of pages) {
    const html = readHtml(pg);
    if (!html) continue;
    const blockRe = /class="(prose(?:-block)?(?: prose(?:-block)?--[\w-]+)*)"/g;
    const found = [];
    let bm;
    while ((bm = blockRe.exec(html))) {
      const cls = bm[1];
      const chunk = html.slice(bm.index, Math.min(html.length, bm.index + 600));
      const pCount = (chunk.match(/<p[\s>]/g) || []).length;
      found.push({ cls, pCount });
    }
    for (let i = 0; i < found.length; i++) {
      const bare = (found[i].cls === 'prose' || found[i].cls === 'prose-block') && found[i].pCount >= 2;
      if (bare) plainTextIssues.push(`${pg.pathname}: unmodified "${found[i].cls}" with ${found[i].pCount} paragraphs, no named treatment`);
      if (i > 0 && found[i].cls === found[i - 1].cls) {
        plainTextIssues.push(`${pg.pathname}: two adjacent sections both "${found[i].cls}" (same template repeated back-to-back)`);
      }
    }
  }
  add('content.plainTextSections', 'warn', plainTextIssues.length === 0,
    plainTextIssues.length
      ? `plain/repeated content section(s) - flag for design review: ${plainTextIssues.slice(0, 6).join('; ')}${plainTextIssues.length > 6 ? '…' : ''}`
      : 'no repeated or fully-unstyled content sections');

  // --- Fabrication-claim scan across all pages ---
  const found = new Set();
  for (const pg of pages) {
    const html = (readHtml(pg) || '').toLowerCase();
    // Strip tags to reduce false hits inside attributes/URLs.
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const phrase of CLAIM_PHRASES) {
      if (text.includes(phrase)) found.add(phrase);
    }
  }
  add('data.noFabrication', found.size ? 'warn' : 'pass', found.size === 0,
    found.size ? `claim phrases present (verify backed by data): ${[...found].join(', ')}` : 'no unbacked claim phrases');

  // --- Dead links + image integrity (across all pages) ---
  // Both sides are compared with any trailing slash STRIPPED. Content-declared
  // service URLs carry no trailing slash while every other page type does
  // (see content/adapter.js), and both forms resolve to the same
  // `<path>/index.html`. Normalizing only the LINK - which is what this check
  // used to do - reported every service page on such a site as a dead link.
  const norm = (p) => String(p).replace(/\/+$/, '') || '/';
  const pagePaths = new Set(pages.map((p) => norm(p.pathname)));
  const deadLinks = new Set();
  let dupImgPages = 0, emptySrcPages = 0;
  const dupImgExamples = [];
  for (const pg of pages) {
    const html = readHtml(pg);
    // internal links must resolve to a generated page
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      let h = m[1];
      if (!h || h.startsWith('#') || h.startsWith('tel:') || h.startsWith('mailto:') || /^https?:/.test(h) || h.startsWith('data:')) continue;
      h = h.split('#')[0].split('?')[0];
      if (!h.startsWith('/')) continue;
      if (/\.[a-z0-9]+$/i.test(h)) continue; // asset file (sitemap.xml, robots.txt)
      if (!pagePaths.has(norm(h))) deadLinks.add(h);
    }
    // images: no empty src, no duplicate CONTENT photo on the same page.
    // The brand logo legitimately repeats (header + footer) - it's site
    // chrome, not a content photo, so it's excluded here rather than
    // flagging every single page as a false "repeats a photo" positive.
    const imgTags = html.match(/<img\b[^>]*>/g) || [];
    const srcs = imgTags.map((t) => (/\bsrc="([^"]*)"/.exec(t) || [])[1]).filter((s) => s !== undefined);
    if (srcs.some((s) => !s.trim())) emptySrcPages++;
    const contentBases = imgTags
      .filter((t) => !/\bclass="[^"]*brand__mark--logo/.test(t))
      .map((t) => (/\bsrc="([^"]*)"/.exec(t) || [])[1])
      .filter(Boolean)
      .map((s) => s.split('?')[0]);
    const seen = new Set(); let hasDup = false; let dupSrc = null;
    for (const b of contentBases) { if (seen.has(b)) { hasDup = true; dupSrc = b; } else seen.add(b); }
    if (hasDup) { dupImgPages++; if (dupImgExamples.length < 5) dupImgExamples.push(`${pg.pathname}${dupSrc}`); }
  }
  add('links.noDead', 'fail', deadLinks.size === 0, deadLinks.size ? `dead internal links: ${[...deadLinks].slice(0, 6).join(', ')}${deadLinks.size > 6 ? '…' : ''}` : 'all internal links resolve');
  add('img.hasSrc', 'fail', emptySrcPages === 0, emptySrcPages ? `${emptySrcPages} page(s) with an empty <img> src` : 'all images have a src');
  add('img.noDuplicate', 'warn', dupImgPages === 0,
    dupImgPages ? `${dupImgPages} page(s) repeat a content photo (excludes the logo, which legitimately repeats): ${dupImgExamples.join(', ')}` : 'no duplicate content photos within a page');

  // --- Redundant sections: no page should repeat a section id (e.g. two
  // id="services") or stack more than one CTA band. ---
  let dupSecPages = 0, multiCtaPages = 0;
  const dupExample = [];
  for (const pg of pages) {
    const html = readHtml(pg);
    const ids = [...html.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    const seenId = new Set(); let dup = false;
    for (const id of ids) { if (seenId.has(id)) { dup = true; if (dupExample.length < 4) dupExample.push(`${pg.pathname}#${id}`); } else seenId.add(id); }
    if (dup) dupSecPages++;
    if ((html.match(/class="section cta-band"/g) || []).length > 1) multiCtaPages++;
  }
  add('structure.noDupSection', 'fail', dupSecPages === 0, dupSecPages ? `${dupSecPages} page(s) repeat a section: ${dupExample.join(', ')}` : 'no repeated sections on a page');
  add('structure.noRedundantCta', 'fail', multiCtaPages === 0, multiCtaPages ? `${multiCtaPages} page(s) stack >1 CTA band` : 'single CTA band per page');

  // --- SEO files ---
  add('seo.sitemap', 'warn', pages.length > 0, `${pages.length} pages`);

  const fails = checks.filter((c) => !c.ok && c.sev === 'fail');
  const warns = checks.filter((c) => !c.ok && c.sev === 'warn');
  const status = fails.length ? 'FAIL' : warns.length ? 'WARN' : 'PASS';
  return { status, fails: fails.length, warns: warns.length, checks };
}

export default validateSite;
