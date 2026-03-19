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

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyStoredReaderPrefs?.();
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
  };
}

// ─── Main init ────────────────────────────────────────────────
async function initReader() {
  const { id, part, search, category } = getParams();
  const container = document.getElementById('readerContent');
  if (!container) return;

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

    // 4. Build neighbour list from same category in search index
    if (_searchIdx) {
      const cat = indexEntry?.category || item.category || '';
      _currentList = _searchIdx.filter(x => x.category === cat);
    }

    // 5. Render
    renderTeaching(item, indexEntry, search);
    buildSidebar(indexEntry);
    saveHistory(item, indexEntry);

  } catch (err) {
    console.error('[reader]', err);
    showError('Erro ao carregar ensinamento. Tente novamente.');
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
  const date       = item.date || '';
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
}

// ─── Content rendering ────────────────────────────────────────
function renderContent(raw, isPt) {
  if (!raw) return '<p class="empty-content">Conteúdo não disponível.</p>';

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

  // ── 1. Build publication/compilation index (siblings in same type) ──
  if (_searchIdx && indexEntry) {
    // Find siblings: same _type classification as current item
    const currentType = classifyType(indexEntry);
    let siblings = [];
    if (currentType && currentType !== 'ensaio' && currentType !== 'outro') {
      siblings = _searchIdx.filter(x => classifyType(x) === currentType);
    }
    // Fallback: same publication_group
    if (siblings.length < 2) {
      const pubGroup = indexEntry.publication_group || indexEntry.publication;
      if (pubGroup) {
        siblings = _searchIdx.filter(x => (x.publication_group || x.publication) === pubGroup);
      }
    }

    if (siblings.length > 1) {
      // Sort by year then title
      siblings.sort((a, b) => {
        const ya = a.year || 9999, yb = b.year || 9999;
        if (ya !== yb) return ya - yb;
        return (a.title || '').localeCompare(b.title || '');
      });

      const typeLabel = getTypeLabel(currentType);
      const currentIdx = siblings.findIndex(x => x.id === currentId);

      const items = siblings.map((x, i) => {
        const isActive = x.id === currentId;
        const eraStr = x.year ? `S${x.year - 1925}` : '';
        return `<a href="reader.html?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file || '')}"
          class="reader-nav-item${isActive ? ' active' : ''}"
          onclick="navigateTo('${x.id}','${x.part_file || ''}'); return false;">
          <span class="reader-nav-num">${i + 1}</span>
          <span class="reader-nav-title">${escHtml((x.title || '').substring(0, 60))}</span>
          ${eraStr ? `<span class="reader-nav-era">${eraStr}</span>` : ''}
        </a>`;
      }).join('');

      sidebar.innerHTML = `
        <div class="sidebar-section">
          <div class="sidebar-label">${escHtml(typeLabel)}</div>
          <div class="sidebar-count">${siblings.length} artigos</div>
          <div class="reader-nav-list">${items}</div>
        </div>`;

      if (layout) layout.classList.remove('reader-layout--no-sidebar');

      // Scroll active item into view
      requestAnimationFrame(() => {
        const active = sidebar.querySelector('.reader-nav-item.active');
        if (active) active.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
      return;
    }
  }

  // ── 2. Fallback: TOC from headings within current article ──
  const container = document.getElementById('readerContent');
  const headings = container ? Array.from(container.querySelectorAll('.reader-content h2, .reader-content h3')) : [];

  if (headings.length > 2) {
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
    return;
  }

  // ── 3. No sidebar content ──
  if (layout) layout.classList.add('reader-layout--no-sidebar');
  sidebar.innerHTML = '';
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

window.navigateTo = function(id, partFile) {
  const url = `reader.html?id=${encodeURIComponent(id)}&part=${encodeURIComponent(partFile)}`;
  window.history.pushState({ id, partFile }, '', url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initReader();
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
