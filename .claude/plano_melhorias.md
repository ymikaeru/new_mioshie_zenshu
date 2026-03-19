# Plano de Melhorias — Mioshie Zenshu Modern

## Contexto

O botão "Ler Ensinamentos" na Biblioteca (`library.html`) atualmente leva a um único
ensinamento ou faz uma busca genérica. Deveria levar ao `browse.html` mostrando **todos
os ensinamentos** daquela publicação. Além disso, faltam páginas planejadas no CLAUDE.md.

---

## TAREFA 1 — Corrigir "Ler Ensinamentos" (library.js + browse.js)

### 1.1 — Adicionar filtro `pub` ao browse.js

**Arquivo:** `js/browse.js`

**A) Adicionar `pub` ao state de filtros (linha 77):**

Mudar:
```js
const _filters = { type: '', era: '', letter: '', search: '' };
```
Para:
```js
const _filters = { type: '', era: '', letter: '', search: '', pub: '' };
```

**B) Ler param `pub` da URL em `readUrlParams()` (após linha 130):**

Adicionar:
```js
_filters.pub = p.get('pub') || '';
```

**C) Incluir `pub` no `pushState()` (após linha 144):**

Adicionar:
```js
if (_filters.pub) p.set('pub', _filters.pub);
```

**D) Filtrar por `pub` em `applyFilters()` (dentro do `_idx.filter`, após linha 265):**

Adicionar antes do filtro de `terms`:
```js
if (_filters.pub && x.publication !== _filters.pub) return false;
```

**E) Mostrar badge do filtro pub em `renderFilterBadges()` (após linha 322, antes do bloco de search):**

Adicionar:
```js
if (_filters.pub) {
  badges.push(`<span class="browse-filter-badge">${esc(_filters.pub)} <span class="browse-filter-badge__remove" onclick="clearFilter('pub')">x</span></span>`);
}
```

**F) Incluir `pub` no `clearAllFilters()` — já funciona porque itera `Object.keys(_filters)`.**

**G) Mostrar header contextual quando filtro pub está ativo.**

No topo do `renderTable()`, logo após o bloco `if (meta)` (linha 342), adicionar:
```js
const pubHeader = document.getElementById('browsePublicationHeader');
if (pubHeader) {
  if (_filters.pub) {
    pubHeader.textContent = _filters.pub;
    pubHeader.style.display = '';
  } else {
    pubHeader.style.display = 'none';
  }
}
```

### 1.2 — Adicionar elemento de header no browse.html

**Arquivo:** `browse.html`

Encontrar a div `id="activeBadges"` e adicionar ANTES dela:
```html
<h2 id="browsePublicationHeader" class="browse-pub-header" style="display:none"></h2>
```

### 1.3 — CSS para o header de publicação

**Arquivo:** `css/browse.css`

Adicionar:
```css
.browse-pub-header {
  font-family: var(--font-content, 'Crimson Pro', serif);
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  color: var(--accent, #B8860B);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}
```

### 1.4 — Mudar destino do botão "Ler Ensinamentos" no modal da Library

**Arquivo:** `js/library.js`

**A) Botão principal do modal (linhas 383-400).**

Substituir todo o bloco:
```js
// Reader action — link to reader.html by exact ID (if available), fallback to search
let actionBtn = '';
let targetUrl = '';

const origMatch = pub.original_link?.match(/id=([^&]+)/);
if (origMatch && origMatch[1]) {
  targetUrl = `reader.html?id=${encodeURIComponent(origMatch[1])}`;
} else {
  const searchTitle = pub.title_ja || pub.title_pt || '';
  if (searchTitle) targetUrl = `browse.html?q=${encodeURIComponent(searchTitle)}`;
}

if (targetUrl) {
  actionBtn = `<a class="btn-primary" href="${targetUrl}">
    <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    <span class="lang-pt">Ler Ensinamentos</span>
  </a>`;
}
```

Por:
```js
// Reader action — link to browse.html filtered by publication
let actionBtn = '';
const pubSearchName = findPublicationSearchName(pub);
if (pubSearchName) {
  const targetUrl = `browse.html?pub=${encodeURIComponent(pubSearchName)}`;
  actionBtn = `<a class="btn-primary" href="${targetUrl}">
    <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    <span class="lang-pt">Ler Ensinamentos</span>
  </a>`;
}
```

**B) Botão por edição em `renderEditionsTable()` (linhas ~515-535).**

