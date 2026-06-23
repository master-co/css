import { describe, expect, test } from 'vitest'
import { MasterCSS } from '@master/css-engine'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import {
    flattenMasterCSSManifestVariables,
    groupMasterCSSManifestVariables,
    type MasterCSSManifest
} from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createTestCSS(manifest: MasterCSSManifest) {
    return MasterCSS.create({ manifest })
}

function findVariable(name: string) {
    return flattenMasterCSSManifestVariables(defaultManifest.variables).find((variable) => variable.name === name)
}

const removedVariableNames = [
    'font-sans',
    'spacing-field',
    'spacing-control',
    'spacing-card',
    'spacing-panel',
    'spacing-section',
    'spacing-page',
    'radius-control',
    'radius-card',
    'radius-panel',
    'duration-instant',
    'duration-quick',
    'easing-standard',
    'easing-enter',
    'easing-exit',
    'easing-emphasized',
    'shadow-card',
    'shadow-popover',
    'color-canvas',
    'color-surface',
    'color-surface-overlay',
    'color-backdrop',
    'color-blue-hover',
    'color-on-blue',
    'color-blue-surface',
    'color-blue-line',
    'color-line-blue',
    'color-blue-focus',
    'color-blue-selection',
    'color-accent',
    'color-focus',
    'color-selection',
    'color-text',
    'color-text-strong',
    'color-text-muted',
    'color-text-subtle',
    'color-text-disabled',
    'color-text-placeholder',
    'color-text-link',
    'color-text-link-hover',
    'color-text-inverse',
    'color-line',
    'color-line-strong',
    'color-line-muted',
    'color-line-subtle',
    'color-success',
    'color-text-success',
    'color-line-success',
    'color-warning',
    'color-danger',
    'color-info'
] as const

const baseHueAliases = [
    ['stone', '$color-stone-30', '$color-stone-40'],
    ['gray', '$color-gray-30', '$color-gray-40'],
    ['neutral', '$color-neutral-30', '$color-neutral-40'],
    ['slate', '$color-slate-30', '$color-slate-40'],
    ['brown', '$color-brown-40', '$color-brown-50'],
    ['orange', '$color-orange-40', '$color-orange-50'],
    ['amber', '$color-amber-40', '$color-amber-50'],
    ['yellow', '$color-yellow-40', '$color-yellow-50'],
    ['lime', '$color-lime-40', '$color-lime-50'],
    ['green', '$color-green-40', '$color-green-50'],
    ['beryl', '$color-beryl-40', '$color-beryl-50'],
    ['teal', '$color-teal-40', '$color-teal-50'],
    ['cyan', '$color-cyan-40', '$color-cyan-50'],
    ['sky', '$color-sky-60', '$color-sky-50'],
    ['blue', '$color-blue-60', '$color-blue-50'],
    ['indigo', '$color-indigo-60', '$color-indigo-50'],
    ['violet', '$color-violet-60', '$color-violet-50'],
    ['purple', '$color-purple-60', '$color-purple-50'],
    ['fuchsia', '$color-fuchsia-60', '$color-fuchsia-50'],
    ['pink', '$color-pink-60', '$color-pink-50'],
    ['crimson', '$color-crimson-60', '$color-crimson-50'],
    ['red', '$color-red-60', '$color-red-50']
] as const

