import { useState } from 'react'
import { useT } from '../i18n/index.jsx'
import { effectiveTheme, followSystem, readTheme, saveTheme } from '../store/theme.js'

/**
 * Day and Night, with a third state that is not a button.
 *
 * Choosing the theme the system already uses still counts as choosing it, so
 * the app stops following the system from then on. Pressing the live button
 * again hands control back, which is the only way to reach the default once a
 * choice has been made.
 *
 * The attribute is already on the document by the time this mounts, stamped by
 * the inline script in index.html. This only changes it.
 */
export default function ThemeToggle() {
  const { t } = useT()
  const [stored, setStored] = useState(readTheme)

  const choose = (theme) => {
    if (stored === theme) {
      followSystem()
      setStored(null)
      return
    }
    saveTheme(theme)
    setStored(theme)
  }

  const live = effectiveTheme(stored)

  return (
    <div className="theme-toggle" role="group" aria-label={t('theme.label')}>
      {['light', 'dark'].map((theme) => (
        <button
          key={theme}
          onClick={() => choose(theme)}
          aria-pressed={live === theme}
          title={stored === theme ? t('theme.following') : undefined}
        >
          {t(`theme.${theme}`)}
        </button>
      ))}
    </div>
  )
}
