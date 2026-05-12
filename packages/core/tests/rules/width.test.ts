import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates width rules', () => {
    expect(createCSS().create('w:screen-sm')?.text).toContain('width:calc(var(--screen-sm) / 16 * 1rem)')
    expect(createCSS().create('w:1/4')?.text).toContain('width:25%')
})

test.concurrent('sizing', () => {
    expect(createCSS().create('w:full')?.text).toContain('width:var(--full)')
    expect(createCSS().create('w:fit')?.text).toContain('width:var(--fit)')
    expect(createCSS().create('w:max')?.text).toContain('width:var(--max)')
    expect(createCSS().create('w:min')?.text).toContain('width:var(--min)')
    expect(createCSS().create('w:screen-4xs')?.text).toContain('width:calc(var(--screen-4xs) / 16 * 1rem)')
    expect(createCSS().create('w:screen-3xs')?.text).toContain('width:calc(var(--screen-3xs) / 16 * 1rem)')
    expect(createCSS().create('w:screen-2xs')?.text).toContain('width:calc(var(--screen-2xs) / 16 * 1rem)')
    expect(createCSS().create('w:screen-xs')?.text).toContain('width:calc(var(--screen-xs) / 16 * 1rem)')
    expect(createCSS().create('w:screen-sm')?.text).toContain('width:calc(var(--screen-sm) / 16 * 1rem)')
    expect(createCSS().create('w:screen-md')?.text).toContain('width:calc(var(--screen-md) / 16 * 1rem)')
    expect(createCSS().create('w:screen-lg')?.text).toContain('width:calc(var(--screen-lg) / 16 * 1rem)')
    expect(createCSS().create('w:screen-xl')?.text).toContain('width:calc(var(--screen-xl) / 16 * 1rem)')
    expect(createCSS().create('w:screen-2xl')?.text).toContain('width:calc(var(--screen-2xl) / 16 * 1rem)')
    expect(createCSS().create('w:screen-3xl')?.text).toContain('width:calc(var(--screen-3xl) / 16 * 1rem)')
    expect(createCSS().create('w:screen-4xl')?.text).toContain('width:calc(var(--screen-4xl) / 16 * 1rem)')
})
