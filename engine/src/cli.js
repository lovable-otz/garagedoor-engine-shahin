#!/usr/bin/env node
/**
 * Garage-Door Site Engine - CLI.
 *
 * Usage:
 *   node src/cli.js --preview [N]        generate N representative sites (default 5) across N themes
 *   node src/cli.js --business <domain>  generate a single business by domain
 *   node src/cli.js --all                generate every business in the workbook
 *   node src/cli.js --limit <N>          generate the first N businesses
 *   node src/cli.js --theme-gallery      one representative site per theme (all 18)
 *   node src/cli.js --plan               plan/uniqueness only (no site files), writes control sheet
 *
 * Options:
 *   --out <dir>          output directory (default dist/generated-sites)
 *   --workbook <path>    source .xlsx (default ../GarageDoor_1000_SITE_BUILD_SHEET.xlsx)
 *   --fresh-registry     ignore the persisted design registry (fresh uniqueness plan)
 *   --no-qa              skip QA
 *   --year <YYYY>        footer/copyright year
 *   --variants <json>    (with --business) pin specific variant axes, e.g.
 *                        --variants '{"hero":"asymmetric-overlap"}' - for
 *                        restoring one business to a known-prior design after
 *                        a regen elsewhere shifted its uniqueness re-roll.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/generation.config.js';
import { loadDataset } from './data/load.js';
import { assignDesign } from './engine/seed.js';
import { THEMES, THEME_IDS } from '../config/themes.js';
import { runBatch } from './generator/batch.js';
import { DELIVERED_SITES } from '../config/delivered-sites.js';
import { subSeed, seedFor } from './util/hash.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

/** Natural (deterministic) theme id for a business, ignoring preview forcing. */
function naturalTheme(b) {
  return THEME_IDS[subSeed(seedFor(b.domain, b.name), 'theme') % THEME_IDS.length];
}

/** Pick N businesses spanning N distinct themes for a representative preview. */
function selectPreview(dataset, n) {
  const seenThemes = new Set();
  const picked = [];
  for (const b of dataset.generatable) {
    const t = naturalTheme(b);
    if (!seenThemes.has(t)) { seenThemes.add(t); picked.push(b); }
    if (picked.length >= n) break;
  }
  // If fewer distinct themes than n (small datasets), top up with more rows.
  for (const b of dataset.generatable) {
    if (picked.length >= n) break;
    if (!picked.includes(b)) picked.push(b);
  }
  return picked.slice(0, n);
}

/** One representative business per theme (forcing that theme). */
function selectThemeGallery(dataset) {
  const out = [];
  for (const theme of THEMES) {
    // Prefer a business that naturally maps here (nicer color pairing);
    // else take the first row and force the theme.
    const nat = dataset.generatable.find((b) => naturalTheme(b) === theme.id) || dataset.generatable[0];
    const clone = Object.create(Object.getPrototypeOf(nat), Object.getOwnPropertyDescriptors(nat));
    clone.__forceTheme = theme.id;
    out.push(clone);
  }
  return out;
}

