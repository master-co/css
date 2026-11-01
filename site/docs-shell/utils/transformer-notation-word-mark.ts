import type { Element, ElementContent, Text } from 'hast'
import type { ShikiTransformer } from 'shiki/core'

/** `@MARK` wraps words in a plain `<mark>`; `@WARN` and `@ERROR` add a diagnostic tone (`ui-code` styles both). */
const controlTones = {
  MARK: undefined,
  WARN: 'warning',
  ERROR: 'danger'
} as const

type ControlKind = keyof typeof controlTones
type Tone = typeof controlTones[ControlKind]

export default function transformerNotationWordMark(): ShikiTransformer {
  return {
    name: 'word-mark',
    code(ast) {
      let lines = ast.children.filter((i) => i.type === 'element')
      let toRemove = new Set<ElementContent>()
      let toHighlight = new Map<string, Tone>()

      for (let line of lines) {
        let highlights = parseHighlightDirectives(line)
        if (highlights.length) {
          toRemove.add(line)
          for (let highlight of highlights) {
            for (let mark of highlight.marks) {
              toHighlight.set(mark, highlight.tone)
            }
          }
          continue
        }

        if (toHighlight.size === 0) continue

        for (let [mark, tone] of toHighlight) {
          applyCrossChildMarkHighlight(line, mark, tone)
        }
      }

      ast.children = ast.children.filter((i) => !toRemove.has(i))
    },
  }
}

function applyCrossChildMarkHighlight(line: Element, mark: string, tone: Tone) {
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
  const replacements = new Map<number, { before?: Element, marked: Element, after?: Element }>()
  for (const fragment of textFragments) {
    const overlapStart = Math.max(startIndex, fragment.start)
    const overlapEnd = Math.min(markEnd, fragment.end)
    if (overlapStart >= overlapEnd) continue
    const start = overlapStart - fragment.start
    const end = overlapEnd - fragment.start
    replacements.set(fragment.index, {
      before: start > 0 ? cloneElementWithText(fragment.el, fragment.text.slice(0, start)) : undefined,
      marked: cloneElementWithText(fragment.el, fragment.text.slice(start, end)),
      after: end < fragment.text.length ? cloneElementWithText(fragment.el, fragment.text.slice(end)) : undefined
    })
  }

  if (replacements.size === 0) return

  // The marked pieces of every token the words span share one <mark>, so it reads as one highlight.
  const markElement: Element = { type: 'element', tagName: 'mark', properties: tone ? { dataTone: tone } : {}, children: [] }
  const children: ElementContent[] = []
  line.children.forEach((child, index) => {
    const replacement = replacements.get(index)
    if (!replacement) return void children.push(child)
    if (replacement.before) children.push(replacement.before)
    if (!markElement.children.length) children.push(markElement)
    markElement.children.push(replacement.marked)
    if (replacement.after) children.push(replacement.after)
  })
  line.children = children
}

function cloneElementWithText(el: Element, text: string): Element {
  const properties = { ...el.properties }
  if (Array.isArray(properties.class)) properties.class = [...properties.class]
  return { ...el, properties, children: [{ type: 'text', value: text } as Text] }
}

const commentBash = /^\s*\#\s*(.*)$/
const commentHTML = /^\s*<!--\s*(.*)\s*-->$/
const commentLine = /^\s*\/\/\s*(.*)$/
const commentBlock = /^\s*\/\*\s*(.*?)\s*\*\/$/
const marksControlPattern = /@(?<kind>MARK|WARN|ERROR)\s+(?<marks>.+?)(?=\s*(?:-->|$))/g

interface Highlight {
  marks: string[];
  tone: Tone;
}

function parseHighlightDirectives(el: Element): Highlight[] {
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

    highlights.push({ marks, tone: controlTones[kind] })
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
  if (element.type === 'element' && (element.tagName === 'div' || element.tagName === 'span' || element.tagName === 'mark')) {
    return element.children.map(getTextContent).join('')
  }
  return ''
}
