/* =============================================================
   Mioshie Zenshu Modern — poems.js
   Handles: loading gosanka, browse, filters, poem detail,
            favorites, random poem, pagination
   ============================================================= */

// ─── State ────────────────────────────────────────────────────
let _allPoems    = null;   // full array (10.717 items)
let _filtered    = [];     // current filtered view
let _page        = 0;
const PAGE_SIZE  = 40;

let _activeCategory = '';
let _activeMood     = '';
let _searchTerm     = '';

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadPoems();

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const id = new URLSearchParams(window.location.search).get('poem');
    if (id && _allPoems) {
      const poem = _allPoems.find(p => p.id === id);
      if (poem) { showPoem(poem); return; }
    }
    hideDetail();
  });
});

// ─── Data loading ─────────────────────────────────────────────
async function loadPoems() {
  try {
    const res  = await fetch('data/poetry/gosanka_enriched.json');
    _allPoems  = await res.json();

    buildFilters();
    applyFilters();

    // Check if URL has a poem id
    const id = new URLSearchParams(window.location.search).get('poem');
    if (id) {
      const poem = _allPoems.find(p => p.id === id);
      if (poem) showPoem(poem);
    }
  } catch (err) {
    console.error('[poems]', err);
    document.getElementById('poemsList').innerHTML =
      `<div class="reader-error"><p>Erro ao carregar os poemas.</p></div>`;
  }
}

// ─── Filters ──────────────────────────────────────────────────
function buildFilters() {
  const catMap  = {};
  const moodMap = {};

  _allPoems.forEach(p => {
    const c = p.category || '';
    const m = p.mood     || '';
    if (c) catMap[c]  = (catMap[c]  || 0) + 1;
    if (m) moodMap[m] = (moodMap[m] || 0) + 1;
  });

  const catOrder  = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  const moodOrder = Object.entries(moodMap).sort((a,b) => b[1]-a[1]);

  const moodEmoji = {
    'Solene':'🙏', 'Sereno':'🌸', 'Vigoroso':'⚡', 'Alegre':'☀️', 'Melancólico':'🌙', 'Misterioso':'✨'
  };
  const catEmoji = {
    'Divino':'✨', 'Natureza':'🌿', 'Sociedade':'🏛️', 'Vida':'🌱', 'Ensino':'📖', 'Arte':'🎨', 'Outro':'◦'
  };

  document.getElementById('categoryFilters').innerHTML = [
    `<button class="filter-btn active" data-type="cat" data-val="" onclick="setFilter('cat','')">
       <span class="lang-pt">Todas</span><span class="lang-ja" style="display:none">すべて</span>
       <span class="filter-count">${_allPoems.length}</span>
     </button>`
  ].concat(catOrder.map(([c, n]) =>
    `<button class="filter-btn" data-type="cat" data-val="${escHtml(c)}" onclick="setFilter('cat','${escHtml(c)}')">
       ${catEmoji[c] || '◦'} ${escHtml(c)}<span class="filter-count">${n}</span>
     </button>`
  )).join('');

  document.getElementById('moodFilters').innerHTML = [
    `<button class="filter-btn active" data-type="mood" data-val="" onclick="setFilter('mood','')">
       <span class="lang-pt">Todos</span><span class="lang-ja" style="display:none">すべて</span>
       <span class="filter-count">${_allPoems.length}</span>
     </button>`
  ].concat(moodOrder.map(([m, n]) =>
    `<button class="filter-btn" data-type="mood" data-val="${escHtml(m)}" onclick="setFilter('mood','${escHtml(m)}')">
       ${moodEmoji[m] || '◦'} ${escHtml(m)}<span class="filter-count">${n}</span>
     </button>`
  )).join('');
}

window.setFilter = function(type, val) {
  if (type === 'cat')  _activeCategory = val;
  if (type === 'mood') _activeMood     = val;

  // Update active states
  document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === val);
  });

  applyFilters();
};

window.onPoemSearch = function(val) {
  _searchTerm = val.trim().toLowerCase();
  applyFilters();
};

function applyFilters() {
  let list = _allPoems;

  if (_activeCategory) list = list.filter(p => p.category === _activeCategory);
  if (_activeMood)     list = list.filter(p => p.mood     === _activeMood);
  if (_searchTerm) {
    list = list.filter(p =>
      (p.original      || '').includes(_searchTerm) ||
      (p.translation_pt|| '').toLowerCase().includes(_searchTerm) ||
      (p.romaji        || '').toLowerCase().includes(_searchTerm) ||
      (p.title         || '').toLowerCase().includes(_searchTerm) ||
      (p.reading       || '').includes(_searchTerm)
    );
  }

  _filtered = list;
  _page     = 0;

  document.getElementById('poemsCount').textContent = _filtered.length.toLocaleString('pt-BR');
  renderPage(true);
}

