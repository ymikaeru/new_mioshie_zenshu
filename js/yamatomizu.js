/* =============================================================
   yamatomizu.js — Yama to Mizu (山と水) reader
   ============================================================= */

'use strict';

// ─── State ────────────────────────────────────────────────────
let _data       = null;   // full JSON
let _sections   = [];     // sections with poems
let _allPoems   = [];     // flat list {poem, sectionIdx, poemIdx}
let _curSection = 0;      // current section index (in _sections)
let _curPoem    = 0;      // current poem index within section
let _search     = '';
let _expandedSections = new Set(); // sidebar section expand state
let _expandedCards    = new Set(); // expanded commentary cards (keys: "si-pi")

// ─── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch('data/yamatomizu.json');
    if (!res.ok) throw new Error(res.status);
    _data = await res.json();
  } catch (e) {
    showError('Erro ao carregar data/yamatomizu.json: ' + e.message);
    return;
  }

  _sections = _data.sections;
  _sections.forEach((sec, si) => {
    (sec.poems || []).forEach((poem, pi) => {
      _allPoems.push({ poem, sectionIdx: si, poemIdx: pi });
    });
  });

  renderSidebar();
  const firstWithPoems = _sections.findIndex(s => s.poems && s.poems.length > 0);
  if (firstWithPoems >= 0) {
    _expandedSections.add(firstWithPoems);
    selectSection(firstWithPoems, 0, false);
  } else {
    selectSection(0, 0, false);
  }
  updateCounter();
}

// ─── Sidebar ──────────────────────────────────────────────────
function renderSidebar() {
  const container = document.getElementById('ymSections');
  if (!container) return;

  if (_search) {
    renderSearchResults(container);
    return;
  }

  container.innerHTML = '';
  _sections.forEach((sec, si) => {
    const hasPoems = sec.poems && sec.poems.length > 0;
    const isActive = si === _curSection;
    const isExpanded = _expandedSections.has(si);

    const row = document.createElement('div');
    row.className = 'ym-section-item' + (isActive ? ' active' : '') + (isExpanded ? ' expanded' : '');
    row.dataset.si = si;
    row.onclick = () => onSectionClick(si);

    const jp = document.createElement('span');
    jp.className = 'ym-section-item__jp';
    jp.textContent = sec.title_jp || '';

    const pt = document.createElement('span');
    pt.className = 'ym-section-item__pt';
    pt.textContent = sec.title_pt || '';

    row.appendChild(jp);
    row.appendChild(pt);

    if (hasPoems) {
      const count = document.createElement('span');
      count.className = 'ym-section-item__count';
      count.textContent = sec.poems.length;
      row.appendChild(count);

      const arrow = document.createElement('span');
      arrow.className = 'ym-section-arrow';
      arrow.textContent = '▶';
      row.appendChild(arrow);
    }

    container.appendChild(row);

    if (hasPoems && isExpanded) {
      const list = document.createElement('div');
      list.className = 'ym-poem-list';
      sec.poems.forEach((poem, pi) => {
        const item = document.createElement('div');
        item.className = 'ym-poem-list-item' + (isActive && pi === _curPoem ? ' active' : '');
        item.dataset.si = si;
        item.dataset.pi = pi;
        item.onclick = (e) => { e.stopPropagation(); selectSection(si, pi); };

        const numSpan = document.createElement('span');
        numSpan.className = 'ym-poem-list-item__num';
        numSpan.textContent = poem.num || poem.id || (pi + 1);

        const titleText = document.createTextNode(poem.title_pt || '');

        item.appendChild(numSpan);
        item.appendChild(titleText);
        list.appendChild(item);
      });
      container.appendChild(list);
    }
  });
}

function onSectionClick(si) {
  const sec = _sections[si];
  const hasPoems = sec && sec.poems && sec.poems.length > 0;

  if (hasPoems) {
    if (_expandedSections.has(si)) {
      _expandedSections.delete(si);
    } else {
      _expandedSections.add(si);
    }
    selectSection(si, 0);
  } else {
    selectSection(si, 0);
  }
}

