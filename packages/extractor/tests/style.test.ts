import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSExtractor from '../src/core'
import {
    createExtractedCSS,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    isMasterStyleSource,
    removeMasterShakeDirectives,
    registerStyleCSSSource,
    replaceStyleCSSImports
} from '../src/style'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-extractor-style-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    writeFileSync(join(root, 'master.css'), '@master {}')
    return root
}

describe('style CSS extraction helpers', () => {
    it('replaces @master/css imports with CSS import modifiers', () => {
        const result = replaceStyleCSSImports([
            '@import "@master/css" layer(master);',
            '@import url(\'master.css\') layer(master);',
            '@import "./other.css";'
        ].join('\n'), '/* master */')

        expect(result.replaced).toBe(true)
        expect(result.code).toContain('/* master */')
        expect(result.code).not.toContain('@master/css')
        expect(result.code).toContain('@import url(\'master.css\') layer(master);')
        expect(result.code).toContain('@import "./other.css";')
    })

    it('detects Master CSS imports and legacy master shake directives', () => {
        expect(isMasterStyleSource('@master { --color-primary: red; }')).toBe(false)
        expect(isMasterStyleSource('@import "@master/css";')).toBe(true)
        expect(isMasterStyleSource('@import "virtual:master.css";')).toBe(false)
        expect(isMasterStyleSource('@import "master.css";')).toBe(false)
        expect(isMasterStyleSource('@master shake;')).toBe(true)
        expect(isMasterStyleSource('@master no-shake;')).toBe(false)
        expect(isMasterStyleSource('@import "./other.css";')).toBe(false)
    })

    it('removes top-level master style directives', () => {
        const result = removeMasterShakeDirectives([
            '@master shake;',
            '@master no-shake;',
            '',
            '@media (min-width: 768px) {',
            '    @master shake;',
            '    @master no-shake;',
            '}',
            '',
            '.card { color: red; }'
        ].join('\n'))

        expect(hasMasterShakeDirective('@master shake;\n.card { color: red; }')).toBe(true)
        expect(hasMasterNoShakeDirective('@master no-shake;\n.card { color: red; }')).toBe(true)
        expect(result.removed).toBe(true)
        expect(result.code).not.toContain('@master no-shake;\n\n.card')
        expect(result.code).toContain('@media (min-width: 768px) {\n    @master shake;\n    @master no-shake;\n}')
    })

    it('uses root master.css config only and ignores stylesheet-local CSS config sources', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'master.css'), `
            .root-native {
                color: red;
            }

            @master {
                --color-primary: #ff0000;

                @keyframes fade {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                .btn {
                    display: grid;
                }
            }
        `)
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()
        await extractor.prepare()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";

            @master {
                .btn {
                    display: inline-flex;
                }
            }

            .main {
                color: var(--color-primary);
                animation-name: fade;
            }

            .unused {
                color: var(--color-primary);
            }
        `)
        await extractor.insert(join(root, 'app/page.tsx'), '<main class="btn block main"></main>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect(css).not.toContain('.root-native')
        expect(css).toContain('@layer base')
        expect(css).toContain('text-rendering: geometricPrecision')
        expect(css).toContain('.main')
        expect(css).not.toContain('.unused')
        expect(css).toContain('--color-primary:red')
        expect(css).toContain('@keyframes fade')
        expect(css).toContain('.btn{display:grid}')
        expect(css).not.toContain('.btn{display:inline-flex}')
        expect(css).toContain('.block{display:block}')
        expect(css).not.toContain('@master')
        expect(css).not.toContain('virtual:master.css')
        expect(css).not.toContain('@master/css')
    })

    it('shakes local CSS imports from Master CSS import roots by default', async () => {
        const root = createFixture()
        mkdirSync(join(root, 'app/styles'), { recursive: true })
        writeFileSync(join(root, 'app/styles/btn.css'), `
            .btn-native {
                color: red;
            }

            .btn-unused {
                color: blue;
            }
        `)
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        const result = await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @import "./styles/btn.css";

            .card {
                display: grid;
            }

            .unused {
                display: block;
            }
        `)
        await extractor.insert(join(root, 'app/page.html'), '<div class="card btn-native"></div>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect(result.dependencies).toEqual([
            join(root, 'app/globals.css'),
            join(root, 'app/styles/btn.css')
        ])
        expect(css).toContain('.card')
        expect(css).toContain('.btn-native')
        expect(css).not.toContain('.unused')
        expect(css).not.toContain('.btn-unused')
        expect(css).not.toContain('@import "./styles/btn.css"')
    })

    it('preserves native CSS when a Master CSS import root opts out of shaking', async () => {
        const root = createFixture()
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @master no-shake;

            .card {
                display: grid;
            }

            .unused {
                display: block;
            }
        `)
        await extractor.insert(join(root, 'app/page.html'), '<div class="card"></div>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect([...extractor.nativeClassNames]).toEqual([])
        expect([...extractor.usedNativeClasses]).toEqual([])
        expect(css).toContain('.card')
        expect(css).toContain('.unused')
        expect(css).not.toContain('@master no-shake')
    })

    it('removes imported master shake directives without making dependencies independent roots', async () => {
        const root = createFixture()
        mkdirSync(join(root, 'app/styles'), { recursive: true })
        writeFileSync(join(root, 'app/styles/btn.css'), `
            @master shake;

            .btn-native {
                color: red;
            }

            .btn-unused {
                color: blue;
            }
        `)
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @master no-shake;
            @import "./styles/btn.css";
        `)
        await extractor.insert(join(root, 'app/page.html'), '<div class="btn-native"></div>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect([...extractor.nativeClassNames]).toEqual([])
        expect(css).toContain('.btn-native')
        expect(css).toContain('.btn-unused')
        expect(css).not.toContain('@master shake')
        expect(css).not.toContain('@master no-shake')
    })

    it('can emit shaken native CSS without generated Master CSS', async () => {
        const root = createFixture()
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @master shake;

            .card {
                display: grid;
            }
        `)
        await extractor.insert(join(root, 'app/page.html'), '<div class="card block"></div>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root,
            includeGeneratedCSS: false
        })

        expect(css).toContain('.card')
        expect(css).not.toContain('.block{display:block}')
    })

    it('returns empty CSS when generated output is disabled without style sources', async () => {
        const root = createFixture()
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()
        await extractor.insert(join(root, 'app/page.html'), '<div class="block"></div>')

        const css = await createExtractedCSS({
            extractor,
            includeGeneratedCSS: false
        })

        expect(css).toBe('')
    })
})
