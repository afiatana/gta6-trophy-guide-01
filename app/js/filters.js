// Filters and the spoiler rule: which trophies a view shows, and what a
// hidden story trophy looks like until it is earned.
export const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'crime', label: 'Crime' },
  { id: 'online', label: 'Online' },
];

export const GRADES = ['all', 'platinum', 'gold', 'silver', 'bronze'];

// The game lists no online trophies: every one of the 55 is single-player.
export function applyFilters(trophies, { kind, grade, query, hideEarned, earned }) {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === 'online') return false;
    if (kind === 'missable' && !t.missable) return false;
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (hideEarned && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function countByKind(trophies, kind, earned) {
  const list = kind === 'all' ? trophies : applyFilters(trophies, { kind, grade: 'all', query: '', hideEarned: false, earned });
  return { total: list.length, earned: list.filter((t) => earned.has(t.name)).length };
}

// A story trophy stays masked while the spoiler setting is on and the
// trophy is unearned: name, description and guide all stay hidden, because
// the names give away missions, chapters and the ending.
export function isMasked(trophy, settings, earned) {
  return settings.hideSpoilers && trophy.kind === 'story' && !earned.has(trophy.name);
}
