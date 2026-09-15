import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useT } from '../i18n/index.jsx'
import { effectiveTheme, followSystem, readTheme, saveTheme } from '../store/theme.js'

const ICONS = { light: Sun, dark: Moon }

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
 *
 * `icons` draws the pair as a sun and a moon for the foot of the rail, which is
 * 82px wide and has no room for the words. The words stay as their names.
 */
export default function ThemeToggle({ icons = false }) {
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
    <div className={icons ? 'theme-icons' : 'theme-toggle'} role="group" aria-label={t('theme.label')}>
      {['light', 'dark'].map((theme) => {
        const Icon = ICONS[theme]
        return (
          <button
            key={theme}
            onClick={() => choose(theme)}
            aria-pressed={live === theme}
            aria-label={icons ? t(`theme.${theme}`) : undefined}
            title={stored === theme ? t('theme.following') : icons ? t(`theme.${theme}`) : undefined}
          >
            {icons ? <Icon aria-hidden="true" focusable="false" /> : t(`theme.${theme}`)}
          </button>
        )
      })}
    </div>
  )
}
