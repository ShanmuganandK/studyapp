import Mascot from './Mascot';
import Confetti from './Confetti';

/**
 * CelebrationScreen — the session-end EVENT (UI overhaul, Screen 2).
 *
 * A beat-by-beat celebration, not a static screen: Tinku pops in → confetti burst → the score
 * stars count up with little pops → "Great job!" → (optional) a mastery-up beat → the buttons
 * arrive LAST. Beats are choreographed purely by per-element `animation-delay` (no JS timers to
 * leak); prefers-reduced-motion collapses it to everything-visible-at-once (keyframes off).
 *
 * PURELY PRESENTATIONAL (STANDARDS §2). The mood floor ("always celebratory whatever the score")
 * lives in the session engine — this screen only renders the celebration it's handed. Pairs with
 * the existing `complete` fanfare (fired by SessionPlayer's phase effect).
 *
 * Stars here are a REWARD read-out (locked: amber/stars = reward only). Amber is legitimate on
 * this screen for the same reason — session-end is achievement, not a countable object.
 *
 * @param {number} score - questions correct
 * @param {number} total - questions in the session
 * @param {{leveledUp:boolean, justMastered:boolean, skillName:string}|null} masteryUp
 *        - read-only mastery-up read-out from the hook (null when nothing levelled up)
 * @param {() => void} onPlayAgain
 * @param {() => void} onExit
 */

// Beat timing (ms). Kept as named constants — the sequence is the design, not a magic soup.
const TITLE_DELAY_MS = 400;
const STARS_START_MS = 700;
const STAR_STAGGER_MS = 90;

export default function CelebrationScreen({ score, total, masteryUp, onPlayAgain, onExit }) {
  const starsEndMs = STARS_START_MS + total * STAR_STAGGER_MS;
  const scoreDelayMs = starsEndMs + 80;
  const masteryDelayMs = starsEndMs + 250;
  const buttonsDelayMs = masteryUp ? masteryDelayMs + 420 : starsEndMs + 300;

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden bg-bg px-6 py-6 text-center">
      {/* Background burst — behind the content (z-0). */}
      <Confetti />

      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Beat 1 — Tinku pops in on his ground stage. */}
        <div className="animate-celebrate-pop flex flex-col items-center">
          <Mascot emotion="celebrate" size="clamp(90px, 15vh, 160px)" />
          <div aria-hidden="true" className="tinku-ground h-3 w-2/5 max-w-[140px] -mt-1 rounded-[50%]" />
        </div>

        {/* Beat 3 — the warm title. */}
        <h2
          className="animate-celebrate-pop font-display text-title font-extrabold text-primary-ink mt-3"
          style={{ animationDelay: `${TITLE_DELAY_MS}ms` }}
        >
          Great job!
        </h2>

        {/* Beat 4 — the score stars count up (each pops in sequentially). */}
        <div className="flex gap-1 mt-3 text-3xl" aria-label={`${score} of ${total} correct`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="animate-star-pop inline-block"
              style={{ animationDelay: `${STARS_START_MS + i * STAR_STAGGER_MS}ms` }}
            >
              {i < score ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <p
          className="animate-rise-in text-muted mt-2"
          style={{ animationDelay: `${scoreDelayMs}ms` }}
        >
          {score} / {total} correct
        </p>

        {/* Optional beat — mastery-up: a special amber celebration with its own little burst. */}
        {masteryUp && (
          <div
            className="animate-celebrate-pop relative mt-4 px-4 py-2 rounded-button border-2 border-accent"
            style={{ animationDelay: `${masteryDelayMs}ms` }}
          >
            <Confetti count={12} palette="amber" />
            <p className="relative z-10 font-display font-extrabold text-primary-ink">
              {masteryUp.justMastered
                ? `You mastered ${masteryUp.skillName}! ⭐`
                : `${masteryUp.skillName} levelled up! ⭐`}
            </p>
          </div>
        )}

        {/* Beat 5 — the buttons arrive last. */}
        <div
          className="animate-rise-in flex flex-col gap-3 mt-6 w-full max-w-xs"
          style={{ animationDelay: `${buttonsDelayMs}ms` }}
        >
          <button
            onClick={onPlayAgain}
            className="bg-primary text-white font-bold text-lg py-3 px-8 rounded-button shadow-button hover:brightness-110 active:scale-95 transition-all"
          >
            Play again
          </button>
          <button
            onClick={onExit}
            className="text-muted font-semibold py-2 hover:text-ink transition-colors"
          >
            Pick another skill
          </button>
        </div>
      </div>
    </div>
  );
}
