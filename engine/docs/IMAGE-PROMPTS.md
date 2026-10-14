# Image generation prompts - garage-door photo library

Prompts for generating new photos for the engine's local photo library, organised
by the folder each image goes into and the page sections that folder feeds.

Written 2026-10-07 from the engine's actual photo logic (`config/local-photos.js`,
`src/assets/images.js`) and the current library on disk.

---

## 1. How the engine uses photos

### Library location

```
images/                                   (project root, next to engine/ - NOT in git)
└── GARAGE DOOR-SECTIONSWISE-PHOTO/
    └── GARAGE DOOR/
        ├── GD HERO/
        │   ├── v1/          30 photos, named by city: charlotte_garage_door.webp
        │   └── v2/          20 photos: garage-door-hero 31.webp ...
        ├── GD SERVICE/      38 photos: garage-door-service 1.webp ...
        ├── GD REPAIR/       49 photos: garage-door-repair 1.webp ...
        ├── GD INSTALLATION/ 38 photos
        ├── GD MAINTENNANCE/ 40 photos   (folder name is misspelled - keep it, the engine reads this exact name)
        └── GD GUIDE/        5 topic subfolders x 10 photos (fallback pool only)
```

Only `.webp` files are read. New files are picked up automatically on the next build;
no code change is needed.

### Which section uses which folder

| Page section / slot | Folder it draws from | Rendered size (crop) |
|---|---|---|
| Home + inner page **hero** | `GD HERO` | 1400 x 1000 |
| **About** block | `GD SERVICE` | 1000 x 750 (4:3) |
| **Technician** block | `GD REPAIR` | 1000 x 750 (4:3) |
| **Process step 1** - "Tell us what's wrong" | `GD HERO` (the door / house) | 1400 x 1000 |
| **Process step 2** - "On-site diagnosis" | `GD SERVICE` (tech inspecting) | 1400 x 1000 |
| **Process step 3** - "Clear, up-front plan" | `GD MAINTENNANCE` (hardware / parts) | 1400 x 1000 |
| **Process step 4** - "Repaired & tested" | `GD REPAIR` (the repair itself) | 1400 x 1000 |
| **Gallery** tiles (cycle) | INSTALLATION -> REPAIR -> SERVICE -> MAINTENNANCE -> repeat | 900 x 675 (4:3) |
| **Service page** headers: garage door repair, broken spring, cable, off-track, panel, roller, opener repair | `GD REPAIR` | 1400 x 1000 |
| **Service page** headers: installation, opener installation, door replacement, commercial doors | `GD INSTALLATION` | 1400 x 1000 |
| **Service page** header: maintenance | `GD MAINTENNANCE` | 1400 x 1000 |
| **Service page** header: garage door service, and anything unmatched | `GD SERVICE` | 1400 x 1000 |
| `GD GUIDE` | not read by any slot directly - used only as fallback when a folder runs out | - |

### Selection rules worth knowing

- **No repeats on a page.** Each page tracks the photos it has used; a slot never
  reuses one.
- **Spread across sites.** The engine counts how often each photo has been used
  across all builds and prefers the least-used one. More photos per folder =
  fewer sites sharing the same picture.
- **Fallback.** If a folder is exhausted for a page, the engine takes any unused
  photo from the whole library, then falls back to an illustration.
- **Cropping.** Photos are cropped to the slot shape (see table). A 16:9 source
  cropped to 4:3 loses about 12% on each side, so **keep the subject inside the
  centre 70% of the frame**. Hero photos also carry the headline and buttons on
  one side - leave clean space there.

---

## 2. Output spec (every image)

| Setting | Value |
|---|---|
| Aspect ratio | **16:9 landscape** (matches the whole current library) |
| Size | **1672 x 941** for hero and guide, **1376 x 768** for everything else (either is fine; never smaller than 1376 wide) |
| Format | `.webp`, quality 80-85 |
| File size | aim for 150-400 KB |
| Naming | continue the folder's numbering: `garage-door-repair 50.webp`, `garage-door-hero 51.webp`. Hero v1 style (`<city>_garage_door.webp`) is fine too |
| Placement | drop into the matching folder from section 1 |

---

## 3. Global style rules (add to every prompt)

Paste this block at the end of every prompt:

> Photorealistic, shot on a full-frame DSLR, natural lighting, true-to-life colours,
> sharp focus, realistic textures, 16:9 landscape. No text, no captions, no logos,
> no brand names, no company names on clothing or vehicles, no watermarks, no
> readable license plates, no house numbers.

Negative prompt (for tools that support one):

