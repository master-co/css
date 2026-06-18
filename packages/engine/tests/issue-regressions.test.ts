import { describe, expect, test } from 'vitest'
import { createCSSWithVariables, createDefaultCSS } from './helpers/css-tester'

describe.concurrent('migrated issue regressions', () => {
    describe('issue #147: native color function values in Plan variables', () => {
        test('preserves hsl strings in engine-owned Plan records', () => {
            const css = createCSSWithVariables([
                { name: 'color-primary', namespace: 'color', key: 'primary', type: 'string', value: 'hsl(210 100% 50%)' },
                { name: 'color-primary-alpha', namespace: 'color', key: 'primary-alpha', type: 'string', value: 'hsl(210 100% 50% / 0.5)' },
                { name: 'color-primary-legacy', namespace: 'color', key: 'primary-legacy', type: 'string', value: 'hsl(210, 100%, 50%)' }
            ])

            expect(css.variables.get('color-primary')).toMatchObject({
                namespace: 'color',
                type: 'string',
                value: 'hsl(210 100% 50%)'
            })
            expect(css.variables.get('color-primary-alpha')?.value).toBe('hsl(210 100% 50% / 0.5)')
            expect(css.variables.get('color-primary-legacy')?.value).toBe('hsl(210, 100%, 50%)')
        })

        test('keeps flat color key namespace metadata', () => {
            const css = createCSSWithVariables([
                { name: 'color-brand-primary', namespace: 'color', key: 'brand-primary', type: 'string', value: 'hsl(210 100% 50%)' },
                { name: 'color-brand-secondary', namespace: 'color', key: 'brand-secondary', type: 'string', value: 'hsl(290 80% 40%)' }
            ])

            expect(css.variables.get('color-brand-primary')).toMatchObject({
                namespace: 'color',
                value: 'hsl(210 100% 50%)'
            })
            expect(css.variables.get('color-brand-secondary')).toMatchObject({
                namespace: 'color',
                value: 'hsl(290 80% 40%)'
            })
        })
    })

    test('issue #215: touch-action native declarations replace the removed touch shorthand', () => {
        const css = createDefaultCSS()
        const cases = [
            ['touch-action:auto', 'touch-action:auto'],
            ['touch-action:none', 'touch-action:none'],
            ['touch-action:pan-x', 'touch-action:pan-x'],
            ['touch-action:pan-y', 'touch-action:pan-y'],
            ['touch-action:pan-left', 'touch-action:pan-left'],
            ['touch-action:pan-right', 'touch-action:pan-right'],
            ['touch-action:pan-up', 'touch-action:pan-up'],
            ['touch-action:pan-down', 'touch-action:pan-down'],
            ['touch-action:pinch-zoom', 'touch-action:pinch-zoom'],
            ['touch-action:none', 'touch-action:none']
        ] as const

        for (const [className, expected] of cases) {
            expect(css.create(className)?.text).toContain(expected)
        }
        expect(css.create('touch:none')).toBeUndefined()
    })

    test('issue #265: View Transitions API declarations and pseudo-elements', () => {
        const css = createDefaultCSS()

        expect(css.create('view-transition-name:hero')?.text).toContain('view-transition-name:hero')
        expect(css.create('view-transition-class:product-card')?.text).toContain('view-transition-class:product-card')
        expect(css.create('vt-name:hero')).toBeUndefined()
        expect(css.create('vt-class:product-card')).toBeUndefined()
        expect(css.create('view-transition-name:none')?.text).toContain('view-transition-name:none')
        expect(css.create('opacity:0::view-transition')?.text).toContain('::view-transition{opacity:0}')
        expect(css.create('opacity:0.5::view-transition-old(hero)')?.text).toContain('::view-transition-old(hero)')
        expect(css.create('opacity:0.5::view-transition-old(hero)')?.text).not.toMatch(/[^:]:view-transition-old\(/)
        expect(css.create('opacity:1::view-transition-new(hero)')?.text).toContain('::view-transition-new(hero)')

        const selectorCases = [
            ['::vt', '::view-transition'],
            ['::vt-group(hero)', '::view-transition-group(hero)'],
            ['::vt-image-pair(hero)', '::view-transition-image-pair(hero)'],
            ['::vt-old(hero)', '::view-transition-old(hero)'],
            ['::vt-new(hero)', '::view-transition-new(hero)']
        ] as const
        for (const [selector, expectedSelector] of selectorCases) {
            expect(css.create('opacity:0' + selector)?.text).toContain(expectedSelector + '{opacity:0}')
        }
    })

    test('issue #321: individual transforms replace legacy transform function utilities', () => {
        const css = createDefaultCSS()

        expect(css.create('translate:16')?.text).toContain('translate:1rem')
        expect(css.create('translate:16|24')?.text).toContain('translate:1rem 1.5rem')
        expect(css.create('scale:1.5')?.text).toContain('scale:1.5')
        expect(css.create('scale:1.5|2')?.text).toContain('scale:1.5 2')
        expect(css.create('rotate:45deg')?.text).toContain('rotate:45deg')
        expect(css.create('transform:translate(16,16)')?.text).toContain('transform:translate(1rem,1rem)')
        expect(css.create('transform:rotate(45deg)')?.text).toContain('transform:rotate(45deg)')
        expect(css.create('translate(16,16)')).toBeUndefined()
        expect(css.create('rotate(45deg)')).toBeUndefined()
        expect(css.create('scale(1.5)')).toBeUndefined()
    })

    test('issue #332: logical borders and logical corner radii', () => {
        const css = createDefaultCSS()
        const cases = [
            ['border-inline-start-color:red', 'border-inline-start-color:'],
            ['border-inline-end-color:red', 'border-inline-end-color:'],
            ['border-block-start-color:red', 'border-block-start-color:'],
            ['border-block-end-color:red', 'border-block-end-color:'],
            ['border-inline-color:red', 'border-inline-color:'],
            ['border-block-color:red', 'border-block-color:'],
            ['border-inline-start-style:dashed', 'border-inline-start-style:dashed'],
            ['border-inline-end-style:solid', 'border-inline-end-style:solid'],
            ['border-block-start-style:dotted', 'border-block-start-style:dotted'],
            ['border-block-end-style:none', 'border-block-end-style:none'],
            ['border-inline-start-width:2', 'border-inline-start-width:0.125rem'],
            ['border-block-end-width:1', 'border-block-end-width:0.0625rem'],
            ['border-inline-start:1', 'border-inline-start:'],
            ['border-inline-end:1', 'border-inline-end:'],
            ['border-block-start:1', 'border-block-start:'],
            ['border-block-end:1', 'border-block-end:'],
            ['border-inline:1', 'border-inline:'],
            ['border-block:1', 'border-block:'],
            ['border-start-start-radius:8', 'border-start-start-radius:0.5rem'],
            ['border-start-end-radius:8', 'border-start-end-radius:0.5rem'],
            ['border-end-start-radius:8', 'border-end-start-radius:0.5rem'],
            ['border-end-end-radius:8', 'border-end-end-radius:0.5rem']
        ] as const

        for (const [className, expected] of cases) {
            expect(css.create(className)?.text).toContain(expected)
        }
    })

    describe('issue #346: CSS color functions in Plan variables', () => {
        test('preserves native CSS color function values in engine-owned Plan records', () => {
            const cases = [
                ['rgb', 'rgb(0 128 255)'],
                ['hsl', 'hsl(210 100% 50%)'],
                ['hwb', 'hwb(210 30% 20%)'],
                ['lab', 'lab(50% 40 -30)'],
                ['lch', 'lch(50% 60 200)'],
                ['oklab', 'oklab(0.5 0.1 -0.05)'],
                ['oklch', 'oklch(0.5 0.15 240)'],
                ['color-srgb', 'color(srgb 0.2 0.4 0.8)'],
                ['color-display-p3', 'color(display-p3 0.2 0.4 0.8)'],
                ['color-rec2020', 'color(rec2020 0.2 0.4 0.8)']
            ] as const
            const css = createCSSWithVariables(cases.map(([key, value]) => ({
                name: `color-${key}`,
                namespace: 'color',
                key,
                type: 'string',
                value
            })))

            for (const [key, value] of cases) {
                expect(css.variables.get(`color-${key}`)).toMatchObject({
                    type: 'string',
                    value
                })
            }
        })

        test('keeps alpha aliases and color-mix values executable through variable dependencies', () => {
            const css = createCSSWithVariables([
                { name: 'color-primary', namespace: 'color', key: 'primary', type: 'string', value: 'oklch(0.5 0.15 240)' },
                { name: 'color-soft', namespace: 'color', key: 'soft', type: 'string', value: '$color-primary/.3', dependencies: ['color-primary'] },
                { name: 'color-mix', namespace: 'color', key: 'mix', type: 'string', value: 'color-mix(in oklch, red, blue)' }
            ])

            css.add('bg:soft', 'bg:mix')
            expect(css.themeLayer.text).toContain('--color-soft:color-mix(in oklab,var(--color-primary) 30%,transparent)')
            expect(css.themeLayer.text).toContain('--color-primary:oklch(0.5 0.15 240)')
            expect(css.themeLayer.text).toContain('--color-mix:color-mix(in oklch, red, blue)')
        })
    })

    test('issue #358: clamp arithmetic is wrapped and normalized without double wrapping', () => {
        const css = createDefaultCSS()

        expect(css.create('font-size:clamp(1.5rem,2vw+1rem,2.25rem)')?.text)
            .toMatch(/font-size:clamp\(1\.5rem,\s*calc\(2vw \+ 1rem\),\s*2\.25rem\)/)
        expect(css.create('font-size:clamp(1rem, 2vw + 1rem, 3rem)')?.text)
            .toMatch(/clamp\(\s*1rem\s*,\s*calc\(2vw\s*\+\s*1rem\)\s*,\s*3rem\s*\)/)
        expect(css.create('font-size:clamp(1rem,calc(2vw+1rem),3rem)')?.text)
            .toMatch(/clamp\(1rem,\s*calc\(2vw\s*\+\s*1rem\),\s*3rem\)/)
        expect(css.create('font-size:clamp(1rem,calc(2vw+1rem),3rem)')?.text).not.toContain('calc(calc(')
        expect(css.create('font-size:clamp(-1rem,2vw,3rem)')?.text).toContain('clamp(-1rem, 2vw, 3rem)')
        expect(css.create('font-size:clamp(1.5rem,calc(2vw+1rem),2.25rem)')?.text).toContain('clamp(')
        expect(css.create('font-size:clamp(1rem,2vw,3rem)')?.text).toContain('clamp(1rem, 2vw, 3rem)')
    })

    test('issue #363: pipe separators inside groups lower to declaration spaces', () => {
        const css = createDefaultCSS()

        expect(css.create('{paint-order:stroke|fill}')?.text).toContain('paint-order:stroke fill')
        expect(css.create('{paint-order:stroke|fill}')?.text).not.toContain('paint-order:stroke|fill')
        expect(css.create('{paint-order:stroke}')?.text).toContain('paint-order:stroke')
        expect(css.create('{paint-order:stroke|fill|markers}')?.text).toContain('paint-order:stroke fill markers')

        const rule = css.create('background:white|red')
        expect(rule?.text).toBeTruthy()
        const declarationStart = rule!.text.indexOf('{')
        expect(rule!.text.slice(declarationStart)).not.toContain('|')
    })
})
