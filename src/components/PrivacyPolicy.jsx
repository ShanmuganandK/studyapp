import { ArrowLeft } from 'lucide-react';
import { PRIVACY_POLICY, linkifyEmailParts } from '../config/privacyPolicy';

/**
 * PrivacyPolicy — the FULL policy text, in-app, inside the parent zone.
 *
 * Why in-app at all: Designed-for-Families expects the policy to be reachable from within the
 * app, not only from the store listing. Rendering it from bundled data (rather than linking out
 * to the hosted page) keeps it readable offline and — in the Capacitor wrap — avoids handing the
 * parent off to an external browser mid-session.
 *
 * The words come from `config/privacyPolicy.js`, the same module that generates the public
 * `public/privacy.html`, so the in-app and hosted copies cannot disagree. Presentational only:
 * no state, no logic, nothing to keep in sync by hand.
 *
 * Parent-facing register (calm, plain, adult) — this is never shown to the child.
 *
 * @param {() => void} onBack - return to the parent dashboard
 */
export default function PrivacyPolicy({ onBack }) {
  const { title, lastUpdated, sections } = PRIVACY_POLICY;

  return (
    <div className="flex flex-col min-h-full bg-bg overflow-y-auto">
      <div className="px-4 pt-6 pb-10 max-w-xl mx-auto w-full">

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="font-display text-xl font-extrabold text-primary-ink">{title}</h1>
        <p className="text-xs text-muted mt-1">Last updated: {lastUpdated}</p>

        <div className="bg-bg-card rounded-card shadow-card p-5 mt-4 text-left">
          {sections.map((section) => (
            <section key={section.id}>
              {section.heading && (
                <h2 className="text-sm font-bold text-primary-ink mt-5 first:mt-0 mb-1">
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((text, i) => (
                <p
                  key={i}
                  className={
                    section.heading
                      ? 'text-sm text-ink leading-relaxed mb-2 last:mb-0'
                      : 'text-base font-semibold text-ink leading-relaxed pb-4 mb-1 border-b border-primary-soft'
                  }
                >
                  {linkifyEmailParts(text).map((part, j) =>
                    part.type === 'email' ? (
                      <a
                        key={j}
                        href={`mailto:${part.value}`}
                        className="text-primary underline break-all"
                      >
                        {part.value}
                      </a>
                    ) : (
                      part.value
                    )
                  )}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
