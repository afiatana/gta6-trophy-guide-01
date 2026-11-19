// Leonida Ledger — boot, routing and views. Plain ES modules, no library:
// the checklist with its detail pane, the roadmap, the missable list and
// the settings page all render from app/data/trophies.json.
import { KINDS, GRADES, applyFilters, countByKind, isMasked } from './filters.js';
import { ROADMAP_STAGES, MISSABLE_NOTE } from './roadmap.js';
import {
  loadEarned, saveEarned, loadCounts, saveCounts,
  loadSettings, saveSettings, exportState, downloadExport, validateImport,
} from './store.js';

const viewEl = document.getElementById('view');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressGrades = document.getElementById('progressGrades');
const factsEl = document.getElementById('facts');

let doc = null;
let earned = loadEarned();
let counts = loadCounts();
let settings = loadSettings();
let selectedName = null;
let filters = { kind: 'all', grade: 'all', query: '', hideEarned: false };

const GRADE_MARK = { platinum: '◆', gold: '●', silver: '●', bronze: '●' };

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function trophyByName(name) {
  return doc.trophies.find((t) => t.name === name) ?? null;
}

function renderHeader() {
  const total = doc.trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${n} of ${total} trophies earned — ${pct}% to the platinum`;
  const byGrade = {};
  for (const t of doc.trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { total: 0, earned: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) byGrade[t.grade].earned += 1;
  }
  progressGrades.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g].earned}/${byGrade[g].total} ${g}`)
    .join(' · ');
  factsEl.innerHTML = [
    `<span class="fact"><b>55</b> trophies</span>`,
    `<span class="fact"><b>1</b> platinum · <b>2</b> gold · <b>6</b> silver · <b>46</b> bronze</span>`,
    `<span class="fact"><b>28</b> hidden on PSN</span>`,
    `<span class="fact"><b>0</b> online — all single-player</span>`,
  ].join('');
}

function badge(t, kind) {
  const marks = {
    platinum: '◆ Platinum', gold: '● Gold', silver: '● Silver', bronze: '● Bronze',
  };
  let html = `<span class="badge ${t.grade}">${marks[t.grade]}</span>`;
  html += ` <span class="badge kind">${esc(kind)}</span>`;
  if (t.hidden) html += ' <span class="badge hidden">Hidden on PSN</span>';
  if (t.missable) html += ' <span class="badge missable">⚠ Missable — at risk</span>';
  if (typeof t.count === 'number') html += ` <span class="badge count">PSN count 0/${t.count.toLocaleString()}</span>`;
  return html;
}

function trophyRow(t) {
  const masked = isMasked(t, settings, earned);
  const isEarned = earned.has(t.name);
  const name = masked ? 'Hidden story trophy' : t.name;
  const desc = masked ? 'Spoilers hidden — earn this trophy to reveal its name and description.' : t.description;
  const row = document.createElement('button');
  row.type = 'button';
  row.className = `trophy${isEarned ? ' earned' : ''}${selectedName === t.name ? ' selected' : ''}`;
  row.dataset.name = t.name;
  row.innerHTML = `
    <input type="checkbox" ${isEarned ? 'checked' : ''} aria-label="Mark ${esc(name)} earned" tabindex="-1">
    <span>
      <span class="trophy-name${masked ? ' masked' : ''}">${esc(name)}</span>
      <span class="trophy-desc">${esc(desc)}</span>
      <span class="trophy-meta">${badge(t, t.kind)}</span>
    </span>
    <span class="trophy-grade-mark" aria-hidden="true">${GRADE_MARK[t.grade]}</span>`;
  row.addEventListener('click', (event) => {
    if (event.target.tagName === 'INPUT') return;
    selectedName = t.name;
    render();
  });
  row.querySelector('input').addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(t.name);
  });
  return row;
}

function toggleEarned(name) {
  if (earned.has(name)) earned.delete(name);
  else earned.add(name);
  saveEarned(earned);
  renderHeader();
  render();
}

