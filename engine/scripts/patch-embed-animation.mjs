#!/usr/bin/env node
/**
 * Stop the GSAP scroll-reveal from animating the section that holds the
 * embedded quote form, on ALREADY-BUILT sites.
 *
 * THE BUG. section-animations.js gives every otherwise-unhandled section a
 * fade-up from opacity:0. The quote form is a third-party embed that loads
 * asynchronously and then RESIZES ITSELF (form_embed.js sets the iframe height
 * once the form renders). That height change alters document height, which
 * makes ScrollTrigger refresh and re-apply the tween's from-state - so a form
 * the visitor could already see blanked out and faded back in. Reported as
 * "shows skeleton, then form, then blank, then form again".
 *
 * WHY A PATCH AND NOT A REBUILD. Same reason as apply-quote-form.mjs: these
 * sites are live and were signed off as they are, and the instruction was to
 * change the form and nothing else. A rebuild would restyle them wholesale.
 *
 * WHY NOT JUST COPY THE FIXED FILE IN. Two different vendored versions exist
 * across the fleet (the 24 August sites carry an older one), so overwriting
 * would hand those three a newer animation build - a change beyond the form.
 * This inserts ONE guard line into whatever version each site already has.
 *
 * Idempotent, and it verifies the insertion actually took effect.
 *
 *   node scripts/patch-embed-animation.mjs [--dry-run] [substring ...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ANCHOR = 'if (handledSections.has(sec)) return;';
const GUARD = "\n    // Never animate the section holding the embedded quote form: it resizes\n    // itself after load, which refreshes ScrollTrigger and re-applies this\n    // tween's from-state, blanking a form the visitor could already see.\n    if (sec.querySelector('.ghl-embed')) return;";

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));

let patched = 0, already = 0, missing = 0;
for (const dir of fs.readdirSync(DIST)) {
  if (!/^(?!.*\.(html?|json|md|xml|txt|m?js|css|csv)$)[a-z0-9-]+\.[a-z]{2,}(-[a-z0-9-]+)?$/.test(dir)) continue;
  if (filters.length && !filters.some((f) => dir.includes(f))) continue;
  const file = path.join(DIST, dir, 'assets', 'vendor', 'section-animations.js');
  if (!fs.existsSync(file)) { console.log(`  no animation file: ${dir}`); missing++; continue; }

  const src = fs.readFileSync(file, 'utf8');
  if (src.includes(".querySelector('.ghl-embed')")) { already++; continue; }
  if (!src.includes(ANCHOR)) { console.log(`  anchor not found: ${dir}`); missing++; continue; }

  // Only the LAST occurrence matters - that is the generic per-section
  // fallback loop, which is the one that reaches the quote section.
  const at = src.lastIndexOf(ANCHOR);
  const next = src.slice(0, at + ANCHOR.length) + GUARD + src.slice(at + ANCHOR.length);
  if (!next.includes(".querySelector('.ghl-embed')")) { console.log(`  insert failed: ${dir}`); missing++; continue; }
  if (!dryRun) fs.writeFileSync(file, next);
  patched++;
}
console.log(`${dryRun ? '[dry-run] would patch' : 'patched'}: ${patched} | already guarded: ${already} | problems: ${missing}`);
