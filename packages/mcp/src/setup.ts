import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import { resolveMasterCSSWorkspacePackages } from '@master/css-project/workspace'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest } from './project'
import { getErrorMessage } from './result'

const SETUP_AUDIT_VERSION = 1

const LOCKFILES: Record<string, string> = {
    pnpm: 'pnpm-lock.yaml',
    npm: 'package-lock.json',
    yarn: 'yarn.lock',
    bun: 'bun.lockb'
}

const MASTER_CSS_PACKAGES = [
    '@master/css',
    '@master/css-cli',
    '@master/css-mcp',
    '@master/css-runtime',
    '@master/css-language-server',
    '@master/css.vite',
    '@master/css.webpack',
    '@master/css.next',
    '@master/css.nuxt',
    '@master/css.astro',
    '@master/css.vue',
    '@master/css.svelte',
    '@master/eslint-plugin-css'
]

const INTEGRATION_PACKAGES = [
    '@master/css-cli',
    '@master/css.vite',
    '@master/css.webpack',
    '@master/css.next',
    '@master/css.nuxt',
    '@master/css.astro',
    '@master/css.vue',
    '@master/css.svelte',
    '@master/eslint-plugin-css'
]

interface PackageJSON {
    packageManager?: unknown
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    scripts?: Record<string, string>
}

type SetupDiagnosticSeverity = 'error' | 'warning' | 'info'

interface SetupDiagnostic {
    code: string
    severity: SetupDiagnosticSeverity
    message: string
    data?: unknown
}

function getDependencies(packageJSON: PackageJSON | undefined) {
    return {
        ...packageJSON?.dependencies,
        ...packageJSON?.devDependencies,
        ...packageJSON?.peerDependencies,
        ...packageJSON?.optionalDependencies
    }
}

async function readPackageJSON(context: MasterCSSMCPContext) {
    const filePath = join(context.root, 'package.json')
    try {
        return {
            filePath,
            value: JSON.parse(await readFile(filePath, 'utf8')) as PackageJSON
        }
    } catch (error) {
        return {
            filePath,
            error: getErrorMessage(error)
        }
    }
}

function detectPackageManager(context: MasterCSSMCPContext, packageJSON: PackageJSON | undefined) {
    const lockfiles = Object.entries(LOCKFILES)
        .filter(([, filename]) => existsSync(join(context.root, filename)))
        .map(([name, filename]) => ({ name, filePath: join(context.root, filename) }))
    const declared = typeof packageJSON?.packageManager === 'string'
        ? packageJSON.packageManager
        : undefined
    return {
        declared,
        lockfiles,
        inferred: declared?.split('@')[0] || lockfiles[0]?.name || 'unknown'
    }
}

function detectDeclaredPackages(packageJSON: PackageJSON | undefined) {
    const dependencies = getDependencies(packageJSON)
    return MASTER_CSS_PACKAGES
        .filter((name) => dependencies[name])
        .map((name) => ({
            name,
            version: dependencies[name]
        }))
}

function detectIntegrations(packageJSON: PackageJSON | undefined) {
    const dependencies = getDependencies(packageJSON)
    const scripts = packageJSON?.scripts || {}
    const packages = INTEGRATION_PACKAGES
        .filter((name) => dependencies[name])
        .map((name) => ({
            type: 'package' as const,
            name,
            version: dependencies[name]
        }))
    const scriptHints = Object.entries(scripts)
        .filter(([, script]) => /master-css|@master\/css|mcss/.test(script))
        .map(([name, script]) => ({
            type: 'script' as const,
            name,
            command: script
        }))
    return [...packages, ...scriptHints]
}

function pushDiagnostic(diagnostics: SetupDiagnostic[], severity: SetupDiagnosticSeverity, code: string, message: string, data?: unknown) {
    diagnostics.push({
        code,
        severity,
        message,
        ...(data ? { data } : {})
    })
}

function resolveStatus(diagnostics: SetupDiagnostic[]) {
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) return 'error'
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'warning')) return 'warning'
    return 'ok'
}

export async function auditSetup(context: MasterCSSMCPContext) {
    const [packageJSONResult, manifest, discoveredEntries] = await Promise.all([
        readPackageJSON(context),
        loadWorkspaceManifest(context),
        findCSSManifestEntryFiles(context.root).catch(() => [])
    ])
    const packageJSON = packageJSONResult.value
    const packageManager = detectPackageManager(context, packageJSON)
    const declaredPackages = detectDeclaredPackages(packageJSON)
    const integrations = detectIntegrations(packageJSON)
    const resolvedPackages = resolveMasterCSSWorkspacePackages(context.root)
    const diagnostics: SetupDiagnostic[] = []

    if (!packageJSON) {
        pushDiagnostic(diagnostics, 'warning', 'package-json-unreadable', `Unable to read package.json: ${packageJSONResult.error}`, {
            filePath: packageJSONResult.filePath
        })
    }

    if (!declaredPackages.some((pkg) => pkg.name === '@master/css')) {
        pushDiagnostic(diagnostics, 'warning', 'missing-master-css-package', 'package.json does not declare @master/css.')
    }

    if (!resolvedPackages.css) {
        pushDiagnostic(diagnostics, 'error', 'unresolved-master-css-package', 'The @master/css package could not be resolved from this workspace.', {
            errors: resolvedPackages.errors
        })
    }

    if (!manifest.entries.length && !discoveredEntries.length) {
        pushDiagnostic(diagnostics, 'error', 'missing-manifest-entry', 'No Master CSS entry stylesheet was discovered.')
    }

    if (manifest.status === 'error') {
        pushDiagnostic(diagnostics, 'error', 'manifest-load-error', `Failed to load the Master CSS manifest: ${manifest.error}`)
    }

    for (const warning of manifest.warnings) {
        pushDiagnostic(diagnostics, 'warning', 'manifest-warning', warning)
    }

    for (const error of resolvedPackages.errors) {
        if (error.name === '@master/css') continue
        pushDiagnostic(diagnostics, 'info', 'package-resolution-info', error.message, {
            packageName: error.name
        })
    }

    if (!integrations.length) {
        pushDiagnostic(diagnostics, 'info', 'no-integration-hint', 'No Master CSS CLI, framework integration, or ESLint package was detected in package.json.')
    }

    const status = resolveStatus(diagnostics)
    return {
        version: SETUP_AUDIT_VERSION,
        root: context.root,
        status,
        packageManager,
        packageJSON: {
            filePath: packageJSONResult.filePath,
            loaded: Boolean(packageJSON),
            ...(packageJSONResult.error ? { error: packageJSONResult.error } : {})
        },
        packages: {
            declared: declaredPackages,
            resolved: resolvedPackages
        },
        integrations,
        manifest: {
            status: manifest.status,
            entries: manifest.entries.length ? manifest.entries : discoveredEntries,
            dependencies: manifest.dependencies,
            warnings: manifest.warnings,
            ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        diagnostics,
        summary: {
            status,
            entries: (manifest.entries.length ? manifest.entries : discoveredEntries).length,
            declaredPackages: declaredPackages.length,
            integrations: integrations.length,
            errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
            warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
            info: diagnostics.filter((diagnostic) => diagnostic.severity === 'info').length
        }
    }
}
