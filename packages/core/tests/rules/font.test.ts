import { it, expect } from 'vitest'
import { createCSS } from '../../src'
import { variables } from '../../src'

it.concurrent('font', () => {
    const sansFallback = variables.find((variable) => variable.namespace === 'font-family' && variable.key === 'sans-fallback')?.value
    expect(createCSS().create('font:italic|1.2rem|sans')?.text).toBe(`.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem "Inter", ${sansFallback}}`)
})