> text, letters, words, logo, watermark, brand name, signage, cartoon, illustration,
> 3D render, CGI look, oversaturated, HDR halo, distorted hands, extra fingers,
> warped garage door panels, floating hardware, duplicated rollers, blurry, low
> resolution, people standing under a moving door

### Why these rules

- **Shared library.** Every site uses the same photos, so nothing may identify one
  business (no logos, uniforms with names, branded vans, house numbers).
- **No fabrication.** The engine never invents business facts; a photo showing a
  branded truck or a "24/7" sign would imply a claim.
- **Mechanics must be right** (see the QA checklist in section 6) - homeowners and
  technicians notice wrong hardware immediately.

---

## 4. Prompts by folder

Each folder has 3-6 base prompts. Generate each one several times with the
**variation tokens** in section 5 so the library covers different regions,
home styles and seasons.

### 4.1 `GD HERO` - home page and inner page heroes, process step 1

Heroes sit behind the page headline and two buttons. Every hero needs **clean,
low-detail space on the left or right third** (sky, wall, lawn, driveway).

**HERO-1: Golden-hour house, door closed**
> Wide exterior shot of a well-kept {HOME_STYLE} home with a {DOOR_STYLE} two-car
> garage door, fully closed and perfectly aligned, clean concrete driveway, trimmed
> lawn, golden-hour sun from the side casting long soft shadows, warm inviting mood.
> House and door occupy the right 60% of the frame; the left third is open sky and
> lawn for headline space. Camera at standing height, 24mm lens, slight angle.

**HERO-2: Technician at the open door**
> A garage door technician in a plain navy work shirt and work pants, no logos,
> kneeling beside an open double garage door of a {HOME_STYLE} home, inspecting the
> bottom roller and vertical track with a flashlight. Bright overcast daylight,
> professional and trustworthy. Technician on the right third, face turned toward
> the hardware (not the camera), shallow depth of field, open driveway on the left
> for headline space.

**HERO-3: Dusk, interior light glowing**
> Exterior of a {HOME_STYLE} home at blue hour, garage door half open with warm
> interior light spilling onto the driveway, porch lights on, calm residential
> street, deep blue sky occupying the top-left area for headline space. Cinematic
> but realistic, no people.

**HERO-4: Street-level neighbourhood**
> Eye-level view down a quiet {REGION} residential street lined with homes that each
> have a different garage door, nearest home in sharp focus on the right with a
> {DOOR_STYLE} door, rest of the street softly out of focus, morning light, empty
> road and pavement on the left for headline space, no people, no cars with
> visible plates.

**HERO-5: Close architectural detail**
> Low-angle close crop of a {DOOR_STYLE} garage door's lower panels and the edge of
> the driveway, fresh weather seal on the bottom edge, crisp shadow lines across
> the panels, soft morning light, minimalist and premium. Door fills the right half,
> clean wall/driveway texture on the left.

### 4.2 `GD SERVICE` - About block, process step 2, "garage door service" pages

The "people at work" pool: diagnosis, inspection, talking a homeowner through a
problem. Calm, competent, unhurried.

**SERVICE-1: On-site diagnosis**
> Inside a residential garage, a technician in plain work clothes and gloves
> holding a tablet with a blank screen while looking up at the torsion spring and
> opener rail above a closed sectional door. Tidy garage, LED ceiling light,
> natural daylight from a side window. Technician centred, mid-shot.

**SERVICE-2: Explaining to a homeowner**
> A technician and a homeowner standing in an open garage, the technician pointing
> at the vertical track and rollers while the homeowner listens, friendly and
> reassuring body language, both shown from a three-quarter angle, faces partly
> turned away. {HOME_STYLE} home, daytime, open door framing the driveway behind them.

**SERVICE-3: Balance test**
> A technician lifting a manual garage door halfway by hand to test its balance,
> opener disconnected with the red release cord hanging, focus on hands and the
> door's lower section, residential garage interior, even daylight.

**SERVICE-4: Safety sensor check**
> Close-up of a gloved hand aligning a garage door safety photo-eye sensor mounted
> low on the vertical track, small indicator LED glowing, the other sensor softly
> visible across the opening, concrete floor, crisp detail.

**SERVICE-5: Arriving at the job**
> A technician walking up a suburban driveway carrying a toolbag toward a closed
> {DOOR_STYLE} garage door, seen from behind at a slight angle, plain unbranded
> work van partly visible at the kerb with no text and no plate, morning light.

### 4.3 `GD REPAIR` - Technician block, process step 4, all repair service pages

Covers: general repair, **broken spring**, **cable**, **off-track**, **panel**,
**roller**, **opener repair**. Aim for at least 8 photos per sub-topic.

