import { useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'

/**
 * How to get LibrAPP onto a phone, and how to get a catalog there after it.
 *
 * Two different questions that arrive as one. LibrAPP is a web page that
 * installs like an app, and it never said so anywhere: the manifest has been
 * complete since the beginning and nothing in the interface mentioned it. The
 * second question is the one people actually mean, and its answer lived three
 * screens into The stacks.
 *
 * The browser offers to install only when it decides the page qualifies, and
 * only some browsers offer at all: Safari on iOS never fires the event and
 * never will, so the manual route is written out rather than left to the
 * button. Somebody on an iPhone is exactly the person asking this question.
 */

/** Already running as an installed app rather than in a browser tab. */
const installed = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true)

export function useInstall() {
  const [offer, setOffer] = useState(null)
  const [done, setDone] = useState(installed)

  useEffect(() => {
    // Kept rather than acted on. Firing it the moment it arrives is the thing
    // that makes install prompts hated, and the answer here belongs to whoever
    // presses the button.
    const held = (event) => {
      event.preventDefault()
      setOffer(event)
    }
    const finished = () => {
      setOffer(null)
      setDone(true)
    }
    window.addEventListener('beforeinstallprompt', held)
    window.addEventListener('appinstalled', finished)
    return () => {
      window.removeEventListener('beforeinstallprompt', held)
      window.removeEventListener('appinstalled', finished)
    }
  }, [])

  const install = async () => {
    if (!offer) return
    offer.prompt()
    await offer.userChoice
    // Spent either way: the event cannot be used twice, and the browser sends
    // a fresh one if it decides to offer again.
    setOffer(null)
  }

  return { canInstall: Boolean(offer), done, install }
}

export default function OnYourPhone({ onGo }) {
  const { t } = useT()
  const { canInstall, done, install } = useInstall()

  return (
    <section className="landing-next">
      <h2>{t('phone.title')}</h2>
      <p className="muted tiny">{t('phone.body')}</p>

      {done ? (
        <p className="tiny" style={{ marginTop: 12 }}>{t('phone.already')}</p>
      ) : canInstall ? (
        <button className="btn primary" style={{ marginTop: 12 }} onClick={install}>
          {t('phone.install')}
        </button>
      ) : null}

      {/* Written out whether or not the button is there. The browsers that
          never offer are the ones this paragraph is for. */}
      {!done && (
        <p className="tiny faint" style={{ marginTop: 12 }}>{t('phone.byHand')}</p>
      )}

      <p className="tiny" style={{ marginTop: 14 }}>
        {t('phone.catalog')}{' '}
        <button className="btn link" onClick={() => onGo('storage')}>
          {t('phone.catalogAction')}
        </button>
      </p>
    </section>
  )
}
