import { describe, expect, test } from 'vitest'
import masterCSS, { createMasterCSSVitePlugin } from '../src/lib/vite.js'

describe('Svelte Vite integration', () => {
  test('exports the same integration as default and named factories', () => {
    expect(masterCSS).toBe(createMasterCSSVitePlugin)
  })

  test('defaults to static and keeps runtime explicit', () => {
    expect(masterCSS().map(plugin => plugin.name)).not.toContain('master-css:inject-runtime')
    expect(masterCSS({ mode: 'runtime' }).map(plugin => plugin.name)).toContain('master-css:inject-runtime')
  })

  test('includes the emittedGlobals virtual module from the wrapped Vite plugin', () => {
    expect(masterCSS().map((plugin) => plugin.name)).toContain('master-css:virtual-module:emitted-globals')
  })

  test('externalizes server hook dependencies from SvelteKit server bundles', () => {
    const plugin = masterCSS().find((candidate) => candidate.name === 'master-css:svelte-kit-server-external')
    const config = typeof plugin?.config === 'function'
      ? plugin.config.call({} as never, {}, { command: 'build', mode: 'production' } as never)
      : undefined

    expect(config).toEqual({
      ssr: {
        external: ['@master/css-server']
      },
      build: {
        rollupOptions: {
          external: ['@master/css-server']
        }
      }
    })
  })
})
