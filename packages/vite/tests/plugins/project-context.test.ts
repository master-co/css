import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import LocalStylesPlugin from '../../src/plugins/local-styles'
import { devStylesheetState } from '../../src/utils/dev-stylesheet-delivery'
import { localStylesheets } from '../../src/utils/local-stylesheet'
import { createServer } from 'vite'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const discovery = vi.hoisted(() => ({ calls: 0, loads: 0, afterLoad: undefined as (() => Promise<void>) | undefined }))
vi.mock('@master/css-compiler/project', async importOriginal => {
  const actual = await importOriginal<typeof import('@master/css-compiler/project')>()
  return { ...actual, discoverManifestEntries(...args: Parameters<typeof actual.discoverManifestEntries>) {
    discovery.calls++
    return actual.discoverManifestEntries(...args)
  }, async loadProjectManifest(...args: Parameters<typeof actual.loadProjectManifest>) {
    discovery.loads++
    const result = await actual.loadProjectManifest(...args)
    await discovery.afterLoad?.()
    return result
  } }
})

const roots: string[] = []
function fixture(command = 'serve') {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'vite-project-context-')))
  roots.push(root)
  mkdirSync(join(root, 'src'))
  const context = { config: { root, command, server: { fs: { allow: [] } } } } as any
  const plugin = LocalStylesPlugin({} as any, context) as any
  return { root, context, plugin }
}
afterEach(() => {
  discovery.afterLoad = undefined
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test('concurrent stylesheet hosts share project loading and each observe all dependencies', async () => {
  const { root, plugin } = fixture('test')
  const entry = join(root, 'app.css'), tokens = join(root, 'tokens.css')
  writeFileSync(entry, '@import "@master/css";@import "./tokens.css";')
  writeFileSync(tokens, '@theme{--color-shared:red}')
  const hosts = [vi.fn(), vi.fn()]
  discovery.calls = discovery.loads = 0
  const results = await Promise.all(hosts.map((addWatchFile, index) => plugin.transform.call({ addWatchFile }, '.card{color:var(--color-shared)}', join(root, `src/card-${index}.css`))))
  expect(discovery.calls).toBe(1)
  expect(discovery.loads).toBe(1)
  for (const [index, host] of hosts.entries()) {
    expect(host).toHaveBeenCalledWith(entry)
    expect(host).toHaveBeenCalledWith(tokens)
    expect(results[index].code).toContain('--color-shared:red')
  }
})

test('failed shared loading observes missing dependencies and retries after repair', async () => {
  const { root, plugin } = fixture('test')
  const tokens = join(root, 'missing.css')
  writeFileSync(join(root, 'app.css'), '@import "@master/css";@import "./missing.css";')
  const hosts = [vi.fn(), vi.fn()]
  const transform = (addWatchFile: ReturnType<typeof vi.fn>, index: number) => plugin.transform.call({ addWatchFile }, '.card{color:var(--color-shared)}', join(root, `src/card-${index}.css`))
  discovery.calls = 0
  const failed = await Promise.allSettled(hosts.map(transform))
  expect(failed.every(result => result.status === 'rejected')).toBe(true)
  for (const host of hosts) expect(host).toHaveBeenCalledWith(tokens)
  writeFileSync(tokens, '@theme{--color-shared:green}')
  const results = await Promise.all(hosts.map(transform))
  expect(discovery.calls).toBe(2)
  for (const result of results) expect(result.code).toContain('--color-shared:green')
})

test('a pending old project cannot replace the manifest loaded after an edit', async () => {
  const { root, plugin } = fixture('test')
  const entry = join(root, 'app.css')
  writeFileSync(entry, '@import "@master/css";@theme{--color-shared:red}')
  let release!: () => void, started!: () => void
  const waiting = new Promise<void>(resolve => { started = resolve })
  const blocked = new Promise<void>(resolve => { release = resolve })
  discovery.afterLoad = async () => { discovery.afterLoad = undefined; started(); await blocked }
  const addWatchFile = vi.fn()
  const transform = (name: string) => plugin.transform.call({ addWatchFile }, '.card{color:var(--color-shared)}', join(root, `src/${name}.css`))
  const old = transform('old')
  try {
    await waiting
    expect(addWatchFile).toHaveBeenCalledWith(entry)
    writeFileSync(entry, '@import "@master/css";@theme{--color-shared:blue}')
    const environment = { moduleGraph: { getModuleById: vi.fn() } }
    await plugin.hotUpdate.call({ environment }, { type: 'update', file: entry, modules: [] })
    expect((await transform('new')).code).toContain('--color-shared:blue')
  } finally { release() }
  expect((await old).code).toContain('--color-shared:blue')
  expect((await transform('last')).code).toContain('--color-shared:blue')
})

test.each(['serve', 'build'])('scoped Vue styles keep project globals outside scoping in %s', async command => {
  const { root, context, plugin } = fixture(command)
  writeFileSync(join(root, 'app.css'), `@import url("@master/css");@theme {--color-brand:red; }
@keyframes pop{to{opacity:.5}}
`)
  const id = join(root, 'src/Card.vue') + '?vue&type=style&index=0&scoped=abc&lang.css'
  const result = await plugin.transform.call({ addWatchFile: vi.fn() }, '.card{color:var(--color-brand);animation:pop 1s}', id)
  expect(result.code).toMatch(/\.card\s*\{/)
  expect(result.code).not.toContain('--color-brand:red')
  expect(result.code).not.toContain('@keyframes')
  const globals = command === 'serve'
    ? [...devStylesheetState(context).stylesheets.values()].join('\n')
    : [...localStylesheets(context).values()].map(sheet => sheet.result.code).join('\n')
  expect(globals).toContain(':root,:host{--color-brand:red}')
  expect(globals).toContain('@keyframes pop')
  expect(result.code).toContain(command === 'serve' ? '@import ' : ':global(#master-css-local-')
})

test('native no-ops are invalidated when project entries are added, changed and deleted', async () => {
  const { root, plugin } = fixture('test')
  const id = join(root, 'src/card.css'), entry = join(root, 'app.css')
  const module = { id }, invalidateModule = vi.fn()
  const environment = { moduleGraph: { getModuleById: () => module, invalidateModule } }
  const source = '.card{color:var(--color-new)}'
  const transform = () => plugin.transform.call({ addWatchFile: vi.fn() }, source, id)
  expect(await transform()).toBeUndefined()
  for (const [type, color] of [['create', 'red'], ['update', 'blue'], ['delete', '']] as const) {
    if (color) writeFileSync(entry, `@import url("@master/css");@theme {--color-new:${color}}`)
    else rmSync(entry)
    expect(await plugin.hotUpdate.call({ environment }, { type, file: entry, modules: [] })).toEqual([module])
    const output = await transform()
    if (color) expect(output.code).toContain(`--color-new:${color}`)
    else expect(output).toBeUndefined()
  }
  expect(invalidateModule).toHaveBeenCalledTimes(3)
})

test('stylesheet events skip project discovery unless they can change the entries', async () => {
  const { root, plugin } = fixture('test')
  const id = join(root, 'src/card.css'), other = join(root, 'src/other.css')
  writeFileSync(join(root, 'app.css'), '@import url("@master/css");@theme {--color-new:red}')
  const module = { id }
  const environment = { moduleGraph: { getModuleById: () => module, invalidateModule: vi.fn() } }
  await plugin.transform.call({ addWatchFile: vi.fn() }, '.card{color:var(--color-new)}', id)
  discovery.calls = 0
  writeFileSync(other, '.other{color:red}')
  for (const type of ['create', 'update', 'delete'] as const) {
    if (type === 'delete') rmSync(other)
    expect(await plugin.hotUpdate.call({ environment }, { type, file: other, modules: [] })).toBeUndefined()
  }
  expect(discovery.calls).toBe(0)
  writeFileSync(other, '@import url("@master/css");@theme {--color-other:blue}')
  expect(await plugin.hotUpdate.call({ environment }, { type: 'create', file: other, modules: [] })).toEqual([module])
  expect(discovery.calls).toBe(1)
})

test('development server refreshes native consumers after a project entry is added and removed', async () => {
  const { root } = fixture()
  writeFileSync(join(root, 'index.html'), '<script type="module" src="/main.js"></script>')
  writeFileSync(join(root, 'main.js'), 'import "./card.css";if(import.meta.hot)import.meta.hot.accept();')
  writeFileSync(join(root, 'card.css'), '.card{color:var(--color-future, red)}')
  const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0 } })
  try {
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    await (await fetch(new URL('main.js', origin))).text()
    const read = async () => (await fetch(new URL('card.css?direct', origin))).text()
    expect(await read()).not.toContain('--color-future:')
    const send = vi.spyOn(server.ws, 'send')
    const entry = join(root, 'app.css')
    writeFileSync(entry, "@import url(\"@master/css\");@theme {--color-future:blue}")
    await vi.waitFor(async () => expect(await read()).toContain('--color-future:blue'), { timeout: watchDeadline })
    expect(send).toHaveBeenCalled()
    send.mockClear()
    rmSync(entry)
    await vi.waitFor(async () => expect(await read()).not.toContain('--color-future:'), { timeout: watchDeadline })
    expect(send).toHaveBeenCalled()
  } finally {
    await server.environments.client.waitForRequestsIdle()
    await server.close()
  }
})
