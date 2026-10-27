// Utility matching: which registered utilities a class names and with what value, as
// the engine's named.rs, utility.rs and utility_matching.rs select them. Token
// variables resolve on demand instead of from a precomputed table.
import { hasTopLevelValueSeparator, isMatchStateBoundary, parseFunctionalClass, splitDynamicValueState } from './class-syntax'
import { leadingDeclarationName, leadingFunctionName } from './css-syntax'
import { NATIVE_CSS_PROPERTY_SET } from './native-properties'
import { pending } from './pending'
import { cssEscape } from './program'
import type { Program, Utility, UtilityMatcher } from './program-model'
import { alphaPercentage, resolveValueComponents } from './value'

export type MatcherType = 'function' | 'static' | 'key' | 'token'

export interface UtilityMatch {
  /** The declaration value of a property utility. */
  value?: string
  /** The arguments of a recipe utility. */
  arguments: string[]
  stateToken: string
  variableNames: string[]
  matcherType: MatcherType
}

export const isNativeCssProperty = (property: string) => property.startsWith('--') || NATIVE_CSS_PROPERTY_SET.has(property)

/** Whether a class is a `property:value` declaration of a native property. */
export function isNativeDeclaration(source: string) {
  const head = leadingDeclarationName(source)
  return head !== undefined && isNativeCssProperty(head[1])
}

/** Token keys are non-empty and neither start nor end with `-`. */
export const isVariableKey = (key: string) => key !== '' && key[0] !== '-' && key[key.length - 1] !== '-'

/** Recipe keys that are CSS strings never take a custom property as their key. */
const excludesKey = (utility: Utility, key: string) => utility.emit.type === 'recipe' && utility.emit.key && key.includes('--')

/** The variable a token `key` of a utility names: an explicit alias, then the first `~namespace` that declares `namespace-key`. */
export function utilityVariable(utility: Utility, key: string, program: Program) {
  const { variables } = program
  for (const [alias, name] of utility.variableAliases) if (alias === key && variables.has(name)) return name
  if (excludesKey(utility, key) || !isVariableKey(key)) return
  for (const reference of utility.variableAliasRefs) {
    const name = `${reference[0] === '~' ? reference.slice(1) : reference}-${key}`
    if (variables.has(name)) return name
  }
}

const NEGATIVE_PROPERTIES = new Set([
  'outline-offset', 'text-underline-offset', 'mask-position', 'perspective-origin', 'transform-origin', 'cx', 'cy', 'x', 'y',
  'stroke-dashoffset', 'top', 'right', 'bottom', 'left', 'translate', 'rotate', 'letter-spacing', 'word-spacing', 'text-indent',
  'background-position', 'object-position', 'animation-delay', 'transition-delay', 'order', 'z-index'
])

function allowsNegativeToken(utility: Utility) {
  if (utility.emit.type !== 'property') return false
  const { property } = utility.emit
  return property.startsWith('margin') || property.startsWith('scroll-margin') || property.startsWith('inset') || NEGATIVE_PROPERTIES.has(property)
}

const variableReference = (name: string) => `var(${cssEscape(`--${name}`)})`

function resolveUtilityValue(value: string, utility: Utility, program: Program): [value: string, variableNames: string[]] | undefined {
  const slash = value.indexOf('/')
  if (slash >= 0) {
    const name = utilityVariable(utility, value.slice(0, slash), program)
    const variable = name === undefined ? undefined : program.variables.get(name)
    if (!variable?.namespace.startsWith('color')) return
    const percentage = alphaPercentage(value.slice(slash + 1))
    if (percentage === undefined) return
    return [`color-mix(in oklab,${variableReference(variable.name)} ${percentage}%,transparent)`, [variable.name]]
  }
  const negative = value[0] === '-'
  const name = utilityVariable(utility, negative ? value.slice(1) : value, program)
  const variable = name === undefined ? undefined : program.variables.get(name)
  if (!variable || (negative && variable.variableType !== 'number')) return
  const reference = variableReference(variable.name)
  return [negative ? `calc(${reference} * -1)` : reference, [variable.name]]
}

function resolveUtilityAliasValue(value: string, utility: Utility, program: Program) {
  const slash = value.indexOf('/')
  const key = slash < 0 ? value : value.slice(0, slash)
  if (utilityVariable(utility, key[0] === '-' ? key.slice(1) : key, program) === undefined) return
  return resolveUtilityValue(value, utility, program)
}

/** The recipe arguments of a token key: the variable, or the key as a CSS string for string parameters. */
function namedArguments(key: string, utility: Utility, program: Program): [arguments: string[], variableNames: string[]] | undefined {
  const keyArgument = utility.emit.type === 'recipe' && utility.emit.key
  if (keyArgument && key.includes('--')) return
  const variable = utilityVariable(utility, key, program)
  if (variable === undefined) return
  if (!keyArgument) return [[`var(--${variable})`], [variable]]
  return [[`"${key.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`], [variable]]
}

