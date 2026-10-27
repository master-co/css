// Conservative animation-name analysis over CSS tokens, as the engine's animation.rs
// does it: which managed keyframes declarations may reference, or that any of them may.
import { AT_KEYWORD, collectStatements, DELIM, DIMENSION, FUNCTION, IDENT, NUMBER, PERCENTAGE, STRING, tokenize } from './css-syntax'
import type { Program } from './program-model'
import { asciiLowercase, isAsciiCase } from './text'

export interface AnimationReferences {
  names: string[]
  retainAll: boolean
}

/** Authored declarations, without those inside keyframes, which CSS ignores. */
export function stylesheetDeclarations(source: string): [property: string, value: string][] {
  const tokens = tokenize(source)
  const statements = collectStatements(tokens)
  const declarations: [string, string][] = []
  for (const statement of statements) {
    if (!statement.declaration || statement.end - statement.start < 3) continue
    let inKeyframes = false
    for (let parent = statement.parent; parent >= 0; parent = statements[parent].parent) {
      const head = tokens[statements[parent].start]
      if (head.kind === AT_KEYWORD && (isAsciiCase(head.value, 'keyframes') || isAsciiCase(head.value, '-webkit-keyframes'))) {
        inKeyframes = true
        break
      }
    }
    const property = tokens[statement.start]
    if (inKeyframes || property.kind !== IDENT) continue
    declarations.push([property.value, source.slice(tokens[statement.start + 2].start, tokens[statement.end - 1].end)])
  }
  return declarations
}

export function analyzeAnimations(declarations: [string, string][], program: Program): AnimationReferences {
  const result: AnimationReferences = { names: [], retainAll: false }
  if (!program.keyframes.length) return result
  // Values these declarations assign, resolved after the delivered animation variables.
  const variables = new Map<string, string[]>()
  for (const [name, value] of declarations) {
    if (!name.startsWith('--')) continue
    const values = variables.get(name.slice(2))
    if (values) values.push(value)
    else variables.set(name.slice(2), [value])
  }
  for (const [name, value] of declarations) {
    let property = asciiLowercase(name)
    if (property.startsWith('-webkit-')) property = property.slice(8)
    if (property !== 'animation' && property !== 'animation-name') continue
    const budget = { remaining: 256 }
    const values = resolve(value, program, variables, new Set(), budget)
    if (values) for (const option of values) parseNames(option, property === 'animation-name', result)
    else result.retainAll = true
  }
  result.names = result.names.filter((name) => program.keyframes.some((definition) => definition.name === name))
  return result
}

/** Every value a `var()` chain may substitute, or undefined when any is unknown. */
function resolve(value: string, program: Program, variables: Map<string, string[]>, stack: Set<string>, budget: { remaining: number }): string[] | undefined {
  if (!budget.remaining || stack.size > 64) return
  budget.remaining--
  const tokens = tokenize(value)
  const index = tokens.findIndex((token) => token.kind === FUNCTION && isAsciiCase(token.value, 'var'))
  if (index < 0) return [value]
  const token = tokens[index]
  if (token.close < 0) return
  const nameToken = tokens[index + 1]
  if (nameToken?.kind !== IDENT || !nameToken.value.startsWith('--')) return
  const name = nameToken.value.slice(2)
  if (stack.has(name)) return
  stack.add(name)
  // Native values come only from delivered animation variables.
  const options = (program.variables.get(name)?.values ?? []).map((entry) => entry.value)
  options.push(...program.animationVariables.get(name) ?? [], ...variables.get(name) ?? [])
  // A fallback does not prove an externally supplied property absent.
  if (!options.length) {
    stack.delete(name)
    return
  }
  const comma = tokens[index + 2]
  if (comma?.kind === DELIM && comma.value === ',') options.push(value.slice(comma.end, tokens[token.close].start))
  const output: string[] = []
  for (const option of options) {
    // `!important` belongs to the custom property declaration, not the substituted value.
    const optionTokens = tokenize(option)
    const bang = optionTokens[optionTokens.length - 2]
    const last = optionTokens[optionTokens.length - 1]
    const substituted = bang?.kind === DELIM && bang.value === '!' && last.kind === IDENT && isAsciiCase(last.value, 'important')
      ? option.slice(0, bang.start)
      : option
    const replacements = resolve(substituted, program, variables, stack, budget)
    if (!replacements) return
    for (const replacement of replacements) {
      const expanded = value.slice(0, token.start) + replacement + value.slice(tokens[token.close].end)
      // Sibling uses of a resolved variable are independent, not a cycle.
      stack.delete(name)
      const resolved = resolve(expanded, program, variables, stack, budget)
      if (!resolved) return
      output.push(...resolved)
      stack.add(name)
    }
  }
  stack.delete(name)
  return output
}

const KEYWORD_CATEGORIES: Record<string, string> = {
  ease: 'timing', linear: 'timing', 'ease-in': 'timing', 'ease-out': 'timing', 'ease-in-out': 'timing', 'step-start': 'timing', 'step-end': 'timing',
  infinite: 'iteration',
  normal: 'direction', reverse: 'direction', alternate: 'direction', 'alternate-reverse': 'direction',
  none: 'fill', forwards: 'fill', backwards: 'fill', both: 'fill',
  running: 'play', paused: 'play',
  auto: 'duration'
}
const MATH = new Set(['calc', 'min', 'max', 'clamp', 'round', 'mod', 'rem', 'abs', 'sign'])

function parseNames(value: string, namesOnly: boolean, result: AnimationReferences) {
  const tokens = tokenize(value)
  const used = new Set<string>()
  for (let cursor = 0; cursor < tokens.length; cursor++) {
    const token = tokens[cursor]
    let name: string | undefined
    if (token.kind === DELIM && token.value === ',') {
      used.clear()
    } else if (token.kind === DELIM && token.value === '!') {
      break
    } else if (token.kind === STRING) {
      name = token.value
    } else if (token.kind === IDENT) {
      const keyword = asciiLowercase(token.value)
      if (keyword === 'initial' || keyword === 'inherit' || keyword === 'unset' || keyword === 'revert' || keyword === 'revert-layer') {
        // Inherited names cannot be known without the cascade.
        if (keyword === 'inherit' || keyword.startsWith('revert')) result.retainAll = true
      } else if (namesOnly) {
        if (keyword !== 'none') name = token.value
      } else {
        const category = Object.hasOwn(KEYWORD_CATEGORIES, keyword) ? KEYWORD_CATEGORIES[keyword] : undefined
        const fresh = category !== undefined && !used.has(category)
        if (category !== undefined) used.add(category)
        if (!fresh && keyword !== 'none') name = token.value
      }
    } else if (token.kind === FUNCTION) {
      const fn = asciiLowercase(token.value)
      if (fn === 'steps' || fn === 'cubic-bezier' || fn === 'linear') used.add('timing')
      else if (!MATH.has(fn)) result.retainAll = true
      if (token.close >= 0) cursor = token.close
      else result.retainAll = true
    } else if (token.kind === NUMBER) {
      used.add('iteration')
    } else if (token.kind !== DIMENSION && token.kind !== PERCENTAGE) {
      result.retainAll = true
    }
    if (name !== undefined && !result.names.includes(name)) result.names.push(name)
  }
}
