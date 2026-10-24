import { expect, test, vi } from 'vitest'
import type { Plugin, ResolvedConfig } from 'vite'
import { scopePlugins } from '../../src/utils/scoped-plugins'

test('environment copies omit hooks Vite only runs on top-level plugins', async () => {
  const transform = vi.fn(() => null)
  const [plugin] = scopePlugins(() => [{
    name: 'scoped',
    config: () => undefined,
    configEnvironment: () => undefined,
    configResolved: () => undefined,
    configureServer: () => undefined,
    configurePreviewServer: () => undefined,
    transform
  } satisfies Plugin])
  const config = {} as ResolvedConfig
  const applied = await plugin.applyToEnvironment!({ getTopLevelConfig: () => config } as any) as Plugin
  expect(Object.keys(applied).sort()).toEqual(['name', 'transform'])
  expect(plugin.configResolved).toBeTypeOf('function')
  await (applied.transform as any).call({}, 'code', 'id')
  expect(transform).toHaveBeenCalledOnce()
})
