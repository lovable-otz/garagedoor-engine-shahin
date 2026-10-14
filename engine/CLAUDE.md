# Garage-Door Site Engine — project brief

Read this file first in any new session on this project. It captures state
that otherwise only lives in chat history (which does not carry over if you
switch Claude accounts/sessions). For the code architecture itself, see
`docs/ARCHITECTURE.md` (modules/pipeline), `docs/ASSUMPTIONS.md` (data
reality + no-fabrication policy), `docs/ADDING.md` (extending themes/
services/page types). Those cover the stable design; this file covers
**current state and recently-established conventions** that may be newer
than those docs.

## What this is

A zero-npm-dependency Node (ESM, v20+) static-site generator. One Excel
workbook (`GarageDoor_1000_SITE_BUILD_SHEET.xlsx`, in the repo root above
`engine/`) + per-city rich content JSON (`../contents/<city>-<state>/`)
becomes real, deployable garage-door-repair business websites — 18 themes,
each with its own hero/nav/card/footer/CTA-style/section-order language, with
per-business variant rolls on top so no two sites look identical. Every
generated fact is real: the engine has a hard, enforced no-fabrication rule
(see `config/generation.config.js` → `content.neverFabricate`, and
`docs/ASSUMPTIONS.md`). Nothing here should ever be reversed to fabricate
placeholder business facts (fake certifications, fake warranty terms, fake
response-time stats, fake reviews, etc.) even if asked — see "No-fabrication"
below.

## FROZEN STATE — ALL 73 built sites are FROZEN (2026-09-01)

**Read this before touching anything in `dist/`.**

**Every built site is frozen.** `FROZEN` in `scripts/repin.mjs` is the whole
registry, and `repin.mjs` refuses all 73 (verified per-domain, not just parsed).

Frozen does NOT mean deployed. Two groups:

- **66 are LIVE** - each has a `production` branch with `production == main` and
  a green `build-and-upload`.
- **7 (1 Sept batch) are frozen but NOT live** - checked against the remotes:
  `content` + `main` only, no `production` branch, no deploy run. They are
  handed over and awaiting a `main -> production` PR.

**Verify "live" against the REMOTE, never from memory of what you pushed.**
This was got wrong in both directions in one session: the 31 Aug batch was
called not-deployed when it already was, and only a remote query settled it.
Query `/repos/OrangeToolzBD/<domain>/branches` and the per-JOB conclusion at
`/actions/runs/<id>/jobs`. A `curl` returning 403 proves nothing - every origin
sits behind a Cloudflare bot challenge that curl fails and a browser passes.

Do **not** regenerate, edit, re-commit or push ANY of them unless the user
gives a specific fix for a specific site ("fix X on the Miami site"). Absent
that instruction, treat every `dist/<domain>-<city>/` as read-only.

**This is enforced, not just documented.** `scripts/repin.mjs` refuses every
domain in its `FROZEN` set and exits non-zero; `--allow-frozen` is the
deliberate override once a fix IS authorized. Keep that set in sync — a new
batch is free to rebuild until it ships, then it belongs there too.

**All 56 repos now carry `content`, `main` AND `production`**, and
`production == main` on every one (verified 2026-08-31 via
`compare/production...main` -> `ahead_by: 0`). The earlier note here saying
only the original 16 had a `production` branch is obsolete.

The authoritative list is `FROZEN` in `scripts/repin.mjs` (56 entries) — read
it there rather than from any table in this file. The table below is only the
ORIGINAL 16, kept for the build-order history:

| # | domain | city |
|---|---|---|
| 1 | dallasdoorpros.com | Dallas, TX |
| 2 | phoenixgaragedoorco.com | Phoenix, AZ |
| 3 | chicagogaragedoorco.com | Chicago, IL |
| 4 | albuquerquegaragedoorco.com | Albuquerque, NM |
| 5 | coloradospringsgaragedoorpros.com | Colorado Springs, CO |
| 6 | fortlauderdalegaragedoorpros.com | Fort Lauderdale, FL |
| 7 | garlandgaragedoorpros.com | Garland, TX |
| 8 | godenvergaragedoor.com | Denver, CO |
| 9 | irvinggaragedoorpros.com | Irving, TX |
| 10 | kansascitygaragedoorpros.com | Kansas City, MO |
| 11 | miamigaragedoorco.com | Miami, FL |
| 12 | newarkgaragedoorpros.com | Newark, OH |
| 13 | orlandogaragedoorpros.com | Orlando, FL |
| 14 | pasadenagaragedoorpros.com | Pasadena, CA |
| 15 | raleighgaragedoorco.com | Raleigh, NC |
| 16 | sandiegogaragedoorco.com | San Diego, CA |

**Engine-wide work is still fine.** Editing `src/design/css.js`,
`src/components/`, adding or retiring variants does NOT change any live site
until someone runs the CLI for that business. Do the engine fix, then STOP and
report which of the 16 it *would* change. Wait for a per-site instruction.

`dist/` is otherwise disposable for scratch work — generate experiments into a
temp dir with `--out`, never into `dist/`.

Each business's assigned theme, palette, and full variant fingerprint is
recorded in `dist/_reports/design-registry.json` (keyed by domain) — that
file is the source of truth for "what theme/variant is business X on," not
memory. Prefer `scripts/which-variant.mjs` (below) over reading it by hand.

## Container width axis: boxed vs full (2026-10-07)

User instruction: sites whose containers go full screen must have ALL
containers full width - never a mix. New design axis `containerWidth`
(`'boxed' | 'full'`, `CONTAINER_WIDTHS` / `FULL_WIDTH_SHARE` = 25% in
`src/engine/variation.js`), rolled on its own seed stream so no existing axis
moved.

- `full` sets `--max-w: 1920px` (FULL_MAX_WIDTH, 2026-10-07: cap for 2560/4K screens) and `--pad-x: clamp(<theme pad>, 4vw, 64px)` in
  `src/design/tokens.js`, so every `.container` (nav, hero, sections, footer,
  all pages) is viewport minus side padding. `FULL_WIDTH_CSS` in `css.js`
  uncaps the two brandbar rows that carried their own px cap. Text-measure
  caps (paragraph `ch` limits, cta quiet-editorial / color-block card) are
  deliberately kept.
- **Existing sites stay boxed.** `batch.js` pins `containerWidth` from the
  registry record (`'boxed'` when the record predates the axis), so a
  repin/rebuild of any live site is unchanged - verified on Kansas City KS:
  every page identical to the pre-change build apart from the usual image
  rotation. Only brand-new businesses (or `--fresh-registry`) roll it.
- Force it per build with `--variants '{"containerWidth":"full"}'`.
- Not part of `differenceScore`, so uniqueness scores are unchanged; it is
  recorded in the fingerprint for the registry.

## Extra homepage sections - added, then REMOVED (2026-10-12)

User first asked for more homepage sections from existing content (home.json
story, symptoms, local causes, neighborhood spotlight, latest guides, service
FAQs), then: "i dont need the new sections so remove all the new section you
added without about section before faq sections". All of them, and the merges
that came with them (symptom text in service cards, service FAQs topping up
the FAQ), are gone from the engine and the built sites. Do not re-add without
a new request.

Kept from that round (they fix duplication between ORIGINAL sections):
- homepage trustbar drops facts the hero already shows (city, N services,
  N areas, diagnosis) and hides itself under 2 facts (`ctx._heroText`, set in
  pages.js renderHomeSection('hero'), cleared after the homepage renders);
- `ctaBanner` default copy no longer echoes the closing cta() band.

Homepage now: hero > services > process > ctaBanner > why > gallery > areas >
homeBlog > aboutHighlights (x<=2) > faq > cta

- `homeBlog` (added 2026-10-12 on request, "show 3 or 4 blogs card and all
  button below the service area section"): latest posts as .post-card photo
  cards + "View all guides" button to /blog/. 3 cards on boxed sites, 4 on
  full-width ones, fewer if the site has fewer posts; '' when no blog.
  `.post-grid--n3` stays 3-across down to 721px (no stranded third card).

## About content on the homepage, before the FAQ (2026-10-12)

User: "in the homepage there is not too much content so take content from the
about page and add those in homepage before FAQ sections". This SUPERSEDES the
2026-08-24 "no about on the homepage" rule for these sections.

- `aboutHighlights()` (components/index.js), placed by `augmentOrder()` in
  pages.js directly before `faq` (before `cta` when there is no FAQ).
- Takes up to 2 About sections (`aboutPicks`): first those whose TOPIC
  (`SECTION_TOPICS`: housing/who/cost/worth/jobs/call/areas) the homepage does
  not already cover (process = "call", areas section = "areas"); if that gives
  fewer than 2, tops up with the rest, real content before pure contact
  sections ("Contacting Us").
  Each section is a photo + text split, photo alternating sides (left, then
  right). The "More about" button was removed (user 2026-10-12). Renders
  nothing when no About content is left.
- Name-removal leftovers: `scrubUnpublishedNames` now runs a repeat-until-
  stable pass for "from to to", doubled "and and", ", from." and
  "<place noun> from." (e.g. "eight named neighborhoods from."). First 5
  sites: 7 broken phrases -> 0.
- First 5 TWO-D2 sites: +1 to +2 sections, +177 to +426 words each.
- Also 2026-10-12: CSS comments are stripped from every generated stylesheet
  (`stripCssComments` in css.js) - they named other client sites in
  view-source; pages ~31% smaller, rendering unchanged.

## Alt text + responsive audit (2026-10-12)

User: "all images has proper alt text? all pages responsiveness?"
- Alt: all <img> already had non-empty alt. Fixed: header/footer logo next to
  the visible business name is now alt="" (`brandMark(ctx, surface, true)`) -
  it was read twice; photo/text section images (`renderContentTemplate`) alt
  is now "<section heading> - <City> garage door" instead of the same
  "<City> garage door" on every one (also removed a double esc()).
- Responsive sweep: every page of the 5 sites at 320/375/768/1280 (1,484
  loads) checking page h-scroll, elements past the edge, text < 12px, tap
  targets < 24px, broken images. Fixed:
  - 1000px phone rule collapsed split grids to `1fr` (min-content) -> FAQ on
    Fort Mill /faq/ was 384px wide at 375 and clipped; now minmax(0,1fr).
  - sticky .mobile-cta clipped "Call" at 320px -> buttons min-width:0 and a
    <=360px compact size.
  - breadcrumb links and short footer links were 17px tall -> padded to 24px+.
  Result: 0 issues on all 1,484 checks. (Hero background images that extend
  past the edge inside the clipped hero are a deliberate zoom - not an issue.)

## Sidebar quote card: phone is a button (2026-10-12)

User: the "Get a quote" sidebar card showed the phone as plain text. It is now
`<a class="btn side-card__call" href="tel:...">` with the phone icon and
"Call (xxx) xxx-xxxx" - an outlined button (white border/text on the card's
brand gradient) under the solid "Request a Quote" button, same width, both
fixed at 48px tall. Engine-wide (sidebar() in components/index.js).

## Blog index layouts - added, then REMOVED (2026-10-12)

A per-site `blogLayout` axis (classic / rows / overlay / magazine / numbered)
was added, then removed on request: "there is no variations needed for the
blogs card in the blog page". Every site's /blog/ uses the ONE original
layout again (featured .post-card + .post-grid). The axis, its CSS, the
least-used picker in batch.js and the fingerprint field are all gone; the 5
rebuilt sites' registry records no longer carry it. Do not re-add without a
new request. (The homepage `homeBlog` section is separate and stays.)
- Also 2026-10-12: NO service card shows an icon tile any more - every
  serviceCard skin already shows a photo, and the user asked to remove the
  icon from all cards that had both. The `.svc__icon` / `.svc-g__ic` markup is
  no longer emitted (4 skins had only hidden it with CSS). Checked all 19
  skins at 1280 and 375: title sits 14-29px under the photo, no overflow;
  `icon-top` needed its photo's bottom margin back (the icon used to overlap
  it and carry the spacing).

## Folder names = domain = repo name (2026-10-07)

User: "foldername will be with the domain name as the repo name is with the
domain". From now on:

- content pull (`generate-assignment.mjs`): `contents/<domain>/`
- build output (`siteFolderName`): `dist/<domain>/` - git repo inside, branch
  `main`, remote = the site's Git URL; committed locally, NEVER auto-pushed.
- LEGACY kept working: an existing `dist/<domain>-<city>/` (the 80 older
  builds, many with their own `.git`) is reused when no `dist/<domain>/`
  exists, so rebuilding an old site still lands in its own repo; the content
  adapter still falls back to `contents/<city>-<state>/`. The `.com-`-parsing
  helper scripts (apply-*, qa-*, fix-contact-map, inline-section-animations,
  patch-embed-animation) and serve-all accept both names.
- Verified offline in a scratch copy: new site -> dist/<domain>/; legacy
  folder with .git -> rebuilt in place, .git intact.
- 2026-10-07: `git ls-remote` on OrangeToolzBD repos (auburn, mckinney,
  kansascity - all cloned fine on 10-04) now returns "Repository not found"
  with the stored credential, so content pulls fail until GitHub access is
  restored.

## New batch: serials 361-1000 (2026-10-07)

User: new sites come from `docs/SITE_CONTACT.csv` + `docs/garage_door.csv`
(copies in `garagedoor-updated-sites/docs/` and `Garagedoor-engine-phase2/docs/`,
identical); "without builded 360 sites, those are already delivered".

- `scripts/import-site-csv.mjs --contacts <csv> --domains <csv>` splits the
  dataset: a SITE_CONTACT row WITH a phone = delivered (360, serials 1-360,
  built by Shahin/Setu/Ruhul/Iftekhar/Mehedi). Writes
  `config/delivered-sites.js`, `batches/new-sites.rows.json` (640 rows in the
  `generate-assignment.mjs --rows` shape) and `batches/new-sites.report.md`.
  Re-run it whenever the CSVs change.
- Delivered sites are frozen engine-wide now, not just the local registry:
  `cli.js --all/--limit` skip them (`--include-delivered` overrides;
  `--limit N` = first N NEW sites) and `generate-assignment.mjs` skips them
  (`--repull` overrides). `--business <domain>` still builds one on purpose.
- The 360 phones/addresses in the CSV are identical to
  `config/business-contacts.js` - nothing to sync. The 640 new rows have NO
  phone yet (no call button until real ones arrive) but DO have an address:
  SITE_CONTACT leaves it blank, the team sheet (`GarageDoor_Update - Sheet1`,
  verified 2026-10-07: identical to every other source) and
  business-contacts.js carry it, and the import falls back to that.
- #870 / #877: CSV says `...garagedoorpros.com`, workbook says
  `...garagedoorco.com`. User confirmed 2026-10-07: keep the `co` domains
  (`CONFIRMED_DATASET_DOMAIN` in the import script).
- Content for the new sites arrives site-wise later; build each with
  `generate-assignment.mjs --rows` (one row per site) once its content branch exists.

## ONE footer for every site (2026-10-07)

User instruction (Temecula reference screenshot): "make the all footer same
like this, color will be sitewise varied, but design and content needs to
same". `footer()` in `src/components/index.js` now renders a single layout
(`.site-footer.sfoot`, CSS block "unified footer" in `css.js`); the `footer`
variant axis is still rolled/recorded but no longer rendered.

- Layout: brand (logo, one-line description built from the site's real
  services, street / city line, phone) | SERVICES (5 alphabetical + All
  Services) | COMPANY (About Us, Contact, Service Areas, Blog, Request a
  Quote, FAQ - each gated on `has.*`) | SERVICE AREAS (up to 6), then a trust
  badge row, then `© year Name. All rights reserved. · Privacy · Terms ·
  Accessibility` | `address · phone`.
- Colour per site: base is near-black tinted with `--c-secondary`, badge
  icons from `--c-accent`. Headings use the body font on every theme.
- **Badges obey no-fabrication.** The reference's four claims render only
  when real: "Licensed & fully insured" (`insured`/`license`), "Same-day
  service available" (`sameDay`), "Upfront, written pricing"
  (`upfrontPricing`) - all in `config/site-content.js`, default off - and
  "Local crew, real reviews" (business has reviews). Empty slots fall back to
  real facts: Based in City, ST / N garage door services / N nearby
  communities served / Diagnosis first, then the fix.
- Unlike `containerWidth`, this is NOT registry-gated: any rebuild of any
  site picks up the new footer. QA output identical to the pre-change engine
  (`.sfoot__bar` and the footer logo img were allowlisted after checking).

## Content re-pull: 45 Shahin sites got the suburb x service layer (2026-09-13)

Sheet filter: `Assigned` = Shahin AND `Update Date` = 9/13/2026 -> 45 sites,
all Status "Production". Every one's `content` branch now carries
`07-suburb-services/` ("Add the suburb x service layer"; Albuquerque's commit
is dated 09-10). Pulled into `contents/<city>-<state>/` as `lovable-otz` (see
the account note above); a full `contents/` tarball was taken first.
**Only `contents/` changed - no site was regenerated, and every live site is
still frozen and untouched.**

Resolved through the engine, all 45 are internally consistent: every suburb
carries exactly as many services as its city, no suburb is partial, ~3,530
pages estimated across the set (51-106 per site).

**9 sites have 7 services, not 8** - Northbrook, Burbank, Humble, Hesperia,
Hugo, Las Cruces, Hanford, Martinsburg, Matthews. Verified this is the
CONTENT, not the engine: each export has exactly 7 files in
`02-service-lines/` and 7 per suburb, the engine resolves all 7, and no two
raw slugs collide on one canonical service. Four of them (Northbrook, Burbank,
Las Cruces, Martinsburg) ship a `p-<city>-commercial-garage-door.txt` refusal
note - the writer declined that 8th page for lack of a real local fact. The
service MIX also varies per site (cable-repair, spring-repair, maintenance,
emergency-garage-door appear on some), so "missing vs the standard 8" is not
a defect list - each site simply has its own 7.

## First two live sites rebuilt on the new structure: Dallas + Chicago (2026-09-13)

User instruction: *"generate the first 2 sites only"* - the first two rows of
the 45-site re-pull list. Built with
`node scripts/repin.mjs --allow-frozen dallasdoorpros chicagogaragedoorco`,
i.e. every design axis pinned from the registry, written to `dist/`. **Not
committed, not pushed; still frozen; nothing on GitHub touched.**

| site | total | hub | services | suburbs | suburb services | blog | root |
|---|---|---|---|---|---|---|---|
| Dallas | 62 | `/dallas/` | 8 | 4 | 32 | 8 | 9 |
| Chicago | 105 | `/chicago/` | 8 | 8 | 64 | 15 | 9 |

- **Design held.** Dallas: theme + 7 primary axes + all 14 section variants
  identical to the pins `repin --print` showed before the build. Chicago:
  theme + 7 primary axes identical (its section list was cut off in that
  printout, so those 14 were not independently re-checked - Dallas proves
  the section-pinning path works).
- **QA:** static sweep 0 dead links / 0 broken images on both; SEO files
  clean; responsive sweep **Chicago 630/630, Dallas 372/372**, 0 overflow,
  0 buttons under 44px, 0 text under 11.5px.
- **Service mix differs per site and that is correct** - Dallas publishes
  cable-repair, commercial-garage-door, spring-repair; Chicago publishes
  cable-repair, emergency-garage-door, maintenance, spring-repair. Each site's
  suburbs carry exactly that site's own 8.
- Serve with `all-sites` (serve-all.mjs): ports are assigned ALPHABETICALLY by
  domain, so they shift whenever a site is added - chicago 8901, dallas 8902,
  parsippany 8903 with the current three. Check `preview_logs` rather than
  assuming.

## dist/ was cleared to ONE site (2026-09-10)

User instruction: *"delete all previous generated sites from dist only this
sites will be there, dont delete the contents folder"*.

- **All 80 previously-built site folders were deleted from `dist/`** (8.4 GB ->
  100 MB), plus the old gallery `index.html`. `dist/` now holds only
  `parsippanygaragedoorpros.com-parsippany/` (78 pages), a fresh one-card
  `index.html`, `_reports/` and `_section-catalog/`.
- **Nothing was lost.** Checked first, per repo: all 80 had **0 uncommitted
  changes and 0 commits ahead of `origin/main`**. Every deleted site is fully
  recoverable from its GitHub `main`/`production` branch.
- **`contents/` was NOT touched** - still 81 folders.
- **`dist/_reports/` was deliberately KEPT**, including all 81 entries in
  `design-registry.json`. It is not a site: it is the only record of every
  site's theme + 21-axis fingerprint, and the engine has no git history, so
  deleting it would permanently break `repin.mjs` for all 73 live sites. A
  timestamped backup was also taken to the session scratchpad.
