import { createServer as createHttpServer } from 'node:http'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer, type ResolvedConfig } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

test.each([false, true])('BH-0004 middleware restart serves HTML and styles (managed=%s)', async (managed) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-middleware-restart-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  const http = createHttpServer((request, response) => server!.middlewares(request, response, (error?: unknown) => { response.statusCode = error ? 500 : 404;response.end(error ? String(error) : undefined) }))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, 'index.html'), '<link rel="stylesheet" href="/style.scss"><div class="example">test</div>')
    writeFileSync(join(root, 'style.scss'), (managed ? '@master entry;@preserve native;' : '') + '.example{color:red}')
    writeFileSync(join(root, 'server.js'), 'export {default as css} from "./style.scss?inline"')
    const plugins = managed ? masterCSS({ mode: 'static', runtime: false }) : []
    const events: string[] = []
    const configs: ResolvedConfig[] = []
    const scanner = plugins.find(plugin => plugin.name === 'master-css:scanner')
    if (scanner) {
      const { configResolved, buildStart, closeBundle } = scanner
      if (typeof configResolved !== 'function' || typeof buildStart !== 'function' || typeof closeBundle !== 'function') throw new Error('Expected scanner lifecycle hooks')
      scanner.configResolved = async function (config) { configs.push(config);events.push(`configResolved:${configs.indexOf(config)}`);await configResolved.call(this, config) }
      scanner.buildStart = async function (options) { events.push(`buildStart:${this.environment.name}:${configs.indexOf(this.environment.getTopLevelConfig())}`);await buildStart.call(this, options) }
      scanner.closeBundle = async function () {
        const config = this.environment.getTopLevelConfig()
        events.push(`closeBundle:${this.environment.name}:${configs.indexOf(config)}`)
        if (process.env.BH_SKIP_RESTART_DISPOSE === '1' && configs.length > 1 && config === configs[0]) { events.push('diagnostic:skip-old-close');return }
        await closeBundle.call(this)
      }
    }
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins, server: { middlewareMode: true, ws: { server: http } } })
    await new Promise<void>(resolve => { http.listen(0, '127.0.0.1', resolve) })
    const address = http.address()
    if (!address || typeof address === 'string') throw new Error('Missing HTTP address')
    const origin = `http://127.0.0.1:${address.port}`
    expect((await fetch(origin)).status).toBe(200)
    expect((await server.ssrLoadModule('/server.js')).css).toContain('red')
    await server.restart()
    const page = await fetch(origin)
    if (process.env.BH_TRACE_TEST) {
      const css = await fetch(`${origin}/style.scss`, { headers: { Accept: 'text/css' } })
      console.log(JSON.stringify({ managed, events, root: server.config.root, appType: server.config.appType, htmlStatus: page.status, html: await page.clone().text(), cssStatus: css.status, css: await css.text(), stack: server.middlewares.stack.map(layer => typeof layer.handle === 'function' ? layer.handle.name : 'httpServer'), ssr: await server.ssrLoadModule('/server.js').catch(error => String(error)) }))
    }
    expect(page.status).toBe(200)
    writeFileSync(join(root, 'style.scss'), (managed ? '@master entry;@preserve native;' : '') + '.example{color:green}')
    await vi.waitFor(async () => {
      const css = await fetch(`${origin}/style.scss?t=${Date.now()}`, { headers: { Accept: 'text/css' } })
      expect(css.status).toBe(200)
      expect(await css.text()).toContain('green')
      expect((await server!.ssrLoadModule('/server.js')).css).toContain('green')
    }, { timeout: 5000 })
  } finally { await server?.close();await new Promise<void>(resolve => { http.close(() => resolve()) });rmSync(root, { recursive: true, force: true }) }
})
