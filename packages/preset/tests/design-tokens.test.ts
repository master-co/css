import { describe, expect, test } from 'vitest'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import { createTestCSS } from './helpers/rust-engine'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function findVariable(name: string) {
  return flattenMasterCSSManifestVariables(defaultManifest.variables).find((variable) => variable.name === name)
}

function varDependencyName(value: string) {
  return value.match(/^var\(--([A-Za-z0-9_-]+)\)$/)?.[1]
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
  'color-line',
  'color-success',
  'color-text-success',
  'color-line-success',
  'color-warning',
  'color-danger',
  'color-info'
] as const

const textRoleAliases = [
  ['body', 'var(--color-neutral-70)', 'var(--color-gray-30)'],
  ['strong', 'var(--color-neutral-100)', 'var(--color-white)'],
  ['muted', 'var(--color-neutral-60)', 'var(--color-gray-40)'],
  ['subtle', 'var(--color-neutral-50)', 'var(--color-gray-50)'],
  ['disabled', 'var(--color-neutral-40)', 'var(--color-gray-60)'],
  ['placeholder', 'var(--color-neutral-40)', 'var(--color-gray-60)'],
  ['inverse', 'var(--color-white)', 'var(--color-black)'],
  ['link', 'var(--color-blue-60)', 'var(--color-blue-30)'],
  ['link-hover', 'var(--color-blue-70)', 'var(--color-blue-20)']
] as const

const lineRoleAliases = [
  ['color-line-base', 'color-line', 'base', 'oklch(0% 0 none / .12)', 'oklch(100% 0 none / .12)'],
  ['color-line-strong', 'color-line', 'strong', 'oklch(0% 0 none / .18)', 'oklch(100% 0 none / .18)'],
  ['color-line-muted', 'color-line', 'muted', 'oklch(0% 0 none / .09)', 'oklch(100% 0 none / .09)'],
  ['color-line-subtle', 'color-line', 'subtle', 'oklch(0% 0 none / .06)', 'oklch(100% 0 none / .06)']
] as const

const lightShadowEdges = [
  ['xs', '.04'],
  ['sm', '.04'],
  ['md', '.05'],
  ['lg', '.05'],
  ['xl', '.06'],
  ['2xl', '.06']
] as const

const darkShadowEdges = [
  ['xs', '.04'],
  ['sm', '.05'],
  ['md', '.06'],
  ['lg', '.06'],
  ['xl', '.07'],
  ['2xl', '.07']
] as const

const baseHueAliases = [
  ['stone', 'var(--color-stone-30)', 'var(--color-stone-40)'],
  ['gray', 'var(--color-gray-30)', 'var(--color-gray-40)'],
  ['neutral', 'var(--color-neutral-30)', 'var(--color-neutral-40)'],
  ['slate', 'var(--color-slate-30)', 'var(--color-slate-40)'],
  ['brown', 'var(--color-brown-40)', 'var(--color-brown-50)'],
  ['orange', 'var(--color-orange-40)', 'var(--color-orange-50)'],
  ['amber', 'var(--color-amber-40)', 'var(--color-amber-50)'],
  ['yellow', 'var(--color-yellow-40)', 'var(--color-yellow-50)'],
  ['lime', 'var(--color-lime-40)', 'var(--color-lime-50)'],
  ['green', 'var(--color-green-40)', 'var(--color-green-50)'],
  ['beryl', 'var(--color-beryl-40)', 'var(--color-beryl-50)'],
  ['teal', 'var(--color-teal-40)', 'var(--color-teal-50)'],
  ['cyan', 'var(--color-cyan-40)', 'var(--color-cyan-50)'],
  ['sky', 'var(--color-sky-60)', 'var(--color-sky-50)'],
  ['blue', 'var(--color-blue-60)', 'var(--color-blue-50)'],
  ['indigo', 'var(--color-indigo-60)', 'var(--color-indigo-50)'],
  ['violet', 'var(--color-violet-60)', 'var(--color-violet-50)'],
  ['purple', 'var(--color-purple-60)', 'var(--color-purple-50)'],
  ['fuchsia', 'var(--color-fuchsia-60)', 'var(--color-fuchsia-50)'],
  ['pink', 'var(--color-pink-60)', 'var(--color-pink-50)'],
  ['crimson', 'var(--color-crimson-60)', 'var(--color-crimson-50)'],
  ['red', 'var(--color-red-60)', 'var(--color-red-50)']
] as const

