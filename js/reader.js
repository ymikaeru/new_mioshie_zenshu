/* =============================================================
   Mioshie Zenshu Modern — reader.js
   Handles: loading teachings, rendering, navigation, favorites,
            history, progress bar, comparison mode
   ============================================================= */

// ─── Helpers (top-level so available everywhere) ──────────────
function stripMd(str) {
  if (!str) return '';
  return str
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );
}

// ─── Cache ───────────────────────────────────────────────────
const _partCache  = {};   // { filename: Array<item> }
let   _searchIdx  = null; // full search index (5.3 MB)
let   _idxLoading = false;
let   _currentItem = null;
let   _currentList = []; // adjacent items for prev/next

// ─── Publication & Section data ──────────────────────────────
let   _pubIndex   = null; // publication_index.json
let   _sectionTables = null; // section_tables.json
let   _pubLoading = false;
let   _secLoading = false;
let   _sidebarMode = 'book'; // 'book', 'list', or 'shinchi'
let   _shinchiIndex  = null;  // shinchi_index.json
let   _shinchiLabels = null;  // shinchi_labels.json (translations)
let   _shinchiLoading = false;
let   _activeTopic = -1;     // active topic index within current sub-category

// ─── Sidebar collapse ────────────────────────────────────────
window.toggleSidebarCollapse = function() {
  const layout = document.getElementById('readerLayout');
  if (!layout) return;
  const collapsed = layout.classList.toggle('sidebar-collapsed');
  localStorage.setItem('reader_sidebar_collapsed', collapsed ? '1' : '');
};

function injectCollapseBtn() {
  const layout = document.getElementById('readerLayout');
  if (!layout || layout.querySelector('.sidebar-collapse-btn')) return;

  // Toggle button
  const btn = document.createElement('button');
  btn.className = 'sidebar-collapse-btn';
  btn.title = 'Recolher/Expandir índice';
  btn.setAttribute('aria-label', 'Recolher índice');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
  btn.onclick = toggleSidebarCollapse;
  layout.appendChild(btn);

  // Backdrop (click to close)
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  backdrop.onclick = () => {
    layout.classList.add('sidebar-collapsed');
    localStorage.setItem('reader_sidebar_collapsed', '1');
  };
  layout.appendChild(backdrop);

  // Always start open — user closes when they want
  layout.classList.remove('sidebar-collapsed');
  localStorage.removeItem('reader_sidebar_collapsed');
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyStoredReaderPrefs?.();
  injectCollapseBtn();
  initReader();
  window.addEventListener('popstate', initReader);

  // Reading progress bar scroll handler
  window.addEventListener('scroll', updateProgress, { passive: true });

  // Swipe navigation (mobile)
  let _tx = 0, _ty = 0;
  document.addEventListener('touchstart', e => {
    _tx = e.changedTouches[0].clientX;
    _ty = e.changedTouches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _tx;
    const dy = e.changedTouches[0].clientY - _ty;
    if (Math.abs(dx) < 80 || Math.abs(dy) > 60) return;
    const siblings = getSiblings();
    if (dx > 0 && siblings.prev) navigateTo(siblings.prev.id, siblings.prev.part_file);
    else if (dx < 0 && siblings.next) navigateTo(siblings.next.id, siblings.next.part_file);
  }, { passive: true });

  // Save position on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') savePosition();
  });
  window.addEventListener('beforeunload', savePosition);
});

// ─── URL params ───────────────────────────────────────────────
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    id:       p.get('id')   || '',
    part:     p.get('part') || '',
    search:   p.get('search') || p.get('s') || '',
    category: p.get('cat') || '',
    mode:     p.get('mode') || '',   // 'book' or 'list'
    pub:      p.get('pub')  || '',   // publication name for book mode
    list:     p.get('list') || '',   // section key for list mode
  };
}

// ─── Main init ────────────────────────────────────────────────
async function initReader() {
  const { id, part, search, category, mode, pub, list } = getParams();
  const container = document.getElementById('readerContent');
  if (!container) return;

  // Determine sidebar mode from URL params
  if (pub === 'shinchi') {
    _sidebarMode = 'shinchi';
  } else if (mode === 'book' || (pub && mode !== 'list')) {
    _sidebarMode = 'book';
  } else if (mode === 'list' || list) {
    _sidebarMode = 'list';
  } else {
    _sidebarMode = localStorage.getItem('reader_sidebar_mode') || 'book';
  }

  // No ID but shinchi: open first sub-category
  if (!id && pub === 'shinchi') {
    showLoading();
    try {
      await Promise.all([loadShinchiIndex(), loadSearchIndex()]);
      const firstSub = _shinchiIndex?.['1']?.sub_categories?.[0];
      if (firstSub?.id) {
        const entry = _searchIdx?.find(x => x.id === firstSub.id);
        if (entry) {
          const newP = new URLSearchParams();
          newP.set('id', firstSub.id);
          newP.set('part', entry.part_file || '');
          newP.set('pub', 'shinchi');
          window.history.replaceState({}, '', `reader.html?${newP.toString()}`);
          return initReader();
        }
      }
      showError('神智之光 não encontrado.');
    } catch (err) {
      console.error('[reader]', err);
      showError('Erro ao carregar 神智之光.');
    }
    return;
  }

  // No ID but has pub: open first article of that publication
  if (!id && pub) {
    showLoading();
    try {
      await loadPubIndex();
      const pubData = _pubIndex?.publications?.[pub];
      if (pubData && pubData.teaching_ids?.length) {
        const firstId = pubData.teaching_ids[0];
        // Load search index to find part_file
        await loadSearchIndex();
        const entry = _searchIdx?.find(x => x.id === firstId);
        if (entry) {
          const newP = new URLSearchParams();
          newP.set('id', firstId);
          newP.set('part', entry.part_file || '');
          newP.set('mode', 'book');
          newP.set('pub', pub);
          window.history.replaceState({}, '', `reader.html?${newP.toString()}`);
          return initReader(); // Restart with the found ID
        }
      }
      showError('Publicação não encontrada.');
    } catch (err) {
      console.error('[reader]', err);
      showError('Erro ao carregar publicação.');
    }
    return;
  }

  // No ID but has list: open first article of that section
  if (!id && list) {
    showLoading();
    try {
      await loadSectionTables();
      const sec = _sectionTables?.[list];
      if (sec && sec.rows?.length) {
        const firstRow = sec.rows.find(r => r.id);
        if (firstRow) {
          await loadSearchIndex();
          const entry = _searchIdx?.find(x => x.id === firstRow.id);
          if (entry) {
            const newP = new URLSearchParams();
            newP.set('id', firstRow.id);
            newP.set('part', entry.part_file || '');
            newP.set('mode', 'list');
            newP.set('list', list);
            window.history.replaceState({}, '', `reader.html?${newP.toString()}`);
            return initReader();
          }
        }
      }
      showError('Seção não encontrada.');
    } catch (err) {
      console.error('[reader]', err);
      showError('Erro ao carregar seção.');
    }
    return;
  }

  // No ID: show browse/landing state
  if (!id) {
    showBrowse(category);
    return;
  }

  showLoading();

  try {
    // 1. Load search index (for nav sidebar + prev/next)
    await loadSearchIndex();

    // 2. Find item in index
    const indexEntry = _searchIdx?.find(x => x.id === id);
    const partFile = part || indexEntry?.part_file || '';

    if (!partFile) {
      showError('Ensinamento não encontrado no índice.');
      return;
    }

    // 3. Load the part file (cached)
    const items = await loadPart(partFile);
    const item  = items?.find(x => x.id === id);

    if (!item) {
      showError('Ensinamento não encontrado.');
      return;
    }

    _currentItem = item;

    // 4. Build neighbour list based on mode
    await buildCurrentList(indexEntry, item, pub, list);

    // 5. Render
    renderTeaching(item, indexEntry, search);
    buildSidebar(indexEntry);
    saveHistory(item, indexEntry);

  } catch (err) {
    console.error('[reader]', err);
    showError('Erro ao carregar ensinamento. Tente novamente.');
  }
}

