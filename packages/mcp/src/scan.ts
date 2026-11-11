import { SourcePolicy } from '@master/css-tooling/scanner/node'
import { extname, resolve } from 'node:path'
import fg from 'fast-glob'
import { renderClassNamesSync } from '@master/css/node'
import { createMasterCSSInspectionReport, captureMasterCSSProject, type MasterCSSDesignSystemOptions } from '@master/css-compiler/diagnostics'
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
  includeSnapshot?: boolean
  designSystem?: MasterCSSDesignSystemOptions
  /** Globs for route and component stylesheets imported from JavaScript; requires designSystem. */
  routeStylesheets?: string[]
}

export interface RenderCSSOptions {
  context?: SemanticContext
  html?: string
  classList?: string
}

export interface InspectClassOptions {
  context?: SemanticContext
  className: string
}

export async function resolveSourceFiles(context: MasterCSSMCPContext, patterns = DEFAULT_SOURCE_PATTERNS, ignore = DEFAULT_IGNORE_PATTERNS, explicit = patterns !== DEFAULT_SOURCE_PATTERNS) {
  context.validateGlobPatterns(patterns)
  const sources = await fg(patterns, {
    cwd: context.root,
    ignore,
    onlyFiles: true,
    // Linked directories can loop back into the workspace or walk the whole filesystem.
    followSymbolicLinks: false
  })
  const policy = new SourcePolicy(context.root, { exclude: ignore })
  return Promise.all(sources.filter(source => policy.accepts(source, explicit)).map((source) => context.resolveExistingFile(source)))
}

export async function scanProject(context: MasterCSSMCPContext, options: ScanProjectOptions = {}) {
  if (options.designSystem && options.context === 'preset') {
    throw new Error('designSystem inspection requires project context; omit context or select "project".')
  }
  if (options.routeStylesheets?.length && !options.designSystem) throw new Error('routeStylesheets requires designSystem.')
  let routeStylesheets: string[] | undefined
  if (options.routeStylesheets?.length) {
    context.validateGlobPatterns(options.routeStylesheets)
    const sources = await fg(options.routeStylesheets, { cwd: context.root, ignore: DEFAULT_IGNORE_PATTERNS, onlyFiles: true, followSymbolicLinks: false })
    if (sources.some(source => !source.endsWith('.css'))) throw new Error('routeStylesheets must match .css files only.')
    routeStylesheets = await Promise.all(sources.sort().map(source => context.resolveExistingFile(source)))
  }
  const manifest = await loadWorkspaceManifest(context, options.context)
  const inspectionOptions = {
    manifest: requireWorkspaceManifest(manifest),
    cwd: context.root,
    patterns: options.patterns,
    classes: options.classes,
    includeCss: options.includeCss,
    designSystem: options.designSystem,
    routeStylesheets,
    resolveExistingFile: (filePath: string) => context.resolveExistingFile(filePath),
    validatePatterns: (patterns: readonly string[]) => context.validateGlobPatterns(patterns)
  }
  if (options.includeSnapshot) {
    const { report, snapshot } = await captureMasterCSSProject(inspectionOptions)
    return { ...report, root: context.root, manifest: manifestMetadata(manifest), snapshot }
  }
  const report = await createMasterCSSInspectionReport(inspectionOptions)
  return { ...report, root: context.root, manifest: manifestMetadata(manifest) }
}

export async function renderCSS(context: MasterCSSMCPContext, options: RenderCSSOptions) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  let classes: string[]
  if (options.html) {
    const tooling = createToolingSessionSync({
      manifest: requireWorkspaceManifest(manifest),
      nativeClassNames: manifest.nativeClassNames
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
  const tooling = createMCPToolingSession(requireWorkspaceManifest(manifest), manifest.nativeClassNames)
  let inspections: ReturnType<typeof compactClassInspection>[]
  try { inspections = classes.map(className => compactClassInspection(tooling, className, true)) }
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
    requireWorkspaceManifest(manifest), manifest.nativeClassNames
  )
  try {
    const inspection = session.inspectClassName(options.className)
    const compact = compactClassInspection(
      session,
      options.className,
      true,
      inspection
    )
    return {
      manifest: manifestMetadata(manifest),
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
  // Generated CSS replaces the whole file, and the preview diff shows its current text.
  if (extname(options.outputPath).toLowerCase() !== '.css') throw new Error('outputPath must name a .css file.')
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
