/**
 * LOCKED SITES - never rebuilt, never touched, unless the user names that
 * specific site. Added 2026-10-12 (user: "lock henderson sites, dont change
 * anything or rebuild that sites without my command for specific that site").
 *
 * Enforced in two places so no loop or script can slip past it:
 *   - src/cli.js     refuses `--business <locked>` and drops locked sites from
 *                    --all / --limit / preview runs, unless `--unlock <domain>`
 *                    names that exact domain (comma-separate several).
 *   - src/generator/batch.js  skips any locked business that was not
 *                    explicitly unlocked (business.__unlocked), whatever called it.
 *
 * To rebuild one deliberately (only on the user's explicit instruction for
 * that site):  node src/cli.js --business hendersongaragedoorpros.com
 *                --unlock hendersongaragedoorpros.com ...
 * To unlock permanently, remove the domain here - again, only when the user
 * says so.
 */
export const LOCKED_SITES = new Set([
  'hendersongaragedoorpros.com',
  'chandlergaragedoorco.com',      // locked 2026-10-12 (user: manually checked)
  'georgetowngaragedoorpros.com',  // locked 2026-10-12 (user)
]);

/** Domains named by --unlock (comma-separated), lower-cased. */
export function unlockedFrom(arg) {
  if (!arg || arg === true) return new Set();
  return new Set(String(arg).toLowerCase().split(',').map((s) => s.trim()).filter(Boolean));
}
