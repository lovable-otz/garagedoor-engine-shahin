/**
 * Image / Asset abstraction layer with PER-PAGE DEDUPLICATION.
 *
 * `image(ctx, slot, alt)` resolves a photo (or SVG illustration) for a slot,
 * tracking which photos have already been used on the CURRENT page (via
 * `ctx._imgUsed`) so the same photo never appears twice on one page. Call
 * `newPage(ctx)` at the start of each page build to reset the tracker.
 *
 * Precedence: business-supplied images → curated Unsplash photo (deduped) → SVG.
 */

import { fnv1a } from '../util/hash.js';
import { esc } from '../util/html.js';
import { houseScene, doorStyle, DOOR_STYLE_KEYS, DOOR_STYLE_LABELS } from './illustrations.js';
import { images as PHOTOS } from '../../config/images.js';
import { localPhotos as LOCAL } from '../../config/local-photos.js';
import { getUsage, recordUsage } from '../engine/image-usage.js';

/** Reset the per-page image-dedup tracker. Call at the start of each page. */
export function newPage(ctx) {
  ctx._imgUsed = new Set();
  return ctx;
}

/**
 * Deterministic pick from a pool, preferring whichever candidate the FEWEST
 * other businesses have used so far (see engine/image-usage.js) - not just
 * the first not-yet-used-on-THIS-page item. Ties break on a hash of
 * (business, slot, CANDIDATE) - a value that's independent per candidate,
 * not a single shared rotation offset for the whole scan. That distinction
 * matters once usage counts are high and roughly even across a pool (any
 * large multi-page site will touch most of a ~40-photo category pool many
 * times over just covering its own pages): confirmed real (2026-08-24) that
 * an EARLIER version of this function used one shared `start` offset per
 * business+slot, so whenever two businesses' domain hashes happened to
 * collide on the same starting index (here: Dallas and Chicago, both
 * landing on hero-pool index 17), they kept re-converging on the identical
 * "first" candidate every time usage counts tied - which is most of the
 * time for a large site. Per-candidate tie-breaking means two different
 * businesses essentially never agree on which tied candidate is "first".
 * Returns null only if every pool item is already used on this exact page
 * (the per-page dedup guarantee).
 */
function pickUnused(pool, business, slotKey, used) {
  if (!pool || !pool.length) return null;
  let best = null;
  let bestScore = Infinity;
  for (const candidate of pool) {
    if (used.has(candidate)) continue;
    const tieBreak = fnv1a(`${business.domain}:${slotKey}:${candidate}`) % 1000003;
    const score = getUsage(candidate) * 1000003 + tieBreak;
    if (score < bestScore) { bestScore = score; best = candidate; }
  }
  return best; // null - exhausted - caller falls through to the broader pool, then SVG
}

/**
 * Real local garage-door photos (see config/local-photos.js) - a category
 * per slot, matched to the same contexts the pages actually cover. Returns an
 * ABSOLUTE SOURCE FILE PATH (not a URL): the caller copies it into the site's
 * own `assets/img/` at build time (see `ctx._localPhotosUsed` + site.js).
 */
