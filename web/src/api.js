// Everything the interface knows how to ask the local server.
//
// Uploads go up as a raw body with the filename in the query string rather than
// as a multipart form: the server is a standard-library HTTP handler, and this
// keeps the parsing on that side to nothing at all.

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`The server replied with something that is not JSON:\n${text.slice(0, 300)}`)
  }
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`)
  return payload
}

const upload = (path, file, params = {}) =>
  request(`${path}?${new URLSearchParams({ filename: file.name, ...params })}`, {
    method: 'POST',
    body: file,
  })

export const api = {
  state: () => request('/api/state'),
  catalog: () => request('/api/catalog'),
  context: () => request('/api/context'),
  prompt: (name) => request(`/api/prompt/${name}`),

  uploadPhoto: (file) => upload('/api/upload/photo', file),
  uploadTranscription: (file, params) => upload('/api/upload/transcription', file, params),
  probeList: (file) => upload('/api/probe/list', file),
  importList: (params) =>
    request(`/api/upload/list?${new URLSearchParams(params)}`, { method: 'POST' }),
  uploadExport: (file, params) => upload('/api/upload/export', file, params),

  rebuild: () => request('/api/rebuild', { method: 'POST' }),
  removeSource: (file) =>
    request(`/api/source/delete?${new URLSearchParams({ file })}`, { method: 'POST' }),
}
