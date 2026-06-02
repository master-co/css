import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('stroke-width', () => {
    expect(createCSSWithTheme().create('stroke:.75!')?.text).toContain('stroke-width:0.75!important')
})

test.concurrent('stroke-color', () => {
    expect(createCSSWithTheme().create('stroke:current')?.text).toContain('stroke:var(--color-current)')
    expect(createCSSWithTheme().create('stroke:black')?.text).toContain('stroke:var(--color-black)')
})