// Build the navigation list based on current mode
async function buildCurrentList(indexEntry, item, pub, list) {
  if (_sidebarMode === 'shinchi') {
    await loadShinchiIndex();
    // Build flat list of all shinchi sub-category IDs in order
    const catNums = Object.keys(_shinchiIndex).sort((a, b) => parseInt(a) - parseInt(b));
    _currentList = [];
    for (const cn of catNums) {
      for (const sub of _shinchiIndex[cn].sub_categories) {
        if (sub.id) {
          const entry = _searchIdx?.find(x => x.id === sub.id);
          if (entry) _currentList.push(entry);
        }
      }
    }
    return;
  }
  if (_sidebarMode === 'book') {
    // Book mode: get ordered list from publication_index
    await loadPubIndex();
    const pubName = pub || _pubIndex?.id_to_publication?.[item.id] || indexEntry?.publication || item.publication || '';
    if (pubName && _pubIndex?.publications?.[pubName]) {
      const pubData = _pubIndex.publications[pubName];
      // Build list from teaching IDs
      _currentList = pubData.teaching_ids.map(tid => {
        const entry = _searchIdx?.find(x => x.id === tid);
        return entry || { id: tid, title: tid, part_file: '' };
      }).filter(x => x.part_file); // Only include entries with content
    } else {
      // Fallback: category-based
      const cat = indexEntry?.category || item.category || '';
      _currentList = _searchIdx ? _searchIdx.filter(x => x.category === cat) : [];
    }
  } else if (_sidebarMode === 'list' && list) {
    // List mode: get ordered list from section_tables
    await Promise.all([loadSectionTables(), loadPubIndex()]);
    const section = _sectionTables?.[list];
    if (section?.rows) {
      _currentList = section.rows
        .filter(r => r.id) // Only rows matched to search index
        .map(r => {
          const entry = _searchIdx?.find(x => x.id === r.id);
          return entry || { id: r.id, title: r.title || '', part_file: '' };
        })
        .filter(x => x.part_file);
    } else {
      // Fallback: category-based
      const cat = indexEntry?.category || item.category || '';
      _currentList = _searchIdx ? _searchIdx.filter(x => x.category === cat) : [];
    }
  } else {
    // Default: category-based
    await loadPubIndex();
    const cat = indexEntry?.category || item.category || '';
    _currentList = _searchIdx ? _searchIdx.filter(x => x.category === cat) : [];
  }
}

// ─── Load helpers ─────────────────────────────────────────────
async function loadSearchIndex() {
  if (_searchIdx) return;
  if (_idxLoading) {
    // Wait for pending load
    await new Promise(res => {
      const iv = setInterval(() => { if (_searchIdx) { clearInterval(iv); res(); } }, 50);
    });
    return;
  }
  _idxLoading = true;
  try {
    const res = await fetch('data/search/advanced_search_index.json');
    _searchIdx = await res.json();
  } finally {
    _idxLoading = false;
  }
}

async function loadPart(partFile) {
  if (_partCache[partFile]) return _partCache[partFile];
  const res = await fetch(`data/teachings/${partFile}`);
  if (!res.ok) throw new Error(`Failed to load ${partFile}`);
  const data = await res.json();
  _partCache[partFile] = data;
  return data;
}

async function loadPubIndex() {
  if (_pubIndex) return;
  if (_pubLoading) {
    await new Promise(res => {
      const iv = setInterval(() => { if (_pubIndex) { clearInterval(iv); res(); } }, 50);
    });
    return;
  }
  _pubLoading = true;
  try {
    const res = await fetch('data/publication_index.json');
    _pubIndex = await res.json();
  } finally {
    _pubLoading = false;
  }
}

async function loadSectionTables() {
  if (_sectionTables) return;
  if (_secLoading) {
    await new Promise(res => {
      const iv = setInterval(() => { if (_sectionTables) { clearInterval(iv); res(); } }, 50);
    });
    return;
  }
  _secLoading = true;
  try {
    const res = await fetch('data/section_tables.json');
    _sectionTables = await res.json();
  } finally {
    _secLoading = false;
  }
}

// Load publications metadata for cover images and details
let _pubMeta = null;
let _pubMetaLoading = false;
async function loadPubMeta() {
  if (_pubMeta) return;
  if (_pubMetaLoading) {
    await new Promise(res => {
      const iv = setInterval(() => { if (_pubMeta) { clearInterval(iv); res(); } }, 50);
    });
    return;
  }
  _pubMetaLoading = true;
  try {
    const res = await fetch('data/publications_enriched.json');
    const arr = await res.json();
    _pubMeta = {};
    arr.forEach(p => { _pubMeta[p.id] = p; });
  } finally {
    _pubMetaLoading = false;
  }
}

// Load shinchi thematic index
async function loadShinchiIndex() {
  if (_shinchiIndex) return;
  if (_shinchiLoading) {
    await new Promise(res => {
      const iv = setInterval(() => { if (_shinchiIndex) { clearInterval(iv); res(); } }, 50);
    });
    return;
  }
  _shinchiLoading = true;
  try {
    const res = await fetch('data/shinchi_index.json');
    _shinchiIndex = await res.json();
    // Load translation labels if available
    try {
      const lr = await fetch('data/shinchi_labels.json');
      _shinchiLabels = await lr.json();
    } catch(e) { /* optional */ }
  } finally {
    _shinchiLoading = false;
  }
}

