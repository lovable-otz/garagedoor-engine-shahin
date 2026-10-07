/**
 * OPERATOR-PROVIDED SITE CONTENT (global defaults for every generated site).
 *
 * IMPORTANT - the engine NEVER invents business facts. Everything a garage-door
 * site would claim (phone, hours, 24/7, brands serviced, warranty, financing,
 * review ratings) is set HERE by you, the operator, and merged onto every
 * business. Leave a field empty / null / false and the section that depends on
 * it simply doesn't render. Per-business overrides can be added later via the
 * Excel (extra columns) or a JSON side-file without touching the engine.
 *
 * These are asserted by you and applied site-wide; they are your business
 * decisions, not fabricated per-row data.
 */

export const siteContent = {
  // ---- Contact / conversion -------------------------------------------------
  // DEMO placeholder - uses the reserved fictional 555-01xx range so it never
  // dials a real line. REPLACE with the real business number before going live.
  // Phone is PER BUSINESS, not site-wide - see config/business-contacts.js
  // (generated from the assignment sheet by scripts/sync-contacts.mjs) and
  // where normalize.js applies it. This stays null on purpose: it used to
  // hold '(214) 555-0100', which every one of the 1000 businesses inherited,
  // so non-Dallas sites published a Dallas area code (and a reserved
  // fictional-range number) as a live tel: link on every page. Null means a
  // business with no real number renders NO call button anywhere rather than
  // a wrong one - callCta() already returns null when phone is absent. Do not
  // put a shared number back here.
  phone: null,                    // header call button, utility-bar number, sticky mobile "Call" - all gated on a REAL number
  // 2026-09-13 (user: no fake data): the next four defaults were set true/filled
  // for every site without any real per-business source, so they published
  // unverified claims. Off until a real value exists for a business.
  hours: '',                      // shown in the announcement bar; '' to hide
  email: '',                      // shown on the contact page if set
  // Business address for the contact page + map. Leave '' to center the map on
  // the city (from the dataset's lat/lng) and show the service-area instead.
  address: '',                    // e.g. '1234 Main St, Dallas, TX 75201'
  emergency247: false,            // set FALSE unless you truly offer 24/7 emergency service
  freeEstimate: false,            // "Free estimate" messaging (industry-standard; you confirm)
  noServiceCallFee: false,        // "No service-call fee"
  // Footer trust-badge claims (2026-10-07 footer). Off until real for a business.
  sameDay: false,                 // "Same-day service available"
  upfrontPricing: false,          // "Upfront, written pricing"

  // GoHighLevel embedded "Request a Quote" form. Paste your form/widget URL.
  // When empty, the quote page shows a graceful fallback + your other CTAs.
  ghlFormUrl: '',                 // e.g. 'https://api.leadconnectorhq.com/widget/form/AbC123'
  ghlFormHeight: 980,           // pre-load reservation; form_embed.js resizes to the real height

  // ---- Trust / credentials --------------------------------------------------
  yearsInBusiness: null,          // e.g. 12  (number)
  license: '',                    // e.g. 'TX DOL #ACR-1234567'
  insured: false,                 // "licensed & insured" - you confirm
  warrantyYears: null,            // e.g. 10  → "10-year warranty" callout

  // Named certifying bodies/trade credentials you actually hold (e.g.
  // 'IDEA Certified Technician'). Empty by default - the certifications
  // section only renders once real names are added here; nothing is invented.
  certifications: [],
  // Real warranty COVERAGE detail beyond the year count above (what's
  // covered, exclusions, transferability). null by default - the section
  // stays off until you provide real terms.
  warrantyDetail: null,           // e.g. { coverage: 'Parts and labor', exclusions: 'Normal wear items', transferable: false }
  // A real, measured average response time (not an estimate/promise) if you
  // track one. null by default.
  responseTime: null,             // e.g. { avgMinutes: 45, note: 'Same-metro calls' }
  // Real founding facts / milestones for an "our story" narrative. Empty by
  // default - no history is invented if this stays empty.
  companyStory: [],               // e.g. [{ year: 2012, event: 'Founded in ...' }]

  // Brands you SERVICE (industry-standard names; edit to match reality).
  brands: [],                     // was 6 unverified brand names shown on every site

  // Review-platform badges - only add ones you actually have a profile on.
  // Ratings/counts are REAL numbers you provide; the engine won't guess them.
  reviewBadges: [
    // { platform: 'Google', rating: 4.9, count: 320, url: '' },
    // { platform: 'BBB', rating: null, count: null, url: '', note: 'A+ Accredited' },
  ],

  // Financing - DISABLED. No financing section or /financing/ page on any site.
  // (The engine also no longer injects a financing section into the homepage
  // order - see augmentOrder in generator/pages.js.)
  financing: null,

  // ---- Products / door catalog ---------------------------------------------
  // The engine renders an illustrated door-style catalog from these keys.
  doorStyles: ['sectional', 'carriage', 'modern-flush', 'full-view', 'raised-panel', 'commercial'],

  // ---- Optional custom announcement (overrides the auto one) ----------------
  announcement: '',
};

export default siteContent;
