#!/usr/bin/env node
/**
 * Drop loading="lazy" from the embedded quote form (and harden its give-up)
 * on an ALREADY-BUILT site, touching nothing else.
 *
 * THE BUG
 * LeadConnector's form_embed.js parks the form iframe at
 *   position:absolute; opacity:0; visibility:hidden; left:-9999px
 * the instant it runs, and only un-parks it once the form inside posts back
 * that it initialised. With loading="lazy" on that iframe, WebKit/Safari -
 * whose lazy-load is a plain viewport intersection test - never fetches a
 * frame parked at -9999px. It therefore never initialises, so it is never
 * un-parked, and quoteEmbed()'s own 20s give-up then strips the skeleton and
 * leaves an empty box the height of the form. Chromium masks this by refusing
 * to defer frames it judges hidden and fetching them anyway. Reported on
 * Safari 2026-09-06 against chicagogaragedoorco.com.
 *
 * WHY A PATCH INSTEAD OF A REGENERATION
 * Same reason as apply-quote-form.mjs: every built site is frozen, and a
 * rebuild would apply every engine change made since that site was signed off,
 * not just this one. This edits exactly one file per site,
 * request-a-quote/index.html, and inside it exactly one region: the
 * <div class="ghl-embed"> block plus the two <script> tags that follow it.
 *
 * NOT HAND-WRITTEN MARKUP. The replacement is produced by the engine's own
 * quoteEmbed(), re-using the form URL and --ghl-h height already present in
 * the page, so a patched page is byte-identical to what a rebuild would emit
 * and this script becomes a no-op once a site IS rebuilt for other reasons.
 *
 * Idempotent: a page whose embed is already eager is skipped.
 *
 *   node scripts/apply-quote-iframe-eager.mjs chicagogaragedoorco
 *   node scripts/apply-quote-iframe-eager.mjs --dry-run chicago
 *   node scripts/apply-quote-iframe-eager.mjs --audit        # report only, all sites
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { quoteEmbed } from '../src/components/index.js';

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ENGINE, 'dist');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const audit = args.includes('--audit');
const filters = args.filter((a) => !a.startsWith('--'));
if (!filters.length && !audit) {
  console.error('usage: node scripts/apply-quote-iframe-eager.mjs [--dry-run] <domain-substring> [...]');
  console.error('       node scripts/apply-quote-iframe-eager.mjs --audit');
  process.exit(1);
}

const EMBED_START = '<div class="ghl-embed"';
const SCRIPT_TAG = '<script src="https://link.msgsndr.com/js/form_embed.js" async></script>';

/** Locate the exact region quoteEmbed() emitted: the container plus both scripts. */
function locateRegion(html) {
  const start = html.indexOf(EMBED_START);
  if (start < 0) return null;
  const tag = html.indexOf(SCRIPT_TAG, start);
  if (tag < 0) return null;
  // The inline IIFE that follows. It contains no literal </script>, so the
  // first closing tag after it is its own.
  const inline = html.indexOf('<script>', tag + SCRIPT_TAG.length);
  if (inline < 0) return null;
  const end = html.indexOf('</script>', inline);
  if (end < 0) return null;
  return { start, end: end + '</script>'.length };
}

const dirs = fs.readdirSync(DIST)
  .filter((d) => fs.existsSync(path.join(DIST, d, 'request-a-quote', 'index.html')))
  .filter((d) => !filters.length || filters.some((f) => d.includes(f)))
  .sort();

if (filters.length) {
  for (const f of filters) {
    if (!dirs.some((d) => d.includes(f))) { console.error(`no built site matches "${f}"`); process.exit(1); }
  }
}

