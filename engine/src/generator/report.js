/**
 * Generation-control reporting.
 *
 * Produces the Excel control sheet the spec asks for - one row per business,
 * recording the exact design assigned, with the actual colors PAINTED into
 * their cells (fills). Also emits a CSV mirror, a JSON manifest, and an error
 * report. The original workbook is never touched.
 */

import fs from 'node:fs';
import path from 'node:path';
import { writeXlsx } from '../excel/xlsx-write.js';
import { config } from '../../config/generation.config.js';
import localPhotos from '../../config/local-photos.js';
import { businessImages } from '../../config/business-images.js';

export const CONTROL_HEADERS = [
  'Business Name', 'Domain', 'City', 'State', 'Theme ID', 'Theme Name',
  'Primary Color', 'Secondary Color', 'Accent Color', 'Background Color',
  'Heading Font', 'Body Font',
  'Hero Variant', 'Nav Variant', 'CTA Variant', 'Service Layout', 'Review Layout',
  'Gallery Layout', 'Footer Variant', 'Layout Variant',
  'Variation Seed', 'Uniqueness Score', 'Rerolls', 'Pages Generated',
  'Content Status', 'SEO Status', 'Asset Status', 'QA Status',
  'Generation Status', 'Error', 'Notes',
];

const firstFont = (stack) => {
  const m = /"([^"]+)"|'([^']+)'/.exec(stack || '');
  return m ? (m[1] || m[2]) : (stack || '').split(',')[0];
};

/**
 * Build one control-sheet row (array of cells; color cells are {v,fill}).
 * @param {object} args
 */
export function controlRow({ business, design, site, qa, score, rerolls, error }) {
  const v = design.variants;
  const p = design.palette;
  const contentStatus = site ? (site.contentSource === 'content' ? 'rich' : site.contentSource) : 'skipped';
  const seoStatus = qa ? (qa.checks.find((c) => c.id === 'seo.canonical')?.ok ? 'ok' : 'partial') : 'N/A';
  // Was hardcoded to 'placeholders' unconditionally - stale since
  // config/local-photos.js was wired in as a real, operator-supplied photo
  // library (see its own header comment); that hardcode kept reporting
  // "placeholders" even once every generated page was using real photos.
  const assetStatus = businessImages[business.domain]
    ? 'real (business-curated)'
    : localPhotos.enabled
      ? 'real (local library)'
      : 'placeholders';
  const genStatus = error ? 'error' : site ? 'generated' : 'skipped';

  return [
    business.name, business.domain, business.city, business.state,
    design.themeId, design.themeName,
    { v: p.primary, fill: p.primary },
    { v: p.secondary, fill: p.secondary },
    { v: p.accent, fill: p.accent },
    { v: p.bg, fill: p.bg },
    firstFont(design.typography.headingFont), firstFont(design.typography.bodyFont),
    v.hero, v.nav, v.ctaStyle, v.serviceCard, v.reviewCard, v.gallery, v.footer,
    v.layout || `${v.densityTweak}/${v.radiusTweak}/${v.widthTweak}`,
    String(design.seed), score ?? '', rerolls ?? '', site ? site.pageCount : 0,
    contentStatus, seoStatus, assetStatus, qa ? qa.status : 'N/A',
    genStatus, error || '', business.dataWarnings.join('; '),
  ];
}

/** Write the Excel control sheet + CSV + JSON manifest. */
export function writeControlSheet(rows, { dir = config.paths.reportDir, name = 'generation-report' } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const xlsxFile = path.join(dir, `${name}.xlsx`);
  writeXlsx({ file: xlsxFile, sheetName: 'Generation Control', headers: CONTROL_HEADERS, rows });

  // CSV mirror (color cells rendered as their hex).
  const csv = [CONTROL_HEADERS, ...rows].map((r) => r.map((cell) => {
    const val = cell && typeof cell === 'object' ? cell.v : cell;
    const s = String(val == null ? '' : val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  fs.writeFileSync(path.join(dir, `${name}.csv`), csv);

  return { xlsx: xlsxFile, csv: path.join(dir, `${name}.csv`) };
}

/** Write the error/warning report for the data + generation run. */
export function writeErrorReport(validation, genErrors, { dir = config.paths.reportDir } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const lines = [];
  lines.push(`# Generation Error & Warning Report`);
  lines.push(`\nData validation summary: ${JSON.stringify(validation.summary)}`);
  const problems = validation.rows.filter((r) => r.level !== 'ok');
  lines.push(`\n## Data issues (${problems.length})`);
  for (const r of problems) lines.push(`- [${r.level}] #${r.serial} ${r.domain || '(no domain)'} - ${r.issues.join('; ')}`);
  lines.push(`\n## Generation errors (${genErrors.length})`);
  for (const e of genErrors) lines.push(`- ${e.domain}: ${e.error}`);
  const file = path.join(dir, 'errors.md');
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

export default { controlRow, writeControlSheet, writeErrorReport };
