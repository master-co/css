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

const roots: string[] = []
function fixture(command = 'serve') {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'vite-project-context-')))
  roots.push(root)
  mkdirSync(join(root, 'src'))
  const context = { config: { root, command, server: { fs: { allow: [] } } } } as any
  const plugin = LocalStylesPlugin({} as any, context) as any
  return { root, context, plugin }
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test.each(['serve', 'build'])('scoped Vue styles keep project globals outside scoping in %s', async command => {
  const { root, context, plugin } = fixture(command)
  writeFileSync(join(root, 'app.css'), '@master entry;@theme{--color-brand:red;@keyframes pop{to{opacity:.5}}}')
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
    if (color) writeFileSync(entry, `@master entry;@theme{--color-new:${color}}`)
    else rmSync(entry)
    expect(await plugin.hotUpdate.call({ environment }, { type, file: entry, modules: [] })).toEqual([module])
    const output = await transform()
    if (color) expect(output.code).toContain(`--color-new:${color}`)
    else expect(output).toBeUndefined()
  }
  expect(invalidateModule).toHaveBeenCalledTimes(3)
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
    writeFileSync(entry, '@master entry;@theme{--color-future:blue}')
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
