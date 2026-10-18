import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the shipped Tinku poses are the sharp, transparent ones `scripts/build-mascot.sh` makes.
 *
 * WHY: on 2026-10-18 the poses were 480 px files drawn at ~260 CSS px on 3.5x phones: soft, and the
 * hero pose had a dashed outline. They are now generated from 2000 px originals at 1024 px with real
 * alpha. This fails if a pose is swapped back to a small file, or to one with no transparency (a
 * white box around Tinku on the tinted screens).
 *
 * `Tinku_Mascot` (the 3/4 default) is NOT in this list yet: its original has a checkerboard baked in
 * and is waiting for a clean white-background version. Add it here when it is regenerated.
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'mascot', 'webp');
const REGENERATED = ['Tinku_Bye', 'Tinku_Encourage_2', 'Tinku_Think3', 'Tinku_Sleeping', 'Tinku_Happy_2'];

// Minimal RIFF/WebP chunk reader: enough to read the extended header (VP8X) and see an alpha chunk.
function readWebp(buf) {
  expect(buf.subarray(0, 4).toString('latin1')).toBe('RIFF');
  expect(buf.subarray(8, 12).toString('latin1')).toBe('WEBP');
  const chunks = [];
  for (let i = 12; i + 8 <= buf.length; ) {
    const type = buf.subarray(i, i + 4).toString('latin1');
    const size = buf.readUInt32LE(i + 4);
    chunks.push({ type, at: i + 8, size });
    i += 8 + size + (size % 2);
  }
  const vp8x = chunks.find((c) => c.type === 'VP8X');
  return {
    chunks: chunks.map((c) => c.type),
    hasAlphaFlag: !!vp8x && (buf[vp8x.at] & 0x10) !== 0,
    width: vp8x ? 1 + buf.readUIntLE(vp8x.at + 4, 3) : null,
    height: vp8x ? 1 + buf.readUIntLE(vp8x.at + 7, 3) : null,
  };
}

describe('regenerated Tinku poses', () => {
  for (const name of REGENERATED) {
    it(`${name}.webp is 1024x1024 with a real alpha channel`, () => {
      const info = readWebp(readFileSync(join(DIR, `${name}.webp`)));
      expect(info.width).toBe(1024);
      expect(info.height).toBe(1024);
      expect(info.hasAlphaFlag).toBe(true);
      expect(info.chunks).toContain('ALPH');
    });
  }
});
