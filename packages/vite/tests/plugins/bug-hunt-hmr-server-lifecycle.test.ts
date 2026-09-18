import { EventEmitter } from 'node:events'
import { expect, test, vi } from 'vitest'
import type { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import type { ResolvedConfig, ViteDevServer } from 'vite'
import type { MasterCSSVitePluginContext } from '../../src/core'
import type { ResolvedMasterCSSVitePluginOptions } from '../../src/options'
import StyleEntryHMRPlugin from '../../src/plugins/style-entry-hmr'

const scanner = () => new EventEmitter() as MasterCSSScanner
const server = () => ({
  config: { root: '/audit' } as ResolvedConfig,
  moduleGraph: { getModuleById: () => ({}) },
  reloadModule: vi.fn(async () => {})
}) as unknown as ViteDevServer

test('BH-0004 scanner changes notify the replacement server without retaining the closed server', async () => {
  const oldServer = server(), nextServer = server()
  const context: MasterCSSVitePluginContext = { scanner: scanner() }
  const plugin = StyleEntryHMRPlugin({} as ResolvedMasterCSSVitePluginOptions, context)
  if (typeof plugin.configureServer !== 'function' || typeof plugin.buildStart !== 'function') throw new Error('Expected HMR lifecycle hooks')
  // The hooks under test only read environment.getTopLevelConfig during close.
  const host = (config: ResolvedConfig) => ({ environment: { getTopLevelConfig: () => config } }) as never
  await plugin.configureServer.call(host(oldServer.config), oldServer)
  await plugin.buildStart.call(host(oldServer.config), {} as never)
  context.scanner = scanner()
  await plugin.configureServer.call(host(nextServer.config), nextServer)
  await plugin.buildStart.call(host(nextServer.config), {} as never)
  if (typeof plugin.closeBundle === 'function') {
    await plugin.closeBundle.call(host(oldServer.config))
    await plugin.closeBundle.call(host(oldServer.config))
  }
  context.scanner.emit('change')
  await vi.waitFor(() => expect(nextServer.reloadModule).toHaveBeenCalledOnce())
  expect(oldServer.reloadModule).not.toHaveBeenCalled()
  if (typeof plugin.closeBundle === 'function') await plugin.closeBundle.call(host(nextServer.config))
  context.scanner.removeAllListeners()
})
