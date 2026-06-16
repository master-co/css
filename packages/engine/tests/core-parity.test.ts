import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import {
    createCSSWithStaticUtilities,
    createCSSWithVariables,
    createDefaultCSS,
    clonePlan,
    createPlanWithStaticUtilities,
    expectClassText,
    expectLayerText
} from './helpers/css-tester'
import defaultPlan from '@master/css-preset/default-plan'

describe.concurrent('default plan utility parity', () => {
    test('generates representative background utilities', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'bg:black', 'background-color:oklch(0% 0 none)')
        expectClassText(css, 'bg:light-dark(#000,#fff)', 'background-color:light-dark(#000,#fff)')
        expectClassText(css, 'bg:#fff', 'background-color:#fff')
        expect(css.create('bg:black:hover@md&landscape')?.text)
            .toBe('@media (width>=64rem) and (orientation:landscape){.bg\\:black\\:hover\\@md\\&landscape:hover{background-color:oklch(0% 0 none)}}')
        expectClassText(css, 'bg:transparent', 'background-color:transparent')
        expectClassText(css, 'bg:current', 'background-color:currentColor')
        expectClassText(css, 'bg:line', 'background-color:var(--color-line)')
        expectClassText(css, 'bg-clip-border', 'background-clip:border-box')
        expectClassText(css, 'bg:url("#test")', 'background-image:url("#test")')
        expectClassText(css, 'gradient(45deg,#f3ec78,#af4261)', 'background-image:linear-gradient(45deg,#f3ec78,#af4261)')
    })

    test('keeps gradient color token functions as resolved color values', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'bg:conic-gradient(current,black)', 'background-image:conic-gradient(currentColor,oklch(0% 0 none))')
        expectClassText(css, 'bg:linear-gradient(current,black)', 'background-image:linear-gradient(currentColor,oklch(0% 0 none))')
        expectClassText(css, 'bg:radial-gradient(current,black)', 'background-image:radial-gradient(currentColor,oklch(0% 0 none))')
        expectClassText(css, 'bg:repeating-linear-gradient(current,black)', 'background-image:repeating-linear-gradient(currentColor,oklch(0% 0 none))')
        expectClassText(css, 'bg:repeating-radial-gradient(current,black)', 'background-image:repeating-radial-gradient(currentColor,oklch(0% 0 none))')
    })

    test('preserves margin aliases and priority order', () => {
        const css = createDefaultCSS()
        expectClassText(css, 'ml:16', 'margin-left:1rem')
        expectClassText(css, 'ml:4x', 'margin-left:1rem')
        expectClassText(css, 'mr:16', 'margin-right:1rem')
        expectClassText(css, 'mt:16', 'margin-top:1rem')
        expectClassText(css, 'mb:16', 'margin-bottom:1rem')
        expectClassText(css, 'm:16', 'margin:1rem')
        expectClassText(css, 'mx:16', 'margin-left:1rem;margin-right:1rem')
        expectClassText(css, 'my:16', 'margin-top:1rem;margin-bottom:1rem')

        css.add('mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0')
        expect(css.utilitiesLayer.rules.map(({ name }) => name))
            .toEqual(['m:0', 'mx:0', 'my:0', 'mb:0', 'ml:0', 'mr:0', 'mt:0'])
    })

    test('preserves border shorthand matching across value separators', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'bl:muted|1', 'border-left:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'border-left:muted|1', 'border-left:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'b:muted|1', 'border:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'bt:muted|1', 'border-top:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'br:muted|1', 'border-right:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'bb:muted|1', 'border-bottom:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'bx:muted|1', 'border-left:var(--color-line-muted) 0.0625rem solid;border-right:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'by:muted|1', 'border-top:var(--color-line-muted) 0.0625rem solid;border-bottom:var(--color-line-muted) 0.0625rem solid')
        expectClassText(css, 'bl:1|solid|muted', 'border-left:0.0625rem solid var(--color-line-muted)')
    })

    test('keeps border single-value aliases on color width and style utilities', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'bl:muted', 'border-left-color:var(--color-line-muted)')
        expectClassText(css, 'bl:1', 'border-left-width:0.0625rem')
        expectClassText(css, 'bl:solid', 'border-left-style:solid')
    })

    test('executes compiled value functions and complex utilities', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100%)')
        expectClassText(css, 'w:calc(-2+$(spacing-md))', 'width:calc(-0.125rem + var(--spacing-md))')
        expectClassText(css, 'w:calc(-$(spacing-md)-2)', 'width:calc(-var(--spacing-md) - 0.125rem)')
        expectClassText(css, 'w:calc(-1*($(spacing-md)*2)*3-2)', 'width:calc(-1 * (var(--spacing-md) * 2) * 3 - 0.125rem)')
        expectClassText(css, 'font-weight:$(font-weight-thin)', 'font-weight:var(--font-weight-thin)')
        expectClassText(css, 'fg:$color-white/.5', 'color:color-mix(in oklab,oklch(100% 0 none) 50%,transparent)')
        expectClassText(css, 'grid-cols:3', 'grid-template-columns:repeat(3,minmax(0,1fr))')
        expectClassText(css, 'lines:3', '-webkit-line-clamp:3')
        expectClassText(css, 'text:2xl', 'font-size:var(--font-size-2xl)')
    })

    test('resolves negative numeric aliases without synthetic variables', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'm:-md', 'margin:calc(var(--spacing-md) * -1)')
        expectClassText(css, 'mt:-md', 'margin-top:calc(var(--spacing-md) * -1)')
        expectClassText(css, 'translate:-md', 'translate:calc(var(--spacing-md) * -1)')
        expectClassText(css, 'w:-sm', 'width:calc(var(--container-sm) * -1)')
        expect(css.create('m:-md')?.variableNames).toEqual(new Set(['spacing-md']))
        expect(css.create('fg:-black')?.text).not.toContain('var(--color-black)')
    })

    test('keeps unitful numeric variables from receiving a second unit conversion', () => {
        const css = createCSSWithVariables([
            { name: 'spacing-card', namespace: 'spacing', key: 'card', type: 'number', value: '1.5rem', numeric: { value: 1.5, unit: 'rem' } },
            { name: 'container-card', namespace: 'container', key: 'card', type: 'number', value: '32rem', numeric: { value: 32, unit: 'rem' } }
        ])

        expectClassText(css, 'm:card', 'margin:var(--spacing-card)')
        expectClassText(css, 'm:-card', 'margin:calc(var(--spacing-card) * -1)')
        expectClassText(css, 'w:card', 'width:var(--container-card)')
        expectClassText(css, 'w:calc($(spacing-card)+2)', 'width:calc(var(--spacing-card) + 0.125rem)')
        expect(css.create('m:card')?.variableNames).toEqual(new Set(['spacing-card']))
    })

    test('uses compiled breakpoint aliases from the default plan', () => {
        expect(createDefaultCSS().create('block@sm&<md')?.text)
            .toContain('@media (width>=52.125rem) and (width<64rem)')
        expect(createDefaultCSS().create('block@<md')?.text)
            .toContain('@media (width<64rem)')
    })

    test('keeps functional pseudo-class selector arguments intact', () => {
        const css = createDefaultCSS()

        expect(css.create('pb:8x:not(:last)')?.text)
            .toBe('.pb\\:8x\\:not\\(\\:last\\):not(:last-child){padding-bottom:2rem}')
        expect(css.create('bg:blue-20:hover:not(.active)')?.text)
            .toBe('.bg\\:blue-20\\:hover\\:not\\(\\.active\\):hover:not(.active){background-color:var(--color-blue-20)}')
        expect(css.create('text:center_td:not(:first)')?.text)
            .toBe('.text\\:center_td\\:not\\(\\:first\\) td:not(:first-child){text-align:center}')
    })

    test('preserves migrated representative default utility cases', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'animation-direction:normal', 'animation-direction:normal')
        expect(css.create('@direction:normal')).toBeUndefined()
        expect(css.create('flex@sm')?.text)
            .toBe('@media (width>=52.125rem){.flex\\@sm{display:flex}}')
        expectClassText(css, 'grid-col-span:2', 'grid-column:span 2/span 2')
        expectClassText(css, 'grid-column-span:2', 'grid-column:span 2/span 2')
        expectClassText(css, 'top:20', 'top:1.25rem')
        expectClassText(css, 'bottom:10', 'bottom:0.625rem')
        expectClassText(css, 'right:max(0,calc(50%-725))', 'right:max(0rem,calc(50% - 45.3125rem))')
        expectClassText(css, 'max-w:3xs', 'max-width:var(--container-3xs)')
        expectClassText(css, 'max-w:16px', 'max-width:16px')
        expect(css.create('size:16|32')?.declarations).toStrictEqual({ width: '1rem', height: '2rem' })
        expect(css.create('max:16|32')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '2rem' })
        expect(css.create('min:16|32')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '2rem' })
        expect(css.create('size:min(10,calc(25-10))|10')?.declarations)
            .toStrictEqual({ width: 'min(0.625rem,calc(1.5625rem - 0.625rem))', height: '0.625rem' })
    })

    test('keeps pair utilities using variable functions without and with known number variables', () => {
        const css = createDefaultCSS()
        expect(css.create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: 'var(--w)', height: 'var(--h)' })
        expect(css.create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': 'var(--w)', 'max-height': 'var(--h)' })
        expect(css.create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': 'var(--w)', 'min-height': 'var(--h)' })

        const plan = clonePlan()
        plan.variables = [
            ...(plan.variables || []),
            { name: 'w', key: 'w', type: 'number', value: 16 },
            { name: 'h', key: 'h', type: 'number', value: 16 }
        ]
        const numericCSS = createCSS(plan)
        expect(numericCSS.create('size:$(w)|$(h)')?.declarations)
            .toStrictEqual({ width: 'calc(var(--w) / 16 * 1rem)', height: 'calc(var(--h) / 16 * 1rem)' })
    })

    test('keeps grouped declaration parsing and nested generated utilities', () => {
        const css = createDefaultCSS()

        expect(css.create('{color:black!;bb:2|solid}')?.declarations)
            .toStrictEqual({ color: 'oklch(0% 0 none)!important', 'border-bottom': '0.125rem solid' })
        expect(css.create('{pt:calc(2.5em+60);mt:-60}_:where(h1,h2,h3,h4,h5,h6)')?.declarations)
            .toStrictEqual({ 'padding-top': 'calc(2.5em + 3.75rem)', 'margin-top': '-3.75rem' })
        expect(css.create('{line-height:calc(32-16);font-size:calc(32-16)}')?.declarations)
            .toStrictEqual({ 'line-height': 'calc(32 - 16)', 'font-size': 'calc(2rem - 1rem)' })
        expect(css.create('{m:32;leading:1.5}')?.declarations)
            .toStrictEqual({ margin: '2rem', 'line-height': '1.5' })
        expect(css.create('{form}')?.text).toBe('')
        expect(css.create('{form;block}')?.declarations).toStrictEqual({ display: 'block' })
    })

    test('keeps grouped declarations important when configured globally', () => {
        const plan = clonePlan()
        plan.settings = {
            ...(plan.settings || {}),
            important: true
        }

        expect(createCSS(plan).create('{color:black!;bb:2|solid}')?.declarations)
            .toStrictEqual({ color: 'oklch(0% 0 none)!important', 'border-bottom': '0.125rem solid!important' })
        expect(createCSS(plan).create('{color:black!;bb:2|solid}')?.text)
            .toContain('border-bottom:0.125rem solid!important')
    })

    test('keeps migrated issue regressions for modern utility syntax', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'touch:none', 'touch-action:none')
        expectClassText(css, 'touch-action:none', 'touch-action:none')
        expectClassText(css, 'view-transition-name:hero', 'view-transition-name:hero')
        expectClassText(css, 'vt-name:hero', 'view-transition-name:hero')
        expect(css.create('opacity:0.5::view-transition-old(hero)')?.text)
            .toContain('::view-transition-old(hero)')
        expect(css.create('opacity:1::vt-new(hero)')?.text)
            .toContain('::view-transition-new(hero)')
        expectClassText(css, 'translate:16|24', 'translate:1rem 1.5rem')
        expectClassText(css, 'scale:1.5|2', 'scale:1.5 2')
        expectClassText(css, 'rotate:45deg', 'rotate:45deg')
        expectClassText(css, 'translate(16,16)', 'transform:translate(1rem,1rem)')
        expectClassText(css, 'border-inline-start-width:2', 'border-inline-start-width:0.125rem')
        expectClassText(css, 'border-start-start-radius:8', 'border-start-start-radius:0.5rem')
        expect(css.create('font-size:clamp(1.5rem,2vw+1rem,2.25rem)')?.text)
            .toMatch(/font-size:clamp\(1\.5rem,\s*calc\(2vw \+ 1rem\),\s*2\.25rem\)/)
        expect(css.create('{paint-order:stroke|fill|markers}')?.text)
            .toContain('paint-order:stroke fill markers')
    })
})

