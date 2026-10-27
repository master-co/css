// Class rule generation, as the engine's generation.rs and render.rs build it: match
// the class, take each utility's emitted state branches, and render one stored rule
// per key and layer. A native declaration is the fallback when no registered utility
// matches. `@apply` classes expand in apply.ts from the composition rules built here.
import { analyzeAnimations, stylesheetDeclarations, type AnimationReferences } from './animation'
import { applicationRules } from './apply'
import { decodeNativeContent, splitDynamicValueState, splitTopLevel } from './class-syntax'
import { conditionPriority } from './condition'
import { leadingDeclarationName } from './css-syntax'
import { expandUtility } from './mixin'
import type { StoredRule } from './order'
import { cssEscape } from './program'
import type { Program, Utility, UtilityLayer } from './program-model'
import { replaceNestingSelector, selectorPriority } from './selector'
import { resolveStateBranches, type StateBranch } from './state'
import { trim } from './text'
import type { ConditionFeature, GeneratedRule, RulePriority } from './types'
import { matchingUtilities, tokenCandidates, tokenPrefix, type UtilityMatch } from './utility'
import { collectCssVariableReferences, resolveValueComponents, substituteInlineTokens } from './value'

export function formatDeclaration(property: string, value: string, important: boolean) {
  return important && !value.endsWith('!important') ? `${property}:${value}!important` : `${property}:${value}`
}

/** Compatibility declarations are an engine output policy, not preset recipes. */
const WEBKIT_PROPERTIES = new Set(['text-decoration', 'backdrop-filter', 'box-decoration-break', 'mask-image', 'user-drag', 'user-select'])

function formatNativeDeclaration(property: string, value: string, important: boolean) {
  const standard = formatDeclaration(property, value, important)
  return WEBKIT_PROPERTIES.has(property) ? `${formatDeclaration(`-webkit-${property}`, value, important)};${standard}` : standard
}

/** A rule a utility emits for a match: its declarations, nested selector template and raw conditions. */
type EmittedRule = [declarations: string, selector: string | undefined, conditions: string[]]

function emitDeclarations(utility: Utility, matched: UtilityMatch, important: boolean, program: Program): EmittedRule[] {
  const { emit } = utility
  if (emit.type === 'property') return matched.value ? [[formatNativeDeclaration(emit.property, matched.value, important), undefined, []]] : []
  if (matched.expansion === undefined) matched.expansion = expandUtility(program, program.utilityDefinitions[emit.definition], matched.arguments) ?? null
  return (matched.expansion ?? []).map(({ selector, conditions, declarations }) => [
    declarations.map(([property, value]) => formatDeclaration(property, value, important)).join(';'),
    selector === '&' ? undefined : selector,
    conditions
  ])
}

/** Declaration semantics for ordering; static and enum identities keep their manifest order. */
function sortKey(utility: Utility, matched: UtilityMatch, program: Program) {
  if (utility.utilityType === -2 && matched.matcherType !== 'token') return ''
  return emitDeclarations(utility, matched, false, program).map(([declarations]) => declarations).join(';')
}

function parseNativeDeclarationCandidate(className: string, program: Program) {
  if (decodeNativeContent(className) === undefined) return
  const source = className.endsWith('!') ? className.slice(0, -1) : className
  const prefix = tokenPrefix(source, program)
  if (prefix !== undefined && tokenCandidates(source, prefix, program).length) return
  const head = leadingDeclarationName(source)
  if (!head) return
  const [raw] = splitDynamicValueState(source.slice(head[0] + 1))
  if (!raw) return
  return { property: source.slice(0, head[0]), value: resolveValueComponents(raw, program)[0] }
}

/** A native `property:value` declaration; only consulted when no registered utility matched. */
export function nativeDeclarationFallback(className: string, program: Program): [Utility, UtilityMatch] | undefined {
  const candidate = parseNativeDeclarationCandidate(className, program)
  const head = leadingDeclarationName(className)
  if (!candidate || !head || decodeNativeContent(candidate.value) === undefined) return
  const id = `native:${candidate.property}`
  return [
    {
      id,
      name: id,
      utilityType: 0,
      order: 0,
      layer: 'utilities',
      keys: [],
      aliasGroups: [],
      variableAliases: [],
      variableAliasRefs: [],
      nativeFallback: true,
      emit: { type: 'property', property: candidate.property },
      matchers: []
    },
    { value: candidate.value, arguments: [], stateToken: splitDynamicValueState(className.slice(head[0] + 1))[1], variableNames: [], matcherType: 'key' }
  ]
}

