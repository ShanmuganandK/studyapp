import { describe, it, expect, vi, beforeEach } from 'vitest';

// We reset modules before each test so each import gets a fresh module instance
// (fresh `muted = false`, fresh `audioCtx = null`). All Web API globals are stubbed
// via vi.stubGlobal — no DOM / jsdom required (environment: 'node').

function makeMockCtx() {
  const osc = {
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  return {
    currentTime: 0,
    state: 'running',
    resume: vi.fn(),
    destination: {},
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
  };
}

describe('sound service', () => {
  let setSoundMuted, isSoundMuted, playSound, haptic;
  let MockAudioContext, mockCtx, vibrateSpy;

  beforeEach(async () => {
    vi.resetModules();

    mockCtx = makeMockCtx();
    // Must use a regular function (not arrow) so `new AudioContext()` returns mockCtx.
    // Arrow functions ignore the `return` value when used as constructors in vi.fn().
    MockAudioContext = vi.fn(function () { return mockCtx; });
    vi.stubGlobal('AudioContext', MockAudioContext);

    vibrateSpy = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateSpy });

    const mod = await import('../sound.js');
    setSoundMuted = mod.setSoundMuted;
    isSoundMuted = mod.isSoundMuted;
    playSound = mod.playSound;
    haptic = mod.haptic;
  });

  // ── Mute API ──────────────────────────────────────────────────────────────────────────

  it('starts unmuted (sound ON by default)', () => {
    expect(isSoundMuted()).toBe(false);
  });

  it('setSoundMuted(true) reports muted', () => {
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
  });

  it('setSoundMuted(false) restores unmuted', () => {
    setSoundMuted(true);
    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
  });

  // ── Muted: no audio, no haptic ────────────────────────────────────────────────────────

  it('playSound does not create AudioContext when muted', () => {
    setSoundMuted(true);
    playSound('correct');
    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('playSound is silent for all events when muted', () => {
    setSoundMuted(true);
    for (const event of ['correct', 'wrong', 'tap', 'complete']) {
      playSound(event);
    }
    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('haptic does not call navigator.vibrate when muted', () => {
    setSoundMuted(true);
    haptic('light');
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  // ── Unmuted: events fire ──────────────────────────────────────────────────────────────

  it('playSound creates AudioContext when unmuted', () => {
    playSound('correct');
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('haptic calls navigator.vibrate(30) for "light" type when unmuted', () => {
    haptic('light');
    expect(vibrateSpy).toHaveBeenCalledWith(30);
  });

  it('unmuting after muting restores audio', () => {
    setSoundMuted(true);
    playSound('tap');
    setSoundMuted(false);
    playSound('tap');
    expect(MockAudioContext).toHaveBeenCalledTimes(1); // only the unmuted call
  });

  // ── Event completeness ────────────────────────────────────────────────────────────────

  it.each(['correct', 'wrong', 'tap', 'complete'])('playSound("%s") does not throw', (event) => {
    expect(() => playSound(event)).not.toThrow();
  });

  it('unknown event is silently ignored — no throw, no AudioContext', () => {
    expect(() => playSound('nonexistent')).not.toThrow();
    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('unknown haptic type is silently ignored', () => {
    expect(() => haptic('ultrashake')).not.toThrow();
  });

  // ── Note counts verify correct synthesis structure ────────────────────────────────────

  it('correct plays a 4-note bell chime with 3 oscillators per note (12 total)', () => {
    playSound('correct');
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(12);
  });

  it('complete plays a 4-note fanfare (more oscillators than a single correct note)', () => {
    playSound('complete');
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('wrong plays exactly one gentle tone (not a multi-note buzzer)', () => {
    playSound('wrong');
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('tap plays exactly one brief click', () => {
    playSound('tap');
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  // ── Resilience ────────────────────────────────────────────────────────────────────────

  it('playSound does not throw if AudioContext constructor throws', () => {
    vi.stubGlobal('AudioContext', vi.fn(function () { throw new Error('blocked'); }));
    expect(() => playSound('correct')).not.toThrow();
  });

  it('haptic does not throw if navigator.vibrate throws', () => {
    vi.stubGlobal('navigator', { vibrate: vi.fn(() => { throw new Error('unavailable'); }) });
    expect(() => haptic('light')).not.toThrow();
  });
});

// ── Audio unlock: explicit gesture-driven resume of a SUSPENDED context ────────────────────
// These exercise the path the original tests never touched: a context that starts 'suspended'
// (as mobile browsers do) being unlocked by the first user gesture — independent of whether
// the first SOUND comes from a gesture. Adds createBuffer/createBufferSource to the mock for
// the silent-buffer iOS unlock trick.

function makeSuspendedCtx() {
  const ctx = makeMockCtx();
  ctx.state = 'suspended';
  ctx.createBuffer = vi.fn(() => ({}));
  ctx.createBufferSource = vi.fn(() => ({ buffer: null, connect: vi.fn(), start: vi.fn() }));
  return ctx;
}

describe('audio unlock (gesture → resume)', () => {
  let unlockAudio, playSound;
  let MockAudioContext, mockCtx, gestureHandlers;

  beforeEach(async () => {
    vi.resetModules();

    mockCtx = makeSuspendedCtx();
    MockAudioContext = vi.fn(function () { return mockCtx; });
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    // Capture the gesture listeners the module registers at import time.
    gestureHandlers = {};
    vi.stubGlobal('document', {
      addEventListener: vi.fn((type, fn) => { gestureHandlers[type] = fn; }),
      removeEventListener: vi.fn(),
    });

    const mod = await import('../sound.js');
    unlockAudio = mod.unlockAudio;
    playSound = mod.playSound;
  });

  it('self-registers a first-gesture listener on import', () => {
    expect(gestureHandlers.pointerdown).toBeTypeOf('function');
    expect(gestureHandlers.touchend).toBeTypeOf('function');
    expect(gestureHandlers.click).toBeTypeOf('function');
  });

  it('does not create or resume the context before any interaction', () => {
    expect(MockAudioContext).not.toHaveBeenCalled();
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });

  it('resumes the SUSPENDED context on the first gesture (explicit unlock)', () => {
    gestureHandlers.pointerdown();
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('plays the silent-buffer iOS unlock on first gesture', () => {
    gestureHandlers.pointerdown();
    expect(mockCtx.createBuffer).toHaveBeenCalledWith(1, 1, 22050);
    expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('removes all gesture listeners after the first unlock (one-shot)', () => {
    gestureHandlers.pointerdown();
    expect(document.removeEventListener).toHaveBeenCalledTimes(3);
  });

  it('NON-gesture-first sound works: the gesture already unlocked the context', () => {
    // First interaction is a gesture that produces NO sound (e.g. a nav tap).
    gestureHandlers.pointerdown();
    expect(MockAudioContext).toHaveBeenCalledTimes(1); // context created during the gesture

    // Later, a sound fires from a NON-gesture path (e.g. a phase-change useEffect).
    expect(() => playSound('complete')).not.toThrow();
    expect(MockAudioContext).toHaveBeenCalledTimes(1); // reused, not re-created outside a gesture
  });

  it('unlockAudio is idempotent / safe to call repeatedly', () => {
    unlockAudio();
    unlockAudio();
    expect(() => unlockAudio()).not.toThrow();
    expect(MockAudioContext).toHaveBeenCalledTimes(1); // single shared context
  });
});

describe('webkitAudioContext fallback (older iOS / WKWebView)', () => {
  it('uses webkitAudioContext when AudioContext is unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal('AudioContext', undefined);
    const WebkitCtx = vi.fn(function () { return makeSuspendedCtx(); });
    vi.stubGlobal('webkitAudioContext', WebkitCtx);
    vi.stubGlobal('navigator', { vibrate: vi.fn() });
    vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const mod = await import('../sound.js');
    mod.playSound('tap');
    expect(WebkitCtx).toHaveBeenCalledTimes(1);
  });

  it('degrades silently when neither constructor exists', async () => {
    vi.resetModules();
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    vi.stubGlobal('navigator', { vibrate: vi.fn() });
    vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const mod = await import('../sound.js');
    expect(() => mod.playSound('tap')).not.toThrow();
    expect(() => mod.unlockAudio()).not.toThrow();
  });
});