- **The FROZEN guard in `repin.mjs` is unchanged.** Those 73 sites are still
  live on GitHub; FROZEN protects against pushing changes to them, not against
  a local folder existing. The "treat `dist/<domain>-<city>/` as read-only"
  instruction above now simply has nothing local to apply to - rebuild one
  with `repin.mjs` if it is ever needed again.
- **`rebuild-gallery.mjs` is SAFE to run with a partial `dist/`** (corrected
  2026-09-13 - an earlier note here said it would produce broken cards, which
  was wrong and never checked). It builds its cards from the site FOLDERS that
  actually exist in `dist/` and only reads the registry for labels, so every
  card points at a real site. `repin.mjs` runs it automatically; verified with
  3 sites in dist -> 3 cards, all targets present.

### Parsippany is NOT committed (2026-09-13 decision)

The fresh build has **no `.git`**, and its GitHub repo already has a `main`
holding the OLD site. A plain `git init` + commit would create unrelated
history, so a later push would have to **force-push over `main`**. The clean
path is to fetch `main`'s history first and commit on top (a fast-forward
push later) - but that needs a GitHub call, and the user has restricted GitHub
access. Offered three options; **user chose "don't commit yet"**. Ask again
before any git work on this site.

## Per-site GitHub repos — layout, committing, publishing

Every business has its own repo at **`github.com/OrangeToolzBD/<domain>`** with
exactly two branches:

- **`content`** — the authored content export, in numbered folders
  (`01-money-pages/`, `02-service-lines/`, `03-guides/`, `04-suburbs/`,
  `05-trust/`, `06-technical/`). This is the SOURCE that gets copied into
  `contents/<city>-<state>/`. That is where the contents folder comes from.
- **`main`** — the generated static site, and the **default branch**.

Conventions, all verified 2026-08-25:

- Commit identity is **repo-local** `lovable-1 <lovable-1@orangetoolz.com>`
  (`git -C <site> config user.name/user.email`). It deliberately does NOT use
  the machine's global git identity.
- Commit messages end with the `Co-Authored-By: Claude Opus 5` trailer.
- `buildSite()` preserves an output folder's `.git` across regeneration, so
  re-running generation never resets commit history.

**Publishing is always a separate, explicitly-authorized step.** Never push
without being asked, even when the rest was automated.

### Fixing a site that is already LIVE — the PR flow

Standing instruction, 2026-08-27: *"when i fix my sites which are in production
push to main then create a PR to production branch then merge thr PR."*

A live site has a third branch, `production`, which is what is actually
serving. It is **only ever updated through a merged PR** — never pushed to
directly.

1. Fix the VARIANT in engine source (never the site output).
2. Regenerate that ONE site with **every axis pinned to its current values**
   from the registry fingerprint — otherwise sub-variants re-roll and the
   design changes.
3. Commit locally, then ASK before pushing.
4. `git push origin main`
5. Open a PR `main -> production` and merge it (API snippets above; `gh` is
   not installed).

**All 56 repos carry `content`, `main` and `production`** (verified 2026-08-31
against the live remotes). An earlier note here said only some had
`production` - that was wrong.

**Keep commit and merge messages SHORT - ideally one line.** The deploy
workflow's `notify` job does
`printf '%s' "$COMMIT_MSG" | head -n1 | cut …` under `set -euo pipefail`.
`head` closes the pipe after one line, so a multi-line message can give
`printf` EPIPE -> `write error: Broken pipe` -> the step fails. It is a race,
which is why identical messages failed on 9 of 56 repos and not all.
**`build-and-upload` still SUCCEEDS** - the site deploys fine, only the Discord
notification dies. So never report "the deploy failed" from the run-level
conclusion; check the per-job status:
`GET /repos/OrangeToolzBD/<domain>/actions/runs/<id>/jobs`.
Put the detail in the PR body instead - nothing pipes that through `head`.
The user has seen this and asked that the workflow NOT be changed.

**Warning that cost a surprise once:** regenerating a live site picks up EVERY
engine change since it was built, not only the requested one. On Raleigh the
ask was "update the footer", but the regen also corrected the hardcoded-hero
bug and moved 28 of 29 pages from `split-image-right` to `fullbleed-dark`.
Pin the axes, say what else will change BEFORE regenerating, and report the
real diff afterwards.

```bash
# inside dist/<domain>-<city>/ — first publish
git init -b main && git config user.name "lovable-1" && git config user.email "lovable-1@orangetoolz.com"
git add -A && git commit -F -   # message + Co-Authored-By trailer
git remote add origin "https://github.com/OrangeToolzBD/<domain>"
git push -u origin main
```

**Which GitHub account can read the site repos (verified 2026-09-13).**
`~/.git-credentials` holds TWO github.com logins, and the credential helper
(`store`) returns the FIRST one - `Shahinkhan983` - by default. That account
can see only 2 of the 45 Shahin-assigned site repos (Dallas, Chicago); every
other repo answers **"Repository not found"** (a 404, even though the token is
valid - GitHub hides private repos you cannot read). The second stored login,
`lovable-1@orangetoolz.com` (authenticates as **`lovable-otz`**), can read all
45. Before any clone/fetch of a site repo, use that one explicitly - pass it as
an auth header through `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0`
(`http.https://github.com/.extraheader`) plus `-c credential.helper=`, so the
token never lands in argv or output and git cannot silently fall back to
Shahinkhan983. Never paste or echo the token itself.

**`gh` is NOT installed on this machine.** To change a repo setting (e.g. make
`main` the default branch — new repos default to `content`), use `curl` with
the token already in the git credential helper. Retrieve it programmatically
and pass it only as a header — never print or persist it:

```bash
TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/OrangeToolzBD/<domain>" -d '{"default_branch":"main"}'
```

Verify with `git ls-remote --symref <url>` — `ref: refs/heads/main HEAD`.

## ⚠ The engine itself is NOT under version control

`engine/src/` has **no git repo**. Every variant fix, retirement and
convention below exists only as working files on this machine — no history, no
remote, no diff, no recovery if overwritten. The 16 sites are safe on GitHub;
the engine that produces them is not. Raised with the user 2026-08-25; if it
is still untracked, offer to `git init` the engine (do not pick a remote
without being asked).

## THE MAIN WORKFLOW — "fix this section on site X"

This is what almost every request looks like once sites are live. The user
reviews sites one by one and reports a section that looks wrong, naming a
**reference site**. Their instruction, 2026-08-25:

> *"when i command to fix any section properly fix that variant not only for
> that site as i need to reuse next generation, then use the variant i check
> one by one sites so fix with my command and ref site and that variant"*

**The named site is only where the problem was SPOTTED. The target is the
VARIANT.** The same key will be rolled onto businesses not yet generated, so a
fix that lives anywhere other than the variant's own definition is lost.

**Step 0 — always resolve site + section → variant key first:**

```bash
node scripts/which-variant.mjs denver process      # one axis + who else shares it
node scripts/which-variant.mjs denver              # all 22 axes for a site
node scripts/which-variant.mjs --variant boxed-diagonal   # reverse lookup
```

It reads the design registry, prints the variant, lists every site sharing it,
and flags frozen ones. Built for this workflow — use it instead of re-deriving
the fingerprint by hand (`sections` is a pipe-joined string in `SECTION_AXES`
order and is easy to misread off by one).

**Then:**

1. Fix the variant in `src/design/css.js` (or its branch in
   `src/components/index.js`). **Never** patch one site's output; never scope a
   fix with a site-specific selector.
2. Grep for the same pattern across the rest of `css.js` — nearly every bug
   this session was also present on 2-3 sibling variants that hadn't been
   reported yet.
3. Report which sites the fix would change. **All 16 are frozen** — do not
   regenerate them without a per-site instruction.
4. When a regen IS authorized, keep it scoped:
   `node src/cli.js --business <domain> --theme <its registry theme> --out dist`
   then `node scripts/rebuild-gallery.mjs`. Never the full assignment pipeline,
   never a content re-pull.
5. Verify in the browser and **measure**, don't eyeball — see "Verifying a fix"
   below.

**Variant fixes are permanent and automatically inherited.** Verified
2026-08-25 by generating a scratch site forcing fixed keys: all variant CSS is
inlined into every page, so a site picks up a fix even for variants it did not
roll, and a later re-roll onto that key renders the fixed version.

## Onboarding a NEW BATCH of sites — staged, and GATED

When the user hands over the sheet for new sites they want it staged, with a
hard stop before anything is generated. Their words: *"i will give you the
sheet then pull the new sites with respective address and number from the
sheet, then check the logo for new sites, then after my confirmation generate
sites"*.

Everything runs through `scripts/generate-assignment.mjs` — **update that
script rather than hand-running steps**, so it stays the single source of
truth.

```bash
node scripts/generate-assignment.mjs --assigned Shahin --dry-run   # plan only
node scripts/generate-assignment.mjs --assigned Shahin
node scripts/generate-assignment.mjs --rows /path/rows.json        # off-sheet businesses
```

1. **Work out what's actually new.** Fetch the sheet, filter to the assignee,
   diff against reality: in the registry (done), has a `contents/<city>-<state>/`
   folder (staged), or neither (new). Report the **count + per-site table**
   first — that number is what the user is deciding on.
2. **Pull content for the new ones only.** Shallow-clone each row's `Git URL`
   at its `content` branch into `contents/<city>-<state>/`, preserving the
   numbered subfolders (never flatten — the adapter scans recursively and keys
   off basenames). Refuse to overwrite any frozen site's folder. Verify via the
   engine's own `resolveContent()`, not by counting files.
3. **Phone + address come from the SHEET, per site.** `node scripts/sync-contacts.mjs`,
   then confirm each new domain resolves to ITS OWN row — distinct values, area
   code consistent with the metro. Never a shared placeholder.
4. **Check logos.** `images/logo/` is indexed by SERIAL. Coverage is only
   serials 1-200 and 991-1000 — **201-990 have no logo**, so most batches will
   be largely logo-less. Not a blocker (text-monogram fallback) but report it.
5. **STOP.** Report the batch and wait for explicit go-ahead. This is the point
   of the staging.
6. **Generate**, then run the mandatory QA loop below.
7. **Commit locally.** Push + default-branch flip only on separate approval.

## Regenerating a reviewed site without redesigning it — `scripts/repin.mjs`

```bash
node scripts/repin.mjs danapoint brownsville     # rebuild, nothing re-rolls
node scripts/repin.mjs --print danapoint         # show the 21 pins, build nothing
```

Reads each domain's stored fingerprint out of the design registry, rebuilds the
full 21-axis pin JSON from it, and runs `cli.js` with `--variants`. That makes
the rebuild a pure no-op except for the engine change being shipped — which is
what the PR-flow warning above (Raleigh's footer fix silently moving 28 pages
onto a different hero) demands. It never touches `contents/`, the sheet, or
git, so it is NOT a substitute for `generate-assignment.mjs` on a new batch.

The `sections` fingerprint field is a pipe-joined string in `SECTION_AXES`
order — positional, so it is split against that exact array. If a new axis is
ever inserted mid-array, old registry rows silently mis-map; append, don't
insert.

## The two QA sweeps — static, then responsive

```bash
node scripts/qa-sites.mjs                  # all sites; substring-filter as args
node scripts/qa-seo-files.mjs              # robots.txt / sitemap.xml / llms.txt
```
Broken images, duplicate-image-on-page, dead internal links, missing alt.
Decidable from the built files. The duplicate check is scoped to `<main>` on
purpose: the logo legitimately appears in the header AND footer of every page,
which reported as 1,082 false duplicates before scoping.

`qa-seo-files.mjs` covers the three machine-readable files. Two real defects it
caught on 27 of 36 sites, both now fixed in the engine (2026-08-27):
- **Duplicate `<loc>` in sitemap.xml + duplicate links in llms.txt.** Two
  content entries can slugify onto the SAME pathname (a neighbourhood spelled
  two ways, or a suburb that is also in the areas list). Toms River had 15, all
  landing on `/service-areas/allenwood/`. Fixed in `generator/site.js`'s
  `record()` (the one chokepoint every page type passes through) AND in
  `seo/llms.js`, which builds its lists from the CONTENT rather than from
  `pages` and so needed its own `uniqueBy` guard. Toms River went 90 -> 75
  pages, which is the collisions disappearing, not content being lost.
- **Unformatted phone.** Real exports carry the number as a bare digit run
  ("19566466904"), which reached `<meta name="description">`, page prose and
  llms.txt. Normalised at load time in `content/adapter.js`, NOT in
  `contents/` - that folder is pulled from each repo's `content` branch and any
  edit there is overwritten on the next pull. A digit run is only rewritten
  when it EQUALS that business's own phone, so a year, ZIP or model number can
  never be mangled and no number is ever invented.

Responsiveness needs a real layout engine, so it runs in the browser.
`scripts/responsive-sweep.js` is served by `serve-all.mjs` at **`/__sweep.js`
on every site port** (virtual route — deliberately never written into a site's
output). In the Browser pane, on the site's own port:

```js
import('/__sweep.js').then(m => m.run()).then(r => JSON.stringify(r))
```

It loads every page from that site's sitemap into a hidden same-origin iframe
at **320/390/768/1024/1440/1920px** and reports sideways overflow (naming the
offending elements by class), sub-44px tap targets, and sub-11.5px body text -
the last two measured at the NARROWEST width, where they are hardest to pass.
It is
**resumable on purpose** — the browser tool kills a script at 30s and the
biggest sites are ~400 iframe loads, so each call works a ~20s slice and
returns `done:false`; call it again until `done:true`.

Two things that make this fail if you improvise instead:
- **Background tabs throttle**, and so does a HIDDEN Browser pane. Parallel
  TABS time out; stay in one tab. If the pane goes hidden mid-run the sweep
  still progresses, just slower - drop the budget to ~8-15s per call so it
  returns inside the tool's 30s limit instead of timing out.
- **The sweep runs one iframe PER WIDTH, all six concurrently.** A single
  iframe stepping through width x url serially collapsed to ~9 pages per 6s
  call once the pane was hidden - about 18 calls for one 28-page site. Six
  lanes overlap that latency instead of paying it serially and measured ~6x
  faster (40 -> 160 checks in one 20s call). Each lane keeps a FIXED width for
  its whole life, so no iframe ever reflows between loads.
- **Tap-target height must come from `offsetHeight`, never
  `getBoundingClientRect()`.** The rect is the VISUAL box and inherits any
  ancestor transform; GSAP parks un-scrolled sections at `scale(0.97)`, which
  no iframe ever triggers out of. That turned a genuinely 45px button into a
  reported 43.51px and flagged 8 clean pages on Las Cruces as failures.
- **`scroll-behavior:smooth` is set globally**, so `scrollTo()` returns before
  the scroll lands and any `getBoundingClientRect()` immediately after reads a
  mid-scroll position. Use `{behavior:'instant'}` and wait two rAFs.

## Verifying a fix — measure, don't eyeball

Hard-won this session; skipping it produced several false results.

- **Measure in the DOM, not from a screenshot.** The Browser pane frequently
  fails to composite tall pages and returns blank or partially-painted frames.
  A "missing" image or section is usually a paint artifact — confirm with
  `getBoundingClientRect()` / `naturalWidth` before believing it.
- **GSAP skews measurements.** Reveals run `scale`/`x`/`opacity` tweens, so
  `getBoundingClientRect()` mid-tween reports the animating value (a hero
  measured 1109x475 against its settled 1180x506). Use `offsetWidth/offsetHeight`
  (layout values, transform-independent), or kill ScrollTrigger and clear inline
  styles first. Also: a transformed ancestor confines `position:sticky`.
- **Timers throttle when the tab isn't fronted**, so `setTimeout` waits for a
  CSS transition may never elapse — a hover state can read as "not applied"
  when the rule is correct.
- **Composite alpha before judging contrast.** `color(srgb … / 0.12)` parsed as
  opaque produced a false 1.53:1 that was really 3.18:1. And a passing ratio is
  not proof: a header pill measured 5.92:1 and was still unreadable, because
  saturated colour on near-black at 14px is hard to read whatever the number
  says. Check gradient far-ends too, not just the start stop.
- **Check the widest realistic viewport.** The pane's default is far narrower
  than the user's monitor; centering/overflow bugs hide at narrow widths.
- **`set -e` is IGNORED by the agent's Bash tool - never trust it to gate a
  chain.** Verified 2026-09-13: `set -e; false; echo x` still prints `x`. A
  chained edit -> rebuild -> QA script ran straight past a FAILED Python edit
  and printed "ALL STEPS PASSED" over a change that never happened. Gate every
  step explicitly (`cmd || { echo FAILED; exit 1; }`), and gate on a command's
  OUTPUT (e.g. `78p` in the cli.js `[1/1]` line) where its exit code has not
  been verified to mean anything. Also: under `pipefail`, a grep that
  correctly finds ZERO matches exits 1 - wrap it as `{ grep ... || true; }`.
- **Confirm your selector can actually win.** A rule added next to a related one
  can be silently overridden by the canonical rule later in the file (a
  `position:sticky` was dead on arrival this way). Verify the *computed* value.

## Generating (or regenerating) ONE site

```bash
cd engine
node src/cli.js --business <domain> --theme <themeId> --out <outDir>
```

- `<domain>` — the exact key from the registry (e.g. `dallasdoorpros.com`).
- `<themeId>` — pin the business's CURRENT theme from the registry (see
  above) unless you deliberately want it to re-roll onto a different theme.
  Omitting `--theme` lets it re-roll onto whatever the seed naturally maps
  to, which can change the theme entirely — usually not what you want for an
  already-live site.
- `<outDir>` — `dist` for the first table above, `dist/generated-sites/last-10-cities` for the second. Using the wrong one creates a stray duplicate folder.

