import { describe, expect, it, vi } from 'vitest'
import { inlineServerManifests } from '../src/core'

describe('Astro server manifests', () => {
  it('omits manifest asset emission in server environments only', async () => {
    const load = vi.fn(function (this: { emitFile?: unknown }) { return this.emitFile ? 'asset' : 'inline' })
    const plugin = inlineServerManifests({ name: 'master-css:virtual-module:manifest', applyToEnvironment: () => ({ name: 'environment', load }) })
    const emitFile = vi.fn()
    const loadIn = async (consumer: 'server' | 'client') => {
      const environment = { config: { consumer } }
      const applied = await (plugin.applyToEnvironment as any)(environment)
      return applied.load.call({ emitFile, environment }, 'id')
    }

    expect(await loadIn('server')).toBe('inline')
    expect(await loadIn('client')).toBe('asset')
    expect(inlineServerManifests({ name: 'other', load }).load).toBe(load)
  })
})
