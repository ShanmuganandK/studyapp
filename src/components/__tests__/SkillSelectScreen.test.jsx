// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { readySkills } from '../../engine/sessionLite';
import { saveSkillState } from '../../services/progressStore';
import { emptySkillState } from '../../engine/mastery';

vi.mock('../Mascot', () => ({ default: () => <div data-testid="mascot" /> }));

import SkillSelectScreen from '../SkillSelectScreen';

describe('SkillSelectScreen', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('renders ready skills for the selected grade and calls onSelectSkill on tap', () => {
    const onSelectSkill = vi.fn();
    saveSkillState('g1.add.within10', emptySkillState('g1.add.within10', 3));

    render(<SkillSelectScreen grade={1} onSelectSkill={onSelectSkill} />);
    expect(screen.getByText('What shall we practise?')).toBeTruthy();
    expect(screen.getByText(/Safe & private by design\./)).toBeTruthy();

    const g1Skills = readySkills(1);
    const first = g1Skills[0];
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(g1Skills.length);

    const targetBtn = buttons.find((b) => b.textContent.includes(first.displayName ?? first.name));
    expect(targetBtn).toBeTruthy();
    fireEvent.click(targetBtn);
    expect(onSelectSkill).toHaveBeenCalledWith(first.id);
  });
});
