import json
import os

# 1. Load date_iso from all teaching files
dates = {}
for part in range(1, 6):
    fname = f'data/teachings/teachings_translated_part{part}.json'
    if not os.path.exists(fname): continue
    
    with open(fname) as f:
        data = json.load(f)
        
    items = data if isinstance(data, list) else list(data.values())
    for item in items:
        if isinstance(item, dict):
            i_id = item.get('id')
            d_iso = item.get('date_iso')
            if i_id and d_iso:
                dates[i_id] = d_iso

# 2. Update search index
idx_file = 'data/search/advanced_search_index.json'
with open(idx_file) as f:
    idx = json.load(f)

updated = 0
for entry in idx:
    if entry.get('id') in dates:
        entry['date_iso'] = dates[entry['id']]
        updated += 1

# 3. Save search index
with open(idx_file, 'w') as f:
    json.dump(idx, f, ensure_ascii=False, indent=0, separators=(',', ':'))

print(f"Enriched {updated} entries with date_iso.")
