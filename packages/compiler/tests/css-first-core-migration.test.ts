import { describe, expect, test } from 'vitest'
import { createCSS } from '@master/css-engine'
import { compileCSS, compileCSSPlan } from '../src'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import UtilityType from 'shared/utility-type'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

describe.concurrent('CSS-first lowering for migrated core tests', () => {
    test('lowers theme variables, modes, static components, utilities, and variants into one plan', () => {
        const { plan, warnings } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme {
                --color-primary: #000;
                --spacing-card: 1rem;
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
            value: '1rem',
            numeric: { value: 1, unit: 'rem' }
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
        expect(css.themeLayer.text).toContain(':root{--color-primary:#000;--spacing-card:1rem}')
        expect(css.themeLayer.text).toContain('.dark{--color-primary:#fff}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex;color:var(--color-primary)}')
        expect(css.componentsLayer.text).toContain('@media print{.btn{display:none}}')
        expect(css.componentsLayer.text).toContain('.btn:disabled>span{display:block}')
        expect(css.componentsLayer.text).toContain('.btn\\:interactive:is(:hover,:focus-visible){display:inline-flex;color:var(--color-primary)}')
        expect(css.utilitiesLayer.text).toContain('.content-auto{content-visibility:auto}')
        expect(css.utilitiesLayer.text).toContain('.m\\:card{margin:var(--spacing-card)}')
    })

    test('lowers managed enum patterns without replacing static utility precedence', () => {
        const { plan } = compileCSSPlan(`
            @utilities {
                text-<left|right|center> {
                    text-align: --value();
                }

                n-<1|2> {
                    margin: calc(--value() * 1px);
                }

                text-center {
                    text-align: start;
                }
            }

            @components {
                badge-<success|danger> {
                    color: --value();
                }
            }
        `, {
            basePlan: defaultPlan
        })

        expect(plan.utilityBuckets?.pattern?.length).toBeGreaterThan(0)
        expect(plan.utilities?.find((utility) => utility.id === 'text-<left|right|center>')).toMatchObject({
            matchers: [{
                type: 'pattern',
                prefix: 'text-',
                values: ['left', 'right', 'center']
            }]
        })

        const css = createCSS(plan)
        expect(css.create('text-left')?.text).toBe('.text-left{text-align:left}')
        expect(css.create('n-2')?.text).toBe('.n-2{margin:calc(2 * 1px)}')
        expect(css.create('text-center')?.text).toBe('.text-center{text-align:start}')
        expect(css.create('badge-success')?.text).toBe('.badge-success{color:success}')
        expect(css.create('badge-success')?.layerName).toBe('components')
    })

    test('lowers managed dynamic colon entries without restoring fixed keyword aliases', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --font-size-sm: .875rem;
                --font-family-sans: ui-sans-serif;
                --font-weight-bold: 700;
                --color-red: red;
            }

            @utilities {
                font:<~font-size|number> {
                    font-size: --value();
                }

                font:<~font-family> {
                    font-family: --value();
                }

                font:<~font-weight> {
                    font-weight: --value();
                }

                bg:<~color|color> {
                    background-color: --value();
                }

                grid-cols:<number> {
                    display: grid;
                    grid-template-columns: repeat(--value(), minmax(0, 1fr));
                }

                size:<~container|number> {
                    width: --value();
                    height: --value();
                }

                user-select:<auto|none|text|all> {
                    -webkit-user-select: --value();
                    user-select: --value();
                }

                line-clamp:<number|none> {
                    -webkit-line-clamp: --value();
                }

                text-decoration:<~color|*> {
                    -webkit-text-decoration: --value();
                    text-decoration: --value();
                }
            }
        `)

        expect(plan.utilities?.find((utility) => utility.id === 'font:<~font-size|number>')).toMatchObject({
            kind: 'number',
            variableAliasRefs: ['~font-size'],
            matchers: expect.arrayContaining([
                { type: 'variable', keys: ['font'] },
                { type: 'value', keys: ['font'] }
            ])
        })
        expect(plan.utilities?.find((utility) => utility.id === 'grid-cols:<number>')?.type).toBe(UtilityType.Normal)
        expect(plan.utilities?.find((utility) => utility.id === 'size:<~container|number>')?.type).toBe(UtilityType.Shorthand)
        expect(plan.utilities?.find((utility) => utility.id === 'user-select:<auto|none|text|all>')).toMatchObject({
            matchers: [{
                type: 'pattern',
                prefix: 'user-select:',
                values: ['auto', 'none', 'text', 'all']
            }]
        })
        expect(plan.utilities?.find((utility) => utility.id === 'line-clamp:<number|none>')).toMatchObject({
            kind: 'number',
            matchers: expect.arrayContaining([
                { type: 'value', keys: ['line-clamp'] },
                {
                    type: 'pattern',
                    prefix: 'line-clamp:',
                    values: ['none']
                }
            ])
        })
        expect(plan.utilities?.find((utility) => utility.id === 'text-decoration:<~color|*>')).toMatchObject({
            variableAliasRefs: ['~color'],
            matchers: expect.arrayContaining([
                { type: 'variable', keys: ['text-decoration'] },
                { type: 'key', keys: ['text-decoration'] }
            ])
        })

        const css = createCSS(plan)
        expect(css.create('font:sm')?.text).toBe('.font\\:sm{font-size:var(--font-size-sm)}')
        expect(css.create('font:sans')?.text).toBe('.font\\:sans{font-family:var(--font-family-sans)}')
        expect(css.create('font:bold')?.text).toBe('.font\\:bold{font-weight:var(--font-weight-bold)}')
        expect(css.create('font:1rem')?.text).toBe('.font\\:1rem{font-size:1rem}')
        expect(css.create('bg:red')?.text).toBe('.bg\\:red{background-color:var(--color-red)}')
        expect(css.create('bg:#fff')?.text).toBe('.bg\\:\\#fff{background-color:#fff}')
        expect(css.create('grid-cols:3')?.text).toBe('.grid-cols\\:3{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr))}')
        expect(css.create('size:4x')?.text).toBe('.size\\:4x{width:1rem;height:1rem}')
        expect(css.create('size:4x|8x')).toBeUndefined()
        expect(css.create('user-select:none')?.text).toBe('.user-select\\:none{-webkit-user-select:none;user-select:none}')
        expect(css.create('line-clamp:3')?.text).toBe('.line-clamp\\:3{-webkit-line-clamp:3}')
        expect(css.create('line-clamp:none')?.text).toBe('.line-clamp\\:none{-webkit-line-clamp:none}')
        expect(css.create('text-decoration:underline|red')?.text)
            .toBe('.text-decoration\\:underline\\|red{-webkit-text-decoration:underline var(--color-red);text-decoration:underline var(--color-red)}')
        expect(css.create('bg:cover')).toBeUndefined()
    })

    test('rejects unsupported managed enum pattern syntax', () => {
        expect(() => compileCSSPlan(`
            @utilities {
                x-<> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed enum pattern cannot be empty')

        expect(() => compileCSSPlan(`
            @utilities {
                x-<a> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed enum pattern requires at least two values separated by "|"')

        expect(() => compileCSSPlan(`
            @utilities {
                x-<a><b> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed pattern must contain exactly one <...> segment')

        expect(() => compileCSSPlan(`
            @utilities {
                font-<font-size> {
                    font-size: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed enum pattern requires at least two values separated by "|"')

        expect(() => compileCSSPlan(`
            @utilities {
                x-<a,b> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed enum pattern values must use "|" separators')

        expect(() => compileCSSPlan(`
            @utilities {
                x-<a|b> {
                    color: --value(rem);
                }
            }
        `, { basePlan: defaultPlan })).toThrow('--value() does not accept arguments')

        expect(() => compileCSSPlan(`
            @utilities {
                text-center {
                    text-align: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('--value() is only supported inside managed pattern declarations')
    })

    test('rejects unsupported managed dynamic colon syntax', () => {
        expect(() => compileCSSPlan(`
            @utilities {
                x:<> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility source list cannot be empty')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<~> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Invalid managed dynamic utility namespace')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<raw> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility enum source requires at least two values separated by "|"')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<~color|none> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility enum values cannot be combined with namespaces')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<*|none> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility wildcard cannot be combined with enum or raw value kinds')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<*|number> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility wildcard cannot be combined with enum or raw value kinds')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<number,color> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utility source lists must use "|" separators')

        expect(() => compileCSSPlan(`
            @utilities {
                x:<number|color> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utilities only support one raw value kind per entry')

        expect(() => compileCSSPlan(`
            @utilities {
                :<number> {
                    color: --value();
                }
            }
        `, { basePlan: defaultPlan })).toThrow('Managed dynamic utilities must use key:<...> syntax')
    })

    test('does not consume @utility as a Master CSS directive', () => {
        const result = compileCSS(`
            @utility text-<left|right> {
                text-align: --value();
            }
        `, {
            preserveNativeCSS: false
        })

        expect(result.planInput.utilities).toBeUndefined()
    })

    test('lowers dark and light shorthand variant blocks like explicit variant blocks', () => {
        const settings = `
            @settings {
                mode-trigger: class;
                modes: light dark chrisma;
            }
        `
        const explicit = compileCSSPlan(`
            ${settings}

            @components {
                panel {
                    @variant @dark {
                        color: white;
                    }

                    @variant @light {
                        color: black;
                    }
                }
            }

            .card {
                @variant @dark {
                    @compose block;
                    color: white;
                }
            }

            @variant @light {
                .banner {
                    @compose hidden;
                }
            }
        `, { basePlan: defaultPlan })
        const shorthand = compileCSSPlan(`
            ${settings}

            @components {
                panel {
                    @dark {
                        color: white;
                    }

                    @light {
                        color: black;
                    }
                }
            }

            .card {
                @dark {
                    @compose block;
                    color: white;
                }
            }

            @light {
                .banner {
                    @compose hidden;
                }
            }
        `, { basePlan: defaultPlan })

        const explicitCSS = createCSS(explicit.plan).add('panel')
        const shorthandCSS = createCSS(shorthand.plan).add('panel')

        expect(shorthand.css).toBe(explicit.css)
        expect(shorthandCSS.componentsLayer.text).toBe(explicitCSS.componentsLayer.text)
        expect(shorthand.css).toContain('.dark .card{display:block;color:#fff}')
        expect(shorthand.css).toContain('.light .banner{display:none}')
        expect(shorthandCSS.componentsLayer.text).toContain('.dark .panel{color:#fff}')
        expect(shorthandCSS.componentsLayer.text).toContain('.light .panel{color:#000}')
    })

    test('keeps custom modes explicit behind @variant', () => {
        const customMode = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark chrisma;
            }

            .card {
                @variant @chrisma {
                    color: green;
                }
            }
        `, { basePlan: defaultPlan })

        expect(customMode.css).toContain('.chrisma .card{color:green}')
        const bareAtRule = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark chrisma;
            }

            .card {
                @chrisma {
                    color: green;
                }
            }
        `, { basePlan: defaultPlan })

        expect(bareAtRule.css).toContain('@chrisma')
        expect(bareAtRule.css).not.toContain('.chrisma .card')
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
                --color-emphasis: #000;
            }

            @theme dark {
                --color-emphasis: #fff;
            }
        `

        const lightDefault = createCSS(compileCSSPlan(`
            @settings {
                default-mode: light;
            }

            ${base}
        `, { basePlan: defaultPlan }).plan).add('bg:emphasis')
        expect(lightDefault.themeLayer.text).toContain('.light,:root{--color-emphasis:#000}')
        expect(lightDefault.themeLayer.text).toContain('.dark{--color-emphasis:#fff}')

        const noDefault = createCSS(compileCSSPlan(`
            @settings {
                default-mode: none;
            }

            ${base}
        `, { basePlan: defaultPlan }).plan).add('bg:emphasis')
        expect(noDefault.themeLayer.text).toContain('.light{--color-emphasis:#000}')
        expect(noDefault.themeLayer.text).not.toContain('.light,:root{--color-emphasis')
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

    test('resolves built-in and utility-owned theme namespaces before lowering composed definitions', () => {
        const { plan } = compileCSSPlan(`
            @theme {
                --content-stripe: 'stripe';
                --box-shadow-panel: 0 1px 2px #000;
                --shadow-panel: 0 1px 2px #000;
                --spacing-card: 1.5rem;
                --leading-body: 1.7;
                --color-line-brand: #abcdef;
                --color-brand: #123456;
                --color-primary: #123456;
            }

            @defaults {
                demo {
                    @compose content:stripe;
                }
            }
        `, { basePlan: defaultPlan })

        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'content-stripe',
            namespace: 'content',
            key: 'stripe'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'box-shadow-panel',
            key: 'box-shadow-panel'
        }))
        expect(plan.variables).not.toContainEqual(expect.objectContaining({
            name: 'box-shadow-panel',
            namespace: 'box-shadow'
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'shadow-panel',
            namespace: 'shadow',
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
        expect(css.create('content:stripe')?.text).toBe('.content\\:stripe{content:var(--content-stripe)}')
        expect(css.create('shadow:panel')?.text).toBe('.shadow\\:panel{box-shadow:var(--shadow-panel)}')
        expect(css.create('p:card')?.text).toBe('.p\\:card{padding:var(--spacing-card)}')
        expect(css.create('gap:card')?.text).toBe('.gap\\:card{gap:var(--spacing-card)}')
        expect(css.create('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
        expect(css.create('leading:body')?.text).toBe('.leading\\:body{line-height:var(--leading-body)}')
        expect(css.create('line-height:body')?.text).toBe('.line-height\\:body{line-height:var(--leading-body)}')
        expect(css.create('b:brand')?.text).toBe('.b\\:brand{border-color:var(--color-line-brand)}')
        expect(css.create('bg:brand')?.text).toBe('.bg\\:brand{background-color:var(--color-brand)}')
        expect(css.create('bg:primary')?.text).toBe('.bg\\:primary{background-color:var(--color-primary)}')
        expect(css.create('shadow:sm')?.text).toBe('.shadow\\:sm{box-shadow:var(--shadow-sm)}')

        css.add('demo')
        expect(css.defaultsLayer.text).toContain('.demo{content:var(--content-stripe)}')
        expect(css.themeLayer.text).toContain('--content-stripe:"stripe"')
    })

    test('lowers unquoted compose class lists from raw source', () => {
        const result = compileCSSPlan(`
            @theme {
                --color-primary: #123456;
            }

            @components {
                card {
                    @compose inline-flex bg:primary/.9 opacity:.7 translate:-5px;
                }
            }

            .list {
                @compose text-center>li;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(result.plan)

        css.add('card')

        expect(result.directives.styleDefinitions).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: 'compose',
                className: 'bg:primary/.9'
            }),
            expect.objectContaining({
                type: 'compose',
                className: 'translate:-5px'
            }),
            expect.objectContaining({
                type: 'compose',
                className: 'opacity:.7'
            }),
            expect.objectContaining({
                type: 'compose',
                className: 'text-center>li'
            })
        ]))
        expect(css.text).toContain('.card')
        expect(css.text).toContain('display:inline-flex')
        expect(css.text).toContain('background-color:color-mix(in oklab,var(--color-primary) 90%,transparent)')
        expect(css.text).toContain('opacity:0.7')
        expect(css.text).toContain('translate:-5px')
        expect(result.css).toContain('.list>li{text-align:center}')
    })

    test('rejects quoted and grouped compose class lists', () => {
        const expectComposeError = (source: string, code: string) => {
            let error: unknown
            try {
                compileCSSPlan(source, { basePlan: defaultPlan })
            } catch (caught) {
                error = caught
            }
            expect(error).toMatchObject({ code })
        }

        expectComposeError('.card { @compose "block"; }', 'compose-quoted-syntax')
        expectComposeError('.card { @compose content:\'-\'; }', 'compose-quoted-syntax')
        expectComposeError('.card { @compose {text-center;block}>li; }', 'compose-group-syntax')
    })

    test('executes CSS-first number variables and native value functions through engine semantics', () => {
        const { plan } = compileCSSPlan(`
            @settings {
                mode-trigger: class;
                modes: light dark;
            }

            @theme {
                --spacing-x1: 1rem;
                --container-custom: 15rem;
                --leading-x1: 1.5;
            }

            @theme light {
                --spacing-x1: 3rem;
                --leading-x1: 3;
            }

            @theme dark {
                --spacing-x1: 2rem;
                --leading-x1: 2;
            }
        `, { basePlan: defaultPlan })
        const css = createCSS(plan)

        expect(css.create('m:x1')?.text).toBe('.m\\:x1{margin:var(--spacing-x1)}')
        expect(css.create('m:var(--spacing-x1)')?.text).toBe('.m\\:var\\(--spacing-x1\\){margin:var(--spacing-x1)}')
        expect(css.create('m:$(spacing-x1)')).toBeUndefined()
        expect(css.create('line-height:x1')?.text).toBe('.line-height\\:x1{line-height:var(--leading-x1)}')
        expect(css.create('w:-custom')?.text).toBe('.w\\:-custom{width:calc(var(--container-custom) * -1)}')
        expect(css.create('w:calc(-2px+var(--spacing-x1))')?.text).toBe('.w\\:calc\\(-2px\\+var\\(--spacing-x1\\)\\){width:calc(-2px + var(--spacing-x1))}')
        expect(css.create('w:calc(-2px+$(spacing-x1))')).toBeUndefined()

        css.add('m:x1', 'm:-x1', 'line-height:x1')
        expect(css.themeLayer.text).toContain(':root{')
        expect(css.themeLayer.text).toContain('--spacing-x1:1rem')
        expect(css.themeLayer.text).not.toContain('---spacing-x1')
        expect(css.themeLayer.text).toContain('--leading-x1:1.5')
        expect(css.themeLayer.text).toContain('.light{--spacing-x1:3rem;--leading-x1:3}')
        expect(css.themeLayer.text).toContain('.dark{--spacing-x1:2rem;--leading-x1:2}')
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
                --spacing-card: 1rem;
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
        expect(css.themeLayer.text).not.toContain('--spacing-card:1rem')
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
