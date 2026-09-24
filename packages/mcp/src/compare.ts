import { renderClassNamesSync } from '@master/css/node'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument } from './document'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import { createMCPToolingSession, compactClassInspection } from './tooling-session'

const CSS_COMPARE_VERSION = 2

export interface CompareCSSOptions {
  context?: SemanticContext
  beforeClassList?: string
  afterClassList?: string
  beforeHtml?: string
  afterHtml?: string
  beforeContent?: string
  afterContent?: string
  filePath?: string
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function splitClassList(value: string | undefined) {
  return unique((value ?? '').split(/\s+/).map((className) => className.trim()).filter(Boolean))
}

function extractContentClasses(
  content: string | undefined,
  filePath: string,
  session: MasterCSSToolingSession
) {
  if (content === undefined) return []
  const document = createMCPTextDocument(filePath, content)
  return unique(
    session.analyzeDocument({
      source: content,
      languageId: document.languageId
    }).classPositions.map((position) => position.token)
  )
}

function resolveClasses(
  options: CompareCSSOptions,
  side: 'before' | 'after',
  filePath: string,
  session: MasterCSSToolingSession
) {
  const classList = side === 'before' ? options.beforeClassList : options.afterClassList
  const html = side === 'before' ? options.beforeHtml : options.afterHtml
  const content = side === 'before' ? options.beforeContent : options.afterContent
  if (classList !== undefined) return splitClassList(classList)
  if (html !== undefined) {
    return unique(session.extractSource({
      files: [{ source: filePath, content: html, kind: 'html' }]
    }).files[0]?.candidates ?? [])
  }
  return extractContentClasses(content, filePath, session)
}

function renderClasses(manifest: MasterCSSManifest, classes: string[]) {
  const rendered = renderClassNamesSync(classes, {
    manifest
  })
  return {
    text: rendered.cssText,
    bytes: Buffer.byteLength(rendered.cssText, 'utf8'),
    invalid: [...rendered.invalidClassNames]
  }
}

function diffValues(before: string[], after: string[]) {
  return {
    added: after.filter((value) => !before.includes(value)),
    removed: before.filter((value) => !after.includes(value)),
    unchanged: after.filter((value) => before.includes(value))
  }
}

function splitRules(css: string) {
  return css.split(/(?<=})/).map((rule) => rule.trim()).filter(Boolean)
}

function createTextDiff(before: string, after: string) {
  if (before === after) return ''
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  return [
    '--- before.css',
    '+++ after.css',
    '@@',
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`)
  ].join('\n')
}

export async function compareCSS(context: MasterCSSMCPContext, options: CompareCSSOptions) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  const filePath = context.resolveVirtualPath(options.filePath || 'index.html')
  const activeManifest = requireWorkspaceManifest(manifest)
  const session = createMCPToolingSession(activeManifest)
  try {
    const beforeClasses = resolveClasses(options, 'before', filePath, session)
    const afterClasses = resolveClasses(options, 'after', filePath, session)
    const before = renderClasses(activeManifest, beforeClasses)
    const after = renderClasses(activeManifest, afterClasses)
    const inspections = {
      before: beforeClasses.map(name => compactClassInspection(session, name, undefined, true)),
      after: afterClasses.map(name => compactClassInspection(session, name, undefined, true))
    }
    const classDiff = diffValues(beforeClasses, afterClasses)
    const beforeRules = splitRules(before.text)
    const afterRules = splitRules(after.text)
    const ruleDiff = diffValues(beforeRules, afterRules)
    return {
      version: CSS_COMPARE_VERSION,
      root: context.root,
      manifest: manifestMetadata(manifest),
      inspections,
      diagnostics: [...inspections.before, ...inspections.after].flatMap(inspection => inspection.diagnostics ?? []),
      inputs: {
        filePath,
        before: {
          classes: beforeClasses.length,
          invalid: before.invalid.length
        },
        after: {
          classes: afterClasses.length,
          invalid: after.invalid.length
        }
      },
      classes: classDiff,
      invalid: {
        before: before.invalid,
        after: after.invalid,
        added: after.invalid.filter((className) => !before.invalid.includes(className)),
        removed: before.invalid.filter((className) => !after.invalid.includes(className))
      },
      css: {
        changed: before.text !== after.text,
        before: {
          bytes: before.bytes,
          text: before.text
        },
        after: {
          bytes: after.bytes,
          text: after.text
        },
        bytesDelta: after.bytes - before.bytes,
        diff: createTextDiff(before.text, after.text)
      },
      rules: {
        added: ruleDiff.added,
        removed: ruleDiff.removed,
        unchanged: ruleDiff.unchanged.length
      },
      summary: {
        changed: before.text !== after.text,
        addedClasses: classDiff.added.length,
        removedClasses: classDiff.removed.length,
        addedRules: ruleDiff.added.length,
        removedRules: ruleDiff.removed.length,
        bytesDelta: after.bytes - before.bytes
      }
    }
  } finally {
    session.dispose?.()
  }
}
