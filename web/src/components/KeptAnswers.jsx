import { useT } from '../i18n/index.jsx'

/**
 * Replies from the desk the reader chose to keep.
 *
 * Every answer used to live in a box on the page and go when the page did. Most
 * of them should: a synopsis of one book is worth reading once. A description of
 * the whole collection is not, and there was nothing to keep it with except the
 * clipboard.
 *
 * Here rather than in The stacks. The stacks is where a library is kept and
 * moved; these are answers to questions asked at this desk, and the reader who
 * wants to reread one is standing here.
 */
export default function KeptAnswers({ answers, open, onToggle, onDelete, busy }) {
  const { t, language } = useT()

  if (!answers.length) return null

  const when = (at) => {
    const on = new Date(at)
    return Number.isNaN(on.getTime()) ? '' : on.toLocaleDateString(language)
  }

  return (
    <section className="desk-section">
      <div className="section-head spread">
        <h3>{t('desk.kept')}</h3>
        <span className="tabular tiny faint">{answers.length}</span>
      </div>

      {!open ? (
        <button className="btn" onClick={onToggle}>
          {t('desk.seeThem')}
        </button>
      ) : (
        <>
          {answers.map((answer) => (
            <article key={answer.id} className="kept-answer">
              <div className="spread">
                <span className="tiny muted">
                  {t(`desk.${answer.ask}`)}
                  {answer.question ? ` · ${answer.question}` : ''}
                </span>
                <span className="tabular tiny faint">{when(answer.at)}</span>
              </div>
              <pre className="snippet">{answer.text}</pre>
              <button
                className="btn small danger"
                disabled={busy}
                onClick={() => onDelete(answer.id)}
              >
                {t('common.remove')}
              </button>
            </article>
          ))}
          <button className="btn small" style={{ marginTop: 12 }} onClick={onToggle}>
            {t('desk.hideThem')}
          </button>
        </>
      )}
    </section>
  )
}
