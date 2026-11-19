# gta6-trophy-guide-leonida-legend

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/lindaayu1200/gta6-trophy-guide-leonida-legend/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/lindaayu1200/gta6-trophy-guide-leonida-legend/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI.
Official trophy names, descriptions and grades as PlayStation publishes them; an original
guide to each trophy in its own words with named sources; a roadmap to the platinum;
missable flags; a browser-saved checklist with export and import; filters by grade and
kind; and a spoiler setting that hides story trophies until they are earned.

The app is static files under `app/` with no build step. It runs fully offline: no
network request at run time, every script, style and data file is in the repository.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080 (Node 22+, standard library only)
```

Then open http://localhost:8080 in desktop Chrome. Progress is saved in your browser
(localStorage) and can be exported to a file and imported back.

## What is inside

- `app/index.html`, `app/app.js`, `app/style.css` — the tracker UI (checklist, detail
  panel with guide and sources, roadmap, missables, spoiler mode, export/import).
- `app/data/trophies.json` — the official 55-trophy list with original per-trophy guides,
  kind, missable and hidden flags, steps and cited sources.
- `app/data/roadmap.json` — the six-stage roadmap to the platinum.
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to `/output` and
  writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — real renders of the app in a browser.

## Sources and attribution

Trophy guides cite their sources per trophy (PlayStation.Blog's official list, PowerPyx,
PSNProfiles, Exophase, PlayStationTrophies.org). No Rockstar logo, artwork or game
screenshot appears anywhere; the visual design is original.

---

<sub>Entered on [make.fun](https://make.fun/?ref=eh9bmgam&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
