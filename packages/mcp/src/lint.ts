import { readFile } from 'node:fs/promises'
import { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import {
    fixMasterCSSContent,
    lintMasterCSSContent,
    resolveMasterCSSLintRules,
    summarizeMasterCSSLintFiles,
    type MasterCSSLintFileResult,
    type MasterCSSLintRuleId,
    type MasterCSSLintSourceDiagnostic
} from '@master/css-lint'
import type MasterCSSMCPContext from './context'
import { resolveSourceFiles } from './scan'
import { loadWorkspaceManifest } from './project'

const DEFAULT_LINT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php,css,scss,less}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const LINT_REPORT_VERSION = 1

export interface LintProjectOptions {
    patterns?: string[]
    rules?: string
}

export interface LintContentOptions {
    content: string
    filePath: string
    rules?: string
}

export interface PreviewFixesOptions extends LintProjectOptions {
    includeDirectiveFixes?: boolean
    ttlMs?: number
}

type CSSWithNativeDeclarations = ReturnType<typeof createCSSWithNativeDeclarations>

function createManifestDiagnostic(context: MasterCSSMCPContext, message: string): MasterCSSLintSourceDiagnostic {
    const range = { start: 0, end: 0 }
    return {
        ruleId: 'manifest',
        code: 'manifest-loading-error',
        severity: 'error',
        message,
        range,
        loc: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 1 }
        },
        source: 'Master CSS',
        sourceKind: 'manifest',
        data: {
            cwd: context.root
        }
    }
}

async function loadLintState(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
    const rules = resolveMasterCSSLintRules(options.rules)
    const manifest = await loadWorkspaceManifest(context)
    const css = manifest.status === 'loaded'
        ? createCSSWithNativeDeclarations(manifest.manifest)
        : undefined
    const files = await resolveSourceFiles(
        context,
        options.patterns ?? DEFAULT_LINT_SOURCE_PATTERNS,
        options.patterns ? [] : DEFAULT_IGNORE_PATTERNS
    )
    const inputs = await Promise.all(files.map(async (filePath) => ({
        filePath,
        content: await readFile(filePath, 'utf8')
    })))
    return { rules, manifest, css, inputs }
}

function lintInputs(
    inputs: { filePath: string, content: string }[],
    css: CSSWithNativeDeclarations,
    rules: Record<MasterCSSLintRuleId, boolean>
) {
    return inputs.map((input) => lintMasterCSSContent({
        content: input.content,
        filePath: input.filePath,
        css,
        rules
    })).filter((result) => result.diagnostics.length)
}

function createManifestFileResult(context: MasterCSSMCPContext, diagnostic: MasterCSSLintSourceDiagnostic): MasterCSSLintFileResult {
    return {
        filePath: context.root,
        languageId: 'manifest',
        sourceKind: 'manifest',
        diagnostics: [diagnostic]
    }
}

export async function lintProject(context: MasterCSSMCPContext, options: LintProjectOptions = {}) {
    const state = await loadLintState(context, options)
    const files = state.manifest.status === 'error' || !state.css
        ? [createManifestFileResult(context, createManifestDiagnostic(context, `Failed to load Master CSS manifest: ${state.manifest.error}`))]
        : lintInputs(state.inputs, state.css, state.rules)

    return {
        version: LINT_REPORT_VERSION,
        root: context.root,
        manifest: {
            status: state.manifest.status,
            entries: state.manifest.entries,
            diagnostics: state.manifest.status === 'error' ? files[0].diagnostics : []
        },
        files,
        summary: summarizeMasterCSSLintFiles(files)
    }
}

export async function lintContent(context: MasterCSSMCPContext, options: LintContentOptions) {
    const rules = resolveMasterCSSLintRules(options.rules)
    const filePath = context.resolveVirtualPath(options.filePath)
    const manifest = await loadWorkspaceManifest(context)
    const files = manifest.status === 'error'
        ? [createManifestFileResult(context, createManifestDiagnostic(context, `Failed to load Master CSS manifest: ${manifest.error}`))]
        : [lintMasterCSSContent({
            content: options.content,
            filePath,
            css: createCSSWithNativeDeclarations(manifest.manifest),
            rules
        })]

    return {
        version: LINT_REPORT_VERSION,
        root: context.root,
        manifest: {
            status: manifest.status,
            entries: manifest.entries,
            diagnostics: manifest.status === 'error' ? files[0].diagnostics : []
        },
        files,
        summary: summarizeMasterCSSLintFiles(files)
    }
}

export async function previewLintFixes(context: MasterCSSMCPContext, options: PreviewFixesOptions = {}) {
    const state = await loadLintState(context, options)
    if (state.manifest.status === 'error' || !state.css) {
        return {
            mode: 'lint-fixes',
            preview: await context.createPreview([], options.ttlMs),
            lint: await lintProject(context, options)
        }
    }
    const changes = []
    for (const input of state.inputs) {
        const fixed = fixMasterCSSContent({
            content: input.content,
            filePath: input.filePath,
            css: state.css,
            rules: state.rules,
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
        mode: 'lint-fixes',
        preview,
        lint: await lintProject(context, options)
    }
}
