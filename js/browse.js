/* =============================================================
   browse.js — Rich Browse / Index for Mioshie Zenshu
   ============================================================= */

'use strict';

const IDX_URL = 'data/search/advanced_search_index.json';
const READER  = 'reader.html';

// ─── 神智之光 Thematic Categories (総目次) ────────────────────
const SHINCHI_CATEGORIES = {
  1:  { ja: '神解明篇', pt: 'Elucidação de Deus' },
  2:  { ja: '主神篇', pt: 'O Deus Supremo' },
  3:  { ja: '万神篇', pt: 'As Múltiplas Divindades' },
  4:  { ja: '明主様篇', pt: 'Meishu-Sama' },
  5:  { ja: '霊界篇', pt: 'O Mundo Espiritual' },
  6:  { ja: '建設破壊篇', pt: 'Construção e Destruição' },
  7:  { ja: '宗教概論篇', pt: 'Panorama Religioso' },
  8:  { ja: '宗教芸術篇', pt: 'Religião e Arte' },
  9:  { ja: '人間本体篇', pt: 'Essência do Ser Humano' },
  10: { ja: '想念言霊篇', pt: 'Pensamento e Poder da Palavra' },
  11: { ja: '民族、国土、迷信篇', pt: 'Povos, Nações e Superstições' },
  12: { ja: '信仰篇（特輯）', pt: 'A Fé (Edição Especial)' },
  13: { ja: '信仰篇（救業、布教）', pt: 'A Fé (Obra Divina e Difusão)' },
  14: { ja: '信仰篇（入信、信仰上の悩み）', pt: 'A Fé (Ingresso e Sofrimentos)' },
  15: { ja: '浄霊篇（上）', pt: 'Johrei (Vol. 1)' },
  16: { ja: '浄霊篇（下）', pt: 'Johrei (Vol. 2)' },
  17: { ja: '医術篇（一）', pt: 'Arte da Cura (1): Cérebro e Olhos' },
  18: { ja: '医術篇（二）', pt: 'Arte da Cura (2): Tronco Superior' },
  19: { ja: '医術篇（三）', pt: 'Arte da Cura (3): Tronco Central' },
  20: { ja: '医術篇（四）', pt: 'Arte da Cura (4): Tronco Inferior' },
  21: { ja: '医術篇（五）', pt: 'Arte da Cura (5): Membros e Pele' },
  22: { ja: '医術篇（六）', pt: 'Arte da Cura (6): Sintomas Diversos' },
  23: { ja: '医術篇（七）', pt: 'Arte da Cura (7): Lesões' },
  24: { ja: '医術篇（八）', pt: 'Arte da Cura (8): Terapias' },
  25: { ja: '医術篇（九）', pt: 'Arte da Cura (9): Purificação e Saúde' },
  26: { ja: '医術篇（十）', pt: 'Arte da Cura (10): Gestação' },
  27: { ja: '霊学篇（一）', pt: 'Ciência Espiritual: Doenças (1)' },
  28: { ja: '霊学篇（二）', pt: 'Doenças Espirituais (2)' },
  29: { ja: '霊学篇（三）', pt: 'Doenças Espirituais (3)' },
  30: { ja: '霊学篇（四）', pt: 'Doenças Espirituais (4)' },
  31: { ja: '霊学篇（五）', pt: 'Fenômenos Espirituais (1)' },
  32: { ja: '霊学篇（六）', pt: 'Fenômenos Espirituais (2)' },
  33: { ja: '霊学篇（七）', pt: 'Elucidação dos Espíritos (1)' },
  34: { ja: '霊学篇（八）', pt: 'Elucidação dos Espíritos (2)' },
  35: { ja: '霊学篇（九）', pt: 'Elucidação dos Espíritos (3)' },
  36: { ja: '農法篇', pt: 'Agricultura Natural' },
  37: { ja: '奇蹟奇象篇', pt: 'Milagres e Fenômenos' },
  38: { ja: '祭事篇（一）', pt: 'Rituais Sagrados (1)' },
  39: { ja: '祭事篇（二）', pt: 'Rituais Sagrados (2)' },
  40: { ja: '祭事篇（三）', pt: 'Rituais Sagrados (3)' },
  41: { ja: '霊祀篇（一）', pt: 'Culto aos Antepassados (1)' },
  42: { ja: '霊祀篇（二）', pt: 'Culto aos Antepassados (2)' },
  43: { ja: '霊祀篇（三）', pt: 'Culto aos Antepassados (3)' },
  44: { ja: '霊祀篇（四）', pt: 'Culto aos Antepassados (4)' },
  45: { ja: '人事篇（一）', pt: 'Relações Humanas (1)' },
  46: { ja: '人事篇（二）', pt: 'Relações Humanas (2)' },
  47: { ja: '社会人事篇', pt: 'Sociedade e Relações Humanas' },
  48: { ja: '政治、経済、社会篇', pt: 'Política e Economia' },
  49: { ja: '学問篇', pt: 'Conhecimento' },
  50: { ja: '天文、地文篇', pt: 'Astronomia e Geografia' },
};

