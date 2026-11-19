// Leonida Legend — offline trophy checklist, guide, roadmap and progress tools.
// All data is loaded from the two local JSON files; nothing else is requested.

const STORAGE_KEY = 'leonida-legend.v1';
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABELS = {
  story: 'Story',
  strangers: 'Strangers',
  activities: 'Activities',
  collectibles: 'Collectibles',
  money: 'Money',
};
const MISSABLE_REASONS = {
  story: 'Tied to a one-time story beat or choice.',
  strangers: 'A stranger strand can close once the story moves on.',
  activities: 'Only offered during a specific event or window.',
  collectibles: 'A limited-time pickup or set.',
  money: 'An earning opportunity with a limited window.',
};

const state = {
  trophies: [],
  byId: new Map(),
  stages: [],
  earned: new Set(),
  spoiler: true,
  selectedId: null,
  view: 'checklist',
  filters: { search: '', grade: 'all', kind: 'all', missableOnly: false, hideDone: false },
};

const el = {};

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function gradeClass(grade) {
  return GRADES.includes(grade) ? grade : 'bronze';
}

function kindLabel(kind) {
  return KIND_LABELS[kind] ?? (kind ? String(kind) : 'Other');
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1) return;
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.map(Number));
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch {
    // Missing, blocked or damaged storage simply starts a fresh checklist.
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      earned: [...state.earned].sort((a, b) => a - b),
      spoiler: state.spoiler,
    }));
  } catch {
    // Browsers in private mode may refuse storage; the session still works.
  }
}

function isSpoiled(trophy) {
  return state.spoiler && !state.earned.has(trophy.id) &&
    (trophy.kind === 'story' || trophy.hidden === true);
}

function matchesFilters(trophy) {
  const filters = state.filters;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.hideDone && state.earned.has(trophy.id)) return false;
  if (filters.search) {
    const haystack = `${trophy.name ?? ''} ${trophy.description ?? ''} ${trophy.guide ?? ''}`.toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }
  return true;
}

function badgeHtml(trophy) {
  const grade = gradeClass(trophy.grade);
  return `<span class="badge ${grade}">${GRADE_LABELS[grade]}</span>`;
}

function chipsHtml(trophy, includeEarned = true) {
  const kind = KIND_LABELS[trophy.kind] ? trophy.kind : 'other';
  let chips = `<span class="chip kind-${kind}">${escapeHtml(kindLabel(trophy.kind))}</span>`;
  if (trophy.missable) chips += '<span class="chip missable">Missable</span>';
  if (trophy.hidden) chips += '<span class="chip hidden-chip">Hidden</span>';
  if (includeEarned && state.earned.has(trophy.id)) chips += '<span class="chip earned">Earned</span>';
  return chips;
}

function rowHtml(trophy) {
  const done = state.earned.has(trophy.id);
  const spoiled = isSpoiled(trophy);
  const classes = [
    'trophy-row', `grade-${gradeClass(trophy.grade)}`,
    done ? 'is-earned' : '', spoiled ? 'is-spoiled' : '',
    state.selectedId === trophy.id ? 'is-selected' : '',
  ].filter(Boolean).join(' ');

  const name = spoiled
    ? `<span class="spoiled-text">${escapeHtml(trophy.name)}</span>
       <span class="spoiler-label">Hidden story trophy</span>
       <span class="spoiler-safe-note">Spoiler-safe until earned</span>`
    : escapeHtml(trophy.name);
  const description = spoiled
    ? `<span class="spoiled-text">${escapeHtml(trophy.description)}</span>`
    : escapeHtml(trophy.description);

  return `<li class="${classes}" data-id="${escapeHtml(trophy.id)}" tabindex="0" role="button">
    <button type="button" class="tick" data-id="${escapeHtml(trophy.id)}" aria-pressed="${done}"
      aria-label="${done ? 'Mark as not earned' : 'Mark as earned'}">${done ? '✓' : ''}</button>
    <div class="row-main">
      <div class="row-top">${badgeHtml(trophy)}<span class="row-name">${name}</span>${chipsHtml(trophy)}</div>
      <p class="row-desc">${description}</p>
    </div>
  </li>`;
}

