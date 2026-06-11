import { expect, test } from 'vitest'
import { resolveVariableNamespace } from '../../src/utils'

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

test.concurrent('resolves built-in and utility-derived namespaces', () => {
    expect(resolveVariableNamespace('--animation-fade')).toEqual({
        name: 'animation-fade',
        namespace: 'animation',
        key: 'fade'
    })
    expect(resolveVariableNamespace('--aspect-video')).toEqual({
        name: 'aspect-video',
        namespace: 'aspect',
        key: 'video'
    })
    expect(resolveVariableNamespace('--font-feature-tabular')).toEqual({
        name: 'font-feature-tabular',
        namespace: 'font-feature',
        key: 'tabular'
    })
    expect(resolveVariableNamespace('--delay-stagger')).toEqual({
        name: 'delay-stagger',
        namespace: 'delay',
        key: 'stagger'
    })
    expect(resolveVariableNamespace('--tracking-wide')).toEqual({
        name: 'tracking-wide',
        namespace: 'tracking',
        key: 'wide'
    })
    expect(resolveVariableNamespace('--leading-tight')).toEqual({
        name: 'leading-tight',
        namespace: 'leading',
        key: 'tight'
    })
    expect(resolveVariableNamespace('--radius-lg')).toEqual({
        name: 'radius-lg',
        namespace: 'radius',
        key: 'lg'
    })
    expect(resolveVariableNamespace('--breakpoint-md')).toEqual({
        name: 'breakpoint-md',
        namespace: 'breakpoint',
        key: 'md'
    })
    expect(resolveVariableNamespace('--container-md')).toEqual({
        name: 'container-md',
        namespace: 'container',
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

test.concurrent('does not resolve removed standalone namespaces', () => {
    expect(resolveVariableNamespace('--letter-spacing-wide')).toEqual({
        name: 'letter-spacing-wide',
        key: 'letter-spacing-wide'
    })
    expect(resolveVariableNamespace('--line-height-tight')).toEqual({
        name: 'line-height-tight',
        key: 'line-height-tight'
    })
    expect(resolveVariableNamespace('--border-radius-lg')).toEqual({
        name: 'border-radius-lg',
        namespace: 'border',
        key: 'radius-lg'
    })
    expect(resolveVariableNamespace('--box-shadow-md')).toEqual({
        name: 'box-shadow-md',
        key: 'box-shadow-md'
    })
    expect(resolveVariableNamespace('--text-size-lg')).toEqual({
        name: 'text-size-lg',
        key: 'text-size-lg'
    })
    expect(resolveVariableNamespace('--animation-duration-fast')).toEqual({
        name: 'animation-duration-fast',
        namespace: 'animation',
        key: 'duration-fast'
    })
    expect(resolveVariableNamespace('--transition-duration-fast')).toEqual({
        name: 'transition-duration-fast',
        namespace: 'transition',
        key: 'duration-fast'
    })
    expect(resolveVariableNamespace('--aspect-ratio-video')).toEqual({
        name: 'aspect-ratio-video',
        namespace: 'aspect',
        key: 'ratio-video'
    })
    expect(resolveVariableNamespace('--blur-sm')).toEqual({
        name: 'blur-sm',
        key: 'blur-sm'
    })
    expect(resolveVariableNamespace('--drop-shadow-soft')).toEqual({
        name: 'drop-shadow-soft',
        key: 'drop-shadow-soft'
    })
    expect(resolveVariableNamespace('--perspective-near')).toEqual({
        name: 'perspective-near',
        key: 'perspective-near'
    })
    expect(resolveVariableNamespace('--shadow-inset-sm')).toEqual({
        name: 'shadow-inset-sm',
        namespace: 'shadow',
        key: 'inset-sm'
    })
})
