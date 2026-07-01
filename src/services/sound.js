// ── Sound + Haptics service ────────────────────────────────────────────────────────────────
// The SINGLE place audio and haptics are produced. Components call playSound() / haptic()
// and never touch AudioContext or navigator.vibrate directly (STANDARDS §8 — centralized).
//
// Two abstraction / swap points — callers are unchanged when either is upgraded:
//   Sound source: today = Web Audio API synthesis; later, replace each entry in synthMap
//                 with `new Audio(url).play()` to use real files. Callers unchanged.
//   Haptics:      today = Web Vibration API; later, replace hapticMap bodies with
//                 Capacitor `Haptics.impact(...)` calls. Callers unchanged.
//
// Mute: one flag silences both sound and haptics instantly (no async, no flicker).

let audioCtx = null;
let muted = false;
let unlockListenerInstalled = false;

// Resolve the AudioContext constructor, with the legacy webkit-prefixed fallback.
// Older iOS Safari / WKWebView (relevant for the planned Capacitor iOS wrap) expose ONLY
// `webkitAudioContext`; without this fallback `new AudioContext()` throws there and sound
// never works at all. Read from globalThis so it resolves in both the browser and tests.
function getAudioContextCtor() {
  if (typeof globalThis === 'undefined') return undefined;
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

// Lazily create (or resume) the shared AudioContext. Returns null if Web Audio is
// unavailable (callers degrade silently). The resume() here covers the suspended-on-create
// autoplay state — but unlock is now guaranteed up-front by the first-gesture listener
// below, rather than left to whichever sound happens to fire first.
function getCtx() {
  if (!audioCtx) {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Schedule one sine-wave note on the shared context.
// start: AudioContext seconds; duration/attack: seconds; gain: 0–1
function playNote(ctx, freq, start, duration, gain = 0.20, attack = 0.005) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, start);
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(gain, start + attack);
  env.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

// ── TODO: swap point — replace synthMap entries with real audio files ─────────────────────
// Example replacement for any event:
//   correct: () => { const a = new Audio('/sounds/correct.mp3'); a.play(); }
// Import path, preloading, and format are the only things to change here.
// playSound('correct') at call sites stays identical.
const synthMap = {
  // Bell chime: C5 → E5 → G5 → C6, staggered 60ms apart.
  // Each note = sine bell base + triangle overtone + high-freq sparkle, all with
  // exponential decays so notes ring out naturally (not electronic/beepy).
  correct: () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const t = now + i * 0.06;
      const dur = 1.0;

      const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
      osc1.type = 'sine'; osc1.frequency.setValueAtTime(freq, t);
      g1.gain.setValueAtTime(0, t);
      g1.gain.linearRampToValueAtTime(0.2, t + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.001, t + dur);

      const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
      osc2.type = 'triangle'; osc2.frequency.setValueAtTime(freq * 2, t);
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.06, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      const osc3 = ctx.createOscillator(); const g3 = ctx.createGain();
      osc3.type = 'sine'; osc3.frequency.setValueAtTime(freq * 4, t);
      g3.gain.setValueAtTime(0, t);
      g3.gain.linearRampToValueAtTime(0.03, t + 0.005);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc1.connect(g1); g1.connect(ctx.destination);
      osc2.connect(g2); g2.connect(ctx.destination);
      osc3.connect(g3); g3.connect(ctx.destination);

      osc1.start(t); osc1.stop(t + dur);
      osc2.start(t); osc2.stop(t + dur);
      osc3.start(t); osc3.stop(t + dur);
    });
  },

  // Single soft low tone — encouraging, never punishing.
  // Sine + very low gain (0.11) = mellow, never a buzzer. (DECISIONS: "never punish")
  wrong: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 220, t, 0.32, 0.11, 0.015);  // A3 — slow attack softens the onset
  },

  // Gentle "let me help" — a soft rising two-note (E5 → A5), warm and inviting, NOT a buzzer.
  // Signals Tinku stepping in with a hint (the teaching moment), distinct from the 'wrong' tone.
  hint: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 659.25, t, 0.16, 0.12, 0.01);        // E5
    playNote(ctx, 880.0, t + 0.11, 0.22, 0.13, 0.01);  // A5 — rises to a friendly, open resolve
  },

  // Brief soft click — confirms the button press without being distracting.
  tap: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 880, t, 0.035, 0.08, 0.002);  // A5 — very short, very quiet
  },

  // Short celebratory fanfare — C5 → E5 → G5 → C6 ascending, C6 held as the peak.
  // Clearly more expansive than the per-question correct chime.
  complete: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 523.25,  t,        0.12, 0.22);  // C5
    playNote(ctx, 659.25,  t + 0.09, 0.12, 0.24);  // E5
    playNote(ctx, 783.99,  t + 0.18, 0.12, 0.26);  // G5
    playNote(ctx, 1046.50, t + 0.27, 0.38, 0.28);  // C6 — held, this is the "fanfare peak"
  },
};

