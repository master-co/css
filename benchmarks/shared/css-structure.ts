import { generate, parse } from 'css-tree'
import type { BenchmarkMetric, BenchmarkSample } from './types'
import { emptySpecificity, maxSpecificity, selectorSpecificity, toSpecificityScore, type SelectorSpecificity, type SelectorNode } from './selector-specificity'

const knownLayers = ['theme', 'base', 'defaults', 'components', 'utilities'] as const
type KnownLayer = typeof knownLayers[number]

export interface CSSStructureSummary {
  styleRuleCount: number
  selectorCount: number
  declarationCount: number
  customPropertyCount: number
  importantDeclarationCount: number
  atRuleCount: number
  layerBlockCount: number
  mediaBlockCount: number
  supportsBlockCount: number
  containerBlockCount: number
  keyframesCount: number
  unlayeredStyleRuleCount: number
  layerStyleRuleCounts: Record<KnownLayer, number>
  otherLayerStyleRuleCount: number
  selectorCombinatorCount: number
  maxSelectorSpecificity: SelectorSpecificity
  maxSelectorSpecificityScore: number
  maxSelectorComplexityScore: number
}

export const cssStructureMetrics: BenchmarkMetric[] = [
  {
    id: 'style-rule-count',
    label: 'Style rules',
    unit: 'count',
    description: 'Qualified CSS rules, excluding keyframe step rules.'
  },
  {
    id: 'selector-count',
    label: 'Selectors',
    unit: 'count',
    description: 'Top-level selectors in qualified style rules.'
  },
  {
    id: 'declaration-count',
    label: 'Declarations',
    unit: 'count',
    description: 'CSS declarations and at-rule descriptors in generated CSS.'
  },
  {
    id: 'custom-property-count',
    label: 'Custom properties',
    unit: 'count',
    description: 'Declarations whose property name starts with --.'
  },
  {
    id: 'important-declaration-count',
    label: 'Important declarations',
    unit: 'count',
    description: 'Declarations emitted with !important.'
  },
  {
    id: 'at-rule-count',
    label: 'At-rules',
    unit: 'count',
    description: 'All CSS at-rules in the generated output.'
  },
  {
    id: 'layer-block-count',
    label: 'Layer blocks',
    unit: 'count',
    description: '@layer rules that contain a block.'
  },
  {
    id: 'media-block-count',
    label: 'Media blocks',
    unit: 'count',
    description: '@media rules that contain a block.'
  },
  {
    id: 'supports-block-count',
    label: 'Supports blocks',
    unit: 'count',
    description: '@supports rules that contain a block.'
  },
  {
    id: 'container-block-count',
    label: 'Container blocks',
    unit: 'count',
    description: '@container rules that contain a block.'
  },
  {
    id: 'keyframes-count',
    label: 'Keyframes',
    unit: 'count',
    description: '@keyframes and vendor-prefixed keyframes rules.'
  },
  {
    id: 'unlayered-style-rule-count',
    label: 'Unlayered style rules',
    unit: 'count',
    description: 'Qualified style rules not nested under an @layer block.'
  },
  ...knownLayers.map((layer): BenchmarkMetric => ({
    id: `layer-${layer}-style-rule-count`,
    label: `${layer} layer style rules`,
    unit: 'count',
    description: `Qualified style rules nested under the ${layer} layer.`
  })),
  {
    id: 'layer-other-style-rule-count',
    label: 'Other layer style rules',
    unit: 'count',
    description: 'Qualified style rules nested under non-standard or anonymous @layer blocks.'
  },
  {
    id: 'selector-combinator-count',
    label: 'Selector combinators',
    unit: 'count',
    description: 'Combinator nodes across top-level selectors.'
  },
  {
    id: 'max-selector-specificity-score',
    label: 'Max selector specificity score',
    unit: 'score',
    description: 'Lexicographically greatest selector specificity projected as ID * 100 + class * 10 + type. This display score can collide or reverse numeric order when a component exceeds nine; it is not a cascade rank.'
  },
  {
    id: 'max-selector-complexity-score',
    label: 'Max selector complexity score',
    unit: 'score',
    description: 'Maximum count of selector components and combinators in a top-level selector.'
  }
]

