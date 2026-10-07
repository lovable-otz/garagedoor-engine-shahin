/**
 * llms.txt generator (https://llmstxt.org).
 *
 * A single markdown file at the site root giving an LLM a complete, correct
 * index of what the site is and what's on it: identity + NAP, the real local
 * facts, and every page grouped by kind with its own description.
 *
 * WHY GENERATED RATHER THAN COPIED: the content exports ship their own
 * `06-technical/llms.txt`, but it is written against a different URL scheme
 * than the engine builds - it lists e.g. `/garage-door-repair-dallas-tx`
 * where the engine actually publishes `/services/garage-door-repair/`, so
 * every service link in it 404s - and it indexes ~10 pages of the 41-139 a
 * site really has. Building from the resolved content and the real page set
 * instead means the links cannot drift from what was generated.
 *
 * The one thing the engine genuinely cannot derive is the export's own
 * research - housing-stock years, climate band, the named places it studied.
 * That block IS carried over verbatim from the export's llms.txt when present
 * (see carriedKeyFacts), because it is real, operator-authored fact. Nothing
 * here is invented: every line traces to the dataset, the resolved content, or
 * that carried block, and a field with no real value is simply omitted.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';

const origin = (business) => `${config.seo.scheme}://${business.domain}`;

/** Collapse a description to one clean line - llms.txt is line-oriented. */
function oneLine(s, max = 200) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Find the export's own llms.txt anywhere under the content folder. */
function findExportLlms(dir) {
  if (!dir) return null;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (e.name.toLowerCase() === 'llms.txt') {
        try { return fs.readFileSync(full, 'utf8'); } catch { return null; }
      }
    }
  }
  return null;
}

/**
 * Pull the export's `## Key facts` bullet list. Returns [] when the export has
 * no llms.txt or no such block - the section is then omitted entirely rather
 * than filled with anything derived.
 */
function carriedKeyFacts(contentDir) {
  const raw = findExportLlms(contentDir);
  if (!raw) return [];
  const m = /^##\s*Key facts\s*$([\s\S]*?)(?=^##\s|\Z)/m.exec(raw);
  if (!m) return [];
  return m[1].split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- '));
}

/**
 * @param {object} ctx     render context (business, content, urls, has)
 * @param {Array<{pathname:string}>} pages  the pages actually generated
 */
/**
 * Two content entries can share a slug (a neighbourhood listed under two
 * spellings, or a suburb that also appears in the areas list), and they then
 * point at the SAME built page. generator/site.js already dedupes the page
 * record so sitemap.xml is clean, but the lists below are built from the
 * CONTENT rather than from `pages`, so they need their own guard - Toms River
 * otherwise repeated /service-areas/allenwood/ 15 times in this file.
 * First occurrence wins, which keeps the richest (earliest) description.
 */
