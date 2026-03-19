/* =============================================================
   browse.js — Rich Browse / Index for Mioshie Zenshu
   ============================================================= */

'use strict';

const IDX_URL = 'data/search/advanced_search_index.json';
const READER  = 'reader.html';

// ─── Compilation headers with cover images ──────────────────
const COMPILATION_INFO = {
  revelacao:    { title: '御垂示録', subtitle: 'Gosuijiroku — Registros Especiais', img: 'assets/img/gosuiji.JPG', desc: 'Coletânea de Escritos do Mestre Okada Jikanshi — Registro de Ensinamentos por Edição (Números 1 a 30)' },
  miosie:       { title: '御教え集', subtitle: 'Mioshieshu — Coletânea de Ensinamentos', img: 'assets/img/mioshie.JPG', desc: 'Coletânea de Artigos do Mestre Okada Jikan — Coletânea de Ensinamentos por Publicação (Números 1 a 33)' },
  viagem:       { title: '御光話録', subtitle: 'Ohikari Kowa Roku', img: 'assets/img/ohikari.JPG', desc: 'Coletânea de Ensaios do Mestre Okada Jikanshi — Registro dos Diálogos com Meishu-Sama (Volumes 1 a 19 e Suplemento)' },
  hikarinochie: { title: '神智之光', subtitle: 'Hikari no Chie — A Luz da Sabedoria Divina', img: 'assets/img/gokowa1.jpg', desc: 'Coletânea de Sermões Complementares — 50 seções temáticas' },
  jorei:        { title: '浄霊法講座', subtitle: 'Johrei Ho Koza — Curso sobre o Método do Johrei', img: 'assets/img/joreiho.jpg', desc: 'Curso sobre o Método do Johrei (Volumes I a VIII)' },
  dendo:        { title: '伝道の引き', subtitle: 'Dendo no Shiori — Guia para a Difusão', img: null, desc: 'Guia para a Difusão I e II — Manual prático para a propagação da fé' },
  english:      { title: 'ENGLISH', subtitle: 'Traduções em Inglês', img: null, desc: 'Ensinamentos traduzidos para o idioma inglês' },
  sanko:        { title: '参考資料', subtitle: 'Material de Referência', img: null, desc: 'Materiais de referência e documentos complementares' },
  sasshi:       { title: '明主様関連寄稿', subtitle: 'Contribuições sobre Meishu-sama', img: null, desc: 'Artigos e contribuições relacionadas a Meishu-sama' },
  hakkousi:     { title: 'その他の寄稿', subtitle: 'Outras Contribuições', img: null, desc: 'Contribuições diversas, testemunhos e diários espirituais' },
  kanren:       { title: '関連出版物', subtitle: 'Publicações Relacionadas', img: null, desc: 'Publicações relacionadas aos ensinamentos de Meishu-sama' },
};

// ─── Publicação: PT → Romaji (nunca traduzir, sempre romaji) ─────
const PUB_ROMAJI = {
  'Conversas sobre Fé':       'Shinko Zatsuwa',
  'Conversas de Jikan':       'Jikan Zuidan',
  'Coletânea de Sermões de Jikan': 'Jikan Sosho',
  'Terapia da Fé para Tuberculose': 'Shinko ni yoru Kekkaku Chiryo',
  'Tuberculose e Terapia Espiritual': 'Kekkaku to Shinrei Ryoho',
  'O Problema da Tuberculose e sua Solução':            'Kekkaku Mondai to Sono Kaiketsusaku',
  'O Problema da Tuberculose e sua Solução (Reedição)': 'Kekkaku Mondai Kaiketsusaku (Saihan)',
  'A Verdadeira Natureza da Tuberculose': 'Kekkaku no Shotai',
  'Boletim (Kaiho)':          'Kaiho',
  'Nova Arte Médica Japonesa': 'Shin Nihon Ijutsu',
  'Método de Cultivo sem Fertilizantes': 'Muhiryo Saibai-ho',
  'Registro de Aulas de Medicina Japonesa': 'Nihon Ijutsu Kogi-roku',
};
function pubDisplay(name) { return PUB_ROMAJI[name] || name; }

