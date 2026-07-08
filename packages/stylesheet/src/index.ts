import {
    compileCSS,
    createManifestFromCSSResult,
    type CompileCSSOptions,
    type CompileCSSResult
} from '@master/css-compiler'
import {
    isMasterCSSPackageStyleFile as isMasterCSSCompilerPackageStyleFile,
    resolveMasterCSSPackageImportGraph
} from '@master/css-compiler'
import type { MasterCSSEmittedGlobals } from '@master/css'
import type { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderCompiledManifestCSS, type RenderCompiledManifestCSSResult } from './render'
import {
    findCSSImportStatements,
    collectCSSDirectiveRanges,
    createMasterCSSManifestEntryPattern,
    hasMasterCSSImport,
    hasMasterCSSManifestEntrypoint,
    isMasterCSSModuleId as isMasterCSSManifestModuleId,
    MASTER_CSS_ENTRY_DIRECTIVE_NAME,
    normalizeMasterCSSModuleIds,
    parseCSSImportSource
} from '@master/css-lexer'
import { extractClassCandidates } from '@master/css-source'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import {
    collectStylesheetDirectivesFromCSSGraph,
    createStylesheetDirectives,
    findStylesheetDirectiveStatements,
    hasStylesheetDirectives,
    hasStylesheetSourceDirectives,
    mergeStylesheetSourceOptions,
    removeStylesheetDirectiveStatements,
    resolveStylesheetSourcePaths,
    type StylesheetDirectives,
    type StylesheetSourceOptions
} from './directives'
import { filterExcludedClasses } from './class-exclusion'

export * from './directives'
export { collectCSSVariableReferences } from './render'

export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/

const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

export interface SassModule {
    compileStringAsync(source: string, options: {
        url: URL
        style: 'expanded'
        syntax: 'scss' | 'indented'
    }): Promise<{ css: string }>
}

export interface CompileStyleCSSOptions extends CompileCSSOptions {
    baseManifest?: MasterCSSManifest
    projectDir?: string
    loadSass?: (projectDir?: string) => SassModule
}

export interface CompileRenderedStyleCSSResult extends CompileCSSResult {
    emittedGlobals: Required<MasterCSSEmittedGlobals>
    manifest: MasterCSSManifest
    renderedCSS: RenderCompiledManifestCSSResult
}

export interface TransformLocalStyleCSSResult {
    code: string
    dependencies: string[]
    transformed: boolean
    result?: CompileCSSResult
}

export interface TransformLocalStyleCSSOptions extends CompileStyleCSSOptions {
    emittedGlobals?: MasterCSSEmittedGlobals
}

export type RegisterStyleCSSSourceOptions = CompileStyleCSSOptions

export type CreateStyleEntryEmittedGlobalsOptions = CompileStyleCSSOptions

export interface CreateStyleEntryEmittedGlobalsResult {
    emittedGlobals: Required<MasterCSSEmittedGlobals>
    dependencies: string[]
}

export interface CreateExtractedCSSOptions extends CompileStyleCSSOptions {
    scanner: ScannerState
    styleCSSSources?: StyleCSSSources
    manifest?: MasterCSSManifest
    includeGeneratedCSS?: boolean
    includeNativeCSS?: boolean
    includeMasterBaseCSS?: boolean
}