Sub-variants (hero style, section layouts, fonts, etc.) are **not** pinned by
default and may re-roll to a different pick than what's currently live, even
with the same `--theme` — this is expected and, in this session's established
pattern, accepted rather than fought (the goal is usually "apply the fix,
whatever variant results"). If you need to force a SPECIFIC sub-variant
(e.g. to verify one exact hero style), pin it explicitly and generate into a
disposable scratch directory first, e.g.:

```bash
node src/cli.js --business <domain> --theme <themeId> \
  --variants '{"hero":"color-block-split"}' --out /tmp/scratch-verify
```

### The uniqueness gate — always check the printed score

Every generation run prints a line like:

```
[1/1] dallasdoorpros.com → editorial-broadsheet (u=57, 39p, qa=WARN)
```

`u=` is the uniqueness score against the other generated sites (persistent
registry-backed, threshold in `config/generation.config.js` →
`uniqueness.minScore`, currently **46**). If `u` comes back below 46, just
re-run the exact same command 2-5 times — the reroll is seeded by an
internal nonce that advances each run, so repeating the command tries new
variant rolls. In rare cases (a handful of businesses this session) a site
settles into a local optimum a few points under 46 even after 5-7 retries;
that's an accepted, previously-seen outcome — don't burn unlimited retries
chasing it.

### After regenerating any single business

Each single-business `--business` run **overwrites** `dist/index.html` with
only that one business's card. After any regeneration, rebuild both gallery
indexes from the registry:

```bash
node scripts/rebuild-gallery.mjs
```

## Local preview

`engine/scripts/serve.mjs [dir] [port]` — single-origin preview (root-
absolute links inside a generated site only resolve correctly when the site
owns its own origin; this server handles both a single-site dir directly at
`/` and a multi-site dir with referer-based routing as a fallback).

`engine/scripts/serve-all.mjs [basePort]` — the one built this session for
previewing ALL 20 live sites at once: an index/gallery at `basePort`
(default **8900**) with one card per site, and each site served on its own
dedicated port starting at `basePort+1` (8901-8920, alphabetical by domain).
Binds to all network interfaces, so it's also reachable from other devices
on the same WiFi via the host machine's LAN IP (e.g. `http://192.168.x.x:8900`)
— the index page detects whichever hostname was used to reach it and links
cards accordingly, so it works identically over `localhost` or the LAN IP.

```bash
cd engine
node scripts/serve-all.mjs 8900
```

## Section catalog — every variant of every axis, on real content

`engine/scripts/build-section-catalog.mjs` (built this session, per explicit
user request to see "all sections preview... section wise" before scaling to
250+ sites) renders EVERY real variant of EVERY axis (hero, serviceCard,
reviewCard, gallery, footer, ctaStyle, plus the 9 SECTION_POOLS layout axes,
ctaBanner, heroStats — 311 previews total at last count) using the actual
live engine components + actual generated CSS for one real business
(Chicopee — richest content: areas/services/guides/faq all present). Not a
hand-recreated mockup — it directly calls `C.hero(ctx)`/`C.services(ctx)`/etc.
after forcing each variant onto a shared `ctx`, so it can never silently
drift out of sync with `css.js`/`components/index.js` the way a separately
maintained demo page would.

Sample-only review text is injected into an in-memory CLONE of the business
object purely so the `reviewCard` axis has something to render (Chicopee has
no real reviews) — never written to the real dataset/registry/dist output,
never part of a real generated site. This is the one deliberate exception to
the no-fabrication rule below, scoped tightly to this internal dev tool.

Output is **one HTML page per axis** (`dist/_section-catalog/<axis>.html` +
an `index.html`), not one giant page — an earlier single-page version (~300
stacked previews, 100,000+px tall) pushed the Browser pane's compositor past
its limit and rendered solid black; per-axis pages are both more robust and
more usable for browsing.

```bash
cd engine
node scripts/build-section-catalog.mjs      # writes dist/_section-catalog/
node scripts/serve.mjs dist/_section-catalog 8950   # WRONG - serve.mjs looks
  # for a site SUBFOLDER inside the dir you pass it and picks the wrong one
  # here (there's no subfolder, just index.html + assets/) - use a plain
  # static server instead:
python3 -m http.server 8950 --directory dist/_section-catalog
```

Also registered as the `section-explorer` launch.json config (port 8600).

**`dist/_section-catalog/` lives inside `dist/`** and is NOT regenerated by
the normal site-generation CLI — a `rm -rf dist` (used throughout this
project to force a clean regenerate) wipes it too. Re-run
`build-section-catalog.mjs` after any full `dist` wipe if you need the
catalog again.

## No-fabrication — the one rule that overrides any other instruction

`config/generation.config.js` → `content.neverFabricate` lists fields the
engine must never invent: phone, email, address, reviews, rating,
reviewCount, yearsInBusiness, licenses, certifications, warranties,
guarantees, pricing, emergency247, sameDay, financing, brands, awards,
hours, serviceAreaList. `config/site-content.js` also has several **empty,
documented, inert-until-filled** schema slots for the same reason —
`certifications: []`, `warrantyDetail: null`, `responseTime: null`,
`companyStory: []` — these exist so a section activates automatically the
moment REAL per-business data is added, without ever needing invented
placeholder content in the meantime. If a future request asks to "just use
fake data" for any of these categories, the correct response is the same one
already given once this session: decline for the specifically-guarded
categories (these sites are meant to go live on real purchased domains;
fabricated certifications/warranty-terms/response-time are a real
false-advertising risk, not just a style question), wire the schema so it's
ready the moment real data arrives, and say so plainly rather than silently
complying or silently refusing.

## GSAP section animations - CDN libraries + INLINED presets (2026-08-31)

**This reverses the engine's "no external dependency" rule, deliberately and on
instruction.** Do not "restore" local vendoring - it is what broke.

`layout.js` emits exactly three script tags:

1. `<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" onerror="...">`
2. the same for `ScrollTrigger.min.js`
3. `<script>document.addEventListener('DOMContentLoaded',function(){ …section-animations.js verbatim… });</script>`

**Why.** Cloudflare returns **403 for every `.js` served from the sites' own
origin** - verified same-origin on five live sites across all four batches
(Dallas, Chicago, Miami, Petaluma, Reno): no `etag`, no `cf-cache-status`, so
Cloudflare answered it, not R2. HTML/PNG/XML/TXT on the same origin return 200,
and INLINE `<script>` still executes (the nav toggle works). So the block is
specifically on serving `.js` files. A CDN URL never touches that origin.

`section-animations.js` is ours, so no CDN hosts it - hence inlining. It costs
~16 KB/page and loses cross-page caching. Revert to `<script src>` the day the
Cloudflare rule is fixed.

**The `DOMContentLoaded` wrapper is load-bearing.** `defer` is IGNORED on inline
scripts, so a bare inline block runs DURING parsing - before the deferred CDN
libraries - and the file's own `if (!window.gsap || !window.ScrollTrigger)
return;` guard bails silently. Deferred scripts are guaranteed to finish before
`DOMContentLoaded`.

**Nothing is written to a site's `assets/vendor/` any more.** `site.js` used to
copy all three files (136 KB/site); that became unreachable dead weight and the
copy was removed 2026-08-31. `src/assets/vendor/section-animations.js` still
exists and is REQUIRED - `layout.js` reads it at build time to inline it. It is
just never copied out. **It must never contain a literal `</script>`**; the
inliner refuses to run if it does.

**`gsap-failed` is diagnostic only, and no CSS consumes it - correctly.** Every
reveal is a GSAP `.from()`, so elements are hidden only once GSAP is actually
running. If the CDN never loads, nothing hides anything and the page renders as
plain static content. **Never pre-hide sections in CSS to "prepare" for the
animation** - that turns a CDN outage into a blank page.

`section-animations.js` gives each section TYPE a different entrance
treatment (stagger/pop/count-up/alternating-slide/etc.) by matching known
CSS selectors, with a **generic per-`<section>` fade-up fallback for anything
not explicitly matched** - the engine has ~18 section types x up to 20
structural variants each, too many exact inner-markup class names to
enumerate by hand with full coverage (confirmed: missed the services
"zigzag" `.svc-zzwrap` variant on the first pass), so the fallback is the
real coverage guarantee, not the specific presets.

Two real bugs found and fixed while building this - both worth knowing before
touching this file again:
- **Always pass `clearProps: 'all'`** on every animated target. Several
  section elements (`.svc`, `.rev`, `.post-card`, ...) have their own CSS
  `:hover` transition on `transform`. Without clearing GSAP's inline style
  once a reveal tween finishes, the leftover inline `transform`/`opacity`
  permanently fights the element's normal CSS hover state - measured: the
  element gets stuck exactly at its animation START values forever (e.g.
  `scale(0.92)`), completely unrelated to whatever hover interaction should
  happen next. Confirmed fixed: `element.style.cssText` reads back to `''`
  once the reveal completes.
- **Number count-up must extract the digit run IN PLACE, not by stripping
  digits and searching for them back in the original string.** Stat values
  routinely have thousands-separator commas ("20,915" - population counts are
  the most common case). Stripping commas first and then doing
  `raw.indexOf(strippedDigits)` can't find "20915" inside "20,915" (the
  comma breaks the substring match), which silently corrupted the animated
  text into garbage like `"20,9120,91515"`. Fixed by matching `/[\d,]*[0-9]/`
  directly against the original string and slicing prefix/suffix from the
  match's own index/length - never reconstruct-then-search.

## Batch 3: the remaining 33 - all 45 re-pulled sites now built (2026-09-13)

User: *"generate all the remaining sites"* - rows 13-45 of the Shahin /
Update-Date 9/13/2026 list, taken straight from the sheet (`slice(12)`) rather
than typed: Longmont, Manhattan Beach, Northbrook, Auburn, Murfreesboro,
McKinney, Burbank, Loveland, Humble, Brownsville, Hesperia, Livonia, Hugo,
Cheyenne, Orem, Lodi, Jacksonville, Morton Grove, Arvada, Idaho Falls, Las
Cruces, Madison, Hanford, Martinsburg, Marysville, Matthews, Lincolnwood,
Mundelein, Chaska, Kansas City KS, Duncanville, Daphne, Brighton. Built with
`repin.mjs --allow-frozen` (designs pinned), into `dist/`. **Not committed,
not pushed.**

- 33/33 built at built-in QA WARN (0 FAIL). 51-106 pages each.
- 33/33 spec checks PASS (same checks as batches 1-2, plus "no split trust
  label"). The 7-service sites (Northbrook, Burbank, Humble, Hesperia, Hugo,
  Las Cruces, Hanford, Martinsburg, Matthews) correctly publish 7.
- **All 45 together: 3,530 pages, 0 dead links, 0 broken images, 0 missing
  alt; SEO files clean on all 45.**

**Check wording narrowed in this batch - do not over-read the PASS:** the
"no request a quote" check now ignores text inside `<p>` (authored prose),
per the Newark decision that the Schedule rename covers labels/titles/meta
only. A content sentence using the phrase would NOT be flagged.

**Checks the responsive sweep cannot see, done on the 33:**
- Hero clipping at 320px on all **23** of the 33 whose hero keeps the default
  4/3 media (the class that clipped before the base `max-width:100%` fix):
  **0px clipped on every one**, 0 overflow. Matthews and Brighton read -54 /
  -58 - their media is NARROWER than the track (a centred smaller image), which
  is not clipping. The fix holds on every new hero layout.
- `editorial-row` cards (Longmont, Arvada - the first built sites on that skin)
  measured **284x122 and 267x114**: the same 21/9 thin-strip crop, on ordinary
  vertical cards. Changed to 16/10 and both rebuilt (see the card-ratio section).
  `text-list` (also 21/9) is used by none of the 45 and was left alone.
- `quiet-editorial` coverage (latent empty-column layout): only Manhattan Beach
  among the 33, with 6 suburbs - 0 empty columns.

Responsive sweep of the 33: **complete, 15,486 page x viewport checks, 0
overflow / 0 small taps / 0 small text on every site.** Longmont and Arvada
were swept AFTER the editorial-row rebuild and re-measured at 1440: cards now
284x177 and 267x167 (16:10). Sweep gotcha: `run()` progress lives in the page,
so navigating away mid-site restarts that site - finish one site (repeat run()
until done) before navigating.

## Trust items are ONE label (2026-09-13)

User (Irving screenshot): *"Diagnosis first, then the fix - dont be inline and
make sure height are same"*. The item was `<b>Diagnosis first</b>, then the
fix`. `.trust-item` is a flex row with a gap, so that became THREE flex pieces
(icon, `<b>`, bare text node): the 9.6px gap opened a visible break before the
comma, and the unbolded half was coloured differently from every other item.
Heights were already equal; the split was the visible defect.

Fix in `trustbar()` (`components/index.js`): every item's whole phrase sits in
a single `<b>` - "Diagnosis first, then the fix", and the four other mixed
items that only render with real data ("N+ years in business", "N-year
warranty", "Licensed & insured (licence)", "rating (N reviews)"). **Rule: a
trust item is always icon + ONE element; never leave a bare text node beside
the `<b>`.**

Rebuilt all 12 built sites (designs pinned): 0 split labels anywhere; QA clean.
Measured in the browser across four trustbar layouts - every item exactly 2
pieces, heights equal, 0 overflow: Irving `inline` 37px at 1440 and 390,
Dallas `pills` 48px, Chicago `boxed-grid-table` 56px, Newark `minimal-text-row`
20px (all at 390).

## Two image-sizing fixes found on the new builds (2026-09-13)

### Hero photo clipped on phones - base `.hero__media` now `max-width:100%`

Irving's responsive sweep flagged +3px at 320px. Measured with GSAP stopped:
the base `.hero__media` rule sets BOTH `aspect-ratio:4/3` and
`min-height:clamp(260px,...)`. On a narrow column the min-height FORCES the
width to 260 x 4/3 = **346.67px** - wider than a ~264px grid track - and the
hero section's `overflow:hidden` CLIPS it rather than scrolling. So the photo
lost ~80px on the right while `scrollWidth` barely moved: **the responsive
sweep cannot see this bug class** (it measures scroll overflow; this is
clipping). Measure `hero__media.offsetWidth` vs its parent track instead.

Affects every hero variant that keeps the default 4/3 media (12 of 17 image
heroes; split-image-right/left, left-banner-cta, color-block-split and
duotone-media override it). Measured before the fix at 320px: Chicago 79px,
Dana Point 75, Newark 79, Denver 83, Fort Lauderdale 17, Irving 83 clipped.
Fix: `max-width:100%` on the base rule - inert wherever the column is already
wide enough; height still honours the min and `object-fit:cover` fills it.
After rebuilding those 6: **0px clipped and 0 overflow on all six**
(media width == track width).

### Service-card photos cropped to a strip - 21/9 card media -> 16/10

User screenshot (Albuquerque): card photos rendered as a thin band with heads
and doors cut off. Cause: `.svc--minimal-quiet .svc__media{aspect-ratio:21/9}`
- on a 272px card that is a 272x117 box, and `object-fit:cover` crops the
16:9 service photos to it. Changed to **16/10** (the base card media ratio).
Measured after: **272x170**, whole subject visible. Skin also used by Humble,
Pittsburgh, Matthews.

Same 21/9 on three sibling card skins: `list-dense` (Denver - measured 216x92
on a 256px card, same defect, fixed to 16/10 too), `editorial-row` and
`text-list`. The last two are used by no built site, so they could not be
measured and were NOT changed; check them the first time a site on them is
built. `.bento-cell--lg .svc__media` is 21/9 on a deliberately wide bento cell
and is fine. Denver after the `list-dense` fix: **216x135**, 0 overflow.

### Irving footer: `dark-split` brand column forced wider than a phone

After the hero fix, Irving's sweep still flagged +3px at 320px on every page,
samples `[div, a.brand, p]` - the FOOTER brand block, not the header (a header
check found nothing). `.footer--dark-split .footer-grid>div:first-child` sets
`min-width:280px`; on a 320px phone the footer container is 264px. The phone
rule made that column `flex:1 1 100%` but never reset the min-width - the rule
for the OTHER columns did (`min-width:0`), the first column was just missed.
Added `min-width:0` to the phone rule. Irving re-sweep: **432/432, 0 overflow.**

Sibling check (same bug class = a footer column min-width not reset on
phones): `quiet-editorial` (240px) resets it. `split-duotone` does NOT reset
its 230px - but 230px fits inside the 264px container at 320px, so it is not a
live defect (Albuquerque, the only built site on it, swept clean). Only a
min-width WIDER than the narrowest container is a bug; compare against 264px.

## Batch 2: the next 10 built on the new structure (2026-09-13)

User: *"now generate the next 10"* - rows 3-12 of the 45-site re-pull list:
Newark OH, Denver, Irving, Albuquerque, Colorado Springs, Miami, Kansas City
MO, Garland, Fort Lauderdale, Dana Point. Built with
`repin.mjs --allow-frozen` (every design axis pinned), into `dist/`. **Not
committed, not pushed.** `all-sites` now serves 12 sites, ports ALPHABETICAL
by domain (albuquerque 8901 ... newark 8912) - they shifted again when these
were added.

| site | pages | services | suburbs |
|---|---|---|---|
| Newark | 90 | 8 | 7 |
| Denver | 65 | 8 | 4 |
| Irving | 72 | 8 | 5 |
| Albuquerque | 62 | 8 | 4 |
| Colorado Springs | 98 | 8 | 8 |
| Miami | 105 | 8 | 8 |
| Kansas City MO | 81 | 8 | 6 |
| Garland | 62 | 8 | 4 |
| Fort Lauderdale | 83 | 8 | 6 |
| Dana Point | 62 | 8 | 4 |

Per-site spec checks all PASS (hub, `/service-areas/`, `/book/`, no
`/request-a-quote/`, services == 02, suburbs == 07, full service set per
suburb, H1, areaServed, every visible count matches the two lists, no "check
your area"). Static QA: 0 broken images, 0 dead links (after the fix below);
SEO files clean on all 12. Responsive sweep 0 issues: Albuquerque 372,
Colorado Springs 588, Dana Point 372, Fort Lauderdale 498, Garland 372, Denver
390, Kansas City 486, Miami 630, Newark 540 (Irving: see the hero fix below).

### Dead authored links are now unwrapped - `rewriteAuthoredLinks()`

Newark's build tripped the built-in QA (`qa=FAIL`, `links.noDead`): its
granville-south installation page's authored prose linked to
`/granville-south-garage-south-repair/` - a garbled URL matching no page. The
rewriter only rewrote RECOGNISED links and passed unknown ones through, so it
shipped as a 404. Now an authored markdown link whose target is not a page this
site publishes is **unwrapped to its plain label** - the words stay, no
destination is invented - and authored links to the retired
`/request-a-quote/` map to `/book/`. Only authored markdown links are touched,
so QA's dead-link check still catches real engine bugs.

The allow-list is built BEFORE pages exist, so it was checked for the opposite
failure (unwrapping a WORKING link): rendered all 12 sites in memory, 215
authored internal links, **0 wrongly unwrapped**. A first pass reported 3 -
all false alarms: their source pages were neighborhood pages that pruning never
publishes, so the label was on no page at all. When auditing link rewrites,
compare against RENDERED HTML of published pages, not against raw content.

**Authored prose is left alone:** Newark's quote page body says "say so when
you request a quote" (lowercase, mid-sentence). The Schedule rename rewrites
the phrase only in that page's title/H1/meta; forcing it into body prose reads
badly. Flagged, not edited.

## Coverage list `divider-line-row`: multi-column -> grid (2026-09-13)

User (screenshot of Dallas): *"this service area variant has too much blank
space update this variant"*. Measured at 1440px: the list used CSS
`columns:3`, which balances items VERTICALLY, so Dallas's 4 suburbs flowed
2+2+(empty) and left **409px blank** on the right of a 1200px container.

Fixed in the variant (`css.js`, `.cov-generic--divider-line-row .cov-list`):
`display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr))`, and
the two responsive rules that set `columns:2` / `columns:1` now set the grid
equivalents (without that, below 901px the list would be a block and ignore
them). Remeasured on the rebuild: **1440px -> 4 cards x 286px in one row, 0px
empty**; **390px -> 1 column, 334px cards, 0 overflow**; responsive sweep
378/378 clean. Sites on this variant: Dallas (built), Colorado Springs,
Longmont, Pittsburgh, Payson (get it when built).

**Why this bug class matters more now:** suburbs are pruned to the 3-8 that
carry service pages, so short coverage lists are the norm, and any
`columns:N` list leaves whole empty columns. Balancing arithmetic - columns
used = ceil(n / ceil(n/c)): with `columns:3`, 1 suburb leaves 2 empty, 2 or 4
suburbs leave 1 empty. **Latent, not fixed:** `quiet-editorial` is still
`columns:3` - no site on it has 1/2/4 suburbs today (Manhattan Beach 6, Newark
7), but a future one would show the same gap. `underline-accent-list`
(`columns:2`, only 1 suburb would gap) is unused; `split-duotone` is 1 column.

**Trap hit while fixing it:** `css.js` is a JS module whose CSS lives in a
backtick template string. A CSS comment containing backticks (e.g. quoting
`columns:3`) closes the string and breaks the whole engine
(`Unexpected identifier`). Never put backticks inside css.js CSS text; always
module-load-check css.js after editing it.

## Displayed counts come from the two content lists (2026-09-13)

User: *"check services and stats why its show 4 services in stats as i have 8
services in chicago ... dont mismatch any info for others sites"* and *"services
list (all the services in service-lines folder), suburbs list (all the area
name which has suburb-services) - count based on these"*.

**Bug:** five displayed counts read `business.services.length` - the engine's
4-item DEFAULT catalog (`CORE_SERVICE_IDS`, set in `data/normalize.js`) -
instead of the site's real services. Chicago publishes 8 and showed "4 Garage
door services" on 83 pages. The five spots in `components/index.js`: the hero
chip ("N services"), the text-only hero stat strip, the `stats()` band, a second
stats layout, and a fallback stat.

**Fix:** two helpers at the top of `components/index.js`, and every displayed
count goes through them:
- `serviceCount(ctx)` = `content.services.length` - exactly the
  `02-service-lines` set. Falls back to the default catalog ONLY for a site with
  no service content at all.
- `areaCount(ctx)` = `content.areas.length` - exactly the suburbs that have
  `07-suburb-services` content (after pruning). Area counts already read this.

**Never render a count from `business.services` again** - it is a placeholder
catalog for content-less sites, not the site's services.

Verified on the Dallas + Chicago rebuild with the original baseline scanner
(the one that found the bug, matching `<b>N</b><span>`, `stat__n`/`stat__l`
cells and visible "N services/areas" text): Chicago "8 Garage door services" and
"8 Neighborhoods & suburbs" on 83 pages, "8 areas" on 95, "8 services" chip -
all equal the truth (8/8). Dallas "4 areas" on 52 pages and "8 services" chip
match (8/4). **Verification trap hit:** a first check keyed on class names this
stats layout does not use matched only the hero chip and passed - a scan that
finds nothing is not a pass. Always confirm the scanner actually hits the
elements the bug was reported on.

**Authored prose is NOT engine counts** and is not rewritten: Chicago's
garage-door-repair page says "across the 86 neighborhoods we work in" - the
content team's own sentence in `02-service-lines`, and it does not match the 8
published suburbs. Dallas has the same shape: "the 17 areas we run trucks
to" / "the bulk of the 17 areas" (Dallas publishes 4 suburbs), in
`05-trust/dallas-trust-request-a-quote.json` (renders on `/book/`) and
`03-guides/dallas-top-doors-on-houses-built-before-insulation-rules.json`.
Flag such lines to the user for the content team; do not silently edit
authored copy.

## Parsippany REMOVED - it was a test site, not an assignment (2026-09-13)

User: *"remove the Parsippany Garage Door Pros as its not mine i used this for
test and update engine, now i got my assigned sites contents so remove this"*.

`parsippanygaragedoorpros.com` was used ONLY as the test bed while the engine
was restructured (content adapter, suburb-service pages, the canonical and v2
route schemes). It is **not one of the user's sites**. Removed:
`dist/parsippanygaragedoorpros.com-parsippany/` (66 MB, no `.git`),
`contents/parsippany-nj/`, its `design-registry.json` entry (81 -> 80; backed
up first to the session scratchpad), its gallery card (via
`rebuild-gallery.mjs`), and the `parsippany-preview` launch config. Nothing on
GitHub was touched.

Deliberately KEPT: its row in `config/business-contacts.js` (generated from
the sheet for all 1000 businesses - not test data), and every mention of
Parsippany in this file and in engine source comments. Those record WHY the
engine works the way it does (the `-svc-`/`p-` naming, the `custom_id` split,
the neighborhood/suburb slug clash); they are history, not a live site. **Do
not rebuild Parsippany or treat it as an assignment.** Dallas and Chicago are
the reference builds on the current engine.

## Coverage-section CTA button removed (2026-09-13)

User: *"check your area button maybe not needed, update this sites"*. The
"Check your area" button (linking to `/book/`) was hard-coded into 5 of the
`areas()` coverage layouts in `components/index.js` - the `compact` and `cards`
heads, the 13 generic skins' shared `.cov-generic__head`, the `directory`
gradient `.cov-panel`, and the default map layout's `.coverage__body` - plus the
no-suburbs fallback block in `buildAreaPages` (`pages.js`). All removed; the
now-unused `primaryCta` lookup in `areas()` went with them. Leftover
button-only CSS (`.coverage__cta`, `.cov-panel .btn`,
`.cov-generic--quiet-editorial .cov-generic__head .btn`, the outline-only
`.btn--solid` override) is inert and was left in place.

Rebuilt Dallas / Chicago / Parsippany with designs pinned; "check your area"
(any case, anywhere) = **0** on all three; static + SEO QA clean; responsive
sweep Chicago 636/636, Dallas 378/378, Parsippany 474/474, all 0.

**No hollow header.** In every coverage head the count + sentence sit in a
wrapping flex row and the `<p>` is `flex:1 1 220px`, so it absorbs the freed
width. Measured at 1440px: row width == count + gap + sentence to within a
pixel on all three (Chicago 1240 = 32+25.6+1182, Dallas 1200 = 39+25.6+1135,
Parsippany 1160 = 36+38.4+1086). **Measurement trap hit while checking this:**
grouping flex children into "rows" by `offsetTop` is wrong when the row is
`align-items:center` - differently-sized children get different tops and look
like separate rows, which reported a false 1,100px void. Sum the child widths
+ `column-gap` against `clientWidth` minus padding instead.

## ROUTES v2 - the full sitemap spec (2026-09-13) - CURRENT, read this first

The user supplied a complete per-metro sitemap and the engine was updated to
it. **Authoritative for routes; where the 2026-09-10 section below disagrees,
this one wins.**

```
/                               home - H1 ALWAYS "<City> Garage Door Repair";
                                       LocalBusiness areaServed = city + every suburb
