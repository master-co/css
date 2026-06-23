import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { compileCSSManifest } from '@master/css-compiler'
import CSSScanner from '@master/css-scanner'
import {
    createStyleCSSHostSource,
    createMasterCSSPackageHostSource,
    createExtractedCSS,
    createExtractedCSSResult,
    hasPreserveNativeDirective,
    hasMasterStyleEntrypoint,
    hasLocalStyleDirectives,
    isMasterStyleSource,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    registerStyleCSSSource,
    resolveMasterStyleSource,
    resolveStyleCSSImportGraph,
    replaceStyleCSSImports,
    transformLocalStyleCSS
} from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-stylesheet-'))
    mkdirSync(join(root, 'app'), { recursive: true })
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

    it('detects Master CSS entrypoints and preservation directives separately', () => {
        expect(hasMasterStyleEntrypoint('@import "@master/css";')).toBe(true)
        expect(hasMasterStyleEntrypoint('@master;')).toBe(true)
        expect(hasMasterStyleEntrypoint('@master shake;')).toBe(false)
        expect(hasMasterStyleEntrypoint('@preserve native;')).toBe(false)
        expect(hasMasterStyleEntrypoint('@theme { --color-primary: red; }')).toBe(false)
        expect(hasMasterStyleEntrypoint('@import "./other.css";')).toBe(false)
        expect(isMasterStyleSource('@theme { --color-primary: red; }')).toBe(false)
        expect(isMasterStyleSource('@import "@master/css";')).toBe(true)
        expect(isMasterStyleSource(resolveStyleCSSImportGraph(
            join(createFixture(), 'app/globals.css'),
            '@import "@master/css";',
            undefined,
            { expandMasterCSSPackage: false }
        ).source)).toBe(true)
        expect(isMasterStyleSource('@import "virtual:master-utilities.css";')).toBe(false)
        expect(isMasterStyleSource('@import "master.css";')).toBe(false)
        expect(isMasterStyleSource('@master;')).toBe(true)
        expect(isMasterStyleSource('@master shake;')).toBe(false)
        expect(isMasterStyleSource('@master no-shake;')).toBe(false)
        expect(isMasterStyleSource('@preserve native;')).toBe(false)
        expect(isMasterStyleSource('@import "./other.css";')).toBe(false)
        expect(hasPreserveNativeDirective('@preserve native;\n.card { color: red; }')).toBe(true)
        expect(hasPreserveNativeDirective('@master no-shake;\n.card { color: red; }')).toBe(false)
    })

    it('detects local compose styles without treating them as Master entries', () => {
        expect(hasLocalStyleDirectives('.card { @compose block; }')).toBe(true)
        expect(hasLocalStyleDirectives('.card { @variant @print { color: red; } }')).toBe(true)
        expect(hasLocalStyleDirectives('.card { @dark { color: red; } }')).toBe(true)
        expect(hasLocalStyleDirectives('.card { @slot; }')).toBe(false)
        expect(hasLocalStyleDirectives('.card { color: red; }')).toBe(false)
        expect(isStyleCSSRequest('/project/src/Button.module.css')).toBe(true)
        expect(isStyleCSSRequest('/project/src/Button.vue?vue&type=style&index=0&lang.css')).toBe(true)
        expect(isMasterStyleSource('.card { @compose block; }')).toBe(false)
    })

    it('locally lowers @compose using the provided project context', async () => {
        const { manifest } = compileCSSManifest('@utilities { brand { color: #fff; } }', {
            baseManifest: defaultManifest
        })
        const result = await transformLocalStyleCSS('/project/src/Button.module.css', `
            .button {
                @compose inline-flex brand;
                color: white;
            }
        `, {
            baseManifest: manifest
        })

        expect(result.transformed).toBe(true)
        expect(result.code).toContain('.button{')
        expect(result.code).toContain('display:inline-flex')
        expect(result.code).toContain('color:#fff')
        expect(result.code).not.toContain('@compose')
    })

    it('locally lowers explicit @reference styles without emitting referenced CSS', async () => {
        const root = createFixture()
        const tokenPath = join(root, 'app/tokens.css')
        const modulePath = join(root, 'app/Button.module.css')
        writeFileSync(tokenPath, [
            '@components {',
            '  brand { background-color: #123456; }',
            '}',
            '.referenced-native { color: red; }'
        ].join('\n'))

        const result = await transformLocalStyleCSS(modulePath, `
            @reference "./tokens.css";

            .button {
                @compose brand;
            }
        `, {
            projectDir: root
        })

        expect(result.transformed).toBe(true)
        expect(result.code).toContain('.button{background-color:#123456}')
        expect(result.code).not.toContain('@reference')
        expect(result.code).not.toContain('referenced-native')
        expect(result.dependencies).toContain(modulePath)
        expect(result.dependencies).toContain(tokenPath)
    })

    it('strips reference-only local styles and still reports dependencies', async () => {
        const root = createFixture()
        const tokenPath = join(root, 'app/tokens.css')
        const modulePath = join(root, 'app/Empty.module.css')
        writeFileSync(tokenPath, '@components { brand { display: block; } }')

        const result = await transformLocalStyleCSS(modulePath, '@reference "./tokens.css";', {
            projectDir: root
        })

        expect(result.transformed).toBe(true)
        expect(result.code).toBe('')
        expect(result.dependencies).toContain(modulePath)
        expect(result.dependencies).toContain(tokenPath)
    })

    it('leaves ordinary local CSS unchanged', async () => {
        const source = '.button { color: red; }'
        const result = await transformLocalStyleCSS('/project/src/Button.module.css', source)

        expect(result.transformed).toBe(false)
        expect(result.code).toBe(source)
    })

    it('resolves Master style sources through the stylesheet import graph', () => {
        const root = createFixture()
        const result = resolveMasterStyleSource(
            join(root, 'app/globals.css'),
            '@import "@master/css";',
            root
        )

        expect(result?.source).toContain('@layer base')
        expect(result?.source).not.toContain('@master;')
        expect(result?.dependencies).toContain(join(root, 'app/globals.css'))
        expect(result?.dependencies.filter((dependency) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
        expect(resolveMasterStyleSource(
            join(root, 'app/theme.css'),
            '@theme { --color-primary: red; }',
            root
        )).toBeUndefined()
        expect(resolveMasterStyleSource(
            join(root, 'app/main.ts'),
            '@import "@master/css";',
            root
        )).toBeUndefined()
        expect(resolveMasterStyleSource(
            join(root, 'app/regular.css'),
            '@import "./missing.css";',
            root
        )).toBeUndefined()
        expect(() => resolveMasterStyleSource(
            join(root, 'app/entry.css'),
            '@master;\n@import "./missing.css";',
            root
        )).toThrow('CSS file not found')
    })

    it('derives package host CSS from the package entry graph', async () => {
        const hostSource = await createMasterCSSPackageHostSource(process.cwd(), {
            projectDir: process.cwd()
        })

        expect(hostSource.dependencies.length).toBeGreaterThan(1)
        expect(hostSource.source).toContain('@layer base')
        expect(hostSource.source).toContain('text-rendering: geometricprecision')
        expect(hostSource.source).toContain('--font-family-sans:var(--font-sans, ui-sans-serif)')
        expect(hostSource.source).toContain('--font-family-mono:var(--font-mono, ui-monospace)')
        expect(hostSource.source).not.toContain('@master/css/base.css')
        expect(hostSource.source).not.toContain('virtual:master-utilities.css')
        expect(hostSource.source).not.toContain('@master')
    })

    it('removes top-level master style directives', () => {
        const result = removeMasterStyleDirectives([
            '@source "./page.tsx";',
            '@safelist "card";',
            '@blocklist "debug-*";',
            '@preserve native;',
            '@master;',
            '',
            '@media (min-width: 768px) {',
            '    @preserve native;',
            '}',
            '',
            '.card { color: red; }'
        ].join('\n'))

        expect(hasMasterStyleEntrypoint('@master;\n.card { color: red; }')).toBe(true)
        expect(result.removed).toBe(true)
        expect(result.code).not.toContain('@source')
        expect(result.code).not.toContain('@safelist')
        expect(result.code).not.toContain('@blocklist')
        expect(result.code).not.toContain('@preserve native;\n@master')
        expect(result.code).toContain('@media (min-width: 768px) {\n    @preserve native;\n}')
    })

    it('treats an empty host source as an intentionally handled Master CSS import', () => {
        const result = createStyleCSSHostSource('@import "@master/css";', {
            masterSource: ''
        })

        expect(result).toBe('')
    })

    it('keeps native imports before generated host CSS', () => {
        const masterFirst = createStyleCSSHostSource([
            '@import "@master/css";',
            '@import "@fontsource/fira-mono";',
            '',
            '.card { color: red; }'
        ].join('\n'), {
            masterSource: '#master-css-slot{--slot:0}'
        })
        const masterLast = createStyleCSSHostSource([
            '@import "@fontsource/fira-mono";',
            '@import "@master/css";',
            '',
            '.card { color: red; }'
        ].join('\n'), {
            masterSource: '#master-css-slot{--slot:0}'
        })

        expect(masterFirst).toBe('@import "@fontsource/fira-mono";\n#master-css-slot{--slot:0}')
        expect(masterLast).toBe('@import "@fontsource/fira-mono";\n#master-css-slot{--slot:0}')
    })

    it('preserves native import modifiers before generated host CSS', () => {
        const result = createStyleCSSHostSource([
            '@import url("@fontsource/fira-mono") layer(fonts) screen;',
            '@import "normalize.css" layer(reset);',
            '@import "@master/css";'
        ].join('\n'), {
            masterSource: '#master-css-slot{--slot:0}'
        })

        expect(result).toBe([
            '@import url("@fontsource/fira-mono") layer(fonts) screen;',
            '@import "normalize.css" layer(reset);',
            '#master-css-slot{--slot:0}'
        ].join('\n'))
    })

    it('uses the managed CSS entry config and native CSS sources', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";

            @theme {
                --color-primary: #ff0000;
                --animation-main: scale 1s;
            }

            @keyframes fade {
                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @layer components {
                .btn {
                    display: grid;
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
        await scanner.scan(join(root, 'app/page.tsx'), '<main class="btn block main fg:red"></main>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect(css).toContain('@layer base')
        expect(css).toContain('text-rendering: geometricprecision')
        expect(css).toContain('.main')
        expect(css).not.toContain('.unused')
        expect(css).toContain('--color-primary:red')
        expect(css).toContain('--color-red')
        expect(css).toContain('@keyframes fade')
        expect(css.match(/@keyframes fade/g) || []).toHaveLength(1)
        expect(css).toContain('.btn')
        expect(css).toContain('display: grid')
        expect(css).toContain('.block{display:block}')
        expect(css).toContain('.fg\\:red{color:var(--color-red)}')
        expect(css).not.toContain('@master')
        expect(css).not.toContain('virtual:master-utilities.css')
        expect(css).not.toContain('@master/css')
    })

    it('keeps non-expandable native imports out of generated managed CSS', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), [
            '@import "@master/css";',
            '@import "@fontsource/fira-mono";',
            '',
            '.card {',
            '    color: red;',
            '}'
        ].join('\n'))
        await scanner.scan(join(root, 'app/page.html'), '<div class="card"></div>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect(css).toContain('.card')
        expect(css).not.toContain('@fontsource/fira-mono')
        expect(css).not.toContain('@master/css')
    })

    it('reports emittedGlobals variables and animations emitted by the Master CSS entry', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @theme {
                --animation-main: scale 1s;
                --color-primary: #ff0000;

                @keyframes fade {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide {
                    to {
                        transform: translateX(1rem);
                    }
                }

                @keyframes scale {
                    to {
                        transform: scale(1.1);
                    }
                }
            }

            .main {
                color: var(--color-primary);
                animation-name: fade,slide;
            }

            .main-animated {
                animation: var(--animation-main);
            }
        `)
        await scanner.scan(join(root, 'app/page.tsx'), '<main class="main main-animated"></main>')

        const result = await createExtractedCSSResult({
            scanner,
            styleCSSSources,
            projectDir: root,
            includeGeneratedCSS: false
        })

        expect(result.css).toContain('.main')
        expect(result.css).toContain('--color-primary:red')
        expect(result.css).toContain('@keyframes fade')
        expect(result.emittedGlobals).toEqual({
            variables: {
                'animation-main': 1,
                'color-primary': 1
            },
            animations: {
                fade: 1,
                scale: 1,
                slide: 1
            }
        })
    })

    it('does not preload inline theme tokens', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @theme inline {
                --color-primary: #ff0000;
            }
        `)
        await scanner.scan(join(root, 'app/page.tsx'), '<main class="fg:primary"></main>')

        const result = await createExtractedCSSResult({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect(result.css).toContain('.fg\\:primary{color:red}')
        expect(result.css).not.toContain('--color-primary')
        expect(result.emittedGlobals.variables).toEqual({})
    })

    it('emits static theme tokens and keyframes without class references', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @theme static {
                --color-primary: #ff0000;

                @keyframes static-fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `)

        const result = await createExtractedCSSResult({
            scanner,
            styleCSSSources,
            projectDir: root,
            includeGeneratedCSS: false
        })

        expect(result.css).toContain('@layer theme')
        expect(result.css).toContain('--color-primary:red')
        expect(result.css).toContain('@keyframes static-fade')
        expect(result.emittedGlobals).toEqual({
            variables: {
                'color-primary': 1
            },
            animations: {
                'static-fade': 1
            }
        })
    })

    it('prunes local CSS imports from Master CSS import roots by default', async () => {
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
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        const result = await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @import "./styles/btn.css";

            .card {
                display: grid;
            }

            .unused {
                display: block;
            }
        `)
        await scanner.scan(join(root, 'app/page.html'), '<div class="card btn-native"></div>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect(result.dependencies).toContain(join(root, 'app/globals.css'))
        expect(result.dependencies).toContain(join(root, 'app/styles/btn.css'))
        expect(result.dependencies.filter((dependency: string) => !dependency.startsWith(root)).length).toBeGreaterThan(0)
        expect(css).toContain('.card')
        expect(css).toContain('.btn-native')
        expect(css).not.toContain('.unused')
        expect(css).not.toContain('.btn-unused')
        expect(css).not.toContain('@import "./styles/btn.css"')
    })

    it('preserves native CSS when a Master CSS import root opts out of pruning', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @preserve native;

            .card {
                display: grid;
            }

            .unused {
                display: block;
            }
        `)
        await scanner.scan(join(root, 'app/page.html'), '<div class="card"></div>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect([...scanner.nativeClassNames]).toEqual([])
        expect([...scanner.usedNativeClasses]).toEqual([])
        expect(css).toContain('.card')
        expect(css).toContain('.unused')
        expect(css).not.toContain('@preserve native')
    })

    it('preserves imported native CSS when a root graph opts out of pruning', async () => {
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
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @import "@master/css";
            @preserve native;
            @import "./styles/btn.css";
        `)
        await scanner.scan(join(root, 'app/page.html'), '<div class="btn-native"></div>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root
        })

        expect([...scanner.nativeClassNames]).toEqual([])
        expect(css).toContain('.btn-native')
        expect(css).toContain('.btn-unused')
        expect(css).not.toContain('@preserve native')
    })

    it('can emit pruned native CSS without generated Master CSS', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
            @master;

            .card {
                display: grid;
            }
        `)
        await scanner.scan(join(root, 'app/page.html'), '<div class="card block"></div>')

        const css = await createExtractedCSS({
            scanner,
            styleCSSSources,
            projectDir: root,
            includeGeneratedCSS: false
        })

        expect(css).toContain('.card')
        expect(css).not.toContain('.block{display:block}')
    })

    it('returns empty CSS when generated output is disabled without style sources', async () => {
        const root = createFixture()
        const scanner = new CSSScanner({}, root)
        await scanner.init()
        await scanner.scan(join(root, 'app/page.html'), '<div class="block"></div>')

        const css = await createExtractedCSS({
            scanner,
            includeGeneratedCSS: false
        })

        expect(css).toBe('')
    })
})