export function analyzeCSSStructure(css: string | Buffer): CSSStructureSummary {
  const ast = parse(css.toString(), {
    positions: false
  }) as CSSNode
  const summary = createEmptySummary()

  visitCSSNode(ast, {
    inKeyframes: false,
    layerName: undefined
  }, summary)

  return summary
}

export function createCSSStructureSamples(variantId: string, summary: CSSStructureSummary): BenchmarkSample[] {
  const entries: [string, number][] = [
    ['style-rule-count', summary.styleRuleCount],
    ['selector-count', summary.selectorCount],
    ['declaration-count', summary.declarationCount],
    ['custom-property-count', summary.customPropertyCount],
    ['important-declaration-count', summary.importantDeclarationCount],
    ['at-rule-count', summary.atRuleCount],
    ['layer-block-count', summary.layerBlockCount],
    ['media-block-count', summary.mediaBlockCount],
    ['supports-block-count', summary.supportsBlockCount],
    ['container-block-count', summary.containerBlockCount],
    ['keyframes-count', summary.keyframesCount],
    ['unlayered-style-rule-count', summary.unlayeredStyleRuleCount],
    ...knownLayers.map<[string, number]>((layer) => [`layer-${layer}-style-rule-count`, summary.layerStyleRuleCounts[layer]]),
    ['layer-other-style-rule-count', summary.otherLayerStyleRuleCount],
    ['selector-combinator-count', summary.selectorCombinatorCount],
    ['max-selector-specificity-score', summary.maxSelectorSpecificityScore],
    ['max-selector-complexity-score', summary.maxSelectorComplexityScore]
  ]

  return entries.map(([metricId, value]) => ({
    metricId,
    variantId,
    round: 0,
    value
  }))
}

interface CSSNode extends SelectorNode {
  type?: string
  name?: string
  property?: string
  important?: boolean
  prelude?: CSSNode
  block?: CSSNode
  children?: CSSNodeList
}

interface CSSNodeList {
  forEach(callback: (node: CSSNode) => void): void
}

interface CSSVisitContext {
  inKeyframes: boolean
  layerName: string | undefined
  parentSpecificity?: SelectorSpecificity
}

function createEmptySummary(): CSSStructureSummary {
  return {
    styleRuleCount: 0,
    selectorCount: 0,
    declarationCount: 0,
    customPropertyCount: 0,
    importantDeclarationCount: 0,
    atRuleCount: 0,
    layerBlockCount: 0,
    mediaBlockCount: 0,
    supportsBlockCount: 0,
    containerBlockCount: 0,
    keyframesCount: 0,
    unlayeredStyleRuleCount: 0,
    layerStyleRuleCounts: {
      theme: 0,
      base: 0,
      defaults: 0,
      components: 0,
      utilities: 0
    },
    otherLayerStyleRuleCount: 0,
    selectorCombinatorCount: 0,
    maxSelectorSpecificity: emptySpecificity(),
    maxSelectorSpecificityScore: 0,
    maxSelectorComplexityScore: 0
  }
}

function visitCSSNode(node: CSSNode | undefined, context: CSSVisitContext, summary: CSSStructureSummary) {
  if (!node) return

  // CSS Tree style blocks only recognize nesting that begins with &. Reparse
  // recovered raw rule sequences through its stylesheet grammar, preserving context.
  if (node.type === 'Raw') {
    const nested = parse(node.value || '', {
      positions: false,
      onParseError(error) { throw new Error(`Cannot analyze recovered CSS: ${error.message}`) }
    }) as CSSNode
    visitCSSNode(nested, context, summary)
    return
  }

  if (node.type === 'Atrule') {
    visitAtRule(node, context, summary)
    return
  }

  if (node.type === 'Rule') {
    visitRule(node, context, summary)
    return
  }

  if (node.type === 'Declaration') {
    summary.declarationCount += 1
    if (node.property?.startsWith('--')) summary.customPropertyCount += 1
    if (node.important) summary.importantDeclarationCount += 1
    return
  }

  forEachChild(node, (child) => visitCSSNode(child, context, summary))
}

