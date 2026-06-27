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

// Lazily create (or resume) the shared AudioContext.
// Must be called from a user-gesture stack to satisfy browser autoplay policy.
function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
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
  // Happy rising chime — C5 → E5 → G5 (major triad ascending).
  // Arpeggiated so the reward "lands" note by note rather than all at once.
  correct: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 523.25, t,        0.18, 0.20);  // C5
    playNote(ctx, 659.25, t + 0.09, 0.18, 0.22);  // E5
    playNote(ctx, 783.99, t + 0.18, 0.28, 0.24);  // G5 — held slightly longer
  },

  // Single soft low tone — encouraging, never punishing.
  // Sine + very low gain (0.11) = mellow, never a buzzer. (DECISIONS: "never punish")
  wrong: () => {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(ctx, 220, t, 0.32, 0.11, 0.015);  // A3 — slow attack softens the onset
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
 * @param {'correct'|'wrong'|'tap'|'complete'} event
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