export interface CreateExtractedCSSResult {
    css: string
    emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export type StylesheetCSS = ReturnType<typeof createCSSWithNativeDeclarations>

export interface ScannerState {
    cwd: string
    options: StylesheetSourceOptions
    customOptions?: {
        manifest?: MasterCSSManifest
    }
    css: StylesheetCSS
    latentClasses: Set<string>
    validClasses: Set<string>
    usedNativeClasses: Set<string>
    nativeClassNames: Set<string>
    emit?: (event: 'change') => unknown
}

export interface StyleCSSSource {
    source: string
    pruneNativeCSS: boolean
    masterCSS: boolean
    directives: StylesheetDirectives
    dependencies: string[]
    sourceDependencies: string[]
}

export type StyleCSSSources = Map<string, StyleCSSSource>

export interface ResolvedStyleCSSSource {
    source: string
    dependencies: string[]
}

export interface ResolveStyleCSSImportGraphOptions {
    expandMasterCSSPackage?: boolean
}

export interface CreateStyleCSSHostSourceOptions {
    masterImport?: string
    masterSource?: string
}

interface DefaultMasterCSSPackageArtifact {
    manifest: MasterCSSManifest
    nativeCSS: string
    dependencies: string[]
}

const DEFAULT_PRESET_SOURCE_FILES = [
    'index.css',
    'base.css',
    'theme.css',
    'variants.css',
    'utilities.css'
]

function defaultLoadSass(projectDir?: string): SassModule {
    if (projectDir) {
        try {
            return createRequire(join(projectDir, 'package.json'))('sass') as SassModule
        } catch {
            // Fall through to this package's dependency graph for tests and linked workspaces.
        }
    }
    return require('sass') as SassModule
}

export function normalizeStyleCSSModuleIds() {
    return normalizeMasterCSSModuleIds()
}

export function createStyleCSSImportPattern() {
    return createMasterCSSManifestEntryPattern()
}

export function createMasterStyleCSSPattern() {
    return createStyleCSSImportPattern()
}

export function cleanStyleRequest(id: string) {
    return id.replace(/[?#].*$/, '')
}

function getStyleRequestSearchParams(id: string) {
    const queryStart = id.indexOf('?')
    return queryStart === -1 ? new URLSearchParams() : new URLSearchParams(id.slice(queryStart + 1))
}

function getStyleRequestExtension(id: string) {
    const cleanExtension = extname(cleanStyleRequest(id))
    if (cleanExtension === '.css' || cleanExtension === '.scss' || cleanExtension === '.sass') {
        return cleanExtension
    }
    const lang = getStyleRequestSearchParams(id).get('lang')
    if (lang === 'css' || lang === 'scss' || lang === 'sass') {
        return '.' + lang
    }
    return cleanExtension
}

function isStyleModuleRequest(source: string) {
    return getStyleRequestSearchParams(source).get('type') === 'style'
}

export function isStyleCSSRequest(id: string) {
    return STYLE_CSS_REQUEST_RE.test(id) || (isStyleModuleRequest(id) && ['.css', '.scss', '.sass'].includes(getStyleRequestExtension(id)))
}

export function replaceStyleCSSImports(source: string, replacement: string) {
    let replaced = false
    const ids = new Set([
        ...normalizeStyleCSSModuleIds(),
        VIRTUAL_CSS_ID
    ])
    const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (!ids.has(id)) return rule
        replaced = true
        return replacement
    })
    return { code, replaced }
}

function isExpandableStyleImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function findImportStatements(source: string) {
    return findCSSImportStatements(source)
}

function resolveStyleCSSImportGraphFile(
    file: string,
    source: string,
    dependencies: string[],
    dependencySet: Set<string>,
    stack: string[],
    projectDir?: string,
    options: ResolveStyleCSSImportGraphOptions = {}
): string {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    const imports = findImportStatements(source)
    if (!imports.length) return source

    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        const importSource = parseCSSImportSource(importStatement.statement)
        const packageGraph = options.expandMasterCSSPackage !== false && importSource && isMasterCSSManifestModuleId(importSource)
            ? resolveMasterCSSPackageImportGraph(projectDir)
            : undefined
        if (packageGraph) {
            for (const dependency of packageGraph.dependencies) {
                if (!dependencySet.has(dependency)) {
                    dependencySet.add(dependency)
                    dependencies.push(dependency)
                }
            }
            output += packageGraph.source
        } else if (importSource && isExpandableStyleImportSource(importSource)) {
            const importedFile = resolve(dirname(absoluteFile), importSource)
            if (!existsSync(importedFile)) {
                throw new Error(`CSS file not found: ${importedFile}`)
            }
            output += resolveStyleCSSImportGraphFile(
                importedFile,
                readFileSync(importedFile, 'utf-8'),
                dependencies,
                dependencySet,
                [...stack, absoluteFile],
                projectDir,
                options
            )
        } else {
            output += importStatement.statement
        }
        index = importStatement.end
    }
    return output + source.slice(index)
}

