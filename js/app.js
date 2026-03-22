/* =============================================================
   Mioshie Zenshu Modern — app.js
   Handles: theme, language, mobile nav, search modal, toast
   ============================================================= */

// ─── Constants ───────────────────────────────────────────────
const THEMES = ['light', 'dark', 'quiet', 'paper', 'calm', 'bold', 'focus'];

const THEME_META = {
  light:  { label: 'Claro',     labelJa: 'ライト',   swatch: '#F8F9F5' },
  dark:   { label: 'Noturno',   labelJa: 'ダーク',   swatch: '#161616' },
  quiet:  { label: 'Quieto',    labelJa: 'クワイエット', swatch: '#4A4A4D' },
  paper:  { label: 'Papel',     labelJa: 'ペーパー', swatch: '#EFE8D6' },
  calm:   { label: 'Calmo',     labelJa: 'カーム',   swatch: '#DFCDAE' },
  bold:   { label: 'Negrito',   labelJa: 'ボールド', swatch: '#FFFFFF' },
  focus:  { label: 'Foco',      labelJa: 'フォーカス', swatch: '#FAFAFA' },
};

const UI = {
  pt: {
    siteTitle:   'Mioshie Zenshu',
    search:      'Buscar nos ensinamentos...',
    searchBtn:   'Buscar',
    noResults:   'Nenhum resultado encontrado.',
    all:         'Tudo',
    titleOnly:   'Só Título',
    contentOnly: 'Só Conteúdo',
    theme:       'Tema',
    language:    '日本語',
    nav:         'Menu',
    close:       'Fechar',
    teachings:   'Ensinamentos',
    poems:       'Poemas',
    kannon:      'Kannon',
    johrei:      'Johrei',
    search_page: 'Busca',
  },
  ja: {
    siteTitle:   '御教え全集',
    search:      '御教えを検索...',
    searchBtn:   '検索',
    noResults:   '結果が見つかりません。',
    all:         'すべて',
    titleOnly:   'タイトルのみ',
    contentOnly: '内容のみ',
    theme:       'テーマ',
    language:    'Português',
    nav:         'メニュー',
    close:       '閉じる',
    teachings:   '御教え',
    poems:       '御歌',
    kannon:      '観音',
    johrei:      '浄霊',
    search_page: '検索',
  }
};

// ─── State ───────────────────────────────────────────────────
let currentLang  = localStorage.getItem('site_lang')  || 'pt';
let currentTheme = localStorage.getItem('site_theme')  || 'light';
let searchIndex  = null;
let searchLoading = false;

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  /* auth temporarily disabled for dev
  if (sessionStorage.getItem('mioshie_auth') !== 'true') {
    renderLoginOverlay();
    return;
  }
  */
  document.documentElement.style.display = '';
  applyTheme(currentTheme, false);
  applyLanguage(currentLang, false);
  buildHeader();
  buildMobileNav();
  buildThemePanel();
  buildToast();
});

function renderLoginOverlay() {
  document.documentElement.style.display = '';
  
  const overlay = document.createElement('div');
  overlay.className = 'login-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg,#F8F9F5);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:"Outfit",sans-serif;color:var(--text,#333);';
  
  overlay.innerHTML = `
    <div style="background:var(--surface,#fff);padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);text-align:center;max-width:400px;width:90%;">
      <div style="margin-bottom:20px;display:inline-block;">
        <div style="width:48px;height:48px;border-radius:50%;background:#B8860B;margin:0 auto;display:flex;align-items:center;justify-content:center;">
          <div style="width:12px;height:12px;background:#fff;border-radius:50%;"></div>
        </div>
      </div>
      <h2 style="margin-top:0;margin-bottom:10px;font-weight:600;font-size:1.5rem;">Mioshie Zenshu</h2>
      <p style="margin-bottom:24px;font-size:0.95rem;color:var(--text-muted,#666);">Por favor, insira a senha de acesso.</p>
      <input type="password" id="loginPwInput" placeholder="Senha" style="width:100%;padding:12px;margin-bottom:15px;border:1px solid #ccc;border-radius:6px;font-size:1rem;font-family:inherit;box-sizing:border-box;text-align:center;">
      <button id="loginSubmitBtn" style="width:100%;padding:12px;background:#B8860B;color:#fff;border:none;border-radius:6px;font-size:1rem;font-weight:600;cursor:pointer;transition:background 0.2s;">Entrar</button>
      <div id="loginErrorMsg" style="color:#d32f2f;margin-top:12px;font-size:0.9rem;display:none;">Senha incorreta. Tente novamente.</div>
    </div>
  `;
  
  Array.from(document.body.children).forEach(child => {
    if (child.style) {
      child.dataset.originalDisplay = child.style.display || '';
      child.style.display = 'none';
    }
  });
  
  document.body.appendChild(overlay);

  const submitBtn = overlay.querySelector('#loginSubmitBtn');
  const pwInput = overlay.querySelector('#loginPwInput');
  const errorMsg = overlay.querySelector('#loginErrorMsg');

  const attemptLogin = () => {
    if (pwInput.value === 'Mioshie?567') {
      sessionStorage.setItem('mioshie_auth', 'true');
      overlay.remove();
      Array.from(document.body.children).forEach(child => {
        if (child.style && child.dataset.originalDisplay !== undefined) {
          child.style.display = child.dataset.originalDisplay;
          delete child.dataset.originalDisplay;
        }
      });
      applyTheme(currentTheme, false);
      applyLanguage(currentLang, false);
      buildHeader();
      buildMobileNav();
      buildThemePanel();
      buildToast();
    } else {
      errorMsg.style.display = 'block';
      pwInput.value = '';
      pwInput.focus();
    }
  };

  submitBtn.addEventListener('click', attemptLogin);
  pwInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
  });
  
  setTimeout(() => pwInput.focus(), 100);
}

