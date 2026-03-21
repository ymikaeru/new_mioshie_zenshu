#!/usr/bin/env python3
"""
Extracts table data from legacy Mioshie_Zenshu_br site and generates:
1. data/section_tables.json — Ordered article lists per section (faithful to legacy)
2. data/publication_index.json — Publication-to-teaching mapping

Source of truth: Legacy HTML tables in filetop/*.html
Cross-reference: data/search/advanced_search_index.json for teaching IDs
"""

import json
import os
import re
from bs4 import BeautifulSoup
from collections import OrderedDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGACY_DIR = os.path.join(os.path.dirname(BASE_DIR), "Mioshie_Zenshu_br")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ─── URL → Teaching ID mapping ───────────────────────────────────────────

def load_search_index():
    """Load advanced_search_index.json and build url→id mapping."""
    path = os.path.join(DATA_DIR, "search", "advanced_search_index.json")
    with open(path, "r", encoding="utf-8") as f:
        index = json.load(f)

    url_to_entry = {}
    id_to_entry = {}
    for entry in index:
        url = entry.get("url", "")
        eid = entry.get("id", "")
        if url:
            # Normalize URL: remove leading search1/ or search2/
            clean_url = url.strip()
            url_to_entry[clean_url] = entry
            # Also store without the searchN/ prefix
            for prefix in ["search1/", "search2/"]:
                if clean_url.startswith(prefix):
                    url_to_entry[clean_url[len(prefix):]] = entry
        if eid:
            id_to_entry[eid] = entry

    return index, url_to_entry, id_to_entry


def normalize_href(href, section_file):
    """Convert legacy relative href to search index URL format.

    Legacy: ../search1/kouwa/s100111.html
    Index:  search1/kouwa/s100111.html
    """
    if not href:
        return None

    # Remove ../ prefixes
    clean = re.sub(r'^\.\./+', '', href)
    # Remove leading /
    clean = clean.lstrip('/')
    # Remove .html extension for matching flexibility
    return clean


# ─── HTML Table Parser ───────────────────────────────────────────────────

def parse_data_table(soup):
    """Find the main data table (bgcolor=#EFFFE6 with border=1)."""
    tables = soup.find_all("table", {"bgcolor": "#EFFFE6", "border": "1"})
    if not tables:
        # Try without bgcolor
        tables = soup.find_all("table", {"border": "1"})
    return tables


def get_cell_text(td):
    """Extract clean text from a table cell, preserving line breaks as ' / '."""
    if not td:
        return ""
    # Replace <br> with separator
    for br in td.find_all("br"):
        br.replace_with(" / ")
    text = td.get_text(strip=False)
    # Clean up whitespace
    text = re.sub(r'[\u3000\xa0]+', ' ', text)  # Replace fullwidth/nbsp spaces
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove leading/trailing Japanese blank characters
    text = text.strip('　 ')
    return text


def get_cell_link(td):
    """Extract the first href link from a table cell."""
    if not td:
        return None
    a = td.find("a")
    if a and a.get("href"):
        return a["href"]
    return None


def is_header_row(tr):
    """Check if a row is a table header (has bgcolor=#008080)."""
    tds = tr.find_all("td")
    if not tds:
        return False
    return any(td.get("bgcolor") == "#008080" for td in tds)


def is_section_divider(tr):
    """Check if a row is a section divider (colored row spanning all columns)."""
    tds = tr.find_all("td")
    if len(tds) == 1 and tds[0].get("colspan"):
        return True
    if len(tds) == 1 and tds[0].get("bgcolor") == "#008080":
        return True
    # Check for letter dividers like "A", "あ行"
    if len(tds) >= 1:
        text = get_cell_text(tds[0])
        if re.match(r'^[A-Z]$', text) or re.match(r'^[あ-ん]行$', text):
            return True
    return False


def is_empty_row(tr):
    """Check if a row has only whitespace/empty cells."""
    tds = tr.find_all("td")
    return all(get_cell_text(td) in ('', '　', ' ') for td in tds)


