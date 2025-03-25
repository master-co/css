import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('display', () => {
    expect(new MasterCSS().create('flex')?.text).toBe('.flex{display:flex}')
    expect(new MasterCSS().create('flex@sm')?.text).toBe('@media(min-width:834px){.flex\\@sm{display:flex}}')
})
