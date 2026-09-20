# Product images and data

Product photographs in this folder and the records in `src/data/products.json`
come from **Open Beauty Facts** (https://world.openbeautyfacts.org).

- Database: Open Database License (ODbL) 1.0
- Images: Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA)
- Each record links to its source page (`source` field) for attribution.

Refresh with `node scripts/fetch-products.mjs`, then `python3 scripts/cutout-products.py`
to knock out the white studio background (PNG with alpha). Brand and product names are
the property of their respective owners; the app links to a neutral search
and does not sell or broker any product.

`src/data/kbeauty.json` is a hand-curated list of product names and headline
actives (no photographs, no full ingredient lists).
