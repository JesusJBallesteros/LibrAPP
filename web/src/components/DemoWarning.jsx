import { useT } from '../i18n/index.jsx'

// Set just before the reload that leaves the demo, read once on the way back
// in. sessionStorage rather than a route, because leaving is a reload: the demo
// lives in memory and the only way to be rid of it is to start the page again.
const START_KEY = 'librapp-start-here'

/** Ask for the front page to open at the ways in, then leave the demo. */
export function leaveForYourOwn() {
  try {
    sessionStorage.setItem(START_KEY, '1')
  } catch {
    // Private windows refuse storage. The reload still works; it just arrives
    // at the top of the page rather than at the ways in.
  }
  window.location.reload()
}

/** Whether this load followed that, taking the flag with it. */
export function wantedStart() {
  try {
    if (sessionStorage.getItem(START_KEY) !== '1') return false
    sessionStorage.removeItem(START_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * What importing into the demo will and will not do, said where it is about to
 * happen.
 *
 * The banner at the top of every page already says the demo is discarded on
 * reload. It says so before the reader has done anything, which is the wrong
 * moment: the natural thing for somebody persuaded by the demo is to bring
 * their real export in and see it work, and lose it. This says it again at the
 * point of choosing, and offers the way out that keeps the work.
 */
export default function DemoWarning({ lib }) {
  const { t } = useT()
  if (!lib?.isDemo) return null

  return (
    <div className="notice demo-notice" role="note">
      <p>
        <strong>{t('demo.importWarning')}</strong>
      </p>
      <p className="tiny">{t('demo.importWarningWhy')}</p>
      <button className="btn small primary" style={{ marginTop: 8 }} onClick={leaveForYourOwn}>
        {t('demo.tryYours')}
      </button>
    </div>
  )
}