export function resolveStyleCSSImportGraph(
    file: string,
    source: string,
    projectDir?: string,
    options: ResolveStyleCSSImportGraphOptions = {}
): ResolvedStyleCSSSource {
    const dependencies: string[] = []
    if (!STYLE_CSS_REQUEST_RE.test(cleanStyleRequest(file))) {
        return {
            source,
            dependencies: [cleanStyleRequest(file)]
        }
    }
    return {
        source: resolveStyleCSSImportGraphFile(cleanStyleRequest(file), source, dependencies, new Set(), [], projectDir, options),
        dependencies
    }
}

export function collectStyleCSSDependencies(
    file: string,
    source?: string,
    projectDir?: string
) {
    const dependencies = new Set<string>()
    const filename = cleanStyleRequest(file)
    dependencies.add(filename)

    let resolvedSource = source
    if (resolvedSource === undefined) {
        try {
            resolvedSource = readFileSync(filename, 'utf-8')
        } catch {
            return [...dependencies]
        }
    }

    try {
        const graph = resolveStyleCSSImportGraph(filename, resolvedSource, projectDir, {
            expandMasterCSSPackage: false
        })
        for (const dependency of graph.dependencies) {
            dependencies.add(cleanStyleRequest(dependency))
        }
    } catch {
        // Keep the direct file dependency so the next valid edit can rerun the integration.
    }

    return [...dependencies]
}

export function removeStyleCSSImports(source: string) {
    return replaceStyleCSSImports(source, '')
}

function removeCSSImportStatements(source: string) {
    const imports = findImportStatements(source)
    if (!imports.length) return source
    let code = ''
    let index = 0
    for (const importStatement of imports) {
        code += source.slice(index, importStatement.start)
        index = importStatement.end
    }
    return code + source.slice(index)
}

export function hasStyleCSSImport(source: string) {
    return removeStyleCSSImports(source).replaced
}

export function hasDefaultStyleCSSImport(source: string) {
    return hasStyleCSSImport(source)
}

export function hasMasterStyleEntrypoint(source: string) {
    return hasMasterCSSManifestEntrypoint(source)
}

export function resolveMasterStyleSource(
    file: string,
    source: string,
    projectDir?: string
) {
    if (!isStyleCSSRequest(file)) return
    const sourceHasMasterEntry = hasMasterStyleEntrypoint(source)
    let unresolvedPackageSource: ResolvedStyleCSSSource
    try {
        unresolvedPackageSource = resolveStyleCSSImportGraph(file, source, projectDir, {
            expandMasterCSSPackage: false
        })
    } catch (error) {
        if (!sourceHasMasterEntry) return
        throw error
    }
    if (!isMasterStyleSource(unresolvedPackageSource.source)) return
    return resolveStyleCSSImportGraph(file, source, projectDir)
}

export function isMasterCSSModuleId(id: string) {
    return isMasterCSSManifestModuleId(id)
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
    return isMasterCSSCompilerPackageStyleFile(id, projectDir)
}

export function removeMasterStyleDirectives(source: string) {
    return removeStylesheetDirectiveStatements(source)
}

export function hasLocalStyleDirectives(source: string) {
    return collectCSSDirectiveRanges(source)
        .some((directive) => directive.name === 'compose' || directive.name === 'variant' || directive.name === 'reference')
}

function isStyleCSSHostImport(importSource: string, masterImport: string) {
    return importSource === masterImport || (masterImport === '@master/css' && normalizeStyleCSSModuleIds().has(importSource))
}

