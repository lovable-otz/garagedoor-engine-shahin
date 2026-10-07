/**
 * Content Adapter - loads pre-generated rich content when it exists.
 *
 * Content lives in the sibling `contents/` folder, exactly as exported from
 * each site's `content` branch (numbered subfolders, read recursively):
 *
 *   01-money-pages/   home + hub intros
 *   02-service-lines/ per-service pages
 *   03-guides/        topic guides
 *   04-suburbs/       suburb + neighborhood pages
 *   05-trust/         about/contact/faq/quote + privacy/terms/accessibility
 *   06-technical/     the export's own robots/sitemap/llms (NOT read - the
 *                     engine generates its own from what it actually built)
 *   07-suburb-services/  suburb x service pages, nested UNDER a suburb
 *
 * ── CLASSIFICATION ────────────────────────────────────────────────────────
 * Every page file carries a `page` block written by the content pipeline:
 *
 *   page: { url, custom_id, group, type, template, priority, links, ... }
 *
 * `page.type` is the authoritative classifier and is tried FIRST. The older
 * filename markers (`-svc-`, `-nb-`, `-sub-`, `-top-`, ...) remain as the
 * fallback so an export without a `page` block still loads unchanged.
 *
 * Filename conventions are NOT stable across exports and must never be the
 * only signal - measured 2026-09-09 on the Parsippany/Abilene exports:
 *   - 6 of 9 service pages are named `p-<city>-<state>-<service>.json`, with
 *     no `-svc-` marker at all. Under marker-only detection the engine
 *     silently rendered 3 of 9 services and dropped the rest with no error.
 *   - suburb-service pages are `<city>-<state>-ss-<suburb>-<service>.json`,
 *     where suburb and service cannot be split apart by string surgery
 *     ("ss-east-hanover-garage-door-repair"). `page.custom_id` carries them
 *     pipe-separated (`parsippany-nj|ss|east-hanover|garage-door-repair`) and
 *     is the only reliable split - fall back to the URL's own segments.
 *
 * ── URLS ──────────────────────────────────────────────────────────────────
 * `page.url` is authoritative (user decision, 2026-09-09: "content URLs win
 * everywhere"). It is surfaced here as `url` on every entry; the resolver in
 * content/index.js turns it into the `href` every renderer links to, falling
 * back to the engine's own derived path when a file has no `page.url`.
 *
 * The URL SHAPE differs per export and no hardcoded pattern can serve both -
 * these two shipped the same week from the same pipeline ("arm": "gdr1000"):
 *
 *   type          Parsippany                     Abilene
 *   service       /garage-door-repair-parsippany-nj   /garage-door-repair-abilene-tx
 *   suburb        /garage-doors-denville/        /near/clyde/
 *   neighborhood  /whippany-door-repair/         /local/lytle-area/
 *   subsvc        /garage-doors-denville/garage-door-repair/  /near/clyde/garage-door-repair/
 *
 * Note services carry NO trailing slash while everything else does. That is
 * deliberate in the source export (its own sitemap.xml agrees), so the
 * authored form is preserved verbatim rather than normalized.
 *
 * ── WHAT IS SKIPPED ───────────────────────────────────────────────────────
 * `index.json` / `_run.json` (export manifests, not content), anything
 * `_`/`.`-prefixed, and any page whose `status` is present and not `ok`. The
 * export also drops a plain-text `.txt` note where the writer REFUSED to
 * produce a page for lack of a real local fact (4 in Parsippany) - those are
 * not JSON and so are never picked up, which is the correct outcome: no page
 * is better than an invented one.
 *
 * This adapter NEVER fabricates. It only surfaces what the content files
 * actually contain.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';
import { SERVICE_BY_ID, SERVICES, resolveServiceId } from '../../config/services.js';
import { slugify, formatPhoneUS } from '../util/strings.js';

const TYPE_MARKERS = { home: '-home', svc: '-svc-', nb: '-nb-', sub: '-sub-', top: '-top-', trust: '-trust-', hub: '-hub-', ss: '-ss-' };
// financing / maintenance-plans added 2026-09-13 for the sitemap spec. No
// export ships either today; the routes build automatically the moment one does.
const TRUST_SUFFIXES = { about: 'about', contact: 'contact', faq: 'faq', quote: 'request-a-quote', financing: 'financing', maintenancePlans: 'maintenance-plans' };
const LEGAL_FILES = { privacy: 'privacy.json', terms: 'terms.json', accessibility: 'accessibility.json' };

/** Candidate content directories for a business, most specific first. */
function candidateDirs(business, root) {
  const cs = `${slugify(business.city)}-${(business.state || '').toLowerCase()}`;
  return [
    business.domain && path.join(root, business.domain),
    path.join(root, cs),
    path.join(root, slugify(business.city)),
  ].filter(Boolean);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

/** A page the export itself marked as not-written is never rendered. */
function isUsable(page) {
  return !!page && (page.status === undefined || page.status === 'ok');
}

/** The authored URL for a page, or null when the export didn't declare one. */
function authoredUrl(page) {
  const u = page?.page?.url;
  if (typeof u !== 'string' || !u.startsWith('/')) return null;
  return u;
}

/**
 * Map a service filename to a service id, for both naming conventions:
 *   `<city>-svc-garage-door-repair-<city>-<state>` → garage-door-repair
 *   `p-<city>-<state>-opener-repair`               → opener-repair
 * Strips the city/state affix using the business identity, then matches the
 * known catalog (longest prefix wins) before falling back to the bare slug.
 * The result is passed through resolveServiceId() so an export's own naming
 * ("opener-repair", "off-track-repair") lands on the catalog entry that holds
 * the label and icon - it NEVER affects the page's URL, which comes from
 * page.url.
 */
function svcIdFromName(afterMarker, citySuffix) {
  let cleaned = afterMarker.replace(/\.json$/i, '');
  if (citySuffix && cleaned.endsWith(citySuffix)) cleaned = cleaned.slice(0, -citySuffix.length);
  if (citySuffix && cleaned.startsWith(citySuffix.slice(1))) cleaned = cleaned.slice(citySuffix.length - 1);
  cleaned = cleaned.replace(/^-+|-+$/g, '');
  const match = SERVICES
    .map((s) => s.id)
    .filter((id) => cleaned === id || cleaned.startsWith(id + '-'))
    .sort((a, b) => b.length - a.length)[0];
  return resolveServiceId(match || cleaned);
}

function slugFromName(afterMarker) {
  return slugify(afterMarker.replace(/\.json$/i, ''));
}

/**
 * Split a suburb-service page into [suburbSlug, serviceSlug].
 *
 * `custom_id` is pipe-separated and unambiguous; the URL's last two path
 * segments are the fallback. Filename surgery is deliberately NOT attempted -
 * "ss-east-hanover-garage-door-repair" has no findable boundary.
 */
function splitSuburbService(page, file) {
  const url = authoredUrl(page);
  const urlSegs = url ? url.split('/').filter(Boolean) : [];
  const cid = page?.page?.custom_id;
  if (typeof cid === 'string') {
    const parts = cid.split('|').map((p) => p.trim()).filter(Boolean);
    const i = parts.indexOf('ss');
    if (i >= 0 && parts.length >= i + 3) {
      let svc = slugify(parts[i + 2]);
      // A garbled custom_id can carry a content hash where the service slug
      // belongs - seen on Manhattan Beach 2026-09-13
      // (`manhattan-beach-ca|ss|palos-verdes-estates|c357e552`) while the same
      // file's page.url still names the real service
      // (`/.../commercial-garage-door/`). Publishing it as-is would create
      // /<city>/<suburb>/c357e552/. Trust the URL's last segment instead.
      if (/^[0-9a-f]{6,}$/.test(svc) && urlSegs.length >= 2) svc = slugify(urlSegs[urlSegs.length - 1]);
      return [slugify(parts[i + 1]), svc];
    }
  }
  if (urlSegs.length >= 2) return [slugify(urlSegs[urlSegs.length - 2]), slugify(urlSegs[urlSegs.length - 1])];
  console.warn(`[content] suburb-service page has no custom_id or usable url, skipped: ${file}`);
  return [null, null];
}

/**
 * Recursively collect every .json file under `dir`, at any depth. A real
 * content export organizes its files into numbered subfolders - the engine
 * reads that structure AS-IS (2026-08-24, explicit user request: "content
 * should not [be] changed[,] same as from git structure") rather than
 * requiring it to be flattened. Which subfolder a file sits in never affects
 * classification.
 */
function collectJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { out.push(...collectJsonFiles(full)); continue; }
    if (!entry.name.endsWith('.json') || entry.name.startsWith('_') || entry.name === 'index.json') continue;
    out.push({ name: entry.name, full });
  }
  return out;
}

