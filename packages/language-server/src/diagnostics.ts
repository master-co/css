import { DiagnosticSeverity } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CSSDirectiveError } from '@master/css-schema/css-directives'
import { MasterCSSError, type MasterCSSDiagnostic } from '@master/css-schema'

const CSS_DIAGNOSTIC_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const SFC_DIAGNOSTIC_LANGUAGE_IDS = new Set(['vue', 'svelte', 'astro'])
const STYLE_BLOCK_RE = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi

interface CSSDiagnosticSource {
  source: string
  offset: number
}

export function getMasterCSSDiagnostics(error: unknown): readonly MasterCSSDiagnostic[] | undefined {
  if (error instanceof MasterCSSError) return error.diagnostics
  if (
    !error
    || typeof error !== 'object'
    || (error as { name?: unknown }).name !== 'MasterCSSError'
  ) return
  const diagnostics = (error as { diagnostics?: unknown }).diagnostics
  if (!Array.isArray(diagnostics)) return
  return diagnostics as readonly MasterCSSDiagnostic[]
}

export function toLSPDiagnosticSeverity(severity: MasterCSSDiagnostic['severity']) {
  switch (severity) {
    case 'warning':
      return DiagnosticSeverity.Warning
    case 'information':
      return DiagnosticSeverity.Information
    default:
      return DiagnosticSeverity.Error
  }
}

export function isCSSDiagnosticDocument(textDocument: TextDocument) {
  return CSS_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)
    || SFC_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)
}

function getSFCStyleLanguage(attributes: string) {
  const match = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(attributes)
  return (match?.[1] || match?.[2] || match?.[3] || 'css').toLowerCase()
}

export function getCSSDiagnosticSources(textDocument: TextDocument): CSSDiagnosticSource[] {
  const text = textDocument.getText()
  if (CSS_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)) {
    return [{ source: text, offset: 0 }]
  }
  if (!SFC_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)) return []
  const sources: CSSDiagnosticSource[] = []
  STYLE_BLOCK_RE.lastIndex = 0
  for (const match of text.matchAll(STYLE_BLOCK_RE)) {
    const styleLanguage = getSFCStyleLanguage(match[1])
    if (!CSS_DIAGNOSTIC_LANGUAGE_IDS.has(styleLanguage)) continue
    const source = match[2]
    const offset = (match.index || 0) + match[0].indexOf('>') + 1
    sources.push({ source, offset })
  }
  return sources
}

function isCSSDirectiveError(error: unknown): error is CSSDirectiveError {
  return error instanceof CSSDirectiveError
    || (
      !!error
      && typeof error === 'object'
      && (error as { name?: unknown }).name === 'CSSDirectiveError'
      && typeof (error as { code?: unknown }).code === 'string'
    )
}

export function toCSSDirectiveError(error: unknown): CSSDirectiveError | undefined {
  if (isCSSDirectiveError(error)) return error
  if (!error || typeof error !== 'object') return
  const diagnostic = error as {
    code?: unknown
    message?: unknown
    source?: unknown
    range?: unknown
  }
  if (typeof diagnostic.code !== 'string' || typeof diagnostic.message !== 'string') return
  const range = diagnostic.range
  if (!range || typeof range !== 'object') return
  const { start, end } = range as { start?: unknown, end?: unknown }
  if (typeof start !== 'number' || typeof end !== 'number') return
  return new CSSDirectiveError(
    diagnostic.code,
    diagnostic.message,
    {
      ...(typeof diagnostic.source === 'string' && diagnostic.source ? { file: diagnostic.source } : {}),
      range: { start, end }
    }
  )
}

