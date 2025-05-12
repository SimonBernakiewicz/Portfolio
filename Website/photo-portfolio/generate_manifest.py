#!/usr/bin/env python3
import os
import json
from PIL import Image

BASE_DIR = 'images'
THUMB_DIR = os.path.join(BASE_DIR, 'thumbnails')
MANIFEST_FILE = 'manifest.json'
THUMB_SIZE = (512, 512)

manifest = {'categories': {}}

for root, dirs, files in os.walk(BASE_DIR):
    # Skip the thumbnails directory itself
    if os.path.commonpath([root, THUMB_DIR]) == THUMB_DIR:
        continue

    rel_dir = os.path.relpath(root, BASE_DIR)
    parts = rel_dir.split(os.sep)
    category = parts[0] if parts[0] != '.' else 'uncategorized'

    # Ensure thumbnail output directory exists
    thumb_subdir = os.path.join(THUMB_DIR, rel_dir)
    os.makedirs(thumb_subdir, exist_ok=True)

    for filename in files:
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
            continue

        full_path = os.path.join(root, filename)
        thumb_path = os.path.join(thumb_subdir, filename)

        # Generate thumbnail if missing
        if not os.path.exists(thumb_path):
            try:
                with Image.open(full_path) as img:
                    img.thumbnail(THUMB_SIZE)
                    img.save(thumb_path)
            except Exception:
                pass

        manifest['categories'].setdefault(category, []).append({
            'thumb': thumb_path.replace('\\', '/'),
            'full': full_path.replace('\\', '/')
        })

# Write manifest.json
with open(MANIFEST_FILE, 'w') as mf:
    json.dump(manifest, mf, indent=2)
