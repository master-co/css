// The statically compilable mixin subset: mixin calls, utility recipes and `@apply`
// bodies expand into rules, as the engine's mixin.rs executes them. An expansion
// either succeeds or yields nothing; the runtime reports no messages.
import { splitTopLevel } from './class-syntax'
import { DELIM, FUNCTION, IDENT, NUMBER, STRING, tokenize } from './css-syntax'
import type { MixinDefinition, MixinNode, MixinValuePart, Program, RecipeDefinition } from './program-model'
import { cssEscape } from './program'
import { replaceNestingSelector } from './selector'
import { asciiLowercase, isWhitespace, trim } from './text'
import { isNativeCssProperty } from './utility'
import { decimalIsFinite, parseDecimal } from './value'

type MixinParameter = MixinDefinition['parameters'][number]
type Environment = ReadonlyMap<string, string>

export interface ExpandedRule {
  selector: string
  conditions: string[]
  declarations: [property: string, value: string][]
}

/** Unwinds an expansion that fails; never leaves this module. */
const EXPANSION_ERROR = new Error('Invalid mixin expansion')
const fail = (): never => {
  throw EXPANSION_ERROR
}

const MAX_DEPTH = 64
const MAX_STEPS = 100000
const EMPTY: Environment = new Map()

const WIDE_KEYWORDS = new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer', 'default'])
const isWide = (name: string) => WIDE_KEYWORDS.has(asciiLowercase(name))
const DYNAMIC_FUNCTIONS = new Set(['attr', 'env', 'random', 'random-item'])

/** Rust `str::parse::<i64>`: an optional sign and digits within range. */
function isInteger(text: string) {
  if (!/^[+-]?\d+$/.test(text)) return false
  const value = BigInt(text)
  return value >= -0x8000000000000000n && value <= 0x7fffffffffffffffn
}

function validArgument(parameter: MixinParameter, value: string, allowVar: boolean) {
  const tokens = tokenize(value)
  if (!tokens.length) return false
  for (const token of tokens) {
    if (token.kind === FUNCTION) {
      const name = asciiLowercase(token.value)
      if ((name === 'var' && !allowVar) || DYNAMIC_FUNCTIONS.has(name) || token.value.startsWith('--')) return false
    }
  }
  for (const token of tokens) {
    if (token.kind === DELIM && ';{}!'.includes(token.value)) return false
    if ((token.kind === FUNCTION || (token.kind === DELIM && (token.value === '(' || token.value === '['))) && token.close < 0) return false
  }
  const [only] = tokens
  const single = tokens.length === 1
  if (single && only.kind === IDENT && isWide(only.value)) return false
  switch (parameter.syntax) {
    case undefined: return true
    case 'integer': return single && only.kind === NUMBER && isInteger(only.value)
    case 'number': {
      const decimal = single && only.kind === NUMBER ? parseDecimal(only.value) : undefined
      return !!decimal && decimalIsFinite(decimal)
    }
    case 'string': return single && only.kind === STRING && (value.endsWith('"') || value.endsWith("'"))
    case 'custom-ident': return single && only.kind === IDENT && !isWide(only.value)
  }
}

function ident(value: string) {
  let result = ''
  for (const token of tokenize(value)) {
    if (token.kind === STRING || token.kind === IDENT || (token.kind === NUMBER && isInteger(token.value))) result += token.value
    else return
  }
  return result ? cssEscape(result) : undefined
}

/** The parameter a `var()` argument names, when the environment binds it. */
function parameterValue(inner: string, environment: Environment) {
  const tokens = tokenize(trim(splitTopLevel(inner, ',')[0]))
  return tokens.length === 1 && tokens[0].kind === IDENT ? environment.get(tokens[0].value) : undefined
}

/** A mixin value with bound parameters substituted; undefined when an `ident()` is invalid. */
function evaluateValue(value: MixinValuePart[], environment: Environment): string | undefined {
  let output = ''
  for (const part of value) {
    if (part.type === 'text') {
      output += part.value
      continue
    }
    const inner = evaluateValue(part.value, environment)
    if (inner === undefined) return
    const name = asciiLowercase(part.name)
    const argument = name === 'var' ? parameterValue(inner, environment) : undefined
    if (argument !== undefined) {
      output += argument
    } else if (name === 'ident') {
      const result = ident(inner)
      if (result === undefined) return
      output += result
    } else {
      output += `${part.name}(${inner})`
    }
  }
  return output
}

function referencesParameters(value: MixinValuePart[], environment: Environment): boolean {
  if (!environment.size) return false
  return value.some((part) => {
    if (part.type === 'text') return false
    if (asciiLowercase(part.name) === 'var') {
      const inner = evaluateValue(part.value, EMPTY)
      if (inner !== undefined && parameterValue(inner, environment) !== undefined) return true
    }
    return referencesParameters(part.value, environment)
  })
}

const restricted = (environment: Environment, names: ReadonlySet<string>) => {
  if (!names.size) return EMPTY
  const result = new Map<string, string>()
  for (const [name, value] of environment) if (names.has(name)) result.set(name, value)
  return result
}

