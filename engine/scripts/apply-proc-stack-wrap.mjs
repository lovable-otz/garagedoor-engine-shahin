#!/usr/bin/env node
/**
 * Patch ONLY the stacked-panel process rows on an ALREADY-BUILT site.
 *
 * WHY A PATCH AND NOT A REGENERATION
 * The four sites carrying process=stacked-panel are live and frozen. A rebuild
 * applies EVERY engine change since each was built - CTA backgrounds, the logo
 * treatment, retired variants, today's footer/brandbar/FAQ fixes - to sites
 * signed off as they are (documented in CLAUDE.md: the Raleigh footer fix also
 * moved 28 pages onto a different hero). The instruction was "update only this
 * section", so this rewrites exactly two CSS rules and nothing else.
 *
 * The replacement is sliced out of a REAL generateCss() run, so it is
 * byte-identical to what a future rebuild emits and this stops being a diff the
 * moment a site is rebuilt for other reasons.
 *
 * Idempotent: a page already carrying the wrap rule is skipped.
 *
 *   node scripts/apply-proc-stack-wrap.mjs [--dry-run] <substring> [...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCss } from '../src/design/css.js';
import { loadDataset } from '../src/data/load.js';
import { assignDesign } from '../src/engine/seed.js';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));
if (!filters.length) { console.error('usage: node scripts/apply-proc-stack-wrap.mjs [--dry-run] <substring> [...]'); process.exit(1); }

// The exact rule every affected site currently carries.
const OLD = '.proc-stack__row{position:relative;display:flex;align-items:center;gap:1.6rem;padding:1.6rem clamp(1.4rem,3vw,2.4rem);border-radius:var(--radius-lg);background:var(--c-surface-alt);overflow:hidden}';

// Slice the replacement out of real generated CSS: from the new row rule
// through the copy-block rule, comment included, so it matches a rebuild.
const ds = loadDataset();
const sample = ds.byDomain['rochesterhillsgaragedoorpros.com'] || Object.values(ds.byDomain)[0];
const css = generateCss(assignDesign(sample, {}), sample);
const start = css.indexOf('.proc-stack__row{position:relative;display:flex;flex-wrap:wrap;');
const endSel = '.proc-stack__row>div:last-child{flex:1 1 260px;min-width:0}';
const end = css.indexOf(endSel);
if (start < 0 || end < 0) { console.error('could not slice the new rules out of generateCss output - aborting'); process.exit(1); }
const NEW = css.slice(start, end + endSel.length);
// Completeness guard, same idea as apply-quote-form.mjs: refuse to write a
// partial slice, which would ship a half-styled row to live sites.
for (const need of ['flex-wrap:wrap', 'flex:1 1 260px', 'min-width:0']) {
  if (!NEW.includes(need)) { console.error(`replacement missing ${need} - aborting`); process.exit(1); }
}
console.log(`replacement: ${NEW.length} bytes (3/3 required declarations present)`);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'assets' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

let totalChanged = 0, totalSkipped = 0, problems = 0;
for (const dir of fs.readdirSync(DIST)) {
  if (!/^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(dir)) continue;
  if (!filters.some((f) => dir.includes(f))) continue;
  let changed = 0, already = 0, noRule = 0;
  for (const file of walk(path.join(DIST, dir))) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes(endSel)) { already++; continue; }
    if (!html.includes(OLD)) { noRule++; continue; }
    if (!dryRun) fs.writeFileSync(file, html.replace(OLD, NEW));
    changed++;
  }
  totalChanged += changed; totalSkipped += already;
  if (noRule) problems++;
  console.log(`${dir.replace(/\.com.*/, '').padEnd(30)} ${dryRun ? 'would patch' : 'patched'} ${String(changed).padStart(4)} | already ${already} | no rule ${noRule}`);
}
console.log(`\ntotal ${dryRun ? 'would patch' : 'patched'}: ${totalChanged} page(s) | already had it: ${totalSkipped} | sites with unmatched pages: ${problems}`);
