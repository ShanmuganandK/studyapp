import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the Android build workflow can never leak or misuse the Play upload key (DECISIONS 2026-10-16).
 * Reads `.github/workflows/android.yml` as text (no YAML dependency, nothing to install).
 *
 * A signing key that reaches a pull request, a log, or a third-party action is the one mistake in this
 * pipeline that cannot be undone quietly, so each way it could happen is asserted shut here:
 *   - the only automatic trigger is a push to master; nothing a PR, fork or other branch does can start it,
 *     and the release job (the only one that touches secrets) runs only for a hand-started release;
 *   - the token is read-only;
 *   - the secrets live on the `android-release` environment and are referenced only by the release job;
 *   - a secret is only ever passed through an `env:` entry, never interpolated into a shell command;
 *   - only first-party / named actions run, and the measured-permission allow-list stays tight.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const yml = readFileSync(join(ROOT, '.github', 'workflows', 'android.yml'), 'utf8');
const lines = yml.split('\n');
const between = (from, to) => yml.slice(yml.indexOf(from), yml.indexOf(to));

describe('android.yml', () => {
  it('auto-runs only on a push to master, otherwise by hand; never from a PR, fork, schedule or comment', () => {
    const triggers = between('\non:', '\npermissions:');
    expect(triggers).toMatch(/workflow_dispatch:/);
    expect(triggers).toMatch(/\n {2}push:\n {4}branches: \[master\]\n/);
    for (const bad of ['pull_request', 'pull_request_target', 'schedule:', 'workflow_run', 'issue_comment', 'tags:']) {
      expect(triggers, `trigger ${bad}`).not.toContain(bad);
    }
  });

  it('builds the release only for a hand-started release run, never for a push', () => {
    const release = yml.slice(yml.indexOf('\n  release:'));
    expect(release).toMatch(/\n {4}if: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.build_type == 'release' \}\}\n/);
  });

  it('builds with the JDK Capacitor 8 needs (21), in both jobs', () => {
    const versions = [...yml.matchAll(/java-version: '(\d+)'/g)].map((m) => m[1]);
    expect(versions).toEqual(['21', '21']);
  });

  it('gives the token read-only access to contents', () => {
    expect(between('\npermissions:', '\nenv:').replace(/\s+/g, ' ').trim()).toBe('permissions: contents: read');
  });

  it('runs the release job in the android-release environment', () => {
    const release = yml.slice(yml.indexOf('\n  release:'));
    expect(release).toMatch(/\n {4}environment: android-release\n/);
  });

  it('references secrets only in the release job, and only through env entries', () => {
    const releaseStart = lines.findIndex((l) => l === '  release:');
    lines.forEach((l, i) => {
      if (!l.includes('secrets.')) return;
      expect(i, `secret used outside the release job: ${l.trim()}`).toBeGreaterThan(releaseStart);
      expect(l, `secret interpolated outside an env entry: ${l.trim()}`).toMatch(
        /^\s+[A-Z0-9_]+:\s+\$\{\{ secrets\.[A-Z0-9_]+ \}\}$/,
      );
    });
    expect(yml.match(/secrets\./g)?.length).toBe(4);
  });

  it('never echoes a secret or turns on shell tracing', () => {
    expect(yml).not.toMatch(/set -x|set -o xtrace|ACTIONS_STEP_DEBUG/);
    expect(yml).not.toMatch(/echo[^\n]*\$\{\{ secrets/);
  });

  it('removes the decoded key even if the build fails', () => {
    expect(yml).toMatch(/- name: Remove the decoded key\n\s+if: always\(\)\n\s+run: rm -f/);
  });

  it('uses only the expected actions', () => {
    const used = [...yml.matchAll(/uses:\s*([^\s@]+)@/g)].map((m) => m[1]);
    const allowed = new Set([
      'actions/checkout', 'actions/setup-node', 'actions/setup-java', 'actions/upload-artifact',
      'gradle/actions/setup-gradle',
    ]);
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
    expect(used.length).toBeGreaterThan(0);
  });

  it('allows exactly one merged-manifest permission, and it is not a network or device one', () => {
    const allowed = yml.match(/ALLOWED_PERMISSION:\s*(\S+)/)[1];
    expect(allowed).toBe('com.stringus.tinku.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION');
    expect(allowed).not.toMatch(/INTERNET|STORAGE|LOCATION|CAMERA|CONTACTS|RECORD_AUDIO/);
  });

  it('turns the tester tools on for the debug APK only, never the release bundle (DECISIONS 2026-10-20)', () => {
    const release = yml.slice(yml.indexOf('\n  release:'));
    expect(yml.slice(0, yml.indexOf('\n  release:'))).toMatch(/VITE_TESTER_TOOLS: 'true'/);
    expect(release).not.toContain('VITE_TESTER_TOOLS');
  });
});
