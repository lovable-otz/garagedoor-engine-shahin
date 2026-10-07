#!/usr/bin/env node
/**
 * Inline section-animations.js into already-built pages, replacing the
 * <script src> that the origin refuses to serve.
 *
 * WHY. Cloudflare 403s every .js on the sites' own origin. GSAP and
 * ScrollTrigger were moved to cdnjs and load fine, but this file is ours - no
 * CDN hosts it - so it stayed blocked and nothing drove the libraries
 * (measured live on Reno: both libraries present, 0 ScrollTriggers). Inline
 * <script> executes normally on these sites, which is what makes this work.
 *
 * THE DOMContentLoaded WRAPPER IS LOAD-BEARING. `defer` is IGNORED on inline
 * scripts, so a bare inline block at end of body runs DURING parsing - before
 * the deferred CDN libraries execute - and the file's own
 * `if (!window.gsap || !window.ScrollTrigger) return;` guard bails silently.
 * Deferred scripts are guaranteed to complete before DOMContentLoaded fires,
 * so the listener restores the ordering the linked version had.
 *
 * WHY A PATCH AND NOT A REGENERATION. repin.mjs is not byte-identical - photo
 * selection re-rolls on every run even with all 21 axes pinned (measured: two
 * consecutive repins of Reno produced four different photographs). Patching
 * changes only the script block.
 *
 * Idempotent, and refuses to run if the source file contains a literal
 * </script>, which would terminate the block early.
 *
 *   node scripts/inline-section-animations.mjs [--dry-run] <substring> [...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ENGINE, 'dist');
const SRC = path.join(ENGINE, 'src', 'assets', 'vendor', 'section-animations.js');

const JS = fs.readFileSync(SRC, 'utf8');
if (/<\/script/i.test(JS)) {
  console.error('source contains a literal </script> - inlining would terminate the block early. Aborting.');
  process.exit(1);
}

const LINKED = '<script defer src="/assets/vendor/section-animations.js"></script>';
const INLINE = `<script>document.addEventListener('DOMContentLoaded',function(){${JS}});</script>`;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));
if (!filters.length) { console.error('usage: node scripts/inline-section-animations.mjs [--dry-run] <substring> [...]'); process.exit(1); }

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'assets' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

for (const dir of fs.readdirSync(DIST)) {
  if (!/^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(dir)) continue;
  if (!filters.some((f) => dir.includes(f))) continue;
  let changed = 0, already = 0, noMatch = 0;
  for (const file of walk(path.join(DIST, dir))) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes("addEventListener('DOMContentLoaded',function(){")) { already++; continue; }
    if (!html.includes(LINKED)) { noMatch++; continue; }
    if (!dryRun) fs.writeFileSync(file, html.replace(LINKED, INLINE));
    changed++;
  }
  console.log(`${dir.replace(/\.com.*/, '')}: ${dryRun ? 'would inline' : 'inlined'} ${changed} page(s) | already ${already} | no linked tag ${noMatch}`);
}