/**
 * Classify one file. `page.type` wins when present; the filename markers are
 * the fallback for exports predating the `page` block.
 *
 * 'trust' covers BOTH the four real trust pages and the three legal pages, so
 * it is never resolved from page.type alone - the filename (an exact legal
 * basename, or the suffix after `-trust-`) says which page it is.
 */
function classify(file, page) {
  const t = page?.page?.type;
  if (t === 'subsvc') return 'ss';
  if (t === 'service') return 'svc';
  if (t === 'neighborhood') return 'nb';
  if (t === 'suburb') return 'sub';
  if (t === 'topic') return 'top';
  if (t === 'home') return 'home';
  if (t === 'hub') return 'hub';
  // t === 'trust' falls through to the filename checks below on purpose.
  if (LEGAL_FILES.privacy === file || LEGAL_FILES.terms === file || LEGAL_FILES.accessibility === file) return 'legal';
  if (file.includes(TYPE_MARKERS.trust)) return 'trust';
  if (file.includes(TYPE_MARKERS.hub)) return 'hub';
  if (file.includes(TYPE_MARKERS.ss)) return 'ss';
  if (file.includes(TYPE_MARKERS.svc)) return 'svc';
  if (file.includes(TYPE_MARKERS.nb)) return 'nb';
  if (file.includes(TYPE_MARKERS.sub)) return 'sub';
  if (file.includes(TYPE_MARKERS.top)) return 'top';
  if (file.includes(TYPE_MARKERS.home) || /(^|-)home\.json$/.test(file)) return 'home';
  return null;
}

