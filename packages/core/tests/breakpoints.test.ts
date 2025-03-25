import { it, test, expect } from 'vitest'
import { MasterCSS } from '../src'

test.concurrent('at components', () => {
    const rule = new MasterCSS().create('block@sm&<md')
    expect(rule?.mediaAtComponents).toEqual([
        {
            'name': 'min-width',
            'type': 'feature',
            'unit': 'px',
            'value': 834,
            'valueType': 'number',
        },
        {
            'token': '&',
            'type': 'operator',
            'value': 'and',
        },
        {
            'name': 'max-width',
            'type': 'feature',
            'unit': 'px',
            'value': 1023.98,
            'valueType': 'number',
        },
    ])
    expect(rule?.text).toContain('(min-width:834px) and (max-width:1023.98px)')
})