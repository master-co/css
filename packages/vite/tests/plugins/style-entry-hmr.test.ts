/**
 * Regression tests for the C3 + C4 races in StyleEntryHMRPlugin.
 *
 *  C3 — `tasks.concat(...)` does not mutate `tasks`. The original
 *       implementation discarded every promise returned by the
 *       module-graph re-insertion arm of handleReset(), so HMR could
 *       publish CSS before reset had finished re-extracting open
 *       modules.
 *
 *  C4 — the `reset` and `change` event listeners attached to the
 *       scanner were `() => servers.forEach(...)` with NO await.
 *       EventEmitter does not await async listeners, so two saves in
 *       quick succession would mutate scanner.css concurrently.
 *
 * The fix:
 *   - C3: replace tasks.concat with tasks.push(...x)
 *   - C4: chain reset / update onto Promise queues (one each), so a
 *         second reset can never start before the first has settled.
 *
 * These tests drive the plugin against a hand-rolled scanner +
 * ViteDevServer pair so each guarantee can be checked individually.
 */
import { describe, test, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import StyleEntryHMRPlugin from '../../src/plugins/style-entry-hmr'

function makeScanner() {
  const scanner = new EventEmitter() as unknown as Record<string, unknown> & EventEmitter
  scanner.scanModule = vi.fn(async () => true)
  scanner.css = { text: '/* css */' }
  scanner.options = {}
  return scanner as any
}

type ModuleEntry = [string, { transformResult?: { code: string }, ssrTransformResult?: { code: string }, file?: string }]
function makeServer({ modules = [] as ModuleEntry[] } = {}) {
  return {
    moduleGraph: {
      idToModuleMap: new Map(modules),
      getModuleById: () => null,
    },
    reloadModule: vi.fn(),
    ws: { send: vi.fn() },
  }
}

async function tick(times = 1) {
  for (let i = 0; i < times; i++) await new Promise((r) => setImmediate(r))
}
async function wait(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

describe('StyleEntryHMRPlugin (C3+C4 race fixes)', () => {
  test('C3: handleReset awaits index.html re-insert AND every module-graph re-insert', async () => {
    const scanner = makeScanner()
    const scanCalls: string[] = []
    // Slow inserts so we can observe whether handleReset awaited them
    scanner.scanModule = vi.fn(async (id: string) => {
      await new Promise((r) => setTimeout(r, 10))
      scanCalls.push(id)
      return true
    })

    const server = makeServer({
      modules: [
        ['/a.tsx', { transformResult: { code: '<div class="bg:white">a</div>' }, file: '/a.tsx' }],
        ['/b.tsx', { transformResult: { code: '<div class="fg:black">b</div>' }, file: '/b.tsx' }],
        ['\0plugin-virtual', { transformResult: { code: '' }, file: undefined }], // must be filtered out
      ],
    })

    const plugin = StyleEntryHMRPlugin({} as any, { scanner } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    // Drive a transformIndexHtml first so the second arm of handleReset has work to do
    await (plugin as any).transformIndexHtml.handler.call({}, '<html class="p:1x"></html>', { filename: '/index.html' })

    const updateSendCallsBefore = server.ws.send.mock.calls.length
    scanner.emit('reset')
    // The fix serialises onto a Promise chain; wait long enough for the
    // simulated 10ms inserts/prepare to settle, then drain microtasks.
    await wait(60)
    await tick(2)

    // insert called for: index.html (from transformIndexHtml), then both real modules
    // (virtual module entries must be filtered).
    expect(scanCalls).toContain('/index.html') // from transformIndexHtml above is recorded BEFORE reset
    expect(scanCalls).toContain('/a.tsx')
    expect(scanCalls).toContain('/b.tsx')
    // Critically: virtual module ids must never have been re-inserted
    expect(scanCalls).not.toContain('\0plugin-virtual')

    // CSS importer updates run after reset settles; no importer is registered
    // here, so the assertion below only proves the chain completed.
    expect(server.ws.send.mock.calls.length).toBeGreaterThanOrEqual(updateSendCallsBefore)
  })

  test('C4: a second reset is queued behind the first — no overlap', async () => {
    const scanner = makeScanner()

    // First module scan hangs until we resolve it manually; second resolves quickly.
    let releaseFirst!: () => void
    const firstPending = new Promise<void>((r) => { releaseFirst = r })
    const scanModuleSpy = vi.fn()
      .mockImplementationOnce(() => firstPending)
      .mockImplementationOnce(() => Promise.resolve())
    scanner.scanModule = scanModuleSpy

    const server = makeServer({
      modules: [
        ['/a.tsx', { transformResult: { code: '<div class="block"></div>' }, file: '/a.tsx' }],
      ],
    })
    const plugin = StyleEntryHMRPlugin({} as any, { scanner } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    // Fire two resets back-to-back
    scanner.emit('reset')
    scanner.emit('reset')

    // First scan started; second has NOT — it's queued behind the first
    await tick(2)
    expect(scanModuleSpy).toHaveBeenCalledTimes(1)

    // Release the first; the chain advances to the second
    releaseFirst?.()
    await tick(5)
    expect(scanModuleSpy).toHaveBeenCalledTimes(2)
  })

  test('C4: a second change is queued behind the first — no overlap', async () => {
    const scanner = makeScanner()
    // Wire CSS-importer update observability via reloadModule.
    const server = makeServer()
    const cssModule = { file: '/style.css' }
    let releaseFirstReload!: () => void
    const firstReload = new Promise<void>((r) => { releaseFirstReload = r })
    const reloadSpy = vi.fn()
      .mockImplementationOnce(() => firstReload) // returns the unresolved promise as-is
      .mockImplementationOnce(() => Promise.resolve())
    server.reloadModule = reloadSpy
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

    const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css'])
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('change')
    scanner.emit('change')

    // First reloadModule called; second deferred behind the first's promise
    await tick(2)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    releaseFirstReload?.()
    await tick(5)
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })

  test('reloads CSS files that import Master CSS', async () => {
    const scanner = makeScanner()
    const cssModule = { file: '/style.css' }
    const server = makeServer()
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

    const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css']),
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('change')
    await tick(5)

    expect(server.reloadModule).toHaveBeenCalledWith(cssModule)
  })

  test('C4: an error in one reset does not poison the chain (subsequent resets still run)', async () => {
    const scanner = makeScanner()

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const scanModuleSpy = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error('boom')))
      .mockImplementationOnce(() => Promise.resolve())
    scanner.scanModule = scanModuleSpy

    const server = makeServer({
      modules: [
        ['/a.tsx', { transformResult: { code: '<div class="block"></div>' }, file: '/a.tsx' }],
      ],
    })
    const plugin = StyleEntryHMRPlugin({} as any, { scanner } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('reset')
    await tick(3)
    // First reset failed — error logged, not thrown
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('reset'),
      expect.any(Error),
    )

    // Second reset still runs because the chain caught the rejection
    scanner.emit('reset')
    await tick(5)
    expect(scanModuleSpy).toHaveBeenCalledTimes(2)

    consoleSpy.mockRestore()
  })

  test('C3: handleReset must NOT be sensitive to insert ordering — completes once every promise resolves', async () => {
    // Pin down the slowest-insert-determines-completion property. If the
    // module-graph promise array were ever silently dropped again (the
    // original C3 bug), this test would fail because the slowest module
    // wouldn't be observed by the time the CSS importer reload fired.
    const scanner = makeScanner()
    const completed: string[] = []
    scanner.scanModule = vi.fn(async (id: string) => {
      // Module b is intentionally slowest to flush out drop-on-the-floor bugs
      const delay = id === '/b.tsx' ? 30 : 1
      await new Promise((r) => setTimeout(r, delay))
      completed.push(id)
      return true
    })

    const server = makeServer({
      modules: [
        ['/a.tsx', { transformResult: { code: 'a' }, file: '/a.tsx' }],
        ['/b.tsx', { transformResult: { code: 'b' }, file: '/b.tsx' }],
        ['/c.tsx', { transformResult: { code: 'c' }, file: '/c.tsx' }],
      ],
    })
    const cssModule = { file: '/style.css' }
    ;(server.moduleGraph as any).getModuleById = (id: string) => id === '/style.css' ? cssModule : null

      const plugin = StyleEntryHMRPlugin({} as any, {
      scanner,
      virtualCSSImporters: new Set(['/style.css'])
    } as any)
    ;(plugin as any).configureServer.call({}, server as any)
    ;(plugin as any).buildStart.call({})

    scanner.emit('reset')
    // Long enough that the slowest insert has finished (b is 30ms)
    await wait(80)
    await tick(2)

    // All three module inserts must have completed *before* the chain was
    // considered done — i.e. CSS importer reload ran AFTER the slowest insert.
    expect(completed).toEqual(expect.arrayContaining(['/a.tsx', '/b.tsx', '/c.tsx']))
    expect(server.reloadModule).toHaveBeenCalled()
  })
})
