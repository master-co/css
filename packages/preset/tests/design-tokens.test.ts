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
  'color-info', 'color-surface-muted', 'color-surface-overlay', 'color-line-base', 'color-line-strong',
  'color-line-muted', 'color-text-subtle', 'color-text-placeholder'
] as const

const textRoleAliases = [
  ['body', 'var(--color-neutral-70)', 'var(--color-gray-30)'],
  ['strong', 'var(--color-neutral-100)', 'var(--color-white)'],
  ['muted', 'var(--color-neutral-60)', 'var(--color-gray-40)'],
  ['disabled', 'var(--color-neutral-40)', 'var(--color-gray-60)'],
  ['inverse', 'var(--color-white)', 'var(--color-black)'],
  ['link', 'var(--color-blue-60)', 'var(--color-blue-30)'],
  ['link-hover', 'var(--color-blue-70)', 'var(--color-blue-20)']
] as const

const lineRoleAliases = [
  ['color-line-divider', 'color-line', 'divider', 'oklch(0% 0 none / .12)', 'oklch(100% 0 none / .12)'],
  ['color-line-control', 'color-line', 'control', 'var(--color-neutral-50)', 'var(--color-gray-40)'],
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
  ['orange', 'var(--color-orange-70)', 'var(--color-orange-30)'],
  ['amber', 'var(--color-amber-80)', 'var(--color-amber-40)'],
  ['yellow', 'var(--color-yellow-90)', 'var(--color-yellow-40)'],
  ['lime', 'var(--color-lime-80)', 'var(--color-lime-40)'],
  ['green', 'var(--color-green-80)', 'var(--color-green-40)'],
  ['beryl', 'var(--color-beryl-90)', 'var(--color-beryl-40)'],
  ['teal', 'var(--color-teal-90)', 'var(--color-teal-40)'],
  ['cyan', 'var(--color-cyan-90)', 'var(--color-cyan-40)'],
  ['sky', 'var(--color-sky-70)', 'var(--color-sky-30)'],
  ['blue', 'var(--color-blue-60)', 'var(--color-blue-30)'],
  ['indigo', 'var(--color-indigo-60)', 'var(--color-indigo-30)'],
  ['violet', 'var(--color-violet-60)', 'var(--color-violet-30)'],
  ['purple', 'var(--color-purple-60)', 'var(--color-purple-30)'],
  ['fuchsia', 'var(--color-fuchsia-70)', 'var(--color-fuchsia-30)'],
  ['pink', 'var(--color-pink-80)', 'var(--color-pink-30)'],
  ['crimson', 'var(--color-crimson-80)', 'var(--color-crimson-30)'],
  ['red', 'var(--color-red-80)', 'var(--color-red-30)']
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
      values: [{ path: [':root,:host'], value: '1.5rem' }],
      numeric: { value: 1.5, unit: 'rem' }
    })
    expect(findVariable('radius-lg')).toMatchObject({
      namespace: 'radius',
      key: 'lg',
      type: 'number',
      values: [{ path: [':root,:host'], value: '.5rem' }],
      numeric: { value: 0.5, unit: 'rem' }
    })
    expect(findVariable('spacing-md')).toMatchObject({
      namespace: 'spacing',
      key: 'md',
      type: 'number',
      values: [{ path: [':root,:host'], value: '1rem' }],
      numeric: { value: 1, unit: 'rem' }
    })
    expect(findVariable('breakpoint-sm')).toBeUndefined()
    expect(findVariable('container-sm')).toMatchObject({
      namespace: 'container',
      key: 'sm',
      type: 'number',
      values: [{ path: [':root,:host'], value: '24rem' }],
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
      values: [{ path: [':root,:host'], value: 'fade 1s infinite' }]
    })
    expect(defaultManifest).not.toHaveProperty('animations')
    expect(findVariable('color-blue-60')).toMatchObject({
      namespace: 'color',
      key: 'blue-60'
    })
    expect(findVariable('shadow-sm')).toMatchObject({
      namespace: 'shadow',
      key: 'sm',
      type: 'string',
      values: expect.arrayContaining([
        expect.objectContaining({ path: [':root,:host'], value: expect.stringContaining('light-dark(') })
      ])
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
      ['inset', 'var(--color-neutral-5)', 'var(--color-gray-100)'],
      ['raised', 'var(--color-white)', 'var(--color-gray-90)'],
      ['floating', 'var(--color-white)', 'var(--color-gray-80)'],
      ['inverse', 'var(--color-black)', 'var(--color-white)']
    ] as const

    for (const [key, lightValue, darkValue] of surfaceAliases) {
      expect(findVariable(`color-surface-${key}`), key).toMatchObject({
        namespace: 'color-surface',
        key,
        type: 'string',
        values: [
          { path: [':root,:host'], value: `light-dark(${lightValue}, ${darkValue})` }
        ],
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }
  })

  test('keeps shadow geometry while pairing each light and dark edge color', () => {
    for (const [index, [key, light]] of lightShadowEdges.entries()) {
      const dark = darkShadowEdges[index][1]
      const variable = findVariable(`shadow-${key}`)!
      expect(variable.values).toHaveLength(1)
      expect(variable.values[0].path).toEqual([':root,:host'])
      expect(variable.values[0].value).toContain(`0 0 0 1px light-dark(oklch(0% 0 none / ${light}), oklch(100% 0 none / ${dark}))`)
      expect(variable.values[0].value.match(/light-dark\(/g)).toHaveLength(key === 'xs' ? 2 : 3)
    }
  })

  test('keeps hue aliases fixed and semantic aliases native to color-scheme', () => {
    for (const [hue, lightValue] of baseHueAliases) {
      expect(findVariable(`color-${hue}`), hue).toMatchObject({
        namespace: 'color',
        key: hue,
        type: 'string',
        values: [
          { path: [':root,:host'], value: lightValue }
        ],
        dependencies: [varDependencyName(lightValue)]
      })
    }

    for (const [name, namespace, key, lightValue, darkValue] of lineRoleAliases) {
      expect(findVariable(name), name).toMatchObject({
        namespace,
        key,
        type: 'string',
        values: [
          { path: [':root,:host'], value: `light-dark(${lightValue}, ${darkValue})` }
        ]
      })
    }

    for (const [role, lightValue, darkValue] of textRoleAliases) {
      expect(findVariable(`color-text-${role}`), role).toMatchObject({
        namespace: 'color-text',
        key: role,
        type: 'string',
        values: [
          { path: [':root,:host'], value: `light-dark(${lightValue}, ${darkValue})` }
        ],
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }

    for (const [hue, lightValue, darkValue] of textHueAliases) {
      expect(findVariable(`color-text-${hue}`), hue).toMatchObject({
        namespace: 'color-text',
        key: hue,
        type: 'string',
        values: [
          { path: [':root,:host'], value: `light-dark(${lightValue}, ${darkValue})` }
        ],
        dependencies: [varDependencyName(lightValue), varDependencyName(darkValue)]
      })
    }
  })

  test('precomputes default breakpoint and container at-rule aliases', () => {
    expect(defaultManifest.customMedia?.['--sm']).toEqual({ type: 'feature', value: '(width >= 52.125rem)' })
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
    const declarationsCSS = createTestCSS(defaultManifest)

    expect(css.createRule('font-sans')?.text).toContain('font-family:var(--font-family-sans)')
    expect(css.createRule('text-2xl')?.text).toContain('font-size:var(--text-2xl)')
    expect(css.createRule('m-md')?.text).toContain('margin:var(--spacing-md)')
    expect(css.createRule('r-lg')?.text).toContain('border-radius:var(--radius-lg)')
    expect(css.createRule('fg-text-body')?.text).toBe('.fg-text-body{color:var(--color-text-body)}')
    expect(css.createRule('fg-text-muted')?.text).toBe('.fg-text-muted{color:var(--color-text-muted)}')
    expect(css.createRule('fg-text-inverse')?.text).toBe('.fg-text-inverse{color:var(--color-text-inverse)}')
    expect(css.createRule('fg-text-link')?.text).toBe('.fg-text-link{color:var(--color-text-link)}')
    expect(css.createRule('fg-text-link-hover')?.text).toBe('.fg-text-link-hover{color:var(--color-text-link-hover)}')
    expect(declarationsCSS.createRule("background:line")?.text).toContain('background:line')
    expect(declarationsCSS.createRule("background:base")?.text).toContain('background:base')
    expect(css.createRule('fg-muted')?.text).toBe('.fg-muted{color:var(--color-text-muted)}')
    expect(css.createRule('b-divider')?.text).toBe('.b-divider{border-color:var(--color-line-divider)}')
    expect(css.createRule("border:1px|solid|var(--color-line-divider)")?.text).toBe(".border\\:1px\\|solid\\|var\\(--color-line-divider\\){border:1px solid var(--color-line-divider)}")
    expect(css.createRule('border-color-divider')?.text).toBe('.border-color-divider{border-color:var(--color-line-divider)}')
    expect(css.createRule('outline:1px|solid|var(--color-line-divider)')?.text).toBe('.outline\\:1px\\|solid\\|var\\(--color-line-divider\\){outline:1px solid var(--color-line-divider)}')
    expect(css.createRule('stroke-divider')?.text).toBe('.stroke-divider{stroke:var(--color-line-divider)}')
    expect(css.createRule('b-control')?.text).toBe('.b-control{border-color:var(--color-line-control)}')
    expect(css.createRule('b-subtle')?.text).toBe('.b-subtle{border-color:var(--color-line-subtle)}')
    expect(css.createRule('outline:1px|solid|var(--color-line-subtle)')?.text).toBe('.outline\\:1px\\|solid\\|var\\(--color-line-subtle\\){outline:1px solid var(--color-line-subtle)}')
    expect(css.createRule('bg-blue-60')?.text).toContain('background-color:var(--color-blue-60)')
    expect(css.createRule('shadow-sm')?.text).toContain('box-shadow:var(--shadow-sm)')
    expect(css.createRule('w-sm')?.text).toContain('width:var(--container-sm)')
    expect(css.createRule('transition-duration-fast')?.text).toContain('transition-duration:var(--duration-fast)')
    expect(css.createRule('transition-timing-function-smooth')?.text).toContain('transition-timing-function:var(--easing-smooth)')
    expect(css.createRule('bg-blue')?.text).toContain('background-color:var(--color-blue)')
    expect(css.createRule('bg-pink')?.text).toContain('background-color:var(--color-pink)')
    expect(declarationsCSS.createRule("background:canvas")?.text).toContain('background:canvas')
    expect(declarationsCSS.createRule("background:surface")?.text).toContain('background:surface')
    expect(css.createRule('bg-surface-base')?.text).toBe('.bg-surface-base{background-color:var(--color-surface-base)}')
    expect(css.createRule('surface-base')?.text).toBe('.surface-base{background-color:var(--color-surface-base)}')
    expect(css.createRule('surface-inset')?.text).toBe('.surface-inset{background-color:var(--color-surface-inset)}')
    expect(css.createRule('surface-raised')?.text).toBe('.surface-raised{background-color:var(--color-surface-raised)}')
    expect(css.createRule('surface-floating')?.text).toBe('.surface-floating{background-color:var(--color-surface-floating)}')
    expect(css.createRule('surface-inverse')?.text).toBe('.surface-inverse{background-color:var(--color-surface-inverse)}')
    expect(css.createRule('surface-floating/.9')?.text).toBe('.surface-floating\\/\\.9{background-color:color-mix(in oklab,var(--color-surface-floating) 90%,transparent)}')
    expect(declarationsCSS.createRule('surface:blue')?.text).toContain('surface:blue')
    expect(declarationsCSS.createRule('surface:#fff')?.text).toContain('surface:#fff')
    expect(css.createRule('fg-red')?.text).toBe('.fg-red{color:var(--color-red)}')
    expect(css.createRule('fg-text-blue')?.text).toBe('.fg-text-blue{color:var(--color-text-blue)}')
    expect(css.createRule('fg-blue-60')?.text).toBe('.fg-blue-60{color:var(--color-blue-60)}')
    expect(declarationsCSS.createRule('text:blue-60')).toBeUndefined()
    expect(css.createRule('text-fill-color-text-pink')?.text).toBe('.text-fill-color-text-pink{-webkit-text-fill-color:var(--color-text-pink)}')
    expect(css.createRule('animate-fade')?.text).toContain('animation:var(--animate-fade)')
    expect(declarationsCSS.createRule("background:accent")?.text).toContain('background:accent')
    expect(css.createRule("color:on-blue")?.text).not.toContain('var(--color-on-blue)')
    expect(css.createRule("border:line-blue")?.text).not.toContain('var(--color-line-blue)')
    expect(declarationsCSS.createRule("background:blue-surface")?.text).toContain('background:blue-surface')
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
        values: [{ path: [':root,:host'], value: '#111' }]
      },
      {
        name: 'color-line-divider',
        key: 'divider',
        namespace: 'color-line',
        type: 'string',
        values: [{ path: [':root,:host'], value: '#ddd' }]
      }
    ])

    const css = createTestCSS(manifest)

    expect(css.createRule('fg-text-action')?.text).toBe('.fg-text-action{color:var(--color-text-action)}')
    expect(css.createRule('border-color-divider')?.text).toBe('.border-color-divider{border-color:var(--color-line-divider)}')
    expect(css.createRule("border:1px|solid|var(--color-line-divider)")?.text).toBe(".border\\:1px\\|solid\\|var\\(--color-line-divider\\){border:1px solid var(--color-line-divider)}")
    expect(css.createRule('outline:1px|solid|var(--color-line-divider)')?.text).toBe('.outline\\:1px\\|solid\\|var\\(--color-line-divider\\){outline:1px solid var(--color-line-divider)}')
  })
})