function visitAtRule(node: CSSNode, context: CSSVisitContext, summary: CSSStructureSummary) {
  summary.atRuleCount += 1
  const name = node.name?.toLowerCase()
  const hasBlock = Boolean(node.block)
  const nextContext = { ...context }

  if (name === 'scope') nextContext.parentSpecificity = undefined

  if (name === 'layer' && hasBlock) {
    summary.layerBlockCount += 1
    nextContext.layerName = getLayerName(node.prelude)
  } else if (name === 'media' && hasBlock) {
    summary.mediaBlockCount += 1
  } else if (name === 'supports' && hasBlock) {
    summary.supportsBlockCount += 1
  } else if (name === 'container' && hasBlock) {
    summary.containerBlockCount += 1
  } else if (name?.endsWith('keyframes')) {
    summary.keyframesCount += 1
    nextContext.inKeyframes = true
  }

  if (node.block) {
    visitCSSNode(node.block, nextContext, summary)
  }
}

function visitRule(node: CSSNode, context: CSSVisitContext, summary: CSSStructureSummary) {
  const nextContext = { ...context }
  if (!context.inKeyframes) {
    summary.styleRuleCount += 1
    incrementLayerRuleCount(summary, context.layerName)
    nextContext.parentSpecificity = analyzeRulePrelude(node.prelude, summary, context.parentSpecificity)
  }

  visitCSSNode(node.block, nextContext, summary)
}

function incrementLayerRuleCount(summary: CSSStructureSummary, layerName: string | undefined) {
  if (!layerName) {
    summary.unlayeredStyleRuleCount += 1
    return
  }

  if (isKnownLayer(layerName)) {
    summary.layerStyleRuleCounts[layerName] += 1
  } else {
    summary.otherLayerStyleRuleCount += 1
  }
}

function analyzeRulePrelude(prelude: CSSNode | undefined, summary: CSSStructureSummary, parent?: SelectorSpecificity) {
  const selectors = getTopLevelSelectors(prelude)

  if (!selectors.length && prelude) throw new Error('Cannot calculate specificity for an unparsed selector prelude.')
  let greatest = emptySpecificity()

  for (const selector of selectors) {
    const specificity = selectorSpecificity(selector, parent)
    greatest = maxSpecificity(greatest, specificity)
    const complexityScore = calculateSelectorComplexity(selector)

    summary.selectorCount += 1
    summary.selectorCombinatorCount += countSelectorCombinators(selector)
    summary.maxSelectorSpecificity = maxSpecificity(summary.maxSelectorSpecificity, specificity)
    summary.maxSelectorSpecificityScore = toSpecificityScore(summary.maxSelectorSpecificity)
    summary.maxSelectorComplexityScore = Math.max(summary.maxSelectorComplexityScore, complexityScore)
  }
  return greatest
}

function getTopLevelSelectors(prelude: CSSNode | undefined) {
  if (!prelude) return []
  if (prelude.type === 'Selector') return [prelude]
  if (prelude.type !== 'SelectorList') return []

  const selectors: CSSNode[] = []
  prelude.children?.forEach((child) => {
    if (child.type === 'Selector') selectors.push(child)
  })

  return selectors
}

function calculateSelectorComplexity(selector: CSSNode) {
  let score = 0
  walkSelector(selector, (node) => {
    if (
      node.type === 'IdSelector' ||
      node.type === 'ClassSelector' ||
      node.type === 'AttributeSelector' ||
      node.type === 'TypeSelector' ||
      node.type === 'PseudoClassSelector' ||
      node.type === 'PseudoElementSelector' ||
      node.type === 'Combinator' ||
      node.type === 'NestingSelector'
    ) {
      score += 1
    }
  })
  return score
}

function countSelectorCombinators(selector: CSSNode) {
  let count = 0
  walkSelector(selector, (node) => {
    if (node.type === 'Combinator') count += 1
  })
  return count
}

function walkSelector(node: CSSNode, callback: (node: CSSNode) => void) {
  callback(node)
  forEachChild(node, (child) => walkSelector(child, callback))
}

function getLayerName(prelude: CSSNode | undefined) {
  if (!prelude) return 'anonymous'
  const value = generate(prelude as never).trim()
  return value || 'anonymous'
}

function isKnownLayer(layerName: string): layerName is KnownLayer {
  return knownLayers.includes(layerName as KnownLayer)
}

function forEachChild(node: CSSNode, callback: (child: CSSNode) => void) {
  if (node.children) {
    node.children.forEach(callback)
  }

  if (node.prelude) {
    callback(node.prelude)
  }

  if (node.block) {
    callback(node.block)
  }
}
