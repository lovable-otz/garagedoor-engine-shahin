#!/usr/bin/env node
/**
 * Generate one (or every) of a team member's assigned businesses from the
 * shared Google Sheet tracker, end to end - this is the canonical,
 * repeatable "Shahin-assigned-site" process (2026-08-24, explicit user
 * request to make it the SAME for every future assignment, not a one-off
 * set of manual steps):
 *
 *   1. Fetch the assignment sheet, find rows assigned to <name>.
 *   2. Sheet phone/address WIN over the engine dataset's own values (the
 *      workbook's own address and config/site-content.js's placeholder
 *      phone are not authoritative once a real assignment row exists).
 *   3. Pull that business's own real content from ITS OWN GitHub repo's
 *      `content` branch - kept in the branch's ORIGINAL folder structure
 *      (01-money-pages/, 02-service-lines/, etc.) under
 *      contents/<domain>/ (the repo's own name), never flattened. content/adapter.js reads
 *      that structure natively (recursive scan, see collectJsonFiles).
 *   4. Generate the site into dist/<domain>/.
 *   5. git init/commit the generated output in its own folder (never push
 *      without an explicit go-ahead for that specific push, even with a
 *      working credential).
 *
 * Requires a git credential already configured for github.com (persists
 * across sessions - see the assignment-generation-process memory). This
 * script only clones/fetches over HTTPS; it never asks for or touches the
 * token itself.
 *
 * Usage:
 *   node scripts/generate-assignment.mjs --assigned Shahin
 *   node scripts/generate-assignment.mjs --assigned Shahin --domain dallasdoorpros.com
 *   node scripts/generate-assignment.mjs --assigned Shahin --dry-run   (report only, no writes)
 *
 *   Manual mode - one-off business(es) NOT on the assignment sheet (e.g. a
 *   colleague's site): pass --rows pointing at a JSON file with the same
 *   row shape a sheet row has - [{Domain, City, State, "Git URL", Phone,
 *   Address}, ...] - and the sheet fetch is skipped entirely. Everything
 *   downstream (phone/address override, content pull, generate, git
 *   commit) is identical to the sheet-driven path.
 *   node scripts/generate-assignment.mjs --rows /path/to/manual-rows.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load.js';
import { runBatch } from '../src/generator/batch.js';
import { siteFolderName } from '../src/generator/site.js';
import { formatPhoneUS } from '../src/util/strings.js';
import { THEME_IDS } from '../config/themes.js';
import { DELIVERED_SITES } from '../config/delivered-sites.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = path.join(__dirname, '..');
const PROJECT_ROOT = path.join(ENGINE_ROOT, '..');
const CONTENTS_ROOT = path.join(PROJECT_ROOT, 'contents');
const OUT_DIR = path.join(ENGINE_ROOT, 'dist');
const SHEET_ID = '1y4lOUGWuznvEHKPTPAgiW6dmtqvKk3xwGL_wSq-cUgw';
const SHEET_GID = '0';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

/** Minimal RFC4180 CSV parser - handles quoted fields with embedded commas. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchSheetRows() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const header = rows[0];
  return rows.slice(1).filter((r) => r.length === header.length && r.some(Boolean))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function copyRecursive(src, dest, skip) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyRecursive(s, d, skip); }
    else fs.copyFileSync(s, d);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countFiles(path.join(dir, entry.name));
    else if (entry.name.endsWith('.json')) n++;
  }
  return n;
}

/** Pull the real content export from a business's own repo's `content`
 * branch into contents/<domain>/ - named after the repo (user 2026-10-07;
 * older pulls used contents/<city>-<state>/, which content/adapter.js still
 * reads as a fallback) - preserving the branch's own folder layout exactly,
 * no flattening (explicit user request). */
function pullContent(domain, city, state, gitUrl) {
  const destDir = path.join(CONTENTS_ROOT, domain);
  const tmpDir = path.join(PROJECT_ROOT, '.tmp-content-pull', domain);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const git = (args) => execFileSync('git', args, { cwd: tmpDir, stdio: ['ignore', 'pipe', 'pipe'] });
  git(['init', '-q']);
  git(['remote', 'add', 'origin', gitUrl]);
  git(['fetch', '-q', 'origin', 'content']);
  git(['checkout', '-q', 'origin/content', '--', '.']);
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  copyRecursive(tmpDir, destDir, new Set(['.git']));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return destDir;
}

