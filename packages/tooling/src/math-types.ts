import { clone, lexer, walk } from '@eslint/css-tree'
import type { CssNode, FunctionNode } from '@eslint/css-tree'

type Dimension = 'length' | 'angle' | 'time' | 'frequency' | 'resolution' | 'flex' | 'percentage'
type Known = { kind: 'known', powers: Partial<Record<Dimension, number>> }
type Result = Known | { kind: 'invalid' } | { kind: 'unknown' }
type Hint = Dimension | null | undefined
const unknown: Result = { kind: 'unknown' }
const invalid: Result = { kind: 'invalid' }
const number = (): Known => ({ kind: 'known', powers: {} })
const dimension = (name: Dimension): Known => ({ kind: 'known', powers: { [name]: 1 } })
const examples = { length: 'px', angle: 'deg', time: 's', frequency: 'hz', resolution: 'dppx', flex: 'fr' } as const
const units = new Map(Object.entries((lexer as typeof lexer & { units: Record<string, string[]> }).units)
  .filter(([type]) => type in examples)
  .flatMap(([type, names]) => names.map(unit => [unit.toLowerCase(), type as Dimension] as const)))

export const mathFunctions = new Set(['calc', 'min', 'max', 'clamp', 'mod', 'rem', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'sqrt', 'hypot', 'exp', 'abs', 'sign', 'log', 'round'])

function same(a: Known, b: Known) {
  return Object.keys({ ...a.powers, ...b.powers }).every(key => a.powers[key as Dimension] === b.powers[key as Dimension])
}

function combine(a: Result, b: Result, operator: string, hint: Hint): Result {
  if (a.kind === 'invalid' || b.kind === 'invalid') return invalid
  if (a.kind === 'unknown' || b.kind === 'unknown') return unknown
  if (operator === '+' || operator === '-') {
    if (same(a, b)) return a
    if (hint === undefined && (a.powers.percentage || b.powers.percentage)) return unknown
    return invalid
  }
  const powers = { ...a.powers }
  for (const [dimension, exponent] of Object.entries(b.powers)) {
    const key = dimension as Dimension
    powers[key] = (powers[key] ?? 0) + exponent! * (operator === '/' ? -1 : 1)
    if (powers[key] === 0) delete powers[key]
  }
  return { kind: 'known', powers }
}

function expression(nodes: CssNode[], hint: Hint): Result {
  let offset = 0
  const atom = (): Result => {
    const node = nodes[offset++]
    if (!node) return invalid
    switch (node.type) {
      case 'Number': return number()
      case 'Dimension': return units.has(node.unit.toLowerCase()) ? dimension(units.get(node.unit.toLowerCase())!) : unknown
      case 'Percentage': return dimension(hint ?? 'percentage')
      case 'Identifier': return ['e', 'pi', 'infinity', '-infinity', 'nan'].includes(node.name.toLowerCase()) ? number() : unknown
      case 'Parentheses': return expression([...node.children], hint)
      case 'Function': return inferFunction(node, hint)
      default: return unknown
    }
  }
  const operator = () => {
    const node = nodes[offset]
    return node?.type === 'Operator' ? node.value.trim() : ''
  }
  const product = (): Result => {
    let result = atom()
    while (['*', '/'].includes(operator())) {
      const op = operator()
      offset++
      result = combine(result, atom(), op, hint)
    }
    return result
  }
  let result = product()
  let knownSum = result.kind === 'known' ? result : undefined
  while (['+', '-'].includes(operator())) {
    const op = operator()
    offset++
    const right = product()
    if (right.kind === 'known') {
      const sum = knownSum ? combine(knownSum, right, op, hint) : right
      if (sum.kind === 'invalid') return invalid
      knownSum = sum.kind === 'known' ? sum : undefined
    }
    result = combine(result, right, op, hint)
  }
  return offset === nodes.length ? result : unknown
}

function primitive(value: Known): Dimension | 'number' | undefined {
  const entries = Object.entries(value.powers)
  return !entries.length ? 'number' : entries.length === 1 && entries[0][1] === 1 ? entries[0][0] as Dimension : undefined
}

