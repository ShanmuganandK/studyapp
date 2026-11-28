// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import WonderBackdrop from '../WonderBackdrop';

describe('WonderBackdrop — token & layout invariants (F6)', () => {
  afterEach(cleanup);

  it('uses only structural and --color-illo-* tokens — never raw hex, semantic UI tokens, or ⭐ stars', () => {
    const { container } = render(<WonderBackdrop />);
    const root = container.querySelector('[data-testid="wonder-backdrop"]');
    expect(root).toBeTruthy();
    expect(root.getAttribute('aria-hidden')).toBe('true');

    const html = root.innerHTML;
    expect(html).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(html).not.toMatch(/var\(--color-(accent|success|encourage|learn|review)\b/);
    expect(html).not.toContain('⭐');
  });

  it('contains no <p> or <img> elements so GradePickerScreen container layout checks measure only Tinku and copy', () => {
    const { container } = render(<WonderBackdrop />);
    expect(container.querySelectorAll('p, img')).toHaveLength(0);
  });
});
