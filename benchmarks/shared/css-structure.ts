import postcss, { type AtRule, type ChildNode, type Container, type Rule } from 'postcss'
import type { Selector } from 'postcss-selector-parser'
import type { BenchmarkMetric, BenchmarkSample } from './types'
import { emptySpecificity, maxSpecificity, parseSelectorList, selectorSpecificity, toSpecificityScore, walkSelectorComponents, type SelectorSpecificity } from './selector-specificity'

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
  let root
  try {
    root = postcss.parse(css.toString())
  } catch (error) {
    throw new Error(`Cannot analyze recovered CSS: ${(error as { reason?: string }).reason ?? (error as Error).message}`)
  }
  const summary = createEmptySummary()

  visitChildren(root, {
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

function visitChildren(container: Container, context: CSSVisitContext, summary: CSSStructureSummary) {
  for (const node of container.nodes ?? []) visitCSSNode(node, context, summary)
}

function visitCSSNode(node: ChildNode, context: CSSVisitContext, summary: CSSStructureSummary) {
  if (node.type === 'atrule') {
    visitAtRule(node, context, summary)
  } else if (node.type === 'rule') {
    visitRule(node, context, summary)
  } else if (node.type === 'decl') {
    summary.declarationCount += 1
    if (node.prop.startsWith('--')) summary.customPropertyCount += 1
    if (node.important) summary.importantDeclarationCount += 1
  }
}

function visitAtRule(node: AtRule, context: CSSVisitContext, summary: CSSStructureSummary) {
  summary.atRuleCount += 1
  const name = node.name.toLowerCase()
  const hasBlock = Boolean(node.nodes)
  const nextContext = { ...context }

  if (name === 'scope') nextContext.parentSpecificity = undefined

  if (name === 'layer' && hasBlock) {
    summary.layerBlockCount += 1
    nextContext.layerName = node.params.trim() || 'anonymous'
  } else if (name === 'media' && hasBlock) {
    summary.mediaBlockCount += 1
  } else if (name === 'supports' && hasBlock) {
    summary.supportsBlockCount += 1
  } else if (name === 'container' && hasBlock) {
    summary.containerBlockCount += 1
  } else if (name.endsWith('keyframes')) {
    summary.keyframesCount += 1
    nextContext.inKeyframes = true
  }

  visitChildren(node, nextContext, summary)
}

function visitRule(node: Rule, context: CSSVisitContext, summary: CSSStructureSummary) {
  const nextContext = { ...context }
  if (!context.inKeyframes) {
    summary.styleRuleCount += 1
    incrementLayerRuleCount(summary, context.layerName)
    nextContext.parentSpecificity = analyzeRulePrelude(node.selector, summary, context.parentSpecificity)
  }

  visitChildren(node, nextContext, summary)
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

function analyzeRulePrelude(prelude: string, summary: CSSStructureSummary, parent?: SelectorSpecificity) {
  const selectors = parseSelectorList(prelude)
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

function calculateSelectorComplexity(selector: Selector) {
  let score = 0
  walkSelectorComponents(selector, (node) => {
    if (
      node.type === 'id' ||
      node.type === 'class' ||
      node.type === 'attribute' ||
      node.type === 'tag' ||
      node.type === 'universal' ||
      node.type === 'pseudo' ||
      node.type === 'combinator' ||
      node.type === 'nesting'
    ) {
      score += 1
    }
  })
  return score
}

function countSelectorCombinators(selector: Selector) {
  let count = 0
  walkSelectorComponents(selector, (node) => {
    if (node.type === 'combinator') count += 1
  })
  return count
}

function isKnownLayer(layerName: string): layerName is KnownLayer {
  return knownLayers.includes(layerName as KnownLayer)
}
