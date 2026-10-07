/**
 * The normalized Business Data Model - the single internal schema every
 * downstream engine consumes. It is intentionally a SUPERSET of what the Excel
 * provides: fields the dataset doesn't contain stay null/empty, and components
 * that depend on them are omitted rather than filled with invented values.
 *
 * @typedef {Object} Review
 * @property {string} author
 * @property {number} rating
 * @property {string} text
 * @property {string} [date]
 *
 * @typedef {Object} Business
 * @property {number} serial
 * @property {string} domain            - authoritative identity (from Excel)
 * @property {string} name              - business name (from Excel)
 * @property {string} city              - (from Excel)
 * @property {string} state             - 2-letter (from Excel)
 * @property {string} primaryColor      - #hex brand color (from Excel)
 * @property {string} slug              - derived url-safe id
 *
 * // --- Geo/market facts (from city sheet; real data only) ---
 * @property {number|null} population
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {string|null} countyFips
 * @property {string|null} tier
 * @property {number|null} demand
 * @property {number|null} winnability
 *
 * // --- Derived service offering (safe defaults, never fabricated claims) ---
 * @property {Array<object>} services
 *
 * // --- Fields the dataset does NOT contain. Kept for schema completeness and
 * //     populated ONLY from an approved content source. Never invented. ---
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string|null} address
 * @property {string|null} zip
 * @property {string|null} hours
 * @property {string|null} description
 * @property {string[]} serviceAreas
 * @property {Review[]} reviews
 * @property {number|null} rating
 * @property {number|null} reviewCount
 * @property {string[]} brands
 * @property {string[]} certifications
 * @property {string[]} warranties
 * @property {boolean|null} emergencyService
 * @property {number|null} yearsInBusiness
 * @property {string[]} images
 * @property {string|null} logo
 * @property {string[]} socialProfiles
 *
 * // --- Extensibility + provenance ---
 * @property {Record<string,any>} additionalData
 * @property {string[]} dataWarnings
 * @property {Record<string,'excel'|'content'|'derived'|'absent'>} provenance
 */

/** Fields that must never be fabricated. Mirrors config.content.neverFabricate. */
export const FABRICATION_GUARDED = new Set([
  'phone', 'email', 'address', 'zip', 'hours', 'description',
  'reviews', 'rating', 'reviewCount', 'yearsInBusiness',
  'certifications', 'warranties', 'brands', 'emergencyService', 'serviceAreas',
]);

/** Produce an empty model with safe defaults. */
export function emptyBusiness() {
  return {
    serial: 0,
    domain: '', name: '', city: '', state: '', primaryColor: '', slug: '',
    population: null, lat: null, lng: null, countyFips: null,
    tier: null, demand: null, winnability: null,
    services: [],
    phone: null, email: null, address: null, zip: null, hours: null, description: null,
    serviceAreas: [], reviews: [], rating: null, reviewCount: null,
    brands: [], certifications: [], warranties: [],
    emergencyService: null, yearsInBusiness: null,
    images: [], logo: null, socialProfiles: [],
    additionalData: {}, dataWarnings: [], provenance: {},
  };
}
