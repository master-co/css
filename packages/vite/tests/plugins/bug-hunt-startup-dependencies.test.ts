import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const modes = ['static', 'runtime', 'pre-render', 'progressive'] as const
const cases = modes.flatMap(mode => ['local', 'entry'].flatMap(kind => ['reference-directory', 'resource-file', 'resource-directory'].map(missing => ({ mode, kind, missing }))))
const svg = '<svg xmlns="http://www.w3.org/2000/svg" data-owner="restored"/>'
function fixture(kind: string, missing: string) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-startup-dependencies-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root); mkdirSync(external)
  const reference = join(external, missing === 'reference-directory' ? 'deep/tokens.css' : 'tokens.css')
  const resource = join(external, missing === 'resource-file' ? 'pixel.svg' : 'deep/pixel.svg')
  const tokens = `@utilities{paint{padding:7rem;background-image:url("./${relative(dirname(reference), resource)}?v=1#icon")}}.never{color:red}`
  if (missing !== 'reference-directory') writeFileSync(reference, tokens)
  writeFileSync(join(root, 'style.css'), `${kind === 'entry' ? '@master entry;@preserve native;' : ''}@reference "../${relative(parent, reference)}";.target{@compose paint;}`)
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
  return { parent, root, reference, resource, restore() { mkdirSync(dirname(reference), { recursive: true });mkdirSync(dirname(resource), { recursive: true });writeFileSync(reference, tokens);writeFileSync(resource, svg) } }
}
function notified(calls: readonly (readonly unknown[])[]) {
  return calls.some(([value]) => value && typeof value === 'object' && 'type' in value && ['update', 'full-reload'].includes(String(value.type)))
}

test.each(cases)('BH-0004 startup $missing recovers $kind in $mode', async ({ mode, kind, missing }) => {
  const f = fixture(kind, missing)
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
    await server.listen()
    const observed: { event: string, file: string }[] = []
    server.watcher.on('all', (event, file) => { if (file.startsWith(f.parent)) observed.push({ event, file }) })
    const origin = server.resolvedUrls!.local[0]
    await (await fetch(new URL('entry.js', origin))).text()
    const response = await fetch(new URL('style.css', origin)), body = await response.text()
    expect(response.status).toBe(500)
    expect(body).toContain(missing === 'reference-directory' ? 'tokens.css' : 'pixel.svg')
    const send = vi.spyOn(server.ws, 'send')
    if (process.env.BH_TRACE) console.log('startup-initial-watch', JSON.stringify({ kind, missing, mode, watched: server.watcher.getWatched() }))
    f.restore()
    await vi.waitFor(() => expect(notified(send.mock.calls), JSON.stringify({ observed, messages: send.mock.calls })).toBe(true), { timeout: watchDeadline })
    let restored = ''
    await expect.poll(async () => {
      const response = await fetch(new URL('style.css', origin));restored = await response.text()
      return response.status
    }, { timeout: watchDeadline }).toBe(200)
    const encoded = restored.match(/const __vite__css = ("(?:[^"\\]|\\.)*")/)
    const css = encoded ? JSON.parse(encoded[1]) as string : restored
    expect(css).toMatch(/padding:\s*7rem/)
    expect(css).not.toMatch(/@reference|@compose|\.never/)
    const path = css.match(/url\(["']?([^"'\)]+\.svg[^"'\)]*)["']?\)/)?.[1]
    expect(path).toBeDefined()
    const url = new URL(path!, origin), image = await fetch(url)
    expect(image.status).toBe(200);expect(image.headers.get('content-type')).toContain('image/svg+xml');expect(await image.text()).toBe(svg)
    expect(url.search).toBe('?v=1');expect(url.hash).toBe('#icon')
  } finally { await server?.environments.client.waitForRequestsIdle(); await server?.close();rmSync(f.parent, { recursive: true, force: true }) }
})

test.each([false, true])('BH-0004 failed servers recover independently with shared plugins=%s', async shared => {
  const fixtures = [fixture('local', 'resource-directory'), fixture('entry', 'reference-directory')]
  const plugins = masterCSS({ mode: 'static', runtime: false })
  const servers: Awaited<ReturnType<typeof createServer>>[] = []
  try {
    for (const f of fixtures) {
      const server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: shared ? plugins : masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
      servers.push(server);await server.listen()
      await server.environments.client.transformRequest('/entry.js')
      await expect(server.environments.client.transformRequest('/style.css')).rejects.toThrow('ENOENT')
    }
    await servers[0].environments.client.waitForRequestsIdle()
    await servers[0].close()
    const send = vi.spyOn(servers[1].ws, 'send')
    fixtures[1].restore()
    await vi.waitFor(() => expect(notified(send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const result = await servers[1].environments.client.transformRequest('/style.css')
    expect(result?.code).toContain('7rem')
    expect(result?.code).not.toContain(fixtures[0].parent)
  } finally { for (const server of servers) { if (!server.httpServer?.listening) continue;await server.environments.client.waitForRequestsIdle();await server.close() }for (const f of fixtures) rmSync(f.parent, { recursive: true, force: true }) }
})

test.each([false, true])('BH-0004 resource-failing servers recover independently with shared plugins=%s', async shared => {
  const fixtures = [fixture('local', 'resource-directory'), fixture('entry', 'resource-directory')]
  const plugins = masterCSS({ mode: 'static', runtime: false })
  const servers: Awaited<ReturnType<typeof createServer>>[] = []
  try {
    for (const f of fixtures) {
      const server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: shared ? plugins : masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent] } } })
      servers.push(server);await server.listen()
      await server.environments.client.transformRequest('/entry.js')
      await expect(server.environments.client.transformRequest('/style.css')).rejects.toThrow('ENOENT')
    }
    await servers[0].environments.client.waitForRequestsIdle()
    await servers[0].close()
    const send = vi.spyOn(servers[1].ws, 'send')
    fixtures[1].restore()
    await vi.waitFor(() => expect(notified(send.mock.calls)).toBe(true), { timeout: watchDeadline })
    const result = await servers[1].environments.client.transformRequest('/style.css')
    expect(result?.code).toContain('7rem')
    expect(result?.code).not.toContain(fixtures[0].parent)
  } finally { for (const server of servers) { if (!server.httpServer?.listening) continue;await server.environments.client.waitForRequestsIdle();await server.close() }for (const f of fixtures) rmSync(f.parent, { recursive: true, force: true }) }
})
