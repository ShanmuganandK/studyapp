import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHORT_NAME } from '../../config/brand.js';

/**
 * Guard: the Android project keeps the promises the privacy policy makes (DECISIONS 2026-10-15).
 * Reads the committed `android/` project and `capacitor.config.json` — no Android SDK needed.
 *
 * What a reviewer of the Play listing / Data Safety form would otherwise have to take on trust:
 *   - the app asks the OS for NO permissions (so it cannot reach the network at all);
 *   - nothing loads remote code or a remote URL (no `server.url`, no cleartext);
 *   - only the app's private cache can be handed to the share sheet;
 *   - automatic backup is ON on purpose (founder decision), with explicit rules, and the cache is
 *     never part of it;
 *   - it targets the API level new Play apps require, and no signing secret is committed.
 *
 * Changing any of these is a deliberate edit HERE plus a DECISIONS entry — never a drive-by.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ANDROID = join(ROOT, 'android');
const MAIN = join(ANDROID, 'app', 'src', 'main');
const read = (p) => readFileSync(p, 'utf8');

// Removes XML comments with a plain scan (no regex replace), so a manifest comment can never hide or
// fake an attribute in these assertions. An unterminated comment drops the rest of the file.
function stripXmlComments(xml) {
  let out = '';
  let i = 0;
  for (;;) {
    const start = xml.indexOf('<!--', i);
    if (start === -1) return out + xml.slice(i);
    out += xml.slice(i, start);
    const end = xml.indexOf('-->', start + 4);
    if (end === -1) return out;
    i = end + 3;
  }
}

const EXPECTED_APP_ID = 'com.stringus.tinku';
const ALLOWED_PERMISSIONS = []; // UNVERIFIED on a device; see the comment in AndroidManifest.xml
const REQUIRED_TARGET_SDK = 36;

describe('capacitor.config.json', () => {
  const config = JSON.parse(read(join(ROOT, 'capacitor.config.json')));

  it('has the permanent app id and the brand name', () => {
    expect(config.appId).toBe(EXPECTED_APP_ID);
    expect(config.appName).toBe(SHORT_NAME);
  });
  it('bundles the dedicated Android build and never loads a remote URL', () => {
    expect(config.webDir).toBe('dist-android');
    expect(config.server).toBeUndefined();
    expect(config.android?.allowMixedContent).toBe(false);
  });
});

describe('AndroidManifest.xml', () => {
  const manifest = read(join(MAIN, 'AndroidManifest.xml'));
  const noComments = stripXmlComments(manifest);

  it('requests exactly the allow-listed permissions', () => {
    const declared = [...noComments.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map((m) => m[1]);
    expect(declared.sort()).toEqual([...ALLOWED_PERMISSIONS].sort());
  });
  it('forbids cleartext traffic and is not debuggable', () => {
    expect(noComments).toMatch(/android:usesCleartextTraffic="false"/);
    expect(noComments).not.toMatch(/android:debuggable/);
  });
  it('has automatic backup ON with explicit rules (founder decision 2026-10-15)', () => {
    expect(noComments).toMatch(/android:allowBackup="true"/);
    expect(noComments).toMatch(/android:dataExtractionRules="@xml\/data_extraction_rules"/);
    expect(noComments).toMatch(/android:fullBackupContent="@xml\/backup_rules"/);
    for (const f of ['data_extraction_rules.xml', 'backup_rules.xml']) {
      expect(read(join(MAIN, 'res', 'xml', f))).toMatch(/exclude domain="root" path="cache"/);
    }
  });
  it('exports only the launcher activity', () => {
    const exported = [...noComments.matchAll(/<(activity|service|receiver|provider)\b[^>]*android:exported="true"/g)];
    expect(exported.map((m) => m[1])).toEqual(['activity']);
  });
  it('shares only the private cache through the FileProvider', () => {
    const paths = stripXmlComments(read(join(MAIN, 'res', 'xml', 'file_paths.xml')));
    const entries = [...paths.matchAll(/<([a-z-]+-path)\b/g)].map((m) => m[1]);
    expect(entries).toEqual(['cache-path']);
  });
});

describe('Gradle + repo hygiene', () => {
  it('uses the permanent applicationId and targets the required API level', () => {
    const app = read(join(ANDROID, 'app', 'build.gradle'));
    expect(app).toContain(`applicationId "${EXPECTED_APP_ID}"`);
    const target = Number(read(join(ANDROID, 'variables.gradle')).match(/targetSdkVersion\s*=\s*(\d+)/)[1]);
    expect(target).toBeGreaterThanOrEqual(REQUIRED_TARGET_SDK);
  });
  it('reads release signing only from the environment and never from a literal', () => {
    const app = read(join(ANDROID, 'app', 'build.gradle'));
    expect(app).toMatch(/System\.getenv\('TINKU_KEYSTORE_FILE'\)/);
    expect(app).not.toMatch(/(storePassword|keyPassword|keyAlias)\s+['"]/);
  });
  it('pulls in no Google services / Firebase Gradle plugin', () => {
    expect(read(join(ANDROID, 'build.gradle'))).not.toMatch(/google-services|firebase/i);
    expect(read(join(ANDROID, 'app', 'build.gradle'))).not.toMatch(/google-services|firebase/i);
  });
  it('commits no keystore or signing secret', () => {
    const walk = (d) => readdirSync(d).flatMap((n) => {
      if (n === 'node_modules' || n === 'build' || n === '.gradle') return [];
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
    const bad = walk(ANDROID).filter((f) => ['.jks', '.keystore', '.p12'].includes(extname(f)) || /keystore\.properties$/.test(f));
    expect(existsSync(ANDROID)).toBe(true);
    expect(bad).toEqual([]);
  });
});

describe('Android XML sources', () => {
  // XML forbids a double hyphen inside a comment, and only the Android resource merger (CI's
  // assembleDebug) enforces it: a "--color-x" token name in a comment broke the first real build.
  it('have no "--" inside a comment', () => {
    const walk = (d) => readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      if (n === 'build' || n === 'node_modules') return [];
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
    const bad = [];
    for (const f of walk(join(ANDROID, 'app', 'src')).filter((x) => extname(x) === '.xml')) {
      const xml = read(f);
      let i = 0;
      for (;;) {
        const start = xml.indexOf('<!--', i);
        if (start === -1) break;
        const end = xml.indexOf('-->', start + 4);
        if (end === -1) { bad.push(`${f}: unterminated comment`); break; }
        if (xml.slice(start + 4, end).includes('--')) bad.push(f);
        i = end + 3;
      }
    }
    expect(bad).toEqual([]);
  });
});
