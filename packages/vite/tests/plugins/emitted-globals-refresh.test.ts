import { EventEmitter } from 'node:events'
import { afterEach, expect, test, vi } from 'vitest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import EmittedGlobalsVirtualModulePlugin from '../../src/plugins/emitted-globals-virtual-module'
import { getExtractedCSSResult } from '../../src/utils/extracted-css'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID } from '../../src/common'

vi.mock('../../src/utils/extracted-css', () => ({ getExtractedCSSResult: vi.fn() }))
vi.mock('@master/css-compiler/project', async original => ({
  ...await original<typeof import('@master/css-compiler/project')>(), discoverManifestEntries: async () => []
}))
afterEach(() => vi.resetAllMocks())

function server() {
  const environment = (consumer: string) => ({
    config: { consumer }, moduleGraph: { getModuleById: () => ({ id: RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, isSelfAccepting: true }) },
    waitForRequestsIdle: vi.fn(async () => {}), reloadModule: vi.fn(async () => {})
  })
  return {
    config: { root: '/unused', command: 'serve', logger: { error: vi.fn() } },
    environments: { client: environment('client'), ssr: environment('server') }, httpServer: new EventEmitter()
  }
}
function fixture() {
  const host = server(), context = { config: host.config } as any
  const plugin = EmittedGlobalsVirtualModulePlugin(context) as any
  let globals: MasterCSSEmittedGlobals = { variables: { a: 1, b: 2 }, keyframes: {}, keyframeSlots: ['one', 'two'], suppressedKeyframes: [] }
  vi.mocked(getExtractedCSSResult).mockImplementation(async () => {
    context.emittedGlobals = structuredClone(globals)
    context.onEmittedGlobalsChange?.()
    return { css: '', diagnostics: [], emittedGlobals: context.emittedGlobals }
  })
  plugin.configureServer(host)
  return {
    host, context, plugin,
    set(value: MasterCSSEmittedGlobals) { globals = value },
    load: (environment: unknown) => plugin.load.call({ environment }, RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
  }
}

test('initial loads and equivalent records never reload either environment; ordered metadata still updates', async () => {
  const f = fixture()
  for (const environment of Object.values(f.host.environments)) await f.load(environment)
  f.set({ variables: { b: 2, a: 1 }, keyframeSlots: ['one', 'two'] })
  await f.context.refreshEmittedGlobals()
  for (const environment of Object.values(f.host.environments)) expect(environment.reloadModule).not.toHaveBeenCalled()
  f.set({ variables: { a: 1, b: 2 }, keyframeSlots: ['two', 'one'], suppressedKeyframes: ['hidden'] })
  await f.context.refreshEmittedGlobals()
  for (const environment of Object.values(f.host.environments)) expect(environment.reloadModule).toHaveBeenCalledOnce()
  f.host.httpServer.emit('close')
})

test('a discovery burst waits for the initial graph and publishes the latest state once', async () => {
  const f = fixture(), environment = f.host.environments.ssr
  await f.load(environment)
  let release!: () => void
  const blocked = new Promise<void>(resolve => { release = resolve })
  environment.waitForRequestsIdle.mockReturnValue(blocked)
  vi.mocked(getExtractedCSSResult).mockClear()
  const pending = f.context.refreshEmittedGlobals()
  await vi.waitFor(() => expect(environment.waitForRequestsIdle).toHaveBeenCalled())
  for (let index = 0; index < 30; index++) { f.set({ variables: { latest: index } }); void f.context.refreshEmittedGlobals() }
  expect(getExtractedCSSResult).not.toHaveBeenCalled()
  release()
  await pending
  expect(f.context.emittedGlobals.variables).toEqual({ latest: 29 })
  expect(getExtractedCSSResult).toHaveBeenCalledTimes(2)
  expect(environment.reloadModule).toHaveBeenCalledOnce()
  f.host.httpServer.emit('close')
})

test('metadata and HMR failures can retry without losing an unpublished change', async () => {
  const f = fixture(), environment = f.host.environments.ssr
  await f.load(environment)
  f.set({ variables: { changed: 1 } })
  vi.mocked(getExtractedCSSResult).mockRejectedValueOnce(Error('compile failed'))
  await f.context.refreshEmittedGlobals()
  expect(f.host.config.logger.error).toHaveBeenCalledWith('Error: compile failed')
  environment.reloadModule.mockRejectedValueOnce(Error('reload failed'))
  await f.context.refreshEmittedGlobals()
  await f.context.refreshEmittedGlobals()
  expect(environment.reloadModule).toHaveBeenCalledTimes(2)
  f.host.httpServer.emit('close')
})

test.each(['environment', 'server', 'restart'])('%s closure releases pending graph work and suppresses late updates', async kind => {
  const f = fixture(), environment = f.host.environments.ssr
  await f.load(environment)
  let release!: () => void
  environment.waitForRequestsIdle.mockReturnValue(new Promise<void>(resolve => { release = resolve }))
  vi.mocked(getExtractedCSSResult).mockClear()
  const pending = f.context.refreshEmittedGlobals()
  await vi.waitFor(() => expect(environment.waitForRequestsIdle).toHaveBeenCalled())
  const replacement = server()
  if (kind === 'environment') f.plugin.closeBundle.call({ environment })
  else if (kind === 'server') f.host.httpServer.emit('close')
  else f.plugin.configureServer(replacement)
  try {
    let finished = false
    void pending.then(() => { finished = true })
    await vi.waitFor(() => expect(finished).toBe(true))
    expect(getExtractedCSSResult).not.toHaveBeenCalled()
    expect(environment.reloadModule).not.toHaveBeenCalled()
    if (kind === 'restart') {
      await f.load(replacement.environments.ssr)
      f.set({ variables: { next: 1 } })
      await f.context.refreshEmittedGlobals()
      expect(replacement.environments.ssr.reloadModule).toHaveBeenCalledOnce()
      expect(environment.reloadModule).not.toHaveBeenCalled()
    }
  } finally { release(); f.host.httpServer.emit('close'); replacement.httpServer.emit('close') }
})