/<city>/                        city hub - links every service AND every suburb
/<city>/<service>/              service pillars (= 02-service-lines, nothing else)
/<city>/<suburb>/               suburbs (= suburbs present in 07-suburb-services)
/<city>/<suburb>/<service>/     that suburb's services (only services the city has)
/service-areas/                 areas index - all suburbs + export's -hub-service-areas copy
/book/                          booking form (was /request-a-quote/)
/blog/<slug>/                   guides
/about/ /contact/ /faq/ /garage-doors/ /privacy/ /terms/ /accessibility/
/financing/ /maintenance-plans/ ONLY when an export ships real content for them
```

User decisions (asked and answered 2026-09-13):
- **Home H1 fixed** to "<City> Garage Door Repair"; the authored headline
  becomes the hero subheading (`hero()`), not lost.
- **`/book/` + "Schedule"** replaces `/request-a-quote/` + "Request a Quote"
  engine-wide: primary CTA, announcement bar, footer, card links, contact-page
  line, form iframe title, `llms.txt`, and the 3 scripts that patch/serve the
  form page (`apply-quote-form.mjs`, `apply-quote-iframe-eager.mjs`,
  `serve-all.mjs`). The export's quote page still titles itself "Request a
  Quote"; `buildQuote` rewrites that phrase ONLY, to "Schedule a Visit", in its
  title/H1/meta. Verified: "request a quote" (any case, including inlined CSS
  comments) appears **0 times** across all built pages. A case-SENSITIVE check
  missed 5 of these the first time - always check case-insensitively.
- **Keep every page that has real content** even when the spec omits it:
  `garage-door-service` (on all 45 re-pulled sites), `/faq/`, `/garage-doors/`,
  the legal pages. The spec is a minimum, not a whitelist.
- **`/financing/`, `/maintenance-plans/` build ONLY from real content**
  (`-trust-financing` / `-trust-maintenance-plans`, in `adapter.js`
  TRUST_SUFFIXES). None of the 81 exports ships either; financing terms are on
  `neverFabricate`.

Engine changes:
- **`new-door-installation`** is the published installation slug
  (`SERVICE_URL_SLUG`, `config/services.js`) - the slug all 45 exports use on
  suburb pages, so pillar and suburb pages always pair.
- **`/service-areas/` restored** as its own page. `buildAreaPages` returns
  `{ cityHub, index, pages }`; hub at `ctx.urls.cityHub`, areas index at
  `ctx.urls.areas`. `urls.areaBase` stays the hub (suburbs live under it).
  Dropped-suburb authored links now land on `/service-areas/`.
- **User rule "only services in service-lines, only suburbs with
  suburb-services, drop the rest".** Suburbs were already pruned. Added in
  `attachSuburbServices`: a suburb-service publishes ONLY if its service is one
  of the city's own 02 services (canonical URL segment). Measured on all 45
  re-pulled exports: **0 pages dropped today** - a safeguard.
- **Garbled `custom_id` fallback** (`splitSuburbService`, `adapter.js`): a
  content-hash service slug falls back to `page.url`. Real case: Manhattan
  Beach's 4 files (`...|palos-verdes-estates|c357e552`, and `2439827d`,
  `631aeea8`, `d51d99f4` on view-park-windsor-hills) would otherwise publish
  `/<city>/<suburb>/c357e552/`.

Verified on Dallas / Chicago / Parsippany (designs pinned via `repin.mjs`),
every check PASS on all three: hub + `/service-areas/` + `/book/` present;
`/request-a-quote/`, `/financing/`, `/maintenance-plans/` absent; services ==
02 files; suburbs == 07 suburbs; every suburb has the full city service set;
`new-door-installation`; H1 exact; areaServed = city + N suburbs. Static QA 0
dead links / 0 broken images; SEO files clean; responsive sweep Chicago
636/636, Dallas 378/378, Parsippany 474/474, all 0. Pages: **Dallas 63,
Chicago 106, Parsippany 79** (+1 each: `/service-areas/`). **Not committed,
not pushed.**

## THE CANONICAL URL SCHEME (2026-09-10) - supersedes "content URLs win"

**This is the current, authoritative URL policy.** The 2026-09-09 section
below it is kept only as history; where the two disagree, this one is right.

The user supplied the scheme that had been missing from their original
request:

```
1. Service pillar   /<city>/<service>/            /las-vegas/garage-door-repair/
2. Suburb           /<city>/<suburb>/             /las-vegas/henderson/
3. Suburb service   /<city>/<suburb>/<service>/   /las-vegas/henderson/opener-repair/
4. Blog / guide     /blog/<guide-slug>/           /blog/broken-spring-signs/
   city hub         /<city>/                      (chosen 2026-09-10)
```

Everything else - `/`, `/about/`, `/contact/`, `/faq/`,
`/request-a-quote/`, `/garage-doors/`, `/privacy/`, `/terms/`,
`/accessibility/` - stays at the site root.

**The engine GENERATES these paths. `page.url` in the content is now
informational only and is never routed on.** `src/content/index.js` is still
the one place a URL is decided; only the rule changed.

### Why "content URLs win everywhere" lasted exactly one day

It was the right call for the data as understood on 09-09 and wrong once the
spec arrived. The deciding technical fact: **`page.url` is not internally
consistent within a single export.** Parsippany calls the same service
`garage-door-installation` on its city page and `new-door-installation` on its
suburb pages, so a pillar and its matching suburb page could never have shared
a slug. Generating both from one `serviceUrlSlug()` guarantees they pair up -
all 8 pillars now have all 8 matching children under each of the 5 suburbs.

### `serviceUrlSlug()` - the one service segment

`config/services.js`. Maps any export's service naming onto ONE short URL
segment, using the spec's own style (`opener-repair`, not the catalog's
internal `garage-door-opener-repair`). `SERVICE_ALIASES` +
`resolveServiceId()` normalize the id; `SERVICE_URL_SLUG` shortens it. Never
build this segment from an export filename.

### `/services/` and `/service-areas/` NO LONGER EXIST

`/<city>/` is one hub that is the parent of both trees, so it absorbed both
indexes: it renders the services grid, then the coverage directory, then the
export's `-hub-service-areas` prose. `buildServicesIndex()` was DELETED (not
left unused). `ctx.urls.services` and `ctx.urls.areas` both point at the hub -
the two nav megamenus share a destination and differ only in their item lists.
`ctx.urls.cityHub` is the explicit name. Guides moved `/resources/` -> `/blog/`.

### `/<city>/<slug>/` is ONE namespace - `dedupeAreas()`

Suburbs, neighborhoods and service pillars all live at that depth, so a slug
can only be spent once. Two real collisions, both handled in `dedupeAreas()`:

1. **A place published as BOTH a suburb and a neighborhood.** Parsippany ships
   9 (whippany, towaco, oak-ridge, pine-brook, pompton-plains, lake-hiawatha,
   lake-telemark, newfoundland, white-meadow-lake) - near-duplicate copy for
   the same town, written once as "a Parsippany neighborhood" and once as
   "<Town>, NJ homes". **The SUBURB wins**: it is the type that carries the
   nested service pages (Whippany has eight), so hanging those under the
   discarded copy would orphan them. 166 area pages -> 157.
2. **An area slug equal to a service slug.** Not seen in real data; the
   pillar wins.

Dropped entries come back on `content.droppedAreas` so a run can REPORT them.
Losing a page silently is how a content gap goes unnoticed for weeks.

### Authored prose links had to be rewritten - `rewriteAuthoredLinks()`

Content bodies contain inline markdown links to the export's own URLs
(`[a new door](/garage-doors-hanover/)`). Once the engine publishes elsewhere,
every one 404s - measured on Parsippany: **8 dead internal links, a site-wide
QA FAIL**. Rewritten once on the loaded bundle in `content/index.js`, for the
same reason `normalizePhoneStrings()` lives in the adapter: `contents/` is
re-pulled from each repo's content branch, so an edit there is lost on the
next pull. A page dropped by `dedupeAreas()` maps to the page that won its
slug - same town, so the link still lands on correct content. Only exact
whole-path matches are touched; anything unrecognized is left alone.

**Any future change to the URL scheme must update this rewriter too**, or
authored cross-links silently rot.

### Only suburbs WITH nested services are published - `pruneChildlessAreas()`

User instruction, 2026-09-10: *"use only these suburb which has contents
inside suburb services folder"*. Parsippany's export lists 166 areas but
authored nested services for exactly five (denville, east-hanover, hanover,
livingston, whippany); the other 161 were thin, near-identical pages with
nothing beneath them. Five also matches the URL spec's own target
("approximately 4-8 suburb/service-area pages").

**GATED on the export actually shipping a `07-suburb-services/` folder.** All
79 pre-existing content folders in `contents/` predate that folder, and
pruning on "no children" there would delete those sites' entire service-areas
tree. No suburb-service content -> no pruning, legacy behaviour unchanged.

Removed areas are returned on `content.droppedAreas` and warned at build time
with the kept list, so a shrinking site is always visible in the run output
rather than a silent surprise. `rewriteAuthoredLinks()` sends any authored
prose link that pointed at an unpublished suburb to the CITY HUB (the coverage
page that replaced it) - a de-duplicated place still goes to whichever page
won its slug.

### Parsippany on the canonical scheme

**78 pages**, both QA sweeps clean (0 dead links across 6,443 links, 0 broken
images, 0 sitemap/llms issues):

| | count | |
|---|---|---|
| home + city hub | 2 | `/`, `/parsippany/` |
| service pillars | 8 | `/parsippany/<service>/` |
| suburbs | 5 | `/parsippany/<suburb>/` |
| suburb services | 40 | 5 x 8, no gaps |
| guides + index | 15 | `/blog/...` |
| trust / legal / products | 8 | root |

Now lives in **`dist/parsippanygaragedoorpros.com-parsippany/`** - see "dist/
was cleared" below. Served by the `parsippany-preview` launch config on port
8977. `engine/preview/` was a temporary second copy and has been deleted.
**Not committed, not pushed** - see the commit note below.

## CONTENT URLS ARE AUTHORITATIVE + nested suburb-service pages (2026-09-09) - HISTORY ONLY

**Superseded by the section above.** Kept for the reasoning and for the four
trailing-slash normalization sites, which are all still live and still
required. Ignore its URL-policy claims.


The biggest structural change since the engine was written. Read this before
touching `content/adapter.js`, `content/index.js`, or any renderer that builds
a link.

### 1. The engine no longer invents URLs

Every content file has always carried a `page` block:

```json
"page": { "url": "/garage-doors-denville/", "custom_id": "parsippany|sub|denville",
          "type": "suburb", "template": "suburb", "priority": 3, "links": [...] }
