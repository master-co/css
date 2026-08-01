interface ShikiPosition {
  line: number
  character: number
}

interface ShikiDecoration {
  start: number | ShikiPosition
  end: number | ShikiPosition
  tagName?: string
  properties?: Record<string, unknown>
  transform?: (element: unknown, type: 'wrapper' | 'line' | 'token') => unknown | undefined
}

function resolveClassNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(resolveClassNames)
  return typeof value === 'string' ? value.split(/\\s+/).filter(Boolean) : []
}

interface HastText {
  type: 'text'
  value: string
}

interface HastElement {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

type HastNode = HastElement | HastText

function isHastElement(node: unknown): node is HastElement {
  return Boolean(node && typeof node === 'object' && (node as HastElement).type === 'element')
}

function getHastText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  if ((node as HastText).type === 'text') return (node as HastText).value
  if (!isHastElement(node)) return ''
  return (node.children ?? []).map(getHastText).join('')
}

function hasHastClass(element: HastElement, className: string) {
  return resolveClassNames(element.properties?.class).includes(className)
}

function collectCodeElements(node: unknown, codeElements: HastElement[] = []) {
  if (isHastElement(node) && node.tagName === 'code') codeElements.push(node)
  const children = node && typeof node === 'object' && Array.isArray((node as { children?: unknown[] }).children)
    ? (node as { children: unknown[] }).children
    : []
  for (const child of children) collectCodeElements(child, codeElements)
  return codeElements
}

function createSourceLineRanges(source: string) {
  const ranges: { start: number, end: number }[] = []
  let start = 0
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '\n') continue
    ranges.push({ start, end: index })
    start = index + 1
  }
  ranges.push({ start, end: source.length })
  return ranges
}

function createHastText(value: string): HastText | undefined {
  return value ? { type: 'text', value } : undefined
}

function cloneHastElement(element: HastElement, children: HastNode[]) {
  return {
    ...element,
    properties: element.properties ? { ...element.properties } : undefined,
    children
  }
}

function pushHastNode(target: HastNode[], node: HastNode | undefined) {
  if (node) target.push(node)
}

function pushHastElementSlice(target: HastNode[], element: HastElement, children: HastNode[]) {
  if (children.length) target.push(cloneHastElement(element, children))
}

function splitHastNodeByRange(node: HastNode, nodeStart: number, start: number, end: number) {
  const before: HastNode[] = []
  const inside: HastNode[] = []
  const after: HastNode[] = []
  const nodeTextLength = getHastText(node).length
  const nodeEnd = nodeStart + nodeTextLength

  if (nodeEnd <= start) {
    before.push(node)
    return { before, inside, after, length: nodeTextLength }
  }
  if (nodeStart >= end) {
    after.push(node)
    return { before, inside, after, length: nodeTextLength }
  }
  if (node.type === 'text') {
    const localStart = Math.max(0, start - nodeStart)
    const localEnd = Math.min(node.value.length, end - nodeStart)
    pushHastNode(before, createHastText(node.value.slice(0, localStart)))
    pushHastNode(inside, createHastText(node.value.slice(localStart, localEnd)))
    pushHastNode(after, createHastText(node.value.slice(localEnd)))
    return { before, inside, after, length: nodeTextLength }
  }
  if (start <= nodeStart && nodeEnd <= end) {
    inside.push(node)
    return { before, inside, after, length: nodeTextLength }
  }

  const splitChildren = splitHastNodesByRange(
    node.children ?? [],
    Math.max(0, start - nodeStart),
    Math.min(nodeTextLength, end - nodeStart)
  )
  pushHastElementSlice(before, node, splitChildren.before)
  pushHastElementSlice(inside, node, splitChildren.inside)
  pushHastElementSlice(after, node, splitChildren.after)
  return { before, inside, after, length: nodeTextLength }
}

function splitHastNodesByRange(nodes: HastNode[], start: number, end: number) {
  const before: HastNode[] = []
  const inside: HastNode[] = []
  const after: HastNode[] = []
  let offset = 0

  for (const node of nodes) {
    const splitNode = splitHastNodeByRange(node, offset, start, end)
    before.push(...splitNode.before)
    inside.push(...splitNode.inside)
    after.push(...splitNode.after)
    offset += splitNode.length
  }
  return { before, inside, after }
}

function applyClassAttributeValueWrapperToLine(line: HastElement, start: number, end: number, decoration: ShikiDecoration) {
  const splitChildren = splitHastNodesByRange(line.children ?? [], start, end)
  if (!splitChildren.inside.length) return
  const wrapper: HastElement = {
    type: 'element',
    tagName: decoration.tagName ?? 'span',
    properties: { ...(decoration.properties ?? {}) },
    children: splitChildren.inside
  }
  const transformedWrapper = decoration.transform?.(wrapper, 'wrapper')
  line.children = [
    ...splitChildren.before,
    isHastElement(transformedWrapper) ? transformedWrapper : wrapper,
    ...splitChildren.after
  ]
}

export function applyClassAttributeValueWrappers(root: unknown, source: string, decorations: ShikiDecoration[]) {
  if (!decorations.length) return
  const sourceLineRanges = createSourceLineRanges(source)
  const codeElements = collectCodeElements(root)
  for (const codeElement of codeElements) {
    const lines = (codeElement.children ?? [])
      .filter((child): child is HastElement => isHastElement(child) && hasHastClass(child, 'line'))
    for (const decoration of decorations) {
      const { start, end } = decoration
      if (typeof start !== 'number' || typeof end !== 'number') continue
      const startLine = sourceLineRanges.findIndex((range) => range.start <= start && start <= range.end)
      const endLine = sourceLineRanges.findIndex((range) => range.start <= end && end <= range.end)
      if (startLine < 0 || startLine !== endLine) continue
      const line = lines[startLine]
      if (!line) continue
      const lineRange = sourceLineRanges[startLine]
      applyClassAttributeValueWrapperToLine(
        line,
        start - lineRange.start,
        end - lineRange.start,
        decoration
      )
    }
  }
}
