import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

test('BH-0004 Sass updates invalidate SSR imports without sending browser CSS updates to the server channel', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-environments-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const file = join(root, 'style.scss'), source = (color: string) => `@master entry;@preserve native;$tone:${color};.example{color:$tone}`
    writeFileSync(file, source('red'))
    writeFileSync(join(root, 'server.js'), 'export {default as css} from "./style.scss?inline"')
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    expect((await server.ssrLoadModule('/server.js')).css).toContain('red')
    const url = new URL('style.scss', server.resolvedUrls!.local[0])
    expect(await (await fetch(url, { headers: { Accept: 'text/css' } })).text()).toContain('red')
    const clientSend = vi.spyOn(server.environments.client.hot, 'send')
    const serverSend = vi.spyOn(server.environments.ssr.hot, 'send')
    writeFileSync(file, source('green'))
    await vi.waitFor(() => expect(clientSend).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
      { type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: expect.any(Number) }
    ]) }))
    await vi.waitFor(async () => expect((await server!.ssrLoadModule('/server.js')).css).toContain('green'))
    expect(serverSend).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'update', updates: expect.arrayContaining([expect.objectContaining({ type: 'css-update' })]) }))
  } finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
})

test('BH-0004 server restart discards stylesheet URLs served by the previous server', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-restart-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const file = join(root, 'style.scss'), source = (color: string) => `@master entry;@preserve native;.example{color:${color}}`
    writeFileSync(file, source('red'))
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [...masterCSS({ mode: 'static', runtime: false }), { name: 'test:sass-route', resolveId(id) { const clean = id.replace(/[?#].*$/, '');if (clean === '/old.scss' || clean === '/new.scss') return file + id.slice(clean.length) } }], server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const oldResponse = await fetch(new URL('old.scss', server.resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
    expect(oldResponse.status).toBe(200)
    const oldCSS = await oldResponse.text()
    expect(oldCSS).toContain('red')
    expect(oldCSS).not.toContain('@master')
    await server.restart()
    const newResponse = await fetch(new URL('new.scss', server.resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
    expect(newResponse.status).toBe(200)
    const newCSS = await newResponse.text()
    expect(newCSS).toContain('red')
    expect(newCSS).not.toContain('@master')
    const send = vi.spyOn(server.environments.client.hot, 'send')
    if (process.env.BH_TRACE_TEST) {
      server.watcher.on('all', (event, path) => console.log('WATCH', event, path))
      console.log('MODULES', [...server.environments.client.moduleGraph.idToModuleMap.values()].map(module => ({ id: module.id, file: module.file, url: module.url })))
      console.log('GRAPH', await server.moduleGraph.getModuleByUrl('/new.scss?direct'))
    }
    writeFileSync(file, source('blue'))
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
      { type: 'css-update', path: '/new.scss', acceptedPath: '/new.scss', timestamp: expect.any(Number) }
    ]) }))
    expect(send).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'update', updates: expect.arrayContaining([expect.objectContaining({ path: '/old.scss' })]) }))
  } finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
})

test('BH-0004 HMR waits for pending stylesheet URL registration after the HTTP response', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-pending-url-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const file = join(root, 'style.scss')
    writeFileSync(file, '@master entry;@preserve native;.example{color:red}')
    const plugins = masterCSS({ mode: 'static', runtime: false })
    const sass = plugins.find(plugin => plugin.name === 'master-css:sass-source')!
    const hotUpdate = sass.hotUpdate
    if (typeof hotUpdate !== 'function') throw new Error('Expected the Sass hotUpdate hook')
    let entered!: () => void
    const updating = new Promise<void>(resolve => { entered = resolve })
    sass.hotUpdate = function (options) {
      const result = hotUpdate.call(this, options)
      if (options.file === file && this.environment.config.consumer === 'client') entered()
      return result
    }
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins, server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const graph = server.moduleGraph, getModule = graph.getModuleByUrl.bind(graph)
    vi.spyOn(graph, 'getModuleByUrl').mockImplementation(async (...args) => {
      const module = await getModule(...args)
      if (args[0] === '/style.scss?direct') await pending
      return module
    })
    const response = await fetch(new URL('style.scss', server.resolvedUrls!.local[0]), { headers: { Accept: 'text/css' } })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('red')
    const send = vi.spyOn(server.environments.client.hot, 'send')
    writeFileSync(file, '@master entry;@preserve native;.example{color:green}')
    await updating
    release()
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
      { type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: expect.any(Number) }
    ]) }))
  } finally { release();await server?.close();rmSync(root, { recursive: true, force: true }) }
})
