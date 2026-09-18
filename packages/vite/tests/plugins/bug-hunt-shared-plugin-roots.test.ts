import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

test.each([false, true])('BH-0004 concurrent roots isolate styles when sharing plugins=%s', async (shared) => {
  const roots = ['red', 'green'].map(() => realpathSync(mkdtempSync(join(tmpdir(), 'master-shared-roots-'))))
  const servers: Awaited<ReturnType<typeof createServer>>[] = []
  const colors = ['red', 'green']
  const plugins = masterCSS({ mode: 'static', runtime: false })
  try {
    for (const [index, root] of roots.entries()) {
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      writeFileSync(join(root, 'style.scss'), `@master entry;@preserve native;.example{color:${colors[index]}}`)
      writeFileSync(join(root, 'index.html'), '<link rel="stylesheet" href="/style.scss"><div class="example">test</div>')
      writeFileSync(join(root, 'server.js'), "export {default as css} from './style.scss?inline'")
    }
    await Promise.all(roots.map(async root => {
      const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: shared ? plugins : masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0 } })
      servers.push(server)
      await server.listen()
    }))
    const byRoot = roots.map(root => servers.find(server => server.config.root === root)!)
    for (const [index, server] of byRoot.entries()) {
      const response = await fetch(new URL('style.scss', server.resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
      expect(response.status).toBe(200)
      const css = await response.text()
      expect(css).toContain(colors[index])
      expect(css).not.toContain(colors[1 - index])
      expect((await server.ssrLoadModule('/server.js')).css).toContain(colors[index])
    }
    await byRoot[0].close()
    writeFileSync(join(roots[1], 'style.scss'), '@master entry;@preserve native;.example{color:purple}')
    await vi.waitFor(async () => {
      const response = await fetch(new URL(`style.scss?t=${Date.now()}`, byRoot[1].resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
      expect(response.status).toBe(200)
      const css = await response.text()
      expect(css).toContain('purple')
      expect(css).not.toContain('red')
      expect((await byRoot[1].ssrLoadModule('/server.js')).css).toContain('purple')
    }, { timeout: 5000 })
  } finally { await Promise.all(servers.map(server => server.close()));for (const root of roots) rmSync(root, { recursive: true, force: true }) }
})
