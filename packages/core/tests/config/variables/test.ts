import { it, test, expect, describe } from 'vitest'
import { createCSS } from '../../../src'
import config from '../../config'
import { expectLayers } from '../../test'

it.concurrent('uses with $ function', () => {
    expect(createCSS().create('font-weight:$(font-weight-thin)')?.text).toContain('font-weight:var(--font-weight-thin)')
    expect(createCSS().create('font-weight:$(font-weight-thin,123)')?.text).toContain('font-weight:var(--font-weight-thin)')
    expect(createCSS().create('font-weight:$(font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,var(--font-weight-thin))')
    expect(createCSS().create('background-color:$(color-black)')?.text).toContain('background-color:var(--color-black)')
    expect(createCSS().create('background-color:$(my-gray,$(color-black))')?.text).toContain('background-color:var(--my-gray,var(--color-black))')
    expect(createCSS().create('background-color:$(my-gray,black)')?.text).toContain('background-color:var(--my-gray,var(--color-black))')
    expect(createCSS().create('background-color:$(my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,var(--color-black)))')
})

describe.concurrent('sigil', () => {
    it.concurrent('sigil in class', () => {
        expect(createCSS().create('fg:$color-white')?.text).toContain('color:var(--color-white)')
        expect(createCSS().create('fg:$color-white/.5')?.text).toContain('color:color-mix(in oklab,var(--color-white) 50%,transparent)')
        expect(createCSS().create('w:$size')?.text).toBe('.w\\:\\$size{width:var(--size)}')
        expect(createCSS().create('fg:$brand/.5')?.text).toBe('.fg\\:\\$brand\\/\\.5{color:color-mix(in oklab,var(--brand) 50%,transparent)}')
    })
    it.concurrent('sigil in config', () => {
        expect(createCSS({ variables: [{ key: 'a', value: '$color-white' }] }).add('fg:a').themeLayer.text).toContain('--a:var(--color-white)')
    })
})

it.concurrent('uses with var function', () => {
    expect(createCSS().create('font-weight:var(--font-weight-thin)')?.text).toContain('font-weight:var(--font-weight-thin)')
    expect(createCSS().create('font-weight:var(--font-weight-thin,123)')?.text).toContain('font-weight:var(--font-weight-thin,123)')
    expect(createCSS().create('font-weight:var(--font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,var(--font-weight-thin))')
    expect(createCSS().create('background-color:var(--gray)')?.text).toContain('background-color:var(--gray)')
    expect(createCSS().create('background-color:var(--my-gray,$color-black)')?.declarations).toEqual({ 'background-color': 'var(--my-gray,var(--color-black))' })
    expect(createCSS().create('background-color:var(--my-gray,black)')?.text).toContain('background-color:var(--my-gray,var(--color-black))')
    expect(createCSS().create('background-color:var(--my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,var(--color-black)))')
})

test.concurrent('rule variables', () => {
    expect(createCSS(config).create('font:sm')?.text).toBe('.font\\:sm{font-size:calc(var(--font-size-sm) / 16 * 1rem)}')
    expect(createCSS(config).create('font-size:sm')?.text).toBe('.font-size\\:sm{font-size:calc(var(--font-size-sm) / 16 * 1rem)}')
    expect(createCSS(config).create('tracking:wide')?.text).toBe('.tracking\\:wide{letter-spacing:calc(var(--letter-spacing-wide) / 16 * 1em)}')
    expect(createCSS(config).create('letter-spacing:wide')?.text).toBe('.letter-spacing\\:wide{letter-spacing:calc(var(--letter-spacing-wide) / 16 * 1em)}')
    expect(createCSS(config).create('shadow:x2')?.text).toBe('.shadow\\:x2{box-shadow:var(--box-shadow-x2)}')
    expect(createCSS(config).create('b:inputborder')?.text).toBe('.b\\:inputborder{border:var(--border-inputborder)}')
    expectLayers(
        {
            utilities: '.content\\:delimiter{content:var(--content-delimiter)}'
        },
        'content:delimiter',
        { variables: [{ namespace: 'content', key: 'delimiter', value: '"123"' }] }
    )
    expectLayers(
        {
            utilities: '.content\\:delimiter{content:var(--content-delimiter)}'
        },
        'content:delimiter',
        { variables: [{ namespace: 'content', key: 'delimiter', value: '"|"' }] }
    )
    expect(createCSS({ variables: [{ namespace: 'border', key: 'input', value: '1|solid|test-70' }, { namespace: 'test', key: '70', value: '#000' }] }).create('b:input')?.text).toBe('.b\\:input{border:var(--border-input)}')
    expect(createCSS({ variables: [{ key: 'zero', value: 0 }] }).create('box-shadow:0|0|$(zero)|2|black')?.text).toContain('box-shadow:0rem 0rem calc(var(--zero) / 16 * 1rem) 0.125rem var(--color-black)')
})
