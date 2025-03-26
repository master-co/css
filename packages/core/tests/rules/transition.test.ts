import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('transition', () => {
    expect(new MasterCSS().create('~transform|.1s|ease-out,width|.1s|ease-out')?.text).toBe('.\\~transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform 0.1s ease-out,width 0.1s ease-out}')
})
