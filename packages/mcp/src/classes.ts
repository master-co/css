import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument, getLanguageId } from './document'
import { loadWorkspaceManifest } from './project'
import { compactRustClassInspection, createMCPRustLanguageSession } from './rust-language'
import { resolveSourceFiles, scanProject } from './scan'

const CLASS_EXTRACTION_VERSION = 1
const CLASS_TRACE_VERSION = 1
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export interface ExtractClassesOptions {
  content?: string
  filePath?: string
  patterns?: string[]
  includeRules?: boolean
}

export interface TraceClassOptions {
  className: string
  patterns?: string[]
  includeCss?: boolean
  mode?: string
}

async function createClassInspectionState(context: MasterCSSMCPContext) {
  const manifest = await loadWorkspaceManifest(context)
  const activeManifest = manifest.status === 'loaded' ? manifest.manifest : defaultManifest
  return {
    manifest,
    session: await createMCPRustLanguageSession(activeManifest)
  }
}

function classifyExtractedClass(
  token: string,
  inspection: ReturnType<typeof compactRustClassInspection>,
  discovered?: {
    latent: string[]
    valid: string[]
    invalid: string[]
    usedNative: string[]
  }
) {
  if (discovered?.valid.includes(token)) return 'generated'
  if (discovered?.usedNative.includes(token)) return 'native-css'
  if (discovered?.invalid.includes(token)) return 'invalid'
  if (discovered?.latent.includes(token)) return 'latent'
  return inspection.valid ? 'generated' : 'unknown'
}

function extractFromContent(
  session: Awaited<ReturnType<typeof createMCPRustLanguageSession>>,
  filePath: string,
  content: string,
  includeRules: boolean,
  discovered?: Parameters<typeof classifyExtractedClass>[2]
) {
  const document = createMCPTextDocument(filePath, content)
  return session.analyzeDocument({
    source: content,
    languageId: document.languageId
  }).classPositions.map((position) => {
    const inspection = compactRustClassInspection(session, position.token, undefined, includeRules)
    return {
      raw: position.raw,
      token: position.token,
      range: position.range,
      loc: {
        start: document.positionAt(position.range.start),
        end: document.positionAt(position.range.end)
      },
      contextRange: position.contextRange,
      sourceKind: 'class-position',
      status: classifyExtractedClass(position.token, inspection, discovered),
      valid: inspection.valid,
      inspection
    }
  })
}

export async function extractClasses(context: MasterCSSMCPContext, options: ExtractClassesOptions = {}) {
  const { manifest, session } = await createClassInspectionState(context)
  const includeRules = Boolean(options.includeRules)

  try {
    if (options.content !== undefined) {
      const filePath = context.resolveVirtualPath(options.filePath || 'index.html')
      const classes = extractFromContent(session, filePath, options.content, includeRules)
      return {
        version: CLASS_EXTRACTION_VERSION,
        root: context.root,
        manifest: {
          status: manifest.status,
          entries: manifest.entries,
          ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        inputs: {
          mode: 'content',
          filePath
        },
        files: [
          {
            filePath,
            languageId: getLanguageId(filePath),
            classes
          }
        ],
        summary: {
          files: 1,
          classes: classes.length,
          valid: classes.filter((className) => className.valid).length,
          invalid: classes.filter((className) => !className.valid).length
        }
      }
    }

    const filePaths = await resolveSourceFiles(context, options.patterns)
    const scan = await scanProject(context, {
      patterns: options.patterns,
      includeCss: false
    })
    const scanFileByPath = new Map(scan.files.map((file) => [file.filePath, file]))
    const files = await Promise.all(filePaths.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8')
      const discovered = scanFileByPath.get(filePath)?.discovered
      return {
        filePath,
        languageId: getLanguageId(filePath),
        classes: extractFromContent(session, filePath, content, includeRules, discovered)
      }
    }))
    const classes = files.flatMap((file) => file.classes)
    return {
      version: CLASS_EXTRACTION_VERSION,
      root: context.root,
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        ...(manifest.status === 'error' ? { error: manifest.error } : {})
      },
      inputs: {
        mode: 'project',
        patterns: options.patterns ?? scan.inputs.patterns,
        files: filePaths
      },
      files,
      scanner: {
        counts: scan.scanner.counts
      },
      diagnostics: scan.diagnostics,
      summary: {
        files: files.length,
        classes: classes.length,
        valid: classes.filter((className) => className.valid).length,
        invalid: classes.filter((className) => !className.valid).length,
        diagnostics: scan.summary.diagnostics
      }
    }
  } finally {
    session.dispose?.()
  }
}

function findClassOccurrences(
  report: Awaited<ReturnType<typeof scanProject>>,
  className: string
) {
  return report.files.flatMap((file) => {
    const discovered = file.discovered
    const statuses = [
      discovered.valid.includes(className) ? 'valid' : undefined,
      discovered.invalid.includes(className) ? 'invalid' : undefined,
      discovered.usedNative.includes(className) ? 'used-native' : undefined,
      discovered.latent.includes(className) ? 'latent' : undefined
    ].filter((status): status is string => Boolean(status))
    return statuses.length
      ? [{
        filePath: file.filePath,
        source: file.source,
        statuses
      }]
      : []
  })
}

export async function traceClass(context: MasterCSSMCPContext, options: TraceClassOptions) {
  const [scan, state] = await Promise.all([
    scanProject(context, {
      patterns: options.patterns,
      classes: [options.className],
      includeCss: options.includeCss
    }),
    createClassInspectionState(context)
  ])
  try {
    const inspection = compactRustClassInspection(state.session, options.className, options.mode, true)
    const missingResult = [...scan.missingCSS.present, ...scan.missingCSS.missing]
      .find((result) => result.className === options.className)
    const occurrences = findClassOccurrences(scan, options.className)
    const status = missingResult?.status ?? (inspection.valid ? 'present' : 'missing')
    const reason = missingResult?.reason ?? (inspection.valid ? 'generated' : 'not-detected')
    return {
      version: CLASS_TRACE_VERSION,
      root: context.root,
      manifest: {
        status: state.manifest.status,
        entries: state.manifest.entries,
        ...(state.manifest.status === 'error' ? { error: state.manifest.error } : {})
      },
      inputs: {
        className: options.className,
        patterns: options.patterns ?? scan.inputs.patterns,
        mode: options.mode
      },
      className: options.className,
      status,
      reason,
      detected: occurrences.length > 0,
      occurrences,
      inspection,
      scanner: {
        counts: scan.scanner.counts,
        safelist: scan.scanner.classes.safelist.includes(options.className),
        blocklist: scan.scanner.classes.blocklist.includes(options.className)
      },
      css: {
        included: scan.css.included,
        bytes: scan.css.bytes,
        emittedGlobals: scan.css.emittedGlobals,
        ...(scan.css.text !== undefined ? { text: scan.css.text } : {})
      },
      diagnostics: scan.diagnostics.filter((diagnostic) => {
        if (diagnostic.sourceKind === 'missing-css') {
          const data = diagnostic.data as { className?: string } | undefined
          return data?.className === options.className
        }
        return diagnostic.message.includes(options.className)
      }),
      summary: {
        status,
        reason,
        detected: occurrences.length > 0,
        valid: inspection.valid,
        rules: inspection.rules.length,
        diagnostics: scan.diagnostics.length
      }
    }
  } finally {
    state.session.dispose?.()
  }
}
