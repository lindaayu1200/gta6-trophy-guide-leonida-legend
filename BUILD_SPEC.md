# BUILD SPEC — Leonida Legend (GTA VI trophy guide & tracker)

You are building the app/ layer of this entry. Everything else (LICENSE, README, vendor/,
serve.ts, screenshots driver, app/data/*.json) is already in the repository. Work in the
repository root. Do NOT read or copy any file outside this repository except the two data
files you are told to copy (step 2). Write the files listed below with your own write/edit
tools, in your own words and structure — they must genuinely be your code.

## Files you must create

1. `app/index.html` — the page shell. Must contain:
   - `<meta charset>`, viewport, title "Leonida Legend — GTA VI Trophy Guide & Tracker",
     `<link rel="stylesheet" href="style.css">`, `<script type="module" src="app.js"></script>`.
   - A header with app title, subtitle mentioning "GTA VI · PlayStation 5 · 55 trophies",
     three tab buttons (Checklist / Roadmap / Missables, `data-view` attributes),
     a progress bar with a fill span `#bar-fill`, `#progress-text`, `#grade-counts`.
   - A controls section `#controls`: search input `#search`, grade select `#grade-filter`
     (all/platinum/gold/silver/bronze), kind select `#kind-filter`
     (all/story/strangers/activities/collectibles/money), checkboxes `#missable-only`,
     `#hide-done`, `#spoiler`, buttons `#export` and `#reset`, file input `#import`
     (accept="application/json").
   - Main split view: `<main id="main">` with `<ul id="trophy-list">` list pane and a
     sticky detail pane `<aside>` containing `#detail-body`.
   - `<div id="roadmap-view" hidden>` and `<div id="missables-view" hidden>`,
     a small footer noting progress is saved in the browser and the app uses no network,
     a `<noscript>` fallback, and an inline SVG trophy icon (draw your own simple path,
     no external or Rockstar artwork).

2. `app/style.css` — original look, dark theme (deep charcoal/blue-black background,
   one warm accent e.g. coral red + one mint/gold accent, grade badge colors:
   platinum=silver-white, gold=amber, silver=steel, bronze=copper). System font stack.
   No external fonts, no url() to anywhere, no @import. Card-based list rows, rounded
   corners, chips for kind/missable/hidden flags, badges for grades, two-column layout
   (list + sticky detail) collapsing to one column under 900px. Include a `.spoiled`
   style that blurs trophy name/description and a visible "spoiler-safe" note style.
   IMPORTANT: add `[hidden]{display:none !important}` so the view switching works.

3. `app/app.js` — an ES module implementing the tracker. Requirements:
   - `boot()` fetches `data/trophies.json` and `data/roadmap.json` (relative paths only,
     no other URLs anywhere in the file), fills state, renders.
   - trophies.json shape: `{ meta, trophies: [{ id, name, description, grade, guide,
     kind, missable, hidden, stage, sources: [..], tips: [..] }] }`.
     roadmap.json: `{ stages: [{ title, why, ids: [trophy ids...] }] }`.
   - Progress in `localStorage` under key `leonida-legend.v1`: `{ version: 1, savedAt,
     earned: [ids], spoiler }`. Load on boot with try/catch, save on every change.
   - Clicking a row's tick toggles earned (persisted); clicking the row opens the detail
     pane showing: grade badge, kind chip, missable chip, official name, the official
     PlayStation description in a bordered block, the original guide text, numbered
     steps (from `tips`), and a Sources list — each source string like
     `"Name — https://url"` rendered as `<a href target="_blank" rel="noopener noreferrer">`.
   - Spoiler mode (checkbox, default ON): while on, every trophy with
     `kind === 'story' || hidden === true` that is not yet earned shows a blurred name and
     description, the label "Hidden story trophy", a spoiler-safe note, and its detail pane
     hides name/description/guide too. Turning it off reveals everything.
   - Filters: search across name+description+guide; grade, kind selects; missable-only and
     hide-earned checkboxes — all combine.
   - Roadmap view: renders each stage (title, why, ordered trophy links with missable
     chips and a ✓ for earned ones); clicking a trophy link switches to the checklist and
     opens that trophy. Missables view: every `missable` trophy with grade, kind,
     description and a short note on why it is missable.
   - Export button downloads a JSON file (Blob + object URL) with the earned id list;
     Import reads a file, accepts either an array of ids or `{earned: [...]}`, filters to
     valid ids, saves and alerts the count; Reset confirms and clears.
   - Escape all interpolated HTML (escapeHtml helper) except the deliberate link hrefs you
     build from the data. No eval, no innerHTML with unescaped data fields.
   - No network calls other than the two data fetches. No imports of other modules.

4. Edit `main.ts` (repo root): add one comment line at the end of the header comment block
   saying the app layer was rebuilt for this entry (e.g. `// App layer: Leonida Legend UI
   built by this entry's agent session.`). Do not change its logic.

5. Copy the prepared data files (they are content, not code):
   `mkdir -p app/data && cp /tmp/stage/trophies.json app/data/trophies.json && cp /tmp/stage/roadmap.json app/data/roadmap.json`

## Verification you must run before finishing

- `node --check app/app.js` (as `node --check` needs a script: run `node --input-type=module --check < app/app.js`).
- Start the dev server: `node serve.ts --port 8093 &` (background), then
  `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8093/` must print 200, and
  `curl -s http://127.0.0.1:8093/data/trophies.json | head -c 80` must show JSON.
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` must succeed
  (screenshots are added later; if it complains about no screenshot, that specific check
  is fine to leave for the finalize step).
- Kill the dev server when done.

## Commit

`git add -A && git commit -m "Build Leonida Legend tracker UI (checklist, roadmap, spoilers, export/import)"`

Do not push. Do not edit LICENSE, README.md, vendor/, serve.ts, or any file under
`app/data/` other than copying the two files in step 5.
