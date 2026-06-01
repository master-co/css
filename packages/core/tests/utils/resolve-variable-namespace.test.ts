import { expect, test } from 'vitest'
import variableNamespaces from '../../src/variable-namespaces'
import { resolveVariableNamespace } from '../../src/utils'

test.concurrent('exports canonical Master CSS variable namespaces', () => {
    expect(variableNamespaces).toEqual([
        'animation',
        'aspect-ratio',
        'blur',
        'border-radius',
        'color',
        'color-line',
        'color-text',
        'drop-shadow',
        'duration',
        'easing',
        'font-family',
        'font-size',
        'font-style',
        'font-variant',
        'font-weight',
        'letter-spacing',
        'line-height',
        'outline-color',
        'outline-offset',
        'outline-style',
        'outline-width',
        'perspective',
        'screen',
        'shadow',
        'shadow-inset',
        'spacing',
        'tab-size',
        'zoom',
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

test.concurrent('resolves Master CSS namespaces', () => {
    expect(resolveVariableNamespace('--animation-fade')).toEqual({
        name: 'animation-fade',
        namespace: 'animation',
        key: 'fade'
    })
    expect(resolveVariableNamespace('--aspect-ratio-video')).toEqual({
        name: 'aspect-ratio-video',
        namespace: 'aspect-ratio',
        key: 'video'
    })
    expect(resolveVariableNamespace('--letter-spacing-wide')).toEqual({
        name: 'letter-spacing-wide',
        namespace: 'letter-spacing',
        key: 'wide'
    })
    expect(resolveVariableNamespace('--line-height-tight')).toEqual({
        name: 'line-height-tight',
        namespace: 'line-height',
        key: 'tight'
    })
    expect(resolveVariableNamespace('--shadow-inset-sm')).toEqual({
        name: 'shadow-inset-sm',
        namespace: 'shadow-inset',
        key: 'sm'
    })
    expect(resolveVariableNamespace('--screen-md')).toEqual({
        name: 'screen-md',
        namespace: 'screen',
        key: 'md'
    })
    expect(resolveVariableNamespace('--tab-size-github')).toEqual({
        name: 'tab-size-github',
        namespace: 'tab-size',
        key: 'github'
    })
    expect(resolveVariableNamespace('--zoom-compact')).toEqual({
        name: 'zoom-compact',
        namespace: 'zoom',
        key: 'compact'
    })
})
