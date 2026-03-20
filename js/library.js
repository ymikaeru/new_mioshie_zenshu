/* =============================================================
   Mioshie Zenshu Modern — library.js
   ============================================================= */

'use strict';

// ─── Mapeamento Publicação → Valor de 'publication' no search index ───────────
// Gerado comparando publications_enriched.json com advanced_search_index.json
const PUB_TO_INDEX_MAP = {
  // ─── Hakkousi (periódicos e coletâneas publicadas) ───
  'hakkousi_atarasik':  ['法難手記'],
  'hakkousi_ehagaki2':  ['Chijo Tengoku'],
  'hakkousi_ehagaki3':  ['Chijo Tengoku'],
  'hakkousi_gosuiji':   ['Gosuiiji', 'Gosuiiji録'],
  'hakkousi_gosinsyo':  ['Mioshie-shu'],
  'hakkousi_hakone3':   ['Gokouwaroku'],
  'hakkousi_hukuin':    ['天国の福音'],
  'hakkousi_jikanso':   ['Coletânea de Sermões de Jikan', 'Conversas de Jikan'],
  'hakkousi_johrei':    ['浄霊法講座'],
  'hakkousi_joreiho':   ['浄霊法講座'],
  'hakkousi_kaiho':     ['Boletim (Kaiho)'],
  'hakkousi_miosiesy':  ['Mioshie-shu'],
  'hakkousi_ohikari':   ['御Hikari話録', '御Hikari話録（補）'],
  'hakkousi_sanka1':    ['Sanka-shu'],
  'hakkousi_seiten':    ['Kyusei'],
  'hakkousi_shinbun':   ['Eikou', 'Hikari', 'Kyusei'],
  'hakkousi_sinkozat':  ['Conversas sobre Fé'],
  'hakkousi_tengoku1':  ['天国の福音'],
  'hakkousi_tijou':     ['Chijo Tengoku'],
  'hakkousi_yamato':    ['山と水'],

  // ─── Kanren (publicações relacionadas) ───
  'kanren_igakukan':    ['Igaku Kakumei no Sho', '医学関係Goronbun集'],
  'kanren_kouwa1':      ['Hikari'],
  'kanren_tengoku':     ['Chijo Tengoku'],
  'kanren_dendono1':    ['Hikari'],

  // ─── Ha (publicações avulsas) ───
  'ha_hawai1':          ['Gokowa'],

  // ─── Sanka (antologias) ───
  'sanka1':             ['Sanka-shu'],
  'sanka2':             ['Sanka-shu'],

  // ─── Sasshi (livretos e ensaios) ───
  'sasshi_america1':    ['アメリカを救う'],
  'sasshi_bunmei':      ['Bunmei no Sozo'],
  'sasshi_byohin':      ['病貧争絶無の世界を造る観音運動とは何？'],
  'sasshi_dekiru':      ['Chijo Tengoku'],
  'sasshi_hajimete':    ['Hajimete Johrei wo Ukeru Kata no Tame ni'],
  'sasshi_hayawaka':    ['Kyusei', '世界Kyusei教早わかり'],
  'sasshi_honansyu':    ['法難手記'],
  'sasshi_ichisin':     ['一信者の告白'],
  'sasshi_jikan1':      ['Coletânea de Sermões de Jikan', 'Conversas de Jikan'],
  'sasshi_jikan2':      ['Coletânea de Sermões de Jikan', 'Conversas de Jikan'],
  'sasshi_joreiho1':    ['浄霊法講座'],
  'sasshi_joreiho2':    ['浄霊法講座'],
  'sasshi_joreiho3':    ['浄霊法講座'],
  'sasshi_joreiho4':    ['浄霊法講座'],
  'sasshi_joreiho5':    ['浄霊法講座'],
  'sasshi_joreiho6':    ['浄霊法講座'],
  'sasshi_joreiho7':    ['浄霊法講座'],
  'sasshi_joreiho8':    ['浄霊法講座'],
  'sasshi_kaiketu1':    ['Terapia da Fé para Tuberculose', 'Tuberculose e Terapia Espiritual'],
  'sasshi_kaiketu2':    ['Terapia da Fé para Tuberculose', 'Tuberculose e Terapia Espiritual'],
  'sasshi_kakumei':     ['Igaku Kakumei no Sho', '結核の革命的療法'],
  'sasshi_kannon':      ['Kannon Koza'],
  'sasshi_kiseki':      ['Kyusei', '世界Kyusei教奇蹟集'],
  'sasshi_kyogi1':      ['Kyusei'],
  'sasshi_kyogi2':      ['Chijo Tengoku', 'Kyusei'],
  'sasshi_myoniti0':    ['Ashita no Ijutsu', 'Asu no Ijutsu・新日本医術', 'Asu no Ijutsu・Shin Nihon Ijutsu', 'Nova Arte Médica Japonesa'],
  'sasshi_myoniti3':    ['Asu no Ijutsu 第一編', 'Asu no Ijutsu 第一篇', 'Asu no Ijutsu（初版）第一編', 'Asu no Ijutsu（再版）第一編', 'Asu no Ijutsu（初版）第二編', 'Asu no Ijutsu（再版）第二編', 'Asu no Ijutsu 第二編', 'Asu no Ijutsu 第二篇', 'Asu no Ijutsu 初版19頁'],
  'sasshi_myoniti4':    ['Asu no Ijutsu 第二編', 'Asu no Ijutsu 第二篇', 'Asu no Ijutsu（初版）第二編', 'Asu no Ijutsu（再版）第二編'],
  'sasshi_myoniti7':    ['Asu no Ijutsu 第三編'],
  'sasshi_nihon':       ['Registro de Aulas de Medicina Japonesa'],
  'sasshi_okadasen':    ['岡田先生療病術講義録'],
  'sasshi_oshieno':     ['教えのHikari'],
  'sasshi_sinnihon':    ['Nova Arte Médica Japonesa', 'Ashita no Ijutsu', 'Asu no Ijutsu・新日本医術'],
  'sasshi_sizen01':     ['Shizen Noho', 'Shizen Noho Kaisetsu'],
  'sasshi_sizen02':     ['Shizen Noho', 'Shizen Noho Kaisetsu'],
  'sasshi_sosyo01':     ['Tuberculose e Terapia Espiritual'],
  'sasshi_sosyo02':     ['O Problema da Tuberculose e sua Solução'],
  'sasshi_sosyo03':     ['Reikai Sodan'],
  'sasshi_sosyo04':     ['Kiseki Monogatari'],
  'sasshi_sosyo05':     ['Conversas de Jikan'],
  'sasshi_sosyo06':     ['岡田自観氏の横顔'],
  'sasshi_sosyo07':     ['基仏と観音教'],
  'sasshi_sosyo09':     ['Hikariへの道'],
  'sasshi_sosyo10':     ['Kenko'],
  'sasshi_sosyo11':     ['O Problema da Tuberculose e sua Solução'],
  'sasshi_sosyo12':     ['Coletânea de Sermões de Jikan'],
  'sasshi_sosyo13':     ['世界の六大神秘家'],
  'sasshi_sosyo15':     ['基仏と観音教', '基督と自観師'],
  'sasshi_syotai':      ['A Verdadeira Natureza da Tuberculose'],
  'sasshi_tebiki':      ['Sekai Messiah Kyo Tebiki'],

  // ─── Outros ───
  'akemaro':            ['明麿近詠集'],
  'vol_36':             ['天国の花'],
  'waraino':            ['笑の泉'],
  'yamato':             ['山と水'],

  // ─── Volumes (coleções encadernadas) ───
  'vol_0':              ['Mioshie-shu'],
  'vol_33':             ['神示のKenko法'],
  'vol_84':             ['Gokowa', '御Hikari話録'],
  'vol_89':             ['Eikou'],
  'vol_90':             ['Hikari', 'Toho no Hikari'],
  'vol_91':             ['Hikari'],
  'vol_92':             ['Kyusei'],
  'vol_93':             ['Kenko'],
  'vol_98':             ['Toho no Hikari'],
};

