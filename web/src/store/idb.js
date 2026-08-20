// A very small key-value store on IndexedDB.
//
// Needed for one thing: remembering the folder you chose, so the app opens your
// library again next time instead of asking. A directory handle survives being
// put in IndexedDB and nowhere else — it cannot be stringified — which is why
// this exists rather than localStorage.

const DB_NAME = 'librapp'
const STORE = 'kv'

function open() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, fn) {
  const db = await open()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request?.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export const idbGet = (key) => withStore('readonly', (store) => store.get(key))
export const idbSet = (key, value) => withStore('readwrite', (store) => store.put(value, key))
export const idbDelete = (key) => withStore('readwrite', (store) => store.delete(key))
