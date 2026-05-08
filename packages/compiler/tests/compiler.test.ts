import { describe, expect, it } from 'vitest'
import { UtilityType } from '@master/css'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileCSS, compileCSSFile } from '../src'

function process(css: string, classes?: string[]) {
    return compileCSS(css, { classes }).css
}

function getStaticUtility(result: ReturnType<typeof compileCSS>, name: string, layer = 'main') {
    return result.config.utilities?.find((definition) =>
        definition.name === name
        && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer ?? 'general') === layer
    )
}

function getStaticUtilityRules(result: ReturnType<typeof compileCSS>, name: string, layer = 'main') {
    const definition = getStaticUtility(result, name, layer)
    if (!definition) return undefined
    const rules = (definition.rules ?? (definition.declarations ? [{ declarations: definition.declarations }] : [])) as Array<{
        selector?: string
        atRules?: string[]
        declarations: unknown
    }>
    return rules.map((rule) => ({
        selector: rule.selector ?? '&',
        ...(rule.atRules?.length ? { atRules: rule.atRules } : {}),
        declarations: rule.declarations
    }))
}

describe.concurrent('@master/css-compiler', () => {
    it('generates variables,, general, at tokens, selector tokens, screens, modes, and', () => {
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

                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
                @custom-at supports-backdrop @supports (backdrop-filter: blur(0));
                @custom-selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                    --color-base: #000;
                }
            }

            @master {
                .btn {
                    @compose "ai:center jc:center px:1rem py:.5rem bg:primary r:card";
                    display: inline-flex;
                }

                .card {
                    @compose "p:card bg:base r:card content-auto";
                    @at motion-safe {
                        @compose "@fade-in|1s";
                    }
                    border: 1px solid var(--color-ring);
                }

                .card::before {
                    @compose "{content:'';abs;inset:0}";
                }
            }

            @master {
                @keyframes fade-in {
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

            @master {
                @layer general {
                    .content-auto {
                        content-visibility: auto;
                        contain-intrinsic-size: auto 32rem;
                    }
                }
            }
        `, { classes: ['btn', 'card', 'block@md', 'w:10::scrollbar', 'bg:base@dark', 'backdrop-filter:blur(16)@supports-backdrop'] })

        expect(result.css).toContain('@layer base,theme,preset,main,general;')
        expect(result.css).toContain('#app .btn{border-radius:0.75rem;padding-left:1rem;padding-right:1rem;padding-top:0.5rem;padding-bottom:0.5rem;align-items:center;background-color:var(--color-primary);justify-content:center;display:inline-flex}')
        expect(result.css).toContain('#app .card{content-visibility:auto;contain-intrinsic-size:auto 32rem;padding:1.5rem;border-radius:0.75rem;background-color:var(--color-base);border:1px solid var(--color-ring)}')
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

                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
                @custom-selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                }
            }

            @master {
                .btn {
                    @compose "bg:primary";
                    @at dark {
                        @compose "block";
                    }
                    display: inline-flex;
                }
            }

            @master {
                @layer general {
                    .content-auto {
                        content-visibility: auto;
                    }
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
            atTokens: {
                'motion-safe': 'media(prefers-reduced-motion:no-preference)'
            },
            selectorTokens: {
                '::scrollbar': '::-webkit-scrollbar'
            }
        })
        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    'background-color': 'var(--color-primary)',
                    display: 'inline-flex'
                }
            },
            {
                selector: '.dark &',
                declarations: {
                    display: 'block'
                }
            }
        ])
        expect(getStaticUtility(result, 'content-auto', 'general')).toEqual({
            name: 'content-auto',
            type: UtilityType.Static,
            layer: 'general',
            declarations: {
                'content-visibility': 'auto'
            }
        })
        expect(result.classNames).toEqual(['btn'])
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

    it('warns when media mode trigger is used with custom modes', () => {
        const warnings: string[] = []
        const result = compileCSS(`
            @master {
                chrisma {
                    --color-primary: #ff0;
                }
            }
        `, { onWarning: (warning) => warnings.push(warning) })

        expect(result.config.modes).toEqual(['chrisma'])
        expect(result.warnings).toEqual([
            'Custom mode "chrisma" will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.'
        ])
        expect(warnings).toEqual(result.warnings)
    })

    it('does not warn for custom modes when mode trigger is class or host', () => {
        const classResult = compileCSS(`
            @master {
                mode-trigger: class;

                chrisma {
                    --color-primary: #ff0;
                }
            }
        `)
        const hostResult = compileCSS(`
            @master {
                mode-trigger: host;

                chrisma {
                    --color-primary: #ff0;
                }
            }
        `)

        expect(classResult.warnings).toEqual([])
        expect(hostResult.warnings).toEqual([])
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

    it('supports @master as an organizational section', () => {
        const css = process(`
            @master {
                --color-primary: #123;
            }

            @master {
                .btn {
                    @compose "block bg:primary";
                }
            }
        `, ['btn'])

        expect(css).toContain('.btn{display:block;background-color:rgb(17 34 51)}')
    })

    it('keeps native selector names when resolving composed component selectors', () => {
        const result = compileCSS(`
            @master {
                .code-line-add {
                    @compose "content:'+'!:not(:only-child):before";
                }
            }
        `, { classes: ['code-line-add'] })

        expect(getStaticUtilityRules(result, 'code-line-add')?.[0].selector).toBe('&:not(:only-child):before')
        expect(result.css).toContain(".code-line-add:not(:only-child):before{content:'+'!important}")
    })

    it('supports component definitions inside top-level layer blocks', () => {
        const result = compileCSS(`
            @master {
                @layer preset {
                    .prose {
                        :is(p) {
                            @compose "font:md";
                        }
                        color: var(--color-text);
                    }

                    @media print {
                        .prose {
                            display: none;
                        }
                    }
                }
            }
        `, { classes: ['prose'] })

        expect(getStaticUtility(result, 'prose', 'preset')).toMatchObject({ layer: 'preset' })
        expect(getStaticUtilityRules(result, 'prose', 'preset')).toEqual([
            {
                selector: '& :is(p)',
                declarations: {
                    'font-size': '1rem'
                }
            },
            {
                selector: '&',
                declarations: {
                    color: 'var(--color-text)'
                }
            },
            {
                selector: '&',
                atRules: ['@media print'],
                declarations: {
                    display: 'none'
                }
            }
        ])
        expect(result.css).toContain('@layer preset{.prose :is(p){font-size:1rem}.prose{color:var(--color-text)}@media print{.prose{display:none}}}')
        expect(result.css).not.toContain('@layer{@layer preset')
    })

    it('supports nested component layer blocks', () => {
        const result = compileCSS(`
            @master {
                .prose {
                    @layer preset {
                        :is(p) {
                            @compose "font:md";
                        }
                    }
                }
            }
        `, { classes: ['prose'] })

        expect(getStaticUtilityRules(result, 'prose', 'preset')).toEqual([
            {
                selector: '& :is(p)',
                declarations: {
                    'font-size': '1rem'
                }
            }
        ])
        expect(result.css).toContain('@layer preset{.prose :is(p){font-size:1rem}}')
        expect(result.css).not.toContain('@layer{@layer preset')
    })

    it('supports nested selectors in component definitions', () => {
        const result = compileCSS(`
            @master {
                .prose {
                    :is(p) {
                        @compose "font:md";
                    }

                    :is(li) {
                        @compose "font:sm";
                    }

                    > a,
                    code {
                        color: red;
                    }
                }
            }
        `, { classes: ['prose'] })

        expect(getStaticUtilityRules(result, 'prose')).toEqual([
            {
                selector: '& :is(p)',
                declarations: {
                    'font-size': '1rem'
                }
            },
            {
                selector: '& :is(li)',
                declarations: {
                    'font-size': '0.875rem'
                }
            },
            {
                selector: '&>a,& code',
                declarations: {
                    color: 'red'
                }
            }
        ])
        expect(result.css).toContain('.prose :is(p){font-size:1rem}')
        expect(result.css).toContain('.prose :is(li){font-size:0.875rem}')
        expect(result.css).toContain('.prose>a,.prose code{color:red}')
    })

    it('resolves built-in selector tokens in nested component selectors', () => {
        const tokenResult = compileCSS(`
            @master {
                .article {
                    &::scrollbar {
                        width: 1rem;
                    }
                }
            }
        `, { classes: ['article'] })

        const nativeResult = compileCSS(`
            @master {
                .article {
                    &::-webkit-scrollbar {
                        width: 1rem;
                    }
                }
            }
        `, { classes: ['article'] })

        expect(getStaticUtilityRules(tokenResult, 'article')).toEqual([
            {
                selector: '&::-webkit-scrollbar',
                declarations: {
                    width: '1rem'
                }
            }
        ])
        expect(tokenResult.css).toBe(nativeResult.css)
        expect(tokenResult.css).toContain('.article::-webkit-scrollbar{width:1rem}')
    })

    it('supports nested selectors inside component layer and at-rule blocks', () => {
        const result = compileCSS(`
            @master {
                .prose {
                    @layer preset {
                        :is(p) {
                            @compose "font:md";
                        }

                        @media print {
                            :is(li) {
                                display: none;
                            }
                        }
                    }
                }
            }
        `, { classes: ['prose'] })

        expect(getStaticUtilityRules(result, 'prose', 'preset')).toEqual([
            {
                selector: '& :is(p)',
                declarations: {
                    'font-size': '1rem'
                }
            },
            {
                selector: '& :is(li)',
                atRules: ['@media print'],
                declarations: {
                    display: 'none'
                }
            }
        ])
        expect(result.css).toContain('@layer preset{.prose :is(p){font-size:1rem}@media print{.prose :is(li){display:none}}}')
        expect(result.css).not.toContain('@layer{@layer preset')
    })

    it('merges repeated component definitions in declaration order', () => {
        const result = compileCSS(`
            @master {
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

        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    color: 'red',
                    display: 'block',
                    'font-size': '1rem'
                }
            }
        ])
        expect(result.css).toContain('.btn{color:red;display:block;font-size:1rem}')
    })

    it('preserves native declaration and @compose override order while merging', () => {
        const beforeCompose = compileCSS(`
            @master {
                .btn {
                    display: inline-block;
                    @compose "block";
                }
            }
        `, { classes: ['btn'] })
        const afterCompose = compileCSS(`
            @master {
                .btn {
                    @compose "block";
                    display: inline-block;
                }
            }
        `, { classes: ['btn'] })
        const importantBeforeCompose = compileCSS(`
            @master {
                .btn {
                    display: block !important;
                    @compose "inline-flex";
                }
            }
        `, { classes: ['btn'] })

        expect(getStaticUtilityRules(beforeCompose, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'block'
                }
            }
        ])
        expect(beforeCompose.css).toContain('.btn{display:block}')
        expect(getStaticUtilityRules(afterCompose, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'inline-block'
                }
            }
        ])
        expect(afterCompose.css).toContain('.btn{display:inline-block}')
        expect(getStaticUtilityRules(importantBeforeCompose, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'block !important'
                }
            }
        ])
    })

    it('merges composed component general by resolved selector, at-rules, and layer buckets', () => {
        const result = compileCSS(`
            @master {
                mode-trigger: class;
                --screen-sm: 640;
                --screen-md: 768;
            }

            @master {
                .btn {
                    @compose "block font:sm@sm font:md@md bg:green:hover";
                }

                @at sm {
                    .btn {
                        line-height: 1.4;
                    }
                }

                .btn:hover {
                    color: white;
                }
            }
        `, { classes: ['btn'] })

        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'block'
                }
            },
            {
                selector: '&',
                atRules: ['@media (width>=40rem)'],
                declarations: {
                    'font-size': '0.875rem',
                    'line-height': '1.4'
                }
            },
            {
                selector: '&',
                atRules: ['@media (width>=48rem)'],
                declarations: {
                    'font-size': '1rem'
                }
            },
            {
                selector: '&:hover',
                declarations: {
                    'background-color': 'var(--color-green)',
                    color: '#fff'
                }
            }
        ])
        expect(result.css).toContain('@media (width>=40rem){.btn{font-size:0.875rem;line-height:1.4}}')
        expect(result.css).toContain('.btn:hover{background-color:var(--color-green);color:#fff}')
    })

    it('orders matching base component buckets before conditional buckets', () => {
        const result = compileCSS(`
            @master {
                @media (width >= 52.125rem) {
                    .prose :is(h1, h2, h3) {
                        @compose "{mt:16x;scroll-mt:100}";
                    }
                }

                .prose :is(h1, h2, h3) {
                    @compose "{mt:8x;scroll-mt:72}";
                }
            }
        `, { classes: ['prose'] })

        expect(getStaticUtilityRules(result, 'prose')).toEqual([
            {
                selector: '& :is(h1,h2,h3)',
                declarations: {
                    'margin-top': '2rem',
                    'scroll-margin-top': '4.5rem'
                }
            },
            {
                selector: '& :is(h1,h2,h3)',
                atRules: ['@media (width>=52.125rem)'],
                declarations: {
                    'margin-top': '4rem',
                    'scroll-margin-top': '6.25rem'
                }
            }
        ])
        const baseIndex = result.css.indexOf('.prose :is(h1,h2,h3){margin-top:2rem;scroll-margin-top:4.5rem}')
        const mediaIndex = result.css.indexOf('@media (width>=52.125rem){.prose :is(h1,h2,h3){margin-top:4rem;scroll-margin-top:6.25rem}}')
        expect(baseIndex).toBeGreaterThan(-1)
        expect(mediaIndex).toBeGreaterThan(baseIndex)
    })

    it('orders matching conditional component buckets by comparable at-rule ranges', () => {
        const result = compileCSS(`
            @master {
                --screen-sm: 640;
                --screen-md: 768;
            }

            @master {
                @at md {
                    .btn {
                        font-size: 1rem;
                    }
                }

                @at sm {
                    .btn {
                        font-size: .875rem;
                    }
                }
            }
        `, { classes: ['btn'] })

        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                atRules: ['@media (width>=40rem)'],
                declarations: {
                    'font-size': '.875rem'
                }
            },
            {
                selector: '&',
                atRules: ['@media (width>=48rem)'],
                declarations: {
                    'font-size': '1rem'
                }
            }
        ])
        const smIndex = result.css.indexOf('@media (width>=40rem){.btn{font-size:.875rem}}')
        const mdIndex = result.css.indexOf('@media (width>=48rem){.btn{font-size:1rem}}')
        expect(smIndex).toBeGreaterThan(-1)
        expect(mdIndex).toBeGreaterThan(smIndex)
    })

    it('merges composed utility rule selectors into component selector buckets', () => {
        const result = compileCSS(`
            @master {
                .btn {
                    @compose "focus-ring";
                }

                .btn:focus-visible {
                    outline-offset: 2px;
                }
            }
        `, {
            classes: ['btn'],
            config: {
                utilities: [
                    {
                        name: 'focus-ring',
                        type: UtilityType.Static,
                        layer: 'general',
                        rules: [
                            {
                                selector: '&:focus-visible',
                                declarations: {
                                    outline: '2px solid currentColor'
                                }
                            }
                        ]
                    }
                ]
            }
        })

        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&:focus-visible',
                declarations: {
                    outline: '2px solid currentColor',
                    'outline-offset': '2px'
                }
            }
        ])
        expect(result.css).toContain('.btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}')
    })

    it('merges repeated static utility definitions by name', () => {
        const result = compileCSS(`
            @master {
                @layer general {
                    .content-auto {
                        content-visibility: auto;
                        contain-intrinsic-size: auto 16rem;
                    }

                    .content-auto {
                        contain-intrinsic-size: auto 32rem;
                        display: block;
                    }
                }
            }
        `, { classes: ['content-auto'] })

        expect(result.config.utilities).toEqual([
            {
                name: 'content-auto',
                type: UtilityType.Static,
                layer: 'general',
                declarations: {
                    'content-visibility': 'auto',
                    'contain-intrinsic-size': 'auto 32rem',
                    display: 'block'
                }
            }
        ])
        expect(result.css).toContain('.content-auto{content-visibility:auto;contain-intrinsic-size:auto 32rem;display:block}')
    })

    it('supports nested at-rules and @at tokens in component and utility definitions', () => {
        const result = compileCSS(`
            @master {
                mode-trigger: class;
                --screen-md: 768;
                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
            }

            @master {
                .btn {
                    display: block;

                    @at dark {
                        color: white;

                        &:hover {
                            opacity: .8;
                        }
                    }
                }

                @at md {
                    .btn {
                        @compose "inline-flex";
                    }
                }

                @media print {
                    @at motion-safe {
                        .btn {
                            display: none;
                        }
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

            @master {
                @layer general {
                    .print-hidden {
                        visibility: visible;

                        @at dark {
                            opacity: .5;
                        }
                    }

                    @at print {
                        .print-hidden {
                            visibility: hidden;
                        }
                    }

                    .print-hidden {
                        visibility: collapse;
                    }
                }
            }
        `, { classes: ['btn', 'print-hidden'] })

        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'flex'
                }
            },
            {
                selector: '.dark &',
                declarations: {
                    color: '#fff'
                }
            },
            {
                selector: '.dark &:hover',
                declarations: {
                    opacity: '.8'
                }
            },
            {
                selector: '&',
                atRules: ['@media (width>=48rem)'],
                declarations: {
                    display: 'inline-flex'
                }
            },
            {
                selector: '&',
                atRules: ['@media print', '@media (prefers-reduced-motion:no-preference)'],
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
        ])
        expect(getStaticUtility(result, 'print-hidden', 'general')).toEqual({
            name: 'print-hidden',
            type: UtilityType.Static,
            layer: 'general',
            rules: [
                {
                    declarations: {
                        visibility: 'visible'
                    }
                },
                {
                    selector: '.dark &',
                    declarations: {
                        opacity: '.5'
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
        })
        const flexIndex = result.css.indexOf('.btn{display:flex}')
        const printIndex = result.css.indexOf('@media print{@media (prefers-reduced-motion:no-preference){.btn{display:none}}}')
        expect(flexIndex).toBeGreaterThan(-1)
        expect(printIndex).toBeGreaterThan(flexIndex)
        expect(result.css).toContain('.dark .btn{color:#fff}')
        expect(result.css).toContain('.dark .btn:hover{opacity:.8}')
        expect(result.css).toContain('@media (width>=48rem){.btn{display:inline-flex}}')
        expect(result.css).toContain('@media print{@supports (display:grid){.btn{display:grid}}}')
        expect(result.css).toContain('@container card (width>=42rem){.btn:hover{opacity:.5}}')
        expect(result.css).toContain('@starting-style{.btn{opacity:0}}')
        const visibleIndex = result.css.indexOf('.print-hidden{visibility:visible}')
        const hiddenIndex = result.css.indexOf('@media print{.print-hidden{visibility:hidden}}')
        const collapseIndex = result.css.indexOf('.print-hidden{visibility:collapse}')
        expect(visibleIndex).toBeGreaterThan(-1)
        expect(result.css).toContain('.dark .print-hidden{opacity:.5}')
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

            @master {
                @keyframes fade {
                    to {
                        background: var(--color-accent);
                    }
                }
            }

            @master {
                .btn {
                    background: var(--color-primary, transparent);
                    animation: fade 1s;
                }
            }

            @master {
                @layer general {
                    .surface {
                        background: var(--color-primary);
                    }
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

    it('uses the last definition for repeated root config, variables, tokens, and', () => {
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

                @custom-at motion-safe @media (hover: hover);
                @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
                @custom-selector :interactive :hover;
                @custom-selector :interactive :focus-visible;

                dark {
                    --color-primary: #333;
                    --color-primary: #444;
                }
            }

            @master {
                @keyframes fade {
                    from {
                        opacity: 0;
                    }
                }

                @keyframes fade {
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

                @master {
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

                @master {
                    .btn {
                        display: block;
                    }
                }
            `)

            const result = compileCSSFile(entry, { classes: ['btn'] })

            expect(result.dependencies).toEqual([entry, button])
            expect(getStaticUtilityRules(result, 'btn')).toEqual([
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

    it('supports native @keyframes blocks in @master', () => {
        const css = process(`
            @master {
                @keyframes reveal {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }
            }
        `, ['@reveal|1s'])

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

    it('supports main style selectors directly in @master root', () => {
        const result = compileCSS(`
            @master {
                .btn {
                    @compose "block";
                    display: inline-flex;
                }
            }
        `)

        expect(result.warnings).toEqual([])
        expect(getStaticUtilityRules(result, 'btn')).toEqual([
            {
                selector: '&',
                declarations: {
                    display: 'inline-flex'
                }
            }
        ])
    })

    it('rejects @keyframes inside @layer blocks', () => {
        expect(() => process(`
            @master {
                @layer general {
                    @keyframes fade {
                        from {
                            opacity: 0;
                        }
                    }
                }
            }
        `)).toThrow('@keyframes is only allowed directly in @master')
    })

    it('rejects shorthand animation blocks in @master', () => {
        expect(() => process(`
            @master {
                fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `)).toThrow('Mode "fade" only accepts custom property declarations')
    })

    it('rejects @compose outside component definitions', () => {
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

        expect(process(`
            @master {
                @media print {
                    .btn {
                        @compose "hidden";
                    }
                }
            }
        `, ['btn'])).toContain('@media print{.btn{display:none}}')
    })

    it('rejects @at outside @master and supports @at around class definitions', () => {
        expect(() => process(`
            @at dark {
                .btn {
                    display: none;
                }
            }
        `)).toThrow('@at is only allowed in @master class definitions')

        expect(process(`
            @master {
                @at dark {
                    .btn {
                        display: none;
                    }
                }
            }
        `, ['btn'])).toContain('@media (prefers-color-scheme:dark){.btn{display:none}}')

        expect(process(`
            @master {
                @layer general {
                    @at print {
                        .print-hidden {
                            display: none;
                        }
                    }
                }
            }
        `, ['print-hidden'])).toContain('@media print{.print-hidden{display:none}}')
    })

    it('rejects invalid @custom-at and @custom-selector names and conflicts', () => {
        expect(() => process(`
            @master {
                @custom-at @motion-safe @media (prefers-reduced-motion: no-preference);
            }
        `)).toThrow('@custom-at names must not start with "@"')

        expect(() => process(`
            @master {
                @custom-at :headings :is(h1, h2, h3);
            }
        `)).toThrow('@custom-at names cannot be selector tokens')

        expect(() => process(`
            @master {
                @custom-selector headings :is(h1, h2, h3);
            }
        `)).toThrow('@custom-selector names must start with ":" or "::"')

        expect(() => process(`
            @master {
                @custom-at dark @media (prefers-color-scheme: dark);
            }
        `)).toThrow('@custom-at "dark" conflicts with mode "dark"')

        expect(() => process(`
            @master {
                @custom-at md @media (width >= 48rem);
            }
        `)).toThrow('@custom-at "md" conflicts with screen variable "--screen-md"')

        expect(() => process(`
            @master {
                md {
                    --color-primary: #ff0;
                }
            }
        `)).toThrow('Mode "md" conflicts with screen variable "--screen-md"')
    })

    it('rejects @custom-at and @custom-selector outside @master', () => {
        expect(() => process(`
            @custom-at motion-safe @media (prefers-reduced-motion: no-preference);
        `)).toThrow('@custom-at is only allowed in @master')

        expect(() => process(`
            @custom-selector :headings :is(h1, h2, h3);
        `)).toThrow('@custom-selector is only allowed in @master')
    })
})