Substituir a lógica do `readLink` por:
```js
let readLink = '';
const pubSearchName = findPublicationSearchName(pub);
if (pubSearchName) {
  const targetUrl = `browse.html?pub=${encodeURIComponent(pubSearchName)}`;
  readLink = `
    <div class="ed-card__actions">
      <a class="btn-primary btn-primary--sm" href="${targetUrl}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        Ler Ensinamentos
      </a>
    </div>`;
}
```

### 1.5 — Criar função auxiliar `findPublicationSearchName()`

**Arquivo:** `js/library.js` — adicionar no topo do arquivo, após as helpers existentes.

Esta função mapeia uma publicação da biblioteca para o valor `publication` usado
no search index. O mapeamento é necessário porque os nomes não coincidem diretamente.

```js
/**
 * Mapa de id de publicação → valor de 'publication' no search index.
 * Construído manualmente a partir da análise de dados.
 * Cobre as publicações que têm ensinamentos no índice.
 */
const PUB_TO_INDEX_MAP = {
  // ─── Revistas / Periódicos ───
  'hakkousi_shinbun':    ['Eikou', 'Hikari', 'Kyusei'],
  'hakkousi_miosiesy':   ['Mioshie-shu'],
  'hakkousi_tijou':      ['Chijo Tengoku'],
  'hakkousi_ohikari':    ['御Hikari話録', '御Hikari話録（補）', 'Gokowa'],
  'hakkousi_gosuiji':    ['Gosuiiji録'],
  'hakkousi_sinkozat':   ['Conversas sobre Fé'],
  'hakkousi_seiten':     ['Kyusei'],

  // ─── Livros / Sasshi ───
  'sasshi_kannon':       ['Kannon Koza'],
  'sasshi_kakumei':      ['結核の革命的療法', 'Igaku Kakumei no Sho'],
  'sasshi_syotai':       ['A Verdadeira Natureza da Tuberculose'],
  'sasshi_dekiru':       ['Chijo Tengoku'],
  'sasshi_hayawaka':     ['Kyusei'],
  'sasshi_kyogi1':       ['Kyusei'],
  'sasshi_kyogi2':       ['Chijo Tengoku'],
  'sasshi_kiseki':       ['Kyusei'],
  'sasshi_myoniti0':     ['Asu no Ijutsu', 'Asu no Ijutsu・新日本医術としての岡田式療病法'],
  'sasshi_myoniti3':     ['Asu no Ijutsu', 'Asu no Ijutsu 第一編', 'Asu no Ijutsu（初版）第一編', 'Asu no Ijutsu（再版）第一編'],
  'sasshi_myoniti4':     ['Asu no Ijutsu', 'Asu no Ijutsu 第二編', 'Asu no Ijutsu（初版）第二編', 'Asu no Ijutsu（再版）第二編'],
  'sasshi_myoniti7':     ['Asu no Ijutsu', 'Asu no Ijutsu 第三編'],
  'sasshi_sinkozat':     ['Conversas sobre Fé'],
  'sasshi_kaiketu1':     ['Terapia da Fé para Tuberculose', 'Tuberculose e Terapia Espiritual'],
  'sasshi_kaiketu2':     ['Terapia da Fé para Tuberculose', 'Tuberculose e Terapia Espiritual'],
  'sasshi_sinnihon':     ['Nova Arte Médica Japonesa'],
  'sasshi_sizen01':      ['Shizen Noho Kaisetsu', 'Shizen Noho'],
  'sasshi_sizen02':      ['Shizen Noho Kaisetsu', 'Shizen Noho', '革命的増産のShizen Noho Kaisetsu'],
  'sasshi_okadasen':     ['岡田先生療病術講義録'],
  'sasshi_nihon':        ['Registro de Aulas de Medicina Japonesa'],
  'sasshi_oshieno':      ['Hikari'],
  'sasshi_jikan1':       ['Coletânea de Sermões de Jikan', 'Conversas de Jikan'],
  'sasshi_jikan2':       ['Coletânea de Sermões de Jikan', 'Conversas de Jikan'],
  'sasshi_byohin':       ['病貧争絶無の世界を造る観音運動とは何？'],
  'sasshi_bunmei':       ['Bunmei no Sozo'],

  // ─── Séries / Volumes ───
  'sasshi_sosyo01':      ['Método de Cultivo sem Fertilizantes'],
  'sasshi_sosyo02':      ['O Problema da Tuberculose e sua Solução'],
  'sasshi_sosyo03':      ['Reikai Sodan'],
  'sasshi_sosyo04':      ['Kiseki Monogatari'],
  'sasshi_sosyo09':      ['Hikari'],
  'sasshi_sosyo10':      ['Kenko'],
  'sasshi_sosyo11':      ['O Problema da Tuberculose e sua Solução'],

  // ─── Kanren ───
  'kanren_igakukan':     ['医学関係Goronbun集', 'Igaku Kakumei no Sho'],
  'kanren_kouwa1':       ['Hikari'],
  'kanren_tengoku':      ['Chijo Tengoku'],

  // ─── Hakkousi diversos ───
  'hakkousi_johrei':     ['浄霊法講座'],
  'hakkousi_kaiho':      ['Boletim (Kaiho)'],
  'hakkousi_hokekyo':    ['天国の福音'],

  // ─── Volumes especiais ───
  'vol_89':              ['Eikou'],
  'vol_90':              ['Hikari'],
  'vol_91':              ['Hikari'],
  'vol_92':              ['Kyusei'],
  'vol_93':              ['Kenko'],
  'vol_98':              ['Toho no Hikari'],
};

/**
 * Encontra o(s) valor(es) de publication no search index para uma publicação da biblioteca.
 * Retorna o primeiro valor encontrado, ou null se não houver mapeamento.
 */
function findPublicationSearchName(pub) {
  if (!pub) return null;

  const mapped = PUB_TO_INDEX_MAP[pub.id];
  if (mapped && mapped.length > 0) return mapped[0];

  // Fallback: tentar title_pt ou title_ja como busca textual
  return null;
}
```

