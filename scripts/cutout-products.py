"""
Knocks out the (near-)white studio background of every product photo in
public/products so the packs float on whatever surface the app draws them on.

Flood-fills from the four corners with a colour tolerance, so only background
connected to the edge is removed — white label areas inside the pack survive.
Writes PNGs next to the JPGs and repoints src/data/products.json.

    python3 scripts/cutout-products.py
"""
import json
import os
from collections import deque
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "products")
DATA = os.path.join(ROOT, "src", "data", "products.json")
TOL = 34  # max per-channel distance from the corner colour to count as background


def corner_color(px, w, h):
    samples = []
    for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]:
        samples.append(px[x, y][:3])
    return tuple(sorted(c)[len(c) // 2] for c in zip(*samples))


def cutout(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = corner_color(px, w, h)
    if min(bg) < 150:  # not a light studio background; leave it alone
        return None
    mask = Image.new("L", (w, h), 0)
    mpx = mask.load()
    q = deque()
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        q.append((x, y))
    seen = bytearray(w * h)
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        r, g, b, _ = px[x, y]
        if abs(r - bg[0]) > TOL or abs(g - bg[1]) > TOL or abs(b - bg[2]) > TOL:
            continue
        mpx[x, y] = 255
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # Soften the cut edge by a pixel so it doesn't look razor-jagged.
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    alpha = Image.eval(mask, lambda v: 255 - v)
    im.putalpha(alpha)
    # Trim to content + small margin so packs are framed consistently.
    bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if bbox:
        pad = int(min(w, h) * 0.04)
        im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad)))
    return im


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    done = skipped = 0
    for p in data["products"]:
        jpg = os.path.join(ROOT, "public", p["image"].lstrip("/"))
        if not os.path.exists(jpg) or not jpg.endswith(".jpg"):
            continue
        out = cutout(jpg)
        png = jpg[:-4] + ".png"
        if out is None:
            skipped += 1
            continue
        out.save(png, optimize=True)
        os.remove(jpg)
        p["image"] = p["image"][:-4] + ".png"
        p["cutout"] = True
        done += 1
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"cut out {done}, left {skipped} as-is")


if __name__ == "__main__":
    main()
