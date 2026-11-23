// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SKILLS } from '../../recipes/skillMap';
import SkillIcon from '../SkillIcon';

describe('SkillIcon — custom Tinku SVG icon set (DS-6)', () => {
  afterEach(cleanup);

  const readyIds = Object.values(SKILLS)
    .filter((s) => s.status === 'ready')
    .map((s) => s.id)
    .sort();

  it('covers all 36 ready skills with distinct, token-styled SVG illustrations', () => {
    expect(readyIds).toHaveLength(36);
    const markups = new Set();
    for (const id of readyIds) {
      const { container } = render(<SkillIcon skillId={id} />);
      const svg = container.querySelector(`svg[data-skill-icon="${id}"]`);
      expect(svg, `missing SVG for ${id}`).toBeTruthy();
      expect(svg.innerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
      markups.add(svg.innerHTML);
      cleanup();
    }
    expect(markups.size).toBe(readyIds.length);
  });

  it('never borrows a semantic UI colour: fills come from the illustration palette only', () => {
    // amber = reward ONLY, green = correct, coral = wrong, sky = hint, teal = review (AGENTS.md §4).
    // Icons sit beside amber mastery rings, so an amber crown or medal on an unmastered skill blurs "earned".
    const SEMANTIC = /var\(--color-(accent|success|encourage|learn|review)\b/;
    for (const id of readyIds) {
      const { container } = render(<SkillIcon skillId={id} />);
      const svg = container.querySelector(`svg[data-skill-icon="${id}"]`);
      expect(svg.innerHTML, `${id} uses a semantic UI colour`).not.toMatch(SEMANTIC);
      cleanup();
    }
  });
});
