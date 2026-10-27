import type { Element, ElementContent, Text } from 'hast'
import type { ShikiTransformer } from 'shiki/core'

export interface HighlightMarksOptions {
  highlightedClassName: string;
}

const controlClassNames = {
  MARK: 'mark',
  WARN: 'mark code-mark-warn',
  ERROR: 'mark code-mark-error'
} as const

type ControlKind = keyof typeof controlClassNames

export default function transformerNotationWordMark(opts: HighlightMarksOptions = { highlightedClassName: 'mark' }): ShikiTransformer {
  return {
    name: 'word-mark',
    code(ast) {
      let lines = ast.children.filter((i) => i.type === 'element')
      let toRemove = new Set<ElementContent>()
      let toHighlight = new Map<string, string>()

      for (let line of lines) {
        let highlights = parseHighlightDirectives(line, opts.highlightedClassName)
        if (highlights.length) {
          toRemove.add(line)
          for (let highlight of highlights) {
            for (let mark of highlight.marks) {
              toHighlight.set(mark, highlight.className)
            }
          }
          continue
        }

        if (toHighlight.size === 0) continue

        for (let [mark, className] of toHighlight) {
          applyCrossChildMarkHighlight(line, mark, className)
        }
      }

      ast.children = ast.children.filter((i) => !toRemove.has(i))
    },
  }
}

function applyCrossChildMarkHighlight(line: Element, mark: string, className: string) {
  let textFragments: { el: Element; text: string; index: number; start: number; end: number }[] = []
  let currentPos = 0
  line.children.forEach((child, index) => {
    if (child.type === 'element' && (child.tagName === 'div' || child.tagName === 'span')) {
      const text = getTextContent(child)
      textFragments.push({ el: child, text, index, start: currentPos, end: currentPos + text.length })
      currentPos += text.length
    }
  })

  const combinedText = textFragments.map((f) => f.text).join('')
  const startIndex = combinedText.indexOf(mark)
  if (startIndex === -1) return

  const markEnd = startIndex + mark.length
  const replacements = new Map<number, ElementContent[]>()
  for (const fragment of textFragments) {
    const overlapStart = Math.max(startIndex, fragment.start)
    const overlapEnd = Math.min(markEnd, fragment.end)
    if (overlapStart >= overlapEnd) continue
    replacements.set(
      fragment.index,
      splitElementByMarkRange(
        fragment.el,
        overlapStart - fragment.start,
        overlapEnd - fragment.start,
        className
      )
    )
  }

  if (replacements.size === 0) return

  line.children = line.children.flatMap((child, index) => replacements.get(index) ?? child)
}

function splitElementByMarkRange(el: Element, start: number, end: number, className: string): ElementContent[] {
  const text = getTextContent(el)
  const nodes: ElementContent[] = []
  if (start > 0) nodes.push(cloneElementWithText(el, text.slice(0, start)))
  nodes.push(cloneElementWithText(el, text.slice(start, end), className))
  if (end < text.length) nodes.push(cloneElementWithText(el, text.slice(end)))
  return nodes
}

function cloneElementWithText(el: Element, text: string, className?: string): Element {
  const clone: Element = {
    ...el,
    properties: cloneProperties(el.properties),
    children: [{ type: 'text', value: text } as Text]
  }
  if (className) addClassName(clone, className)
  return clone
}

function cloneProperties(properties: Element['properties']): Element['properties'] {
  const cloned = { ...properties }
  if (Array.isArray(cloned.class)) {
    cloned.class = [...cloned.class]
  }
  return cloned
}

function addClassName(el: Element, className: string) {
  const classNames = className.split(/\s+/).filter(Boolean)
  if (!el.properties) el.properties = {}
  const classes = el.properties.class
  if (!classes) {
    el.properties.class = classNames.join(' ')
  } else if (Array.isArray(classes)) {
    for (const eachClassName of classNames) {
      if (!classes.includes(eachClassName)) classes.push(eachClassName)
    }
  } else if (typeof classes === 'string') {
    const currentClassNames = classes.split(/\s+/)
    const nextClassNames = classNames.filter((eachClassName) => !currentClassNames.includes(eachClassName))
    if (nextClassNames.length) el.properties.class += ` ${nextClassNames.join(' ')}`
  }
}

const commentBash = /^\s*\#\s*(.*)$/
const commentHTML = /^\s*<!--\s*(.*)\s*-->$/
const commentLine = /^\s*\/\/\s*(.*)$/
const commentBlock = /^\s*\/\*\s*(.*?)\s*\*\/$/
const marksControlPattern = /@(?<kind>MARK|WARN|ERROR)\s+(?<marks>.+?)(?=\s*(?:-->|$))/g

interface Highlight {
  marks: string[];
  className: string;
}

function parseHighlightDirectives(el: Element, highlightedClassName: string): Highlight[] {
  let comment = getControlComment(el)
  if (!comment) return []

  let highlights: Highlight[] = []
  let match: RegExpExecArray | null
  marksControlPattern.lastIndex = 0
  while ((match = marksControlPattern.exec(comment))) {
    const kind = match.groups?.kind as ControlKind | undefined
    const rawMarks = match.groups?.marks
    if (!kind || !rawMarks) continue
    let marks = rawMarks.split(/\s+/).filter(Boolean)
    if (marks.length === 0) continue

    highlights.push({
      marks,
      className: kind === 'MARK' ? highlightedClassName : controlClassNames[kind]
    })
  }

  return highlights
}

function getControlComment(el: Element): string | null {
  let text = getTextContent(el)
  if (text === '') return null
  let match = text.match(commentHTML) || text.match(commentLine) || text.match(commentBlock)
  if (match) return match[1]

  return null
}

export function getTextContent(element: ElementContent): string {
  if (element.type === 'text') {
    return element.value
  }
  if (element.type === 'element' && (element.tagName === 'div' || element.tagName === 'span')) {
    return element.children.map(getTextContent).join('')
  }
  return ''
}