// ─── Compilation headers with cover images ──────────────────
const COMPILATION_INFO = {
  revelacao:    { title: '御垂示録', subtitle: 'Gosuijiroku — Registros Especiais', img: 'assets/img/gosuiji.JPG', desc: 'Coletânea de Escritos do Mestre Okada Jikanshi — Registro de Ensinamentos por Edição (Números 1 a 30)', redirect: 'reader.html?pub=Gosuiiji録&mode=book' },
  miosie:       { title: '御教え集', subtitle: 'Mioshieshu — Coletânea de Ensinamentos', img: 'assets/img/mioshie.JPG', desc: 'Coletânea de Artigos do Mestre Okada Jikan — Coletânea de Ensinamentos por Publicação (Números 1 a 33)', redirect: 'reader.html?pub=Mioshie-shu&mode=book' },
  viagem:       { title: '御光話録', subtitle: 'Ohikari Kowa Roku', img: 'assets/img/ohikari.JPG', desc: 'Coletânea de Ensaios do Mestre Okada Jikanshi — Registro dos Diálogos com Meishu-Sama (Volumes 1 a 19 e Suplemento)', redirect: 'reader.html?pub=御Hikari話録&mode=book' },
  hikarinochie: { title: '神智之光', subtitle: 'Shinchi no Hikari — 講話集（補）', img: 'assets/img/gokowa1.jpg', desc: '講話集（補）— Compilação temática de Perguntas e Respostas (質問応答) organizada por categorias. Editor: 井上茂登吉', redirect: 'reader.html?pub=shinchi' },
  jorei:        { title: '浄霊法講座', subtitle: 'Johrei Ho Koza — Curso sobre o Método do Johrei', img: 'assets/img/joreiho.jpg', desc: 'Curso sobre o Método do Johrei (Volumes I a VIII)', redirect: 'reader.html?pub=浄霊法講座&mode=book' },
  dendo:        { title: '伝道の引き', subtitle: 'Dendo no Shiori — Guia para a Difusão', img: null, desc: 'Guia para a Difusão I e II — Manual prático para a propagação da fé' },
  english:      { title: 'ENGLISH', subtitle: 'Traduções em Inglês', img: null, desc: 'Ensinamentos traduzidos para o idioma inglês' },
  sanko:        { title: '参考資料', subtitle: 'Material de Referência', img: null, desc: 'Materiais de referência e documentos complementares' },
  sasshi:       { title: '明主様関連寄稿', subtitle: 'Contribuições sobre Meishu-sama', img: null, desc: 'Artigos e contribuições relacionadas a Meishu-sama' },
  hakkousi:     { title: 'その他の寄稿', subtitle: 'Outras Contribuições — Artigos de colaboradores diversos', img: null, desc: '180 artigos de contribuidores como Kaian-sei (槐安生), Iwasaki Sakae (岩崎栄), Inoue Motokichi (井上茂登吉) e outros' },
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

// Map publication names → book-mode reader URLs
const PUB_BOOK_URL = {
  'Mioshie-shu':    'reader.html?pub=Mioshie-shu&mode=book',
  'Gosuiiji録':     'reader.html?pub=Gosuiiji録&mode=book',
  '御Hikari話録':   'reader.html?pub=御Hikari話録&mode=book',
  '御Hikari話録（補）': 'reader.html?pub=御Hikari話録&mode=book',
  '浄霊法講座':     'reader.html?pub=浄霊法講座&mode=book',
  'Gokowa':         'reader.html?pub=shinchi',
};
function pubBookUrl(pubName) {
  if (!pubName) return null;
  if (PUB_BOOK_URL[pubName]) return PUB_BOOK_URL[pubName];
  // Generic book mode — reader will try and fallback gracefully
  return `reader.html?pub=${encodeURIComponent(pubName)}&mode=book`;
}

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
  { id: 'okage',        label: 'お陰話',           match: x => folder2(x) === 'okage', css: 'type-other' },
  { id: 'revelacao',    label: '御垂示録',         match: x => urlPrefix(x) === 'gosuiji', css: 'type-revelacao'},
  { id: 'viagem',       label: '御光話録',         match: x => folder2(x) === 'kikou' || folder2(x) === 'kikou2', css: 'type-viagem'   },
  { id: 'jorei',        label: '浄霊法講座',       match: x => folder2(x) === 'jorei',                            css: 'type-other'    },
  { id: 'sanko',        label: '参考資料',         match: x => folder2(x) === 'sanko',                            css: 'type-other'    },

  // miosie — 御教え集
  { id: 'miosie',       label: '御教え集',         match: x => urlPrefix(x) === 'miosie',                         css: 'type-other'    },

  // kanren — subdivided
  // hikarinochie = 神智之光 — same content as qa/situmon, but as compilation
  // match returns false so items classify as 'qa' individually; hikarinochie only works via TYPE_TO_SECTIONS
  { id: 'hikarinochie', label: '神智之光',         match: () => false,                                            css: 'type-viagem'   },
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

// ─── Sonota (その他の寄稿) special listing ──────────────────────
let _sonotaEntries = null; // loaded on demand

async function loadSonota() {
  if (_sonotaEntries) return _sonotaEntries;
  const res = await fetch('data/sonota_listing.json');
  const data = await res.json();
  _sonotaEntries = data.entries.map((e, i) => ({
    id:           e.id || null,
    title:        e.title_ja || '',
    title_pt:     e.title_pt || '',
    publication:  e.publication_ja || '',
    issue_page:   e.date_showa || '',
    author:       e.author || '',
    url:          e.url || '',
    part_file:    e.part_file || '',
    _type:        'hakkousi',
    _sonota:      true,
    _sortIndex:   i,
  }));
  return _sonotaEntries;
}

// ─── Section Tables (legacy order) ────────────────────────────
let _sectionTables = null;
let _sectionLoading = false;

async function loadSectionTables() {
  if (_sectionTables) return _sectionTables;
  if (_sectionLoading) {
    // wait for in-flight load
    while (_sectionLoading) await new Promise(r => setTimeout(r, 50));
    return _sectionTables;
  }
  _sectionLoading = true;
  try {
    const res = await fetch('data/section_tables.json');
    _sectionTables = await res.json();
  } catch (e) {
    console.warn('Failed to load section_tables.json:', e);
    _sectionTables = {};
  }
  _sectionLoading = false;
  return _sectionTables;
}

async function loadShinchiIndex() {
  if (_shinchiIndex) return _shinchiIndex;
  try {
    const res = await fetch('data/shinchi_index.json');
    _shinchiIndex = await res.json();
  } catch (e) {
    console.warn('Failed to load shinchi_index.json:', e);
    _shinchiIndex = {};
  }
  return _shinchiIndex;
}

// ─── Type → Section Tables mapping ───────────────────────────
// Maps sidebar type IDs to section_tables keys (for legacy order)
const TYPE_TO_SECTIONS = {
  palestra: ['palestras'],
  qa:       ['situmon'],
  dialogo:  ['taidan'],
  ensaio:   ['ensaios_syoki','ensaios_s1718','ensaios_s2223','ensaios_s24','ensaios_s25','ensaios_s26','ensaios_s27','ensaios_s28','ensaios_s29'],
  sanko:    ['sanko'],
  okage:    ['okage'],
  kanren:       ['kanren'],
  viagem:       ['kiko', 'kiko2'],
  hikarinochie: ['situmon'],  // 神智之光 = 質問応答 organized as book
};

// ─── Era → Ensaio section mapping ────────────────────────────
const ERA_TO_ENSAIO_SECTION = {
  inicial: 'ensaios_syoki',
  s1718:   'ensaios_s1718',
  s2223:   'ensaios_s2223',
  s24:     'ensaios_s24',
  s25:     'ensaios_s25',
  s26:     'ensaios_s26',
  s27:     'ensaios_s27',
  s28:     'ensaios_s28',
  s2930:   'ensaios_s29',
};

// ─── Compilation types that open in book mode ─────────────────
const COMPILATION_BOOK_TYPES = new Set(['revelacao', 'miosie', 'hikarinochie', 'dendo', 'english']);

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
let _usingSectionData = false;  // true when showing section_tables data
let _activeSectionKey = '';     // which section_tables key is active
let _shinchiIndex = null;       // 神智之光 thematic index data
let _usingShinchiMode = false;  // true when showing shinchi thematic view

const _filters = { type: '', era: '', letter: '', search: '', pub: '' };

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await Promise.all([loadIndex(), loadSectionTables(), loadShinchiIndex()]);
  computeSectionCounts();
  readUrlParams();
  buildSidebar();
  applyFilters();
  if (typeof applyLanguage === 'function') {
    applyLanguage(localStorage.getItem('site_lang') || 'pt', false);
  }
});

