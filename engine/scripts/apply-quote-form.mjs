#!/usr/bin/env node
/**
 * Swap the built-in fallback quote form for the real embedded lead form on an
 * ALREADY-BUILT site, touching nothing else.
 *
 * WHY THIS EXISTS INSTEAD OF A REGENERATION
 * The normal way to change a site is to fix the engine and rebuild. That is
 * wrong here: the 36 older sites were built across several days, and a rebuild
 * applies EVERY engine change since - new CTA backgrounds, the logo treatment,
 * nav rules, retired variants, the type-scale floor - to sites that are live
 * and were signed off as they are. The instruction was explicit: "just change
 * the form nothing else" (2026-08-30).
 *
 * So this edits exactly one file per site, request-a-quote/index.html, and
 * inside it exactly two things:
 *   1. the contents of <div class="quote-form-col"> -> the real embed
 *   2. the .ghl-* rules appended to that page's inlined <style>
 *
 * The markup comes from the engine's own quoteEmbed(), and the CSS from a real
 * generateCss() run, so neither can drift from what a future regeneration
 * would produce. config/quote-form.js already lists these domains, so once a
 * site IS rebuilt for other reasons it emits the same thing natively and this
 * script becomes a no-op for it.
 *
 * Idempotent: a page that already has the embed is skipped.
 *
 *   node scripts/apply-quote-form.mjs             # every listed domain in dist
 *   node scripts/apply-quote-form.mjs --dry-run
 *   node scripts/apply-quote-form.mjs dallas miami
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { quoteEmbed } from '../src/components/index.js';
import { generateCss } from '../src/design/css.js';
import { loadDataset } from '../src/data/load.js';
import { assignDesign } from '../src/engine/seed.js';
import { QUOTE_FORM_URL, QUOTE_FORM_DOMAINS } from '../config/quote-form.js';
import { siteContent } from '../config/site-content.js';

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ENGINE, 'dist');

/**
 * Every .ghl-* rule, taken as ONE CONTIGUOUS SLICE of real engine CSS.
 *
 * An earlier version matched rules individually with a regex and silently
 * captured only 6 of the 20 - it missed .ghl-embed__skeleton, every .ghl-sk
 * bar rule and the keyframes, so the patched skeleton rendered as unstyled
 * spans while the natively-built sites looked right. Selector-by-selector
 * regexing over minified CSS with comments in it is not reliable.
 *
 * These rules are authored as one block in css.js (see "Loading skeleton for
 * the third-party quote form"), so slicing from the first .ghl-embed rule to
 * the end of the reduced-motion rule takes all of them and nothing else. The
 * slice is verified by the caller before anything is written.
 */
const CSS_START = '.ghl-embed{';
const CSS_END = '@media (prefers-reduced-motion:reduce){.ghl-sk{animation:none}}';
function ghlCss() {
  const ds = loadDataset();
  const b = Object.values(ds.byDomain)[0];
  const css = generateCss(assignDesign(b, {}));
  const i = css.indexOf(CSS_START);
  const j = css.indexOf(CSS_END);
  if (i < 0 || j < 0 || j < i) return '';
  return css.slice(i, j + CSS_END.length);
}

/** Replace the inner HTML of <div class="quote-form-col"> ... </div>. */
function replaceFormCol(html, replacement) {
  const marker = '<div class="quote-form-col"';
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const open = html.indexOf('>', i) + 1;
  let depth = 1, j = open;
  const tag = /<div\b|<\/div>/g;
  tag.lastIndex = open;
  let m;
  while ((m = tag.exec(html))) {
    if (m[0] === '</div>') { depth--; if (depth === 0) { j = m.index; break; } }
    else depth++;
  }
  if (depth !== 0) return null;
  return html.slice(0, open) + replacement + html.slice(j);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));

const EMBED = quoteEmbed({
  site: { ghlFormUrl: QUOTE_FORM_URL, ghlFormHeight: siteContent.ghlFormHeight },
});
const CSS = ghlCss();
// Every selector the skeleton actually needs. Checked explicitly because the
// failure mode is SILENT: a partial slice still writes valid CSS and a valid
// page, it just renders an unstyled skeleton, which only shows up by eye.
const REQUIRED = [
  '.ghl-embed{', '.ghl-embed__skeleton{', '.ghl-embed.is-loading',
  '.ghl-sk{', '.ghl-sk--title', '.ghl-sk--label', '.ghl-sk--field',
  '.ghl-sk--area', '.ghl-sk--btn', '@keyframes ghl-sk-shimmer',
];
const absent = REQUIRED.filter((s) => !CSS.includes(s));
if (absent.length) {
  console.error(`extracted CSS is INCOMPLETE - missing: ${absent.join(', ')}`);
  console.error('Refusing to write a half-styled skeleton. Check CSS_START/CSS_END.');
  process.exit(1);
}
console.log(`embed markup: ${EMBED.length} bytes | ghl CSS: ${CSS.length} bytes (${REQUIRED.length}/${REQUIRED.length} required selectors present)`);

let patched = 0, skipped = 0, missing = 0;
for (const dir of fs.readdirSync(DIST)) {
  if (!/^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(dir)) continue;
  const domain = dir.replace(/^(.*?\.[a-z]{2,})(-.*)?$/, '$1');
  if (!QUOTE_FORM_DOMAINS.has(domain)) continue;
  if (filters.length && !filters.some((f) => dir.includes(f))) continue;

  const file = path.join(DIST, dir, 'request-a-quote', 'index.html');
  if (!fs.existsSync(file)) { console.log(`  no quote page: ${domain}`); missing++; continue; }
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('class="ghl-embed"')) { skipped++; continue; }

  const next = replaceFormCol(html, EMBED);
  if (!next) { console.log(`  could not locate .quote-form-col: ${domain}`); missing++; continue; }
  html = next;
  // Guard on .ghl-embed__skeleton, NOT .ghl-embed. The plain .ghl-embed rule
  // has been in css.js since long before the skeleton existed, so every older
  // page already has it - guarding on that skipped the injection entirely and
  // shipped 36 sites with an unstyled skeleton. The skeleton selector only
  // exists in the block being injected.
  // The appended block also intentionally RE-DECLARES .ghl-embed (it gained
  // position:relative and background:#fff); appending puts it after the stale
  // copy, so it wins on source order.
  if (!html.includes('.ghl-embed__skeleton{')) html = html.replace('</style>', CSS + '</style>');

  if (!dryRun) fs.writeFileSync(file, html);
  patched++;
}
console.log(`${dryRun ? '[dry-run] would patch' : 'patched'}: ${patched} | already had it: ${skipped} | problems: ${missing}`);
