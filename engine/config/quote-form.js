/**
 * Per-domain "Request a Quote" form embed.
 *
 * config/site-content.js is ONE object shared by all 1000 businesses
 * (normalize.js does b.site = { ...siteContent }), so putting the form URL
 * there would hand it to every business in the workbook, not just the ones
 * actually built. This map keeps the rollout explicit.
 *
 * Rolled out to the 30 August batch first (2026-08-30), then to every other
 * built site on instruction: "now implement the form same way as latest site".
 *
 * TO ADD MORE SITES: list the domain below and regenerate that site. Nothing
 * else changes - quoteEmbed() already prefers a real embed over the built-in
 * fallback form.
 */
// 2026-10-12, user: "use this form enginewise now in the request-a-quote page"
// ("Garage door new forms" / "Contact Us | Garage Door"). Applied to EVERY
// business by normalize.js - QUOTE_FORM_DOMAINS below is kept only as history
// of the earlier per-domain rollout and no longer gates anything.
export const QUOTE_FORM_URL = 'https://api.leadconnectorhq.com/widget/form/9edkR66EHmW5UBwtrYry';
export const QUOTE_FORM_NAME = 'Contact Us | Garage Door';
export const QUOTE_FORM_HEIGHT = 1336;

export const QUOTE_FORM_DOMAINS = new Set([
  // ---- 30 August 2026 batch (serials 236-256)
  'abilenegaragedoorpros.com',
  'arvadagaragedoorpros.com',
  'cheyennegaragedoorpros.com',
  'hugogaragedoorpros.com',
  'idahofallsgaragedoorpros.com',
  'jacksonvillegaragedoorco.com',
  'lascrucesgaragedoorpros.com',
  'livoniagaragedoorpros.com',
  'lodigaragedoorpros.com',
  'madisongaragedoorco.com',
  'mortongrovegaragedoorpros.com',
  'oremgaragedoorpros.com',
  'petalumagaragedoorpros.com',
  'philadelphiagaragedoorpros.com',
  'pittsburghgaragedoorpros.com',
  'renogaragedoorpros.com',
  'sanmarcosgaragedoorpros.com',
  'tracygaragedoorpros.com',
  'weatherfordgaragedoorpros.com',
  'wenatcheegaragedoorpros.com',
  // ---- earlier batches: 24, 25 and 27 August 2026
  'albuquerquegaragedoorco.com',
  'auburngaragedoorpros.com',
  'brownsvillegaragedoorpros.com',
  'burbankgaragedoorpros.com',
  'chicagogaragedoorco.com',
  'coloradospringsgaragedoorpros.com',
  'dallasdoorpros.com',
  'danapointgaragedoorco.com',
  'fortlauderdalegaragedoorpros.com',
  'garlandgaragedoorpros.com',
  'godenvergaragedoor.com',
  'hesperiagaragedoorpros.com',
  'humblegaragedoorpros.com',
  'irvinggaragedoorpros.com',
  'kansascitygaragedoorpros.com',
  'longmontgaragedoorpros.com',
  'lovelandgaragedoorpros.com',
  'manhattanbeachgaragedoorpros.com',
  'mckinneygaragedoorco.com',
  'miamigaragedoorco.com',
  'murfreesborogaragedoorco.com',
  'newarkgaragedoorpros.com',
  'northbrookgaragedoorpros.com',
  'orlandogaragedoorpros.com',
  'parmagaragedoorpros.com',
  'pasadenagaragedoorpros.com',
  'phoenixgaragedoorco.com',
  'raleighgaragedoorco.com',
  'reynoldsburggaragedoorpros.com',
  'sandiegogaragedoorco.com',
  'santamonicagaragedoorpros.com',
  'searcygaragedoorpros.com',
  'springfieldgaragedoorpros.com',
  'tomsrivergaragedoorpros.com',
  'venicegaragedoorpros.com',
  'youngstowngaragedoorpros.com',
  // ---- 31 August 2026 batch (serials 111-168)
  // Listed the same day these were generated, so a later rebuild emits the
  // embed natively and apply-quote-form.mjs stays a no-op for them.
  'hanfordgaragedoorpros.com',
  'lincolnwoodgaragedoorpros.com',
  'martinsburggaragedoorpros.com',
  'marysvillegaragedoorpros.com',
  'matthewsgaragedoorpros.com',
  'mundeleingaragedoorpros.com',
  'paysongaragedoorpros.com',
  'prospergaragedoorpros.com',
  'spanishforkgaragedoorpros.com',
  'strongsvillegaragedoorpros.com',
  // ---- 1 September 2026 batch (serials 310-338)
  'chaskagaragedoorpros.com',
  'kansascitygaragedoorco.com',
  'sunprairiegaragedoorpros.com',
  'porthurongaragedoorpros.com',
  'duncanvillegaragedoorpros.com',
  'vernonhillsgaragedoorpros.com',
  'daphnegaragedoorpros.com',
  // ---- 2 September 2026 batch (serials 279-307)
  'rochesterhillsgaragedoorpros.com',
  'westbendgaragedoorpros.com',
  'rockwallgaragedoorpros.com',
  'texascitygaragedoorpros.com',
  'springfieldgaragedoorco.com',
  'prescottvalleygaragedoorpros.com',
  'brightongaragedoorpros.com',
]);

export default { QUOTE_FORM_URL, QUOTE_FORM_DOMAINS };
