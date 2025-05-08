import { it, test, expect } from 'vitest'
import { createCSS } from '../src'

it.concurrent('native properties', ()=> {
    expect(createCSS().create('y:1')?.text).toContain('y:1')
    expect(createCSS().create('x:1')?.text).toContain('x:1')
    expect(createCSS().create('cy:1')?.text).toContain('cy:1')
    expect(createCSS().create('cx:1')?.text).toContain('cx:1')
})