import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer, type PluginOption, type WatchOptions } from 'vite'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const modes = ['static', 'runtime', 'pre-render', 'progressive'] as const
function fixture(resource = false) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-failed-reconcile-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, resource ? 'one/two/pixel.svg' : 'one/two/tokens.css')
  const tokens = `@utilities{paint{padding:7rem;${resource ? 'background-image:url("./one/two/pixel.svg?v=1#icon")' : ''}}}`
  if (resource) writeFileSync(join(external, 'tokens.css'), tokens)
  writeFileSync(join(root, 'style.css'), `${resource ? '@master entry;@preserve native;' : ''}@reference "../external/${resource ? 'tokens.css' : 'one/two/tokens.css'}";.target{@compose paint;}`)
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
  return { parent, root, dependency, restore() { mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, resource ? '<svg xmlns="http://www.w3.org/2000/svg"/>' : tokens) } }
}
function notified(calls: readonly (readonly unknown[])[]) {
  return calls.some(([value]) => value && typeof value === 'object' && 'type' in value && ['update', 'full-reload'].includes(String(value.type)))
}
for (const resource of [false, true]) test.each(modes)('BH-0004 reconciles failed dependency without delivered watcher events in %s (resource=' + resource + ')', async mode => {
  const f = fixture(resource)
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen()
    // Model an unregistered external dependency without changing the user's watch configuration.
    const add = vi.spyOn(server.watcher, 'add').mockReturnValue(server.watcher)
    const observed: string[] = []
    server.watcher.on('all', (event, file) => { if (file === f.dependency) observed.push(event) })
    const origin = server.resolvedUrls!.local[0]
    await (await fetch(new URL('entry.js', origin))).text()
    const response = await fetch(new URL('style.css', origin));expect(response.status).toBe(500);expect(await response.text()).toContain(resource ? 'pixel.svg' : 'tokens.css')
    const send = vi.spyOn(server.ws, 'send')
    f.restore()
    await vi.waitFor(() => expect(notified(send.mock.calls)).toBe(true), { timeout: watchDeadline })
    expect(observed).toEqual([])
    const recovered = await fetch(new URL('style.css', origin));expect(recovered.status).toBe(200);expect(await recovered.text()).toContain('7rem')
    add.mockRestore()
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

async function start(f: ReturnType<typeof fixture>, plugins: PluginOption = masterCSS({ mode: 'static', runtime: false }), watch?: WatchOptions | null) {
  const server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [plugins], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] }, ...(watch !== undefined ? { watch } : {}) } })
  await server.listen()
  vi.spyOn(server.watcher, 'add').mockReturnValue(server.watcher)
  const origin = server.resolvedUrls!.local[0]
  await (await fetch(new URL('entry.js', origin))).text()
  const response = await fetch(new URL('style.css', origin));expect(response.status).toBe(500);await response.text()
  // Complete the crawl before lifecycle tests close the environment; Vite cancels unresolved idle notifications on close.
  await server.environments.client.waitForRequestsIdle()
  return { server, origin, send: vi.spyOn(server.ws, 'send'), transform: vi.spyOn(server.environments.client, 'transformRequest') }
}
async function stop(f: ReturnType<typeof fixture>, result?: Awaited<ReturnType<typeof start>>) {
  await result?.server.environments.client.waitForRequestsIdle();await result?.server.close();rmSync(f.parent, { recursive: true, force: true })
}

test.each(['ssr', 'client', 'server'])('BH-0004 failed dependency reconciliation respects closing %s', async closing => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  try {
    result = await start(f)
    if (closing === 'server') await result.server.close()
    else await result.server.environments[closing].close()
    result.send.mockClear();result.transform.mockClear();f.restore()
    if (closing === 'ssr') {
      await vi.waitFor(() => expect(notified(result!.send.mock.calls)).toBe(true), { timeout: watchDeadline })
      const response = await fetch(new URL('style.css', result.origin));expect(response.status).toBe(200);expect(await response.text()).toContain('7rem')
    } else {
      await delay(350)
      expect(notified(result.send.mock.calls), JSON.stringify({ messages: result.send.mock.calls, transforms: result.transform.mock.calls })).toBe(false);expect(result.transform).not.toHaveBeenCalled()
    }
  } finally { await stop(f, result) }
})

