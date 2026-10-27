// Class rule generation, as `generate_class_rules` in the engine's generation.rs builds
// them: match the class, take each utility's emitted state branches, and render one
// stored rule per key and layer. A native declaration is the fallback when no
// registered utility matches.
import { analyzeAnimations, stylesheetDeclarations, type AnimationReferences } from './animation'
import { decodeNativeContent, splitDynamicValueState, splitStateToken } from './class-syntax'
import { leadingDeclarationName } from './css-syntax'
import type { StoredRule } from './order'
import { pending } from './pending'
import { cssEscape } from './program'
import type { Program, Utility } from './program-model'
import type { GeneratedRule, RulePriority } from './types'
import { matchingUtilities, tokenCandidates, tokenPrefix, type UtilityMatch } from './utility'
import { collectCssVariableReferences, resolveValueComponents, substituteInlineTokens } from './value'

interface StateBranch {
  key: string
  important: boolean
}

function resolveStateBranches(stateToken: string, important: boolean): StateBranch[] {
  if (stateToken[0] === '!') {
    important = true
    stateToken = stateToken.slice(1)
  }
  if (stateToken) pending('J3', 'selector state or condition')
  return [{ key: '', important }]
}

function formatDeclaration(property: string, value: string, important: boolean) {
  return important && !value.endsWith('!important') ? `${property}:${value}!important` : `${property}:${value}`
}

/** Compatibility declarations are an engine output policy, not preset recipes. */
const WEBKIT_PROPERTIES = new Set(['text-decoration', 'backdrop-filter', 'box-decoration-break', 'mask-image', 'user-drag', 'user-select'])

function formatNativeDeclaration(property: string, value: string, important: boolean) {
  const standard = formatDeclaration(property, value, important)
  return WEBKIT_PROPERTIES.has(property) ? `${formatDeclaration(`-webkit-${property}`, value, important)};${standard}` : standard
}

/** The declaration text of each rule a utility emits for a match. */
function emitDeclarations(utility: Utility, matched: UtilityMatch, important: boolean): string[] {
  if (utility.emit.type === 'recipe') return pending('J4', 'recipe utility')
  return matched.value ? [formatNativeDeclaration(utility.emit.property, matched.value, important)] : []
}

/** Declaration semantics for ordering; static and enum identities keep their manifest order. */
function sortKey(utility: Utility, matched: UtilityMatch) {
  if (utility.utilityType === -2 && matched.matcherType !== 'token') return ''
  return emitDeclarations(utility, matched, false).join(';')
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
function nativeDeclarationFallback(className: string, program: Program): [Utility, UtilityMatch] | undefined {
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

function declarationAnimationReferences(declarations: string, program: Program): AnimationReferences {
  if (!declarations.includes('\\') && !/animation/i.test(declarations)) return { names: [], retainAll: false }
  return analyzeAnimations(stylesheetDeclarations(`a{${declarations}}`), program)
}

export function generateClassRules(className: string, program: Program): StoredRule[] {
  if (className.includes('@apply(')) {
    const [, suffixes] = splitStateToken(className.endsWith('!') ? className.slice(0, -1) : className)
    if (suffixes.some((suffix) => suffix.startsWith('apply('))) pending('J4', '@apply')
  }
  if (decodeNativeContent(className) === undefined) return []
  const important = className.endsWith('!')
  const source = important ? className.slice(0, -1) : className
  const candidates = matchingUtilities(source, program).map(([index, matched]): [Utility, UtilityMatch] => [program.utilities[index], matched])
  if (!candidates.length) {
    const fallback = nativeDeclarationFallback(source, program)
    if (fallback) candidates.push(fallback)
  }
  const rules: StoredRule[] = []
  const seen = new Set<string>()
  for (const [utility, matched] of candidates) {
    // A native fallback only applies when no registered utility emitted.
    if (utility.nativeFallback && rules.length) break
    let ruleSortKey: string | undefined
    for (const [branchIndex, branch] of resolveStateBranches(matched.stateToken, important).entries()) {
      const emitted = emitDeclarations(utility, matched, branch.important)
      if (!emitted.length) continue
      const key = branchIndex === 0 && !branch.key ? className : `${className}\0${branch.key}`
      const layer = utility.layer
      if (seen.has(`${layer} ${key}`)) continue
      seen.add(`${layer} ${key}`)
      ruleSortKey ??= sortKey(utility, matched)
      const priority: RulePriority = { features: [], selector: 0 }
      if (matched.matcherType === 'token') priority.valuePriority = -1
      if (ruleSortKey) priority.sortKey = ruleSortKey
      const selectorText = `.${cssEscape(className)}`
      const declarations = emitted.map((text) => substituteInlineTokens(text, program))
      const joined = declarations.join(';')
      const variableNames = matched.variableNames.filter((name) => program.variables.get(name)?.inlineValue === undefined)
      for (const name of collectCssVariableReferences(joined)) {
        if (program.variables.has(name) && !variableNames.includes(name)) variableNames.push(name)
      }
      const animation = declarationAnimationReferences(joined, program)
      if (animation.names.length || animation.retainAll) pending('J4', 'keyframe resources')
      const ir: GeneratedRule = {
        className,
        key,
        layer,
        type: utility.utilityType,
        sortTier: 0,
        priority,
        text: declarations.map((text) => `${selectorText}{${text}}`).join(''),
        selectorText
      }
      if (variableNames.length) ir.variableNames = variableNames
      rules.push({ ir, manifestOrder: utility.order, declarations: joined, nativeFallback: utility.nativeFallback })
    }
  }
  return rules
}