// Export / import live in both the checklist toolbar and the settings page:
// one binder wires whichever copy is on screen. Import is validated against
// the trophy list before it applies; unknown names are reported, not applied.
function bindSaveControls(container, statusEl) {
  const exportBtn = container.querySelector('.export-btn');
  const importFile = container.querySelector('.import-file');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadExport(exportState(earned, counts, settings));
      if (statusEl) statusEl.textContent = 'Export downloaded.';
    });
  }
  if (importFile) {
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = validateImport(JSON.parse(await file.text()), doc.trophies);
        if (!result.ok) throw new Error(result.errors[0]);
        earned = result.earned;
        counts = result.counts;
        settings = result.settings;
        saveEarned(earned);
        saveCounts(counts);
        saveSettings(settings);
        renderHeader();
        render();
        if (statusEl) {
          statusEl.textContent = `Imported ${earned.size} earned trophies.` + (result.errors.length ? ` ${result.errors.length} unknown name(s) skipped.` : '');
          statusEl.classList.remove('error');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `Import failed: ${err.message}`;
          statusEl.classList.add('error');
        }
      }
    });
  }
}

function detailPane() {
  const pane = document.createElement('aside');
  pane.className = 'detail';
  const t = selectedName ? trophyByName(selectedName) : null;
  if (!t) {
    pane.innerHTML = `<p class="detail-empty"><strong>Pick a trophy</strong> to see its guide and sources. Tick the box on a trophy to mark it earned — your progress is saved in this browser.</p>
      <h3>How this guide works</h3>
      <p>Every trophy shows its official name, description and grade, a guide in this tracker's own words, and the sources each guide draws on. Trophies with a PSN count show their target; set your current count in the detail pane to track it.</p>
      <p>Use the <strong>Roadmap</strong> tab for the order to earn them in, and <strong>Missable trophies</strong> for the ones to watch while you play the story.</p>`;
    return pane;
  }
  const masked = isMasked(t, settings, earned);
  const isEarned = earned.has(t.name);
  if (masked) {
    pane.innerHTML = `
      <h2>Hidden story trophy</h2>
      <p class="official"><span class="label">Official grade</span> — ${esc(t.grade)} · hidden on PSN</p>
      <div class="callout">Spoilers are on: this story trophy's name, description and guide stay hidden until you earn it. Turn spoilers off in Settings &amp; save, or tick it earned, to reveal it.</div>
      <p><button class="btn primary" id="revealEarned" type="button">Mark earned — reveal it</button></p>`;
    pane.querySelector('#revealEarned').addEventListener('click', () => toggleEarned(t.name));
    return pane;
  }
  const countRow = typeof t.count === 'number' ? `
    <h3>Your PSN count</h3>
    <div class="progress-count">
      <input type="number" id="countInput" min="0" max="${t.count}" value="${counts[t.name] ?? 0}" aria-label="Current count toward ${esc(t.name)}">
      <span>of ${t.count.toLocaleString()}</span>
      <button type="button" id="countSave">Save count</button>
    </div>` : '';
  pane.innerHTML = `
    <h2>${esc(t.name)}</h2>
    <p class="official"><span class="label">Official description</span><br>${esc(t.description)}</p>
    <div class="trophy-meta">${badge(t, t.kind)}</div>
    ${t.missable ? '<div class="callout"><strong>⚠ Missable — at risk.</strong> This trophy belongs to one chapter, mission or stranger strand, and early reports say GTA 6 has no mission replay. Keep a manual save at the start of each chapter.</div>' : ''}
    <h3>Guide</h3>
    <p>${esc(t.guide)}</p>
    ${countRow}
    <h3>Sources</h3>
    <ul class="sources">${t.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
    <p style="margin-top:14px"><button class="btn ${isEarned ? '' : 'primary'}" id="toggleEarned" type="button">${isEarned ? 'Mark as not earned' : 'Mark earned'}</button></p>`;
  pane.querySelector('#toggleEarned').addEventListener('click', () => toggleEarned(t.name));
  const saveBtn = pane.querySelector('#countSave');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const input = pane.querySelector('#countInput');
      const n = Math.max(0, Math.min(t.count, Math.floor(Number(input.value) || 0)));
      if (n > 0) counts[t.name] = n;
      else delete counts[t.name];
      saveCounts(counts);
      input.value = String(n);
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => { saveBtn.textContent = 'Save count'; }, 1200);
    });
  }
  return pane;
}