// ─── Content type classification ──────────────────────────────
// Priority order matters — first match wins
const CONTENT_TYPES = [
  // 御教え — search1 subfolder-specific types
  { id: 'palestra',     label: '御講話',           match: x => folder1(x) === 'kouwa' || folder2(x) === 'kouwa',   css: 'type-palestra' },
  { id: 'qa',           label: '質問応答',         match: x => folder1(x) === 'situmon',                           css: 'type-qa'       },
  { id: 'dialogo',      label: '対談',             match: x => folder1(x) === 'taidan',                            css: 'type-dialogo'  },
  { id: 'english',      label: 'English',          match: x => folder1(x) === 'English',                           css: 'type-other'    },

  // 御論文 — search1 alphabetical (catch-all after special subfolders)
  { id: 'ensaio',       label: '御論文',           match: x => urlPrefix(x) === 'search1',                        css: 'type-ensaio'   },

  // 編纂・翻訳 — search2 subfolders
  { id: 'revelacao',    label: '御垂示録',         match: x => folder2(x) === 'okage' || urlPrefix(x) === 'gosuiji', css: 'type-revelacao'},
  { id: 'viagem',       label: '御光話録',         match: x => folder2(x) === 'kikou' || folder2(x) === 'kikou2', css: 'type-viagem'   },
  { id: 'jorei',        label: '浄霊法講座',       match: x => folder2(x) === 'jorei',                            css: 'type-other'    },
  { id: 'sanko',        label: '参考資料',         match: x => folder2(x) === 'sanko',                            css: 'type-other'    },

  // miosie — 御教え集
  { id: 'miosie',       label: '御教え集',         match: x => urlPrefix(x) === 'miosie',                         css: 'type-other'    },

  // kanren — subdivided
  { id: 'hikarinochie', label: '神智之光',         match: x => (x.url||'').startsWith('kanren/hikari'),           css: 'type-viagem'   },
  { id: 'chijotengoku', label: '地上天国',         match: x => (x.url||'').startsWith('kanren/true'),             css: 'type-viagem'   },
  { id: 'dendo',        label: '伝道の引き',       match: x => (x.url||'').includes('/dendo'),                    css: 'type-other'    },
  { id: 'kanren',       label: '関連出版物',       match: x => urlPrefix(x) === 'kanren',                        css: 'type-other'    },

  // 参考資料 — sasshi (magazines) and hakkousi (pamphlets)
  { id: 'sasshi',       label: '明主様関連寄稿',   match: x => urlPrefix(x) === 'sasshi',                         css: 'type-other'    },
  { id: 'hakkousi',     label: 'その他の寄稿',     match: x => urlPrefix(x) === 'hakkousi',                       css: 'type-other'    },

  // fallback
  { id: 'outro',        label: 'Outros',           match: x => true,                                              css: 'type-other'    },
];

