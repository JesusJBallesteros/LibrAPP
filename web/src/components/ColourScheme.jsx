import { useState } from 'react'
import { InfoHeading } from './Info.jsx'
import { useT } from '../i18n/index.jsx'
import { PRESETS, WALNUT, paletteFor, readScheme, saveScheme } from '../store/scheme.js'

/** A strip of what a scheme looks like: the accent, its tan, and two spines. */
const strip = (vars) => [vars['l-accent'], vars['l-tan'], vars['spine-3'], vars['spine-7']]

/**
 * The choice of colours, on the stacks page.
 *
 * Four schemes and a colour of one's own. Pressing one changes the page at
 * once, the way Day and Night do, and it is remembered on this device.
 */
export default function ColourScheme() {
  const { t } = useT()
  const [chosen, setChosen] = useState(() => readScheme()?.id ?? 'walnut')
  const [own, setOwn] = useState(() => {
    const saved = readScheme()
    return saved?.id === 'own' ? saved.hex : '#3f6f8f'
  })

  const choose = (id, hex) => {
    saveScheme(id, hex)
    setChosen(id)
  }

  return (
    <section className="desk-section">
      <InfoHeading
        className="section-head"
        title={t('scheme.title')}
        label={t('common.moreAbout', { what: t('scheme.title') })}
      >
        <p>{t('scheme.note')}</p>
      </InfoHeading>

      <div className="scheme-choices" role="group" aria-label={t('scheme.title')}>
        {PRESETS.map(({ id, hex }) => (
          <button
            key={id}
            className="scheme-choice"
            aria-pressed={chosen === id}
            onClick={() => choose(id, hex)}
          >
            <span className="scheme-strip" aria-hidden="true">
              {strip(hex ? paletteFor(hex) : WALNUT).map((colour, i) => (
                <span key={i} style={{ background: colour }} />
              ))}
            </span>
            {t(`scheme.${id}`)}
          </button>
        ))}

        <label className={`scheme-choice${chosen === 'own' ? ' on' : ''}`}>
          <input
            type="color"
            value={own}
            onChange={(e) => {
              setOwn(e.target.value)
              choose('own', e.target.value)
            }}
          />
          {t('scheme.own')}
          {chosen === 'own' && <span className="offscreen">{t('scheme.chosen')}</span>}
        </label>
      </div>
    </section>
  )
}
