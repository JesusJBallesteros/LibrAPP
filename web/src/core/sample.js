// Choosing which books to name in the reader profile.
//
// The catalog can hold hundreds of titles and the profile is sent with every
// request, so naming them all would crowd out the question and be paid for each
// time. Naming the thirty newest is cheap but tells a model about the last two
// years and nothing else: a collection built over a decade looks, from that
// list, like it began the year before last.
//
// So the sample is proportional rather than recent. Each genre gets a share of
// the slots matching its share of the shelf, and within a genre the books that
// carry the most signal go first. The result is a cross-section: a model reading
// it sees the same shape it would see standing in front of the shelves.
//
// Deterministic on purpose. The same catalog yields the same sample, so a
// profile can be cached, compared between runs, and reasoned about.

/** The genre a book is filed under, or a single bucket for the unfiled. */
const genreOf = (book) => {
  const tag = (book.tags || []).find((t) => t.kind === 'genre')
  return tag?.value || book.genre || null
}

/**
 * How much a book tells a model about its reader.
 *
 * A book somebody marked, wrote about, finished, or rated says more than one
 * that arrived in a spreadsheet and was never touched. Ordering by this inside
 * each genre means the sample is not merely proportional but informative.
 */
export function signal(book) {
  let score = 0
  if (book.favourite) score += 8
  if (book.notes) score += 6
  if (book.read === true) score += 3
  if (book.read === false) score += 1
  if (book.rating != null) score += 2
  if (book.abstract) score += 1
  if (book.pages != null) score += 1
  if (book.published_year != null) score += 1
  if (book.acquired_on) score += 1
  return score
}

/**
 * Split `total` slots between buckets in proportion to their size.
 *
 * Largest remainder, so the shares add up to exactly the total rather than to
 * whatever rounding leaves behind. Every bucket with any books in it gets at
 * least one slot while slots remain, because a genre represented by nothing at
 * all reads as a genre that is not there.
 */
export function allocate(sizes, total) {
  const names = [...sizes.keys()]
  const sum = names.reduce((n, key) => n + sizes.get(key), 0)
  if (!sum || total <= 0) return new Map(names.map((key) => [key, 0]))

  // One each first, in size order, for as many as the budget allows.
  const order = [...names].sort((a, b) => sizes.get(b) - sizes.get(a) || (a < b ? -1 : 1))
  const share = new Map(names.map((key) => [key, 0]))
  let left = total
  for (const key of order) {
    if (left === 0) break
    share.set(key, 1)
    left -= 1
  }
  if (left === 0) return share

  // The rest proportionally, largest remainder taking the odd ones.
  const claims = order.map((key) => {
    const exact = (sizes.get(key) / sum) * left
    return { key, whole: Math.floor(exact), rest: exact - Math.floor(exact) }
  })
  let placed = 0
  for (const claim of claims) {
    const room = sizes.get(claim.key) - share.get(claim.key)
    const take = Math.min(claim.whole, room)
    share.set(claim.key, share.get(claim.key) + take)
    placed += take
  }
  let spare = left - placed
  for (const claim of [...claims].sort((a, b) => b.rest - a.rest || (a.key < b.key ? -1 : 1))) {
    if (spare === 0) break
    if (share.get(claim.key) >= sizes.get(claim.key)) continue
    share.set(claim.key, share.get(claim.key) + 1)
    spare -= 1
  }
  return share
}

/**
 * A cross-section of the shelf, at most `limit` books.
 *
 * Returns them in a stable order: by genre, largest genre first, and by signal
 * within each. Books a reader marked or wrote about are always in, whatever
 * their genre's share, because those are the ones stating a preference outright
 * and a sample that dropped them would be the least useful one possible.
 */
export function representative(books, limit = 40) {
  if (books.length <= limit) return [...books]

  const spoken = books.filter((b) => b.favourite || b.notes)
  const rest = books.filter((b) => !b.favourite && !b.notes)
  const room = Math.max(0, limit - spoken.length)

  const buckets = new Map()
  for (const book of rest) {
    const key = genreOf(book) || '￿unfiled'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(book)
  }

  const sizes = new Map([...buckets].map(([key, list]) => [key, list.length]))
  const share = allocate(sizes, room)

  const picked = []
  for (const [key, list] of [...buckets].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1))) {
    const ranked = [...list].sort(
      (a, b) => signal(b) - signal(a) || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0),
    )
    picked.push(...ranked.slice(0, share.get(key) || 0))
  }

  // The marked ones lead, since they are the reader speaking rather than the
  // catalog being counted.
  return [...spoken.sort((a, b) => signal(b) - signal(a)), ...picked].slice(0, limit)
}