function matchUtility(className: string, utility: Utility, program: Program, type: UtilityMatcher['type']): UtilityMatch | undefined {
  for (const matcher of utility.matchers) {
    if (matcher.type !== type) continue
    if (matcher.type === 'static') {
      const rest = className.slice(matcher.name.length)
      if (className.startsWith(matcher.name) && isMatchStateBoundary(rest)) {
        return { arguments: [], stateToken: rest, variableNames: [], matcherType: 'static' }
      }
    } else if (matcher.type === 'key') {
      for (const key of matcher.keys) {
        if (!className.startsWith(key) || className.charCodeAt(key.length) !== 0x3a) continue
        const [value, stateToken] = splitDynamicValueState(className.slice(key.length + 1))
        if (!value) continue
        const [resolved, variableNames] = resolveValueComponents(value, program)
        return { value: resolved, arguments: [], stateToken, variableNames, matcherType: 'key' }
      }
    } else if (matcher.type === 'token') {
      const { prefix } = matcher
      let negative = false
      let raw: string
      if (className.startsWith(prefix)) raw = className.slice(prefix.length)
      else if (className[0] === '-' && className.startsWith(prefix, 1)) {
        negative = true
        raw = className.slice(prefix.length + 1)
      } else continue
      const [value, stateToken] = splitDynamicValueState(raw)
      if (!value || hasTopLevelValueSeparator(value) || value[0] === '-') continue
      if (negative && !allowsNegativeToken(utility)) continue
      const token = negative ? `-${value}` : value
      if (utility.emit.type === 'recipe') {
        const named = namedArguments(token, utility, program)
        if (named) return { arguments: named[0], stateToken, variableNames: named[1], matcherType: 'token' }
      } else {
        const resolved = resolveUtilityAliasValue(token, utility, program)
        if (resolved) return { value: resolved[0], arguments: [], stateToken, variableNames: resolved[1], matcherType: 'token' }
      }
    }
  }
}

/** The longest registered token prefix of a class, with or without its negative sign. */
export function tokenPrefix(source: string, program: Program) {
  // A native declaration key owns its colon (font-family:mono never means font-family:hover).
  const colon = source.indexOf(':')
  if (colon >= 0 && (isNativeDeclaration(source) || NATIVE_CSS_PROPERTY_SET.has(source.slice(0, colon)))) return
  let longest: string | undefined
  for (const candidate of source[0] === '-' ? [source, source.slice(1)] : [source]) {
    for (const prefix of program.tokenPrefixes.get(candidate[0]) ?? []) {
      if (prefix[prefix.length - 1] !== '-' || !candidate.startsWith(prefix)) continue
      // Ties go to the unsigned spelling, as Rust's `max_by_key` keeps the last.
      if (!longest || prefix.length >= longest.length) longest = prefix
      break
    }
  }
  return longest
}

/** Utilities whose namespace owns the token key, before any sign or opacity applies. */
function tokenOwners(source: string, prefix: string, program: Program) {
  const indexes = program.tokenUtilities.get(prefix)
  if (!indexes) return []
  let raw: string
  if (source.startsWith(prefix)) raw = source.slice(prefix.length)
  else if (source[0] === '-' && source.startsWith(prefix, 1)) raw = source.slice(prefix.length + 1)
  else return []
  const [value] = splitDynamicValueState(raw)
  if (!value || value[0] === '-' || hasTopLevelValueSeparator(value)) return []
  const slash = value.indexOf('/')
  const key = slash < 0 ? value : value.slice(0, slash)
  return indexes.filter((index) => utilityVariable(program.utilities[index], key, program) !== undefined)
}

/** The match of a token class whose key exactly one utility owns. */
export function tokenCandidates(source: string, prefix: string, program: Program): [number, UtilityMatch][] {
  const owners = tokenOwners(source, prefix, program)
  if (owners.length !== 1) return []
  const matched = matchUtility(source, program.utilities[owners[0]], program, 'token')
  return matched ? [[owners[0], matched]] : []
}

/**
 * The utilities a class (without `!`) matches, in priority order. A family is selected
 * before its token is looked up, so a missing qualified token never falls back to a
 * shorter prefix, and static names reserve their spelling.
 */
export function matchingUtilities(source: string, program: Program): [number, UtilityMatch][] {
  const matches: [number, UtilityMatch][] = []
  // A class that starts with a function token only names function utilities.
  if (leadingFunctionName(source) !== undefined) {
    const head = parseFunctionalClass(source)
    if (typeof head !== 'object') return matches
    const index = program.functionUtilities.get(head.name)
    if (index !== undefined && program.utilities[index].emit.type === 'recipe') pending('J4', 'function utility')
    return matches
  }
  if (!isNativeDeclaration(source)) {
    for (let end = source.length; end >= 0; end--) {
      if (end < source.length && !isMatchStateBoundary(source.slice(end, end + 1))) continue
      const indexes = program.staticUtilities.get(source.slice(0, end))
      if (!indexes) continue
      for (const index of indexes) {
        const matched = matchUtility(source, program.utilities[index], program, 'static')
        if (matched) matches.push([index, matched])
      }
      if (matches.length) return matches
    }
  }
  const prefix = tokenPrefix(source, program)
  if (prefix !== undefined) return tokenCandidates(source, prefix, program)
  const colon = source.indexOf(':')
  if (colon < 0) return matches
  const indexes = program.keyUtilities.get(source.slice(0, colon)) ?? []
  const explicit = indexes.some((index) => !program.utilities[index].nativeFallback)
  for (const index of indexes) {
    if (explicit && program.utilities[index].nativeFallback) continue
    const matched = matchUtility(source, program.utilities[index], program, 'key')
    if (matched) matches.push([index, matched])
  }
  return matches
}
