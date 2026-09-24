import { resolve } from 'node:path'
import fg from 'fast-glob'
import { renderClassNamesSync } from '@master/css/node'
import { createMasterCSSInspectionReport } from '@master/css-compiler/diagnostics'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import { compactClassInspection, createMCPToolingSession } from './tooling-session'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,mjs,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']

export interface ScanProjectOptions {
  context?: SemanticContext
  patterns?: string[]
  classes?: string[]
  includeCss?: boolean
}

export interface RenderCSSOptions {
  context?: SemanticContext
  html?: string
  classList?: string
}

export interface InspectClassOptions {
  context?: SemanticContext
  className: string
  mode?: string
}

export async function resolveSourceFiles(context: MasterCSSMCPContext, patterns = DEFAULT_SOURCE_PATTERNS, ignore = DEFAULT_IGNORE_PATTERNS) {
  context.validateGlobPatterns(patterns)
  const sources = await fg(patterns, {
    cwd: context.root,
    ignore,
    onlyFiles: true
  })
  return Promise.all(sources.map((source) => context.resolveExistingFile(source)))
}

export async function scanProject(context: MasterCSSMCPContext, options: ScanProjectOptions = {}) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  const report = await createMasterCSSInspectionReport({
    manifest: requireWorkspaceManifest(manifest),
    cwd: context.root,
    patterns: options.patterns,
    classes: options.classes,
    includeCss: options.includeCss,
    resolveExistingFile: (filePath) => context.resolveExistingFile(filePath),
    validatePatterns: (patterns) => context.validateGlobPatterns(patterns)
  })
  return { ...report, root: context.root, manifest: manifestMetadata(manifest) }
}

export async function renderCSS(context: MasterCSSMCPContext, options: RenderCSSOptions) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  let classes: string[]
  if (options.html) {
    const tooling = createToolingSessionSync({
      manifest: requireWorkspaceManifest(manifest)
    })
    try {
      classes = [...tooling.extractSource({
        files: [{
          source: 'index.html',
          content: options.html,
          kind: 'html'
        }]
      }).files[0]?.candidates ?? []]
    } finally {
      tooling.dispose()
    }
  } else {
    classes = (options.classList ?? '')
      .split(/\s+/)
      .map((className) => className.trim())
      .filter(Boolean)
  }
  const rendered = renderClassNamesSync(classes, {
    manifest: requireWorkspaceManifest(manifest)
  })
  const tooling = createMCPToolingSession(requireWorkspaceManifest(manifest))
  let inspections: ReturnType<typeof compactClassInspection>[]
  try { inspections = classes.map(className => compactClassInspection(tooling, className, undefined, true)) }
  finally { tooling.dispose() }
  return {
    manifest: manifestMetadata(manifest),
    classes,
    inspections,
    diagnostics: inspections.flatMap(inspection => inspection.diagnostics ?? []),
    invalid: rendered.invalidClassNames,
    css: {
      bytes: Buffer.byteLength(rendered.cssText, 'utf8'),
      text: rendered.cssText
    }
  }
}

export async function inspectClass(context: MasterCSSMCPContext, options: InspectClassOptions) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  const session = createMCPToolingSession(
    requireWorkspaceManifest(manifest)
  )
  try {
    const inspection = session.inspectClassName(options.className, options.mode)
    const compact = compactClassInspection(
      session,
      options.className,
      options.mode,
      true,
      inspection
    )
    return {
      manifest: manifestMetadata(manifest),
      mode: options.mode,
      ...compact,
      css: inspection.rules.map((rule) => rule.text).join('')
    }
  } finally {
    session.dispose?.()
  }
}

export async function previewGeneratedCSS(
  context: MasterCSSMCPContext,
  options: ScanProjectOptions & { outputPath: string, ttlMs?: number }
) {
  const report = await scanProject(context, {
    patterns: options.patterns,
    classes: options.classes,
    includeCss: true,
    context: options.context
  })
  const preview = await context.createPreview([
    {
      filePath: resolve(context.root, options.outputPath),
      afterText: report.css.text ?? ''
    }
  ], options.ttlMs)
  return {
    manifest: report.manifest,
    diagnostics: report.diagnostics,
    inspections: report.inspections,
    mode: 'generated-css',
    outputPath: await context.resolveWritableFile(options.outputPath),
    preview,
    scan: {
      summary: report.summary,
      css: {
        bytes: report.css.bytes,
        emittedGlobals: report.css.emittedGlobals
      }
    }
  }
}
