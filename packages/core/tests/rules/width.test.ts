import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates width rules', () => {
    expect(createCSSWithTheme().create('w:screen-sm')?.text).toContain('width:calc(var(--screen-sm) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:1/4')?.text).toContain('width:25%')
})

test.concurrent('sizing', () => {
    expect(createCSSWithTheme().create('w:full')?.text).toContain('width:var(--full)')
    expect(createCSSWithTheme().create('w:fit')?.text).toContain('width:var(--fit)')
    expect(createCSSWithTheme().create('w:max')?.text).toContain('width:var(--max)')
    expect(createCSSWithTheme().create('w:min')?.text).toContain('width:var(--min)')
    expect(createCSSWithTheme().create('w:screen-4xs')?.text).toContain('width:calc(var(--screen-4xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-3xs')?.text).toContain('width:calc(var(--screen-3xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-2xs')?.text).toContain('width:calc(var(--screen-2xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-xs')?.text).toContain('width:calc(var(--screen-xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-sm')?.text).toContain('width:calc(var(--screen-sm) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-md')?.text).toContain('width:calc(var(--screen-md) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-lg')?.text).toContain('width:calc(var(--screen-lg) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-xl')?.text).toContain('width:calc(var(--screen-xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-2xl')?.text).toContain('width:calc(var(--screen-2xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-3xl')?.text).toContain('width:calc(var(--screen-3xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:screen-4xl')?.text).toContain('width:calc(var(--screen-4xl) / 16 * 1rem)')
})