function sourceHtml(source) {
  const text = String(source ?? '');
  const match = /(https?:\/\/\S+)\s*$/.exec(text);
  if (!match) return `<li>${escapeHtml(text)}</li>`;
  const url = match[1];
  const label = text.slice(0, match.index).replace(/[\s:;\-–—]+$/, '').trim();
  return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a></li>`;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const percent = total ? Math.round((done / total) * 100) : 0;
  el.barFill.style.width = `${percent}%`;
  el.progressTrack.setAttribute('aria-valuenow', String(percent));
  el.progressText.textContent = `${done} / ${total} earned · ${percent}%`;
  el.gradeCounts.textContent = GRADES.map((grade) => {
    const all = state.trophies.filter((trophy) => trophy.grade === grade).length;
    const ticked = state.trophies.filter((trophy) => trophy.grade === grade && state.earned.has(trophy.id)).length;
    return `${GRADE_LABELS[grade]} ${ticked}/${all}`;
  }).join(' · ');
}

function renderList() {
  const visible = state.trophies.filter(matchesFilters);
  el.resultCount.textContent = `${visible.length} of ${state.trophies.length} shown`;
  if (!visible.length) {
    el.trophyList.innerHTML = '<li class="empty-state">No trophies match these filters. Try clearing the search or changing a filter.</li>';
    return;
  }
  el.trophyList.innerHTML = visible.map(rowHtml).join('');
}

function renderDetail() {
  const trophy = state.byId.get(state.selectedId);
  if (!trophy) {
    el.detailBody.innerHTML = '<p class="empty-detail">Select a trophy on the left to read its guide, steps and sources.</p>';
    return;
  }

  const done = state.earned.has(trophy.id);
  const header = `<div class="detail-top">${badgeHtml(trophy)}${chipsHtml(trophy)}</div>`;
  const detailTick = `<button type="button" class="tool-button wide-tick" data-detail-tick="${escapeHtml(trophy.id)}">
    ${done ? 'Mark as not earned' : 'Mark as earned'}</button>`;

  if (isSpoiled(trophy)) {
    el.detailBody.innerHTML = `${header}
      <div class="spoiler-gate">
        <span class="spoiler-label">Hidden story trophy</span>
        <p class="spoiler-safe-note">Spoiler-safe: the name, official description and guide are hidden until you earn this trophy or turn Spoiler mode off.</p>
      </div>
      ${detailTick}`;
    return;
  }

  const tips = Array.isArray(trophy.tips) && trophy.tips.length
    ? `<ol>${trophy.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}</ol>`
    : '<p class="muted">No extra steps for this trophy.</p>';
  const sources = Array.isArray(trophy.sources) && trophy.sources.length
    ? trophy.sources.map(sourceHtml).join('')
    : '<li>No sources listed.</li>';

  el.detailBody.innerHTML = `${header}
    <h3 class="detail-name">${escapeHtml(trophy.name)}</h3>
    <p class="official-desc">${escapeHtml(trophy.description)}</p>
    ${detailTick}
    <section class="detail-section"><h4>Guide</h4><p>${escapeHtml(trophy.guide)}</p></section>
    <section class="detail-section"><h4>Numbered steps</h4>${tips}</section>
    <section class="detail-section"><h4>Sources</h4><ul class="source-list">${sources}</ul></section>`;
}

function renderRoadmap() {
  el.roadmapBody.innerHTML = state.stages.map((stage, index) => {
    const entries = (Array.isArray(stage.ids) ? stage.ids : [])
      .map((id) => state.byId.get(id))
      .filter(Boolean);
    const links = entries.map((trophy) => {
      const spoiled = isSpoiled(trophy);
      const mark = state.earned.has(trophy.id)
        ? '<span class="done-mark" aria-label="Earned">✓</span>'
        : '<span class="todo-mark" aria-hidden="true">○</span>';
      const name = spoiled
        ? `<span class="spoiled-text">${escapeHtml(trophy.name)}</span><span class="spoiler-label">Hidden story trophy</span>`
        : escapeHtml(trophy.name);
      return `<li><a href="#trophy-${escapeHtml(trophy.id)}" class="roadmap-link" data-id="${escapeHtml(trophy.id)}">
        ${mark}<span class="link-name">${name}</span>
        ${trophy.missable ? '<span class="chip missable">Missable</span>' : ''}
      </a></li>`;
    }).join('');
    return `<article class="stage-card">
      <div class="stage-head">
        <span class="stage-num">${index + 1}</span>
        <h3>${escapeHtml(stage.title)}</h3>
        <span class="stage-count">${entries.length} trophies</span>
      </div>
      <p class="stage-why">${escapeHtml(stage.why)}</p>
      <ol class="stage-trophies">${links}</ol>
    </article>`;
  }).join('');
}

function missableNote(trophy) {
  const reason = MISSABLE_REASONS[trophy.kind] ?? 'This trophy can pass you by.';
  const lastTip = Array.isArray(trophy.tips) && trophy.tips.length ? trophy.tips[trophy.tips.length - 1] : '';
  return lastTip ? `${reason} ${lastTip}` : reason;
}

function renderMissables() {
  const cards = state.trophies.filter((trophy) => trophy.missable).map((trophy) => {
    const spoiled = isSpoiled(trophy);
    const name = spoiled
      ? `<span class="spoiled-text">${escapeHtml(trophy.name)}</span><span class="spoiler-label">Hidden story trophy</span>`
      : escapeHtml(trophy.name);
    const description = spoiled
      ? `<span class="spoiled-text">${escapeHtml(trophy.description)}</span><span class="spoiler-safe-note">Spoiler-safe until earned</span>`
      : escapeHtml(trophy.description);
    return `<article class="missable-card grade-${gradeClass(trophy.grade)}">
      <div class="detail-top">${badgeHtml(trophy)}${chipsHtml(trophy)}</div>
      <h3>${name}</h3>
      <p class="official-desc">${description}</p>
      <p class="missable-why"><strong>Why it is missable:</strong> ${escapeHtml(missableNote(trophy))}</p>
      <button type="button" class="open-guide" data-id="${escapeHtml(trophy.id)}">Open guide</button>
    </article>`;
  }).join('');
  el.missablesBody.innerHTML = cards || '<p class="empty-detail">No missable trophies in the data.</p>';
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function setView(view) {
  if (!['checklist', 'roadmap', 'missables'].includes(view)) return;
  state.view = view;
  el.main.hidden = view !== 'checklist';
  el.roadmapView.hidden = view !== 'roadmap';
  el.missablesView.hidden = view !== 'missables';
  el.tabs.forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
}

function syncControls() {
  el.search.value = state.filters.search;
  el.gradeFilter.value = state.filters.grade;
  el.kindFilter.value = state.filters.kind;
  el.missableOnly.checked = state.filters.missableOnly;
  el.hideDone.checked = state.filters.hideDone;
  el.spoiler.checked = state.spoiler;
}

function resetFilters() {
  state.filters = { search: '', grade: 'all', kind: 'all', missableOnly: false, hideDone: false };
  syncControls();
}

function toggleEarned(id) {
  if (!state.byId.has(id)) return;
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderAll();
}

function openTrophy(id) {
  if (!state.byId.has(id)) return;
  state.selectedId = id;
  if (!matchesFilters(state.byId.get(id))) resetFilters();
  setView('checklist');
  renderAll();
  const row = [...el.trophyList.querySelectorAll('.trophy-row')].find((node) => Number(node.dataset.id) === id);
  if (row) row.scrollIntoView({ block: 'nearest' });
}

function exportProgress() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-legend-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function importProgress(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.earned) ? parsed.earned : null);
    if (!ids) throw new Error('unexpected format');
    const accepted = [...new Set(ids.map(Number).filter((id) => state.byId.has(id)))];
    state.earned = new Set(accepted);
    saveProgress();
    renderAll();
    alert(`Imported ${accepted.length} earned trophies.`);
  } catch {
    alert('Import failed. Use a JSON file containing trophy ids, or an object with an "earned" array.');
  } finally {
    event.target.value = '';
  }
}

function resetProgress() {
  if (!confirm('Reset all earned trophies? Export a backup first if you may want this progress back.')) return;
  state.earned = new Set();
  saveProgress();
  renderAll();
}

function onListClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const tick = target.closest('.tick');
  if (tick) {
    toggleEarned(Number(tick.dataset.id));
    return;
  }
  const row = target.closest('.trophy-row');
  if (row) {
    state.selectedId = Number(row.dataset.id);
    renderList();
    renderDetail();
  }
}

function onListKeydown(event) {
  if (event.target instanceof Element && event.target.classList.contains('trophy-row') &&
      (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    state.selectedId = Number(event.target.dataset.id);
    renderList();
    renderDetail();
  }
}

function onDetailClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const tick = target?.closest('[data-detail-tick]');
  if (tick) toggleEarned(Number(tick.dataset.detailTick));
}

function onTrophyLink(event) {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest('[data-id]');
  if (!link) return;
  event.preventDefault();
  openTrophy(Number(link.dataset.id));
}

function wireEvents() {
  el.tabs.forEach((tab) => tab.addEventListener('click', () => setView(tab.dataset.view)));
  el.search.addEventListener('input', () => {
    state.filters.search = el.search.value.trim().toLowerCase();
    renderList();
  });
  el.gradeFilter.addEventListener('change', () => {
    state.filters.grade = el.gradeFilter.value;
    renderList();
  });
  el.kindFilter.addEventListener('change', () => {
    state.filters.kind = el.kindFilter.value;
    renderList();
  });
  el.missableOnly.addEventListener('change', () => {
    state.filters.missableOnly = el.missableOnly.checked;
    renderList();
  });
  el.hideDone.addEventListener('change', () => {
    state.filters.hideDone = el.hideDone.checked;
    renderList();
  });
  el.spoiler.addEventListener('change', () => {
    state.spoiler = el.spoiler.checked;
    saveProgress();
    renderAll();
  });
  el.trophyList.addEventListener('click', onListClick);
  el.trophyList.addEventListener('keydown', onListKeydown);
  el.detailBody.addEventListener('click', onDetailClick);
  el.roadmapBody.addEventListener('click', onTrophyLink);
  el.missablesBody.addEventListener('click', onTrophyLink);
  el.export.addEventListener('click', exportProgress);
  el.import.addEventListener('change', importProgress);
  el.reset.addEventListener('click', resetProgress);
}

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function boot() {
  el.main = byId('main');
  el.trophyList = byId('trophy-list');
  el.resultCount = byId('result-count');
  el.detailBody = byId('detail-body');
  el.roadmapView = byId('roadmap-view');
  el.roadmapBody = byId('roadmap-body');
  el.missablesView = byId('missables-view');
  el.missablesBody = byId('missables-body');
  el.progressText = byId('progress-text');
  el.gradeCounts = byId('grade-counts');
  el.progressTrack = byId('progress-track');
  el.barFill = byId('bar-fill');
  el.search = byId('search');
  el.gradeFilter = byId('grade-filter');
  el.kindFilter = byId('kind-filter');
  el.missableOnly = byId('missable-only');
  el.hideDone = byId('hide-done');
  el.spoiler = byId('spoiler');
  el.export = byId('export');
  el.import = byId('import');
  el.reset = byId('reset');
  el.tabs = [...document.querySelectorAll('.tabs [data-view]')];

  wireEvents();

  try {
    const [trophyData, roadmapData] = await Promise.all([
      getJson('data/trophies.json'),
      getJson('data/roadmap.json'),
    ]);
    state.trophies = Array.isArray(trophyData.trophies) ? trophyData.trophies : [];
    state.byId = new Map(state.trophies.map((trophy) => [trophy.id, trophy]));
    state.stages = Array.isArray(roadmapData.stages) ? roadmapData.stages : [];
    loadProgress();
    state.earned = new Set([...state.earned].filter((id) => state.byId.has(id)));
    syncControls();
    renderAll();
  } catch (error) {
    el.trophyList.innerHTML = `<li class="empty-state">The local trophy data could not be loaded. ${escapeHtml(error?.message ?? '')}</li>`;
    el.progressText.textContent = 'Data unavailable';
  }
}

boot();