export function createStyleCSSHostSource(source: string, options: CreateStyleCSSHostSourceOptions = {}) {
    const masterImport = options.masterImport || '@master/css'
    const masterSource = options.masterSource
    const hasMasterSource = Object.prototype.hasOwnProperty.call(options, 'masterSource')
    const cleanSource = removeMasterStyleDirectives(source).code
    const imports = findImportStatements(cleanSource)
    const preservedImports: string[] = []
    for (const importStatement of imports) {
        const importSource = parseCSSImportSource(importStatement.statement)
        if (!importSource) continue
        if (importSource === VIRTUAL_CSS_ID || normalizeStyleCSSModuleIds().has(importSource)) {
            if (!hasMasterSource && isStyleCSSHostImport(importSource, masterImport)) {
                preservedImports.push(importStatement.statement.trim())
            }
            continue
        }
        if (!isExpandableStyleImportSource(importSource)) {
            preservedImports.push(importStatement.statement.trim())
        }
    }
    if (hasMasterSource) {
        if (masterSource) {
            preservedImports.push(masterSource)
        }
    } else if (!preservedImports.some((statement) => {
        const importSource = parseCSSImportSource(statement)
        return importSource && isStyleCSSHostImport(importSource, masterImport)
    })) {
        preservedImports.unshift(`@import "${masterImport}";`)
    }
    return preservedImports.join('\n')
}

function canUseDefaultMasterCSSPackageArtifact(options: CompileStyleCSSOptions = {}) {
    return !options.baseManifest
        && !options.classes?.length
        && !options.loadSass
        && !options.onWarning
        && options.preserveNativeCSS !== false
}

function resolveComparablePath(file: string) {
    return resolve(file)
}

function findDefaultPresetArtifactFiles(dependencies: string[]) {
    if (dependencies.length !== DEFAULT_PRESET_SOURCE_FILES.length + 1) return
    const dependencySet = new Set(dependencies.map(resolveComparablePath))
    for (const dependency of dependencies) {
        const directory = dirname(dependency)
        const sourceFiles = DEFAULT_PRESET_SOURCE_FILES.map((file) => resolveComparablePath(join(directory, file)))
        if (!sourceFiles.every((file) => dependencySet.has(file))) continue

        const manifestFile = join(directory, 'default-manifest.json')
        const nativeCSSFile = join(directory, 'default-native.css')
        if (!existsSync(manifestFile) || !existsSync(nativeCSSFile)) return
        return {
            manifestFile,
            nativeCSSFile
        }
    }
}

function readDefaultMasterCSSPackageArtifact(projectDir: string | undefined, options: CompileStyleCSSOptions = {}): DefaultMasterCSSPackageArtifact | undefined {
    if (!canUseDefaultMasterCSSPackageArtifact(options)) return

    const graph = resolveMasterCSSPackageImportGraph(projectDir)
    const artifactFiles = findDefaultPresetArtifactFiles(graph.dependencies)
    if (!artifactFiles) return

    return {
        manifest: JSON.parse(readFileSync(artifactFiles.manifestFile, 'utf8')) as MasterCSSManifest,
        nativeCSS: readFileSync(artifactFiles.nativeCSSFile, 'utf8'),
        dependencies: [...new Set([
            ...graph.dependencies,
            artifactFiles.manifestFile,
            artifactFiles.nativeCSSFile
        ])]
    }
}

function resolveMasterCSSPackageCompileSource(projectDir?: string) {
    const graph = resolveMasterCSSPackageImportGraph(projectDir)
    return {
        source: removeMasterStyleDirectives(removeStyleCSSImports(graph.source).code).code,
        dependencies: graph.dependencies
    }
}

export async function createMasterCSSPackageHostSource(
    projectDir: string | undefined,
    options: CompileStyleCSSOptions = {}
) {
    const defaultArtifact = readDefaultMasterCSSPackageArtifact(options.projectDir ?? projectDir, options)
    if (defaultArtifact) {
        const renderedCSS = renderCompiledManifestCSS({
            manifest: defaultArtifact.manifest,
            nativeCSS: defaultArtifact.nativeCSS
        })
        return {
            source: renderedCSS.css,
            dependencies: defaultArtifact.dependencies
        }
    }

    const graph = resolveMasterCSSPackageCompileSource(projectDir)
    const result = await compileStyleCSS(graph.dependencies[0] || '@master/css', graph.source, {
        ...options,
        preserveNativeCSS: true
    })
    const nativeCSS = getNativeCSS(result)
    const finalizedResult = createManifestFromCSSResult(result, options)
    return {
        source: renderCompiledManifestCSS({
            manifest: finalizedResult.manifest,
            nativeCSS
        }).css,
        dependencies: graph.dependencies
    }
}

