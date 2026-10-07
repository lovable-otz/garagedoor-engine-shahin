/**
 * Section & component variant usage report.
 *
 * Human-auditable mirror of what the cooldown enforcement in
 * src/engine/uniqueness.js (rebalanceSections/rebalancePrimaryVariants) is
 * actually doing: for every structural section layout (services/why/
 * process/...) and every primary component style (hero/nav/serviceCard/...),
 * lists which site used which variant, in generation order, and which
 * variants are still "on cooldown" (excluded from the very next site) per
 * config.uniqueness.sectionCooldown.
 *
 * A pool smaller than `sectionCooldown + 1` can never honor the full
 * cooldown window (see effectiveCooldown in uniqueness.js) - those axes are
 * called out explicitly so it's obvious from the report alone which
 * sections need more real variants added to SECTION_POOLS/POOLS
 * (src/engine/variation.js) before the requested window is achievable, not
 * just something the report silently falls short on.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';
import { SECTION_AXES, SECTION_POOLS, POOLS } from '../engine/variation.js';

const STRUCTURAL_AXES = SECTION_AXES.map((axis, index) => ({
  key: axis, poolKey: axis, index, group: 'Structural section layout',
}));

// fingerprint key -> POOLS key. `cta` is named `ctaStyle` in POOLS/variants
// but `cta` on the fingerprint - see the same mapping in uniqueness.js.
const COMPONENT_AXES = [
  ['hero', 'hero'], ['nav', 'nav'], ['serviceCard', 'serviceCard'],
  ['reviewCard', 'reviewCard'], ['gallery', 'gallery'], ['footer', 'footer'],
  ['cta', 'ctaStyle'],
].map(([key, poolKey]) => ({ key, poolKey, group: 'Component style' }));

function valueFor(axis, fingerprint) {
  if (axis.index != null) return String(fingerprint.sections || '').split('|')[axis.index] || '';
  return fingerprint[axis.key] || '';
}

/**
 * @param {Array<{domain:string, fingerprint:object}>} records  chronological
 *   (oldest-first) generation order - e.g. Object.values(registry.byDomain).
 */
function buildAxisReport(axis, records, cooldownWanted) {
  const pool = SECTION_POOLS[axis.poolKey] || POOLS[axis.poolKey] || [];
  const cooldown = Math.max(0, Math.min(cooldownWanted, pool.length - 1));
  const capacityLimited = cooldown < cooldownWanted;

  const rows = [];
  const lastUsedAt = {}; // value -> 1-indexed position it was last used
  records.forEach((rec, i) => {
    const pos = i + 1;
    const value = valueFor(axis, rec.fingerprint);
    if (!value) return;
    lastUsedAt[value] = pos;
    rows.push({ pos, domain: rec.domain, value });
  });

  const total = records.length;
  const onCooldown = Object.entries(lastUsedAt)
    .map(([value, pos]) => ({ value, until: pos + cooldown }))
    .filter((e) => e.until >= total + 1) // still excludes the NEXT site (position total+1)
    .sort((a, b) => b.until - a.until);

  return { pool, cooldown, capacityLimited, rows, onCooldown };
}

function renderAxisSection(title, axis, report) {
  const lines = [];
  const limitNote = report.capacityLimited
    ? ` — **capacity-limited**: only ${report.pool.length} real variant(s) exist, so the achievable cooldown is ${report.cooldown} site(s), not the configured ${config.uniqueness.sectionCooldown}. Add more variants to raise this.`
    : '';
  lines.push(`### ${title}`);
  lines.push('');
  lines.push(`Pool (${report.pool.length}): ${report.pool.map((v) => `\`${v}\``).join(', ')}`);
  lines.push(`Achievable cooldown: **${report.cooldown} site(s)**${limitNote}`);
  lines.push('');
  if (!report.rows.length) {
    lines.push('_No sites generated yet._');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('| # | Site | Variant | Excluded through site # |');
  lines.push('|---|------|---------|--------------------------|');
  for (const r of report.rows) {
    lines.push(`| ${r.pos} | ${r.domain} | \`${r.value}\` | ${r.pos + report.cooldown} |`);
  }
  lines.push('');
  if (report.onCooldown.length) {
    lines.push(`**On cooldown right now (won't be picked for the next site):** ${report.onCooldown.map((e) => `\`${e.value}\` (through site #${e.until})`).join(', ')}`);
  } else {
    lines.push(`**On cooldown right now:** none - every variant in this pool is free to be picked again.`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * @param {import('../engine/registry.js').DesignRegistry} registry
 */
export function writeSectionUsageReport(registry, { dir = config.paths.reportDir } = {}) {
  const records = Object.values(registry.byDomain); // insertion order = generation order
  const cooldownWanted = config.uniqueness.sectionCooldown;

  const lines = [];
  lines.push('# Section & Component Variant Usage');
  lines.push('');
  lines.push(`${records.length} site(s) recorded, in generation order. Configured cooldown window: **${cooldownWanted} sites** (\`config.uniqueness.sectionCooldown\`) - once a site uses a variant on a given axis, that variant is excluded from the next N sites for the SAME axis, clamped to \`poolSize - 1\` per axis (see \`effectiveCooldown\` in \`src/engine/uniqueness.js\`). This file is regenerated on every batch/single-business run - do not hand-edit.`);
  lines.push('');

  const capacityLimited = [];

  lines.push('## Structural section layouts');
  lines.push('');
  lines.push('_These are the per-`<section>` skeleton choices (services grid vs. list vs. rows vs. bento, etc.) - the axis most visible when scrolling a single site._');
  lines.push('');
  for (const axis of STRUCTURAL_AXES) {
    const report = buildAxisReport(axis, records, cooldownWanted);
    if (report.capacityLimited) capacityLimited.push({ title: axis.poolKey, ...report });
    lines.push(renderAxisSection(axis.poolKey, axis, report));
  }

  lines.push('## Component styles');
  lines.push('');
  lines.push('_Hero/nav/card/gallery/footer/CTA-button skins - visible on every page of a site, not just one section._');
  lines.push('');
  for (const axis of COMPONENT_AXES) {
    const report = buildAxisReport(axis, records, cooldownWanted);
    if (report.capacityLimited) capacityLimited.push({ title: axis.poolKey, ...report });
    lines.push(renderAxisSection(axis.poolKey, axis, report));
  }

  if (capacityLimited.length) {
    lines.push('## Axes below the requested cooldown window');
    lines.push('');
    lines.push(`The following axes cannot honor the full ${cooldownWanted}-site cooldown because their real variant pool is too small. Achievable cooldown = pool size - 1:`);
    lines.push('');
    lines.push('| Axis | Pool size | Achievable cooldown |');
    lines.push('|------|-----------|----------------------|');
    for (const c of capacityLimited) lines.push(`| ${c.title} | ${c.pool.length} | ${c.cooldown} |`);
    lines.push('');
  }

  const file = path.join(dir, 'section-variant-usage.md');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

export default writeSectionUsageReport;