test.each([false, true])('BH-0004 pending reconciliations remain isolated across servers (shared=%s)', async shared => {
  const fs = [fixture(), fixture(true)], results: Awaited<ReturnType<typeof start>>[] = [], plugins = masterCSS({ mode: 'static', runtime: false })
  try {
    for (const f of fs) results.push(await start(f, shared ? plugins : masterCSS({ mode: 'static', runtime: false })))
    await results[0].server.close();results[0].send.mockClear();results[0].transform.mockClear()
    for (const f of fs) f.restore()
    await vi.waitFor(() => expect(notified(results[1].send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const response = await fetch(new URL('style.css', results[1].origin));expect(response.status).toBe(200);expect(await response.text()).toContain('7rem')
    expect(notified(results[0].send.mock.calls)).toBe(false);expect(results[0].transform).not.toHaveBeenCalled()
  } finally { for (let i = 0; i < fs.length; i++) await stop(fs[i], results[i]) }
})

test('BH-0004 unchanged failures are not retried continuously and corrected contents recover', async () => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  try {
    result = await start(f)
    await delay(350);expect(result.transform).not.toHaveBeenCalled()
    mkdirSync(dirname(f.dependency), { recursive: true });writeFileSync(f.dependency, '@utilities{paint{@compose definitely-missing-class;}}')
    await vi.waitFor(() => expect(result!.transform).toHaveBeenCalled(), { timeout: watchDeadline })
    await vi.waitFor(() => expect(JSON.stringify(result!.send.mock.calls)).toContain('definitely-missing-class'), { timeout: watchDeadline })
    await result.server.environments.client.waitForRequestsIdle()
    const attempts = result.transform.mock.calls.length
    await delay(350);expect(result.transform).toHaveBeenCalledTimes(attempts);expect(notified(result.send.mock.calls)).toBe(false)
    f.restore()
    await vi.waitFor(() => expect(notified(result!.send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const response = await fetch(new URL('style.css', result.origin));expect(response.status).toBe(200);expect(await response.text()).toContain('7rem')
  } finally { await stop(f, result) }
})

test('BH-0004 a successful edit drops obsolete failed dependency reconciliation', async () => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  try {
    result = await start(f)
    // Isolate reconciliation: a delayed native event for this source edit must not be attributed to restoring the obsolete external dependency.
    await result.server.watcher.unwatch(f.root)
    const events: string[] = []
    result.server.watcher.on('all', (event, file) => { if (file.startsWith(f.parent)) events.push(event) })
    writeFileSync(join(f.root, 'style.css'), '.target{padding:9rem}')
    await vi.waitFor(() => expect(notified(result!.send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const response = await fetch(new URL('style.css', result.origin));expect(response.status).toBe(200);expect(await response.text()).toContain('9rem')
    result.send.mockClear();result.transform.mockClear();f.restore()
    await delay(350)
    expect(events).toEqual([])
    expect(notified(result.send.mock.calls), JSON.stringify({ messages: result.send.mock.calls, transforms: result.transform.mock.calls })).toBe(false);expect(result.transform).not.toHaveBeenCalled()
  } finally { await stop(f, result) }
})

test.each(['disabled', 'glob', 'function'])('BH-0004 reconciliation respects watch configuration: %s', async kind => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  try {
    const watch = kind === 'disabled' ? null : { ignored: kind === 'glob' ? '**/external/**' : (file: string) => file.includes('/external/') }
    result = await start(f, masterCSS({ mode: 'static', runtime: false }), watch)
    f.restore();await delay(350)
    expect(notified(result.send.mock.calls), JSON.stringify({ messages: result.send.mock.calls, transforms: result.transform.mock.calls })).toBe(false);expect(result.transform).not.toHaveBeenCalled()
    const response = await fetch(new URL('style.css', result.origin));expect(response.status).toBe(200);expect(await response.text()).toContain('7rem')
  } finally { await stop(f, result) }
})


test('BH-0004 two failed owners recover independently in one environment', async () => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  const second = join(f.parent, 'external/other/tokens.css')
  try {
    writeFileSync(join(f.root, 'second.css'), '@reference "../external/other/tokens.css";.second{@compose paint;}')
    result = await start(f)
    const initial = await fetch(new URL('second.css', result.origin));expect(initial.status).toBe(500);await initial.text()
    result.transform.mockClear();f.restore()
    await vi.waitFor(() => expect(notified(result!.send.mock.calls)).toBe(true), { timeout: watchDeadline })
    expect(result.transform.mock.calls.some(([url]) => url.includes('second.css'))).toBe(false)
    const first = await fetch(new URL('style.css', result.origin));expect(first.status).toBe(200);expect(await first.text()).toContain('7rem')
    result.send.mockClear();mkdirSync(dirname(second), { recursive: true });writeFileSync(second, '@utilities{paint{padding:9rem}}')
    await vi.waitFor(() => expect(notified(result!.send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const recovered = await fetch(new URL('second.css', result.origin));expect(recovered.status).toBe(200);expect(await recovered.text()).toContain('9rem')
  } finally { await stop(f, result) }
})


test.each(['client', 'server'])('BH-0004 closing %s during a reconciliation suppresses stale updates', async closing => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  let enabled = false, entered = false
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  try {
    result = await start(f, [{ name: 'hold-reconciliation', enforce: 'pre', async transform(_code, id) {
      if (enabled && id === join(f.root, 'style.css')) { entered = true;await gate }
    } }, ...masterCSS({ mode: 'static', runtime: false })])
    enabled = true;f.restore()
    await vi.waitFor(() => expect(entered).toBe(true), { timeout: watchDeadline })
    const close = closing === 'server' ? result.server.close() : result.server.environments.client.close()
    release();await close
    result.transform.mockClear();await delay(350)
    expect(result.send, JSON.stringify(result.send.mock.calls)).not.toHaveBeenCalled();expect(result.transform).not.toHaveBeenCalled()
  } finally { release();await stop(f, result) }
})

test('BH-0004 server restart drops reconciliations owned by the previous environment', async () => {
  const f = fixture();let result: Awaited<ReturnType<typeof start>> | undefined
  try {
    result = await start(f)
    const previous = result.transform
    await result.server.restart();previous.mockClear()
    const send = vi.spyOn(result.server.ws, 'send'), current = vi.spyOn(result.server.environments.client, 'transformRequest')
    f.restore();await delay(350)
    expect(notified(send.mock.calls)).toBe(false);expect(previous).not.toHaveBeenCalled();expect(current).not.toHaveBeenCalled()
    const response = await fetch(new URL('style.css', result.server.resolvedUrls!.local[0]));expect(response.status).toBe(200);expect(await response.text()).toContain('7rem')
  } finally { await stop(f, result) }
})
