import { expect, test } from 'vitest'
import type { NextConfig } from 'next'
import withMasterCSS from '../src'

const ids = ['virtual:master-css-manifest', 'virtual:master-css-emitted-globals', 'virtual:master-utilities.css']

async function configuredResolver() {
  const userPlugin = { apply() {} }
  const config = (withMasterCSS({}, { mode: 'runtime' }) as NextConfig).webpack!({ plugins: [userPlugin], module: { rules: [] }, resolve: { alias: { custom: '/user/custom.js' } } }, {} as never)
  const callbacks: ((data: { request: string } | undefined) => void)[] = []
  const factory = { hooks: { beforeResolve: { tap(_name: string, callback: typeof callbacks[number]) { callbacks.push(callback) } } } }
  const compiler = { hooks: { normalModuleFactory: { tap(_name: string, callback: (value: typeof factory) => void) { callback(factory) } } } }
  for (const plugin of config.plugins) plugin.apply(compiler)
  expect(config.plugins[0]).toBe(userPlugin)
  expect(config.resolve.alias.custom).toBe('/user/custom.js')
  return {
    aliases: config.resolve.alias,
    resolve(request: string) { const data = { request };for (const callback of callbacks) callback(data);return data.request },
    cancel() { for (const callback of callbacks) callback(undefined) }
  }
}

for (const id of ids) test(`Next resolves ${id} before Webpack URI dispatch`, async () => {
  const resolver = await configuredResolver()
  expect(resolver.resolve(id)).toBe(resolver.aliases[id])
})

for (const id of ['virtual:another-package', 'virtual:master-css-manifest-extra', './native.css?master-css-manifest', 'custom', 'toString']) test(`Next virtual handling preserves unrelated request ${id}`, async () => {
  expect((await configuredResolver()).resolve(id)).toBe(id)
})

test('Next virtual handling tolerates a cancelled resolution', async () => {
  const resolver = await configuredResolver()
  expect(() => resolver.cancel()).not.toThrow()
})
