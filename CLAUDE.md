# Mioshie Zenshu Modern — Guia do Projeto

## Visão Geral
Site moderno da Biblioteca Sagrada dos Ensinamentos de Meishu-Sama.
Reconstrução do site legado (Mioshie_Zenshu_br) usando dados JSON já extraídos.

## Stack Técnica
- **Vanilla HTML/CSS/JS** (sem frameworks) — mesmo padrão do mioshie_college
- **PWA** com Service Worker para offline
- **Static site** — sem backend, deploy direto
- **Dados**: JSON files carregados via fetch()

## Projeto de Referência
O site `mioshie_college` em `/Users/michael/Documents/Ensinamentos/Sites/BR/mioshie_college/SiteModerno/`
é o modelo a seguir para padrões de:
- Design system (CSS variables, temas Light/Dark/Paper/Calm/Focus/Bold/Quiet)
- Tipografia (Outfit para UI, Crimson Pro para conteúdo)
- Reader bilíngue (PT/JP toggle, controle de fonte, comparação)
- PWA + Service Worker (cache stale-while-revalidate)
- Autenticação (SHA-256, 3 níveis)
- Navegação responsiva (hamburger, touch gestures)

## Estrutura de Dados

### data/teachings/ (108 MB, 4.977 registros)
- `teachings_translated_part1-5.json` — Ensinamentos completos PT/JP
- `teachings_manifest.json` — Índice dos parts
- Schema: `{ id, title, content_ptbr, content, category, source_file, date, publication, jp_title }`

### data/poetry/ (9.5 MB)
- `poems.json` (~4.000 poemas) — Schema: `{ title, original, reading, translation, kigo, kototama, meaning, category, mood }`
- `gosanka_enriched.json` (10.717 poemas) — Schema: `{ book, original, reading, title, source_date, id, source_book, translation_pt, tags, category, mood }`
- `yamato_full.json` (10.666 registros)

### data/kannon/ (2.1 MB, 40 palestras)
- `kannon_fixed.json` — Schema: `{ id, title, content, content_ptbr, category, source_file, publication }`

### data/johrei/ (316 KB, ~50 capítulos)
- `johrei_chapters_extracted.json` — Schema: `{ id, title, content_ptbr, content_snippet, category, publication, tags }`

### data/search/ (5.3 MB, 4.918 registros)
- `advanced_search_index.json` — Schema: `{ id, title, content_snippet, category, tags, focusPoints, year, publication, url, related }`

### data/ui/
- `ui_text_pt.json` — Strings da interface em PT
- `ui_text_pt_supplemental.json` — Strings complementares

### data/volumes.json
- Metadados de coleções/volumes

### data/ — Biblioteca (Library)
- `publications_enriched.json` — 102 publicações com metadados enriquecidos
  - Schema: `{ id, title_ja, title_pt, description, date_showa, year, era, category, cover_image, filter_key, filter_value, unpublished, author, publisher, format, pages, price, notes_pt, hakkousi_file, edition_count, image_count }`
- `hakkousi_rich.json` — 39 publicações com dados detalhados de edição
  - Schema: `{ file, title_ja, editions: [{ edition, edition_pt, date_showa, year, format, pages, author, publisher, publisher_org, printer, price, notes, notes_pt, images }], series_info, series_info_pt, all_images }`

### assets/
- `assets/img/` — 164 imagens de capas e edições (JPG, 5KB–330KB)
- `assets/_み教え/` — Site legado original com HTML das publicações, fotos e documentos
  - `み教え/photo/` — Fotos das publicações originais
  - `み教え/み教え/hakkousi/` — 41 páginas HTML originais de publicações
  - `木原義彦/bunsyo/` — 18 documentos complementares

## Páginas Implementadas
1. `index.html` — Home com cards de seções (ensinamentos, poemas, kannon, johrei)
2. `reader.html` — Leitor universal de ensinamentos (bilíngue PT/JP, iBooks-style settings)
3. `poems.html` — Coleção de poemas/gosanka
4. `kannon.html` — Palestras de Kannon
5. `search.html` — Busca avançada global
6. `library.html` — Biblioteca de Publicações (grid/lista, filtros por era e categoria, modal com detalhes históricos, galeria de edições, lightbox)

## Páginas Planejadas
- `timeline.html` — Timeline interativa dos ensinamentos

## Design System
- Cores: Zen Gold (#B8860B) como accent, fundo clean (#F8F9F5)
- Temas: Light, Dark, Quiet, Paper, Bold, Calm, Focus
- Border-radius: 16px
- Shadows: soft premium
- Tipografia fluida com clamp()
- Mobile-first responsive

## Convenções
- CSS variables para temas (--bg-color, --surface, --text-main, --accent, etc.)
- localStorage para preferências (tema, idioma, favoritos)
- Bilíngue: classes .lang-pt / .lang-ja com toggle
- Scripts com defer
- Fonts via <link rel="preconnect"> + <link rel="preload">

## Library (Biblioteca)
### Arquitetura
- `library.html` — Estrutura: sidebar com filtros (era + categoria) + grid/lista de publicações
- `css/library.css` — Layout responsivo, cards 150-200px, modal, carousel, lightbox
- `js/library.js` — Fetch de JSONs, renderização, filtros, modal com edições detalhadas

### Funcionalidades
- **Grid/Lista toggle** — Visualização de capas ou lista detalhada
- **Filtros laterais** — Por era Showa e por coleção/categoria
- **Modal de detalhes** — Capa, metadados enriquecidos (autor, editora, formato, páginas, preço), tabela de edições, galeria de imagens
- **Lightbox** — Clique em imagem do carousel abre visualização ampliada
- **Hakkousi matching** — 3 estratégias de matching (id prefix, filter_value, hakkousi_file)
