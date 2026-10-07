/**
 * Uniqueness Scoring + Collision Regeneration.
 *
 * For every pair of generated designs we compute a DIFFERENCE score in [0,100]
 * (higher = more different) from weighted per-axis comparisons. If a new design
 * is too similar to any recent design, we deterministically re-roll its
 * variants (via assignDesign's regenNonce) and try again, keeping the best.
 *
 * Comparison against a sliding window keeps large runs near-linear.
 */

import { config } from '../../config/generation.config.js';
import { assignDesign } from './seed.js';
import { hexToHsl } from '../util/color.js';
import { subSeed } from '../util/hash.js';
import { SECTION_AXES, SECTION_POOLS, compatiblePool } from './variation.js';

const W = config.uniqueness.weights;

/** Color distance 0..1 in HSL space (hue weighted most). */
function colorDist(a, b) {
  const ca = hexToHsl(a), cb = hexToHsl(b);
  const dh = Math.min(Math.abs(ca.h - cb.h), 360 - Math.abs(ca.h - cb.h)) / 180; // 0..1
  const ds = Math.abs(ca.s - cb.s);
  const dl = Math.abs(ca.l - cb.l);
  return Math.min(1, dh * 0.7 + ds * 0.15 + dl * 0.15);
}

/** Section-order distance: normalized positional disagreement. */
function orderDist(a, b) {
  const A = a.split('>'), B = b.split('>');
  const set = new Set([...A, ...B]);
  let diff = 0;
  for (const sec of set) {
    const ia = A.indexOf(sec), ib = B.indexOf(sec);
    if (ia === -1 || ib === -1) diff += 1;
    else diff += Math.abs(ia - ib) / Math.max(A.length, B.length);
  }
  return Math.min(1, diff / set.size);
}

const eq = (a, b) => (a === b ? 0 : 1);

/** Positional mismatch fraction between two '|'-joined section-variant strings. */
function sectionsDist(a, b) {
  if (!a || !b) return a === b ? 0 : 1;
  const A = a.split('|'), B = b.split('|');
  const n = Math.max(A.length, B.length);
  let d = 0;
  for (let i = 0; i < n; i++) if (A[i] !== B[i]) d++;
  return n ? d / n : 0;
}

/**
 * Difference score between two fingerprints, 0..100 (higher = more distinct).
 */
export function differenceScore(x, y) {
  const diff =
    W.theme * eq(x.theme, y.theme) +
    W.layout * (eq(x.layout, y.layout) * 0.25 + sectionsDist(x.sections, y.sections) * 0.75) +
    W.hero * (eq(x.hero, y.hero) * 0.6 + eq(x.nav, y.nav) * 0.4) +
    W.components *
      (eq(x.serviceCard, y.serviceCard) * 0.5 +
        eq(x.reviewCard, y.reviewCard) * 0.25 +
        eq(x.gallery, y.gallery) * 0.25) +
    W.typography * (eq(x.headingFont, y.headingFont) * 0.7 + eq(x.bodyFont, y.bodyFont) * 0.3) +
    W.colors * (colorDist(x.primary, y.primary) * 0.6 + colorDist(x.accent, y.accent) * 0.4) +
    W.sectionOrder * orderDist(x.sectionOrder, y.sectionOrder) +
    W.footer * eq(x.footer, y.footer) +
    W.contentStructure * eq(x.cta, y.cta);
  const maxScore =
    W.theme + W.layout + W.hero + W.components + W.typography +
    W.colors + W.sectionOrder + W.footer + W.contentStructure;
  return Math.round((diff / maxScore) * 100);
}

/** The single-site "self" uniqueness score = min difference to the window. */
function minDifference(fp, window) {
  let min = 100;
  for (const other of window) {
    const d = differenceScore(fp, other);
    if (d < min) min = d;
    if (min === 0) break;
  }
  return min;
}

