import { describe, expect, test } from 'vitest'
import { createCSS } from '@master/css-engine'
import { compileCSSPlan } from '../src'
import defaultPlan from '@master/css-preset/default-plan'

describe.concurrent('CSS-first lowering for migrated core tests', () => {
    test('lowers theme variables, modes, static components, utilities, and variants into one plan', () => {
        const { plan, warnings } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme {
                --color-primary: #000;
                --spacing-card: 16;
            }

            @theme dark {
                --color-primary: #fff;
            }

            @custom-variant :interactive {
                &:is(:hover,:focus-visible) {
                    @slot;
                }
            }

            @custom-variant @print {
                @media print {
                    @slot;
                }
            }

            @components {
                btn {
                    display: inline-flex;
                    color: var(--color-primary);

                    @variant @print {
                        display: none;
                    }

                    &:disabled>span {
                        display: block;
                    }
                }
            }

            @utilities {
                content-auto {
                    content-visibility: auto;
                }
            }
        `, {
            basePlan: defaultPlan
        })

        expect(warnings).toEqual([])
        expect(plan.settings).toMatchObject({
            modeTrigger: 'class',
            modes: ['light', 'dark']
        })
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'spacing-card',
            namespace: 'spacing',
            type: 'number',
            value: 16
        }))
        expect(plan.variants?.find((variant) => variant.token === ':interactive')?.branches[0].selectorNodes)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ type: 'pseudo-class', value: 'is' })
            ]))
        expect(plan.atRules?.print).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'string', value: 'print' })]
        })
        expect(plan.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'components')).toBe(true)
        expect(plan.utilities?.some((utility) => utility.name === 'content-auto' && utility.layer === 'utilities')).toBe(true)

        const css = createCSS(plan)
        css.add('btn', 'btn:interactive', 'content-auto', 'm:card')
        expect(css.themeLayer.text).toContain(':root{--color-primary:#000;--spacing-card:16}')
        expect(css.themeLayer.text).toContain('.dark{--color-primary:#fff}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex;color:var(--color-primary)}')
        expect(css.componentsLayer.text).toContain('@media print{.btn{display:none}}')
        expect(css.componentsLayer.text).toContain('.btn:disabled>span{display:block}')
        expect(css.componentsLayer.text).toContain('.btn\\:interactive:is(:hover,:focus-visible){display:inline-flex;color:var(--color-primary)}')
        expect(css.utilitiesLayer.text).toContain('.content-auto{content-visibility:auto}')
        expect(css.utilitiesLayer.text).toContain('.m\\:card{margin:calc(var(--spacing-card) / 16 * 1rem)}')
    })

    test('replaces old JS merging intent with ordered CSS imports through basePlan lowering', () => {
        const first = compileCSSPlan(`
            @components {
                a { order: 1; }
                b { order: 2; }
            }
        `, {
            basePlan: defaultPlan
        })
        const second = compileCSSPlan(`
            @components {
                b { order: 22; }
                c { order: 3; }
            }
        `, {
            basePlan: first.plan
        })
        const css = createCSS(second.plan)

        css.add('a', 'b', 'c')
        expect(css.componentsLayer.text).toContain('.a{order:1}')
        expect(css.componentsLayer.text).toContain('.b{order:22}')
        expect(css.componentsLayer.text).toContain('.c{order:3}')
        expect(css.componentsLayer.text).not.toContain('.b{order:2}')
    })

    test('lowers managed animations and removes them when no class references remain', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --color-primary: #ff0;

                @keyframes fade {
                    to {
                        background: var(--color-primary);
                    }
                }
            }

            @components {
                btn {
                    animation: fade 1s;
                }
            }
        `, {
            basePlan: defaultPlan
        })
        const css = createCSS(plan)

        expect(plan.animations?.fade).toEqual({
            to: {
                background: 'var(--color-primary)'
            }
        })
        css.add('btn')
        expect(css.themeLayer.text).toContain(':root{--color-primary:#ff0}')
        expect(css.animationsNonLayer.text).toContain('@keyframes fade{to{background:var(--color-primary)}}')
        css.remove('btn')
        expect(css.themeLayer.text).toBe('')
        expect(css.animationsNonLayer.text).toBe('')
    })

    test('lowers class mode defaults without the old JS Config API', () => {
        const base = `
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme light {
                --color-invert: #000;
            }

            @theme dark {
                --color-invert: #fff;
            }
        `

        const lightDefault = createCSS(compileCSSPlan(`
            @settings {
                default-mode: light;
            }

            ${base}
        `, { basePlan: defaultPlan }).plan).add('bg:invert')
        expect(lightDefault.themeLayer.text).toContain('.light,:root{--color-invert:#000}')
        expect(lightDefault.themeLayer.text).toContain('.dark{--color-invert:#fff}')

        const noDefault = createCSS(compileCSSPlan(`
            @settings {
                default-mode: none;
            }

            ${base}
        `, { basePlan: defaultPlan }).plan).add('bg:invert')
        expect(noDefault.themeLayer.text).toContain('.light{--color-invert:#000}')
        expect(noDefault.themeLayer.text).not.toContain('.light,:root{--color-invert')
    })

    test('lowers color variables, mode values, aliases, and alpha references', () => {
        const { plan } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark chrisma;
            }

            @theme {
                --color-black: #000000;
                --color-primary: #000000;
                --color-alias: $color-primary;
            }

            @theme light {
                --color-primary: hsl(0 0% 58.82%);
            }

            @theme dark {
                --color-primary: hsl(0 0% 100%);
            }

            @theme chrisma {
                --color-primary: $color-black/.5;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan).add('bg:primary', 'bg:primary/.5', 'bg:alias')

        expect(css.themeLayer.text).toContain(':root{--color-primary:#000;--color-black:#000;--color-alias:var(--color-primary)}')
        expect(css.themeLayer.text).toContain('.light{--color-primary:#969696}')
        expect(css.themeLayer.text).toContain('.dark{--color-primary:#fff}')
        expect(css.themeLayer.text).toContain('.chrisma{--color-primary:color-mix(in oklab,var(--color-black) 50%,transparent)}')
        expect(css.utilitiesLayer.text).toContain('.bg\\:primary{background-color:var(--color-primary)}')
        expect(css.utilitiesLayer.text).toContain('.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}')
        expect(css.utilitiesLayer.text).toContain('.bg\\:alias{background-color:var(--color-alias)}')
    })

    test('resolves utility-owned theme namespaces before lowering composed definitions', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --background-stripe: 0 / 7.5px 7.5px linear-gradient(red, blue);
                --box-shadow-panel: 0 1px 2px #000;
                --spacing-card: 24;
                --leading-body: 1.7;
                --color-line-brand: #abcdef;
                --color-brand: #123456;
                --color-primary: #123456;
            }

            @defaults {
                demo {
                    @compose "bg:stripe";
                }
            }
        `, { basePlan: defaultPlan })

        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'background-stripe',
            namespace: 'background',
            key: 'stripe'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'box-shadow-panel',
            namespace: 'box-shadow',
            key: 'panel'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'spacing-card',
            namespace: 'spacing',
            key: 'card'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'leading-body',
            namespace: 'leading',
            key: 'body'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-line-brand',
            namespace: 'color-line',
            key: 'brand'
        }))

        const css = createCSS(plan)
        expect(css.create('bg:stripe')?.text).toBe('.bg\\:stripe{background:var(--background-stripe)}')
        expect(css.create('s:panel')?.text).toBe('.s\\:panel{box-shadow:var(--box-shadow-panel)}')
        expect(css.create('p:card')?.text).toBe('.p\\:card{padding:calc(var(--spacing-card) / 16 * 1rem)}')
        expect(css.create('gap:card')?.text).toBe('.gap\\:card{gap:calc(var(--spacing-card) / 16 * 1rem)}')
        expect(css.create('m:card')?.text).toBe('.m\\:card{margin:calc(var(--spacing-card) / 16 * 1rem)}')
        expect(css.create('leading:body')?.text).toBe('.leading\\:body{line-height:var(--leading-body)}')
        expect(css.create('line-height:body')?.text).toBe('.line-height\\:body{line-height:var(--leading-body)}')
        expect(css.create('b:brand')?.text).toBe('.b\\:brand{border-color:var(--color-line-brand)}')
        expect(css.create('bg:brand')?.text).toBe('.bg\\:brand{background-color:var(--color-brand)}')
        expect(css.create('bg:primary')?.text).toBe('.bg\\:primary{background-color:var(--color-primary)}')
        expect(css.create('shadow:sm')?.text).toBe('.shadow\\:sm{box-shadow:var(--shadow-sm)}')

        css.add('demo')
        expect(css.defaultsLayer.text).toContain('.demo{background:var(--background-stripe)}')
        expect(css.themeLayer.text).toContain('--background-stripe:0 / 7.5px 7.5px linear-gradient(red, blue)')
    })

    test('executes CSS-first number variables and value functions through engine semantics', () => {
        const { plan } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme {
                --spacing-x1: 16;
                --width-11x: 60;
                --leading-x1: 16;
            }

            @theme light {
                --spacing-x1: 48;
                --leading-x1: 48;
            }

            @theme dark {
                --spacing-x1: 32;
                --leading-x1: 32;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        expect(css.create('m:x1')?.text).toBe('.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}')
        expect(css.create('m:$(spacing-x1)')?.text).toBe('.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}')
        expect(css.create('line-height:x1')?.text).toBe('.line-height\\:x1{line-height:var(--leading-x1)}')
        expect(css.create('w:-11x')?.text).toBe('.w\\:-11x{width:calc(var(--width-11x) / 16 * -1rem)}')
        expect(css.create('w:calc(-2+$(spacing-x1))')?.text).toBe('.w\\:calc\\(-2\\+\\$\\(spacing-x1\\)\\){width:calc(-0.125rem + var(--spacing-x1) / 16 * 1rem)}')

        css.add('m:x1', 'm:-x1', 'line-height:x1')
        expect(css.themeLayer.text).toContain(':root{')
        expect(css.themeLayer.text).toContain('--spacing-x1:16')
        expect(css.themeLayer.text).not.toContain('---spacing-x1')
        expect(css.themeLayer.text).toContain('--leading-x1:16')
        expect(css.themeLayer.text).toContain('.light{--spacing-x1:48;--leading-x1:48}')
        expect(css.themeLayer.text).toContain('.dark{--spacing-x1:32;--leading-x1:32}')
    })

    test('executes CSS-first unitful numeric variables without double conversion', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --spacing-card: 1.5rem;
                --radius-card: 8px;
                --breakpoint-card: 48rem;
                --container-panel: 512px;
                --shadow-card: 1rem;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'spacing-card',
            type: 'number',
            value: '1.5rem',
            numeric: { value: 1.5, unit: 'rem' }
        }))
        expect(plan.variables?.find((variable) => variable.name === 'shadow-card')).toMatchObject({
            type: 'string',
            value: '1rem'
        })
        expect(plan.breakpointAtRules?.card).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ value: 48, unit: 'rem' })]
        })
        expect(plan.containerAtRules?.panel).toMatchObject({
            id: 'container',
            nodes: [expect.objectContaining({ value: 32, unit: 'rem' })]
        })
        expect(css.create('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
        expect(css.create('m:-card')?.text).toBe('.m\\:-card{margin:calc(var(--spacing-card) * -1)}')
        expect(css.create('r:card')?.text).toBe('.r\\:card{border-radius:var(--radius-card)}')
        expect(css.create('block@card')?.text).toContain('@media (width>=48rem)')
    })

    test('lowers inline theme variables without emitting their own theme rules', () => {
        const { plan } = compileCSSPlan(`
            @theme inline {
                --color-primary: #123;
                --spacing-card: 16;
                --color-brand: $color-primary;
            }

            @theme {
                --color-regular: #456;
                --color-inline-regular: $color-regular;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        css.add('bg:primary', 'fg:brand', 'm:card', 'fg:inline-regular')
        expect(css.utilitiesLayer.text).toContain('.bg\\:primary{background-color:#123}')
        expect(css.utilitiesLayer.text).toContain('.fg\\:brand{color:#123}')
        expect(css.utilitiesLayer.text).toContain('.m\\:card{margin:1rem}')
        expect(css.utilitiesLayer.text).toContain('.fg\\:inline-regular{color:var(--color-inline-regular)}')
        expect(css.themeLayer.text).toContain(':root{--color-inline-regular:var(--color-regular);--color-regular:#456}')
        expect(css.themeLayer.text).not.toContain('--color-primary:#123')
        expect(css.themeLayer.text).not.toContain('--spacing-card:16')
    })

    test('lowers static theme variables and keyframes into initial resources', () => {
        const { plan } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme static {
                --color-primary: #123;

                @keyframes fade {
                    to {
                        opacity: 1;
                    }
                }
            }

            @theme dark static {
                --color-primary: #456;
            }

            @theme static light {
                --color-secondary: #789;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-primary',
            static: true,
            value: '#123',
            modes: {
                dark: {
                    type: 'string',
                    value: '#456'
                }
            }
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-secondary',
            static: true,
            modes: {
                light: {
                    type: 'string',
                    value: '#789'
                }
            }
        }))
        expect(plan.animationOptions?.fade).toEqual({ static: true })
        expect(css.text).toContain('@layer theme{')
        expect(css.text).toContain(':root{--color-primary:#123}')
        expect(css.text).toContain('.dark{--color-primary:#456}')
        expect(css.text).toContain('.light,:root{--color-secondary:#789}')
        expect(css.text).toContain('@keyframes fade{to{opacity:1}}')
    })

    test('rejects invalid static theme modifier combinations', () => {
        expect(() => compileCSSPlan(`
            @theme inline static {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme inline and static cannot be combined')

        expect(() => compileCSSPlan(`
            @theme static inline {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme inline and static cannot be combined')

        expect(() => compileCSSPlan(`
            @theme static static {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme static modifier cannot be repeated')

        expect(() => compileCSSPlan(`
            @theme dark light static {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme mode must be a single token')

        expect(() => compileCSSPlan(`
            @theme static dark {
                @keyframes fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `, { basePlan: defaultPlan })).toThrow('@theme keyframes cannot be mode-specific or inline')
    })

    test('rejects mode-specific inline theme variables in CSS source', () => {
        expect(() => compileCSSPlan(`
            @theme dark inline {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme inline cannot be mode-specific')

        expect(() => compileCSSPlan(`
            @theme inline dark {
                --color-primary: #123;
            }
        `, { basePlan: defaultPlan })).toThrow('@theme inline cannot be mode-specific')
    })

    test('rejects mode-specific and inline managed keyframes in theme blocks', () => {
        expect(() => compileCSSPlan(`
            @theme dark {
                @keyframes fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `, { basePlan: defaultPlan })).toThrow('@theme keyframes cannot be mode-specific or inline')

        expect(() => compileCSSPlan(`
            @theme inline {
                @keyframes fade {
                    to {
                        opacity: 1;
                    }
                }
            }
        `, { basePlan: defaultPlan })).toThrow('@theme keyframes cannot be mode-specific or inline')
    })

    test('normalizes CSS color functions and preserves alpha alias dependencies through CSS-first lowering', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --color-rgb: rgb(0 128 255);
                --color-hsl-modern: hsl(210 100% 50%);
                --color-hsl-legacy: hsl(210, 100%, 50%);
                --color-hwb: hwb(210 30% 20%);
                --color-lab: lab(50% 40 -30);
                --color-lch: lch(50% 60 200);
                --color-oklab-demo: oklab(0.5 0.1 -0.05);
                --color-oklch-primary: oklch(0.5 0.15 240);
                --color-display-p3: color(display-p3 0.2 0.4 0.8);
                --color-color-srgb: color(srgb 0.2 0.4 0.8);
                --color-color-rec2020: color(rec2020 0.2 0.4 0.8);
                --color-soft: $color-oklch-primary/.3;
                --color-mix-demo: color-mix(in oklch, red, blue);
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        css.add(
            'bg:rgb',
            'bg:hsl-modern',
            'bg:hsl-legacy',
            'bg:hwb',
            'bg:lab',
            'bg:lch',
            'bg:oklab-demo',
            'bg:display-p3',
            'bg:color-srgb',
            'bg:color-rec2020',
            'bg:soft',
            'bg:mix-demo'
        )
        expect(css.themeLayer.text).toContain('--color-rgb:#0080ff')
        expect(css.themeLayer.text).toContain('--color-hsl-modern:#0080ff')
        expect(css.themeLayer.text).toContain('--color-hsl-legacy:#0080ff')
        expect(css.themeLayer.text).toContain('--color-hwb:#4d8ccc')
        expect(css.themeLayer.text).toContain('--color-lab:lab(50% 40 -30)')
        expect(css.themeLayer.text).toContain('--color-lch:lch(50% 60 200)')
        expect(css.themeLayer.text).toContain('--color-oklab-demo:oklab(50% .1 -.05)')
        expect(css.themeLayer.text).toContain('--color-display-p3:color(display-p3 .2 .4 .8)')
        expect(css.themeLayer.text).toContain('--color-color-srgb:color(srgb .2 .4 .8)')
        expect(css.themeLayer.text).toContain('--color-color-rec2020:color(rec2020 .2 .4 .8)')
        expect(css.themeLayer.text).toContain('--color-soft:color-mix(in oklab,var(--color-oklch-primary) 30%,transparent)')
        expect(css.themeLayer.text).toContain('--color-oklch-primary:oklch(50% .15 240)')
        expect(css.themeLayer.text).toContain('--color-mix-demo:oklch(')
        expect(css.utilitiesLayer.text).toContain('.bg\\:soft{background-color:var(--color-soft)}')
    })
})