def extract_standard_table(filepath, section_key, column_config):
    """
    Extract rows from a standard 5-column legacy table.

    column_config: dict mapping column index to field name
    e.g., {0: "title", 1: "source", 2: "date", 3: "notes", 4: "reference"}
    """
    with open(filepath, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    tables = parse_data_table(soup)
    rows = []
    current_subsection = None

    for table in tables:
        for tr in table.find_all("tr"):
            if is_header_row(tr):
                # Check if it's a section divider within the table
                tds = tr.find_all("td")
                if len(tds) == 1 or (tds[0].get("colspan") and int(tds[0].get("colspan", 1)) > 3):
                    current_subsection = get_cell_text(tds[0])
                continue

            tds = tr.find_all("td")
            if not tds:
                continue

            # Check for letter/section dividers
            first_text = get_cell_text(tds[0])
            if len(tds) >= 3 and (
                re.match(r'^[A-Z]$', first_text) or
                re.match(r'^[あ-ん]行$', first_text) or
                (len(first_text) <= 2 and first_text.isupper())
            ):
                # Check if other cells are empty (it's a divider, not data)
                if all(get_cell_text(td) in ('', '　', ' ') for td in tds[1:]):
                    current_subsection = first_text
                    continue

            if is_empty_row(tr):
                continue

            # Extract data
            row = {"_section": section_key}
            if current_subsection:
                row["_subsection"] = current_subsection

            href = get_cell_link(tds[0]) if tds else None
            if href:
                row["_href"] = normalize_href(href, filepath)
                row["_raw_href"] = href

            for idx, field in column_config.items():
                if idx < len(tds):
                    row[field] = get_cell_text(tds[idx])
                else:
                    row[field] = ""

            # Only include rows that have a title
            if row.get("title") and row["title"] not in ('', '　'):
                rows.append(row)

    return rows


# ─── Section-specific extractors ─────────────────────────────────────────

STANDARD_COLUMNS = {0: "title", 1: "source", 2: "date", 3: "notes", 4: "reference"}
OKAGE_COLUMNS = {0: "title", 1: "magazine", 2: "date", 3: "contributor", 4: "citation"}
KIKO_COLUMNS = {0: "title", 1: "source", 2: "date", 3: "notes", 4: "collection"}

def extract_kanren(filepath):
    """Extract kanren.html which has a different column structure (colspan=2 for title)."""
    with open(filepath, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    tables = parse_data_table(soup)
    rows = []
    current_subsection = None

    for table in tables:
        for tr in table.find_all("tr"):
            if is_header_row(tr):
                tds = tr.find_all("td")
                if len(tds) == 1 or (tds[0].get("colspan") and int(tds[0].get("colspan", 1)) > 3):
                    current_subsection = get_cell_text(tds[0])
                continue

            tds = tr.find_all("td")
            if not tds or is_empty_row(tr):
                continue

            # kanren has colspan=2 for title, so first cell may span
            href = get_cell_link(tds[0])
            title = get_cell_text(tds[0])

            if not title or title in ('', '　'):
                continue

            row = {
                "_section": "kanren",
                "title": title,
                "_raw_href": href or "",
            }
            if href:
                row["_href"] = normalize_href(href, filepath)
            if current_subsection:
                row["_subsection"] = current_subsection

            # Try to get date and notes from remaining cells
            remaining = [get_cell_text(td) for td in tds[1:]]
            # Find date-like field
            for i, val in enumerate(remaining):
                if re.match(r'S\d|不明|\d{4}', val):
                    row["date"] = val
                    break

            # Get all links in the row for sub-articles
            all_links = []
            for td in tds:
                for a in td.find_all("a"):
                    link_href = a.get("href", "")
                    link_text = a.get_text(strip=True)
                    if link_href and link_text:
                        all_links.append({
                            "title": link_text,
                            "href": normalize_href(link_href, filepath)
                        })
            if len(all_links) > 1:
                row["_sub_links"] = all_links

            # Notes from last column
            if len(tds) >= 3:
                row["notes"] = get_cell_text(tds[-1])

            rows.append(row)

    return rows


# ─── Main extraction ─────────────────────────────────────────────────────

SECTION_DEFINITIONS = [
    # ENSINAMENTOS
    {
        "key": "palestras",
        "title_pt": "Palestras",
        "title_ja": "御講話",
        "file": "filetop/kouwa.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensinamentos",
    },
    {
        "key": "situmon",
        "title_pt": "Perguntas e Respostas",
        "title_ja": "質問応答",
        "file": "filetop/situmon.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensinamentos",
    },
    {
        "key": "taidan",
        "title_pt": "Diálogos",
        "title_ja": "対談",
        "file": "filetop/taidan.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensinamentos",
    },
    # ENSAIOS POR ANO
    {
        "key": "ensaios_syoki",
        "title_pt": "Fase Inicial (S5-S9)",
        "title_ja": "昭和５年～９年",
        "file": "filetop/syoki.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s1718",
        "title_pt": "Showa 17-18",
        "title_ja": "昭和１７年～１８年",
        "file": "filetop/1718.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s2223",
        "title_pt": "Showa 22-23",
        "title_ja": "昭和２２年～２３年",
        "file": "filetop/23nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s24",
        "title_pt": "Showa 24",
        "title_ja": "昭和２４年",
        "file": "filetop/24nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s25",
        "title_pt": "Showa 25",
        "title_ja": "昭和２５年",
        "file": "filetop/25nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s26",
        "title_pt": "Showa 26",
        "title_ja": "昭和２６年",
        "file": "filetop/26nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s27",
        "title_pt": "Showa 27",
        "title_ja": "昭和２７年",
        "file": "filetop/27nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s28",
        "title_pt": "Showa 28",
        "title_ja": "昭和２８年",
        "file": "filetop/28nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    {
        "key": "ensaios_s29",
        "title_pt": "Showa 29-30",
        "title_ja": "昭和２９年～３０年",
        "file": "filetop/29nen.html",
        "columns": STANDARD_COLUMNS,
        "category": "ensaios",
    },
    # MATERIAL DE REFERÊNCIA
    {
        "key": "sanko",
        "title_pt": "Material de Referência",
        "title_ja": "参考資料",
        "file": "filetop/sanko.html",
        "columns": STANDARD_COLUMNS,
        "category": "referencia",
    },
    {
        "key": "kiko",
        "title_pt": "Contribuições Relacionadas a Meishu-Sama",
        "title_ja": "明主様に関する寄稿",
        "file": "filetop/kiko.html",
        "columns": KIKO_COLUMNS,
        "category": "referencia",
    },
    {
        "key": "kiko2",
        "title_pt": "Outras Contribuições",
        "title_ja": "その他の寄稿",
        "file": "filetop/kiko2.html",
        "columns": KIKO_COLUMNS,
        "category": "referencia",
    },
    {
        "key": "okage",
        "title_pt": "Relatos de Graças",
        "title_ja": "掲載されたおかげ話",
        "file": "filetop/okage1.html",
        "columns": OKAGE_COLUMNS,
        "category": "referencia",
    },
]


def build_id_from_href(href, url_to_entry):
    """Try to find the search index ID for a legacy href."""
    if not href:
        return None

    # Direct match
    if href in url_to_entry:
        return url_to_entry[href]["id"]

    # Try with .html
    if not href.endswith(".html"):
        href_html = href + ".html"
        if href_html in url_to_entry:
            return url_to_entry[href_html]["id"]

    # Try stripping .html
    href_no_ext = href.replace(".html", "")
    if href_no_ext in url_to_entry:
        return url_to_entry[href_no_ext]["id"]

    # Try extracting just the filename part and searching
    filename = os.path.basename(href).replace(".html", "")
    for url, entry in url_to_entry.items():
        if url.endswith("/" + filename + ".html") or url.endswith("/" + filename):
            return entry["id"]

    return None


def main():
    print("=" * 60)
    print("Building publication index from legacy site")
    print("=" * 60)

    # Load search index
    print("\nLoading search index...")
    search_index, url_to_entry, id_to_entry = load_search_index()
    print(f"  Loaded {len(search_index)} entries, {len(url_to_entry)} URL mappings")

    # Extract all sections
    section_tables = {}
    all_rows = []
    total_matched = 0
    total_unmatched = 0
    unmatched_details = []

    for section_def in SECTION_DEFINITIONS:
        filepath = os.path.join(LEGACY_DIR, section_def["file"])
        if not os.path.exists(filepath):
            print(f"\n  WARNING: {section_def['file']} not found, skipping")
            continue

        print(f"\nExtracting: {section_def['key']} ({section_def['title_pt']})")
        print(f"  File: {section_def['file']}")

        rows = extract_standard_table(filepath, section_def["key"], section_def["columns"])

        # Match to search index IDs
        matched = 0
        unmatched = 0
        for row in rows:
            href = row.get("_href")
            teaching_id = build_id_from_href(href, url_to_entry)
            if teaching_id:
                row["id"] = teaching_id
                matched += 1
            else:
                unmatched += 1
                unmatched_details.append({
                    "section": section_def["key"],
                    "title": row.get("title", "?"),
                    "href": href or "(no href)",
                })

        total_matched += matched
        total_unmatched += unmatched

        print(f"  Rows: {len(rows)} | Matched: {matched} | Unmatched: {unmatched}")

        section_tables[section_def["key"]] = {
            "title_pt": section_def["title_pt"],
            "title_ja": section_def["title_ja"],
            "category": section_def["category"],
            "total": len(rows),
            "matched": matched,
            "rows": rows,
        }
        all_rows.extend(rows)

    # Extract kanren separately (different structure)
    kanren_path = os.path.join(LEGACY_DIR, "filetop/kanren.html")
    if os.path.exists(kanren_path):
        print(f"\nExtracting: kanren (Publicações Relacionadas)")
        kanren_rows = extract_kanren(kanren_path)
        matched = 0
        for row in kanren_rows:
            href = row.get("_href")
            teaching_id = build_id_from_href(href, url_to_entry)
            if teaching_id:
                row["id"] = teaching_id
                matched += 1

        print(f"  Rows: {len(kanren_rows)} | Matched: {matched}")
        section_tables["kanren"] = {
            "title_pt": "Publicações Relacionadas",
            "title_ja": "関連出版物一覧",
            "category": "referencia",
            "total": len(kanren_rows),
            "matched": matched,
            "rows": kanren_rows,
        }

    # ─── Build publication index ──────────────────────────────────────
    print("\n" + "=" * 60)
    print("Building publication index...")

    # Load publications_enriched.json for metadata
    pub_path = os.path.join(DATA_DIR, "publications_enriched.json")
    with open(pub_path, "r", encoding="utf-8") as f:
        publications = json.load(f)

    pub_metadata = {}
    for pub in publications:
        pub_metadata[pub["id"]] = pub

    # Group search index entries by publication
    pub_groups = {}
    id_to_pub = {}

    for entry in search_index:
        pub_name = entry.get("publication")
        if not pub_name:
            continue

        if pub_name not in pub_groups:
            pub_groups[pub_name] = []
        pub_groups[pub_name].append(entry)
        id_to_pub[entry["id"]] = pub_name

    # Sort each publication's teachings by issue_page then date
    def sort_key(entry):
        # Extract numeric issue from issue_page (e.g., "159号" -> 159)
        issue = entry.get("issue_page", "") or ""
        issue_num = 0
        m = re.search(r'(\d+)', str(issue))
        if m:
            issue_num = int(m.group(1))

        # Date fallback
        date_iso = entry.get("date_iso", "") or "9999-99-99"

        return (issue_num, date_iso)

    publication_index = {"publications": {}, "id_to_publication": id_to_pub}

    for pub_name, entries in sorted(pub_groups.items()):
        entries.sort(key=sort_key)
        teaching_ids = [e["id"] for e in entries]

        # Try to find matching publication metadata
        cover_image = None
        title_ja = pub_name
        title_pt = pub_name
        pub_id = None

        for pid, pmeta in pub_metadata.items():
            if pmeta.get("title_ja") == pub_name or pmeta.get("title_pt") == pub_name:
                cover_image = pmeta.get("cover_image")
                title_ja = pmeta.get("title_ja", pub_name)
                title_pt = pmeta.get("title_pt", pub_name)
                pub_id = pid
                break

        publication_index["publications"][pub_name] = {
            "pub_id": pub_id,
            "title_ja": title_ja,
            "title_pt": title_pt,
            "cover_image": cover_image,
            "teaching_ids": teaching_ids,
            "total": len(teaching_ids),
        }

    # ─── Save outputs ─────────────────────────────────────────────────

    # Save section_tables.json
    output_sections = os.path.join(DATA_DIR, "section_tables.json")
    with open(output_sections, "w", encoding="utf-8") as f:
        json.dump(section_tables, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {output_sections}")

    # Save publication_index.json
    output_pub = os.path.join(DATA_DIR, "publication_index.json")
    with open(output_pub, "w", encoding="utf-8") as f:
        json.dump(publication_index, f, ensure_ascii=False, indent=2)
    print(f"Saved: {output_pub}")

    # ─── Summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Sections extracted: {len(section_tables)}")
    print(f"Total rows: {sum(s['total'] for s in section_tables.values())}")
    print(f"Matched to search index: {total_matched}")
    print(f"Unmatched: {total_unmatched}")
    print(f"Publications in index: {len(publication_index['publications'])}")
    print(f"Teachings mapped to publications: {len(id_to_pub)}")

    if unmatched_details:
        print(f"\nFirst 20 unmatched entries:")
        for item in unmatched_details[:20]:
            print(f"  [{item['section']}] {item['title'][:50]} → {item['href']}")

    # Save unmatched report for debugging
    if unmatched_details:
        report_path = os.path.join(BASE_DIR, "scripts", "unmatched_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(unmatched_details, f, ensure_ascii=False, indent=2)
        print(f"\nFull unmatched report: {report_path}")


if __name__ == "__main__":
    main()
