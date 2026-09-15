/**
 * A numbered step heading.
 *
 * Takes the existing "Step one · The photograph" string and draws the number in
 * a circle beside the label. The words before the separator stay for a screen
 * reader. `state` is 'now' for the step being worked on and 'done' for one
 * behind it; anything else is drawn as still ahead.
 */
export default function StepHead({ n, text, state }) {
  const at = text.indexOf(' · ')
  const lead = at === -1 ? '' : text.slice(0, at)
  const label = at === -1 ? text : text.slice(at + 3)

  return (
    <h3 className={`step-head numbered${state ? ` ${state}` : ''}`}>
      <span className="step-num" aria-hidden="true">
        {n}
      </span>
      {lead && <span className="offscreen">{lead}: </span>}
      <span>{label}</span>
    </h3>
  )
}
