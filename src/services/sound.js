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
