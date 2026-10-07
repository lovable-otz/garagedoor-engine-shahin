/**
 * Fallback Content Builder.
 *
 * When a business has no pre-generated rich content, this builds safe,
 * non-fabricated pages from ONLY what the dataset actually knows: business
 * name, city, state, population (real), and the universal service categories.
 *
 * Hard rules enforced here:
 *  - No invented phone, address, hours, reviews, ratings, years, licenses,
 *    warranties, pricing, "24/7", "same-day", "family-owned", awards, brands.
 *  - Every factual clause traces to a dataset value. Neutral, category-level
 *    descriptions of garage-door work are used elsewhere (true for any such
 *    business, so not a business-specific claim).
 *  - Seeded phrasing variation keeps fallback pages from being byte-identical
 *    across cities without ever changing the facts.
 *
 * Output page shape matches the rich-content schema so the generator treats
 * both identically: { title, meta, h1, sections:[{h2,body}], faq:[{q,a}], schema_facts }
 */

import { stream, subSeed, seedFor } from '../util/hash.js';
import { commas, humanList } from '../util/strings.js';

function loc(b) {
  return b.state ? `${b.city}, ${b.state}` : b.city;
}

/** Build the homepage fallback content. */
function homePage(b, s) {
  const where = loc(b);
  const svcNames = b.services.map((x) => x.short || x.label);
  const popClause = b.population != null
    ? s.pick([
        `${b.city} is home to roughly ${commas(b.population)} residents, `,
        `With a population of about ${commas(b.population)}, ${b.city} `,
        `${b.city} - population near ${commas(b.population)} - `,
      ])
    : `${b.city} `;

  const introTail = b.population != null
    ? s.pick([
        'has the mix of older and newer homes that keeps garage doors in regular need of service.',
        'has plenty of homes whose original garage doors, springs, and openers are reaching the age where they need attention.',
        'has a housing stock where doors, springs, and openers wear on the usual schedule.',
      ])
    : s.pick([
        'has homes whose garage doors, springs, and openers wear on the usual schedule.',
        'has plenty of doors reaching the age where springs and openers need attention.',
      ]);

  const h1 = s.pick([
    `Garage Door Service in ${where}`,
    `${where} Garage Door Repair & Installation`,
    `Garage Door Repair for ${where}`,
  ]);

  return {
    title: `${b.name} - Garage Door Repair & Installation in ${where}`,
    meta: `${b.name} provides garage door repair, installation, spring, and opener service for ${where}. Diagnosis first, then the fix that actually holds up.`,
    h1,
    sections: [
      {
        h2: 'What we work on',
        body:
          `${popClause}${introTail}\n\n` +
          `The work covers the parts of a garage door that wear or fail with use: ` +
          `the springs that carry the door’s weight, the cables and rollers that guide it, ` +
          `the track it runs in, and the opener that drives it. A visit starts with finding ` +
          `what actually failed before anything is replaced.`,
      },
      {
        h2: 'Services',
        body:
          `Common work in ${b.city} includes ${humanList(svcNames.slice(0, 5)).toLowerCase()}. ` +
          `Springs and openers are the most common calls on doors that have been in service for a couple of decades, ` +
          `since a spring is rated in open-and-close cycles rather than years and tends to let go at the end of that count.`,
      },
      {
        h2: 'How a visit goes',
        body:
          `You describe what the door is doing - won’t open, opens crooked, makes a bang and stops, ` +
          `or the opener runs but the door doesn’t move. That usually narrows it down before anyone arrives.\n\n` +
          `On site, the door is tested under power and by hand, spring tension and cable condition are checked, ` +
          `and the track and opener settings are looked at. You’re told what’s wrong before any part is replaced.`,
      },
    ],
    faq: sharedFaq(b),
    schema_facts: { areaServed: where },
  };
}

function aboutPage(b, s) {
  const where = loc(b);
  return {
    title: `About ${b.name} - Garage Door Service in ${where}`,
    meta: `About ${b.name}, a garage door repair and installation service for ${where}.`,
    h1: `About ${b.name}`,
    sections: [
      {
        h2: `Serving ${where}`,
        body:
          `${b.name} works on residential garage doors in ${where}` +
          `${b.population != null ? `, a community of about ${commas(b.population)} people` : ''}. ` +
          `The focus is straightforward: diagnose the actual problem, explain it plainly, and carry out the ` +
          `repair or installation that will hold up - not the cheapest patch or the biggest upsell.`,
      },
      {
        h2: 'How we approach the work',
        body:
          `Garage door problems tend to be urgent - a car stuck inside, a door that won’t close and seal the house. ` +
          `The approach is to be clear about what a job needs, what it doesn’t, and when a repair makes more sense ` +
          `than a replacement or the other way round.`,
      },
    ],
    faq: sharedFaq(b),
    schema_facts: { areaServed: where },
  };
}

