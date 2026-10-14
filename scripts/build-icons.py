#!/usr/bin/env python3
"""Regenerate the PWA / favicon icons in public/ from branding/app-icon-source-1024.jpg.

WHY this exists: the icons used to be the 1024x1024 source JPEG copied three times under
.png/.ico names (1.7 MB, black corners, wrong declared sizes, precached for every user). They are
now real, small, alpha-cornered PNGs generated from one source, so a future art change is one
command, not a hand-resize.

Needs Pillow (dev tool only, NOT an app dependency):  python3 -m pip install pillow
Run from the repo root:                                python3 scripts/build-icons.py

Source geometry (measured 2026-10-14): the art is a rounded square, corner radius ~200px of 1024,
with the corners baked in as solid black because JPEG has no alpha. We cut a rounded-rect alpha
mask (inset 2px to drop the JPEG fringe) for the "any"-purpose icons, and for the iOS icon (which
must be opaque and full-bleed) crop the black corners away instead.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "branding" / "app-icon-source-1024.jpg"
OUT = ROOT / "public"

SIZE = 1024
CORNER_RADIUS = 198   # measured ~200; 2px inset trims the fringe
INSET = 2
IOS_CROP = 60         # >= radius * (1 - 1/sqrt(2)) ~ 58.6 px: removes the black corners entirely
PALETTE_COLORS = 256  # flat cartoon art; alpha-aware octree keeps per-colour alpha in the palette


def quantize(img):
    return img.quantize(colors=PALETTE_COLORS, method=Image.Quantize.FASTOCTREE,
                        dither=Image.Dither.FLOYDSTEINBERG)


def main():
    src = Image.open(SRC).convert("RGB")
    assert src.size == (SIZE, SIZE), f"expected {SIZE}x{SIZE}, got {src.size}"

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (INSET, INSET, SIZE - 1 - INSET, SIZE - 1 - INSET), radius=CORNER_RADIUS, fill=255)
    master = src.convert("RGBA")
    master.putalpha(mask)

    for n in (512, 192):
        quantize(master.resize((n, n), Image.LANCZOS)).save(OUT / f"pwa-{n}x{n}.png", optimize=True)

    ios = src.crop((IOS_CROP, IOS_CROP, SIZE - IOS_CROP, SIZE - IOS_CROP)).resize((180, 180), Image.LANCZOS)
    ios.quantize(256).save(OUT / "apple-touch-icon.png", optimize=True)

    master.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    for f in ("pwa-512x512.png", "pwa-192x192.png", "apple-touch-icon.png", "favicon.ico"):
        print(f"{f:22s} {(OUT / f).stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
