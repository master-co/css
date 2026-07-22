import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  builtinKeyAliases,
  builtinNamespaceSet,
  builtinNativeValueNamespaces,
  MasterCSS,
  type MasterCSSCreateOptions
} from '@master/css-engine'
import UtilityType from '@master/css-schema/utility-type'
import {
  createDefaultManifestFromSourceFile,
  createDefaultManifestJSONFromSourceFile,
  createDefaultNativeCSSFromSourceFile
} from '../scripts/generate-default-manifest'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createTestCSS(manifest: MasterCSSManifest, options: Omit<MasterCSSCreateOptions, 'manifest'> = {}) {
  return MasterCSS.create({ manifest, ...options })
}
function variablesOf(manifest: MasterCSSManifest) {
  return flattenMasterCSSManifestVariables(manifest.variables)
}
function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, '\n')
}
const __dirname = dirname(fileURLToPath(import.meta.url))
let compiledDefaultManifest: MasterCSSManifest

const retainedRadiusKeyAliases = {
  rbl: 'border-bottom-left-radius',
  rbr: 'border-bottom-right-radius',
  rtl: 'border-top-left-radius',
  rtr: 'border-top-right-radius'
}

function stripRaw<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripRaw) as T
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      if (key === 'raw') continue
      next[key] = stripRaw(child)
    }
    return next as T
  }
  return value
}

const retainedMatcherAliases = new Set([
  'b',
  'bb',
  'bg',
  'bl',
  'br',
  'bt',
  'bx',
  'by',
  'font',
  'grid-col-span',
  'grid-cols',
  'line-clamp',
  'text'
])

const removedAliases = [
  'ac',
  'accent',
  'ai',
  'as',
  'aspect',
  'bd',
  'bg-blend',
  'bg-clip',
  'bg-origin',
  'blend',
  'box-decoration',
  'caret',
  'clip',
  'col-span',
  'cols',
  'd',
  'f',
  'font-feature',
  'grid-auto-cols',
  'grid-flow',
  'grid-template-cols',
  'bs',
  'ib',
  'ibe',
  'ibs',
  'ii',
  'iie',
  'iis',
  'is',
  'jc',
  'ji',
  'js',
  'line-h',
  'ls',
  'max-bs',
  'max-is',
  'mbe',
  'mbs',
  'mi',
  'mie',
  'mis',
  'min-bs',
  'min-is',
  'o',
  'obj',
  'pbe',
  'pbs',
  'pi',
  'pie',
  'pis',
  's',
  'scroll-mbe',
  'scroll-mbs',
  'scroll-me',
  'scroll-ms',
  'scroll-pbe',
  'scroll-pbs',
  'scroll-pe',
  'scroll-ps',
  'shape',
  'tab',
  't',
  'touch',
  'v',
  'vertical',
  'vt-class',
  'vt-name',
  'writing'
]

const competitiveNativeValueUtilities: string[] = []
const removedStaticUtilityNames = [
  'not-italic',
  'transform-3d',
  'transform-flat'
]

const nativeValueNamespaceMatcherKeys = new Set([
  'outline',
  'stroke'
])

const removedSourceUtilityIds = [
  'animation-delay',
  'animation-name',
  'background',
  'background-color',
  'background-attachment',
  'background-position',
  'background-repeat',
  'background-size',
  'border-collapse',
  'border-image-repeat',
  'container',
  'container-type',
  'flex-direction',
  'flex-basis',
  'flex-wrap',
  'font-variant',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'font-variant-numeric',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-template-columns',
  'grid-template-rows',
  'list-style-position',
  'list-style-type',
  'object-fit',
  'object-position',
  'outline-style',
  'outline-width',
  'rotate',
  'scroll-snap-align',
  'scroll-snap-stop',
  'scroll-snap-type',
  'shape-margin',
  'stroke',
  'stroke-width',
  'text-align',
  'text-decoration-line',
  'text-decoration-style',
  'text-indent',
  'text-orientation',
  'text-overflow',
  'text-rendering',
  'text-stroke-width',
  'text-transform',
  'text-underline-offset',
  'text-underline-position',
  'transform',
  'transform-origin',
  'transform-style',
  'transition-delay',
  'word-spacing'
]

function collectMatcherKeys(manifest: MasterCSSManifest) {
  const keys = new Set<string>()
  for (const utility of manifest.utilities || []) {
    for (const matcher of utility.matchers || []) {
      if ('keys' in matcher) {
        matcher.keys.forEach((key) => keys.add(key))
      }
    }
  }
  return keys
}

function hasCSSVariableAssignmentUtility(manifest: MasterCSSManifest) {
  return (manifest.utilities || []).some((utility) =>
    ((utility.emit as { type: string }).type === 'css-variable-assignment')
    || utility.matchers.some((matcher) => (matcher as { type: string }).type === 'css-variable-assignment')
  )
}

function getCompiledDefaultManifest() {
  compiledDefaultManifest ||= createDefaultManifestFromSourceFile(resolve(__dirname, '../src/index.css'))
  return compiledDefaultManifest
}

