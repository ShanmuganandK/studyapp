#!/usr/bin/env python3
"""
Split detached floating props (?, golden star, confetti, Zzz) out of the 1024x1024 transparent
Tinku WebPs into aligned 512x512 transparent WebP overlay layers under
`src/assets/mascot/webp/layers/`, while keeping the base WebPs 1024x1024 with real alpha
(so `mascotAssets.test.js` and framing stay 100% unchanged).

Idempotent: rebuilds from clean cutouts via `scripts/build-mascot.sh` or directly from the
`branding/mascot-originals/*.jpg` 2000x2000 sources when run standalone.
"""
import shutil
import subprocess
import tempfile
from collections import deque
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
WEBP_DIR = REPO_ROOT / "src" / "assets" / "mascot" / "webp"
LAYERS_DIR = WEBP_DIR / "layers"
LAYERS_DIR.mkdir(parents=True, exist_ok=True)
LAYER_SIZE = 512
CWEBP = shutil.which("cwebp")


def save_webp(img, out_path, quality=80, alpha_quality=90):
    if CWEBP:
        with tempfile.TemporaryDirectory() as td:
            tmp_png = Path(td) / "frame.png"
            img.save(tmp_png, "PNG")
            subprocess.run(
                [CWEBP, "-quiet", "-q", str(quality), "-alpha_q", str(alpha_quality), "-m", "6", str(tmp_png), "-o", str(out_path)],
                check=True,
            )
    else:
        img.save(out_path, "WEBP", quality=quality, alpha_quality=alpha_quality, method=6, exact=False)


def connected_components(alpha_img, threshold=16):
    """Return list of (pixel_list, bbox, area) sorted largest-first at full resolution."""
    w, h = alpha_img.size
    px = alpha_img.load()
    vis = bytearray(w * h)
    comps = []
    for y in range(h):
        row_off = y * w
        for x in range(w):
            if px[x, y] > threshold and not vis[row_off + x]:
                vis[row_off + x] = 1
                q = deque([(x, y)])
                pixels = []
                minx = maxx = x
                miny = maxy = y
                while q:
                    cx, cy = q.popleft()
                    pixels.append((cx, cy))
                    if cx < minx: minx = cx
                    if cx > maxx: maxx = cx
                    if cy < miny: miny = cy
                    if cy > maxy: maxy = cy
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            idx = ny * w + nx
                            if not vis[idx] and px[nx, ny] > threshold:
                                vis[idx] = 1
                                q.append((nx, ny))
                comps.append((pixels, (minx, miny, maxx, maxy), len(pixels)))
    comps.sort(key=lambda c: c[2], reverse=True)
    return comps


def extract_layers(base_name, spec):
    """
    spec: dict[layer_name -> predicate(idx, bbox, area)]
    Everything NOT matched by any predicate (including idx == 0, Tinku's body) stays on the base image.
    Soft glow halos (alpha <= threshold) around extracted components are also lifted via a 24px
    padded bounding box around each matched component so no yellow fringe remains on the base image.
    """
    src_path = WEBP_DIR / f"{base_name}.webp"
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    alpha = im.split()[3]
    comps = connected_components(alpha, threshold=12)

    if len(comps) <= 1:
        print(f"[skip] {base_name}.webp already has 1 component (likely already split).")
        return

    src_px = im.load()
    base_out = im.copy()
    base_px = base_out.load()

    layer_imgs = {name: Image.new("RGBA", (w, h), (0, 0, 0, 0)) for name in spec}
    layer_pxs = {name: img.load() for name, img in layer_imgs.items()}

    # First pass: classify each non-body component
    body_pixels = set(comps[0][0])
    matched = {name: [] for name in spec}
    for idx, (pixels, bbox, area) in enumerate(comps):
        if idx == 0:
            continue
        for lname, pred in spec.items():
            if pred(idx, bbox, area):
                matched[lname].append((pixels, bbox, area))
                break

    # Copy matched components + their soft faint glow fringe (within 24px padding, excluding body)
    for lname, items in matched.items():
        lpx = layer_pxs[lname]
        for pixels, (x0, y0, x1, y1), _ in items:
            # Copy exact component pixels
            for x, y in pixels:
                lpx[x, y] = src_px[x, y]
                base_px[x, y] = (0, 0, 0, 0)
            # Also sweep faint halo pixels (alpha 1..12) inside padded bbox, never touching Tinku's body
            pad = 24
            for y in range(max(0, y0 - pad), min(h, y1 + pad + 1)):
                for x in range(max(0, x0 - pad), min(w, x1 + pad + 1)):
                    a = base_px[x, y][3]
                    if 0 < a <= 12 and (x, y) not in body_pixels:
                        lpx[x, y] = base_px[x, y]
                        base_px[x, y] = (0, 0, 0, 0)

    # Save cleaned base WebP (1024x1024, high-quality alpha)
    save_webp(base_out, src_path, quality=80, alpha_quality=90)
    print(f"base  {base_name}.webp -> {src_path.stat().st_size:6d} bytes (kept body)")

    for lname, img in layer_imgs.items():
        out_path = LAYERS_DIR / f"{base_name}_{lname}.webp"
        resized = img.resize((LAYER_SIZE, LAYER_SIZE), Image.LANCZOS)
        save_webp(resized, out_path, quality=78, alpha_quality=88)
        boxes = [b for _, b, _ in matched[lname]]
        if boxes:
            ux0 = min(b[0] for b in boxes)
            uy0 = min(b[1] for b in boxes)
            ux1 = max(b[2] for b in boxes)
            uy1 = max(b[3] for b in boxes)
            cx = round(((ux0 + ux1) / 2) / w * 100, 1)
            cy = round(((uy0 + uy1) / 2) / h * 100, 1)
        else:
            cx = cy = 50.0
        print(f"layer {out_path.name:30s} -> {out_path.stat().st_size:6d} bytes  origin=({cx}%, {cy}%)  parts={len(boxes)}")


def main():
    # Tinku_Think3: #1 is floating star (left, y~190..340), #2 is '?' (higher right, y~100..200)
    extract_layers("Tinku_Think3", {
        "star": lambda idx, box, area: area >= 5000,
        "qmark": lambda idx, box, area: area < 5000 and box[1] < 220,
    })

    # Tinku_Encourage_2: #1 is floating star
    extract_layers("Tinku_Encourage_2", {
        "star": lambda idx, box, area: area >= 5000,
    })

    # Tinku_Happy_2: #1 is floating star (largest detached component), #2..N are confetti pieces
    extract_layers("Tinku_Happy_2", {
        "star": lambda idx, box, area: idx == 1 and area >= 4000,
        "confetti": lambda idx, box, area: idx >= 2,
    })

    # Tinku_Sleeping: #1..3 are the three floating Z letters
    extract_layers("Tinku_Sleeping", {
        "zzz": lambda idx, box, area: idx >= 1,
    })


if __name__ == "__main__":
    main()
