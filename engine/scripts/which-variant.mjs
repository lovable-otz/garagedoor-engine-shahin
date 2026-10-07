#!/usr/bin/env node
/**
 * "Which variant is <site> using for <section>, and who else uses it?"
 *
 * The workflow this exists for (user direction, 2026-08-25): the user reviews
 * sites one by one and reports a section that needs fixing, naming a REFERENCE
 * site. The fix must then be made to the VARIANT in the engine - not patched
 * onto that one site - because the same variant gets rolled onto future
 * generations. So every fix command starts with two questions:
 *
 *   1. which variant is that site's section actually on?
 *   2. which OTHER built sites share it (i.e. what needs regenerating)?
 *
 * Both answers live in dist/_reports/design-registry.json already; this just
 * reads them out so the lookup is not retyped by hand every time.
 *
 *   node scripts/which-variant.mjs denver              # every axis for one site
 *   node scripts/which-variant.mjs denver process      # one axis + who shares it
 *   node scripts/which-variant.mjs --variant boxed-diagonal   # who uses this key
 */

import { readFileSync } from 'node:fs';
import { SECTION_AXES } from '../src/engine/variation.js';

const REGISTRY = new URL('../dist/_reports/design-registry.json', import.meta.url);

// The fingerprint stores primary axes as their own keys and the section axes
// as one pipe-joined string in SECTION_AXES order.
const PRIMARY_AXES = ['hero', 'nav', 'serviceCard', 'reviewCard', 'gallery', 'footer', 'cta'];
// 'cta' is the ctaStyle skin at the top level AND a section layout inside
// `sections` - label them apart so a fix command can't target the wrong one.
const PRIMARY_LABEL = { cta: 'ctaStyle' };

function axesFor(entry) {
  const fp = entry.fingerprint || {};
  const out = {};
  for (const a of PRIMARY_AXES) if (fp[a]) out[PRIMARY_LABEL[a] || a] = fp[a];
  const secs = String(fp.sections || '').split('|');
  SECTION_AXES.forEach((axis, i) => { if (secs[i]) out[axis] = secs[i]; });
  return out;
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const sites = Object.entries(registry.byDomain).map(([domain, e]) => ({ domain, e, axes: axesFor(e) }));

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: which-variant.mjs <site> [axis]   |   --variant <key>');
  process.exit(1);
}

/** Who else is on this variant? Frozen sites are called out separately - they
 * must not be regenerated without a per-site instruction. */
const FROZEN = new Set(['dallasdoorpros.com', 'phoenixgaragedoorco.com', 'chicagogaragedoorco.com']);

function usersOf(axis, key) {
  return sites.filter((s) => s.axes[axis] === key).map((s) => s.domain);
}

if (args[0] === '--variant') {
  const key = args[1];
  const hits = [];
  for (const s of sites) {
    for (const [axis, v] of Object.entries(s.axes)) if (v === key) hits.push({ axis, domain: s.domain });
  }
  if (!hits.length) { console.log(`no built site uses "${key}"`); process.exit(0); }
  const byAxis = {};
  for (const h of hits) (byAxis[h.axis] ||= []).push(h.domain);
  for (const [axis, domains] of Object.entries(byAxis)) {
    console.log(`${axis} = ${key}  (${domains.length} site${domains.length > 1 ? 's' : ''})`);
    for (const d of domains) console.log(`  ${FROZEN.has(d) ? 'FROZEN ' : '       '}${d}`);
  }
  process.exit(0);
}

const q = args[0].toLowerCase();
const site = sites.find((s) => s.domain.toLowerCase() === q)
  || sites.find((s) => (s.e.city || '').toLowerCase().replace(/\s+/g, '') === q.replace(/\s+/g, ''))
  || sites.find((s) => s.domain.toLowerCase().includes(q));

if (!site) {
  console.error(`no site matching "${args[0]}". Known: ${sites.map((s) => s.e.city).join(', ')}`);
  process.exit(1);
}

const header = `${site.e.name} (${site.domain}) - theme ${site.e.themeId}, u=${site.e.score}`;
console.log(header);
console.log('-'.repeat(header.length));

const axis = args[1];
if (axis) {
  const key = site.axes[axis];
  if (!key) {
    console.error(`unknown axis "${axis}". Known: ${Object.keys(site.axes).join(', ')}`);
    process.exit(1);
  }
  const shared = usersOf(axis, key);
  console.log(`${axis} = ${key}`);
  console.log(`\nfix the VARIANT, then regenerate these ${shared.length} site(s):`);
  for (const d of shared) console.log(`  ${FROZEN.has(d) ? 'FROZEN - leave alone' : '                    '} ${d}`);
} else {
  for (const [a, v] of Object.entries(site.axes)) {
    const n = usersOf(a, v).length;
    console.log(`  ${a.padEnd(15)} ${v.padEnd(24)} ${n > 1 ? `(shared with ${n - 1} other site${n > 2 ? 's' : ''})` : ''}`);
  }
}