/**
 * Assign a design and ensure it is sufficiently distinct from the recent
 * window, re-rolling variants on collision.
 *
 * @param {import('../data/model.js').Business} business
 * @param {Array} window  recent fingerprints
 * @param {object} [opts] passthrough to assignDesign (e.g. forceThemeId)
 * @returns {{ design: object, score: number, rerolls: number }}
 */
export function assignUnique(business, window, opts = {}) {
  const { minScore, maxRerolls } = config.uniqueness;
  let best = null;
  let bestScore = -1;
  let rerolls = 0;

  for (let attempt = 0; attempt <= maxRerolls; attempt++) {
    const divergence = attempt / Math.max(1, maxRerolls);
    const design = assignDesign(business, { ...opts, regenNonce: attempt, divergence });
    const score = window.length ? minDifference(design.fingerprint, window) : 100;
    if (score > bestScore) { best = design; bestScore = score; rerolls = attempt; }
    if (score >= minScore) { best = design; bestScore = score; rerolls = attempt; break; }
  }
  // Spread BOTH the per-section structural layouts AND the primary component
  // styles (hero/nav/serviceCard/reviewCard/gallery/footer/cta) across the
  // window, so no single choice on any visible axis dominates a batch and no
  // two neighbouring sites repeat one. Guarded so it can only ever hold the
  // score at its current floor or raise it, never drop a design below the
  // quality bar the reroll loop above just spent up to `maxRerolls` attempts
  // reaching (see tryRebalanceAxis).
  const floor = Math.min(bestScore, minScore);
  // Never override an axis the caller explicitly pinned (e.g. `--variants`
  // for scratch verification, or breaking a confirmed cross-site collision)
  // - rebalancing is a diversity refinement on top of the normal roll, not
  // license to silently discard an explicit instruction.
  const forced = opts.forceVariants || {};
  rebalanceSections(best, window, floor, forced.sectionVariants || {});
  rebalancePrimaryVariants(best, window, floor, forced);
  const score = window.length ? minDifference(best.fingerprint, window) : 100;
  return { design: best, score, rerolls };
}

/**
 * Per-axis HARD cooldown: `poolSize - 1` at most, never the full pool (that
 * would leave zero legal candidates), and never more than the configured
 * `desired` window. A 2-option axis (e.g. heroStats today) therefore gets a
 * cooldown of 1 (plain alternation, the best a 2-option pool can ever do) -
 * see dist/_reports/section-variant-usage.md for which axes are actually
 * capacity-limited below `config.uniqueness.sectionCooldown` this way.
 */
function effectiveCooldown(poolSize, desired) {
  return Math.max(0, Math.min(desired, poolSize - 1));
}

/**
 * Deterministically order an axis's ALLOWED candidates (pool minus whatever
 * is still on cooldown - see effectiveCooldown): ascending by how often each
 * value already appears in the window (least-used first), tie-broken by a
 * per-candidate seeded hash so the order is stable across runs.
 */