const textHueAliases = [
    ['stone', '$color-stone-60', '$color-stone-30'],
    ['gray', '$color-gray-60', '$color-gray-30'],
    ['neutral', '$color-neutral-60', '$color-neutral-30'],
    ['slate', '$color-slate-60', '$color-slate-30'],
    ['brown', '$color-brown-60', '$color-brown-30'],
    ['orange', '$color-orange-60', '$color-orange-30'],
    ['amber', '$color-amber-60', '$color-amber-40'],
    ['yellow', '$color-yellow-70', '$color-yellow-40'],
    ['lime', '$color-lime-70', '$color-lime-40'],
    ['green', '$color-green-70', '$color-green-40'],
    ['beryl', '$color-beryl-70', '$color-beryl-40'],
    ['teal', '$color-teal-70', '$color-teal-40'],
    ['cyan', '$color-cyan-70', '$color-cyan-40'],
    ['sky', '$color-sky-70', '$color-sky-30'],
    ['blue', '$color-blue-60', '$color-blue-30'],
    ['indigo', '$color-indigo-60', '$color-indigo-30'],
    ['violet', '$color-violet-60', '$color-violet-30'],
    ['purple', '$color-purple-60', '$color-purple-30'],
    ['fuchsia', '$color-fuchsia-60', '$color-fuchsia-30'],
    ['pink', '$color-pink-60', '$color-pink-30'],
    ['crimson', '$color-crimson-60', '$color-crimson-30'],
    ['red', '$color-red-60', '$color-red-30']
] as const

