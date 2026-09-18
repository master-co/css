import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const base of ['/', '/nested/']) {
  test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)(`local Sass URL reloads retained child and resource under ${base}/%s`, async mode => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-local-sass-url-')))
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    try {
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      writeFileSync(join(root, 'style.scss'), '$layout:inline-flex;@import "./bridge.css" layer(guard);.local{display:$layout}')
      writeFileSync(join(root, 'other.scss'), '$tone:red;.other{color:$tone}')
      writeFileSync(join(root, 'bridge.css'), '@import "./child.css";')
      const child = (color: string) => `.child{@compose p:2rem;color:${color};background:url("./pixel.svg")}`
      writeFileSync(join(root, 'child.css'), child('red'))
      writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><title>red</title></svg>')
      server = await createServer({ root, base, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      const url = new URL('style.scss', server.resolvedUrls!.local[0])
      const initial = await fetch(url, { headers: { Accept: 'text/css' } })
      expect(initial.status).toBe(200)
      let previous = await initial.text()
      const other = await fetch(new URL('other.scss', server.resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
      expect(other.status).toBe(200); await other.text()
      const send = vi.spyOn(server.ws, 'send')
      for (const [file, source] of [
        ['child.css', child('blue')],
        ['pixel.svg', '<svg xmlns="http://www.w3.org/2000/svg"><title>blue</title></svg>']
      ]) {
        send.mockClear()
        writeFileSync(join(root, file), source)
        await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
          { type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: expect.any(Number) }
        ]) }), { timeout: 3000 })
        expect(send).not.toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([expect.objectContaining({ path: '/other.scss' })]) })
        url.searchParams.set('t', String(Date.now()))
        const updated = await fetch(url, { headers: { Accept: 'text/css' } })
        expect(updated.status).toBe(200)
        const css = await updated.text()
        expect(css).not.toBe(previous)
        previous = css
      }
    } finally {
      await server?.environments.client.waitForRequestsIdle(); await server?.close()
      rmSync(root, { recursive: true, force: true })
    }
  })
}