function uniqueBy(list, keyOf) {
  const seen = new Set();
  return list.filter((x) => {
    const k = keyOf(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function llmsTxt(ctx, pages) {
  const b = ctx.business;
  const c = ctx.content || {};
  const base = origin(b);
  const url = (p) => `${base}${p}`;
  // Membership is checked WITHOUT a trailing slash: content-declared service
  // URLs carry none while everything else does, so comparing raw strings
  // silently dropped every service from this file.
  const built = new Set(pages.map((p) => p.pathname.replace(/\/+$/, '') || '/'));
  const isBuilt = (p) => built.has(String(p).replace(/\/+$/, '') || '/');
  const out = [];

  const loc = b.state ? `${b.city}, ${b.state}` : b.city;
  out.push(`# ${b.name}`, '');
  out.push(`> ${oneLine(
    (c.home && c.home.meta)
    || `Garage door repair and installation in ${loc} - springs, openers, off-track doors and new door installation.`,
  )}`, '');

  // NAP - real values only (config/business-contacts.js). A business with no
  // phone on file prints no phone line rather than a placeholder.
  const nap = [b.name, b.address, b.phone].filter(Boolean);
  if (nap.length > 1) out.push(`NAP: ${nap.join(' | ')}`, '');

  const facts = carriedKeyFacts(c.dir);
  if (facts.length) out.push('## Key facts', ...facts, '');

  // Fixed pages, in the order a reader would want them.
  const MAIN = [
    ['/', 'Home', c.home],
    // One hub for services AND service areas - see the canonical scheme in
    // content/index.js. /services/ and /service-areas/ no longer exist.
    [`/${c.citySlug}/`, `Garage door service in ${b.city}`, null],
    ['/service-areas/', 'Service areas', c.areasHub],
    ['/garage-doors/', 'Garage door styles we install', null],
    ['/blog/', 'Guides and resources', null],
    ['/about/', 'About', c.about],
    ['/contact/', 'Contact', c.contact],
    ['/request-a-quote/', 'Request a quote', c.quote],
    ['/maintenance-plans/', 'Maintenance plans', c.maintenancePlans],
    ['/faq/', 'FAQ', c.faqPage],
    ['/reviews/', 'Reviews', null],
    ['/financing/', 'Financing', null],
    ['/privacy/', 'Privacy Policy', c.privacy],
    ['/terms/', 'Terms of Service', c.terms],
    ['/accessibility/', 'Accessibility', c.accessibility],
  ].filter(([p]) => isBuilt(p));
  if (MAIN.length) {
    out.push('## Main pages');
    for (const [p, label, page] of MAIN) {
      const desc = oneLine((page && (page.meta || page.title)) || '');
      out.push(`- [${(page && page.h1) || label}](${url(p)})${desc ? `: ${desc}` : ''}`);
    }
    out.push('');
  }

  // Every path below is the entry's OWN resolved href (content/index.js), the
  // same string the site's links and sitemap use - never rebuilt from a slug.
  const svc = (c.services || []).filter((s) => isBuilt(s.href));
  if (svc.length) {
    out.push('## Services');
    for (const s of svc) {
      const label = (s.page && s.page.h1) || (s.service && s.service.label) || s.id;
      const desc = oneLine((s.page && s.page.meta) || '');
      out.push(`- [${label}](${url(s.href)})${desc ? `: ${desc}` : ''}`);
    }
    out.push('');
  }

  const areas = uniqueBy((c.areas || []).filter((a) => isBuilt(a.href)), (a) => a.href);
  if (areas.length) {
    out.push(`## Service areas (${areas.length})`);
    for (const a of areas) {
      const desc = oneLine((a.page && a.page.meta) || '', 140);
      out.push(`- [${a.name}](${url(a.href)})${desc ? `: ${desc}` : ''}`);
      // A suburb's own service pages are indented under it, so the nesting is
      // legible to a reader (and a crawler) rather than a flat list of 40
      // near-identical URLs at the end of the file.
      for (const ss of (a.services || []).filter((x) => isBuilt(x.href))) {
        const sd = oneLine((ss.page && ss.page.meta) || '', 140);
        out.push(`  - [${ss.label} in ${a.name}](${url(ss.href)})${sd ? `: ${sd}` : ''}`);
      }
    }
    out.push('');
  }

  const topics = uniqueBy((c.topics || []).filter((t) => isBuilt(t.href)), (t) => t.href);
  if (topics.length) {
    out.push('## Guides');
    for (const t of topics) {
      const label = (t.page && t.page.h1) || t.name;
      const desc = oneLine((t.page && t.page.meta) || '');
      out.push(`- [${label}](${url(t.href)})${desc ? `: ${desc}` : ''}`);
    }
    out.push('');
  }

  // Real authored FAQ only - the dedicated FAQ page's list when the export
  // shipped one, else the home page's.
  const faq = ((c.faqPage && c.faqPage.faq && c.faqPage.faq.length) ? c.faqPage.faq : c.faq) || [];
  if (faq.length) {
    out.push('## Common questions');
    for (const q of faq) out.push(`- **${oneLine(q.q, 160)}** ${oneLine(q.a, 400)}`);
    out.push('');
  }

  out.push('## Contact');
  if (b.phone) out.push(`- Phone: ${b.phone}`);
  if (b.address) out.push(`- Address: ${b.address}`);
  out.push(`- Request a quote: ${url('/request-a-quote/')}`);
  if (built.has('/contact/')) out.push(`- Contact page: ${url('/contact/')}`);
  out.push(`- Service area: ${loc}${areas.length ? ` and ${areas.length} nearby neighborhoods and communities` : ' and surrounding communities'}`);
  out.push('');

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

export default llmsTxt;
