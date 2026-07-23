import { inspectCSS } from '@master/css-compiler'
import type { LintSession } from '@master/css-tooling/lint/node'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { ResolvedClassListNode, ResolvedClassNode } from './resolve-class-node'

interface SourceRange { start: number, end: number }

interface ComposeDirectiveSourceRange extends SourceRange {
  lineComments?: boolean
}

export interface ResolvedComposeDirectiveClassNode extends ResolvedClassNode {
  directiveStart: number
  directiveEnd: number
}

const CSS_LIKE_FILE_RE = /\.(?:css|scss|sass|less|pcss|postcss)$/i
const CSS_LINE_COMMENT_FILE_RE = /\.(?:scss|sass|less)$/i
const STYLE_CONTAINER_FILE_RE = /\.(?:vue|svelte|astro|html|htm|mdx)$/i
const STYLE_LINE_COMMENT_RE = /\blang\s*=\s*(?:"(?:scss|sass|less)"|'(?:scss|sass|less)'|(?:scss|sass|less)\b)/i

function getFilename(context: RuleContext<any, any[]>) {
  return (context.filename || context.getFilename?.() || '').split(/[?#]/)[0]
}

function isWhitespace(char: string | undefined) {
  return char !== undefined && /\s/.test(char)
}

function findHTMLTagEnd(source: string, start: number) {
  let quote = ''
  for (let index = start; index < source.length; index++) {
    const char = source[index]
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '>') return index + 1
  }
  return -1
}

function collectStyleContentRanges(source: string): ComposeDirectiveSourceRange[] {
  const ranges: ComposeDirectiveSourceRange[] = []
  const openStylePattern = /<style\b/gi
  let match: RegExpExecArray | null
  while ((match = openStylePattern.exec(source))) {
    const openStart = match.index
    const openEnd = findHTMLTagEnd(source, openStart)
    if (openEnd === -1) break
    const openTag = source.slice(openStart, openEnd)
    const closeMatch = /<\/style\s*>/i.exec(source.slice(openEnd))
    const closeStart = closeMatch ? openEnd + closeMatch.index : source.length
    ranges.push({
      start: openEnd,
      end: closeStart,
      lineComments: STYLE_LINE_COMMENT_RE.test(openTag)
    })
    openStylePattern.lastIndex = closeMatch
      ? closeStart + closeMatch[0].length
      : source.length
  }
  return ranges
}

function collectLineCommentRanges(source: string, start: number, end: number): SourceRange[] {
  const ranges: SourceRange[] = []
  let quote = ''
  let blockComment = false
  for (let index = start; index < end; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index++
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', index + 2)
      const commentEnd = lineEnd === -1 ? end : Math.min(lineEnd, end)
      ranges.push({ start: index, end: commentEnd })
      index = commentEnd
    }
  }
  return ranges
}

function overlapsRange(start: number, end: number, ranges: SourceRange[]) {
  return ranges.some((range) => start < range.end && end > range.start)
}

function collectCandidateRanges(source: string, filename: string): ComposeDirectiveSourceRange[] {
  if (CSS_LIKE_FILE_RE.test(filename)) {
    return [{
      start: 0,
      end: source.length,
      lineComments: CSS_LINE_COMMENT_FILE_RE.test(filename)
    }]
  }
  if (STYLE_CONTAINER_FILE_RE.test(filename)) {
    return collectStyleContentRanges(source)
  }
  return []
}

function resolveComposeDirectiveClassNode(
  source: string,
  sourceCode: RuleContext<any, any[]>['sourceCode'],
  start: number,
  end: number,
  lintSession: Pick<LintSession, 'tokenizeClassList'>
): ResolvedClassNode | undefined {
  while (start < end && isWhitespace(source[start])) start++
  while (end > start && isWhitespace(source[end - 1])) end--
  if (start >= end) return

  const raw = source.slice(start, end)
  const nodes: ResolvedClassListNode[] = lintSession.tokenizeClassList(raw).map((item) => {
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
  if (!classNodes.length) return
  return {
    nodes,
    start,
    end,
    raw,
    value: raw,
    unescape: false,
    classNodes,
    classValues: classNodes.map((node) => node.value),
  }
}

export default function resolveComposeDirectiveClassNodes(
  context: RuleContext<any, any[]>,
  lintSession: Pick<LintSession, 'tokenizeClassList'>
): ResolvedComposeDirectiveClassNode[] {
  const filename = getFilename(context)
  const source = context.sourceCode.getText()
  const nodes: ResolvedComposeDirectiveClassNode[] = []
  for (const range of collectCandidateRanges(source, filename)) {
    const lineCommentRanges = range.lineComments
      ? collectLineCommentRanges(source, range.start, range.end)
      : []
    const rangeSource = source.slice(range.start, range.end)
    for (const directive of inspectCSS(rangeSource).directives) {
      if (directive.name !== 'compose') continue
      if (directive.hasBlock || directive.quotedStrings) continue
      const keywordStart = range.start + directive.range.start
      const keywordEnd = range.start + directive.preludeRange.start
      if (overlapsRange(keywordStart, keywordEnd, lineCommentRanges)) continue
      const classNode = resolveComposeDirectiveClassNode(
        source,
        context.sourceCode,
        range.start + directive.preludeRange.start,
        range.start + directive.preludeRange.end,
        lintSession
      )
      if (!classNode) continue
      if (overlapsRange(classNode.start, classNode.end, lineCommentRanges)) continue
      nodes.push({
        ...classNode,
        directiveStart: range.start + directive.range.start,
        directiveEnd: range.start + directive.range.end
      })
    }
  }
  return nodes
}