// ─── Showa era groups ─────────────────────────────────────────
const ERA_GROUPS = [
  { id: 'inicial', label: 'Fase Inicial', labelSub: 'S5-S16',  years: y => y && y <= 1941 },
  { id: 's1718',   label: 'S17-18',       labelSub: '1942-43', years: y => y >= 1942 && y <= 1943 },
  { id: 's2223',   label: 'S22-23',       labelSub: '1947-48', years: y => y >= 1947 && y <= 1948 },
  { id: 's24',     label: 'S24',          labelSub: '1949',    years: y => y === 1949 },
  { id: 's25',     label: 'S25',          labelSub: '1950',    years: y => y === 1950 },
  { id: 's26',     label: 'S26',          labelSub: '1951',    years: y => y === 1951 },
  { id: 's27',     label: 'S27',          labelSub: '1952',    years: y => y === 1952 },
  { id: 's28',     label: 'S28',          labelSub: '1953',    years: y => y === 1953 },
  { id: 's2930',   label: 'S29-30',       labelSub: '1954-55', years: y => y >= 1954 && y <= 1955 },
  { id: 'semdata', label: 'Sem data',     labelSub: '-',       years: y => !y },
  { id: 'inedito', label: 'Nao publicado', labelSub: 'inedito', years: () => false, unpublished: true },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── URL helpers ──────────────────────────────────────────────
function urlPrefix(x) { return (x.url||'').split('/')[0] || ''; }
function folder1(x)   { const p=(x.url||'').split('/'); return p[0]==='search1' ? (p[1]||'') : ''; }
function folder2(x)   { const p=(x.url||'').split('/'); return p[0]==='search2' ? (p[1]||'') : ''; }

// ─── State ────────────────────────────────────────────────────
let _idx      = null;
let _filtered = [];
let _page     = 0;
let _perPage  = 50;
let _sortCol  = 'era';
let _sortAsc  = true;
let _typeCounts   = {};
let _eraCounts    = {};
let _letterCounts = {};

const _filters = { type: '', era: '', letter: '', search: '', pub: '' };

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await loadIndex();
  readUrlParams();
  buildSidebar();
  applyFilters();
  if (typeof applyLanguage === 'function') {
    applyLanguage(localStorage.getItem('site_lang') || 'pt', false);
  }
});

