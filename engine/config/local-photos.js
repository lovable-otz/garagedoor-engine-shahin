/**
 * Real, locally-supplied garage-door photo library (operator-provided -
 * see /images/GARAGE DOOR-SECTIONSWISE-PHOTO/ at the project root, one
 * level above `engine/`). Organized by the same contexts the site actually
 * has pages
 * for: HERO / INSTALLATION / REPAIR / SERVICE / MAINTENANCE / GUIDE.
 *
 * Unlike `config/images.js` (a small hardcoded Unsplash CDN pool), these are
 * real files on disk - `src/assets/images.js` copies whichever ones a site
 * actually uses into that site's own output folder at build time (a static
 * deployable site can't hot-link back into this repo's source tree).
 *
 * Discovered dynamically (not hardcoded) so dropping in more photos later -
 * or running on a machine where this folder doesn't exist - just works;
 * `enabled` is false and the engine falls back to the Unsplash pool / SVG
 * exactly as before.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../images/GARAGE DOOR-SECTIONSWISE-PHOTO/GARAGE DOOR');

function listWebp(dir) {
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.webp'))
      .map((f) => path.join(dir, f))
      .sort();
  } catch { return []; }
}

/** GD GUIDE/<Topic Name>/*.webp - flatten into { topic, files[] } entries. */
function listGuideTopics(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => ({ topic: e.name.trim(), files: listWebp(path.join(dir, e.name)) }))
      .filter((t) => t.files.length);
  } catch { return []; }
}

// Hero: the loose top-level files (generic, reusable) + GD HERO, which
// itself is organized into versioned subfolders (v1/v2, no loose files of
// its own) rather than the flat layout every other category uses.
const heroDir = path.join(ROOT, 'GD HERO');
const heroSubdirs = (() => {
  try { return fs.readdirSync(heroDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); }
  catch { return []; }
})();
const HERO = [...listWebp(ROOT), ...listWebp(heroDir), ...heroSubdirs.flatMap((d) => listWebp(path.join(heroDir, d)))];
const INSTALLATION = listWebp(path.join(ROOT, 'GD INSTALLATION'));
const REPAIR = listWebp(path.join(ROOT, 'GD REPAIR'));
const SERVICE = listWebp(path.join(ROOT, 'GD SERVICE'));
const MAINTENANCE = listWebp(path.join(ROOT, 'GD MAINTENNANCE'));
const GUIDE_TOPICS = listGuideTopics(path.join(ROOT, 'GD GUIDE'));
const GUIDE = GUIDE_TOPICS.flatMap((t) => t.files);
const ALL = [...new Set([...HERO, ...INSTALLATION, ...REPAIR, ...SERVICE, ...MAINTENANCE, ...GUIDE])];

// service id -> best-fit local category, for service detail page headers.
const SERVICE_CATEGORY = {
  'garage-door-repair': REPAIR,
  'broken-spring-repair': REPAIR,
  'cable-repair': REPAIR,
  'off-track-door-repair': REPAIR,
  'panel-replacement': REPAIR,
  'roller-replacement': REPAIR,
  'garage-door-opener-repair': REPAIR,
  'garage-door-installation': INSTALLATION,
  'garage-door-opener-installation': INSTALLATION,
  'garage-door-replacement': INSTALLATION,
  'commercial-garage-doors': INSTALLATION,
  maintenance: MAINTENANCE,
  'garage-door-service': SERVICE,
};

/** Real logo files (images/logo/**\/*.png), keyed by whatever's discoverable
 * in the filename - matched against a business's domain/city/slug at lookup
 * time. Nothing in the current batch has one yet (see business-logos.js);
 * this just indexes what's on disk so the match is real, not guessed. */
function listLogos(dir) {
  try {
    const out = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(png|webp|svg|jpg|jpeg)$/i.test(e.name)) out.push(p);
      }
    };
    walk(dir);
    return out;
  } catch { return []; }
}
/**
 * Resolve the logo directory CASE-INSENSITIVELY, and only ever the one whose
 * name is exactly "logo"/"logos".
 *
 * This was hardcoded to `images/logo`. The folder was later reorganised to
 * `images/LOGO`, and on a case-sensitive Linux filesystem that silently
 * resolved to nothing - every business fell back to the text monogram with no
 * error (2026-08-30: reported as "0 of 20 have a logo" when in fact all 20
 * did). A missing logo dir is indistinguishable from an empty one, so this
 * failure mode is silent by nature; matching case-insensitively removes it.
 *
 * `images/` also holds "FIRST 200 SITES LOGOS/", which carries serials 1-200
 * under the SAME filenames but DIFFERENT (older) file contents. Walking both
 * would make the serial index depend on directory traversal order and could
 * hand a business the stale logo. So the match is anchored: exactly "logo" or
 * "logos", nothing that merely contains the word.
 */
function findLogoDir(imagesDir) {
  try {
    const hit = fs.readdirSync(imagesDir, { withFileTypes: true })
      .find((e) => e.isDirectory() && /^logos?$/i.test(e.name));
    return hit ? path.join(imagesDir, hit.name) : path.join(imagesDir, 'logo');
  } catch { return path.join(imagesDir, 'logo'); }
}
const LOGOS = listLogos(findLogoDir(path.resolve(__dirname, '../../images')));

/** logo filenames are `<serial>_<city-slug>[_garage_door_pros|_co][_logo].<ext>` -
 * index by the business's own serial number (config-driven, not "the number
 * happened to look like a slug I recognized") so the match is real. */
function indexLogosBySerial(files) {
  const map = {};
  for (const f of files) {
    const m = /^(\d+)_/.exec(path.basename(f));
    if (m) map[Number(m[1])] = f;
  }
  return map;
}
const LOGOS_BY_SERIAL = indexLogosBySerial(LOGOS);

export const localPhotos = {
  enabled: ALL.length > 0,
  root: ROOT,
  hero: HERO,
  installation: INSTALLATION,
  repair: REPAIR,
  service: SERVICE,
  maintenance: MAINTENANCE,
  guide: GUIDE,
  guideTopics: GUIDE_TOPICS,
  all: ALL,
  serviceCategory: SERVICE_CATEGORY,
  logos: LOGOS,
  logosBySerial: LOGOS_BY_SERIAL,
};

export default localPhotos;
