# OTZ Project — garageDoor

This directory holds a 1000-business garage-door-repair site dataset and the
generator that turns it into real websites.

**Start here → [`engine/CLAUDE.md`](engine/CLAUDE.md)** — the current project
state (which sites are live, on which theme, the exact single-site
generation command, local/LAN preview, and the engine-wide conventions
established so far). Read that file before doing anything else in this
project; it's written specifically so a new session (including after
switching Claude accounts) can pick up where the last one left off without
relying on chat history.

## Layout

- `engine/` — the site generator (Node, zero deps). All generation commands
  run from inside here (`cd engine && node src/cli.js ...`).
- `GarageDoor_1000_SITE_BUILD_SHEET.xlsx` — the source business dataset
  (domain, name, city, state, brand color). Read-only; the engine never
  writes to it.
- `contents/<city>-<state>/` — real, researched per-city rich content
  (neighborhoods, suburbs, service pages, topic guides) that the engine
  pulls in when present; falls back to safe non-fabricated generic content
  otherwise.
- `python-engine/` — an earlier, separate implementation attempt. Not the
  live engine — ignore unless specifically asked to work on it.
