import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { builtinTokenFamilies } from '@master/css-tooling/builtins'
import { UtilityType } from '@master/css-schema/utility-type'
import {
  createDefaultManifestFromSourceFile,
  createDefaultNativeCSSFromSourceFile
} from '../scripts/generate-default-manifest'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import { createTestCSS } from './helpers/rust-engine'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

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
  'clamp-lines',
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

function getCompiledDefaultManifest() {
  compiledDefaultManifest ||= createDefaultManifestFromSourceFile(resolve(__dirname, '../src/index.css'))
  return compiledDefaultManifest
}

describe('@master/css-preset defaultManifest', () => {
  it('matches the readable preset sources and publishes only executable recipes', () => {
 const manifest = getCompiledDefaultManifest()
 expect(manifest).toEqual(defaultManifest)
 expect(manifest.version).toBe(4)
 expect(manifest.languageVersion).toBe(7)
 expect(manifest.mixins).toHaveLength(10)
 expect(new Set(manifest.mixins?.map(mixin => mixin.name)).size).toBe(10)
 for (const field of ['utilities', 'functions', 'settings', 'keyAliases']) expect(manifest).not.toHaveProperty(field)
 expect(JSON.stringify(manifest)).not.toContain('/Users/')
 expect(manifest.mixins?.find(mixin => mixin.name === '--text')?.parameters).toEqual([{ name: '--step', syntax: 'string' }])
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
    expect(compiledManifest.theme).toEqual(defaultManifest.theme)
    expect(compiledManifest.customMedia).toEqual(defaultManifest.customMedia)
    expect(Object.keys(defaultManifest.customMedia ?? {})).toHaveLength(17)
    for (const removed of ['variants', 'conditions', 'selectors', 'containerConditions']) {
      expect(defaultManifest).not.toHaveProperty(removed)
    }
  })

  it('does not publish the removed px inline alias', () => {
    expect(variablesOf(defaultManifest).some((variable) => variable.name === 'px')).toBe(false)
  })

  it('supports built-in starting-style without a preset definition', () => {
    const css = createTestCSS(defaultManifest)

    expect(css.createRule('opacity:0@start')).toBeUndefined()
    expect(css.createRule('opacity:0@starting-style')?.text).toBe(
      '@starting-style{.opacity\\:0\\@starting-style{opacity:0}}'
    )
  })

  it('does not publish removed static utility shortcuts', () => {
    const css = createTestCSS(defaultManifest)

    for (const name of removedStaticUtilityNames) {
      expect(defaultManifest.mixins?.some(mixin => mixin.name === `--${name}`), name).toBe(false)
      expect(css.createRule(name), name).toBeUndefined()
    }
  })

  it('uses explicit preset mode branches without global engine mode settings', () => {
    const css = createTestCSS(defaultManifest)

    expect(defaultManifest).not.toHaveProperty('settings')
    expect(css.createRule("margin:0.25rem")?.text).toBe(".margin\\:0\\.25rem{margin:0.25rem}")
    expect(css.createRule('fg-blue-60@dark')?.text).toBe(
      "@media (prefers-color-scheme: dark){.fg-blue-60\\@dark{color:var(--color-blue-60)}}"
    )
  })

  it('exposes Rust token families independently of preset recipes', () => {
 const families = builtinTokenFamilies.filter(family => ['font', 'bg', 'p', 'surface'].includes(family.prefix))
 expect(families).toEqual(expect.arrayContaining([
  {prefix:'font',property:'font-size',namespaces:['font-size']},
  {prefix:'font',property:'font-family',namespaces:['font-family']},
  {prefix:'font',property:'font-weight',namespaces:['font-weight']},
  {prefix:'p',property:'padding',namespaces:['spacing']},
  {prefix:'bg',property:'background-color',namespaces:['color']}
 ]))
})

  it('preserves the compiled default registry', () => {
    const css = createTestCSS(defaultManifest)
    const declarationsCSS = createTestCSS(defaultManifest)
    const text = [
      css.createRule('display:inline-flex')?.text,
      css.createRule('background-image:linear-gradient(#000,#fff)')?.text,
      css.createRule('bg-blue')?.text,
      css.createRule('bg-surface-base')?.text,
      css.createRule('bg-surface-base')?.text,
      css.createRule('grid-cols(3)')?.text,
      css.createRule('clamp-lines(3)')?.text,
      css.createRule('text-2xl')?.text
    ].join('')
    expect(text).toContain('display:inline-flex')
    expect(text).toContain('background-image:linear-gradient(#000,#fff)')
    expect(text).toContain('background-color:var(--color-blue)')
    expect(text).toContain('background-color:var(--color-surface-base)')
    expect(text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
    expect(text).toContain('-webkit-line-clamp:3')
    expect(text).not.toContain('null')
    expect(css.createRule('gradient(#000,#fff)')).toBeUndefined()
    expect(declarationsCSS.createRule("background:canvas")?.text).toContain('background:canvas')
    expect(declarationsCSS.createRule('surface:blue')?.text).toContain('surface:blue')
    expect(declarationsCSS.createRule('surface:#fff')?.text).toContain('surface:#fff')
  })

  it('removed fixed aliases no longer register classes', () => {
    const css = createTestCSS(defaultManifest)
    for (const name of ['block', 'hidden', 'inline-flex', 'items-center', 'box-border']) expect(css.createRule(name)).toBeUndefined()
  })

  it('executes mixins, token families and native replacements', () => {
    const css = createTestCSS(defaultManifest)

    expect(css.createRule('display:block')?.text).toBe('.display\\:block{display:block}')
    expect(css.createRule('bottom:0')?.text).toBe('.bottom\\:0{bottom:0}')
    for (const name of ['fit', 'full', 'center', 'middle', 'round', 'surface-base']) expect(css.createRule(name)).toBeUndefined()
    expect(css.createRule('r-pill')?.text).toBe('.r-pill{border-radius:var(--radius-pill)}')
    expect(css.createRule('border-radius:1e9em')?.text).toBe('.border-radius\\:1e9em{border-radius:1e9em}')
    expect(css.createRule('font-antialiased')?.text).toBe('.font-antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}')
    expect(css.createRule('text-align:center')?.text).toBe('.text-align\\:center{text-align:center}')
    expect(css.createRule('align-items:center')?.text).toBe('.align-items\\:center{align-items:center}')
    expect(css.createRule('align-content:space-between')?.text).toBe('.align-content\\:space-between{align-content:space-between}')
    expect(css.createRule('justify-content:space-between')?.text).toBe('.justify-content\\:space-between{justify-content:space-between}')
    expect(css.createRule('align-self:start')?.text).toBe('.align-self\\:start{align-self:start}')
    expect(css.createRule('background-origin:border-box')?.text).toBe('.background-origin\\:border-box{background-origin:border-box}')
    expect(css.createRule('box-sizing:border-box')?.text).toBe('.box-sizing\\:border-box{box-sizing:border-box}')
    expect(css.createRule('transform-box:view-box')?.text).toBe('.transform-box\\:view-box{transform-box:view-box}')
    expect(css.createRule('overflow-wrap:break-word')?.text).toBe('.overflow-wrap\\:break-word{overflow-wrap:break-word}')
    expect(css.createRule('background-size:cover')?.text).toBe('.background-size\\:cover{background-size:cover}')
    expect(css.createRule('object-fit:cover')?.text).toBe('.object-fit\\:cover{object-fit:cover}')
    expect(css.createRule('border-style:solid')?.text).toBe('.border-style\\:solid{border-style:solid}')
    expect(css.createRule('border-style:groove')?.text).toBe('.border-style\\:groove{border-style:groove}')
    expect(css.createRule('border-left-style:solid')?.text).toBe('.border-left-style\\:solid{border-left-style:solid}')
    expect(css.createRule('border-left-style:outset')?.text).toBe('.border-left-style\\:outset{border-left-style:outset}')
    expect(css.createRule('border-inline-style:solid')?.text).toBe('.border-inline-style\\:solid{border-inline-style:solid}')
    expect(css.createRule('border-block-style:ridge')?.text).toBe('.border-block-style\\:ridge{border-block-style:ridge}')
    expect(css.createRule('outline-width:medium')?.text).toBe('.outline-width\\:medium{outline-width:medium}')
    expect(css.createRule('outline-width:thick')?.text).toBe('.outline-width\\:thick{outline-width:thick}')
    expect(css.createRule('outline-width:thin')?.text).toBe('.outline-width\\:thin{outline-width:thin}')
    expect(css.createRule('text-fill-color-text-red')?.text).toBe('.text-fill-color-text-red{-webkit-text-fill-color:var(--color-text-red)}')
    expect(css.createRule('text-decoration-color-text-red')?.text).toBe('.text-decoration-color-text-red{text-decoration-color:var(--color-text-red)}')
    expect(css.createRule('text-stroke-color-red')?.text).toBe('.text-stroke-color-red{-webkit-text-stroke-color:var(--color-red)}')
    expect(css.createRule("-webkit-text-stroke:1px")?.text).toBe(".-webkit-text-stroke\\:1px{-webkit-text-stroke:1px}")
    expect(css.createRule('text-decoration-thickness:2px')?.text).toBe('.text-decoration-thickness\\:2px{text-decoration-thickness:2px}')
    expect(css.createRule('user-select:none')?.text).toBe('.user-select\\:none{-webkit-user-select:none;user-select:none}')
    expect(css.createRule('user-drag:none')?.text).toBe('.user-drag\\:none{-webkit-user-drag:none;user-drag:none}')
    expect(css.createRule('box-decoration-break:clone')?.text).toBe('.box-decoration-break\\:clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}')
    expect(css.createRule('font-feature-settings-tabular')?.text).toBe('.font-feature-settings-tabular{font-feature-settings:var(--font-feature-tabular)}')
    expect(css.createRule('content-empty')?.text).toBe('.content-empty{content:var(--content-empty)}')
    expect(css.createRule('font-sm')?.text).toContain('font-size:var(--font-size-sm)')
    expect(css.createRule('m-md')?.text).toContain('margin:var(--spacing-md)')
    expect(css.createRule('sr-only')?.text).toContain('position:absolute')
    expect(css.createRule('sr-only')?.text).toContain('clip:rect(0, 0, 0, 0)')

    const orderedCSS = createTestCSS(defaultManifest)
    orderedCSS.ensureClassRules('sr-only', 'position:relative')
    expect(orderedCSS.utilitiesLayer.text.indexOf('position:absolute')).toBeLessThan(orderedCSS.utilitiesLayer.text.indexOf('position:relative'))
    expect(orderedCSS.createRule('sr-only')?.type).toBe(UtilityType.Semantic)
    expect(orderedCSS.createRule('align-items:center')?.type).toBe(UtilityType.Normal)
  })

  it('keeps named tokens separate from native declaration values', () => {
    const css = createTestCSS(defaultManifest)
    const declarationsCSS = createTestCSS(defaultManifest)

    expect(declarationsCSS.createRule('text:center')).toBeUndefined()
    expect(declarationsCSS.createRule('text:underline')).toBeUndefined()
    expect(declarationsCSS.createRule("background:cover")?.text).toContain('background:cover')
    expect(declarationsCSS.createRule('object:cover')?.text).toContain('object:cover')
    expect(declarationsCSS.createRule('border-solid')).toBeUndefined()
    expect(declarationsCSS.createRule('border-l-solid')).toBeUndefined()
    expect(declarationsCSS.createRule('rt:4x')?.text).toContain('rt:4x')
    expect(declarationsCSS.createRule('border-top-radius:4x')?.text).toContain('border-top-radius:4x')
    expect(css.createRule('background-color:#fff')?.text).toBe('.background-color\\:\\#fff{background-color:#fff}')
    expect(css.createRule('border-width:1px')?.text).toBe('.border-width\\:1px{border-width:1px}')
    expect(css.createRule("border:line")?.text).toBe(".border\\:line{border:line}")
    expect(css.createRule('b-line-divider')?.text).toBe('.b-line-divider{border-color:var(--color-line-divider)}')
    expect(css.createRule('border-top-width:1px')?.text).toBe('.border-top-width\\:1px{border-top-width:1px}')
    expect(css.createRule("border-left:line")?.text).toBe(".border-left\\:line{border-left:line}")
    expect(css.createRule('border-inline-width:1px')?.text).toBe('.border-inline-width\\:1px{border-inline-width:1px}')
    expect(css.createRule("border-block:line")?.text).toBe(".border-block\\:line{border-block:line}")
    expect(css.createRule("border:1px|solid|line")?.text).toBe(".border\\:1px\\|solid\\|line{border:1px solid line}")
    expect(css.createRule("border-top:1px|solid|line")?.text).toBe(".border-top\\:1px\\|solid\\|line{border-top:1px solid line}")
    expect(css.createRule("border:1px|line")?.text).toBe(".border\\:1px\\|line{border:1px line}")
    expect(css.createRule("border:1px|solid|var(--color-line-divider)")?.text).toBe(".border\\:1px\\|solid\\|var\\(--color-line-divider\\){border:1px solid var(--color-line-divider)}")
    expect(css.createRule("border-top:1px|solid|var(--color-line-divider)")?.text).toBe(".border-top\\:1px\\|solid\\|var\\(--color-line-divider\\){border-top:1px solid var(--color-line-divider)}")
    expect(css.createRule("border:1px|var(--color-line-divider)")?.text).toBe(".border\\:1px\\|var\\(--color-line-divider\\){border:1px var(--color-line-divider)}")
    expect(css.createRule('b-gray-20')?.text).toBe('.b-gray-20{border-color:var(--color-gray-20)}')
    expect(css.createRule('bl-gray-20')?.text).toBe('.bl-gray-20{border-left-color:var(--color-gray-20)}')
    expect(css.createRule('by-gray-20')?.text).toBe('.by-gray-20{border-block-color:var(--color-gray-20)}')
    expect(css.createRule("border:1px|solid|var(--color-gray-20)")?.text).toBe(".border\\:1px\\|solid\\|var\\(--color-gray-20\\){border:1px solid var(--color-gray-20)}")
    expect(css.createRule("border-top:1px|solid|var(--color-gray-20)")?.text).toBe(".border-top\\:1px\\|solid\\|var\\(--color-gray-20\\){border-top:1px solid var(--color-gray-20)}")
    expect(css.createRule("border:1px|var(--color-gray-20)")?.text).toBe(".border\\:1px\\|var\\(--color-gray-20\\){border:1px var(--color-gray-20)}")
    expect(css.createRule("border:1px|solid")?.text).toBe(".border\\:1px\\|solid{border:1px solid}")
    expect(css.createRule('border:transparent')?.text).toBe('.border\\:transparent{border:transparent}')
    expect(css.createRule('outline:medium')?.text).toBe('.outline\\:medium{outline:medium}')
    expect(css.createRule('font-sm')?.text).toBe('.font-sm{font-size:var(--font-size-sm)}')
    expect(css.createRule('font-size:1rem')?.text).toBe('.font-size\\:1rem{font-size:1rem}')
    expect(css.createRule("margin-inline-start:1rem")?.text).toBe(".margin-inline-start\\:1rem{margin-inline-start:1rem}")
    expect(css.createRule("padding-block-end:1rem")?.text).toBe(".padding-block-end\\:1rem{padding-block-end:1rem}")
    expect(css.createRule("inset-inline-start:1rem")?.text).toBe(".inset-inline-start\\:1rem{inset-inline-start:1rem}")
    expect(css.createRule('size-x-md')?.text).toBe('.size-x-md{inline-size:var(--container-md)}')
    expect(declarationsCSS.createRule('mi:4x')?.text).toContain('mi:4x')
    expect(declarationsCSS.createRule('pbe:4x')?.text).toContain('pbe:4x')
    expect(declarationsCSS.createRule('iis:4x')?.text).toContain('iis:4x')
    expect(declarationsCSS.createRule('bs:md')?.text).toContain('bs:md')
    expect(css.createRule('fg-text-red')?.text).toBe('.fg-text-red{color:var(--color-text-red)}')
    expect(css.createRule('fg-text-blue')?.text).toBe('.fg-text-blue{color:var(--color-text-blue)}')
    expect(css.createRule('fg-blue-60')?.text).toBe('.fg-blue-60{color:var(--color-blue-60)}')
    expect(declarationsCSS.createRule('text:blue-60')).toBeUndefined()
    expect(declarationsCSS.createRule('text:#fff')).toBeUndefined()
    expect(declarationsCSS.createRule('text:transparent')).toBeUndefined()
    expect(css.createRule('fg-text-body')?.text).toBe('.fg-text-body{color:var(--color-text-body)}')
    expect(css.createRule('fg-text-inverse')?.text).toBe('.fg-text-inverse{color:var(--color-text-inverse)}')
    expect(css.createRule('fg-text-muted')?.text).toBe('.fg-text-muted{color:var(--color-text-muted)}')
    expect(css.createRule('fg-text-link')?.text).toBe('.fg-text-link{color:var(--color-text-link)}')
    expect(css.createRule('fg-text-link-hover')?.text).toBe('.fg-text-link-hover{color:var(--color-text-link-hover)}')
    expect(css.createRule('fg-muted')).toBeUndefined()
    expect(css.createRule('text-decoration-text-red')?.text).toBe('.text-decoration-text-red{text-decoration-color:var(--color-text-red)}')
    expect(css.createRule('text-stroke-red')?.text).toBe('.text-stroke-red{-webkit-text-stroke-color:var(--color-red)}')
    expect(css.createRule('text-decoration-thickness:px')?.text).toBe('.text-decoration-thickness\\:px{text-decoration-thickness:px}')
    expect(css.createRule('text-decoration-thickness:var(--thickness)')?.text).toBe('.text-decoration-thickness\\:var\\(--thickness\\){text-decoration-thickness:var(--thickness)}')
    expect(css.createRule('background-color-red')?.text).toBe('.background-color-red{background-color:var(--color-red)}')
    expect(css.createRule('background-color:#fff')?.text).toBe('.background-color\\:\\#fff{background-color:#fff}')
    expect(css.createRule('background-color:base')?.text).toBe('.background-color\\:base{background-color:base}')
    expect(declarationsCSS.createRule("background:canvas")?.text).toContain('background:canvas')
    expect(declarationsCSS.createRule("background:surface")?.text).toContain('background:surface')
    expect(css.createRule('bg-surface-base')?.text).toBe('.bg-surface-base{background-color:var(--color-surface-base)}')
    expect(css.createRule('bg-surface-floating/.9')?.text).toBe('.bg-surface-floating\\/\\.9{background-color:color-mix(in oklab,var(--color-surface-floating) 90%,transparent)}')
    expect(declarationsCSS.createRule('surface:blue')?.text).toContain('surface:blue')
    expect(declarationsCSS.createRule('surface:#fff')?.text).toContain('surface:#fff')
    expect(css.createRule('font-size-sm')?.text).toBe('.font-size-sm{font-size:var(--font-size-sm)}')
    expect(css.createRule('font-size:1rem')?.text).toBe('.font-size\\:1rem{font-size:1rem}')
    expect(css.createRule('font-family-sans')?.text).toBe('.font-family-sans{font-family:var(--font-family-sans)}')
    expect(css.createRule('font-weight-bold')?.text).toBe('.font-weight-bold{font-weight:var(--font-weight-bold)}')
    expect(declarationsCSS.createRule('font:var(--font-size-x)')?.text).toContain('font:var(--font-size-x)')
    // Removed preset sizes use only the generic native fallback, never paired dimensions.
    for (const key of ['size', 'min-size', 'max-size', 'min', 'max']) {
      expect(css.createRule(`${key}:1.25rem`)?.text).toContain(`{${key}:1.25rem}`)
      expect(css.createRule(`${key}-md`)).toBeUndefined()
    }
    expect(css.createRule('width-md')?.text).toContain('width:var(--container-md)')
    expect(css.createRule('height-md')?.text).toContain('height:var(--container-md)')
    expect(css.createRule('flex-basis-sm')?.text).toBe('.flex-basis-sm{flex-basis:var(--container-sm)}')
    expect(css.createRule('flex-basis:0.5rem')?.text).toBe('.flex-basis\\:0\\.5rem{flex-basis:0.5rem}')
    expect(declarationsCSS.createRule('outline-width:1px')?.text).toContain('outline-width:1px')
    expect(declarationsCSS.createRule('outline-width:2px')?.text).toContain('outline-width:2px')
    expect(css.createRule('shape-margin:1px')?.text).toBe('.shape-margin\\:1px{shape-margin:1px}')
    expect(css.createRule('shape-margin:0.5rem')?.text).toBe('.shape-margin\\:0\\.5rem{shape-margin:0.5rem}')
    expect(css.createRule('word-spacing:1px')?.text).toBe('.word-spacing\\:1px{word-spacing:1px}')
    expect(css.createRule('word-spacing:0.5rem')?.text).toBe('.word-spacing\\:0\\.5rem{word-spacing:0.5rem}')
    expect(css.createRule('stroke-red')?.text).toBe('.stroke-red{stroke:var(--color-red)}')
    expect(css.createRule('stroke-width:.75')?.text).toBe('.stroke-width\\:\\.75{stroke-width:.75}')
    expect(declarationsCSS.createRule('stroke-width:1px')?.text).toContain('stroke-width:1px')
    expect(css.createRule('text-underline-sm')?.text).toBe('.text-underline-sm{text-underline-offset:var(--spacing-sm)}')
    expect(css.createRule('text-underline-offset:0.5rem')?.text).toBe('.text-underline-offset\\:0\\.5rem{text-underline-offset:0.5rem}')
    expect(css.createRule('text-indent-sm')?.text).toBe('.text-indent-sm{text-indent:var(--spacing-sm)}')
    expect(css.createRule('background-size-sm')?.text).toBe('.background-size-sm{background-size:var(--container-sm)}')
    expect(css.createRule('background-position:0.5rem|center')?.text).toBe('.background-position\\:0\\.5rem\\|center{background-position:0.5rem center}')
    expect(css.createRule('mask-position:0.5rem|center')?.text).toBe('.mask-position\\:0\\.5rem\\|center{mask-position:0.5rem center}')
    expect(css.createRule('mask-size-sm')?.text).toBe('.mask-size-sm{mask-size:var(--container-sm)}')
    expect(css.createRule('perspective:1rem')?.text).toBe('.perspective\\:1rem{perspective:1rem}')
    expect(css.createRule('perspective-origin:0.5rem|center')?.text).toBe('.perspective-origin\\:0\\.5rem\\|center{perspective-origin:0.5rem center}')
    expect(css.createRule('transform-origin:0.5rem|center')?.text).toBe('.transform-origin\\:0\\.5rem\\|center{transform-origin:0.5rem center}')
    expect(declarationsCSS.createRule("-webkit-text-stroke-width:1px")?.text).toContain("-webkit-text-stroke-width:1px")
    expect(declarationsCSS.createRule("-webkit-text-stroke-width:thin")?.text).toContain("-webkit-text-stroke-width:thin")
    expect(css.createRule('animation-delay-fast')?.text).toBe('.animation-delay-fast{animation-delay:var(--duration-fast)}')
    expect(css.createRule('transition-delay-fast')?.text).toBe('.transition-delay-fast{transition-delay:var(--duration-fast)}')
    expect(css.createRule('font-feature-settings-tabular')?.text).toBe('.font-feature-settings-tabular{font-feature-settings:var(--font-feature-tabular)}')
    expect(css.createRule('content-empty')?.text).toBe('.content-empty{content:var(--content-empty)}')
    expect(css.createRule("content:'x'")?.text).toBe(".content\\:\\'x\\'{content:'x'}")
    expect(declarationsCSS.createRule('border-width:1px')?.text).toContain('border-width:1px')
    expect(declarationsCSS.createRule('background:red')?.text).toContain('background:red')
    expect(declarationsCSS.createRule('background:sm')?.text).toContain('background:sm')
    expect(declarationsCSS.createRule("background:0.5rem")?.text).toContain('background:0.5rem')
    expect(declarationsCSS.createRule('transform:0.5rem')?.text).toContain('transform:0.5rem')
    expect(css.createRule('animate-fade')?.text).toBe('.animate-fade{animation:var(--animate-fade)}')
    expect(css.createRule('animation:fade')?.text).toBe('.animation\\:fade{animation:fade}')
    expect(css.createRule('animation:fade')?.text).not.toContain('var(--animate-fade)')
    expect(declarationsCSS.createRule('animation-name:fade')?.text).toContain('animation-name:fade')
    expect(css.createRule('container:sm')?.text).not.toContain('var(--container-sm)')
    expect(css.createRule('flex:sm')?.text).not.toContain('flex-basis')
    expect(css.createRule('flex:md')?.text).not.toContain('flex-basis')
    expect(css.createRule("margin:1px")?.text).toBe(".margin\\:1px{margin:1px}")
    expect(css.createRule('outline:1px|solid')?.text).toBe('.outline\\:1px\\|solid{outline:1px solid}')
    expect(css.createRule("margin:var(--spacing-sm)|var(--spacing-md)")?.text).toBe(".margin\\:var\\(--spacing-sm\\)\\|var\\(--spacing-md\\){margin:var(--spacing-sm) var(--spacing-md)}")
    expect(css.createRule("margin:var(--spacing-sm)|calc(var(--spacing-md)|*|-1)")?.text).toBe(".margin\\:var\\(--spacing-sm\\)\\|calc\\(var\\(--spacing-md\\)\\|\\*\\|-1\\){margin:var(--spacing-sm) calc(var(--spacing-md) * -1)}")
    expect(css.createRule('text-2xl')?.text).toContain('font-size:var(--text-2xl)')
    expect(declarationsCSS.createRule('text-size:2xl')?.text).toContain('text-size:2xl')
    expect(declarationsCSS.createRule('text-size:1rem')?.text).toContain('text-size:1rem')
    expect(css.createRule('grid-cols(var(--cols))')).toBeUndefined()
    expect(css.createRule('grid-rows(var(--rows))')).toBeUndefined()
    expect(css.createRule('grid-cols(3)')?.text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
    expect(css.createRule('grid-rows(2)')?.text).toContain('grid-auto-flow:column;grid-template-rows:repeat(2, minmax(0, 1fr))')
    expect(css.createRule('grid-col-span(2)')?.text).toContain('grid-column:span 2/span 2')
    expect(css.createRule('grid-col-span(var(--span))')).toBeUndefined()
    expect(css.createRule('grid-row-span(var(--span))')).toBeUndefined()
    expect(declarationsCSS.createRule('line-clamp:var(--lines)')?.text).toContain('line-clamp:var(--lines)')
    expect(declarationsCSS.createRule('grid-column-span:2')?.text).toContain('grid-column-span:2')
    expect(declarationsCSS.createRule('lines:2')?.text).toContain('lines:2')
    expect(declarationsCSS.createRule('text-truncate:2')?.text).toContain('text-truncate:2')
    expect(declarationsCSS.createRule('border-image:linear-gradient(red,blue)')?.text).toContain('border-image:linear-gradient(red,blue)')
    expect(declarationsCSS.createRule('list-style:url(/marker.svg)')?.text).toContain('list-style:url(/marker.svg)')

  })

  it('preserves native declarations and explicit property aliases', () => {
    const css = createTestCSS(defaultManifest)
    const nativeCSS = createTestCSS(defaultManifest)

    expect(css.createRule('float:left')?.text).toContain('float:left')
    expect(css.createRule('field-sizing:content')?.text).toContain('field-sizing:content')
    expect(css.createRule('caption-side:top')?.text).toContain('caption-side:top')
    expect(css.createRule('scrollbar-width:thin')?.text).toContain('scrollbar-width:thin')
    expect(css.createRule('transition-behavior:allow-discrete')?.text).toContain('transition-behavior:allow-discrete')
    expect(css.createRule('display:block')?.text).toContain('display:block')
    expect(css.createRule('d:block')?.text).toContain('d:block')
    expect(css.createRule('line-clamp:none')?.text).toContain('line-clamp:none')
    expect(css.createRule('view-transition-name:hero')?.text).toContain('view-transition-name:hero')
    expect(css.createRule('vt-name:hero')?.text).toContain('vt-name:hero')
    expect(nativeCSS.createRule('perspective-origin:100%|0')?.text).toBe('.perspective-origin\\:100\\%\\|0{perspective-origin:100% 0}')
    expect(nativeCSS.createRule("scroll-margin-inline-start:1px")?.text).toBe(".scroll-margin-inline-start\\:1px{scroll-margin-inline-start:1px}")
    expect(nativeCSS.createRule("scroll-padding-block-end:1px")?.text).toBe(".scroll-padding-block-end\\:1px{scroll-padding-block-end:1px}")
    expect(nativeCSS.createRule('background:red')?.text).toBe('.background\\:red{background:red}')
    expect(nativeCSS.createRule('animation:fade|var(--duration-fast)|var(--easing-smooth)')?.text).toBe('.animation\\:fade\\|var\\(--duration-fast\\)\\|var\\(--easing-smooth\\){animation:fade var(--duration-fast) var(--easing-smooth)}')
    expect(nativeCSS.createRule('animation-name:fade')?.text).toBe('.animation-name\\:fade{animation-name:fade}')
    expect(nativeCSS.createRule('font:var(--font-size-x)')?.text).toBe('.font\\:var\\(--font-size-x\\){font:var(--font-size-x)}')
    expect(nativeCSS.createRule('line-clamp:none')?.text).toBe('.line-clamp\\:none{line-clamp:none}')
    expect(nativeCSS.createRule('container:inline-size')?.text).toBe('.container\\:inline-size{container:inline-size}')
    expect(nativeCSS.createRule('flex:0|0|auto')?.text).toBe('.flex\\:0\\|0\\|auto{flex:0 0 auto}')
    expect(nativeCSS.createRule('border-image-source:url(/border.png)')?.text).toBe('.border-image-source\\:url\\(\\/border\\.png\\){border-image-source:url(/border.png)}')
    expect(nativeCSS.createRule('border-image-width:2px')?.text).toBe('.border-image-width\\:2px{border-image-width:2px}')
    expect(nativeCSS.createRule('list-style-image:url(/marker.svg)')?.text).toBe('.list-style-image\\:url\\(\\/marker\\.svg\\){list-style-image:url(/marker.svg)}')
  })

  it('keeps token registration out of the preset manifest', () => {
 expect(defaultManifest).not.toHaveProperty('utilities')
 const css = createTestCSS(defaultManifest)
 expect(css.createRule('display:block')?.text).toContain('display:block')
 expect(css.createRule('outline-thin')).toBeUndefined()
 expect(css.createRule('outline-width:thin')?.text).toContain('outline-width:thin')
 expect(css.createRule('text-underline-md')?.text).toContain('text-underline-offset:var(--spacing-md)')
})

  it('separates raw properties from token abbreviations and preserves SVG r', () => {
 const css = createTestCSS(defaultManifest)
 for (const alias of ['p', 'fg', 'bg', 'w', 'h', 'z']) expect(css.createRule(alias + ':1rem')).toBeUndefined()
 expect(css.createRule('p-md')?.text).toContain('padding:var(--spacing-md)')
 expect(css.createRule('r-md')?.text).toContain('border-radius:var(--radius-md)')
 expect(css.createRule('r:1rem')?.text).toContain('r:1rem')
})

  it('publishes unique mixin names with no source-local metadata', () => {
 const mixins = defaultManifest.mixins || []
 expect(new Set(mixins.map(mixin => mixin.name)).size).toBe(mixins.length)
 expect(JSON.stringify(mixins)).not.toContain('"source":')
 expect(defaultManifest).not.toHaveProperty('utilityBuckets')
})
})
