/**
 * Persistent Design Registry.
 *
 * Every generated site's resolved design (theme, variants, palette signature,
 * fingerprint, uniqueness score) is recorded to a JSON file. This gives the
 * engine a MEMORY across runs so that:
 *   - re-running is stable (same business → same design, verified against record)
 *   - incremental batches (generate 50 today, 50 more tomorrow) stay globally
 *     non-conflicting - new sites are compared against everything already built
 *   - the uniqueness engine can seed its comparison window from prior runs
 *
 * The registry is keyed by domain (the stable business identity). It is stored
 * under dist/reports/ and is safe to delete to force a clean re-plan.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config/generation.config.js';

export class DesignRegistry {
  /** @param {string} [file] */
  constructor(file = config.paths.registry) {
    this.file = file;
    /** @type {Record<string, object>} domain -> record */
    this.byDomain = {};
    /** @type {{domain:string, fingerprint:object}[]} insertion order (comparison window source) */
    this.order = [];
    this.dirty = false;
  }

  /** Load an existing registry if present. */
  load() {
    try {
      if (fs.existsSync(this.file)) {
        const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        this.byDomain = data.byDomain || {};
        this.order = Object.values(this.byDomain).map((r) => ({ domain: r.domain, fingerprint: r.fingerprint }));
      }
    } catch (e) {
      // Corrupt registry should not break a run - start fresh but warn.
      console.warn(`[registry] could not read ${this.file}: ${e.message} - starting empty`);
      this.byDomain = {};
      this.order = [];
    }
    return this;
  }

  has(domain) {
    return Boolean(this.byDomain[domain]);
  }

  get(domain) {
    return this.byDomain[domain] || null;
  }

  /**
   * The comparison window for uniqueness: the most-recent N fingerprints from
   * everything recorded so far (across all prior runs).
   *
   * `excludeDomain` filters out a business's own already-persisted record
   * before slicing. Without this, re-generating a single already-registered
   * business (a routine bug-fix regen, not a fresh batch) would load its own
   * prior fingerprint back off disk as part of the window, see itself as a
   * 100%-identical "collision" against itself, and force the uniqueness
   * engine to re-roll into a different theme/palette/variant set every time
   * - i.e. an unrelated fix would silently redesign the whole site. The
   * in-batch case (business not yet recorded this run) already excludes
   * itself naturally since callers pass window() BEFORE record().
   * @param {number} n
   * @param {string} [excludeDomain]
   */
  window(n = config.uniqueness.compareWindow, excludeDomain) {
    const pool = excludeDomain ? this.order.filter((e) => e.domain !== excludeDomain) : this.order;
    return pool.slice(-n).map((e) => e.fingerprint);
  }

  /**
   * Record (or update) a business's design. Excludes the business's own prior
   * record from the window automatically because callers pass window() BEFORE
   * recording.
   * @param {import('../data/model.js').Business} business
   * @param {object} design  assignDesign() result
   * @param {number} score   uniqueness score
   * @param {number} rerolls
   */
  record(business, design, score, rerolls) {
    const rec = {
      domain: business.domain,
      name: business.name,
      city: business.city,
      state: business.state,
      serial: business.serial,
      themeId: design.themeId,
      themeName: design.themeName,
      seed: design.seed,
      regenNonce: design.regenNonce,
      score,
      rerolls,
      fingerprint: design.fingerprint,
    };
    const existed = this.byDomain[business.domain];
    this.byDomain[business.domain] = rec;
    if (existed) {
      const idx = this.order.findIndex((e) => e.domain === business.domain);
      if (idx >= 0) this.order[idx] = { domain: business.domain, fingerprint: rec.fingerprint };
      else this.order.push({ domain: business.domain, fingerprint: rec.fingerprint });
    } else {
      this.order.push({ domain: business.domain, fingerprint: rec.fingerprint });
    }
    this.dirty = true;
    return rec;
  }

  /** Persist to disk (atomic-ish: write temp then rename). */
  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const payload = {
      version: 1,
      updated: null, // timestamp filled by caller/CLI to keep this module pure
      count: Object.keys(this.byDomain).length,
      byDomain: this.byDomain,
    };
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 1));
    fs.renameSync(tmp, this.file);
    this.dirty = false;
    return this.file;
  }

  /** Summary stats for reporting. */
  stats() {
    const recs = Object.values(this.byDomain);
    const themes = {};
    let sum = 0, min = 100, max = 0;
    for (const r of recs) {
      themes[r.themeId] = (themes[r.themeId] || 0) + 1;
      sum += r.score; min = Math.min(min, r.score); max = Math.max(max, r.score);
    }
    return {
      count: recs.length,
      avgScore: recs.length ? +(sum / recs.length).toFixed(1) : 0,
      minScore: recs.length ? min : 0,
      maxScore: recs.length ? max : 0,
      themes,
    };
  }
}

export default DesignRegistry;
