import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { encodeJavaScriptLiteral, javascriptLiteralRange } from './javascript-literal'
import { resolveVueLiteral } from './vue-literal'

export type ResolvedClassListUnescape = string | false

export interface ResolvedClassListNode {
  type: 'class' | 'space'
  value: string
  raw: string
  range: [number, number]
  loc: any
}

export interface ResolvedClassNode {
  nodes: ResolvedClassListNode[]
  start: number
  end: number
  raw: string
  value: string
  unescape: ResolvedClassListUnescape
  classNodes: ResolvedClassListNode[]
  classValues: string[]
  analysisText?: string
  sourceRange?: (start: number, end: number) => [number, number]
  encodeReplacement?: (text: string) => string
  canFix?: boolean
}

export default function resolveClassNode(
  node: any,
  context: RuleContext<any, any[]>,
  lintSession: Pick<MasterCSSToolingSession, 'tokenizeClassList' | 'decodeHTMLAttribute'>
): ResolvedClassNode | undefined {
  const { sourceCode } = context
  let value: string = null
  let raw: string = null
  let start: number = null
  let end: number = null
  let unescape: ResolvedClassListUnescape = false
  const javascript = node.type === 'TemplateElement' || (node.type === 'Literal' && node.parent?.type !== 'JSXAttribute')
  const html = javascript ? resolveVueLiteral(node, sourceCode, lintSession) : undefined
  switch (node.type) {
    case 'Literal':
      value = node.value
      raw = html?.raw ?? node.raw
      start = node.range[0]
      end = node.range[1]
      break
    case 'VLiteral':
      value = node.value
      raw = sourceCode.getText(node)
      start = node.range[0]
      end = node.range[1]
      break
    case 'TextAttribute':
      value = node.value
      start = node.valueSpan.fullStart.offset
      end = node.valueSpan.end.offset
      raw = sourceCode.getText({
        ...node,
        range: [start, end],
      })
      break
    case 'SvelteLiteral':
      value = node.value
      raw = sourceCode.getText(node)
      start = node.range[0]
      end = node.range[1]
      break
    case 'TemplateElement':
      if (node.parent.expressions.length) {
        return
      }
      value = node.value.cooked
      start = node.range[0]
      end = node.range[1]
      raw = html?.raw ?? sourceCode.text.slice(start, end)
      unescape = '`'
      break
    default:
      return
  }

  if (typeof value !== 'string') {
    return
  }

  const rawMatchesSource = raw === sourceCode.text.slice(start, end)
  let delimiterOffset = 0

  if (/^(['"`])([\s\S]*)\1$/.test(raw)) {
    unescape = raw[0]
    const contentRange = html?.sourceRange(1, raw.length - 1)
    raw = raw.slice(1, -1)
    delimiterOffset = 1
    start = contentRange?.[0] ?? start + 1
    end = contentRange?.[1] ?? end - 1
  }

  const literalRange = javascript ? javascriptLiteralRange(raw, value) : undefined
  const sourceRange = literalRange && ((a: number, b: number): [number, number] => {
    const [first, last] = literalRange(a, b)
    if (!html) return [first, last]
    const [sourceStart, sourceEnd] = html.sourceRange(delimiterOffset + first, delimiterOffset + last)
    return [sourceStart - start, sourceEnd - start]
  })
  // A custom parser with a different literal contract must not receive guessed edits.
  if (javascript && !sourceRange) return
  const analysisText = javascript ? value : raw
  const nodes: ResolvedClassListNode[] = lintSession.tokenizeClassList(analysisText, javascript ? false : unescape).map((item) => {
    const [mappedStart, mappedEnd] = sourceRange?.(item.range.start, item.range.end) ?? [item.range.start, item.range.end]
    const startOffset = start + mappedStart
    const endOffset = start + mappedEnd
    return {
      type: 'class',
      value: item.token,
      raw: sourceCode.text.slice(startOffset, endOffset),
      range: [startOffset, endOffset],
      loc: {
        start: sourceCode.getLocFromIndex(startOffset),
        end: sourceCode.getLocFromIndex(endOffset),
      },
    }
  })

  const classNodes = nodes.filter((node) => node.type === 'class')

  return {
    nodes,
    start,
    end,
    raw: sourceCode.text.slice(start, end),
    value,
    unescape,
    classNodes,
    classValues: classNodes.map((node) => node.value),
    analysisText,
    sourceRange,
    encodeReplacement: javascript ? text => {
      const replacement = encodeJavaScriptLiteral(text, unescape || '"')
      return html?.encode(replacement) ?? replacement
    } : undefined,
    // Unknown custom parser transformations must not receive guessed fix ranges.
    canFix: !javascript || Boolean(html) || rawMatchesSource,
  }
}
