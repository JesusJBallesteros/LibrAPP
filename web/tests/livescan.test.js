// The viewfinder. A camera cannot be opened in a test runner, so what is
// checked here is the part that decides what the reader is told and whether the
// feature is offered at all. The stream handling itself is exercised in a
// browser, where a camera exists to be handed back.

import { describe, expect, it, vi } from 'vitest'
import { cameraAvailable, describeCameraError } from '../src/components/LiveScan.jsx'

const t = (key) => key

describe('whether the camera is offered', () => {
  it('is not offered where the browser has no camera API at all', () => {
    vi.stubGlobal('navigator', {})
    expect(cameraAvailable()).toBe(false)
    vi.unstubAllGlobals()
  })

  it('is not offered where mediaDevices exists without getUserMedia', () => {
    // Some embedded browsers expose the object and not the method.
    vi.stubGlobal('navigator', { mediaDevices: {} })
    expect(cameraAvailable()).toBe(false)
    vi.unstubAllGlobals()
  })

  it('is offered where the browser can be asked', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => {} } })
    expect(cameraAvailable()).toBe(true)
    vi.unstubAllGlobals()
  })
})

// Every one of these is something the reader can act on, which is the point:
// "the camera could not be started" is true of all of them and useful for none.
describe('saying why the camera did not start', () => {
  it('tells somebody who refused it how to change their mind', () => {
    expect(describeCameraError({ name: 'NotAllowedError' }, t)).toBe('scan.denied')
  })

  it('treats a blocked insecure context the same as a refusal', () => {
    expect(describeCameraError({ name: 'SecurityError' }, t)).toBe('scan.denied')
  })

  it('says there is no camera rather than blaming the reader', () => {
    expect(describeCameraError({ name: 'NotFoundError' }, t)).toBe('scan.noCamera')
    expect(describeCameraError({ name: 'OverconstrainedError' }, t)).toBe('scan.noCamera')
  })

  it('says when something else already has it', () => {
    expect(describeCameraError({ name: 'NotReadableError' }, t)).toBe('scan.inUse')
  })

  it('falls back to whatever was thrown before falling back to nothing', () => {
    expect(describeCameraError({ message: 'odd failure' }, t)).toBe('odd failure')
    expect(describeCameraError({}, t)).toBe('scan.failed')
    expect(describeCameraError(null, t)).toBe('scan.failed')
  })
})
