import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import {
    createCSSWithStaticUtilities,
    createDefaultCSS,
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
        expectClassText(css, 'bg:line-light', 'background-color:var(--color-line-light)')
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

        expectClassText(css, 'bl:lighter|1', 'border-left:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'border-left:lighter|1', 'border-left:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'b:lighter|1', 'border:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'bt:lighter|1', 'border-top:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'br:lighter|1', 'border-right:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'bb:lighter|1', 'border-bottom:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'bx:lighter|1', 'border-left:var(--color-line-lighter) 0.0625rem solid;border-right:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'by:lighter|1', 'border-top:var(--color-line-lighter) 0.0625rem solid;border-bottom:var(--color-line-lighter) 0.0625rem solid')
        expectClassText(css, 'bl:1|solid|lighter', 'border-left:0.0625rem solid var(--color-line-lighter)')
    })

    test('keeps border single-value aliases on color width and style utilities', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'bl:lighter', 'border-left-color:var(--color-line-lighter)')
        expectClassText(css, 'bl:1', 'border-left-width:0.0625rem')
        expectClassText(css, 'bl:solid', 'border-left-style:solid')
    })

    test('executes compiled value functions and complex utilities', () => {
        const css = createDefaultCSS()

        expectClassText(css, 'w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100%)')
        expectClassText(css, 'w:calc(-2+$(spacing-md))', 'width:calc(-0.125rem + var(--spacing-md) / 16 * 1rem)')
        expectClassText(css, 'w:calc(-$(spacing-md)-2)', 'width:calc(-var(--spacing-md) / 16 * 1rem - 0.125rem)')
        expectClassText(css, 'w:calc(-1*($(spacing-md)*2)*3-2)', 'width:calc(-1 * (var(--spacing-md) * 2) * 3 - 0.125rem)')
        expectClassText(css, 'font-weight:$(font-weight-thin)', 'font-weight:var(--font-weight-thin)')
        expectClassText(css, 'fg:$color-white/.5', 'color:color-mix(in oklab,oklch(100% 0 none) 50%,transparent)')
        expectClassText(css, 'grid-cols:3', 'grid-template-columns:repeat(3,minmax(0,1fr))')
        expectClassText(css, 'lines:3', '-webkit-line-clamp:3')
        expectClassText(css, 'text:2xl', 'font-size:calc(var(--font-size-2xl) / 16 * 1rem)')
    })

    test('uses compiled breakpoint aliases from the default plan', () => {
        expect(createDefaultCSS().create('block@sm&<md')?.text)
            .toContain('@media (width>=52.125rem) and (width<64rem)')
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
})
