import { expect, test } from 'vitest'
import { createCSS } from '../../../src'

test('rule', () => {
    const config = {
        components: {
            btn: 'inline-flex bg:#000000'
        }
    }
    const rule = createCSS(config).generate('btn')[0]
    expect(rule.fixedClass).toBe('btn')
})