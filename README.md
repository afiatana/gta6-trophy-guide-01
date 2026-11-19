# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![make.fun](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-orange)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI**: every trophy with its official name, description and grade, a checklist saved in the browser, filters, a spoiler setting, a roadmap to the platinum, missable flags, and a guide to each trophy in this tracker's own words that cites its sources.

- **Owner:** [afiatana](https://github.com/afiatana)
- **Repo:** [gta6-trophy-guide-01](https://github.com/afiatana/gta6-trophy-guide-01)
- **Referral code:** `3ywr8vjw`

## What it does

- **Checklist** — all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN) with official names, descriptions and grades. Tick one off and it stays ticked (localStorage); per-trophy PSN counts (e.g. 42 Shooting Range golds) can be tracked too.
- **Filters** — by kind (story, missable, collectibles, activities, crime, online), by grade, by search text, and hide-earned. There are no online trophies: the whole list is single-player.
- **Spoiler setting** — hides the names, descriptions and guides of story trophies until they are earned.
- **Roadmap to the platinum** — six stages built from the official descriptions: story, stranger strands, activities, collectibles, crime & money, then cleanup and 100%.
- **Missable trophies** — 19 trophies flagged *at risk* because their description ties them to one chapter, mission or stranger strand, with the honest caveat that no trophy is confirmed missable yet (the game released 19 Nov 2026) and early reports say GTA 6 has no mission replay.
- **Export / import** — download your progress as JSON and import it back in another browser.
- **Offline** — static files under `app/`, no build step, no network request at run time. No Rockstar logo or official artwork; the look is original.

## Sources

Names, descriptions and grades are the official ones from [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) (18 Nov 2026), cross-checked with [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi), which also supplies the PSN count for each counted trophy. The hidden/visible split follows [PlanetGTA6](https://www.planetgta6.com/en/gta-6-trophies/). Missable and no-replay notes cite [Output Lag](https://outputlag.com/guides/gta-6-trophy-list/). Each trophy's guide names its sources beside it in the app.

## Run it

```sh
# Serve the guide locally (Node 22, standard library only)
node serve.ts
# open http://localhost:8080

# Build the submission output (what main.ts hands in)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

```
app/                  the guide (static files, served with app/ at the root)
  index.html          shell: header, progress, tabs
  style.css           the original look (paper + sunset coral)
  js/main.js          boot, routing, views
  js/store.js         localStorage progress, export / import
  js/filters.js       kind / grade / search filters, spoiler rule
  js/roadmap.js       roadmap stages + missable note
  data/trophies.json  the 55 trophies: official name, description, grade,
                      hidden flag, kind, missable flag, PSN count,
                      guide in our own words, sources
screenshots/          4 renders of the guide in headless Chromium
main.ts               copies app/ + screenshots/ to /output, writes dossier.json
vendor/makefun-frontend.ts   the kit's library, unchanged
shots.json            which views the screenshots were taken of
```

## License

MIT — see [LICENSE](LICENSE).
