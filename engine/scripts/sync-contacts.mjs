#!/usr/bin/env node
/**
 * Regenerate `config/business-contacts.js` from the shared assignment sheet.
 *
 * WHY THIS EXISTS: phone and address used to come from
 * `config/site-content.js`, which holds ONE value shared by every business -
 * so all 1000 sites published the same number. That number was
 * `(214) 555-0100`: a reserved fictional-range number, and a Dallas area code
 * on every non-Dallas site. It rendered as a real `tel:` link in the header,
 * the sticky mobile bar and the mid-page CTA on every page. The assignment
 * sheet already carries the REAL per-business phone and address (the same
 * columns `generate-assignment.mjs` reads), so this pulls them into a config
 * the engine can use offline, per business.
 *
 * The sheet is the source of truth; this file is generated FROM it - re-run
 * this rather than hand-editing `config/business-contacts.js`.
 *
 *   node scripts/sync-contacts.mjs           # rewrite the config
 *   node scripts/sync-contacts.mjs --dry-run # report only
 *
 * Nothing here invents data: a row with no usable phone simply gets no phone,
 * and the site then renders no call button at all (see callCta() in
 * components/index.js) rather than a wrong one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatPhoneUS, clean } from '../src/util/strings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'config', 'business-contacts.js');
const SHEET_ID = '1y4lOUGWuznvEHKPTPAgiW6dmtqvKk3xwGL_wSq-cUgw';
const SHEET_GID = '0';

/** Minimal RFC4180 CSV parser - same shape as generate-assignment.mjs. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const domainKey = (d) =>
  String(d || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  console.log('Fetching assignment sheet...');
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const header = rows[0];
  const recs = rows.slice(1)
    .filter((r) => r.length === header.length && r.some(Boolean))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));

  const out = {};
  let phones = 0, addresses = 0;
  for (const r of recs) {
    const domain = domainKey(r.Domain);
    if (!domain) continue;
    const entry = {};
    // formatPhoneUS returns the input unchanged when it isn't 10/11 digits -
    // only accept a value it actually normalized, so a half-filled cell can
    // never become a dialable-looking link.
    const phone = formatPhoneUS(r.Phone);
    if (phone && /^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) { entry.phone = phone; phones++; }
    const address = clean(r.Address);
    if (address) { entry.address = address; addresses++; }
    if (Object.keys(entry).length) out[domain] = entry;
  }

  console.log(`  ${recs.length} rows -> ${Object.keys(out).length} businesses (${phones} with a phone, ${addresses} with an address)`);
  if (dryRun) { console.log('  (dry-run, nothing written)'); return; }

  const body = Object.entries(out)
    .map(([d, e]) => `  '${d}': { ${[
      e.phone ? `phone: '${e.phone}'` : null,
      e.address ? `address: ${JSON.stringify(e.address)}` : null,
    ].filter(Boolean).join(', ')} },`)
    .join('\n');

  const file = `/**
 * REAL per-business phone + address, keyed by domain.
 *
 * GENERATED - do not hand-edit. Re-run \`node scripts/sync-contacts.mjs\` to
 * refresh from the assignment sheet, which is the source of truth.
 *
 * Consumed by src/data/normalize.js, which applies these ahead of both the
 * workbook's own Address column and config/site-content.js. A business absent
 * from this map, or present without a phone, gets NO phone - the engine then
 * renders no call button anywhere rather than a shared placeholder (the
 * no-fabrication rule; see config/generation.config.js content.neverFabricate).
 */
export const businessContacts = {
${body}
};

export default businessContacts;
`;
  fs.writeFileSync(OUT, file);
  console.log(`  wrote ${path.relative(path.join(__dirname, '..'), OUT)}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