function localPhotoFor(business, slot, used) {
  if (!LOCAL.enabled) return null;
  const gm = /^gallery-(\d+)/.exec(slot);
  const svcM = /^svc-(.+)/.exec(slot);
  // Process ("How it works") steps, in order. Each step draws from the pool
  // that actually depicts THAT step, so the four photos are both relevant and
  // visibly different from each other rather than four shots of the same
  // thing: 0 "tell us what's wrong" -> the door/house itself (HERO),
  // 1 "on-site diagnosis" -> a technician inspecting (SERVICE),
  // 2 "clear, up-front plan" -> the hardware/parts in question (MAINTENANCE),
  // 3 "repaired & tested" -> the actual repair work (REPAIR).
  const procM = /^proc-(\d+)/.exec(slot);
  let pool;
  if (svcM) pool = LOCAL.serviceCategory[svcM[1]] || LOCAL.service;
  else if (procM) pool = [LOCAL.hero, LOCAL.service, LOCAL.maintenance, LOCAL.repair][Number(procM[1]) % 4];
  else if (slot === 'hero') pool = LOCAL.hero;
  else if (slot === 'about') pool = LOCAL.service;
  // The residential and commercial slots were deleted 2026-09-13. Their only
  // consumer was the removed res/com section, and no remaining caller passes
  // either slot name.
  else if (slot === 'tech') pool = LOCAL.repair;
  else if (gm) pool = [LOCAL.installation, LOCAL.repair, LOCAL.service, LOCAL.maintenance][Number(gm[1]) % 4];
  else pool = LOCAL.service;
  const picked = pickUnused(pool, business, slot, used) || pickUnused(LOCAL.all, business, slot, used);
  // Record the pick immediately (not just at site-build-copy time) so the
  // NEXT business in this same batch - and the next page on THIS business -
  // sees it as already-used and steers toward a fresher photo instead.
  if (picked) recordUsage(picked);
  return picked;
}

/** Sanitized, URL-safe destination filename for a copied local photo. Shared
 * with site.js so the `<img src>` written here matches the file it copies.
 *
 * Includes a short hash of the FULL source path, not just the basename -
 * confirmed real (2026-08-24): the operator's photo export has ~10 files
 * inside GD REPAIR misnamed "garage-door-maintenance N.webp" (a labeling
 * mistake upstream, not this engine's doing), so a repair-pool pick and a
 * maintenance-pool pick with the same number sanitized to the IDENTICAL
 * destination filename - the second file silently overwrote the first on
 * copy, and two logically-distinct, correctly-deduped photo picks ended up
 * as one repeated image in the rendered page. Hashing the full path makes
 * every source file's destination name unique regardless of what the
 * source library's own filenames happen to collide on. */
export function localImgDestName(absPath) {
  const base = absPath.split('/').pop().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-]/g, '');
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  const hash = fnv1a(absPath).toString(36).slice(0, 6);
  return `${stem}-${hash}${ext}`;
}

/** Choose a real photo BASE url for a slot, deduped within the page. */
function photoBase(business, slot, used) {
  if (!PHOTOS.enabled) return null;
  const gm = /^gallery-(\d+)/.exec(slot);
  if (gm) {
    const pref = PHOTOS.doorStyleOrder[Number(gm[1]) % PHOTOS.doorStyleOrder.length];
    if (!used.has(pref)) return pref;
    return pickUnused(PHOTOS.doorStyleOrder, business, slot, used) || pickUnused(PHOTOS.all, business, slot, used);
  }
  const cat = slot === 'tech' ? PHOTOS.tech : PHOTOS.house;
  return pickUnused(cat, business, slot, used) || pickUnused(PHOTOS.all, business, slot, used);
}

function sizeFor(slot) {
  if (/^gallery-/.test(slot)) return [900, 675];
  if (slot === 'about' || slot === 'tech') return [1000, 750];
  return [1400, 1000]; // hero
}

/**
 * Resolve an image for a slot on the current page (deduped).
 * @param {object} ctx render context (business, palette, _imgUsed)
 * @param {string} slot 'hero' | 'about' | 'tech' | 'gallery-<n>' | 'svc-<id>' | 'proc-<n>'
 * @param {string} altText
 */
