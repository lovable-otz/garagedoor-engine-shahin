/**
 * Turn raw worksheet cell-grids into arrays of header-keyed objects, using the
 * alias map so renamed/re-ordered columns keep working. This is the flexible
 * data-mapping layer the spec calls for.
 */

import { readWorkbook } from './xlsx-read.js';
import { config } from '../../config/generation.config.js';

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Given a header row (object keyed by column letter) and an alias map
 * (canonicalField -> [accepted header names]), produce columnLetter->field.
 */
function resolveColumns(headerRow, aliasMap) {
  const byName = {};
  for (const [col, label] of Object.entries(headerRow)) byName[norm(label)] = col;

  const fieldToCol = {};
  const colToField = {};
  for (const [field, aliases] of Object.entries(aliasMap)) {
    for (const alias of aliases) {
      const col = byName[norm(alias)];
      if (col) { fieldToCol[field] = col; colToField[col] = field; break; }
    }
  }
  return { fieldToCol, colToField };
}

/**
 * Convert a sheet's rows into objects keyed by canonical field name.
 * Unmapped columns are preserved under `_extra` so nothing is silently lost
 * (the schema is extensible - new columns survive to `additionalData`).
 */
function mapSheet(rows, aliasMap) {
  if (!rows.length) return { records: [], mapping: {} };
  const header = rows[0];
  const { fieldToCol, colToField } = resolveColumns(header, aliasMap);

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    // Skip completely empty rows.
    if (!Object.values(cells).some((v) => String(v).trim() !== '')) continue;
    const rec = { _row: i + 1, _extra: {} };
    for (const [field, col] of Object.entries(fieldToCol)) {
      rec[field] = cells[col] !== undefined ? String(cells[col]).trim() : '';
    }
    for (const [col, val] of Object.entries(cells)) {
      if (!colToField[col]) {
        const label = header[col];
        if (label) rec._extra[norm(label)] = val;
      }
    }
    records.push(rec);
  }
  return { records, mapping: fieldToCol };
}

/**
 * Load and map both the business sheet and the city sheet.
 * @param {string} [workbookPath]
 */
export function parseWorkbook(workbookPath = config.paths.workbook) {
  const { sheets, order } = readWorkbook(workbookPath);

  const businessSheetName =
    order.find((n) => norm(n) === norm(config.excel.businessSheet)) || order[0];
  const citySheetName =
    order.find((n) => norm(n) === norm(config.excel.citySheet)) || order[1];

  const business = mapSheet(sheets[businessSheetName] || [], config.excel.columnAliases);
  const city = mapSheet(sheets[citySheetName] || [], config.excel.cityColumnAliases);

  return {
    workbookPath,
    sheetNames: order,
    business: business.records,
    businessMapping: business.mapping,
    city: city.records,
    cityMapping: city.mapping,
  };
}

export default parseWorkbook;
