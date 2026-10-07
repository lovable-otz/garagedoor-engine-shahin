/**
 * Orchestrates the read → map → normalize → validate pipeline and returns a
 * ready-to-generate dataset. This is the single entry point the CLI and
 * generator use to obtain businesses.
 */

import { parseWorkbook } from '../excel/parse.js';
import { normalizeAll } from './normalize.js';
import { validateBusinesses } from './validate.js';
import { config } from '../../config/generation.config.js';

/**
 * @param {object} [opts]
 * @param {string} [opts.workbook]
 */
export function loadDataset(opts = {}) {
  const workbook = opts.workbook || config.paths.workbook;
  const parsed = parseWorkbook(workbook);
  const businesses = normalizeAll(parsed);
  const validation = validateBusinesses(businesses);

  return {
    workbook,
    sheetNames: parsed.sheetNames,
    businessMapping: parsed.businessMapping,
    cityMapping: parsed.cityMapping,
    businesses,
    validation,
    /** businesses safe to generate (excludes hard errors) */
    generatable: businesses.filter(
      (_, i) => validation.rows[i].level !== 'error',
    ),
    byDomain: Object.fromEntries(businesses.map((b) => [b.domain, b])),
  };
}

export default loadDataset;
