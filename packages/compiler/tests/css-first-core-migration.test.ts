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
            }

            @animations {
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
        expect(css.create('w:-11x')?.text).toBe('.w\\:-11x{width:calc(var(---width-11x) / 16 * 1rem)}')
        expect(css.create('w:calc(-2+$(spacing-x1))')?.text).toBe('.w\\:calc\\(-2\\+\\$\\(spacing-x1\\)\\){width:calc(-0.125rem + var(--spacing-x1) / 16 * 1rem)}')

        css.add('m:x1', 'm:-x1', 'line-height:x1')
        expect(css.themeLayer.text).toContain(':root{')
        expect(css.themeLayer.text).toContain('--spacing-x1:16')
        expect(css.themeLayer.text).toContain('---spacing-x1:-16')
        expect(css.themeLayer.text).toContain('--leading-x1:16')
        expect(css.themeLayer.text).toContain('.light{--spacing-x1:48;--leading-x1:48}')
        expect(css.themeLayer.text).toContain('.dark{--spacing-x1:32;--leading-x1:32}')
    })
})
