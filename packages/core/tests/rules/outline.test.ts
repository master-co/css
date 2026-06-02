import { it, test, expect } from 'vitest'
import { expectLayers } from '../test'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('outline', () => {
    expect(createCSSWithTheme().create('outline:current')?.text).toContain('outline-color:var(--color-current)')
    expect(createCSSWithTheme().create('outline:transparent')?.text).toContain('outline-color:transparent')
    expect(createCSSWithTheme().create('outline:black')?.text).toContain('outline-color:var(--color-black)')
    expect(createCSSWithTheme().create('outline:line-neutral')?.text).toContain('outline-color:var(--color-line-neutral)')
    expect(createCSSWithTheme().create('outline:$line-neutral')?.text).toContain('outline:var(--color-line-neutral)')
    expect(createCSSWithTheme().create('outline:2|black')?.text).toContain('outline:0.125rem var(--color-black) solid')
    expect(createCSSWithTheme().create('outline:1')?.text).toContain('outline-width:0.0625rem')
    expect(createCSSWithTheme().create('outline:dashed|black')?.text).toContain('outline:dashed var(--color-black)')
    expect(createCSSWithTheme().create('outline:solid')?.text).toContain('outline-style:solid')
    expect(createCSSWithTheme().create('outline:1rem|solid')?.text).toContain('outline:1rem solid')
    expect(createCSSWithTheme().create('outline:thick|double|black')?.text).toContain('outline:thick double var(--color-black)')
    expect(createCSSWithTheme().create('outline:none')?.text).toContain('outline-style:none')
    expect(createCSSWithTheme().create('outline:auto')?.text).toContain('outline-style:auto')
    expect(createCSSWithTheme().create('outline:unset')?.text).toContain('outline:unset')
    expect(createCSSWithTheme().create('outline:inherit')?.text).toContain('outline:inherit')
    expect(createCSSWithTheme().create('outline:initial')?.text).toContain('outline:initial')
    expect(createCSSWithTheme().create('outline:revert')?.text).toContain('outline:revert')
    expect(createCSSWithTheme().create('outline:revert-layer')?.text).toContain('outline:revert-layer')
    expect(createCSSWithTheme().create('outline:auto|1')?.text).toContain('outline:auto 0.0625rem')
})

test.concurrent('autofill solid', () => {
    expect(createCSSWithTheme().create('outline:16|black')?.text).toContain('outline:1rem var(--color-black) solid')
    expect(createCSSWithTheme().create('outline:16|black|solid')?.text).toContain('outline:1rem var(--color-black) solid')
    expect(createCSSWithTheme({ variables: [{ key: 'line', value: 'solid' }] }).create('outline:16|black|line')?.text).toContain('outline:1rem var(--color-black) var(--line)')

    expectLayers(
        {
            theme: '.light,:root{--line:solid}.dark{--line:dotted}',
            utilities: '.outline\\:16\\|line{outline:1rem var(--line) solid}'
        },
        'outline:16|line',
        { variables: [{ key: 'line', value: 'solid', mode: 'light' }, { key: 'line', value: 'dotted', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})