function renderSearchResults(container) {
  container.innerHTML = '';
  const q = _search.toLowerCase();
  const results = _allPoems.filter(({ poem }) => {
    return (poem.title_pt || '').toLowerCase().includes(q)
        || (poem.original || '').includes(_search)
        || (poem.leitura || '').toLowerCase().includes(q)
        || (poem.traducao || '').toLowerCase().includes(q)
        || String(poem.num || '').includes(q);
  }).slice(0, 60);

  if (!results.length) {
    container.innerHTML = '<div class="ym-search-result-item"><div class="ym-search-result-item__title" style="color:var(--text-muted)">Sem resultados</div></div>';
    return;
  }

  const div = document.createElement('div');
  div.className = 'ym-search-results';
  results.forEach(({ poem, sectionIdx, poemIdx }) => {
    const item = document.createElement('div');
    item.className = 'ym-search-result-item';
    item.onclick = () => { selectSection(sectionIdx, poemIdx); };

    item.innerHTML = `
      <div class="ym-search-result-item__num">#${poem.num || poemIdx + 1}</div>
      <div class="ym-search-result-item__title">${esc(poem.title_pt || '')}</div>
      <div class="ym-search-result-item__section">${esc(_sections[sectionIdx]?.title_pt || '')}</div>
    `;
    div.appendChild(item);
  });
  container.appendChild(div);
}

