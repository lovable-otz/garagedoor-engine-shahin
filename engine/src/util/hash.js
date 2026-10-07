/**
 * Deterministic hashing + seeded pseudo-randomness.
 *
 * Determinism is a hard requirement of the engine: the same business must
 * always resolve to the same design. We therefore never use Math.random().
 * Instead every stochastic choice is driven by a stable 32-bit seed derived
 * from the business identity (domain + name).
 */

/**
 * FNV-1a 32-bit hash. Small, fast, well-distributed for short ASCII strings.
 * @param {string} str
 * @returns {number} unsigned 32-bit integer
 */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // h *= 16777619, kept in 32-bit range via Math.imul
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Build a stable seed for a business. This is the single source of truth for
 * every deterministic design decision made downstream.
 * @param {string} domain
 * @param {string} name
 * @returns {number}
 */
export function seedFor(domain, name) {
  const key = `${(domain || '').toLowerCase().trim()}|${(name || '').toLowerCase().trim()}`;
  return fnv1a(key);
}

/**
 * Mulberry32 - a tiny, high-quality seeded PRNG. Given the same seed it emits
 * the same stream of floats in [0,1). We derive all variant choices from one
 * of these so a single seed fans out into many independent-looking decisions.
 * @param {number} seed
 * @returns {() => number}
 */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A "stream" helper: convenience wrapper around an rng with typed pickers.
 * @param {number} seed
 */
export function stream(seed) {
  const next = rng(seed);
  return {
    /** float in [0,1) */
    float: next,
    /** integer in [min, max] inclusive */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** pick one element */
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    /** pick with integer weights: [[value, weight], ...] */
    weighted(pairs) {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let r = next() * total;
      for (const [value, weight] of pairs) {
        r -= weight;
        if (r < 0) return value;
      }
      return pairs[pairs.length - 1][0];
    },
    /** boolean true with probability p */
    chance(p) {
      return next() < p;
    },
    /** deterministic in-place-safe shuffle (Fisher-Yates) */
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/**
 * Derive a sub-seed for an independent decision axis so that, e.g., the hero
 * choice and the footer choice do not correlate.
 * @param {number} seed
 * @param {string} salt
 */
export function subSeed(seed, salt) {
  return fnv1a(`${seed}:${salt}`);
}
