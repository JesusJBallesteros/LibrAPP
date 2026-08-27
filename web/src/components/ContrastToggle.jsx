import { useState } from 'react'
import { useT } from '../i18n/index.jsx'
import {
  effectiveContrast,
  followSystemContrast,
  readContrast,
  saveContrast,
} from '../store/contrast.js'

/**
 * More contrast, or the ordinary amount, with a third state that is not a
 * button.
 *
 * Built the same way as the theme toggle, and for the same reason: choosing the
 * level the system already asks for still counts as choosing it, so the app
 * stops following the system from then on. Pressing the live button again hands
 * control back, which is the only way to reach the default once a choice has
 * been made.
 *
 * Deliberately separate from Day and Night rather than a third option beside
 * them. Contrast is not a theme: somebody who needs more of it may want it on
 * either, and folding the two together would make them choose.
 */
export default function ContrastToggle() {
  const { t } = useT()
  const [stored, setStored] = useState(readContrast)

  const choose = (level) => {
    if (stored === level) {
      followSystemContrast()
      setStored(null)
      return
    }
    saveContrast(level)
    setStored(level)
  }

  const live = effectiveContrast(stored)

  return (
    <div className="theme-toggle" role="group" aria-label={t('contrast.label')}>
      {['normal', 'high'].map((level) => (
        <button
          key={level}
          onClick={() => choose(level)}
          aria-pressed={live === level}
          title={stored === level ? t('contrast.following') : undefined}
        >
          {t(`contrast.${level}`)}
        </button>
      ))}
    </div>
  )
}