/**
 * Real content exports sometimes carry the business's phone as a bare digit
 * run ("19566466904") rather than display form. Measured 2026-08-27: 26 of the
 * 36 built sites, surfacing in <meta name="description">, page prose and
 * llms.txt - e.g. "Reach us at 19566466904 or 1900 Billy Mitchell Blvd".
 *
 * Fixed here rather than in contents/, because that folder is pulled from each
 * repo's `content` branch and any edit there is overwritten on the next pull.
 * Doing it at load time also covers all 1000 businesses, not just the ones
 * already built.
 *
 * A digit run is only ever rewritten when it EQUALS this business's own phone
 * (with or without the leading US country code), so a year, ZIP, price or
 * model number can never be mangled, and no number is ever invented - the
 * no-fabrication rule forbids inventing contact details.
 */
function normalizePhoneStrings(node, bizDigits, display) {
  if (typeof node === 'string') {
    if (!node.includes(bizDigits)) return node;
    return node.replace(/(?<!\d)\+?1?\d{10}(?!\d)/g, (m) => {
      const d = m.replace(/\D/g, '');
      return d === bizDigits || d === `1${bizDigits}` ? display : m;
    });
  }
  if (Array.isArray(node)) return node.map((v) => normalizePhoneStrings(v, bizDigits, display));
  if (node && typeof node === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = normalizePhoneStrings(v, bizDigits, display);
    return o;
  }
  return node;
}

/**
 * @param {import('../data/model.js').Business} business
 * @param {string} [contentRoot]
 * @returns {{found:boolean, dir?:string, home?:object, services:object[], neighborhoods:object[], suburbs:object[], suburbServices:object[], topics:object[], trust:object, hub:object, legal:object}}
 */
