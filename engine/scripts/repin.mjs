#!/usr/bin/env node
/**
 * Regenerate one or more sites with EVERY variant axis frozen to what the
 * design registry already records for them.
 *
 * This is the tool for the main workflow ("fix this section on site X"): a
 * variant fix lives in css.js, but seeing it - and shipping it - needs the
 * affected sites rebuilt. A plain `cli.js --business` rebuild re-rolls every
 * un-pinned axis, so a one-line CSS fix can silently redesign the site
 * (documented in CLAUDE.md: the Raleigh footer fix also moved 28 pages onto a
 * different hero). Pinning all 21 axes makes the rebuild a pure no-op except
 * for the engine change being shipped.
 *
 * It reads dist/_reports/design-registry.json and rebuilds the pin JSON from
 * the stored fingerprint, so it always reflects what was actually built - no
 * hand-maintained list to drift.
 *
 *   node scripts/repin.mjs danapoint brownsville      # substring match
 *   node scripts/repin.mjs --print danapoint          # show pins, build nothing
 *
 * NOT a content re-pull and NOT the assignment pipeline - it never touches
 * contents/, the sheet, or git. Use generate-assignment.mjs for a new batch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SECTION_AXES } from '../src/engine/variation.js';

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = path.join(ENGINE, 'dist', '_reports', 'design-registry.json');

// fingerprint key -> design.variants key. `cta` is the only axis whose two
// names diverge (`ctaStyle` on variants/POOLS) - same map as PRIMARY_AXES in
// src/engine/uniqueness.js, kept in sync by hand because that one is private.
const PRIMARY = {
  hero: 'hero', nav: 'nav', serviceCard: 'serviceCard', reviewCard: 'reviewCard',
  gallery: 'gallery', footer: 'footer', cta: 'ctaStyle',
};

function pinsFor(entry, skip = new Set()) {
  const fp = entry.fingerprint || {};
  const pins = {};
  for (const [fpKey, vKey] of Object.entries(PRIMARY)) {
    if (fp[fpKey] && !skip.has(vKey) && !skip.has(fpKey)) pins[vKey] = fp[fpKey];
  }
  // `sections` is a pipe-joined string in SECTION_AXES order - positional, so
  // it must be split against that exact array, never re-ordered.
  const parts = String(fp.sections || '').split('|');
  const sectionVariants = {};
  SECTION_AXES.forEach((axis, i) => { if (parts[i] && !skip.has(axis)) sectionVariants[axis] = parts[i]; });
  if (Object.keys(sectionVariants).length) pins.sectionVariants = sectionVariants;
  return pins;
}

/**
 * EVERY BUILT SITE IS FROZEN - all 73 of them (see CLAUDE.md).
 *
 * Was the original 16; the 20 from the 27 August batch were pushed to their
 * own repos' main branch that same day, and the user then extended the freeze
 * to cover everything: "all previous 36 are in production, frozen those site
 * without my command dont change those sites" (2026-08-27).
 *
 * Extended to 73 on 2026-09-01 - "frozen all sites" - which folded in the
 * 1 September batch of 7. Those 7 are frozen WITHOUT being live: checked
 * against the remotes, they carry only content + main, no production branch
 * and no deploy run. So FROZEN no longer implies "serving traffic" - 66 are
 * live, 7 are handed over and awaiting a production PR. Check the remote for a
 * production branch before telling anyone a frozen domain is live; an earlier
 * claim here got that backwards in BOTH directions by reasoning from what this
 * session had pushed instead of querying GitHub.
 *
 * Extended to 66 on 2026-09-01 - "frozen previous all sites". That folded in
 * the 31 August batch of 10, which went LIVE on 2026-08-31: all ten carry a
 * production branch with production == main and a successful build-and-upload,
 * verified against the remotes. (A first pass here claimed they were frozen but
 * not deployed - that was inferred from this session's own push activity rather
 * than checked, and it was wrong. Check the remote for a production branch;
 * never infer deployment from what you remember pushing.)
 *
 * Extended to all 56 on 2026-08-31 - "previous generate 56 sites now
 * needs to frozen" - after the 30 August batch was merged to `production` and
 * deployed. Those 20 had been sitting in the registry UNFROZEN for four days
 * while already live, which is precisely the window this guard exists to
 * close: `production == main` on all 56 was verified that day, so every one of
 * them is now serving real traffic.
 *
 * Regenerating one rewrites its working tree. Nothing is committed or pushed
 * by this script, but a frozen site must not be rebuilt without a per-site
 * instruction. The guard exists because that happened by accident to Kansas
 * City and Fort Lauderdale on 2026-08-27 - both were restored with
 * `git checkout -- .`, and only because their repos happened to be clean.
 * Now that every site has real commits, an unnoticed rebuild is far more
 * costly, so the list is the whole registry.
 *
 * Keep this in sync when a NEW batch is generated: sites are safe to rebuild
 * freely until they ship, then they belong here.
 * Pass --allow-frozen to override, deliberately, when a fix IS authorized.
 */
