import { readFile } from 'node:fs/promises'
import CSSLanguageService from '@master/css-language-service'
import type MasterCSSMCPContext from './context'
import { applyTextEdits, createMCPTextDocument, getLanguageId, type Range, type TextEdit } from './document'
import { resolveSourceFiles } from './scan'

const DIRECTIVE_FORMAT_PREVIEW_VERSION = 1
const DEFAULT_DIRECTIVE_FORMAT_PATTERNS = ['**/*.{css,scss,less,vue,svelte,astro}']

export interface PreviewDirectiveFormatOptions {
  content?: string
  filePath?: string
  patterns?: string[]
  range?: Range
  ttlMs?: number
}

function formatContent(service: CSSLanguageService, filePath: string, content: string, range?: Range) {
  const document = createMCPTextDocument(filePath, content)
  const edits = (service.formatDirectives(document, range) ?? []) as TextEdit[]
  const formatted = applyTextEdits(content, document, edits)
  return {
    filePath,
    languageId: getLanguageId(filePath),
    edits,
    changed: formatted !== content,
    beforeBytes: content.length,
    afterBytes: formatted.length,
    formatted
  }
}

export async function previewDirectiveFormat(context: MasterCSSMCPContext, options: PreviewDirectiveFormatOptions = {}) {
  const service = new CSSLanguageService()

  if (options.content !== undefined) {
    const filePath = context.resolveVirtualPath(options.filePath || 'master.css')
    const formatted = formatContent(service, filePath, options.content, options.range)
    return {
      version: DIRECTIVE_FORMAT_PREVIEW_VERSION,
      root: context.root,
      mode: 'content',
      files: [
        {
          filePath,
          languageId: formatted.languageId,
          edits: formatted.edits,
          changed: formatted.changed,
          beforeBytes: formatted.beforeBytes,
          afterBytes: formatted.afterBytes
        }
      ],
      formatted: formatted.formatted,
      summary: {
        files: 1,
        changed: formatted.changed ? 1 : 0,
        edits: formatted.edits.length
      }
    }
  }

  const files = await resolveSourceFiles(context, options.patterns ?? DEFAULT_DIRECTIVE_FORMAT_PATTERNS)
  const formattedFiles = await Promise.all(files.map(async (filePath) => {
    const content = await readFile(filePath, 'utf8')
    return formatContent(service, filePath, content, options.range)
  }))
  const preview = await context.createPreview(
    formattedFiles
      .filter((file) => file.changed)
      .map((file) => ({
        filePath: file.filePath,
        beforeText: undefined,
        afterText: file.formatted
      })),
    options.ttlMs
  )
  return {
    version: DIRECTIVE_FORMAT_PREVIEW_VERSION,
    root: context.root,
    mode: 'files',
    inputs: {
      patterns: options.patterns ?? DEFAULT_DIRECTIVE_FORMAT_PATTERNS,
      files
    },
    preview,
    files: formattedFiles.map((file) => ({
      filePath: file.filePath,
      languageId: file.languageId,
      edits: file.edits,
      changed: file.changed,
      beforeBytes: file.beforeBytes,
      afterBytes: file.afterBytes
    })),
    summary: {
      files: formattedFiles.length,
      changed: formattedFiles.filter((file) => file.changed).length,
      edits: formattedFiles.reduce((count, file) => count + file.edits.length, 0)
    }
  }
}
