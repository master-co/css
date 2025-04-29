import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('text fill colors', () => {
    expect(new MasterCSS().create('t:black')?.text).toBe('.t\\:black{-webkit-text-fill-color:rgb(0 0 0)}')
    expect(new MasterCSS().create('text-fill-color:black')?.text).toBe('.text-fill-color\\:black{-webkit-text-fill-color:rgb(0 0 0)}')
})