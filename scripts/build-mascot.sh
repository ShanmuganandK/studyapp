#!/usr/bin/env bash
# Regenerate the shipped Tinku poses from the original artwork. One source, one command.
#
# Needs ImageMagick 6/7 (dev tool only, NOT an app dependency):  brew install imagemagick
# Run from the repo root:                                         bash scripts/build-mascot.sh
#
# SOURCE  branding/mascot-originals/<pose>.jpg — the 2000x2000 originals on a plain white
#         background (not shipped: `branding/` is outside public/ and src/, so it never enters a build).
# OUTPUT  src/assets/mascot/webp/<Tinku_*.webp> — 1024x1024 transparent WebP, one per pose.
#
# WHY 1024: the welcome hero is drawn ~260 CSS px; on a 3.5x phone that needs ~900 px. The old 480 px
# files were stretched ~2x, which looked soft (2026-10-18). 1024 is sharp at every size we show.
#
# WHAT IT DOES to each original
#   1. white background -> transparent, flood-filled from the four corners only, so enclosed whites
#      (eye highlights, toe nails) survive;
#   2. defringe: pull the alpha edge in ~1 px and soften it, so no white halo shows on a tinted screen;
#   3. optionally erase a band at the bottom (the celebrate original has a baked ground shadow; the app
#      draws its own);
#   4. resize to 1024 and export as WebP with full-quality alpha.
# The framing of the originals is kept as drawn: the poses share one head position, so when Tinku
# changes pose mid-quiz he does not jump.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=branding/mascot-originals
OUT=src/assets/mascot/webp
SIZE=1024
QUALITY=${MASCOT_QUALITY:-88}
# original -> shipped file : erase-from-row (blank = keep everything)
POSES=(
  "waving:Tinku_Bye:"
  "thumbs-up:Tinku_Encourage_2:"
  "thinking:Tinku_Think3:"
  "sleeping:Tinku_Sleeping:"
  "celebrate:Tinku_Happy_2:1815"
)

CONVERT=$(command -v magick || command -v convert) || { echo "ImageMagick not found" >&2; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

for entry in "${POSES[@]}"; do
  IFS=: read -r pose file erase <<<"$entry"
  in="$SRC/$pose.jpg"; out="$OUT/$file.webp"
  [ -f "$in" ] || { echo "missing $in" >&2; exit 1; }
  W=$($CONVERT "$in" -format %w info:); H=$($CONVERT "$in" -format %h info:)
  L=$((W-1)); B=$((H-1))
  $CONVERT "$in" -alpha set -fuzz 14% -fill none \
    -floodfill +0+0 white -floodfill +$L+0 white -floodfill +0+$B white -floodfill +$L+$B white \
    -channel A -morphology Erode Disk:1.2 -blur 0x0.7 +channel "$TMP/cut.png"
  if [ -n "$erase" ]; then
    $CONVERT "$TMP/cut.png" -region "${W}x$((H-erase))+0+$erase" -alpha transparent +region "$TMP/cut.png"
  fi
  $CONVERT "$TMP/cut.png" -filter Lanczos -resize ${SIZE}x${SIZE} \
    -define webp:method=6 -define webp:alpha-quality=100 -quality "$QUALITY" "$out"
  printf '%-12s -> %-28s %6d bytes\n' "$pose" "$out" "$(wc -c <"$out")"
done