/** The class selector in a branch's template, then in a nested rule's. */
function createSelectorText(className: string, branch: StateBranch, ruleSelector?: string) {
  const body = `.${cssEscape(className)}`
  const template = branch.selectorTemplate
  const selector = template === undefined ? body : replaceNestingSelector(template, body) ?? template
  return ruleSelector === undefined ? selector : replaceNestingSelector(ruleSelector, selector) ?? ruleSelector
}

export function wrapRawConditions(text: string, conditions: string[]) {
  for (let index = conditions.length - 1; index >= 0; index--) {
    const condition = trim(conditions[index])
    if (condition) text = `${condition}{${text}}`
  }
  return text
}

const reportedFeatures = (features: ConditionFeature[]) => features.some(({ lower, upper }) => Object.is(lower?.value, -0) || Object.is(upper?.value, -0))
  ? features.map((feature) => ({
      ...feature,
      lower: feature.lower && { ...feature.lower, value: feature.lower.value + 0 },
      upper: feature.upper && { ...feature.upper, value: feature.upper.value + 0 }
    }))
  : features

/** A rule priority as the Rust JSON reports it, omitting empty fields. */
export function rulePriority(features: ConditionFeature[], selector: number, conditions: string[], valuePriority: number, sortKey: string) {
  const priority: RulePriority = { features: reportedFeatures(features), selector }
  if (conditions.length) priority.conditions = conditions
  if (valuePriority) priority.valuePriority = valuePriority
  if (sortKey) priority.sortKey = sortKey
  return priority
}

export function declarationAnimationReferences(declarations: string, program: Program): AnimationReferences {
  if (!declarations.includes('\\') && !/animation/i.test(declarations)) return { names: [], retainAll: false }
  return analyzeAnimations(stylesheetDeclarations(`a{${declarations}}`), program)
}

/** Keyframe references of a rule; absent when there are none. */
export function addAnimationReferences(ir: GeneratedRule, declarations: string, program: Program) {
  const { names, retainAll } = declarationAnimationReferences(declarations, program)
  if (names.length) ir.keyframeNames = names
  if (retainAll) ir.retainAllKeyframes = true
}

/** One emitted state branch of a class, shared by rule and composition generation. */
interface GeneratedBranch {
  utility: Utility
  matched: UtilityMatch
  branch: StateBranch
  key: string
  layer: UtilityLayer
  emitted: EmittedRule[]
  sortTier: number
  /** Condition features to order by, which keep `-0`. */
  features: ConditionFeature[]
  priority: RulePriority
}

/**
 * Matches a class and visits each state branch that emits declarations. A native
 * fallback only applies when no registered utility emitted a branch.
 */
function generatedBranches(className: string, program: Program, visit: (generated: GeneratedBranch) => void) {
  const important = className.endsWith('!')
  const source = important ? className.slice(0, -1) : className
  const candidates = matchingUtilities(source, program).map(([index, matched]): [Utility, UtilityMatch] => [program.utilities[index], matched])
  if (!candidates.length) {
    const fallback = nativeDeclarationFallback(source, program)
    if (fallback) candidates.push(fallback)
  }
  const seen = new Set<string>()
  let emitted = false
  for (const [utility, matched] of candidates) {
    if (utility.nativeFallback && emitted) break
    // The sort key ignores the branch; it is computed once, for the first emitted one.
    let branchSortKey: string | undefined
    for (const [index, branch] of resolveStateBranches(matched.stateToken, important, program).entries()) {
      const rules = emitDeclarations(utility, matched, branch.important, program)
      if (!rules.length) continue
      const key = index === 0 && !branch.key ? className : `${className}\0${branch.key}`
      const layer = branch.layer ?? utility.layer
      if (seen.has(`${layer} ${key}`)) continue
      seen.add(`${layer} ${key}`)
      const wrappers = branch.conditionWrappers
      const [features, conditions] = conditionPriority(wrappers)
      branchSortKey ??= sortKey(utility, matched, program)
      emitted = true
      visit({
        utility,
        matched,
        branch,
        key,
        layer,
        emitted: rules,
        sortTier: wrappers.length ? 3 : branch.selectorTemplate === undefined ? 0 : 1,
        features,
        priority: rulePriority(features, selectorPriority(branch.selectorTemplate), conditions, matched.matcherType === 'token' ? -1 : 0, branchSortKey)
      })
    }
  }
}