// ─── Render ───────────────────────────────────────────────────
function renderTeaching(item, indexEntry, searchQuery) {
  const lang  = localStorage.getItem('site_lang') || 'pt';
  const isPt  = lang === 'pt';
  const container = document.getElementById('readerContent');
  const siblings  = getSiblings();

  // Content selection
  const rawContent = isPt
    ? (item.content_ptbr || item.content || '')
    : (item.content || item.content_ptbr || '');

  // Titles
  const title   = isPt ? (item.title || item.jp_title || '') : (item.jp_title || item.title || '');
  const titlePt = item.title    || '';
  const titleJp = item.jp_title || '';

  // Meta
  const category   = indexEntry?.category || item.category || '';
  let date         = item.date || '';
  if (!date && item.date_iso) {
    try {
      const parts = item.date_iso.split('-');
      const y = parseInt(parts[0]);
      if (!isNaN(y)) {
        date = `S${y - 1925}`;
        const m = parseInt(parts[1]);
        if (!isNaN(m)) date += `.${m}`;
        const d = parseInt(parts[2]);
        if (!isNaN(d)) date += `.${d}`;
      }
    } catch(e) {}
  }
  if (!date && item.year) {
    date = String(item.year).includes('昭和') ? item.year : `S${parseInt(item.year) - 1925}`;
  }
  const pub        = item.publication || '';
  const collection = item.collection  || '';
  const status     = item.status === 'Unpublished'
    ? `<span class="badge badge--unpublished lang-pt" style="${isPt?'':'display:none'}">Não publicado</span><span class="badge badge--unpublished lang-ja" style="${!isPt?'':'display:none'}">未発表</span>`
    : '';

  // Render content
  const htmlContent = renderContent(rawContent, isPt);

  // Breadcrumb
  const catHref = `search.html?cat=${encodeURIComponent(category)}`;
  const breadcrumbPt = `<a href="index.html">Início</a> <span>/</span> <a href="${catHref}">${escHtml(category)}</a> <span>/</span> <span>${escHtml(titlePt || title)}</span>`;
  const breadcrumbJa = `<a href="index.html">ホーム</a> <span>/</span> <a href="${catHref}">${escHtml(category)}</a> <span>/</span> <span>${escHtml(titleJp || title)}</span>`;

  // Prev/Next footer nav
  const navFooter = `
    <div class="reader-nav-footer">
      ${siblings.prev
        ? `<a href="reader.html?id=${encodeURIComponent(siblings.prev.id)}&part=${encodeURIComponent(siblings.prev.part_file)}" class="nav-footer-btn" onclick="navigateTo('${siblings.prev.id}','${siblings.prev.part_file}'); return false;">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            <span class="lang-pt">Anterior</span><span class="lang-ja" style="${!isPt?'':'display:none'}">前へ</span>
          </a>`
        : '<span></span>'}
      ${siblings.next
        ? `<a href="reader.html?id=${encodeURIComponent(siblings.next.id)}&part=${encodeURIComponent(siblings.next.part_file)}" class="nav-footer-btn nav-footer-btn--next" onclick="navigateTo('${siblings.next.id}','${siblings.next.part_file}'); return false;">
            <span class="lang-pt">Próximo</span><span class="lang-ja" style="${!isPt?'':'display:none'}">次へ</span>
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </a>`
        : '<span></span>'}
    </div>`;

  // Comparison mode
  const isComparison = localStorage.getItem('reader_comparison') === 'true';

  let mainHtml;
  if (isComparison && item.content && item.content_ptbr) {
    mainHtml = renderComparison(item);
  } else {
    mainHtml = `<div class="reader-content" id="teachingContent">${htmlContent}</div>`;
  }

  container.innerHTML = `
    <nav class="breadcrumbs" aria-label="Caminho">
      <span class="lang-pt">${breadcrumbPt}</span>
      <span class="lang-ja" style="${!isPt?'':'display:none'}">${breadcrumbJa}</span>
    </nav>

    <article class="teaching-article">
      ${_sidebarMode !== 'book' ? buildBookBadge(indexEntry, item) : ''}

      <header class="teaching-header">
        ${status}
        ${category ? `<div class="teaching-category">${escHtml(category)}</div>` : ''}

        <h1 class="teaching-title">
          <span class="lang-pt">${escHtml(titlePt || title)}</span>
          <span class="lang-ja" style="${!isPt?'':'display:none'}">${escHtml(titleJp || title)}</span>
        </h1>

        ${titleJp && isPt ? `<div class="teaching-title-ja">${escHtml(titleJp)}</div>` : ''}
        ${titlePt && !isPt ? `<div class="teaching-title-ja">${escHtml(titlePt)}</div>` : ''}

        <div class="teaching-meta">
          ${date       ? `<span><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escHtml(date)}</span>` : ''}
          ${pub        ? `<span><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>${escHtml(pub)}</span>` : ''}
          ${collection ? `<span><svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>${escHtml(collection)}</span>` : ''}
        </div>

        <div class="teaching-actions">
          <button class="action-btn" id="favBtn" onclick="toggleFavorite()" title="Salvar">
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <span class="lang-pt">Salvar</span>
            <span class="lang-ja" style="${!isPt?'':'display:none'}">保存</span>
          </button>
          <button class="action-btn" onclick="toggleComparison()" title="Modo comparação">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>
            <span class="lang-pt">Comparar</span>
            <span class="lang-ja" style="${!isPt?'':'display:none'}">比較</span>
          </button>
          <button class="action-btn" onclick="shareArticle()" id="shareBtn" title="Compartilhar" style="display:none">
            <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span class="lang-pt">Partilhar</span>
            <span class="lang-ja" style="${!isPt?'':'display:none'}">共有</span>
          </button>
        </div>
      </header>

      ${mainHtml}

      ${navFooter}
    </article>
  `;

  // Highlight search terms
  if (searchQuery) highlightSearch(searchQuery);

  // Update fav button state
  updateFavBtn();

  // Show share if available
  if (navigator.share) document.getElementById('shareBtn').style.display = '';

  // Update document title
  document.title = `${titlePt || title} — Mioshie Zenshu`;

  // Update progress bar
  updateProgress();

  // If shinchi mode: extract headings and update sidebar topic texts, then scroll if needed
  if (_sidebarMode === 'shinchi') {
    requestAnimationFrame(() => {
      syncShinchiTopics();
      if (_activeTopic >= 0) scrollToTopic(_activeTopic);
    });
  }

  // Book mode: populate topics for the active article in the sidebar
  if (_sidebarMode === 'book') {
    requestAnimationFrame(() => syncBookTopics());
  }
}

// Extract PT headings from rendered content and update shinchi sidebar topic labels
function syncShinchiTopics() {
  const topicEls = document.querySelectorAll('.shinchi-sb-topic-text');
  if (!topicEls.length) return;

  // Build candidate heading list: h2/h3 first, then numbered <p><strong> as fallback
  let headings = [...document.querySelectorAll('.reader-content h2, .reader-content h3')];

  if (headings.length < topicEls.length) {
    // Articles render sections as <p><strong>001 Title…</strong></p>
    const numbered = [...document.querySelectorAll('.reader-content p > strong')]
      .filter(el => /^\d{3}\s/.test(el.textContent.trim()));
    if (numbered.length >= topicEls.length) {
      headings = numbered;
    }
  }

  // If there is one extra heading at the start (article title), skip it
  const offset = headings.length > topicEls.length ? 1 : 0;

  topicEls.forEach((el, i) => {
    const h = headings[i + offset];
    if (h) {
      const pt = h.textContent.trim();
      if (pt && pt !== el.dataset.ja) {
        el.textContent = pt;
        el.title = el.dataset.ja; // keep JP as tooltip
      }
    }
  });
}

// ─── Book mode: populate topics for active article in sidebar ──
function syncBookTopics() {
  const container = document.getElementById('book-item-topics');
  if (!container) return;

  // Reuse same heading extraction as syncShinchiTopics
  let headings = [...document.querySelectorAll('.reader-content h2, .reader-content h3')];
  if (headings.length < 2) {
    const numbered = [...document.querySelectorAll('.reader-content p > strong')]
      .filter(el => /^\d{3}\s/.test(el.textContent.trim()));
    if (numbered.length >= 1) headings = numbered;
  }

  // Skip article title heading if there's one extra
  const offset = headings.length > 1 && !(/^\d{3}\s/.test(headings[0]?.textContent?.trim())) ? 1 : 0;
  const topics = headings.slice(offset);

  if (!topics.length) { container.innerHTML = ''; return; }

  container.innerHTML = '<div class="book-sb-topics">' +
    topics.map((h, i) =>
      `<div class="book-sb-topic" onclick="scrollToBookTopic(${i + offset})">
        <span class="book-sb-topic-text">${escHtml(h.textContent.trim().substring(0, 90))}</span>
      </div>`
    ).join('') +
    '</div>';
}

