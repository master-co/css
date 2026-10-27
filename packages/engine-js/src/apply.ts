// `@apply(--mixin)` suffixes: the class body's composition rules become mixin contents
// and execute like native `@apply`, stored as one atomic rule, as the engine's
// class_apply.rs expands them. A class with any diagnostic, as named.rs reports them,
// expands to nothing.
import { decodeNativeContent, parseFunctionalClass, splitDynamicValueState, splitStateToken } from './class-syntax'
import { conditionPriority, parseCustomMediaQuery, parseNativeQuery, parseRawConditionWrapper, queryRequiresCss, renderConditionToken, resolveLayerCondition } from './condition'
import { IDENT, leadingDeclarationName, tokenize } from './css-syntax'
import { addAnimationReferences, compositionRules, formatDeclaration, nativeDeclarationFallback, rulePriority, wrapRawConditions } from './generate'
import { expandBody, expandMixin, expandUtility } from './mixin'
import type { StoredRule } from './order'
import { cssEscape } from './program'
import type { MixinNode, Program, UtilityLayer } from './program-model'
import { replaceNestingSelector, selectorPriority, selectorTokenToTemplate, validSelectorStructure } from './selector'
import { resolveStateBranches } from './state'
import { trim } from './text'
import type { GeneratedRule } from './types'
import { functionInvocation, matchingUtilities, tokenPrefix } from './utility'
import { collectCssVariableReferences, substituteInlineTokens } from './value'

/** The CSS mixin call inside an `@apply(…)` suffix: a complete dashed call or name. */
function parseMixinCall(source: string): [name: string, arguments: string[]] | undefined {
  const head = parseFunctionalClass(source)
  if (head !== undefined) {
    if (typeof head === 'string' || !head.name.startsWith('--') || head.suffix) return
    return [head.name, head.arguments.map(trim)]
  }
  const tokens = tokenize(source)
  if (tokens.length === 1 && tokens[0].kind === IDENT && tokens[0].value.startsWith('--')) return [tokens[0].value, []]
}

/** The mixin call of an `apply(…)` condition token; null when it is malformed, undefined for other tokens. */
function applyInvocation(token: string) {
  if (!token.startsWith('apply(')) return
  const body = token.endsWith(')') ? decodeNativeContent(token.slice(6, -1)) : undefined
  return (body === undefined ? undefined : parseMixinCall(body)) ?? null
}

/** Whether a function class or a matched recipe fails to expand. */
function hasExpansionError(source: string, program: Program) {
  const invocation = functionInvocation(source, program)
  if (invocation !== undefined) return !invocation || !expandUtility(program, invocation[1], invocation[2])
  return matchingUtilities(source, program).some(([index, matched]) => {
    const { emit } = program.utilities[index]
    return emit.type === 'recipe' && !expandUtility(program, program.utilityDefinitions[emit.definition], matched.arguments)
  })
}

/** Whether the Rust engine reports any error diagnostic for a class. */
function hasDiagnostics(className: string, program: Program) {
  const source = className.endsWith('!') ? className.slice(0, -1) : className
  if (hasExpansionError(source, program) || decodeNativeContent(source) === undefined) return true
  const matches = matchingUtilities(source, program)
  const states = matches.map(([, matched]) => matched.stateToken)
  const head = leadingDeclarationName(source)
  if (head) states.push(splitDynamicValueState(source.slice(head[0] + 1))[1])
  for (const state of states) {
    const [selector] = splitStateToken(state)
    if (selector && !validSelectorStructure(selectorTokenToTemplate(selector))) return true
  }
  let layer: UtilityLayer | undefined
  for (const token of splitStateToken(source)[1]) {
    const call = applyInvocation(token)
    if (call !== undefined) {
      if (!call || !expandMixin(program, call[0], call[1], [])) return true
      continue
    }
    const next = resolveLayerCondition(token)
    if (next) {
      if (layer && layer !== next) return true
      layer = next
      continue
    }
    if (queryRequiresCss(token)) return true
    const query = parseNativeQuery(token)
    if (query?.kind === 'media' && query.prelude.includes('--') && !parseCustomMediaQuery(query.prelude, (name) => program.customMedia.get(name))) return true
    if (!program.customMedia.has(`--${token}`) && !renderConditionToken(token)) return true
  }
  // Unmatched token classes are ambiguous or unknown tokens.
  return !matches.length && tokenPrefix(source, program) !== undefined
}

interface ApplicationRule {
  selector: string
  conditions: string[]
  /** Final declarations: inline tokens substituted, `!important` applied. */
  declarations: string
  sortTier: number
  selectorPriority: number
}

const textValue = (value: string) => [{ type: 'text' as const, value }]

