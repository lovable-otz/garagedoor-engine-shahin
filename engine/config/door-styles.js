/**
 * Generic, factual door-style / materials reference content for the
 * Garage Doors / Products page (`/garage-doors/`).
 *
 * Same authoring rule as `config/services.js`: this is general, verifiable
 * industry knowledge about door STYLES as a category (how sectional vs.
 * carriage-house doors are built, what insulation typically means), never a
 * specific claim about any one business's inventory, pricing, or stock
 * ("we carry...", "our doors are..."). No numeric spec (R-value, gauge,
 * exact color/window catalog) is asserted for a PARTICULAR product, since
 * the engine has no real per-business source for that yet - see the
 * `certifications`/`warrantyDetail`/`responseTime` slots in
 * `site-content.js` for the same "real data only" rule applied elsewhere.
 */

export const DOOR_STYLE_INFO = {
  sectional: {
    material: 'Steel, insulated or non-insulated',
    detail: 'The most common residential garage door style in North America. Horizontal panel sections hinge together and roll up along a pair of vertical-then-horizontal tracks. Available as a single steel skin or, more often, an insulated build with a foam core between two steel layers.',
  },
  carriage: {
    material: 'Steel, composite, or wood-faced',
    detail: 'Styled to look like the swing-out carriage or barn doors of an older building, but operates on the same overhead track as a standard sectional door. Usually finished with decorative hinge and handle hardware to complete the look.',
  },
  'modern-flush': {
    material: 'Steel or aluminum',
    detail: 'A flat, smooth-faced panel design with no raised molding or ridges - a minimalist look that pairs with contemporary architecture. Built on the same sectional-track mechanism as a traditional panel door.',
  },
  'full-view': {
    material: 'Aluminum frame with glass or acrylic panels',
    detail: 'Aluminum-framed sections glazed with glass (clear, frosted, or tinted) instead of solid panels. Common on modern homes and commercial storefronts for natural light; typically offers less insulation than a solid steel door unless the glazing itself is insulated.',
  },
  'raised-panel': {
    material: 'Steel',
    detail: 'The traditional embossed-panel look most associated with a residential garage door, available in long- or short-panel patterns. Comes insulated or non-insulated, same as sectional doors.',
  },
  commercial: {
    material: 'Heavy-gauge rolling steel',
    detail: 'A rolling steel curtain (often slatted) built for higher daily cycle counts and larger openings than a residential sectional door - loading docks, warehouses, and commercial bays.',
  },
};

/** Generic, factual insulation/options primer - industry-standard concepts,
 *  not a claim about any specific business's stock or pricing. */
export const INSULATION_PRIMER = {
  h2: 'Insulation & options',
  body:
    'Insulated doors sandwich a foam core (polystyrene or polyurethane) between two steel skins; ' +
    'non-insulated doors are a single steel layer. Insulation is usually described by R-value, and ' +
    'thicker cores generally mean a higher R-value and a heavier door - which changes the spring and ' +
    'opener sizing needed to lift it safely.\n\n' +
    'Beyond the core, the main choices on most manufacturer lines are the color finish, the window/lite ' +
    'pattern (if any), and decorative hardware. Exact availability varies by manufacturer and product line.',
};
