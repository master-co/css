import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

test.each(['pre-render', 'progressive'] as const)('manifest HMR refreshes server-rendered rules in %s', async mode => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'prerender-manifest-hmr-')), file = join(root, 'style.css')
  const source = (theme: string, native: string) => `@master entry;@theme{--color-accent:${theme}}@components{card{color:var(--color-accent)}}.native{color:${native}}`
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    writeFileSync(file, source('#123456', 'red'))
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="card"></div>')
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/*'] } } })
    await server.listen()
    const plugin = server.config.plugins.find(p => p.name === 'master-css:pre-render')!
    const hook = plugin.handleHotUpdate
    if (typeof hook !== 'function') throw new Error('Expected the pre-render HMR hook')
    const send = vi.spyOn(server.ws, 'send')
    writeFileSync(file, source('#123456', 'blue'))
    await hook.call({} as never, { file, server } as never)
    expect(send.mock.calls.some(([message]) => typeof message === 'object' && (message as { type: string }).type === 'full-reload')).toBe(false)
    writeFileSync(file, source('#654321', 'blue'))
    await hook.call({} as never, { file, server } as never)
    expect(send.mock.calls.some(([message]) => typeof message === 'object' && (message as { type: string }).type === 'full-reload')).toBe(mode === 'pre-render')
    send.mockRestore()
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
