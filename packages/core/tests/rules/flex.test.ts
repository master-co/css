import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('flex', () => {
    expect(createCSS().create('flex:1|1|auto')?.text).toBe('.flex\\:1\\|1\\|auto{flex:1 1 auto}')
    // expect(createCSS().create('flex:hover')?.text).toBe('.flex\\:hover{flex: hover}')
})