// ── TODO: swap point — replace vibrate() calls with Capacitor Haptics ────────────────────
// Example replacement: `Haptics.impact({ style: ImpactStyle.Light })`
// haptic('light') at call sites stays identical.
const hapticMap = {
  light: () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
  },
};

// ── Public API ────────────────────────────────────────────────────────────────────────────

/** Mute or unmute all sound and haptics in one call. Instant — no async. */
export function setSoundMuted(value) {
  muted = Boolean(value);
}

/** Returns the current mute state — used to initialise the toggle button's visual state. */
export function isSoundMuted() {
  return muted;
}

/**
 * Fire a named sound event. Fire-and-forget — never throws, never blocks the UI.
 * @param {'correct'|'wrong'|'hint'|'tap'|'complete'} event
 */
export function playSound(event) {
  if (muted) return;
  try {
    synthMap[event]?.();
  } catch {
    // Degrade silently: autoplay blocked, API unavailable, unsupported browser.
  }
}

/**
 * Fire a named haptic event. Fire-and-forget — never throws, never blocks the UI.
 * @param {'light'} type
 */
export function haptic(type) {
  if (muted) return;
  try {
    hapticMap[type]?.();
  } catch {
    // Degrade silently: Vibration API not supported on this device.
  }
}

// ── Audio unlock (explicit, gesture-driven) ─────────────────────────────────────────────────
// Mobile browsers create the AudioContext SUSPENDED and only allow resume() from within a
// user-gesture handler. Previously the context happened to unlock because the first sound was
// always an option tap — but any sound originating from a non-gesture path (a timer, a
// phase-change effect, a route transition) firing first would be silently dropped. We now
// unlock explicitly on the first interaction, independent of which sound fires first.

/**
 * Create + resume the shared AudioContext and play a 1-sample silent buffer — the reliable
 * way to flip a suspended context to truly running on iOS. Idempotent, best-effort, never throws.
 * Runs regardless of mute state so that unmuting later takes effect instantly.
 */
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    // Silent-buffer trick: a no-op source whose playback flips iOS's context to running.
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Best-effort: if Web Audio is blocked/unavailable, sound simply stays off.
  }
}

// Register a one-time listener that unlocks audio on the first user gesture, then removes
// itself. Self-installs on import so no caller wiring is needed (callers stay unchanged).
function installUnlockListener() {
  if (unlockListenerInstalled) return;
  if (typeof document === 'undefined' || !document.addEventListener) return;
  unlockListenerInstalled = true;
  const events = ['pointerdown', 'touchend', 'click'];
  const onFirstGesture = () => {
    unlockAudio();
    events.forEach((e) => document.removeEventListener(e, onFirstGesture));
  };
  events.forEach((e) => document.addEventListener(e, onFirstGesture));
}

installUnlockListener();
