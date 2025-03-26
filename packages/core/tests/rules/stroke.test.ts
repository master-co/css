import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('stroke-width', () => {
    expect(new MasterCSS().create('stroke:.75!')?.text).toContain('stroke-width:0.75!important')
})

test.concurrent('stroke-color', () => {
    expect(new MasterCSS().create('stroke:current')?.text).toContain('stroke:currentColor')
    expect(new MasterCSS().create('stroke:black')?.text).toContain('stroke:rgb(0 0 0)')
})