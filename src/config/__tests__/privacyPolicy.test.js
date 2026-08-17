import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRIVACY_POLICY, SECTIONS, OPERATOR_LINE, linkifyEmailParts } from '../privacyPolicy';
import { renderPrivacyHtml } from '../../../scripts/build-privacy-page.mjs';

/**
 * Guard: the published privacy policy cannot drift, and cannot contradict itself.
 *
 * The policy exists in two places — the hosted page linked from the Play listing
 * (`public/privacy.html`) and the in-app copy in the parent zone. Both render from
 * `config/privacyPolicy.js`, but the hosted page is a GENERATED artefact committed to the repo,
 * so it can go stale the moment someone edits the words without rerunning the generator. That
 * is exactly the failure this repo keeps finding by hand: a claim that used to be true.
 *
 * Layers:
 *   1. the committed HTML is byte-identical to what the current text generates;
 *   2. the page is self-contained — a policy asserting "no network calls" must not make any;
 *   3. the DECISIONS 2026-08-14 wording constraints still hold (store/hosting line present,
 *      absolute "we collect no personal data" claim absent).
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PAGE_PATH = join(REPO_ROOT, 'public', 'privacy.html');

const page = existsSync(PAGE_PATH) ? readFileSync(PAGE_PATH, 'utf8') : null;

describe('privacy policy — hosted page stays in sync with the source of truth', () => {
  it('public/privacy.html exists (Play requires a reachable policy URL)', () => {
    expect(page).not.toBeNull();
  });

  it('is byte-identical to the generator output', () => {
    // Fails when the policy text changed but `npm run privacy:build` was not rerun.
    expect(page).toBe(renderPrivacyHtml());
  });

  it('contains every paragraph of every section', () => {
    for (const section of SECTIONS) {
      if (section.heading) expect(page).toContain(section.heading);
      for (const paragraph of section.paragraphs) {
        // The generator escapes `&`/`<`/`>`/`"` and wraps the contact address in a mailto
        // link, so assert on the paragraph minus its email — the link itself is covered below.
        const [prefix] = paragraph.split(PRIVACY_POLICY.contactEmail);
        expect(page).toContain(prefix);
      }
    }
  });

  it('shows the last-updated date', () => {
    expect(page).toContain(PRIVACY_POLICY.lastUpdated);
  });

  it('links the contact address as mailto', () => {
    expect(page).toContain(`mailto:${PRIVACY_POLICY.contactEmail}`);
  });
});

describe('privacy policy — the page is self-contained', () => {
  it('references no external host', () => {
    // A policy page that pulls a webfont or a stylesheet from a CDN contradicts its own text
    // in the reader's devtools. Everything must be inline or same-origin.
    const externalRefs = page.match(/(?:https?:)?\/\/[a-z0-9-]+\.[a-z]/gi) ?? [];
    expect(externalRefs).toEqual([]);
  });

  it('runs no script', () => {
    expect(page).not.toMatch(/<script/i);
    expect(page).not.toMatch(/\son[a-z]+\s*=/i); // inline event handlers
  });

  it('loads no remote asset', () => {
    // Only same-origin, root-relative asset references are allowed (the favicon).
    const hrefsAndSrcs = [...page.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
    for (const ref of hrefsAndSrcs) {
      const sameOriginOrMailto = ref.startsWith('/') || ref.startsWith('#') || ref.startsWith('mailto:');
      expect({ ref, sameOriginOrMailto }).toEqual({ ref, sameOriginOrMailto: true });
    }
  });
});

describe('privacy policy — DECISIONS 2026-08-14 wording constraints', () => {
  const allText = SECTIONS.flatMap((s) => s.paragraphs).join(' ');

  it('keeps the store/hosting technical-data line', () => {
    // Play Console vitals and Netlify request logs are real and outside our control. Dropping
    // this section is what would make the rest of the policy untrue.
    const technical = SECTIONS.find((s) => s.id === 'technical');
    expect(technical).toBeDefined();
    expect(technical.paragraphs.join(' ')).toMatch(/hosting provider and the app store/);
  });

  it('does not make the rejected absolute claim', () => {
    expect(allText.toLowerCase()).not.toContain('we collect no personal data');
    expect(allText.toLowerCase()).not.toContain('we do not collect any data');
  });

  it('publishes no legal conclusion about parental consent', () => {
    // The policy once read "...no parental consent is required for the app to work." That is a
    // LEGAL CONCLUSION on a question no lawyer has answered for us — open in
    // `questionnaire-lawyer-dpdp.md` Section B, consult deferred (DECISIONS 2026-08-14). Measured
    // facts about the build are ours to publish; what a law requires is not.
    //
    // This may only return alongside a DECISIONS entry recording a HUMAN legal opinion that says
    // so. Deleting this assertion is not that entry.
    expect(allText.toLowerCase()).not.toContain('no parental consent is required');
    expect(allText.toLowerCase()).not.toContain('parental consent is not required');
    expect(allText.toLowerCase()).not.toContain('no parental consent is needed');
  });

  it('now promises the shipped progress export/backup (TRACKER "Now" #3, DECISIONS 2026-08-17)', () => {
    // This assertion is the inverse of what shipped before export/import existed — flipped,
    // not deleted, in the same commit as the feature. A deleted guard is a hole; the
    // both-directions pattern below (OPERATOR_LINE) is the standing form.
    expect(allText.toLowerCase()).toContain('backup');
  });

  it('states the app-side claim flatly (no accounts, no tracking)', () => {
    expect(allText).toMatch(/no sign-up and no accounts/);
    expect(allText).toMatch(/advertising, analytics, tracking/);
  });
});

describe('privacy policy — operator identity', () => {
  /**
   * Asserted in BOTH directions so this test never has to be edited when the value is filled in:
   * while OPERATOR_LINE is blank the policy must name nobody and the TODO must survive; the moment
   * it is set, the line must actually reach both published surfaces.
   *
   * The blank case is the dangerous one. "We" throughout a policy with no named party is a
   * transparency gap Play and DPDP both expect closed, and it is invisible — nothing breaks, no
   * reviewer comment appears until submission. So the reminder itself is guarded.
   */
  const source = readFileSync(join(REPO_ROOT, 'src', 'config', 'privacyPolicy.js'), 'utf8');

  if (OPERATOR_LINE) {
    it('renders the operator line in the policy sections', () => {
      const allText = SECTIONS.flatMap((s) => s.paragraphs).join(' ');
      expect(allText).toContain(OPERATOR_LINE);
    });

    it('renders the operator line on the hosted page', () => {
      expect(page).toContain(OPERATOR_LINE);
    });
  } else {
    it('names no operator while OPERATOR_LINE is blank', () => {
      const allText = SECTIONS.flatMap((s) => s.paragraphs).join(' ').toLowerCase();
      expect(allText).not.toContain('operated by');
    });

    it('keeps the TODO so the gap cannot be quietly forgotten', () => {
      // Deleting the reminder without supplying a value fails here. Gated on the pre-launch
      // checklist row "Developer / publisher name"; must match the Play developer name.
      expect(source).toContain('TODO(operator)');
    });
  }
});

describe('linkifyEmailParts', () => {
  it('splits a paragraph around the contact address', () => {
    expect(linkifyEmailParts('write to a@b.c today', 'a@b.c')).toEqual([
      { type: 'text', value: 'write to ' },
      { type: 'email', value: 'a@b.c' },
      { type: 'text', value: ' today' },
    ]);
  });

  it('returns a single text part when the address is absent', () => {
    expect(linkifyEmailParts('no address here', 'a@b.c')).toEqual([
      { type: 'text', value: 'no address here' },
    ]);
  });

  it('handles the address at the very start', () => {
    expect(linkifyEmailParts('a@b.c — we reply', 'a@b.c')).toEqual([
      { type: 'email', value: 'a@b.c' },
      { type: 'text', value: ' — we reply' },
    ]);
  });
});
