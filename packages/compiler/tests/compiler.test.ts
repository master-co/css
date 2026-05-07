import { describe, expect, it } from 'vitest'
import { UtilityType } from '@master/css'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileCSS, compileCSSFile } from '../src'

function process(css: string, classes?: string[]) {
    return compileCSS(css, { classes }).css
}

describe.concurrent('@master/css-compiler', () => {
    it('generates variables, components, utilities, at tokens, selector tokens, screens, modes, and animations', () => {
        const result = compileCSS(`
            @master {
                root-size: 16;
                base-unit: 4;
                default-mode: light;
                mode-trigger: media;
                scope: #app;

                --color-primary: #123;
                --color-base: #fff;
                --color-ring: #e5e7eb;
                --radius-card: 12;
                --spacing-card: 24;
                --screen-md: 768;

                @at motion-safe @media (prefers-reduced-motion: no-preference);
                @at supports-backdrop @supports (backdrop-filter: blur(0));
                @selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                    --color-base: #000;
                }
            }

            @master components {
                .btn {
                    @compose "ai:center jc:center px:1rem py:.5rem bg:primary r:card";
                    display: inline-flex;
                }

                .card {
                    @compose "p:card bg:base r:card content-auto @fade-in|1s@motion-safe";
                    border: 1px solid var(--color-ring);
                }

                .card::before {
                    @compose "{content:'';abs;inset:0}";
                }
            }

            @master animations {
                fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(.5rem);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }

            @master utilities {
                .content-auto {
                    content-visibility: auto;
                    contain-intrinsic-size: auto 32rem;
                }
            }
        `, { classes: ['btn', 'card', 'block@md', 'w:10::scrollbar', 'bg:base@dark', 'backdrop-filter:blur(16)@supports-backdrop'] })

        expect(result.css).toContain('@layer base,theme,preset,components,utilities;')
        expect(result.css).toContain('#app .btn{border-radius:0.75rem}')
        expect(result.css).toContain('#app .btn{padding-left:1rem;padding-right:1rem}')
        expect(result.css).toContain('#app .btn{padding-top:0.5rem;padding-bottom:0.5rem}')
        expect(result.css).toContain('#app .btn{align-items:center}')
        expect(result.css).toContain('#app .btn{background-color:var(--color-primary)}')
        expect(result.css).toContain('#app .btn{justify-content:center}')
        expect(result.css).toContain('#app .btn{display:inline-flex}')
        expect(result.css).toContain('#app .card{content-visibility:auto;contain-intrinsic-size:auto 32rem}')
        expect(result.css).toContain('#app .card:before{content:\'\'')
        expect(result.css).toContain('@media (width>=48rem){#app .block\\@md{display:block}}')
        expect(result.css).toContain('#app .w\\:10\\:\\:scrollbar::-webkit-scrollbar')
        expect(result.css).toContain('@media (prefers-reduced-motion:no-preference)')
        expect(result.css).toContain('@supports (backdrop-filter:blur(0))')
        expect(result.css).toContain('@media (prefers-color-scheme:dark){:root{--color-base:rgb(0 0 0)}}')
        expect(result.css).toContain('@keyframes fade-in')
        expect(result.warnings).toEqual([])
    })

    it('compiles CSS directives into a reusable config result', () => {
        const result = compileCSS(`
            @master {
                root-size: 10;
                base-unit: 8;
                mode-trigger: class;

                --color-primary: #123;
                --screen-md: 768;

                @at motion-safe @media (prefers-reduced-motion: no-preference);
                @selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                }
            }

            @master components {
                .btn {
                    @compose "bg:primary block@dark";
                    display: inline-flex;
                }
            }

            @master utilities {
                .content-auto {
                    content-visibility: auto;
                }
            }
        `)

        expect(result.config).toMatchObject({
            rootSize: 10,
            baseUnit: 8,
            modeTrigger: 'class',
            variables: [
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#123'
                },
                {
                    namespace: 'screen',
                    key: 'md',
                    value: 768
                },
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#456',
                    mode: 'dark'
                }
            ],
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            'background-color': 'var(--color-primary)'
                        }
                    },
                    {
                        selector: '.dark &',
                        declarations: {
                            display: 'block'
                        }
                    },
                    {
                        selector: '&',
                        declarations: {
                            display: 'inline-flex'
                        }
                    }
                ]
            },
            utilities: [
                {
                    name: 'content-auto',
                    type: UtilityType.Static,
                    declarations: {
                        'content-visibility': 'auto'
                    }
                }
            ],
            atTokens: {
                'motion-safe': 'media(prefers-reduced-motion:no-preference)'
            },
            selectorTokens: {
                '::scrollbar': '::-webkit-scrollbar'
            }
        })
        expect(result.componentNames).toEqual(['btn'])
        expect(result.config.modes).toBeUndefined()
        expect(result.generatedCSS).toBe('')
        expect(result.css).toBe('')
    })

    it('keeps light and dark as core defaults and auto-registers custom modes', () => {
        const result = compileCSS(`
            @master {
                mode-trigger: class;

                --color-primary: #123;

                dark {
                    --color-primary: #456;
                }

                chrisma {
                    --color-primary: #ff0;
                }
            }
        `, { classes: ['bg:primary@dark', 'bg:primary@chrisma'] })

        expect(result.config.modes).toEqual(['chrisma'])
        expect(result.css).toContain('.dark .bg\\:primary\\@dark{background-color:rgb(68 85 102)}')
        expect(result.css).toContain('.chrisma .bg\\:primary\\@chrisma{background-color:rgb(255 255 0)}')
    })

    it('supports important flags in @master root', () => {
        const importantResult = compileCSS(`
            @master {
                important;
            }
        `, { classes: ['block'] })

        const bangImportantResult = compileCSS(`
            @master {
                !important;
            }
        `, { classes: ['block'] })

        expect(importantResult.config.important).toBe(true)
        expect(importantResult.css).toContain('.block{display:block!important}')
        expect(bangImportantResult.config.important).toBe(true)
        expect(bangImportantResult.css).toContain('.block{display:block!important}')

        expect(() => process(`
            @master {
                important: false;
            }
        `)).toThrow('Use "important;" or "!important;" to enable important output')
    })

    it('supports @master components as an organizational section', () => {
        const css = process(`
            @master {
                --color-primary: #123;
            }

            @master components {
                .btn {
                    @compose "block bg:primary";
                }
            }
        `, ['btn'])

        expect(css).toContain('.btn{display:block}')
        expect(css).toContain('.btn{background-color:rgb(17 34 51)}')
    })

    it('keeps native selector names when resolving composed component selectors', () => {
        const result = compileCSS(`
            @master components {
                .code-line-add {
                    @compose "content:'+'!:not(:only-child):before";
                }
            }
        `, { classes: ['code-line-add'] })

        expect(result.config.components?.['code-line-add']?.[0].selector).toBe('&:not(:only-child):before')
        expect(result.css).toContain(".code-line-add:not(:only-child):before{content:'+'!important}")
    })

    it('expands repeated component definitions in declaration order', () => {
        const result = compileCSS(`
            @master components {
                .btn {
                    @compose "inline-flex";
                    display: inline-flex;
                    color: red;
                }

                .btn {
                    @compose "block";
                    display: block;
                    font-size: 1rem;
                }
            }
        `, { classes: ['btn'] })

        expect(result.config.components?.btn).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'inline-flex'
                }
            },
            {
                selector: '&',
                declarations: {
                    display: 'inline-flex',
                    color: 'red'
                }
            },
            {
                selector: '&',
                declarations: {
                    display: 'block'
                }
            },
            {
                selector: '&',
                declarations: {
                    display: 'block',
                    'font-size': '1rem'
                }
            }
        ])
        expect(result.css).toContain('.btn{display:inline-flex;color:red}')
        expect(result.css).toContain('.btn{display:block;font-size:1rem}')
    })

    it('merges repeated static utility definitions by name', () => {
        const result = compileCSS(`
            @master utilities {
                .content-auto {
                    content-visibility: auto;
                    contain-intrinsic-size: auto 16rem;
                }

                .content-auto {
                    contain-intrinsic-size: auto 32rem;
                    display: block;
                }
            }
        `, { classes: ['content-auto'] })

        expect(result.config.utilities).toEqual([
            {
                name: 'content-auto',
                type: UtilityType.Static,
                declarations: {
                    'content-visibility': 'auto',
                    'contain-intrinsic-size': 'auto 32rem',
                    display: 'block'
                }
            }
        ])
        expect(result.css).toContain('.content-auto{content-visibility:auto;contain-intrinsic-size:auto 32rem;display:block}')
    })

    it('supports nested at-rules in component and utility definitions', () => {
        const result = compileCSS(`
            @master components {
                .btn {
                    display: block;
                }

                @media print {
                    .btn {
                        display: none;
                    }

                    @supports (display: grid) {
                        .btn {
                            display: grid;
                        }
                    }
                }

                @container card (width >= 42rem) {
                    .btn:hover {
                        opacity: .5;
                    }
                }

                @starting-style {
                    .btn {
                        opacity: 0;
                    }
                }

                .btn {
                    display: flex;
                }
            }

            @master utilities {
                .print-hidden {
                    visibility: visible;
                }

                @media print {
                    .print-hidden {
                        visibility: hidden;
                    }
                }

                .print-hidden {
                    visibility: collapse;
                }
            }
        `, { classes: ['btn', 'print-hidden'] })

        expect(result.config.components?.btn).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'block'
                }
            },
            {
                selector: '&',
                atRules: ['@media print'],
                declarations: {
                    display: 'none'
                }
            },
            {
                selector: '&',
                atRules: ['@media print', '@supports (display:grid)'],
                declarations: {
                    display: 'grid'
                }
            },
            {
                selector: '&:hover',
                atRules: ['@container card (width>=42rem)'],
                declarations: {
                    opacity: '.5'
                }
            },
            {
                selector: '&',
                atRules: ['@starting-style'],
                declarations: {
                    opacity: '0'
                }
            },
            {
                selector: '&',
                declarations: {
                    display: 'flex'
                }
            }
        ])
        expect(result.config.utilities).toEqual([
            {
                name: 'print-hidden',
                type: UtilityType.Static,
                rules: [
                    {
                        declarations: {
                            visibility: 'visible'
                        }
                    },
                    {
                        atRules: ['@media print'],
                        declarations: {
                            visibility: 'hidden'
                        }
                    },
                    {
                        declarations: {
                            visibility: 'collapse'
                        }
                    }
                ]
            }
        ])
        const blockIndex = result.css.indexOf('.btn{display:block}')
        const printIndex = result.css.indexOf('@media print{.btn{display:none}}')
        const flexIndex = result.css.indexOf('.btn{display:flex}')
        expect(blockIndex).toBeGreaterThan(-1)
        expect(printIndex).toBeGreaterThan(blockIndex)
        expect(flexIndex).toBeGreaterThan(printIndex)
        expect(result.css).toContain('@media print{@supports (display:grid){.btn{display:grid}}}')
        expect(result.css).toContain('@container card (width>=42rem){.btn:hover{opacity:.5}}')
        expect(result.css).toContain('@starting-style{.btn{opacity:0}}')
        const visibleIndex = result.css.indexOf('.print-hidden{visibility:visible}')
        const hiddenIndex = result.css.indexOf('@media print{.print-hidden{visibility:hidden}}')
        const collapseIndex = result.css.indexOf('.print-hidden{visibility:collapse}')
        expect(visibleIndex).toBeGreaterThan(-1)
        expect(hiddenIndex).toBeGreaterThan(visibleIndex)
        expect(collapseIndex).toBeGreaterThan(hiddenIndex)
    })

    it('generates theme variables used by raw component and utility declarations', () => {
        const result = compileCSS(`
            @master {
                dark {
                    --color-primary: #000;
                    --color-accent: #f0f;
                }

                light {
                    --color-primary: #ff0;
                    --color-accent: #0ff;
                }
            }

            @master animations {
                fade {
                    to {
                        background: var(--color-accent);
                    }
                }
            }

            @master components {
                .btn {
                    background: var(--color-primary, transparent);
                    animation: fade 1s;
                }
            }

            @master utilities {
                .surface {
                    background: var(--color-primary);
                }
            }
        `, { classes: ['btn', 'surface'] })

        expect(result.css).toContain('@layer theme')
        expect(result.css).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(result.css).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(result.css).toContain('@media (prefers-color-scheme:light){:root{--color-accent:rgb(0 255 255)}}')
        expect(result.css).toContain('@media (prefers-color-scheme:dark){:root{--color-accent:rgb(255 0 255)}}')
        expect(result.css).toContain('.btn{background:var(--color-primary, transparent);animation:1s fade}')
        expect(result.css).toContain('.surface{background:var(--color-primary)}')
        expect(result.css).toContain('@keyframes fade{to{background:var(--color-accent)}}')
    })

    it('uses the last definition for repeated root config, variables, tokens, and animations', () => {
        const result = compileCSS(`
            @master {
                root-size: 16;
                root-size: 10;
                base-unit: 4;
                base-unit: 8;
                default-mode: light;
                default-mode: dark;
                mode-trigger: media;
                mode-trigger: class;
                scope: .shell;
                scope: #app;

                --color-primary: #111;
                --color-primary: #222;
                --screen-md: 640;
                --screen-md: 768;

                @at motion-safe @media (hover: hover);
                @at motion-safe @media (prefers-reduced-motion: no-preference);
                @selector :interactive :hover;
                @selector :interactive :focus-visible;

                dark {
                    --color-primary: #333;
                    --color-primary: #444;
                }
            }

            @master animations {
                fade {
                    from {
                        opacity: 0;
                    }
                }

                fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `)

        expect(result.config).toMatchObject({
            rootSize: 10,
            baseUnit: 8,
            defaultMode: 'dark',
            modeTrigger: 'class',
            scope: '#app',
            variables: [
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#222'
                },
                {
                    namespace: 'screen',
                    key: 'md',
                    value: 768
                },
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#444',
                    mode: 'dark'
                }
            ],
            atTokens: {
                'motion-safe': 'media(prefers-reduced-motion:no-preference)'
            },
            selectorTokens: {
                ':interactive': ':focus-visible'
            },
            animations: {
                fade: {
                    to: {
                        opacity: '1'
                    }
                }
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

                @master components {
                    .btn {
                        font-size: 1rem;
                        display: inline-flex;
                    }
                }
            `)
            writeFileSync(entry, `
                @import "@master/normal.css";
                @import "./styles/button.css";

                .page {
                    color: red;
                }

                @master components {
                    .btn {
                        display: block;
                    }
                }
            `)

            const result = compileCSSFile(entry, { classes: ['btn'] })

            expect(result.dependencies).toEqual([entry, button])
            expect(result.config.components?.btn).toEqual([
                {
                    selector: '&',
                    declarations: {
                        'font-size': '1rem',
                        display: 'block'
                    }
                }
            ])
            expect(result.css).toContain('@import "@master/normal.css";')
            expect(result.css).toContain('box-sizing: border-box')
            expect(result.css).toContain('color: red')
            expect(result.css).toContain('.btn{font-size:1rem;display:block}')
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

    it('supports shorthand animation blocks in @master animations', () => {
        const css = process(`
            @master animations {
                fade {
                    50% {
                        opacity: .5;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes reveal {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }
            }
        `, ['@fade|1s', '@reveal|1s'])

        expect(css).toContain('@keyframes fade')
        expect(css).toContain('50%{opacity:.5}')
        expect(css).toContain('@keyframes reveal')
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

    it('warns when component selectors are placed in @master root', () => {
        const result = compileCSS(`
            @master {
                .btn {
                    @compose "block";
                    display: inline-flex;
                }
            }
        `)

        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain('Component definitions must be placed in @master components')
        expect(result.config.components).toBeUndefined()
    })

    it('rejects @keyframes in @master root', () => {
        expect(() => process(`
            @master {
                @keyframes fade {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }
            }
        `)).toThrow('@keyframes is only allowed in @master animations')
    })

    it('rejects @compose outside component definitions', () => {
        expect(() => process(`
            .btn {
                @compose "block";
            }
        `)).toThrow('@compose is only allowed in @master components')

        expect(() => process(`
            @master utilities {
                .content-auto {
                    @compose "block";
                }
            }
        `)).toThrow('@compose is only allowed in @master components')

        expect(process(`
            @master components {
                @media print {
                    .btn {
                        @compose "hidden";
                    }
                }
            }
        `, ['btn'])).toContain('@media print{.btn{display:none}}')
    })

    it('rejects invalid @at and @selector names and conflicts', () => {
        expect(() => process(`
            @master {
                @at @motion-safe @media (prefers-reduced-motion: no-preference);
            }
        `)).toThrow('@at names must not start with "@"')

        expect(() => process(`
            @master {
                @at :headings :is(h1, h2, h3);
            }
        `)).toThrow('@at names cannot be selector tokens')

        expect(() => process(`
            @master {
                @selector headings :is(h1, h2, h3);
            }
        `)).toThrow('@selector names must start with ":" or "::"')

        expect(() => process(`
            @master {
                @at dark @media (prefers-color-scheme: dark);
            }
        `)).toThrow('@at "dark" conflicts with mode "dark"')

        expect(() => process(`
            @master {
                @at md @media (width >= 48rem);
            }
        `)).toThrow('@at "md" conflicts with screen variable "--screen-md"')

        expect(() => process(`
            @master {
                md {
                    --color-primary: #ff0;
                }
            }
        `)).toThrow('Mode "md" conflicts with screen variable "--screen-md"')
    })

    it('rejects @at and @selector outside @master', () => {
        expect(() => process(`
            @at motion-safe @media (prefers-reduced-motion: no-preference);
        `)).toThrow('@at is only allowed in @master')

        expect(() => process(`
            @selector :headings :is(h1, h2, h3);
        `)).toThrow('@selector is only allowed in @master')
    })
})
