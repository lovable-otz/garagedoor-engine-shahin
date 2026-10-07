/**
 * Validation + error reporting. One bad row must never stop the batch, so
 * validation classifies each business as ok | warning | error and lets the
 * generator skip only true errors.
 */

/**
 * @param {import('./model.js').Business[]} businesses
 * @returns {{ rows: Array, summary: object }}
 */
export function validateBusinesses(businesses) {
  const seenDomains = new Map();
  const rows = [];
  let errors = 0, warnings = 0, ok = 0, duplicates = 0;

  for (const b of businesses) {
    const issues = [...b.dataWarnings];
    let level = 'ok';

    // Hard errors: cannot build an identity without domain OR name.
    if (!b.domain && !b.name) { issues.push('no domain and no name - cannot generate'); level = 'error'; }

    // Duplicate domain detection (later duplicates flagged, first wins).
    if (b.domain) {
      if (seenDomains.has(b.domain)) {
        issues.push(`duplicate domain (first seen row ${seenDomains.get(b.domain)})`);
        duplicates++;
        if (level !== 'error') level = 'warning';
      } else {
        seenDomains.set(b.domain, b.serial);
      }
    }

    if (level === 'ok' && issues.length) level = 'warning';

    if (level === 'error') errors++;
    else if (level === 'warning') warnings++;
    else ok++;

    rows.push({
      serial: b.serial, domain: b.domain, name: b.name,
      city: b.city, state: b.state, level, issues,
    });
  }

  return {
    rows,
    summary: { total: businesses.length, ok, warnings, errors, duplicates },
  };
}

export default validateBusinesses;
