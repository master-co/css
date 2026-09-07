import { createRequire } from 'node:module'
import { renderClassNamesSync } from '@master/css/node'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { supportsNativeDeclaration } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { createMCPTextDocument } from './document'
import { loadWorkspaceManifest } from './project'
import { createMCPToolingSession } from './tooling-session'

const CSS_COMPARE_VERSION = 1
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export interface CompareCSSOptions {
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
    manifest,
    supportsNativeDeclaration: supportsNativeDeclaration
  })
  return {
    text: rendered.cssText,
    bytes: rendered.cssText.length,
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
  const manifest = await loadWorkspaceManifest(context)
  const filePath = context.resolveVirtualPath(options.filePath || 'index.html')
  const activeManifest = manifest.status === 'loaded' ? manifest.manifest : defaultManifest
  const session = createMCPToolingSession(activeManifest)
  try {
    const beforeClasses = resolveClasses(options, 'before', filePath, session)
    const afterClasses = resolveClasses(options, 'after', filePath, session)
    const before = renderClasses(activeManifest, beforeClasses)
    const after = renderClasses(activeManifest, afterClasses)
    const classDiff = diffValues(beforeClasses, afterClasses)
    const beforeRules = splitRules(before.text)
    const afterRules = splitRules(after.text)
    const ruleDiff = diffValues(beforeRules, afterRules)
    return {
      version: CSS_COMPARE_VERSION,
      root: context.root,
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        ...(manifest.status === 'error' ? { error: manifest.error } : {})
      },
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
