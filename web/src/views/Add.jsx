import { Camera, ScanLine, Table, Tablet } from 'lucide-react'
import { useT } from '../i18n/index.jsx'

/**
 * The four ways in, as tabs over one page.
 *
 * Each tab is still its own view with its own route, so every link that already
 * sends somebody to the photograph, the list, the barcodes or the Kindle page
 * keeps working. This only draws the strip above whichever of them is open.
 */
export const ADD_TABS = [
  { id: 'shelf', Icon: Camera },
  { id: 'list', Icon: Table },
  { id: 'barcode', Icon: ScanLine },
  { id: 'kindle', Icon: Tablet },
]

export const ADD_VIEWS = ADD_TABS.map((tab) => tab.id)

export default function Add({ view, onGo, children }) {
  const { t } = useT()

  return (
    <>
      <nav className="add-tabs" aria-label={t('nav.add')}>
        {ADD_TABS.map(({ id, Icon }) => (
          <button
            key={id}
            className="add-tab"
            onClick={() => onGo(id)}
            aria-current={view === id ? 'page' : undefined}
            title={t(`nav.${id}`)}
          >
            <Icon aria-hidden="true" focusable="false" />
            {/* Out of sight on a phone for the tabs not chosen, but still read
                out, so the icon is never the only name a tab has. */}
            <span className="add-tab-label">{t(`nav.${id}`)}</span>
          </button>
        ))}
      </nav>
      {children}
    </>
  )
}