**NOTA IMPORTANTE:** O mapa `PUB_TO_INDEX_MAP` acima cobre os casos principais mas
precisa ser **validado e completado** comparando `publications_enriched.json` com
`advanced_search_index.json`. Para publicações com múltiplos valores (ex: `hakkousi_shinbun`
mapeia para Eikou, Hikari e Kyusei), o botão usa o primeiro valor. Idealmente,
publicações com múltiplos periódicos deveriam ter um dropdown ou ir para browse
com busca textual.

### 1.6 — Fallback para publicações sem mapeamento

Para publicações que não estão no `PUB_TO_INDEX_MAP`, o botão "Ler Ensinamentos"
**não deve aparecer** (melhor que levar a lugar errado). Isso já acontece naturalmente
pois `findPublicationSearchName()` retorna null e o `if (pubSearchName)` impede a
renderização do botão.

Opcionalmente, adicionar um fallback com busca textual:
```js
function findPublicationSearchName(pub) {
  if (!pub) return null;
  const mapped = PUB_TO_INDEX_MAP[pub.id];
  if (mapped && mapped.length > 0) return mapped[0];
  // Fallback: busca textual (menos preciso, mas melhor que nada)
  // Retorna null para ir para browse.html?q= como busca
  return null;
}
```

E no modal, adicionar fallback de busca genérica quando não há mapeamento:
```js
if (pubSearchName) {
  const targetUrl = `browse.html?pub=${encodeURIComponent(pubSearchName)}`;
  actionBtn = `...`;
} else {
  // Fallback: busca textual no browse
  const searchTitle = pub.title_ja || pub.title_pt || '';
  if (searchTitle) {
    const targetUrl = `browse.html?q=${encodeURIComponent(searchTitle)}`;
    actionBtn = `<a class="btn-primary btn-primary--outline" href="${targetUrl}">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span class="lang-pt">Buscar Ensinamentos</span>
    </a>`;
  }
}
```

### 1.7 — Publicações com múltiplos periódicos

Algumas publicações (como `hakkousi_shinbun`) mapeiam para múltiplos periódicos
(Eikou, Hikari, Kyusei). Para esses casos, **renderizar múltiplos botões**:

No modal, substituir o bloco do actionBtn por:
```js
const pubNames = PUB_TO_INDEX_MAP[pub.id];
if (pubNames && pubNames.length > 1) {
  actionBtn = pubNames.map(name => `
    <a class="btn-primary btn-primary--sm" href="browse.html?pub=${encodeURIComponent(name)}">
      <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      ${escHtml(name)}
    </a>
  `).join('');
} else if (pubNames && pubNames.length === 1) {
  // botão único normal...
}
```

---

## TAREFA 2 — Completar search.html ou unificar com browse.html

### Situação atual
- `search.html` tem UI mas sem JS funcional próprio
- `browse.html` já faz busca textual funcional

### Opção A — Redirecionar search.html para browse.html (RECOMENDADO)
```html
<!-- search.html -->
<meta http-equiv="refresh" content="0; url=browse.html">
<script>window.location.replace('browse.html' + window.location.search);</script>
```