async function loadIndex() {
  const res = await fetch(IDX_URL);
  _idx = await res.json();

  _idx.forEach(x => {
    // Fix ID-like titles — extract real title from content_snippet
    if (x.title && /^[a-z_][a-z0-9_]*\d+$/i.test(x.title)) {
      const snip = x.content_snippet || '';
      const hm = snip.match(/^#{1,3}\s+(.+)$/m);
      if (hm) {
        x.title = hm[1].trim();
      } else {
        // Fallback: use second non-empty line (first is usually collection header)
        const lines = snip.split('\n').map(l => l.replace(/^[―\-*\s]+|[―\-*\s]+$/g, '').trim()).filter(Boolean);
        if (lines.length > 1 && lines[1].length > 3 && lines[1].length < 120) {
          x.title = lines[1];
        }
      }
    }
    // Classify type (first match wins)
    for (const ct of CONTENT_TYPES) {
      if (ct.match(x)) { x._type = ct.id; break; }
    }
    // Showa era
    const y = x.year;
    if (x.unpublished) {
      x._era = 'inedito';
    } else {
      for (const eg of ERA_GROUPS) {
        if (eg.unpublished) continue;
        if (eg.years(y)) { x._era = eg.id; break; }
      }
    }
    // Alphabetical letter (skip articles)
    const t = (x.title || '').replace(/^["']/, '');
    const bare = /^(A|As|O|Os|Um|Uma|The|An?)\s/i.test(t) ? t.replace(/^\S+\s/, '') : t;
    x._letter = (bare[0] || '#').toUpperCase();
  });

  // Counts
  _idx.forEach(x => {
    _typeCounts[x._type]     = (_typeCounts[x._type]     || 0) + 1;
    _eraCounts[x._era]       = (_eraCounts[x._era]       || 0) + 1;
    _letterCounts[x._letter] = (_letterCounts[x._letter] || 0) + 1;
  });
}

// ─── URL params ───────────────────────────────────────────────
function readUrlParams() {
  const p = new URLSearchParams(window.location.search);
  _filters.type   = p.get('type')   || '';
  _filters.era    = p.get('era')    || '';
  _filters.letter = p.get('letter') || '';
  _filters.search = p.get('q')      || '';
  _filters.pub    = p.get('pub')    || '';
  // Default sort by page number when filtering by publication
  if (_filters.pub) { _sortCol = 'page'; _sortAsc = true; }
  const pp = parseInt(p.get('pp'));
  if ([20,50,100].includes(pp)) _perPage = pp;
  const si = document.getElementById('sidebarSearchInput');
  const ti = document.getElementById('browseSearchInput');
  if (si && _filters.search) si.value = _filters.search;
  if (ti && _filters.search) ti.value = _filters.search;
}

function pushState() {
  const p = new URLSearchParams();
  if (_filters.type)   p.set('type',   _filters.type);
  if (_filters.era)    p.set('era',    _filters.era);
  if (_filters.letter) p.set('letter', _filters.letter);
  if (_filters.search) p.set('q',      _filters.search);
  if (_filters.pub)    p.set('pub',    _filters.pub);
  if (_perPage !== 50) p.set('pp',     _perPage);
  const url = `browse.html${p.toString() ? '?' + p : ''}`;
  window.history.replaceState({}, '', url);
}

// ─── Sidebar ─────────────────────────────────────────────────
function buildSidebar() {
  populateCounts();
  buildEraGrid();
  buildAzIndex();
  bindSidebarSearch();
}

function populateCounts() {
  const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n || 0; };
  // ① 御論文
  set('countRonbun',      _typeCounts['ensaio']       || 0);
  set('countEnsaio',      _typeCounts['ensaio']       || 0);
  // ② 御教え
  set('countPalestra',    _typeCounts['palestra']     || 0);
  set('countQa',          _typeCounts['qa']           || 0);
  set('countDialogo',     _typeCounts['dialogo']      || 0);
  // ③ 編纂・翻訳
  set('countRevelacao',   _typeCounts['revelacao']    || 0);
  set('countMiosie',      _typeCounts['miosie']       || 0);
  set('countViagem',      _typeCounts['viagem']       || 0);
  set('countHikari',      _typeCounts['hikarinochie'] || 0);
  set('countJorei',       _typeCounts['jorei']        || 0);
  set('countDendo',       _typeCounts['dendo']        || 0);
  set('countEnglish',     _typeCounts['english']      || 0);
  // ④ 参考資料
  set('countSanko',       _typeCounts['sanko']        || 0);
  set('countSasshi',      _typeCounts['sasshi']       || 0);
  set('countHakkousi',    _typeCounts['hakkousi']     || 0);
  set('countKanren',      _typeCounts['kanren']       || 0);
  set('countOkage',       _typeCounts['revelacao']    || 0);
}

function buildEraGrid() {
  const el = document.getElementById('sidebarEraGrid');
  if (!el) return;
  el.innerHTML = ERA_GROUPS.map(eg => {
    const n = _eraCounts[eg.id] || 0;
    return `<button class="sidebar-era-btn${_filters.era===eg.id?' active':''}" onclick="setFilter('era','${eg.id}')" title="${n} registros">
      ${esc(eg.label)}<br><small style="font-weight:400;opacity:0.7">${esc(eg.labelSub)}</small>
    </button>`;
  }).join('');
}

function buildAzIndex() {
  const el = document.getElementById('sidebarAZ');
  if (!el) return;
  el.innerHTML = LETTERS.map(l => {
    const n = _letterCounts[l] || 0;
    return `<button class="sidebar-az-btn${_filters.letter===l?' active':''}" onclick="setFilter('letter','${l}')" ${!n?'disabled':''} title="${n}">${l}</button>`;
  }).join('');
}

function bindSidebarSearch() {
  const input = document.getElementById('sidebarSearchInput');
  if (!input) return;
  input.value = _filters.search;
  let timer;
  input.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      _filters.search = e.target.value.trim();
      const main = document.getElementById('browseSearchInput');
      if (main) main.value = _filters.search;
      _page = 0;
      applyFilters();
    }, 200);
  });
}

// ─── Filters ──────────────────────────────────────────────────
window.setFilter = function(key, val) {
  _filters[key] = _filters[key] === val ? '' : val;
  _page = 0;
  refreshSidebarActive();
  applyFilters();
};