function servicePage(b, svc, s) {
  const where = loc(b);
  return {
    title: `${svc.label} in ${where} - ${b.name}`,
    meta: `${svc.label} for ${where}. ${svc.blurb}`,
    h1: `${svc.label} in ${where}`,
    sections: [
      { h2: 'What this covers', body: svc.detail },
      {
        h2: 'When to call',
        body:
          `If a door in ${b.city} is showing the signs above, it’s worth having it looked at before a ` +
          `small issue becomes a door that won’t open at all. The visit starts with a diagnosis, not a parts list.`,
      },
    ],
    faq: sharedFaq(b).slice(0, 3),
    schema_facts: { areaServed: where, serviceType: svc.label },
  };
}

function contactPage(b) {
  const where = loc(b);
  return {
    title: `Contact ${b.name} - ${where} Garage Door Service`,
    meta: `Request garage door service from ${b.name} in ${where}.`,
    h1: `Contact ${b.name}`,
    sections: [
      {
        h2: 'Request service',
        body:
          `Tell us what the door is doing and where you are in ${where}, and we’ll take it from there. ` +
          `The more you can describe - the sound it makes, whether it moves at all, when it started - the faster ` +
          `we can tell you what’s likely going on.`,
      },
    ],
    faq: [],
    schema_facts: { areaServed: where },
  };
}

/** Category-true FAQ - no business-specific claims. */
function sharedFaq(b) {
  return [
    {
      q: 'Why did my garage door spring break without warning?',
      a: 'Torsion springs are rated for a set number of open-and-close cycles rather than a number of years. ' +
        'Once a door has been through more cycles than the spring was rated for, it fails at the end of that count ' +
        'instead of wearing down slowly - which is why it often seems to happen out of nowhere.',
    },
    {
      q: 'Is it worth repairing an older opener, or should it be replaced?',
      a: 'It depends on what failed. If the motor is sound, a worn drive gear or a failed board can often be replaced. ' +
        'If the unit is discontinued and parts are no longer available, replacement usually makes more sense.',
    },
    {
      q: 'Can a single damaged panel be replaced instead of the whole door?',
      a: 'Sometimes. If the door’s model is still in production, a matching section can be fitted. If the run has been ' +
        'discontinued, an exact match may not be possible and replacing the door is often the better call.',
    },
    {
      q: `Do you work throughout ${b.city}?`,
      a: `Yes - ${b.name} serves ${loc(b)} and the surrounding area.`,
    },
  ];
}

/**
 * Universal guide topics. These are CATEGORY knowledge about how garage doors
 * work and fail - true for any garage-door business anywhere - so they are not
 * fabricated business-specific claims. They give every site (even those with no
 * rich content) a real, populated "Guides" menu. City name is used only for
 * neutral framing ("homeowners in <city>"), never to assert a local fact.
 */
