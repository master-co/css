import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer, type Plugin, type ViteDevServer } from 'vite'
import { MasterCSSServerRenderer } from '@master/css-server'
import { afterEach, expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const interception = vi.hoisted(() => ({ afterGlobals: undefined as (() => Promise<void>) | undefined }))
vi.mock('@master/css-compiler/stylesheet', async importOriginal => {
  const actual = await importOriginal<typeof import('@master/css-compiler/stylesheet')>()
  return { ...actual, async collectStylesheetEmittedGlobals(...args: Parameters<typeof actual.collectStylesheetEmittedGlobals>) {
    const result = await actual.collectStylesheetEmittedGlobals(...args)
    const after = interception.afterGlobals
    interception.afterGlobals = undefined
    await after?.()
    return result
  } }
})
afterEach(() => { interception.afterGlobals = undefined;vi.restoreAllMocks() })

const modes = ['static', 'runtime', 'pre-render', 'progressive'] as const
function fixture(initiallyMissing = false) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-manifest-lifecycle-'))), root = join(parent, 'app'), dependency = join(parent, 'external/deep/tokens.css')
  mkdirSync(root);mkdirSync(join(parent, 'external'))
  writeFileSync(join(root, 'style.css'), '@master entry;@reference "../external/deep/tokens.css";@components{card{@compose paint;}}')
  writeFileSync(join(root, 'entry.js'), 'export const ready=true;')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div class="card"></div></body></html>')
  const write = (padding = '7rem') => { mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, `@utilities{paint{padding:${padding}}}`) }
  if (!initiallyMissing) write()
  return { parent, root, dependency, write }
}
function noExternalEvents(): Plugin { return { name: 'test:miss-manifest-watch-registration', configureServer(server) { vi.spyOn(server.watcher, 'add').mockReturnValue(server.watcher) } } }
function reloaded(calls: readonly (readonly unknown[])[]) { return calls.some(([message]) => typeof message === 'object' && message !== null && 'type' in message && message.type === 'full-reload') }
async function html(server: ViteDevServer) {
  const result = await fetch(server.resolvedUrls!.local[0])
  return { status: result.status, text: await result.text() }
}
function hold(fail = false) {
  let release!: () => void, entered = false
  const gate = new Promise<void>(resolve => { release = resolve })
  interception.afterGlobals = async () => { entered = true;await gate;if (fail) throw new Error('controlled late manifest response failure') }
  return { release, entered: () => entered }
}