```

The engine ignored `page.url` and derived its own paths, so the URLs the
content team authored and the URLs the sites published had NEVER matched. User
decision, 2026-09-09: **"content URLs win everywhere"**. `page.url` is now
authoritative for every page type.

This matters because the URL SHAPE is per-export, not global - three real
exports, same pipeline (`"arm": "gdr1000"`), three different schemes:

| type | engine (old) | Parsippany | Abilene | Dallas |
|---|---|---|---|---|
| service | `/services/<id>/` | `/garage-door-repair-parsippany-nj` | `/garage-door-repair-abilene-tx` | same shape |
| suburb | `/service-areas/<slug>/` | `/garage-doors-denville/` | `/near/clyde/` | `/areas/<slug>/` |
| neighborhood | `/service-areas/<slug>/` | `/whippany-door-repair/` | `/local/lytle-area/` | `/areas/<slug>/` |
| topic | `/resources/<slug>/` | `/<slug>/` | `/<slug>/` | `/<slug>/` |
| subsvc | (did not exist) | `/garage-doors-denville/garage-door-repair/` | `/near/clyde/garage-door-repair/` | - |

**`src/content/index.js` is the ONLY place a URL is decided.** It puts a
resolved `href` on every service / area / topic / suburb-service entry, and all
~14 renderers (nav, footer, sidebar, area grids/chips/cards, service cards,
`pages.js` pathnames, `seo/llms.js`) read that. Never rebuild a path from a
slug again - that is exactly how a link and its page drift apart. The
`urls.serviceBase`/`areaBase`/`resourceBase` values survive only as the
fallback for entries that never came from content (the `business.services`
catalog list), via the `svcHref`/`areaHref`/`topicHref` helpers at the top of
`components/index.js`.

**REGENERATING ANY ALREADY-BUILT SITE NOW MOVES ITS URLS.** Measured
2026-09-09 against the on-disk builds: Dallas 41 of 53 paths change, Miami 94
of 106, Raleigh 23 of 35, Abilene 30 of 42. Toms River goes 75 -> 90 pages
because its 15 documented slug collisions (all landing on
`/service-areas/allenwood/`) resolve to distinct content URLs and stop
colliding. All 73 are frozen and none were regenerated - but the day one is,
that is an SEO migration, not a content update. Say so BEFORE regenerating and
raise redirects; the engine emits none today.

### 2. The trailing slash is normalized, and here is why

`config.content.trailingSlashUrls` (default **true**). Content URLs are
inconsistent: both exports publish their nine service pages with NO trailing
slash and everything else with one. Both forms write the same
`<path>/index.html`, so the only question is whether the HOST resolves an
extensionless path to that directory's index.

Sites deploy to Cloudflare R2 (`.github/workflows/deploy.yml` on a site's
`production` branch uploads the repo root). Every URL known to serve there
ends in `/`. Whether `/foo` also resolves **could not be verified** - every
origin sits behind a Cloudflare bot challenge that neither curl nor the
Browser pane passes. So the flag normalizes to the shape that is known to
work, keeping the content's own path segments. Flip it to `false` only after
someone loads an extensionless URL on a live site in a real browser.

`scripts/serve.mjs` now resolves extensionless paths to `<path>/index.html`
too, so local preview matches either way.

### 3. Trailing-slash normalization had to be added in FOUR places

A slash-less URL broke three separate comparisons that all assumed every path
ends in `/`. Each one reported a false catastrophe:

- `site.js` `record()` - dedupe key, or `/x` and `/x/` become two pages.
- `qa/validate-site.js` `links.noDead` - it normalized the LINK but not the
  page list, and reported all 9 service pages as dead links (site-wide FAIL).
- `scripts/qa-seo-files.mjs` - reported the same 9 pages as simultaneously
  "in sitemap but not built" AND "built but not in sitemap".
- `seo/llms.js` - dropped every service from the file.

Any NEW code comparing a link against the built-page set must strip the
trailing slash on BOTH sides.

### 4. Two new filename conventions in `02-service-lines/`

Only 3 of 9 service pages still carry the `-svc-` marker. The other 6 are
`p-<city>-<state>-<service>.json` with no marker at all - under the old
marker-only detection the engine rendered 3 of 9 services and **dropped the
rest silently, with no error**. `classify()` in `adapter.js` now keys off
`page.type` FIRST and falls back to the filename markers, so an export without
a `page` block still loads exactly as before.

### 5. Suburb-service pages (`07-suburb-services/`)

Filename `<city>-<state>-ss-<suburb>-<service>.json`. The suburb and service
**cannot be split out of the filename** (`ss-east-hanover-garage-door-repair`
has no findable boundary) - use `page.custom_id`, which is pipe-separated
(`parsippany-nj|ss|east-hanover|garage-door-repair`), falling back to the URL's
last two segments.

Parent matching is by **URL PREFIX, not slug**. Parsippany ships BOTH a
neighborhood and a suburb page for ten of the same names (whippany, towaco,
oak-ridge, pine-brook, ...) at `/whippany-door-repair/` and
`/garage-doors-whippany/`; only the child's own URL says which is its parent.
A child whose parent page does not exist is dropped with a warning - the
export refuses to write a suburb page when it has no real local fact (4 such
refusals in Parsippany, left as `.txt` notes), and a page nested under a 404
is worse than no page.

Rendering reuses `contentPageDoc()` - **no new component, no new CSS, no new
design axis**. The only additions:
- `contentPageDoc()` gained `beforeSections` / `afterSections` (both default
  `''`, inert everywhere else).
- The suburb page leads with its children via `C.services(ctx, { items })` -
  `services()` now accepts an explicit item list, same skin and variant.
- `showServices` is OFF on a suburb that has children (the city-wide grid would
  repeat the list in weaker form) and on the child pages.
- `relatedLinks()` in `pages.js` renders parent + siblings + the city-wide
  version of the same service, as `.area-chip` inside `.cov-cloud`.
- `serviceSchema()` takes an `areaServed` override, fed from the page's OWN
  `schema_facts.areaServed` ("Denville, NJ") - never assembled from a slug.

### 6. New service ids

`config/services.js` gained `SERVICE_ALIASES` + `resolveServiceId()` mapping
export naming (`opener-repair`, `off-track-repair`, `commercial-garage-door`,
`new-door-installation`, ...) onto catalog ids. It is a LOOKUP alias for
label/icon only - it never changes a URL and never merges two authored pages.
One genuinely new entry, `emergency-garage-door`, whose blurb makes **no
availability claim** (24/7 / same-day / response time are all on
`neverFabricate`); it describes the kind of failure, and the business's own
authored page supplies the real facts.

### 7. QA scripts take `--dist <dir>`

`qa-sites.mjs` and `qa-seo-files.mjs` both accept it, so a scratch build can be
swept without writing into `dist/` (which holds the frozen sites).

### Parsippany - first site on the new structure

`parsippanygaragedoorpros.com` (serial 348, Parsippany NJ, theme
`premium-dark`, u=57). 241 pages: 238 content-declared + the engine's own
`/services/`, `/resources/`, `/garage-doors/` indexes. All 238 declared URLs
built, 0 dead links in the content's own `page.links` graph, 0 dead inline
prose links, both QA sweeps clean. Built to a scratch dir only - **not in
`dist/`, not committed, not pushed**.

## Recently-established engine-wide conventions (this session)

These are now baseline behavior across ALL themes/sites, not one-off
per-site tweaks — don't reintroduce the old behavior when touching nearby
code:

- **Real per-site content exports can include "trust" pages, a "hub" intro,
  and legal pages — the engine now supports all three (2026-08-24, added
  while onboarding the first real production assignment, Dallas).**
  `src/content/adapter.js` recognizes `-trust-about/-contact/-faq/-request-
  a-quote` (real About/Contact/FAQ/Quote page copy — same `{title, meta, h1,
  sections, faq}` shape as everything else — now preferred over the generic
  fallback builder when present), `-hub-service-areas` (real Service Areas
  index intro), and bare `privacy.json`/`terms.json`/`accessibility.json`
  (new page types — `buildPrivacy`/`buildTerms`/`buildAccessibility` in
  `pages.js` — gated on real content existing, linked from the footer's new
  `.footer__legal-links` group). A real export may organize these into
  numbered subfolders (`01-money-pages/`, `05-trust/`, etc.) — the adapter
  still expects everything flat in `contents/<city>-<state>/`, so flatten
  on drop-in. See `[[assignment-generation-process]]` (memory) for the full
  per-assignment workflow this feeds into.
- **`paras()`/`contentProse()` now render minimal inline markdown**
  (`**bold**` → `<strong>`, `[text](url)` → `<a>`, safe — text is escaped
  BEFORE the markdown patterns are converted, and a link target is only
  rendered as a real `href` when it looks like a relative path or http(s)
  URL). Found because a real content export's prose uses this formatting
  and it was previously showing as literal asterisks/brackets on the page.
  Applies engine-wide, not just to the trust/legal pages that surfaced it.
- **No gradient icon-badges.** `.svc__icon`, `.feat__dot`, `.svc-zz__ic`,
  `.wf-ic`, `.trustbar--stacked .trust-item .ico` all use a flat
  `color-mix(in srgb, var(--c-primary) 13%, transparent)` tint with a
  primary-colored icon — never `var(--grad-brand)`/`var(--grad-band)`. That
  gradient-medallion look reads as generic AI-generated design. (Buttons,
  the CTA band, the brand mark, and numbered step-circles were left as-is —
  scoped narrowly to actual icon containers.)
- **Every button in a CTA group shares the same structural style within a
  site.** The 8 `ctaStyle` skins (`config` pool in `src/engine/variation.js`)
  wrap button groups (e.g. hero's "Request a Quote" + "Call") in a
  `cta-<style>` class - each skin's CSS must restyle `.btn` generically (or
  explicitly cover `.btn--primary`, `.btn--emergency`, AND `.btn--ghost`),
  never just `.btn--primary` alone, or the two hero buttons visibly mismatch
  (e.g. one outlined + one solid-filled, or one pill-shaped + one square).
  Color is still allowed to differ between button kinds (brand vs. urgent-red
  vs. neutral) - that's semantic, not a structural mismatch. When adding a
  color for a non-primary button kind in a new skin, use/add a proper
  contrast-guaranteed `*Link` token in `palette.js` (see `emergencyLink`),
  not the raw palette color.
- **No em-dashes anywhere** — engine source, comments, and all `contents/**/*.json`
  content files use a plain hyphen (`-`) instead of `—`.
- **No underline on links anywhere** except color-change hovers — the base
  `a{}` rule is `text-decoration:none`; link affordance comes from color/
  weight only.
- **Uniqueness rebalancing enforces a HARD per-axis cooldown, not just
  "avoid the immediately preceding site"** (`src/engine/uniqueness.js`,
  updated 2026-08-20). Both the 9 per-section structural layouts (services/
  why/process/stats/trustbar/areas/cta/brandbar/heroStats) AND the 7 primary
  style axes (hero/nav/serviceCard/reviewCard/gallery/footer/ctaStyle) now
  EXCLUDE a variant from being picked again for `config.uniqueness.sectionCooldown`
  (currently **12**, per explicit user request for "next 10-15 sites") sites
  after it was last used on that axis — checked against the full recent
  window (`registry.window()`), not just the one prior site. The old "avoid
  immediate predecessor + soft frequency cap" behavior is a special case of
  this (cooldown=1) and is gone. Every swap is still score-guarded exactly as
  before (only accepted if the design's uniqueness score against the window
  doesn't drop below its pre-rebalance floor) — don't remove that guard.
  - **Cooldown is clamped per-axis to `poolSize - 1`** (`effectiveCooldown()`)
    so a small pool can never lock generation up.
  - **Every SECTION_POOLS/POOLS axis was expanded to 20 real variants**
    (2026-08-20, per explicit user request "20 variant minimum"), so
    cooldown=12 is now actually achievable everywhere — **except `nav`**,
    which was deliberately kept at its original 6 (user explicitly declined
    expansion: "nav will be same this way, dont add variant for nav" —
    cooldown for nav is capped at 5).
  - **"Generic skin" architecture**: rather than hand-writing ~200 bespoke JS
    render branches, most of the new variants for a given axis route through
    ONE shared generic markup shape already wired in `components/index.js`
    (e.g. `services()`'s `GENERIC_SERVICE_KEYS` branch → `<div
    class="svc-generic svc-generic--KEY">`, `why()`'s `GENERIC_WHY_KEYS` →
    `.why-generic--KEY`, `areas()`'s generic branch → `.cov-generic--KEY`
    reusing the real `listCol` directory data, `cta()`'s `GENERIC_CTA_KEYS` →
    `.cta-band--generic.cta-band--KEY`, same pattern for `process`/`stats`).
    Axes that were ALREADY skin-only before this change (their markup only
    ever differed by a `${variant}` class, never by JS structure) needed no
    JS changes at all: `trustbar`, `heroStats`, `hero` (mostly),
    `serviceCard`, `reviewCard`, `gallery`, `footer`, `ctaStyle`, `brandbar`
    (non-marquee keys). **All the actual visual variety for these ~200 new
    keys lives entirely in CSS** (`src/design/css.js`, one ruleset per key,
    search the key name e.g. `--framed-outline`) — if a "new variant" looks
    identical to another, the bug is in css.js, not in the render functions.
  - **Found + fixed while wiring this up**: `header()` computed
    `design.variants.nav` but never actually applied it as a class anywhere —
    the 3 non-default nav CSS skins (`centered-serif`/`minimal-underline`/
    `floating-pill`) silently never rendered on ANY previously-generated
    site. Fixed by adding `nav--${esc(nav)}` to the `<header
    class="site-header">` element (and updating the one selector that
    assumed the class sat on an ancestor: `.nav--floating-pill
    .site-header` → `.site-header.nav--floating-pill`). Same class-missing
    bug also existed on `brandBar()`'s non-marquee `<section
    class="brandbar">` (fixed the same way, `brandbar--${esc(variant)}`
    added to both branches). **When wiring a NEW axis's variant class onto
    an element, grep for the resulting selector in css.js to confirm it can
    actually match something** — this bug class is easy to introduce silently.
  - The CSS for all ~200 new keys across 15 axes (everything except `nav`,
    kept at 6) was authored via a `Workflow` run (one agent per axis, CSS-
    only output via structured schema, applied by the main session
    sequentially afterward — never let parallel agents write the same
    `css.js`/`components/index.js` files directly, this repo has no git so
    `isolation:'worktree'` isn't available either).
  - `dist/_reports/section-variant-usage.md` is the human-auditable log:
    per axis, which site used which variant in generation order, and which
    variants are currently excluded from the next pick. Regenerated by
    `writeSectionUsageReport()` at the end of every `runBatch()` (same place
    as `errors.md`/the control sheet) — never hand-edit it.
- **Page-wise section composition** was rewritten this session across every
  page type (home/service-index/service-detail/about/service-areas-index/
  area-detail/contact/request-a-quote/products/resources-index/topic-detail)
  to match a detailed spec — see `src/generator/pages.js` (`augmentOrder`,
  `contentPageDoc`, and each `build*` function) for the current per-page
  section list. Key structural points if extending further:
  - A literal `<form>`/`<input>` element **never** appears anywhere except
    `/request-a-quote/` (via `quoteEmbed()`, which is actually an external
    iframe embed, not a native form). Every other page's "contact" affordance
    is a button + `tel:` link, never an input field.
  - `ctaBanner(ctx, opts)` in `src/components/index.js` is a new, slim,
    single-row mid-page CTA nudge — deliberately distinct from (lighter
    than) the full closing `cta()` band at the end of every page. Pass
    `{ text: '...' }` to override its default copy for a specific page.
  - "Symptoms / what's included / safety / key takeaways / our-story
    narrative" are **not** separate components — they're real authored
    prose sections (`sections: [{h2, body}]`) in the content JSON, rendered
    generically by `contentProse()`/`contentSections()`. A content author
    just titles a section appropriately; no new code is needed to add one.
  - Product Detail (per-door-style pages, distinct from the existing
    `/garage-doors/` catalog index) is explicitly **deferred** — no real
    per-model spec data (R-value, gauge, etc.) exists yet. The catalog page
    itself got a real, functional client-side style filter
    (`styleFilter()`/`STYLE_FILTER_SCRIPT`) plus generic, factual,
    industry-standard door-style/insulation content
    (`config/door-styles.js`) — never per-business numeric claims.
- **Every "brand-colored panel" (any element whose OWN background is
  `var(--grad-brand)`/`var(--grad-band)`) must explicitly restyle EVERY
  descendant that has its own hardcoded color** — not just buttons. This bit
  twice in the same session: first `.btn--primary`-only fixes left
  `.btn--emergency`/`.btn--ghost` unstyled (a ctaStyle skin's normal button
  color, or `.btn--solid`'s hardcoded `!important` grad-brand fill, sitting
  almost exactly on top of the panel's own identical background - worst case
  for brand colors in the red/orange hue family, which collide with
  `--c-emergency`); then separately `.hero__chips` (defaults to `--c-muted`
  text + `--c-primary` icon - on `color-block-split`/`left-banner-cta` the
  icon color was measured EXACTLY EQUAL to the gradient's own start stop,
  1.00:1 contrast, completely invisible).
  Root cause both times: `--grad-brand`/`--grad-band` is a 5th surface that
  NONE of the contrast-guaranteed tokens (`text`/`mutedText`/`link`/
  `accentLink`/`emergencyLink`/`ghostText`, all computed via `hardestFor()`)
  were ever checked against - only bg/surface/surfaceAlt/tint. Anything
  inside a brand-colored panel using one of those raw tokens needs an
  explicit override, almost always to `--c-on-primary` (solid fill for the
  primary button/copy, transparent-with-on-primary-outline for everything
  else) - fix pattern is `background:transparent;border-color:var(--c-on-primary);color:var(--c-on-primary)`,
  placed AFTER the "CTA style skins" CSS block so it wins on source order
  (same specificity, later wins).
  Currently confirmed-complete (copy/badge/chips/buttons all covered):
  `.cta-band`, `.hero--color-block-split`, `.hero--left-banner-cta`,
  `.cov-panel` (areas 'directory' variant's coverage panel). `.section--brand`
  and `.side-card--cta` were checked and don't render any of these elements
  today, so are inert (re-check if that changes). When adding ANY new hero
  variant or section with a grad-brand/grad-band background, grep everything
  that renders inside it and check each one's color BEFORE shipping - don't
  wait for it to surface as a bug report.
- **A brand panel's button fix must cover `:hover`, not just the rest state.**
  Every brand panel restyled `.btn--primary` at rest but four of them
  (`.cta-band`, `.hero--left-banner-cta`, `.hero--color-block-split`,
  `.cta-banner--filled-brand`) never wrote a `:hover`. A ctaStyle skin
  selector PLUS `:hover` is (0,3,0), which outranks the (0,2,0) rest rule, so
  the skin took the hover back: `outline-square` repaints
  `background:var(--c-link)`, a primary-derived colour, straight onto the
  primary-derived brand gradient. Measured on Parma 2026-08-27: the hover fill
  came out rgb(30,64,175), **byte-identical to the band's own gradient start
  stop - 1.00:1, the button disappeared under the pointer**. Same signature as
  the earlier `.hero__chips` icon bug. Fixed by hovering to
  `color-mix(--c-on-primary 88%, --c-primary)`: 7.13:1 and 3.93:1 against the
  two gradient stops, both clear of the 3:1 UI-component floor.
  `.btn--emergency`/`.btn--ghost` already had hover rules on all four panels -
  only primary was missed. **When adding a brand panel, write the rest AND
  hover rule for all three button kinds**, and keep them after the ctaStyle
  skins in source order (those end around line 448).
- **`.section--dark` (background: `var(--c-secondary)`) needs the same
  treatment via `var(--c-on-secondary)` specifically** - do NOT try to fix
  this by adding `secondary` to palette.js's shared `textSurfaces` array
  (tried once, reverted): `ensureContrast` adjusts toward ONE target
  surface's lightness direction at a time, and bg/secondary often need
  *opposite* adjustments, so that approach broke `mutedText`'s contrast
  against the far-more-common bg/surface/surfaceAlt (measured as low as
  1.44:1 - a QA `a11y.contrast` FAIL) while chasing a narrower problem. Any
  future "make token X safe against surface Y too" request should go through
  a scoped CSS override using an existing correctly-paired token
  (`onPrimary`/`onSecondary`/`onEmergency`/`onAccent`), not by widening a
  shared multi-consumer surfaces array.
- **Every gallery/grid variant CSS class must set its OWN
  `grid-template-columns`** (`.gallery--polaroid` didn't, and silently
  fell back to the base `.gallery{display:grid}` rule's implicit ONE-column
  auto-placement - looked like a vertical stack of single photos). When
  adding a new grid-based section variant, also add it to the responsive
  breakpoint collapse rules at the bottom of css.js (search
  `.gallery--wide-strip` for the pattern) - a variant present in the base
  rules but missing from `@media (max-width:1000px)`/`(max-width:720px)`
  stays stuck at its desktop column count on mobile.
- **CSS source order matters for `.cta-<ctaStyle> .btn--*` rules specifically**
  (2026-08-20 fix). The "brand-colored panel" button-color overrides
  (`.hero--color-block-split .btn--primary`, `.cov-panel .btn--primary`,
  `.section--dark .btn--*`, `.cta-band .btn--emergency/.btn--ghost`, etc.)
  and every `ctaStyle` skin's own `.cta-<style> .btn--*` rule are BOTH
  2-class selectors (equal specificity) - whichever comes LAST in css.js
  wins, regardless of actual DOM nesting. The panel-fix rules MUST stay
  after all `ctaStyle` skin rules in source order (this is why the base 8
  skins live right after the button section near the top of the file,
  *before* `header/nav`) - appending a new/expanded ctaStyle skin's CSS at
  the END of the file (e.g. from a batch Workflow run) silently un-fixes
  every one of those panel contexts. Always place new ctaStyle CSS
  immediately after the existing ctaStyle block, never at file end.
- **A grid/flex row containing two children of very different natural
  height (or width) will size the WHOLE row to the taller/wider one** -
  `align-items`/`justify-content` only affect how the *shorter* item is
  positioned inside that already-decided row size, they never shrink the
  row itself. Two confirmed instances this session: (1) `sidebar()`'s
  services/guides/areas lists were long enough to regularly out-grow short
  topic/guide articles in `.content-layout` (grid, `align-items:start`),
  leaving 100+px of dead space under the shorter main column - fixed by
  capping the sidebar's list sizes (3/2/2, was 6/4/6) so it rarely dominates
  short pages. (2) `emergency()` used raw inline flex styles
  (`justify-content:space-between` + `flex-wrap:wrap`) with NO responsive
  rule at all - at any width where the text block and button don't fit
  side by side, the button wraps onto its own line and `space-between` just
  left-aligns that lone item, leaving blank space to its right. Converted to
  a real CSS class (`.emergency-band__row`/`.emergency-band__copy`/
  `.emergency-band__cta`) with an explicit `flex-direction:column` +
  full-width-button fallback at `max-width:720px`. When adding any new
  "text block + single CTA" row like this, always give the CTA an explicit
  wrapped-mobile fallback - never leave a two-item flex/grid row with only
  its default wrap behavior and no stacking rule.
- **`.hero__media{align-self:stretch;aspect-ratio:auto}`** (used by
  split-image-right/left, left-banner-cta, duotone-media) lets the photo
  match the copy column's height with no upper bound - an unusually tall
  copy column (long subhead + chips + stats) stretched the photo into an
  elongated, unnaturally "too long" portrait. Added
  `max-height:clamp(360px,42vw,560px)` as a pure safety cap (object-fit:cover
  already crops, so this never distorts, only bounds).
- **`.footer-grid` is `display:flex`, not `display:grid`, on purpose** - 15
  of the 20 footer skins restyle it with their own `flex-basis`/
  `flex-direction` rules; switching the base to grid silently breaks all of
  them (found and reverted this session - don't redo it without also
  converting every skin's overrides). The actual bug was a dead
  `grid-template-columns:1fr 1fr` responsive rule that had zero effect on a
  flex container - real 4-desktop → 2-tablet → 1-mobile collapse now comes
  from `flex-basis:calc(50% - 1.5rem)` at `max-width:1000px` and
  `flex-basis:100%` at `max-width:600px`.
- **A block with `max-width:Nrem`/`Npx` but no `margin-inline:auto` LEFT-ALIGNS
  inside its full-width parent, leaving a large dead gap on the other side**
  (2026-08-20) - put a half-viewport blank space next to a services list
  (`.svc-divided`) and 7 other new generic-skin containers the same way.
  `ch`-unit caps are NEVER this bug (always a legitimate left-aligned
  text-reading-width cap, e.g. `.hero__sub`/`.section-head` - don't
  "fix" those). **This is now a permanent automated QA check**
  (`layout.noOrphanMaxWidth` in `src/qa/validate-site.js`, warn-level) that
  statically scans the generated CSS for exactly this pattern on every
  site - if it fires, either add real `margin-inline:auto` to the flagged
  rule, or add the selector to that check's `SAFE_UNCENTERED_MAXWIDTH`
  allowlist *only after verifying by reading the component* that a parent
  flex/grid already centers it (don't allowlist to silence the warning
  without checking).
- **A full-width left-aligned stack leaves the whole right side void.** The
  `cta` skin `ledger-style` was three full-width rows (heading / sub-copy /
  buttons) separated by hairlines, all left-aligned. Measured on Murfreesboro
  at a 1178px container: the heading left 693px empty, the sub-copy 620px, and
  the button row **842px - 71% of its own row**. Now a two-column band, copy
  left and actions right, so the empty side has something to hold; band height
  335 -> 220px. The full-width hairlines went with it - they were the banned
  horizontal rules AND the thing stretching each row edge-to-edge. Collapses to
  a stacked column under 900px (higher than split-duotone's 720px, because this
  right column holds a full button PAIR, ~336px, not a line of text).
  Decorated with two flat angular corner blocks; see the decoration rule below.
- **A one-column list of short items wastes the width it is given.** The
  `process` skin `numbered-list` was a single 60rem column of
  [number + 104px photo + text] rows. Measured on Loveland at 1440px: each
  960px row carried 682-724px of content, so **236-278px of EVERY row was
  void**, and four one-line steps filled a 724px-tall section. Now two columns
  above 900px (475px tall, 0px unused) collapsing to one below. The row's text
  block also needed `flex:1 1 auto;min-width:0` - without it the block sizes to
  its own content and leaves a ragged right edge even in one-column mode.
  When a skin caps itself at a fixed `max-width`, check what share of that cap
  the content actually uses before assuming the cap is doing something useful.
- **Filling a bare numeral's background on hover paints a box, not a badge.**
  `step__n`/`hstep__n`/`tl-step__n` are real circular badges (34-42px,
  `border-radius:50%`), so `background:var(--c-primary)` on hover fills a
  proper shape. `proc-numlist__n` and `proc-stack__n` are bare numerals with no
  width, padding or radius - the identical rule painted a tight rectangle
  hugging the digit, which read as a stray dark box on one step (Loveland step
  3, 2026-08-27). Bare numerals get a COLOUR change only. Same root cause as
  the hover wash below: a background needs geometry.
- **A hover wash needs GEOMETRY to fill.** `.proc-g__item:hover` paints a soft
  brand background across all 12 generic `process` skins, but four of them set
  no padding at all — so the wash rendered as a hard square block hugging the
  text and butting straight into the rounded `.proc-g__media` above it, square
  corners poking past a rounded photo (user-reported on Dana Point,
  2026-08-27). Those four now carry resting padding that exists purely so the
  wash has margin, and the wash is rounded + eased at the shared rule. Three
  skins are square BY DESIGN and explicitly opt out (`framed-outline` draws a
  ruled border grid, `alternating-tint` paints edge-to-edge bands,
  `boxed-diagonal`'s shape is a clip-path corner cut). **Any new skin on an
  axis with a shared hover background needs its own padding, or it inherits
  this defect silently.** Also found in the same pass: `alternating-tint`'s
  resting tint is `:nth-child(even)` at (0,3,0), which outranked the (0,2,0)
  shared hover rule — every SECOND step had no hover response at all. When a
  shared hover rule coexists with a structural `:nth-child`/`:not()` rule,
  check the specificity, not just that both rules exist.
- **`min-height:44px` now lives on the BASE `.btn`.** The standing rule is
  "never under 44px tall", but height is really decided by whichever of the 8
  `ctaStyle` skins is active, each with its own padding — and two drifted
  under: `compact-condensed-btn` at 33px (patched individually earlier) and
  `minimal-quiet-btn` at 43.3px (measured on Murfreesboro, 2026-08-27, and
  live on Raleigh). One floor at the base makes it unreachable for every
  current and future skin. Separately, `minimal-quiet-btn` and
  `color-block-btn` both sized `.btn` without restating `.btn--lg`, so the
  large modifier was DEAD (a 2-class skin selector outranks 1-class
  `.btn--lg`) — both now define it. There is no `.btn--sm`, so the floor has
  no small-button casualties.
- **Any section whose item COUNT genuinely varies at runtime (heroStats:
  2-4 items depending on which of population/services/areas/diagnosis
  exist for that business) cannot assume an exact count in its CSS.**
  `hero__stats--split-duotone`'s absolute-positioned center divider assumed
  exactly 2 items (`flex:1 1 45%` in a wrapping row) - a real 3-item count
  wrapped the 3rd item onto its own line with nothing to visually pair it
  with, next to a divider line that no longer meant anything. Fixed with
  CSS Grid (`grid-template-columns:repeat(2,1fr)`) instead of flex-wrap -
  the grid's column boundary stays coherent no matter which cell a
  trailing item lands in, so an odd-item-out never breaks the layout's own
  visual logic the way an assumed-even flex split does. Any NEW variant
  for an axis with a variable item count (heroStats today; check before
  assuming any other axis is always a fixed count) needs the same
  "verify it degrades gracefully at 2, 3, AND 4 items" check before shipping.

## The res/com section is REMOVED engine-wide (2026-09-10)

User instruction: *"update the engine, dont show any re/com sections in the
UI"*. `resCom()` ("Residential & commercial"), all five of its layout variants,
all of its CSS, and its GSAP reveal preset are deleted. Verified on a full
build: `id="rescom"`, `rescom-*`, `.rc-card` and `.rc-tag` appear on **0 of 78
pages**.

What was touched: `components/index.js` (function deleted),
`design/css.js` (~5.1 KB of rules; `.about__media` KEPT - `about()` uses it),
`assets/vendor/section-animations.js` (dead `.rc-card` preset, which was being
inlined into every page), `generator/pages.js` (the `augmentOrder` injection,
the `renderHomeSection` case, the `showRescom` option and all four call sites,
and the city-hub render), `scripts/build-section-catalog.mjs`.

**The `rescom` axis STAYS in `SECTION_AXES` and `SECTION_POOLS`, deliberately.**
That array is the positional format of the `sections` fingerprint string stored
for all 81 registry rows, and `rescom` sits at **index 12 of 14**. Deleting the
slot would shift `reachSteps` down one, so `repin.mjs` would read a rescom key
as a reachSteps key and silently redesign the reach stepper on every site it
rebuilds. The axis now rolls a value that renders nothing - one wasted word per
fingerprint, which is the right trade. `renderHomeSection`'s `case 'rescom'`
also stays (returning `''`), because a theme's hand-authored `sectionOrder` can
still list it.

### Follow-up 2026-09-13: the res/com PHRASE is gone too

The section removal above deliberately left three one-line mentions and
flagged them. The user then asked for those gone engine-wide as well, so all
three were removed:

| where | was | now |
|---|---|---|
| `trustbar()` 4th-item fallback | "Residential & commercial" | falls through to "Diagnosis first, then the fix" - bar still shows **4** items |
| `hero()` chip row | 3 chips | **2** chips ("N services", "Diagnosis before repair") |
| `buildQuote()` bullet list (`/request-a-quote/`) | "Repairs and installs for residential & commercial doors" | removed - **3** bullets remain |

Verified on a full Parsippany build: the phrase (case-insensitive, `&` or
`&amp;`) appears on **0 of 78 pages**; both static QA sweeps clean; and a
fresh responsive sweep AFTER these edits (the earlier one predated them) came
back **468/468 checks, 0 overflow, 0 buttons under 44px, 0 text under 11.5px**.

The now-unreachable `'residential'` and `'commercial'` **image slots** were
deleted from `src/assets/images.js` as well (`localPhotoFor`, `photoBase`,
`sizeFor`). Proven dead before deleting, not assumed: no `slot:` override is
passed anywhere, so `indexHero` always resolves `'hero'`; `contentPageDoc`'s
`illustration` is only `'hero'` or `gallery-${i}`; every other caller passes
`'hero'`, `'about'`, or a `gallery-`/`svc-`/`proc-` prefixed key. The
`RES_DOOR`/`COMMERCIAL` photo arrays in `config/images.js` were intentionally
left in place - only the lookup branches went.

**Do NOT extend this to the words "residential"/"commercial" in general.**
Plenty of unrelated vocabulary legitimately uses them and must stay: the
`kind: ['residential','commercial']` field on every entry in
`config/services.js`, the "Commercial roll-up" door style
(`config/door-styles.js`, `illustrations.js`, the `/garage-doors/` catalog
copy), the `industrial-commercial` / `bright-residential` theme ids, and the
fallback builder's "works on residential garage doors" prose. The removal was
of the res/com SECTION and its one-line echoes, nothing broader.

**Known pre-existing defect, flagged not fixed:** the hero chip reads
`business.services.length` - the 4-item default catalog - instead of the
site's real content services. On Parsippany it says **"4 services" while the
site publishes 8 service pillars**. Not caused by the res/com work, but it is
now one of only two hero chips, so it is more prominent. Likely fix:
`ctx.content.services.length || business.services.length`.

## Standing DESIGN RULES from the user (do not undo these)

Each was given as an explicit instruction after reviewing real output. They
are taste decisions already made — re-proposing the rejected form is
re-litigating a settled call.

- **No curved/wavy section dividers.** Asked for "shape, curve divider", then
  rejected two revisions and settled it: *"dont do the curve, just properly
  use minimal shape"*. The `sectionDivider` axis now holds only small FLAT
  marks (`bar-left`, `bar-center`, `rule-inset`, `rule-full`, `ticks`,
  `square`, `stack-left`, `split-rule`) drawn by the "minimal section marks"
  block in `css.js`. Never restore arch/wave/scallop/scoop/sweep/zigzag.
- **Background shapes: flat, angular, per-skin distinct, clipped by the
  section.** Three CTA skins now carry decoration, each with deliberately
  different geometry so they never read as the same band: `quiet-editorial` one
  right-side wedge, `split-duotone` a tilted parallelogram bleeding past the
  top and bottom edges, `ledger-style` two nested corner blocks stacked into
  the right corner (added 2026-08-27 on request). All are `clip-path` polygons
  - never a curve - tinted from `--c-primary` only, and they sit inside the
  band's own `overflow:hidden`. The `.container` must then take
  `position:relative;z-index:1`, or the positioned pseudo-elements paint over
  the copy. A `::before` shape needs the TWO-class selector
  (`.cta-band.cta-band--KEY::before`) to outrank the theme decor patterns.
- **Decoration must live INSIDE its own section's padding.** The first divider
  revision hung a shape above the section and painted over the trustbar's text
  on `/contact/`, `/request-a-quote/` and `/service-areas/` (18px of overlap).
  Never position decoration where it can land on a neighbour's content — you
  cannot know what is above it.
- **No decorative shape that grows/animates on a button.** *"this button
  animation dont need"* (2026-08-27, Dana Point). `ribbon-corner-btn` tucked a
  rotated square under each button's top-right corner that grew on hover; it
  read as a stray pale triangle sitting ON the button, not as decoration. The
  skin now expresses its corner identity through the button's OWN shape (one
  square corner, three rounded) so there is nothing to animate and nothing that
  can misread as an artifact, and hover falls through to the standard lift.
  `duotone-fill` was checked and is fine - it only shifts a divider line's
  colour, which moves nothing.
- **No CTA variant may render on white.** *"i dont want any variant of CTA show
  white color"* (2026-08-27, spotted on Brownsville). The closing CTA is the
  most important block on the page and must never read as unstyled page space.
  The 8 "loud" keys keep the base `.cta-band` brand gradient; the 9 "quiet"
  keys each carry their OWN tinted background — deliberately different from
  one another so the skins stay distinguishable. Seven were fixed in one pass
  (`minimal-line`, `framed-outline`, `shadow-stack`, `glass-panel`,
  `outline-only`, `ledger-style`, `ghost-frame` — previously `transparent`,
  `var(--c-bg)` or `var(--c-surface)`); `quiet-editorial` and `split-duotone`
  were already done. Mix tints into **`--c-surface-alt`, never a literal
  white** — that is what makes them resolve correctly on the dark themes too
  (verified: McKinney and Longmont render dark tints, not white). Keep them
  light on light themes: the copy is `--c-text`/`--c-muted`, and a dark or
  brand fill would need every descendant restyled (see the brand-colored-panel
  rule). A new quiet CTA skin MUST declare a background.
- **Section backgrounds tint from `--c-primary` ONLY — never raw `--c-accent`.**
  *"properly use site color platte of that site"* (2026-08-27). `--c-accent` is
  deliberately saturated and is never shown as a surface anywhere on a site; it
  only reaches the page through `--c-grad-band-end`, already pushed through
  `ensureContrast`. Mixing it into a background introduces a hue the site does
  not otherwise have — measured on the first CTA pass: Loveland (a warm cream
  site, indigo primary) rendered a PINK/LAVENDER band, Toms River (green
  primary) a cyan one. All six raw-accent stops were replaced with
  `--c-primary`. Make variants differ by tint STRENGTH and gradient GEOMETRY
  (vertical / diagonal / radial / flat / hard two-stop), never by a second hue.
- **The favicon is the business's REAL logo** (`faviconHref()` in
  `src/assets/images.js`) — *"make sure each site logo use as favicon dont use
  fallback"*. The monogram data-URI survives only as the last resort for a
  serial with no logo file. Known tradeoff, already raised: the logo is a
  200x200 wordmark badge, so its type is not readable at 16-32px tab size —
  only the shape and brand colour carry.
- **THE LOGO / BRAND-MARK PROCESS — standing, for every future batch.**
  Confirmed 2026-08-30: *"remember this logo and brand name process, for all
  next generation i will go with this process"*.
  - Logos live in `images/LOGO/` as `<serial>_<city>_....png`, keyed by
    SERIAL. `config/local-photos.js` resolves that folder **case-insensitively**
    but anchored to `^logos?$` — `images/FIRST 200 SITES LOGOS/` holds serials
    1-200 under identical filenames with OLDER contents, so walking both would
    make the logo a business gets depend on traversal order. Coverage is now
    serials 1-480. **A missing logo dir fails SILENTLY** (every business drops
    to the monogram, no error) — that is how a folder rename to `images/LOGO`
    produced "0 of 20 have a logo" when all 20 existed.
  - `brandMark(ctx, surface)` in `components/index.js` serves BOTH the header
    (`'bg'`) and the footer (`'secondary'`).
  - **Light surface → fully transparent**: no plate, ring, shadow or padding;
    `width:auto;height:46px` (38px under 920px), `object-fit:contain`.
  - **Dark surface → a light rounded card** (`.brand__mark--on-dark`). Not the
    old treatment: no ring, no drop shadow, and 46px rather than crushed into
    the 38px monogram tile.
  - **Darkness is decided per surface from the real palette colour via
    `isDark()`, never from `mood`.** Either theme can land on any site, and the
    footer is dark even on light themes — every footer paints
    `var(--c-secondary)` and all 56 secondaries measure dark. So: transparent
    in light headers, carded in dark headers and in EVERY footer.
  - Why the card exists: the artwork is drawn for light backgrounds (icon over
    the city name in dark type), and on a dark bar 11-36% of each logo's
    visible ink drops below readable contrast. **Supply light-on-dark variants
    and the card can go away entirely.**
  - The brand NAME needs nothing — it is already token-driven and
    contrast-guaranteed (`--c-text` on `--c-bg`, `--c-on-secondary` on
    `--c-secondary`; measured 16.49:1 / 8.54:1 light, 14.81:1 / 8.46:1 dark).
- **Footers are always column-wise.** *"footer always column wise"* — link
  groups as columns with vertically stacked lists. Never a skin that runs
  links horizontally or collapses groups into inline "Label: a b c" runs. The
  base `.site-footer ul` is `display:grid`, so a new skin is compliant by
  default; check with `grep -n "footer--.*ul{" src/design/css.js`.
- **A service-card icon aligns with the card's text, never floats centred.**
  *"service card icon position need to fix, dont use icon in center"*
  (2026-08-27, Longmont). The base `.svc__icon` is a 52px
  `display:grid` + `place-items:center` tile. `editorial-row` overrode
  `width:auto`, which keeps it `display:grid` so the box stretched to the FULL
  card width and `place-items` then centred the glyph inside it - a lone
  centred icon above a left-aligned heading, copy and link. `width:max-content`
  shrink-wraps the box so the glyph returns to the card's left edge and the
  inherited centring becomes a no-op. **Any skin that strips this icon's fixed
  width must set `width:max-content`.** Deliberately centred skins are fine and
  are NOT this bug: `circle-icon` sets `text-align:center` on the whole card,
  so icon, heading and link all agree.
- **Service cards must look like cards.** Every serviceCard skin needs a real
  bordered/shadowed box AND a hover — a skin that renders no card is a defect
  (*"each card has no separation, no hover effect now so its looks as plain
  text"*). Services layout is LOCKED to `grid`; per-site variety comes from
  the 19 card SKINS.
- **The reach stepper shows a number OR an icon, never both.** See
  `REACH_MARKER` in `components/index.js`. A new `reachSteps` key must be added
  there or it silently falls back to the number.
- **Brandbar: the brand list is a fixed SIX.** Lay them across the row (one
  line, or an even 3x2) — never a tall narrow stack, never a sideways
  scroller.
- **Real per-site contact data only.** Phone/address come from the build sheet
  (`config/business-contacts.js`), and the contact map queries the real street
  address — NOT `b.lat/b.lng`, which are CITY centroids from the city sheet and
  put every marker on the metro downtown.
- **Buttons: never below `--fs-sm`, never under 44px tall.** A ctaStyle skin
  that sizes `.btn` must also define `.btn--lg`, or the large modifier is
  silently dead (it outranks `.btn--lg` on specificity).
- **Authored headings are unbounded in length.** `sections[].h2` comes from
  content JSON — never lay one out in a fixed narrow column. The `side-label`
  prose variant had a 120px gutter and wrapped three-word headings one word per
  line; it now renders a plain full-width `<h2>` like every sibling template.

## Retired variants — removed, not just unused

Retiring means: gone from the pool in `src/engine/variation.js`, CSS deleted,
and (where one existed) the render branch removed so an explicit `--variants`
override cannot resurrect it. Each carries a comment saying why.

| axis | key | why |
|---|---|---|
| footer | `minimal-text-row` | inline label+link runs; reads as a paragraph |
| footer | `ledger-rows` | full-width rows + horizontal links; 890px of dead space |
| brandbar | `ledger-rows` | 2 columns in a 680px strip for six brands |
| brandbar | `split-duotone` | same shape — 3 rows of 2 using 36% of the bar |
| why | `accordion` | hid every reason's copy in a closed `<details>` |
| serviceCard | `ledger-rows` | cardless — no border/fill/shadow |
| gallery | `stacked-list`, `carousel-row` | image not the focus / sideways scroll |
| process | `chat-bubbles`, `accordion`, `underline-accent-list`, `ledger-rows` | |
| trustbar | `ledger-rows`, `split-duotone`, `alternating-tint`, `stacked-two-row` | |
| why | `underline-accent-list`, `ledger-rows`, `alternating-tint`, `quiet-editorial` | |

Note `minimal-text-row` and `ledger-rows` still exist as valid keys on OTHER
axes (heroStats, brandbar, faq) — retirement is per-axis, not global.

## Variant coverage (as of 2026-08-25)

**266 of 329 patterns used across the 16 sites — 63 unused, 80.9% coverage.**
Fully exhausted axes (no uniqueness left to give): `nav` (6/6), `services`
(locked to `grid`), `ctaBanner`, `contentProse`, `rescom`, `reachSteps`,
`sectionDivider`. Most headroom: `hero`, `reviewCard`, `ctaStyle` and the `cta`
section — 6 untried each. 4 of 18 themes never used: `bold-emergency`,
`bright-residential`, `neo-brutalist-bold`, `retro-industrial-badge`.

Recompute any time with the registry + pools; unused keys have never rendered
on real content, so expect a similar defect rate to the reviewed ones when they
first roll.

### Service card `minimal-quiet`: long blurbs (2026-09-13, user request)
Albuquerque's quiet cards grew into uneven towers: the full authored blurb
printed at `--fs-md`, and "Learn more" sat at a different height on each card.
The user asked for this variant to be fixed on every site that uses it:
Albuquerque, Humble and Matthews. Fix in css.js, next to the minimal-quiet
rules: the card is a flex column at full height, the blurb is `--fs-sm` and
clamped to 3 lines, and the link is pushed to the bottom with `margin-top:auto`.
Rebuilt those 3 with repin `--allow-frozen`. QA: 234 pages, 0 dead links and
0 broken images. Albuquerque at 1440: all 8 cards are 399px tall and each
row's links line up. Matthews at 375px: 0 overflow.
From now on the user reviews each site by hand. Section fixes apply to the
named site only, unless they say "variant / all sites" as they did here.

### Mobile sticky bar icons (2026-09-13, user request, all sites)
The `.mobile-cta` buttons were text-only. They now carry icons: Schedule has
a calendar (a new `calendar` icon in assets/illustrations.js), Call has the
phone icon, and the no-phone Services fallback has the wrench. Each button is
inline-flex with a .5rem gap and an 18px icon (css.js, next to
`.mobile-cta .btn`). All 45 rebuilt with repin `--allow-frozen <each exact
domain>`. Note: the substring `garagedoor` is rejected as ambiguous because
the registry has 80 entries, so pass the 45 domains taken from dist folder
names. Result: 45/45 sticky bars have icons. QA: 3,530 pages, 0 dead links;
SEO 45/45 clean.

### Service card `offset-number`: Learn more alignment (2026-09-13, user request, variant-wide)
On Auburn, each card's "Learn more" sat at a different height because the
blurbs are different lengths. The fix is in css.js, after
`.svc--offset-number .svc__media`: the card is a flex column at full height,
and `.svc__more` gets `margin-top:auto`. The blurb is NOT clamped because the
user only asked for alignment. Sites using this variant: Auburn and Chicago,
both rebuilt with repin. QA: 183 pages, 0 dead links.

### Service card `soft-rounded`: Learn more alignment (2026-09-13, user request, variant-wide)
Same issue as offset-number, reported on Brighton, with the same fix in
css.js right after the last top-level `.svc--soft-rounded` rule: the card is
a flex column at full height and `.svc__more` gets `margin-top:auto`. No
clamp. Five sites use this variant and all were rebuilt: Brighton, Chaska,
Dana Point, Colorado Springs and Hugo. QA: 382 pages, 0 dead links.

### Service card `boxed-diagonal`: Learn more alignment (2026-09-13, user request, variant-wide)
Reported on Brownsville. Same fix as soft-rounded: flex column plus `.svc__more{margin-top:auto}`, no clamp. Rebuilt: brownsvillegaragedoorpros.com garlandgaragedoorpros.com jacksonvillegaragedoorco.com.

### Learn more alignment: every service card variant (2026-09-13, user request)
Measured at 1440 before the fix: in 12 of 13 unfixed variants, "Learn more"
tops differed by 20-50px within a row. shadow-stack and editorial-row
measured 0, but only because the text lengths happened to match. Every
variant now uses the same rule, added after its last top-level rule in
css.js: `.svc--<v>{display:flex;flex-direction:column;height:100%}` plus
`.svc__more{margin-top:auto;align-self:flex-start}`. circle-icon uses
`align-self:center` to keep its centred link. All 17 variants on the 45
sites are covered. All 45 rebuilt.

### CTA band `oversized-badge` ring overlap (2026-09-13, user request, variant-wide)
This variant is on almost every page of all 45 sites. Its 420px decorative
ring (`::before`) was centred behind the copy, so it crossed the heading,
paragraph and buttons (reported on Burbank /burbank/pico-rivera/emergency-garage-door/).
The ring now sits on the band's right edge: `right:0`, `translate(50%,-50%)`,
half off-canvas. It is hidden (`content:none`) below 900px, where there is no
edge room. The layered-depth button skin (Burbank, Idaho Falls) casts a 10px
offset shadow that sat on the next button, so `.cta-band__btns` and
`.cta-banner__actions` with `cta-layered-depth-btn` get an extra 12px gap.
All 45 rebuilt.

### Nav label Guides -> Blogs (2026-09-13, user request, all sites)
The megamenu label in components/index.js header nav is now "Blogs" with "View all blogs". The same header markup serves desktop and the mobile drawer. URLs are unchanged: /resources/ index and /blog/<slug>/. The sidebar "Guides" card and page titles are untouched (the request was navbar only). All 45 rebuilt.

### Quote CTA reverted: "Schedule" /book/ -> "Request a Quote" /request-a-quote/ (2026-09-13, user request, all sites)
The user reversed the earlier same-day /book/ + "Schedule" decision. All of
these now point back to the old route and label:
- `urls.quote` = `/request-a-quote/` (site.js)
- primaryCta label = "Request a Quote"; the sticky bar, hero, CTA bands and
  footer all follow it
- announcement bar, service-card link, contact-page line, quote iframe title
  and footer link read "Request a quote" / "Request a Quote"
- buildQuote no longer rewrites the authored title/H1/meta; the export's own
  "Request a Quote" copy is used verbatim
- rewriteAuthoredLinks no longer maps /request-a-quote/ to /book/, and
  /request-a-quote/ is in the valid set
- llms.txt entries updated
- scripts apply-quote-form, apply-quote-iframe-eager and serve-all read
  request-a-quote/index.html again
All 45 rebuilt. Checks: 45/45 have /request-a-quote/, 0 stale /book/ dirs,
0 pages link /book/, 0 "Schedule" labels on 3,530 pages. QA: 0 dead links;
SEO 45/45 clean.

### No fake data + no unpublished suburb names (2026-09-13, user request, all sites)
User: "dont use any fake data in any sites" and "dont add any unpublish suburbs name in the any sites".
An audit found engine-invented claims printed on all 45 sites. Answers to the
two questions asked: "Remove only the names" (not whole sentences), and "Keep
as neutral design copy" (process/why-us wording stays).

**Removed invented facts**
- config/site-content.js defaults: hours "Open 7 days · 7am–8pm", emergency247
  (announcement badge "24/7 Emergency Service"), freeEstimate (trust item and
  quote-page point), insured ("Licensed & insured"), and the 6 brand names
  (brand bar). All are now empty/false.
- The emergency band is neutral copy with no availability claim, so it no
  longer depends on emergency247 (pages.js contact page).
- The trust bar fills with real counts instead ("N services", "N service
  areas"), then "Diagnosis first".
- The reach step "same day's queue" was reworded.
- The catalog `blurb` is no longer a fallback anywhere: service cards, suburb
  service cards, llms.txt, and the Service JSON-LD description (which is now
  the page's own meta or omitted).
- Catalog labels now follow the exports' own service naming: Spring Repair,
  Off-Track Repair, Commercial Garage Door, Maintenance.

**Unpublished area names**
- `scrubUnpublishedNames()` in src/content/index.js runs right after
  rewriteAuthoredLinks. It removes the names of this site's own dropped areas
  (04 pages without 07 content, name from schema_facts.areaServed and from the
  slug) from every authored string, together with the list separator next to
  each name.
- Structural keys are skipped. Names that are part of a published area, the
  city or the business name are protected, and matching is one longest-first
  pass.
- Grammar repairs: "from X to <removed>." becomes "around X."; an empty
  "including ," or a trailing "out to." is cleaned up.
- An FAQ whose question CHANGED and now dangles ("Do you come out to?") is
  dropped. Unchanged authored questions are never tested.
- Run totals: 15,346 name mentions removed on 43 sites, 13 FAQ questions dropped.

**Verified after rebuild**
- 0 unpublished names left on built pages (scan of all 45 sites, published
  names masked).
- 0 pages with 24/7, hours, free estimates, licensed & insured, brand chips,
  same-day, or catalog blurbs. Remaining "Broken Spring Repair" /
  "Off-Track Door Repair" / "Tune-Up" strings are the exports' own H1/title text.
- QA: 3,530 pages, 0 dead links. SEO: 45/45 clean.

### Name scrub follow-up: markdown lists (2026-09-13, user report)
- **Bug:** Duncanville /service-areas/ "The Area and Its Housing" is an
  authored markdown list (`- **Glenn Heights** (18 mi)`). Removing only the
  name left `- **** (18 mi)` rows.
- **Fix, in `clean()`:**
  - Collapse emptied emphasis/link wrappers (`****`, `____`, `[](url)`).
  - Drop whole list items and table rows left with no name, only a distance
    or parenthetical.
- **Trap:** a single-star pair pattern `\*[ \t]*\*(?!\*)` was tried and
  removed. It matches every `**` opener, so it stripped bold from the names
  that remain. Do not add it back.
- **Result:** Duncanville's list shows only its 6 published suburbs. A scan of
  every page of all 45 sites finds no `****`, empty `<strong>`, list items
  starting with "(" or punctuation, empty links, or empty table cells.

### PUBLISHED: all 45 sites (2026-09-13, user request)
User: "push all updated in main branch then create PR with production branch then merge ... use lovable-otz", paced 4 sites per minute.
- **Per site:** dist/<site> got a fresh .git, fetched origin/main, then
  `reset --mixed` onto it, so the push is a FAST-FORWARD on top of the
  existing history. Never forced.
- **Commit:** "Update content, routes and design fixes" plus the Co-Authored-By trailer.
- **PR `main -> production`:** squash-merged with the same one-line title and
  an empty body. production's head message is exactly that one line on all 45.
- **Auth:** lovable-otz token passed as an extraheader / API header file in
  the scratchpad, deleted after the run. Script: scratchpad publish_site.sh.
- **Result:** Duncanville PR #2 (pilot), then 44/44 OK with 0 failures.
- **Deletions:** only the old /resources/ and /services/ dirs (retired routes)
  were removed from main. The deploy workflow lives on production only and
  was untouched.
- **Deploy verified the same day:** for all 45, the production-head run has
  `build-and-upload` and `notify` both completed/success.

### Lodi service-areas: orphan distances (2026-09-14, user request, THIS SITE ONLY)
Lodi's "The Area and Its Housing" is an inline comma list, "Name (3 mi NNW), Name (6 mi), ...". Removing only a name left its "(N mi)" behind:
"Ordered by distance from Lodi: (3 mi NNW), Woodbridge (4 mi) (6 mi) ...".
- **Fix:** in `scrubUnpublishedNames` clean(), the removed-name pattern `P`
  now also takes the name's own trailing parenthetical.
- **Result:** "Ordered by distance from Lodi: Woodbridge (4 mi), Collierville
  (6 mi), Lockeford (8 mi), Dogtown (10 mi), Galt (10 mi), Thornton (10 mi),
  Country Club (11 mi)." Lodi QA: 90 pages, 0 dead links, 0 orphan "(N mi)".
- **Scope:** ONLY Lodi was rebuilt, as the user asked. Other sites' `dist/`
  output is unchanged, but the engine rule is shared, so any other site picks
  it up the next time it is rebuilt.
- **Status:** not committed or pushed.
- **Follow-up, same day ("dont show this section distance like this plain text"):**
  `distanceListsToBullets()` in src/content/index.js is gated by
  `DISTANCE_LIST_SITES` (Lodi only). It turns an authored inline run of 3 or
  more "Name (N mi…)" items into the intro sentence plus one markdown bullet
  per place, "- **Name** (N mi)" (the shape Duncanville's export already
  authors). Lodi now renders "Ordered by distance from Lodi:" followed by 7
  bullets. Only Lodi was rebuilt; QA 90 pages, 0 dead links. To extend it to
  another site, add that domain to the set and rebuild only that site.

### Madison hero stats `oversized-index`: index numbers overlapping (2026-09-14, user request, this site only)
- **Bug:** the `01–04` counter was absolutely positioned behind each stat, at
  3.2rem in a 2.7rem gutter, so it ran into the value ("01 280,305").
- **Fix, css.js:** `::before` is now a static block above the value
  (1.1–1.4rem, opacity .45) with no left gutter, and the mobile rules match.
- **Scope:** Madison is the ONLY site using `hero__stats--oversized-index`
  (its home page only), so the variant fix changes no other site. Only
  Madison was rebuilt. QA: 73 pages, 0 dead links. Not pushed.
- **Follow-up, same day ("dont need to show 1, 2, 3, 4 ... add overlay"):**
  - The index counter is removed (`::before{content:none}`, desktop and mobile).
  - Madison's `hero--diagnostic-panel` hero gets a dark left-to-right
    gradient overlay on `.hero__bg::after` (.86 to .5) plus a text-shadow on
    the h1, subheading, badge and stats.
  - Scoped with `.hero:has(.hero__stats--oversized-index)`, which only Madison
    matches, so no other hero is touched.
  - Only Madison rebuilt; QA 73 pages, 0 dead links. Not pushed.
- **Follow-up 2, same day ("image are not properly visible"):**
  - **Cause:** two overlays were stacked, the variant's flat
    `.hero--diagnostic-panel::before` (.6) plus the new gradient.
  - **Fix:** for Madison only
    (`.hero--diagnostic-panel:has(.hero__stats--oversized-index)`), the flat
    layer is transparent and one gradient remains: .70 at the left edge,
    .45 mid, .12 at 80%, clear on the right.
  - **Scope:** Kansas City Co and Longmont also use diagnostic-panel, but not
    the oversized-index stats, so the selector does not match them and their
    builds were not touched.
  - Only Madison rebuilt; not pushed.

### Murfreesboro hero: equal height, photo no taller than colour block (2026-09-14, user request, this site only)
- **New site hook:** `<html data-site="<domain>">` is now emitted by
  renderDocument (layout.js). A site's HTML only gains it when that site is
  rebuilt. Use it for true per-site CSS when a variant is shared.
- **Bug:** `hero--color-block-split` (shared with Kansas City Pros) let the
  photo's own min-height outgrow the colour block on inner pages.
- **Fix, scoped `[data-site="murfreesborogaragedoorco.com"]`:**
  - The grid stretches both halves to one min-height of
    clamp(460px,58vh,560px).
  - The media image is absolutely filled with object-fit:cover.
  - On mobile, the photo keeps its own clamp height.
- **Scope:** only Murfreesboro was rebuilt; QA 0 dead links. Not pushed.
- **Follow-up, same day:**
  - **Real cause of the "taller" photo:** the GSAP entrance scaled
    `.hero__media` to 1.028; the heights were already equal. The media now
    gets `transform:none!important`.
  - **Varying heights:** hero height varied per page (542-765px) because copy
    length varies. The grid is now a FIXED `height:680px` with overflow
    hidden; 680 is the tallest copy measured, 669px. Mobile stays
    `height:auto`.
  - **Verified on all 73 hero pages** (sitemap, iframe sweep):
    - 1440: every grid is 680px, copy and media heights equal, 0 clipped
      headings, 0 overflow.
    - 375: 0 clipped, 0 overflow.

### Miami inner hero: "All services" ghost button invisible (2026-09-14, user request, this site only)
- **Bug:** on `hero--text-only-underline` inner pages (photo background,
  dark theme), the ghost button rendered as purple text on a near-transparent
  fill, so it read as plain text.
- **Fix, scoped `[data-site="miamigaragedoorco.com"] .hero .btn--ghost`:**
  14% white fill, white text, 2px white border, small shadow. On hover it
  turns into a solid white button with primary-coloured text.
- **Scope:** Miami has 94 pages with this button. Only Miami was rebuilt;
  QA 0 dead links. Not pushed.

### PUBLISHED 2026-09-14: Lodi, Madison, Miami, Murfreesboro ("Fix hero and service-area sections")
Same flow as before: push main, open a PR to production, squash-merge with a one-line title. One new trap came up.

**Squash-merge divergence (read before the next PR on ANY site).** Every
`production` so far was squash-merged, so production holds commits main
lacks. The second PR on a site then reports **"Pull Request has merge
conflicts"** (Lodi PR #5).
- **Doesn't work:** a textual `git merge -X ours origin/production`. It
  fails on rename detection, because the retired /services/ and /resources/
  pages look like renames.
- **Fix:** build the sync commit with plumbing, before pushing:
  1. tree = today's build + the files ONLY production has
     (`.github/workflows/deploy.yml`, `build-upload-s3.sh`)
  2. `git write-tree`, then `git commit-tree -p <build> -p origin/production -m "Sync production into main"`
  3. `reset --soft` onto it
- **Guard:** abort if the sync changes any file other than those two.
- **Safe:** deploy.yml triggers only on push to `production`, so its presence
  on main does not deploy.
- **After merge:** `production^{tree} == main^{tree}` verified on all 4, and
  the workflow is still on production.
- **Script:** the scratchpad publish_site.sh does this automatically when
  production is not an ancestor of HEAD.
- **Result:** Lodi PR #5 (main pushed first, then synced), Madison PR #5,
  Miami PR #6, Murfreesboro PR #7, all merged.

### Review status (2026-09-14): all 45 sites manually checked by the user
- **Checked:** the user reviewed every site. The 25 on ports 8901–8925 came
  first; Lodi, Madison, Miami and Murfreesboro followed after their fixes
  deployed. The remaining 16 had no issues and needed nothing pushed.
- **Index labels:** the local index (`scripts/serve-all.mjs`, `CHECKED` set)
  labels all 45 as "✓ Checked".
- **Ports:** alphabetical by domain; the index displays cards date-grouped.

### New batch pulled (2026-09-14): 16 Shahin sites with Update Date 9/14/2026
Sheet check found 80 Shahin rows: 45 already built (Update 9/13), 16 new
(Update 9/14, Status Assigned), and 19 Production rows with no update date,
which were not touched.
- **Pulled:** each `content` branch as lovable-otz (depth 1, .git removed)
  into `contents/<city>-<state>/`. All content commits are dated 2026-09-13.
- **Backup:** older copies of these 16 folders already existed and were
  tarred to the scratchpad before being replaced.
- **Sites** (service-lines / suburb-services files):

  | Site | Service lines | Suburb services |
  |---|---|---|
  | phoenix-az | 8 | 56 |
  | parma-oh | 8 | 48 |
  | reynoldsburg-oh | 8 | 48 |
  | orlando-fl | 8 | 56 |
  | raleigh-nc | 8 | 56 |
  | payson-az | 8 | 24 |
  | pasadena-ca | 8 | 40 |
  | prosper-tx | 8 | 56 |
  | petaluma-ca | 8 | 32 |
  | pittsburgh-pa | 8 | 56 |
  | reno-nv | 8 | 32 |
  | philadelphia-pa | 8 | 56 |
  | rochester-hills-mi | 8 | 32 |
  | rockwall-tx | 8 | 64 |
  | prescott-valley-az | 8 | 40 |
  | port-huron-mi | 7 | 42 |

- **Folders:** all 16 have 01–07 folders.
- **Status:** not generated yet, nothing pushed.
- **Before generating:** several of these (Phoenix, Raleigh, Orlando,
  Pasadena...) are already LIVE from an older engine. Check each repo's
  branches and the registry pin before building, as with the 45.

### New batch GENERATED (2026-09-14): the 16 sites with Update Date 9/14/2026
All 16 were already in the registry and live on the old routes, so they were
built exactly like the 45: `node scripts/repin.mjs --allow-frozen <16 exact
domains>` (design pinned, new content, routes v2, every engine rule since).
- **Checks, all clean:**
  - QA: 16 sites, 1,290 pages, 0 dead links, 0 broken images, 0 missing alt.
  - SEO files: 16/16 clean.
  - Quote form: real form on 61/61, 0 lazy iframes.
  - Services = 02-service-lines on every site (Port Huron 7, all others 8).
  - Suburbs = exactly the 07-suburb-services set: Payson 3; Petaluma, Reno
    and Rochester Hills 4; Pasadena and Prescott Valley 5; Parma,
    Reynoldsburg and Port Huron 6; Phoenix, Orlando, Raleigh, Prosper,
    Pittsburgh and Philadelphia 7; Rockwall 8.
  - 0 old route dirs (/services/, /resources/, /book/).
  - 0 fake-claim strings, 0 unpublished suburb names left, 0
    list/bold artifacts.
- **Name scrub:** 6,086 mentions removed; 2 FAQ questions dropped
  (Philadelphia, Raleigh).
- **Slug clashes (reported, not errors):** Philadelphia 5, Pittsburgh 1,
  Rochester Hills 2.
- **Ports:** all 16 sort after oremgaragedoorpros.com, so the local server
  keeps the existing 45 ports (8901–8945) and serves them on 8946–8961.
- **Status:** not yet responsive-swept or visually checked. Not committed,
  not pushed.
- **Home-page card checks on the 16 (1440px), 2026-09-14:**
  - 14 sites: "Learn more" aligned to 0px in every row, and no
    horizontal overflow.
  - **Card skins no site had used before:**
    - `svc--text-list` (Phoenix): 21/9 photo strips (ratio 2.33) and
      "Learn more" rows off by 24/19px.
    - `svc--bordered-badge` (Rockwall): "Learn more" rows off by 45/25px.
    - The all-variant Learn-more pass had skipped both skins because no
      site used them.
  - **Fix, variant-level (only Phoenix and Rockwall use these skins):**
    - text-list photos changed to 16/10.
    - Both skins now get the flex column plus `.svc__more{margin-top:auto}`.
  - Both sites rebuilt: 189 pages, 0 dead links. Not pushed.
- **Remaining checks on the 16, 2026-09-14:**
  - **Hero clipping at 320px:** 0 clipped on all 16. Phoenix and Reynoldsburg
    read -54 (narrower circle media); Pittsburgh and Raleigh are text-only.
  - **Responsive sweep:** complete, 7,740 page × viewport checks, 0 overflow,
    0 small taps, 0 small text on every site.
- **Status:** local only; not committed, not pushed. The site index labels
  the 16 "Not checked" (ports 8946–8961).

### Orlando quote-page call button + base-name gap in the name scrub (2026-09-14)
**Call button (Orlando only, user request).** The quote page's "Prefer to talk? (321) 325-5496" was a plain inline link.
- **Fix:** scoped `[data-site="orlandogaragedoorpros.com"] .quote-copy__call a`,
  a pill button in the primary colour with white text, a masked phone icon,
  46px min height.
- **Verified:** 185x50 on desktop and at 375px, and no horizontal overflow.

**Base-name gap (found while checking that page).** Orlando's unpublished
neighbourhoods are "Lake Nona Central / Estates / Region / South", but the
prose says just "Lake Nona". The scrub (and the leftover-name QA scan) only
knew full names, so "Lake Nona" stayed.
- **Fix, in `scrubUnpublishedNames`:** also drop any leading run of 2+ words
  shared by 2+ dropped names, unless it is part of (or contains) a published
  name or the city.
- **Scan of all 61 builds:** only Orlando (Lake Nona, 62 mentions) and
  Pittsburgh (Squirrel Hill, 89), both in the unpushed 16-site batch, so none
  of the 45 live sites were affected.
- **Rebuilt Orlando and Pittsburgh:** 0 leftovers, 0 artifacts, QA 190 pages
  with 0 dead links, SEO clean. Orlando dropped 1 more FAQ that only named
  Lake Nona.
- **Next time:** the leftover-name QA scan must include these shared base
  names too.
- **Follow-up, same day ("many others sites for the new 16 batch got this issue"):**
  - The call-button rule now applies to all 16 sites of the 9/14 batch: the
    selector is `:is([data-site="<each of the 16>"]) .quote-copy__call`,
    replacing the Orlando-only selector.
  - The 45 live sites are untouched and were not rebuilt.
  - All 16 rebuilt with repin. QA: 1,290 pages, 0 dead links. The button CSS
    is present in every quote page.

### wide-spaced service cards on the 9/14 batch (2026-09-14, user request, new sites only)
Pasadena's cards were tall and thin: a narrow inset photo, an icon tile under it, and a long unclamped blurb.
- **Fix, scoped
  `:is([data-site="pasadenagaragedoorpros.com"],[data-site="paysongaragedoorpros.com"],[data-site="renogaragedoorpros.com"]) .svc--wide-spaced`:**
  - Card padding changed to 0 / 1.2rem bottom.
  - The photo runs edge to edge at 16/10 (object-fit cover).
  - The icon tile is hidden.
  - Heading, blurb and link are inset 1.25rem, and the blurb is clamped to 3 lines.
- **Scope:** Payson and Reno are the other new sites on this skin. Daphne and
  Loveland (live) also use wide-spaced and were NOT touched or rebuilt.
- **Status:** the 3 were rebuilt; QA 190 pages, 0 dead links. Not pushed.

### Reno hero: same equal-height fix as Murfreesboro (2026-09-14, user request, this site only)
Reno also uses `hero--color-block-split`. The copy block and photo were misaligned (the photo was taller, and the entrance scale was active).
- **Fix:** the 8 Murfreesboro-scoped selectors now read
  `:is([data-site="murfreesborogaragedoorco.com"],[data-site="renogaragedoorpros.com"]) .hero--color-block-split`,
  so Reno gets the same rules: fixed 680px grid on desktop, both halves
  stretched, image absolutely filled, media `transform:none`, and on mobile
  `height:auto` with the photo at its own clamp height.
- **Scope:** only Reno was rebuilt. Murfreesboro's local dist is unchanged
  (0 changed files); its CSS output is identical anyway.
- **QA:** Reno 0 dead links. Not pushed.

### Responsive re-sweep of the 16-site batch after today's fixes (2026-09-14)
Re-run after the rebuilds for the call button (all 16), wide-spaced cards (Pasadena, Payson, Reno), the Reno hero, and the name-scrub base names (Orlando, Pittsburgh).
- **Responsive sweep:** all 16 complete, 7,740 page × viewport checks, 0
  overflow, 0 small taps, 0 small text.
- **Hero at 320px on the rebuilt sites:** Orlando, Pasadena, Payson, Reno and
  Rockwall clip 0. Phoenix reads -54 (narrower circle media, not clipped).
  0 horizontal overflow.
- **Status:** not committed, not pushed.

### Publish attempt for the 16-site batch stopped safely (2026-09-14)
The first run stopped at Orlando: `FAIL sync changed site files: assets/img/...`. Nothing was pushed; main is unchanged on all 16 remotes.
- **Cause:** a bug in the scratchpad `publish_site.sh`. The production-only
  file list was computed against the local HEAD (today's build) instead of
  `origin/main`. Today's build deletes old images that main still has, so
  they looked production-only, were restored into the sync tree, and tripped
  the guard. The guard worked as intended.
- **Fix:** production-only = `ls-tree origin/main` vs
  `ls-tree origin/production`. On all 16 repos that is exactly
  `.github/workflows/deploy.yml` and `build-upload-s3.sh`.
- **Check-script trap:** the post-run deploy poller also printed "LIVE" for
  the OLD production head, because nothing had merged. Only report a deploy
  as confirmed when its production head message is the new merge title.

### PUBLISHED 2026-09-14: the 16-site batch, but NOT DEPLOYED (runners offline)
Rerun with the fixed script, 4 per minute. All 16 were pushed to main (with the sync commit) and squash-merged into production as "Update content, routes and design fixes". PRs:

| Site | PR |
|---|---|
| Orlando | #5 |
| Parma | #5 |
| Pasadena | #6 |
| Payson | #2 |
| Petaluma | #4 |
| Philadelphia | #4 |
| Phoenix | #5 |
| Pittsburgh | #5 |
| Port Huron | #2 |
| Prescott Valley | #2 |
| Prosper | #2 |
| Raleigh | #6 |
| Reno | #5 |
| Reynoldsburg | #5 |
| Rochester Hills | #2 |
| Rockwall | #2 |

**Deploy status:**
- Every run for the new production heads is still `queued`, 46–55 minutes
  after merge.
- **Root cause:** all 3 org self-hosted runners
  (`ot-general-*`, labels self-hosted/Linux/X64/ot-general) report `offline`
  on `GET /orgs/OrangeToolzBD/actions/runners`.
- **Also queued:** this morning's 4 merges (Lodi, Madison, Miami,
  Murfreesboro, "Fix hero and service-area sections") have been queued for
  ~266 minutes. They have NOT deployed, even though the user believed they
  had.
- **Last successful deploys** seen in the sample: 2026-09-13 ~12:13–12:47Z,
  the 45-site batch.
- **Nothing to re-push.** The runs start when a runner comes back online.
  GitHub cancels a job still queued after 24 hours; if that happens,
  re-trigger via workflow_dispatch (needs user OK).
- **Deploy confirmed 2026-09-15:** 3 new org runners came online
  (`…VbzW0`, `…PMQNi`, `…hls0V`); the 3 old ones are still offline.
  - The queued runs executed on 2026-09-14 between 13:36 and 13:56 UTC.
  - `build-and-upload` succeeded on the new production head for all 20
    sites: the 16-site batch plus Lodi, Madison, Miami and Murfreesboro.
  - All 20 are LIVE.

### New batch pulled (2026-09-17): 26 sites with Update Date 9/17/2026
**Scope rule (user):** rows with Assigned = Shahin, PLUS Ruhul's rows where
column L (no header) = shahin. Column L splits Ruhul's rows between team
members (iftekhar, Setu, shahin).
- **Sites:** 19 Shahin rows (the former no-update-date Production rows, now
  Assigned) and 7 Ruhul rows marked shahin: Tulsa, Southlake, Santa Maria,
  Tempe, Wichita, Spokane, Stillwater OK.
- **Pulled:** each `content` branch as lovable-otz into
  `contents/<city>-<state>/`, all 7 folders present. The 19 older copies were
  tarred to the scratchpad first.
- **Contacts:** all 26 have a contact row in config/business-contacts.js.
- **Re-check:** the user then said all 26 content branches were updated.
  `ls-remote` showed every content head identical to what was just pulled, so
  the pull already holds the updated content.
- **Status:** not generated, nothing pushed.

### Shahin's 19 (9/17 batch) GENERATED (2026-09-17)
Built with `repin.mjs --allow-frozen <19 domains>`. All 19 are in the registry and live on the old routes; the design is pinned.
- **Checks, all clean:**
  - QA: 1,502 pages, 0 dead links, 0 broken images.
  - SEO: 19/19 clean.
  - Quote form: real form on 80/80, 0 lazy iframes.
  - Services and suburbs exactly match the content folders (02 and 07).
  - 0 old route dirs, 0 fake claims, 0 artifacts.
  - 0 unpublished suburb names, including shared base names.
- **Toms River false positive:** 74 "Lakewood" hits are all the business
  address "1863 Lakewood Rd", which is correct business data.
- **User instruction:** "dont push anything without my confirmation".
- **Local server ports are now persisted** in `dist/_reports/ports.json`:
  - The existing 61 keep 8901–8961 (seeded alphabetically from sites dated
    <= 2026-09-14).
  - New sites take the next free port: the 19 are on 8962–8980, alphabetical
    within the batch.
- **Visual and responsive checks on the 19, 2026-09-17:**
  - **Home cards at 1440:** "Learn more" aligned in every row, card photo
    ratios normal. Skins include text-list and bordered-badge, already fixed
    variant-wide.
  - **Responsive sweep:** 9,012 page × viewport checks, 0 overflow, 0 small
    taps, 0 small text.
  - **Hero at 320px:** 0 clipped, except Springfield MA (8968) at +12px.
- **Open, reported to the user and NOT fixed** (both earlier fixes were scoped
  per site/batch):
  1. `hero--color-block-split` on Springfield MA (8968) and Strongsville
     (8970): the entrance scale makes the photo taller than the copy block
     (1.05–1.06), the same issue fixed for Murfreesboro and Reno.
  2. The quote page's "Prefer to talk?" number is plain text on these 19; the
     call-button rule is scoped to the 9/14 batch's 16 domains.
- **Both open issues FIXED 2026-09-17 (user: "fix these two issues"):**
  1. The color-block-split hero scope now also includes
     springfieldgaragedoorco.com and strongsvillegaragedoorpros.com: fixed
     680px desktop grid, stretched halves, `transform:none` on the media, and
     the mobile photo clamp.
  2. The quote-page call-button `:is()` scope grew from 16 to 35 domains
     (the 9/14 batch plus these 19).
  - Only the 19 were rebuilt. QA: 1,502 pages, 0 dead links, SEO 19/19 clean.
  - The button CSS is in all 19 quote pages. The 9/14-batch and live sites
    are unchanged (0 changed files).
  - Not pushed.
- **Follow-up, same day:** at 320px Springfield MA's hero photo was still 332px
  wide. `transform` was already none; the cause was the grid column's
  min-content (the long uppercase heading word "SPRINGFIELD" plus padding).
  - **Fix,** in the scoped mobile block: `grid-template-columns:minmax(0,1fr)!important`,
    `.hero__copy{min-width:0}`, `h1{overflow-wrap:anywhere}`.
  - Springfield MA and Strongsville rebuilt; QA 0 dead links.

### Ruhul's 7 sites: template rebuild (2026-09-17). Tulsa built, the other 6 waiting on user review
**Background.** These 7 (Ruhul rows marked shahin in column L) were designed
by RUHUL's engine. Only its built static output is in each repo's `main`
("Publish built static site", 30 Aug–3 Sep); his engine code is not there.
Design system: `/assets/site.css` + gsap/ScrollTrigger/anim.js/nav.js, body
classes `lay-nav-* lay-bands-* shape-*`, hero variants
`hero--split|banner|overlap|stacked`. None of the 7 are in our design
registry, so `repin.mjs` does not apply.

**User decisions, via AskUserQuestion:**
- Keep his layout, with neutral text in place of his built-in claims:
  same-day, licensed & insured, upfront pricing, free quote, real reviews,
  "recent projects".
- Same routes and labels as our sites (/<city>/…, /service-areas/, /blog/,
  "Blogs").
- Tulsa first, then the other 6.

**Tool: `scripts/ruhul-rebuild.mjs --domain <d> --template <clone of main>`.**
- **Templates:** his own pages, per page type: home; inner article
  (services/*); tiles index (service-areas/index); cards index
  (services/index); blog index (guides/index); page-hero pages (about, faq,
  contact, privacy, terms, accessibility); the quote page, whose GHL form is
  kept verbatim.
- **Content:** from our `resolveContent()`, so all of our rules apply.
- **Page substitutions:** head meta and JSON-LD (our schema.js), mega nav,
  footer columns, top bar, hero (h1/lead/img/badge/chips), crumb, article
  body plus FAQ, qcard, CTA band.
- **Home substitutions:** trust, scards, sd, feats, steps, gallery, areas,
  hc-rows, faq.
- **Suburb pages:** get a "services in <suburb>" tiles section in his tile markup.
- **Output:** `dist/<domain>-<city>/` with a `.template-rebuild.json` marker.
  serve-all.mjs discovers marker sites; ports are persisted.
- **Photos:** card photos come from a de-duplicating pool (svc-*,
  inner-garage-door-*, gal-*).
- **Self-check:** prints claim words (authored content included) and
  old-route link count.

**Tulsa result (port 8981):**
- 80 pages: 8 services, 6 suburbs, 48 suburb-service pages, 7 blogs.
- 0 old-route links.
- QA: 0 dead links, 0 broken images, 0 duplicate images; SEO clean.
- site.css, anim.js, nav.js and gsap are byte-identical to live, and the body
  classes are identical.
- Responsive sweep 480/480 clean.
- Template-owned claim text: 0. The remaining "same-day"/"upfront" words
  are inside authored content.
- Not pushed.
- **Fix, 2026-09-17 ("Where We Work this section of tulsa has issues"):**
  - **Bug:** on the home page the areas section lost its tier heading and the
    `div.areas` link wrapper. The tier substitution regex
    `<div class="areas[^"]*">` matched `<div class="areas-tier">` first,
    which also shifted the closing divs.
  - **Fix:** the regex is now `class="areas(?: [^"]*)?"`.
  - **Rebuilt Tulsa:** section markup identical in shape to his (tier h3
    "Nearby communities" + 6 link pills + "View all areas"); tag balance
    check (div/section/a/ul/details) passes on all 80 pages; QA 0 dead
    links; no overflow at 375px.
  - The `/tulsa/` hub's "Where We Work" tiles section was already correct.
