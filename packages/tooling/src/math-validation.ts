import { clone, generate, lexer, List, walk } from 'css-tree'
import type { CssNode, FunctionNode } from 'css-tree'

const functions = new Set(['calc', 'min', 'max', 'clamp', 'mod', 'rem', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'sqrt', 'hypot', 'exp', 'abs', 'sign', 'log', 'round'])

/** Check operator structure and arity, without inferring the result's dimension.
 * CSS Values 4 allows dimensional division. Normalize operands for grammar-only
 * checks rather than applying css-tree's older numeric-divisor restriction.
 */
export function mathFunctionStatus(node: FunctionNode): 'valid' | 'invalid' | 'unknown' | undefined {
  const name = node.name.toLowerCase()
  if (!functions.has(name)) return
  const normalized = clone(node) as FunctionNode
  let uncertain = false
  walk(normalized, (child, item, list) => {
      if (child === normalized) return
      if (child.type === 'Function') {
        if (!functions.has(child.name.toLowerCase())) uncertain = true
        if (item && list) list.replace(item, list.createItem({ type: 'Number', value: '1' }))
        return walk.skip
      }
      if ((child.type === 'Dimension' || child.type === 'Percentage') && item && list) {
        list.replace(item, list.createItem({ type: 'Number', value: '1' }))
      }
  })
  // A substitution may contain commas or operators; do not validate its assumed
  // expansion. Still check independent arguments and a definitely missing RHS.
  if (uncertain) {
    const arguments_: CssNode[][] = [[]]
    for (const child of node.children) {
      if (child.type === 'Operator' && child.value.trim() === ',') arguments_.push([])
      else arguments_.at(-1)!.push(child)
    }
    for (const argument of arguments_) {
      const last = argument.at(-1)
      if (last?.type === 'Operator' && ['+', '-', '*', '/'].includes(last.value.trim())) return 'invalid'
      let dependent = false
      const children = new List<CssNode>().fromArray(argument)
      walk({ type: 'Value', children }, child => { if (child.type === 'Function') dependent = true })
      if (!dependent && mathFunctionStatus({ type: 'Function', name: 'calc', children }) === 'invalid') return 'invalid'
    }
    return 'unknown'
  }
  if (name === 'log' || name === 'round') {
    // css-tree's bundled draft still requires commas for omitted optional
    // arguments. Validate the current arity and reuse its calc-sum grammar.
    const parts: CssNode[][] = [[]]
    for (const child of normalized.children) {
      if (child.type === 'Operator' && child.value.trim() === ',') parts.push([])
      else parts.at(-1)!.push(child)
    }
    if (name === 'round' && parts[0]?.length === 1 && parts[0][0].type === 'Identifier'
      && ['nearest', 'up', 'down', 'to-zero'].includes(parts[0][0].name)) parts.shift()
    if (parts.length < 1 || parts.length > 2) return 'invalid'
    return parts.some(children => lexer.matchType('calc-sum', generate({ type: 'Value', children: new List<CssNode>().fromArray(children) })).error) ? 'invalid' : 'valid'
  }
  return lexer.matchType(`${name}()`, generate(normalized)).error ? 'invalid' : 'valid'
}