function renderChecklist() {
  const wrap = document.createElement('div');
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <div class="chips" role="group" aria-label="Filter by kind">
      ${KINDS.map((k) => {
        const c = k.id === 'online'
          ? { total: 0, earned: 0 }
          : countByKind(doc.trophies, k.id, earned);
        return `<button type="button" class="chip" data-kind="${k.id}" aria-pressed="${filters.kind === k.id}">${k.label} <span class="count">${c.earned}/${c.total}</span></button>`;
      }).join('')}
    </div>
    <div class="search">
      <label class="spoiler-toggle"><input type="checkbox" id="spoilerToggle" ${settings.hideSpoilers ? 'checked' : ''}> Hide story spoilers</label>
      <button type="button" class="btn export-btn">Export progress</button>
      <label class="btn file">Import progress <input type="file" class="import-file" accept="application/json" hidden></label>
      <select id="gradeFilter" aria-label="Filter by grade">
        ${GRADES.map((g) => `<option value="${g}" ${filters.grade === g ? 'selected' : ''}>${g === 'all' ? 'All grades' : g[0].toUpperCase() + g.slice(1)}</option>`).join('')}
      </select>
      <input type="search" id="searchBox" placeholder="Search trophies…" value="${esc(filters.query)}" aria-label="Search trophies">
      <label class="spoiler-toggle"><input type="checkbox" id="hideEarned" ${filters.hideEarned ? 'checked' : ''}> Hide earned</label>
    </div>
    <span class="status" id="toolbarStatus" role="status"></span>`;
  wrap.append(toolbar);

  const layout = document.createElement('div');
  layout.className = 'layout';
  const list = document.createElement('div');
  list.className = 'list';
  const shown = applyFilters(doc.trophies, { ...filters, earned });
  if (filters.kind === 'online') {
    const note = document.createElement('div');
    note.className = 'empty';
    note.innerHTML = `<strong>No online trophies.</strong> Every one of the 55 trophies is earned in single-player — the game lists no online trophy at launch. Sources: Exophase and PSNProfiles list the same 55 with no online requirement; PlanetGTA6 confirms “no online trophies, no difficulty trophies”.`;
    list.append(note);
  } else if (shown.length === 0) {
    const note = document.createElement('div');
    note.className = 'empty';
    note.textContent = 'No trophies match these filters.';
    list.append(note);
  } else {
    for (const t of shown) list.append(trophyRow(t));
  }
  layout.append(list, detailPane());
  wrap.append(layout);
  viewEl.replaceChildren(wrap);

  toolbar.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filters.kind = chip.dataset.kind;
      render();
    });
  });
  toolbar.querySelector('#spoilerToggle').addEventListener('change', (e) => {
    settings.hideSpoilers = e.target.checked;
    saveSettings(settings);
    render();
  });
  toolbar.querySelector('#gradeFilter').addEventListener('change', (e) => {
    filters.grade = e.target.value;
    render();
  });
  toolbar.querySelector('#searchBox').addEventListener('input', (e) => {
    filters.query = e.target.value;
    render();
  });
  toolbar.querySelector('#hideEarned').addEventListener('change', (e) => {
    filters.hideEarned = e.target.checked;
    render();
  });
  bindSaveControls(toolbar, toolbar.querySelector('#toolbarStatus'));
}

function renderRoadmap() {
  const wrap = document.createElement('div');
  const intro = document.createElement('div');
  intro.className = 'panel';
  intro.innerHTML = `<h2>Roadmap to the platinum</h2>
    <p>Six stages, built from the official descriptions: which story chapters and missions, which collectibles and counts, in what order. The story alone takes around 60 hours by the reviews (VGC, Push Square, via PlanetGTA6) — the platinum is a long road, not a hard one. Tick trophies off in the Checklist as you go; each stage shows its own count.</p>`;
  wrap.append(intro);
  for (const stage of ROADMAP_STAGES) {
    const trophies = stage.trophyIds.map((id) => doc.trophies.find((t) => t.id === id));
    const done = trophies.filter((t) => earned.has(t.name)).length;
    const section = document.createElement('section');
    section.className = 'stage';
    section.innerHTML = `
      <div class="stage-head"><h2>${esc(stage.title)}</h2><span class="stage-count">${done}/${trophies.length} earned</span></div>
      <p>${esc(stage.blurb)}</p>
      <ul>${trophies.map((t) => {
        const masked = isMasked(t, settings, earned);
        const label = masked ? 'Hidden story trophy' : t.name;
        return `<li class="${earned.has(t.name) ? 'earned' : ''}"><span class="tname">${earned.has(t.name) ? '✓ ' : ''}${esc(label)}</span> — ${esc(masked ? 'Spoilers hidden.' : t.description)}${t.missable ? ' <span class="badge missable">⚠ Missable — at risk</span>' : ''}</li>`;
      }).join('')}</ul>`;
    wrap.append(section);
  }
  viewEl.replaceChildren(wrap);
}

function renderMissable() {
  const wrap = document.createElement('div');
  const note = document.createElement('div');
  note.className = 'panel';
  note.innerHTML = `<h2>${esc(MISSABLE_NOTE.title)}</h2><p>${esc(MISSABLE_NOTE.body)}</p>
    <p><strong>Sources:</strong> ${MISSABLE_NOTE.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ')}</p>`;
  wrap.append(note);
  const list = document.createElement('div');
  list.className = 'list';
  const atRisk = doc.trophies.filter((t) => t.missable);
  const done = atRisk.filter((t) => earned.has(t.name)).length;
  const head = document.createElement('p');
  head.innerHTML = `<strong>${done}/${atRisk.length} at-risk trophies earned.</strong> Each one names the chapter or mission it belongs to — check it off in the Checklist as you pass it.`;
  list.append(head);
  for (const t of atRisk) list.append(trophyRow(t));
  const layout = document.createElement('div');
  layout.className = 'layout';
  layout.append(list, detailPane());
  wrap.append(layout);
  viewEl.replaceChildren(wrap);
}

function renderSettings() {
  const wrap = document.createElement('div');
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>Settings &amp; save</h2>
    <p>Your progress lives in this browser (localStorage) — nothing leaves your machine unless you export it. Export a file to back it up or move it to another browser, and import it back here.</p>
    <div class="row" style="margin-bottom:12px">
      <label class="spoiler-toggle"><input type="checkbox" id="spoilerToggle2" ${settings.hideSpoilers ? 'checked' : ''}> Hide story spoilers (mask story trophy names, descriptions and guides until earned)</label>
    </div>
    <div class="row">
      <button class="btn primary export-btn" type="button">Export progress (.json)</button>
      <label class="file btn">Import progress <input type="file" class="import-file" accept="application/json" hidden></label>
      <button class="btn danger" id="resetBtn" type="button">Reset all progress</button>
      <span class="status" id="saveStatus" role="status"></span>
    </div>
    <p style="margin-top:14px">${earned.size} of ${doc.trophies.length} trophies earned. Export file name: <code>leonida-ledger-progress.json</code>.</p>`;
  wrap.append(panel);
  const about = document.createElement('div');
  about.className = 'panel';
  about.innerHTML = `<h2>About the list</h2>
    <p>55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned. Names, descriptions and grades are the official ones from Exophase (18 Nov 2026), cross-checked with PSNProfiles, which also supplies the PSN count for each counted trophy. The hidden/visible split follows PlanetGTA6's list of the 27 visible trophies. Guides are this tracker's own words; each one names its sources.</p>
    <p>Offline by design: this page loads only files under <code>app/</code> and makes no network request. Links to sources open only when you follow them.</p>`;
  wrap.append(about);
  viewEl.replaceChildren(wrap);

  const status = panel.querySelector('#saveStatus');
  panel.querySelector('#spoilerToggle2').addEventListener('change', (e) => {
    settings.hideSpoilers = e.target.checked;
    saveSettings(settings);
    status.textContent = 'Spoiler setting saved.';
  });
  bindSaveControls(panel, status);
  panel.querySelector('#resetBtn').addEventListener('click', () => {
    if (!window.confirm('Reset all progress? This clears every earned trophy, count and the spoiler setting.')) return;
    earned = new Set();
    counts = {};
    settings = { hideSpoilers: false };
    saveEarned(earned);
    saveCounts(counts);
    saveSettings(settings);
    renderHeader();
    render();
  });
}

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const params = new URLSearchParams(query ?? '');
  return { view: path || 'checklist', params };
}

function render() {
  const { view, params } = currentRoute();
  if (params.get('trophy')) {
    const t = trophyByName(params.get('trophy'));
    if (t) selectedName = t.name;
  }
  if (params.get('kind') && KINDS.some((k) => k.id === params.get('kind'))) {
    filters.kind = params.get('kind');
  }
  document.querySelectorAll('.tabs a').forEach((a) => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  if (view === 'roadmap') renderRoadmap();
  else if (view === 'missable') renderMissable();
  else if (view === 'settings') renderSettings();
  else renderChecklist();
}

async function boot() {
  const response = await fetch('data/trophies.json');
  doc = await response.json();
  renderHeader();
  window.addEventListener('hashchange', render);
  render();
}

boot();