export function image(ctx, slot, altText) {
  const business = ctx.business;
  const palette = ctx.palette;
  const used = ctx._imgUsed || (ctx._imgUsed = new Set());
  const gm = /^gallery-(\d+)/.exec(slot);
  const label = altText || (gm ? `${DOOR_STYLE_LABELS[DOOR_STYLE_KEYS[Number(gm[1]) % DOOR_STYLE_KEYS.length]]} garage door` : 'Garage door service');

  // Business-supplied images take precedence (deduped).
  if (business.images && business.images.length) {
    const b = pickUnused(business.images, business, slot, used);
    if (b) { used.add(b); return { kind: 'img', src: b, alt: label }; }
  }

  // Real local garage-door photos (config/local-photos.js) - outranks the
  // generic Unsplash pool. These live outside the deployable site, so record
  // which source files this SITE (not just this page) used; site.js copies
  // them into the site's own `assets/img/` once, after every page is built.
  const localSrc = localPhotoFor(business, slot, used);
  if (localSrc) {
    used.add(localSrc);
    const siteUsed = ctx._localPhotosUsed || (ctx._localPhotosUsed = new Set());
    siteUsed.add(localSrc);
    return { kind: 'img', src: `${ctx.urls.base}/assets/img/${localImgDestName(localSrc)}`, alt: label };
  }

  const base = photoBase(business, slot, used);
  if (base) {
    used.add(base);
    const [w, h] = sizeFor(slot);
    return { kind: 'img', src: PHOTOS.url(base, w, h), alt: label };
  }

  // Fallback: self-contained SVG illustration (unique per slot via uid).
  const uid = (fnv1a(`${business.domain}:${slot}`) % 100000).toString(36);
  const svg = gm ? doorStyle(Number(gm[1]), palette, uid) : houseScene(palette, uid);
  return { kind: 'illustration', svg, alt: label };
}

/** Render an image (or illustration) as HTML for a figure slot. */
export function imageHtml(img, { className = '', lazy = true } = {}) {
  if (img.kind === 'img') {
    return `<img src="${esc(img.src)}" alt="${esc(img.alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''} class="${esc(className)}">`;
  }
  return `<div class="ph ${esc(className)}" role="img" aria-label="${esc(img.alt)}">${img.svg}</div>`;
}

/** A real uploaded logo (images/logo/, matched by the business's own serial
 * number - see config/local-photos.js), if one exists for this business.
 * Copied into the site's assets/img/ the same way real photos are. Returns
 * null (falls back to the text monogram) when no logo has been supplied. */
export function logoImage(ctx) {
  const business = ctx.business;
  const src = LOCAL.logosBySerial[business.serial];
  if (!src) return null;
  const siteUsed = ctx._localPhotosUsed || (ctx._localPhotosUsed = new Set());
  siteUsed.add(src);
  return { src: `${ctx.urls.base}/assets/img/${localImgDestName(src)}`, alt: `${business.name} logo` };
}

/** Deterministic monogram for the brand mark. */
export function logoMark(business) {
  const initials = (business.name || business.city || 'GD')
    .split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return esc(initials || 'GD');
}

/** Browser-tab favicon. A real uploaded logo wins (same asset logoImage()
 * copies for the header/footer); otherwise an inline SVG data-URI monogram
 * built from the business's own real initials + its actual brand color -
 * no external request, no fabricated imagery, distinct per business. */
/**
 * The business's REAL logo is the favicon. Explicit instruction 2026-08-27:
 * "make sure each site logo use as favicon dont use fallback".
 *
 * Every one of the 36 built sites has a real logo (serials 18-140, all inside
 * the covered 1-200 range), so the monogram below is currently unreachable -
 * it exists only for serials 201-990, which have no logo file at all. There is
 * nothing else to show for those, so it stays as the last resort.
 *
 * Known tradeoff, previously raised: the logo is a full wordmark badge (house
 * graphic + "<CITY> GARAGE DOOR PROS" over three lines) drawn for 200x200, so
 * at 16-32px tab size the type is not readable - only the house shape and the
 * brand colour carry. That was why this briefly returned the monogram
 * unconditionally. Using the real logo is the call that was made; the icon is
 * now the actual brand mark on every site.
 */
export function faviconHref(ctx) {
  const logo = logoImage(ctx);
  if (logo) return logo.src;

  const bg = ctx.design.palette.primary;
  const fg = ctx.design.palette.onPrimary;
  const initials = logoMark(ctx.business);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="33" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="28" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default image;
