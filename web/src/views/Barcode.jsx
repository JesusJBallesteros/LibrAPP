import IsbnLookup from '../components/IsbnLookup.jsx'
import { useT } from '../i18n/index.jsx'

/**
 * Cataloguing a book from the number printed on it.
 *
 * A page of its own, beside the photograph and the list, because that is what
 * it is: a third way of getting books in. It spent its first life at the foot
 * of the desk, under the enquiries, where somebody with a stack of paper books
 * would photograph the lot and pay for it without ever finding out that the
 * exact, free path was there.
 *
 * The page is a frame; the work is in IsbnLookup, which the desk used to hold.
 */
export default function Barcode({ lib }) {
  const { t } = useT()

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">{t('barcode.eyebrow')}</p>
        <h2>{t('nav.barcode')}</h2>
        <hr className="rule" />
        <p>{t('barcode.intro')}</p>
      </div>

      <IsbnLookup lib={lib} />
    </div>
  )
}
