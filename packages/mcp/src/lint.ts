import { readFile } from 'node:fs/promises'
import {
  fixMasterCSSContent,
  lintMasterCSSContent,
  resolveMasterCSSLintRules,
  summarizeMasterCSSLintFiles,
  type MasterCSSLintRuleId
} from '@master/css-tooling/lint'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type MasterCSSMCPContext from './context'
import { resolveSourceFiles } from './scan'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'

const DEFAULT_LINT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php,css,scss,less}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const LINT_REPORT_VERSION = 2

export interface LintProjectOptions {
  context?: SemanticContext
  patterns?: string[]
  rules?: string
}

export interface LintContentOptions {
  context?: SemanticContext
  content: string
  filePath: string
  rules?: string
}

export interface PreviewFixesOptions extends LintProjectOptions {
  includeDirectiveFixes?: boolean
  ttlMs?: number
}

async function loadLintState(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
  const rules = resolveMasterCSSLintRules(options.rules)
  const manifest = await loadWorkspaceManifest(context, options.context)
  const lintSession = createToolingSessionSync({ manifest: requireWorkspaceManifest(manifest) })
  const files = await resolveSourceFiles(
    context,
    options.patterns ?? DEFAULT_LINT_SOURCE_PATTERNS,
    options.patterns ? [] : DEFAULT_IGNORE_PATTERNS
  )
  const inputs = await Promise.all(files.map(async (filePath) => ({
    filePath,
    content: await readFile(filePath, 'utf8')
  })))
  return { rules, manifest, lintSession, inputs }
}

function lintInputs(
  inputs: { filePath: string, content: string }[],
  rules: Record<MasterCSSLintRuleId, boolean>,
  lintSession: MasterCSSToolingSession
) {
  return inputs.map((input) => lintMasterCSSContent({
    content: input.content,
    filePath: input.filePath,
    rules,
    lintSession
  })).filter((result) => result.diagnostics.length)
}

export async function lintProject(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
  const state = await loadLintState(context, options)
  try {
    const files = lintInputs(state.inputs, state.rules, state.lintSession)

    return {
      version: LINT_REPORT_VERSION,
      root: context.root,
      manifest: manifestMetadata(state.manifest),
      files,
      diagnostics: files.flatMap(file => file.diagnostics),
      summary: summarizeMasterCSSLintFiles(files)
    }
  } finally {
    state.lintSession?.dispose()
  }
}

export async function lintContent(context: MasterCSSMCPContext, options: LintContentOptions) {
  const rules = resolveMasterCSSLintRules(options.rules)
  const filePath = context.resolveVirtualPath(options.filePath)
  const manifest = await loadWorkspaceManifest(context, options.context)
  const lintSession = createToolingSessionSync({ manifest: requireWorkspaceManifest(manifest) })
  try {
    const files = [lintMasterCSSContent({ content: options.content, filePath, rules, lintSession })]

    return {
      version: LINT_REPORT_VERSION,
      root: context.root,
      manifest: manifestMetadata(manifest),
      files,
      diagnostics: files.flatMap(file => file.diagnostics),
      summary: summarizeMasterCSSLintFiles(files)
    }
  } finally {
    lintSession?.dispose()
  }
}

export async function previewLintFixes(context: MasterCSSMCPContext, options: PreviewFixesOptions = {}) {
  const state = await loadLintState(context, options)
  try {
    const changes = []
    for (const input of state.inputs) {
      const fixed = fixMasterCSSContent({
        content: input.content,
        filePath: input.filePath,
        rules: state.rules,
        lintSession: state.lintSession,
        includeDirectiveFixes: Boolean(options.includeDirectiveFixes)
      })
      if (fixed !== input.content) {
        changes.push({
          filePath: input.filePath,
          beforeText: input.content,
          afterText: fixed
        })
      }
    }
    const preview = await context.createPreview(changes, options.ttlMs)
    return {
      manifest: manifestMetadata(state.manifest),
      mode: 'lint-fixes',
      preview,
      lint: await lintProject(context, options)
    }
  } finally {
    state.lintSession?.dispose()
  }
}