function orderedCandidates(pool, excluded, usage, effectiveSeed, tag) {
  const allowed = pool.filter((o) => !excluded.has(o));
  const list = allowed.length ? allowed : pool; // pool smaller than the clamp guarantees - degrade gracefully
  return list
    .map((o) => ({ o, key: (usage[o] || 0) * 1e6 + (subSeed(effectiveSeed, `${tag}:${o}`) % 1e6) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.o);
}

/**
 * Try to rebalance one axis off a value that's still on cooldown - but ONLY
 * commit a swap whose resulting design still scores >= `floor` against the
 * window. Tries candidates best-first (see orderedCandidates); reverts to
 * the original value if none qualify, so uniqueness is never sacrificed for
 * distribution.
 *
 *   1. Hard exclusion - a value used by ANY of the last `cooldown` sites for
 *      this same axis (see effectiveCooldown) is off-limits, not just the
 *      immediately preceding site. This is what makes "site" a real
 *      distance guarantee instead of a same-neighbour-only check.
 *   2. Soft balance - among the still-allowed candidates, prefer the
 *      LEAST-used option across the whole window, so no option dominates a
 *      large run even once it comes off cooldown.
 *
 * @param {object} design mutated in place via getVal/setVal
 * @param {Array} window
 * @param {number} floor minimum acceptable minDifference(design, window)
 * @param {string[]} pool
 * @param {string[]} history this axis's values across `window`, oldest first
 * @param {() => string} getVal
 * @param {(v: string) => void} setVal  also responsible for updating design.fingerprint
 * @param {number} effectiveSeed
 * @param {string} tag
 * @param {number} desiredCooldown
 */
function tryRebalanceAxis(design, window, floor, pool, history, getVal, setVal, effectiveSeed, tag, desiredCooldown) {
  if (pool.length < 2) return; // only one option exists - nothing to diversify into
  const cooldown = effectiveCooldown(pool.length, desiredCooldown);
  const excluded = cooldown ? new Set(history.slice(-cooldown)) : new Set();
  const current = getVal();
  if (!excluded.has(current)) return; // already off cooldown - fine as-is

  const usage = {};
  for (const v of history) usage[v] = (usage[v] || 0) + 1;

  for (const candidate of orderedCandidates(pool, excluded, usage, effectiveSeed, tag)) {
    setVal(candidate);
    if (minDifference(design.fingerprint, window) >= floor) return; // accept
  }
  setVal(current); // no candidate kept the score at/above floor - revert
}

/** Re-balance the per-section STRUCTURAL layouts (services/why/process/...). */
function rebalanceSections(design, window, floor, forcedSectionVariants = {}) {
  if (!design || !window || !window.length) return;
  const sv = design.variants && design.variants.sectionVariants;
  if (!sv) return;
  const effSeed = design.effectiveSeed || design.seed;
  const setSections = () => { design.fingerprint.sections = SECTION_AXES.map((a) => sv[a] || '').join('|'); };
  const desiredCooldown = config.uniqueness.sectionCooldown;
  SECTION_AXES.forEach((axis, i) => {
    if (forcedSectionVariants[axis]) return; // caller explicitly pinned this axis - leave it alone
    const history = window.map((w) => String(w.sections || '').split('|')[i]).filter(Boolean);
    tryRebalanceAxis(
      design, window, floor, SECTION_POOLS[axis], history,
      () => sv[axis],
      (v) => { sv[axis] = v; setSections(); },
      effSeed, `rebal:${axis}`, desiredCooldown,
    );
  });
}

// fingerprint key -> [design.variants key, POOLS/compatiblePool key]. `cta`
// is named `ctaStyle` on variants/POOLS but `cta` on the fingerprint - the
// only axis where those two names diverge.
const PRIMARY_AXES = [
  ['hero', 'hero'], ['nav', 'nav'], ['serviceCard', 'serviceCard'],
  ['reviewCard', 'reviewCard'], ['gallery', 'gallery'], ['footer', 'footer'],
  ['cta', 'ctaStyle'],
];

/** Re-balance the primary component-style axes (hero/nav/serviceCard/...). */
function rebalancePrimaryVariants(design, window, floor, forced = {}) {
  if (!design || !window || !window.length || !design.theme) return;
  const effSeed = design.effectiveSeed || design.seed;
  const desiredCooldown = config.uniqueness.sectionCooldown;
  PRIMARY_AXES.forEach(([fpKey, variantKey]) => {
    if (forced[variantKey]) return; // caller explicitly pinned this axis - leave it alone
    const pool = compatiblePool(variantKey, design.theme);
    const history = window.map((w) => w[fpKey]).filter(Boolean);
    tryRebalanceAxis(
      design, window, floor, pool, history,
      () => design.variants[variantKey],
      (v) => { design.variants[variantKey] = v; design.fingerprint[fpKey] = v; },
      effSeed, `rebalp:${variantKey}`, desiredCooldown,
    );
  });
}

export default assignUnique;