const FROZEN = new Set([
  'abilenegaragedoorpros.com', 'albuquerquegaragedoorco.com',
  'arvadagaragedoorpros.com', 'auburngaragedoorpros.com',
  'brownsvillegaragedoorpros.com', 'burbankgaragedoorpros.com',
  'chaskagaragedoorpros.com', 'cheyennegaragedoorpros.com',
  'chicagogaragedoorco.com', 'coloradospringsgaragedoorpros.com',
  'dallasdoorpros.com', 'danapointgaragedoorco.com',
  'daphnegaragedoorpros.com', 'duncanvillegaragedoorpros.com',
  'fortlauderdalegaragedoorpros.com', 'garlandgaragedoorpros.com',
  'godenvergaragedoor.com', 'hanfordgaragedoorpros.com',
  'hesperiagaragedoorpros.com', 'hugogaragedoorpros.com',
  'humblegaragedoorpros.com', 'idahofallsgaragedoorpros.com',
  'irvinggaragedoorpros.com', 'jacksonvillegaragedoorco.com',
  'kansascitygaragedoorco.com', 'kansascitygaragedoorpros.com',
  'lascrucesgaragedoorpros.com', 'lincolnwoodgaragedoorpros.com',
  'livoniagaragedoorpros.com', 'lodigaragedoorpros.com',
  'longmontgaragedoorpros.com', 'lovelandgaragedoorpros.com',
  'madisongaragedoorco.com', 'manhattanbeachgaragedoorpros.com',
  'martinsburggaragedoorpros.com', 'marysvillegaragedoorpros.com',
  'matthewsgaragedoorpros.com', 'mckinneygaragedoorco.com',
  'miamigaragedoorco.com', 'mortongrovegaragedoorpros.com',
  'mundeleingaragedoorpros.com', 'murfreesborogaragedoorco.com',
  'newarkgaragedoorpros.com', 'northbrookgaragedoorpros.com',
  'oremgaragedoorpros.com', 'orlandogaragedoorpros.com',
  'parmagaragedoorpros.com', 'pasadenagaragedoorpros.com',
  'paysongaragedoorpros.com', 'petalumagaragedoorpros.com',
  'philadelphiagaragedoorpros.com', 'phoenixgaragedoorco.com',
  'pittsburghgaragedoorpros.com', 'porthurongaragedoorpros.com',
  'prospergaragedoorpros.com', 'raleighgaragedoorco.com',
  'renogaragedoorpros.com', 'reynoldsburggaragedoorpros.com',
  'sandiegogaragedoorco.com', 'sanmarcosgaragedoorpros.com',
  'santamonicagaragedoorpros.com', 'searcygaragedoorpros.com',
  'spanishforkgaragedoorpros.com', 'springfieldgaragedoorpros.com',
  'strongsvillegaragedoorpros.com', 'sunprairiegaragedoorpros.com',
  'tomsrivergaragedoorpros.com', 'tracygaragedoorpros.com',
  'venicegaragedoorpros.com', 'vernonhillsgaragedoorpros.com',
  'weatherfordgaragedoorpros.com', 'wenatcheegaragedoorpros.com',
  'youngstowngaragedoorpros.com',
]);

