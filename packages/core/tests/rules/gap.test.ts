import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates gap rules', () => {
    expect(createCSSWithTheme().create('gap-x:16')?.text).toContain('column-gap:1rem')
    expect(createCSSWithTheme().create('gap-y:16')?.text).toContain('row-gap:1rem')
    expect(createCSSWithTheme().create('gap:16')?.text).toContain('gap:1rem')
})

it.concurrent('checks gap order', () => {
    expect(createCSSWithTheme().add('gap-x:16', 'gap:16', 'gap-y:16').utilitiesLayer.rules)
        .toMatchObject([
            { name: 'gap:16' },
            { name: 'gap-x:16' },
            { name: 'gap-y:16' }
        ])
})