import { describe, expect, test } from 'vitest'
import masterCSS, { SVELTEKIT_SSR_EXTERNAL } from '../src/lib/vite.js'

describe('Svelte Vite integration', () => {
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
                external: SVELTEKIT_SSR_EXTERNAL
            },
            build: {
                rollupOptions: {
                    external: SVELTEKIT_SSR_EXTERNAL
                }
            }
        })
    })
})
