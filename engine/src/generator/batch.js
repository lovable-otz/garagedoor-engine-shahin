/**
 * Batch generation orchestrator.
 *
 *   load dataset → for each business: assign unique design → build site → QA
 *   → record to registry → collect control row.  Then: save registry, write
 *   control sheet + error report.
 *
 * Per-business errors are isolated: one bad row is caught, recorded, and the
 * batch continues (spec §23). Uniqueness is tracked globally via the persistent
 * registry so incremental runs never conflict (spec §7/§8 + user request).
 */

import { config } from '../../config/generation.config.js';
import { loadDataset } from '../data/load.js';
import { assignUnique } from '../engine/uniqueness.js';
import { DesignRegistry } from '../engine/registry.js';
import { buildSite } from './site.js';
import { validateSite } from '../qa/validate-site.js';
import { controlRow, writeControlSheet, writeErrorReport } from './report.js';
import { writeSectionUsageReport } from './section-usage-report.js';
import { saveImageUsage } from '../engine/image-usage.js';

/**
 * @param {object} [opts]
 * @param {import('../data/model.js').Business[]} [opts.businesses]  subset to build
 * @param {object} [opts.dataset]     preloaded dataset (else loads workbook)
 * @param {string} [opts.outDir]
 * @param {number} [opts.year]
 * @param {boolean} [opts.write]       write site files (default true)
 * @param {boolean} [opts.qa]          run QA (default true)
 * @param {boolean} [opts.freshRegistry] ignore existing registry (default false)
 * @param {string}  [opts.reportName]
 * @param {(msg:string)=>void} [opts.onProgress]
 */
export function runBatch(opts = {}) {
  const dataset = opts.dataset || loadDataset();
  const businesses = opts.businesses || dataset.generatable;
  const outDir = opts.outDir || config.paths.outDir;
  const year = opts.year || new Date().getFullYear();
  const write = opts.write !== false;
  const doQa = opts.qa !== false;
  const log = opts.onProgress || (() => {});

  const registry = new DesignRegistry();
  if (!opts.freshRegistry) registry.load();

  const rows = [];
  const genErrors = [];
  const results = [];
  let idx = 0;

  for (const business of businesses) {
    idx++;
    try {
      // Uniqueness is measured against everything already recorded (this run +
      // prior runs) EXCEPT this business's own prior record, so designs never
      // conflict across incremental batches but re-generating a single site
      // (e.g. a scoped bug fix) doesn't see its own old self as a collision
      // and re-roll into an unrelated new design.
      // containerWidth was added after most sites shipped. A business already in
      // the registry keeps what it recorded - 'boxed' when the record predates
      // the axis - so a rebuild never flips a live site to full width. Only
      // brand-new businesses (or --fresh-registry runs) roll it.
      let forceVariants = business.__forceVariants;
      const prior = registry.get(business.domain);
      if (prior && !(forceVariants && forceVariants.containerWidth)) {
        forceVariants = { ...(forceVariants || {}), containerWidth: prior.fingerprint?.containerWidth || 'boxed' };
      }
      const { design, score, rerolls } = assignUnique(business, registry.window(config.uniqueness.compareWindow, business.domain), {
        forceThemeId: business.__forceTheme,
        forceVariants,
      });

      const site = buildSite(business, design, { outDir, year, write });
      const qa = doQa ? validateSite({ business, design, pages: site.pages }) : null;

      registry.record(business, design, score, rerolls);
      rows.push(controlRow({ business, design, site, qa, score, rerolls }));
      results.push({ business, design, site, qa, score, rerolls });
      log(`[${idx}/${businesses.length}] ${business.domain} → ${design.themeId} (u=${score}, ${site.pageCount}p, qa=${qa ? qa.status : 'N/A'})`);
    } catch (err) {
      genErrors.push({ domain: business.domain, error: err.message });
      // Still emit a control row marking the failure so nothing is silent.
      try {
        const { design, score, rerolls } = assignUnique(business, registry.window(config.uniqueness.compareWindow, business.domain), {});
        rows.push(controlRow({ business, design, site: null, qa: null, score, rerolls, error: err.message }));
      } catch { /* even design failed - record minimal */ }
      log(`[${idx}/${businesses.length}] ${business.domain} → ERROR: ${err.message}`);
    }
  }

  const registryFile = registry.save();
  if (write) saveImageUsage();
  const control = writeControlSheet(rows, { name: opts.reportName || 'generation-report' });
  const errorReport = writeErrorReport(dataset.validation, genErrors, {});
  const sectionUsageReport = writeSectionUsageReport(registry);

  return {
    count: businesses.length,
    generated: results.length,
    errors: genErrors.length,
    outDir,
    registryFile,
    registryStats: registry.stats(),
    control,
    errorReport,
    sectionUsageReport,
    results,
  };
}

export default runBatch;
