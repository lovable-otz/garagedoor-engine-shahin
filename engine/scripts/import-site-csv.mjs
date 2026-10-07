#!/usr/bin/env node
/**
 * Import the team's two site CSVs and split the 1000 businesses into
 * DELIVERED vs the NEW batch (2026-10-07, user: "without builded 360 sites,
 * those are already delivered" - the new batch is everything else).
 *
 *   SITE_CONTACT.csv   serial,city,state,domain,phone,address
 *   garage_door.csv    domain,number
 *
 * A business is DELIVERED when SITE_CONTACT.csv gives it a phone (all 360 such
 * rows are already shipped by someone on the team). Everything else in the
 * engine dataset is the NEW batch.
 *
 * Writes:
 *   config/delivered-sites.js       DELIVERED set - batch runs skip these
 *                                   (cli.js --all/--limit, generate-assignment)
 *   batches/new-sites.rows.json     the new batch, in the exact row shape
 *                                   `generate-assignment.mjs --rows` takes
 *   batches/new-sites.report.md     what was imported + anything needing a human
 *
 * Read-only on the CSVs, the workbook and config/business-contacts.js. Never
 * invents a phone or address: a new site with none in the CSV gets none (no
 * call button), same as every other site (no-fabrication rule).
 *
 *   node scripts/import-site-csv.mjs --contacts <SITE_CONTACT.csv> --domains <garage_door.csv>
 *   node scripts/import-site-csv.mjs ... --dry-run     (report only)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '../src/data/load.js';
import { formatPhoneUS } from '../src/util/strings.js';
import { businessContacts } from '../config/business-contacts.js';

const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GIT_BASE = 'https://github.com/OrangeToolzBD/';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[argv[i].slice(2)] = true;
    else { out[argv[i].slice(2)] = next; i++; }
  }
  return out;
}

/** Minimal RFC4180 CSV parser - same shape as generate-assignment.mjs. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
}

// CSV domain differs from the workbook and the user confirmed the WORKBOOK
// one is right (2026-10-07: "keep the co domains for 870 and 877").
const CONFIRMED_DATASET_DOMAIN = {
  870: 'palmbeachgardensgaragedoorco.com',
  877: 'ellicottcitygaragedoorco.com',
};

const digits = (p) => String(p || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
// A REAL phone is 10 digits (after dropping a leading 1). Anything shorter -
// e.g. a 3-digit area code someone typed into the Phone column - is not a
// phone and must never mark a site delivered or render a call button.
const isPhone = (p) => digits(p).length === 10;

const args = parseArgs(process.argv.slice(2));
if (!args.contacts || !args.domains) {
  console.error('usage: node scripts/import-site-csv.mjs --contacts <SITE_CONTACT.csv> --domains <garage_door.csv> [--dry-run]');
  process.exit(1);
}
const contacts = parseCsv(fs.readFileSync(args.contacts, 'utf8'));
const numbers = parseCsv(fs.readFileSync(args.domains, 'utf8'));
const dataset = loadDataset();
const bySerial = new Map(dataset.businesses.map((b) => [String(b.serial), b]));

const issues = [];
const numberOf = new Map(numbers.map((r) => [r.domain.toLowerCase(), r.number]));
const contactOf = new Map();
for (const r of contacts) {
  const b = bySerial.get(r.serial);
  if (!b) { issues.push(`SITE_CONTACT serial ${r.serial} (${r.domain || 'no domain'}) is not in the engine dataset - ignored`); continue; }
  const d = r.domain.toLowerCase();
  if (d && d !== b.domain.toLowerCase() && CONFIRMED_DATASET_DOMAIN[r.serial] !== b.domain.toLowerCase()) issues.push(`#${r.serial}: SITE_CONTACT says ${d}, engine dataset says ${b.domain} - kept the dataset's domain, confirm which is right`);
  if (r.city.toLowerCase() !== b.city.toLowerCase() || r.state.toUpperCase() !== String(b.state || '').toUpperCase()) issues.push(`#${r.serial} ${b.domain}: SITE_CONTACT city/state ${r.city}, ${r.state} differs from dataset ${b.city}, ${b.state}`);
  contactOf.set(b.domain.toLowerCase(), r);
}
for (const [d, n] of numberOf) {
  const c = contactOf.get(d);
  if (c && isPhone(n) && isPhone(c.phone) && digits(n) !== digits(c.phone)) issues.push(`${d}: phone differs between files (SITE_CONTACT ${c.phone}, garage_door ${n})`);
}

const delivered = [];
const fresh = [];
for (const b of dataset.businesses) {
  const d = b.domain.toLowerCase();
  const c = contactOf.get(d) || {};
  const phone = isPhone(c.phone) ? c.phone : (isPhone(numberOf.get(d)) ? numberOf.get(d) : '');
  if (isPhone(c.phone)) { delivered.push(d); continue; }
  fresh.push({
    Serial: b.serial, Domain: b.domain, City: b.city, State: b.state,
    'Git URL': `${GIT_BASE}${b.domain}`,
    Phone: phone ? formatPhoneUS(phone) : '',
    // SITE_CONTACT leaves the new rows' address blank; the engine's own
    // contacts (from the team sheet) already carry a real one for all 1000.
    // #870/#877 keep the workbook's `co` domain, but the contacts file is keyed
    // by the sheet's `pros` spelling - look that up too.
    Address: c.address || (businessContacts[d] || {}).address || (businessContacts[(c.domain || '').toLowerCase()] || {}).address || '',
  });
}
const withPhone = fresh.filter((r) => r.Phone).length;

const report = [
  `# Site CSV import (${new Date().toISOString().slice(0, 10)})`,
  '',
  `- Sources: \`${args.contacts}\`, \`${args.domains}\``,
  `- Engine dataset: ${dataset.businesses.length} businesses`,
  `- **Delivered** (phone in SITE_CONTACT): ${delivered.length} -> config/delivered-sites.js`,
  `- **New batch**: ${fresh.length} -> batches/new-sites.rows.json (${withPhone} with a phone, ${fresh.length - withPhone} without - those render no call button until a real number is added)`,
  '',
  `## Needs a decision (${issues.length})`,
  ...(issues.length ? issues.map((i) => `- ${i}`) : ['- none']),
  '',
].join('\n');

console.log(report);
if (args['dry-run']) process.exit(0);

fs.writeFileSync(path.join(ENGINE, 'config', 'delivered-sites.js'), `/**
 * Sites already DELIVERED by the team - GENERATED by scripts/import-site-csv.mjs
 * from SITE_CONTACT.csv (a row with a phone = delivered). Do not hand-edit;
 * re-run the import instead.
 *
 * Batch runs skip these: cli.js --all/--limit (override --include-delivered)
 * and generate-assignment.mjs (override --repull). A single explicit
 * --business build is still allowed - that is how an approved per-site fix runs.
 */
export const DELIVERED_SITES = new Set(${JSON.stringify(delivered.sort(), null, 2)});
`);
fs.mkdirSync(path.join(ENGINE, 'batches'), { recursive: true });
fs.writeFileSync(path.join(ENGINE, 'batches', 'new-sites.rows.json'), JSON.stringify(fresh, null, 1) + '\n');
fs.writeFileSync(path.join(ENGINE, 'batches', 'new-sites.report.md'), report);
console.log('Wrote config/delivered-sites.js, batches/new-sites.rows.json, batches/new-sites.report.md');
