import selectorParser, { type Node, type Pseudo, type Selector } from 'postcss-selector-parser'

export type SelectorNode = Node

export interface SelectorSpecificity {
  id: number
  class: number
  type: number
}

// Pseudo-classes and pseudo-elements whose arguments are selectors. Names match
// case-insensitively but undecoded, so an escaped name keeps opaque arguments.
const selectorListPseudos = new Set(['has', 'matches', 'is', '-moz-any', '-webkit-any', 'where', 'not', 'slotted', 'host', 'host-context'])

const escape = String.raw`\\(?:[0-9a-fA-F]{1,6}[ \t\n\r\f]?|[^\n\r\f0-9a-fA-F])`
const nameCharacters = String.raw`(?:[\w\-\u0080-\u{10FFFF}]|${escape})*`
const identifier = new RegExp(String.raw`^(?:--|-?(?:[a-zA-Z_\u0080-\u{10FFFF}]|${escape}))${nameCharacters}$`, 'u')
// ID selectors are hash tokens, whose names may start with any name character.
const hashName = new RegExp(String.raw`^${nameCharacters}$`, 'u')

export const emptySpecificity = (): SelectorSpecificity => ({ id: 0, class: 0, type: 0 })

export function maxSpecificity(a: SelectorSpecificity, b: SelectorSpecificity) {
  const order = a.id - b.id || a.class - b.class || a.type - b.type
  return order >= 0 ? a : b
}

export function toSpecificityScore(value: SelectorSpecificity) {
  return value.id * 100 + value.class * 10 + value.type
}

/** Parses a selector list, rejecting syntax that would otherwise count as zero or as a bogus type selector. */
export function parseSelectorList(selector: string): Selector[] {
  let selectors: Selector[]
  try {
    selectors = selectorParser().astSync(selector).nodes
  } catch {
    throw new Error('Cannot calculate specificity for an unparsed selector prelude.')
  }
  for (const node of selectors) assertSelectorSyntax(node)
  return selectors
}

/** Visits the selector components that count toward complexity, entering only selector-list arguments. */
export function walkSelectorComponents(node: SelectorNode, callback: (node: SelectorNode) => void) {
  callback(node)
  if (node.type === 'pseudo' && !hasSelectorListArgument(node)) return
  if ('nodes' in node) node.nodes.forEach((child: SelectorNode) => walkSelectorComponents(child, callback))
}

/** Selector-list maxima use tuples; the legacy decimal projection is display only. */
export function selectorSpecificity(selector: Selector, parent?: SelectorSpecificity): SelectorSpecificity {
  const result = count(selector, parent || emptySpecificity())
  let nested = false
  selector.walkNesting(() => { nested = true })
  if (parent && (selector.first?.type === 'combinator' || !nested)) add(result, parent)
  return result
}

function hasSelectorListArgument(node: Pseudo) {
  return selectorListPseudos.has(node.value.replace(/^::?/, '').toLowerCase())
}

function assertSelectorSyntax(node: SelectorNode) {
  walkSelectorComponents(node, (child) => {
    switch (child.type) {
      case 'tag':
      case 'class':
      case 'id': {
        const value = (child as { raws?: { value?: string } }).raws?.value ?? child.value
        if (value && (child.type === 'id' ? hashName : identifier).test(value)) return
        break
      }
      case 'selector':
      case 'universal':
      case 'attribute':
      case 'pseudo':
      case 'nesting':
      case 'combinator':
      case 'comment':
        return
    }
    throw new Error('Cannot calculate specificity for an unparsed selector prelude.')
  })
}

function add(target: SelectorSpecificity, value: SelectorSpecificity) {
  target.id += value.id
  target.class += value.class
  target.type += value.type
}

function count(node: SelectorNode, parent: SelectorSpecificity): SelectorSpecificity {
  const result = emptySpecificity()
  switch (node.type) {
    case 'id': result.id = 1; return result
    case 'class':
    case 'attribute': result.class = 1; return result
    case 'tag': result.type = 1; return result
    case 'universal': return result
    case 'nesting': return { ...parent }
    case 'pseudo': return countPseudo(node, parent)
    case 'selector':
      node.nodes.forEach(child => add(result, count(child, parent)))
      return result
    case 'combinator':
    case 'comment': return result
    default: throw new Error(`Unsupported specificity node: ${node.type}`)
  }
}

function countPseudo(node: Pseudo, parent: SelectorSpecificity) {
  const result = emptySpecificity()
  const pseudoElement = node.value.startsWith('::')
  const name = decodeIdentifier(node.value.slice(pseudoElement ? 2 : 1)).toLowerCase()
  if (!pseudoElement && name === 'where') return result
  const element = pseudoElement
    || ['before', 'after', 'first-line', 'first-letter'].includes(name)
  if (element) result.type = 1
  else if (!['is', 'not', 'has'].includes(name)) result.class = 1
  const selectorArgument = element ? name === 'slotted'
    : ['is', 'not', 'has', 'nth-child', 'nth-last-child', 'host', 'host-context'].includes(name)
  if (!selectorArgument || !node.nodes.length) return result

  let selectors = node.nodes
  if (name === 'nth-child' || name === 'nth-last-child') {
    // `An+B of S` arguments: only the selector list after `of` has specificity.
    const of = /(?:^|\s)of\s([^]*)$/i.exec(node.nodes.map(String).join(','))
    selectors = of ? parseSelectorList(of[1]) : []
  }
  let argument = emptySpecificity()
  for (const selector of selectors) argument = maxSpecificity(argument, count(selector, parent))
  add(result, argument)
  return result
}

function decodeIdentifier(value: string) {
  return value.replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n\r\f]?|(\r\n|[^]))?/g, (_, hex?: string, char?: string) => {
    if (hex) {
      const code = parseInt(hex, 16)
      return code === 0 || code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF) ? '�' : String.fromCodePoint(code)
    }
    return char && !/^[\r\n\f]/.test(char) ? char : ''
  })
}
