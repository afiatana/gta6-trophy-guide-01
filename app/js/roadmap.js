// The roadmap to the platinum and the missable list, both built from the
// official descriptions alone: which story chapters and missions, which
// collectibles and counts, in what order. Nothing here claims a location or
// step no source confirms — see the notes on each stage.
export const ROADMAP_STAGES = [
  {
    id: 'story',
    title: 'Stage 1 — Play the story (Chapters 1–4 + finale)',
    blurb:
      'Finish the story first. Every chapter and mission trophy lands here, and both protagonists become playable in Chapter 2, which opens most of the free-roam trophies. Keep a manual save at the start of each chapter: early reports say GTA 6 has no mission replay.',
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: 'strangers',
    title: 'Stage 2 — Stranger strands',
    blurb:
      'Eight mission strands for strangers across Leonida. The five named finales (Andy, Kenton, Billy, Randy, Tyrone) plus Bret’s hunt are six of the eight — find the other two while you explore. Do them before or after the finale; everything outside the story stays available after the credits.',
    trophyIds: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    id: 'activities',
    title: 'Stage 3 — Activities: races, ranges, fishing, arcade',
    blurb:
      'The grind stage with PSN counts to chase: 250 stunts, gold in all 42 Shooting Range challenges, 20 different races, a Top Fun drone-race win at all 14 locations, 50 challenges, one arcade game, one fishing win over Cal, and one try of each of the 9 activity types.',
    trophyIds: [15, 16, 17, 18, 19, 20, 21, 32, 36, 46, 51],
  },
  {
    id: 'collectibles',
    title: 'Stage 4 — Collectibles & exploration',
    blurb:
      'Sweep Leonida region by region: 18 meditation spots (do Lucia’s balcony spot in Chapter 1 — it is reported to disappear after the chapter), 3 card sets, 100 WAiNK spots, 100 vehicles, all 52 areas, all 8 garages, and 10 vehicles registered to the Scooter Bros app. One road trip feeds several trophies at once.',
    trophyIds: [28, 30, 31, 35, 42, 54, 55],
  },
  {
    id: 'crime',
    title: 'Stage 5 — Crime & money',
    blurb:
      'Robberies and the money that follows them: 5 bank vaults, an armored truck, a jewelry store undetected, one illegal operation for each of the 9 gangs, and the partner crime trophies (4-star escape, 3 shops back-to-back). Launder the Marked Bills as you go toward $250,000, and spend $100,000 across the shops.',
    trophyIds: [33, 34, 37, 38, 39, 40, 41, 43, 45, 47, 48, 49, 52, 53],
  },
  {
    id: 'platinum',
    title: 'Stage 6 — Cleanup & 100%',
    blurb:
      'Mop up whatever is left — the 500 choices, the strange event, the cocktail on Ocean Beach — and the 100% completion gold follows. When every other box is ticked, the platinum pops with it.',
    trophyIds: [14, 44, 50, 1],
  },
];

// The missable warning, in the guide's own words, with its sources named:
// no trophy is confirmed missable yet, and the flags mark what is at risk.
export const MISSABLE_NOTE = {
  title: 'No trophy is confirmed missable yet',
  body: 'The game released 19 Nov 2026 and no reliable missable list exists yet (PlanetGTA6). The 19 trophies below are flagged AT RISK because their official description ties them to one chapter, mission or stranger strand — and early reports say GTA 6 has no mission replay (Output Lag). The one concrete warning so far: Lucia’s balcony meditation spot in Chapter 1 is reported to disappear after that chapter. Keep a manual save at the start of every chapter and one before the final mission, and never use cheats on your trophy save — PowerPyx reports cheats disable trophies.',
  sources: [
    { label: 'PlanetGTA6 — GTA 6 Trophies (no confirmed missables yet)', url: 'https://www.planetgta6.com/en/gta-6-trophies/' },
    { label: 'Output Lag — GTA 6 Trophy List (no mission replay; Chapter 1 meditation spot)', url: 'https://outputlag.com/guides/gta-6-trophy-list/' },
  ],
};