let patched = 0, skipped = 0, affected = 0;
for (const dir of dirs) {
  const file = path.join(DIST, dir, 'request-a-quote', 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const domain = dir.replace(/-[^-]*$/, '');

  const region = locateRegion(html);
  if (!region) { if (!audit) console.log(`  skip   ${domain.padEnd(38)} no real embed on this page`); skipped++; continue; }

  const block = html.slice(region.start, region.end);
  const isLazy = /<iframe[^>]*title="Request a quote"[^>]*loading="lazy"/.test(block);
  if (!isLazy) { if (!audit) console.log(`  ok     ${domain.padEnd(38)} already eager`); skipped++; continue; }
  affected++;
  if (audit) { console.log(`  AFFECTED  ${domain}`); continue; }

  // MINIMAL IN-PLACE EDIT, not a region swap.
  //
  // Swapping the whole .ghl-embed region for fresh quoteEmbed() output also
  // rewrites its WHITESPACE: pages built natively by the engine ship the block
  // minified onto a few long lines, while quoteEmbed() emits it multi-line, so
  // the swap produced a 19-line diff on those sites instead of the 2 real
  // changes (seen on daphnegaragedoorpros). The brief here is this issue and
  // nothing else, so edit the two exact strings and leave every other byte -
  // including the formatting - untouched.
  //
  // The full-region swap is kept below as a fallback for any page whose
  // anchors have drifted, and it is still checked against real engine output.
  const LAZY_ATTR = ' loading="lazy"';
  const OLD_GIVEUP = 'to=setTimeout(done,20000);';
  const NEW_GIVEUP = [
    '// LAST RESORT: if we are giving up because form_embed.js never un-parked',
    '      // the frame, un-park it ourselves. Plain done() only removes the',
    '      // skeleton, which left a blank box where the form should be - the exact',
    "      // thing the visitor reports as \"the form is not loading\".",
    "      var giveup=function(){if(!visible()){f.style.opacity='';f.style.visibility='';",
    "        f.style.pointerEvents='';f.style.left='';f.style.position='relative'}done()};",
    '      to=setTimeout(giveup,20000);',
  ].join('\n');

  const iframeTag = (block.match(/<iframe\b[^>]*title="Request a quote"[^>]*>/s) || [])[0];
  let out = null;
  if (iframeTag && iframeTag.includes(LAZY_ATTR) && block.includes(OLD_GIVEUP)) {
    const newBlock = block
      .replace(iframeTag, iframeTag.replace(LAZY_ATTR, ''))
      .replace(OLD_GIVEUP, NEW_GIVEUP);
    out = html.slice(0, region.start) + newBlock + html.slice(region.end);
  } else {
    // Fallback: rebuild the region from the engine, re-using this page's own
    // form url and height so nothing else changes.
    const url = (block.match(/<iframe src="([^"]+)"/) || [])[1];
    const h = Number((block.match(/--ghl-h:(\d+)px/) || [])[1]);
    if (!url || !h) { console.error(`  FAIL   ${domain}: could not read form url/height - not writing`); process.exitCode = 1; continue; }
    const fresh = quoteEmbed({ site: { ghlFormUrl: url, ghlFormHeight: h } });
    if (!fresh.includes(url) || !fresh.includes(`--ghl-h:${h}px`)
        || /loading="lazy"/.test(fresh) || !fresh.includes(SCRIPT_TAG) || !/giveup/.test(fresh)) {
      console.error(`  FAIL   ${domain}: engine output failed its own checks - not writing`);
      process.exitCode = 1; continue;
    }
    console.log(`  note   ${domain}: anchors drifted, rebuilt the region from the engine`);
    out = html.slice(0, region.start) + fresh + html.slice(region.end);
  }

  // Whichever path ran, the result must be eager, hardened, and must not have
  // disturbed anything else on the page.
  const checkRegion = locateRegion(out);
  const newBlock = out.slice(checkRegion.start, checkRegion.end);
  if (/<iframe[^>]*title="Request a quote"[^>]*loading="lazy"/s.test(newBlock)
      || !newBlock.includes('giveup')
      || out.length <= html.length
      || (out.match(/<iframe/g) || []).length !== (html.match(/<iframe/g) || []).length) {
    console.error(`  FAIL   ${domain}: post-edit checks failed - not writing`);
    process.exitCode = 1; continue;
  }
  if (dryRun) { console.log(`  would  ${domain.padEnd(38)} ${html.length} -> ${out.length} bytes`); patched++; continue; }
  fs.writeFileSync(file, out);
  console.log(`  patch  ${domain.padEnd(38)} ${html.length} -> ${out.length} bytes`);
  patched++;
}

if (audit) console.log(`\n${affected} of ${dirs.length} built site(s) still ship the lazy quote iframe.`);
else console.log(`\n${dryRun ? 'would patch' : 'patched'} ${patched}, skipped ${skipped}.`);
