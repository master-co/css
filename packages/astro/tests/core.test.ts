import { describe, expect, it, vi } from 'vitest'
import masterCSS, { ASTRO_MIDDLEWARE_ENTRYPOINT } from '../src/core'
import defaultOptions from '../src/options'
import { CSS_RUNTIME_INJECTION } from '@master/css-integration/runtime'

async function setup(options?: Parameters<typeof masterCSS>[0]) {
    const integration = masterCSS(options)
    const addMiddleware = vi.fn()
    const injectScript = vi.fn()
    const updateConfig = vi.fn()

    await integration.hooks['astro:config:setup']?.({
        addMiddleware,
        injectScript,
        updateConfig
    } as never)

    const config = updateConfig.mock.calls[0]?.[0] as { vite?: { plugins?: unknown[] } } | undefined
    const plugins = (config?.vite?.plugins || []).flat(Infinity) as { name?: string }[]

    return {
        addMiddleware,
        injectScript,
        pluginNames: plugins.map(({ name }) => name)
    }
}

describe('@master/css.astro integration', () => {
    it('defaults to progressive mode', () => {
        expect(defaultOptions.mode).toBe('progressive')
    })

    it('adds Astro middleware and runtime script in progressive mode', async () => {
        const result = await setup()

        expect(result.addMiddleware).toHaveBeenCalledWith({
            order: 'pre',
            entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
        })
        expect(result.injectScript).toHaveBeenCalledWith('page', CSS_RUNTIME_INJECTION)
        expect(result.pluginNames).not.toContain('master-css:pre-render')
        expect(result.pluginNames).not.toContain('master-css:inject-runtime')
    })

    it('uses Astro middleware without runtime script in pre-render mode', async () => {
        const result = await setup({ mode: 'pre-render' })

        expect(result.addMiddleware).toHaveBeenCalledWith({
            order: 'pre',
            entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
        })
        expect(result.injectScript).not.toHaveBeenCalled()
        expect(result.pluginNames).not.toContain('master-css:pre-render')
    })

    it('injects runtime script without Astro middleware in runtime mode', async () => {
        const result = await setup({ mode: 'runtime' })

        expect(result.addMiddleware).not.toHaveBeenCalled()
        expect(result.injectScript).toHaveBeenCalledWith('page', CSS_RUNTIME_INJECTION)
        expect(result.pluginNames).toContain('master-css:avoid-fouc')
        expect(result.pluginNames).not.toContain('master-css:inject-runtime')
    })

    it('honors injectRuntime=false in progressive mode', async () => {
        const result = await setup({ mode: 'progressive', injectRuntime: false })

        expect(result.addMiddleware).toHaveBeenCalled()
        expect(result.injectScript).not.toHaveBeenCalled()
    })
})