### Opção B — Busca full-text dedicada
Manter search.html como busca nos conteúdos completos dos ensinamentos
(não só no índice). Isso requer carregar os 108MB de JSON dos teachings,
o que é impraticável no browser. Precisaria de um search index pré-construído
mais leve (ex: lunr.js index).

**Decisão necessária do usuário.**

---

## TAREFA 3 — Criar página Johrei (johrei.html)

### Dados disponíveis
- `data/johrei/johrei_chapters_extracted.json` — ~50 capítulos
- Schema: `{ id, title, content_ptbr, content_snippet, category, publication, tags }`

### Implementação
Seguir o padrão do `kannon.html`:
1. Sidebar com navegação por capítulos
2. Conteúdo bilíngue PT/JP
3. Mesmos controles de fonte/tema do reader
4. Link no index.html e na navegação principal

**Arquivos a criar/editar:**
- Criar: `johrei.html`
- Criar: `js/johrei.js` (baseado em kannon.html)
- Criar: `css/johrei.css` (pode reutilizar reader.css)
- Editar: `index.html` — adicionar card do Johrei
- Editar: navegação global (se houver nav compartilhado)

---

## TAREFA 4 — Criar Timeline Interativa (timeline.html)

### Dados disponíveis
- `data/search/advanced_search_index.json` — 4.918 registros com campo `year`
- Distribuição: S5 (1930) até S30 (1955), + "sem data" e "inéditos"

### Design proposto
1. Timeline vertical com marcadores por ano Showa
2. Cada ano mostra contagem de ensinamentos e publicações principais
3. Clicar num ano expande mostrando lista de ensinamentos
4. Filtros: por tipo de conteúdo, por publicação
5. Responsivo: horizontal no desktop, vertical no mobile

### Arquivos a criar:
- `timeline.html`
- `js/timeline.js`
- `css/timeline.css`

### Dados por ano (do search index):
| Era | Ano | Aprox. registros |
|-----|-----|-----------------|
| S5-S16 | 1930-1941 | ~200 |
| S17-18 | 1942-43 | ~150 |
| S22-23 | 1947-48 | ~500 |
| S24 | 1949 | ~400 |
| S25 | 1950 | ~600 |
| S26 | 1951 | ~700 |
| S27 | 1952 | ~800 |
| S28 | 1953 | ~600 |
| S29-30 | 1954-55 | ~400 |
| Sem data | - | ~300 |
| Inédito | - | ~200 |

---

## TAREFA 5 — Melhorias gerais de qualidade

### 5.1 — Validar e completar PUB_TO_INDEX_MAP
Rodar script Python para comparar todas as 102 publicações com os 287 valores
únicos de `publication` no search index. Gerar mapa completo.

**Script para gerar o mapa:**
```python
import json

with open('data/publications_enriched.json') as f:
    pubs = json.load(f)
with open('data/search/advanced_search_index.json') as f:
    idx = json.load(f)

idx_pubs = {}
for x in idx:
    p = x.get('publication', '')
    if p:
        idx_pubs.setdefault(p, []).append(x['id'])

# Para cada publicação, buscar correspondências
for pub in pubs:
    title_pt = (pub.get('title_pt') or '').strip()
    title_ja = (pub.get('title_ja') or '').strip()
    pid = pub.get('id', '')

    matches = []
    for ipub, ids in idx_pubs.items():
        if title_pt and title_pt == ipub:
            matches.append((ipub, len(ids)))
        elif title_ja and (title_ja in ipub or ipub in title_ja):
            matches.append((ipub, len(ids)))

    if matches:
        matches.sort(key=lambda x: -x[1])
        vals = [m[0] for m in matches]
        print(f"  '{pid}': {vals},")
```

### 5.2 — Atualizar Service Worker
Adicionar novas páginas (johrei.html, timeline.html) ao cache do SW.

### 5.3 — Atualizar navegação global
Garantir que todas as páginas estejam acessíveis pela navegação principal.

---

## Ordem de Execução Recomendada

1. **Tarefa 1** — Corrigir "Ler Ensinamentos" (impacto imediato, bug principal)
2. **Tarefa 5.1** — Validar mapa de publicações (necessário para Tarefa 1 funcionar bem)
3. **Tarefa 2** — Decidir search.html (rápido se opção A)
4. **Tarefa 3** — Página Johrei (dados prontos, template existe)
5. **Tarefa 4** — Timeline (mais complexo, pode ser feito por último)
6. **Tarefa 5.2/5.3** — Ajustes finais
