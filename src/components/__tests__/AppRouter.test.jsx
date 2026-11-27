// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const authState = {
  user: null,
  currentProfile: null,
  parentSettings: { passcodeHash: null },
  clearPasscode: vi.fn(),
};
vi.mock('../../contexts/useAuth', () => ({ useAuth: () => authState }));

const settingsState = {
  theme: 'wonder',
  grade: 1,
  bridgeEnabled: false,
  gradeChosen: true,
  setTheme: vi.fn(),
  setGrade: vi.fn(),
  setBridgeEnabled: vi.fn(),
  chooseInitialGrade: vi.fn(),
};
vi.mock('../../hooks/useTestSettings', () => ({ default: () => settingsState }));
vi.mock('../../hooks/useAndroidBackButton', () => ({ default: vi.fn() }));

vi.mock('../Layout', () => ({
  default: ({ currentView, hideNav, onNavigate, children }) => (
    <div data-testid="layout" data-view={currentView} data-hidenav={String(!!hideNav)}>
      <button onClick={() => onNavigate('skills')}>nav-skills</button>
      <button onClick={() => onNavigate('parent')}>nav-parent</button>
      {children}
    </div>
  ),
}));
vi.mock('../GradePickerScreen', () => ({
  default: ({ onChoose }) => <button onClick={() => onChoose(2)}>pick-grade-2</button>,
}));
vi.mock('../SkillPathScreen', () => ({
  default: ({ grade, onSelectSkill, intro, onHeroChange }) => (
    <div>
      <button data-intro={String(!!intro)} onClick={() => onSelectSkill('g1.add.within10')}>path-skill-g{grade}</button>
      <button onClick={() => onHeroChange(true)}>hero-on</button>
      <button onClick={() => onHeroChange(false)}>hero-off</button>
    </div>
  ),
}));
vi.mock('../RecipeQuizScreen', () => ({
  default: ({ skillId, grade, onBack, onSessionComplete }) => (
    <div>
      <span data-testid="quiz">{skillId}-g{grade}</span>
      <button onClick={() => onSessionComplete(true)}>finish-session</button>
      <button onClick={onBack}>back-to-skills</button>
    </div>
  ),
}));
vi.mock('../ParentGateModal', () => ({
  default: ({ isSettingMode, onClose, onSuccess }) => (
    <div data-testid="gate" data-setting={String(isSettingMode)}>
      <button onClick={onSuccess}>gate-pass</button>
      <button onClick={onClose}>gate-close</button>
    </div>
  ),
}));
vi.mock('../ParentDashboard', () => ({
  default: ({ onSetPasscode, onRemovePasscode }) => (
    <div data-testid="parent-dashboard">
      <button onClick={onSetPasscode}>open-set-passcode</button>
      <button onClick={onRemovePasscode}>remove-passcode</button>
    </div>
  ),
}));

import AppRouter from '../AppRouter';

describe('AppRouter routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsState.gradeChosen = true;
    settingsState.grade = 1;
  });
  afterEach(cleanup);

  it('shows GradePickerScreen on first launch when gradeChosen is false', () => {
    settingsState.gradeChosen = false;
    render(<AppRouter />);
    fireEvent.click(screen.getByText('pick-grade-2'));
    expect(settingsState.chooseInitialGrade).toHaveBeenCalledWith(2);
    expect(screen.queryByTestId('layout')).toBeNull();
  });

  it('routes from skills → quiz (hiding bottom nav until summary) → back to skills', () => {
    render(<AppRouter />);
    const layout = screen.getByTestId('layout');
    expect(layout.dataset.view).toBe('skills');
    expect(layout.dataset.hidenav).toBe('false');

    fireEvent.click(screen.getByText('path-skill-g1'));
    expect(screen.getByTestId('quiz').textContent).toBe('g1.add.within10-g1');
    expect(screen.getByTestId('layout').dataset.hidenav).toBe('true');

    fireEvent.click(screen.getByText('finish-session'));
    expect(screen.getByTestId('layout').dataset.hidenav).toBe('false');

    fireEvent.click(screen.getByText('back-to-skills'));
    expect(screen.getByTestId('layout').dataset.view).toBe('skills');
    expect(screen.queryByTestId('quiz')).toBeNull();
  });

  it('gates ParentDashboard behind ParentGateModal and opens setting mode from dashboard', () => {
    render(<AppRouter />);

    fireEvent.click(screen.getByText('nav-parent'));
    expect(screen.getByTestId('gate').dataset.setting).toBe('false');
    expect(screen.queryByTestId('parent-dashboard')).toBeNull();

    fireEvent.click(screen.getByText('gate-pass'));
    expect(screen.getByTestId('parent-dashboard')).toBeTruthy();
    expect(screen.getByTestId('layout').dataset.view).toBe('parent');

    fireEvent.click(screen.getByText('open-set-passcode'));
    expect(screen.getByTestId('gate').dataset.setting).toBe('true');

    fireEvent.click(screen.getByText('gate-close'));
    expect(screen.queryByTestId('gate')).toBeNull();

    fireEvent.click(screen.getByText('nav-skills'));
    expect(screen.getByTestId('layout').dataset.view).toBe('skills');
  });

  // Hero intro (ROADMAP F6, 2026-11-27): only the first Home of each app open.
  const intro = () => screen.getByText(/path-skill-g/).dataset.intro;

  it('the first Home of an app open gets the hero intro; Home after a quiz or the parent zone does not', () => {
    render(<AppRouter />);
    expect(intro()).toBe('true');
    fireEvent.click(screen.getByText('path-skill-g1'));
    fireEvent.click(screen.getByText('back-to-skills'));
    expect(intro()).toBe('false');
    cleanup();

    render(<AppRouter />);
    fireEvent.click(screen.getByText('nav-parent'));
    fireEvent.click(screen.getByText('gate-pass'));
    fireEvent.click(screen.getByText('nav-skills'));
    expect(intro()).toBe('false');
  });

  it('hides the bottom bar while the hero shows (full-screen Tinku), and brings it back after', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('layout').dataset.hidenav).toBe('false');
    fireEvent.click(screen.getByText('hero-on'));
    expect(screen.getByTestId('layout').dataset.hidenav).toBe('true');
    fireEvent.click(screen.getByText('hero-off'));
    expect(screen.getByTestId('layout').dataset.hidenav).toBe('false');
  });

  it('no hero intro right after the first-run class picker (it already shows big Tinku)', () => {
    settingsState.gradeChosen = false;
    const { rerender } = render(<AppRouter />);
    fireEvent.click(screen.getByText('pick-grade-2'));
    settingsState.gradeChosen = true;
    rerender(<AppRouter />);
    expect(intro()).toBe('false');
  });
});
