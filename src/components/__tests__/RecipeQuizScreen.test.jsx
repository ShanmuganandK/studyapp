// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const sessionPlayerSpy = vi.fn();
vi.mock('../SessionPlayer', () => ({
  default: (props) => {
    sessionPlayerSpy(props);
    return (
      <div>
        <span data-testid="skill">{props.skillId}</span>
        <span data-testid="grade">{props.grade}</span>
        <span data-testid="bridge">{String(props.bridgeEnabled)}</span>
        <button onClick={props.onExit}>exit</button>
        <button onClick={() => props.onSessionComplete?.(true)}>complete</button>
      </div>
    );
  },
}));

import RecipeQuizScreen from '../RecipeQuizScreen';

describe('RecipeQuizScreen', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('forwards grade, skillId, bridgeEnabled, onBack→onExit, and onSessionComplete to SessionPlayer', () => {
    const onBack = vi.fn();
    const onSessionComplete = vi.fn();

    render(
      <RecipeQuizScreen
        grade={2}
        skillId="g2.add.2d-carry"
        bridgeEnabled
        onBack={onBack}
        onSessionComplete={onSessionComplete}
      />,
    );

    expect(screen.getByTestId('skill').textContent).toBe('g2.add.2d-carry');
    expect(screen.getByTestId('grade').textContent).toBe('2');
    expect(screen.getByTestId('bridge').textContent).toBe('true');

    fireEvent.click(screen.getByText('exit'));
    expect(onBack).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText('complete'));
    expect(onSessionComplete).toHaveBeenCalledWith(true);
  });
});
