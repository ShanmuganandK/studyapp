// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import PrivacyPolicy from '../PrivacyPolicy';
import ParentDashboard from '../ParentDashboard';
import { PRIVACY_POLICY, SECTIONS } from '../../config/privacyPolicy';

// Mascot preloads webp assets — irrelevant here; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

/**
 * The in-app policy is a Designed-for-Families requirement (the policy must be reachable from
 * inside the app, not only from the store listing), so its reachability is asserted, not
 * assumed: the parent zone must offer a route to it, and that route must render the real text.
 */

const baseProps = {
  onSetPasscode: () => {},
  onRemovePasscode: () => {},
  hasPasscode: false,
  userEmail: null,
};

describe('PrivacyPolicy — renders the full policy from the source of truth', () => {
  afterEach(cleanup);

  it('shows the title and last-updated date', () => {
    render(<PrivacyPolicy onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: PRIVACY_POLICY.title })).toBeTruthy();
    expect(screen.getByText(new RegExp(PRIVACY_POLICY.lastUpdated))).toBeTruthy();
  });

  it('renders every section heading', () => {
    render(<PrivacyPolicy onBack={() => {}} />);
    for (const section of SECTIONS.filter((s) => s.heading)) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeTruthy();
    }
  });

  it('links the contact address as mailto', () => {
    render(<PrivacyPolicy onBack={() => {}} />);
    const link = screen.getByRole('link', { name: PRIVACY_POLICY.contactEmail });
    expect(link.getAttribute('href')).toBe(`mailto:${PRIVACY_POLICY.contactEmail}`);
  });

  it('calls onBack from the Back control', () => {
    const onBack = vi.fn();
    render(<PrivacyPolicy onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('parent zone — the policy is reachable in-app', () => {
  afterEach(cleanup);

  it('offers a link to the full policy and opens it', () => {
    render(<ParentDashboard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Read the full privacy policy/ }));

    expect(screen.getByRole('heading', { level: 1, name: PRIVACY_POLICY.title })).toBeTruthy();
  });

  it('returns to the dashboard from the policy', () => {
    render(<ParentDashboard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Read the full privacy policy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));

    expect(screen.getByRole('button', { name: /Set Parent Passcode/ })).toBeTruthy();
  });
});