window.scrollToBookTopic = function(rawIdx) {
  let headings = [...document.querySelectorAll('.reader-content h2, .reader-content h3')];
  if (headings.length < 2) {
    const numbered = [...document.querySelectorAll('.reader-content p > strong')]
      .filter(el => /^\d{3}\s/.test(el.textContent.trim()));
    if (numbered.length >= 1) headings = numbered;
  }
  const target = headings[rawIdx];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('topic-highlight');
    setTimeout(() => target.classList.remove('topic-highlight'), 2000);
  }
};

// ─── Book badge (shown in list/planilha mode) ─────────────────
function buildBookBadge(indexEntry, item) {
  if (!_pubIndex) return '';

  const pubName = _pubIndex?.id_to_publication?.[item.id] || indexEntry?.publication || item.publication || '';
  if (!pubName) return '';

  const pubData = _pubIndex?.publications?.[pubName];
  if (!pubData) return '';

  const titlePt = pubData.title_pt || pubName;
  const titleJa = pubData.title_ja || '';
  const coverImg = pubData.cover_image
    ? `<img src="assets/img/${pubData.cover_image}" class="book-badge-cover" alt="" onerror="this.style.display='none'">`
    : `<div class="book-badge-icon"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`;

  const bookUrl = `reader.html?id=${encodeURIComponent(item.id)}&part=${encodeURIComponent(getParams().part)}&mode=book&pub=${encodeURIComponent(pubName)}`;

  return `
    <div class="book-badge" onclick="window.location.href='${bookUrl}'">
      ${coverImg}
      <div class="book-badge-info">
        <span class="book-badge-label">Este artigo faz parte de</span>
        <strong class="book-badge-title">${escHtml(titlePt)}</strong>
        ${titleJa && titleJa !== titlePt ? `<span class="book-badge-title-ja">${escHtml(titleJa)}</span>` : ''}
      </div>
      <span class="book-badge-link">Abrir Livro →</span>
    </div>`;
}