**REPAIR-1: Torsion spring replacement**
> Inside a residential garage, a technician wearing safety glasses and gloves
> replacing a torsion spring mounted on the steel shaft above a closed sectional
> door, two winding bars inserted in the winding cone, cable drums visible at both
> ends of the shaft, side-window daylight, sharp detail on hands and hardware.

**REPAIR-2: Broken spring (the problem)**
> Close-up of a broken garage door torsion spring on its shaft with a visible gap
> where the coil has snapped, above a closed door in a residential garage, dramatic
> but realistic side light, no people.

**REPAIR-3: Lift cable**
> Close-up of a technician's gloved hands re-threading a steel lift cable onto the
> bottom bracket of a residential garage door, frayed old cable lying on the
> concrete floor beside it, interior garage, daylight.

**REPAIR-4: Off-track door**
> Interior view of a residential garage door hanging crooked, one side's rollers out
> of the vertical track, slight gap at the bottom on one side, technician's ladder
> set up beside it, realistic documentary style, no one standing under the door.

**REPAIR-5: Panel replacement**
> A technician removing a dented bottom panel from a steel sectional garage door,
> new matching panel leaning against the garage wall, hinges and screws laid out on
> a tool mat, open door, daytime, {HOME_STYLE} driveway in the background.

**REPAIR-6: Roller replacement**
> Macro shot of a technician's gloved hand fitting a new nylon garage door roller
> into a hinge bracket, old worn steel roller beside it on the track, shallow depth
> of field.

**REPAIR-7: Opener repair**
> A technician on a step ladder with the cover removed from a ceiling-mounted
> garage door opener (no visible brand), testing the logic board area with a
> multimeter, rail and trolley in frame, residential garage, LED light.

### 4.4 `GD INSTALLATION` - gallery tile 1, installation / replacement / opener installation / commercial pages

**INSTALL-1: New door going in**
> Two installers in plain work clothes lifting a new insulated {DOOR_STYLE} garage
> door section into place on a {HOME_STYLE} home, half of the door installed, new
> vertical tracks and brackets visible, remaining panels stacked neatly on the
> driveway, daytime.

**INSTALL-2: Finished result**
> Exterior of a newly installed {DOOR_STYLE} garage door on a {HOME_STYLE} home,
> fresh trim, clean driveway, landscaped beds, late-afternoon light, crisp and
> premium, no people.

**INSTALL-3: Before / after pair (generate as two images)**
> (a) Faded, dented old white steel garage door with a sagging bottom seal on a
> {HOME_STYLE} home, overcast light.
> (b) The same home, same angle and framing, now with a new {DOOR_STYLE} door,
> sunny day.

**INSTALL-4: Opener installation**
> A technician mounting a new belt-drive garage door opener rail to the ceiling
> header bracket, opener head unit (no brand) supported on a ladder, open garage,
> tools on the floor, clean bright interior.

**INSTALL-5: Commercial door**
> Exterior of a small commercial building with a large steel roll-up / sectional
> commercial garage door, newly installed, clean concrete apron, technician
> checking the side track, daytime, no signage, no business name.

**INSTALL-6: Door style showroom**
> Three garage door sample sections displayed side by side on a workshop wall:
> raised-panel white steel, flush modern aluminium with frosted glass, and
> wood-look carriage style, soft studio light, no labels.

### 4.5 `GD MAINTENNANCE` - process step 3, gallery tile 4, maintenance pages

The "hardware and care" pool: parts, lubrication, adjustments, tune-ups.

**MAINT-1: Lubrication**
> Close-up of a gloved hand spraying lubricant on garage door hinges and rollers
> along a steel track inside a residential garage, safety sensor visible at the
> bottom of the track, soft natural light.

**MAINT-2: Parts laid out (the "up-front plan")**
> Top-down flat lay on a clean workbench: new torsion spring, nylon rollers, lift
> cables, hinges, weather seal and a socket wrench set, neatly arranged, soft even
> light, no packaging text.

**MAINT-3: Weather seal**
> A technician replacing the bottom rubber weather seal of a garage door, door
> raised about a metre, new seal being slid into the retainer, concrete floor,
> daylight.

**MAINT-4: Tightening hardware**
> Close-up of a socket wrench tightening a hinge bolt on the inside of a sectional
> garage door, metallic detail, side light, shallow depth of field.

**MAINT-5: Seasonal check**
> A homeowner-friendly scene of a technician testing a garage door's auto-reverse by
> placing a small wooden block under the closing door, view from inside the garage,
> door edge just touching the block, daylight.

### 4.6 `GD GUIDE` - blog / guide photos (fallback pool)

