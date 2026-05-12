import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('outline', () => {
    expect(createCSS().create('outline:current')?.text).toContain('outline-color:var(--color-current)')
    expect(createCSS().create('outline:transparent')?.text).toContain('outline-color:transparent')
    expect(createCSS().create('outline:black')?.text).toContain('outline-color:var(--color-black)')
    expect(createCSS().create('outline:2|black')?.text).toContain('outline:0.125rem var(--color-black) solid')
    expect(createCSS().create('outline:1')?.text).toContain('outline-width:0.0625rem')
    expect(createCSS().create('outline:dashed|black')?.text).toContain('outline:dashed var(--color-black)')
    expect(createCSS().create('outline:solid')?.text).toContain('outline-style:solid')
    expect(createCSS().create('outline:1rem|solid')?.text).toContain('outline:1rem solid')
    expect(createCSS().create('outline:thick|double|black')?.text).toContain('outline:thick double var(--color-black)')
    expect(createCSS().create('outline:none')?.text).toContain('outline-style:none')
    expect(createCSS().create('outline:auto')?.text).toContain('outline-style:auto')
    expect(createCSS().create('outline:unset')?.text).toContain('outline:unset')
    expect(createCSS().create('outline:inherit')?.text).toContain('outline:inherit')
    expect(createCSS().create('outline:initial')?.text).toContain('outline:initial')
    expect(createCSS().create('outline:revert')?.text).toContain('outline:revert')
    expect(createCSS().create('outline:revert-layer')?.text).toContain('outline:revert-layer')
    expect(createCSS().create('outline:auto|1')?.text).toContain('outline:auto 0.0625rem')
})

test.concurrent('autofill solid', () => {
    expect(createCSS().create('outline:16|black')?.text).toContain('outline:1rem var(--color-black) solid')
    expect(createCSS().create('outline:16|black|solid')?.text).toContain('outline:1rem var(--color-black) solid')
    expect(createCSS({ variables: [{ key: 'line', value: 'solid' }] }).create('outline:16|black|line')?.text).toContain('outline:1rem var(--color-black) var(--line)')

    expectLayers(
        {
            theme: '.light,:root{--line:solid}.dark{--line:dotted}',
            utilities: '.outline\\:16\\|line{outline:1rem var(--line) solid}'
        },
        'outline:16|line',
        { variables: [{ key: 'line', value: 'solid', mode: 'light' }, { key: 'line', value: 'dotted', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})