const PSEUDO_ELEMENTS = new Set(['before', 'after', 'first-letter', 'first-line'])

/**
 * A nested selector stays on the invoking element only when it is one compound rooted
 * at `&`, without a pseudo-element. Functional pseudo-classes may hold selector
 * arguments without changing the subject.
 */
function sameSubject(selector: string) {
  return splitTopLevel(selector, ',').every((part) => {
    const branch = trim(part)
    const tokens = tokenize(branch)
    let ampersands = 0
    let subject = false
    let previousEnd = 0
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]
      for (let unit = previousEnd; unit < token.start; unit++) {
        if (isWhitespace(branch.charCodeAt(unit))) {
          subject = false
          break
        }
      }
      if (token.kind === DELIM) {
        if (token.value === '&') {
          ampersands++
          subject = true
        } else if ('>+~|'.includes(token.value)) {
          subject = false
        } else if (token.value === ':') {
          const next = tokens[index + 1]
          if (next && ((next.kind === DELIM && next.value === ':') || (next.kind === IDENT && PSEUDO_ELEMENTS.has(next.value)))) return false
        }
      }
      if (token.kind === FUNCTION || (token.kind === DELIM && token.value === '[')) {
        if (token.close < 0) return false
        index = token.close
      }
      previousEnd = tokens[index].end
    }
    return ampersands === 1 && subject
  })
}

/** Whether a number token is a positive integer, decided on its digits; one beyond `f64` is not. */
function isPositiveInteger(number: string) {
  const decimal = parseDecimal(number)
  return !decimal || (!decimal.negative && !!decimal.digits && decimal.point >= decimal.digits.length && decimalIsFinite(decimal))
}

/** Substituted values keep the positive integers the grammar requires. */
function validDeclaration(name: string, value: string) {
  const tokens = tokenize(value)
  const property = asciiLowercase(name)
  for (const [index, token] of tokens.entries()) {
    const positive = (token.kind === FUNCTION && asciiLowercase(token.value) === 'repeat')
      || ((property === 'grid-column' || property === 'grid-row') && token.kind === IDENT && asciiLowercase(token.value) === 'span')
    const next = tokens[index + 1]
    if (positive && next?.kind === NUMBER && !isPositiveInteger(next.value)) return false
  }
  return property !== '-webkit-line-clamp' || tokens[0]?.kind !== NUMBER || isPositiveInteger(tokens[0].value)
}

const directValueMixins = new WeakMap<MixinDefinition, boolean>()

/** Only this identity-shaped body, `property: var(--parameter)`, accepts delayed CSS values as arguments. */
function isDirectValueMixin(definition: MixinDefinition) {
  let direct = directValueMixins.get(definition)
  if (direct === undefined) {
    directValueMixins.set(definition, direct = directValue(definition))
  }
  return direct
}

function directValue({ parameters, body }: MixinDefinition) {
  const [parameter] = parameters
  const [declaration] = body
  if (parameters.length !== 1 || parameter.syntax !== undefined || parameter.default !== undefined) return false
  if (body.length !== 1 || declaration.type !== 'declaration') return false
  if (declaration.property.startsWith('--') || !isNativeCssProperty(declaration.property)) return false
  const parts = declaration.value.filter((part) => part.type !== 'text' || trim(part.value))
  const [call] = parts
  if (parts.length !== 1 || call.type !== 'function' || asciiLowercase(call.name) !== 'var') return false
  let argument = ''
  for (const part of call.value) {
    if (part.type !== 'text') return false
    argument += part.value
  }
  const tokens = tokenize(argument)
  return tokens.length === 1 && tokens[0].kind === IDENT && tokens[0].value === parameter.name
}

interface ContentsContext {
  nodes: MixinNode[]
  environment: Environment
  outer?: ContentsContext
  stack: string[]
  safeSubject: boolean
  forbidden: ReadonlySet<string>
}

const sameConditions = (left: string[], right: string[]) => left.length === right.length && left.every((condition, index) => condition === right[index])

class Expansion {
  stack: string[] = []
  readonly output: ExpandedRule[] = []
  private steps = 0
  private depth = 0

  constructor(private readonly lookup: (name: string) => MixinDefinition | undefined, private readonly symbolicRoot?: string) {}

  call(name: string, args: string[], outer: Environment, selector: string, conditions: string[], forbidden: ReadonlySet<string>, contents?: ContentsContext) {
    if (this.depth >= MAX_DEPTH || this.stack.includes(name)) fail()
    const definition = this.lookup(name) ?? fail()
    this.stack.push(name)
    this.depth++
    if (args.length > definition.parameters.length) fail()
    const environment = new Map(outer)
    const allowVar = isDirectValueMixin(definition) || this.symbolicRoot === name
    const unbound = new Set(forbidden)
    for (const [index, parameter] of definition.parameters.entries()) {
      const value = index < args.length ? args[index] : parameter.default ?? fail()
      if (!validArgument(parameter, value, allowVar)) fail()
      environment.set(parameter.name, value)
      unbound.delete(parameter.name)
    }
    this.nodes(definition.body, environment, selector, conditions, true, unbound, contents)
    this.stack.pop()
    this.depth--
  }

