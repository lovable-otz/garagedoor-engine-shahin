/**
 * Service catalog. Extensible: add an entry and the engine picks it up in
 * navigation, service grids, /services/<slug>/ pages, and Service schema -
 * no core code changes required.
 *
 * `neutral` copy is deliberately non-committal and contains NO fabricated
 * claims (no pricing, no "same day", no "24/7", no warranties). It only
 * describes the nature of the work. City/business specifics are layered in by
 * the content engine from real data.
 */

export const SERVICES = [
  {
    id: 'garage-door-repair',
    label: 'Garage Door Repair',
    short: 'Repair',
    kind: ['residential', 'commercial'],
    icon: 'wrench',
    // Weight influences ordering/prominence, not fabricated importance.
    weight: 100,
    blurb: 'Diagnosis and repair for doors that stick, bind, reverse, or stop responding.',
    detail:
      'Repair work covers the parts of a garage door that wear or fail with use: ' +
      'the springs that carry the door’s weight, the cables and drums that lift it, ' +
      'the rollers and tracks that guide it, and the opener that drives it. A repair ' +
      'visit starts with finding what actually failed before anything is replaced.',
  },
  {
    id: 'garage-door-installation',
    label: 'Garage Door Installation',
    short: 'Installation',
    kind: ['residential', 'commercial'],
    icon: 'door',
    weight: 90,
    blurb: 'New door installation sized and fitted to the opening.',
    detail:
      'Installation is the right call when a door is past economical repair - panels ' +
      'damaged beyond patching, or hardware old enough that parts are hard to source. ' +
      'The work covers measuring the opening, fitting the door and track, setting the ' +
      'spring system to the door’s weight, and wiring the opener and safety sensors.',
  },
  {
    id: 'garage-door-replacement',
    label: 'Garage Door Replacement',
    short: 'Replacement',
    kind: ['residential', 'commercial'],
    icon: 'swap',
    weight: 80,
    blurb: 'Full door replacement when repair no longer makes sense.',
    detail:
      'Replacement swaps a worn or damaged door for a new one, reusing serviceable ' +
      'track and hardware where it makes sense and replacing what doesn’t.',
  },
  {
    id: 'garage-door-service',
    label: 'Garage Door Service',
    short: 'Service',
    kind: ['residential', 'commercial'],
    icon: 'gauge',
    weight: 88,
    blurb: 'General service and diagnosis for doors that aren’t working right.',
    detail:
      'General service covers the whole door as a system - springs, cables, ' +
      'rollers, track, and opener - starting with a diagnosis of what’s actually ' +
      'wrong before any part is replaced.',
  },
  {
    id: 'garage-door-opener-repair',
    label: 'Opener Repair',
    short: 'Opener Repair',
    kind: ['residential', 'commercial'],
    icon: 'chip',
    weight: 75,
    blurb: 'Openers that run but don’t move the door, or don’t respond at all.',
    detail:
      'Opener problems range from worn drive gears and failed logic boards to ' +
      'misaligned safety sensors and travel-limit settings that have drifted.',
  },
  {
    id: 'garage-door-opener-installation',
    label: 'Opener Installation',
    short: 'Opener Install',
    kind: ['residential', 'commercial'],
    icon: 'chip',
    weight: 60,
    blurb: 'New opener fitted and calibrated to the door.',
    detail:
      'A new opener has to be matched to the door’s weight and travel, then its force ' +
      'and safety-reversal settings calibrated so the door stops on an obstruction.',
  },
  {
    id: 'broken-spring-repair',
    label: 'Spring Repair',
    short: 'Spring Repair',
    kind: ['residential'],
    icon: 'spring',
    weight: 85,
    blurb: 'Torsion and extension spring replacement.',
    detail:
      'Springs are rated in open/close cycles, not years, and they fail at the end of ' +
      'that count - usually without warning. Spring work is done under load and is the ' +
      'part of a garage door most owners should not attempt themselves.',
  },
  {
    id: 'cable-repair',
    label: 'Cable Repair',
    short: 'Cable Repair',
    kind: ['residential'],
    icon: 'cable',
    weight: 55,
    blurb: 'Frayed, slipped, or snapped lift cables.',
    detail:
      'Lift cables fray at the drum over time and can slip off or snap, leaving a door ' +
      'hanging crooked. Cable work is tied to spring tension and is handled together.',
  },
  {
    id: 'off-track-door-repair',
    label: 'Off-Track Repair',
    short: 'Off-Track',
    kind: ['residential', 'commercial'],
    icon: 'track',
    weight: 50,
    blurb: 'Doors that have jumped or bent their track.',
    detail:
      'A door comes off its track from an impact, a broken cable, or worn rollers. ' +
      'Getting it back on safely means releasing tension first, not forcing it.',
  },
  {
    id: 'panel-replacement',
    label: 'Panel Replacement',
    short: 'Panel',
    kind: ['residential'],
    icon: 'panel',
    weight: 40,
    blurb: 'Replacing damaged sections where a match is available.',
    detail:
      'A single dented or cracked section can sometimes be replaced if the door’s run ' +
      'is still in production. When it isn’t, full replacement is usually the better call.',
  },
  {
    id: 'roller-replacement',
    label: 'Roller Replacement',
    short: 'Rollers',
    kind: ['residential'],
    icon: 'roller',
    weight: 35,
    blurb: 'Worn rollers that make a door noisy or rough.',
    detail:
      'Rollers wear and seize with age and heat cycling, making a door loud and rough ' +
      'in the track. Replacing them is routine maintenance that extends door life.',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    short: 'Maintenance',
    kind: ['residential', 'commercial'],
    icon: 'gauge',
    weight: 45,
    blurb: 'Inspection and adjustment before small issues become failures.',
    detail:
      'A tune-up checks spring tension, cable condition, track alignment, roller wear, ' +
      'and opener force settings, catching the things that fail suddenly if left alone.',
  },
  {
    id: 'commercial-garage-doors',
    label: 'Commercial Garage Door',
    short: 'Commercial',
    kind: ['commercial'],
    icon: 'building',
    weight: 30,
    blurb: 'Rolling steel, sectional, and dock doors for businesses.',
    detail:
      'Commercial doors - rolling steel, sectional, and dock equipment - run far more ' +
      'cycles than a home door and are serviced with that duty in mind.',
  },
  {
    id: 'emergency-garage-door',
    label: 'Emergency Garage Door Repair',
    short: 'Emergency',
    kind: ['residential', 'commercial'],
    icon: 'bolt',
    weight: 95,
    // Deliberately makes NO availability claim - no "24/7", no "same day", no
    // response time. Those are on config/generation.config.js →
    // content.neverFabricate and are only ever stated by a business's OWN
    // authored page copy. This describes the KIND of failure the work covers.
    blurb: 'Failures that leave a door stuck open, stuck shut, or unsafe to operate.',
    detail:
      'Some door failures cannot wait for a scheduled visit: a snapped spring or ' +
      'cable that drops the door, a door jammed open overnight, or one that has ' +
      'come off its track and can no longer be secured. The work is the same as ' +
      'any repair - find what actually failed, then make the door safe to move.',
  },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

/**
 * Naming the content exports use for a service that the catalog holds under a
 * different id. Purely a LOOKUP alias, for the label/icon/blurb a card needs -
 * it never affects a page's URL (those come from the content's own `page.url`)
 * and never merges two authored pages into one.
 *
 * Added 2026-09-09 from the Parsippany + Abilene exports, which name their
 * service lines and their suburb-service slugs more tersely than the catalog
 * does. An id with no alias and no catalog entry still works - content/index.js
 * falls back to a title-cased label - it just gets the generic wrench icon.
 */
export const SERVICE_ALIASES = {
  'opener-repair': 'garage-door-opener-repair',
  'opener-installation': 'garage-door-opener-installation',
  'off-track-repair': 'off-track-door-repair',
  'off-track': 'off-track-door-repair',
  'commercial-garage-door': 'commercial-garage-doors',
  'new-door-installation': 'garage-door-installation',
  'door-installation': 'garage-door-installation',
  'spring-repair': 'broken-spring-repair',
  'broken-spring': 'broken-spring-repair',
  'garage-door-maintenance': 'maintenance',
  'garage-door-cable-repair': 'cable-repair',
  'garage-door-roller-replacement': 'roller-replacement',
  'garage-door-panel-replacement': 'panel-replacement',
  'emergency-garage-door-repair': 'emergency-garage-door',
};

/** Canonical catalog id for a slug an export used. Unknown slugs pass through. */
export function resolveServiceId(slug) {
  const s = String(slug || '');
  if (SERVICE_BY_ID[s]) return s;
  return SERVICE_ALIASES[s] || s;
}

/**
 * The URL segment for a service, in the canonical scheme
 * `/<city>/<service>/` and `/<city>/<suburb>/<service>/`.
 *
 * Short, natural forms - the spec's own examples are `garage-door-repair`,
 * `spring-repair`, `opener-repair`, not the catalog's longer internal ids.
 * Only the ids whose short form differs are listed; everything else uses its
 * id unchanged.
 *
 * This exists because the SAME service reaches the engine under two different
 * slugs in one export: Parsippany's city page is
 * `garage-door-installation` while its suburb pages call it
 * `new-door-installation`. Both resolve to the catalog id
 * `garage-door-installation` and therefore to ONE url segment, so
 * `/parsippany/garage-door-installation/` and
 * `/parsippany/denville/garage-door-installation/` pair up instead of
 * drifting apart. Never derive this segment from the export's raw filename.
 */
const SERVICE_URL_SLUG = {
  // User sitemap spec, 2026-09-13: installation publishes as
  // /<city>/new-door-installation/ - the slug all 45 re-pulled exports use on
  // their suburb pages - not the catalog id `garage-door-installation`.
  'garage-door-installation': 'new-door-installation',
  'garage-door-opener-repair': 'opener-repair',
  'garage-door-opener-installation': 'opener-installation',
  'off-track-door-repair': 'off-track-repair',
  'broken-spring-repair': 'spring-repair',
  'commercial-garage-doors': 'commercial-garage-door',
};

/** Canonical URL segment for a service slug/id from any export. */
export function serviceUrlSlug(slug) {
  const id = resolveServiceId(slug);
  return SERVICE_URL_SLUG[id] || id;
}

/** Services offered by every business by default (safe, universal work). */
export const CORE_SERVICE_IDS = [
  'garage-door-repair',
  'garage-door-installation',
  'broken-spring-repair',
  'garage-door-opener-repair',
];

export default SERVICES;
