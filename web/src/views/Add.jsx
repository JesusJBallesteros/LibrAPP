import Ring from '../components/Ring.jsx'
import { useT } from '../i18n/index.jsx'

/**
 * The four ways in, as a ring over one page.
 *
 * The same control the desk uses for its shelves and questions: the chosen one
 * in the middle and its neighbours out by the arrows, so there are visibly more
 * than one. Each way in is still its own view with its own route, so every link
 * that already sends somebody to the photograph, the list, the barcodes or the
 * Kindle page keeps working.
 */
export const ADD_TABS = [{ id: 'shelf' }, { id: 'list' }, { id: 'barcode' }, { id: 'kindle' }]

export const ADD_VIEWS = ADD_TABS.map((tab) => tab.id)

export default function Add({ view, onGo, children }) {
  const { t } = useT()

  return (
    <>
      <div className="add-ring">
        <Ring
          items={ADD_TABS.map(({ id }) => ({ id, label: t(`nav.${id}`) }))}
          current={view}
          onPick={onGo}
          label={t('nav.add')}
        />
      </div>
      {children}
    </>
  )
}
