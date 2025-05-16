import { it, expect } from 'vitest'
import { createCSS } from '../../src'
import { variables } from '../../src'

it.concurrent('font', () => {
    expect(createCSS().create('font:italic|1.2rem|sans')?.text).toBe(`.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem ${variables['font-family']['sans-fallback']}}`)
})
