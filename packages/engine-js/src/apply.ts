// `@apply(--mixin)` suffixes: the class body's composition rules become mixin contents
// and execute like native `@apply`, stored as one rule per outer state branch, as the
// engine's class_apply.rs expands them. The head's selector and the branch's condition
// suffixes order each rule; the mixins' inner selectors and conditions stay in its
// text. A class with any diagnostic, as named.rs reports them, expands to nothing.
import { decodeNativeContent, parseFunctionalClass, parseNativeDeclaration, splitStateToken } from './class-syntax'
import { conditionPriority, parseCustomMediaQuery, parseNativeQuery, queryRequiresCss, renderConditionToken, resolveLayerCondition } from './condition'
import { IDENT, tokenize } from './css-syntax'
import { addAnimationReferences, compositionRules, formatDeclaration, nativeDeclaration, rulePriority, wrapRawConditions } from './generate'
import { expandBody, expandMixin, expandUtility } from './mixin'
import { atomicShape, NATIVE, RECIPE, type RuleShape, type StoredRule } from './order'
import { cssEscape } from './program'
import type { MixinNode, Program, UtilityLayer } from './program-model'
import { replaceNestingSelector, selectorPriority, selectorTokenToTemplate, validSelectorStructure } from './selector'
import { resolveStateBranches, type StateBranch } from './state'
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
  // A declaration head is validated structurally; only its suffix remains.
  const declaration = parseNativeDeclaration(source)
  if (declaration === null) return true
  const stateSource = declaration ? source.slice(declaration.suffixStart) : source
  if (!declaration && hasExpansionError(source, program)) return true
  if (decodeNativeContent(stateSource) === undefined) return true
  const matches = declaration ? [] : matchingUtilities(source, program)
  const states = declaration ? [stateSource] : matches.map(([, matched]) => matched.stateToken)
  for (const state of states) {
    const [selector] = splitStateToken(state[0] === '!' ? state.slice(1) : state)
    if (selector && !validSelectorStructure(selectorTokenToTemplate(selector))) return true
  }
  let layer: UtilityLayer | undefined
  for (const token of splitStateToken(stateSource)[1]) {
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
    if (!program.customMedia.has(`--${token}`) && !renderConditionToken(token, program)) return true
  }
  // Unmatched token classes are ambiguous or unknown tokens.
  return !declaration && !matches.length && tokenPrefix(source, program) !== undefined
}

const textValue = (value: string) => [{ type: 'text' as const, value }]

