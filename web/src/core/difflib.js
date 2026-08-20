// A faithful port of the part of Python's difflib that LibrAPP depends on.
//
// Every matching threshold in the merge was tuned against CPython's
// SequenceMatcher.ratio(). "Close enough" is not good enough here: a similarity
// that reads 0.61 where Python read 0.63 does not fail loudly, it just stops
// merging a book with itself, and the catalog quietly grows duplicates.
//
// So this follows CPython's algorithm step for step, including the autojunk
// heuristic — which does fire in practice, because a collapsed series row can
// carry an 800-character title.
//
// Reference: CPython Lib/difflib.py, class SequenceMatcher.

/** Indices of each element of `b`, and the autojunk set CPython would build. */
function chainB(b, autojunk) {
  const b2j = new Map()
  for (let i = 0; i < b.length; i++) {
    const ch = b[i]
    const at = b2j.get(ch)
    if (at) at.push(i)
    else b2j.set(ch, [i])
  }

  // CPython: for sequences of 200 elements or more, elements occurring in more
  // than 1% of positions are treated as junk and removed from consideration.
  const bjunk = new Set()
  const n = b.length
  if (autojunk && n >= 200) {
    const ntest = Math.floor(n / 100) + 1
    for (const [ch, idxs] of b2j) {
      if (idxs.length > ntest) bjunk.add(ch)
    }
    for (const ch of bjunk) b2j.delete(ch)
  }
  return { b2j, bjunk }
}

/**
 * The longest matching block in a[alo:ahi] against b[blo:bhi].
 *
 * Returns [i, j, size] — the same triple CPython returns, chosen by the same
 * tie-breaking rule (earliest in a, then earliest in b).
 */
function findLongestMatch(a, b, b2j, bjunk, alo, ahi, blo, bhi) {
  let besti = alo
  let bestj = blo
  let bestsize = 0

  let j2len = new Map()
  for (let i = alo; i < ahi; i++) {
    const newj2len = new Map()
    const idxs = b2j.get(a[i])
    if (idxs) {
      for (const j of idxs) {
        if (j < blo) continue
        if (j >= bhi) break
        const k = (j2len.get(j - 1) || 0) + 1
        newj2len.set(j, k)
        if (k > bestsize) {
          besti = i - k + 1
          bestj = j - k + 1
          bestsize = k
        }
      }
    }
    j2len = newj2len
  }

  // Extend past elements that are equal but were excluded as junk, then past
  // junk elements themselves — both loops exactly as CPython orders them.
  while (
    besti > alo &&
    bestj > blo &&
    !bjunk.has(b[bestj - 1]) &&
    a[besti - 1] === b[bestj - 1]
  ) {
    besti--
    bestj--
    bestsize++
  }
  while (
    besti + bestsize < ahi &&
    bestj + bestsize < bhi &&
    !bjunk.has(b[bestj + bestsize]) &&
    a[besti + bestsize] === b[bestj + bestsize]
  ) {
    bestsize++
  }
  while (
    besti > alo &&
    bestj > blo &&
    bjunk.has(b[bestj - 1]) &&
    a[besti - 1] === b[bestj - 1]
  ) {
    besti--
    bestj--
    bestsize++
  }
  while (
    besti + bestsize < ahi &&
    bestj + bestsize < bhi &&
    bjunk.has(b[bestj + bestsize]) &&
    a[besti + bestsize] === b[bestj + bestsize]
  ) {
    bestsize++
  }

  return [besti, bestj, bestsize]
}

/** Total size of all matching blocks, which is CPython's `M` in 2M/T. */
function matchedCount(a, b, autojunk = true) {
  const { b2j, bjunk } = chainB(b, autojunk)
  const queue = [[0, a.length, 0, b.length]]
  let matched = 0

  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop()
    const [i, j, k] = findLongestMatch(a, b, b2j, bjunk, alo, ahi, blo, bhi)
    if (!k) continue
    matched += k
    if (alo < i && blo < j) queue.push([alo, i, blo, j])
    if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi])
  }
  return matched
}

/**
 * CPython's SequenceMatcher(None, a, b).ratio().
 *
 * Compares by code point, matching Python 3's treatment of strings as
 * sequences of characters rather than UTF-16 units — an accented letter must
 * count once, not twice.
 */
export function ratio(a, b) {
  const total = [...a]
  const other = [...b]
  if (!total.length && !other.length) return 1.0
  const T = total.length + other.length
  if (!T) return 1.0
  return (2.0 * matchedCount(total, other)) / T
}
