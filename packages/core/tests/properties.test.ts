import { it, test, expect } from 'vitest'
import createCSSWithTheme from './helpers/create-css-with-theme'
it.concurrent('native properties', ()=> {
    expect(createCSSWithTheme().create('y:1')?.text).toContain('y:1')
    expect(createCSSWithTheme().create('x:1')?.text).toContain('x:1')
    expect(createCSSWithTheme().create('cy:1')?.text).toContain('cy:1')
    expect(createCSSWithTheme().create('cx:1')?.text).toContain('cx:1')
})