window.clearFilter = function(key) {
  _filters[key] = '';
  _page = 0;
  refreshSidebarActive();
  applyFilters();
};

window.clearAllFilters = function() {
  Object.keys(_filters).forEach(k => _filters[k] = '');
  ['sidebarSearchInput','browseSearchInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  _page = 0;
  refreshSidebarActive();
  applyFilters();
};

function refreshSidebarActive() {
  document.querySelectorAll('[data-type]').forEach(el => {
    el.classList.toggle('active', el.dataset.type === _filters.type);
  });
  document.querySelectorAll('.sidebar-era-btn').forEach((btn, i) => {
    const eg = ERA_GROUPS[i];
    if (eg) btn.classList.toggle('active', eg.id === _filters.era);
  });
  document.querySelectorAll('.sidebar-az-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === _filters.letter);
  });
}

function applyFilters() {
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  _filtered = _idx.filter(x => {
    if (_filters.type   && x._type   !== _filters.type)      return false;
    if (_filters.era    && x._era    !== _filters.era)        return false;
    if (_filters.letter && x._letter !== _filters.letter)     return false;
    if (_filters.pub    && !(x.publication || '').startsWith(_filters.pub))  return false;
    if (terms.length) {
      const hay = [x.title, x.publication, x.url, x.category].join(' ').toLowerCase();
      if (!terms.every(t => hay.includes(t))) return false;
    }
    return true;
  });

  _filtered.sort((a, b) => {
    let va, vb;
    if (_sortCol === 'page') {
      // Sort by page number (P.1, P.2, … P.114)
      va = parseInt((a.issue_page||'').replace(/\D/g,'')) || 9999;
      vb = parseInt((b.issue_page||'').replace(/\D/g,'')) || 9999;
      if (va === vb) { va = (a.title||'').toLowerCase(); vb = (b.title||'').toLowerCase(); }
      return _sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    } else if (_sortCol === 'title') {
      va = (a.title||'').toLowerCase();
      vb = (b.title||'').toLowerCase();
    } else {
      va = a.year || 9999;
      vb = b.year || 9999;
      if (va === vb) {
        va = (a.title||'').toLowerCase();
        vb = (b.title||'').toLowerCase();
      }
      return _sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    }
    return _sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  renderFilterBadges();
  renderTable();
  renderPagination();
  pushState();
}

// ─── Sort ─────────────────────────────────────────────────────
window.setSort = function(col) {
  if (_sortCol === col) _sortAsc = !_sortAsc;
  else { _sortCol = col; _sortAsc = true; }
  document.querySelectorAll('.browse-table th.sortable').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.col === col) th.classList.add(_sortAsc ? 'sort-asc' : 'sort-desc');
  });
  applyFilters();
};

// ─── Filter badges ────────────────────────────────────────────
function renderFilterBadges() {
  const container = document.getElementById('activeBadges');
  if (!container) return;
  const badges = [];
  if (_filters.pub) {
    badges.push(`<span class="browse-filter-badge browse-filter-badge--pub">${esc(pubDisplay(_filters.pub))} <span class="browse-filter-badge__remove" onclick="clearFilter('pub')">x</span></span>`);
  }
  if (_filters.type) {
    const ct = CONTENT_TYPES.find(t => t.id === _filters.type);
    if (ct) badges.push(`<span class="browse-filter-badge">${ct.label} <span class="browse-filter-badge__remove" onclick="clearFilter('type')">x</span></span>`);
  }
  if (_filters.era) {
    const eg = ERA_GROUPS.find(e => e.id === _filters.era);
    if (eg) badges.push(`<span class="browse-filter-badge">${eg.label} <span class="browse-filter-badge__remove" onclick="clearFilter('era')">x</span></span>`);
  }
  if (_filters.letter) {
    badges.push(`<span class="browse-filter-badge">Letra ${_filters.letter} <span class="browse-filter-badge__remove" onclick="clearFilter('letter')">x</span></span>`);
  }
  if (_filters.search) {
    badges.push(`<span class="browse-filter-badge">${esc(_filters.search)} <span class="browse-filter-badge__remove" onclick="clearAllFilters()">x</span></span>`);
  }
  container.innerHTML = badges.length
    ? badges.join('') + `<span class="browse-clear-all" onclick="clearAllFilters()">Limpar tudo</span>`
    : `<span class="browse-no-filters">Todos os ensinamentos — ${_idx ? _idx.length.toLocaleString() : '…'} registros</span>`;
}