- **Fix, 2026-09-17 ("take the full width why 2 lines"):** his
  `.areas-tiers` is `grid-template-columns:1fr 1fr` (max 960px), meant for
  two tiers (city neighborhoods | nearby suburbs). With only the published
  suburbs there is one tier, which sat in the left half and wrapped to 2
  rows. The single tier now gets inline `style="grid-column:1/-1"`;
  site.css is still byte-identical. Tulsa rebuilt, QA 0 dead links.

### PUBLISHED + DEPLOYED (2026-09-17): Shahin's 19 (9/17 batch)
User: 3 sites per minute; Ruhul's 7 NOT pushed.
- **Script:** `scripts/publish-site.sh`, now kept in the repo because the
  scratchpad copy was wiped. It pushes main, adds the sync commit when
  production diverged, opens a PR to production and squash-merges with
  "Update content, routes and design fixes".
- **Result:** 19/19 merged, 0 failures.
- **PRs:**

  | Site | PR |
  |---|---|
  | Abilene | #4 |
  | San Diego | #5 |
  | San Marcos | #4 |
  | Santa Monica | #5 |
  | Searcy | #5 |
  | Spanish Fork | #2 |
  | Springfield MA | #2 |
  | Springfield IL | #5 |
  | Strongsville | #3 |
  | Sun Prairie | #2 |
  | Texas City | #2 |
  | Toms River | #5 |
  | Tracy | #4 |
  | Venice | #5 |
  | Vernon Hills | #2 |
  | Weatherford | #4 |
  | Wenatchee | #4 |
  | West Bend | #2 |
  | Youngstown | #5 |

