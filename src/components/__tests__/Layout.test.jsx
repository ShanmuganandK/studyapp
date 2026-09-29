// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Layout from '../Layout';

/**
 * Offline banner text guard. The original copy ("Progress saves when you reconnect")
 * implied saving was gated on reconnecting to a server — wrong for this MVP, where
 * progressStore writes to localStorage on session complete unconditionally and nothing
 * ever syncs (STANDARDS §2). Locks the corrected wording and the absence of any
 * sync/reconnect/upload claim, so a future edit can't reintroduce that implication.
 */

let isOnline;
vi.mock('../../hooks/useOnline', () => ({
  default: () => isOnline,
}));

afterEach(() => {
  cleanup();
});

function renderLayout() {
  return render(
    <Layout currentView="skills" onNavigate={() => {}}>
      <div>content</div>
    </Layout>,
  );
}

describe('Layout offline banner', () => {
  it('renders the corrected banner text while offline', () => {
    isOnline = false;
    renderLayout();
    expect(
      screen.getByText("You're offline — Tinku can still play! Progress is saved on this device."),
    ).toBeTruthy();
  });

  it('never shows a sync/reconnect/upload claim', () => {
    isOnline = false;
    renderLayout();
    const banner = screen.getByRole('status');
    expect(banner.textContent).not.toMatch(/reconnect|sync|upload|cloud|server/i);
  });

  it('renders no banner while online', () => {
    isOnline = true;
    renderLayout();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
