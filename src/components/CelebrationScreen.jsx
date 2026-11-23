import Mascot from './Mascot';
import Confetti from './Confetti';
import MasteryPips from './MasteryPips';

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
 * @param {string} [skillName] - human-readable skill name for context
 * @param {{leveledUp:boolean, justMastered:boolean, level?:number, skillName:string,
 *          next?:{skillId:string, skillName:string}|null}|null} masteryUp
 * @param {(skillId:string) => void} [onNext] - starts the recommended next skill ("Next with Tinku →")
 *        - read-only mastery-up read-out from the hook (null when nothing levelled up)
 * @param {() => void} onPlayAgain
 * @param {() => void} onExit
 */

// Beat timing (ms). Kept as named constants — the sequence is the design, not a magic soup.
const TITLE_DELAY_MS = 400;
const STARS_START_MS = 700;
const STAR_STAGGER_MS = 90;

function SparkStar({ filled, size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={filled ? 'text-accent' : 'text-primary-soft'}
    >
      <path
        d="M12 2.25l2.82 5.72 6.31.92-4.56 4.45 1.08 6.28L12 16.65l-5.65 2.97 1.08-6.28-4.56-4.45 6.31-.92L12 2.25z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CelebrationScreen({ score, total, skillName, masteryUp, onPlayAgain, onExit, onNext }) {
  const starsEndMs = STARS_START_MS + total * STAR_STAGGER_MS;
  const scoreDelayMs = starsEndMs + 80;
  const masteryDelayMs = starsEndMs + 250;
  const buttonsDelayMs = masteryUp ? masteryDelayMs + 420 : starsEndMs + 300;
  const resolvedSkillName = skillName ?? masteryUp?.skillName;
  // "Next with Tinku →" leads only when it can really go somewhere new: a level-up or mastery AND a
  // different recommended skill. Otherwise "Play again" stays the main button.
  const nextSkill = masteryUp?.next ?? null;
  const advancePrimary = !!(nextSkill && onNext);

  return (
    <div className="quiz-stage relative flex flex-col items-center justify-center h-full overflow-hidden bg-bg px-6 py-6 text-center">
      {/* Background burst — behind the content (z-0). */}
      <Confetti />

      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Beat 1 — Tinku pops in on his ground stage. */}
        <div className="animate-celebrate-pop flex flex-col items-center">
          <Mascot emotion="celebrate" size="clamp(6.5rem, min(29cqh, 84cqw), 20rem)" />
          <div aria-hidden="true" className="tinku-ground h-3 w-2/5 max-w-[140px] -mt-1 rounded-[50%]" />
        </div>

        {/* Beat 3 — the warm title + skill context. */}
        <h2
          className="animate-celebrate-pop font-display text-title font-extrabold text-primary-ink mt-3"
          style={{ animationDelay: `${TITLE_DELAY_MS}ms` }}
        >
          Great job!
        </h2>
        {resolvedSkillName && (
          <p
            className="animate-celebrate-pop text-sm font-semibold text-muted mt-0.5"
            style={{ animationDelay: `${TITLE_DELAY_MS}ms` }}
          >
            {resolvedSkillName}
          </p>
        )}

        {/* Beat 4 — the SVG Spark stars count up (each pops in sequentially). */}
        <div className="flex gap-1.5 mt-3 items-center justify-center" aria-label={`${score} of ${total} correct`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="animate-star-pop inline-flex"
              style={{ animationDelay: `${STARS_START_MS + i * STAR_STAGGER_MS}ms` }}
            >
              <SparkStar filled={i < score} />
            </span>
          ))}
        </div>
        <p
          className="animate-rise-in text-muted mt-2"
          style={{ animationDelay: `${scoreDelayMs}ms` }}
        >
          {score} / {total} correct
        </p>

        {/* Optional beat — mastery-up: a special amber celebration with its own little burst + level pips. */}
        {masteryUp && (
          <div
            className="animate-celebrate-pop relative mt-4 px-4 py-2.5 rounded-button border-2 border-accent"
            style={{ animationDelay: `${masteryDelayMs}ms` }}
          >
            <Confetti count={12} palette="amber" />
            <p className="relative z-10 font-display font-extrabold text-primary-ink inline-flex items-center justify-center gap-1.5">
              <span>
                {masteryUp.justMastered
                  ? `You mastered ${masteryUp.skillName}!`
                  : `${masteryUp.skillName} levelled up!`}
              </span>
              <SparkStar filled size={18} />
            </p>
            {typeof masteryUp.level === 'number' && (
              <MasteryPips level={masteryUp.level} className="relative z-10 mt-1.5 justify-center" />
            )}
          </div>
        )}

        {/* Beat 5 — the buttons arrive last. After a level-up/mastery with a new recommended skill,
            "Next with Tinku →" becomes primary and opens that skill directly. */}
        <div
          className="animate-rise-in flex flex-col gap-3 mt-6 w-full max-w-xs"
          style={{ animationDelay: `${buttonsDelayMs}ms` }}
        >
          {advancePrimary ? (
            <>
              <button
                onClick={() => onNext(nextSkill.skillId)}
                aria-label={`Next with Tinku: ${nextSkill.skillName}`}
                className="min-h-[48px] bg-primary text-white font-bold text-lg py-3 px-8 rounded-button shadow-button hover:brightness-110 active:scale-95 transition-all"
              >
                Next with Tinku →
              </button>
              <button
                onClick={onPlayAgain}
                className="min-h-[48px] text-muted font-semibold py-3 px-6 rounded-button hover:text-ink transition-colors"
              >
                Play again
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onPlayAgain}
                className="min-h-[48px] bg-primary text-white font-bold text-lg py-3 px-8 rounded-button shadow-button hover:brightness-110 active:scale-95 transition-all"
              >
                Play again
              </button>
              <button
                onClick={onExit}
                className="min-h-[48px] text-muted font-semibold py-3 px-6 rounded-button hover:text-ink transition-colors"
              >
                Pick another skill
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
