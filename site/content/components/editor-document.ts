import { MasterCSSLanguageService } from '@master/css-language-service'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { getColor, type ColorLevel } from '~/site/docs-shell/data/color-palette'
import preset from '~/site/utils/preset-manifest'
import { editorCompletion, editorCompletionDetail, editorCompletionLabels, editorFileName, editorHoverClass, editorSource, editorSwatches, type EditorClass, type EditorHover, type EditorModel, type EditorRole, type EditorSpan } from './editor-content'

interface SemanticToken {
  start: number
  end: number
  type: string
  modifiers?: readonly string[]
}

/** A text document over a multi-line source, enough for the language service's position helpers. */
export function createEditorTextDocument(text: string) {
  const starts = [0]
  for (let index = 0; index < text.length; index++) if (text[index] === '\n') starts.push(index + 1)
  const offsetAt = (position: { line: number, character: number }) => starts[position.line] + position.character
  return {
    uri: `file:///${editorFileName}`,
    languageId: 'html',
    version: 1,
    lineCount: starts.length,
    getText: (range?: { start: { line: number, character: number }, end: { line: number, character: number } }) => range ? text.slice(offsetAt(range.start), offsetAt(range.end)) : text,
    positionAt(offset: number) {
      let line = 0
      while (line + 1 < starts.length && starts[line + 1] <= offset) line++
      return { line, character: offset - starts[line] }
    },
    offsetAt
  }
}

/** The semantic role of a token inside a class, which decides its color when the class string lights up. */
function semanticRole(token: SemanticToken, classStart: number): EditorRole {
  const modifiers = token.modifiers ?? []
  switch (token.type) {
    case 'property':
      return 'property'
    case 'operator':
      return modifiers.includes('selector') || modifiers.includes('pseudoClass') ? 'selector' : 'punct'
    case 'modifier':
      return 'selector'
    case 'keyword':
      return 'query'
    case 'number':
      return 'number'
    case 'enumMember':
    case 'function':
      return modifiers.includes('unit') ? 'number' : token.start === classStart ? 'utility' : 'value'
    default:
      return 'value'
  }
}

/** Split the language service's hover markdown into the token names and the CSS block. */
function readHover(markdown: string): EditorHover {
  const tokens = [...(markdown.match(/^Named token: (.+)$/m)?.[1].matchAll(/`([^`]+)`/g) ?? [])].map((match) => match[1])
  return { tokens, css: markdown.match(/```css\n([\s\S]*?)\n```/)?.[1] ?? '' }
}

/** Markup tokens on one line: a tag, an attribute with its quoted value, a tag end, or text. */
const markupPattern = /(<\/?[\w-]+)|(\s+)([\w-]+)(=)(")([^"]*)(")|(\/?>)|([^<]+)/g

let model: EditorModel | undefined

/**
 * The editor file as the language service sees it: semantic tokens for every class, the hover for
 * every class, and the color swatches, so the stage shows what the editor would show.
 */
export function getEditorModel(): EditorModel {
  if (model) return model
  const manifest = preset as unknown as MasterCSSManifest
  const session = createToolingSessionSync({ manifest })
  try {
    const service = new MasterCSSLanguageService({ manifest }, { session })
    const document = createEditorTextDocument(editorSource)
    const analysis = session.analyzeDocument({ source: editorSource, languageId: 'html' })
    const semanticTokens = analysis.semanticTokens as readonly SemanticToken[]
    const hovers: EditorHover[] = []
    const hoverIndexes = new Map<string, number>()
    const classes: EditorClass[] = []
    const classAt = new Map<number, number>()
    for (const position of analysis.classPositions) {
      const { start, end } = position.range
      const name = position.token
      if (!hoverIndexes.has(name)) {
        const hover = service.inspectSyntax(document as never, document.positionAt(start))
        const contents = hover?.contents as { value: string } | undefined
        hoverIndexes.set(name, hovers.push(readHover(contents?.value ?? '')) - 1)
      }
      // Semantic tokens cover the meaningful parts; anything between them keeps the string color.
      const parts: EditorClass['parts'] = []
      let cursor = start
      for (const token of semanticTokens.filter((item) => item.start >= start && item.end <= end)) {
        if (token.start > cursor) parts.push([editorSource.slice(cursor, token.start), 'base'])
        parts.push([editorSource.slice(token.start, token.end), semanticRole(token, start)])
        cursor = token.end
      }
      if (cursor < end) parts.push([editorSource.slice(cursor, end), 'base'])
      const swatch = editorSwatches.find((item) => item.className === name)
      const { line, character } = document.positionAt(start)
      classAt.set(start, classes.push({
        name,
        line,
        column: character,
        context: -1,
        parts,
        hover: hoverIndexes.get(name)!,
        swatch: swatch && {
          at: swatch.at,
          color: 'literal' in swatch
            ? swatch.literal
            : 'alpha' in swatch
              ? `color-mix(in oklab, ${getColor(swatch.token[0], swatch.token[1] as ColorLevel)} ${swatch.alpha * 100}%, transparent)`
              : getColor(swatch.token[0], swatch.token[1] as ColorLevel)
        }
      }) - 1)
    }

    let context = 0
    let offset = 0
    const lines = editorSource.split('\n').map((line) => {
      const spans: EditorSpan[] = []
      for (const match of line.matchAll(markupPattern)) {
        const [, tag, space, name, equals, open, value, close, end, text] = match
        if (tag) spans.push({ text: tag, tone: 'tag' })
        else if (end) spans.push({ text: end, tone: 'tag' })
        else if (text) spans.push({ text, tone: 'text' })
        else {
          spans.push({ text: space, tone: 'text' }, { text: name, tone: 'attr' }, { text: equals, tone: 'punct' }, { text: open, tone: 'string' })
          if (name === 'class') {
            // A class string: runs of spaces stay text, each class becomes its index.
            const valueStart = offset + match.index + match[0].length - close.length - value.length
            const items = [...value.matchAll(/\s+|\S+/g)].map((item) => /\s/.test(item[0]) ? item[0] : classAt.get(valueStart + item.index)!)
            for (const item of items) if (typeof item === 'number') classes[item].context = context
            spans.push({ context: context++, items })
          } else {
            spans.push({ text: value, tone: 'string' })
          }
          spans.push({ text: close, tone: 'string' })
        }
      }
      offset += line.length + 1
      return spans
    })

    const inserted = classes.findIndex((item) => item.line === editorCompletion.line && item.name === editorCompletion.label)
    model = {
      fileName: editorFileName,
      lines,
      classes,
      hovers,
      insertion: { line: editorCompletion.line, column: classes[inserted].column - 1, classIndex: inserted },
      hoverClass: classes.findIndex((item) => item.name === editorHoverClass),
      literalClass: classes.findIndex((item) => editorSwatches.some((swatch) => 'literal' in swatch && swatch.className === item.name)),
      completion: {
        prefix: editorCompletion.prefix,
        query: editorCompletion.query,
        label: editorCompletion.label,
        labels: [...editorCompletionLabels],
        detail: editorCompletionDetail
      }
    }
    return model
  } finally {
    session.dispose()
  }
}
