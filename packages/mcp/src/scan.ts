import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import fg from 'fast-glob'
import { inspectMasterCSSClass } from '@master/css-engine/inspect'
import CSSScanner from '@master/css-scanner'
import { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import { parseHTML } from '@master/css-server'
import {
    createExtractedCSSResult,
    registerStyleCSSSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import type MasterCSSMCPContext from './context'
import { getErrorMessage } from './result'
import { loadWorkspaceManifest } from './project'
import type { MasterCSSManifest } from '@master/css-engine'

const DEFAULT_SOURCE_PATTERNS = ['**/*.{html,htm,js,jsx,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export interface ScanProjectOptions {
    patterns?: string[]
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

async function createScanner(context: MasterCSSMCPContext) {
    const manifest = await loadWorkspaceManifest(context)
    const scanner = new CSSScanner(
        manifest.status === 'loaded' ? { manifest: manifest.manifest } : {},
        context.root
    )
    await scanner.init()
    return { scanner, manifest }
}

async function registerManagedStyleSources(context: MasterCSSMCPContext, scanner: CSSScanner) {
    const styleCSSSources: StyleCSSSources = new Map()
    const entries = []
    const errors = []
    for (const entry of await findCSSManifestEntryFiles(context.root)) {
        const filePath = await context.resolveExistingFile(entry)
        try {
            const result = await registerStyleCSSSource(scanner, styleCSSSources, filePath, await readFile(filePath, 'utf8'), {
                projectDir: context.root
            })
            const source = styleCSSSources.get(filePath)
            entries.push({
                filePath,
                masterCSS: Boolean(source?.masterCSS),
                pruneNativeCSS: Boolean(source?.pruneNativeCSS),
                dependencies: [...new Set(source?.dependencies ?? [])],
                sourceDependencies: [...new Set(source?.sourceDependencies ?? [])],
                warnings: result.warnings ?? [],
                errors: []
            })
        } catch (error) {
            entries.push({
                filePath,
                masterCSS: false,
                pruneNativeCSS: false,
                dependencies: [],
                sourceDependencies: [],
                warnings: [],
                errors: [getErrorMessage(error)]
            })
            errors.push({
                filePath,
                message: getErrorMessage(error)
            })
        }
    }
    scanner.resetDependencies = [...new Set(Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies))]
    return { styleCSSSources, entries, errors }
}

export async function scanProject(context: MasterCSSMCPContext, options: ScanProjectOptions = {}) {
    const { scanner, manifest } = await createScanner(context)
    const files = await resolveSourceFiles(context, options.patterns ?? DEFAULT_SOURCE_PATTERNS, options.patterns ? [] : DEFAULT_IGNORE_PATTERNS)
    const firstSourceByInvalidClass = new Map<string, string>()
    for (const filePath of files) {
        const beforeInvalid = new Set(scanner.invalidClasses)
        await scanner.scanModule(filePath, await readFile(filePath, 'utf8'))
        for (const className of scanner.invalidClasses) {
            if (!beforeInvalid.has(className) && !firstSourceByInvalidClass.has(className)) {
                firstSourceByInvalidClass.set(className, filePath)
            }
        }
    }
    const stylesheets = await registerManagedStyleSources(context, scanner)
    const extracted = await createExtractedCSSResult({
        scanner,
        styleCSSSources: stylesheets.styleCSSSources,
        projectDir: context.root
    })
    const diagnostics = [
        ...[...scanner.invalidClasses].sort().map((className) => ({
            code: 'invalid-scanner-class',
            severity: 'warning' as const,
            message: `Scanner candidate "${className}" did not generate Master CSS rules.`,
            filePath: firstSourceByInvalidClass.get(className),
            data: { className }
        })),
        ...stylesheets.errors.map((error) => ({
            code: 'stylesheet-error',
            severity: 'error' as const,
            message: error.message,
            filePath: error.filePath
        }))
    ]

    return {
        root: context.root,
        manifest: {
            status: manifest.status,
            entries: manifest.entries,
            dependencies: manifest.dependencies,
            warnings: manifest.warnings,
            ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        inputs: {
            patterns: options.patterns ?? DEFAULT_SOURCE_PATTERNS,
            files
        },
        scanner: {
            counts: {
                latent: scanner.latentClasses.size,
                valid: scanner.validClasses.size,
                invalid: scanner.invalidClasses.size,
                native: scanner.nativeClassNames.size,
                usedNative: scanner.usedNativeClasses.size
            },
            classes: {
                latent: [...scanner.latentClasses].sort(),
                valid: [...scanner.validClasses].sort(),
                invalid: [...scanner.invalidClasses].sort(),
                native: [...scanner.nativeClassNames].sort(),
                usedNative: [...scanner.usedNativeClasses].sort()
            },
            resetDependencies: scanner.resetDependencies
        },
        stylesheets: {
            entries: stylesheets.entries,
            errors: stylesheets.errors
        },
        css: {
            bytes: extracted.css.length,
            included: Boolean(options.includeCss),
            emittedGlobals: {
                variables: Object.keys(extracted.emittedGlobals.variables).length,
                animations: Object.keys(extracted.emittedGlobals.animations).length
            },
            ...(options.includeCss ? { text: extracted.css } : {})
        },
        diagnostics,
        summary: {
            files: files.length,
            diagnostics: diagnostics.length,
            errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
            warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
        }
    }
}

export async function renderCSS(context: MasterCSSMCPContext, options: RenderCSSOptions) {
    const manifest = await loadWorkspaceManifest(context)
    const css = createCSSWithNativeDeclarations(manifest.status === 'loaded' ? manifest.manifest : defaultManifest)
    const classes = options.html
        ? parseHTML(options.html).classes
        : (options.classList ?? '').split(/\s+/).map((className) => className.trim()).filter(Boolean)
    const invalid: string[] = []
    for (const className of classes) {
        const rules = css.generate(className)
        if (rules.length) {
            for (const rule of rules) rule.layer.insert(rule)
        } else {
            invalid.push(className)
        }
    }
    return {
        manifest: {
            status: manifest.status,
            entries: manifest.entries,
            ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        classes,
        invalid,
        css: {
            bytes: css.text.length,
            text: css.text
        }
    }
}

export async function inspectClass(context: MasterCSSMCPContext, options: InspectClassOptions) {
    const manifest = await loadWorkspaceManifest(context)
    const css = createCSSWithNativeDeclarations(manifest.status === 'loaded' ? manifest.manifest : defaultManifest)
    const inspection = inspectMasterCSSClass(css, options.className, options.mode)
    const rules = inspection.rules.map((rule) => ({
        className: rule.name,
        layer: rule.layerName,
        type: rule.type,
        text: rule.text
    }))
    return {
        manifest: {
            status: manifest.status,
            entries: manifest.entries,
            ...(manifest.status === 'error' ? { error: manifest.error } : {})
        },
        className: options.className,
        mode: options.mode,
        valid: rules.length > 0,
        base: inspection.base,
        suffix: inspection.suffix,
        key: inspection.key,
        value: inspection.value,
        keyToken: inspection.keyToken,
        valueToken: inspection.valueToken,
        stateToken: inspection.stateToken,
        important: inspection.important,
        matcherTypes: inspection.matcherTypes,
        variables: inspection.variableEntries.map(({ key, variable }) => ({ key, variable })),
        rules,
        css: rules.map((rule) => rule.text).join('')
    }
}

export async function previewGeneratedCSS(
    context: MasterCSSMCPContext,
    options: ScanProjectOptions & { outputPath: string, ttlMs?: number }
) {
    const report = await scanProject(context, {
        patterns: options.patterns,
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
