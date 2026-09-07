import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { MasterCSSToolingSession } from '@master/css-tooling'

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
}

export default function resolveClassNode(
  node: any,
  context: RuleContext<any, any[]>,
  lintSession: Pick<MasterCSSToolingSession, 'tokenizeClassList'>
): ResolvedClassNode | undefined {
  const { sourceCode } = context
  let value: string = null
  let raw: string = null
  let start: number = null
  let end: number = null
  let unescape: ResolvedClassListUnescape = false
  switch (node.type) {
    case 'Literal':
      value = node.value
      raw = node.raw
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
      raw = node.value.raw
      start = node.range[0] + 1
      end = node.range[1] - 1
      unescape = '`'
      break
    default:
      return
  }

  if (typeof value !== 'string') {
    return
  }

  if (/^(['"`])([\s\S]*)\1$/.test(raw)) {
    unescape = raw[0]
    raw = raw.slice(1, -1)
    start = start + 1
    end = end - 1
  }

  const nodes: ResolvedClassListNode[] = lintSession.tokenizeClassList(raw, unescape).map((item) => {
    const startOffset = start + item.range.start
    const endOffset = start + item.range.end
    return {
      type: 'class',
      value: item.token,
      raw: item.raw,
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
    raw,
    value,
    unescape,
    classNodes,
    classValues: classNodes.map((node) => node.value),
  }
}