export function generateClassRules(className: string, program: Program): StoredRule[] {
  const application = applicationRules(className, program)
  if (application) return application
  if (decodeNativeContent(className) === undefined) return []
  const rules: StoredRule[] = []
  generatedBranches(className, program, ({ utility, matched, branch, key, layer, emitted, sortTier, features, priority }) => {
    const selectorText = createSelectorText(className, branch)
    const texts: string[] = []
    const declarationTexts: string[] = []
    for (const [raw, selector, conditions] of emitted) {
      const declarations = substituteInlineTokens(raw, program)
      const text = wrapRawConditions(`${selector === undefined ? selectorText : createSelectorText(className, branch, selector)}{${declarations}}`, conditions)
      texts.push(branch.conditionWrappers.reduceRight((rule, [, wrapper]) => `${wrapper}{${rule}}`, text))
      declarationTexts.push(declarations)
    }
    const declarations = declarationTexts.join(';')
    const variableNames = matched.variableNames.filter((name) => program.variables.get(name)?.inlineValue === undefined)
    for (const name of collectCssVariableReferences(declarations)) {
      if (program.variables.has(name) && !variableNames.includes(name)) variableNames.push(name)
    }
    const ir: GeneratedRule = { className, key, layer, type: utility.utilityType, sortTier, priority, text: texts.join(''), selectorText }
    if (texts.length > 1) ir.nodes = texts.map((text) => ({ text }))
    if (variableNames.length) ir.variableNames = variableNames
    addAnimationReferences(ir, declarations, program)
    rules.push({ ir, features, manifestOrder: utility.order, declarations, nativeFallback: utility.nativeFallback })
  })
  return rules
}

/** A generated rule anchored at `&` instead of the class, as `@apply` composes it. */
export interface CompositionRule {
  layer: UtilityLayer
  explicitLayer?: UtilityLayer
  type: number
  valuePriority: number
  selector: string
  declarations: [property: string, value: string][]
  conditions: string[]
}

/** Serialized declarations split at top-level `;` and their first top-level `:`. */
function parseSerializedDeclarations(source: string) {
  const declarations: [string, string][] = []
  for (const declaration of splitTopLevel(source, ';')) {
    let quote = 0
    let escaped = false
    let depth = 0
    let separator = -1
    for (let index = 0; index < declaration.length; index++) {
      const unit = declaration.charCodeAt(index)
      if (escaped) {
        escaped = false
      } else if (unit === 0x5c) {
        escaped = true
      } else if (quote) {
        if (unit === quote) quote = 0
      } else if (unit === 0x22 || unit === 0x27) {
        quote = unit
      } else if (unit === 0x28 || unit === 0x5b || unit === 0x7b) {
        depth++
      } else if (unit === 0x29 || unit === 0x5d || unit === 0x7d) {
        if (depth) depth--
      } else if (unit === 0x3a && !depth) {
        separator = index
        break
      }
    }
    if (separator < 0) continue
    const property = trim(declaration.slice(0, separator))
    if (property) declarations.push([property, trim(declaration.slice(separator + 1))])
  }
  return declarations
}

/** The rules of a class without `@apply` suffixes, before inline theme substitution. */
export function compositionRules(className: string, program: Program): CompositionRule[] {
  if (decodeNativeContent(className) === undefined) return []
  const rules: CompositionRule[] = []
  generatedBranches(className, program, ({ utility, branch, layer, emitted, priority }) => {
    const template = branch.selectorTemplate
    const base = template === undefined ? '&' : replaceNestingSelector(template, '&') ?? template
    const branchConditions = branch.conditionWrappers.filter(([kind]) => kind !== 'layer' || branch.layer === undefined).map(([, wrapper]) => wrapper)
    for (const [declarations, selector, conditions] of emitted) {
      rules.push({
        layer,
        explicitLayer: branch.layer,
        type: utility.utilityType,
        valuePriority: priority.valuePriority ?? 0,
        selector: selector === undefined ? base : replaceNestingSelector(selector, base) ?? selector,
        declarations: parseSerializedDeclarations(declarations),
        conditions: [...branchConditions, ...conditions]
      })
    }
  })
  return rules
}
