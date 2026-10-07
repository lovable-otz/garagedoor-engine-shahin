#!/usr/bin/env node
/**
 * Point GSAP + ScrollTrigger at cdnjs on an ALREADY-BUILT site, and flag a
 * failed load. Library wiring only - no animation logic is added or changed.
 *
 * WHY. Cloudflare returns 403 for every .js served from the sites' own origin
 * (verified same-origin on five live sites across all four batches: no etag,
 * no cf-cache-status, so Cloudflare answered it, not R2). A CDN URL never
 * touches that origin, so it loads. Inline <script> already works there - the
 * nav toggle runs - which is what pins the block to external .js files.
 *
 * WHY A PATCH AND NOT A REGENERATION. repin.mjs is NOT byte-identical: photo
 * selection re-rolls on every run even with all 21 axes pinned (measured -
 * two consecutive repins of Reno produced four different photographs). A
 * regeneration to add one script tag would therefore also silently restyle the
 * site's imagery. This edits only the script tags.
 *
 * `defer` on ALL THREE tags, not just the CDN pair: deferred scripts run in
 * document order, so section-animations.js is still guaranteed to execute
 * after the libraries. Deferring only the CDN pair would let the local file
 * run first and throw on an undefined `gsap`.
 *
 * NOTE: section-animations.js stays on the local origin, so it is STILL 403 in
 * production. After this patch the libraries load but no animation runs - that
 * is deliberate, matching "just wire up the library loading and the failure
 * flag".
 *
 * Idempotent.
 *
 *   node scripts/apply-cdn-gsap.mjs renogaragedoorpros      # one site
 *   node scripts/apply-cdn-gsap.mjs --dry-run <substring>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const V = '3.12.5';
const ERR = `onerror="document.documentElement.classList.add('gsap-failed')"`;

const OLD = '<script src="/assets/vendor/gsap.min.js"></script>'
  + '<script src="/assets/vendor/ScrollTrigger.min.js"></script>'
  + '<script src="/assets/vendor/section-animations.js"></script>';
const NEW = `<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/${V}/gsap.min.js" ${ERR}></script>`
  + `<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/${V}/ScrollTrigger.min.js" ${ERR}></script>`
  + '<script defer src="/assets/vendor/section-animations.js"></script>';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));
if (!filters.length) { console.error('usage: node scripts/apply-cdn-gsap.mjs [--dry-run] <domain-substring> [...]'); process.exit(1); }

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
  const root = path.join(DIST, dir);
  let changed = 0, already = 0, noMatch = 0;
  for (const file of walk(root)) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes('cdnjs.cloudflare.com/ajax/libs/gsap')) { already++; continue; }
    if (!html.includes(OLD)) { noMatch++; continue; }
    if (!dryRun) fs.writeFileSync(file, html.replace(OLD, NEW));
    changed++;
  }
  console.log(`${dir.replace(/\.com.*/, '')}: ${dryRun ? 'would patch' : 'patched'} ${changed} page(s) | already ${already} | no anim block ${noMatch}`);
}
