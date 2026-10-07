/**
 * Persistent cross-site image usage tracker.
 *
 * The local photo pools (config/local-photos.js) are small (a few dozen
 * photos per category) relative to the number of businesses that draw from
 * them, so picking purely per-business (a deterministic hash of domain+slot,
 * see src/assets/images.js) can coincidentally land two different businesses
 * on the exact same photo - confirmed real (2026-08-24): Dallas and Chicago
 * shared 7 images including the homepage hero. This registry lets selection
 * prefer whatever image the FEWEST other businesses have used so far,
 * spreading usage evenly instead of leaving it to chance - the same idea as
 * the design registry (src/engine/registry.js) already applies to
 * theme/variant selection.
 *
 * A strict zero-repeats guarantee across the full 1000-business dataset
 * isn't possible with a ~265-photo pool (more businesses than photos,
 * eventually every photo must repeat somewhere) - this minimizes AVOIDABLE
 * duplication (never reuse an image while a fresher one is available) rather
 * than promising the impossible.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';

let usage = null;
let file = config.paths.imageUsageRegistry;

function load() {
  if (usage) return usage;
  usage = {};
  try {
    if (fs.existsSync(file)) usage = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { usage = {}; }
  return usage;
}

/** How many businesses have already used this exact image source path. */
export function getUsage(imgPath) {
  return load()[imgPath] || 0;
}

/** Mark one more use of an image. Call once per business+slot pick. */
export function recordUsage(imgPath) {
  const u = load();
  u[imgPath] = (u[imgPath] || 0) + 1;
}

/** Persist to disk. Call once after a batch (or business) finishes. */
export function saveImageUsage() {
  if (!usage) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(usage, null, 1));
}

/** Test/scratch-run hook: force a fresh in-memory registry (e.g. a
 * `--fresh-registry` CLI run), independent of whatever's on disk. */
export function resetImageUsage() { usage = {}; }
