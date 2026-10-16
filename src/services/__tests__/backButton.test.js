import { describe, it, expect } from 'vitest';
import { backAction } from '../backButton';

describe('backAction (Android Back)', () => {
  it('closes an open parent gate first, whatever view is behind it', () => {
    for (const currentView of ['skills', 'quiz', 'parent']) {
      expect(backAction({ isGateOpen: true, currentView })).toBe('close-gate');
    }
  });
  it('leaves a quiz or the parent zone for the skill list', () => {
    expect(backAction({ isGateOpen: false, currentView: 'quiz' })).toBe('go-skills');
    expect(backAction({ isGateOpen: false, currentView: 'parent' })).toBe('go-skills');
  });
  it('exits the app from the skill list', () => {
    expect(backAction({ isGateOpen: false, currentView: 'skills' })).toBe('exit');
  });
});