Organised in **one subfolder per blog topic**, 10 photos each. Current topics:

| Subfolder | What it should show |
|---|---|
| `Door Goes Off Track` | crooked door, rollers out of track, bent track, technician realigning |
| `Doors on Houses Built Before Insulation Rules` | older homes with thin uninsulated doors, cold garages, insulation panels, frost on the inside |
| `Noises ` (folder name has a trailing space - keep it) | grinding rollers, rattling opener chain, worn hinges, squeaking springs - close-ups of worn parts |
| `Older Door Worth Fixing` | aged wooden or steel doors in decent shape, a technician assessing, repaired vs. replaced comparison |
| `Spring Goes Cold Weather` | snowy driveway, frost, broken spring in a cold garage, winter light |

**GUIDE-1: Homeowner investigating**
> A homeowner standing in their open garage looking up at the torsion spring and
> opener rail while holding a phone with a blank screen, curious and thoughtful,
> seen from a three-quarter back angle, warm interior light, editorial magazine
> style.

**GUIDE-2: Winter spring failure**
> A residential garage in winter, snow on the driveway visible through the half-
> open door, frost on the window, broken torsion spring above the door, cold blue
> morning light mixed with warm interior light.

**GUIDE-3: Old door assessment**
> A weathered but solid 1990s raised-panel steel garage door on an older brick
> home, a technician running his hand along a panel to check for rust, late-
> afternoon light.

**GUIDE-4: Noisy hardware**
> Macro shot of a worn, rusty steel garage door roller with a cracked bearing inside
> the track, grime and old grease visible, dramatic side light.

**GUIDE-5: Uninsulated older door**
> Inside view of a thin single-layer steel garage door on an older house, light
> visible around the edges, a technician holding a rigid foam insulation panel
> against one section, cool daylight.

For a **new** topic, create a new subfolder named after the blog post and generate
10 images around that one subject.

---

## 5. Variation tokens

Replace the `{...}` placeholders to get variety. Do not reuse the same combination
twice in one folder.

**{HOME_STYLE}**
- single-storey brick ranch
- two-storey colonial with white siding
- craftsman bungalow with a covered porch
- Spanish / stucco Southwest home with a terracotta roof
- modern farmhouse with board-and-batten siding
- contemporary flat-roof home with dark cladding
- split-level 1970s suburban home
- Florida home with palm trees and a pale stucco finish
- Midwest home with a wide two-car driveway
- Pacific Northwest home with cedar shingles and evergreen trees

**{DOOR_STYLE}**
- white raised-panel steel
- dark carriage-house with decorative hinges and a window row
- modern flush aluminium with frosted glass panels
- wood-look walnut steel
- black full-view glass and aluminium
- beige short-panel steel with windows
- painted grey long-panel steel

**{REGION} / season**
- sunny Texas summer
- Arizona desert light
- California coastal morning
- Midwest autumn leaves
- Northeast snowy winter
- Florida tropical afternoon
- Pacific Northwest overcast

**People**
- Vary age, gender and ethnicity of technicians and homeowners.
- Plain work clothes in navy, grey, charcoal or khaki - never a logo or name tag.
- Faces turned away, partly visible, or out of focus (no close-up portraits).

---

## 6. QA checklist (reject an image if any line fails)

**Branding and text**
- [ ] No text, logos, brand names, house numbers or readable plates anywhere
- [ ] No branded vans, uniforms or opener housings

**Mechanics look right**
- [ ] Torsion spring sits on a horizontal shaft **above** the door, centred
- [ ] Lift cables run from drums at the shaft ends down to the bottom corners
- [ ] Rollers sit inside the curved track; door panels are straight and evenly spaced
- [ ] Opener rail is centred on the door; the opener head hangs from the ceiling

**Safety**
- [ ] Nobody stands under a moving or crooked door
- [ ] Spring work shows winding bars, not hands on the spring
- [ ] Gloves and glasses during repair work

**Image quality**
- [ ] Hands have the right number of fingers; tools are held naturally
- [ ] Subject sits inside the centre 70%, so the 4:3 crop doesn't cut it
- [ ] Heroes have clean space on one side for the headline
- [ ] Lighting and colour look photographic, not CGI

**Variety**
- [ ] Not a near-duplicate of an existing photo in the same folder

---

## 7. After adding photos

1. Save as `.webp` into the right folder (section 1), continuing the numbering.
2. Nothing to configure - the next build discovers new files automatically.
3. Rebuild a site to see them. The engine favours the **least-used** photos, so
   new images show up first on sites built after they're added.
4. `images/` is not in git - copy new photos to every machine that builds sites.
