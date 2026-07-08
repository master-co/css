import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { collectCSSDirectiveRanges } from '@master/css-lexer'
import {
  compileCSSManifest,
  compileCSSManifestFile,
  type CompileCSSManifestResult
} from '@master/css-compiler'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument } from './document'
import { summarizeManifest } from './manifest-summary'
import { getErrorMessage } from './result'

const DIRECTIVE_INSPECTION_VERSION = 1

export interface InspectDirectivesOptions {
  content?: string
  filePath?: string
  entryPath?: string
  preserveNativeCSS?: boolean
}

function createDirectiveEntries(content: string, filePath: string) {
  const document = createMCPTextDocument(filePath, content)
  return collectCSSDirectiveRanges(content).map((directive) => ({
    name: directive.name,
    range: {
      start: directive.start,
      end: directive.end
    },
    loc: {
      start: document.positionAt(directive.start),
      end: document.positionAt(directive.end)
    },
    prelude: content.slice(directive.preludeRange.start, directive.preludeRange.end).trim(),
    hasBlock: Boolean(directive.blockRange),
    quotedStrings: directive.quotedStringRanges.length
  }))
}

function countObjectKeys(value: unknown) {
  return value && typeof value === 'object' ? Object.keys(value).length : 0
}

function summarizeManifestInput(input: unknown) {
  const manifestInput = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  return {
    keys: Object.keys(manifestInput),
    counts: {
      settings: countObjectKeys(manifestInput.settings),
      variables: countObjectKeys(manifestInput.variables),
      utilities: Array.isArray(manifestInput.utilities) ? manifestInput.utilities.length : countObjectKeys(manifestInput.utilities),
      variants: Array.isArray(manifestInput.variants) ? manifestInput.variants.length : countObjectKeys(manifestInput.variants),
      atRules: countObjectKeys(manifestInput.atRules),
      selectors: countObjectKeys(manifestInput.selectors),
      animations: countObjectKeys(manifestInput.animations)
    }
  }
}

function summarizeCompileResult(result: CompileCSSManifestResult) {
  const styleDefinitions = (result.directives as { styleDefinitions?: unknown[] }).styleDefinitions ?? []
  return {
    manifest: summarizeManifest(result.manifest),
    directives: {
      manifestInput: summarizeManifestInput(result.directives.manifestInput),
      classNames: result.classNames,
      nativeClassNames: result.nativeClassNames,
      styleDefinitions: styleDefinitions.length,
      extractionPolicy: result.extractionPolicy
    },
    css: {
      bytes: result.css.length,
      nativeBytes: result.nativeCSS.length,
      generatedBytes: result.generatedCSS.length
    },
    dependencies: result.dependencies,
    warnings: result.warnings
  }
}

async function compileDirectives(context: MasterCSSMCPContext, options: InspectDirectivesOptions) {
  if (options.entryPath) {
    const filePath = await context.resolveExistingFile(options.entryPath)
    const [content, result] = await Promise.all([
      readFile(filePath, 'utf8'),
      Promise.resolve(compileCSSManifestFile(filePath, {
        root: context.root,
        preserveNativeCSS: options.preserveNativeCSS
      }))
    ])
    return { filePath, content, result }
  }

  if (options.content === undefined) {
    throw new Error('Either entryPath or content is required.')
  }

  const filePath = context.resolveVirtualPath(options.filePath || 'master.css')
  const result = compileCSSManifest(options.content, {
    root: context.root,
    from: filePath,
    preserveNativeCSS: options.preserveNativeCSS
  })
  return {
    filePath,
    content: options.content,
    result
  }
}

export async function inspectDirectives(context: MasterCSSMCPContext, options: InspectDirectivesOptions) {
  try {
    const compiled = await compileDirectives(context, options)
    const inspection = summarizeCompileResult(compiled.result)
    const directiveEntries = createDirectiveEntries(compiled.content, compiled.filePath)
    return {
      version: DIRECTIVE_INSPECTION_VERSION,
      root: context.root,
      status: inspection.warnings.length ? 'warning' : 'ok',
      input: {
        filePath: compiled.filePath,
        name: basename(compiled.filePath),
        mode: options.entryPath ? 'entry' : 'content'
      },
      directiveEntries,
      ...inspection,
      diagnostics: inspection.warnings.map((warning) => ({
        code: 'compiler-warning',
        severity: 'warning' as const,
        message: warning,
        source: 'Master CSS',
        sourceKind: 'directive',
        filePath: compiled.filePath
      })),
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
  } catch (error) {
    const filePath = options.entryPath || options.filePath || 'master.css'
    return {
      version: DIRECTIVE_INSPECTION_VERSION,
      root: context.root,
      status: 'error',
      input: {
        filePath,
        mode: options.entryPath ? 'entry' : 'content'
      },
      directiveEntries: options.content ? createDirectiveEntries(options.content, context.resolveVirtualPath(options.filePath || 'master.css')) : [],
      diagnostics: [
        {
          code: 'directive-inspection-error',
          severity: 'error' as const,
          message: getErrorMessage(error),
          source: 'Master CSS',
          sourceKind: 'directive',
          filePath
        }
      ],
      summary: {
        status: 'error',
        directives: 0,
        classNames: 0,
        nativeClassNames: 0,
        dependencies: 0,
        warnings: 0,
        errors: 1,
        cssBytes: 0
      }
    }
  }
}
