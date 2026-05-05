import { expect, test } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('layer', () => {
    expect(() => createCSS({ components: { btn: ['block@preset'] } })).toThrow('cannot include at-rule class')
    expect(() => createCSS({ components: { btn: ['block@base'] } })).toThrow('cannot include at-rule class')
})
