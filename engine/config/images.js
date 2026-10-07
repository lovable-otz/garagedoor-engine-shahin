/**
 * Real photography (Unsplash) for generated sites - 24 curated, verified
 * garage-door-relevant photos, categorized. The asset layer (assets/images.js)
 * picks per slot AND deduplicates within a page so no photo repeats on the same
 * page. When `enabled` is false (or the pool is exhausted) it falls back to the
 * self-contained SVG illustrations.
 *
 * Swap these for your own licensed photos any time - the structure is what the
 * engine reads. URLs are hot-linkable Unsplash CDN images.
 */

const B = 'https://images.unsplash.com/photo-';
const P = 'auto=format&fit=crop&q=72';

const HOUSE = [ // residential exteriors - heroes / about / residential context
  `${B}1605276374104-dee2a0ed3cd6`, `${B}1635108199445-ab9f516646e2`,
  `${B}1605146768851-eda79da39897`, `${B}1541737949652-27149c8e786d`,
  `${B}1523809040961-500fcd60697a`, `${B}1581044294446-9efb5910a3ba`,
  `${B}1678728994157-0bcb3309200f`, `${B}1628744448839-a475cc0e90c3`,
];
const RES_DOOR = [ // residential door close-ups
  `${B}1647843097965-3686dadb7b84`, `${B}1696992812596-3c0d4d2d1299`,
  `${B}1648941416478-319d8c2d06d4`, `${B}1467385829985-2b0fb82b5193`,
  `${B}1675747158954-4a32e28812c0`, `${B}1601835991665-66595682d6c5`,
  `${B}1576765915042-d4746f8b7727`,
];
const COMMERCIAL = [
  `${B}1494351416886-f6b4ed2a1d68`, `${B}1721152395209-f9ca76755948`,
  `${B}1540476547779-348beb642680`, `${B}1657490017761-381bdf660ff4`,
  `${B}1617782674367-341cf5f527c9`, `${B}1587417663598-d769adb76af1`,
];
const TECH = [ `${B}1609915395444-e9632e899ad9`, `${B}1594818020972-e96e722493f7` ];

// Door-style catalog - index order MUST match DOOR_STYLE_KEYS in
// src/assets/illustrations.js: sectional, carriage, modern-flush, full-view,
// raised-panel, commercial. Each a distinct photo.
const DOOR_STYLE_ORDER = [
  `${B}1647843097965-3686dadb7b84`, // sectional
  `${B}1467385829985-2b0fb82b5193`, // carriage (wood)
  `${B}1648941416478-319d8c2d06d4`, // modern flush
  `${B}1675747158954-4a32e28812c0`, // full-view / windowed
  `${B}1601835991665-66595682d6c5`, // raised panel
  `${B}1587417663598-d769adb76af1`, // commercial (red roll-up)
];

const ALL = [...new Set([...HOUSE, ...RES_DOOR, ...COMMERCIAL, ...TECH, ...DOOR_STYLE_ORDER])];

export const images = {
  enabled: true,
  house: HOUSE,
  residential: RES_DOOR,
  commercial: COMMERCIAL,
  tech: TECH,
  doorStyleOrder: DOOR_STYLE_ORDER,
  all: ALL,

  /** Build a sized URL for a base photo. */
  url(base, w = 1200, h = 0) {
    return `${base}?${P}&${h ? `w=${w}&h=${h}` : `w=${w}`}`;
  },
};

export default images;
