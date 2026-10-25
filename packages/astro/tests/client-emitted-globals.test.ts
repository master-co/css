import { describe, expect, it } from 'vitest'
import type { MasterCSSRenderingMode } from '@master/css-schema/integration'
import { createAstroVitePlugins, type EmittedGlobalsPluginAPI } from '../src/core'

type Environment = { name: string, config: { consumer: 'client' | 'server' } }

function emittedGlobalsAPI(mode: MasterCSSRenderingMode) {
  const plugin = createAstroVitePlugins({ mode }).find(plugin => plugin.name === 'master-css:virtual-module:emitted-globals')
  return plugin!.api as EmittedGlobalsPluginAPI
}

const environment = (name: string, consumer: 'client' | 'server'): Environment => ({ name, config: { consumer } })

describe('Astro client emitted globals', () => {
  it('counts the stylesheets server environments deliver in the runtime client bundle', () => {
    const { finalize } = emittedGlobalsAPI('runtime')
    const prerender = { variables: { 'color-text-body': 1 }, keyframes: {}, keyframeSlots: ['fade'], suppressedKeyframes: [] }
    const ssr = { variables: { 'spacing-md': 1 }, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] }
    const client = { variables: { 'color-text-body': 1 }, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] }

    // Server environments keep the emitted globals their own middleware renders against.
    expect(finalize!(environment('prerender', 'server'), prerender)).toBe(prerender)
    expect(finalize!(environment('ssr', 'server'), ssr)).toBe(ssr)
    expect(finalize!(environment('client', 'client'), client)).toEqual({
      variables: { 'color-text-body': 2, 'spacing-md': 1 },
      keyframes: {},
      keyframeSlots: ['fade'],
      suppressedKeyframes: []
    })
  })

  it('leaves progressive client bundles to the hydration manifests of their pages', () => {
    expect(emittedGlobalsAPI('progressive').finalize).toBeUndefined()
  })
})