export function loadContent(business, contentRoot = config.paths.contentDir) {
  const empty = { found: false, services: [], neighborhoods: [], suburbs: [], suburbServices: [], topics: [], trust: {}, hub: {}, legal: {} };
  if (!contentRoot || !fs.existsSync(contentRoot)) return empty;

  const dir = candidateDirs(business, contentRoot).find((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());
  if (!dir) return empty;

  const files = collectJsonFiles(dir);
  const out = { found: true, dir, home: null, services: [], neighborhoods: [], suburbs: [], suburbServices: [], topics: [], trust: {}, hub: {}, legal: {} };
  const citySuffix = `-${slugify(business.city)}-${(business.state || '').toLowerCase()}`;
  const legalByFile = Object.fromEntries(Object.entries(LEGAL_FILES).map(([k, v]) => [v, k]));

  for (const { name: f, full } of files) {
    const page = readJson(full);
    if (!isUsable(page)) continue;
    const url = authoredUrl(page);
    const kind = classify(f, page);

    switch (kind) {
      case 'legal': {
        out.legal[legalByFile[f]] = page;
        break;
      }
      case 'trust': {
        // The suffix after the marker identifies WHICH fixed page this is
        // (about/contact/faq/request-a-quote) - not a free slug like nb/sub/top.
        const after = f.split(TYPE_MARKERS.trust)[1]?.replace(/\.json$/i, '');
        const key = Object.keys(TRUST_SUFFIXES).find((k) => TRUST_SUFFIXES[k] === after);
        if (key) out.trust[key] = page;
        break;
      }
      case 'hub': {
        const after = f.split(TYPE_MARKERS.hub)[1]?.replace(/\.json$/i, '') || 'service-areas';
        // 'service-areas' is the only hub type today; keyed by slug so a
        // future hub type (e.g. 'resources') drops in without code changes.
        out.hub[slugify(after)] = { page, url };
        break;
      }
      case 'svc': {
        // The `-svc-` form carries the id after the marker; the `p-` form has
        // no marker at all, so the whole basename is the candidate.
        const after = f.includes(TYPE_MARKERS.svc) ? f.split(TYPE_MARKERS.svc)[1] : f.replace(/^p-/, '');
        const id = svcIdFromName(after, citySuffix);
        out.services.push({ id, service: SERVICE_BY_ID[id] || null, page, file: f, url });
        break;
      }
      case 'nb': {
        const slug = f.includes(TYPE_MARKERS.nb) ? slugFromName(f.split(TYPE_MARKERS.nb)[1]) : slugFromName(f);
        out.neighborhoods.push({ slug, page, file: f, url });
        break;
      }
      case 'sub': {
        const slug = f.includes(TYPE_MARKERS.sub) ? slugFromName(f.split(TYPE_MARKERS.sub)[1]) : slugFromName(f);
        out.suburbs.push({ slug, page, file: f, url });
        break;
      }
      case 'ss': {
        const [areaSlug, serviceSlug] = splitSuburbService(page, f);
        if (!areaSlug || !serviceSlug) break;
        const id = resolveServiceId(serviceSlug);
        out.suburbServices.push({
          areaSlug, serviceSlug, id, service: SERVICE_BY_ID[id] || null, page, file: f, url,
        });
        break;
      }
      case 'top': {
        const slug = f.includes(TYPE_MARKERS.top) ? slugFromName(f.split(TYPE_MARKERS.top)[1]) : slugFromName(f);
        out.topics.push({ slug, page, file: f, url });
        break;
      }
      case 'home': {
        out.home = page;
        out.homeUrl = url;
        break;
      }
      default: break;
    }
  }

  const bizDigits = String(business.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (bizDigits.length === 10) {
    const display = formatPhoneUS(business.phone);
    // `dir` is left alone. `file`/`url` are walked but can never match: the
    // guard only rewrites a 10-digit run equal to this business's own phone.
    for (const k of ['home', 'services', 'neighborhoods', 'suburbs', 'suburbServices', 'topics', 'trust', 'hub', 'legal']) {
      if (out[k]) out[k] = normalizePhoneStrings(out[k], bizDigits, display);
    }
  }
  return out;
}

export default loadContent;
