// Applies every exported textmatch function to the cases on stdin, so the
// Python original can be diffed against this port. Reads {fn: [args...]} pairs.
import * as T from '../src/core/textmatch.js'

const run = {
  fold: (s) => T.fold(s),
  clean: (s) => T.clean(s),
  strip_accents: (s) => T.stripAccents(s),
  author_tokens: (s) => [...T.authorTokens(s)].sort(),
  split_credits: (s) => T.splitCredits(s),
  index_keys: (s) => [...T.indexKeys(s)].sort(),
  title_key: (s) => T.titleKey(s),
  title_head: (s) => T.titleHead(s),
  title_score: (a, b) => T.titleScore(a, b),
  best_title_score: (a, b) => T.bestTitleScore(a, b),
  slugify: (...p) => T.slugify(...p),
  detect_series: (s) => T.detectSeries(s),
  credits_and_label: (s) => T.creditsAndLabel(s),
}

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => (input += c))
process.stdin.on('end', () => {
  const cases = JSON.parse(input)
  process.stdout.write(JSON.stringify(cases.map(([fn, args]) => run[fn](...args))))
})