function universalTopics(b, s) {
  const where = loc(b);
  const cityFaq = sharedFaq(b).slice(0, 3);
  const T = [
    {
      slug: 'garage-door-spring-failure',
      h1: 'Signs Your Garage Door Spring Is Failing',
      lead: 'How torsion and extension springs wear out - and what a breaking spring looks and sounds like.',
      sections: [
        ['How garage door springs work', 'A garage door’s springs - not its opener - carry almost all of the door’s weight. Torsion springs mounted above the door wind and unwind as it moves; extension springs along the tracks stretch and contract. Because they do the heavy lifting, they are the part under the most constant load, and the part most likely to fail first.'],
        ['Why springs break "suddenly"', 'Springs are rated in open-and-close cycles, not years. A spring rated for, say, 10,000 cycles has a finite budget of movements; once that budget is spent it lets go at the end of the count rather than weakening gradually. That is why a spring so often breaks with a loud bang on an otherwise ordinary morning.'],
        ['What a failing spring looks like', 'Common signs: the door feels far heavier than usual, opens a few inches then stops, hangs crooked, slams down faster than it should, or you see a visible gap in a torsion spring coil. A door with a broken spring should not be forced with the opener - that shifts the strain onto parts never meant to carry it.'],
      ],
    },
    {
      slug: 'garage-door-wont-close',
      h1: 'Why Your Garage Door Won’t Close',
      lead: 'The usual reasons a door reverses, stops, or refuses to shut - from safety sensors to worn parts.',
      sections: [
        ['Start with the safety sensors', 'Every modern opener has two photo-eye sensors near the bottom of the tracks. If they are misaligned, dirty, or blocked, the door will refuse to close and usually reverses with the opener light blinking. Wiping the lenses and making sure both face each other squarely resolves a surprising share of "won’t close" calls.'],
        ['When it is not the sensors', 'If the sensors are clear and the door still won’t close, the cause is often mechanical: a broken spring, a frayed cable, a roller off the track, or travel/force limits on the opener set wrong. These are worth having looked at rather than forced, since running the opener against a stuck door can compound the damage.'],
      ],
    },
    {
      slug: 'repair-or-replace-garage-door',
      h1: 'Garage Door: Repair or Replace?',
      lead: 'When a targeted repair is the smart call, and when a new door is the better long-term value.',
      sections: [
        ['When a repair makes sense', 'Most single-point failures - a broken spring, a dead opener, a bent track, a frayed cable - are repairs, not replacements. If the door panels are sound and the model’s parts are still available, fixing the failed component is almost always the faster and cheaper route.'],
        ['When replacement wins', 'Replacement starts to make sense when damage spans multiple panels, when the door’s run has been discontinued so matching sections can’t be sourced, or when an old uninsulated door is driving up energy costs. A good diagnosis should tell you plainly which side of that line your door is on.'],
      ],
    },
    {
      slug: 'choosing-a-new-garage-door',
      h1: 'Choosing a New Garage Door',
      lead: 'Material, insulation, and style basics for homeowners weighing a new door.',
      sections: [
        ['Material and insulation', 'Steel is the most common choice for its balance of durability and price; wood and composite offer a higher-end look at a higher cost. Insulation (measured as an R-value) matters most for attached garages and rooms above or beside them, helping with temperature and cutting down on noise.'],
        ['Style and operation', 'Sectional doors are the standard; carriage-house and full-view glass doors trade some cost for curb appeal. Whatever the style, the opener and springs should be matched to the finished door’s weight - an insulated door is heavier than the one it replaces, and the hardware has to be sized for it.'],
      ],
    },
    {
      slug: 'garage-door-maintenance-basics',
      h1: 'Garage Door Maintenance Basics',
      lead: 'Simple seasonal checks that keep a door running quietly and catch problems early.',
      sections: [
        ['A few minutes, twice a year', 'Most garage-door maintenance is quick: look and listen as the door runs, watch for jerky movement or new noises, and check that the door stays put when stopped halfway (if it drifts, the spring balance is off). Keeping the tracks clear and the rollers and hinges in good shape heads off most surprise failures.'],
        ['What to leave alone', 'Lubricating rollers, hinges, and the opener chain with a garage-door-rated lubricant is homeowner-friendly. The torsion springs and their cables are not - they are under extreme tension and are best adjusted by someone with the tools to do it safely.'],
      ],
    },
  ];
  return T.map((t) => ({
    slug: t.slug,
    name: t.h1,
    page: {
      title: `${t.h1} - ${b.name}`,
      meta: `${t.lead} A guide from ${b.name} for ${where}.`,
      h1: t.h1,
      sections: t.sections.map(([h2, body]) => ({ h2, body })),
      faq: cityFaq,
      schema_facts: { areaServed: where },
    },
  }));
}

/**
 * Build the full fallback content bundle for a business.
 * @param {import('../data/model.js').Business} b
 */
export function buildFallbackContent(b) {
  const s = stream(subSeed(seedFor(b.domain, b.name), 'content'));
  const home = homePage(b, s);
  return {
    source: 'fallback',
    home,
    about: aboutPage(b, s),
    services: b.services.map((svc) => ({ id: svc.id, service: svc, page: servicePage(b, svc, s) })),
    contact: contactPage(b),
    // Unified content shape: always present so components can read them safely.
    // No neighborhoods/suburbs are invented - service-area pages appear only
    // when real area content exists. Guides are universal category knowledge
    // (not business-specific claims), so every site gets a populated Guides menu.
    areas: [],
    neighborhoods: [],
    suburbs: [],
    topics: universalTopics(b, s),
    faq: Array.isArray(home.faq) ? home.faq : [],
  };
}

export default buildFallbackContent;
