import { describe, expect, test } from 'vitest'
import VirtualCSSImportPlugin, { replaceVirtualCSSImport } from '../../src/plugins/virtual-css-import'

const SLOT = '#virtual\\:master\\.css{--slot:0}'

function makeContext(command: 'serve' | 'build', css = '.fg\\:red{color:red}') {
    return {
        config: { command },
        extractor: {
            options: { module: 'virtual:master.css' },
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
    test('replaces CSS @import rules that target the virtual module', () => {
        const result = replaceVirtualCSSImport(
            [
                '@import "virtual:master.css";',
                '@import url(\'virtual:master.css\');',
                '@import "./other.css";',
            ].join('\n'),
            'virtual:master.css',
            SLOT
        )

        expect(result.replaced).toBe(true)
        expect(result.code).toContain(SLOT)
        expect(result.code).not.toContain('@import "virtual:master.css"')
        expect(result.code).not.toContain('@import url(\'virtual:master.css\')')
        expect(result.code).toContain('@import "./other.css";')
    })

    test('build transform emits the slot placeholder for bundle-time replacement', async () => {
        const context = makeContext('build')
        const plugin = VirtualCSSImportPlugin({}, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "virtual:master.css";\nbody{margin:0}',
            '/project/src/style.css'
        )

        expect(result.code).toBe(SLOT)
        expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
        expect(context.virtualCSSPlaceholderEmitted).toBe(true)
    })

    test('serve transform inlines current extracted CSS and tracks the CSS module for HMR', async () => {
        const context = makeContext('serve', '.fg\\:red{color:red}')
        const plugin = VirtualCSSImportPlugin({}, context)

        const result = await (plugin as any).transform.call(
            {},
            '@import "virtual:master.css";',
            '/project/src/style.css'
        )

        expect(result.code).toContain('.fg\\:red')
        expect(context.virtualCSSImporters).toEqual(new Set(['/project/src/style.css']))
        expect(context.virtualCSSPlaceholderEmitted).toBeUndefined()
    })

    test('ignores standalone @master stylesheets without virtual CSS imports', async () => {
        const context = makeContext('build')
        const plugin = VirtualCSSImportPlugin({}, context)

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
        const plugin = VirtualCSSImportPlugin({}, context)

        expect(await (plugin as any).transform.call({}, '@import "virtual:master.css";', '/project/src/main.ts')).toBeUndefined()
        expect(await (plugin as any).transform.call({}, '@import "./other.css";', '/project/src/style.css')).toBeUndefined()
    })
})
