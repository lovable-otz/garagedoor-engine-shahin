# Assumptions & data-reality analysis

The original brief imagined a rich dataset (phone, address, reviews, ratings,
hours, services, service areas, brands, certifications, warranties, years in
business…). **The actual workbook does not contain those fields.** This document
records what the data really is and every engineering decision that followed,
because the brief's #1 rule is *never invent factual business information*.

## What the workbook actually contains

Inspected `GarageDoor_1000_SITE_BUILD_SHEET.xlsx`:

**Sheet 1 — “Site Build Sheet”** (1,000 rows, 0 missing in required fields):

| Column | Field | Example |
|---|---|---|
| `#` | serial | `1` |
| `Domain (Purchased)` | domain | `chicopeegaragedoorpros.com` |
| `Business Name` | name | `Chicopee Garage Door Pros` |
| `City` | city | `Chicopee` |
| `State` | state | `MA` |
| `Primary Color` | brand hex | `#0F172A` |

**Sheet 2 — “GDR-1000-TAB1-CITIES”** (per-city planning/geo): `population`,
`lat`, `lng`, `county_fips`, `tier`, `demand_per_mo`, `winnability`, and a
verification address (a maker-space, **not** the business address). Suburb /
neighborhood *counts* exist but the actual lists are populated for only a
handful of cities.

**That's it.** 100 distinct brand colors, 47 states.

## What is therefore ABSENT (and must never be invented)

phone · email · business address · ZIP · hours · description · reviews ·
rating · review count · years in business · licenses · certifications ·
warranties · guarantees · pricing · financing · brands serviced · awards ·
emergency/24-7/same-day availability · real service-area lists.

## Decisions that follow

1. **The model is a superset, not a fantasy.** `Business` has fields for all of
   the above so the schema is future-proof, but they stay `null`/empty with
   `provenance: 'absent'`. Components that need them are omitted.

2. **CTAs never fake a phone.** With no phone number, the primary CTA is
   “Get a Quote” → `/contact/`. `tel:` links appear only if `business.phone`
   is ever populated.

3. **No reviews, no review UI, no review schema.** The reviews section returns
   empty and `aggregateRating` is never emitted — fabricating either would be
   dishonest and a Google structured-data policy violation.

4. **“Emergency” = situation urgency, not an availability claim.** Themes with
   an emergency band describe the *problem* (“a door that won't close leaves
   your home open”) and route to contact. They do **not** say 24/7, same-day,
   or “we're available now”.

5. **Trust bar shows only facts.** Location (city/state, from data), the
   categories of work done (true for any garage-door business), and a
   “diagnosis first” approach statement. No licensed/insured/BBB/warranty chips.

6. **Service copy is category-level truth.** Describing what spring or opener
   work *is* holds for any such business, so it isn't a business-specific claim.
   City specifics are layered only from real values (name, city, state,
   population).

7. **Service-area pages require real areas.** They are generated only when the
   rich content folder actually provides named neighborhoods/suburbs (as Dallas
   does). No doorway pages are spun up by swapping a city name.

8. **Images are honest placeholders.** With no business photos, the engine
   renders theme-colored inline-SVG *illustrations* of door motifs, labelled as
   illustrative styles — never presented as “our recent projects”. Real
   `business.images[]` (if ever supplied) take precedence automatically.

9. **A QA scanner enforces the rule.** `data.noFabrication` scans every rendered
   page for claim phrases (`24/7`, `licensed`, `insured`, `warranty`, `free
   estimate`, `family owned`, …). The engine's own fallback copy contains none;
   any hit (e.g. inside approved rich content) is surfaced as a **warning** for
   human review, not silently shipped.

## The content model (from the Dallas reference sample)

`contents/dallas-tx/` shows the intended rich-content shape — AI-generated,
**fact-grounded** page JSON:

```jsonc
{
  "title": "...", "meta": "...", "h1": "...",
  "sections": [{ "h2": "...", "body": "…\n\n…" }],
  "faq": [{ "q": "...", "a": "..." }],
  "schema_facts": { "areaServed": "Dallas, TX" },
  "swap_test": ["city-specific sentences proving the page isn't generic"],
  "facts_used": ["F1","F2", …]
}
```

Page types by filename marker: `-home`, `-svc-`, `-nb-` (neighborhood),
`-sub-` (suburb), `-top-` (topic article). The engine's adapter is
**prefix-agnostic** — any city's export drops in without config.

**Division of labor:** rich local content (grounded in census-style facts) is
produced by a separate content pipeline and dropped into `contents/`. The
*engine* consumes it when present and otherwise generates safe fallback pages.
This keeps the engine honest: it never manufactures the local facts that make
the Dallas pages good; it renders them when a trusted source provides them.

## Other assumptions

- **State validation** against the 50 states + DC; unknown states become a
  warning, not a failure.
- **Missing brand color** → neutral blue `#1D4ED8` + a warning (0 rows needed
  this in the current data).
- **Duplicate domains** → first wins; later ones flagged (0 in current data).
- **Join key** for market facts is domain first, then `city|state`.
- **Footer year** comes from the clock unless `--year` is passed.
