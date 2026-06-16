import { describe, expect, test } from 'vitest'
import { createCSS } from '@master/css-engine'
import defaultPlan from '../src/default-plan'

function findVariable(name: string) {
    return defaultPlan.variables?.find((variable) => variable.name === name)
}

describe.concurrent('@master/css-preset design token parity', () => {
    test('keeps core font, spacing, breakpoint, container, and animation tokens in defaultPlan', () => {
        expect(findVariable('font-family-sans')).toMatchObject({
            namespace: 'font-family',
            key: 'sans',
            type: 'string'
        })
        expect(findVariable('font-size-2xl')).toMatchObject({
            namespace: 'font-size',
            key: '2xl',
            type: 'number',
            value: '1.5rem',
            numeric: { value: 1.5, unit: 'rem' }
        })
        expect(findVariable('radius-lg')).toMatchObject({
            namespace: 'radius',
            key: 'lg',
            type: 'number',
            value: '.5rem',
            numeric: { value: 0.5, unit: 'rem' }
        })
        expect(findVariable('spacing-md')).toMatchObject({
            namespace: 'spacing',
            key: 'md',
            type: 'number',
            value: '1rem',
            numeric: { value: 1, unit: 'rem' }
        })
        expect(findVariable('breakpoint-sm')).toMatchObject({
            namespace: 'breakpoint',
            key: 'sm',
            type: 'number',
            value: '52.125rem',
            numeric: { value: 52.125, unit: 'rem' }
        })
        expect(findVariable('container-sm')).toMatchObject({
            namespace: 'container',
            key: 'sm',
            type: 'number',
            value: '24rem',
            numeric: { value: 24, unit: 'rem' }
        })
        expect(findVariable('animation-fade')).toMatchObject({
            namespace: 'animation',
            key: 'fade',
            type: 'string'
        })
    })

    test('precomputes default breakpoint and container at-rule aliases', () => {
        expect(defaultPlan.breakpointAtRules?.sm).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
        })
        expect(defaultPlan.containerAtRules?.sm).toMatchObject({
            id: 'container',
            nodes: [expect.objectContaining({ type: 'number', value: 24, unit: 'rem' })]
        })
    })

    test('does not publish synthetic negative number tokens', () => {
        expect(defaultPlan.variables?.filter((variable) => variable.type === 'number' && variable.name?.startsWith('-'))).toEqual([])
        expect(defaultPlan.variableNamespaces?.['=breakpoint']?.some(([key]) => key.startsWith('-'))).toBe(false)
        expect(defaultPlan.variableNamespaces?.['=container']?.some(([key]) => key.startsWith('-'))).toBe(false)
        expect(defaultPlan.variableNamespaces?.['=spacing']?.some(([key]) => key.startsWith('-'))).toBe(false)
    })

    test('executes built-in registry records without authoring config', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('font:sans')?.text).toContain('font-family:var(--font-family-sans)')
        expect(css.create('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
        expect(css.create('m:md')?.text).toContain('margin:var(--spacing-md)')
        expect(css.create('r:lg')?.text).toContain('border-radius:var(--radius-lg)')
        expect(css.create('w:sm')?.text).toContain('width:var(--container-sm)')
        expect(css.create('animation:fade')?.text).toContain('animation:var(--animation-fade)')
        expect(css.text).not.toContain('null')
    })
})
