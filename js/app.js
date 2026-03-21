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

  // Controls div (right side)
  const controls = document.createElement('div');
  controls.className = 'header__controls';
  controls.innerHTML = `
    <button class="btn-icon" id="btn-search" onclick="openSearch()" title="Buscar (/)">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    <button class="btn-icon" id="btn-lang" onclick="toggleLanguage()" title="Mudar idioma">
      <span id="lang-label" style="font-size:0.75rem;font-weight:700;letter-spacing:0.02em">日本語</span>
    </button>
    <button class="btn-icon" id="btn-theme" onclick="openThemePanel()" title="Temas">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    </button>
    <button class="btn-icon mobile-menu-btn" id="btn-hamburger" onclick="openMobileNav()" aria-label="Menu de navegação">
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
  overlay.innerHTML = `
    <div class="mobile-nav-backdrop" onclick="closeMobileNav()"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <span>Mioshie Zenshu</span>
        <button class="mobile-nav-close btn-icon" onclick="closeMobileNav()" aria-label="Fechar menu">✕</button>
      </div>
      <div class="mobile-nav-body">
        <div class="mobile-nav-section">Seções</div>
        <a href="browse.html"      class="mobile-nav-link">
          ${iconHtml('book')} Ensinamentos
        </a>
        <a href="reader.html"      class="mobile-nav-link">
          ${iconHtml('book')} Leitor
        </a>
        <a href="poems.html"       class="mobile-nav-link">
          ${iconHtml('feather')} Gosanka
        </a>
        <a href="library.html"     class="mobile-nav-link">
          ${iconHtml('book')} Biblioteca
        </a>
        <a href="search.html"      class="mobile-nav-link">
          ${iconHtml('search')} Busca
        </a>
        <div class="mobile-nav-section">Configurações</div>
        <button class="mobile-nav-link" onclick="toggleLanguage(); closeMobileNav();">
          ${iconHtml('globe')}
          <span class="lang-pt">Mudar para Japonês</span>
          <span class="lang-ja" style="display:none">Português に切替</span>
        </button>
        <button class="mobile-nav-link" onclick="openThemePanel(); closeMobileNav();">
          ${iconHtml('settings')} <span class="lang-pt">Temas & Aparência</span><span class="lang-ja" style="display:none">テーマ設定</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function openMobileNav() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (overlay) {
    overlay.classList.add('open');
    applyLanguage(currentLang, false); // sync lang display inside nav
  }
}

function closeMobileNav() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (overlay) overlay.classList.remove('open');
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