function expandApplication(className: string, head: string, suffixes: string[], program: Program) {
  if (hasDiagnostics(className, program)) return
  const important = className.endsWith('!')
  const [first] = matchingUtilities(head, program)
  const state = first ? first[1].stateToken : nativeDeclarationFallback(head, program)?.[1].stateToken ?? ''
  const base = head.endsWith(state) ? head.slice(0, head.length - state.length) : head
  if (hasDiagnostics(base, program)) return
  const originals = compositionRules(base, program)
  if (!originals.length) return
  let layer: UtilityLayer | undefined
  const setLayer = (next: UtilityLayer) => {
    if (layer && layer !== next) return false
    layer = next
    return true
  }
  let body: MixinNode[] = []
  for (const rule of originals) {
    if (rule.explicitLayer && !setLayer(rule.explicitLayer)) return
    let nodes: MixinNode[] = rule.declarations.map(([property, value]) => ({ type: 'declaration', property, value: textValue(value) }))
    if (rule.selector !== '&') nodes = [{ type: 'rule', selector: rule.selector, body: nodes }]
    for (let index = rule.conditions.length - 1; index >= 0; index--) nodes = [{ type: 'condition', condition: rule.conditions[index], body: nodes }]
    body.push(...nodes)
  }
  for (let index = suffixes.length - 1; index >= 0; index--) {
    const suffix = suffixes[index]
    const call = applyInvocation(suffix)
    const next = call === undefined ? resolveLayerCondition(suffix) : undefined
    if (call !== undefined) {
      if (!call) return
      body = [{ type: 'apply', name: call[0], arguments: call[1].map(textValue), contents: body }]
    } else if (next) {
      if (!setLayer(next)) return
    } else {
      const branches = resolveStateBranches(`@${suffix}`, false, program)
      if (!branches.length && !program.customMedia.has(`--${suffix}`)) return
      const contents = body
      body = branches.flatMap((branch) => branch.conditionWrappers.reduceRight<MixinNode[]>((nodes, [, condition]) => [{ type: 'condition', condition, body: nodes }], contents))
    }
  }
  if (state) body = [{ type: 'rule', selector: selectorTokenToTemplate(state), body }]
  const expanded = expandBody(program, body)
  if (!expanded) return
  const primary = originals[0]
  const rules = expanded.map((rule): ApplicationRule => ({
    selector: rule.selector,
    conditions: rule.conditions,
    declarations: rule.declarations.map(([property, raw]) => {
      const value = substituteInlineTokens(raw, program)
      if (!important) return `${property}:${value}`
      const declaration = formatDeclaration(property, value, true)
      return `${property}:${declaration.slice(declaration.indexOf(':') + 1)}`
    }).join(';'),
    sortTier: rule.conditions.some((condition) => parseRawConditionWrapper(condition)) ? 3 : rule.selector === '&' ? 0 : 1,
    selectorPriority: selectorPriority(rule.selector)
  }))
  return { rules, layer: layer ?? primary.layer, type: primary.type, valuePriority: primary.valuePriority }
}

/** The atomic rule of an expansion; sorting its fragments would change authored order. */
function storeApplication(className: string, expansion: NonNullable<ReturnType<typeof expandApplication>>, program: Program): StoredRule[] {
  const { rules } = expansion
  if (!rules.length) return []
  const anchor = `.${cssEscape(className)}`
  const texts: string[] = []
  const selectors: string[] = []
  const wrappers: [string, string][] = []
  for (const rule of rules) {
    const selector = replaceNestingSelector(rule.selector, anchor) ?? rule.selector
    texts.push(wrapRawConditions(`${selector}{${rule.declarations}}`, rule.conditions))
    selectors.push(selector)
    for (const condition of rule.conditions) {
      const wrapper = parseRawConditionWrapper(condition)
      if (wrapper) wrappers.push(wrapper)
    }
  }
  const declarations = rules.map((rule) => rule.declarations).join(';')
  const variableNames = collectCssVariableReferences(declarations).filter((name) => program.variables.has(name))
  const [features, conditions] = conditionPriority(wrappers)
  const ir: GeneratedRule = {
    className,
    key: className,
    layer: expansion.layer,
    type: expansion.type,
    sortTier: Math.max(...rules.map((rule) => rule.sortTier)),
    priority: rulePriority(features, Math.max(...rules.map((rule) => rule.selectorPriority)), conditions, expansion.valuePriority, declarations),
    text: texts.join('')
  }
  if (texts.length > 1) ir.nodes = texts.map((text) => ({ text }))
  if (selectors.length === 1) ir.selectorText = selectors[0]
  if (variableNames.length) ir.variableNames = variableNames
  addAnimationReferences(ir, declarations, program)
  return [{ ir, features, manifestOrder: 0, declarations, nativeFallback: false }]
}

/** The rule of an `@apply` class, or undefined when the class has no `@apply` suffix. */
export function applicationRules(className: string, program: Program): StoredRule[] | undefined {
  if (!className.includes('@apply(')) return
  const [head, suffixes] = splitStateToken(className.endsWith('!') ? className.slice(0, -1) : className)
  if (!suffixes.some((suffix) => suffix.startsWith('apply('))) return
  const expansion = expandApplication(className, head, suffixes, program)
  return expansion ? storeApplication(className, expansion, program) : []
}