  /** Whether a value uses a parameter it may not: any across elements, or a forbidden one. */
  private crossesElements(value: MixinValuePart[], environment: Environment, safeSubject: boolean, forbidden: ReadonlySet<string>) {
    return (!safeSubject && referencesParameters(value, environment)) || referencesParameters(value, restricted(environment, forbidden))
  }

  nodes(nodes: MixinNode[], environment: Environment, selector: string, conditions: string[], safeSubject: boolean, forbidden: ReadonlySet<string>, contents?: ContentsContext) {
    for (const node of nodes) {
      if (++this.steps > MAX_STEPS) fail()
      switch (node.type) {
        case 'declaration': {
          if (environment.has(node.property) || this.crossesElements(node.value, environment, safeSubject, forbidden)) fail()
          const substituted = referencesParameters(node.value, environment)
          const value = evaluateValue(node.value, environment) ?? fail()
          if (substituted && !validDeclaration(node.property, value)) fail()
          // One declaration per fragment keeps duplicates and their interleaving with
          // nested rules; adjacent runs join.
          const previous = this.output[this.output.length - 1]
          if (previous && previous.selector === selector && sameConditions(previous.conditions, conditions)) {
            previous.declarations.push([node.property, value])
          } else {
            this.output.push({ selector, conditions: [...conditions], declarations: [[node.property, value]] })
          }
          break
        }
        case 'rule': {
          const next = replaceNestingSelector(node.selector, selector) ?? `${selector} ${node.selector}`
          this.nodes(node.body, environment, next, conditions, safeSubject && sameSubject(node.selector), forbidden, contents)
          break
        }
        case 'condition':
          this.nodes(node.body, environment, selector, [...conditions, node.condition], safeSubject, forbidden, contents)
          break
        case 'contents':
          if (contents) {
            const stack = this.stack
            this.stack = [...contents.stack]
            this.nodes(contents.nodes, contents.environment, selector, conditions, safeSubject && contents.safeSubject, contents.forbidden, contents.outer)
            this.stack = stack
          } else {
            this.nodes(node.fallback, environment, selector, conditions, safeSubject, forbidden)
          }
          break
        case 'apply': {
          if (node.arguments.some((argument) => this.crossesElements(argument, environment, safeSubject, forbidden))) fail()
          const args = node.arguments.map((argument) => evaluateValue(argument, environment) ?? fail())
          const next = safeSubject ? forbidden : new Set([...forbidden, ...environment.keys()])
          const passed = node.contents && { nodes: node.contents, environment, outer: contents, stack: [...this.stack], safeSubject, forbidden: next }
          this.call(node.name, args, environment, selector, conditions, next, passed)
          break
        }
      }
    }
  }
}

const registries = new WeakMap<MixinDefinition[], Map<string, MixinDefinition>>()

/** Mixins by name; a later definition replaces an earlier one. */
function registry(mixins: MixinDefinition[]) {
  let result = registries.get(mixins)
  if (!result) registries.set(mixins, result = new Map(mixins.map((definition) => [definition.name, definition])))
  return result
}

function run(expansion: Expansion, execute: () => void) {
  try {
    execute()
  } catch (error) {
    if (error === EXPANSION_ERROR) return
    throw error
  }
  return expansion.output
}

/** A mixin call, with the caller's `@contents` when given. */
export function expandMixin(program: Program, name: string, args: string[], contents?: MixinNode[]) {
  const mixins = registry(program.mixins)
  const expansion = new Expansion((mixin) => mixins.get(mixin))
  const context = contents && { nodes: contents, environment: EMPTY, stack: [], safeSubject: true, forbidden: new Set<string>() }
  return run(expansion, () => expansion.call(name, args, EMPTY, '&', [], new Set(), context))
}

/** An already compiled caller body, without a named definition. */
export function expandBody(program: Program, body: MixinNode[]) {
  const mixins = registry(program.mixins)
  const expansion = new Expansion((mixin) => mixins.get(mixin))
  return run(expansion, () => expansion.nodes(body, EMPTY, '&', [], true, new Set()))
}

/**
 * A utility recipe, registered in its own namespace over the mixins. Only token
 * recipes with an untyped value bind symbolic arguments such as `var()`.
 */
export function expandUtility(program: Program, definition: RecipeDefinition, args: string[]) {
  const { recipe } = definition
  const mixins = registry(program.mixins)
  const symbolic = definition.kind === 'token' && recipe.parameters[0]?.syntax === undefined
  const expansion = new Expansion((name) => name === recipe.name ? recipe : mixins.get(name), symbolic ? recipe.name : undefined)
  return run(expansion, () => expansion.call(recipe.name, args, EMPTY, '&', [], new Set()))
}
