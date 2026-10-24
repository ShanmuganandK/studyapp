import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { feedbackMailtoUrl } from '../constants';
import { CONTACT_EMAIL } from '../privacyPolicy';

/**
 * The parent-zone feedback link is an email to the PUBLISHED contact address, never a phone number or a messenger
 * link (founder, DECISIONS 2026-10-22: the founder's personal number must not be exposed). This guard is what keeps
 * a personal number from creeping back into anything that ships.
 */
describe('feedback link', () => {
  it('is a mailto to the published contact address with a subject, and nothing else', () => {
    const url = feedbackMailtoUrl();
    expect(url).toBe(`mailto:${CONTACT_EMAIL}?subject=Tinku%20Math%20feedback`);
    expect(CONTACT_EMAIL).toBe('tinku@stringus.com');
  });

  it('no shipped source holds a messenger link or a bare phone number', () => {
    const roots = ['src', 'public'];
    const offenders = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) { walk(path); continue; }
        if (!/\.(jsx?|html|json|css|webmanifest)$/.test(name) || /\.test\./.test(name)) continue;
        const text = readFileSync(path, 'utf8');
        if (/wa\.me|api\.whatsapp|whatsapp:\/\//i.test(text)) offenders.push(`${path}: messenger link`);
        if (/\b(?:\+?91)?[6-9]\d{9}\b/.test(text.replace(/\d{10,}\.\d+/g, ''))) offenders.push(`${path}: looks like a phone number`);
      }
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});
