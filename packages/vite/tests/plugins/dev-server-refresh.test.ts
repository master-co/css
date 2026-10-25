import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, isRunnableDevEnvironment } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

// A program reload restarts the server runner, and renders still in flight then
// mix module instances. Class discovery must refresh server modules in place.
test('class discovery refreshes server modules without reloading the server program', async () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-dev-server-refresh-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    writeFileSync(join(root, 'style.css'), '@import url("@master/css");')
    writeFileSync(join(root, 'server.js'), 'import "./style.css";export { default as globals } from "virtual:master-css-emitted-globals"')
    writeFileSync(join(root, 'page.js'), 'export const html = `<p class="fg-red-60"></p>`')
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const ssr = server.environments.ssr
    if (!isRunnableDevEnvironment(ssr)) throw new Error('Expected a runnable SSR environment')
    // A browser has loaded the stylesheet, and a server program has rendered with it.
    await server.environments.client.transformRequest('/style.css')
    const { globals } = await ssr.runner.import('/server.js')
    expect(globals.variables['color-red-60']).toBeUndefined()
    expect((await ssr.runner.import('/style.css?inline')).default).not.toContain('.fg-red-60')
    const send = vi.spyOn(ssr.hot, 'send')

    await ssr.runner.import('/page.js')

    // The server program keeps the object it imported; it now carries the new globals.
    await vi.waitFor(() => expect(globals.variables['color-red-60']).toBeGreaterThan(0), { timeout: watchDeadline })
    await vi.waitFor(async () => expect((await ssr.runner.import('/style.css?inline')).default).toContain('.fg-red-60'), { timeout: watchDeadline })
    expect(send.mock.calls.map(([payload]) => (payload as { type?: string })?.type)).not.toContain('full-reload')
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
