import { EventEmitter } from 'node:events'
import { expect, test, vi } from 'vitest'
import SassSourcePlugin from '../../src/plugins/sass-source'
import { sassSourceID } from '../../src/utils/build-sass-source'

vi.mock('../../src/utils/sass-proxy-access', () => ({ installSassProxyAccessCheck: vi.fn() }))

function fixture() {
  let middleware!: (request: unknown, response: unknown, next: () => void) => void
  const module = { id: sassSourceID('/project/style.scss'), importers: new Set() }
  const moduleGraph = { idToModuleMap: new Map([[module.id, module]]), invalidateModule: vi.fn(), getModuleByUrl: vi.fn(async () => module) }
  const hot = { send: vi.fn() }, environment = { config: { consumer: 'client' }, moduleGraph, hot, close: vi.fn(async () => {}) }
  const server = { config: { base: '/', logger: { warn: vi.fn() } }, moduleGraph, middlewares: { use: (handler: typeof middleware) => { middleware = handler } } }
  const plugin = SassSourcePlugin({ config: { command: 'serve' } } as any) as any
  plugin.configureServer(server)
  const response = Object.assign(new EventEmitter(), { statusCode: 200 })
  middleware({ url: '/style.scss', headers: { accept: 'text/css' } }, response, vi.fn())
  return { response, moduleGraph, hot, environment, update: () => plugin.hotUpdate.call({ environment }, { file: '/project/style.scss', modules: [module], timestamp: 1 }) }
}

test('HMR waits for response completion and asynchronous URL registration', async () => {
  const f = fixture()
  let release!: () => void
  const blocked = new Promise<void>(resolve => { release = resolve })
  const module = f.moduleGraph.idToModuleMap.values().next().value!
  f.moduleGraph.getModuleByUrl.mockImplementation(async () => { await blocked; return module })
  const updating = f.update()
  try {
    await Promise.resolve()
    expect(f.hot.send).not.toHaveBeenCalled()
    f.response.emit('finish')
    f.response.emit('close')
    await Promise.resolve()
    expect(f.hot.send).not.toHaveBeenCalled()
    release()
    await updating
    expect(f.hot.send).toHaveBeenCalledWith({ type: 'update', updates: [{ type: 'css-update', path: '/style.scss', acceptedPath: '/style.scss', timestamp: 1 }] })
  } finally { release() }
})

test.each(['aborted', 'failed'])('%s responses release HMR without registering a stylesheet', async kind => {
  const f = fixture(), updating = f.update()
  if (kind === 'aborted') f.response.emit('close')
  else { f.response.statusCode = 500; f.response.emit('finish') }
  await updating
  expect(f.moduleGraph.getModuleByUrl).not.toHaveBeenCalled()
  expect(f.hot.send).not.toHaveBeenCalled()
})

test('closing an environment releases pending request work and prevents late notifications', async () => {
  const f = fixture(), updating = f.update()
  await f.environment.close()
  await updating
  f.response.emit('finish')
  await Promise.resolve()
  expect(f.hot.send).not.toHaveBeenCalled()
})