- **Deploy:** `build-and-upload` succeeded on the new production head for all 19.

### Ruhul's other 6 GENERATED (2026-09-17). Not pushed
User: "now generate ruhul remaining sites, dont push and follow each site design pattern".
- **Built:** `ruhul-rebuild.mjs`, each site from ITS OWN main clone, so layout classes, hero variant and site.css stay per site:
  - Southlake (8983): overlap hero
  - Santa Maria (8982): split
  - Tempe (8986): banner
  - Wichita (8987): split
  - Spokane (8984): banner
  - Stillwater (8985): stacked
- **New template section types handled:**
  - Home services: `.svc-grid > a.svc-card` (Southlake), keeping his icons.
  - Home areas, flat layouts: `.areas` with "View all" inside (Southlake, Stillwater), `.areas-grid > a.area-card` (Tempe) and `.areas-cols > a.area-col-link` (Wichita).
- **Bug fixed, affected Tulsa too:** a `$` in content (e.g. "$142,000") was read as a `$1` replacement token, which corrupted the markup. `esc()` now emits `&#36;`, and the JSON-LD is inserted with a function replacer. Tulsa was rebuilt; the only change is `$` → `&#36;`.
- **Checks on all 7:**
  - QA: 0 dead links and 0 broken images; SEO clean.
  - Tag balance (div/section/a/ul/details/p) holds on all 514 pages, with 0 old-route links.
  - Body classes and site.css match each site's live build.
