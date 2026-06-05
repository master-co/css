import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCSSDirectiveAtRuleReference } from 'shared/css-directives'
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

describe.concurrent('@master/css-compiler', () => {
    it('detects only project CSS entry markers', () => {
        expect(inspectCSS('@master;').hasMasterEntry).toBe(true)
        expect(inspectCSS('@import "@master/css";').hasMasterEntry).toBe(true)
        expect(inspectCSS('@master shake;').hasMasterEntry).toBe(false)
        expect(inspectCSS('@master no-shake;').hasMasterEntry).toBe(false)
        expect(inspectCSS('@import "@master/css/index.css";').hasMasterEntry).toBe(false)
        expect(inspectCSS('@import url("@master/css") layer(master);').hasMasterEntry).toBe(true)
        expect(inspectCSS('@master { --color-primary: #123; }').hasMasterEntry).toBe(false)
    })

    it('compiles @master config directives into a CSS directive result', () => {
        const result = compileCSS(`
            @master {
                root-size: 10;
                base-unit: 8;
                default-mode: dark;
                mode-trigger: class;
                scope: #app;
                important: on;

                --color-primary: #123;
                --screen-md: 768;

                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
                @custom-selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                }

                chrisma {
                    --color-primary: #ff0;
                }
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
                { name: 'screen-md', value: 768 },
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
            @master {
                important: on;
            }
        `).config.important).toBe(true)
        expect(compileCSS(`
            @master {
                important: off;
            }
        `).config.important).toBe(false)
    })

    it('keeps raw variable names for core namespace resolution', () => {
        const result = compileCSS(`
            @master {
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

    it('records component definitions without resolving core utilities', () => {
        const result = compileCSS(`
            @master {
                mode-trigger: class;
                --screen-md: 768;
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
        expect(result.componentDefinitions?.btn).toEqual([
            {
                type: 'compose',
                order: 1,
                className: 'inline-flex',
                selector: '&',
                layer: 'components'
            },
            {
                type: 'compose',
                order: 2,
                className: 'bg:primary',
                selector: '&',
                layer: 'components'
            },
            {
                type: 'native',
                order: 3,
                selector: '&',
                layer: 'components',
                declarations: {
                    display: 'flex'
                }
            },
            {
                type: 'native',
                order: 4,
                selector: '&',
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
                layer: 'components',
                atRules: [createCSSDirectiveAtRuleReference('md')]
            }
        ])
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

        expect(result.componentDefinitions?.btn).toEqual([
            {
                type: 'native',
                order: 1,
                selector: '&:is(:hover,:focus-visible),&.primary:is(:hover,:focus-visible),&.active,&.primary.active',
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

        expect(result.config.utilities).toEqual([
            {
                name: 'content-auto',
                type: 'static',
                layer: 'utilities',
                rules: [
                    {
                        declarations: {
                            'content-visibility': 'auto'
                        }
                    },
                    {
                        atRules: [createCSSDirectiveAtRuleReference('print')],
                        declarations: {
                            display: 'none'
                        }
                    }
                ]
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

        expect(result.config.utilities).toEqual([
            {
                name: 'square',
                type: 'static',
                layer: 'utilities',
                declarations: {
                    'aspect-ratio': '1/1'
                }
            },
            {
                name: 'video',
                type: 'static',
                layer: 'utilities',
                declarations: {
                    'aspect-ratio': '16/9'
                }
            },
            {
                name: 'rounded',
                type: 'static',
                layer: 'utilities',
                declarations: {
                    'border-radius': '1e9em'
                }
            }
        ])
    })

    it('keeps and filters native class rules outside @master', () => {
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

        expect(result.componentDefinitions?.btn).toEqual([
            {
                type: 'compose',
                order: 1,
                className: 'block',
                selector: '&',
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

            @master {
                --color-primary: #123;
            }
        `, { preserveNativeCSS: false })

        expect(result.nativeCSS).toBe('')
        expect(result.css).toBe('')
        expect(result.config.variables).toEqual([
            { name: 'color-primary', value: '#123' }
        ])
    })

    it('ignores standalone extractor directives', () => {
        const result = compileCSS(`
            @master source './src/**/*.tsx';
            @master source exclude './src/**/*.test.tsx';
            @master source force './src/generated.tsx';
            @master class 'btn text:center';
            @master class exclude 'legacy-*';
            @master;
            @master shake;
            @master no-shake;

            .card {
                color: red;
            }
        `, { classes: ['card'] })

        expect(result.css).toContain('.card')
        expect(result.css).not.toContain('@master source')
        expect(result.css).not.toContain('@master class')
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
            @master {
                root-size: 16;
                root-size: 10;
                --color-primary: #111;
                --color-primary: #222;
                @custom-selector :interactive :hover;
                @custom-selector :interactive :focus-visible;
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
            @master {
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
            expect(result.componentDefinitions?.btn).toEqual([
                {
                    type: 'native',
                    order: 1,
                    selector: '&',
                    layer: 'components',
                    declarations: {
                        'font-size': '1rem'
                    }
                },
                {
                    type: 'native',
                    order: 2,
                    selector: '&',
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
            namespace: 'screen',
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
                @master {
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
                namespace: 'screen',
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

    it('warns when regular HTML selectors are placed in @master', () => {
        const warnings: string[] = []
        const result = compileCSS(`
            @master {
                body {
                    margin: 0;
                }

                html {
                    color-scheme: light dark;
                }
            }
        `, { onWarning: (warning) => warnings.push(warning) })

        expect(result.warnings).toHaveLength(2)
        expect(warnings).toEqual(result.warnings)
        expect(result.warnings[0]).toContain('Unsupported @master block "body"')
        expect(result.warnings[1]).toContain('Unsupported @master block "html"')
    })

    it('rejects invalid directive placement and names', () => {
        const legacyModeDirective = '@' + 'mode dark'
        expect(() => process(`
            @master {
                ${legacyModeDirective} {
                    --color-primary: #456;
                }
            }
        `)).toThrow('Legacy mode directives are not supported')

        expect(() => process(`
            .btn {
                @compose "block";
            }
        `)).toThrow('@compose is only allowed inside top-level @layer preset or @layer components class definitions')

        expect(() => process(`
            @master {
                @layer utilities {
                    .content-auto {
                        display: block;
                    }
                }
            }
        `)).toThrow('@layer is not allowed in @master')

        expect(() => process(`
            @layer utilities {
                .content-auto {
                    @compose "block";
                }
            }
        `)).toThrow('@compose is only allowed inside top-level @layer preset or @layer components class definitions')

        expect(() => process(`
            @at dark {
                .btn {
                    display: none;
                }
            }
        `)).toThrow('@at is only allowed inside top-level @layer preset, @layer components, or @layer utilities definitions')

        expect(() => process(`
            @master {
                @custom-at @motion-safe @media (prefers-reduced-motion: no-preference);
            }
        `)).toThrow('@custom-at names must not start with "@"')

        expect(() => process(`
            @master {
                @custom-selector headings :is(h1, h2, h3);
            }
        `)).toThrow('@custom-selector names must start with ":" or "::"')

        expect(() => process(`
            @master {
                @keyframes fade {
                    from { opacity: 0; }
                }
            }
        `)).toThrow('@keyframes is not allowed in @master')

        expect(() => process(`
            @layer utilities {
                @keyframes fade {
                    from { opacity: 0; }
                }
            }
        `)).toThrow('@keyframes is not allowed inside managed @layer blocks')
    })
})
