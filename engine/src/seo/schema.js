/**
 * Structured data (JSON-LD).
 *
 * Only emits properties backed by real data. Notably:
 *  - NO aggregateRating / review markup (the dataset has none - fabricating it
 *    would be both dishonest and a Google policy violation).
 *  - NO telephone/address/openingHours unless the business actually provides
 *    them (it currently doesn't).
 *  - FAQPage schema only when genuine Q&A content exists.
 */

import { config } from '../../config/generation.config.js';
import { canonicalUrl } from './meta.js';

function ld(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

/** LocalBusiness for the site (home/contact). */
/** "3232 McKinney Ave, Dallas, TX 75204" -> "3232 McKinney Ave". Returns ''
 *  for a value with no comma, so a partial/odd address is skipped rather than
 *  guessed at. */
function streetOf(address) {
  const s = String(address || '').trim();
  if (!s.includes(',')) return '';
  return s.split(',')[0].trim();
}

/** Trailing 5- or 9-digit ZIP off the same one-line address, if present. */
function postalOf(address) {
  const m = /\b(\d{5}(?:-\d{4})?)\s*$/.exec(String(address || '').trim());
  return m ? m[1] : '';
}

/**
 * @param {string[]} [areaServed] the site's real served areas - the city plus
 *   each published suburb's own authored `schema_facts.areaServed`. Never built
 *   from slugs. Falls back to the business's city when absent.
 */
export function localBusiness(business, areaServed) {
  if (!config.seo.jsonLd) return '';
  const node = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${config.seo.scheme}://${business.domain}/#business`,
    name: business.name,
    url: `${config.seo.scheme}://${business.domain}/`,
    areaServed: Array.isArray(areaServed) && areaServed.length
      ? areaServed
      : (business.state ? `${business.city}, ${business.state}` : business.city),
    address: {
      '@type': 'PostalAddress',
      // Real street address when we have one (config/business-contacts.js, from
      // the assignment sheet). Parsed off the front of the full one-line
      // address - everything before the first comma - since the locality,
      // region and postcode that follow are already carried by their own
      // fields. Omitted entirely when absent: a LocalBusiness without a
      // streetAddress is valid, an invented one is not.
      streetAddress: streetOf(business.address) || undefined,
      postalCode: postalOf(business.address) || undefined,
      addressLocality: business.city || undefined,
      addressRegion: business.state || undefined,
      addressCountry: 'US',
    },
  };
  if (business.lat != null && business.lng != null) {
    node.geo = { '@type': 'GeoCoordinates', latitude: business.lat, longitude: business.lng };
  }
  // Only include fields we actually have. Guarded fields intentionally omitted.
  if (business.phone) node.telephone = business.phone;
  if (business.logo) node.logo = business.logo;
  return ld(node);
}

/** Service schema for a service page. */
/**
 * @param {string} [areaServed] narrower area than the business's own city -
 *   passed by a suburb-service page, where the real authored areaServed is the
 *   suburb ("Denville, NJ"), not the metro. Comes from the page's own
 *   `schema_facts.areaServed`; never assembled from a slug, never invented.
 */
export function serviceSchema(business, service, areaServed, description) {
  if (!config.seo.jsonLd) return '';
  return ld({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.label,
    provider: { '@type': 'LocalBusiness', name: business.name, '@id': `${config.seo.scheme}://${business.domain}/#business` },
    areaServed: areaServed || (business.state ? `${business.city}, ${business.state}` : business.city),
    // The page's own authored meta - never the catalog's generic blurb (2026-09-13, no fake data).
    description: description || undefined,
  });
}

/** FAQPage schema - only for genuine FAQ content. */
export function faqSchema(faq) {
  if (!config.seo.jsonLd || !config.features.faqSchema) return '';
  const items = (faq || []).filter((f) => f && f.q && f.a);
  if (items.length < 2) return '';
  return ld({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
}

/** BreadcrumbList schema. */
export function breadcrumbSchema(business, crumbs) {
  if (!config.seo.jsonLd || !crumbs || crumbs.length < 2) return '';
  return ld({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: canonicalUrl(business, c.href),
    })),
  });
}

export default { localBusiness, serviceSchema, faqSchema, breadcrumbSchema };
