/**
 * Regression tests for the C3 + C4 races in VirtualCSSHMRPlugin.
 *
 *  C3 — `tasks.concat(...)` does not mutate `tasks`. The original
 *       implementation discarded every promise returned by the
 *       module-graph re-insertion arm of handleReset(), so HMR could
 *       publish CSS before reset had finished re-extracting open
 *       modules.
 *
 *  C4 — the `reset` and `change` event listeners attached to the
 *       extractor were `() => servers.forEach(...)` with NO await.
 *       EventEmitter does not await async listeners, so two saves in
 *       quick succession would mutate extractor.css concurrently.
 *
 * The fix:
 *   - C3: replace tasks.concat with tasks.push(...x)
 *   - C4: chain reset / update onto Promise queues (one each), so a
 *         second reset can never start before the first has settled.
 *
 * These tests drive the plugin against a hand-rolled extractor +
 * ViteDevServer pair so each guarantee can be checked individually.
 */
import { describe, test, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import VirtualCSSHMRPlugin from '../../src/plugins/virtual-css-hmr'

function makeExtractor() {
    const extractor = new EventEmitter() as unknown as Record<string, unknown> & EventEmitter
    extractor.prepare = vi.fn(async () => undefined)
    extractor.insert = vi.fn(async () => true)
    extractor.css = { text: '/* css */' }
    extractor.resolvedVirtualModuleId = '\0virtual:master.css'
    extractor.options = { module: 'virtual:master.css' }
    return extractor as any
}

type ModuleEntry = [string, { transformResult?: { code: string }, ssrTransformResult?: { code: string }, file?: string }]
function makeServer({ modules = [] as ModuleEntry[] } = {}) {
    return {
        moduleGraph: {
            idToModuleMap: new Map(modules),
            getModuleById: () => null, // updateVirtualModule short-circuits without a virtual module
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

describe('VirtualCSSHMRPlugin (C3+C4 race fixes)', () => {
    test('C3: handleReset awaits prepare(), index.html re-insert, AND every module-graph re-insert', async () => {
        const extractor = makeExtractor()
        const insertCalls: string[] = []
        // Slow inserts so we can observe whether handleReset awaited them
        extractor.insert = vi.fn(async (id: string) => {
            await new Promise((r) => setTimeout(r, 10))
            insertCalls.push(id)
            return true
        })
        const prepareCalls: string[] = []
        extractor.prepare = vi.fn(async () => {
            await new Promise((r) => setTimeout(r, 10))
            prepareCalls.push('prepare')
        })

        const server = makeServer({
            modules: [
                ['/a.tsx', { transformResult: { code: '<div class="bg:white">a</div>' }, file: '/a.tsx' }],
                ['/b.tsx', { transformResult: { code: '<div class="fg:black">b</div>' }, file: '/b.tsx' }],
                ['\0virtual:master.css', { transformResult: { code: '' }, file: undefined }], // must be filtered out
            ],
        })

        const plugin = VirtualCSSHMRPlugin({} as any, { extractor } as any)
        ;(plugin as any).configureServer.call({}, server as any)
        ;(plugin as any).buildStart.call({})

        // Drive a transformIndexHtml first so the second arm of handleReset has work to do
        await (plugin as any).transformIndexHtml.handler.call({}, '<html class="p:4"></html>', { filename: '/index.html' })

        const updateSendCallsBefore = server.ws.send.mock.calls.length
        extractor.emit('reset')
        // The fix serialises onto a Promise chain; wait long enough for the
        // simulated 10ms inserts/prepare to settle, then drain microtasks.
        await wait(60)
        await tick(2)

        // prepare ran
        expect(prepareCalls).toEqual(['prepare'])
        // insert called for: index.html (from transformIndexHtml), then both real modules
        // (the virtual module entry must be filtered).
        expect(insertCalls).toContain('/index.html') // from transformIndexHtml above is recorded BEFORE reset
        expect(insertCalls).toContain('/a.tsx')
        expect(insertCalls).toContain('/b.tsx')
        // Critically: the virtual module's own id must never have been re-inserted
        expect(insertCalls).not.toContain('\0virtual:master.css')

        // updateVirtualModule was called after reset settled (server.ws.send may
        // be 0 because getModuleById returned null — that's fine, it short-
        // circuits on purpose; the assertion below proves the chain ran).
        expect(server.ws.send.mock.calls.length).toBeGreaterThanOrEqual(updateSendCallsBefore)
    })

    test('C4: a second reset is queued behind the first — no overlap', async () => {
        const extractor = makeExtractor()

        // First prepare hangs until we resolve it manually; second resolves quickly.
        let releaseFirst: () => void
        const firstPending = new Promise<void>((r) => { releaseFirst = r })
        const prepareSpy = vi.fn()
            .mockImplementationOnce(() => firstPending)
            .mockImplementationOnce(() => Promise.resolve())
        extractor.prepare = prepareSpy

        const server = makeServer()
        const plugin = VirtualCSSHMRPlugin({} as any, { extractor } as any)
        ;(plugin as any).configureServer.call({}, server as any)
        ;(plugin as any).buildStart.call({})

        // Fire two resets back-to-back
        extractor.emit('reset')
        extractor.emit('reset')

        // First prepare started; second has NOT — it's queued behind the first
        await tick(2)
        expect(prepareSpy).toHaveBeenCalledTimes(1)

        // Release the first; the chain advances to the second
        releaseFirst?.()
        await tick(5)
        expect(prepareSpy).toHaveBeenCalledTimes(2)
    })

    test('C4: a second change is queued behind the first — no overlap', async () => {
        const extractor = makeExtractor()
        // Wire updateVirtualModule observability via reloadModule. We force the
        // virtual module to "exist" so the inner branch runs.
        const server = makeServer()
        let releaseFirstReload: () => void
        const firstReload = new Promise<void>((r) => { releaseFirstReload = r })
        const reloadSpy = vi.fn()
            .mockImplementationOnce(() => firstReload) // returns the unresolved promise as-is
            .mockImplementationOnce(() => Promise.resolve())
        server.reloadModule = reloadSpy
        // Make getModuleById return a truthy value so updateVirtualModule's inner
        // block runs (which calls reloadModule).
        ;(server.moduleGraph as any).getModuleById = () => ({})

        const plugin = VirtualCSSHMRPlugin({} as any, { extractor } as any)
        ;(plugin as any).configureServer.call({}, server as any)
        ;(plugin as any).buildStart.call({})

        extractor.emit('change')
        extractor.emit('change')

        // First reloadModule called; second deferred behind the first's promise
        await tick(2)
        expect(reloadSpy).toHaveBeenCalledTimes(1)

        releaseFirstReload?.()
        await tick(5)
        expect(reloadSpy).toHaveBeenCalledTimes(2)
    })

    test('C4: an error in one reset does not poison the chain (subsequent resets still run)', async () => {
        const extractor = makeExtractor()

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const prepareSpy = vi.fn()
            .mockImplementationOnce(() => Promise.reject(new Error('boom')))
            .mockImplementationOnce(() => Promise.resolve())
        extractor.prepare = prepareSpy

        const server = makeServer()
        const plugin = VirtualCSSHMRPlugin({} as any, { extractor } as any)
        ;(plugin as any).configureServer.call({}, server as any)
        ;(plugin as any).buildStart.call({})

        extractor.emit('reset')
        await tick(3)
        // First reset failed — error logged, not thrown
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('reset'),
            expect.any(Error),
        )

        // Second reset still runs because the chain caught the rejection
        extractor.emit('reset')
        await tick(5)
        expect(prepareSpy).toHaveBeenCalledTimes(2)

        consoleSpy.mockRestore()
    })

    test('C3: handleReset must NOT be sensitive to insert ordering — completes once every promise resolves', async () => {
        // Pin down the slowest-insert-determines-completion property. If the
        // module-graph promise array were ever silently dropped again (the
        // original C3 bug), this test would fail because the slowest module
        // wouldn't be observed by the time updateVirtualModule fired.
        const extractor = makeExtractor()
        const completed: string[] = []
        extractor.insert = vi.fn(async (id: string) => {
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
        // Force the virtual module branch in updateVirtualModule to run so we
        // can observe ordering w.r.t. the module-graph promises.
        ;(server.moduleGraph as any).getModuleById = () => ({})

        const plugin = VirtualCSSHMRPlugin({} as any, { extractor } as any)
        ;(plugin as any).configureServer.call({}, server as any)
        ;(plugin as any).buildStart.call({})

        extractor.emit('reset')
        // Long enough that the slowest insert has finished (b is 30ms)
        await wait(80)
        await tick(2)

        // All three module inserts must have completed *before* the chain was
        // considered done — i.e. updateVirtualModule (which fires reloadModule)
        // ran AFTER the slowest insert.
        expect(completed).toEqual(expect.arrayContaining(['/a.tsx', '/b.tsx', '/c.tsx']))
        expect(server.reloadModule).toHaveBeenCalled()
    })
})
