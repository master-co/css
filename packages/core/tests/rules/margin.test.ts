import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('checks margin order', () => {
    expect(createCSSWithTheme().add('mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0').utilitiesLayer.rules)
        .toMatchObject([
            { name: 'm:0' },
            { name: 'mx:0' },
            { name: 'my:0' },
            { name: 'mb:0' },
            { name: 'ml:0' },
            { name: 'mr:0' },
            { name: 'mt:0' }
        ])
})

test.concurrent('margin', () => {
    expect(createCSSWithTheme().create('ml:16')?.text).toContain('margin-left:1rem')
    expect(createCSSWithTheme().create('ml:4x')?.text).toContain('margin-left:1rem')
    expect(createCSSWithTheme().create('mr:16')?.text).toContain('margin-right:1rem')
    expect(createCSSWithTheme().create('mt:16')?.text).toContain('margin-top:1rem')
    expect(createCSSWithTheme().create('mb:16')?.text).toContain('margin-bottom:1rem')
    expect(createCSSWithTheme().create('m:16')?.text).toContain('margin:1rem')
    expect(createCSSWithTheme().create('mx:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(createCSSWithTheme().create('my:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
    expect(createCSSWithTheme().create('margin-x:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(createCSSWithTheme().create('margin-y:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
})

test.concurrent('margin inline', () => {
    expect(createCSSWithTheme().create('mis:16')?.text).toContain('margin-inline-start:1rem')
    expect(createCSSWithTheme().create('mie:16')?.text).toContain('margin-inline-end:1rem')
    expect(createCSSWithTheme().create('mi:16')?.text).toContain('margin-inline:1rem')
})