export function hasMasterEntryDirective(source: string) {
    return findStylesheetDirectiveStatements(source).some((statement) => statement.name === MASTER_CSS_ENTRY_DIRECTIVE_NAME)
}

export function hasPreserveNativeDirective(source: string) {
    return findStylesheetDirectiveStatements(source)
        .some((statement) => statement.atRuleName === 'preserve' && statement.modifiers.includes('native'))
}

export function isMasterStyleSource(source: string) {
    return hasMasterStyleEntrypoint(source)
}

export async function preprocessStyleCSS(source: string, id: string, options: CompileStyleCSSOptions = {}) {
    const filename = cleanStyleRequest(id)
    const extension = getStyleRequestExtension(id)
    if (extension !== '.scss' && extension !== '.sass') return source

    const sass = (options.loadSass || defaultLoadSass)(options.projectDir)
    const result = await sass.compileStringAsync(source, {
        url: pathToFileURL(filename),
        style: 'expanded',
        syntax: extension === '.sass' ? 'indented' : 'scss'
    })
    return result.css
}

export async function compileStyleCSS(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
): Promise<CompileCSSResult> {
    const { result, finalizedResult } = await compileStyleCSSResult(id, source, options)
    return {
        ...result,
        dependencies: finalizedResult.dependencies,
        warnings: finalizedResult.warnings,
        css: finalizedResult.css,
        generatedCSS: finalizedResult.generatedCSS
    }
}

async function compileStyleCSSResult(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
) {
    const { projectDir, loadSass: _loadSass, baseManifest, ...compileOptions } = options
    const filename = cleanStyleRequest(id)
    const css = await preprocessStyleCSS(source, id, options)
    const result = compileCSS(css, {
        ...compileOptions,
        from: filename
    })
    const finalizedResult = createManifestFromCSSResult(result, {
        ...compileOptions,
        baseManifest,
        root: projectDir,
        from: filename
    })
    return {
        compileOptions,
        finalizedResult,
        result
    }
}

export async function compileRenderedStyleCSS(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
): Promise<CompileRenderedStyleCSSResult> {
    const { compileOptions, finalizedResult, result } = await compileStyleCSSResult(id, source, options)
    const renderedCSS = renderCompiledManifestCSS({
        manifest: finalizedResult.manifest,
        nativeCSS: result.nativeCSS,
        classNames: compileOptions.classes
    })
    return {
        ...result,
        dependencies: finalizedResult.dependencies,
        warnings: finalizedResult.warnings,
        css: renderedCSS.css,
        nativeCSS: renderedCSS.nativeCSS,
        generatedCSS: renderedCSS.generatedCSS,
        emittedGlobals: renderedCSS.emittedGlobals,
        manifest: finalizedResult.manifest,
        renderedCSS
    }
}

export async function compileLocalStyleCSS(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
): Promise<CompileCSSResult> {
    return compileStyleCSS(id, source, {
        ...options,
        preserveNativeCSS: true
    })
}

function createEmptyStyleEntryEmittedGlobals(): Required<MasterCSSEmittedGlobals> {
    return {
        variables: {},
        animations: {}
    }
}

function hasEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals | undefined) {
    return Boolean(
        Object.keys(emittedGlobals?.variables || {}).length
        || Object.keys(emittedGlobals?.animations || {}).length
    )
}

