import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { afterEach, describe, expect, test, vi } from 'vitest'

const sessionFactory = vi.hoisted(() => ({
  pending: [] as ((session: unknown) => void)[],
  create: vi.fn(() => new Promise((resolve) => sessionFactory.pending.push(resolve)))
}))

vi.mock('../../src/scanner/binding-session', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/scanner/binding-session')>(),
  createScannerSession: sessionFactory.create
}))

import { MasterCSSScanner } from '../../src/scanner'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createBindingSession() {
  return {
    binding: 'wasm' as const,
    extractCandidates: vi.fn(() => []),
    collectCandidates: vi.fn(() => []),
    filterCandidates: vi.fn(() => []),
    scanCandidates: vi.fn(),
    nativeDeclarationCandidates: vi.fn(() => []),
    generateValidationBatch: vi.fn(),
    invalidGeneratedClasses: vi.fn(() => []),
    ensureClasses: vi.fn(),
    registerNativeClasses: vi.fn(() => false),
    reset: vi.fn(),
    state: vi.fn(),
    dispose: vi.fn()
  }
}

afterEach(() => {
  sessionFactory.pending.length = 0
  sessionFactory.create.mockClear()
})

describe('MasterCSSScanner lifecycle', () => {
  test('dispose invalidates a pending init and emits before removing listeners', async () => {
    const scanner = new MasterCSSScanner({ manifest: defaultManifest })
    const bindingSession = createBindingSession()
    const disposeStates: { initialized: boolean, stateCleared: boolean }[] = []
    scanner.on('dispose', () => {
      let stateCleared = false
      try {
        void scanner.state
      } catch {
        stateCleared = true
      }
      disposeStates.push({ initialized: scanner.initialized, stateCleared })
    })

    const initializing = scanner.init()
    await scanner.dispose()
    sessionFactory.pending.shift()!(bindingSession)
    await initializing

    expect(bindingSession.dispose).toHaveBeenCalledTimes(1)
    expect(scanner.initialized).toBe(false)
    expect(scanner.initializing).toBeUndefined()
    expect(disposeStates).toEqual([{ initialized: false, stateCleared: true }])
    expect(scanner.listenerCount('dispose')).toBe(0)
    await expect(scanner.scan('index.html', '<div class="block"></div>'))
      .rejects.toThrow('must be initialized')
  })

  test('only the latest reset can commit its session and manifest', async () => {
    const scanner = new MasterCSSScanner({ manifest: defaultManifest })
    const initialSession = createBindingSession()
    const firstResetSession = createBindingSession()
    const latestSession = createBindingSession()
    const firstManifest = { version: 1, utilities: [] } as unknown as MasterCSSManifest
    const latestManifest = {
      version: 1,
      utilities: [{ id: 'latest', type: -2, emit: { type: 'static', rules: [] }, matchers: [] }]
    } as unknown as MasterCSSManifest

    const initializing = scanner.init()
    const firstReset = scanner.reset({ manifest: firstManifest })
    const latestReset = scanner.reset({ manifest: latestManifest })
    expect(sessionFactory.pending).toHaveLength(3)

    sessionFactory.pending[2](latestSession)
    await latestReset
    sessionFactory.pending[1](firstResetSession)
    await firstReset
    sessionFactory.pending[0](initialSession)
    await initializing

    expect(initialSession.dispose).toHaveBeenCalledTimes(1)
    expect(firstResetSession.dispose).toHaveBeenCalledTimes(1)
    expect(latestSession.dispose).not.toHaveBeenCalled()
    expect(scanner.initialized).toBe(true)
    expect(scanner.manifest).toEqual(latestManifest)
    await scanner.dispose()
    expect(latestSession.dispose).toHaveBeenCalledTimes(1)
  })
})
