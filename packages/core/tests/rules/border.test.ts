import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('border', () => {
    expect(createCSS().create('border:current')?.text).toContain('border-color:var(--color-current)')
    expect(createCSS().create('border:transparent')?.text).toContain('border-color:transparent')
    expect(createCSS().create('border:black')?.text).toContain('border-color:var(--color-black)')
    expect(createCSS().create('border:2|black')?.text).toContain('border:0.125rem var(--color-black) solid')
    expect(createCSS().create('border:1')?.text).toContain('border-width:0.0625rem')
    expect(createCSS().create('border:dashed|black')?.text).toContain('border:dashed var(--color-black)')
    expect(createCSS().create('border:solid')?.text).toContain('border-style:solid')
    expect(createCSS().create('border:1rem|solid')?.text).toContain('border:1rem solid')
    expect(createCSS().create('border:thick|double|black')?.text).toContain('border:thick double var(--color-black)')
    expect(createCSS().create('border:none')?.text).toContain('border-style:none')
    expect(createCSS().create('border:auto')?.text).toContain('border-style:auto')
    expect(createCSS().create('border:unset')?.text).toContain('border:unset')
    expect(createCSS().create('border:inherit')?.text).toContain('border:inherit')
    expect(createCSS().create('border:initial')?.text).toContain('border:initial')
    expect(createCSS().create('border:revert')?.text).toContain('border:revert')
    expect(createCSS().create('border:revert-layer')?.text).toContain('border:revert-layer')
    expect(createCSS().create('border:auto|1')?.text).toContain('border:auto 0.0625rem')
})

test.concurrent('shorthand', () => {
    expect(createCSS().create('border:calc(100%-20)|solid')?.text).toContain('border:calc(100% - 1.25rem) solid')
})

it.concurrent('validates border rules', () => {
    expect(createCSS().create('b:16|solid')?.text).toContain('border:1rem solid')
    expect(createCSS().create('border:16|solid')?.text).toContain('border:1rem solid')

    expect(createCSS().create('bt:16|solid')?.text).toContain('border-top:1rem solid')
    expect(createCSS().create('border-top:16|solid')?.text).toContain('border-top:1rem solid')

    expect(createCSS().create('bb:16|solid')?.text).toContain('border-bottom:1rem solid')
    expect(createCSS().create('border-bottom:16|solid')?.text).toContain('border-bottom:1rem solid')

    expect(createCSS().create('bl:16|solid')?.text).toContain('border-left:1rem solid')
    expect(createCSS().create('border-left:16|solid')?.text).toContain('border-left:1rem solid')

    expect(createCSS().create('br:16|solid')?.text).toContain('border-right:1rem solid')
    expect(createCSS().create('border-right:16|solid')?.text).toContain('border-right:1rem solid')

    expect(createCSS().create('bx:16|solid')?.text).toContain('border-left:1rem solid;border-right:1rem solid')
    expect(createCSS().create('border-x:16|solid')?.text).toContain('border-left:1rem solid;border-right:1rem solid')

    expect(createCSS().create('by:16|solid')?.text).toContain('border-top:1rem solid;border-bottom:1rem solid')
    expect(createCSS().create('border-y:16|solid')?.text).toContain('border-top:1rem solid;border-bottom:1rem solid')

    expect(createCSS().create('br:1px|solid|black')?.text).toContain('border-right:1px solid var(--color-black)')

    expect(createCSS().create('br:1px|black')?.text).toContain('border-right:1px var(--color-black) solid')
})

it.concurrent('checks border order', () => {
    expect(createCSS().add('bt:1|solid', 'b:1|solid', 'br:1|solid').generalLayer.rules)
        .toMatchObject([
            { name: 'b:1|solid' },
            { name: 'br:1|solid' },
            { name: 'bt:1|solid' }
        ])
})

test.concurrent('autofill solid', () => {
    expect(createCSS().create('border:16|black')?.text).toContain('border:1rem var(--color-black) solid')
    expect(createCSS().create('border:16|black|solid')?.text).toContain('border:1rem var(--color-black) solid')
    expect(createCSS().create('border:16|var(--style)')?.text).not.toContain('solid')
    expect(createCSS({ variables: [{ key: 'line', value: 'solid' }] }).create('border:16|black|line')?.text).toContain('border:1rem var(--color-black) var(--line)')

    expectLayers(
        {
            theme: '.light,:root{--line:solid}.dark{--line:dotted}',
            general: '.border\\:16\\|line{border:1rem var(--line) solid}'
        },
        'border:16|line',
        { variables: [{ key: 'line', value: 'solid', mode: 'light' }, { key: 'line', value: 'dotted', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--line:solid}.dark{--line:dotted}',
            general: '.border\\:16\\|line{border:1rem var(--line) solid}'
        },
        'border:16|line',
        { variables: [{ key: 'line', value: 'solid', mode: 'light' }, { key: 'line', value: 'dotted', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})