export async function createStyleEntryEmittedGlobals(
    entries: string[],
    options: CreateStyleEntryEmittedGlobalsOptions = {}
): Promise<CreateStyleEntryEmittedGlobalsResult> {
    const dependencies = new Set<string>()
    let baseManifest = options.baseManifest
    let emittedGlobals = createEmptyStyleEntryEmittedGlobals()

    for (const entry of [...new Set(entries)].sort()) {
        const filename = cleanStyleRequest(entry)
        const source = readFileSync(filename, 'utf-8')
        const resolvedSource = resolveMasterStyleSource(filename, source, options.projectDir)
        if (!resolvedSource) continue
        for (const dependency of resolvedSource.dependencies) {
            dependencies.add(cleanStyleRequest(dependency))
        }

        const { result, finalizedResult } = await compileStyleCSSResult(filename, resolvedSource.source, {
            ...options,
            baseManifest,
            preserveNativeCSS: true
        })
        for (const dependency of finalizedResult.dependencies) {
            dependencies.add(cleanStyleRequest(dependency))
        }

        const renderedCSS = renderCompiledManifestCSS({
            manifest: finalizedResult.manifest,
            nativeCSS: finalizedResult.css || result.nativeCSS,
            emittedGlobals
        })
        if (hasEmittedGlobals(renderedCSS.emittedGlobals)) {
            emittedGlobals = renderedCSS.emittedGlobals
        }
        baseManifest = finalizedResult.manifest
    }

    return {
        emittedGlobals,
        dependencies: [...dependencies]
    }
}

export async function transformLocalStyleCSS(
    id: string,
    source: string,
    options: TransformLocalStyleCSSOptions = {}
): Promise<TransformLocalStyleCSSResult> {
    if (!isStyleCSSRequest(id) || !hasLocalStyleDirectives(source)) {
        return {
            code: source,
            dependencies: [],
            transformed: false
        }
    }
    const {
        emittedGlobals,
        ...compileOptions
    } = options
    const { result, finalizedResult } = await compileStyleCSSResult(id, source, {
        ...compileOptions,
        preserveNativeCSS: true
    })
    const renderedCSS = renderCompiledManifestCSS({
        manifest: finalizedResult.resolutionManifest,
        nativeCSS: finalizedResult.css || result.nativeCSS,
        includeGeneratedCSS: false,
        emittedGlobals
    })
    const transformedResult = {
        ...result,
        dependencies: finalizedResult.dependencies,
        warnings: finalizedResult.warnings,
        css: renderedCSS.css,
        generatedCSS: renderedCSS.generatedCSS
    }
    return {
        code: transformedResult.css || transformedResult.nativeCSS || '',
        dependencies: [...new Set([cleanStyleRequest(id), ...(transformedResult.dependencies || [])])],
        transformed: true,
        result: transformedResult
    }
}

export function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }) {
    if (result.nativeCSS !== undefined) return result.nativeCSS
    const css = result.css || ''
    const generatedCSS = result.generatedCSS || ''
    if (generatedCSS && css.endsWith(generatedCSS)) {
        return css.slice(0, -generatedCSS.length).trim()
    }
    return css
}

function hasCompiledStyleManifestInput(result: CompileCSSResult) {
    return Boolean(Object.keys(result.manifestInput || {}).length || result.styleDefinitions?.length)
}

export function getScannerClasses(scanner: ScannerState) {
    return filterExcludedClasses([...new Set([
        ...(scanner.latentClasses || []),
        ...(scanner.validClasses || []),
        ...(scanner.usedNativeClasses || []),
        ...(scanner.options.safelist || [])
    ])], scanner.options.blocklist)
}

function getStylesheetOptionClasses(options: StylesheetSourceOptions, projectDir = process.cwd()) {
    const classes = new Set<string>(options.safelist || [])
    for (const sourcePath of resolveStylesheetSourcePaths(options, projectDir)) {
        const absolutePath = resolve(projectDir, sourcePath)
        if (!existsSync(absolutePath)) continue
        for (const className of extractClassCandidates(readFileSync(absolutePath, 'utf-8'))) {
            classes.add(className)
        }
    }
    return filterExcludedClasses([...classes], options.blocklist)
}

function getStyleSourceClasses(
    scanner: ScannerState,
    styleSource: StyleCSSSource,
    baseClasses: string[],
    projectDir?: string
) {
    if (!hasStylesheetDirectives(styleSource.directives)) return baseClasses
    const scopedOptions = mergeStylesheetSourceOptions(scanner.options, styleSource.directives)
    const classes = hasStylesheetSourceDirectives(styleSource.directives)
        ? getStylesheetOptionClasses(scopedOptions, projectDir)
        : [
            ...baseClasses,
            ...(styleSource.directives.safelist || [])
        ]
    return filterExcludedClasses([...new Set(classes)], scopedOptions.blocklist)
}

