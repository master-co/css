import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates width rules', () => {
    expect(createCSS().create('w:screen-sm')?.text).toContain('width:52.125rem')
    expect(createCSS().create('w:1/4')?.text).toContain('width:25%')
})

test.concurrent('sizing', () => {
    expect(createCSS().create('w:full')?.text).toContain('width:100%')
    expect(createCSS().create('w:fit')?.text).toContain('width:fit-content')
    expect(createCSS().create('w:max')?.text).toContain('width:max-content')
    expect(createCSS().create('w:min')?.text).toContain('width:min-content')
    expect(createCSS().create('w:screen-4xs')?.text).toContain('width:22.5rem')
    expect(createCSS().create('w:screen-3xs')?.text).toContain('width:30rem')
    expect(createCSS().create('w:screen-2xs')?.text).toContain('width:37.5rem')
    expect(createCSS().create('w:screen-xs')?.text).toContain('width:48rem')
    expect(createCSS().create('w:screen-sm')?.text).toContain('width:52.125rem')
    expect(createCSS().create('w:screen-md')?.text).toContain('width:64rem')
    expect(createCSS().create('w:screen-lg')?.text).toContain('width:80rem')
    expect(createCSS().create('w:screen-xl')?.text).toContain('width:90rem')
    expect(createCSS().create('w:screen-2xl')?.text).toContain('width:100rem')
    expect(createCSS().create('w:screen-3xl')?.text).toContain('width:120rem')
    expect(createCSS().create('w:screen-4xl')?.text).toContain('width:160rem')
})