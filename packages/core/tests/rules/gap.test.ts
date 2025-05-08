import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates gap rules', () => {
    expect(createCSS().create('gap-x:16')?.text).toContain('column-gap:1rem')
    expect(createCSS().create('gap-y:16')?.text).toContain('row-gap:1rem')
    expect(createCSS().create('gap:16')?.text).toContain('gap:1rem')
})

it.concurrent('checks gap order', () => {
    expect(createCSS().add('gap-x:16', 'gap:16', 'gap-y:16').generalLayer.rules)
        .toMatchObject([
            { name: 'gap:16' },
            { name: 'gap-x:16' },
            { name: 'gap-y:16' }
        ])
})