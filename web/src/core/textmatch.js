// Port of tools/librapp/textmatch.py. Deciding whether two records name the
// same book or the same person.
//
// Two differences between Python and JavaScript regular expressions matter
// here, and both are silent if you get them wrong:
//
//   * Python's `\w` and `\b` are Unicode-aware. JavaScript's are ASCII-only, so
//     /\bclasica\b/ behaves one way and /\bclásica\b/ another. Every word
//     boundary below is written as an explicit lookaround over WORD instead.
//   * Python's `re.split(..., maxsplit=1)` stops splitting; JavaScript's
//     `split(re, limit)` splits everywhere and then truncates. `splitFirst`
//     does what Python does.

import { ratio } from './difflib.js'

/** What Python's `\w` matches under Unicode: letters, digits, underscore. */
const WORD = '\\p{L}\\p{N}_'
const notWord = (body) => new RegExp(`(?<![${WORD}])(?:${body})(?![${WORD}])`, 'iu')

export const TITLE_MATCH_THRESHOLD = 0.62
export const UNCREDITED_MATCH_THRESHOLD = 0.95

const EDITION_WORDS =
  'biblioteca|cl[aá]sica|gredos|bolsillo|edici[oó]n|ed\\.|vol\\.|n[oº]?\\s*\\d+|' +
  'divulgaci[oó]n|runas|bloomsbury|sigma'
const EDITION_NOISE = new RegExp(
  `\\((?:[^()]*(?<![${WORD}])(?:${EDITION_WORDS})(?![${WORD}])[^()]*)\\)`,
  'giu',
)

const SERIES_PATTERNS = [
  /\((?<series>[^()]+?)\s+(?<index>\d{1,2})\)\s*$/u,
  /\((?<series>[^()]+?)\s+(?<index>[IVX]{1,5})\)\s*$/u,
  new RegExp(`:\\s*(?<series>[^:]+?):\\s*Libro\\s+(?<index>[IVX]{1,5}|\\d{1,2})(?![${WORD}])`, 'u'),
]
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }

const LABEL = /\[([^\]]+)\]/u
const EDITORIAL =
  /\((?:\s*(?:eds?\.|edited by|trans\.|translated by|coord\.|comp\.)\s*)(?<who>[^)]*)\)/giu

// Python folds case with str.casefold(), which is not str.lower(). Where they
// differ, one letter folds to several or to a different letter entirely, and
// JavaScript's toLowerCase() leaves it alone. That silently breaks matching:
// 'Straße' and 'STRASSE' stop being the same word, and a Greek title ending in
// a final sigma stops matching the same title written with a medial one.
//
// Only the cases that can plausibly appear in a book catalogue are listed —
// German, Greek, and the Latin ligatures. The ligatures matter even though
// NFKC resolves them, because slugify() folds without normalising first.
const CASEFOLD_SPECIALS = new Map([
  ['ß', 'ss'], // ß
  ['ẞ', 'ss'], // ẞ
  ['ς', 'σ'], // final sigma folds to sigma
  ['ŉ', 'ʼn'], // ŉ
  ['ǰ', 'ǰ'], // ǰ
  ['İ', 'i̇'], // İ
  ['ẖ', 'ẖ'],
  ['ẗ', 'ẗ'],
  ['ẘ', 'ẘ'],
  ['ẙ', 'ẙ'],
  ['ẚ', 'aʾ'],
  ['ﬀ', 'ff'],
  ['ﬁ', 'fi'],
  ['ﬂ', 'fl'],
  ['ﬃ', 'ffi'],
  ['ﬄ', 'ffl'],
  ['ﬅ', 'st'],
  ['ﬆ', 'st'],
])

/** Python's str.casefold(), for the letters a book catalogue can contain. */
export function casefold(s) {
  let out = ''
  for (const ch of (s || '').toLowerCase()) out += CASEFOLD_SPECIALS.get(ch) ?? ch
  return out
}

export const stripAccents = (s) => (s || '').normalize('NFD').replace(/\p{M}/gu, '')

/** Whitespace and Unicode tidied, text otherwise untouched. Safe for display. */
export const clean = (s) => (s || '').normalize('NFKC').replace(/\s+/g, ' ').trim()