/**
 * Per-edition publication overrides for hakkousi files that span multiple volumes.
 * Key = hakkousi file name. Value = array indexed by edition position.
 * Each entry is the list of 'publication' values in the search index for that specific edition.
 */
const HAKKOUSI_EDITION_PUB_MAP = {
  // myoniti1.html has 4 editions spanning Vols. I, I+II, I+II (banned), and III
  'myoniti1.html': [
    // Edition 0: 初版 — Vol. I, 1st ed
    ['Asu no Ijutsu（初版）第一編', 'Asu no Ijutsu 初版19頁'],
    // Edition 1: 再版 第一・二篇 — Vols. I e II, 2nd ed
    ['Asu no Ijutsu（再版）第一編', 'Asu no Ijutsu（再版）第二編'],
    // Edition 2: 再々版 第一・二篇 — banned, not in index
    [],
    // Edition 3: 第三篇（初版）— Vol. III
    ['Asu no Ijutsu 第三編'],
  ],
};

/**
 * Retorna os valores de 'publication' do search index para uma publicação da biblioteca.
 * Retorna array vazio se não houver mapeamento.
 */
function getPublicationSearchNames(pub) {
  if (!pub || !pub.id) return [];
  return PUB_TO_INDEX_MAP[pub.id] || [];
}

