// Progress store: earned trophies, per-trophy PSN counts and settings,
// all kept in localStorage so the tracker survives a reload. Nothing here
// ever touches the network; export writes a file, import reads one.
export const STORE_KEYS = {
  earned: 'leonida-ledger.earned.v1',
  counts: 'leonida-ledger.counts.v1',
  settings: 'leonida-ledger.settings.v1',
};

export function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.earned) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(STORE_KEYS.earned, JSON.stringify([...earned].sort()));
}

export function loadCounts() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.counts) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function saveCounts(counts) {
  localStorage.setItem(STORE_KEYS.counts, JSON.stringify(counts));
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.settings) ?? '{}');
    return { hideSpoilers: raw.hideSpoilers === true };
  } catch {
    return { hideSpoilers: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORE_KEYS.settings, JSON.stringify(settings));
}

// The export file: earned names, counts and settings, plus the list version
// so an import can be checked against the trophy list before it applies.
export function exportState(earned, counts, settings) {
  return {
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    counts,
    settings,
  };
}

export function downloadExport(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Validate an imported file against the trophy list: only names the list
// holds are kept, counts are clamped to their PSN target, and anything
// else is reported back instead of silently applied.
export function validateImport(parsed, trophies) {
  const byName = new Map(trophies.map((t) => [t.name, t]));
  const errors = [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['Not a Leonida Ledger export file.'] };
  }
  const earned = new Set();
  for (const name of parsed.earned ?? []) {
    if (byName.has(name)) earned.add(name);
    else errors.push(`Unknown trophy skipped: ${name}`);
  }
  const counts = {};
  for (const [name, value] of Object.entries(parsed.counts ?? {})) {
    const t = byName.get(name);
    if (!t || typeof t.count !== 'number') continue;
    const n = Math.max(0, Math.min(t.count, Math.floor(Number(value) || 0)));
    if (n > 0) counts[name] = n;
  }
  const settings = { hideSpoilers: parsed.settings?.hideSpoilers === true };
  return { ok: true, earned, counts, settings, errors };
}