function expandApplication(className: string, head: string, suffixes: string[], program: Program) {
  if (hasDiagnostics(className, program)) return
  const important = className.endsWith('!')
  const native = !!parseNativeDeclaration(head)
  const [first] = matchingUtilities(head, program)
  const state = first ? first[1].stateToken : nativeDeclaration(head)?.[1].stateToken ?? ''
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
  const body: MixinNode[] = []
  for (const rule of originals) {
    if (rule.explicitLayer && !setLayer(rule.explicitLayer)) return
    let nodes: MixinNode[] = rule.declarations.map(([property, value]) => ({ type: 'declaration', property, value: textValue(value) }))
    if (rule.selector !== '&') nodes = [{ type: 'rule', selector: rule.selector, body: nodes }]
    for (let index = rule.conditions.length - 1; index >= 0; index--) nodes = [{ type: 'condition', condition: rule.conditions[index], body: nodes }]
    body.push(...nodes)
  }
  // Each condition suffix contributes one of its branches to every outer branch.
  const options: (StateBranch[] | undefined)[] = []
  for (const suffix of suffixes) {
    const call = applyInvocation(suffix)
    const next = call === undefined ? resolveLayerCondition(suffix) : undefined
    if (call === null || (next && !setLayer(next))) return
    const branches = call === undefined && !next ? resolveStateBranches(`@${suffix}`, false, program) : undefined
    if (branches && !branches.length && !program.customMedia.has(`--${suffix}`)) return
    options.push(branches)
  }
  const template = state ? selectorTokenToTemplate(state) : undefined
  // Every combination of condition branches, the last suffix varying fastest; a
  // condition without branches leaves none.
  let combinations: StateBranch[][] = [[]]
  for (const branches of options) if (branches) combinations = combinations.flatMap((chosen) => branches.map((branch) => [...chosen, branch]))
  const primary = originals[0]
  const anchor = `.${cssEscape(className)}`
  const stored: StoredRule[] = []
  // One rule per outer branch. Each keeps its expansion atomic: sorting its fragments
  // would change authored order.
  for (const [group, chosen] of combinations.entries()) {
    let nodes = body
    let at = chosen.length
    for (let index = suffixes.length - 1; index >= 0; index--) {
      const call = applyInvocation(suffixes[index])
      if (call) nodes = [{ type: 'apply', name: call[0], arguments: call[1].map(textValue), contents: nodes }]
      else if (options[index]) nodes = chosen[--at].conditionWrappers.reduceRight<MixinNode[]>((contents, [, condition]) => [{ type: 'condition', condition, body: contents }], nodes)
    }
    if (template !== undefined) nodes = [{ type: 'rule', selector: template, body: nodes }]
    const expanded = expandBody(program, nodes)
    if (!expanded) return
    if (!expanded.length) continue
    const outer = chosen.flatMap((branch) => branch.conditionWrappers)
    const texts: string[] = []
    const selectors: string[] = []
    const declarations = expanded.map((rule) => {
      // Final declarations: inline tokens substituted, `!important` applied.
      const text = rule.declarations.map(([property, raw]) => {
        const value = substituteInlineTokens(raw, program)
        if (!important) return `${property}:${value}`
        const declaration = formatDeclaration(property, value, true)
        return `${property}:${declaration.slice(declaration.indexOf(':') + 1)}`
      }).join(';')
      const selector = replaceNestingSelector(rule.selector, anchor) ?? rule.selector
      texts.push(wrapRawConditions(`${selector}{${text}}`, rule.conditions))
      selectors.push(selector)
      return text
    }).join(';')
    // Atomic only when the expansion adds no selector, condition or declaration.
    const [only] = expanded
    const shape: RuleShape = expanded.length === 1 && only.selector === (template ?? '&') && only.conditions.length === outer.length && only.declarations.length === 1
      ? native ? { category: NATIVE } : atomicShape(...only.declarations[0])
      : { category: RECIPE }
    const [features, conditions] = conditionPriority(outer)
    const ir: GeneratedRule = {
      className,
      key: group ? `${className}\0${group}` : className,
      layer: layer ?? primary.layer,
      type: primary.type,
      sortTier: outer.length ? 3 : template === undefined ? 0 : 1,
      priority: rulePriority(features, selectorPriority(template), conditions, primary.valuePriority, declarations, shape),
      text: texts.join('')
    }
    if (texts.length > 1) ir.nodes = texts.map((text) => ({ text }))
    if (selectors.length === 1) ir.selectorText = selectors[0]
    const variableNames = collectCssVariableReferences(declarations).filter((name) => program.variables.has(name))
    if (variableNames.length) ir.variableNames = variableNames
    addAnimationReferences(ir, declarations, program)
    stored.push({ ir, features })
  }
  return stored
}

/** The rule of an `@apply` class, or undefined when the class has no `@apply` suffix. */
export function applicationRules(className: string, program: Program): StoredRule[] | undefined {
  if (!className.includes('@apply(')) return
  const source = className.endsWith('!') ? className.slice(0, -1) : className
  // A declaration head is opaque: only the text after it holds conditions.
  const declaration = parseNativeDeclaration(source)
  let head: string
  let suffixes: string[]
  if (declaration) {
    const [selector, conditions] = splitStateToken(source.slice(declaration.suffixStart))
    head = source.slice(0, declaration.suffixStart) + selector
    suffixes = conditions
  } else {
    [head, suffixes] = splitStateToken(source)
  }
  if (!suffixes.some((suffix) => suffix.startsWith('apply('))) return
  return expandApplication(className, head, suffixes, program) ?? []
}
