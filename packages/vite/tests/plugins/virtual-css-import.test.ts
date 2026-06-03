import { describe, expect, test } from 'vitest'
import ExtractCSSPlugin, {
    StyleCSSPlugin,
    replaceMasterCSSImport
} from '../../src/plugins/virtual-css-import'

const SLOT = '#master-css-slot{--slot:0}'
const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'
const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

function makeContext(command: 'serve' | 'build', css = '.fg\\:red{color:red}') {
    return {
        config: { command },
        extractor: {
            options: {},
            slotCSSRule: SLOT,
            css: { text: css },
            config: {},
            latentClasses: new Set(['fg:red']),
            validClasses: new Set(),
            nativeClassNames: new Set(),
            usedNativeClasses: new Set(),
            emit: () => undefined,
        },
    } as any
}

describe('VirtualCSSImportPlugin', () => {
    test('replaces CSS @import rules that target @master/css', () => {
        const result = replaceMasterCSSImport(
            [
                '@import "@master/css";',
                '@import url(\'theme.css\');',
                '@import "./other.css";',
            ].join('\n'),
            SLOT
        )

        expect(result.replaced).toBe(true)
        expect(result.code).toContain(SLOT)
        expect(result.code).not.toContain('@import "@master/css"')
        expect(result.code).toContain('@import url(\'theme.css\');')
        expect(result.code).toContain('@import "./other.css";')
    })

    test('does not treat @master/css subpath imports as CSS config entries', () => {
        const result = replaceMasterCSSImport('@import "@master/css/index.css";', SLOT)

        expect(result.replaced).toBe(false)
        expect(result.code).toContain('@import "@master/css/index.css";')
    })

    test('build load emits the slot placeholder for bundle-time replacement', async () => {
        const context = makeContext('build')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        expect((plugin as any).resolveId(VIRTUAL_CSS_ID)).toBe(RESOLVED_VIRTUAL_CSS_ID)
        const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

        expect(result).toBe(SLOT)
        expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('serve load inlines current extracted CSS and tracks the virtual CSS module for HMR', async () => {
        const context = makeContext('serve', '.fg\\:red{color:red}')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        const result = await (plugin as any).load.call({}, RESOLVED_VIRTUAL_CSS_ID)

        expect(result).toContain('.fg\\:red')
        expect(context.virtualCSSImporters).toEqual(new Set([RESOLVED_VIRTUAL_CSS_ID]))
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('style cleanup plugin removes Master directives without registering extract sources', async () => {
        const context = makeContext('build')
        const plugin = StyleCSSPlugin(context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "@master/css";\n@master no-shake;\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toContain('@import "@master/css";')
        expect(result.code).toContain('.card{color:red}')
        expect(result.code).not.toContain('@master no-shake')
        expect(context.styleCSSSources).toBeUndefined()
    })

    test('treats @master/css import stylesheets as managed shaken CSS entries', async () => {
        const context = makeContext('build')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "@master/css";\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toBe(SLOT)
        expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
            shake: true,
            source: expect.stringContaining('.card')
        })
        expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@master/css')
        expect(context.virtualCSSImporters).toBeUndefined()
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('serve transform emits current CSS and reloads the managed stylesheet for HMR', async () => {
        const context = makeContext('serve')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

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

    test('treats @master stylesheets as managed shaken CSS entries', async () => {
        const context = makeContext('build')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@master;\n.card{color:red}',
            '/project/src/style.css'
        )

        expect(result.code).toBe(SLOT)
        expect(context.styleCSSSources.get('/project/src/style.css')).toMatchObject({
            shake: true,
            source: expect.stringContaining('.card')
        })
        expect(context.styleCSSSources.get('/project/src/style.css').source).not.toContain('@master;')
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('ignores standalone @master stylesheets without @master/css imports', async () => {
        const context = makeContext('build')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        const result = await (plugin as any).transform.call(
            {},
            '@master { .card { display: grid; } }\n.card { color: red }',
            '/project/src/style.css'
        )

        expect(result).toBeUndefined()
        expect(context.virtualCSSImporters).toBeUndefined()
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('ignores non-CSS modules and unrelated CSS imports', async () => {
        const context = makeContext('build')
        const plugin = ExtractCSSPlugin({ mode: 'extract' } as any, context)

        expect(await (plugin as any).transform.call({}, '@import "@master/css";', '/project/src/main.ts')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "virtual:master-utilities.css";', '/project/src/style.css')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "theme.css";', '/project/src/style.css')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "./other.css";', '/project/src/style.css')).toBeUndefined()
    })
})
