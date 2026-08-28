// Looking a book up by the number printed on its own barcode.
//
// This is the one part of LibrAPP that talks to a service it does not control,
// and it is worth being exact about what that means. What leaves the device is
// a list of ISBNs and nothing else: no title, no author, no note, nothing about
// the shelf they came from and nothing about the reader. A barcode photograph
// is decoded here and the picture never leaves at all.
//
// It is not, despite appearances, the safe deterministic cousin of asking a
// model. Open Library answers an ISBN it does not have with a real record
// belonging to some other book rather than with an error: 0000000000000 returns
// a French novel, 9999999999999 an Argentine painter's retrospective. That is a
// quieter failure than a model's, because the answer looks authoritative and
// carries a publisher and a page count. Hence the checksum below, and hence the
// same show-it-before-writing step the desk already puts in front of a model's
// reply.

/** Digits only, with the trailing X that ISBN-10 allows. */
export const cleanIsbn = (raw) =>
  String(raw ?? '')
    .toUpperCase()
    .replace(/[^0-9X]/g, '')

/**
 * Whether a code's own check digit agrees with the rest of it.
 *
 * Catches a transposed pair and a mistyped digit, which is most of what goes
 * wrong when somebody copies thirteen digits by hand. It cannot catch a code
 * that is valid and simply not the book in front of you, which is why nothing
 * here is written without being shown first.
 */
export function validIsbn(raw) {
  const code = cleanIsbn(raw)
  if (code.length === 10) {
    if (/X/.test(code.slice(0, 9))) return false
    let sum = 0
    for (let i = 0; i < 10; i++) {
      const digit = code[i] === 'X' ? 10 : Number(code[i])
      sum += digit * (10 - i)
    }
    return sum % 11 === 0
  }
  if (code.length === 13) {
    if (/X/.test(code)) return false
    if (!/^97[89]/.test(code)) return false
    let sum = 0
    for (let i = 0; i < 13; i++) sum += Number(code[i]) * (i % 2 === 0 ? 1 : 3)
    return sum % 10 === 0
  }
  return false
}

/** An ISBN-10 as the 13 the rest of the world now uses. Anything else unchanged. */
export function toIsbn13(raw) {
  const code = cleanIsbn(raw)
  if (code.length !== 10) return code
  const body = `978${code.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  return `${body}${(10 - (sum % 10)) % 10}`
}

/**
 * Pull the codes out of whatever somebody pasted or dropped in.
 *
 * Deliberately loose about the container: a column of numbers, a CSV with the
 * ISBN in some column, one per line, separated by commas. Anything that looks
 * like a code is tried and anything that fails its own checksum is handed back
 * as rejected rather than quietly dropped, because a reader who pasted fifty
 * codes and got forty-eight books deserves to know which two and why.
 */
export function parseCodes(text) {
  const seen = new Set()
  const codes = []
  const rejected = []

  const consider = (candidate) => {
    const cleaned = cleanIsbn(candidate)
    if (cleaned.length !== 10 && cleaned.length !== 13) return false
    if (!validIsbn(cleaned)) {
      if (!rejected.includes(cleaned)) rejected.push(cleaned)
      return true // recognised as a code, and refused
    }
    const code = toIsbn13(cleaned)
    if (!seen.has(code)) {
      seen.add(code)
      codes.push(code)
    }
    return true
  }

  // Split on the things that separate one field from another, but not on the
  // space, because a code is often printed with spaces inside it: 978 0 441
  // 01359 3 is one number. A field that then cleans to more than a code's worth
  // of digits is two codes with a space between them, so it is split again.
  for (const field of String(text ?? '').split(/[\r\n,;\t|]+/)) {
    if (!field.trim()) continue
    if (consider(field)) continue
    for (const part of field.split(/\s+/)) consider(part)
  }
  return { codes, rejected }
}

// One request carries a hundred comfortably, in about three and a half seconds.
// Fifty keeps the URL short and the wait answerable, and means a long shelf
// reports progress rather than sitting silent.
export const BATCH = 50

export const lookupUrl = (codes) =>
  `https://openlibrary.org/api/books?bibkeys=${codes
    .map((c) => `ISBN:${c}`)
    .join(',')}&format=json&jscmd=data`

// Subjects Open Library carries that say nothing about the book. They describe
// the record, the scan or the lending programme, and putting them in a catalog
// as though they were what the book is about would be worse than having nothing.
const NOT_A_SUBJECT =
  /^(accessible book|protected daisy|in library|overdrive|internet archive wishlist|large type books|nyt:|new york times|reading level|lending library|popular print disabled books)/i

// A year with no digit either side of it. Not \b, which sees no boundary
// between the c and the 1 of "c1998", the form a library catalogue prints for
// an approximate date.
const YEAR = /(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)/

/** The year in "August 2, 2005", "2005" or "c1998". */
export const publishedYear = (value) => {
  const found = YEAR.exec(String(value ?? ''))
  return found ? Number(found[1]) : null
}

/**
 * One Open Library answer as a source record.
 *
 * Subjects become keywords rather than a genre. They are real, recorded and
 * worth having, and they are also twenty to ninety per book and include things
 * like "American literature" and "New York Times reviewed". Calling one of them
 * the genre would mean choosing, and choosing is what the app asks a model to do
 * or leaves to the reader.
 */
export function toRecord(code, entry, { subjects = 8 } = {}) {
  if (!entry || !entry.title) return null
  const title = [entry.title, entry.subtitle].filter(Boolean).join(': ')
  const keywords = (entry.subjects || [])
    .map((s) => s?.name)
    .filter((name) => name && !NOT_A_SUBJECT.test(name))
    .slice(0, subjects)

  return {
    title,
    authors: (entry.authors || []).map((a) => a?.name).filter(Boolean),
    publisher: (entry.publishers || [])[0]?.name || null,
    published_year: publishedYear(entry.publish_date),
    pages: Number.isInteger(entry.number_of_pages) ? entry.number_of_pages : null,
    keywords: keywords.length ? keywords.join(', ') : null,
    isbn: code,
  }
}

export class LookupError extends Error {}

/**
 * Look up every code, a batch at a time.
 *
 * `onProgress` is called with how many are done, because a hundred books is
 * several requests and a button that says nothing for ten seconds looks like a
 * button that failed.
 *
 * A code the service has no answer for comes back in `missing` rather than as
 * an error: a shelf where three books are unknown is still a shelf where the
 * rest are known.
 */
export async function lookup(codes, { fetcher = fetch, signal, onProgress } = {}) {
  const found = []
  const missing = []
  let done = 0

  for (let i = 0; i < codes.length; i += BATCH) {
    const batch = codes.slice(i, i + BATCH)
    let payload
    try {
      const response = await fetcher(lookupUrl(batch), { signal })
      if (!response.ok) throw new LookupError(`the lookup service answered ${response.status}`)
      payload = await response.json()
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      throw new LookupError(
        `could not reach the lookup service: ${err?.message || err}. ` +
          'This is the one step that needs a connection.',
      )
    }

    for (const code of batch) {
      const record = toRecord(code, payload[`ISBN:${code}`])
      if (record) found.push(record)
      else missing.push(code)
    }
    done += batch.length
    onProgress?.({ done, total: codes.length })
  }

  return { found, missing }
}
