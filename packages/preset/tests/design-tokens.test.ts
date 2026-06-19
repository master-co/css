import { describe, expect, test } from 'vitest'
import { createCSS } from '@master/css-engine'
import defaultPlanJSON from '../src/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

function findVariable(name: string) {
    return defaultPlan.variables?.find((variable) => variable.name === name)
}

const modeInvariantAliases = [
    ['shadow-card', 'shadow', '$shadow-sm', ['shadow-sm']],
    ['shadow-raised', 'shadow', '$shadow-md', ['shadow-md']],
    ['shadow-popover', 'shadow', '$shadow-lg', ['shadow-lg']],
    ['shadow-modal', 'shadow', '$shadow-xl', ['shadow-xl']],
    ['shadow-overlay', 'shadow', '$shadow-2xl', ['shadow-2xl']],
    ['color-accent', 'color', '$color-blue', ['color-blue']],
    ['color-accent-hover', 'color', '$color-blue-hover', ['color-blue-hover']],
    ['color-accent-pressed', 'color', '$color-blue-pressed', ['color-blue-pressed']],
    ['color-on-accent', 'color', '$color-on-blue', ['color-on-blue']],
    ['color-accent-surface', 'color', '$color-blue-surface', ['color-blue-surface']],
    ['color-accent-line', 'color', '$color-blue-line', ['color-blue-line']],
    ['color-text-accent', 'color-text', '$color-text-blue', ['color-text-blue']],
    ['color-focus', 'color', '$color-blue-focus', ['color-blue-focus']],
    ['color-selection', 'color', '$color-blue-selection', ['color-blue-selection']],
    ['color-on-selection', 'color', '$color-on-blue-selection', ['color-on-blue-selection']],
    ['color-success', 'color', '$color-green', ['color-green']],
    ['color-success-hover', 'color', '$color-green-hover', ['color-green-hover']],
    ['color-success-pressed', 'color', '$color-green-pressed', ['color-green-pressed']],
    ['color-on-success', 'color', '$color-on-green', ['color-on-green']],
    ['color-text-success', 'color-text', '$color-text-green', ['color-text-green']],
    ['color-success-surface', 'color', '$color-green-surface', ['color-green-surface']],
    ['color-success-line', 'color', '$color-green-line', ['color-green-line']],
    ['color-line-success', 'color-line', '$color-line-green', ['color-line-green']],
    ['color-warning', 'color', '$color-amber', ['color-amber']],
    ['color-warning-hover', 'color', '$color-amber-hover', ['color-amber-hover']],
    ['color-warning-pressed', 'color', '$color-amber-pressed', ['color-amber-pressed']],
    ['color-on-warning', 'color', '$color-on-amber', ['color-on-amber']],
    ['color-text-warning', 'color-text', '$color-text-amber', ['color-text-amber']],
    ['color-warning-surface', 'color', '$color-amber-surface', ['color-amber-surface']],
    ['color-warning-line', 'color', '$color-amber-line', ['color-amber-line']],
    ['color-line-warning', 'color-line', '$color-line-amber', ['color-line-amber']],
    ['color-danger', 'color', '$color-red', ['color-red']],
    ['color-danger-hover', 'color', '$color-red-hover', ['color-red-hover']],
    ['color-danger-pressed', 'color', '$color-red-pressed', ['color-red-pressed']],
    ['color-on-danger', 'color', '$color-on-red', ['color-on-red']],
    ['color-text-danger', 'color-text', '$color-text-red', ['color-text-red']],
    ['color-danger-surface', 'color', '$color-red-surface', ['color-red-surface']],
    ['color-danger-line', 'color', '$color-red-line', ['color-red-line']],
    ['color-line-danger', 'color-line', '$color-line-red', ['color-line-red']],
    ['color-info', 'color', '$color-cyan', ['color-cyan']],
    ['color-info-hover', 'color', '$color-cyan-hover', ['color-cyan-hover']],
    ['color-info-pressed', 'color', '$color-cyan-pressed', ['color-cyan-pressed']],
    ['color-on-info', 'color', '$color-on-cyan', ['color-on-cyan']],
    ['color-text-info', 'color-text', '$color-text-cyan', ['color-text-cyan']],
    ['color-info-surface', 'color', '$color-cyan-surface', ['color-cyan-surface']],
    ['color-info-line', 'color', '$color-cyan-line', ['color-cyan-line']],
    ['color-line-info', 'color-line', '$color-line-cyan', ['color-line-cyan']]
] as const

