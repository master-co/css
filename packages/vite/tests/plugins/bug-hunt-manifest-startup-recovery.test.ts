import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { build, createServer, type Plugin, type ViteDevServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const modes = ['static', 'runtime', 'pre-render', 'progressive'] as const
const manifestURL = '/@id/__x00__virtual:master-css-manifest'
function fixture() {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-manifest-startup-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, 'nested/tokens.css')
  writeFileSync(join(root, 'style.css'), '@master entry;@reference "../external/nested/tokens.css";@utilities{card{@compose paint;}}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";import manifest from "virtual:master-css-manifest";window.manifest=manifest;')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div class="card"></div><script type="module" src="./entry.js"></script></body></html>')
  return { parent, root, dependency, write(value = '@utilities{paint{padding:7rem}}') { mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, value) } }
}
function noExternalEvents(): Plugin {
  return { name: 'test:miss-bootstrap-watcher-registration', configureServer(server) {
    vi.spyOn(server.watcher, 'add').mockReturnValue(server.watcher)
  } }
}
async function response(server: ViteDevServer, path = '/') {
  const result = await fetch(new URL(path, server.resolvedUrls!.local[0]))
  return { status: result.status, text: await result.text() }
}
function hasReload(calls: readonly (readonly unknown[])[]) { return calls.some(([message]) => typeof message === 'object' && message !== null && 'type' in message && message.type === 'full-reload') }

test.each(modes)('BH-0004 manifest bootstrap reports HTTP errors and recovers without module requests or watcher events in %s', async mode => {
  const f = fixture();let server: ViteDevServer | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode }), noExternalEvents()], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen()
    const events: string[] = []
    server.watcher.on('all', (event, file) => { if (file === f.dependency) events.push(event) })
    expect(server.environments.client.moduleGraph.getModuleById(join(f.root, 'style.css'))).toBeUndefined()
    const initial = await response(server)
    expect(initial.status).toBe(500);expect(initial.text).toContain('tokens.css');expect(initial.text).not.toContain('<style id="master-css"')
    const send = vi.spyOn(server.ws, 'send')
    f.write('@utilities{paint{@compose definitely-missing-class;}}')
    await vi.waitFor(() => expect(JSON.stringify(send.mock.calls)).toContain('definitely-missing-class'), { timeout: watchDeadline })
    expect(hasReload(send.mock.calls)).toBe(false)
    const invalid = await response(server)
    expect(invalid.status).toBe(500);expect(invalid.text).toContain('definitely-missing-class')
    const invalidManifest = await response(server, manifestURL)
    expect(invalidManifest.status).toBe(500);expect(invalidManifest.text).toContain('definitely-missing-class')
    send.mockClear();f.write()
    await vi.waitFor(() => expect(hasReload(send.mock.calls)).toBe(true), { timeout: watchDeadline })
    await expect.poll(async () => (await response(server!)).status, { timeout: watchDeadline }).toBe(200)
    const manifest = await response(server, manifestURL)
    expect(manifest.status).toBe(200);expect(manifest.text).toContain('"card"');expect(manifest.text).toContain('7rem')
    if (mode === 'pre-render' || mode === 'progressive') expect((await response(server)).text).toContain('.card{padding:7rem}')
    expect(events).toEqual([])
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

test.each(modes)('BH-0004 production still fails for missing project manifest dependencies in %s', async mode => {
  const f = fixture()
  try {
    await expect(build({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), build: { write: false, minify: false } })).rejects.toThrow('tokens.css')
  } finally { rmSync(f.parent, { recursive: true, force: true }) }
})

test.each(['client', 'ssr', 'server'] as const)('BH-0004 manifest bootstrap recovery respects %s close', async closing => {
  const f = fixture();let server: ViteDevServer | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'progressive' }), noExternalEvents()], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen();expect((await response(server)).status).toBe(500)
    await server.environments.client.waitForRequestsIdle()
    if (closing === 'server') await server.close()
    else await server.environments[closing].close()
    const send = vi.spyOn(server.ws, 'send');f.write()
    if (closing === 'ssr') {
      await vi.waitFor(() => expect(hasReload(send.mock.calls)).toBe(true), { timeout: watchDeadline })
      await expect.poll(async () => (await response(server!)).status, { timeout: watchDeadline }).toBe(200)
      expect((await response(server)).text).toContain('.card{padding:7rem}')
    } else { await delay(350);expect(send).not.toHaveBeenCalled() }
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

test.each(['pre-render', 'progressive'] as const)('BH-0004 invalid manifest after good render never serves the old renderer in %s', async mode => {
  const f = fixture();let server: ViteDevServer | undefined
  try {
    f.write()
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] }, watch: { ignored: ['**/*'] } } })
    await server.listen();expect((await response(server)).text).toContain('.card{padding:7rem}')
    const plugin = server.config.plugins.find(p => p.name === 'master-css:pre-render')!
    const hook = plugin.handleHotUpdate
    if (typeof hook !== 'function') throw new Error('Expected pre-render HMR hook')
    f.write('@utilities{paint{@compose definitely-missing-class;}}')
    await expect(hook.call({} as never, { file: f.dependency, server } as never)).rejects.toThrow('definitely-missing-class')
    const failed = await response(server)
    expect(failed.status).toBe(500);expect(failed.text).not.toContain('.card{padding:7rem}')
    const send = vi.spyOn(server.ws, 'send');f.write('@utilities{paint{padding:9rem}}')
    await hook.call({} as never, { file: f.dependency, server } as never)
    expect(hasReload(send.mock.calls)).toBe(true);expect((await response(server)).text).toContain('.card{padding:9rem}')
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})
