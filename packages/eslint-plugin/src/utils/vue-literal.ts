import type { MasterCSSToolingSession } from '@master/css-tooling'
import type { MasterCSSDecodedHTMLAttribute } from '@master/css-tooling/source'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

const attributes = new WeakMap<object, { text: string, mapping: MasterCSSDecodedHTMLAttribute }>()

function boundary(mapping: MasterCSSDecodedHTMLAttribute, offset: number, from: 'range' | 'sourceRange', end: boolean) {
  if (offset === 0) return 0
  const to = from === 'range' ? 'sourceRange' : 'range'
  const last = mapping.spans.at(-1)
  if (last && offset === last[from].end) return last[to].end
  let low = 0
  let high = mapping.spans.length
  while (low < high) {
    const middle = (low + high) >>> 1
    const limit = mapping.spans[middle][from].end
    if (limit < offset || (!end && limit === offset)) low = middle + 1
    else high = middle
  }
  const span = mapping.spans[low]
  if (!span || offset < span[from].start) return
  return span?.[to][end ? 'end' : 'start']
}

// Vue parses JavaScript after HTML character-reference decoding, but reports AST
// ranges in the original file. Map through the enclosing attribute as a whole so
// reference lookahead and encoded JavaScript delimiters retain their real spans.
export function resolveVueLiteral(node: any, sourceCode: RuleContext<any, any[]>['sourceCode'], tooling: Pick<MasterCSSToolingSession, 'decodeHTMLAttribute'>) {
  let container = node.parent
  while (container && container.type !== 'VExpressionContainer') container = container.parent
  if (container?.parent?.type !== 'VAttribute') return
  const [attributeStart, attributeEnd] = container.range
  const attribute = sourceCode.text.slice(attributeStart, attributeEnd)
  const quote = attribute[0] === '"' || attribute[0] === "'" ? attribute[0] : ''
  const start = attributeStart + (quote ? 1 : 0)
  const end = attributeEnd - (quote ? 1 : 0)
  const text = sourceCode.text.slice(start, end)
  let cached = attributes.get(container)
  if (!cached || cached.text !== text) {
    cached = { text, mapping: tooling.decodeHTMLAttribute(text) }
    attributes.set(container, cached)
  }
  const { mapping } = cached
  const from = boundary(mapping, node.range[0] - start, 'sourceRange', false)
  const to = boundary(mapping, node.range[1] - start, 'sourceRange', true)
  if (from === undefined || to === undefined) return
  const raw = mapping.value.slice(from, to)
  const expected = node.type === 'TemplateElement' ? '`' + node.value.raw + '`' : node.raw
  if (raw !== expected) return
  return {
    raw,
    sourceRange(a: number, b: number): [number, number] {
      const first = boundary(mapping, from + a, 'range', false)
      const last = boundary(mapping, from + b, 'range', true)
      if (first === undefined || last === undefined) throw new RangeError('Vue literal range is outside its HTML attribute.')
      return [start + first, start + (a === b ? first : last)]
    },
    encode(text: string) {
      return text.replace(quote ? /[&'"]/g : /[&'"<>=`\t\n\f\r ]/g, character => {
        if (character === '&') return '&amp;'
        if (!quote || character === quote) return `&#${character.charCodeAt(0)};`
        return character
      })
    }
  }
}
