import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates width rules', () => {
    expect(createCSSWithTheme().create('w:sm')?.text).toContain('width:calc(var(--container-sm) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:1/4')?.text).toContain('width:25%')
})

test.concurrent('sizing', () => {
    expect(createCSSWithTheme().create('w:full')?.text).toContain('width:var(--full)')
    expect(createCSSWithTheme().create('w:fit')?.text).toContain('width:var(--fit)')
    expect(createCSSWithTheme().create('w:max')?.text).toContain('width:var(--max)')
    expect(createCSSWithTheme().create('w:min')?.text).toContain('width:var(--min)')
    expect(createCSSWithTheme().create('w:3xs')?.text).toContain('width:calc(var(--container-3xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:2xs')?.text).toContain('width:calc(var(--container-2xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:xs')?.text).toContain('width:calc(var(--container-xs) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:sm')?.text).toContain('width:calc(var(--container-sm) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:md')?.text).toContain('width:calc(var(--container-md) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:lg')?.text).toContain('width:calc(var(--container-lg) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:xl')?.text).toContain('width:calc(var(--container-xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:2xl')?.text).toContain('width:calc(var(--container-2xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:3xl')?.text).toContain('width:calc(var(--container-3xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:4xl')?.text).toContain('width:calc(var(--container-4xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:5xl')?.text).toContain('width:calc(var(--container-5xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:6xl')?.text).toContain('width:calc(var(--container-6xl) / 16 * 1rem)')
    expect(createCSSWithTheme().create('w:7xl')?.text).toContain('width:calc(var(--container-7xl) / 16 * 1rem)')
})
