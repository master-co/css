import { expect, test } from 'vitest'
import variableNamespaces from '../../src/variable-namespaces'
import { resolveVariableNamespace } from '../../src/utils'

test.concurrent('exports only explicit utility variable namespaces', () => {
    expect(variableNamespaces).toEqual([
        'border-radius',
        'color',
        'color-line',
        'color-text',
        'duration',
        'easing',
        'font-family',
        'font-size',
        'font-style',
        'font-variant',
        'font-weight',
        'outline-color',
        'outline-offset',
        'outline-style',
        'outline-width',
        'shadow',
        'spacing',
    ])
})

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

test.concurrent('resolves implicit utility namespaces', () => {
    expect(resolveVariableNamespace('--letter-spacing-wide')).toEqual({
        name: 'letter-spacing-wide',
        namespace: 'letter-spacing',
        key: 'wide'
    })
    expect(resolveVariableNamespace('--screen-md')).toEqual({
        name: 'screen-md',
        namespace: 'screen',
        key: 'md'
    })
})