// ─── Theme ───────────────────────────────────────────────────
function applyTheme(theme, save = true) {
  if (!THEMES.includes(theme)) theme = 'light';
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (save) localStorage.setItem('site_theme', theme);

  // Update theme buttons if panel exists
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function cycleTheme() {
  const idx = THEMES.indexOf(currentTheme);
  applyTheme(THEMES[(idx + 1) % THEMES.length]);
}

// ─── Language ─────────────────────────────────────────────────
function applyLanguage(lang, save = true) {
  if (lang !== 'pt' && lang !== 'ja') lang = 'pt';
  currentLang = lang;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'ja';
  if (save) localStorage.setItem('site_lang', lang);

  // Toggle visibility of .lang-pt / .lang-ja elements
  document.querySelectorAll('.lang-pt').forEach(el => {
    el.style.display = lang === 'pt' ? '' : 'none';
  });
  document.querySelectorAll('.lang-ja').forEach(el => {
    el.style.display = lang === 'ja' ? '' : 'none';
  });

  // Update lang toggle button label
  const langBtn = document.getElementById('btn-lang');
  if (langBtn) langBtn.title = lang === 'pt' ? '日本語に切替' : 'Mudar para Português';
  const langLabel = document.getElementById('lang-label');
  if (langLabel) langLabel.textContent = lang === 'pt' ? '日本語' : 'PT';
}

function toggleLanguage() {
  applyLanguage(currentLang === 'pt' ? 'ja' : 'pt');
}

// ─── Header injection ─────────────────────────────────────────
function buildHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  // Show "Voltar" button on reader pages (both iframe modal and direct access)
  const isReaderPage = window.location.pathname.includes('reader.html');
  const inIframe = window.parent !== window;

  if (isReaderPage) {
    if (inIframe) {
      // Hide nav links inside modal
      const nav = header.querySelector('.header__nav');
      if (nav) nav.style.display = 'none';
    }

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-modal';
    backBtn.title = 'Voltar à lista (Esc)';
    backBtn.setAttribute('aria-label', 'Fechar leitor');
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <span>Voltar</span>
    `;
    backBtn.onclick = () => {
      if (inIframe) {
        window.parent.postMessage('close-reader', '*');
      } else {
        // Direct access: go back to browse.html
        const returnUrl = sessionStorage.getItem('browse_return') || 'browse.html';
        window.location.href = returnUrl;
      }
    };
    const logo = header.querySelector('.header__logo');
    if (logo) logo.after(backBtn);
    else header.insertBefore(backBtn, header.firstChild);

    // ESC closes
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (inIframe) window.parent.postMessage('close-reader', '*');
        else {
          const returnUrl = sessionStorage.getItem('browse_return') || 'browse.html';
          window.location.href = returnUrl;
        }
      }
    });
  }

  // Controls div (right side)
  const controls = document.createElement('div');
  controls.className = 'header__controls';
  controls.innerHTML = `
    <button class="btn-icon" id="btn-search" onclick="openSearch()" title="Buscar (/)">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    <button class="btn-icon" id="btn-hamburger" onclick="openMobileNav()" aria-label="Menu">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
  `;
  header.appendChild(controls);
}

// ─── Mobile Nav ───────────────────────────────────────────────
function buildMobileNav() {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  overlay.id = 'mobileNavOverlay';

  // Build theme swatches for inline picker
  const swatchesHtml = THEMES.map(t => {
    const m = THEME_META[t];
    return `<button class="mn-theme-swatch${t === currentTheme ? ' active' : ''}" data-theme="${t}"
      onclick="applyTheme('${t}'); _syncMenuTheme();"
      title="${m.label}"
      style="background:${m.swatch};${t === 'bold' ? 'border:1.5px solid #ccc;' : ''}">
    </button>`;
  }).join('');

  overlay.innerHTML = `
    <div class="mobile-nav-backdrop" onclick="closeMobileNav()"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <span id="mobileMenuTitle">Mioshie Zenshu</span>
        <button class="mobile-nav-close btn-icon" onclick="closeMobileNav()" aria-label="Fechar menu">✕</button>
      </div>
      <div class="mobile-nav-body">

        <!-- ── AÇÕES ── -->
        <div class="mobile-nav-section">
          <span class="lang-pt">Ações</span><span class="lang-ja" style="display:none">操作</span>
        </div>

        <button class="mobile-nav-link" onclick="openHistory(); closeMobileNav();">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="lang-pt">Histórico</span><span class="lang-ja" style="display:none">履歴</span>
        </button>

        <button class="mobile-nav-link" onclick="openFavorites(); closeMobileNav();">
          <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span class="lang-pt">Salvos</span><span class="lang-ja" style="display:none">お気に入り</span>
        </button>

        <!-- ── IDIOMA ── -->
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section">
          <span class="lang-pt">Idioma</span><span class="lang-ja" style="display:none">言語</span>
        </div>
        <div class="mn-lang-row">
          <button class="mn-lang-btn${currentLang === 'pt' ? ' active' : ''}" id="mnLangPt" onclick="_switchMenuLang('pt')">Português</button>
          <button class="mn-lang-btn${currentLang === 'ja' ? ' active' : ''}" id="mnLangJa" onclick="_switchMenuLang('ja')">日本語</button>
        </div>

        <!-- ── TEMAS ── -->
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section">
          <span class="lang-pt">Tema</span><span class="lang-ja" style="display:none">テーマ</span>
        </div>
        <div class="mn-theme-row" id="mnThemeRow">${swatchesHtml}</div>
        <button class="mobile-nav-link mn-settings-link" onclick="openThemePanel(); closeMobileNav();" style="padding-top:6px;padding-bottom:6px;font-size:12px;color:var(--text-muted)">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span class="lang-pt">Fonte & Aparência</span><span class="lang-ja" style="display:none">フォント設定</span>
        </button>

        <!-- ── FONTE ── -->
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section">
          <span class="lang-pt">Tamanho da Fonte</span><span class="lang-ja" style="display:none">フォントサイズ</span>
        </div>
        <div class="mobile-font-row">
          <button class="mobile-font-btn" onclick="changeFontSize(-1)">A−</button>
          <button class="mobile-font-btn" onclick="changeFontSize(1)">A+</button>
        </div>

        <!-- ── NAVEGAÇÃO ── -->
        <div class="mobile-nav-divider"></div>
        <div class="mobile-nav-section">
          <span class="lang-pt">Navegação</span><span class="lang-ja" style="display:none">ナビゲーション</span>
        </div>

        <a href="browse.html" class="mobile-nav-link" onclick="closeMobileNav()">
          ${iconHtml('book')}
          <span class="lang-pt">Ensinamentos</span><span class="lang-ja" style="display:none">御教え</span>
        </a>
        <a href="reader.html" class="mobile-nav-link" onclick="closeMobileNav()">
          <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span class="lang-pt">Leitor</span><span class="lang-ja" style="display:none">リーダー</span>
        </a>
        <a href="poems.html" class="mobile-nav-link" onclick="closeMobileNav()">
          ${iconHtml('feather')}
          <span class="lang-pt">Gosanka</span><span class="lang-ja" style="display:none">御歌</span>
        </a>
        <a href="library.html" class="mobile-nav-link" onclick="closeMobileNav()">
          <svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
          <span class="lang-pt">Biblioteca</span><span class="lang-ja" style="display:none">図書館</span>
        </a>
        <a href="timeline.html" class="mobile-nav-link" onclick="closeMobileNav()">
          <svg viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>
          <span class="lang-pt">Timeline</span><span class="lang-ja" style="display:none">年表</span>
        </a>
        <a href="search.html" class="mobile-nav-link" onclick="closeMobileNav()">
          ${iconHtml('search')}
          <span class="lang-pt">Busca</span><span class="lang-ja" style="display:none">検索</span>
        </a>

      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function openMobileNav() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (!overlay) return;
  // Update title to current article title if on reader page
  const titleEl = document.getElementById('mobileMenuTitle');
  if (titleEl) {
    const docTitle = document.title;
    const match = docTitle.match(/^(.+?)\s*[—–-]\s*Mioshie Zenshu/);
    titleEl.textContent = match ? match[1] : 'Mioshie Zenshu';
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  applyLanguage(currentLang, false);
  _syncMenuTheme();
}

function closeMobileNav() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Sync language buttons in menu
function _switchMenuLang(lang) {
  applyLanguage(lang);
  document.getElementById('mnLangPt')?.classList.toggle('active', lang === 'pt');
  document.getElementById('mnLangJa')?.classList.toggle('active', lang === 'ja');
}

// Sync theme swatches active state
function _syncMenuTheme() {
  document.querySelectorAll('.mn-theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
  });
}

// ─── Search ───────────────────────────────────────────────────
function buildSearchModal() {
  if (document.getElementById('searchModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'searchModal';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-label="Busca">
      <div class="modal__header">
        <div class="search-input-wrap">
          <svg class="search-input-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" id="searchInput"
            placeholder="Buscar nos ensinamentos..." autocomplete="off" spellcheck="false">
        </div>
        <div class="search-filters">
          <label><input type="radio" name="sf" value="all" checked> <span>Tudo</span></label>
          <label><input type="radio" name="sf" value="title"> <span>Só Título</span></label>
          <label><input type="radio" name="sf" value="content"> <span>Só Conteúdo</span></label>
        </div>
      </div>
      <div class="modal__body">
        <ul id="searchResults" style="list-style:none; padding:0; margin:0;"></ul>
        <div id="searchEmpty" class="search-empty" style="display:none">Nenhum resultado encontrado.</div>
        <div id="searchLoading" class="search-empty" style="display:none">Carregando índice...</div>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => { if (e.target === modal) closeSearch(); });
  document.body.appendChild(modal);

  const input = document.getElementById('searchInput');
  input.addEventListener('input', debounce(runSearch, 250));
  input.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
}

async function openSearch() {
  buildSearchModal();
  const modal = document.getElementById('searchModal');
  modal.classList.add('open');
  document.getElementById('searchInput').focus();
  await loadSearchIndex();
}

function closeSearch() {
  const modal = document.getElementById('searchModal');
  if (modal) modal.classList.remove('open');
}

async function loadSearchIndex() {
  if (searchIndex || searchLoading) return;
  searchLoading = true;
  const loading = document.getElementById('searchLoading');
  if (loading) loading.style.display = 'block';

  try {
    const res = await fetch('data/search/advanced_search_index.json');
    searchIndex = await res.json();
  } catch (e) {
    console.error('Failed to load search index', e);
  } finally {
    searchLoading = false;
    if (loading) loading.style.display = 'none';
  }
}

function runSearch() {
  if (!searchIndex) return;

  const query = document.getElementById('searchInput').value.trim();
  const filter = document.querySelector('input[name="sf"]:checked')?.value || 'all';
  const results = document.getElementById('searchResults');
  const empty   = document.getElementById('searchEmpty');

  if (!query || query.length < 2) {
    results.innerHTML = '';
    empty.style.display = 'none';
    return;
  }

  const q = normalizeText(query);
  const terms = q.split(/\s+/).filter(Boolean);

  const matches = searchIndex.filter(item => {
    const titleText   = normalizeText(item.title || '');
    const contentText = normalizeText(item.content_snippet || '');
    const tagsText    = normalizeText((item.tags || []).join(' '));

    if (filter === 'title')   return terms.every(t => titleText.includes(t));
    if (filter === 'content') return terms.every(t => contentText.includes(t) || tagsText.includes(t));
    return terms.every(t => titleText.includes(t) || contentText.includes(t) || tagsText.includes(t));
  }).slice(0, 40);

  empty.style.display = matches.length === 0 ? 'block' : 'none';

  results.innerHTML = matches.map(item => {
    const snippet = highlight(item.content_snippet || '', terms);
    const catLabel = item.category ? `<span>${escHtml(item.category)}</span>` : '';
    const yearLabel = item.year ? ` · <span>${escHtml(String(item.year))}</span>` : '';
    const href = item.url
      ? `reader.html?url=${encodeURIComponent(item.url)}&id=${encodeURIComponent(item.id)}`
      : `reader.html?id=${encodeURIComponent(item.id)}&part=${encodeURIComponent(item.part_file || '')}`;

    return `<li>
      <a href="${href}" class="search-result" onclick="closeSearch()">
        <div class="search-result__title">${highlight(item.title || '', terms)}</div>
        <div class="search-result__meta">${catLabel}${yearLabel}</div>
        <div class="search-result__snippet">${snippet}</div>
      </a>
    </li>`;
  }).join('');
}

// ─── Theme Panel ──────────────────────────────────────────────
function buildThemePanel() {
  if (document.getElementById('themeModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'themeModal';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-label="Configurações de tema" style="max-width:400px">
      <div class="modal__header" style="position:relative; padding:16px 16px 0">
        <h2 style="font-size:1rem; font-weight:600; margin:0 0 4px">
          <span class="lang-pt">Temas & Aparência</span>
          <span class="lang-ja" style="display:none">テーマ設定</span>
        </h2>
        <button class="modal__close" onclick="closeThemePanel()">✕</button>
      </div>
      <div class="modal__body theme-panel">
        <div class="theme-label lang-pt">Tema</div>
        <div class="theme-label lang-ja" style="display:none">テーマ</div>
        <div class="theme-grid" id="themeGrid"></div>
        <div class="theme-label lang-pt">Tamanho da Fonte</div>
        <div class="theme-label lang-ja" style="display:none">フォントサイズ</div>
        <div class="slider-row">
          <label class="lang-pt">Fonte</label>
          <label class="lang-ja" style="display:none">サイズ</label>
          <input type="range" min="16" max="28" step="1" id="fontSizeSlider"
            oninput="updateReaderVar('--reader-font-size', this.value+'px'); document.getElementById('fontSizeVal').textContent=this.value+'px'">
          <span id="fontSizeVal">21px</span>
        </div>
        <div class="slider-row">
          <label class="lang-pt">Linha</label>
          <label class="lang-ja" style="display:none">行間</label>
          <input type="range" min="1.3" max="2.2" step="0.1" id="lineHeightSlider"
            oninput="updateReaderVar('--reader-line-height', this.value); document.getElementById('lineHVal').textContent=this.value">
          <span id="lineHVal">1.7</span>
        </div>
        <div class="toggle-row">
          <span class="lang-pt">Texto justificado</span>
          <span class="lang-ja" style="display:none">両端揃え</span>
          <label class="toggle-switch">
            <input type="checkbox" id="justifyToggle"
              onchange="updateReaderVar('--reader-text-align', this.checked ? 'justify' : 'left')">
            <div class="toggle-switch-track"></div>
          </label>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', e => { if (e.target === modal) closeThemePanel(); });
  document.body.appendChild(modal);

  // Populate theme grid
  const grid = document.getElementById('themeGrid');
  THEMES.forEach(t => {
    const meta = THEME_META[t];
    const btn = document.createElement('button');
    btn.className = 'theme-btn' + (t === currentTheme ? ' active' : '');
    btn.dataset.theme = t;
    btn.onclick = () => applyTheme(t);
    btn.innerHTML = `
      <div class="theme-swatch" style="background:${meta.swatch}; ${t==='bold'?'border:2px solid #ccc':''}"></div>
      <span class="lang-pt">${meta.label}</span>
      <span class="lang-ja" style="display:none">${meta.labelJa}</span>
    `;
    grid.appendChild(btn);
  });

  // Init sliders from stored prefs
  const fs = parseFloat(localStorage.getItem('reader_font_size') || '21');
  const lh = parseFloat(localStorage.getItem('reader_line_height') || '1.7');
  const sl = document.getElementById('fontSizeSlider');
  const ll = document.getElementById('lineHeightSlider');
  if (sl) { sl.value = fs; document.getElementById('fontSizeVal').textContent = fs + 'px'; }
  if (ll) { ll.value = lh; document.getElementById('lineHVal').textContent = lh; }
  applyStoredReaderPrefs();
}

function openThemePanel() {
  buildThemePanel();
  const modal = document.getElementById('themeModal');
  modal.classList.add('open');
  applyLanguage(currentLang, false);
}

function closeThemePanel() {
  const modal = document.getElementById('themeModal');
  if (modal) modal.classList.remove('open');
}

function updateReaderVar(prop, val) {
  document.documentElement.style.setProperty(prop, val);
  const keyMap = {
    '--reader-font-size':   'reader_font_size',
    '--reader-line-height': 'reader_line_height',
    '--reader-text-align':  'reader_text_align',
  };
  if (keyMap[prop]) localStorage.setItem(keyMap[prop], val);
}

function applyStoredReaderPrefs() {
  const prefs = [
    ['--reader-font-size',   localStorage.getItem('reader_font_size')   || '21px'],
    ['--reader-line-height', localStorage.getItem('reader_line_height') || '1.7'],
    ['--reader-text-align',  localStorage.getItem('reader_text_align')  || 'left'],
  ];
  prefs.forEach(([prop, val]) => document.documentElement.style.setProperty(prop, val));

  const justifyToggle = document.getElementById('justifyToggle');
  if (justifyToggle) justifyToggle.checked = localStorage.getItem('reader_text_align') === 'justify';
}

// ─── Font size (hamburger menu) ───────────────────────────────
function changeFontSize(delta) {
  const current = parseFloat(localStorage.getItem('reader_font_size') || '21');
  const next = Math.max(14, Math.min(32, current + delta * 2));
  updateReaderVar('--reader-font-size', next + 'px');
  const sl = document.getElementById('fontSizeSlider');
  const lbl = document.getElementById('fontSizeVal');
  if (sl) sl.value = next;
  if (lbl) lbl.textContent = next + 'px';
  showToast(`Fonte: ${next}px`);
}

// ─── History & Favorites panels ───────────────────────────────
function openHistory() {
  buildListModal('history');
}

function openFavorites() {
  buildListModal('favorites');
}

function buildListModal(type) {
  const isHistory = type === 'history';
  const key = isHistory ? 'zenshu_history' : 'zenshu_favorites';
  const titlePt = isHistory ? 'Histórico de Leitura' : 'Ensinamentos Salvos';
  const titleJa = isHistory ? '閲覧履歴' : 'お気に入り';
  const emptyPt = isHistory ? 'Nenhum ensinamento lido ainda.' : 'Nenhum ensinamento salvo.';
  const emptyJa = isHistory ? 'まだ閲覧履歴はありません。' : 'お気に入りはまだありません。';

  let items = [];
  try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

  // Remove existing
  const existing = document.getElementById('listModal');
  if (existing) existing.remove();

  const isPt = currentLang === 'pt';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'listModal';

  const listHtml = items.length === 0
    ? `<div class="search-empty" style="display:block">${isPt ? emptyPt : emptyJa}</div>`
    : items.map(item => {
        const href = `reader.html?id=${encodeURIComponent(item.id)}&part=${encodeURIComponent(item.part || '')}`;
        const date = item.date ? `<span style="font-size:12px;color:var(--text-muted)">${item.date}</span>` : '';
        return `<a href="${href}" class="search-result" style="display:block;padding:12px 16px;border-bottom:1px solid var(--border);text-decoration:none;color:var(--text-main)">
          <div style="font-weight:500">${escHtml(item.title || item.id)}</div>
          ${date}
        </a>`;
      }).join('');

  modal.innerHTML = `
    <div class="modal" role="dialog" style="max-width:500px">
      <div class="modal__header" style="padding:16px;display:flex;align-items:center;justify-content:space-between">
        <h2 style="font-size:1rem;font-weight:600;margin:0">${isPt ? titlePt : titleJa}</h2>
        <button class="modal__close" onclick="document.getElementById('listModal').remove()">✕</button>
      </div>
      <div class="modal__body" style="max-height:60vh;overflow-y:auto;padding:0">
        ${listHtml}
      </div>
      ${items.length > 0 && !isHistory ? '' : ''}
    </div>
  `;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ─── Toast ────────────────────────────────────────────────────
function buildToast() {
  if (document.getElementById('toast')) return;
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  document.body.appendChild(t);
}

function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ─── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  // '/' to open search (when not focused on input)
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    closeThemePanel();
    closeMobileNav();
  }
});

// ─── Helpers ──────────────────────────────────────────────────
function normalizeText(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function highlight(text, terms) {
  let safe = escHtml(text);
  terms.forEach(t => {
    if (t.length < 2) return;
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    safe = safe.replace(re, '<mark>$1</mark>');
  });
  return safe;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function iconHtml(name) {
  const icons = {
    home:     `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    book:     `<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    feather:  `<svg viewBox="0 0 24 24"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>`,
    sun:      `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    zap:      `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    search:   `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    globe:    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };
  return icons[name] || '';
}
