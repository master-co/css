import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../../src'
import { Config, SyntaxRuleType } from '../../../src'
import { NUMBER_VALUE_REGEX } from '../../../src/common'

const customConfig: Config = {
    override: true,
    rootSize: 10,
    rules: {
        'font-size': {
            key: 'custom',
            values: [NUMBER_VALUE_REGEX],
            unit: 'rem',
            type: SyntaxRuleType.Normal,
        }
    }
}

test.concurrent('override', () => {
    expect(new MasterCSS(customConfig).create('font:16')).toBeUndefined()
    expect(new MasterCSS(customConfig).create('custom:16')?.text).toBe('.custom\\:16{font-size:1.6rem}')
})