// ─── Rendering ────────────────────────────────────────────────
function renderPage(reset) {
  const container = document.getElementById('poemsList');
  const start     = _page * PAGE_SIZE;
  const slice     = _filtered.slice(start, start + PAGE_SIZE);
  const lang      = localStorage.getItem('site_lang') || 'pt';
  const isPt      = lang === 'pt';

  if (reset) {
    container.innerHTML = '';
    hideDetail();
  }

  if (_filtered.length === 0) {
    container.innerHTML = `<div class="poems-empty">
      <p class="lang-pt">Nenhum poema encontrado.</p>
      <p class="lang-ja" style="display:none">御歌が見つかりません。</p>
    </div>`;
    document.getElementById('loadMoreContainer').style.display = 'none';
    return;
  }

  const cards = slice.map(poem => buildPoemCard(poem, isPt)).join('');
  container.insertAdjacentHTML('beforeend', cards);

  // Load more button
  const hasMore = (_page + 1) * PAGE_SIZE < _filtered.length;
  document.getElementById('loadMoreContainer').style.display = hasMore ? '' : 'none';
}

function buildPoemCard(poem, isPt) {
  const jaText  = poem.original       || '';
  const ptText  = poem.translation_pt || '';
  const romaji  = poem.romaji         || '';
  const reading = poem.reading        || '';
  const mood    = poem.mood           || '';
  const cat     = poem.category       || '';
  const date    = poem.source_date    || '';

  const moodEmoji = {
    'Solene':'🙏','Sereno':'🌸','Vigoroso':'⚡','Alegre':'☀️','Melancólico':'🌙','Misterioso':'✨'
  };

  // Highlight search term
  const hl = (str) => {
    if (!_searchTerm || !str) return escHtml(str);
    const re = new RegExp(`(${_searchTerm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return escHtml(str).replace(re, '<mark class="search-highlight">$1</mark>');
  };

  return `
    <article class="poem-card" onclick="openPoem('${escHtml(poem.id)}')" role="button" tabindex="0"
             onkeydown="if(event.key==='Enter')openPoem('${escHtml(poem.id)}')">
      <div class="poem-card__japanese">${hl(jaText)}</div>
      ${isPt && ptText ? `<div class="poem-card__translation">${hl(ptText)}</div>` : ''}
      <div class="poem-card__meta">
        ${mood ? `<span class="poem-mood">${moodEmoji[mood]||'◦'} ${escHtml(mood)}</span>` : ''}
        ${date ? `<span>${escHtml(date)}</span>` : ''}
        ${cat  ? `<span>${escHtml(cat)}</span>`  : ''}
      </div>
    </article>`;
}

window.loadMorePoems = function() {
  _page++;
  renderPage(false);
};

// ─── Poem Detail ──────────────────────────────────────────────
window.openPoem = function(id) {
  if (!_allPoems) return;
  const poem = _allPoems.find(p => p.id === id);
  if (!poem) return;

  const url = `poems.html?poem=${encodeURIComponent(id)}`;
  window.history.pushState({ poemId: id }, '', url);
  showPoem(poem);
};

function showPoem(poem) {
  const lang = localStorage.getItem('site_lang') || 'pt';
  const isPt = lang === 'pt';

  const detail = document.getElementById('poemDetail');
  const list   = document.getElementById('poemsList');

  const jaText  = poem.original       || '';
  const ptText  = poem.translation_pt || '';
  const romaji  = poem.romaji         || '';
  const reading = poem.reading        || '';
  const mood    = poem.mood           || '';
  const cat     = poem.category       || '';
  const date    = poem.source_date    || '';
  const tags    = Array.isArray(poem.tags) ? poem.tags : [];
  const book    = poem.source_book    || poem.book || '';

  const moodEmoji = {
    'Solene':'🙏','Sereno':'🌸','Vigoroso':'⚡','Alegre':'☀️','Melancólico':'🌙','Misterioso':'✨'
  };

  // Favorites state
  const favs   = getFavs();
  const isSaved = favs.some(f => f.id === poem.id);

  // Prev / Next in filtered list
  const idx  = _filtered.findIndex(p => p.id === poem.id);
  const prev = idx > 0                  ? _filtered[idx - 1] : null;
  const next = idx < _filtered.length-1 ? _filtered[idx + 1] : null;

  detail.innerHTML = `
    <div class="poem-detail__inner">
      <!-- Back -->
      <button class="poem-back-btn" onclick="hideDetail()">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        <span class="lang-pt">Voltar</span>
        <span class="lang-ja" style="display:none">戻る</span>
      </button>

      <!-- Meta chips -->
      <div class="poem-detail__chips">
        ${cat  ? `<span class="chip">${escHtml(cat)}</span>`  : ''}
        ${mood ? `<span class="chip chip--mood">${moodEmoji[mood]||'◦'} ${escHtml(mood)}</span>` : ''}
        ${date ? `<span class="chip chip--date">${escHtml(date)}</span>` : ''}
      </div>

      <!-- Japanese poem — large display -->
      <div class="poem-detail__ja" lang="ja">
        ${escHtml(jaText).split(/\s+/).map(w=>`<span>${w}</span>`).join(' ')}
      </div>

      <!-- Reading (hiragana) -->
      ${reading ? `<div class="poem-detail__reading" lang="ja">${escHtml(reading)}</div>` : ''}

      <!-- Romaji -->
      ${romaji ? `<div class="poem-detail__romaji">${escHtml(romaji)}</div>` : ''}

      <div class="poem-detail__divider"></div>

      <!-- PT Translation -->
      ${ptText ? `
        <div class="poem-detail__translation">
          <div class="poem-detail__translation-label lang-pt">Tradução</div>
          <div class="poem-detail__translation-label lang-ja" style="display:none">ポルトガル語訳</div>
          <blockquote class="poem-detail__pt">${escHtml(ptText)}</blockquote>
        </div>` : ''}

      <!-- Tags -->
      ${tags.length ? `
        <div class="poem-detail__tags">
          ${tags.map(t => `<span class="tag tag--sm">${escHtml(t)}</span>`).join('')}
        </div>` : ''}

      <!-- Actions -->
      <div class="poem-detail__actions">
        <button class="action-btn${isSaved?' active':''}" id="poemFavBtn" onclick="togglePoemFav('${escHtml(poem.id)}')">
          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span class="lang-pt">${isSaved ? 'Salvo' : 'Salvar'}</span>
          <span class="lang-ja" style="display:none">${isSaved ? '保存済み' : '保存'}</span>
        </button>
        <button class="action-btn" onclick="sharePoem('${escHtml(poem.id)}')" id="poemShareBtn" style="display:none">
          <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span class="lang-pt">Partilhar</span>
          <span class="lang-ja" style="display:none">共有</span>
        </button>
      </div>

      <!-- Prev / Next -->
      <div class="poem-detail__nav">
        ${prev ? `<button class="nav-footer-btn" onclick="openPoem('${escHtml(prev.id)}')">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          <span class="lang-pt">Anterior</span><span class="lang-ja" style="display:none">前へ</span>
        </button>` : '<span></span>'}
        ${next ? `<button class="nav-footer-btn nav-footer-btn--next" onclick="openPoem('${escHtml(next.id)}')">
          <span class="lang-pt">Próximo</span><span class="lang-ja" style="display:none">次へ</span>
          <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>` : '<span></span>'}
      </div>
    </div>`;

  detail.style.display = '';
  list.style.display   = 'none';
  document.getElementById('loadMoreContainer').style.display = 'none';

  // Show share if available
  if (navigator.share) detail.querySelector('#poemShareBtn').style.display = '';

  // Update page title
  document.title = `${jaText.substring(0, 20)}… — Gosanka Mioshie Zenshu`;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Scroll active sidebar item
  const activeItem = document.querySelector('.poems-sidebar .filter-btn.active');
  activeItem?.scrollIntoView({ block: 'nearest' });
}

function hideDetail() {
  const detail = document.getElementById('poemDetail');
  const list   = document.getElementById('poemsList');

  detail.style.display = 'none';
  list.style.display   = '';

  const hasMore = (_page + 1) * PAGE_SIZE < _filtered.length;
  document.getElementById('loadMoreContainer').style.display = hasMore ? '' : 'none';

  document.title = 'Gosanka — Mioshie Zenshu';

  // Only push state if coming from a poem URL
  if (window.location.search.includes('poem=')) {
    window.history.pushState({}, '', 'poems.html');
  }
}

// ─── Random poem ──────────────────────────────────────────────
window.showRandomPoem = function() {
  if (!_filtered.length) return;
  const poem = _filtered[Math.floor(Math.random() * _filtered.length)];
  openPoem(poem.id);
};

// ─── Favorites ────────────────────────────────────────────────
function getFavs() {
  try { return JSON.parse(localStorage.getItem('zenshu_poem_favs') || '[]'); } catch(e) { return []; }
}

window.togglePoemFav = function(id) {
  const lang  = localStorage.getItem('site_lang') || 'pt';
  const poem  = _allPoems?.find(p => p.id === id);
  if (!poem) return;

  let favs = getFavs();
  const idx = favs.findIndex(f => f.id === id);
  const isSaved = idx !== -1;

  if (isSaved) {
    favs.splice(idx, 1);
  } else {
    favs.unshift({ id, ja: poem.original, pt: poem.translation_pt, time: Date.now() });
  }

  try { localStorage.setItem('zenshu_poem_favs', JSON.stringify(favs.slice(0, 200))); } catch(e) {}

  // Update button
  const btn = document.getElementById('poemFavBtn');
  if (btn) {
    btn.classList.toggle('active', !isSaved);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', !isSaved ? 'currentColor' : 'none');
    btn.querySelector('.lang-pt').textContent = !isSaved ? 'Salvo' : 'Salvar';
  }

  showToast?.(isSaved
    ? (lang === 'ja' ? '削除しました' : 'Removido dos salvos')
    : (lang === 'ja' ? '保存しました' : 'Salvo!')
  );
};

// ─── Share ────────────────────────────────────────────────────
window.sharePoem = async function(id) {
  const poem = _allPoems?.find(p => p.id === id);
  if (!poem) return;
  try {
    await navigator.share({
      title: poem.original?.substring(0, 30) + '…',
      text:  poem.translation_pt || poem.original,
      url:   window.location.href,
    });
  } catch(e) {}
};

// ─── Helpers ──────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );
}
