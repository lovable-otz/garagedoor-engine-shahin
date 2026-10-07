/**
 * Per-business real photo libraries - OPERATOR-CURATED, distinct per business.
 *
 * This is the "business-supplied images" tier (highest precedence) in
 * `src/assets/images.js`'s `image(ctx, slot, alt)` resolver: when a domain has
 * an entry here, its photos are used (deduped per page) INSTEAD of everything
 * else, including the real local garage-door photo library in
 * `config/local-photos.js`. Each business's array is drawn from flat (not
 * slot-keyed) - `pickUnused()` hashes the domain+slot to pick a deterministic
 * starting point in the array.
 *
 * 2026-08-11: cleared the 10 rebuilt-batch entries that used to live here
 * (curated Unsplash CDN photos) so `config/local-photos.js` - the real,
 * purpose-organized garage-door photo folder the operator supplied - becomes
 * the active real-photo tier for those sites instead of being shadowed by
 * this higher-priority override. Leaving the mechanism itself in place: if a
 * business ever needs its OWN hand-picked set (overriding even the local
 * library), add its domain here.
 */

export const businessImages = {};

export default businessImages;
