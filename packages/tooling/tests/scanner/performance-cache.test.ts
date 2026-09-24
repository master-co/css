import { readFileSync } from 'node:fs'
import { expect, test, vi } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { BindingScannerSession } from '../../src/scanner/binding-session'
import type { SourceAdapter } from '../../src/source/adapters/types'
import { MasterCSSScanner } from '../../src/scanner'

const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }
const manifest = defaultManifest as unknown as MasterCSSManifest

test.each(['native', 'wasm'] as const)('%s skips extraction, validation and snapshots for cached sources', async (binding) => {
  const scanner = await new MasterCSSScanner({ manifest, binding, wasm, verbose: 0 }).init()
  const session = (scanner as unknown as { bindingSession: BindingScannerSession }).bindingSession
  const extract = vi.spyOn(session, 'extractCandidates')
  const validate = vi.spyOn(session, 'scanCandidates')
  const snapshot = vi.spyOn(session, 'state')
  const change = vi.fn()
  scanner.on('change', change)
  try {
    const content = '<div class="block unknown"></div>'
    const first = await scanner.scanSource('a.html', content)
    expect(first).toEqual({ changed: true, candidates: ['block', 'unknown'] })
    expect(snapshot).not.toHaveBeenCalled()
    expect(await scanner.scanSource('a.html', content)).toEqual({ ...first, changed: false })
    expect(extract).toHaveBeenCalledTimes(1)
    expect(validate).toHaveBeenCalledTimes(1)
    expect(snapshot).not.toHaveBeenCalled()
    expect(scanner.state.cachedSources).toBe(1)
    const previous = scanner.state
    expect(snapshot).toHaveBeenCalledTimes(1)
    expect(await scanner.scanSource('b.html', content)).toEqual({ ...first, changed: false })
    expect(validate).toHaveBeenCalledTimes(2)
    expect(snapshot).toHaveBeenCalledTimes(1)
    expect(scanner.state.cachedSources).toBe(2)
    expect(scanner.state).not.toBe(previous)
    expect(change).toHaveBeenCalledTimes(1)
    scanner.registerNativeClasses(['unknown'])
    expect([...scanner.usedNativeClasses]).toEqual(['unknown'])
    expect(change).toHaveBeenCalledTimes(2)
    await scanner.reset({ manifest, binding, wasm, safelist: ['flex'], verbose: 0 })
    expect(scanner.state.cachedSources).toBe(0)
    expect(scanner.css.text).toContain('display:flex')
    expect((await scanner.scanSource('a.html', content)).changed).toBe(true)
  } finally {
    await scanner.dispose()
  }
})

test.each(['html', 'tsx', 'vue', 'svelte'])('caches %s extraction including complete candidates and empty results', async (extension) => {
  const scanner = await new MasterCSSScanner({ manifest, verbose: 0 }).init()
  const internals = scanner as unknown as {
    bindingSession: BindingScannerSession
    resolveSourceAdapter(source: string): SourceAdapter | undefined
  }
  const resolve = vi.spyOn(internals, 'resolveSourceAdapter')
  const source = `a.${extension}`
  const content = extension === 'tsx'
    ? 'export const A = () => <div className="block" />'
    : extension === 'vue' ? '<template><div class="block" /></template>' : '<div class="block" />'
  try {
    const first = await scanner.scanSource(source, content)
    expect(first.candidates).toContain('block')
    expect(await scanner.scanSource(source, content)).toEqual({ ...first, changed: false })
    expect(resolve).toHaveBeenCalledTimes(1)
    await scanner.scanSource(source, ' ')
    expect(await scanner.scanSource(source, ' ')).toEqual({ changed: false, candidates: [] })
    expect(resolve).toHaveBeenCalledTimes(2)
    expect(await scanner.scanSource(source, '')).toEqual({ changed: false, candidates: [] })
    expect(internals.bindingSession.cachedSourceCandidates(source, ' ')).toEqual([])
    await scanner.scanSource('', content)
    await scanner.scanSource('', content)
    expect(resolve).toHaveBeenCalledTimes(4)
  } finally {
    await scanner.dispose()
  }
})

test('adapter failure leaves the source retryable', async () => {
  const scanner = await new MasterCSSScanner({ manifest, verbose: 0 }).init()
  const internals = scanner as unknown as {
    resolveSourceAdapter(source: string): SourceAdapter | undefined
  }
  const adapter = internals.resolveSourceAdapter('a.vue')!
  const extract = vi.spyOn(adapter, 'extract')
  extract.mockRejectedValueOnce(new Error('adapter failed'))
  try {
    const content = '<template><div class="block" /></template>'
    await expect(scanner.scanSource('a.vue', content)).rejects.toThrow('adapter failed')
    expect(scanner.state.cachedSources).toBe(0)
    expect((await scanner.scanSource('a.vue', content)).changed).toBe(true)
    expect(extract).toHaveBeenCalledTimes(2)
  } finally {
    extract.mockRestore()
    await scanner.dispose()
  }
})
