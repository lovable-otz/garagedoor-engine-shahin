#!/usr/bin/env node
/**
 * Repoint an already-built contact map from the CITY CENTROID to the
 * business's REAL STREET ADDRESS.
 *
 * The 24 August sites were generated before contactMap() learned to query the
 * address. They embed OpenStreetMap centred on `b.lat/b.lng`, which are city
 * centroids from the city sheet - so every marker sits on the metro downtown
 * rather than the business. All three have a real street address in the
 * dataset; the page just predates the fix.
 *
 * The replacement markup is produced by the engine's OWN contactMap(), so it
 * is byte-identical to what a regeneration would emit - without regenerating,
 * which would also re-roll the site's photography (repin.mjs is not
 * byte-identical; measured).
 *
 * Only the map block on /contact/ is touched. Refuses to act if the business
 * has no address, rather than inventing a location.
 *
 *   node scripts/fix-contact-map.mjs [--dry-run] <substring> [...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load.js';
import { contactMap } from '../src/components/index.js';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));
if (!filters.length) { console.error('usage: node scripts/fix-contact-map.mjs [--dry-run] <substring> [...]'); process.exit(1); }

const ds = loadDataset();

/** The whole <div class="map-embed"> … </div>, brace-free so match by tags. */
function replaceMapBlock(html, replacement) {
  const i = html.indexOf('<div class="map-embed"');
  if (i < 0) return null;
  const open = html.indexOf('>', i) + 1;
  let depth = 1;
  const tag = /<div\b|<\/div>/g;
  tag.lastIndex = open;
  let m, end = -1;
  while ((m = tag.exec(html))) {
    if (m[0] === '</div>') { depth--; if (depth === 0) { end = m.index + m[0].length; break; } }
    else depth++;
  }
  if (end < 0) return null;
  return html.slice(0, i) + replacement + html.slice(end);
}

for (const dir of fs.readdirSync(DIST)) {
  if (!/^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(dir)) continue;
  if (!filters.some((f) => dir.includes(f))) continue;
  const domain = dir.replace(/^(.*?\.[a-z]{2,})(-.*)?$/, '$1');
  const b = ds.byDomain[domain];
  const label = domain.replace(/\.com$/, '');
  if (!b) { console.log(`${label}: not in dataset - skipped`); continue; }
  if (!b.address) { console.log(`${label}: NO street address on file - refusing to guess a location`); continue; }

  const file = path.join(DIST, dir, 'contact', 'index.html');
  if (!fs.existsSync(file)) { console.log(`${label}: no contact page`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('openstreetmap.org/export/embed')) { console.log(`${label}: already address-based - skipped`); continue; }

  const next = replaceMapBlock(html, contactMap({ business: b }));
  if (!next) { console.log(`${label}: could not locate the map block`); continue; }
  if (!next.includes(encodeURIComponent(b.address).slice(0, 20))) { console.log(`${label}: replacement missing the address - aborted`); continue; }
  if (!dryRun) fs.writeFileSync(file, next);
  console.log(`${label}: ${dryRun ? 'would repoint' : 'repointed'} map -> ${b.address}`);
}
