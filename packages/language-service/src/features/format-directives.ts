import {
  formatMasterCSSDirectives,
  type MasterCSSDirectiveFormatEdit
} from '@master/css-language'
import type { Range, TextEdit } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'

const CSS_FORMAT_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const SFC_FORMAT_LANGUAGE_IDS = new Set(['vue', 'svelte', 'astro'])
const STYLE_BLOCK_RE = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi

function getSFCStyleLanguage(attributes: string) {
  const match = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(attributes)
  return (match?.[1] || match?.[2] || match?.[3] || 'css').toLowerCase()
}

function toOffsetRange(document: TextDocument, range?: Range) {
  if (!range) return
  return {
    start: document.offsetAt(range.start),
    end: document.offsetAt(range.end)
  }
}

function intersects(a: { start: number, end: number }, b: { start: number, end: number }) {
  return a.start < b.end && b.start < a.end
}

function toTextEdit(document: TextDocument, edit: MasterCSSDirectiveFormatEdit): TextEdit {
  return {
    range: {
      start: document.positionAt(edit.start),
      end: document.positionAt(edit.end)
    },
    newText: edit.newText
  }
}

function collectCSSDocumentFormatEdits(document: TextDocument, range?: Range) {
  const source = document.getText()
  const offsetRange = toOffsetRange(document, range)
  return formatMasterCSSDirectives(source, { range: offsetRange }).map(toTextEdit.bind(undefined, document))
}

function collectSFCFormatEdits(document: TextDocument, range?: Range) {
  const source = document.getText()
  const offsetRange = toOffsetRange(document, range)
  const edits: MasterCSSDirectiveFormatEdit[] = []
  STYLE_BLOCK_RE.lastIndex = 0
  for (const match of source.matchAll(STYLE_BLOCK_RE)) {
    const styleLanguage = getSFCStyleLanguage(match[1])
    if (!CSS_FORMAT_LANGUAGE_IDS.has(styleLanguage)) continue
    const styleText = match[2]
    const styleStart = (match.index || 0) + match[0].indexOf(styleText)
    const styleEnd = styleStart + styleText.length
    const styleRange = { start: styleStart, end: styleEnd }
    if (offsetRange && !intersects(offsetRange, styleRange)) continue
    const relativeRange = offsetRange
      ? {
        start: Math.max(offsetRange.start, styleStart) - styleStart,
        end: Math.min(offsetRange.end, styleEnd) - styleStart
      }
      : undefined
    for (const edit of formatMasterCSSDirectives(styleText, { range: relativeRange })) {
      edits.push({
        start: styleStart + edit.start,
        end: styleStart + edit.end,
        newText: edit.newText
      })
    }
  }
  return edits.map(toTextEdit.bind(undefined, document))
}

export default function formatDirectives(document: TextDocument, range?: Range): TextEdit[] | undefined {
  if (CSS_FORMAT_LANGUAGE_IDS.has(document.languageId)) {
    return collectCSSDocumentFormatEdits(document, range)
  }
  if (SFC_FORMAT_LANGUAGE_IDS.has(document.languageId)) {
    return collectSFCFormatEdits(document, range)
  }
}