/** Aggressive normalisation for comparison keys only, never for display. */
export const fold = (s) =>
  casefold(stripAccents((s || '').normalize('NFKC')))
    .replace(new RegExp(`[^${WORD}\\s]`, 'gu'), ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Python's re.split(pattern, s, maxsplit=1)[0]. */
function splitFirst(s, pattern) {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  const m = re.exec(s)
  return m ? s.slice(0, m.index) : s
}

/**
 * Comparable token set for a personal name.
 *
 * Sources disagree on order and punctuation: 'Pratchett, Terry' against
 * 'Terry Pratchett'. A set ignores order. Bare initials ('H. P.') carry no
 * signal and are dropped, leaving the surname to do the work.
 */
export function authorTokens(name) {
  return new Set(
    fold((name || '').replace(/,/g, ' '))
      .split(' ')
      .filter((t) => t.length > 1),
  )
}

/** A stable key for a token set, so it can be used in a Map. */
export const tokenKey = (tokens) => [...tokens].sort().join(' ')

/**
 * Split a multi-author credit into individual names. Semicolons separate
 * co-authors; commas cannot, because they already mean surname-first.
 */
export function splitCredits(name) {
  const parts = (name || '')
    .split(new RegExp(`;|\\s+&\\s+|\\s+y\\s+otros(?![${WORD}])`, 'u'))
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length) return parts
  const whole = (name || '').trim()
  return whole ? [whole] : []
}

/**
 * Keys a name is filed under when looking for candidate matches. Includes a
 * five-character prefix of every token, so spellings differing only in their
 * tail — 'Platon' against 'Plato' — still meet. Loose indexing is safe: it only
 * proposes candidates, and the title comparison decides.
 */
export function indexKeys(name) {
  const keys = new Set()
  for (const credit of splitCredits(name)) {
    for (const token of authorTokens(credit)) {
      keys.add(token)
      keys.add(token.slice(0, 5))
    }
  }
  return keys
}

/** Title reduced for comparison: edition noise and parentheses removed. */
export const titleKey = (title) =>
  fold((title || '').replace(EDITION_NOISE, ' ').replace(/\([^()]*\)/gu, ' '))

/** Just the main title, with any subtitle after a colon or dash dropped. */
export const titleHead = (title) => titleKey(splitFirst(title || '', /[:–—]|\s-\s/u))

export const similar = ratio

/**
 * How strongly two titles denote the same book.
 *
 * Containment matters more than edit distance: one source routinely holds a
 * longer form of the other — a subtitle, an edition line, a series note — which
 * wrecks a plain ratio while being near-proof of identity.
 */
export function titleScore(a, b) {
  if (!a || !b) return 0.0
  if (a === b) return 1.0
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  if (short.length >= 5 && ` ${long} `.includes(` ${short} `)) {
    return long.startsWith(short) ? 0.97 : 0.9
  }
  return ratio(a, b)
}

/** Title agreement, judged on the full titles and on the main titles. */
export const bestTitleScore = (a, b) =>
  Math.max(titleScore(titleKey(a), titleKey(b)), titleScore(titleHead(a), titleHead(b)))

export function slugify(...parts) {
  const joined = parts.filter(Boolean).join('-')
  const slug = casefold(stripAccents(joined))
    .replace(new RegExp(`[^${WORD}]+`, 'gu'), '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || 'untitled'
}

/** Series name and volume number, when the title states them plainly. */
export function detectSeries(title) {
  for (const pattern of SERIES_PATTERNS) {
    const m = pattern.exec(title || '')
    if (!m) continue
    const raw = m.groups.index.toUpperCase()
    const index = /^\d+$/.test(raw) ? Number(raw) : ROMAN[raw]
    if (index === undefined) continue
    let series = m.groups.series.replace(/\s+/g, ' ').replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    // Publisher collections number themselves 'Solaris ficcion no 12', leaving
    // a dangling 'no' once the number is taken as the index.
    series = series
      .replace(/\s+n[oº°]?\.?$/iu, '')
      .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    if (series.length < 3) continue
    return [series, index]
  }
  return [null, null]
}

/**
 * Pull the people out of a hand-written author field.
 *
 * Hand-kept lists put more than a name in that column: a stand-in for an
 * anonymous work, the editors of an edition, a real name behind a pen name.
 * Left alone these become authors called '[Varios] (eds. Meyer' — which then
 * merge with real people and corrupt the author list.
 *
 * Returns [people, label].
 */
export function creditsAndLabel(field) {
  let text = clean(field)
  if (!text) return [[], null]

  let label = null
  const m = LABEL.exec(text)
  if (m) {
    label = m[1].trim()
    text = text.replace(new RegExp(LABEL.source, 'gu'), ' ')
  }

  const people = []
  for (const editorial of text.matchAll(EDITORIAL)) {
    // Inside an editorial credit a comma separates people, not surname from
    // forename, so it is safe to split on here and nowhere else.
    for (const p of editorial.groups.who.split(/,|\s+&\s+|;/u)) {
      if (p.trim()) people.push(p.trim())
    }
  }
  text = text.replace(EDITORIAL, ' ').replace(/\([^)]*\)/gu, ' ')

  const found = splitCredits(text)
    .map((x) => clean(x))
    .filter(Boolean)
    .concat(people)
  return [found.filter((p) => authorTokens(p).size > 0), label]
}
