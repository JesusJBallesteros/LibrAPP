import { useT } from '../i18n/index.jsx'

/**
 * The explanation, folded until somebody wants it.
 *
 * Pages here used to carry the reasoning beside the control: why the pieces
 * overlap, why resolution decides how much can be read, what a route without a
 * key costs. All of it is true and none of it is what somebody trying to
 * catalog a shelf came to read, and on a phone it pushed the control off the
 * screen.
 *
 * Native details and summary rather than state and a button: it opens without
 * JavaScript, a screen reader already knows what it is, and the browser's own
 * find-in-page can open it.
 */
export default function TellMeHow({ children }) {
  const { t } = useT()
  return (
    <details className="tell-me-how">
      <summary>{t('common.tellMeHow')}</summary>
      <div className="tell-me-how-body">{children}</div>
    </details>
  )
}