for (const fail of [false, true]) test.each(['pre-render', 'progressive'] as const)('BH-0004 SSR close preserves the live client renderer after pending manifest response in %s (failure=' + fail + ')', async mode => {
  const f = fixture();let server: ViteDevServer | undefined, pending: Promise<unknown> | undefined, gate: ReturnType<typeof hold> | undefined
  const render = vi.spyOn(MasterCSSServerRenderer.prototype, 'renderHTML')
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode, runtime: false }), server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/*'] }, fs: { allow: [f.parent] }, perEnvironmentStartEndDuringDev: true } })
    await server.listen();expect((await html(server)).text).toContain('.card{padding:7rem}')
    const liveRenderer = render.mock.contexts.at(-1)
    await server.environments.client.waitForRequestsIdle()
    gate = hold(fail)
    pending = server.environments.ssr.transformRequest('/entry.js').catch(error => error)
    await vi.waitFor(() => expect(gate!.entered()).toBe(true), { timeout: watchDeadline })
    const send = vi.spyOn(server.ws, 'send'), closing = server.environments.ssr.close()
    gate.release();await closing;await pending
    const result = await html(server)
    expect(result.status).toBe(200);expect(result.text).toContain('.card{padding:7rem}')
    expect(render.mock.contexts.at(-1)).toBe(liveRenderer)
    expect(send).not.toHaveBeenCalled()
  } finally { gate?.release();await pending;await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

test.each(modes)('BH-0004 restarting a failed manifest server transfers recovery to the new environment in %s', async mode => {
  const f = fixture(true);let server: ViteDevServer | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode, runtime: false }), noExternalEvents()], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen();expect((await html(server)).status).toBe(500)
    const old = server.environments.client, oldTransform = vi.spyOn(old, 'transformRequest')
    await old.waitForRequestsIdle();await server.restart();expect(server.environments.client).not.toBe(old)
    expect((await html(server)).status).toBe(500)
    oldTransform.mockClear();const send = vi.spyOn(server.ws, 'send');f.write()
    await vi.waitFor(() => expect(reloaded(send.mock.calls)).toBe(true), { timeout: watchDeadline })
    await expect.poll(async () => (await html(server!)).status, { timeout: watchDeadline }).toBe(200)
    if (mode === 'pre-render' || mode === 'progressive') expect((await html(server)).text).toContain('.card{padding:7rem}')
    expect(oldTransform).not.toHaveBeenCalled()
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

for (const fail of [false, true]) test.each(['pre-render', 'progressive'] as const)('BH-0004 an in-flight HMR manifest operation cannot notify or report errors after close in %s (failure=' + fail + ')', async mode => {
  const f = fixture();let server: ViteDevServer | undefined, gate: ReturnType<typeof hold> | undefined, pending: Promise<unknown> | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode, runtime: false }), server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/*'] }, fs: { allow: [f.parent] } } })
    await server.listen();expect((await html(server)).text).toContain('.card{padding:7rem}');await server.environments.client.waitForRequestsIdle()
    const hook = server.config.plugins.find(p => p.name === 'master-css:pre-render')!.handleHotUpdate
    if (typeof hook !== 'function') throw new Error('Expected pre-render HMR hook')
    gate = hold(fail);f.write('9rem')
    pending = Promise.resolve(hook.call({} as never, { file: f.dependency, server } as never)).catch(error => ({ error }))
    await vi.waitFor(() => expect(gate!.entered()).toBe(true), { timeout: watchDeadline })
    const send = vi.spyOn(server.ws, 'send'), closing = server.close()
    gate.release();await closing
    expect(await pending).toBeUndefined();expect(send).not.toHaveBeenCalled()
  } finally { gate?.release();await pending;await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

test('BH-0004 reconciliation updates an already loaded manifest through its HMR boundary', async () => {
  const f = fixture();let server: ViteDevServer | undefined
  try {
    writeFileSync(join(f.root, 'entry.js'), 'import manifest from "virtual:master-css-manifest";export default manifest;if(import.meta.hot)import.meta.hot.accept("virtual:master-css-manifest",()=>{});')
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'runtime', runtime: false }), noExternalEvents()], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen()
    const environment = server.environments.client
    await environment.transformRequest('/entry.js');await environment.waitForRequestsIdle()
    const module = environment.moduleGraph.getModuleById('\0virtual:master-css-manifest')!
    expect(module.isSelfAccepting).toBe(false)
    writeFileSync(f.dependency, '@utilities{paint{@compose lifecycle-invalid-class;}}')
    environment.moduleGraph.invalidateModule(module)
    await expect(environment.transformRequest(module.url)).rejects.toThrow('lifecycle-invalid-class')
    const send = vi.spyOn(server.ws, 'send');f.write('9rem')
    await vi.waitFor(() => expect(send).toHaveBeenCalled(), { timeout: watchDeadline })
    expect(reloaded(send.mock.calls)).toBe(false)
    expect(JSON.stringify(send.mock.calls)).toContain('js-update')
    expect((await environment.transformRequest(module.url))?.code).toContain('9rem')
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

for (const fail of [false, true]) test.each(['client', 'server'] as const)('BH-0004 closing %s during manifest recovery prevents late notifications (failure=' + fail + ')', async closing => {
  const f = fixture(true);let server: ViteDevServer | undefined, gate: ReturnType<typeof hold> | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'progressive', runtime: false }), noExternalEvents()], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen();expect((await html(server)).status).toBe(500);await server.environments.client.waitForRequestsIdle()
    gate = hold(fail);f.write()
    await vi.waitFor(() => expect(gate!.entered()).toBe(true), { timeout: watchDeadline })
    const send = vi.spyOn(server.ws, 'send'), close = closing === 'server' ? server.close() : server.environments.client.close()
    gate.release();await close;await delay(350)
    expect(send, JSON.stringify(send.mock.calls)).not.toHaveBeenCalled()
  } finally { gate?.release();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})