/** Write a browsable index.html linking every generated site. */
function writePreviewIndex(outDir, results, title) {
  const cards = results.map(({ business, design, site, qa, score }) => {
    const p = design.palette;
    return `<a class="card" href="./${site.dirName}/index.html">
      <div class="sw"><span style="background:${p.primary}"></span><span style="background:${p.accent}"></span><span style="background:${p.bg};border:1px solid #ccc"></span></div>
      <h3>${business.name}</h3>
      <p>${business.city}, ${business.state} · <code>${business.domain}</code></p>
      <p class="meta"><b>${design.themeName}</b> · ${design.variants.hero} / ${design.variants.nav}</p>
      <p class="meta">uniqueness ${score} · ${site.pageCount} pages · QA ${qa ? qa.status : 'N/A'} · ${site.contentSource}</p>
    </a>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#0b0f19;color:#e5e7eb}
header{padding:2rem 1.5rem;border-bottom:1px solid #1f2937}h1{margin:0}.sub{color:#9ca3af}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));padding:1.5rem;max-width:1200px;margin:auto}
.card{display:block;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:1.2rem;text-decoration:none;color:inherit;transition:.15s}
.card:hover{border-color:#3b82f6;transform:translateY(-2px)}.card h3{margin:.4rem 0 .2rem}
.card p{margin:.15rem 0;font-size:.85rem;color:#9ca3af}.meta code{color:#93c5fd}
.sw{display:flex;gap:4px;margin-bottom:.4rem}.sw span{width:28px;height:20px;border-radius:4px;display:block}</style>
</head><body><header><h1>${title}</h1><p class="sub">${results.length} generated sites · click any card to open the site</p></header>
<div class="grid">${cards}</div></body></html>`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  return path.join(outDir, 'index.html');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataset = loadDataset(args.workbook ? { workbook: args.workbook } : {});
  const year = args.year ? Number(args.year) : new Date().getFullYear();
  const write = !args.plan;
  const qa = !args['no-qa'];
  const freshRegistry = Boolean(args['fresh-registry']);

  console.log(`\nGarage-Door Site Engine`);
  console.log(`Workbook: ${dataset.workbook}`);
  console.log(`Businesses: ${dataset.businesses.length} (generatable: ${dataset.generatable.length}, errors: ${dataset.validation.summary.errors})`);
  console.log(`Themes available: ${THEMES.length}\n`);

  let businesses;
  let outDir = args.out || config.paths.outDir;
  let title = 'Garage-Door Sites - Preview';
  let reportName = 'generation-report';

  if (args.business) {
    const b = dataset.byDomain[String(args.business).toLowerCase()];
    if (!b) { console.error(`No business found for domain "${args.business}"`); process.exit(1); }
    if (args.theme && typeof args.theme === 'string') b.__forceTheme = args.theme; // preview any business in any theme
    if (args.variants && typeof args.variants === 'string') {
      try { b.__forceVariants = JSON.parse(args.variants); }
      catch { console.error(`--variants must be JSON, e.g. '{"hero":"asymmetric-overlap"}'`); process.exit(1); }
    }
    businesses = [b];
    title = `${b.name} - Preview`;
    reportName = 'single-business-report';
  } else if (args['theme-gallery']) {
    // One representative site per theme. Folders go DIRECTLY in the output dir.
    businesses = selectThemeGallery(dataset);
    title = 'Theme Gallery - all 18 themes';
    reportName = 'theme-gallery-report';
  } else if (args.all || args.limit) {
    // Bulk runs never rebuild a DELIVERED site (config/delivered-sites.js,
    // from scripts/import-site-csv.mjs) unless explicitly asked to - those
    // are shipped, mostly by other people on the team. --limit N counts the
    // first N NEW businesses.
    const pool = args['include-delivered'] ? dataset.generatable : dataset.generatable.filter((b) => !DELIVERED_SITES.has(b.domain.toLowerCase()));
    const skipped = dataset.generatable.length - pool.length;
    if (skipped) console.log(`Skipping ${skipped} delivered site(s) (--include-delivered to build them too)`);
    businesses = args.all ? pool : pool.slice(0, Number(args.limit));
    title = args.all ? 'Garage-Door Sites - Full Run' : `Garage-Door Sites - First ${args.limit}`;
    if (args.all) reportName = 'generation-report';
  } else {
    // default: preview. Site folders go DIRECTLY in the output dir (no subfolder).
    const n = args.preview && args.preview !== true ? Number(args.preview) : config.preview.defaultCount;
    businesses = selectPreview(dataset, n);
    title = `Garage-Door Sites - Preview (${n})`;
    reportName = 'preview-report';
  }

  const t0 = Date.now();
  const res = runBatch({
    dataset, businesses, outDir, year, write, qa, freshRegistry, reportName,
    onProgress: (m) => console.log('  ' + m),
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  let indexFile = null;
  if (write) indexFile = writePreviewIndex(outDir, res.results, title);

  console.log(`\nDone in ${secs}s`);
  console.log(`  generated: ${res.generated}/${res.count}   errors: ${res.errors}`);
  const u = res.results.map((r) => r.score);
  if (u.length) console.log(`  uniqueness: avg ${(u.reduce((a, b) => a + b, 0) / u.length).toFixed(1)}  min ${Math.min(...u)}  max ${Math.max(...u)}`);
  const qaCounts = res.results.reduce((m, r) => { const s = r.qa ? r.qa.status : 'N/A'; m[s] = (m[s] || 0) + 1; return m; }, {});
  console.log(`  QA: ${JSON.stringify(qaCounts)}`);
  console.log(`  themes used: ${Object.keys(res.registryStats.themes).length}`);
  console.log(`\nOutputs:`);
  console.log(`  sites:    ${outDir}`);
  if (indexFile) console.log(`  index:    ${indexFile}`);
  console.log(`  control:  ${res.control.xlsx}`);
  console.log(`  csv:      ${res.control.csv}`);
  console.log(`  registry: ${res.registryFile}`);
  console.log(`  errors:   ${res.errorReport}`);
  console.log(`  sections: ${res.sectionUsageReport}\n`);
}

main();
