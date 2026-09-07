import type { MasterCSSLanguageService } from '../core'
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

function toTextEdit(
  document: TextDocument,
  edit: { range: { start: number, end: number }, text: string }
): TextEdit {
  return {
    range: {
      start: document.positionAt(edit.range.start),
      end: document.positionAt(edit.range.end)
    },
    newText: edit.text
  }
}

function collectSFCStyleRanges(document: TextDocument) {
  const source = document.getText()
  const ranges: { start: number, end: number }[] = []
  STYLE_BLOCK_RE.lastIndex = 0
  for (const match of source.matchAll(STYLE_BLOCK_RE)) {
    const styleLanguage = getSFCStyleLanguage(match[1])
    if (!CSS_FORMAT_LANGUAGE_IDS.has(styleLanguage)) continue
    const styleText = match[2]
    const styleStart = (match.index || 0) + match[0].indexOf('>') + 1
    const styleEnd = styleStart + styleText.length
    ranges.push({ start: styleStart, end: styleEnd })
  }
  return ranges
}

export default function formatDirectives(
  this: MasterCSSLanguageService,
  document: TextDocument,
  range?: Range
): TextEdit[] | undefined {
  const isCSS = CSS_FORMAT_LANGUAGE_IDS.has(document.languageId)
  const isSFC = SFC_FORMAT_LANGUAGE_IDS.has(document.languageId)
  if (!isCSS && !isSFC) return
  const result = this.session.formatDirectives({
    source: document.getText(),
    range: toOffsetRange(document, range),
    styleRanges: isSFC ? collectSFCStyleRanges(document) : undefined
  })
  return result.edits.map(toTextEdit.bind(undefined, document))
}