// ─── State ────────────────────────────────────────────────────────
let allPubs     = [];      // full publications array
let hakkousiMap = {};      // hakkousi_file → rich edition data
let currentView = 'grid'; // 'grid' | 'list'
let activeEra   = 'all';  // era key or 'all'
let activeCat   = 'all';  // category key or 'all'

// ─── Era display order ────────────────────────────────────────────
const ERA_ORDER = [
  'all',
  'Fase Inicial (antes de 1947)',
  'Showa 22-23 (1947-48)',
  'Showa 24 (1949)',
  'Showa 25 (1950)',
  'Showa 26 (1951)',
  'Showa 27 (1952)',
  'Showa 28 (1953)',
  'Showa 29-30 (1954-55)',
  'Fase Inicial / Sem data',
  'Não Publicado',
];

// ─── Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initLibrary);

async function initLibrary() {
  try {
    const [pubRes, hakRes] = await Promise.all([
      fetch('data/publications_enriched.json?v=2'),
      fetch('data/hakkousi_rich.json'),
    ]);
    allPubs = await pubRes.json();
    // Stamp each pub with its allPubs index so click handler works even with duplicate IDs
    allPubs.forEach((p, i) => { p._idx = i; });
    const hakData = await hakRes.json();
    // Build map: file name (without path) → entry
    hakData.forEach(h => { hakkousiMap[h.file] = h; });
    buildEraNav();
    buildCatNav();
    renderPublications();
  } catch (err) {
    document.getElementById('libLoading').innerHTML =
      '<p style="color:var(--text-muted);font-family:var(--font-ui)">Erro ao carregar publicações.</p>';
    console.error('library.js:', err);
  }
}

// ─── Sidebar: Era navigation ──────────────────────────────────────
function buildEraNav() {
  const nav = document.getElementById('eraNav');
  if (!nav) return;

  // Count per era (excluding 'all')
  const counts = {};
  allPubs.forEach(p => {
    counts[p.era] = (counts[p.era] || 0) + 1;
  });

  const btns = [];

  // "Todas" (all)
  btns.push(makeNavBtn('era', 'all', 'Todas as Publicações', allPubs.length));

  ERA_ORDER.forEach(era => {
    if (era === 'all') return;
    if (!counts[era]) return;
    btns.push(makeNavBtn('era', era, era, counts[era]));
  });

  nav.innerHTML = btns.join('');
  nav.querySelectorAll('.lib-era-btn').forEach(btn => {
    btn.addEventListener('click', () => filterByEra(btn.dataset.key));
  });

  // Set initial active
  nav.querySelector('[data-key="all"]').classList.add('active');
}

