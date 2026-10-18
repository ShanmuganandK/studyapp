/**
 * QuizPips: a row of small dots showing how far through the session the child is.
 *
 * It fills Tinku's speech slot whenever there is no hint, so the reserved space is never dead air
 * (and nothing moves when a hint replaces it). Decorative and aria-hidden: the real "n / 8" counter is
 * the text in the top bar. Colours: tokens only, and never amber (amber = reward only): done dots are
 * solid primary, the current one is ringed, the rest are the soft tint.
 *
 * @param {number} total    - questions in the session
 * @param {number} current  - 1-based number of the question on screen
 */
export default function QuizPips({ total, current }) {
  if (!total || total < 1) return null;
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-2" data-testid="quiz-pips">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'todo';
        return (
          <span
            key={n}
            data-pip={state}
            className={`rounded-full transition-colors ${
              state === 'done'
                ? 'bg-primary'
                : state === 'now'
                  ? 'bg-bg-card border-2 border-primary'
                  : 'bg-primary-soft'
            }`}
            style={{ width: 'clamp(0.5rem, 1.7cqh, 0.8rem)', height: 'clamp(0.5rem, 1.7cqh, 0.8rem)' }}
          />
        );
      })}
    </div>
  );
}