const textHueAliases = [
  ['stone', 'var(--color-stone-60)', 'var(--color-stone-30)'],
  ['gray', 'var(--color-gray-60)', 'var(--color-gray-30)'],
  ['neutral', 'var(--color-neutral-60)', 'var(--color-neutral-30)'],
  ['slate', 'var(--color-slate-60)', 'var(--color-slate-30)'],
  ['brown', 'var(--color-brown-60)', 'var(--color-brown-30)'],
  ['orange', 'var(--color-orange-60)', 'var(--color-orange-30)'],
  ['amber', 'var(--color-amber-60)', 'var(--color-amber-40)'],
  ['yellow', 'var(--color-yellow-70)', 'var(--color-yellow-40)'],
  ['lime', 'var(--color-lime-70)', 'var(--color-lime-40)'],
  ['green', 'var(--color-green-70)', 'var(--color-green-40)'],
  ['beryl', 'var(--color-beryl-70)', 'var(--color-beryl-40)'],
  ['teal', 'var(--color-teal-70)', 'var(--color-teal-40)'],
  ['cyan', 'var(--color-cyan-70)', 'var(--color-cyan-40)'],
  ['sky', 'var(--color-sky-70)', 'var(--color-sky-30)'],
  ['blue', 'var(--color-blue-60)', 'var(--color-blue-30)'],
  ['indigo', 'var(--color-indigo-60)', 'var(--color-indigo-30)'],
  ['violet', 'var(--color-violet-60)', 'var(--color-violet-30)'],
  ['purple', 'var(--color-purple-60)', 'var(--color-purple-30)'],
  ['fuchsia', 'var(--color-fuchsia-60)', 'var(--color-fuchsia-30)'],
  ['pink', 'var(--color-pink-60)', 'var(--color-pink-30)'],
  ['crimson', 'var(--color-crimson-60)', 'var(--color-crimson-30)'],
  ['red', 'var(--color-red-60)', 'var(--color-red-30)']
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

  test('removes canvas, product, and expanded hue role tokens from the default preset', () => {
    for (const name of removedVariableNames) {
      expect(findVariable(name), name).toBeUndefined()
    }
  })

  test('keeps surface color roles mode-specific', () => {
    const surfaceAliases = [
      ['base', 'var(--color-neutral-0)', 'var(--color-gray-95)'],
      ['muted', 'var(--color-neutral-5)', 'var(--color-gray-100)'],
      ['raised', 'var(--color-white)', 'var(--color-gray-90)'],
      ['overlay', 'var(--color-white)', 'var(--color-gray-80)'],
      ['inverse', 'var(--color-black)', 'var(--color-white)']
    ] as const

    for (const [key, lightValue, darkValue] of surfaceAliases) {
      expect(findVariable(`color-surface-${key}`), key).toMatchObject({
        namespace: 'color-surface',
        key,
        type: 'string',
        modes: {
          light: { type: 'string', value: lightValue },
          dark: { type: 'string', value: darkValue }
        },
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }
  })

  test('keeps shadow tokens separated with subtle mode-specific edges', () => {
    for (const [key, opacity] of lightShadowEdges) {
      expect(findVariable(`shadow-${key}`), key).toMatchObject({
        namespace: 'shadow',
        key,
        type: 'string',
        modes: {
          light: expect.objectContaining({
            value: expect.stringMatching(new RegExp(`^0 0 0 1px oklch\\(0% 0 none / \\${opacity}\\), `))
          })
        }
      })
    }

    for (const [key, opacity] of darkShadowEdges) {
      expect(findVariable(`shadow-${key}`), key).toMatchObject({
        namespace: 'shadow',
        key,
        type: 'string',
        modes: {
          dark: expect.objectContaining({
            value: expect.stringMatching(new RegExp(`^0 0 0 1px oklch\\(100% 0 none / \\${opacity}\\), `))
          })
        }
      })
    }
  })

  test('keeps base hue, line role, text role, and text hue aliases mode-specific', () => {
    for (const [hue, lightValue, darkValue] of baseHueAliases) {
      expect(findVariable(`color-${hue}`), hue).toMatchObject({
        namespace: 'color',
        key: hue,
        type: 'string',
        modes: {
          light: { type: 'string', value: lightValue },
          dark: { type: 'string', value: darkValue }
        },
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }

    for (const [name, namespace, key, lightValue, darkValue] of lineRoleAliases) {
      expect(findVariable(name), name).toMatchObject({
        namespace,
        key,
        type: 'string',
        modes: {
          light: { type: 'string', value: lightValue },
          dark: { type: 'string', value: darkValue }
        }
      })
    }

    for (const [role, lightValue, darkValue] of textRoleAliases) {
      expect(findVariable(`color-text-${role}`), role).toMatchObject({
        namespace: 'color-text',
        key: role,
        type: 'string',
        modes: {
          light: { type: 'string', value: lightValue },
          dark: { type: 'string', value: darkValue }
        },
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
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
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }
  })

  test('precomputes default breakpoint and container at-rule aliases', () => {
    expect(defaultManifest.breakpointConditions?.sm).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
    })
    expect(defaultManifest.containerConditions?.sm).toMatchObject({
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

  test('executes built-in registry records with foundation role tokens only', () => {
    const css = createTestCSS(defaultManifest)
    const noNativeCSS = createTestCSS(defaultManifest, {
      nativeDeclarationMatcher: () => false
    })

    expect(css.createRule('font:sans')?.text).toContain('font-family:var(--font-family-sans)')
    expect(css.createRule('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
    expect(css.createRule('m:md')?.text).toContain('margin:var(--spacing-md)')
    expect(css.createRule('r:lg')?.text).toContain('border-radius:var(--radius-lg)')
    expect(css.createRule('text:body')?.text).toBe('.text\\:body{color:var(--color-text-body)}')
    expect(css.createRule('text:muted')?.text).toBe('.text\\:muted{color:var(--color-text-muted)}')
    expect(css.createRule('text:inverse')?.text).toBe('.text\\:inverse{color:var(--color-text-inverse)}')
    expect(css.createRule('text:link')?.text).toBe('.text\\:link{color:var(--color-text-link)}')
    expect(css.createRule('text:link-hover')?.text).toBe('.text\\:link-hover{color:var(--color-text-link-hover)}')
    expect(noNativeCSS.createRule('bg:line')).toBeUndefined()
    expect(noNativeCSS.createRule('bg:base')).toBeUndefined()
    expect(css.createRule('fg:muted')?.text).toBe('.fg\\:muted{color:var(--color-text-muted)}')
    expect(css.createRule('b:base')?.text).toBe('.b\\:base{border-color:var(--color-line-base)}')
    expect(css.createRule('b:1px|solid|base')?.text).toBe('.b\\:1px\\|solid\\|base{border:1px solid var(--color-line-base)}')
    expect(css.createRule('border-color:base')?.text).toBe('.border-color\\:base{border-color:var(--color-line-base)}')
    expect(css.createRule('outline:1px|solid|base')?.text).toBe('.outline\\:1px\\|solid\\|base{outline:1px solid var(--color-line-base)}')
    expect(css.createRule('stroke:base')?.text).toBe('.stroke\\:base{stroke:var(--color-line-base)}')
    expect(css.createRule('b:muted')?.text).toBe('.b\\:muted{border-color:var(--color-line-muted)}')
    expect(css.createRule('b:subtle')?.text).toBe('.b\\:subtle{border-color:var(--color-line-subtle)}')
    expect(css.createRule('outline:1px|solid|subtle')?.text).toBe('.outline\\:1px\\|solid\\|subtle{outline:1px solid var(--color-line-subtle)}')
    expect(css.createRule('bg:blue-60')?.text).toContain('background-color:var(--color-blue-60)')
    expect(css.createRule('shadow:sm')?.text).toContain('box-shadow:var(--shadow-sm)')
    expect(css.createRule('w:sm')?.text).toContain('width:var(--container-sm)')
    expect(css.createRule('transition-duration:fast')?.text).toContain('transition-duration:var(--duration-fast)')
    expect(css.createRule('transition-timing-function:smooth')?.text).toContain('transition-timing-function:var(--easing-smooth)')
    expect(css.createRule('bg:blue')?.text).toContain('background-color:var(--color-blue)')
    expect(css.createRule('bg:pink')?.text).toContain('background-color:var(--color-pink)')
    expect(noNativeCSS.createRule('bg:canvas')).toBeUndefined()
    expect(noNativeCSS.createRule('bg:surface')).toBeUndefined()
    expect(css.createRule('bg:surface-base')?.text).toBe('.bg\\:surface-base{background-color:var(--color-surface-base)}')
    expect(css.createRule('surface:base')?.text).toBe('.surface\\:base{background-color:var(--color-surface-base)}')
    expect(css.createRule('surface:muted')?.text).toBe('.surface\\:muted{background-color:var(--color-surface-muted)}')
    expect(css.createRule('surface:raised')?.text).toBe('.surface\\:raised{background-color:var(--color-surface-raised)}')
    expect(css.createRule('surface:overlay')?.text).toBe('.surface\\:overlay{background-color:var(--color-surface-overlay)}')
    expect(css.createRule('surface:inverse')?.text).toBe('.surface\\:inverse{background-color:var(--color-surface-inverse)}')
    expect(css.createRule('surface:overlay/.9')?.text).toBe('.surface\\:overlay\\/\\.9{background-color:color-mix(in oklab,var(--color-surface-overlay) 90%,transparent)}')
    expect(noNativeCSS.createRule('surface:blue')).toBeUndefined()
    expect(noNativeCSS.createRule('surface:#fff')).toBeUndefined()
    expect(css.createRule('fg:red')?.text).toBe('.fg\\:red{color:var(--color-red)}')
    expect(css.createRule('text:blue')?.text).toBe('.text\\:blue{color:var(--color-text-blue)}')
    expect(css.createRule('fg:blue-60')?.text).toBe('.fg\\:blue-60{color:var(--color-blue-60)}')
    expect(noNativeCSS.createRule('text:blue-60')).toBeUndefined()
    expect(css.createRule('text-fill-color:text-pink')?.text).toBe('.text-fill-color\\:text-pink{-webkit-text-fill-color:var(--color-text-pink)}')
    expect(css.createRule('animate:fade')?.text).toContain('animation:var(--animate-fade)')
    expect(noNativeCSS.createRule('bg:accent')).toBeUndefined()
    expect(css.createRule('fg:on-blue')?.text).not.toContain('var(--color-on-blue)')
    expect(css.createRule('b:line-blue')?.text).not.toContain('var(--color-line-blue)')
    expect(noNativeCSS.createRule('bg:blue-surface')).toBeUndefined()
    expect(css.text).not.toContain('null')
  })

  test('keeps project text and line role namespaces available', () => {
    const manifest = JSON.parse(JSON.stringify(defaultManifest)) as MasterCSSManifest
    manifest.variables = groupMasterCSSManifestVariables([
      ...flattenMasterCSSManifestVariables(manifest.variables),
      {
        name: 'color-text-action',
        key: 'action',
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

    expect(css.createRule('text:action')?.text).toBe('.text\\:action{color:var(--color-text-action)}')
    expect(css.createRule('border-color:divider')?.text).toBe('.border-color\\:divider{border-color:var(--color-line-divider)}')
    expect(css.createRule('b:1px|solid|divider')?.text).toBe('.b\\:1px\\|solid\\|divider{border:1px solid var(--color-line-divider)}')
    expect(css.createRule('outline:1px|solid|divider')?.text).toBe('.outline\\:1px\\|solid\\|divider{outline:1px solid var(--color-line-divider)}')
  })
})