// ─── Content rendering ────────────────────────────────────────
// Strip publication header lines that bleed in from the original site
function stripPubHeader(raw) {
  if (!raw) return raw;
  // Remove leading lines matching: ## ―― Coletânea/Coleção ... ――  or  ―― Coletânea ... ――
  raw = raw.replace(
    /^(?:#{1,3}\s+)?[――─\-]{0,4}\s*(?:Coletânea|Coleção|Compilação|Da?\s+Coletânea|Do\s+Acervo)\s+de\s+[^\n]*\n?/gi,
    ''
  );
  return raw.trimStart();
}

function renderContent(raw, isPt) {
  if (!raw) return '<p class="empty-content">Conteúdo não disponível.</p>';
  raw = stripPubHeader(raw);

  // Markdown (PT content uses markdown)
  if (isPt && /^#{1,3}\s|^\*\*|\n\n/.test(raw)) {
    return renderMarkdown(raw);
  }

  // Japanese or plain HTML
  return raw
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .split(/\n{2,}/).filter(p => p.trim())
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function renderMarkdown(md) {
  // Use marked.js if available
  if (typeof marked !== 'undefined') {
    return marked.parse(md);
  }

  // Fallback: minimal markdown
  let html = escHtml(md);
  html = html
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return '<p>' + html + '</p>';
}

function renderComparison(item) {
  const rawPt = item.content_ptbr || '';
  const rawJa = item.content     || '';

  const ptHtml = renderContent(rawPt, true);
  const jaHtml = renderContent(rawJa, false);

  return `
    <div class="comparison-layout">
      <div class="comparison-header">
        <span>Português</span>
        <span>日本語</span>
      </div>
      <div class="comparison-body">
        <div class="comparison-col comparison-col--pt reader-content">${ptHtml}</div>
        <div class="comparison-col comparison-col--ja reader-content" style="font-family:'Noto Serif JP',serif">${jaHtml}</div>
      </div>
    </div>`;
}

// ─── Sidebar ──────────────────────────────────────────────────
function buildSidebar(indexEntry) {
  const sidebar = document.getElementById('readerSidebar');
  if (!sidebar) return;

  const layout = document.getElementById('readerLayout');
  const currentId = indexEntry?.id || _currentItem?.id || '';
  const { pub, list } = getParams();

  // ── Build mode toggle ──
  const modeToggle = buildModeToggle(pub, list);

  // ── Shinchi (神智之光) mode sidebar ──
  if (_sidebarMode === 'shinchi') {
    buildShinchiSidebar(sidebar, layout, indexEntry, currentId);
    return;
  }

  // ── Book mode sidebar ──
  if (_sidebarMode === 'book') {
    buildBookSidebar(sidebar, layout, indexEntry, currentId, pub, modeToggle);
    return;
  }

  // ── List/planilha mode sidebar ──
  if (_sidebarMode === 'list' && list) {
    buildListSidebar(sidebar, layout, indexEntry, currentId, list, modeToggle);
    return;
  }

  // ── Fallback: category-based sidebar (existing behavior) ──
  if (_searchIdx && _currentList && _currentList.length > 1) {
    buildCategorySidebar(sidebar, layout, indexEntry, currentId, modeToggle);
    return;
  }

  // ── Fallback: TOC from headings within current article ──
  const container = document.getElementById('readerContent');
  const headings = container ? Array.from(container.querySelectorAll('.reader-content h2, .reader-content h3')) : [];

  if (headings.length > 2) {
    buildTocSidebar(sidebar, layout, headings);
    return;
  }

  // ── No sidebar content ──
  if (layout) layout.classList.add('reader-layout--no-sidebar');
  sidebar.innerHTML = '';
}

function buildModeToggle(pub, list) {
  const isBook = _sidebarMode === 'book';
  const isList = _sidebarMode === 'list';
  return `
    <div class="sidebar-mode-toggle">
      <button class="mode-btn${isBook ? ' active' : ''}" onclick="switchSidebarMode('book')" title="Índice do livro original">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        Livro
      </button>
      <button class="mode-btn${isList || (!isBook && !isList) ? ' active' : ''}" onclick="switchSidebarMode('list')" title="Índice por seção/assunto">
        <svg viewBox="0 0 24 24" width="14" height="14"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        Planilha
      </button>
    </div>`;
}

window.switchSidebarMode = function(newMode) {
  _sidebarMode = newMode;
  localStorage.setItem('reader_sidebar_mode', newMode);

  // Update URL
  const p = new URLSearchParams(window.location.search);
  p.set('mode', newMode);
  window.history.replaceState({}, '', `reader.html?${p.toString()}`);

  // Rebuild with current item
  if (_currentItem) {
    const indexEntry = _searchIdx?.find(x => x.id === _currentItem.id);
    const { pub, list } = getParams();
    buildCurrentList(indexEntry, _currentItem, pub, list).then(() => {
      buildSidebar(indexEntry);
      // Re-render to update badge and nav buttons
      const { search } = getParams();
      renderTeaching(_currentItem, indexEntry, search);
    });
  }
};

// ── Book mode sidebar ──
function buildBookSidebar(sidebar, layout, indexEntry, currentId, pub, modeToggle) {
  const pubName = pub || _pubIndex?.id_to_publication?.[currentId] || indexEntry?.publication || _currentItem?.publication || '';
  const pubData = _pubIndex?.publications?.[pubName];

  if (!pubData || !_currentList.length) {
    // Fallback to category if no publication data
    buildCategorySidebar(sidebar, layout, indexEntry, currentId, modeToggle);
    return;
  }

  // Find publication metadata for cover
  let coverImg = '';
  let titleJa = pubData.title_ja || pubName;
  let titlePt = pubData.title_pt || pubName;

  if (pubData.cover_image) {
    coverImg = `<img src="assets/img/${pubData.cover_image}" class="sidebar-book-cover" alt="${escHtml(titlePt)}" onerror="this.style.display='none'">`;
  }

  const siblings = _currentList;
  const GROUP_SIZE = 50;

  let navHtml = '';
  if (detectVolumeGrouping(siblings)) {
    // Group by 号 volume number (e.g. 御教え集, 御垂示録, 御光話録, 浄霊法講座…)
    navHtml = buildVolumedNav(siblings, currentId);
  } else if (siblings.length > GROUP_SIZE) {
    navHtml = buildGroupedNav(siblings, currentId, GROUP_SIZE);
  } else {
    navHtml = `<div class="reader-nav-list">${buildNavItems(siblings, currentId)}</div>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-book-header">
        ${coverImg}
        <div class="sidebar-book-info">
          <div class="sidebar-book-title">${escHtml(titlePt)}</div>
          ${titleJa !== titlePt ? `<div class="sidebar-book-title-ja">${escHtml(titleJa)}</div>` : ''}
          <div class="sidebar-count">${pubData.total} artigos</div>
        </div>
      </div>
      ${modeToggle}
      ${navHtml}
    </div>`;

  if (layout) layout.classList.remove('reader-layout--no-sidebar');
  scrollToActive(sidebar);
}

// ── Shinchi (神智之光) accordion sidebar ──
// Portuguese translations for shinchi category titles (by cat_num)
const SHINCHI_CAT_PT = {
  1:  'Elucidação sobre Deus',
  2:  'Deus Supremo (Miroku Ōmikami)',
  3:  'As Miríades de Deuses',
  4:  'Meishu-Sama',
  5:  'O Mundo Espiritual',
  6:  'Construção e Destruição',
  7:  'Visão Geral da Religião',
  8:  'Religião e Arte',
  9:  'A Essência do Ser Humano',
  10: 'Pensamentos e Kotodama',
  11: 'Povos, Pátria e Superstições',
  12: 'Fé — Edição Especial',
  13: 'Fé — Obra da Kyusei e Difusão',
  14: 'Fé — Ingresso e Dificuldades',
  15: 'Johrei (Vol. 1)',
  16: 'Johrei (Vol. 2)',
  17: 'Arte da Medicina (I)',
  18: 'Arte da Medicina (II)',
  19: 'Arte da Medicina (III)',
  20: 'Arte da Medicina (IV)',
  21: 'Arte da Medicina (V)',
  22: 'Arte da Medicina (VI)',
  23: 'Arte da Medicina (VII)',
  24: 'Arte da Medicina (VIII)',
  25: 'Arte da Medicina (IX)',
  26: 'Arte da Medicina (X)',
  27: 'Estudos Espirituais (I)',
  28: 'Estudos Espirituais (II)',
  29: 'Estudos Espirituais (III)',
  30: 'Estudos Espirituais (IV)',
  31: 'Estudos Espirituais (V)',
  32: 'Estudos Espirituais (VI)',
  33: 'Estudos Espirituais (VII)',
  34: 'Estudos Espirituais (VIII)',
  35: 'Estudos Espirituais (IX)',
  36: 'Agricultura Natural',
  37: 'Milagres e Fenômenos Singulares',
  38: 'Rituais e Cerimônias (I)',
  39: 'Rituais e Cerimônias (II)',
  40: 'Rituais e Cerimônias (III)',
  41: 'Culto aos Espíritos (I)',
  42: 'Culto aos Espíritos (II)',
  43: 'Culto aos Espíritos (III)',
  44: 'Culto aos Espíritos (IV)',
  45: 'Assuntos Humanos (I)',
  46: 'Assuntos Humanos (II)',
  47: 'Sociedade e Relações Humanas',
  48: 'Política, Economia e Sociedade',
  49: 'Estudo e Conhecimento',
  50: 'Astronomia e Geografia',
};

// Return label for a shinchi sub-category.
// Uses label_pt from shinchi_labels.json if available and filled, else label_ja.
function shortSubLabel(sub, catNum) {
  if (_shinchiLabels && catNum) {
    const catLabels = _shinchiLabels[String(catNum)];
    if (catLabels) {
      const entry = catLabels.subs?.find(s => s.label_ja === sub.label_ja);
      if (entry?.label_pt?.trim()) return entry.label_pt.trim();
    }
  }
  return sub.label_ja || sub.title_pt || '';
}

function buildShinchiSidebar(sidebar, layout, indexEntry, currentId) {
  if (!_shinchiIndex) {
    sidebar.innerHTML = '<div class="sidebar-section"><p>Carregando…</p></div>';
    return;
  }

  // Find which category/sub the current article belongs to
  let activeCat = null, activeSub = null;
  const catNums = Object.keys(_shinchiIndex).sort((a, b) => parseInt(a) - parseInt(b));
  for (const cn of catNums) {
    const cat = _shinchiIndex[cn];
    for (let si = 0; si < cat.sub_categories.length; si++) {
      if (cat.sub_categories[si].id === currentId) {
        activeCat = cn;
        activeSub = si;
        break;
      }
    }
    if (activeCat) break;
  }

  let navHtml = '';
  for (const cn of catNums) {
    const cat = _shinchiIndex[cn];
    const isCatActive = cn === activeCat;

    let subsHtml = '';
    cat.sub_categories.forEach((sub, si) => {
      const isSubActive = isCatActive && si === activeSub;
      const hasContent = !!sub.id;
      const label = shortSubLabel(sub, cn);
      const topicCount = sub.topics?.length || 0;

      // Topics list (shown inside sub-category) — clickable, with auto-scroll
      let topicsHtml = '';
      if (sub.topics?.length) {
        topicsHtml = '<div class="shinchi-sb-topics">' +
          sub.topics.map((t, ti) => {
            const partFile = (_searchIdx?.find(x => x.id === sub.id))?.part_file || '';
            const isTopicActive = isSubActive && ti === _activeTopic;
            // If already on this article, just scroll; otherwise navigate then scroll
            const clickHandler = isSubActive
              ? `scrollToTopic(${ti})`
              : `navigateTo('${sub.id}','${partFile}',${ti})`;
            return `<div class="shinchi-sb-topic${isTopicActive ? ' active' : ''}" data-topic-idx="${ti}"
              onclick="${clickHandler}">
              <span class="shinchi-sb-topic-text" data-ja="${escHtml(t.topic_ja)}">${escHtml(t.topic_ja)}</span>
              ${t.date ? `<span class="shinchi-sb-date">${t.date}</span>` : ''}
            </div>`;
          }).join('') + '</div>';
      }

      if (hasContent) {
        subsHtml += `
          <details class="shinchi-sb-sub" ${isSubActive ? 'open' : ''}>
            <summary class="shinchi-sb-sub-header${isSubActive ? ' active' : ''}"
              onclick="event.preventDefault();navigateTo('${sub.id}','${(_searchIdx?.find(x=>x.id===sub.id))?.part_file||''}')">
              <span class="shinchi-sb-sub-label">${escHtml(label)}</span>
              <span class="shinchi-sb-sub-count">${topicCount}</span>
            </summary>
            ${isSubActive ? topicsHtml : ''}
          </details>`;
      } else {
        subsHtml += `
          <div class="shinchi-sb-sub">
            <div class="shinchi-sb-sub-header shinchi-sb-nolink">
              <span class="shinchi-sb-sub-label">${escHtml(label)}</span>
              <span class="shinchi-sb-sub-count">${topicCount}</span>
            </div>
          </div>`;
      }
    });

    navHtml += `
      <details class="shinchi-sb-cat" ${isCatActive ? 'open' : ''}>
        <summary class="shinchi-sb-cat-header${isCatActive ? ' active' : ''}">
          <span class="shinchi-sb-cat-num">${cn}</span>
          <span class="shinchi-sb-cat-title">${escHtml(
            (_shinchiLabels?.[cn]?.cat_title_pt?.trim()) ||
            SHINCHI_CAT_PT[parseInt(cn)] ||
            cat.cat_title_ja
          )}</span>
        </summary>
        <div class="shinchi-sb-cat-body">${subsHtml}</div>
      </details>`;
  }

  sidebar.innerHTML = `
    <div class="sidebar-section shinchi-sidebar">
      <div class="sidebar-book-header">
        <img src="assets/img/gokowa1.jpg" class="sidebar-book-cover" alt="神智之光" onerror="this.style.display='none'">
        <div class="sidebar-book-info">
          <div class="sidebar-book-title">神智之光</div>
          <div class="sidebar-book-title-ja">Shinchi no Hikari</div>
          <div class="sidebar-count">50 篇 · 348 seções</div>
        </div>
      </div>
      <details class="shinchi-book-about">
        <summary class="shinchi-book-about-summary">Sobre esta obra</summary>
        <div class="shinchi-book-about-body">
          <div class="shinchi-book-meta-row"><span class="shinchi-book-meta-label">Subtítulo</span><span>Coleção de Palestras (Supl.)</span></div>
          <div class="shinchi-book-meta-row"><span class="shinchi-book-meta-label">Publicação</span><span>Data desconhecida</span></div>
          <div class="shinchi-book-meta-row"><span class="shinchi-book-meta-label">Organização</span><span>Inoue Motokichi</span></div>
          <p class="shinchi-book-about-desc">Esta coletânea de perguntas e respostas foi organizada por Inoue Motokichi com autorização de Meishu-Sama e publicada pela Sekai Kyusei Kyo como "Coleção de Palestras (Supl.)". Contém aproximadamente 5.000 questões e respostas. Mistura respostas diretas de Meishu-Sama com partes transmitidas pelo Mestre Inoue. O material é denso e inclui conteúdos não destinados ao público geral — recomenda-se a leitura prévia do "Curso de Kannon" antes de prosseguir.</p>
        </div>
      </details>
      <div class="shinchi-sb-tree">${navHtml}</div>
    </div>`;

  if (layout) layout.classList.remove('reader-layout--no-sidebar');

  // Auto-scroll to active sub-category
  requestAnimationFrame(() => {
    const active = sidebar.querySelector('.shinchi-sb-sub-header.active');
    if (active) active.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}

// ─── Volume grouping helpers ───────────────────────────────────
function getVolumeNum(issuePageStr) {
  // Extract the first 号 number: "3号, 28号, P.5" → 3; normalize full-width digits
  const s = String(issuePageStr || '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48));
  const m = s.match(/^(\d+)号/);
  return m ? parseInt(m[1]) : null;
}

function detectVolumeGrouping(items) {
  // Use volume grouping if ≥40% of items have a valid 号 number
  const withVol = items.filter(x => getVolumeNum(x.issue_page) !== null);
  return withVol.length >= Math.max(2, items.length * 0.4);
}

function buildVolumedNav(items, currentId) {
  const volMap = new Map(); // num → { num, label, items[] }
  for (const item of items) {
    const num = getVolumeNum(item.issue_page);
    const key = num ?? 'none';
    if (!volMap.has(key)) volMap.set(key, { num: num ?? 9999, label: num != null ? `${num}号` : 'Sem volume', items: [] });
    volMap.get(key).items.push(item);
  }
  return [...volMap.values()]
    .sort((a, b) => a.num - b.num)
    .map(grp => {
      const hasActive = grp.items.some(x => x.id === currentId);
      return `
        <details class="book-vol-group" ${hasActive ? 'open' : ''}>
          <summary class="book-vol-header">
            <span class="book-vol-label">${grp.label}</span>
            <span class="book-vol-count">${grp.items.length}</span>
          </summary>
          <div class="reader-nav-list">${buildNavItems(grp.items, currentId)}</div>
        </details>`;
    }).join('');
}

function buildGroupedNav(siblings, currentId, groupSize) {
  const groups = [];
  for (let i = 0; i < siblings.length; i += groupSize) {
    const group = siblings.slice(i, i + groupSize);
    const start = i + 1;
    const end = Math.min(i + groupSize, siblings.length);
    const hasActive = group.some(x => x.id === currentId);
    groups.push({ start, end, items: group, hasActive });
  }

  return groups.map(g => {
    const items = buildNavItems(g.items, currentId, g.start - 1);
    return `
      <details class="sidebar-group" ${g.hasActive ? 'open' : ''}>
        <summary class="sidebar-group-header">
          <span>${g.start}–${g.end}</span>
          <svg viewBox="0 0 24 24" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
        </summary>
        <div class="reader-nav-list">${items}</div>
      </details>`;
  }).join('');
}

function buildNavItems(items, currentId, offset = 0) {
  return items.map((x, i) => {
    const isActive = x.id === currentId;
    let eraStr = '';
    if (x.date_iso) {
      try {
        const parts = x.date_iso.split('-');
        const y = parseInt(parts[0]);
        if (!isNaN(y)) {
          eraStr = `S${y - 1925}`;
          const m = parseInt(parts[1]);
          if (!isNaN(m)) eraStr += `.${m}`;
          const d = parseInt(parts[2]);
          if (!isNaN(d)) eraStr += `.${d}`;
        }
      } catch(e) {}
    }
    if (!eraStr && x.year) eraStr = `S${x.year - 1925}`;
    const link = `<a href="reader.html?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file || '')}"
      class="reader-nav-item${isActive ? ' active' : ''}"
      onclick="navigateTo('${x.id}','${x.part_file || ''}'); return false;">
      <span class="reader-nav-num">${offset + i + 1}</span>
      <span class="reader-nav-title">${escHtml((x.title || '').substring(0, 60))}</span>
      ${eraStr ? `<span class="reader-nav-era">${eraStr}</span>` : ''}
    </a>`;
    // Active article gets a topics container populated by syncBookTopics()
    const topics = isActive ? '<div class="book-item-topics" id="book-item-topics"></div>' : '';
    return link + topics;
  }).join('');
}

// ── List/planilha mode sidebar ──
function buildListSidebar(sidebar, layout, indexEntry, currentId, listKey, modeToggle) {
  const section = _sectionTables?.[listKey];
  const label = section?.title_pt || listKey;
  const labelJa = section?.title_ja || '';

  if (!_currentList.length) {
    buildCategorySidebar(sidebar, layout, indexEntry, currentId, modeToggle);
    return;
  }

  const navItems = buildNavItems(_currentList, currentId);

  sidebar.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-list-header">
        <div class="sidebar-label">${escHtml(label)}</div>
        ${labelJa ? `<div class="sidebar-label-ja">${escHtml(labelJa)}</div>` : ''}
        <div class="sidebar-count">${_currentList.length} artigos</div>
      </div>
      ${modeToggle}
      <div class="reader-nav-list">${navItems}</div>
    </div>`;

  if (layout) layout.classList.remove('reader-layout--no-sidebar');
  scrollToActive(sidebar);
}

// ── Category-based sidebar (original behavior) ──
function buildCategorySidebar(sidebar, layout, indexEntry, currentId, modeToggle) {
  const siblings = _currentList;
  const typeLabel = indexEntry?.category || _currentItem?.category || 'Ensinamentos';

  const navItems = buildNavItems(siblings, currentId);

  sidebar.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-label">${escHtml(typeLabel)}</div>
      <div class="sidebar-count">${siblings.length} artigos</div>
      ${modeToggle || ''}
      <div class="reader-nav-list">${navItems}</div>
    </div>`;

  if (layout) layout.classList.remove('reader-layout--no-sidebar');
  scrollToActive(sidebar);
}

// ── TOC sidebar (headings from article) ──
function buildTocSidebar(sidebar, layout, headings) {
  const lang = localStorage.getItem('site_lang') || 'pt';
  const isPt = lang === 'pt';
  const label = isPt ? `<div class="sidebar-label">ÍNDICE</div>` : `<div class="sidebar-label">目次</div>`;

  const tocItems = headings.map((h, i) => {
    if (!h.id) {
      const safeText = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      h.id = `toc-${i}-${safeText}`;
    }
    const isH3 = h.tagName.toLowerCase() === 'h3';
    return `<a href="#${h.id}" class="reader-nav-item" style="padding-left: ${isH3 ? '24px' : '12px'}; font-size: ${isH3 ? '0.8rem' : '0.85rem'}">
      ${escHtml(h.textContent)}
    </a>`;
  }).join('');

  sidebar.innerHTML = `<div class="sidebar-section">${label}${tocItems}</div>`;
  if (layout) layout.classList.remove('reader-layout--no-sidebar');
}

function scrollToActive(sidebar) {
  requestAnimationFrame(() => {
    const active = sidebar.querySelector('.reader-nav-item.active');
    if (active) active.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}

// Classify a search index entry by type (same logic as browse.js)
function classifyType(x) {
  const url = x.url || '';
  const parts = url.split('/');
  const prefix = parts[0] || '';
  const f1 = prefix === 'search1' ? (parts[1] || '') : '';
  const f2 = prefix === 'search2' ? (parts[1] || '') : '';

  if (f1 === 'kouwa' || f2 === 'kouwa') return 'palestra';
  if (f1 === 'situmon') return 'qa';
  if (f1 === 'taidan') return 'dialogo';
  if (f1 === 'English') return 'english';
  if (prefix === 'search1') return 'ensaio';
  if (f2 === 'okage' || prefix === 'gosuiji') return 'revelacao';
  if (f2 === 'kikou' || f2 === 'kikou2') return 'viagem';
  if (f2 === 'jorei') return 'jorei';
  if (f2 === 'sanko') return 'sanko';
  if (prefix === 'miosie') return 'miosie';
  if (url.startsWith('kanren/hikari')) return 'hikarinochie';
  if (url.startsWith('kanren/true')) return 'chijotengoku';
  if (url.includes('/dendo')) return 'dendo';
  if (prefix === 'kanren') return 'kanren';
  if (prefix === 'sasshi') return 'sasshi';
  if (prefix === 'hakkousi') return 'hakkousi';
  return 'outro';
}

function getTypeLabel(type) {
  const labels = {
    revelacao: '御垂示録 Gosuijiroku', miosie: '御教え集 Mioshieshu',
    viagem: '御光話録 Ohikari Kowa Roku', hikarinochie: '神智之光 Hikari no Chie',
    jorei: '浄霊法講座 Johrei Ho Koza', dendo: '伝道の引き Dendo no Shiori',
    english: 'ENGLISH', palestra: '御講話 Palestras', qa: '質問応答 Perguntas e Respostas',
    dialogo: '対談 Diálogos', sanko: '参考資料', sasshi: '明主様関連寄稿',
    hakkousi: 'その他の寄稿', kanren: '関連出版物', chijotengoku: '地上天国',
  };
  return labels[type] || type;
}

// ─── Browse / landing (no id) ─────────────────────────────────
async function showBrowse(filterCategory) {
  const container = document.getElementById('readerContent');
  if (!container) return;

  showLoading();
  await loadSearchIndex();

  // Categories
  const cats = {};
  _searchIdx?.forEach(x => {
    const c = x.category || 'Outros';
    if (!cats[c]) cats[c] = [];
    cats[c].push(x);
  });

  const filterCat = decodeURIComponent(filterCategory || '');
  const lang = localStorage.getItem('site_lang') || 'pt';

  if (filterCat && cats[filterCat]) {
    // Show list for this category
    const items = cats[filterCat];
    const list = items.map(x => `
      <a href="reader.html?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file)}"
         class="teaching-list-item"
         onclick="navigateTo('${x.id}','${x.part_file}'); return false;">
        <div class="teaching-list-title">${escHtml(x.title)}</div>
        <div class="teaching-list-meta">
          ${x.year ? `<span>${x.year}</span>` : ''}
          ${x.publication ? `<span>${escHtml(String(x.publication).substring(0,50))}</span>` : ''}
        </div>
        ${x.content_snippet ? `<div class="teaching-list-snippet">${escHtml(stripMd(x.content_snippet).substring(0,120))}…</div>` : ''}
      </a>`).join('');

    container.innerHTML = `
      <div class="browse-header">
        <a href="reader.html" class="back-link">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          ${lang === 'ja' ? 'カテゴリ一覧' : 'Todas as categorias'}
        </a>
        <h1 class="browse-title">${escHtml(filterCat)}</h1>
        <p class="browse-count">${items.length} ${lang === 'ja' ? '件' : 'ensinamentos'}</p>
      </div>
      <div class="teaching-list">${list}</div>`;

    document.title = `${filterCat} — Mioshie Zenshu`;
    return;
  }

  // Show all categories
  const catCards = Object.entries(cats)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([cat, items]) => `
      <a href="reader.html?cat=${encodeURIComponent(cat)}"
         class="cat-card"
         onclick="window.history.pushState({}, '', 'reader.html?cat=${encodeURIComponent(cat)}'); showBrowse('${cat.replace(/'/g,"\\'")}'); return false;">
        <div class="cat-card__name">${escHtml(cat)}</div>
        <div class="cat-card__count">${items.length} ${lang === 'ja' ? '件' : 'ensinamentos'}</div>
      </a>`).join('');

  container.innerHTML = `
    <div class="browse-header">
      <h1 class="browse-title lang-pt">Ensinamentos por Categoria</h1>
      <h1 class="browse-title lang-ja" style="display:none">カテゴリ別御教え</h1>
      <p class="browse-count">${_searchIdx?.length || 0} ${lang === 'ja' ? '件' : 'ensinamentos indexados'}</p>
    </div>
    <div class="cat-grid">${catCards}</div>`;

  document.title = 'Ensinamentos — Mioshie Zenshu';
  applyLanguage?.(lang, false);
}

// ─── Navigation ───────────────────────────────────────────────
function getSiblings() {
  if (!_currentItem || !_currentList.length) return { prev: null, next: null };
  const idx = _currentList.findIndex(x => x.id === _currentItem.id);
  return {
    prev: idx > 0                        ? _currentList[idx - 1] : null,
    next: idx < _currentList.length - 1 ? _currentList[idx + 1] : null,
  };
}

window.navigateTo = function(id, partFile, topicIdx) {
  const p = new URLSearchParams(window.location.search);
  const cat = p.get('cat') || '';
  const search = p.get('search') || p.get('s') || '';
  const mode = p.get('mode') || '';
  const pub = p.get('pub') || '';
  const list = p.get('list') || '';

  _activeTopic = (topicIdx !== undefined && topicIdx >= 0) ? topicIdx : -1;

  const newP = new URLSearchParams();
  newP.set('id', id);
  newP.set('part', partFile);
  if (cat) newP.set('cat', cat);
  if (search) newP.set('search', search);
  if (mode) newP.set('mode', mode);
  if (pub) newP.set('pub', pub);
  if (list) newP.set('list', list);

  const url = `reader.html?${newP.toString()}`;
  window.history.pushState({ id, partFile, cat, search, mode, pub, list }, '', url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initReader();
};

// Scroll to Nth heading in reader content and highlight it
window.scrollToTopic = function(idx) {
  _activeTopic = idx;
  const headings = document.querySelectorAll('.reader-content h2, .reader-content h3, .reader-content strong:first-child');
  const h2s = document.querySelectorAll('.reader-content h2');
  // Prefer h2 headings (numbered topics), fall back to all headings
  const targets = h2s.length > 1 ? h2s : headings;
  const target = targets[idx];
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('topic-highlight');
    setTimeout(() => target.classList.remove('topic-highlight'), 2000);
  }
  // Update active state in sidebar
  document.querySelectorAll('.shinchi-sb-topic').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
};

// ─── Favorites ────────────────────────────────────────────────
window.toggleFavorite = function() {
  if (!_currentItem) return;
  const lang  = localStorage.getItem('site_lang') || 'pt';

  let favs = [];
  try { favs = JSON.parse(localStorage.getItem('zenshu_favorites') || '[]'); } catch(e) {}

  const idx  = favs.findIndex(f => f.id === _currentItem.id);
  const isSaved = idx !== -1;

  if (isSaved) {
    favs.splice(idx, 1);
  } else {
    favs.unshift({
      id:    _currentItem.id,
      title: _currentItem.title,
      part:  getParams().part,
      cat:   _currentItem.category,
      time:  Date.now(),
    });
  }

  try { localStorage.setItem('zenshu_favorites', JSON.stringify(favs.slice(0, 100))); } catch(e) {}
  updateFavBtn();
  showToast?.(isSaved
    ? (lang === 'ja' ? '削除しました' : 'Removido dos salvos')
    : (lang === 'ja' ? '保存しました' : 'Salvo!')
  );
};

function updateFavBtn() {
  const btn = document.getElementById('favBtn');
  if (!btn || !_currentItem) return;
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem('zenshu_favorites') || '[]'); } catch(e) {}
  const saved = favs.some(f => f.id === _currentItem.id);
  const svg = btn.querySelector('svg');
  btn.classList.toggle('active', saved);
  if (svg) svg.setAttribute('fill', saved ? 'currentColor' : 'none');
}

// ─── History ──────────────────────────────────────────────────
function saveHistory(item, indexEntry) {
  try {
    const hist = JSON.parse(localStorage.getItem('zenshu_history') || '[]');
    const filtered = hist.filter(h => h.id !== item.id);
    filtered.unshift({
      id:    item.id,
      title: item.title,
      part:  indexEntry?.part_file || '',
      cat:   indexEntry?.category || item.category || '',
      time:  Date.now(),
    });
    localStorage.setItem('zenshu_history', JSON.stringify(filtered.slice(0, 50)));
  } catch(e) {}
}

function savePosition() {
  // Lightweight — just update timestamp so history stays fresh
  if (!_currentItem) return;
  try {
    const hist = JSON.parse(localStorage.getItem('zenshu_history') || '[]');
    const entry = hist.find(h => h.id === _currentItem.id);
    if (entry) {
      entry.scroll = window.scrollY;
      localStorage.setItem('zenshu_history', JSON.stringify(hist));
    }
  } catch(e) {}
}

// ─── Progress bar ─────────────────────────────────────────────
function updateProgress() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  const el  = document.getElementById('teachingContent');
  if (!el) { bar.style.width = '0%'; return; }
  const rect   = el.getBoundingClientRect();
  const total  = rect.height - window.innerHeight;
  const pct    = total > 0 ? Math.min(100, Math.max(0, (-rect.top / total) * 100)) : 100;
  bar.style.width = pct + '%';
}

// ─── Comparison toggle ────────────────────────────────────────
window.toggleComparison = function() {
  const val = localStorage.getItem('reader_comparison') === 'true';
  localStorage.setItem('reader_comparison', String(!val));
  if (_currentItem) {
    const { search } = getParams();
    const indexEntry = _searchIdx?.find(x => x.id === _currentItem.id);
    renderTeaching(_currentItem, indexEntry, search);
  }
};

// ─── Share ────────────────────────────────────────────────────
window.shareArticle = async function() {
  try {
    await navigator.share({ title: document.title, url: window.location.href });
  } catch(e) {}
};

// ─── Search highlight ─────────────────────────────────────────
function highlightSearch(query) {
  const content = document.getElementById('teachingContent');
  if (!content || !query) return;
  const terms = query.trim().split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return;

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  const nodes  = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  const re = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  nodes.forEach(n => {
    if (!re.test(n.nodeValue)) return;
    re.lastIndex = 0;
    const span = document.createElement('span');
    span.innerHTML = escHtml(n.nodeValue).replace(re, '<mark class="search-highlight">$1</mark>');
    n.parentNode.replaceChild(span, n);
  });

  const first = content.querySelector('mark.search-highlight');
  if (first) setTimeout(() => first.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

// ─── UI states ────────────────────────────────────────────────
function showLoading() {
  const container = document.getElementById('readerContent');
  if (container) container.innerHTML = `
    <div class="reader-loading">
      <div class="reader-loading__spinner"></div>
      <p class="lang-pt">Carregando ensinamento…</p>
      <p class="lang-ja" style="display:none">読み込み中…</p>
    </div>`;
  applyLanguage?.(localStorage.getItem('site_lang') || 'pt', false);
}

function showError(msg) {
  const container = document.getElementById('readerContent');
  if (container) container.innerHTML = `
    <div class="reader-error">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${escHtml(msg)}</p>
      <a href="reader.html" class="btn-back">Ver todos os ensinamentos</a>
    </div>`;
}

// (escHtml and stripMd defined at top of file)
