import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const modes = ['static', 'runtime', 'pre-render', 'progressive'] as const
const cases = modes.flatMap(mode => ['reference-one', 'reference-three', 'entry-resource-three'].flatMap(kind => ['default', 'node'].map(backend => ({ mode, kind, backend }))))
function notified(calls: readonly (readonly unknown[])[]) {
  return calls.some(([value]) => value && typeof value === 'object' && 'type' in value && ['update', 'full-reload'].includes(String(value.type)))
}
test.each(cases)('BH-0004 missing directory recovers $kind in $mode via $backend', async ({ mode, kind, backend }) => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-missing-directory-')))
  const root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root);mkdirSync(external)
  const resource = kind.startsWith('entry'), nested = kind.endsWith('one') ? 'one' : 'one/two/three'
  const dependency = join(external, nested, resource ? 'pixel.svg' : 'tokens.css')
  const reference = resource ? join(external, 'tokens.css') : dependency
  const tokens = `@utilities{paint{padding:7rem;${resource ? `background-image:url("./${nested}/pixel.svg?v=1#icon")` : ''}}}`
  if (resource) writeFileSync(reference, tokens)
  writeFileSync(join(root, 'style.css'), `${resource ? '@master entry;@preserve native;' : ''}@reference "../external/${resource ? 'tokens.css' : `${nested}/tokens.css`}";.target{@compose paint;}`)
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, fs: { allow: [parent] }, ...(backend === 'node' ? { watch: { useFsEvents: false, usePolling: false } } : {}) } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const adds = vi.spyOn(server.watcher, 'add')
    await (await fetch(new URL('entry.js', origin))).text()
    const response = await fetch(new URL('style.css', origin));expect(response.status).toBe(500);const body = await response.text();expect(body).toContain(resource ? 'pixel.svg' : 'tokens.css');if (process.env.BH_TRACE) console.log('directory-initial', JSON.stringify({ kind, body, adds: adds.mock.calls, options: server.watcher.options, watched: server.watcher.getWatched() }))
    const observed: string[] = []
    server.watcher.on('all', (event, file) => { if (file === dependency) observed.push(event) })
    const send = vi.spyOn(server.ws, 'send')
    mkdirSync(dirname(dependency), { recursive: true })
    writeFileSync(dependency, resource ? '<svg xmlns="http://www.w3.org/2000/svg"/>' : tokens)
    // Automatic HMR is the contract; actual watcher events remain diagnostic evidence when reconciliation supplies recovery.
    await vi.waitFor(() => expect(notified(send.mock.calls), JSON.stringify({ observed })).toBe(true), { timeout: watchDeadline })
    const result = await fetch(new URL('style.css', origin));expect(result.status).toBe(200);expect(await result.text()).toContain('7rem')
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(parent, { recursive: true, force: true }) }
})
