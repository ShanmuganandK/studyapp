# docs/images.md — Image Asset Recipe (detailed reference)

> Referenced from STANDARDS §5. Read this when adding or optimizing image assets (mascot, icons, badges, backgrounds, art). STANDARDS holds the principle; this holds the how-to.

## The recipe — resize FIRST, then compress (order matters)

The biggest saving is usually resolution, not format.

1. **Resize to display size × DPI.** Find the max on-screen CSS size of the image, multiply by ~3 (covers 3× high-DPI screens). Ship at that resolution — not the source's full size.
   - Example: a mascot shown at 160px CSS → 480px asset. Shipping a 1024px source is ~4× wasted pixels nobody sees.
2. **Then convert to WebP, lossy quality ~85–90** for flat illustrations/icons (perceptually lossless — flat art has no fine gradients/texture to degrade). Use lossless WebP only if a specific asset shows visible artifacts at Q90.
3. **Verify visually at on-screen size** (not zoomed in): edges crisp, soft glows/gradients un-banded. Bump quality only if you actually see degradation.
4. **Keep the original source files** (compress copies); never destroy the source — you may need to re-export at a different size later.

## Reference outcome
The 6 Tinku mascot images went **3.5MB → 193KB (18× smaller)** at 480px / Q90 with no visible quality loss. This is the template for ALL image assets.

## Loading discipline (above-the-fold / frequently-shown images)
- **Preload** all variants into cache before first render (e.g. all mascot emotions on mount), so swaps are instant from cache.
- **Reserve the container size** (fixed width/height) so layout never shifts or goes blank while loading.
- **Cross-fade on swap** using opacity only (GPU-safe) — no remount, no blank frame.

## Tooling
- squoosh.app (visual before/after with size readout) is the safe way to dial quality — stop reducing the moment you see any loss.
- Verify on an actual phone at real display size, on a representative low-end device if possible.