const args = process.argv.slice(2);
const printOnly = args.includes('--print');
const allowFrozen = args.includes('--allow-frozen');
/**
 * --except <axis>[,<axis>]  leave those axes UNPINNED so they re-roll.
 *
 * Needed when a variant is RETIRED: the registry still records the retired key
 * for sites that used it, and pinning bypasses the pool, so a plain repin
 * would force a variant whose CSS and render branch no longer exist. Excluding
 * the axis lets the engine pick a current one, and the registry is rewritten
 * with whatever it picks.
 */
const exceptIdx = args.indexOf('--except');
const except = new Set(exceptIdx >= 0 && args[exceptIdx + 1]
  ? args[exceptIdx + 1].split(',').map((s) => s.trim()).filter(Boolean) : []);
// Guard the exceptIdx >= 0 case explicitly. Without it, a missing --except
// gives exceptIdx = -1, so `i !== exceptIdx + 1` becomes `i !== 0` and
// silently drops the FIRST domain argument - a single-domain run then looks
// like no arguments at all, and a multi-domain run quietly skips one site.
const valueIdx = exceptIdx >= 0 ? exceptIdx + 1 : -1;
const filters = args.filter((a, i) => !a.startsWith('--') && i !== valueIdx);
if (!filters.length) {
  console.error('usage: node scripts/repin.mjs [--print] <domain-substring> [...]');
  process.exit(1);
}

const byDomain = JSON.parse(fs.readFileSync(REGISTRY, 'utf8')).byDomain;
const matched = [];
for (const f of filters) {
  const hits = Object.keys(byDomain).filter((d) => d.includes(f));
  if (!hits.length) { console.error(`no registry entry matches "${f}"`); process.exit(1); }
  if (hits.length > 1) { console.error(`"${f}" is ambiguous: ${hits.join(', ')}`); process.exit(1); }
  matched.push(hits[0]);
}

const frozenHits = matched.filter((d) => FROZEN.has(d));
if (frozenHits.length && !allowFrozen && !printOnly) {
  console.error(`REFUSING - these sites are FROZEN (handed over; most are live in production):\n  ${frozenHits.join('\n  ')}`);
  console.error('\nThey must not be rebuilt without a per-site instruction. If a fix IS');
  console.error('authorized for them, re-run with --allow-frozen and follow the PR flow.');
  process.exit(1);
}
if (frozenHits.length && allowFrozen) {
  console.log(`WARNING: rebuilding ${frozenHits.length} LIVE production site(s): ${frozenHits.join(', ')}`);
}

for (const domain of matched) {
  const entry = byDomain[domain];
  const pins = pinsFor(entry, except);
  const axes = Object.keys(pins).length - 1 + Object.keys(pins.sectionVariants || {}).length;
  console.log(`\n=== ${domain}  (${entry.themeId}, ${axes} axes pinned)`);
  if (printOnly) { console.log(JSON.stringify(pins, null, 1)); continue; }
  execFileSync('node', [
    path.join(ENGINE, 'src', 'cli.js'),
    '--business', domain,
    '--theme', entry.themeId,
    '--variants', JSON.stringify(pins),
    '--out', 'dist',
  ], { cwd: ENGINE, stdio: 'inherit' });
}

if (!printOnly) {
  // Every single-business run overwrites dist/index.html with just that one
  // card - rebuild both gallery indexes from the registry afterwards.
  console.log('\nRebuilding gallery indexes...');
  execFileSync('node', [path.join(ENGINE, 'scripts', 'rebuild-gallery.mjs')], { cwd: ENGINE, stdio: 'inherit' });
}
