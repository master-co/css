import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import fg from 'fast-glob'
import { createMasterCSSInspectionReport } from '@master/css-diagnostics'
import { createServerCSS, parseHTML } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest } from './project'
import { compactRustClassInspection, createMCPRustLanguageSession } from './rust-language'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export interface ScanProjectOptions {
  patterns?: string[]
  classes?: string[]
  includeCss?: boolean
}

export interface RenderCSSOptions {
  html?: string
  classList?: string
}

export interface InspectClassOptions {
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
  const [report, manifest] = await Promise.all([
    createMasterCSSInspectionReport({
      cwd: context.root,
      patterns: options.patterns,
      classes: options.classes,
      includeCss: options.includeCss,
      resolveExistingFile: (filePath) => context.resolveExistingFile(filePath),
      validatePatterns: (patterns) => context.validateGlobPatterns(patterns)
    }),
    loadWorkspaceManifest(context)
  ])
  return {
    ...report,
    root: context.root,
    manifest: {
      status: manifest.status,
      entries: manifest.entries,
      dependencies: manifest.dependencies,
      warnings: manifest.warnings,
      ...(manifest.status === 'error' ? { error: manifest.error } : {})
    }
  }
}

export async function renderCSS(context: MasterCSSMCPContext, options: RenderCSSOptions) {
  const manifest = await loadWorkspaceManifest(context)
  const classes = options.html
    ? parseHTML(options.html).classes
    : (options.classList ?? '').split(/\s+/).map((className) => className.trim()).filter(Boolean)
  const css = createServerCSS(manifest.status === 'loaded' ? manifest.manifest : defaultManifest)
  try {
    css.ensureClassRules(...classes)
    const text = css.text
    return {
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        ...(manifest.status === 'error' ? { error: manifest.error } : {})
      },
      classes,
      invalid: classes.filter((className) => !css.classUtilities.has(className)),
      css: {
        bytes: text.length,
        text
      }
    }
  } finally {
    css.dispose()
  }
}

export async function inspectClass(context: MasterCSSMCPContext, options: InspectClassOptions) {
  const manifest = await loadWorkspaceManifest(context)
  const session = await createMCPRustLanguageSession(
    manifest.status === 'loaded' ? manifest.manifest : defaultManifest
  )
  try {
    const inspection = session.inspectClassName(options.className, options.mode)
    const compact = compactRustClassInspection(
      session,
      options.className,
      options.mode,
      true,
      inspection
    )
    return {
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        ...(manifest.status === 'error' ? { error: manifest.error } : {})
      },
      className: options.className,
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
    includeCss: true
  })
  const preview = await context.createPreview([
    {
      filePath: resolve(context.root, options.outputPath),
      afterText: report.css.text ?? ''
    }
  ], options.ttlMs)
  return {
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