const hueAliases = [
    'stone',
    'gray',
    'neutral',
    'slate',
    'brown',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'beryl',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'crimson',
    'red'
] as const

const primaryOnColorAliases = [
    'color-on-sky',
    'color-on-blue',
    'color-on-indigo',
    'color-on-violet',
    'color-on-purple',
    'color-on-fuchsia',
    'color-on-pink',
    'color-on-crimson',
    'color-on-red'
] as const

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
        expect(findVariable('spacing-card')).toMatchObject({
            namespace: 'spacing',
            key: 'card',
            type: 'number',
            value: '1.5rem',
            numeric: { value: 1.5, unit: 'rem' }
        })
        expect(findVariable('radius-card')).toMatchObject({
            namespace: 'radius',
            key: 'card',
            type: 'number',
            value: '.75rem',
            numeric: { value: 0.75, unit: 'rem' }
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
        expect(findVariable('animate-fade')).toMatchObject({
            namespace: 'animate',
            key: 'fade',
            type: 'string'
        })
        expect(findVariable('animation-fade')).toBeUndefined()
    })

    test('publishes palette aliases and product role tokens without legacy names', () => {
        expect(findVariable('color-canvas')).toMatchObject({
            namespace: 'color',
            key: 'canvas',
            modes: expect.objectContaining({
                light: expect.objectContaining({ value: '$color-neutral-0' }),
                dark: expect.objectContaining({ value: '$color-gray-100' })
            })
        })
        expect(findVariable('color-blue')).toMatchObject({
            namespace: 'color',
            key: 'blue'
        })
        expect(findVariable('color-blue-hover')).toMatchObject({
            namespace: 'color',
            key: 'blue-hover'
        })
        expect(findVariable('color-blue-pressed')).toMatchObject({
            namespace: 'color',
            key: 'blue-pressed'
        })
        expect(findVariable('color-on-blue')).toMatchObject({
            namespace: 'color',
            key: 'on-blue'
        })
        expect(findVariable('color-text-blue')).toMatchObject({
            namespace: 'color-text',
            key: 'blue'
        })
        expect(findVariable('color-text-muted')).toMatchObject({
            namespace: 'color-text',
            key: 'muted'
        })
        expect(findVariable('color-line-subtle')).toMatchObject({
            namespace: 'color-line',
            key: 'subtle'
        })
        expect(findVariable('color-accent')).toMatchObject({
            namespace: 'color',
            key: 'accent'
        })
        expect(findVariable('color-success-surface')).toMatchObject({
            namespace: 'color',
            key: 'success-surface'
        })
        expect(findVariable('shadow-card')).toMatchObject({
            namespace: 'shadow',
            key: 'card'
        })

        expect(findVariable('color-blue-active')).toBeUndefined()
        expect(findVariable('color-blue-text')).toBeUndefined()
        expect(findVariable('color-text-lightest')).toBeUndefined()
        expect(findVariable('color-line-lightest')).toBeUndefined()
        expect(findVariable('color-grey-50')).toBeUndefined()
        expect(findVariable('color-neutral-50')).toBeDefined()
    })

    test('publishes mode-invariant aliases as base token dependencies', () => {
        for (const [name, namespace, value, dependencies] of modeInvariantAliases) {
            const variable = findVariable(name)
            expect(variable).toMatchObject({
                namespace,
                key: name.slice(namespace.length + 1),
                type: 'string',
                value,
                dependencies
            })
            expect(variable).not.toHaveProperty('modes')
        }
    })

    test('keeps primary on-color aliases mode-specific', () => {
        for (const name of primaryOnColorAliases) {
            const variable = findVariable(name)
            expect(variable).toMatchObject({
                namespace: 'color',
                key: name.slice('color-'.length),
                type: 'string',
                modes: {
                    light: { type: 'string', value: '$color-white' },
                    dark: { type: 'string', value: '$color-white' }
                },
                dependencies: ['color-white']
            })
            expect(variable).not.toHaveProperty('value')
        }
    })

    test('publishes hue surface, line, focus, and selection aliases as mode-specific', () => {
        for (const hue of hueAliases) {
            const hueRoleAliases: [string, string, string, string, string[]][] = [
                [`color-${hue}-surface`, 'color', `$color-${hue}-5`, `$color-${hue}-95`, [`color-${hue}-5`, `color-${hue}-95`]],
                [`color-${hue}-line`, 'color', `$color-${hue}-30`, `$color-${hue}-80`, [`color-${hue}-30`, `color-${hue}-80`]],
                [`color-line-${hue}`, 'color-line', `$color-${hue}-30`, `$color-${hue}-80`, [`color-${hue}-30`, `color-${hue}-80`]],
                [`color-${hue}-focus`, 'color', `$color-${hue}-60`, `$color-${hue}-40`, [`color-${hue}-60`, `color-${hue}-40`]],
                [`color-${hue}-selection`, 'color', `$color-${hue}-10`, `$color-${hue}-90`, [`color-${hue}-10`, `color-${hue}-90`]],
                [`color-on-${hue}-selection`, 'color', `$color-${hue}-90`, `$color-${hue}-10`, [`color-${hue}-90`, `color-${hue}-10`]]
            ]

            for (const [name, namespace, lightValue, darkValue, dependencies] of hueRoleAliases) {
                const variable = findVariable(name)
                expect(variable).toMatchObject({
                    namespace,
                    key: name.slice(namespace.length + 1),
                    type: 'string',
                    modes: {
                        light: { type: 'string', value: lightValue },
                        dark: { type: 'string', value: darkValue }
                    },
                    dependencies
                })
                expect(variable).not.toHaveProperty('value')
            }
        }
    })

    test('publishes interactive and status semantic roles as base hue dependencies', () => {
        for (const [name, namespace, value, dependencies] of modeInvariantAliases.filter(([name]) => (
            name.startsWith('color-accent')
            || name === 'color-text-accent'
            || name === 'color-focus'
            || name === 'color-selection'
            || name === 'color-on-selection'
            || name.includes('success')
            || name.includes('warning')
            || name.includes('danger')
            || name.includes('info')
        ))) {
            const variable = findVariable(name)
            expect(variable).toMatchObject({
                namespace,
                key: name.slice(namespace.length + 1),
                type: 'string',
                value,
                dependencies
            })
            expect(variable).not.toHaveProperty('modes')
        }
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
        expect(Object.hasOwn(defaultPlan, 'variableNamespaces')).toBe(false)
        expect(Object.hasOwn(defaultPlan, 'variableAliasSets')).toBe(false)
    })

    test('executes built-in registry records without authoring config', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('font:sans')?.text).toContain('font-family:var(--font-family-sans)')
        expect(css.create('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
        expect(css.create('m:md')?.text).toContain('margin:var(--spacing-md)')
        expect(css.create('p:card')?.text).toContain('padding:var(--spacing-card)')
        expect(css.create('r:lg')?.text).toContain('border-radius:var(--radius-lg)')
        expect(css.create('r:card')?.text).toContain('border-radius:var(--radius-card)')
        expect(css.create('fg:muted')?.text).toContain('color:var(--color-text-muted)')
        expect(css.create('fg:on-blue')?.text).toContain('color:var(--color-on-blue)')
        expect(css.create('fg:on-warning')?.text).toContain('color:var(--color-on-warning)')
        expect(css.create('bg:blue-hover')?.text).toContain('background-color:var(--color-blue-hover)')
        expect(css.create('bg:accent')?.text).toContain('background-color:var(--color-accent)')
        expect(css.create('bg:accent-surface')?.text).toContain('background-color:var(--color-accent-surface)')
        expect(css.create('outline:focus')?.text).toContain('outline-color:var(--color-focus)')
        expect(css.create('bg:selection')?.text).toContain('background-color:var(--color-selection)')
        expect(css.create('fg:on-selection')?.text).toContain('color:var(--color-on-selection)')
        expect(css.create('bg:success-surface')?.text).toContain('background-color:var(--color-success-surface)')
        expect(css.create('b:subtle')?.text).toContain('border-color:var(--color-line-subtle)')
        expect(css.create('b:success')?.text).toContain('border-color:var(--color-line-success)')
        expect(css.create('b:blue')?.text).toContain('border-color:var(--color-line-blue)')
        expect(css.create('shadow:card')?.text).toContain('box-shadow:var(--shadow-card)')
        expect(css.create('w:sm')?.text).toContain('width:var(--container-sm)')
        expect(css.create('animate:fade')?.text).toContain('animation:var(--animate-fade)')
        expect(css.text).not.toContain('null')
    })
})
