import { generate, ident, parse, tokenize, tokenTypes } from 'css-tree'

export interface SelectorNode {
  type?: string
  name?: string
  value?: string
  selector?: SelectorNode
  children?: { forEach(callback: (node: SelectorNode) => void): void }
}

export interface SelectorSpecificity {
  id: number
  class: number
  type: number
}

export const emptySpecificity = (): SelectorSpecificity => ({ id: 0, class: 0, type: 0 })

export function maxSpecificity(a: SelectorSpecificity, b: SelectorSpecificity) {
  const order = a.id - b.id || a.class - b.class || a.type - b.type
  return order >= 0 ? a : b
}

export function toSpecificityScore(value: SelectorSpecificity) {
  return value.id * 100 + value.class * 10 + value.type
}

/** Selector-list maxima use tuples; the legacy decimal projection is display only. */
export function selectorSpecificity(selector: SelectorNode, parent?: SelectorSpecificity): SelectorSpecificity {
  const result = count(selector, parent || emptySpecificity())
  let first: SelectorNode | undefined
  selector.children?.forEach(child => { first ??= child })
  if (parent && (first?.type === 'Combinator' || !containsNesting(selector))) add(result, parent)
  return result
}

function add(target: SelectorSpecificity, value: SelectorSpecificity) {
  target.id += value.id
  target.class += value.class
  target.type += value.type
}

function count(node: SelectorNode, parent: SelectorSpecificity): SelectorSpecificity {
  const result = emptySpecificity()
  switch (node.type) {
    case 'IdSelector': result.id = 1; return result
    case 'ClassSelector':
    case 'AttributeSelector': result.class = 1; return result
    case 'TypeSelector':
      result.type = node.name === '*' || node.name?.endsWith('|*') ? 0 : 1
      return result
    case 'NestingSelector': return { ...parent }
    case 'PseudoClassSelector':
    case 'PseudoElementSelector': return countPseudo(node, parent)
    case 'Selector':
    case 'SelectorList':
      node.children?.forEach(child => add(result, count(child, parent)))
      return result
    case 'Combinator': return result
    default: throw new Error(`Unsupported specificity node: ${node.type}`)
  }
}

function countPseudo(node: SelectorNode, parent: SelectorSpecificity) {
  const result = emptySpecificity()
  const name = ident.decode(node.name || '').toLowerCase()
  if (node.type === 'PseudoClassSelector' && name === 'where') return result
  const element = node.type === 'PseudoElementSelector'
    || ['before', 'after', 'first-line', 'first-letter'].includes(name)
  if (element) result.type = 1
  else if (!['is', 'not', 'has'].includes(name)) result.class = 1
  const selectorArgument = element ? name === 'slotted'
    : ['is', 'not', 'has', 'nth-child', 'nth-last-child', 'host', 'host-context'].includes(name)
  if (!selectorArgument || !node.children) return result

  // CSS Tree leaves arguments raw when a known pseudo name contains escapes.
  let normalized = node
  if (node.name !== name) {
    const prefix = node.type === 'PseudoElementSelector' ? '::' : ':'
    const source = generate(node as never)
    const parsed = parse(prefix + name + source.slice(source.indexOf('(')), { context: 'selector' }) as SelectorNode
    parsed.children?.forEach(child => { normalized = child })
  }
  let argument = emptySpecificity()
  const visit = (child: SelectorNode) => {
    if (child.type === 'Selector') {
      argument = maxSpecificity(argument, count(child, parent))
    } else if (child.type === 'SelectorList') {
      child.children?.forEach(visit)
    } else if (child.type === 'Nth') {
      if (child.selector) visit(child.selector)
    } else {
      throw new Error(`Unsupported specificity argument in :${name}: ${child.type}`)
    }
  }
  normalized.children?.forEach(visit)
  add(result, argument)
  return result
}

function containsNesting(node: SelectorNode): boolean {
  if (node.type === 'NestingSelector') return true
  let found = false
  if (node.type === 'Raw' && node.value) {
    const value = node.value
    tokenize(value, (type, start, end) => {
      if (type === tokenTypes.Delim && value.slice(start, end) === '&') found = true
    })
  }
  node.children?.forEach(child => { if (containsNesting(child)) found = true })
  if (node.selector && containsNesting(node.selector)) found = true
  return found
}
