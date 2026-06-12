import { describe, expect, test } from 'vitest'
import StyleEntryPlugin from '../../src/plugins/style-entry'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { defaultPlan } from '@master/css'

const SLOT = '#master-css-slot{--slot:0}'
const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

function makeContext(command: 'serve' | 'build', css = '.fg\\:red{color:red}', includeGeneratedCSS = true) {
    return {
        config: { command },
        includeGeneratedCSS,
        extractor: {
            options: { safelist: [] },
            slotCSSRule: SLOT,
            css: { text: css, plan: defaultPlan },
            config: {},
            latentClasses: new Set(['fg:red']),
            validClasses: new Set(),
            nativeClassNames: new Set(),
            usedNativeClasses: new Set(),
            emit: () => undefined,
        },
    } as any
}

describe('StyleEntryPlugin', () => {
    test('build load emits the slot placeholder for bundle-time replacement', async () => {
        const context = makeContext('build')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        expect((plugin as any).resolveId(VIRTUAL_CSS_ID)).toBe(RESOLVED_VIRTUAL_CSS_ID)
        const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

        expect(result).toBe(SLOT)
        expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('serve load inlines current extracted CSS and tracks the virtual CSS module for HMR', async () => {
        const context = makeContext('serve', '.fg\\:red{color:red}')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

        expect(result).toContain('.fg\\:red')
        expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('treats @master/css import stylesheets as managed native CSS pruning entries', async () => {
        const context = makeContext('build')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "@master/css";\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toBe(SLOT)
        expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
            pruneNativeCSS: true,
            source: expect.stringContaining('.card')
        })
        expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@master/css')
        expect(context.virtualCSSImporters).toBeUndefined()
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('serve transform emits current CSS and reloads the managed stylesheet for HMR', async () => {
        const context = makeContext('serve')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "@master/css";\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toContain('.fg\\:red')
        expect(result.code).not.toBe(SLOT)
        expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('non-generated modes consume empty Master entries without restoring @master/css imports', async () => {
        const context = makeContext('serve', '', false)
        context.extractor.latentClasses = new Set()
        const plugin = StyleEntryPlugin({ mode: 'runtime' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "@master/css";',
            '/project/src/style.css'
        )

        expect(result.code).not.toContain('@master/css')
        expect(result.code).not.toContain(SLOT)
        expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
            pruneNativeCSS: true
        })
        expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
    })

    test('treats @master stylesheets as managed native CSS pruning entries', async () => {
        const context = makeContext('build')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@master;\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toBe(SLOT)
        expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
            pruneNativeCSS: true,
            source: expect.stringContaining('.card')
        })
        expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@master;')
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('ignores standalone @master stylesheets without @master/css imports', async () => {
        const context = makeContext('build')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@settings { root-size: 16; }\n.card { color: red }',
            '/project/src/style.css'
        )

        expect(result).toBeUndefined()
        expect(context.virtualCSSImporters).toBeUndefined()
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('ignores non-CSS modules and unrelated CSS imports', async () => {
        const context = makeContext('build')
        const plugin = StyleEntryPlugin({ mode: 'static' } as any, context)

        expect(await (plugin as any).transform.call({}, '@import "@master/css";', '/project/src/main.ts')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "virtual:master-utilities.css";', '/project/src/style.css')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "theme.css";', '/project/src/style.css')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "./other.css";', '/project/src/style.css')).toBeUndefined()
    })
})
