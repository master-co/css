import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCSSDirectiveAtRuleReference } from 'shared/css-directives'
import { compileCSS, compileCSSFile } from '../src'

function process(css: string, classes?: string[]) {
    return compileCSS(css, { classes }).css
}

describe.concurrent('@master/css-compiler', () => {
    it('compiles @master config directives into a CSS directive result', () => {
        const result = compileCSS(`
            @master {
                root-size: 10;
                base-unit: 8;
                default-mode: dark;
                mode-trigger: class;
                scope: #app;
                important;

                --color-primary: #123;
                --screen-md: 768;

                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
                @custom-selector ::scrollbar ::-webkit-scrollbar;

                @mode dark {
                    --color-primary: #456;
                }

                @mode chrisma {
                    --color-primary: #ff0;
                }

                @keyframes fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
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
                selector: '&'
            },
            {
                type: 'compose',
                order: 2,
                className: 'bg:primary',
                selector: '&'
            },
            {
                type: 'native',
                order: 3,
                selector: '&',
                declarations: {
                    display: 'flex'
                }
            },
            {
                type: 'native',
                order: 4,
                selector: '&',
                atRules: [createCSSDirectiveAtRuleReference('dark')],
                declarations: {
                    color: '#fff'
                }
            },
            {
                type: 'native',
                order: 5,
                selector: '&',
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
                atRules: [createCSSDirectiveAtRuleReference('md')]
            }
        ])
    })

    it('records static utility definitions under @layer general', () => {
        const result = compileCSS(`
            @master {
                @layer general {
                    .content-auto {
                        content-visibility: auto;

                        @at print {
                            display: none;
                        }
                    }
                }
            }
        `)

        expect(result.config.utilities).toEqual([
            {
                name: 'content-auto',
                type: 'static',
                layer: 'general',
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
    })

    it('records static utility definitions without normalizing core default values', () => {
        const result = compileCSS(`
            @master {
                @layer general {
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
            }
        `)

        expect(result.config.utilities).toEqual([
            {
                name: 'square',
                type: 'static',
                layer: 'general',
                declarations: {
                    'aspect-ratio': '1/1'
                }
            },
            {
                name: 'video',
                type: 'static',
                layer: 'general',
                declarations: {
                    'aspect-ratio': '16/9'
                }
            },
            {
                name: 'rounded',
                type: 'static',
                layer: 'general',
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

            @master {
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

                @master {
                    .btn {
                        font-size: 1rem;
                    }
                }
            `)
            writeFileSync(entry, `
                @import "@master/css/base.css";
                @import "./styles/button.css";

                @master {
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
                    declarations: {
                        'font-size': '1rem'
                    }
                },
                {
                    type: 'native',
                    order: 2,
                    selector: '&',
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
        expect(() => process(`
            @master {
                dark {
                    --color-primary: #456;
                }
            }
        `)).toThrow('Use @mode dark { ... } for mode-specific variables')

        expect(() => process(`
            .btn {
                @compose "block";
            }
        `)).toThrow('@compose is only allowed in @master')

        expect(() => process(`
            @master {
                @layer general {
                    .content-auto {
                        @compose "block";
                    }
                }
            }
        `)).toThrow('@compose is only allowed in @master class definitions')

        expect(() => process(`
            @at dark {
                .btn {
                    display: none;
                }
            }
        `)).toThrow('@at is only allowed in @master class definitions')

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
                @layer general {
                    @keyframes fade {
                        from { opacity: 0; }
                    }
                }
            }
        `)).toThrow('@keyframes is only allowed directly in @master')
    })
})