// ─── Table render ─────────────────────────────────────────────
function renderTable() {
  const el   = document.getElementById('browseTableBody');
  const meta = document.getElementById('browseMeta');
  if (!el) return;

  const total = _filtered.length;
  const start = _page * _perPage;
  const slice = _filtered.slice(start, start + _perPage);
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Publication header (shown when filtering by pub or compilation type)
  const pubHeader = document.getElementById('browsePublicationHeader');
  if (pubHeader) {
    const compInfo = _filters.type ? COMPILATION_INFO[_filters.type] : null;
    if (_filters.pub) {
      pubHeader.innerHTML = `<span class="browse-pub-back" onclick="clearFilter('pub')" title="Voltar para todos">‹</span> ${esc(pubDisplay(_filters.pub))}`;
      pubHeader.style.display = '';
    } else if (compInfo) {
      const imgHtml = compInfo.img ? `<img class="comp-header-img" src="${compInfo.img}" alt="${esc(compInfo.title)}">` : '';
      pubHeader.innerHTML = `
        <div class="comp-header">
          ${imgHtml}
          <div class="comp-header-text">
            <div class="comp-header-title">${esc(compInfo.title)}</div>
            <div class="comp-header-subtitle">${esc(compInfo.subtitle)}</div>
            <div class="comp-header-desc">${esc(compInfo.desc)}</div>
          </div>
        </div>`;
      pubHeader.style.display = '';
    } else {
      pubHeader.style.display = 'none';
    }
  }

  if (meta) {
    meta.innerHTML = total === 0
      ? 'Nenhum resultado'
      : `<strong>${total.toLocaleString()}</strong> resultado${total !== 1 ? 's' : ''} &mdash; mostrando ${start+1}&ndash;${Math.min(start+_perPage, total)}`;
  }

  if (total === 0) {
    el.innerHTML = `<tr><td colspan="7">
      <div class="browse-empty">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h3>Nenhum resultado</h3>
        <p>Tente outros filtros ou limpe a busca.</p>
      </div>
    </td></tr>`;
    return;
  }

  el.innerHTML = slice.map((x, i) => {
    const num  = start + i + 1;
    const ct   = CONTENT_TYPES.find(t => t.id === x._type) || CONTENT_TYPES[CONTENT_TYPES.length-1];
    const href = x.part_file
      ? `${READER}?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file)}`
      : `${READER}?cat=${encodeURIComponent(x.category||'')}`;
    const eraLabel    = x.year ? `S${x.year-1925}` : '&mdash;';
    const titleHl     = hlText(x.title || '', terms);
    const pub         = x.publication ? hlText(pubDisplay(String(x.publication)).substring(0,60), terms) : '';
    const issue       = x.issue_page  ? esc(String(x.issue_page).substring(0,20)) : '';
    const relCount    = x.related ? x.related.length : 0;
    const unpubBadge  = x.unpublished ? `<span class="td-unpublished">inedito</span>` : '';

    return `<tr class="${x.unpublished?'unpublished':''}">
      <td class="col-num">${num}</td>
      <td class="col-title">
        <span class="content-type-badge ${ct.css}">${ct.label}</span>
        <div class="td-title"><a href="${href}" onclick="navigate(event,${JSON.stringify(x.id)},${JSON.stringify(x.part_file||'')})">
          ${titleHl}${unpubBadge}
        </a></div>
      </td>
      <td class="col-pub td-pub">${pub}</td>
      <td class="col-issue td-pub">${issue}</td>
      <td class="col-era"><span class="td-era">${eraLabel}</span></td>
      <td class="col-notes td-pub">${tagSnippet(x)}</td>
      <td class="col-read">
        <a href="${href}" class="td-read-btn" onclick="navigate(event,${JSON.stringify(x.id)},${JSON.stringify(x.part_file||'')})" title="Ler">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </td>
    </tr>`;
  }).join('');
}

