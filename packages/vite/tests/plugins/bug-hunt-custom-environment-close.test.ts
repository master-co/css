import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRunnableDevEnvironment, createServer, isRunnableDevEnvironment } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const managed of [false, true]) {
  test.each(['edge', 'ssr', 'client'])('BH-0004 remaining environments load fresh styles after closing %s (managed=' + managed + ')', async (closing) => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-custom-environments-')))
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    const dispose = vi.spyOn(MasterCSSScanner.prototype, 'dispose')
    let initialized = false
    try {
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      for (const [file, color] of [['style', 'red'], ['later', 'green']]) {
        writeFileSync(join(root, `${file}.scss`), (managed ? '@master entry;@preserve native;' : '') + `.example{color:${color}}`)
        writeFileSync(join(root, `${file}.js`), `export {default as css} from './${file}.scss?inline'`)
      }
      server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: managed ? masterCSS({ mode: 'static', runtime: false }) : [],
        environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } },
        server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      const edge = server.environments.edge
      if (!isRunnableDevEnvironment(edge)) throw new Error('Expected runnable custom environment')
      const origin = server.resolvedUrls!.local[0]
      expect(await (await fetch(new URL('style.scss', origin), { headers: { Accept: 'text/css' } })).text()).toContain('red')
      expect((await server.ssrLoadModule('/style.js')).css).toContain('red')
      expect((await edge.runner.import('/style.js')).css).toContain('red')
      initialized = true
      dispose.mockClear()
      await server.environments[closing].close()
      if (managed) expect(dispose).not.toHaveBeenCalled()
      if (closing !== 'client') {
        const css = await fetch(new URL('later.scss', origin), { headers: { Accept: 'text/css' } })
        expect(css.status).toBe(200)
        expect(await css.text()).toContain('green')
      }
      if (closing !== 'ssr') expect((await server.ssrLoadModule('/later.js')).css).toContain('green')
      if (closing !== 'edge') expect((await edge.runner.import('/later.js')).css).toContain('green')
      writeFileSync(join(root, 'later.scss'), (managed ? '@master entry;@preserve native;' : '') + '.example{color:purple}')
      await vi.waitFor(async () => {
        if (closing !== 'client') {
          const css = await fetch(new URL(`later.scss?t=${Date.now()}`, origin), { headers: { Accept: 'text/css' } })
          expect(css.status).toBe(200)
          expect(await css.text()).toContain('purple')
        }
        if (closing !== 'ssr') expect((await server!.ssrLoadModule('/later.js')).css).toContain('purple')
        if (closing !== 'edge') expect((await edge.runner.import('/later.js')).css).toContain('purple')
      }, { timeout: 5000 })
    } finally {
      try { await server?.close();if (managed && initialized) expect(dispose).toHaveBeenCalledOnce() }
      finally { dispose.mockRestore();rmSync(root, { recursive: true, force: true }) }
    }
  })
}