export function refreshScannerNativeClasses(scanner: ScannerState, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!scanner.nativeClassNames.has(className)) {
            scanner.nativeClassNames.add(className)
            changed = true
        }
        if (scanner.latentClasses.has(className) && !scanner.usedNativeClasses.has(className)) {
            scanner.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        scanner.emit?.('change')
    }
}

export async function registerStyleCSSSource(
    scanner: ScannerState,
    styleCSSSources: StyleCSSSources,
    id: string,
    source: string,
    options: RegisterStyleCSSSourceOptions = {}
) {
    const filename = cleanStyleRequest(id)
    const detectionSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? scanner.cwd)
    const resolvedSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? scanner.cwd, {
        expandMasterCSSPackage: false
    })
    const collectedDirectives = extname(filename) === '.css'
        ? collectStylesheetDirectivesFromCSSGraph(filename, detectionSource.source, scanner.cwd)
        : {
            directives: createStylesheetDirectives(),
            dependencies: []
        }
    const masterCSS = hasMasterCSSImport(resolvedSource.source)
    const pruneNativeCSS = !collectedDirectives.directives.preserveNative && isMasterStyleSource(resolvedSource.source)
    const sourceWithoutImports = removeCSSImportStatements(resolvedSource.source)
    const cleanSource = removeMasterStyleDirectives(sourceWithoutImports).code
    const compileOptions = options
    const result = await compileStyleCSS(filename, cleanSource, compileOptions)
    const defaultArtifact = masterCSS
        ? readDefaultMasterCSSPackageArtifact(options.projectDir ?? scanner.cwd, options)
        : undefined
    const scopedOptions = mergeStylesheetSourceOptions(scanner.options, collectedDirectives.directives)
    const sourceDependencies = hasStylesheetSourceDirectives(collectedDirectives.directives)
        ? resolveStylesheetSourcePaths(scopedOptions, scanner.cwd).map((sourcePath) => resolve(scanner.cwd, sourcePath))
        : []
    result.dependencies = [...new Set([
        ...resolvedSource.dependencies,
        ...detectionSource.dependencies,
        ...(result.dependencies || []),
        ...collectedDirectives.dependencies,
        ...sourceDependencies,
        ...(defaultArtifact?.dependencies || [])
    ])]
    styleCSSSources.set(filename, {
        source: cleanSource,
        pruneNativeCSS,
        masterCSS,
        directives: collectedDirectives.directives,
        dependencies: result.dependencies || [],
        sourceDependencies
    })
    if (pruneNativeCSS) {
        refreshScannerNativeClasses(scanner, result.nativeClassNames)
    }
    return result
}

export interface CreateStyleCSSManifestOptions extends CompileStyleCSSOptions {
    styleCSSSources?: StyleCSSSources
}

function hasMasterCSSPackageSource(styleCSSSources?: StyleCSSSources) {
    return Array.from(styleCSSSources?.values() || []).some((styleSource) => styleSource.masterCSS)
}

async function compileMasterCSSPackage(projectDir: string | undefined, options: CompileStyleCSSOptions) {
    const graph = resolveMasterCSSPackageCompileSource(projectDir)
    const result = await compileStyleCSS(graph.dependencies[0] || '@master/css', graph.source, options)
    return {
        ...result,
        dependencies: graph.dependencies
    }
}

