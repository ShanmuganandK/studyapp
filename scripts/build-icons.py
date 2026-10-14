#!/usr/bin/env python3
"""Regenerate every app icon from the Tinku mascot art. One source, one command.

Needs Pillow (dev tool only, NOT an app dependency):  python3 -m pip install pillow
Run from the repo root:                                python3 scripts/build-icons.py

SOURCE: src/assets/mascot/webp/Tinku_Mascot.webp, the same art the app already ships, so the
icon cannot drift from the mascot. (Before 2026-10-14 the icons were a 1024px JPEG of an
unrelated calculator character, copied three times under .png/.ico names: 1.7 MB, black corners.)

OUTPUTS
  public/pwa-192x192.png, pwa-512x512.png   purpose "any": rounded square with real alpha corners
  public/pwa-maskable-512x512.png            purpose "maskable": opaque, full-bleed; Tinku sits inside
                                             the central 80% circle so any launcher mask keeps him whole
  public/apple-touch-icon.png                180px opaque (iOS rounds the corners itself)
  public/favicon.ico                         16/32/48
  branding/play-store-icon-512.png           Play Console listing icon (L7). NOT shipped: it lives
                                             outside public/ and src/, so it never enters the build

DESIGN: flat brand-indigo field with a pale disc behind Tinku. Deliberately NOT a smooth gradient:
a gradient quantised to a 256-colour palette shows concentric banding, and left full-colour it costs
~330 KB across the icons. Flat + disc is crisp, reads at 16-512px and totals ~55 KB. (A gradient
variant was built and rejected on size; see git history of this file.)

COLOURS come from the design tokens in src/index.css (primary + primary-soft). They are
re-typed here because this is a build-time image tool, not a component, so lint:hex does not apply.
If the palette changes, change them here too and re-run.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MASCOT = ROOT / "src" / "assets" / "mascot" / "webp" / "Tinku_Mascot.webp"
PUBLIC = ROOT / "public"
BRANDING = ROOT / "branding"

SIZE = 1024                      # working canvas; outputs are downsampled from it
DISC_COLOUR = "#e0e7ff"          # --color-primary-soft: the pale disc behind Tinku
FIELD_COLOUR = "#4f46e5"         # --color-primary: indigo, the brand colour
SHADOW = (15, 23, 42, 70)        # soft ground shadow, like .tinku-ground in the app

ANY_WIDTH, ANY_DISC = 0.60, 0.42          # Tinku's width / disc radius, as fractions of the canvas
MASKABLE_WIDTH, MASKABLE_DISC = 0.52, 0.36  # smaller: disc and Tinku stay inside the 40% safe radius
CORNER_RADIUS = 198              # ~19.3% of 1024, a soft rounded square
INSET = 2
PALETTE_COLOURS = 256


def rgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def compose(art, width_fraction, disc_fraction):
    canvas = Image.new("RGBA", (SIZE, SIZE), rgb(FIELD_COLOUR) + (255,))
    cx, cy = SIZE // 2, SIZE // 2
    r = int(SIZE * disc_fraction)
    ImageDraw.Draw(canvas).ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb(DISC_COLOUR) + (255,))

    w = int(SIZE * width_fraction)
    h = int(art.height * w / art.width)
    tinku = art.resize((w, h), Image.LANCZOS)
    x, y = cx - w // 2, int(SIZE * 0.53) - h // 2      # a touch low: the ears and star carry the top

    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sw, sh, base = int(w * 0.55), int(h * 0.07), y + h - int(h * 0.04)
    ImageDraw.Draw(shadow).ellipse((cx - sw // 2, base - sh // 2, cx + sw // 2, base + sh // 2), fill=SHADOW)
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(tinku, (x, y))
    return canvas


def rounded(img):
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (INSET, INSET, SIZE - 1 - INSET, SIZE - 1 - INSET), radius=CORNER_RADIUS, fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


def small(img, n):
    return img.resize((n, n), Image.LANCZOS)


def palette_png(img, path):
    """Alpha-aware 256-colour PNG: flat colour field + cartoon art compresses to ~1/10 the size, no visible loss."""
    img.quantize(colors=PALETTE_COLOURS, method=Image.Quantize.FASTOCTREE,
                 dither=Image.Dither.FLOYDSTEINBERG).save(path, optimize=True)


def main():
    art_full = Image.open(MASCOT).convert("RGBA")
    art = art_full.crop(art_full.getbbox())

    any_icon = rounded(compose(art, ANY_WIDTH, ANY_DISC))
    maskable = compose(art, MASKABLE_WIDTH, MASKABLE_DISC)

    palette_png(small(any_icon, 512), PUBLIC / "pwa-512x512.png")
    palette_png(small(any_icon, 192), PUBLIC / "pwa-192x192.png")
    palette_png(small(maskable, 512).convert("RGB"), PUBLIC / "pwa-maskable-512x512.png")  # opaque by definition
    palette_png(small(maskable, 180).convert("RGB"), PUBLIC / "apple-touch-icon.png")
    any_icon.save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    BRANDING.mkdir(exist_ok=True)
    small(maskable, 512).save(BRANDING / "play-store-icon-512.png", optimize=True)  # full-colour 32-bit, as Play asks

    for p in (PUBLIC / "pwa-512x512.png", PUBLIC / "pwa-192x192.png", PUBLIC / "pwa-maskable-512x512.png",
              PUBLIC / "apple-touch-icon.png", PUBLIC / "favicon.ico", BRANDING / "play-store-icon-512.png"):
        print(f"{str(p.relative_to(ROOT)):36s} {p.stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