describe.concurrent('plan-driven layer and lifecycle parity', () => {
    test('starts empty and inserts on demand', () => {
        const css = createDefaultCSS()

        expect(css.text).toBe('')
        css.add('text:center')
        expect(css.text).toContain('@layer utilities{.text\\:center{text-align:center}}')
    })

    test('prevents duplicate insertion', () => {
        const css = createDefaultCSS()

        css.add('text:center', 'text:center')
        expect(css.utilitiesLayer.rules).toHaveLength(1)
    })

    test('does not duplicate preloaded variables', () => {
        const css = createCSS(defaultPlan, {
            variables: {
                'color-red-60': 1
            }
        })

        css.add('bg:red-60')
        expect(css.text).toBe('@layer utilities{.bg\\:red-60{background-color:var(--color-red-60)}}')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
            'color-red-60': 2
        })

        css.remove('bg:red-60')
        expect(css.text).toBe('')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
            'color-red-60': 1
        })
    })

    test('does not duplicate preloaded animations', () => {
        const css = createCSS(defaultPlan, {
            animations: {
                fade: 1
            }
        })

        css.add('animation:fade|.3s')
        expect(css.text).toBe('@layer utilities{.animation\\:fade\\|\\.3s{animation:fade 0.3s}}')
        expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
            fade: 2
        })

        css.remove('animation:fade|.3s')
        expect(css.text).toBe('')
        expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
            fade: 1
        })
    })

    test('executes static component utilities from plan records', () => {
        const css = createCSSWithStaticUtilities([
            {
                name: 'btn',
                rules: [
                    { declarations: { display: 'inline-flex' } },
                    { declarations: { height: '2.5rem' } }
                ]
            }
        ])

        expectLayerText(css, 'btn', 'componentsLayer', '.btn{display:inline-flex}.btn{height:2.5rem}')
    })

    test('keeps static utility declarations in their configured layer', () => {
        const css = createCSS(createPlanWithStaticUtilities([
            {
                name: 'prose',
                layer: 'defaults',
                rules: [{
                    selector: '& :is(p)',
                    declarations: { 'font-size': '1rem' }
                }]
            }
        ]))

        css.add('prose')
        expect(css.defaultsLayer.text).toContain('@layer defaults{.prose :is(p){font-size:1rem}}')
        expect(css.componentsLayer.text).toBe('')
        expect(css.text).not.toContain('@layer components{@layer defaults')
    })

    test('keeps explicit layer variants routed to the requested layer', () => {
        expectLayerText(createDefaultCSS(), 'block@base', 'baseLayer', '.block\\@base{display:block}')
        expectLayerText(createDefaultCSS(), 'block@default', 'defaultsLayer', '.block\\@default{display:block}')
        expectLayerText(createDefaultCSS(), 'block@component', 'componentsLayer', '.block\\@component{display:block}')
        expectLayerText(createDefaultCSS(), 'block@utility', 'utilitiesLayer', '.block\\@utility{display:block}')
        expectLayerText(createDefaultCSS(), 'font:12_:is(code,pre)@base', 'baseLayer', '.font\\:12_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}')
    })

    test('keeps deterministic rule ordering independent of insertion order', () => {
        const css = createDefaultCSS()
        css.add(
            'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
            'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
            'font:12', 'font:medium', 'text:center', 'fixed', 'block', 'round', 'b:0'
        )

        expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
            'block',
            'fixed',
            'round',
            'b:0',
            'm:0',
            'p:0',
            'mx:0',
            'my:0',
            'px:0',
            'py:0',
            'font:12',
            'font:medium',
            'mb:0',
            'ml:0',
            'mr:0',
            'mt:0',
            'pb:0',
            'pl:0',
            'pr:0',
            'pt:0',
            'text:center'
        ])
    })

    test('recovers generated utilities from selector text', () => {
        const css = createDefaultCSS()

        expect(css.createFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
        expect(css.createFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0])
            .toMatchObject({ name: 'hidden_button[disabled]' })
        expect(css.createFromSelectorText('.ml\\:-50\\_\\:where\\(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0])
            .toMatchObject({ name: 'ml:-50_:where(.code,.codeTabs,.demo)@<md' })
        expect(css.createFromSelectorText('.active .hidden\\:within\\(\\.active\\)')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)' })
        expect(css.createFromSelectorText('.dark .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)@dark' })

        const scopedPlan = clonePlan()
        scopedPlan.settings = {
            ...(scopedPlan.settings || {}),
            scope: '#app',
            modeTrigger: 'class',
            modes: ['dark']
        }
        const scopedCSS = createCSS(scopedPlan)
        const rule = scopedCSS.create('block:hover@dark')
        expect(rule?.selectorText).toBe('.dark #app .block\\:hover\\@dark:hover')
        expect(scopedCSS.createFromSelectorText(rule!.selectorText)?.[0]).toMatchObject({
            name: 'block:hover@dark'
        })
    })
})
