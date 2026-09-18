import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRunnableDevEnvironment, createServer, isRunnableDevEnvironment } from 'vite'
import { expect, test, vi } from 'vitest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import masterCSS from '../../src/core'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const managed of [false, true]) for (const perEnvironment of [false, true]) {
  test(`BH-0004 idle replacement survives old environments closing (managed=${managed}, perEnvironment=${perEnvironment})`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-environment-replacement-')))
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    const dispose = vi.spyOn(MasterCSSScanner.prototype, 'dispose')
    try {
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      for (const [file, color] of [['style', 'red'], ['later', 'green']]) {
        writeFileSync(join(root, `${file}.scss`), (managed ? '@master entry;@preserve native;' : '') + `.example{color:${color}}`)
        writeFileSync(join(root, `${file}.js`), `export {default as css} from './${file}.scss?inline'`)
      }
      server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: managed ? masterCSS({ mode: 'static', runtime: false }) : [],
        environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } },
        server: { host: '127.0.0.1', port: 0, perEnvironmentStartEndDuringDev: perEnvironment } })
      await server.listen()
      const old = server.environments.edge
      if (!isRunnableDevEnvironment(old)) throw new Error('Expected runnable custom environment')
      expect((await old.runner.import('/style.js')).css).toContain('red')
      const replacement = createRunnableDevEnvironment('edge', server.config)
      await replacement.init({ watcher: server.watcher, previousInstance: old })
      server.environments.edge = replacement
      await old.close()
      await replacement.listen(server)
      dispose.mockClear()
      await server.environments.client.close()
      await server.environments.ssr.close()
      if (managed) expect(dispose).not.toHaveBeenCalled()
      expect((await replacement.runner.import('/later.js')).css).toContain('green')
      writeFileSync(join(root, 'later.scss'), (managed ? '@master entry;@preserve native;' : '') + '.example{color:purple}')
      await vi.waitFor(async () => expect((await replacement.runner.import('/later.js')).css).toContain('purple'), { timeout: 5000 })
      await server.close()
      if (managed) expect(dispose).toHaveBeenCalledOnce()
    } finally { await server?.close();dispose.mockRestore();rmSync(root, { recursive: true, force: true }) }
  })
}

test.each([false, true])('BH-0004 environment startup attaches HMR listeners once (perEnvironment=%s)', async (perEnvironment) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-environment-listeners-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  const on = vi.spyOn(MasterCSSScanner.prototype, 'on')
  try {
    writeFileSync(join(root, 'style.css'), '@master entry;@preserve native;.example{color:red}')
    writeFileSync(join(root, 'server.js'), "export {default as css} from './style.css?inline'")
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }),
      environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } },
      server: { host: '127.0.0.1', port: 0, perEnvironmentStartEndDuringDev: perEnvironment } })
    await server.listen()
    const instance = on.mock.contexts[on.mock.calls.findIndex(args => args[0] === 'change')]
    if (!(instance instanceof MasterCSSScanner)) throw new Error('Expected the shared scanner instance')
    expect(instance.listenerCount('change')).toBe(1)
    expect((await server.ssrLoadModule('/server.js')).css).toContain('red')
    const edge = server.environments.edge
    if (!isRunnableDevEnvironment(edge)) throw new Error('Expected runnable environment')
    expect((await edge.runner.import('/server.js')).css).toContain('red')
    expect(instance.listenerCount('change')).toBe(1)
    expect(instance.listenerCount('reset')).toBe(1)
  } finally { await server?.close();on.mockRestore();rmSync(root, { recursive: true, force: true }) }
})

test.each([false, true])('BH-0004 late server environment startup preserves client Sass dependencies (perEnvironment=%s)', async (perEnvironment) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-environment-sass-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const partial = join(root, '_tokens.scss')
    writeFileSync(partial, '$tone:red;')
    writeFileSync(join(root, 'style.scss'), '@use "./tokens";@master entry;@preserve native;.example{color:tokens.$tone}')
    writeFileSync(join(root, 'edge.css'), '@master entry;@preserve native;.other{color:green}')
    writeFileSync(join(root, 'edge.js'), "export {default as css} from './edge.css?inline'")
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }),
      environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } },
      server: { host: '127.0.0.1', port: 0, perEnvironmentStartEndDuringDev: perEnvironment } })
    await server.listen()
    const url = new URL('style.scss', server.resolvedUrls!.local[0])
    expect(await (await fetch(url, { headers: { Accept: 'text/css' } })).text()).toContain('red')
    const edge = server.environments.edge
    if (!isRunnableDevEnvironment(edge)) throw new Error('Expected runnable environment')
    expect((await edge.runner.import('/edge.js')).css).toContain('green')
    const send = vi.spyOn(server.environments.client.hot, 'send')
    writeFileSync(partial, '$tone:purple;')
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'update', updates: expect.arrayContaining([
      { type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: expect.any(Number) }
    ]) }), { timeout: 5000 })
    expect(await (await fetch(url, { headers: { Accept: 'text/css' } })).text()).toContain('purple')
  } finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
})
