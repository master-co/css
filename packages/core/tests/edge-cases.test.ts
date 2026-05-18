import { expect, test } from 'vitest'
import { createCSS } from '../src'

test('keeps semicolons inside quoted group declaration values', () => {
    expect(createCSS().create('{content:\'a;b\';block}')?.text)
        .toBe('.\\{content\\:\\\'a\\;b\\\'\\;block\\}{content:\'a;b\';display:block}')
})

test('removes alias variable dependencies after shared utilities are removed', () => {
    const css = createCSS({
        variables: [
            { key: 'brand', value: '$color-white' }
        ]
    }).add('fg:brand', 'bg:brand')

    expect(css.themeLayer.text).toBe('@layer theme{:root{--brand:var(--color-white);--color-white:oklch(100% 0 none)}}')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({
        brand: 2,
        'color-white': 2
    })

    css.remove('fg:brand')
    expect(css.themeLayer.text).toBe('@layer theme{:root{--brand:var(--color-white);--color-white:oklch(100% 0 none)}}')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({
        brand: 1,
        'color-white': 1
    })

    css.remove('bg:brand')
    expect(css.themeLayer.text).toBe('')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({})
})

test('recovers class names from scoped mode selectors with escaped selector variants', () => {
    const css = createCSS({
        scope: '#app',
        modes: ['dark'],
        modeTrigger: 'class'
    })
    const rule = css.create('block:hover@dark')

    expect(rule?.selectorText).toBe('.dark #app .block\\:hover\\@dark:hover')
    expect(css.createFromSelectorText(rule!.selectorText)?.[0]).toMatchObject({
        name: 'block:hover@dark'
    })
})
