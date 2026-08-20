/**
 * Where the library lives — the first thing the app has to settle, and the one
 * decision it should not make quietly on someone's behalf.
 */
export default function Setup({ canPickFolder, onFolder, onBrowser, error }) {
  return (
    <div className="view" style={{ maxWidth: 640 }}>
      <header>
        <h2>Where should your library live?</h2>
        <p>
          LibrAPP keeps your catalog on this device and sends it nowhere. It only needs to know
          where to put it.
        </p>
      </header>

      {error && (
        <div className="notice bad">
          <p>{error}</p>
        </div>
      )}

      {canPickFolder ? (
        <div className="card">
          <h3>A folder you choose</h3>
          <p className="muted tiny">
            Plain JSON files you can open, back up, or keep in a private repository. LibrAPP writes{' '}
            <code>sources/</code> and <code>catalog.json</code> there and nothing else. The
            command-line tools read the same folder.
          </p>
          <button className="btn primary" onClick={onFolder} style={{ marginTop: 12 }}>
            Choose a folder
          </button>
        </div>
      ) : (
        <div className="notice">
          <p className="tiny">
            This browser has no folder picker — on a phone that is normal. Browser storage below
            works the same way from the app's side; the difference is that the files are not
            visible outside it, so moving a library between devices means exporting and importing
            it.
          </p>
        </div>
      )}

      <div className="card">
        <h3>Browser storage</h3>
        <p className="muted tiny">
          Managed by the browser and private to LibrAPP. Nothing to choose and nothing to
          configure, but the files are not visible to anything else — export is how a copy leaves
          the device.
        </p>
        <button
          className={canPickFolder ? 'btn' : 'btn primary'}
          onClick={onBrowser}
          style={{ marginTop: 12 }}
        >
          Use browser storage
        </button>
      </div>

      <p className="tiny faint">
        Either can be changed later, and a library can be exported from one and imported into the
        other.
      </p>
    </div>
  )
}