export async function createStyleCSSManifest(options: CreateStyleCSSManifestOptions = {}) {
    const {
        styleCSSSources,
        ...compileOptions
    } = options
    const entries = Array.from(styleCSSSources || [])
    const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
    const defaultArtifact = hasMasterCSS
        ? readDefaultMasterCSSPackageArtifact(compileOptions.projectDir, compileOptions)
        : undefined
    const styleResults = await Promise.all([
        ...(hasMasterCSS && !defaultArtifact
            ? [compileMasterCSSPackage(compileOptions.projectDir, compileOptions)]
            : []),
        ...entries.map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, compileOptions))
    ])
    const dependencies = [
        ...(defaultArtifact?.dependencies || []),
        ...entries.flatMap(([, styleSource]) => styleSource.dependencies),
        ...styleResults.flatMap((result: CompileCSSResult) => result.dependencies || [])
    ]
    let manifest: MasterCSSManifest | undefined = defaultArtifact?.manifest ?? compileOptions.baseManifest
    let hasStyleManifest = Boolean(defaultArtifact)
    for (const result of styleResults) {
        if (!hasCompiledStyleManifestInput(result)) continue
        const finalizedResult = createManifestFromCSSResult(result, {
            ...compileOptions,
            baseManifest: manifest
        })
        manifest = finalizedResult.manifest
        hasStyleManifest = true
    }
    return {
        manifest: hasStyleManifest ? manifest : undefined,
        dependencies: [...new Set(dependencies)]
    }
}

function createEmptyExtractedCSSResult(css = ''): CreateExtractedCSSResult {
    return {
        css,
        emittedGlobals: {
            variables: {},
            animations: {}
        }
    }
}

export async function createExtractedCSSResult(options: CreateExtractedCSSOptions): Promise<CreateExtractedCSSResult> {
    const {
        scanner,
        styleCSSSources,
        manifest: planOption,
        includeGeneratedCSS = true,
        includeNativeCSS = true,
        includeMasterBaseCSS = true,
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getScannerClasses(scanner)

    if (!planOption && !compileOptions.classes && !styleCSSSources?.size) {
        return createEmptyExtractedCSSResult(includeGeneratedCSS ? scanner.css.text : '')
    }

    const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
    const explicitPlan = planOption ?? scanner.customOptions?.manifest
    const defaultArtifact = hasMasterCSS && !explicitPlan
        ? readDefaultMasterCSSPackageArtifact(compileOptions.projectDir ?? scanner.cwd, compileOptions)
        : undefined
    const masterCSSResult = hasMasterCSS && !defaultArtifact
        ? await compileMasterCSSPackage(compileOptions.projectDir, compileOptions)
        : undefined
    const entryStyleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, {
                ...compileOptions,
                classes: styleSource.pruneNativeCSS
                    ? getStyleSourceClasses(scanner, styleSource, classes, compileOptions.projectDir ?? scanner.cwd)
                    : undefined
            }))
    )
    const styleResults = [
        ...(masterCSSResult ? [masterCSSResult] : []),
        ...entryStyleResults
    ]
    let mergedPlan = defaultArtifact?.manifest ?? compileOptions.baseManifest ?? explicitPlan ?? scanner.css.manifest
    const finalizedStyleResults = new Map<CompileCSSResult, ReturnType<typeof createManifestFromCSSResult>>()
    for (const result of styleResults) {
        if (!hasCompiledStyleManifestInput(result)) continue
        const finalizedResult = createManifestFromCSSResult(result, {
            ...compileOptions,
            baseManifest: mergedPlan
        })
        mergedPlan = finalizedResult.manifest
        finalizedStyleResults.set(result, finalizedResult)
    }
    const nativeCSS = [
        ...(includeMasterBaseCSS
            ? [
                ...(defaultArtifact ? [defaultArtifact.nativeCSS] : []),
                ...(masterCSSResult ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)] : [])
            ]
            : []),
        ...(includeNativeCSS
            ? entryStyleResults
                .map((result: CompileCSSResult) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
                .filter(Boolean)
            : [])
    ]
    const generatedClasses = new Set(classes)
    if (includeGeneratedCSS) {
        for (const styleSource of styleCSSSources?.values() || []) {
            if (!hasStylesheetDirectives(styleSource.directives)) continue
            for (const className of getStyleSourceClasses(scanner, styleSource, classes, compileOptions.projectDir ?? scanner.cwd)) {
                generatedClasses.add(className)
            }
        }
    }
    const renderedCSS = renderCompiledManifestCSS({
        manifest: mergedPlan,
        nativeCSS,
        classNames: generatedClasses,
        includeGeneratedCSS
    })
    return {
        css: renderedCSS.css,
        emittedGlobals: renderedCSS.emittedGlobals
    }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
    return (await createExtractedCSSResult(options)).css
}
