/**
 * Skill-map validity tests (skill-map-spec.md).
 *
 * The graph must be sound — a broken prereq, a cycle, a duplicate order, or a `status:'ready'`
 * skill with no recipe would silently break the session composer. Plus light unit coverage of
 * the pure helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  SKILLS,
  MASTERY_THRESHOLD,
  getSkill,
  prereqsMet,
  unlockedSkills,
  frontierSkill,
  nextSkills,
} from '../skillMap';

// Recipe files that actually exist today, discovered dynamically so this stays honest as the
// factory adds recipes. `_rng` and `skillMap` are infrastructure, not recipes.
const NON_RECIPE_MODULES = new Set(['_rng', 'skillMap']);
const existingRecipes = new Set(
  Object.keys(import.meta.glob('../*.js'))
    .map((path) => path.split('/').pop().replace(/\.js$/, ''))
    .filter((name) => !NON_RECIPE_MODULES.has(name)),
);

const allSkills = Object.values(SKILLS);

describe('skill map — data integrity', () => {
  it('keys every entry by its own id', () => {
    Object.entries(SKILLS).forEach(([key, s]) => expect(s.id).toBe(key));
  });

  it('has well-formed required fields on every skill', () => {
    allSkills.forEach((s) => {
      expect(typeof s.name).toBe('string');
      expect([1, 2]).toContain(s.grade);
      expect(typeof s.strand).toBe('string');
      expect(typeof s.order).toBe('number');
      expect(s.maxDifficulty).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(s.prereqs)).toBe(true);
      expect(typeof s.recipe).toBe('string');
      expect(['ready', 'planned']).toContain(s.status);
    });
  });
});

describe('skill map — graph validity', () => {
  it('references only prereqs that exist in SKILLS', () => {
    allSkills.forEach((s) => {
      s.prereqs.forEach((p) =>
        expect(SKILLS[p], `${s.id} -> missing prereq ${p}`).toBeDefined(),
      );
    });
  });

  it('has no prerequisite cycles', () => {
    const WHITE = 0;
    const GREY = 1;
    const BLACK = 2;
    const color = new Map(allSkills.map((s) => [s.id, WHITE]));

    const visit = (id, trail) => {
      color.set(id, GREY);
      for (const p of SKILLS[id].prereqs) {
        if (color.get(p) === GREY) {
          throw new Error(`Cycle detected: ${[...trail, id, p].join(' -> ')}`);
        }
        if (color.get(p) === WHITE) visit(p, [...trail, id]);
      }
      color.set(id, BLACK);
    };

    expect(() => allSkills.forEach((s) => color.get(s.id) === WHITE && visit(s.id, []))).not.toThrow();
  });

  it('has unique order values within each grade', () => {
    const seen = {};
    allSkills.forEach((s) => {
      seen[s.grade] ??= new Set();
      expect(seen[s.grade].has(s.order), `duplicate order ${s.order} in grade ${s.grade}`).toBe(false);
      seen[s.grade].add(s.order);
    });
  });

  it('references a recipe that either exists or is marked planned', () => {
    allSkills.forEach((s) => {
      const ok = existingRecipes.has(s.recipe) || s.status === 'planned';
      expect(ok, `${s.id} -> recipe '${s.recipe}' missing and not planned`).toBe(true);
    });
  });

  it('backs every ready skill with an existing recipe file', () => {
    allSkills
      .filter((s) => s.status === 'ready')
      .forEach((s) =>
        expect(existingRecipes.has(s.recipe), `ready skill ${s.id} has no recipe file '${s.recipe}'`).toBe(true),
      );
  });

  it('marks exactly the built foundational skills ready', () => {
    const ready = allSkills.filter((s) => s.status === 'ready').map((s) => s.id).sort();
    expect(ready).toEqual([
      'g1.add.within20',
      'g1.count.1-20',
      'g1.count.1-9',
      'g1.num.compare20',
      'g1.sub.within10',
      'g1.sub.within20',
    ]);
  });
});

describe('skill map — helpers', () => {
  const mastered = (...ids) => Object.fromEntries(ids.map((id) => [id, MASTERY_THRESHOLD]));

  it('getSkill returns the entry or throws on unknown id', () => {
    expect(getSkill('g1.count.1-9').name).toBe('Counting & numbers 1–9');
    expect(() => getSkill('g9.nope')).toThrow(/Unknown skillId/);
  });

  it('prereqsMet is true with no prereqs, and gated by the threshold', () => {
    expect(prereqsMet('g1.count.1-9', {})).toBe(true); // no prereqs
    expect(prereqsMet('g1.add.within20', {})).toBe(false); // needs within10
    expect(prereqsMet('g1.add.within20', { 'g1.add.within10': MASTERY_THRESHOLD })).toBe(true);
    expect(prereqsMet('g1.add.within20', { 'g1.add.within10': MASTERY_THRESHOLD - 1 })).toBe(false);
  });

  it('unlockedSkills excludes mastered skills and those with unmet prereqs', () => {
    const unlocked = unlockedSkills(mastered('g1.count.1-9')).map((s) => s.id);
    // g1.count.1-9 mastered -> excluded; its dependant g1.count.1-20 now unlocked.
    expect(unlocked).not.toContain('g1.count.1-9');
    expect(unlocked).toContain('g1.count.1-20');
    // g1.add.within20 still locked (within10 not mastered).
    expect(unlocked).not.toContain('g1.add.within20');
  });

  it('frontierSkill returns the lowest-order unlocked skill for the grade', () => {
    // Empty mastery: lowest-order grade-1 skill with no prereqs is order 10.
    expect(frontierSkill({}, 1).id).toBe('g1.prenum.compare');
    // No grade-3 skills exist.
    expect(frontierSkill({}, 3)).toBeNull();
  });

  it('nextSkills lists skills that depend on the given id', () => {
    expect(nextSkills('g1.count.1-9').map((s) => s.id)).toContain('g1.count.1-20');
    expect(nextSkills('g1.add.within10').map((s) => s.id)).toEqual(['g1.add.within20']);
    // A leaf skill nothing depends on.
    expect(nextSkills('g2.money.amounts')).toEqual([]);
  });
});
