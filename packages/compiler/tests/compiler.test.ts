import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCSSDirectiveAtRuleReference, CSSDirectiveError } from 'shared/css-directives'
import {
    compileCSS,
    compileCSSConfig,
    compileCSSConfigFile,
    compileCSSFile,
    compileProjectConfig,
    createConfigFromCSSResult,
    findStandaloneMasterDirectiveStatements,
    inspectCSS,
    isMasterCSSPackageStyleFile,
    resolveMasterCSSPackageEntryFile
} from '../src'

const here = dirname(fileURLToPath(import.meta.url))

function process(css: string, classes?: string[]) {
    return compileCSS(css, { classes }).css
}

function stripStyleDefinitionSources(definitions: any[] | undefined) {
    return definitions?.map(({ source: _source, directiveSource: _directiveSource, selectorSource: _selectorSource, ...definition }) => definition)
}

describe.concurrent('@master/css-compiler', () => {
    it('detects only project CSS entry markers', () => {
        expect(inspectCSS('@master;').hasMasterEntry).toBe(true)
        expect(inspectCSS('@import "@master/css";').hasMasterEntry).toBe(true)
        expect(inspectCSS('@master shake;').hasMasterEntry).toBe(false)
        expect(inspectCSS('@master no-shake;').hasMasterEntry).toBe(false)
        expect(inspectCSS('@settings { root-size: 16; }').hasMasterEntry).toBe(false)
        expect(inspectCSS('@source "src/**/*.tsx";').hasMasterEntry).toBe(false)
        expect(inspectCSS('@safelist "dialog-open";').hasMasterEntry).toBe(false)
        expect(inspectCSS('@blocklist "debug-*";').hasMasterEntry).toBe(false)
        expect(inspectCSS('@preserve native;').hasMasterEntry).toBe(false)
        expect(inspectCSS('@import "@master/css/index.css";').hasMasterEntry).toBe(false)
        expect(inspectCSS('@import url("@master/css") layer(master);').hasMasterEntry).toBe(true)
        expect(inspectCSS('@theme { --color-primary: #123; }').hasMasterEntry).toBe(false)
    })

    it('compiles CSS config directives into a CSS directive result', () => {
        const result = compileCSS(`
            @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
            @custom-selector ::scrollbar ::-webkit-scrollbar;

            @settings {
                root-size: 10;
                base-unit: 8;
                default-mode: dark;
                mode-trigger: class;
                scope: #app;
                important: on;
            }

            @theme {
                --color-primary: #123;
                --breakpoint-md: 768;
            }

            @theme dark {
                --color-primary: #456;
            }

            @theme chrisma {
                --color-primary: #ff0;
            }

            @keyframes fade {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `)

        expect(result.config).toMatchObject({
            rootSize: 10,
            baseUnit: 8,
            defaultMode: 'dark',
            modeTrigger: 'class',
            scope: '#app',
            important: true,
            variables: [
                { name: 'color-primary', value: '#123' },
                { name: 'breakpoint-md', value: 768 },
                { name: 'color-primary', value: '#456', mode: 'dark' },
                { name: 'color-primary', value: '#ff0', mode: 'chrisma' }
            ],
            modes: ['dark', 'chrisma'],
            atTokens: {
                'motion-safe': 'media(prefers-reduced-motion:no-preference)'
            },
            selectorTokens: {
                '::scrollbar': '::-webkit-scrollbar'
            },
            animations: {
                fade: {
                    from: { opacity: '0' },
                    to: { opacity: '1' }
                }
            }
        })
        expect(result.css).toBe('')
        expect(result.generatedCSS).toBe('')
        expect(result.warnings).toEqual([])
    })

    it('converts important on and off declarations into booleans', () => {
        expect(compileCSS(`
            @settings {
                important: on;
            }
        `).config.important).toBe(true)
        expect(compileCSS(`
            @settings {
                important: off;
            }
        `).config.important).toBe(false)
    })

    it('keeps default-mode none as the disabled default mode', () => {
        const source = `
            @settings {
                default-mode: none;
            }
        `

        expect(compileCSS(source).config.defaultMode).toBe('none')
        expect(compileCSSConfig(source).config.defaultMode).toBe('none')
    })

    it('rejects default-mode false', () => {
        expect(() => compileCSS(`
            @settings {
                default-mode: false;
            }
        `)).toThrow('default-mode must be a mode name or none')
    })

    it('keeps raw variable names for core namespace resolution', () => {
        const result = compileCSS(`
            @theme {
                --color-line-lightest: #eee;
                --color-text-strong: #111;
                --color-blue-50: #00f;
            }
        `)

        expect(result.config.variables).toEqual([
            { name: 'color-line-lightest', value: '#eee' },
            { name: 'color-text-strong', value: '#111' },
            { name: 'color-blue-50', value: '#00f' }
        ])
    })

    it('records style definitions without resolving core utilities', () => {
        const result = compileCSS(`
            @settings {
                mode-trigger: class;
            }

            @theme {
                --breakpoint-md: 768;
            }

            @layer components {
                .btn {
                    @compose "inline-flex bg:primary";
                    display: flex;

                    @at dark {
                        color: white;
                    }

                    @media print {
                        opacity: .5;
                    }
                }

                @at md {
                    .btn:hover {
                        @compose "underline";
                    }
                }
            }
        `)

        expect(result.classNames).toEqual(['btn'])
        expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
            {
                type: 'compose',
                order: 1,
                className: 'inline-flex',
                selector: '&',
                name: 'btn',
                layer: 'components'
            },
            {
                type: 'compose',
                order: 2,
                className: 'bg:primary',
                selector: '&',
                name: 'btn',
                layer: 'components'
            },
            {
                type: 'native',
                order: 3,
                selector: '&',
                name: 'btn',
                layer: 'components',
                declarations: {
                    display: 'flex'
                }
            },
            {
                type: 'native',
                order: 4,
                selector: '&',
                name: 'btn',
                layer: 'components',
                atRules: [createCSSDirectiveAtRuleReference('dark')],
                declarations: {
                    color: '#fff'
                }
            },
            {
                type: 'native',
                order: 5,
                selector: '&',
                name: 'btn',
                layer: 'components',
                atRules: ['@media print'],
                declarations: {
                    opacity: '.5'
                }
            },
            {
                type: 'compose',
                order: 6,
                className: 'underline',
                selector: '&:hover',
                name: 'btn',
                layer: 'components',
                atRules: [createCSSDirectiveAtRuleReference('md')]
            }
        ])
    })

    it('records @compose directive, class token, and selector source ranges', () => {
        const source = '@layer components { .btn { @compose "inline-flex bg:primary"; } }'
        const result = compileCSS(source)
        const definitions = result.styleDefinitions?.filter((definition) => definition.type === 'compose')

        expect(definitions?.map((definition) => source.slice(definition.source?.range.start, definition.source?.range.end))).toEqual([
            'inline-flex',
            'bg:primary'
        ])
        expect(source.slice(definitions?.[0].directiveSource?.range.start, definitions?.[0].directiveSource?.range.end)).toBe('@compose "inline-flex bg:primary";')
        expect(source.slice(definitions?.[0].selectorSource?.range.start, definitions?.[0].selectorSource?.range.end)).toBe('.btn')
    })

    it('requires @compose class lists to be quoted', () => {
        expect(() => compileCSS('@layer components { .btn { @compose block; } }')).toThrow()
    })

    it('combines nested component selector lists from parsed selectors', () => {
        const result = compileCSS(`
            @layer components {
                .btn,
                .btn.primary {
                    &:is(:hover, :focus-visible),
                    &.active {
                        color: red;
                    }
                }
            }
        `)

        expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
            {
                type: 'native',
                order: 1,
                selector: '&:is(:hover,:focus-visible),&.primary:is(:hover,:focus-visible),&.active,&.primary.active',
                name: 'btn',
                layer: 'components',
                declarations: {
                    color: 'red'
                }
            }
        ])
    })

    it('records static utility definitions under @layer utilities', () => {
        const result = compileCSS(`
            @layer utilities {
                .content-auto {
                    content-visibility: auto;

                    @at print {
                        display: none;
                    }
                }
            }
        `)

        expect(result.config.utilities).toBeUndefined()
        expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
            {
                type: 'native',
                name: 'content-auto',
                order: 1,
                selector: '&',
                layer: 'utilities',
                declarations: {
                    'content-visibility': 'auto'
                }
            },
            {
                type: 'native',
                name: 'content-auto',
                order: 2,
                selector: '&',
                layer: 'utilities',
                atRules: [createCSSDirectiveAtRuleReference('print')],
                declarations: {
                    display: 'none'
                }
            }
        ])
        expect(result.css).toBe('')
    })

    it('records static utility definitions without normalizing core default values', () => {
        const result = compileCSS(`
            @layer utilities {
                .square {
                    aspect-ratio: 1/1;
                }

                .video {
                    aspect-ratio: 16/9;
                }

                .rounded {
                    border-radius: 1e9em;
                }
            }
        `)

        expect(result.config.utilities).toBeUndefined()
        expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
            {
                type: 'native',
                order: 1,
                name: 'square',
                selector: '&',
                layer: 'utilities',
                declarations: {
                    'aspect-ratio': '1/1'
                }
            },
            {
                type: 'native',
                order: 2,
                name: 'video',
                selector: '&',
                layer: 'utilities',
                declarations: {
                    'aspect-ratio': '16/9'
                }
            },
            {
                type: 'native',
                order: 3,
                name: 'rounded',
                selector: '&',
                layer: 'utilities',
                declarations: {
                    'border-radius': '1e9em'
                }
            }
        ])
    })

    it('finalizes @compose in utility definitions and detects cycles', () => {
        const result = compileCSSConfig(`
            @theme {
                --color-primary: #123;
            }

            @layer utilities {
                .btn-base {
                    @compose "inline-flex";
                    align-items: center;
                }

                .btn {
                    @compose "btn-base bg:primary";
                }
            }
        `)

        expect(result.config.utilities?.filter((utility) => utility.name === 'btn-base' || utility.name === 'btn')).toMatchObject([
            {
                name: 'btn-base',
                layer: 'utilities',
                declarations: {
                    display: 'inline-flex',
                    'align-items': 'center'
                }
            },
            {
                name: 'btn',
                layer: 'utilities',
                declarations: {
                    display: 'inline-flex',
                    'align-items': 'center',
                    'background-color': 'var(--color-primary)'
                }
            }
        ])

        const cycleSource = `
            @layer utilities {
                .a { @compose "b"; }
                .b { @compose "a"; }
            }
        `

        try {
            compileCSSConfig(cycleSource)
            throw new Error('Expected circular @compose dependency error.')
        } catch (error) {
            expect(error).toBeInstanceOf(CSSDirectiveError)
            if (!(error instanceof CSSDirectiveError)) throw error
            expect(error.code).toBe('circular-compose-dependency')
            expect(error.message).toBe('Circular @compose dependency detected: a -> b -> a')
            expect(error.related?.map((related) => cycleSource.slice(related.source?.range.start, related.source?.range.end))).toEqual(['b', 'a'])
        }
    })

    it('lowers native @compose and @at after semantic config resolution', () => {
        const result = compileCSSConfig(`
            @settings {
                mode-trigger: class;
            }

            @theme {
                --color-primary: #123;
            }

            @theme dark {
                --color-primary: #456;
            }

            .card {
                @compose "block bg:primary";

                @at dark {
                    @compose "fg:primary";
                }
            }
        `)

        expect(result.nativeCSS).toBe('')
        expect(result.generatedCSS).toBe('.card{display:block;background-color:var(--color-primary)}.dark .card{color:var(--color-primary)}')
        expect(result.css).toBe(result.generatedCSS)
    })

    it('keeps and filters native class rules outside Master CSS directives', () => {
        const result = compileCSS(`
            body {
                margin: 0;
            }

            .native,
            .unused:hover {
                color: red;
            }

            @media (width >= 48rem) {
                .card .title {
                    color: blue;
                }

                .unused-card {
                    color: pink;
                }
            }

            @layer components {
                .btn {
                    @compose "block";
                }
            }
        `, { classes: ['btn', 'native', 'title'] })

        expect(result.nativeClassNames).toEqual([
            'native',
            'unused',
            'card',
            'title',
            'unused-card'
        ])
        expect(result.css).toContain('body')
        expect(result.nativeCSS).toContain('.native')
        expect(result.nativeCSS).not.toContain('.unused:hover')
        expect(result.css).toContain('.card .title')
        expect(result.css).not.toContain('.unused-card')
        expect(result.css).not.toContain('.btn{display:block}')
    })

    it('only consumes managed layers and keyframes at the stylesheet top level', () => {
        const result = compileCSS(`
            @media print {
                @layer components {
                    .native {
                        color: red;
                    }
                }

                @keyframes nested-fade {
                    to {
                        opacity: 1;
                    }
                }
            }

            @layer components {
                .btn {
                    @compose "block";
                }
            }

            @keyframes fade {
                to {
                    opacity: 1;
                }
            }
        `, { classes: ['native'] })

        expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
            {
                type: 'compose',
                order: 1,
                className: 'block',
                selector: '&',
                name: 'btn',
                layer: 'components'
            }
        ])
        expect(result.config.animations).toEqual({
            fade: {
                to: {
                    opacity: '1'
                }
            }
        })
        expect(result.css).toContain('@media print')
        expect(result.css).toContain('@layer components')
        expect(result.css).toContain('.native')
        expect(result.css).toContain('@keyframes nested-fade')
        expect(result.css).not.toContain('@keyframes fade{')
        expect(result.css).not.toContain('.btn')
    })

    it('can remove native CSS for CSS config loading', () => {
        const result = compileCSS(`
            .native {
                color: red;
            }

            @theme {
                --color-primary: #123;
            }
        `, { preserveNativeCSS: false })

        expect(result.nativeCSS).toBe('')
        expect(result.css).toBe('')
        expect(result.config.variables).toEqual([
            { name: 'color-primary', value: '#123' }
        ])
    })

    it('collects and removes standalone extraction policy directives', () => {
        const result = compileCSS(`
            @source './src/**/*.tsx';
            @source not './src/**/*.test.tsx';
            @source required './src/generated.tsx';
            @safelist 'btn text:center';
            @blocklist 'legacy-*';
            @preserve native;
            @master;
            @master shake;
            @master no-shake;

            .card {
                color: red;
            }
        `, { classes: ['card'] })

        expect(result.css).toContain('.card')
        expect(result.extractionPolicy.include).toEqual(['./src/**/*.tsx'])
        expect(result.extractionPolicy.exclude).toEqual(['./src/**/*.test.tsx'])
        expect(result.extractionPolicy.required).toEqual(['./src/generated.tsx'])
        expect(result.extractionPolicy.safelist).toEqual(['btn', 'text:center'])
        expect(result.extractionPolicy.blocklist[0]).toBeInstanceOf(RegExp)
        expect((result.extractionPolicy.blocklist[0] as RegExp).test('legacy-card')).toBe(true)
        expect(result.extractionPolicy.preserveNative).toBe(true)
        expect(result.css).not.toContain('@source')
        expect(result.css).not.toContain('@safelist')
        expect(result.css).not.toContain('@blocklist')
        expect(result.css).not.toContain('@preserve')
        expect(result.css).not.toContain('@master;')
        expect(result.css).not.toContain('@master shake')
        expect(result.css).not.toContain('@master no-shake')
    })

    it('finds only top-level standalone master directives', () => {
        const statements = findStandaloneMasterDirectiveStatements(`
            @master;

            @media print {
                @master shake;
            }
        `)

        expect(statements.map(({ name }) => name)).toEqual([''])
    })

    it('uses the last definition for repeated config values', () => {
        const result = compileCSS(`
            @custom-selector :interactive :hover;
            @custom-selector :interactive :focus-visible;

            @settings {
                root-size: 16;
                root-size: 10;
            }

            @theme {
                --color-primary: #111;
                --color-primary: #222;
            }
        `)

        expect(result.config).toMatchObject({
            rootSize: 10,
            variables: [
                { name: 'color-primary', value: '#222' }
            ],
            selectorTokens: {
                ':interactive': ':focus-visible'
            }
        })
    })

    it('converts compiler results into semantic config at the compiler boundary', () => {
        const source = `
            @theme {
                --color-primary: #123;
            }

            @layer components {
                .btn {
                    color: var(--color-primary);
                }
            }
            `
        const directiveResult = compileCSS(source)
        const resultFromSource = compileCSSConfig(source)
        const resultFromCompilerResult = createConfigFromCSSResult(directiveResult)

        expect(resultFromSource.config).toEqual(resultFromCompilerResult.config)
        expect(resultFromSource.config.variables).toContainEqual({
            namespace: 'color',
            key: 'primary',
            value: '#123'
        })
        expect(resultFromSource.config.utilities).toContainEqual(expect.objectContaining({
            name: 'btn'
        }))
    })

    it('compiles CSS files with local relative imports', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-compiler-'))
        try {
            mkdirSync(join(root, 'styles'))
            const entry = join(root, 'master.css')
            const button = join(root, 'styles/button.css')
            writeFileSync(button, `
                .reset {
                    box-sizing: border-box;
                }

                @layer components {
                    .btn {
                        font-size: 1rem;
                    }
                }
            `)
            writeFileSync(entry, `
                @import "@master/css/base.css";
                @import url("./styles/button.css");

                @layer components {
                    .btn {
                        display: block;
                    }
                }
            `)

            const result = compileCSSFile(entry, {
                preserveNativeCSS: false
            })

            expect(result.dependencies).toEqual([entry, button])
            expect(result.config.utilities).toBeUndefined()
            expect(stripStyleDefinitionSources(result.styleDefinitions)).toEqual([
                {
                    type: 'native',
                    order: 1,
                    selector: '&',
                    name: 'btn',
                    layer: 'components',
                    declarations: {
                        'font-size': '1rem'
                    }
                },
                {
                    type: 'native',
                    order: 2,
                    selector: '&',
                    name: 'btn',
                    layer: 'components',
                    declarations: {
                        display: 'block'
                    }
                }
            ])
            expect(result.css).toBe('')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('compiles package CSS files without treating them as project entries', () => {
        const coreIndex = resolve(here, '../../core/src/index.css')
        const coreTheme = resolve(here, '../../core/src/theme.css')
        const source = readFileSync(coreIndex, 'utf-8')

        expect(inspectCSS(source).hasMasterEntry).toBe(false)

        const result = compileCSSConfigFile(coreIndex)

        expect(result.dependencies).toContain(coreTheme)
        expect(result.config.variables).toContainEqual({
            namespace: 'breakpoint',
            key: 'sm',
            value: 834
        })
    })

    it('detects package CSS files across workspace symlinks', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-compiler-'))
        try {
            const scope = join(root, 'node_modules/@master')
            mkdirSync(scope, { recursive: true })
            symlinkSync(resolve(here, '../../core'), join(scope, 'css'), 'dir')

            expect(isMasterCSSPackageStyleFile(resolve(here, '../../core/src/theme.css'), root)).toBe(true)
            expect(isMasterCSSPackageStyleFile(join(root, 'node_modules/@master/css/src/theme.css'), root)).toBe(true)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('compiles project CSS entries into a semantic config', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-compiler-'))
        try {
            mkdirSync(join(root, 'styles'))
            const entry = join(root, 'index.css')
            const theme = join(root, 'styles/theme.css')
            writeFileSync(theme, `
                @theme {
                    --color-primary: #123;
                }

                @layer components {
                    .btn {
                        color: var(--color-primary);
                    }
                }
            `)
            writeFileSync(entry, `
                @master;
                @import "./styles/theme.css";
            `)

            const result = compileProjectConfig([entry], { root })

            expect(result.entries).toEqual([entry])
            expect(result.dependencies).toEqual([entry, theme])
            expect(result.config.variables).toContainEqual({
                namespace: 'color',
                key: 'primary',
                value: '#123'
            })
            expect(result.config.utilities).toContainEqual(expect.objectContaining({
                name: 'btn'
            }))
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('resolves @master/css package imports through the package style entry', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-compiler-'))
        try {
            const entry = join(root, 'index.css')
            writeFileSync(entry, '@import "@master/css";')

            const result = compileCSSConfigFile(entry, { root })
            const packageEntry = resolveMasterCSSPackageEntryFile('@master/css', entry, root)

            expect(packageEntry).toBeTruthy()
            expect(result.dependencies).toContain(packageEntry)
            expect(result.config.variables).toContainEqual({
                namespace: 'breakpoint',
                key: 'sm',
                value: 834
            })
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('rejects circular CSS file imports', () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-compiler-'))
        try {
            const entry = join(root, 'master.css')
            const theme = join(root, 'theme.css')
            writeFileSync(entry, '@import "./theme.css";')
            writeFileSync(theme, '@import "./master.css";')

            expect(() => compileCSSFile(entry)).toThrow('Circular CSS import')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('removes non-entry @master blocks without config effects', () => {
        const result = compileCSS(`
            @master {
                root-size: 10;
            }

            .card {
                color: red;
            }
        `, { classes: ['card'] })

        expect(result.config.rootSize).toBeUndefined()
        expect(result.css).toContain('.card')
        expect(result.css).toContain('color: red')
        expect(result.css).not.toContain('@master')
    })

    it('rejects invalid directive placement and names', () => {
        const unsupportedModeAtRule = '@' + 'mode dark'
        expect(() => process(`
            @settings {
                ${unsupportedModeAtRule} {
                    --color-primary: #456;
                }
            }
        `)).toThrow('@settings does not accept @mode')

        expect(() => process(`
            @settings {
                --color-primary: #123;
            }
        `)).toThrow('Unsupported @settings option: --color-primary')

        expect(() => process(`
            @settings {
                dark {
                    --color-primary: #456;
                }
            }
        `)).toThrow('Unsupported @settings selector: dark')

        expect(() => process(`
            @compose "block";
        `)).toThrow('@compose requires a style rule')

        expect(() => process(`
            @settings {
                @layer utilities {
                    .content-auto {
                        display: block;
                    }
                }
            }
        `)).toThrow('@settings does not accept @layer')

        expect(() => process(`
            @theme {
                root-size: 16;
            }
        `)).toThrow('Unsupported @theme declaration: root-size')

        expect(() => process(`
            @theme {
                .card {
                    color: red;
                }
            }
        `)).toThrow('@theme only accepts custom property declarations')

        expect(() => process(`
            @media print {
                @theme {
                    --color-primary: #123;
                }
            }
        `)).toThrow('@theme must be top-level')

        expect(() => process(`
            @media print {
                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
            }
        `)).toThrow('@custom-at must be top-level')

        expect(() => process(`
            @media print {
                @custom-selector :interactive :is(:hover, :focus-visible);
            }
        `)).toThrow('@custom-selector must be top-level')

        expect(() => process(`
            @custom-at @motion-safe @media (prefers-reduced-motion: no-preference);
        `)).toThrow('@custom-at names must not start with "@"')

        expect(() => process(`
            @custom-selector headings :is(h1, h2, h3);
        `)).toThrow('@custom-selector names must start with ":" or "::"')

        expect(() => process(`
            @settings {
                @keyframes fade {
                    from { opacity: 0; }
                }
            }
        `)).toThrow('@settings does not accept @keyframes')

        expect(() => process(`
            @layer utilities {
                @keyframes fade {
                    from { opacity: 0; }
                }
            }
        `)).toThrow('@keyframes is not allowed inside managed @layer blocks')
    })
})