// ─── Navigation ───────────────────────────────────────────────
function selectSection(si, pi = 0, scrollIntoView = true) {
  const sameSection = si === _curSection;
  _curSection = si;
  _curPoem = pi;

  if (!sameSection) {
    _expandedCards.clear();
    renderCenter();
  } else {
    // Same section: scroll + highlight the target card
    scrollToAnthPoem(pi);
  }

  renderSidebar();
  updateCounter();

  if (scrollIntoView) {
    const active = document.querySelector('.ym-section-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ─── Render Center ────────────────────────────────────────────
function renderCenter() {
  const center = document.getElementById('ymCenter');
  if (!center) return;

  const sec = _sections[_curSection];
  if (!sec) return;

  const hasPoems = sec.poems && sec.poems.length > 0;
  if (!hasPoems) {
    center.innerHTML = renderPreface(sec);
    return;
  }

  let html = `<div class="ym-section-header">
    <div class="ym-section-header__titles">
      <span class="ym-section-header__jp">${esc(sec.title_jp || '')}</span>
      <span class="ym-section-header__pt">${esc(sec.title_pt || '')}</span>
    </div>`;
  if (sec.intro) {
    html += `<div class="ym-section-intro">${mdToHtml(sec.intro)}</div>`;
  }
  html += `</div>`;

  html += `<div class="ym-anthology">`;
  const si = _curSection;
  sec.poems.forEach((poem, pi) => {
    const key = `${si}-${pi}`;
    const isExpanded = _expandedCards.has(key);
    const hasCommentary = !!(poem.kigo || poem.kototama || poem.profundidade);

    html += `<div class="ym-anth-card${isExpanded ? ' expanded' : ''}" id="ym-anth-card-${pi}" onclick="toggleCardExpand(${si}, ${pi})">
      <div class="ym-anth-card__header">
        <span class="ym-anth-card__num">#${poem.num || (pi + 1)}</span>
        ${poem.title_pt ? `<span class="ym-anth-card__title">${esc(poem.title_pt)}</span>` : ''}
        ${hasCommentary ? `<span class="ym-anth-card__cta">${isExpanded ? 'Fechar ↑' : 'Comentário ↓'}</span>` : ''}
      </div>
      <div class="ym-anth-card__body">
        <div class="ym-anth-card__jp">
          <div class="ym-anth-card__original">${esc(poem.original || '')}</div>
          ${poem.leitura ? `<div class="ym-anth-card__leitura">${esc(poem.leitura)}</div>` : ''}
        </div>
        <div class="ym-anth-card__pt">${esc(poem.traducao || '')}</div>
      </div>
      ${isExpanded && hasCommentary ? renderCardDetail(poem) : ''}
    </div>`;
  });
  html += `</div>`;

  center.innerHTML = html;
  center.classList.add('ym-fade');
  setTimeout(() => center.classList.remove('ym-fade'), 400);

  if (_curPoem > 0) {
    setTimeout(() => scrollToAnthPoem(_curPoem), 350);
  }
}

// ─── Card expand/collapse ─────────────────────────────────────
function toggleCardExpand(si, pi) {
  const key = `${si}-${pi}`;
  const card = document.getElementById(`ym-anth-card-${pi}`);
  if (!card) return;

  _curPoem = pi;

  if (_expandedCards.has(key)) {
    // Collapse
    _expandedCards.delete(key);
    card.classList.remove('expanded');
    const cta = card.querySelector('.ym-anth-card__cta');
    if (cta) cta.textContent = 'Comentário ↓';
    const detail = card.querySelector('.ym-anth-card__detail');
    if (detail) detail.remove();
  } else {
    // Expand
    _expandedCards.add(key);
    card.classList.add('expanded');
    const cta = card.querySelector('.ym-anth-card__cta');
    if (cta) cta.textContent = 'Fechar ↑';
    const poem = _sections[si]?.poems[pi];
    if (poem && (poem.kigo || poem.kototama || poem.profundidade)) {
      card.insertAdjacentHTML('beforeend', renderCardDetail(poem));
      const detail = card.querySelector('.ym-anth-card__detail');
      if (detail) {
        // Brief settle, then scroll into view
        setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
      }
    }
  }

  renderSidebar();
  updateCounter();
}

function renderCardDetail(poem) {
  let html = `<div class="ym-anth-card__detail" onclick="event.stopPropagation()">`;

  if (poem.kigo) {
    html += `<div class="ym-anth-detail-card">
      <div class="ym-anth-detail-card__label">🍃 Kigo — Palavra Estacional</div>
      <div class="ym-anth-detail-card__body">${mdToHtml(poem.kigo)}</div>
    </div>`;
  }
  if (poem.kototama) {
    html += `<div class="ym-anth-detail-card">
      <div class="ym-anth-detail-card__label">🎵 Kototama — Alma das Palavras</div>
      <div class="ym-anth-detail-card__body">${mdToHtml(poem.kototama)}</div>
    </div>`;
  }
  if (poem.profundidade) {
    html += `<div class="ym-anth-detail-card">
      <div class="ym-anth-detail-card__label">🏔 Profundidade Espiritual</div>
      <div class="ym-anth-detail-card__body">${mdToHtml(poem.profundidade)}</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function scrollToAnthPoem(pi) {
  const card = document.getElementById(`ym-anth-card-${pi}`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('ym-highlighted');
  void card.offsetWidth;
  card.classList.add('ym-highlighted');
  card.addEventListener('animationend', () => card.classList.remove('ym-highlighted'), { once: true });
}

function renderPreface(sec) {
  return `<div class="ym-preface ym-fade">
    <div class="ym-preface__title">${esc(sec.title_jp || '')}</div>
    <div class="ym-preface__subtitle">${esc(sec.title_pt || '')}</div>
    <div class="ym-preface__body">${mdToHtml(sec.intro || '')}</div>
  </div>`;
}

// ─── Search ───────────────────────────────────────────────────
function onSearch(val) {
  _search = val.trim();
  renderSidebar();
}

// ─── Counter ──────────────────────────────────────────────────
function updateCounter() {
  const el = document.getElementById('ymCounter');
  if (!el) return;
  const sec = _sections[_curSection];
  const hasPoems = sec && sec.poems && sec.poems.length > 0;
  if (hasPoems) {
    el.textContent = `#${sec.poems[_curPoem]?.num || _curPoem + 1} · ${_curPoem + 1}/${sec.poems.length} na seção · ${_allPoems.length} poemas`;
  } else {
    el.textContent = `${_allPoems.length} poemas`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function mdToHtml(text) {
  if (!text) return '';
  let t = esc(text);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
  t = t.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  return t;
}

function showError(msg) {
  const center = document.getElementById('ymCenter');
  if (center) center.innerHTML = `<div class="ym-empty"><div class="ym-empty__text" style="color:var(--text-muted)">${esc(msg)}</div></div>`;
}
