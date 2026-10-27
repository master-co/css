// Selector states: the template a class's selector suffix becomes, its structure check
// and its priority, as the engine's state.rs and render.rs and the lexer's selector.rs
// compute them. `&` stands for the class selector.
import { nativeContent, splitTopLevel } from './class-syntax'
import { DELIM, FUNCTION, IDENT, STRING, tokenize } from './css-syntax'
import { isAsciiCase, isAsciiWhitespace, trim } from './text'

/** Top-level selector list branches, each trimmed. */
export function splitSelectorList(source: string) {
  const tokens = tokenize(source)
  const branches: string[] = []
  let cursor = 0
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.close >= 0) {
      index = token.close
    } else if (token.kind === DELIM && token.value === ',') {
      branches.push(trim(source.slice(cursor, token.start)))
      cursor = token.end
    }
  }
  branches.push(trim(source.slice(cursor)))
  return branches
}

/** Replaces each nesting `&` outside attribute selectors; undefined when there is none. */
export function replaceNestingSelector(source: string, parent: string) {
  const replacement = splitSelectorList(parent).length > 1 ? `:is(${parent})` : parent
  let result = ''
  let cursor = 0
  let attributes = 0
  for (const token of tokenize(source)) {
    if (token.kind !== DELIM) continue
    if (token.value === '[') attributes++
    else if (token.value === ']') attributes && attributes--
    else if (token.value === '&' && !attributes) {
      result += source.slice(cursor, token.start) + replacement
      cursor = token.end
    }
  }
  return cursor ? result + source.slice(cursor) : undefined
}

/** Rejects definite token structure errors, without a browser capability allowlist. */
export function validSelectorStructure(source: string) {
  if (nativeContent(source) === undefined || splitSelectorList(source).includes('')) return false
  const tokens = tokenize(source)
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.kind !== DELIM) continue
    if (token.value === '[') {
      if (token.close < 0) return false
      index = token.close
    } else if (token.value === '.' || token.value === '#') {
      if (tokens[index + 1]?.kind !== IDENT) return false
    } else if ('<;{}@'.includes(token.value)) {
      return false
    }
  }
  return true
}

const SELECTOR_LIST_FUNCTIONS = ['is', 'where', 'not', 'has', 'host', 'host-context', 'slotted']
const NTH_FUNCTIONS = ['nth-child', 'nth-last-child']

/** Turns descendant `_` into spaces, except inside attributes, strings, escapes and non-selector arguments. */
function replaceSelectorUnderscores(source: string) {
  const tokens = tokenize(source)
  const protectedRanges = new Map<number, number>()
  const protect = (start: number, end: number) => protectedRanges.has(start) || protectedRanges.set(start, end)
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.kind === DELIM && token.value === '[' && token.close >= 0) {
      protect(token.start, tokens[token.close].end)
      index = token.close
      continue
    }
    if (token.kind === FUNCTION && token.close >= 0 && !SELECTOR_LIST_FUNCTIONS.some((name) => isAsciiCase(token.value, name))) {
      // Only selector-list arguments hold combinators; others keep their underscores.
      const closeStart = tokens[token.close].start
      let start = closeStart
      if (NTH_FUNCTIONS.some((name) => isAsciiCase(token.value, name))) {
        const of = tokens.slice(index + 1, token.close).find((item) => item.kind === IDENT && isAsciiCase(item.value, 'of'))
        if (of) start = of.start
      }
      if (start > token.end) protect(token.end, start)
      if (start === closeStart) {
        index = token.close
        continue
      }
    }
    if (token.kind === STRING) protect(token.start, token.end)
  }
  let output = ''
  let cursor = 0
  while (cursor < source.length) {
    const end = protectedRanges.get(cursor)
    if (end !== undefined) {
      output += source.slice(cursor, end)
      cursor = end
      continue
    }
    if (source.startsWith('/*', cursor)) {
      const close = source.indexOf('*/', cursor + 2)
      const commentEnd = close < 0 ? source.length : close + 2
      output += source.slice(cursor, commentEnd)
      cursor = commentEnd
      continue
    }
    const unit = source.charCodeAt(cursor)
    if (unit === 0x5c) {
      const start = cursor++
      let digits = 0
      while (digits < 6 && /[0-9a-fA-F]/.test(source[cursor] ?? '')) {
        digits++
        cursor++
      }
      if (!digits) cursor += cursor < source.length ? String.fromCodePoint(source.codePointAt(cursor)!).length : 0
      else if (isAsciiWhitespace(source.charCodeAt(cursor))) cursor++
      output += source.slice(start, cursor)
      continue
    }
    output += unit === 0x5f && isDescendantUnderscore(source, tokens, cursor) ? ' ' : source[cursor]
    cursor++
  }
  return output
}

function isDescendantUnderscore(source: string, tokens: ReturnType<typeof tokenize>, cursor: number) {
  if (source[cursor - 1] === '_' || source[cursor + 1] === '_') return false
  let before: string | undefined
  for (let index = tokens.length - 1; index >= 0; index--) {
    if (tokens[index].start < cursor) {
      before = source[Math.min(tokens[index].end, cursor) - 1]
      break
    }
  }
  if (before !== undefined && '(,.:#>+~|'.includes(before)) return false
  const next = tokens.find((token) => token.end > cursor + 1)
  if (!next) return false
  const after = source[Math.max(next.start, cursor + 1)]
  return after !== undefined && !')+,>~|'.includes(after)
}

/** The template of a selector suffix, `&` before each top-level branch. */
export function selectorTokenToTemplate(selectorToken: string) {
  return splitTopLevel(replaceSelectorUnderscores(selectorToken), ',').map((group) => `&${group}`).join(',')
}

const STATE_PRIORITIES: Record<string, number> = { hover: 1, focus: 2, 'focus-visible': 2, active: 3, disabled: 4 }
const statePriority = (name: string) => Object.hasOwn(STATE_PRIORITIES, name) ? STATE_PRIORITIES[name] : 0
const isIdentifierCharacter = (unit: number) => (unit >= 0x30 && unit <= 0x39) || (unit >= 0x41 && unit <= 0x5a) || (unit >= 0x61 && unit <= 0x7a) || unit === 0x2d || unit === 0x5f

/** Interaction states in a selector, so hover precedes focus, active and disabled. */
export function selectorPriority(selector: string | undefined) {
  if (selector === undefined) return 0
  let total = 0
  let quote = ''
  let index = 0
  while (index < selector.length) {
    const character = selector[index]
    if (quote) {
      index++
      if (character === '\\') {
        if (index < selector.length) index++
      } else if (character === quote) {
        quote = ''
      }
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      index++
      continue
    }
    if (character === '[') {
      const close = selector.indexOf(']', index + 1)
      if (close >= 0) {
        total += statePriority(trim(selector.slice(index + 1, close)))
        index = close + 1
        continue
      }
    }
    if (isIdentifierCharacter(selector.charCodeAt(index))) {
      const start = index++
      while (isIdentifierCharacter(selector.charCodeAt(index))) index++
      total += statePriority(selector.slice(start, index))
      continue
    }
    index++
  }
  return total
}