describe('@master/css-preset defaultManifest', () => {
  it('matches the readable preset sources', () => {
    const manifest = getCompiledDefaultManifest()
    const utilities = manifest.utilities || []
    const compiledUtilities = createTestCSS(manifest).definedUtilities

    expect(utilities).toHaveLength(177)
    expect(utilities.some((utility) => 'order' in utility)).toBe(false)
    expect(utilities.some((utility) => utility.layer === 'utilities')).toBe(false)
    expect(utilities.some((utility) => utility.name === utility.id)).toBe(false)
    expect(compiledUtilities[0]?.order).toBe(utilities.length - 1)
    expect(compiledUtilities[compiledUtilities.length - 1]?.order).toBe(0)
    expect(utilities.some((utility) => utility.id === 'group')).toBe(false)
    expect(utilities.some((utility) => (utility.emit as { type: string }).type === 'group')).toBe(false)
    expect(utilities.some((utility) => utility.matchers.some((matcher) => (matcher as { type: string }).type === 'group'))).toBe(false)
    expect(utilities.some((utility) => utility.id === 'animation')).toBe(false)
    expect(utilities.some((utility) => utility.id === 'animate:<~animate>')).toBe(true)
    expect(utilities.some((utility) => utility.id === 'font:<~font-family|=font|~font-weight|~font-size|*>')).toBe(false)
    expect(utilities.some((utility) => 'transform' in utility)).toBe(false)
    expect(utilities.some((utility) => (utility.emit as { type: string }).type === 'pair')).toBe(false)
    expect(utilities.some((utility) => utility.matchers.some((matcher) => (matcher as { type: string }).type === 'function-prefix'))).toBe(false)
    expect('functions' in manifest).toBe(false)
    expect('functions' in defaultManifest).toBe(false)
    expect('settings' in manifest).toBe(false)
    expect('settings' in defaultManifest).toBe(false)
    expect(hasCSSVariableAssignmentUtility(manifest)).toBe(false)
    expect(hasCSSVariableAssignmentUtility(defaultManifest)).toBe(false)
    expect(manifest).toEqual(defaultManifest)
  })

  it('reconstructs the checked-in manifest byte for byte in Rust', () => {
    const sourceFile = resolve(__dirname, '../src/index.css')
    const manifestFile = resolve(__dirname, '../src/default-manifest.json')

    expect(createDefaultManifestJSONFromSourceFile(sourceFile))
      .toBe(readFileSync(manifestFile, 'utf8'))
  })

  it('matches the readable preset native CSS', () => {
    const sourceFile = resolve(__dirname, '../src/index.css')
    const nativeCSSFile = resolve(__dirname, '../src/default-native.css')
    const nativeCSS = createDefaultNativeCSSFromSourceFile(sourceFile)

    expect(normalizeLineEndings(readFileSync(nativeCSSFile, 'utf8'))).toBe(nativeCSS)
    expect(nativeCSS).toContain('@layer base')
    expect(nativeCSS).toContain('text-rendering: geometricprecision')
    expect(nativeCSS).toContain('font-family: var(--font-family-sans)')
    expect(nativeCSS).toContain('font-feature-settings: var(--font-feature-sans, normal)')
    expect(nativeCSS).toContain('font-family: var(--font-family-mono)')
    expect(nativeCSS).toContain('font-feature-settings: var(--font-feature-mono, normal)')
  })

  it('matches the CSS-authored preset manifest facets', () => {
    const compiledManifest = getCompiledDefaultManifest()
    expect(variablesOf(compiledManifest)).toEqual(variablesOf(defaultManifest))
    expect(compiledManifest.animations).toEqual(defaultManifest.animations)
    expect(stripRaw(compiledManifest.variants)).toEqual(stripRaw(defaultManifest.variants))
    expect(compiledManifest.conditions).toEqual(defaultManifest.conditions)
    expect(compiledManifest.breakpointConditions).toEqual(defaultManifest.breakpointConditions)
    expect(compiledManifest.containerConditions).toEqual(defaultManifest.containerConditions)
    expect(compiledManifest.selectors).toEqual(defaultManifest.selectors)
    expect(defaultManifest.selectors).toBeUndefined()
    expect(defaultManifest.variants?.every((variant) => variant.token.startsWith('@'))).toBe(true)
  })

  it('does not publish the removed px inline alias', () => {
    expect(variablesOf(defaultManifest).some((variable) => variable.name === 'px')).toBe(false)
  })

  it('does not publish removed static utility shortcuts', () => {
    const css = createTestCSS(defaultManifest)

    for (const name of removedStaticUtilityNames) {
      expect(defaultManifest.utilities?.some((utility) => utility.name === name), name).toBe(false)
      expect(css.createRule(name), name).toBeUndefined()
    }
  })

  it('uses engine default settings when the preset manifest omits settings', () => {
    const css = createTestCSS(defaultManifest)

    expect(defaultManifest.settings).toBeUndefined()
    expect(css.settings).toEqual({
      rootSize: 16,
      baseUnit: 4,
      defaultMode: 'light',
      modeTrigger: 'media',
      modes: ['light', 'dark']
    })
  })

  it('keeps preset variable alias refs inside registered namespaces', () => {
    const variableNamespaces = new Set(variablesOf(defaultManifest)
      .map((variable) => variable.namespace)
      .filter((namespace): namespace is string => Boolean(namespace)))
    const variableAliasRefs = [
      ...builtinNativeValueNamespaces.flatMap((namespace) => namespace.variableAliasRefs),
      ...(defaultManifest.utilities || []).flatMap((utility) => utility.variableAliasRefs || [])
    ]

    for (const namespace of variableNamespaces) {
      expect(builtinNamespaceSet.has(namespace), namespace).toBe(true)
    }
    for (const ref of variableAliasRefs) {
      expect(ref[0] === '~' || ref[0] === '=', ref).toBe(true)
      expect(builtinNamespaceSet.has(ref.slice(1)), ref).toBe(true)
    }
  })

  it('preserves the compiled default registry', () => {
    const css = createTestCSS(defaultManifest)
    const text = [
      css.createRule('inline-flex')?.text,
      css.createRule('bg:linear-gradient(#000,#fff)')?.text,
      css.createRule('bg:blue')?.text,
      css.createRule('bg:surface-base')?.text,
      css.createRule('surface:base')?.text,
      css.createRule('grid-cols:3')?.text,
      css.createRule('line-clamp:3')?.text,
      css.createRule('text:2xl')?.text
    ].join('')
    expect(text).toContain('display:inline-flex')
    expect(text).toContain('background-image:linear-gradient(#000,#fff)')
    expect(text).toContain('background-color:var(--color-blue)')
    expect(text).toContain('background-color:var(--color-surface-base)')
    expect(text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
    expect(text).toContain('-webkit-line-clamp:3')
    expect(text).not.toContain('null')
    expect(css.createRule('gradient(#000,#fff)')).toBeUndefined()
    expect(css.createRule('bg:canvas')).toBeUndefined()
    expect(css.createRule('surface:blue')).toBeUndefined()
    expect(css.createRule('surface:#fff')).toBeUndefined()
  })

  it('executes CSS-authored semantic and enum pattern utilities', () => {
    const css = createTestCSS(defaultManifest)

    expect(css.createRule('block')?.text).toBe('.block{display:block}')
    expect(css.createRule('bottom')?.text).toBe('.bottom{bottom:0}')
    expect(css.createRule('center')?.text).toBe('.center{left:0;right:0;margin-left:auto;margin-right:auto}')
    expect(css.createRule('rounded')?.text).toBe('.rounded{border-radius:1e9em}')
    expect(css.createRule('font-antialiased')?.text).toBe('.font-antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}')
    expect(css.createRule('text-center')?.text).toBe('.text-center{text-align:center}')
    expect(css.createRule('items-center')?.text).toBe('.items-center{align-items:center}')
    expect(css.createRule('content-between')?.text).toBe('.content-between{align-content:space-between}')
    expect(css.createRule('justify-between')?.text).toBe('.justify-between{justify-content:space-between}')
    expect(css.createRule('self-start')?.text).toBe('.self-start{align-self:start}')
    expect(css.createRule('bg-origin-border')?.text).toBe('.bg-origin-border{background-origin:border-box}')
    expect(css.createRule('box-border')?.text).toBe('.box-border{box-sizing:border-box}')
    expect(css.createRule('transform-view')?.text).toBe('.transform-view{transform-box:view-box}')
    expect(css.createRule('wrap-break-word')?.text).toBe('.wrap-break-word{overflow-wrap:break-word}')
    expect(css.createRule('bg-cover')?.text).toBe('.bg-cover{background-size:cover}')
    expect(css.createRule('object-cover')?.text).toBe('.object-cover{object-fit:cover}')
    expect(css.createRule('b-solid')?.text).toBe('.b-solid{border-style:solid}')
    expect(css.createRule('b-groove')?.text).toBe('.b-groove{border-style:groove}')
    expect(css.createRule('bl-solid')?.text).toBe('.bl-solid{border-left-style:solid}')
    expect(css.createRule('bl-outset')?.text).toBe('.bl-outset{border-left-style:outset}')
    expect(css.createRule('bx-solid')?.text).toBe('.bx-solid{border-inline-style:solid}')
    expect(css.createRule('by-ridge')?.text).toBe('.by-ridge{border-block-style:ridge}')
    expect(css.createRule('outline-medium')?.text).toBe('.outline-medium{outline-width:medium}')
    expect(css.createRule('outline-thick')?.text).toBe('.outline-thick{outline-width:thick}')
    expect(css.createRule('outline-thin')?.text).toBe('.outline-thin{outline-width:thin}')
    expect(css.createRule('text-fill-color:red')?.text).toBe('.text-fill-color\\:red{-webkit-text-fill-color:var(--color-text-red)}')
    expect(css.createRule('text-decoration-color:red')?.text).toBe('.text-decoration-color\\:red{text-decoration-color:var(--color-text-red)}')
    expect(css.createRule('text-stroke-color:red')?.text).toBe('.text-stroke-color\\:red{-webkit-text-stroke-color:var(--color-red)}')
    expect(css.createRule('text-stroke:1px')?.text).toBe('.text-stroke\\:1px{-webkit-text-stroke-width:1px}')
    expect(css.createRule('text-decoration-thickness:2px')?.text).toBe('.text-decoration-thickness\\:2px{text-decoration-thickness:2px}')
    expect(css.createRule('user-select:none')?.text).toBe('.user-select\\:none{-webkit-user-select:none;user-select:none}')
    expect(css.createRule('user-drag:none')?.text).toBe('.user-drag\\:none{-webkit-user-drag:none;user-drag:none}')
    expect(css.createRule('box-decoration-break:clone')?.text).toBe('.box-decoration-break\\:clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}')
    expect(css.createRule('font-feature-settings:tabular')?.text).toBe('.font-feature-settings\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
    expect(css.createRule('content:empty')?.text).toBe('.content\\:empty{content:var(--content-empty)}')
    expect(css.createRule('font-sm')).toBeUndefined()
    expect(css.createRule('m-md')).toBeUndefined()
    expect(css.createRule('sr-only')?.text).toContain('position:absolute')
    expect(css.createRule('sr-only')?.text).toContain('clip:rect(0, 0, 0, 0)')

    expect('utilityBuckets' in defaultManifest).toBe(false)
    expect((defaultManifest.utilities || [])
      .filter((utility) => utility.matchers.some((matcher) => matcher.type === 'pattern')))
      .toHaveLength(38)
    expect(defaultManifest.utilities?.some((utility) => utility.id === '.text-center')).toBe(false)
    expect(defaultManifest.utilities?.find((utility) => utility.id === 'text-<left|center|right|start|end|justify>'))
      .toMatchObject({
        type: UtilityType.Semantic,
        matchers: [{
          type: 'pattern',
          prefix: 'text-',
          values: ['left', 'center', 'right', 'start', 'end', 'justify']
        }]
      })
    expect(defaultManifest.utilities?.some((utility) => utility.id === '.items-center')).toBe(false)
    expect(defaultManifest.utilities?.find((utility) => utility.id === 'items-<baseline|center|end|flex-end|flex-start|normal|self-end|self-start|start|stretch>'))
      .toMatchObject({
        type: UtilityType.Semantic,
        matchers: [{
          type: 'pattern',
          prefix: 'items-',
          values: ['baseline', 'center', 'end', 'flex-end', 'flex-start', 'normal', 'self-end', 'self-start', 'start', 'stretch']
        }]
      })
    expect(defaultManifest.utilities?.find((utility) => utility.id === 'bg-origin-<border=border-box|content=content-box|padding=padding-box>'))
      .toMatchObject({
        type: UtilityType.Semantic,
        matchers: [{
          type: 'pattern',
          prefix: 'bg-origin-',
          values: ['border', 'content', 'padding'],
          valueMap: {
            border: 'border-box',
            content: 'content-box',
            padding: 'padding-box'
          }
        }]
      })
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'text-fill-color:<~color-text|~color|color>')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'text-decoration-color:<~color-text|~color|color>')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'text-stroke-color:<~color|color>')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'text-stroke-width:<number>')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'grid-column-span')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'text-truncate')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'border-image-source')).toBe(false)
    expect(defaultManifest.utilities?.some((utility) => utility.id === 'list-style-image')).toBe(false)
    expect(defaultManifest.utilities?.find((utility) => utility.id === 'stroke:<number>')).toMatchObject({
      kind: 'number',
      emit: {
        type: 'static',
        rules: [{
          declarations: {
            'stroke-width': null
          }
        }]
      }
    })
    expect(defaultManifest.utilities?.find((utility) => utility.id === 'text-underline:<~spacing>')).toMatchObject({
      variableAliasRefs: ['~spacing'],
      emit: {
        type: 'static',
        rules: [{
          declarations: {
            'text-underline-offset': null
          }
        }]
      }
    })

    const orderedCSS = createTestCSS(defaultManifest)
    orderedCSS.ensureClassRules('items-center', 'items-start', 'justify-between', 'justify-center')
    expect(orderedCSS.utilitiesLayer.text)
      .toBe('@layer utilities{.items-center{align-items:center}.items-start{align-items:start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}}')

    const nativeFallbackCSS = createTestCSS(defaultManifest, {
      nativeDeclarationMatcher: ({ property, value }) => property === 'align-items' && value === 'center'
    })
    const semanticItemsCenter = nativeFallbackCSS.createRule('items-center')
    const nativeAlignItemsCenter = nativeFallbackCSS.createRule('align-items:center')
    expect(semanticItemsCenter?.type).toBe(UtilityType.Semantic)
    expect(nativeAlignItemsCenter?.type).toBe(UtilityType.Normal)
    expect(nativeAlignItemsCenter?.type).toBeGreaterThan(semanticItemsCenter?.type ?? 0)
  })

  it('removes fixed keyword value aliases while preserving raw ambiguous matches', () => {
    const css = createTestCSS(defaultManifest)

    expect(css.createRule('text:center')).toBeUndefined()
    expect(css.createRule('text:underline')).toBeUndefined()
    expect(css.createRule('bg:cover')).toBeUndefined()
    expect(css.createRule('object:cover')).toBeUndefined()
    expect(css.createRule('border-solid')).toBeUndefined()
    expect(css.createRule('border-l-solid')).toBeUndefined()
    expect(css.createRule('rt:4x')).toBeUndefined()
    expect(css.createRule('border-top-radius:4x')).toBeUndefined()
    expect(css.createRule('bg:#fff')?.text).toBe('.bg\\:\\#fff{background-color:#fff}')
    expect(css.createRule('b:1px')?.text).toBe('.b\\:1px{border-width:1px}')
    expect(css.createRule('b:line')?.text).toBe('.b\\:line{border:line}')
    expect(css.createRule('b:base')?.text).toBe('.b\\:base{border-color:var(--color-line-base)}')
    expect(css.createRule('bt:1px')?.text).toBe('.bt\\:1px{border-top-width:1px}')
    expect(css.createRule('bl:line')?.text).toBe('.bl\\:line{border-left:line}')
    expect(css.createRule('bx:1px')?.text).toBe('.bx\\:1px{border-inline-width:1px}')
    expect(css.createRule('by:line')?.text).toBe('.by\\:line{border-block:line}')
    expect(css.createRule('b:1px|solid|line')?.text).toBe('.b\\:1px\\|solid\\|line{border:1px solid line}')
    expect(css.createRule('bt:1px|solid|line')?.text).toBe('.bt\\:1px\\|solid\\|line{border-top:1px solid line}')
    expect(css.createRule('b:1px|line')?.text).toBe('.b\\:1px\\|line{border:1px line}')
    expect(css.createRule('b:1px|solid|base')?.text).toBe('.b\\:1px\\|solid\\|base{border:1px solid var(--color-line-base)}')
    expect(css.createRule('bt:1px|solid|base')?.text).toBe('.bt\\:1px\\|solid\\|base{border-top:1px solid var(--color-line-base)}')
    expect(css.createRule('b:1px|base')?.text).toBe('.b\\:1px\\|base{border:1px var(--color-line-base)}')
    expect(css.createRule('b:gray-20')?.text).toBe('.b\\:gray-20{border-color:var(--color-gray-20)}')
    expect(css.createRule('bl:gray-20')?.text).toBe('.bl\\:gray-20{border-left-color:var(--color-gray-20)}')
    expect(css.createRule('by:gray-20')?.text).toBe('.by\\:gray-20{border-block-color:var(--color-gray-20)}')
    expect(css.createRule('b:1px|solid|gray-20')?.text).toBe('.b\\:1px\\|solid\\|gray-20{border:1px solid var(--color-gray-20)}')
    expect(css.createRule('bt:1px|solid|gray-20')?.text).toBe('.bt\\:1px\\|solid\\|gray-20{border-top:1px solid var(--color-gray-20)}')
    expect(css.createRule('b:1px|gray-20')?.text).toBe('.b\\:1px\\|gray-20{border:1px var(--color-gray-20)}')
    expect(css.createRule('b:1px|solid')?.text).toBe('.b\\:1px\\|solid{border:1px solid}')
    expect(css.createRule('border:transparent')?.text).toBe('.border\\:transparent{border:transparent}')
    expect(css.createRule('outline:medium')?.text).toBe('.outline\\:medium{outline:medium}')
    expect(css.createRule('font:sm')?.text).toBe('.font\\:sm{font-size:var(--font-size-sm)}')
    expect(css.createRule('font:1rem')?.text).toBe('.font\\:1rem{font-size:1rem}')
    expect(css.createRule('mxs:4x')?.text).toBe('.mxs\\:4x{margin-inline-start:1rem}')
    expect(css.createRule('pye:4x')?.text).toBe('.pye\\:4x{padding-block-end:1rem}')
    expect(css.createRule('ixs:4x')?.text).toBe('.ixs\\:4x{inset-inline-start:1rem}')
    expect(css.createRule('size-x:md')?.text).toBe('.size-x\\:md{inline-size:var(--container-md)}')
    expect(css.createRule('mi:4x')).toBeUndefined()
    expect(css.createRule('pbe:4x')).toBeUndefined()
    expect(css.createRule('iis:4x')).toBeUndefined()
    expect(css.createRule('bs:md')).toBeUndefined()
    expect(css.createRule('text:red')?.text).toBe('.text\\:red{color:var(--color-text-red)}')
    expect(css.createRule('text:blue')?.text).toBe('.text\\:blue{color:var(--color-text-blue)}')
    expect(css.createRule('fg:blue-60')?.text).toBe('.fg\\:blue-60{color:var(--color-blue-60)}')
    expect(css.createRule('text:blue-60')).toBeUndefined()
    expect(css.createRule('text:#fff')).toBeUndefined()
    expect(css.createRule('text:transparent')).toBeUndefined()
    expect(css.createRule('text:body')?.text).toBe('.text\\:body{color:var(--color-text-body)}')
    expect(css.createRule('text:inverse')?.text).toBe('.text\\:inverse{color:var(--color-text-inverse)}')
    expect(css.createRule('text:muted')?.text).toBe('.text\\:muted{color:var(--color-text-muted)}')
    expect(css.createRule('text:link')?.text).toBe('.text\\:link{color:var(--color-text-link)}')
    expect(css.createRule('text:link-hover')?.text).toBe('.text\\:link-hover{color:var(--color-text-link-hover)}')
    expect(css.createRule('fg:muted')?.text).toBe('.fg\\:muted{color:var(--color-text-muted)}')
    expect(css.createRule('text-decoration:red')?.text).toBe('.text-decoration\\:red{text-decoration-color:var(--color-text-red)}')
    expect(css.createRule('text-stroke:red')?.text).toBe('.text-stroke\\:red{-webkit-text-stroke-color:var(--color-red)}')
    expect(css.createRule('text-decoration-thickness:px')?.text).toBe('.text-decoration-thickness\\:px{text-decoration-thickness:px}')
    expect(css.createRule('text-decoration-thickness:var(--thickness)')?.text).toBe('.text-decoration-thickness\\:var\\(--thickness\\){text-decoration-thickness:var(--thickness)}')
    expect(css.createRule('background-color:red')?.text).toBe('.background-color\\:red{background-color:var(--color-red)}')
    expect(css.createRule('background-color:#fff')?.text).toBe('.background-color\\:\\#fff{background-color:#fff}')
    expect(css.createRule('background-color:base')?.text).toBe('.background-color\\:base{background-color:base}')
    expect(css.createRule('bg:canvas')).toBeUndefined()
    expect(css.createRule('bg:surface')).toBeUndefined()
    expect(css.createRule('surface:base')?.text).toBe('.surface\\:base{background-color:var(--color-surface-base)}')
    expect(css.createRule('surface:overlay/.9')?.text).toBe('.surface\\:overlay\\/\\.9{background-color:color-mix(in oklab,var(--color-surface-overlay) 90%,transparent)}')
    expect(css.createRule('surface:blue')).toBeUndefined()
    expect(css.createRule('surface:#fff')).toBeUndefined()
    expect(css.createRule('font-size:sm')?.text).toBe('.font-size\\:sm{font-size:var(--font-size-sm)}')
    expect(css.createRule('font-size:1rem')?.text).toBe('.font-size\\:1rem{font-size:1rem}')
    expect(css.createRule('font-family:sans')?.text).toBe('.font-family\\:sans{font-family:var(--font-family-sans)}')
    expect(css.createRule('font-weight:bold')?.text).toBe('.font-weight\\:bold{font-weight:var(--font-weight-bold)}')
    expect(css.createRule('font:var(--font-size-x)')).toBeUndefined()
    expect(css.createRule('size:5x')?.text).toBe('.size\\:5x{width:1.25rem;height:1.25rem}')
    expect(css.createRule('size:md')?.text).toBe('.size\\:md{width:var(--container-md);height:var(--container-md)}')
    expect(css.createRule('size:var(--radius-4xl)')?.text).toBe('.size\\:var\\(--radius-4xl\\){width:var(--radius-4xl);height:var(--radius-4xl)}')
    expect(css.createRule('min-size:5x')?.text).toBe('.min-size\\:5x{min-width:1.25rem;min-height:1.25rem}')
    expect(css.createRule('min-size:var(--radius-4xl)')?.text).toBe('.min-size\\:var\\(--radius-4xl\\){min-width:var(--radius-4xl);min-height:var(--radius-4xl)}')
    expect(css.createRule('max-size:5x')?.text).toBe('.max-size\\:5x{max-width:1.25rem;max-height:1.25rem}')
    expect(css.createRule('max-size:var(--radius-4xl)')?.text).toBe('.max-size\\:var\\(--radius-4xl\\){max-width:var(--radius-4xl);max-height:var(--radius-4xl)}')
    expect(css.createRule('min:5x')?.text).toBe('.min\\:5x{min-width:1.25rem;min-height:1.25rem}')
    expect(css.createRule('max:5x')?.text).toBe('.max\\:5x{max-width:1.25rem;max-height:1.25rem}')
    expect(css.createRule('size:5x|6x')?.text).toBe('.size\\:5x\\|6x{width:1.25rem 1.5rem;height:1.25rem 1.5rem}')
    expect(css.createRule('min:5x|6x')?.text).toBe('.min\\:5x\\|6x{min-width:1.25rem 1.5rem;min-height:1.25rem 1.5rem}')
    expect(css.createRule('max:5x|6x')?.text).toBe('.max\\:5x\\|6x{max-width:1.25rem 1.5rem;max-height:1.25rem 1.5rem}')
    expect(css.createRule('size:auto')?.text).toBe('.size\\:auto{width:auto;height:auto}')
    expect(css.createRule('size:min')?.text).toBe('.size\\:min{width:min-content;height:min-content}')
    expect(css.createRule('size:max')?.text).toBe('.size\\:max{width:max-content;height:max-content}')
    expect(css.createRule('flex-basis:sm')?.text).toBe('.flex-basis\\:sm{flex-basis:var(--container-sm)}')
    expect(css.createRule('flex-basis:2x')?.text).toBe('.flex-basis\\:2x{flex-basis:0.5rem}')
    expect(css.createRule('outline-width:1px')).toBeUndefined()
    expect(css.createRule('outline-width:2px')).toBeUndefined()
    expect(css.createRule('shape-margin:1px')?.text).toBe('.shape-margin\\:1px{shape-margin:1px}')
    expect(css.createRule('shape-margin:2x')?.text).toBe('.shape-margin\\:2x{shape-margin:0.5rem}')
    expect(css.createRule('word-spacing:1px')?.text).toBe('.word-spacing\\:1px{word-spacing:1px}')
    expect(css.createRule('word-spacing:2x')?.text).toBe('.word-spacing\\:2x{word-spacing:0.5rem}')
    expect(css.createRule('stroke:red')?.text).toBe('.stroke\\:red{stroke:var(--color-red)}')
    expect(css.createRule('stroke:.75')?.text).toBe('.stroke\\:\\.75{stroke-width:0.75}')
    expect(css.createRule('stroke-width:1px')).toBeUndefined()
    expect(css.createRule('text-underline:sm')?.text).toBe('.text-underline\\:sm{text-underline-offset:var(--spacing-sm)}')
    expect(css.createRule('text-underline-offset:2x')?.text).toBe('.text-underline-offset\\:2x{text-underline-offset:0.5rem}')
    expect(css.createRule('text-indent:sm')?.text).toBe('.text-indent\\:sm{text-indent:var(--spacing-sm)}')
    expect(css.createRule('background-size:sm')?.text).toBe('.background-size\\:sm{background-size:var(--container-sm)}')
    expect(css.createRule('background-position:2x|center')?.text).toBe('.background-position\\:2x\\|center{background-position:0.5rem center}')
    expect(css.createRule('mask-position:2x|center')?.text).toBe('.mask-position\\:2x\\|center{mask-position:0.5rem center}')
    expect(css.createRule('mask-size:sm')?.text).toBe('.mask-size\\:sm{mask-size:var(--container-sm)}')
    expect(css.createRule('perspective:4x')?.text).toBe('.perspective\\:4x{perspective:1rem}')
    expect(css.createRule('perspective-origin:2x|center')?.text).toBe('.perspective-origin\\:2x\\|center{perspective-origin:0.5rem center}')
    expect(css.createRule('transform-origin:2x|center')?.text).toBe('.transform-origin\\:2x\\|center{transform-origin:0.5rem center}')
    expect(css.createRule('text-stroke-width:1px')).toBeUndefined()
    expect(css.createRule('text-stroke-width:thin')).toBeUndefined()
    expect(css.createRule('animation-delay:fast')?.text).toBe('.animation-delay\\:fast{animation-delay:var(--duration-fast)}')
    expect(css.createRule('transition-delay:fast')?.text).toBe('.transition-delay\\:fast{transition-delay:var(--duration-fast)}')
    expect(css.createRule('font-feature-settings:tabular')?.text).toBe('.font-feature-settings\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
    expect(css.createRule('content:empty')?.text).toBe('.content\\:empty{content:var(--content-empty)}')
    expect(css.createRule("content:'x'")?.text).toBe(".content\\:\\'x\\'{content:'x'}")
    expect(css.createRule('border-width:1px')).toBeUndefined()
    expect(css.createRule('background:red')).toBeUndefined()
    expect(css.createRule('background:sm')).toBeUndefined()
    expect(css.createRule('bg:2x')).toBeUndefined()
    expect(css.createRule('transform:2x')).toBeUndefined()
    expect(css.createRule('animate:fade')?.text).toBe('.animate\\:fade{animation:var(--animate-fade)}')
    expect(css.createRule('animation:fade')?.text).toBe('.animation\\:fade{animation:fade}')
    expect(css.createRule('animation:fade')?.text).not.toContain('var(--animate-fade)')
    expect(css.createRule('animation-name:fade')).toBeUndefined()
    expect(css.createRule('container:sm')?.text).not.toContain('var(--container-sm)')
    expect(css.createRule('flex:sm')?.text).not.toContain('flex-basis')
    expect(css.createRule('flex:md')?.text).not.toContain('flex-basis')
    expect(css.createRule('m:1px')?.text).toBe('.m\\:1px{margin:1px}')
    expect(css.createRule('outline:1px|solid')?.text).toBe('.outline\\:1px\\|solid{outline:1px solid}')
    expect(css.createRule('m:sm|md')?.text).toBe('.m\\:sm\\|md{margin:var(--spacing-sm) var(--spacing-md)}')
    expect(css.createRule('m:sm|-md')?.text).toBe('.m\\:sm\\|-md{margin:var(--spacing-sm) calc(var(--spacing-md) * -1)}')
    expect(css.createRule('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
    expect(css.createRule('text-size:2xl')).toBeUndefined()
    expect(css.createRule('text-size:1rem')).toBeUndefined()
    expect(css.createRule('grid-cols:var(--cols)')?.text).toBe('.grid-cols\\:var\\(--cols\\){display:grid;grid-template-columns:repeat(var(--cols), minmax(0, 1fr))}')
    expect(css.createRule('grid-rows:var(--rows)')?.text).toBe('.grid-rows\\:var\\(--rows\\){display:grid;grid-auto-flow:column;grid-template-rows:repeat(var(--rows), minmax(0, 1fr))}')
    expect(css.createRule('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
    expect(css.createRule('grid-col-span:var(--span)')?.text).toBe('.grid-col-span\\:var\\(--span\\){grid-column:span var(--span)/span var(--span)}')
    expect(css.createRule('grid-row-span:var(--span)')?.text).toBe('.grid-row-span\\:var\\(--span\\){grid-row:span var(--span)/span var(--span)}')
    expect(css.createRule('line-clamp:var(--lines)')).toBeUndefined()
    expect(css.createRule('grid-column-span:2')).toBeUndefined()
    expect(css.createRule('lines:2')).toBeUndefined()
    expect(css.createRule('text-truncate:2')).toBeUndefined()
    expect(css.createRule('border-image:linear-gradient(red,blue)')).toBeUndefined()
    expect(css.createRule('list-style:url(/marker.svg)')).toBeUndefined()

    for (const utility of defaultManifest.utilities || []) {
      expect('values' in utility, utility.id).toBe(false)
      expect('transform' in utility, utility.id).toBe(false)
    }
    for (const utility of defaultManifest.utilities || []) {
      if (utility.matchers.some((matcher) => matcher.type === 'value')) {
        expect(utility.kind, utility.id).toBeDefined()
      }
    }
  })

  it('prunes pure native coverage and keeps Master CSS native DX utilities', () => {
    const css = createTestCSS(defaultManifest)
    const nativeCSS = createTestCSS(defaultManifest, {
      nativeDeclarationMatcher: ({ property }) => property === 'perspective-origin'
        || property === 'scroll-margin-inline-start'
        || property === 'scroll-padding-block-end'
        || property === 'background'
        || property === 'animation'
        || property === 'animation-name'
        || property === '-webkit-line-clamp'
        || property === 'font'
        || property === 'container'
        || property === 'flex'
        || property === 'border-image-source'
        || property === 'border-image-width'
        || property === 'list-style-image'
    })

    expect(css.createRule('float:left')).toBeUndefined()
    expect(css.createRule('field-sizing:content')).toBeUndefined()
    expect(css.createRule('caption-side:top')).toBeUndefined()
    expect(css.createRule('scrollbar-width:thin')).toBeUndefined()
    expect(css.createRule('transition-behavior:allow-discrete')).toBeUndefined()
    expect(css.createRule('display:block')).toBeUndefined()
    expect(css.createRule('d:block')).toBeUndefined()
    expect(css.createRule('line-clamp:none')).toBeUndefined()
    expect(css.createRule('view-transition-name:hero')).toBeUndefined()
    expect(css.createRule('vt-name:hero')).toBeUndefined()
    expect(nativeCSS.createRule('perspective-origin:100%|0')?.text).toBe('.perspective-origin\\:100\\%\\|0{perspective-origin:100% 0}')
    expect(nativeCSS.createRule('scroll-mxs:1px')?.text).toBe('.scroll-mxs\\:1px{scroll-margin-inline-start:1px}')
    expect(nativeCSS.createRule('scroll-pye:1px')?.text).toBe('.scroll-pye\\:1px{scroll-padding-block-end:1px}')
    expect(nativeCSS.createRule('background:red')?.text).toBe('.background\\:red{background:red}')
    expect(nativeCSS.createRule('animation:fade|fast|smooth')?.text).toBe('.animation\\:fade\\|fast\\|smooth{animation:fade var(--duration-fast) var(--easing-smooth)}')
    expect(nativeCSS.createRule('animation-name:fade')?.text).toBe('.animation-name\\:fade{animation-name:fade}')
    expect(nativeCSS.createRule('font:var(--font-size-x)')?.text).toBe('.font\\:var\\(--font-size-x\\){font:var(--font-size-x)}')
    expect(nativeCSS.createRule('line-clamp:none')?.text).toBe('.line-clamp\\:none{-webkit-line-clamp:none}')
    expect(nativeCSS.createRule('container:inline-size')?.text).toBe('.container\\:inline-size{container:inline-size}')
    expect(nativeCSS.createRule('flex:0|0|auto')?.text).toBe('.flex\\:0\\|0\\|auto{flex:0 0 auto}')
    expect(nativeCSS.createRule('border-image-source:url(/border.png)')?.text).toBe('.border-image-source\\:url\\(\\/border\\.png\\){border-image-source:url(/border.png)}')
    expect(nativeCSS.createRule('border-image-width:2px')?.text).toBe('.border-image-width\\:2px{border-image-width:2px}')
    expect(nativeCSS.createRule('list-style-image:url(/marker.svg)')?.text).toBe('.list-style-image\\:url\\(\\/marker\\.svg\\){list-style-image:url(/marker.svg)}')
  })

  it('moves native value namespace utilities out of matcher definitions', () => {
    const matcherKeys = collectMatcherKeys(defaultManifest)
    const utilityIds = new Set((defaultManifest.utilities || []).map((utility) => utility.id))
    const nativeValueNamespaceProperties = builtinNativeValueNamespaces.flatMap(({ properties }) => properties)

    expect('nativeValueNamespaces' in defaultManifest).toBe(false)
    expect(new Set(nativeValueNamespaceProperties).size).toBe(nativeValueNamespaceProperties.length)
    expect(nativeValueNamespaceProperties).toHaveLength(154)
    for (const property of nativeValueNamespaceProperties) {
      expect(utilityIds.has(property), property).toBe(false)
      if (!nativeValueNamespaceMatcherKeys.has(property)) {
        expect(matcherKeys.has(property), property).toBe(false)
      }
    }
    for (const utility of competitiveNativeValueUtilities) {
      expect(utilityIds.has(utility), utility).toBe(true)
      expect(matcherKeys.has(utility), utility).toBe(true)
    }
    for (const utility of removedSourceUtilityIds) {
      expect(utilityIds.has(utility), utility).toBe(false)
    }
    for (const utility of defaultManifest.utilities || []) {
      if (utility.variableAliasRefs?.length) continue
      expect(utility.matchers.some((matcher) => matcher.type === 'variable'), utility.id).toBe(false)
    }
  })

  it('keeps curated key aliases out of utility matcher keys', () => {
    const matcherKeys = collectMatcherKeys(defaultManifest)

    expect('keyAliases' in defaultManifest).toBe(false)
    expect(builtinKeyAliases).toMatchObject(retainedRadiusKeyAliases)
    for (const alias of Object.keys(builtinKeyAliases)) {
      if (retainedMatcherAliases.has(alias)) continue
      expect(matcherKeys.has(alias), alias).toBe(false)
    }
    for (const alias of retainedMatcherAliases) {
      expect(matcherKeys.has(alias), alias).toBe(true)
    }
    for (const alias of removedAliases) {
      expect(builtinKeyAliases[alias], alias).toBeUndefined()
      expect(matcherKeys.has(alias), alias).toBe(false)
    }
  })

  it('keeps compiled utility registry indexes stable and addressable', () => {
    const utilities = defaultManifest.utilities || []
    const ids = new Map<string, number[]>()
    for (const [index, utility] of utilities.entries()) {
      expect(utility.matchers?.length).toBeGreaterThan(0)
      const id = utility.id
      ids.set(id, [...(ids.get(id) || []), index])
    }

    expect([...ids].filter(([, indexes]) => indexes.length > 1)).toEqual([])
    expect('utilityBuckets' in defaultManifest).toBe(false)
    expect(createTestCSS(defaultManifest).definedUtilities).toHaveLength(utilities.length)
  })
})