describe.concurrent('@master/css-preset design token parity', () => {
    test('keeps primitive font, spacing, radius, breakpoint, container, color, shadow, and motion tokens', () => {
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
        expect(findVariable('duration-fast')).toMatchObject({
            namespace: 'duration',
            key: 'fast'
        })
        expect(findVariable('easing-smooth')).toMatchObject({
            namespace: 'easing',
            key: 'smooth',
            type: 'string'
        })
        expect(findVariable('animate-fade')).toMatchObject({
            namespace: 'animate',
            key: 'fade',
            type: 'string',
            value: 'fade 1s infinite'
        })
        expect(defaultManifest.animations).toMatchObject({
            fade: expect.objectContaining({
                '0%': expect.objectContaining({ opacity: '0' }),
                to: expect.objectContaining({ opacity: '1' })
            })
        })
        expect(findVariable('color-blue-60')).toMatchObject({
            namespace: 'color',
            key: 'blue-60'
        })
        expect(findVariable('shadow-sm')).toMatchObject({
            namespace: 'shadow',
            key: 'sm',
            type: 'string',
            modes: expect.objectContaining({
                light: expect.objectContaining({ type: 'string' }),
                dark: expect.objectContaining({ type: 'string' })
            })
        })
    })

    test('removes UI, product, text role, and expanded hue role tokens from the default preset', () => {
        for (const name of removedVariableNames) {
            expect(findVariable(name), name).toBeUndefined()
        }
    })

    test('keeps base hue aliases mode-specific without expanded hue aliases', () => {
        for (const [hue, lightValue, darkValue] of baseHueAliases) {
            expect(findVariable(`color-${hue}`), hue).toMatchObject({
                namespace: 'color',
                key: hue,
                type: 'string',
                modes: {
                    light: { type: 'string', value: lightValue },
                    dark: { type: 'string', value: darkValue }
                },
                dependencies: [lightValue.slice(1), darkValue.slice(1)]
            })
        }

        for (const [hue, lightValue, darkValue] of textHueAliases) {
            expect(findVariable(`color-text-${hue}`), hue).toMatchObject({
                namespace: 'color-text',
                key: hue,
                type: 'string',
                modes: {
                    light: { type: 'string', value: lightValue },
                    dark: { type: 'string', value: darkValue }
                },
                dependencies: [lightValue.slice(1), darkValue.slice(1)]
            })
        }
    })

    test('precomputes default breakpoint and container at-rule aliases', () => {
        expect(defaultManifest.breakpointAtRules?.sm).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
        })
        expect(defaultManifest.containerAtRules?.sm).toMatchObject({
            id: 'container',
            nodes: [expect.objectContaining({ type: 'number', value: 24, unit: 'rem' })]
        })
    })

    test('does not publish synthetic negative number tokens', () => {
        expect(flattenMasterCSSManifestVariables(defaultManifest.variables)
            .filter((variable) => variable.type === 'number' && variable.name?.startsWith('-'))).toEqual([])
        expect(Object.hasOwn(defaultManifest, 'variableNamespaces')).toBe(false)
        expect(Object.hasOwn(defaultManifest, 'variableAliasSets')).toBe(false)
    })

    test('executes built-in registry records without UI role tokens', () => {
        const css = createTestCSS(defaultManifest)

        expect(css.createRule('font:sans')?.text).toContain('font-family:var(--font-family-sans)')
        expect(css.createRule('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
        expect(css.createRule('m:md')?.text).toContain('margin:var(--spacing-md)')
        expect(css.createRule('r:lg')?.text).toContain('border-radius:var(--radius-lg)')
        expect(css.createRule('text:inverse')).toBeUndefined()
        expect(css.createRule('text:muted')).toBeUndefined()
        expect(css.createRule('bg:line')).toBeUndefined()
        expect(css.createRule('fg:muted')?.text).not.toContain('var(--color-text-muted)')
        expect(css.createRule('b:subtle')?.text).not.toContain('var(--color-line-subtle)')
        expect(css.createRule('bg:blue-60')?.text).toContain('background-color:var(--color-blue-60)')
        expect(css.createRule('shadow:sm')?.text).toContain('box-shadow:var(--shadow-sm)')
        expect(css.createRule('w:sm')?.text).toContain('width:var(--container-sm)')
        expect(css.createRule('transition-duration:fast')?.text).toContain('transition-duration:var(--duration-fast)')
        expect(css.createRule('transition-timing-function:smooth')?.text).toContain('transition-timing-function:var(--easing-smooth)')
        expect(css.createRule('bg:blue')?.text).toContain('background-color:var(--color-blue)')
        expect(css.createRule('bg:pink')?.text).toContain('background-color:var(--color-pink)')
        expect(css.createRule('fg:red')?.text).toBe('.fg\\:red{color:var(--color-red)}')
        expect(css.createRule('text:blue')?.text).toBe('.text\\:blue{color:var(--color-text-blue)}')
        expect(css.createRule('text:blue-60')?.text).toBe('.text\\:blue-60{color:var(--color-blue-60)}')
        expect(css.createRule('text-fill-color:text-pink')?.text).toBe('.text-fill-color\\:text-pink{-webkit-text-fill-color:var(--color-text-pink)}')
        expect(css.createRule('animate:fade')?.text).toContain('animation:var(--animate-fade)')
        expect(css.createRule('bg:accent')).toBeUndefined()
        expect(css.createRule('fg:on-blue')?.text).not.toContain('var(--color-on-blue)')
        expect(css.createRule('b:line-blue')?.text).not.toContain('var(--color-line-blue)')
        expect(css.createRule('bg:blue-surface')).toBeUndefined()
        expect(css.text).not.toContain('null')
    })

    test('keeps project text and line role namespaces available', () => {
        const manifest = JSON.parse(JSON.stringify(defaultManifest)) as MasterCSSManifest
        manifest.variables = groupMasterCSSManifestVariables([
            ...flattenMasterCSSManifestVariables(manifest.variables),
            {
                name: 'color-text-body',
                key: 'body',
                namespace: 'color-text',
                type: 'string',
                value: '#111'
            },
            {
                name: 'color-line-divider',
                key: 'divider',
                namespace: 'color-line',
                type: 'string',
                value: '#ddd'
            }
        ])

        const css = createTestCSS(manifest)

        expect(css.createRule('text:body')?.text).toBe('.text\\:body{color:var(--color-text-body)}')
        expect(css.createRule('border-color:divider')?.text).toBe('.border-color\\:divider{border-color:var(--color-line-divider)}')
        expect(css.createRule('b:1px|solid|divider')?.text).toBe('.b\\:1px\\|solid\\|divider{border:1px solid var(--color-line-divider)}')
        expect(css.createRule('outline:1px|solid|divider')?.text).toBe('.outline\\:1px\\|solid\\|divider{outline:1px solid var(--color-line-divider)}')
    })
})