- **8900 index:** marker sites with designer Ruhul get their own first category, "Ruhul's sites (his design)". Ports: Tulsa 8981, then 8982–8987 alphabetical.
- **2026-09-17, all 7 Ruhul sites (user):**
  - Suburb pages (/<city>/<suburb>/) now show the "Garage door services in <suburb>" tiles right under the hero (`extraTop`), no longer above the CTA band.
  - Tile cards (`a.feat`) no longer underline on hover. His site.css has a global `a:hover{text-decoration:underline}`, so a small inline `<style>` in each page's head overrides it for the tiles; site.css stays byte-identical.
  - QA: 0 dead links on all 7. Not pushed.

### PUBLISHED + DEPLOYED (2026-09-17): Ruhul's 7
User confirmed. Pushed with `publish-site.sh`, 3 sites per minute, from copies without `.template-rebuild.json`. Each site's PR #1 was squash-merged with the title "Update content, routes and design fixes", and all 7 "Build and Deploy to R2" runs succeeded.

## 2026-10-12 — quote form, footer, QA hardening (engine-wide)
- Footer: no FAQ link. Quote page "Prefer to talk?" is a real button (`.quote-call-btn`, 48px).
- Every site embeds GHL form `9edkR66EHmW5UBwtrYry` ("Contact Us | Garage Door", height 1336) via `config/quote-form.js` + `normalize.js`; full GHL data-* attributes on the iframe, `form_embed.js` loaded.
- Responsive: every single-column `grid-template-columns:1fr` is now `minmax(0,1fr)` (a bare 1fr can't shrink below min-content → 320px overflow on contact/quote/process grids). Headings get `overflow-wrap:break-word`. `.hero__stats--divided` wraps ≤900px; `--minimal-text-row` always wraps. Split-duotone CTA buttons wrap on phones.
- Contrast: mutedText targets 4.8 (headroom over tinted panels); dark/brand section text 92%; stat labels and hero chips full opacity; ghost-frame CTA text mixes muted→text; shadow-stack step numbers 78%; `proc-stack__n` watermark is `aria-hidden`.
- Footer brand = logo + business name (like the header), logo `alt=""`.
- Mid-page `cta-banner--bold-strip`: text + buttons stacked and centred.
- Quote form: the 1336px floor is released once form_embed.js sizes the iframe (`.ghl-embed.is-sized`) - no white tail.
- Suburb×service pages: `#related` is now "Also in <suburb> / More garage door services in <suburb>", rendered with the site's own services() card variant (id="related"). No "Nearby" label, no zoom-out link strip (removed by user).
- `trustbar--quiet-editorial`: centred flex row, each item one line (`white-space:nowrap`), font clamp(.95rem,1.15vw,1.08rem); stacks on ≤720px. Used by Chandler, Kalispell.
- Coverage (`areas`) variant `quiet-editorial` RETIRED (user, Chandler): removed from the pool; `RETIRED_SECTION_VARIANTS` in variation.js remaps any pinned site to `map`/`directory` on rebuild. Chandler now `map`, Jackson `directory`. 5 delivered sites (newark, manhattanbeach, springfield, weatherford, sunprairie) still carry it in the registry and will be remapped automatically if ever rebuilt.
- **LOCKED: hendersongaragedoorpros.com** (user 2026-10-12). `config/locked-sites.js`; CLI refuses it and batch.js skips it unless `--unlock hendersongaragedoorpros.com`. Never rebuild or edit it without the user's explicit instruction for that site.
- Mid CTA `cta-banner--filled-brand` redesigned (user, Chandler): split banner, 2-line message left + buttons right, corner glow, no clip-path notch; stacks + centres ≤1100px; text clamp(1.15rem,1rem+1vw,1.65rem). Sites: chandler, daytonabeach, desplaines, fayetteville, kalispell, longview.
- Blog cards (`.post-card`, homepage + blog index): equal height, "Learn more →" (was "Read guide →") pinned to the card bottom. Henderson got ONLY this change, patched directly into its dist files (user-approved 2026-10-12) - a full rebuild would also have reshuffled its service images. Henderson is still locked.
- Homepage About (`.home-about .prose-media`): ≤1024px stacks photo on top (16:9) then text; desktop keeps side-by-side alternating. Henderson got only this CSS rule, patched into its dist files (user-approved).
- **LOCKED: chandlergaragedoorco.com** too (user 2026-10-12, manually checked). Same rules as Henderson.
- Hero stats `hero__stats--boxed-grid-table` (user, Georgetown): glass panel (rgba(10,12,16,.62)+blur) on dark heroes / solid surface elsewhere, one row on desktop (auto columns for any count), 2x2 tablet + phone, centred cells, labels full opacity. Only Georgetown uses it among the 22.
- Hero `diagnostic-panel` (Georgetown, Lehigh Acres): min-height clamp(600px,85svh,900px), content vertically centred (phones clamp(520px,78svh,720px)). Do NOT set width on `.hero > .container` - `.container` sizes itself via `width:var(--container)`; overriding it made the hero full-bleed (fixed same day).
- Dark photo heroes (fullbleed-dark, text-only-underline, diagnostic-panel): `.hero__cta .btn--ghost` is white text/outline on a light glass fill (was brand-red on 6% tint, near-invisible). Sites: georgetown, lehighacres, daytonabeach, jackson.
- **LOCKED: georgetowngaragedoorpros.com** too (user 2026-10-12).
- Stats `ring` variant (.stats-ring) redesigned (user, Addison): 4 equal columns (2x2 ≤820px), 148px filled disc with conic brand-gradient ring (124px on ≤560px), icon INSIDE the disc above the number (.sr-n), full-colour label. Sites: addison, elizabethtown.
- Ring stats follow-up: icon is a real round chip in the disc (2.9rem, 26px glyph; 2.35rem on ≤560px), disc 160px (124px ≤560px); `.sr-cell:hover .sr-circle .stat-ic` fills the chip (no scale) - the shared `.sr-cell:hover .stat-ic` fill on a bare glyph was the "hover bg issue".
- Inner pages with a sidebar (`.content-layout .content-main .prose-block`): no 68ch cap - text fills the main column (gap to sidebar = the 48px grid gap, was ~340px). Full-width pages keep 68ch. Also patched into locked henderson/chandler/georgetown dist files (user-approved, rule only).
