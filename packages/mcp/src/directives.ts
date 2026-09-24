import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import {
  compileManifestFileSync,
  compileManifestSync,
  inspectCSSSync,
  type MasterCSSCompileManifestResult
} from '@master/css-compiler/node'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument } from './document'
import { summarizeManifest } from './manifest-summary'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, manifestFingerprint, type SemanticContext } from './project'

const DIRECTIVE_INSPECTION_VERSION = 1

export interface InspectDirectivesOptions {
  context?: SemanticContext
  content?: string
  filePath?: string
  entryPath?: string
  preserveNativeCSS?: boolean
}

function createDirectiveEntries(content: string, filePath: string) {
  const document = createMCPTextDocument(filePath, content)
  return inspectCSSSync(content).directives.map((directive) => ({
    name: directive.name,
    range: directive.range,
    loc: {
      start: document.positionAt(directive.range.start),
      end: document.positionAt(directive.range.end)
    },
    prelude: content.slice(directive.preludeRange.start, directive.preludeRange.end).trim(),
    hasBlock: directive.hasBlock,
    quotedStrings: directive.quotedStrings
  }))
}

function summarizeCompileResult(result: MasterCSSCompileManifestResult) {
  const warnings = result.diagnostics
    .filter((diagnostic) => diagnostic.severity === 'warning')
    .map((diagnostic) => diagnostic.message)
  return {
    manifest: summarizeManifest(result.manifest),
    directives: {
      manifestInput: result.directiveSummary.manifestInput,
      classNames: result.classNames,
      nativeClassNames: result.nativeClassNames,
      styleDefinitions: result.directiveSummary.styleDefinitions,
      extractionPolicy: result.directiveSummary.extractionPolicy
    },
    css: {
      bytes: Buffer.byteLength(result.css, 'utf8'),
      nativeBytes: Buffer.byteLength(result.nativeCSS, 'utf8'),
      generatedBytes: Buffer.byteLength(result.generatedCSS, 'utf8')
    },
    dependencies: result.dependencies,
    warnings,
    diagnostics: result.diagnostics
  }
}

async function compileDirectives(context: MasterCSSMCPContext, options: InspectDirectivesOptions) {
  const manifest = await loadWorkspaceManifest(context, options.context, options.entryPath ? [await context.resolveExistingFile(options.entryPath)] : undefined)
  const baseManifest = requireWorkspaceManifest(manifest)
  if (options.entryPath) {
    const filePath = await context.resolveExistingFile(options.entryPath)
    const [content, result] = await Promise.all([
      readFile(filePath, 'utf8'),
      Promise.resolve(compileManifestFileSync(filePath, {
        root: context.root,
        baseManifest,
        preserveNativeCSS: options.preserveNativeCSS
      }))
    ])
    return { filePath, content, result, context: manifestMetadata(manifest) }
  }

  if (options.content === undefined) {
    throw new Error('Either entryPath or content is required.')
  }

  const filePath = context.resolveVirtualPath(options.filePath || 'master.css')
  const result = compileManifestSync(options.content, {
    baseManifest,
    from: filePath,
    preserveNativeCSS: options.preserveNativeCSS
  })
  return {
    filePath,
    content: options.content,
    context: manifestMetadata(manifest),
    result
  }
}

export async function inspectDirectives(context: MasterCSSMCPContext, options: InspectDirectivesOptions) {
    const compiled = await compileDirectives(context, options)
    const inspection = summarizeCompileResult(compiled.result)
    const directiveEntries = createDirectiveEntries(compiled.content, compiled.filePath)
    return {
      version: DIRECTIVE_INSPECTION_VERSION,
      root: context.root,
      context: compiled.context,
      status: inspection.warnings.length ? 'warning' : 'ok',
      input: {
        filePath: compiled.filePath,
        name: basename(compiled.filePath),
        mode: options.entryPath ? 'entry' : 'content'
      },
      directiveEntries,
      ...inspection,
      manifest: { ...inspection.manifest, fingerprint: manifestFingerprint(compiled.result.manifest), languageVersion: compiled.result.manifest.languageVersion },
      diagnostics: inspection.diagnostics,
      summary: {
        status: inspection.warnings.length ? 'warning' : 'ok',
        directives: directiveEntries.length,
        classNames: inspection.directives.classNames.length,
        nativeClassNames: inspection.directives.nativeClassNames.length,
        dependencies: inspection.dependencies.length,
        warnings: inspection.warnings.length,
        cssBytes: inspection.css.bytes
      }
    }
}
