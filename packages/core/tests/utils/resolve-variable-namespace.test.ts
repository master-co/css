import { expect, test } from 'vitest'
import { resolveVariableNamespace } from '../../src'

test.concurrent('resolves variable namespace prefixes by longest match', () => {
    expect(resolveVariableNamespace('--color-line-lightest')).toEqual({
        name: 'color-line-lightest',
        namespace: 'color-line',
        key: 'lightest'
    })
    expect(resolveVariableNamespace('--color-text-strong')).toEqual({
        name: 'color-text-strong',
        namespace: 'color-text',
        key: 'strong'
    })
    expect(resolveVariableNamespace('--color-blue-50')).toEqual({
        name: 'color-blue-50',
        namespace: 'color',
        key: 'blue-50'
    })
})