// ─── Sidebar: Category navigation ────────────────────────────────
function buildCatNav() {
  const nav = document.getElementById('catNav');
  if (!nav) return;

  const counts = {};
  allPubs.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  // Sort by count desc
  const cats = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);

  const btns = [];
  btns.push(makeNavBtn('cat', 'all', 'Todas', allPubs.length));
  cats.forEach(([cat, count]) => {
    btns.push(makeNavBtn('cat', cat, cat, count));
  });

  nav.innerHTML = btns.join('');
  nav.querySelectorAll('.lib-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => filterByCat(btn.dataset.key));
  });

  nav.querySelector('[data-key="all"]').classList.add('active');
}

function makeNavBtn(type, key, label, count) {
  const cls  = type === 'era' ? 'lib-era-btn' : 'lib-cat-btn';
  const esc  = escHtml(label);
  return `<button class="${cls}" data-key="${escHtml(key)}">
    <span>${esc}</span>
    <span class="lib-nav-count">${count}</span>
  </button>`;
}

// ─── Filters ──────────────────────────────────────────────────────
function filterByEra(key) {
  activeEra = key;
  activeCat = 'all';

  // Update active in both navs
  document.querySelectorAll('.lib-era-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.key === key));
  document.querySelectorAll('.lib-cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.key === 'all'));

  renderPublications();
}

function filterByCat(key) {
  activeCat = key;
  activeEra = 'all';

  document.querySelectorAll('.lib-cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.key === key));
  document.querySelectorAll('.lib-era-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.key === 'all'));

  renderPublications();
}

// ─── View mode ────────────────────────────────────────────────────
function setView(mode) {
  currentView = mode;
  document.getElementById('btnGrid').classList.toggle('active', mode === 'grid');
  document.getElementById('btnList').classList.toggle('active', mode === 'list');
  renderPublications();
}

// Expose globally (called by inline onclick in HTML)
window.setView = setView;
window.closeModal = closeModal;

// ─── Render publications ──────────────────────────────────────────
function renderPublications() {
  const container = document.getElementById('publicationsContainer');
  if (!container) return;

  // Filter
  let pubs = allPubs;
  if (activeEra !== 'all') {
    pubs = pubs.filter(p => p.era === activeEra);
  }
  if (activeCat !== 'all') {
    pubs = pubs.filter(p => p.category === activeCat);
  }

  // Update era header
  updateEraHeader(pubs);

  // Render
  if (pubs.length === 0) {
    container.className = 'pub-grid';
    container.innerHTML = '<div class="lib-empty">Nenhuma publicação encontrada.</div>';
    return;
  }

  if (currentView === 'list') {
    container.className = 'pub-list';
    container.innerHTML = pubs.map(p => renderListItem(p)).join('');
  } else {
    container.className = 'pub-grid';
    container.innerHTML = renderGridItems(pubs);
  }

  // Attach click events
  container.querySelectorAll('[data-pub-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const pub = allPubs[parseInt(el.dataset.pubIdx)];
      if (pub) openModal(pub);
    });
  });
}

// ─── Era header ───────────────────────────────────────────────────
function updateEraHeader(pubs) {
  const titleEl    = document.getElementById('eraTitle');
  const subtitleEl = document.getElementById('eraSubtitle');
  const statsEl    = document.getElementById('eraStats');
  if (!titleEl) return;

  const withCovers = pubs.filter(p => p.cover_image).length;
  const cats       = [...new Set(pubs.map(p => p.category))].length;

  let title, subtitle;
  if (activeEra !== 'all') {
    title    = activeEra;
    subtitle = `Publicações do período — ordenadas cronologicamente`;
  } else if (activeCat !== 'all') {
    title    = activeCat;
    subtitle = `Publicações por categoria`;
  } else {
    title    = 'Biblioteca de Publicações';
    subtitle = 'Publicações históricas de Meishu-Sama, organizadas cronologicamente';
  }

  titleEl.querySelector('.lang-pt').textContent = title;
  subtitleEl.querySelector('.lang-pt').textContent = subtitle;

  statsEl.innerHTML = `
    <span><strong>${pubs.length}</strong> publicações</span>
    <span><strong>${withCovers}</strong> com capa</span>
    <span><strong>${cats}</strong> categorias</span>
  `;
}

// ─── Grid rendering ───────────────────────────────────────────────
function renderGridItems(pubs) {
  // Group by era when showing 'all', otherwise flat
  if (activeEra === 'all' && activeCat === 'all') {
    const groups = groupByEra(pubs);
    return groups.map(([era, items]) => {
      const header = `<div class="pub-era-section">${escHtml(era)}</div>`;
      const cards  = items.map(p => renderCard(p)).join('');
      return header + cards;
    }).join('');
  }
  return pubs.map(p => renderCard(p)).join('');
}

function renderCard(pub) {
  const cover   = coverHtml(pub, 'card');
  const dateStr = pub.date_showa ? `<div class="pub-card__date">${escHtml(pub.date_showa)}</div>` : '';
  const catStr  = pub.category   ? `<div class="pub-card__cat">${escHtml(pub.category)}</div>`   : '';

  // Use romaji (title_ja) as primary title as per user request
  const displayTitle = pub.title_ja || pub.title_pt || '';

  return `<div class="pub-card" data-pub-idx="${pub._idx}" role="button" tabindex="0" aria-label="${escHtml(displayTitle)}">
    <div class="pub-card__cover">${cover}</div>
    <div class="pub-card__info">
      <p class="pub-card__title">${escHtml(displayTitle)}</p>
      ${dateStr}
      ${catStr}
    </div>
  </div>`;
}

// ─── List rendering ───────────────────────────────────────────────
function renderListItem(pub) {
  const thumb = pub.cover_image
    ? `<img src="assets/img/${escHtml(pub.cover_image)}" alt="" loading="lazy">`
    : `<div class="pub-list-item__thumb-placeholder">${bookIcon()}</div>`;

  const dateStr = pub.date_showa ? `<span class="showa">${escHtml(pub.date_showa)}</span>` : '';
  const yearStr = pub.year       ? `<span>${pub.year}</span>` : '';
  const catStr  = pub.category   ? `<span>${escHtml(pub.category)}</span>` : '';

  const displayTitle = pub.title_ja || pub.title_pt || '';
  const subTitle = pub.title_pt && pub.title_pt !== pub.title_ja ? pub.title_pt : '';

  return `<div class="pub-list-item" data-pub-idx="${pub._idx}" role="button" tabindex="0" aria-label="${escHtml(displayTitle)}">
    <div class="pub-list-item__thumb">${thumb}</div>
    <div class="pub-list-item__body">
      <p class="pub-list-item__title">${escHtml(displayTitle)}</p>
      <p class="pub-list-item__ja">${escHtml(subTitle)}</p>
      <div class="pub-list-item__meta">${dateStr}${yearStr}${catStr}</div>
    </div>
    <div class="pub-list-item__arrow">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>`;
}

// ─── Group by era (respects ERA_ORDER) ────────────────────────────
function groupByEra(pubs) {
  const map = {};
  pubs.forEach(p => {
    if (!map[p.era]) map[p.era] = [];
    map[p.era].push(p);
  });

  return ERA_ORDER
    .filter(era => era !== 'all' && map[era])
    .map(era => [era, map[era]]);
}

// ─── Cover HTML ───────────────────────────────────────────────────
function coverHtml(pub, mode) {
  if (pub.cover_image) {
    return `<img src="assets/img/${escHtml(pub.cover_image)}" alt="${escHtml(pub.title_pt)}" loading="lazy">`;
  }
  const short = (pub.title_ja || pub.title_pt || '').slice(0, 30);
  if (mode === 'card') {
    return `<div class="pub-cover-placeholder">
      ${bookIconLarge()}
      <span class="pub-cover-placeholder__title">${escHtml(short)}</span>
    </div>`;
  }
  return `<div class="pub-cover-placeholder">${bookIconLarge()}</div>`;
}

// ─── Modal ────────────────────────────────────────────────────────
function openModal(pub) {
  const modal = document.getElementById('pubModal');
  const panel = document.getElementById('pubModalPanel');
  if (!modal || !panel) return;

  // Resolve hakkousi rich data: try multiple strategies
  let hakData = null;
  const fileKey = pub.filter_value || pub.id;
  
  // Strategy 1: direct id match (hakkousi_ prefix)
  if (pub.id && pub.id.startsWith('hakkousi_')) {
    const file = pub.id.replace('hakkousi_', '') + '.html';
    hakData = hakkousiMap[file] || null;
  }
  
  // Strategy 2: match by filter_value -> hakkousi file
  if (!hakData && pub.filter_value) {
    // Try removing prefixes
    let key = pub.filter_value;
    if (key.startsWith('hakkousi_')) key = key.replace('hakkousi_', '');
    else if (key.startsWith('sasshi_')) key = key.replace('sasshi_', '');
    else if (key.startsWith('kanren_')) key = key.replace('kanren_', '');
    else if (key.startsWith('ha_')) key = key.replace('ha_', '');
    
    const file = key + '.html';
    hakData = hakkousiMap[file] || null;
  }
  
  // Strategy 3: match via hakkousi_file field (from enrichment)
  if (!hakData && pub.hakkousi_file) {
    hakData = hakkousiMap[pub.hakkousi_file] || null;
  }

  const cover = pub.cover_image
    ? `<img src="assets/img/${escHtml(pub.cover_image)}" alt="${escHtml(pub.title_pt)}">`
    : `<div class="pub-modal__cover-placeholder">
        ${bookIconLarge()}
        <span>${escHtml(pub.title_ja || pub.title_pt)}</span>
      </div>`;

  const descHtml = pub.description
    ? `<p class="pub-modal__desc">${escHtml(pub.description)}</p>` : '';

  // Basic metadata — include enriched fields
  const metaRows = [];
  if (pub.date_showa) metaRows.push(['Data Showa', pub.date_showa]);
  if (pub.year)       metaRows.push(['Ano', pub.year]);
  if (pub.era)        metaRows.push(['Período', pub.era]);
  if (pub.category)   metaRows.push(['Categoria', pub.category]);
  if (pub.author)     metaRows.push(['Autor', pub.author]);
  if (pub.publisher)  metaRows.push(['Editora', pub.publisher]);
  if (pub.format)     metaRows.push(['Formato', pub.format]);
  if (pub.pages)      metaRows.push(['Páginas', pub.pages + (pub.pages_note ? ' ' + pub.pages_note : '')]);
  if (pub.price)      metaRows.push(['Preço', pub.price]);
  if (pub.printer)    metaRows.push(['Impressão', pub.printer]);

  const metaGrid = metaRows.length
    ? `<div class="pub-modal__meta-grid">
        ${metaRows.map(([label, val]) => `
          <div class="pub-modal__meta-item">
            <span class="pub-modal__meta-label">${escHtml(label)}</span>
            <span class="pub-modal__meta-value">${escHtml(String(val))}</span>
          </div>`).join('')}
      </div>` : '';

  // Reader action — link to browse.html filtered by publication
  const _pubNames = getPublicationSearchNames(pub);
  let actionBtn = '';
  if (_pubNames.length === 1) {
    actionBtn = `<a class="btn-primary" href="browse.html?pub=${encodeURIComponent(_pubNames[0])}">
      <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <span class="lang-pt">Ler Ensinamentos</span>
    </a>`;
  } else if (_pubNames.length > 1) {
    actionBtn = _pubNames.map(name =>
      `<a class="btn-primary btn-primary--sm" href="browse.html?pub=${encodeURIComponent(name)}">
        <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        ${escHtml(name)}
      </a>`
    ).join('');
  } else {
    // Fallback: busca textual quando não há mapeamento exato
    const searchTitle = pub.title_ja || pub.title_pt || '';
    if (searchTitle) {
      actionBtn = `<a class="btn-primary btn-primary--outline" href="browse.html?q=${encodeURIComponent(searchTitle)}">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="lang-pt">Buscar Ensinamentos</span>
      </a>`;
    }
  }

  const unpublishedBadge = pub.unpublished
    ? `<span class="pub-modal__unpublished">Não publicado / inédito</span>` : '';

  // Editions table from hakkousi data
  const editionsHtml = hakData && hakData.editions && hakData.editions.length
    ? renderEditionsTable(hakData, pub)
    : '';

  // Series info
  const seriesInfo = (hakData && hakData.series_info_pt)
    ? `<p class="pub-modal__series-info">${escHtml(hakData.series_info_pt)}</p>`
    : (pub.series_info_pt ? `<p class="pub-modal__series-info">${escHtml(pub.series_info_pt)}</p>` : '');

  // Notes from enrichment
  const notesHtml = pub.notes_pt && pub.notes_pt !== pub.description
    ? `<p class="pub-modal__desc">${escHtml(pub.notes_pt)}</p>` : '';

  // All Images Carousel
  let carouselHtml = '';
  if (hakData && hakData.all_images && hakData.all_images.length > 0) {
    const slides = hakData.all_images.map(img => 
      `<div class="pub-carousel__slide" onclick="openLightbox('assets/img/${escHtml(img)}')" style="cursor:pointer">
         <img src="assets/img/${escHtml(img)}" alt="Foto da Edição" loading="lazy">
       </div>`
    ).join('');
    
    carouselHtml = `
      <div class="pub-modal__carousel">
        <h3 class="pub-carousel__title">Galeria de Edições</h3>
        <div class="pub-carousel__track-container">
          <div class="pub-carousel__track">
            ${slides}
          </div>
        </div>
      </div>
    `;
  }

  // Edition/image counts badge
  const countsBadge = (pub.edition_count || pub.image_count)
    ? `<div class="pub-modal__counts">
        ${pub.edition_count ? `<span>📖 ${pub.edition_count} edições</span>` : ''}
        ${pub.image_count ? `<span>🖼 ${pub.image_count} imagens</span>` : ''}
       </div>` : '';

  panel.innerHTML = `
    <button class="pub-modal__close" onclick="closeModal()" aria-label="Fechar">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <div class="pub-modal__top">
      <div class="pub-modal__cover">${cover}</div>
      <div class="pub-modal__body">
        <div class="pub-modal__category">${escHtml(pub.category || 'Publicação')}</div>
        <h2 class="pub-modal__title" id="modalTitle">${escHtml(pub.title_ja || pub.title_pt)}</h2>
        <p class="pub-modal__title-ja">${escHtml(pub.title_pt)}</p>
        ${descHtml}
        ${notesHtml}
        ${metaGrid}
        ${seriesInfo}
        ${countsBadge}
        ${unpublishedBadge}
        ${!editionsHtml ? `<div class="pub-modal__actions">${actionBtn}
          <button class="btn-secondary" onclick="closeModal()">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span class="lang-pt">Fechar</span>
          </button>
        </div>` : ''}
      </div>
    </div>
    
    ${carouselHtml}

    ${editionsHtml}
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  panel.querySelector('.pub-modal__close').focus();
}

// ─── Editions table ───────────────────────────────────────────────
function renderEditionsTable(hakData, pub) {
  const perEditionMap = HAKKOUSI_EDITION_PUB_MAP[hakData.file] || null;

  // Sort editions by year ascending (oldest first), preserving original index for perEditionMap
  const sortedEditions = hakData.editions
    .map((ed, origIdx) => ({ ed, origIdx }))
    .sort((a, b) => (a.ed.year || 9999) - (b.ed.year || 9999));

  const cards = sortedEditions.map(({ ed, origIdx: edIdx }) => {
    // 1. Meta line: Date, Year, Format, Pages, Price
    const metaItems = [];
    if (ed.date_showa) metaItems.push(`<span class="ed-meta-date">${escHtml(ed.date_showa)}</span>`);
    if (ed.year) metaItems.push(`<span>${ed.year}</span>`);
    if (ed.format || ed.pages) {
      const pgs = ed.pages ? ` · ${ed.pages}p` : '';
      const pgsNote = ed.pages_note ? ` ${escHtml(ed.pages_note)}` : '';
      metaItems.push(`<span>${escHtml(ed.format || '')}${pgs}${pgsNote}</span>`);
    }
    if (ed.price) metaItems.push(`<span>${escHtml(ed.price)}</span>`);
    
    // 2. Credits: Author, Publisher, Printer
    const credits = [];
    if (ed.author) credits.push(`<strong>Autor:</strong> ${escHtml(ed.author)}`);
    if (ed.publisher || ed.publisher_org) {
      const pubName = [ed.publisher_org, ed.publisher].filter(Boolean).join(' / ');
      credits.push(`<strong>Editora:</strong> ${escHtml(pubName)}`);
    }
    if (ed.printer) credits.push(`<strong>Impressão:</strong> ${escHtml(ed.printer)}`);

    // 3. Notes
    let notesHtml = '';
    if (ed.notes_pt) {
      notesHtml += `<p class="ed-card__note">${escHtml(ed.notes_pt)}</p>`;
    }
    if (ed.notes && ed.notes.includes('発行禁止処分')) {
      notesHtml += `<p class="ed-card__banned">⊘ Proibido de circular (Emissão cancelada)</p>`;
    }

    // 4. Action Button — use per-edition override if available
    const _edPubNames = (perEditionMap && perEditionMap[edIdx] !== undefined)
      ? perEditionMap[edIdx]
      : getPublicationSearchNames(pub);
    let readLink = '';
    if (_edPubNames.length >= 1) {
      const pubParam = _edPubNames.join('|||');
      readLink = `
        <div class="ed-card__actions">
          <a class="btn-primary btn-primary--sm" href="browse.html?pub=${encodeURIComponent(pubParam)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Ler Ensinamentos
          </a>
        </div>`;
    }

    // 5. Images Gallery
    let imagesHtml = '';

    return `
      <div class="pub-edition-card">
        <div class="ed-card__header">
          <h4 class="ed-card__title">${escHtml(ed.edition_pt || ed.edition || 'Edição')}</h4>
          <span class="ed-card__title-ja">${escHtml(ed.edition || '')}</span>
        </div>
        <div class="ed-card__body">
          ${imagesHtml}
          <div class="ed-card__content">
            <div class="ed-card__meta">
              ${metaItems.join('<span class="ed-meta-sep">•</span>')}
            </div>
            ${credits.length ? `<div class="ed-card__credits">${credits.join('<br>')}</div>` : ''}
            ${notesHtml}
            ${readLink}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="pub-modal__editions">
    <div class="pub-modal__editions-header">
      <span class="lang-pt">Edições e Volumes</span>
    </div>
    <div class="editions-list">
      ${cards}
    </div>
  </div>`;
}

function closeModal() {
  const modal = document.getElementById('pubModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeModal();
  }
});

// ─── Lightbox ─────────────────────────────────────────────────────
function openLightbox(src) {
  // Prevent modal from closing
  event.stopPropagation();
  const lb = document.createElement('div');
  lb.className = 'pub-lightbox';
  lb.onclick = () => lb.remove();
  lb.innerHTML = `<img src="${escHtml(src)}" alt="Imagem ampliada">`;
  document.body.appendChild(lb);
}

function closeLightbox() {
  const lb = document.querySelector('.pub-lightbox');
  if (lb) lb.remove();
}

window.openLightbox = openLightbox;

// Keyboard support for cards
document.getElementById('publicationsContainer')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.click();
  }
});

// ─── SVG helpers ──────────────────────────────────────────────────
function bookIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>`;
}

function bookIconLarge() {
  return `<svg class="pub-cover-placeholder__icon" viewBox="0 0 24 24">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>`;
}

// ─── Utility ──────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );
}