// ─── Pagination ───────────────────────────────────────────────
function renderPagination() {
  const el = document.getElementById('browsePagination');
  if (!el) return;
  const total = _filtered.length;
  const pages = Math.ceil(total / _perPage);
  if (pages <= 1) { el.innerHTML = ''; return; }

  let btns = [];
  const addBtn = (p, label, active=false, disabled=false) => {
    btns.push(`<button class="pg-btn${active?' active':''}" onclick="gotoPage(${p})" ${disabled?'disabled':''}>${label}</button>`);
  };

  addBtn(_page-1, '&larr;', false, _page === 0);
  if (pages <= 7) {
    for (let i=0; i<pages; i++) addBtn(i, i+1, i===_page);
  } else {
    addBtn(0, 1, _page===0);
    if (_page > 3) btns.push(`<span class="pg-ellipsis">...</span>`);
    for (let i=Math.max(1,_page-1); i<=Math.min(pages-2,_page+1); i++) addBtn(i, i+1, i===_page);
    if (_page < pages-4) btns.push(`<span class="pg-ellipsis">...</span>`);
    addBtn(pages-1, pages, _page===pages-1);
  }
  addBtn(_page+1, '&rarr;', false, _page >= pages-1);
  el.innerHTML = btns.join('');
}

window.gotoPage = function(p) {
  const pages = Math.ceil(_filtered.length / _perPage);
  _page = Math.max(0, Math.min(pages-1, p));
  renderTable();
  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── Per-page ─────────────────────────────────────────────────
window.setPerPage = function(n) {
  _perPage = parseInt(n);
  _page = 0;
  renderTable();
  renderPagination();
  pushState();
};

// ─── Navigate to reader ───────────────────────────────────────
window.navigate = function(e, id, partFile) {
  e.preventDefault();
  const url = partFile
    ? `${READER}?id=${encodeURIComponent(id)}&part=${encodeURIComponent(partFile)}`
    : `${READER}?id=${encodeURIComponent(id)}`;
  sessionStorage.setItem('browse_return', window.location.href);
  window.location.href = url;
};

// ─── Helpers ──────────────────────────────────────────────────
function hlText(text, terms) {
  if (!terms.length) return esc(text);
  const re = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`, 'gi');
  return esc(text).replace(re, '<mark class="bh">$1</mark>');
}

function tagSnippet(x) {
  const tags = x.tags;
  if (!tags || !tags.length) return '';
  const show = tags.slice(0, 3).map(t => esc(t));
  return `<span class="td-tags">${show.join(', ')}</span>`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showLoading() {
  const el = document.getElementById('browseTableBody');
  if (el) el.innerHTML = `<tr><td colspan="7"><div class="browse-loading">
    <div class="reader-loading__spinner"></div>
    <span>Carregando indice...</span>
  </div></td></tr>`;
}

// ─── Main search + per-page binding ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('browseSearchInput');
  if (input) {
    let timer;
    input.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        _filters.search = e.target.value.trim();
        const si = document.getElementById('sidebarSearchInput');
        if (si) si.value = _filters.search;
        _page = 0;
        applyFilters();
      }, 200);
    });
  }
  const ppSel = document.getElementById('perPageSelect');
  if (ppSel) ppSel.value = _perPage;
});
