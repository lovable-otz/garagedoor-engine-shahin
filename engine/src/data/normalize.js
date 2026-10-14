/**
 * Data Normalizer: raw mapped records -> Business Data Model.
 *
 * Responsibilities:
 *  - clean and type-coerce the fields the Excel actually provides
 *  - join per-city market facts from the city sheet
 *  - attach a safe default service offering (universal work only)
 *  - record provenance and warnings; NEVER invent guarded fields
 */

import { emptyBusiness } from './model.js';
import { CORE_SERVICE_IDS, SERVICE_BY_ID } from '../../config/services.js';
import { siteContent } from '../../config/site-content.js';
import { businessImages } from '../../config/business-images.js';
import { businessContacts } from '../../config/business-contacts.js';
import { QUOTE_FORM_URL, QUOTE_FORM_HEIGHT } from '../../config/quote-form.js';
import { clean, slugify } from '../util/strings.js';

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normHex(v) {
  const s = String(v || '').trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(s)) return s.startsWith('#') ? s.toUpperCase() : `#${s.toUpperCase()}`;
  if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
    const h = s.replace('#', '');
    return `#${h.split('').map((c) => c + c).join('').toUpperCase()}`;
  }
  return '';
}

const domainKey = (d) =>
  String(d || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
const cityKey = (city, state) => `${slugify(city)}|${String(state || '').toUpperCase().trim()}`;

/**
 * Build a lookup from the city sheet keyed by both city|state and domain.
 */
function indexCityRecords(cityRecords) {
  const byCityState = {};
  const byDomain = {};
  for (const c of cityRecords) {
    const facts = {
      population: num(c.population),
      lat: num(c.lat),
      lng: num(c.lng),
      countyFips: clean(c.countyFips) || null,
      tier: clean(c.tier) || null,
      demand: num(c.demand),
      winnability: num(c.winnability),
    };
    if (c.city) byCityState[cityKey(c.city, c.state)] = facts;
    if (c.domain) byDomain[domainKey(c.domain)] = facts;
  }
  return { byCityState, byDomain };
}

/**
 * @param {object} raw   mapped business record
 * @param {object} cityIndex
 * @returns {import('./model.js').Business}
 */
export function normalizeBusiness(raw, cityIndex) {
  const b = emptyBusiness();
  const warn = (w) => b.dataWarnings.push(w);

  b.serial = num(raw.serial) || raw._row || 0;
  b.domain = domainKey(raw.domain);
  b.name = clean(raw.name);
  b.city = clean(raw.city);
  b.state = String(raw.state || '').toUpperCase().trim();
  b.address = clean(raw.address) || null;
  b.primaryColor = normHex(raw.primaryColor);
  b.slug = slugify(b.domain.replace(/\.[a-z]+$/, '') || b.name);

  b.provenance.domain = b.domain ? 'excel' : 'absent';
  b.provenance.name = b.name ? 'excel' : 'absent';
  b.provenance.city = b.city ? 'excel' : 'absent';
  b.provenance.state = b.state ? 'excel' : 'absent';
  b.provenance.address = b.address ? 'excel' : 'absent';
  b.provenance.primaryColor = b.primaryColor ? 'excel' : 'derived';

  if (!b.domain) warn('missing domain');
  if (!b.name) warn('missing business name');
  if (!b.city) warn('missing city');
  if (!US_STATES.has(b.state)) warn(`unrecognized state "${raw.state}"`);
  if (!b.primaryColor) { b.primaryColor = '#1D4ED8'; warn('missing/invalid primary color - using neutral blue'); }

  // Join market facts (prefer domain match, fall back to city|state).
  const facts =
    (b.domain && cityIndex.byDomain[b.domain]) ||
    cityIndex.byCityState[cityKey(b.city, b.state)] ||
    null;
  if (facts) {
    Object.assign(b, {
      population: facts.population, lat: facts.lat, lng: facts.lng,
      countyFips: facts.countyFips, tier: facts.tier,
      demand: facts.demand, winnability: facts.winnability,
    });
    for (const k of ['population', 'lat', 'lng', 'demand']) {
      if (b[k] != null) b.provenance[k] = 'excel';
    }
  } else {
    warn('no matching city-sheet record for market facts');
  }

  // Default service offering: universal garage-door work only. This is a
  // category truth (every garage-door business does repair/installation), not
  // a fabricated business-specific claim, so it is marked 'derived'.
  b.services = CORE_SERVICE_IDS.map((id) => SERVICE_BY_ID[id]).filter(Boolean);
  b.provenance.services = 'derived';

  // Merge OPERATOR-provided site content (config/site-content.js). The engine
  // does not invent these; the operator asserts them site-wide. Empty fields
  // stay empty so dependent sections hide themselves.
  b.site = { ...siteContent };
  // Per-domain quote-form embed, applied AFTER the shared defaults so it wins.
  // Scoped deliberately: site-content.js is one object for all 1000
  // businesses, and the 36 shipped sites must not pick this up on an unrelated
  // regeneration. See config/quote-form.js for how to widen the rollout.
  // Engine-wide since 2026-10-12 (one form for every site).
  b.site.ghlFormUrl = QUOTE_FORM_URL;
  b.site.ghlFormHeight = QUOTE_FORM_HEIGHT;
  // REAL per-business contact details (config/business-contacts.js, generated
  // from the assignment sheet by scripts/sync-contacts.mjs) take precedence
  // over everything else. Before this, phone came from site-content.js - ONE
  // value shared by all 1000 businesses - so every site published the same
  // placeholder number, with a Dallas area code regardless of the city, as a
  // live tel: link in the header, sticky mobile bar and mid-page CTA. The
  // sheet's address also supersedes the workbook's Address column, which is a
  // separate, staler source (they disagree - e.g. Chicago).
  const contact = businessContacts[b.domain] || {};
  b.phone = contact.phone || siteContent.phone || null;
  b.email = siteContent.email || null;
  b.address = contact.address || b.address || siteContent.address || null;
  b.provenance.address = contact.address ? 'sheet' : b.provenance.address;
  b.hours = siteContent.hours || null;
  b.emergencyService = siteContent.emergency247 || null;
  b.yearsInBusiness = siteContent.yearsInBusiness || null;
  b.brands = Array.isArray(siteContent.brands) ? siteContent.brands.slice() : [];
  b.warranties = siteContent.warrantyYears ? [`${siteContent.warrantyYears}-year warranty`] : [];
  b.provenance.phone = b.phone ? 'operator' : 'absent';
  b.provenance.brands = b.brands.length ? 'operator' : 'absent';

  // Per-business curated photo library (config/business-images.js), if any -
  // takes precedence over the shared pool automatically (src/assets/images.js).
  const curated = businessImages[b.domain];
  if (curated && curated.length) {
    b.images = curated.slice();
    b.provenance.images = 'operator';
  }

  // Preserve any unmapped Excel columns for future extension.
  b.additionalData = { ...raw._extra };

  return b;
}

/**
 * Normalize a full parse result into Business[].
 * @param {ReturnType<import('../excel/parse.js').parseWorkbook>} parsed
 */
export function normalizeAll(parsed) {
  const cityIndex = indexCityRecords(parsed.city || []);
  const businesses = (parsed.business || []).map((raw) => normalizeBusiness(raw, cityIndex));
  return businesses;
}

export { domainKey };