/** git init/remote/add/commit the generated site output. Never pushes. */
function commitOutput(siteDir, gitUrl, message) {
  const git = (args) => execFileSync('git', args, { cwd: siteDir, stdio: ['ignore', 'pipe', 'pipe'] });
  const isRepo = fs.existsSync(path.join(siteDir, '.git'));
  if (!isRepo) {
    // -b main, NOT git's default. Without it every new site repo starts on
    // `master` and has to be renamed by hand before the first push - which is
    // exactly what happened to all 20 sites in the 27 August batch. `main` is
    // the default branch on every shipped repo, so start there.
    git(['init', '-q', '-b', 'main']);
    git(['remote', 'add', 'origin', gitUrl]);
  }
  git(['config', 'user.name', 'lovable-1']);
  git(['config', 'user.email', 'lovable-1@orangetoolz.com']);
  git(['add', '-A']);
  try {
    // Every commit in these repos carries the trailer, per the convention.
    git(['commit', '-q', '-m', `${message}\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>`]);
    return true;
  } catch {
    return false; // nothing to commit
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const assignedTo = String(args.assigned || 'Shahin').toLowerCase();
  const dryRun = Boolean(args['dry-run']);
  // --pull-only: do the STAGING half (sheet phone/address override + content
  // pull) and stop before generating anything. The batch process is gated on
  // purpose - "then after my confirmation generate sites" - so there has to be
  // a way to stage a batch without crossing that line. --dry-run stops even
  // earlier, before the content pull, so it only ever reports the plan.
  const pullOnly = Boolean(args['pull-only']);
  // Domains that already have generated output. Used to leave shipped sites
  // alone during a content pull - see the skip in the per-row loop below.
  const registryDomains = new Set();
  try {
    const regPath = path.join(ENGINE_ROOT, 'dist', '_reports', 'design-registry.json');
    for (const d of Object.keys(JSON.parse(fs.readFileSync(regPath, 'utf8')).byDomain || {})) registryDomains.add(d);
  } catch { /* no registry yet - first ever batch, nothing is frozen */ }
  // Sites delivered by ANYONE on the team (config/delivered-sites.js, from
  // scripts/import-site-csv.mjs) are frozen too, even though most were never
  // built on this machine and so are not in the local registry.
  for (const d of DELIVERED_SITES) registryDomains.add(d);

  let targets;
  if (args.rows) {
    // Manual mode - businesses NOT on the assignment sheet (e.g. a one-off
    // "generate this for a colleague" request, 2026-08-24). Same row shape
    // as a sheet row (Domain/City/State/Git URL/Phone/Address) so every
    // downstream step (phone/address override, content pull, git commit)
    // is identical either way - only the SOURCE of the row list differs.
    console.log(`Reading manual rows from ${args.rows}...`);
    targets = JSON.parse(fs.readFileSync(args.rows, 'utf8'));
  } else {
    console.log(`Fetching assignment sheet...`);
    const rows = await fetchSheetRows();
    targets = rows.filter((r) => (r.Assigned || '').trim().toLowerCase() === assignedTo && r['Git URL']);
  }
  if (args.domain) targets = targets.filter((r) => r.Domain === args.domain);

  // --variants-map <path.json>: { "<domain>": { hero: 'x', sectionVariants: {...} } }
  // Pins specific variant axes per business instead of letting the uniqueness
  // engine roll them. Added 2026-08-25 for the "cover every unused variant in
  // the fewest sites" review pass - the unused keys have never rendered on
  // real content, so they need to be forced onto a build before anyone can
  // review them. When present it also RESTRICTS the run to those domains, so
  // one file drives both which sites and which designs.
  let variantsMap = null;
  if (args['variants-map']) {
    variantsMap = JSON.parse(fs.readFileSync(args['variants-map'], 'utf8'));
    const want = new Set(Object.keys(variantsMap));
    targets = targets.filter((r) => want.has(r.Domain));
    console.log(`Variants map: pinning ${want.size} domain(s).`);
  }

  /**
   * --themes-map <file>  { "<domain>": "<themeId>", ... }
   *
   * THEME IS THE ONE AXIS THE UNIQUENESS LOOP CANNOT FIX. `pickTheme()` derives
   * it from baseSeed alone; `assignUnique`'s reroll only touches section/
   * component variants and palette. So two businesses that hash to the same
   * theme have a hard ceiling on how far apart they can score, and no number of
   * rerolls moves it - see the caveat on `uniqueness.minScore` in
   * config/generation.config.js.
   *
   * Forcing themes is therefore the highest-leverage uniqueness lever available
   * for a new batch, and the only way to guarantee no two sites in the batch
   * share a theme. Theme is weighted 15/100 directly, and drives palette, fonts
   * and section-order language, so it moves the typography/colors/sectionOrder
   * axes with it.
   *
   * Unlike --variants-map this does NOT restrict which domains run: it only
   * overrides the theme for the domains it names, so a partial map is fine.
   */
  let themesMap = null;
  if (args['themes-map']) {
    themesMap = JSON.parse(fs.readFileSync(args['themes-map'], 'utf8'));
    const bad = Object.values(themesMap).filter((t) => !THEME_IDS.includes(t));
    if (bad.length) {
      console.error(`Unknown theme id(s): ${[...new Set(bad)].join(', ')}`);
      console.error(`Valid ids: ${THEME_IDS.join(', ')}`);
      process.exit(1);
    }
    console.log(`Themes map: forcing ${Object.keys(themesMap).length} domain(s) onto a specific theme.`);
  }

  if (!targets.length) {
    console.log(`No ${args.rows ? 'manual rows' : `assigned rows found for "${args.assigned || 'Shahin'}"`}${args.domain ? ` matching ${args.domain}` : ''}.`);
    return;
  }
  console.log(`${targets.length} assigned site(s):`);
  for (const t of targets) console.log(`  - ${t.Domain} (${t.City}, ${t.State})`);

  const dataset = loadDataset();
  const results = [];

  for (const row of targets) {
    console.log(`\n=== ${row.Domain} ===`);
    const business = dataset.byDomain[row.Domain];
    if (!business) { console.log(`  SKIP - not in the engine dataset.`); continue; }

    const changes = [];
    const sheetPhone = formatPhoneUS(row.Phone);
    if (sheetPhone && sheetPhone !== business.phone) { changes.push(`phone "${business.phone}" -> "${sheetPhone}"`); business.phone = sheetPhone; }
    if (row.Address && row.Address !== business.address) { changes.push(`address "${business.address}" -> "${row.Address}"`); business.address = row.Address; }
    console.log(changes.length ? `  Sheet override: ${changes.join(', ')}` : `  Sheet matches existing data - no override needed.`);

    if (dryRun) { console.log(`  (dry-run, stopping here)`); continue; }

    // Never re-pull content for a site that is already built and frozen. The
    // pull overwrites contents/<city>-<state>/ wholesale, and re-fetching the
    // authored source for 36 shipped sites is pointless work with a real
    // downside: if the content branch has moved on since a site was
    // generated, the local source silently stops matching what is live.
    // (Observed 2026-08-27: a --pull-only run re-cloned all 56 assigned rows,
    // not just the 20 new ones. No generated output changed - dist/ was
    // verified clean - but nothing was gained either.)
    // Pass --repull to override when refreshing a shipped site IS the intent.
    // This skips the row ENTIRELY - no content pull AND no regeneration. That
    // second part matters just as much: every shipped site is frozen, so a
    // batch run for new sites must never rebuild the ones already live.
    if (registryDomains.has(row.Domain) && !args.repull) {
      console.log(`  Already built and frozen - skipping (--repull to force).`);
      results.push({ domain: row.Domain, skipped: true });
      continue;
    }
    console.log(`  Pulling content branch (original folder structure kept as-is)...`);
    const contentDir = pullContent(row.Domain, business.city, business.state, row['Git URL']);
    console.log(`  Content: ${countFiles(contentDir)} JSON files -> ${path.relative(PROJECT_ROOT, contentDir)}`);

    if (pullOnly) { results.push({ domain: row.Domain, staged: true }); continue; }

    if (variantsMap && variantsMap[row.Domain]) {
      business.__forceVariants = variantsMap[row.Domain];
      const v = variantsMap[row.Domain];
      const n = Object.keys(v).length - (v.sectionVariants ? 1 : 0) + Object.keys(v.sectionVariants || {}).length;
      console.log(`  Pinned ${n} variant axes from the map.`);
    }
    if (themesMap && themesMap[row.Domain]) {
      business.__forceTheme = themesMap[row.Domain];
      console.log(`  Theme forced -> ${themesMap[row.Domain]}`);
    }
    console.log(`  Generating site...`);
    const res = runBatch({ businesses: [business], dataset, outDir: OUT_DIR, onProgress: (m) => console.log('    ' + m) });
    if (res.errors) { console.log(`  GENERATION FAILED - see dist/_reports/errors.md`); continue; }

    const siteDir = path.join(OUT_DIR, siteFolderName(business, OUT_DIR));
    const committed = commitOutput(siteDir, row['Git URL'], `Generate ${business.name} (${row.Domain})`);
    console.log(`  Git: ${committed ? 'committed locally (NOT pushed)' : 'no changes to commit'} - ${path.relative(PROJECT_ROOT, siteDir)}`);

    results.push({ domain: row.Domain, pages: res.results[0]?.site?.pageCount, score: res.results[0]?.score });
  }

  if (!dryRun && results.length) {
    console.log(`\n=== Summary ===`);
    if (pullOnly) {
      for (const r of results) console.log(`  ${r.domain}: content staged`);
      console.log(`\n${results.length} site(s) STAGED - nothing generated.`);
      console.log(`Re-run without --pull-only once the batch is approved.`);
      return;
    }
    // Skipped rows carry no page count - printing `undefined pages` for them
    // made a run where EVERYTHING was skipped look like 56 broken builds.
    const built = results.filter((r) => !r.skipped);
    for (const r of built) console.log(`  ${r.domain}: ${r.pages} pages, uniqueness ${r.score}`);
    const skipped = results.length - built.length;
    if (skipped) console.log(`  (${skipped} already-built site(s) skipped - use --repull to force)`);
    if (!built.length) {
      console.log(`\nNothing was generated. Every assigned row is already in the registry.`);
      console.log(`To rebuild an existing site, use scripts/repin.mjs so its variants stay pinned.`);
      return;
    }
    // Branch is `main` on every shipped repo (the default branch), not master.
    console.log(`\nAll commits are LOCAL only. Push explicitly when ready (per-site repo, git push -u origin main).`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
