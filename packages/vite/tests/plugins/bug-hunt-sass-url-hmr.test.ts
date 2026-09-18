import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const base of ['/', '/nested/']) test(`BH-0004 Sass direct CSS HMR uses the served stylesheet URL under ${base}`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-url-hmr-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const file = join(root, 'style.scss'), source = (color: string) => `@master entry;@preserve native;$tone:${color};.example{color:$tone}`
    writeFileSync(file, source('red'))
    server = await createServer({ root, base, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const url = new URL('style.scss', server.resolvedUrls!.local[0])
    const first = await fetch(url, { headers: { Accept: 'text/css' } })
    expect(first.status).toBe(200)
    expect(await first.text()).toContain('red')
    const send = vi.spyOn(server.ws, 'send')
    writeFileSync(file, source('green'))
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
      { type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: expect.any(Number) }
    ]) }))
    url.searchParams.set('t', String(Date.now()))
    const updated = await fetch(url, { headers: { Accept: 'text/css' } })
    expect(updated.status).toBe(200)
    expect(await updated.text()).toContain('green')
  } finally { await server?.close(); rmSync(root, { recursive: true, force: true }) }
})
