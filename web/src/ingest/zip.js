// Reading the handful of files inside an .xlsx.
//
// A spreadsheet is a zip of XML. Rather than add a zip library to read four
// small entries, this walks the archive's central directory and inflates with
// DecompressionStream, which the browser and Node both provide, so nothing is
// bundled and nothing needs updating.
//
// Only what an .xlsx actually uses is supported: stored and deflated entries.
// Encryption, spanning and zip64 are not, and say so rather than misbehaving.

const SIGNATURE_CENTRAL = 0x02014b50
const SIGNATURE_END = 0x06054b50
const METHOD_STORE = 0
const METHOD_DEFLATE = 8

class Reader {
  constructor(bytes) {
    this.bytes = bytes
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }
  u16(at) { return this.view.getUint16(at, true) }
  u32(at) { return this.view.getUint32(at, true) }
}

/** Locate the end-of-central-directory record, allowing for a trailing comment. */
function findEnd(reader) {
  const { bytes } = reader
  const earliest = Math.max(0, bytes.length - 0xffff - 22)
  for (let at = bytes.length - 22; at >= earliest; at--) {
    if (reader.u32(at) === SIGNATURE_END) return at
  }
  throw new Error('not a zip archive (no end-of-central-directory record)')
}

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/**
 * The entries of a zip archive, as a Map of name to a function returning bytes.
 *
 * Entries are inflated on demand: an .xlsx holds a worksheet per sheet and only
 * one of them is usually wanted.
 */
export function readZip(bytes) {
  const reader = new Reader(bytes)
  const end = findEnd(reader)
  const count = reader.u16(end + 10)
  let at = reader.u32(end + 16)

  const entries = new Map()
  const decoder = new TextDecoder('utf-8')

  for (let n = 0; n < count; n++) {
    if (reader.u32(at) !== SIGNATURE_CENTRAL) break
    const method = reader.u16(at + 10)
    const compressedSize = reader.u32(at + 20)
    const nameLength = reader.u16(at + 28)
    const extraLength = reader.u16(at + 30)
    const commentLength = reader.u16(at + 32)
    const localAt = reader.u32(at + 42)
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength))

    entries.set(name, async () => {
      // The local header repeats the name and extra fields, at its own lengths.
      const localNameLength = reader.u16(localAt + 26)
      const localExtraLength = reader.u16(localAt + 28)
      const start = localAt + 30 + localNameLength + localExtraLength
      const raw = bytes.subarray(start, start + compressedSize)
      if (method === METHOD_STORE) return raw
      if (method === METHOD_DEFLATE) return inflate(raw)
      throw new Error(`${name}: unsupported compression method ${method}`)
    })

    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

/** One entry of an archive, decoded as UTF-8 text. */
export async function readZipText(entries, name) {
  const load = entries.get(name)
  if (!load) throw new Error(`${name} is not in the archive`)
  return new TextDecoder('utf-8').decode(await load())
}
