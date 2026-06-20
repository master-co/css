import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    builtinKeyAliases,
    builtinNamespaceSet,
    builtinNativeValueNamespaces,
    createCSS
} from '@master/css-engine'
import UtilityType from 'shared/utility-type'
import { createDefaultPlanFromSourceFile } from '../scripts/generate-default-plan'
import defaultPlanJSON from '../src/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const __dirname = dirname(fileURLToPath(import.meta.url))

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
    'jc',
    'ji',
    'js',
    'line-h',
    'ls',
    'o',
    'obj',
    's',
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

function collectMatcherKeys(plan: MasterCSSPlan) {
    const keys = new Set<string>()
    for (const utility of plan.utilities || []) {
        for (const matcher of utility.matchers || []) {
            if ('keys' in matcher) {
                matcher.keys.forEach((key) => keys.add(key))
            }
        }
    }
    return keys
}

function hasCSSVariableAssignmentUtility(plan: MasterCSSPlan) {
    return (plan.utilities || []).some((utility) =>
        ((utility.emit as { type: string }).type === 'css-variable-assignment')
        || utility.matchers.some((matcher) => (matcher as { type: string }).type === 'css-variable-assignment')
    )
}

describe('@master/css-preset defaultPlan', () => {
    it('matches the readable preset sources', () => {
        const plan = createDefaultPlanFromSourceFile(resolve(__dirname, '../src/index.css'))
        const utilities = plan.utilities || []

        expect(utilities).toHaveLength(180)
        expect(utilities[0]?.order).toBe(utilities.length - 1)
        expect(utilities[utilities.length - 1]?.order).toBe(0)
        expect(utilities.some((utility) => utility.id === 'group')).toBe(false)
        expect(utilities.some((utility) => (utility.emit as { type: string }).type === 'group')).toBe(false)
        expect(utilities.some((utility) => utility.matchers.some((matcher) => (matcher as { type: string }).type === 'group'))).toBe(false)
        expect(utilities.some((utility) => utility.id === 'animation')).toBe(false)
        expect(utilities.some((utility) => utility.id === 'animate:<~animate>')).toBe(true)
        expect(utilities.some((utility) => utility.id === 'font:<~font-family|=font|~font-weight|~font-size|*>')).toBe(false)
        expect(utilities.some((utility) => 'transform' in utility)).toBe(false)
        expect(utilities.some((utility) => (utility.emit as { type: string }).type === 'pair')).toBe(false)
        expect(utilities.some((utility) => utility.matchers.some((matcher) => (matcher as { type: string }).type === 'function-prefix'))).toBe(false)
        expect('functions' in plan).toBe(false)
        expect('functions' in defaultPlan).toBe(false)
        expect('settings' in plan).toBe(false)
        expect('settings' in defaultPlan).toBe(false)
        expect(hasCSSVariableAssignmentUtility(plan)).toBe(false)
        expect(hasCSSVariableAssignmentUtility(defaultPlan)).toBe(false)
        expect(plan).toEqual(defaultPlan)
    }, 20000)

    it('matches the CSS-authored preset plan facets', () => {
        const compiledPlan = createDefaultPlanFromSourceFile(resolve(__dirname, '../src/index.css'))
        expect(compiledPlan.variables).toEqual(defaultPlan.variables)
        expect(compiledPlan.animations).toEqual(defaultPlan.animations)
        expect(stripRaw(compiledPlan.variants)).toEqual(stripRaw(defaultPlan.variants))
        expect(compiledPlan.atRules).toEqual(defaultPlan.atRules)
        expect(compiledPlan.breakpointAtRules).toEqual(defaultPlan.breakpointAtRules)
        expect(compiledPlan.containerAtRules).toEqual(defaultPlan.containerAtRules)
        expect(compiledPlan.selectors).toEqual(defaultPlan.selectors)
    }, 20000)

    it('does not publish the removed px inline alias', () => {
        expect(defaultPlan.variables?.some((variable) => variable.name === 'px')).toBe(false)
    })

    it('uses engine default settings when the preset plan omits settings', () => {
        const css = createCSS(defaultPlan)

        expect(defaultPlan.settings).toBeUndefined()
        expect(css.settings).toEqual({
            rootSize: 16,
            baseUnit: 4,
            defaultMode: 'light',
            modeTrigger: 'media',
            modes: ['light', 'dark']
        })
    })

    it('keeps preset variable alias refs inside registered namespaces', () => {
        const variableNamespaces = new Set((defaultPlan.variables || [])
            .map((variable) => variable.namespace)
            .filter((namespace): namespace is string => Boolean(namespace)))
        const variableAliasRefs = [
            ...builtinNativeValueNamespaces.flatMap((namespace) => namespace.variableAliasRefs),
            ...(defaultPlan.utilities || []).flatMap((utility) => utility.variableAliasRefs || [])
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
        const css = createCSS(defaultPlan)
        const text = [
            css.create('inline-flex')?.text,
            css.create('bg:linear-gradient(#000,#fff)')?.text,
            css.create('bg:blue')?.text,
            css.create('grid-cols:3')?.text,
            css.create('line-clamp:3')?.text,
            css.create('text:2xl')?.text
        ].join('')
        expect(text).toContain('display:inline-flex')
        expect(text).toContain('background-image:linear-gradient(#000,#fff)')
        expect(text).toContain('background-color:var(--color-blue)')
        expect(text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
        expect(text).toContain('-webkit-line-clamp:3')
        expect(text).not.toContain('null')
        expect(css.create('gradient(#000,#fff)')).toBeUndefined()
    })

    it('executes CSS-authored semantic and enum pattern utilities', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('block')?.text).toBe('.block{display:block}')
        expect(css.create('bottom')?.text).toBe('.bottom{bottom:0}')
        expect(css.create('center')?.text).toBe('.center{left:0;right:0;margin-left:auto;margin-right:auto}')
        expect(css.create('rounded')?.text).toBe('.rounded{border-radius:1e9em}')
        expect(css.create('font-antialiased')?.text).toBe('.font-antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}')
        expect(css.create('text-center')?.text).toBe('.text-center{text-align:center}')
        expect(css.create('items-center')?.text).toBe('.items-center{align-items:center}')
        expect(css.create('justify-between')?.text).toBe('.justify-between{justify-content:space-between}')
        expect(css.create('self-start')?.text).toBe('.self-start{align-self:start}')
        expect(css.create('box-border')?.text).toBe('.box-border{box-sizing:border-box}')
        expect(css.create('wrap-break-word')?.text).toBe('.wrap-break-word{overflow-wrap:break-word}')
        expect(css.create('bg-cover')?.text).toBe('.bg-cover{background-size:cover}')
        expect(css.create('object-cover')?.text).toBe('.object-cover{object-fit:cover}')
        expect(css.create('b-solid')?.text).toBe('.b-solid{border-style:solid}')
        expect(css.create('b-groove')?.text).toBe('.b-groove{border-style:groove}')
        expect(css.create('bl-solid')?.text).toBe('.bl-solid{border-left-style:solid}')
        expect(css.create('bl-outset')?.text).toBe('.bl-outset{border-left-style:outset}')
        expect(css.create('bx-solid')?.text).toBe('.bx-solid{border-inline-style:solid}')
        expect(css.create('by-ridge')?.text).toBe('.by-ridge{border-block-style:ridge}')
        expect(css.create('outline-medium')?.text).toBe('.outline-medium{outline-width:medium}')
        expect(css.create('outline-thick')?.text).toBe('.outline-thick{outline-width:thick}')
        expect(css.create('outline-thin')?.text).toBe('.outline-thin{outline-width:thin}')
        expect(css.create('text-fill-color:red')?.text).toBe('.text-fill-color\\:red{-webkit-text-fill-color:var(--color-red)}')
        expect(css.create('text-decoration-color:red')?.text).toBe('.text-decoration-color\\:red{text-decoration-color:var(--color-red)}')
        expect(css.create('text-stroke-color:red')?.text).toBe('.text-stroke-color\\:red{-webkit-text-stroke-color:var(--color-red)}')
        expect(css.create('text-stroke:1px')?.text).toBe('.text-stroke\\:1px{-webkit-text-stroke-width:1px}')
        expect(css.create('text-decoration-thickness:2px')?.text).toBe('.text-decoration-thickness\\:2px{text-decoration-thickness:2px}')
        expect(css.create('user-select:none')?.text).toBe('.user-select\\:none{-webkit-user-select:none;user-select:none}')
        expect(css.create('user-drag:none')?.text).toBe('.user-drag\\:none{-webkit-user-drag:none;user-drag:none}')
        expect(css.create('box-decoration-break:clone')?.text).toBe('.box-decoration-break\\:clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}')
        expect(css.create('line-clamp:none')?.text).toContain('-webkit-line-clamp:none')
        expect(css.create('font-feature-settings:tabular')?.text).toBe('.font-feature-settings\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
        expect(css.create('content:empty')?.text).toBe('.content\\:empty{content:var(--content-empty)}')
        expect(css.create('font-sm')).toBeUndefined()
        expect(css.create('m-md')).toBeUndefined()
        expect(css.create('sr-only')?.text).toContain('position:absolute')
        expect(css.create('sr-only')?.text).toContain('clip:rect(0, 0, 0, 0)')

        expect(defaultPlan.utilityBuckets?.pattern).toHaveLength(40)
        expect(defaultPlan.utilities?.some((utility) => utility.id === '.text-center')).toBe(false)
        expect(defaultPlan.utilities?.find((utility) => utility.id === 'text-<left|center|right|start|end|justify>'))
            .toMatchObject({
                type: UtilityType.Semantic,
                matchers: [{
                    type: 'pattern',
                    prefix: 'text-',
                    values: ['left', 'center', 'right', 'start', 'end', 'justify']
                }]
            })
        expect(defaultPlan.utilities?.some((utility) => utility.id === '.items-center')).toBe(false)
        expect(defaultPlan.utilities?.find((utility) => utility.id === 'items-<baseline|center|end|flex-end|flex-start|normal|self-end|self-start|start|stretch>'))
            .toMatchObject({
                type: UtilityType.Semantic,
                matchers: [{
                    type: 'pattern',
                    prefix: 'items-',
                    values: ['baseline', 'center', 'end', 'flex-end', 'flex-start', 'normal', 'self-end', 'self-start', 'start', 'stretch']
                }]
            })
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'text-fill-color:<~color-text|~color|color>')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'text-decoration-color:<~color-text|~color|color>')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'text-stroke-color:<~color|color>')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'text-stroke-width:<number>')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'grid-column-span')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'text-truncate')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'border-image-source')).toBe(false)
        expect(defaultPlan.utilities?.some((utility) => utility.id === 'list-style-image')).toBe(false)
        expect(defaultPlan.utilities?.find((utility) => utility.id === 'stroke:<number>')).toMatchObject({
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
        expect(defaultPlan.utilities?.find((utility) => utility.id === 'text-underline:<~spacing>')).toMatchObject({
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

        const orderedCSS = createCSS(defaultPlan)
        orderedCSS.add('items-center', 'items-start', 'justify-between', 'justify-center')
        expect(orderedCSS.utilitiesLayer.text)
            .toBe('@layer utilities{.items-center{align-items:center}.items-start{align-items:start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}}')

        const nativeFallbackCSS = createCSS(defaultPlan, undefined, {
            nativeDeclarationMatcher: ({ property, value }) => property === 'align-items' && value === 'center'
        })
        const semanticItemsCenter = nativeFallbackCSS.create('items-center')
        const nativeAlignItemsCenter = nativeFallbackCSS.create('align-items:center')
        expect(semanticItemsCenter?.type).toBe(UtilityType.Semantic)
        expect(nativeAlignItemsCenter?.type).toBe(UtilityType.Normal)
        expect(nativeAlignItemsCenter?.type).toBeGreaterThan(semanticItemsCenter?.type ?? 0)
    })

    it('removes fixed keyword value aliases while preserving raw ambiguous matches', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('text:center')).toBeUndefined()
        expect(css.create('text:underline')).toBeUndefined()
        expect(css.create('bg:cover')).toBeUndefined()
        expect(css.create('object:cover')).toBeUndefined()
        expect(css.create('border-solid')).toBeUndefined()
        expect(css.create('border-l-solid')).toBeUndefined()
        expect(css.create('rt:4x')).toBeUndefined()
        expect(css.create('border-top-radius:4x')).toBeUndefined()
        expect(css.create('bg:#fff')?.text).toBe('.bg\\:\\#fff{background-color:#fff}')
        expect(css.create('b:1px')?.text).toBe('.b\\:1px{border-width:1px}')
        expect(css.create('b:line')?.text).toBe('.b\\:line{border-color:var(--color-line)}')
        expect(css.create('bt:1px')?.text).toBe('.bt\\:1px{border-top-width:1px}')
        expect(css.create('bl:line')?.text).toBe('.bl\\:line{border-left-color:var(--color-line)}')
        expect(css.create('bx:1px')?.text).toBe('.bx\\:1px{border-inline-width:1px}')
        expect(css.create('by:line')?.text).toBe('.by\\:line{border-block-color:var(--color-line)}')
        expect(css.create('b:1px|solid|line')?.text).toBe('.b\\:1px\\|solid\\|line{border:1px solid var(--color-line)}')
        expect(css.create('bt:1px|solid|line')?.text).toBe('.bt\\:1px\\|solid\\|line{border-top:1px solid var(--color-line)}')
        expect(css.create('b:1px|line')?.text).toBe('.b\\:1px\\|line{border:1px var(--color-line)}')
        expect(css.create('b:1px|solid')?.text).toBe('.b\\:1px\\|solid{border:1px solid}')
        expect(css.create('border:transparent')?.text).toBe('.border\\:transparent{border:transparent}')
        expect(css.create('outline:medium')?.text).toBe('.outline\\:medium{outline:medium}')
        expect(css.create('font:sm')?.text).toBe('.font\\:sm{font-size:var(--font-size-sm)}')
        expect(css.create('font:1rem')?.text).toBe('.font\\:1rem{font-size:1rem}')
        expect(css.create('text:red')?.text).toBe('.text\\:red{-webkit-text-fill-color:var(--color-red)}')
        expect(css.create('text-decoration:red')?.text).toBe('.text-decoration\\:red{text-decoration-color:var(--color-red)}')
        expect(css.create('text-stroke:red')?.text).toBe('.text-stroke\\:red{-webkit-text-stroke-color:var(--color-red)}')
        expect(css.create('text-decoration-thickness:px')).toBeUndefined()
        expect(css.create('background-color:red')?.text).toBe('.background-color\\:red{background-color:var(--color-red)}')
        expect(css.create('background-color:#fff')?.text).toBe('.background-color\\:\\#fff{background-color:#fff}')
        expect(css.create('font-size:sm')?.text).toBe('.font-size\\:sm{font-size:var(--font-size-sm)}')
        expect(css.create('font-size:1rem')?.text).toBe('.font-size\\:1rem{font-size:1rem}')
        expect(css.create('font-family:sans')?.text).toBe('.font-family\\:sans{font-family:var(--font-family-sans)}')
        expect(css.create('font-weight:bold')?.text).toBe('.font-weight\\:bold{font-weight:var(--font-weight-bold)}')
        expect(css.create('size:5x')?.text).toBe('.size\\:5x{width:1.25rem;height:1.25rem}')
        expect(css.create('size:md')?.text).toBe('.size\\:md{width:var(--container-md);height:var(--container-md)}')
        expect(css.create('min-size:5x')?.text).toBe('.min-size\\:5x{min-width:1.25rem;min-height:1.25rem}')
        expect(css.create('max-size:5x')?.text).toBe('.max-size\\:5x{max-width:1.25rem;max-height:1.25rem}')
        expect(css.create('min:5x')?.text).toBe('.min\\:5x{min-width:1.25rem;min-height:1.25rem}')
        expect(css.create('max:5x')?.text).toBe('.max\\:5x{max-width:1.25rem;max-height:1.25rem}')
        expect(css.create('size:5x|6x')).toBeUndefined()
        expect(css.create('min:5x|6x')).toBeUndefined()
        expect(css.create('max:5x|6x')).toBeUndefined()
        expect(css.create('size:auto')).toBeUndefined()
        expect(css.create('size:min')).toBeUndefined()
        expect(css.create('size:max')).toBeUndefined()
        expect(css.create('flex-basis:sm')?.text).toBe('.flex-basis\\:sm{flex-basis:var(--container-sm)}')
        expect(css.create('flex-basis:2x')?.text).toBe('.flex-basis\\:2x{flex-basis:0.5rem}')
        expect(css.create('outline-width:1px')).toBeUndefined()
        expect(css.create('outline-width:2px')).toBeUndefined()
        expect(css.create('shape-margin:1px')?.text).toBe('.shape-margin\\:1px{shape-margin:1px}')
        expect(css.create('shape-margin:2x')?.text).toBe('.shape-margin\\:2x{shape-margin:0.5rem}')
        expect(css.create('word-spacing:1px')?.text).toBe('.word-spacing\\:1px{word-spacing:1px}')
        expect(css.create('word-spacing:2x')?.text).toBe('.word-spacing\\:2x{word-spacing:0.5rem}')
        expect(css.create('stroke:red')?.text).toBe('.stroke\\:red{stroke:var(--color-red)}')
        expect(css.create('stroke:.75')?.text).toBe('.stroke\\:\\.75{stroke-width:0.75}')
        expect(css.create('stroke-width:1px')).toBeUndefined()
        expect(css.create('text-underline:sm')?.text).toBe('.text-underline\\:sm{text-underline-offset:var(--spacing-sm)}')
        expect(css.create('text-underline-offset:2x')?.text).toBe('.text-underline-offset\\:2x{text-underline-offset:0.5rem}')
        expect(css.create('text-indent:sm')?.text).toBe('.text-indent\\:sm{text-indent:var(--spacing-sm)}')
        expect(css.create('background-size:sm')?.text).toBe('.background-size\\:sm{background-size:var(--container-sm)}')
        expect(css.create('background-position:2x|center')?.text).toBe('.background-position\\:2x\\|center{background-position:0.5rem center}')
        expect(css.create('mask-position:2x|center')?.text).toBe('.mask-position\\:2x\\|center{mask-position:0.5rem center}')
        expect(css.create('mask-size:sm')?.text).toBe('.mask-size\\:sm{mask-size:var(--container-sm)}')
        expect(css.create('perspective:4x')?.text).toBe('.perspective\\:4x{perspective:1rem}')
        expect(css.create('perspective-origin:2x|center')?.text).toBe('.perspective-origin\\:2x\\|center{perspective-origin:0.5rem center}')
        expect(css.create('transform-origin:2x|center')?.text).toBe('.transform-origin\\:2x\\|center{transform-origin:0.5rem center}')
        expect(css.create('text-stroke-width:1px')).toBeUndefined()
        expect(css.create('text-stroke-width:thin')).toBeUndefined()
        expect(css.create('animation-delay:fast')?.text).toBe('.animation-delay\\:fast{animation-delay:var(--duration-fast)}')
        expect(css.create('transition-delay:fast')?.text).toBe('.transition-delay\\:fast{transition-delay:var(--duration-fast)}')
        expect(css.create('font-feature-settings:tabular')?.text).toBe('.font-feature-settings\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
        expect(css.create('content:empty')?.text).toBe('.content\\:empty{content:var(--content-empty)}')
        expect(css.create("content:'x'")?.text).toBe(".content\\:\\'x\\'{content:'x'}")
        expect(css.create('border-width:1px')).toBeUndefined()
        expect(css.create('background:red')).toBeUndefined()
        expect(css.create('background:sm')).toBeUndefined()
        expect(css.create('bg:2x')).toBeUndefined()
        expect(css.create('transform:2x')).toBeUndefined()
        expect(css.create('animate:fade')?.text).toBe('.animate\\:fade{animation:var(--animate-fade)}')
        expect(css.create('animation:fade')?.text).toBe('.animation\\:fade{animation:fade}')
        expect(css.create('animation:fade')?.text).not.toContain('var(--animate-fade)')
        expect(css.create('animation-name:fade')).toBeUndefined()
        expect(css.create('container:sm')?.text).not.toContain('var(--container-sm)')
        expect(css.create('flex:sm')?.text).not.toContain('flex-basis')
        expect(css.create('flex:md')?.text).not.toContain('flex-basis')
        expect(css.create('m:1px')?.text).toBe('.m\\:1px{margin:1px}')
        expect(css.create('outline:1px|solid')?.text).toBe('.outline\\:1px\\|solid{outline:1px solid}')
        expect(css.create('m:sm|md')?.text).toBe('.m\\:sm\\|md{margin:var(--spacing-sm) var(--spacing-md)}')
        expect(css.create('m:sm|-md')?.text).toBe('.m\\:sm\\|-md{margin:var(--spacing-sm) calc(var(--spacing-md) * -1)}')
        expect(css.create('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')
        expect(css.create('text-size:2xl')).toBeUndefined()
        expect(css.create('text-size:1rem')).toBeUndefined()
        expect(css.create('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
        expect(css.create('grid-column-span:2')).toBeUndefined()
        expect(css.create('lines:2')).toBeUndefined()
        expect(css.create('text-truncate:2')).toBeUndefined()
        expect(css.create('border-image:linear-gradient(red,blue)')).toBeUndefined()
        expect(css.create('list-style:url(/marker.svg)')).toBeUndefined()

        for (const utility of defaultPlan.utilities || []) {
            expect('values' in utility, utility.id).toBe(false)
            expect('transform' in utility, utility.id).toBe(false)
        }
        for (const index of defaultPlan.utilityBuckets?.value || []) {
            expect(defaultPlan.utilities?.[index]?.kind, defaultPlan.utilities?.[index]?.id).toBeDefined()
        }
    })

    it('prunes pure native coverage and keeps Master CSS native DX utilities', () => {
        const css = createCSS(defaultPlan)
        const nativeCSS = createCSS(defaultPlan, undefined, {
            nativeDeclarationMatcher: ({ property }) => property === 'perspective-origin'
                || property === 'scroll-margin-inline-start'
                || property === 'scroll-padding-block-end'
                || property === 'background'
                || property === 'animation'
                || property === 'animation-name'
                || property === 'container'
                || property === 'flex'
                || property === 'border-image-source'
                || property === 'border-image-width'
                || property === 'list-style-image'
        })

        expect(css.create('float:left')).toBeUndefined()
        expect(css.create('field-sizing:content')).toBeUndefined()
        expect(css.create('caption-side:top')).toBeUndefined()
        expect(css.create('scrollbar-width:thin')).toBeUndefined()
        expect(css.create('transition-behavior:allow-discrete')).toBeUndefined()
        expect(css.create('display:block')).toBeUndefined()
        expect(css.create('d:block')).toBeUndefined()
        expect(css.create('view-transition-name:hero')).toBeUndefined()
        expect(css.create('vt-name:hero')).toBeUndefined()
        expect(nativeCSS.create('perspective-origin:100%|0')?.text).toBe('.perspective-origin\\:100\\%\\|0{perspective-origin:100% 0}')
        expect(nativeCSS.create('scroll-ms:1px')?.text).toBe('.scroll-ms\\:1px{scroll-margin-inline-start:1px}')
        expect(nativeCSS.create('scroll-pbe:1px')?.text).toBe('.scroll-pbe\\:1px{scroll-padding-block-end:1px}')
        expect(nativeCSS.create('background:red')?.text).toBe('.background\\:red{background:red}')
        expect(nativeCSS.create('animation:fade|fast|smooth')?.text).toBe('.animation\\:fade\\|fast\\|smooth{animation:fade var(--duration-fast) var(--easing-smooth)}')
        expect(nativeCSS.create('animation-name:fade')?.text).toBe('.animation-name\\:fade{animation-name:fade}')
        expect(nativeCSS.create('container:inline-size')?.text).toBe('.container\\:inline-size{container:inline-size}')
        expect(nativeCSS.create('flex:0|0|auto')?.text).toBe('.flex\\:0\\|0\\|auto{flex:0 0 auto}')
        expect(nativeCSS.create('border-image-source:url(/border.png)')?.text).toBe('.border-image-source\\:url\\(\\/border\\.png\\){border-image-source:url(/border.png)}')
        expect(nativeCSS.create('border-image-width:2px')?.text).toBe('.border-image-width\\:2px{border-image-width:2px}')
        expect(nativeCSS.create('list-style-image:url(/marker.svg)')?.text).toBe('.list-style-image\\:url\\(\\/marker\\.svg\\){list-style-image:url(/marker.svg)}')
    })

    it('moves native value namespace utilities out of matcher definitions', () => {
        const matcherKeys = collectMatcherKeys(defaultPlan)
        const utilityIds = new Set((defaultPlan.utilities || []).map((utility) => utility.id))
        const nativeValueNamespaceProperties = builtinNativeValueNamespaces.flatMap(({ properties }) => properties)

        expect('nativeValueNamespaces' in defaultPlan).toBe(false)
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
        for (const utility of defaultPlan.utilities || []) {
            if (utility.variableAliasRefs?.length) continue
            expect(utility.matchers.some((matcher) => matcher.type === 'variable'), utility.id).toBe(false)
        }
    })

    it('keeps curated key aliases out of utility matcher keys', () => {
        const matcherKeys = collectMatcherKeys(defaultPlan)

        expect('keyAliases' in defaultPlan).toBe(false)
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
        const utilities = defaultPlan.utilities || []
        const ids = new Map<string, number[]>()
        for (const [index, utility] of utilities.entries()) {
            expect(utility.matchers?.length).toBeGreaterThan(0)
            const id = utility.id || utility.name
            ids.set(id, [...(ids.get(id) || []), index])
        }

        expect([...ids].filter(([, indexes]) => indexes.length > 1)).toEqual([])

        for (const [bucketName, indexes] of Object.entries(defaultPlan.utilityBuckets || {})) {
            const bucketIndexes = indexes as number[]
            expect(bucketIndexes.length, bucketName).toBeGreaterThan(0)
            expect(new Set(bucketIndexes).size, bucketName).toBe(bucketIndexes.length)
            expect(bucketIndexes.every((index) => index >= 0 && index < utilities.length), bucketName).toBe(true)
        }
    })
})