// ─── Section counts from section_tables ──────────────────────
function computeSectionCounts() {
  if (!_sectionTables) return;
  for (const [type, sections] of Object.entries(TYPE_TO_SECTIONS)) {
    let total = 0;
    for (const secKey of sections) {
      if (_sectionTables[secKey]) total += _sectionTables[secKey].total || 0;
    }
    if (total > 0) _typeCounts[type] = total;
  }
}

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
    // ─── Title normalization ───────────────────────────────────
    // gosuiji (revelacao): always "Gosuijiroku N" from URL
    if (x._type === 'revelacao') {
      const m = (x.url||'').match(/sui(\d+)/i);
      if (m) x.title = `Gosuijiroku ${parseInt(m[1], 10)}`;
    // miosie whole-issue pages: "Mioshieshu N" from URL
    } else if (/miosie\/miosie\d+/i.test(x.url||'')) {
      const m = (x.url||'').match(/miosie(\d+)/i);
      if (m) x.title = `Mioshieshu ${parseInt(m[1], 10)}`;
    // Others: strip "Coletânea/Coleção de X —" header artifact
    } else {
      const raw = x.title || '';
      const dm = raw.match(/^(?:D[ao]\s+)?(?:Coletânea|Coleção|Compilação|Do\s+Acervo)\s+de\s+[^—–\n]+\s*[—–]+\s*(.+)$/is);
      if (dm && dm[1].trim().length > 3) x.title = dm[1].trim();
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
  // Use section_tables counts when available (more accurate — matches legacy site)
  const sc = (type) => _typeCounts[type] || 0;

  // ① 御論文 — sum of all ensaio sections
  set('countRonbun',      sc('ensaio'));
  set('countEnsaio',      sc('ensaio'));
  // ② 御教え
  set('countPalestra',    sc('palestra'));
  set('countQa',          sc('qa'));
  set('countDialogo',     sc('dialogo'));
  // ③ 編纂・翻訳
  set('countRevelacao',   sc('revelacao'));
  set('countMiosie',      sc('miosie'));
  set('countViagem',      sc('viagem'));
  set('countHikari',      sc('hikarinochie'));
  set('countJorei',       sc('jorei'));
  set('countDendo',       sc('dendo'));
  set('countEnglish',     sc('english'));
  // ④ 参考資料
  set('countSanko',       sc('sanko'));
  set('countSasshi',      sc('sasshi'));
  set('countHakkousi',    180);  // curated listing from sonota_listing.json
  set('countKanren',      sc('kanren'));
  set('countOkage',       sc('okage'));
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
  // Redirect to dedicated page if compilation has one
  if (key === 'type' && val && COMPILATION_INFO[val]?.redirect) {
    window.location.href = COMPILATION_INFO[val].redirect;
    return;
  }
  // Toggle filter (click again to deactivate)
  _filters[key] = _filters[key] === val ? '' : val;
  // Reset sort to default when switching between section/index modes
  if (key === 'type') {
    const willUseSection = _filters[key] && TYPE_TO_SECTIONS[_filters[key]];
    if (willUseSection) {
      _sortCol = 'era'; // 'era' = original order for section data
      _sortAsc = true;
    }
  }
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

async function applyFilters() {
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Special case: その他の寄稿 uses curated listing
  if (_filters.type === 'hakkousi') {
    _usingSectionData = false;
    _usingShinchiMode = false;
    _activeSectionKey = '';
    const sonota = await loadSonota();
    _filtered = sonota.filter(x => {
      if (terms.length) {
        const hay = [x.title, x.title_pt, x.publication, x.author].join(' ').toLowerCase();
        if (!terms.every(t => hay.includes(t))) return false;
      }
      return true;
    });
    // Keep original order by default
    _filtered.sort((a, b) => a._sortIndex - b._sortIndex);
    renderFilterBadges();
    renderTable();
    renderPagination();
    return;
  }

  // ─── 神智之光 thematic index mode ──────────────────────────────
  if (_filters.type === 'hikarinochie' && _shinchiIndex) {
    _usingSectionData = false;
    _usingShinchiMode = true;
    _filtered = [];  // not used in shinchi mode
    renderFilterBadges();
    renderShinchiIndex(terms);
    renderPagination();
    pushState();
    return;
  }

  // ─── Section Tables mode ─────────────────────────────────────
  // When a type filter maps to section_tables, use legacy data for faithful order
  const sectionKeys = _filters.type ? TYPE_TO_SECTIONS[_filters.type] : null;

  if (sectionKeys && _sectionTables) {
    _usingSectionData = true;
    _usingShinchiMode = false;
    // Restore thead if hidden by shinchi mode
    const theadSec = document.querySelector('.browse-table thead');
    if (theadSec) theadSec.style.display = '';

    // For ensaio + specific era, narrow to one section
    let activeSections = sectionKeys;
    if (_filters.type === 'ensaio' && _filters.era && ERA_TO_ENSAIO_SECTION[_filters.era]) {
      activeSections = [ERA_TO_ENSAIO_SECTION[_filters.era]];
    }
    _activeSectionKey = activeSections.length === 1 ? activeSections[0] : _filters.type;

    // Gather rows from relevant sections
    let rows = [];
    for (const secKey of activeSections) {
      const sec = _sectionTables[secKey];
      if (!sec) continue;
      for (const row of sec.rows) {
        rows.push({ ...row, _sectionKey: secKey, _sectionTitle: sec.title_pt || secKey });
      }
    }

    // Filter by search terms
    if (terms.length) {
      rows = rows.filter(row => {
        const hay = [row.title, row.source, row.date, row.notes, row.reference || row.collection || row.citation || ''].join(' ').toLowerCase();
        return terms.every(t => hay.includes(t));
      });
    }

    // Sort: default is original order (_sortCol === 'era' or 'original')
    if (_sortCol === 'title') {
      rows.sort((a, b) => {
        const va = (a.title||'').toLowerCase(), vb = (b.title||'').toLowerCase();
        return _sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    } else if (_sortCol === 'pub') {
      rows.sort((a, b) => {
        const va = (a.source||'').toLowerCase(), vb = (b.source||'').toLowerCase();
        if (!va && vb) return _sortAsc ? 1 : -1;
        if (va && !vb) return _sortAsc ? -1 : 1;
        const cmp = va.localeCompare(vb);
        return _sortAsc ? cmp : -cmp;
      });
    } else if (_filters.type === 'hikarinochie') {
      // Sort by thematic category number for 神智之光
      rows.sort((a, b) => {
        const ref_a = a.reference || a.collection || a.citation || '';
        const ref_b = b.reference || b.collection || b.citation || '';
        const ma = ref_a.match(/^(\d+)/), mb = ref_b.match(/^(\d+)/);
        const na = ma ? parseInt(ma[1]) : 999, nb = mb ? parseInt(mb[1]) : 999;
        return na - nb;
      });
    }
    // else: keep original legacy order (default)

    _filtered = rows;
    renderFilterBadges();
    renderTable();
    renderPagination();
    pushState();
    return;
  }

  // ─── Standard search index mode ──────────────────────────────
  _usingSectionData = false;
  _usingShinchiMode = false;
  _activeSectionKey = '';
  // Restore thead if hidden by shinchi mode
  const thead2 = document.querySelector('.browse-table thead');
  if (thead2) thead2.style.display = '';

  _filtered = _idx.filter(x => {
    if (_filters.type   && x._type   !== _filters.type)      return false;
    if (_filters.era    && x._era    !== _filters.era)        return false;
    if (_filters.letter && x._letter !== _filters.letter)     return false;
    if (_filters.pub) {
      const pubNames = _filters.pub.split('|||');
      const xPub = x.publication || '';
      if (!pubNames.some(p => xPub.startsWith(p))) return false;
    }
    if (terms.length) {
      const hay = [x.title, x.publication, x.url, x.category].join(' ').toLowerCase();
      if (!terms.every(t => hay.includes(t))) return false;
    }
    return true;
  });

  _filtered.sort((a, b) => {
    let va, vb;
    if (_sortCol === 'page') {
      va = parseInt((a.issue_page||'').replace(/\D/g,'')) || 9999;
      vb = parseInt((b.issue_page||'').replace(/\D/g,'')) || 9999;
      if (va === vb) { va = (a.title||'').toLowerCase(); vb = (b.title||'').toLowerCase(); }
      return _sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    } else if (_sortCol === 'title') {
      va = (a.title||'').toLowerCase();
      vb = (b.title||'').toLowerCase();
    } else if (_sortCol === 'pub') {
      const pa = (a.publication||'').toLowerCase();
      const pb = (b.publication||'').toLowerCase();
      if (!pa && pb) return _sortAsc ? 1 : -1;
      if (pa && !pb) return _sortAsc ? -1 : 1;
      va = pa; vb = pb;
      if (pa === pb) { va = (a.title||'').toLowerCase(); vb = (b.title||'').toLowerCase(); }
    } else {
      // Era sort: date → publication → issue number → title
      // (mirrors original planilha grouping)
      const dateA = a.date_iso || (a.year ? String(a.year) : '9999');
      const dateB = b.date_iso || (b.year ? String(b.year) : '9999');
      if (dateA !== dateB) {
        return _sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }
      const pubA = (a.publication || '').toLowerCase();
      const pubB = (b.publication || '').toLowerCase();
      if (pubA !== pubB) {
        return _sortAsc ? pubA.localeCompare(pubB) : pubB.localeCompare(pubA);
      }
      const issA = parseInt((a.issue_page||'').replace(/\D/g,'')) || 0;
      const issB = parseInt((b.issue_page||'').replace(/\D/g,'')) || 0;
      if (issA !== issB) return _sortAsc ? issA - issB : issB - issA;
      va = (a.title||'').toLowerCase();
      vb = (b.title||'').toLowerCase();
      return _sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
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
    const pubLabel = _filters.pub.includes('|||') ? pubDisplay(_filters.pub.split('|||')[0]) : pubDisplay(_filters.pub);
    badges.push(`<span class="browse-filter-badge browse-filter-badge--pub">${esc(pubLabel)} <span class="browse-filter-badge__remove" onclick="clearFilter('pub')">x</span></span>`);
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

  // Persist current filtered list to sessionStorage so reader.js can use it
  if (_filtered.length > 0) {
    try {
      sessionStorage.setItem('browse_list', JSON.stringify(_filtered.map(x => x.id)));
    } catch(e) { /* quota */ }
  }

  const total = _filtered.length;
  const start = _page * _perPage;
  const slice = _filtered.slice(start, start + _perPage);
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Publication header (shown when filtering by pub, compilation, or section)
  const pubHeader = document.getElementById('browsePublicationHeader');
  if (pubHeader) {
    const compInfo = _filters.type ? COMPILATION_INFO[_filters.type] : null;
    if (_filters.pub) {
      const pubHeaderLabel = _filters.pub.includes('|||') ? pubDisplay(_filters.pub.split('|||')[0]) : pubDisplay(_filters.pub);
      pubHeader.innerHTML = `<span class="browse-pub-back" onclick="clearFilter('pub')" title="Voltar para todos">‹</span> ${esc(pubHeaderLabel)}`;
      pubHeader.style.display = '';
    } else if (_usingSectionData && _sectionTables) {
      // Show section header with Japanese title
      const secKeys = _filters.type === 'ensaio' && _filters.era && ERA_TO_ENSAIO_SECTION[_filters.era]
        ? [ERA_TO_ENSAIO_SECTION[_filters.era]]
        : (TYPE_TO_SECTIONS[_filters.type] || []);
      const firstSec = secKeys.length ? _sectionTables[secKeys[0]] : null;
      if (firstSec) {
        const compInfoSec = COMPILATION_INFO[_filters.type];
        // Use compilation info titles when available (e.g. hikarinochie shows 神智之光, not 質問応答)
        const titleJa = compInfoSec?.title || firstSec.title_ja || '';
        const titlePt = compInfoSec?.subtitle || firstSec.title_pt || _filters.type;
        const imgHtml = compInfoSec?.img ? `<img class="comp-header-img" src="${compInfoSec.img}" alt="${esc(titleJa)}">` : '';
        const descHtml = compInfoSec?.desc ? `<div class="comp-header-desc">${esc(compInfoSec.desc)}</div>` : '';
        pubHeader.innerHTML = `
          <div class="comp-header">
            ${imgHtml}
            <div class="comp-header-text">
              <div class="comp-header-title">${esc(titleJa)}</div>
              <div class="comp-header-subtitle">${esc(titlePt)}</div>
              ${descHtml}
            </div>
          </div>`;
        pubHeader.style.display = '';
      } else {
        pubHeader.style.display = 'none';
      }
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

  // Update table headers based on data mode
  updateTableHeaders();

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

  // ─── Section Tables rendering (legacy order) ─────────────────
  if (_usingSectionData) {
    const isShinchi = _filters.type === 'hikarinochie';
    let lastCatNum = -1;

    el.innerHTML = slice.map((row, i) => {
      const num = start + i + 1;
      const hasLink = !!row.id;
      const sectionKey = row._sectionKey || _activeSectionKey;

      const href = hasLink
        ? `${READER}?id=${encodeURIComponent(row.id)}`
        : '#';

      const titleHl = hlText(row.title || '', terms);
      const source  = row.source ? esc(row.source) : (row.magazine ? esc(row.magazine) : '');
      const date    = row.date ? esc(row.date) : '';
      const notes   = row.notes || '';
      // 5th column varies: reference, collection, citation, or contributor
      const extra   = row.reference || row.collection || row.citation || row.contributor || '';

      // Category group header for 神智之光 thematic view
      let catHeader = '';
      if (isShinchi) {
        const catMatch = (extra || '').match(/^(\d+)/);
        const catNum = catMatch ? parseInt(catMatch[1]) : 0;
        if (catNum !== lastCatNum && catNum > 0) {
          lastCatNum = catNum;
          const cat = SHINCHI_CATEGORIES[catNum];
          if (cat) {
            catHeader = `<tr class="shinchi-cat-header">
              <td colspan="7">
                <span class="shinchi-cat-num">${catNum}</span>
                <span class="shinchi-cat-ja">${esc(cat.ja)}</span>
                <span class="shinchi-cat-pt">${esc(cat.pt)}</span>
              </td>
            </tr>`;
          }
        }
      }

      return `${catHeader}<tr class="${hasLink ? '' : 'no-link'}">
        <td class="col-num">${num}</td>
        <td class="col-title">
          <div class="td-title">${hasLink
            ? `<a href="${href}" data-reader="1">${titleHl}</a>`
            : `<span class="td-title-nolink">${titleHl}</span>`}
          </div>
        </td>
        <td class="col-pub td-pub">${hlText(source, terms)}</td>
        <td class="col-issue td-pub">${date}</td>
        <td class="col-era"><span class="td-era">${date ? date.split('.')[0] || '' : ''}</span></td>
        <td class="col-notes td-pub">${esc(extra)}${notes ? (extra ? ' — ' : '') + esc(notes) : ''}</td>
        <td class="col-read">
          ${hasLink ? `<a href="${href}" class="td-read-btn" data-reader="1" title="Ler">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>` : ''}
        </td>
      </tr>`;
    }).join('');
    return;
  }

  // Sonota entries use a different rendering
  const isSonota = slice.length > 0 && slice[0]._sonota;

  // Year separator state — only shown when sorted by era
  const showYearSep = _sortCol === 'era';
  let _lastSepYear = null;

  el.innerHTML = slice.map((x, i) => {
    const num  = start + i + 1;

    // ─── Year separator row ───────────────────────────────────
    let yearSepHtml = '';
    if (showYearSep && !x._sonota && x.year) {
      const rowYear = parseInt(x.year);
      if (!isNaN(rowYear) && rowYear !== _lastSepYear) {
        _lastSepYear = rowYear;
        const showa = rowYear - 1925;
        const showaLabel = showa > 0 ? `昭和${showa}年` : (showa === 0 ? '昭和元年' : '');
        yearSepHtml = `<tr class="year-sep-row">
          <td colspan="7">
            <span class="year-sep-greg">${rowYear}</span>
            ${showaLabel ? `<span class="year-sep-showa">${showaLabel}</span>` : ''}
          </td>
        </tr>`;
      }
    }

    if (x._sonota) {
      const href = x.id && x.part_file
        ? `${READER}?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file)}`
        : '#';
      const titleJa = hlText(x.title || '', terms);
      const titlePt = x.title_pt ? `<div class="td-title-pt">${hlText(x.title_pt, terms)}</div>` : '';
      const pub = x.publication ? esc(x.publication) : '';
      const date = x.issue_page ? esc(x.issue_page) : '';
      const author = x.author ? esc(x.author) : '';
      const hasLink = x.id && x.part_file;

      return `<tr>
        <td class="col-num">${num}</td>
        <td class="col-title">
          <div class="td-title">${hasLink
            ? `<a href="${href}" data-reader="1">${titleJa}</a>`
            : `<span class="td-title-nolink">${titleJa}</span>`}
          </div>
          ${titlePt}
        </td>
        <td class="col-pub td-pub">${pub}</td>
        <td class="col-issue td-pub">${date}</td>
        <td class="col-era"><span class="td-era">${author}</span></td>
        <td class="col-notes td-pub"></td>
        <td class="col-read">
          ${hasLink ? `<a href="${href}" class="td-read-btn" data-reader="1" title="Ler">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>` : ''}
        </td>
      </tr>`;
    }

    const ct   = CONTENT_TYPES.find(t => t.id === x._type) || CONTENT_TYPES[CONTENT_TYPES.length-1];
    const href = x.part_file
      ? `${READER}?id=${encodeURIComponent(x.id)}&part=${encodeURIComponent(x.part_file)}`
      : `${READER}?cat=${encodeURIComponent(x.category||'')}`;
    let eraLabel = '&mdash;';
    if (x.date_iso) {
      try {
        const parts = x.date_iso.split('-');
        const y = parseInt(parts[0]);
        if (!isNaN(y)) {
          eraLabel = `S${y - 1925}`;
          const m = parseInt(parts[1]);
          if (!isNaN(m)) eraLabel += `.${m}`;
          const d = parseInt(parts[2]);
          if (!isNaN(d)) eraLabel += `.${d}`;
        }
      } catch(e) {}
    }
    if (eraLabel === '&mdash;' && x.year) {
      eraLabel = `S${x.year - 1925}`;
    }
    const titleHl     = hlText(x.title || '', terms);
    const pubName     = x.publication ? String(x.publication) : '';
    const pubUrl      = pubBookUrl(pubName);
    const pubLabel    = pubName ? hlText(pubDisplay(pubName).substring(0, 60), terms) : '';
    const pub         = pubName
      ? `<a class="td-pub-link" href="${pubUrl}" data-reader="1" title="Abrir em modo livro">${pubLabel}</a>`
      : '';
    const issue       = x.issue_page  ? esc(String(x.issue_page).substring(0,20)) : '';
    const relCount    = x.related ? x.related.length : 0;
    const unpubBadge  = x.unpublished ? `<span class="td-unpublished">inedito</span>` : '';

    return `${yearSepHtml}<tr class="${x.unpublished?'unpublished':''}">
      <td class="col-num">${num}</td>
      <td class="col-title">
        <span class="content-type-badge ${ct.css}">${ct.label}</span>
        <div class="td-title"><a href="${href}" data-reader="1">
          ${titleHl}${unpubBadge}
        </a></div>
      </td>
      <td class="col-pub td-pub">${pub}</td>
      <td class="col-issue td-pub">${issue}</td>
      <td class="col-era">${x.year
        ? `<a class="td-era td-era-link" href="timeline.html#year-${x.year}__${encodeURIComponent(x.id)}" title="Ver na Timeline">${eraLabel}</a>`
        : `<span class="td-era">${eraLabel}</span>`
      }</td>
      <td class="col-notes td-pub">${tagSnippet(x)}</td>
      <td class="col-read">
        <a href="${href}" class="td-read-btn" data-reader="1" title="Ler">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </td>
    </tr>`;
  }).join('');
}

// ─── 神智之光 Thematic Index Renderer ─────────────────────────
let _shinchiOpenCat = null;  // which category is expanded (null = show 総目次)

function renderShinchiIndex(terms) {
  const el    = document.getElementById('browseTableBody');
  const meta  = document.getElementById('browseMeta');
  const pubHeader = document.getElementById('browsePublicationHeader');

  // Show header
  if (pubHeader) {
    const comp = COMPILATION_INFO['hikarinochie'];
    const imgHtml = comp?.img ? `<img class="comp-header-img" src="${comp.img}" alt="${esc(comp.title)}">` : '';
    pubHeader.innerHTML = `
      <div class="comp-header">
        ${imgHtml}
        <div class="comp-header-text">
          <div class="comp-header-title">${esc(comp?.title || '神智之光')}</div>
          <div class="comp-header-subtitle">${esc(comp?.subtitle || '')}</div>
          <div class="comp-header-desc">${esc(comp?.desc || '')}</div>
        </div>
      </div>`;
    pubHeader.style.display = '';
  }

  // Hide normal table headers
  const thead = document.querySelector('.browse-table thead');
  if (thead) thead.style.display = 'none';

  // If searching, show flat results across all categories
  if (terms.length) {
    renderShinchiSearch(el, meta, terms);
    return;
  }

  // If a category is expanded, show detail view
  if (_shinchiOpenCat !== null && _shinchiIndex[_shinchiOpenCat]) {
    renderShinchiDetail(el, meta, _shinchiOpenCat);
    return;
  }

  // ─── 総目次 (General Table of Contents) ───────────────────────
  const catNums = Object.keys(_shinchiIndex).sort((a, b) => parseInt(a) - parseInt(b));

  let html = `<tr class="shinchi-toc-title"><td colspan="7">
    <div class="shinchi-toc-header">総　目　次</div>
    <div class="shinchi-toc-sub-row">
      <span>篇ごとの項目一覧へ</span>
      <span>分野別直接本文へ</span>
    </div>
  </td></tr>`;

  for (const catNum of catNums) {
    const cat = _shinchiIndex[catNum];
    html += `<tr class="shinchi-toc-row" onclick="openShinchiCat('${catNum}')">
      <td class="shinchi-toc-num">${catNum}</td>
      <td class="shinchi-toc-name">
        <a href="#" onclick="event.preventDefault();openShinchiCat('${catNum}')">${esc(cat.cat_title_ja)}</a>
      </td>
      <td class="shinchi-toc-keywords" colspan="5">${
        cat.sub_categories.map((sub, i) => {
          const label = sub.label_ja || sub.title_pt;
          return `<a href="#" class="shinchi-kw-link" onclick="event.preventDefault();event.stopPropagation();openShinchiCat('${catNum}','${i}')">${esc(label)}</a>`;
        }).join('、')
      }</td>
    </tr>`;
  }

  if (meta) {
    meta.innerHTML = `総目次 — <strong>50</strong> 篇、約 <strong>5,000</strong> 問答`;
  }
  el.innerHTML = html;
}

// Open a specific category detail, optionally scroll to sub-category index
window.openShinchiCat = function(catNum, subIdx) {
  _shinchiOpenCat = catNum;
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  renderShinchiIndex(terms);
  if (subIdx !== undefined && subIdx !== null) {
    // Scroll to the specific sub-category label
    const labels = document.querySelectorAll('.shinchi-detail-label');
    const target = labels[parseInt(subIdx)];
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      target.classList.add('shinchi-label-highlight');
      setTimeout(() => target.classList.remove('shinchi-label-highlight'), 2000);
      return;
    }
  }
  document.querySelector('.browse-table')?.scrollIntoView({ behavior: 'instant', block: 'start' });
};

// Back to 総目次
window.backToShinchiToc = function() {
  _shinchiOpenCat = null;
  const terms = _filters.search.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  renderShinchiIndex(terms);
  document.querySelector('.browse-table')?.scrollIntoView({ behavior: 'instant', block: 'start' });
};

// ─── Detail view for a single category ──────────────────────
function renderShinchiDetail(el, meta, catNum) {
  const cat = _shinchiIndex[catNum];
  if (!cat) return;

  const catInt = parseInt(catNum);
  const catInfo = SHINCHI_CATEGORIES[catInt];
  const prevCat = catInt > 1 ? String(catInt - 1) : null;
  const nextCat = catInt < 50 ? String(catInt + 1) : null;

  let html = '';

  // Navigation bar
  html += `<tr class="shinchi-detail-nav"><td colspan="7">
    <a href="#" onclick="event.preventDefault();backToShinchiToc()" class="shinchi-back">← 総目次</a>
    <span class="shinchi-nav-arrows">
      ${prevCat ? `<a href="#" onclick="event.preventDefault();openShinchiCat('${prevCat}')" title="${_shinchiIndex[prevCat]?.cat_title_ja || ''}">‹ 前</a>` : '<span class="shinchi-nav-disabled">‹ 前</span>'}
      <span class="shinchi-nav-sep">|</span>
      ${nextCat ? `<a href="#" onclick="event.preventDefault();openShinchiCat('${nextCat}')" title="${_shinchiIndex[nextCat]?.cat_title_ja || ''}">次 ›</a>` : '<span class="shinchi-nav-disabled">次 ›</span>'}
    </span>
  </td></tr>`;

  // Category title
  html += `<tr class="shinchi-detail-title"><td colspan="7">
    <div class="shinchi-detail-title-text">
      <strong>神智之光　　Ｎｏ.${catNum}</strong>
    </div>
    <div class="shinchi-detail-section">
      <strong>${esc(cat.cat_title_ja)}</strong>　${
        cat.sub_categories.map((sub, i) => {
          const label = sub.label_ja || sub.title_pt;
          return `<a href="#shinchi-sub-${catNum}-${i}" class="shinchi-kw-link" onclick="event.preventDefault();document.getElementById('shinchi-sub-${catNum}-${i}')?.scrollIntoView({behavior:'smooth',block:'center'})">${esc(label)}</a>`;
        }).join('、')
      }
    </div>
  </td></tr>`;

  // Table header
  html += `<tr class="shinchi-detail-thead">
    <td class="shinchi-detail-th-label"></td>
    <td class="shinchi-detail-th-topic">お伺い事項</td>
    <td class="shinchi-detail-th-date" colspan="5">備考</td>
  </tr>`;

  // Sub-categories with topics
  cat.sub_categories.forEach((sub, subIdx) => {
    const hasLink = !!sub.id;
    const href = hasLink
      ? `${READER}?id=${encodeURIComponent(sub.id)}&mode=list&list=situmon`
      : '#';

    let isFirst = true;
    for (const topic of sub.topics) {
      html += `<tr class="shinchi-detail-row${isFirst ? ' shinchi-detail-row-first' : ''}">`;

      if (isFirst) {
        // Sub-category label (short JP keyword as green link) in first column
        const label = sub.label_ja || sub.title_pt;
        html += `<td class="shinchi-detail-label" id="shinchi-sub-${catNum}-${subIdx}" rowspan="${sub.topics.length}">
          ${hasLink
            ? `<a href="${href}" class="shinchi-label-link">${esc(label)}</a>`
            : `<span class="shinchi-label-nolink">${esc(label)}</span>`}
        </td>`;
        isFirst = false;
      }

      html += `<td class="shinchi-detail-topic">${esc(topic.topic_ja)}</td>
        <td class="shinchi-detail-date" colspan="5">${esc(topic.date)}</td>
      </tr>`;
    }
  });

  // Bottom navigation
  html += `<tr class="shinchi-detail-nav"><td colspan="7">
    <a href="#" onclick="event.preventDefault();backToShinchiToc()" class="shinchi-back">← 総目次</a>
    <span class="shinchi-nav-arrows">
      ${prevCat ? `<a href="#" onclick="event.preventDefault();openShinchiCat('${prevCat}')">‹ 前</a>` : ''}
      <span class="shinchi-nav-sep">|</span>
      ${nextCat ? `<a href="#" onclick="event.preventDefault();openShinchiCat('${nextCat}')">次 ›</a>` : ''}
    </span>
  </td></tr>`;

  const totalTopics = cat.sub_categories.reduce((sum, s) => sum + s.topics.length, 0);
  if (meta) {
    meta.innerHTML = `No.${catNum} <strong>${esc(cat.cat_title_ja)}</strong> — ${totalTopics} tópicos`;
  }
  el.innerHTML = html;
}

// ─── Search across all shinchi categories ───────────────────
function renderShinchiSearch(el, meta, terms) {
  const catNums = Object.keys(_shinchiIndex).sort((a, b) => parseInt(a) - parseInt(b));
  let html = '';
  let totalMatches = 0;

  for (const catNum of catNums) {
    const cat = _shinchiIndex[catNum];
    let catHasMatch = false;

    for (const sub of cat.sub_categories) {
      const matchingTopics = sub.topics.filter(t => {
        const hay = [t.topic_ja, sub.title_pt, cat.cat_title_ja, cat.cat_keywords].join(' ').toLowerCase();
        return terms.every(term => hay.includes(term));
      });
      if (matchingTopics.length === 0) continue;

      if (!catHasMatch) {
        html += `<tr class="shinchi-cat-header" onclick="openShinchiCat('${catNum}')" style="cursor:pointer">
          <td colspan="7">
            <span class="shinchi-cat-num">${catNum}</span>
            <span class="shinchi-cat-ja">${esc(cat.cat_title_ja)}</span>
          </td>
        </tr>`;
        catHasMatch = true;
      }

      const hasLink = !!sub.id;
      const href = hasLink ? `${READER}?id=${encodeURIComponent(sub.id)}&mode=list&list=situmon` : '#';

      for (const topic of matchingTopics) {
        totalMatches++;
        html += `<tr class="shinchi-detail-row">
          <td class="shinchi-detail-label">
            ${hasLink ? `<a href="${href}" class="shinchi-label-link">${hlText(sub.title_pt, terms)}</a>` : esc(sub.title_pt)}
          </td>
          <td class="shinchi-detail-topic">${hlText(topic.topic_ja, terms)}</td>
          <td class="shinchi-detail-date" colspan="5">${esc(topic.date)}</td>
        </tr>`;
      }
    }
  }

  if (meta) {
    meta.innerHTML = `<strong>${totalMatches}</strong> resultado${totalMatches !== 1 ? 's' : ''} encontrado${totalMatches !== 1 ? 's' : ''}`;
  }
  el.innerHTML = html || `<tr><td colspan="7"><div class="browse-empty"><h3>Nenhum resultado</h3></div></td></tr>`;
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

// ─── Update table headers based on data mode ─────────────────
function updateTableHeaders() {
  const thead = document.querySelector('.browse-table thead tr');
  if (!thead) return;

  if (_usingSectionData) {
    // Legacy columns: # | Título | Fonte | Data | Era | Referência | Ler
    thead.innerHTML = `
      <th class="col-num">#</th>
      <th class="col-title sortable" data-col="title" onclick="setSort('title')">Título</th>
      <th class="col-pub sortable" data-col="pub" onclick="setSort('pub')">Fonte</th>
      <th class="col-issue">Data</th>
      <th class="col-era">Era</th>
      <th class="col-notes">Referência</th>
      <th class="col-read">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </th>`;
    // Re-apply sort indicator
    thead.querySelectorAll('.sortable').forEach(th => {
      if (th.dataset.col === _sortCol) th.classList.add(_sortAsc ? 'sort-asc' : 'sort-desc');
    });
  } else {
    // Standard columns: # | Título | Publicação | Edição | Era | Notas | Ler
    thead.innerHTML = `
      <th class="col-num">#</th>
      <th class="col-title sortable" data-col="title" onclick="setSort('title')">Título</th>
      <th class="col-pub sortable" data-col="pub" onclick="setSort('pub')">Publicação</th>
      <th class="col-issue sortable" data-col="page" onclick="setSort('page')">Edição</th>
      <th class="col-era sortable" data-col="era" onclick="setSort('era')">Era</th>
      <th class="col-notes">Notas</th>
      <th class="col-read">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </th>`;
    thead.querySelectorAll('.sortable').forEach(th => {
      if (th.dataset.col === _sortCol) th.classList.add(_sortAsc ? 'sort-asc' : 'sort-desc');
    });
  }
}

// ─── Shared: save browse context before navigating ────────────
function saveBrowseContext() {
  sessionStorage.setItem('browse_override', '1');
  sessionStorage.setItem('browse_return', window.location.href);
  sessionStorage.setItem('browse_scroll', String(window.scrollY));
}

// Restore scroll position when returning from reader (direct navigation fallback)
(function restoreBrowseScroll() {
  const saved = sessionStorage.getItem('browse_scroll');
  if (saved) {
    const y = parseInt(saved);
    if (!isNaN(y) && y > 0) {
      // Wait for table to render, then scroll
      const check = setInterval(() => {
        const rows = document.querySelectorAll('#browseTableBody tr');
        if (rows.length > 0) {
          clearInterval(check);
          window.scrollTo(0, y);
          sessionStorage.removeItem('browse_scroll');
        }
      }, 100);
      // Fallback: clear after 5s
      setTimeout(() => { clearInterval(check); sessionStorage.removeItem('browse_scroll'); }, 5000);
    }
  }
})();

// ─── Reader Modal (centered overlay) ──────────────────────────
function openReaderModal(url) {
  saveBrowseContext();

  let modal = document.getElementById('readerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'readerModal';
    modal.className = 'reader-modal';
    modal.innerHTML = `
      <div class="reader-modal-container">
        <button class="reader-modal-close" onclick="closeReaderModal()" title="Fechar (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <iframe id="readerFrame" class="reader-modal-frame" src="" allowfullscreen></iframe>
      </div>`;
    document.body.appendChild(modal);

    // Click on backdrop (outside container) closes
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeReaderModal();
    });

    // ESC key closes modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeReaderModal();
    });

    // "Voltar" button inside iframe sends this message
    window.addEventListener('message', function(e) {
      if (e.data === 'close-reader') closeReaderModal();
    });
  }

  const frame = document.getElementById('readerFrame');
  frame.src = url;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  history.pushState({ readerModal: url }, '', url);
}

function closeReaderModal() {
  const modal = document.getElementById('readerModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const browseUrl = sessionStorage.getItem('browse_return') || 'browse.html';
  history.replaceState({}, '', browseUrl);
  setTimeout(() => {
    const frame = document.getElementById('readerFrame');
    if (frame) frame.src = '';
  }, 300);
}

window.addEventListener('popstate', function() {
  const modal = document.getElementById('readerModal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { const f = document.getElementById('readerFrame'); if (f) f.src = ''; }, 300);
  }
});

// ─── Event delegation: intercept all reader link clicks ───────
document.addEventListener('click', function(e) {
  const link = e.target.closest('a[data-reader]');
  if (!link) return;
  // Allow Cmd+click / Ctrl+click to open in new tab
  if (e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  openReaderModal(link.href);
});

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

// Debug access
window._browseDebug = () => ({
  sectionTables: _sectionTables ? Object.keys(_sectionTables) : null,
  usingSectionData: _usingSectionData,
  activeSectionKey: _activeSectionKey,
  filterType: _filters.type,
  typeCounts: { ..._typeCounts },
  filteredLen: _filtered.length,
});

function showLoading() {
  const el = document.getElementById('browseTableBody');
  if (el) el.innerHTML = `<tr><td colspan="7"><div class="browse-loading">
    <div class="reader-loading__spinner"></div>
    <span>Carregando indice...</span>
  </div></td></tr>`;
}

// ─── Sync toolbar height so sticky thead is never obscured ───
function syncToolbarHeight() {
  const toolbar = document.querySelector('.browse-toolbar');
  if (!toolbar) return;
  document.documentElement.style.setProperty(
    '--toolbar-height', toolbar.getBoundingClientRect().height + 'px'
  );
}

// ─── Main search + per-page binding ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  syncToolbarHeight();
  const ro = new ResizeObserver(syncToolbarHeight);
  const toolbar = document.querySelector('.browse-toolbar');
  if (toolbar) ro.observe(toolbar);

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
