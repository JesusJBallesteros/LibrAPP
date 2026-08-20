// A small XML reader, enough for the two shapes LibrAPP has to read: a
// hand-kept catalog, and the parts of an .xlsx that hold a worksheet.
//
// The browser has DOMParser and Node does not, so using it would mean the
// parity harness tested something other than what ships. This is small enough
// to own, and being the same code in both places is worth more than the lines
// it costs.
//
// It handles elements, attributes, text, comments, CDATA, the five predefined
// entities and numeric character references. It does not handle DTDs,
// namespaces beyond keeping the prefix in the name, or entity declarations —
// none of which appear in a spreadsheet or in a catalog anyone writes by hand.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** Resolve the entity and character references XML guarantees. */
export function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return ENTITIES[body] ?? whole
  })
}

function parseAttributes(source) {
  const attrs = {}
  const re = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g
  let m
  while ((m = re.exec(source))) {
    attrs[m[1]] = decodeEntities(m[3] ?? m[4] ?? '')
  }
  return attrs
}

/**
 * Parse a document into a tree of {tag, attrs, children, text}.
 *
 * `text` is the element's own text with descendants' text included, which is
 * what every caller here wants.
 */
export function parseXml(source) {
  const root = { tag: '#document', attrs: {}, children: [], text: '' }
  const stack = [root]
  let i = 0

  while (i < source.length) {
    const lt = source.indexOf('<', i)
    if (lt < 0) break

    if (lt > i) {
      const text = decodeEntities(source.slice(i, lt))
      if (text.trim()) stack[stack.length - 1].text += text
      else if (text) stack[stack.length - 1].text += text
    }

    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt)
      i = end < 0 ? source.length : end + 3
      continue
    }
    if (source.startsWith('<![CDATA[', lt)) {
      const end = source.indexOf(']]>', lt)
      const body = source.slice(lt + 9, end < 0 ? source.length : end)
      stack[stack.length - 1].text += body
      i = end < 0 ? source.length : end + 3
      continue
    }
    if (source.startsWith('<?', lt) || source.startsWith('<!', lt)) {
      const end = source.indexOf('>', lt)
      i = end < 0 ? source.length : end + 1
      continue
    }

    const gt = source.indexOf('>', lt)
    if (gt < 0) break
    const inner = source.slice(lt + 1, gt)

    if (inner[0] === '/') {
      if (stack.length > 1) stack.pop()
      i = gt + 1
      continue
    }

    const selfClosing = inner.endsWith('/')
    const body = selfClosing ? inner.slice(0, -1) : inner
    const space = body.search(/\s/)
    const tag = (space < 0 ? body : body.slice(0, space)).trim()
    const node = {
      tag,
      attrs: space < 0 ? {} : parseAttributes(body.slice(space)),
      children: [],
      text: '',
    }
    stack[stack.length - 1].children.push(node)
    if (!selfClosing) stack.push(node)
    i = gt + 1
  }
  return root
}

/** Every element in the tree, depth first, including the root's children. */
export function* walk(node) {
  for (const child of node.children) {
    yield child
    yield* walk(child)
  }
}

/** Every element with this tag name, case-insensitively. */
export function* findAll(node, tag) {
  const wanted = tag.toLowerCase()
  for (const el of walk(node)) {
    if (el.tag.toLowerCase() === wanted || el.tag.toLowerCase().endsWith(`:${wanted}`)) yield el
  }
}

/** All text held by an element and its descendants. */
export function textOf(node) {
  let out = node.text
  for (const child of node.children) out += textOf(child)
  return out
}
