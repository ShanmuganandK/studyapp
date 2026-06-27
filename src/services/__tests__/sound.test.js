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
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
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

  it('correct plays a 3-note chime (C5-E5-G5)', () => {
    playSound('correct');
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('complete plays a 4-note fanfare (more expansive than correct)', () => {
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
