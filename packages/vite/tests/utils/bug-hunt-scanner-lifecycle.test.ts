import { beforeEach, expect, test, vi } from 'vitest'
import type { ResolvedConfig } from 'vite'
import type { MasterCSSVitePluginContext } from '../../src/core'
import type { ResolvedMasterCSSVitePluginOptions } from '../../src/options'
import { disposeScanner, ensureScanner } from '../../src/utils/scanner-context'

const lifecycle = vi.hoisted(() => ({ initialize: vi.fn(), dispose: vi.fn() }))
vi.mock('@master/css-tooling/scanner/node', () => ({
  MasterCSSScanner: class {
    constructor(public options: Record<string, unknown>) {}
    async init() { await lifecycle.initialize();return this }
    async dispose() { lifecycle.dispose(this) }
  }
}))
const options = {} as ResolvedMasterCSSVitePluginOptions
const config = () => ({ root: '/audit' }) as ResolvedConfig
const collection = () => ({ dispose: vi.fn() }) as unknown as NonNullable<MasterCSSVitePluginContext['stylesheets']>
beforeEach(() => { lifecycle.initialize.mockReset();lifecycle.dispose.mockReset() })

test('BH-0004 old environment closes only its own scanner and collection, once', async () => {
  const oldConfig = config(), nextConfig = config(), context: MasterCSSVitePluginContext = { config: oldConfig }
  const oldScanner = await ensureScanner(options, context), oldCollection = collection()
  context.stylesheets = oldCollection
  context.config = nextConfig
  const nextScanner = await ensureScanner(options, context), nextCollection = collection()
  expect(nextScanner).not.toBe(oldScanner)
  expect(context.stylesheets).toBeUndefined()
  context.stylesheets = nextCollection
  await Promise.all([disposeScanner(context, oldConfig), disposeScanner(context, oldConfig)])
  expect(lifecycle.dispose.mock.calls).toEqual([[oldScanner]])
  expect(oldCollection.dispose).toHaveBeenCalledOnce()
  expect(nextCollection.dispose).not.toHaveBeenCalled()
  expect(context.scanner).toBe(nextScanner)
  expect(context.stylesheets).toBe(nextCollection)
  await disposeScanner(context, nextConfig)
  expect(lifecycle.dispose.mock.calls).toEqual([[oldScanner], [nextScanner]])
  expect(nextCollection.dispose).toHaveBeenCalledOnce()
  expect(context.scanner).toBeUndefined()
  expect(context.stylesheets).toBeUndefined()
})

test('BH-0004 late old initialization cannot replace the current scanner or escape disposal', async () => {
  let release!: () => void
  lifecycle.initialize.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve }))
  const oldConfig = config(), context: MasterCSSVitePluginContext = { config: oldConfig }
  const oldInitialization = ensureScanner(options, context)
  context.config = config()
  const nextScanner = await ensureScanner(options, context)
  const closing = disposeScanner(context, oldConfig)
  expect(context.scanner).toBe(nextScanner)
  release()
  const oldScanner = await oldInitialization
  await closing
  expect(lifecycle.dispose.mock.calls).toEqual([[oldScanner]])
  expect(context.scanner).toBe(nextScanner)
  await disposeScanner(context)
})

test('BH-0004 a failed initialization releases its scanner and permits retry', async () => {
  lifecycle.initialize.mockRejectedValueOnce(new Error('initialization failed'))
  const context: MasterCSSVitePluginContext = { config: config() }
  await expect(ensureScanner(options, context)).rejects.toThrow('initialization failed')
  expect(lifecycle.dispose).toHaveBeenCalledOnce()
  expect(context.scanner).toBeUndefined()
  const scanner = await ensureScanner(options, context)
  expect(context.scanner).toBe(scanner)
  expect(lifecycle.initialize).toHaveBeenCalledTimes(2)
  await disposeScanner(context)
  expect(lifecycle.dispose).toHaveBeenCalledTimes(2)
})

test('BH-0004 closing a pending initialization prevents publication and allows the next build', async () => {
  let release!: () => void
  lifecycle.initialize.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve }))
  const context: MasterCSSVitePluginContext = { config: config() }
  const initializing = ensureScanner(options, context), closing = disposeScanner(context)
  const nextBuild = ensureScanner(options, context)
  release()
  const oldScanner = await initializing
  await closing
  const scanner = await nextBuild
  expect(scanner).not.toBe(oldScanner)
  expect(lifecycle.dispose.mock.calls).toEqual([[oldScanner]])
  expect(context.scanner).toBe(scanner)
  await disposeScanner(context)
})
