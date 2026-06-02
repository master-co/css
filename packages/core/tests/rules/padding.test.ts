import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('checks padding order', () => {
    expect(createCSSWithTheme().add('px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0').generalLayer.rules)
        .toMatchObject([
            { name: 'p:0' },
            { name: 'px:0' },
            { name: 'py:0' },
            { name: 'pb:0' },
            { name: 'pl:0' },
            { name: 'pr:0' },
            { name: 'pt:0' }
        ])
})

it.concurrent('validates padding rules', () => {
    expect(createCSSWithTheme().create('pl:16')?.text).toContain('padding-left:1rem')
    expect(createCSSWithTheme().create('pr:16')?.text).toContain('padding-right:1rem')
    expect(createCSSWithTheme().create('pt:16')?.text).toContain('padding-top:1rem')
    expect(createCSSWithTheme().create('pb:16')?.text).toContain('padding-bottom:1rem')
    expect(createCSSWithTheme().create('p:16')?.text).toContain('padding:1rem')
    expect(createCSSWithTheme().create('px:16')?.text).toContain('padding-left:1rem;padding-right:1rem')
    expect(createCSSWithTheme().create('py:16')?.text).toContain('padding-top:1rem;padding-bottom:1rem')
    expect(createCSSWithTheme().create('padding-x:16')?.text).toContain('padding-left:1rem;padding-right:1rem')
    expect(createCSSWithTheme().create('padding-y:16')?.text).toContain('padding-top:1rem;padding-bottom:1rem')
})

test.concurrent('padding inline', () => {
    expect(createCSSWithTheme().create('pis:16')?.text).toContain('padding-inline-start:1rem')
    expect(createCSSWithTheme().create('pie:16')?.text).toContain('padding-inline-end:1rem')
    expect(createCSSWithTheme().create('pi:16')?.text).toContain('padding-inline:1rem')
})