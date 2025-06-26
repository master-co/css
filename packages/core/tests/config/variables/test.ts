import { it, test, expect, describe } from 'vitest'
import { createCSS } from '../../../src'
import config from '../../config'
import { expectLayers } from '../../test'

it.concurrent('uses with $ function', () => {
    expect(createCSS().create('font-weight:$(font-weight-thin)')?.text).toContain('font-weight:100')
    expect(createCSS().create('font-weight:$(font-weight-thin,123)')?.text).toContain('font-weight:100')
    expect(createCSS().create('font-weight:$(font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,100)')
    expect(createCSS().create('background-color:$(color-black)')?.text).toContain('background-color:oklch(0% 0 none)')
    expect(createCSS().create('background-color:$(my-gray,$(color-black))')?.text).toContain('background-color:var(--my-gray,oklch(0% 0 none))')
    expect(createCSS().create('background-color:$(my-gray,black)')?.text).toContain('background-color:var(--my-gray,oklch(0% 0 none))')
    expect(createCSS().create('background-color:$(my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,oklch(0% 0 none)))')
})

describe.concurrent('sigil', () => {
    it.concurrent('sigil in class', () => {
        expect(createCSS().create('fg:$color-white')?.text).toContain('oklch(100% 0 none)')
        expect(createCSS().create('fg:$color-white/.5')?.text).toContain('oklch(100% 0 none/0.5)')
    })
    it.concurrent('sigil in config', () => {
        expect(createCSS({ variables: { a: '$color-white' } }).create('fg:a')?.text).toContain('oklch(100% 0 none)')
    })
})

it.concurrent('uses with var function', () => {
    expect(createCSS().create('font-weight:var(--font-weight-thin)')?.text).toContain('font-weight:var(--font-weight-thin)')
    expect(createCSS().create('font-weight:var(--font-weight-thin,123)')?.text).toContain('font-weight:var(--font-weight-thin,123)')
    expect(createCSS().create('font-weight:var(--font-weight,font-weight-thin)')?.text).toContain('font-weight:var(--font-weight,100)')
    expect(createCSS().create('background-color:var(--gray)')?.text).toContain('background-color:var(--gray)')
    expect(createCSS().create('background-color:var(--my-gray,$color-black)')?.declarations).toEqual({ 'background-color': 'var(--my-gray,oklch(0% 0 none))' })
    expect(createCSS().create('background-color:var(--my-gray,black)')?.text).toContain('background-color:var(--my-gray,oklch(0% 0 none))')
    expect(createCSS().create('background-color:var(--my-gray,$(my-gray-2,black))')?.text).toContain('background-color:var(--my-gray,var(--my-gray-2,oklch(0% 0 none)))')
})

test.concurrent('rule variables', () => {
    expect(createCSS(config).create('font:sm')?.text).toBe('.font\\:sm{font-size:1rem}')
    expect(createCSS(config).create('font-size:sm')?.text).toBe('.font-size\\:sm{font-size:1rem}')
    expect(createCSS(config).create('tracking:wide')?.text).toBe('.tracking\\:wide{letter-spacing:0.025em}')
    expect(createCSS(config).create('letter-spacing:wide')?.text).toBe('.letter-spacing\\:wide{letter-spacing:0.025em}')
    expect(createCSS(config).create('shadow:x2')?.text).toBe('.shadow\\:x2{box-shadow:0rem 25px 50px -12px rgb(0 0 0 / 25%)}')
    expect(createCSS(config).create('inset:sm|md|md|sm')?.text).toBe('.inset\\:sm\\|md\\|md\\|sm{inset:0.625rem 1.25rem 1.25rem 0.625rem}')
    expect(createCSS(config).create('b:inputborder')?.text).toBe('.b\\:inputborder{border:0.125rem solid oklch(0% 0 none)}')
    expectLayers(
        {
            general: '.content\\:delimiter{content:"123"}'
        },
        'content:delimiter',
        {
            variables: {
                content: { delimiter: '"123"' }
            }
        }
    )
    expectLayers(
        {
            general: '.content\\:delimiter{content:"|"}'
        },
        'content:delimiter',
        {
            variables: {
                content: { delimiter: '"|"' }
            }
        }
    )
    expect(createCSS({
        variables: {
            border: {
                input: '1|solid|test-70'
            },
            test: { 70: '#000' }
        }
    }).create('b:input')?.text).toBe('.b\\:input{border:0.0625rem solid rgb(0 0 0)}')
    expect(createCSS({
        variables: {
            zero: 0
        }
    }).create('box-shadow:0|0|$(zero)|2|black')?.text).toContain('box-shadow:0rem 0rem 0rem 0.125rem oklch(0% 0 none)')
})