function inferFunction(node: FunctionNode, hint: Hint): Result {
  const name = node.name.toLowerCase()
  if (!mathFunctions.has(name)) return unknown
  const args: CssNode[][] = [[]]
  for (const child of node.children) {
    if (child.type === 'Operator' && child.value.trim() === ',') args.push([])
    else args.at(-1)!.push(child)
  }
  if (name === 'round' && args[0]?.length === 1 && args[0][0].type === 'Identifier'
    && ['nearest', 'up', 'down', 'to-zero'].includes(args[0][0].name)) args.shift()
  const values = args.map((nodes, index) => name === 'clamp' && index !== 1 && nodes.length === 1
    && nodes[0].type === 'Identifier' && nodes[0].name === 'none' ? undefined : expression(nodes, hint))
    .filter((value): value is Result => value !== undefined)
  if (values.some(value => value.kind === 'invalid')) return invalid
  // Check all known arguments, even when an independent argument is unknown.
  const known = values.filter((value): value is Known => value.kind === 'known')
  const uncertain = known.length !== values.length
  const accepts = (types: (Dimension | 'number')[]) => known.every(value => {
    const type = primitive(value)
    return type !== undefined && types.includes(type)
  })
  let result: Result
  switch (name) {
    case 'calc': return values[0] ?? invalid
    case 'sin': case 'cos': case 'tan':
      result = accepts(['number', 'angle']) ? number() : invalid
      break
    case 'asin': case 'acos': case 'atan':
      result = accepts(['number']) ? dimension('angle') : invalid
      break
    case 'pow': case 'sqrt': case 'exp': case 'log':
      result = accepts(['number']) ? number() : invalid
      break
    case 'sign': result = known.every(value => primitive(value) !== undefined) ? number() : invalid; break
    case 'abs': result = values[0] ?? invalid; break
    default: {
      // min/max/clamp/hypot/mod/rem/round/atan2 require compatible argument types.
      result = known.reduce<Result>((result, value) => combine(result, value, '+', hint), known[0] ?? unknown)
      if (name === 'round' && values.length === 1 && !accepts(['number'])) result = invalid
      if (name === 'atan2' && result.kind === 'known') result = dimension('angle')
    }
  }
  return result.kind === 'invalid' ? invalid : uncertain ? unknown : result
}

function representative(type: Dimension | 'number'): CssNode {
  if (type === 'number') return { type: 'Number', value: '1' }
  if (type === 'percentage') return { type: 'Percentage', value: '1' }
  return { type: 'Dimension', value: '1', unit: examples[type] }
}

/** Substitute only proven result types into a disposable grammar AST. Never
 * evaluate values, ranges, variable substitutions, or mutate emitted CSS.
 * A nested calc may have a compound intermediate type which its parent cancels.
 */
export function validateMathTypes(ast: CssNode, matches: (value: CssNode) => boolean): { ast: CssNode, status?: 'valid' | 'invalid' | 'unknown' } {
  const normalized = clone(ast)
  let status: 'valid' | 'invalid' | 'unknown' = 'valid'
  let found = false
  walk(normalized, (node, item, list) => {
    if (node.type !== 'Function' || !mathFunctions.has(node.name.toLowerCase()) || !item || !list) return
    found = true
    const original = item.data
    const accepts = (type: Dimension | 'number') => {
      item.data = representative(type)
      const result = matches(normalized)
      item.data = original
      return result
    }
    let hint: Hint = null
    let hasPercentage = false
    walk(node, child => { if (child.type === 'Percentage') hasPercentage = true })
    if (hasPercentage) {
      // Infer the context from the complete property grammar at this location.
      // A failed match containing substitutions cannot prove a percentage basis.
      const bases = Object.keys(examples).filter(type => accepts(type as Dimension)) as Dimension[]
      hint = accepts('percentage') && bases.length === 1 ? bases[0] : bases.length ? null : undefined
    }
    const inferred = inferFunction(node, hint)
    if (inferred.kind === 'invalid') status = 'invalid'
    else if (inferred.kind === 'unknown') { if (status !== 'invalid') status = 'unknown' }
    else {
      const type = primitive(inferred)
      if (!type) {
        if (hasPercentage && hint === undefined) { if (status !== 'invalid') status = 'unknown' }
        else status = 'invalid'
      } else item.data = representative(type)
    }
    return walk.skip
  })
  return { ast: normalized, status: found ? status : undefined }
}
