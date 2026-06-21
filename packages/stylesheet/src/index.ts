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
import { AnimationRule, VariableRule, type MasterCSSEmittedGlobals } from '@master/css'
import { collectAnimationNamesFromDeclaration } from '@master/css-engine'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import {
    findCSSImportStatements,
    collectCSSDirectiveRanges,
    hasMasterCSSImport,
    hasMasterCSSManifestEntrypoint,
    isMasterCSSModuleId as isMasterCSSManifestModuleId,
    normalizeMasterCSSModuleIds,
    parseCSSImportSource
} from '@master/css-lexer'
import { extractClassCandidates } from '@master/css-source'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import escapeRegExp from 'shared/utils/escape-reg-exp'
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

export interface TransformLocalStyleCSSResult {
    code: string
    dependencies: string[]
    transformed: boolean
    result?: CompileCSSResult
}

export type RegisterStyleCSSSourceOptions = CompileStyleCSSOptions

export interface CreateExtractedCSSOptions extends CompileStyleCSSOptions {
    state: StylesheetState
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

export interface StylesheetState {
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
    const ids = [...normalizeStyleCSSModuleIds()].map(escapeRegExp)
    return new RegExp(String.raw`(?:@master\s*;|@import\s+(?:url\(\s*)?(['"])(?:${ids.join('|')})\1\s*\)?[^;]*;)`)
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
    const graph = resolveMasterCSSPackageCompileSource(projectDir)
    const result = await compileStyleCSS(graph.dependencies[0] || '@master/css', graph.source, {
        ...options,
        preserveNativeCSS: true
    })
    const nativeCSS = getNativeCSS(result)
    const finalizedResult = createManifestFromCSSResult(result, options)
    const css = createCSSWithNativeDeclarations(finalizedResult.manifest)
    const nativeAnimationNames = collectStyleCSSKeyframeNames([nativeCSS])
    if (nativeAnimationNames.size) {
        css.registerEmittedGlobals({
            animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
        })
    }
    insertVariableReferences(css, collectCSSVariableReferences(nativeCSS))
    insertAnimationReferences(css, collectCSSAnimationReferences(nativeCSS, css, nativeAnimationNames))
    return {
        source: [
            nativeCSS,
            css.text
        ].filter(Boolean).join('\n\n'),
        dependencies: graph.dependencies
    }
}

export function hasMasterEntryDirective(source: string) {
    return findStylesheetDirectiveStatements(source).some((statement) => statement.name === '')
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
        ...result,
        dependencies: finalizedResult.dependencies,
        warnings: finalizedResult.warnings,
        css: finalizedResult.css,
        generatedCSS: finalizedResult.generatedCSS
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

export async function transformLocalStyleCSS(
    id: string,
    source: string,
    options: CompileStyleCSSOptions = {}
): Promise<TransformLocalStyleCSSResult> {
    if (!isStyleCSSRequest(id) || !hasLocalStyleDirectives(source)) {
        return {
            code: source,
            dependencies: [],
            transformed: false
        }
    }
    const result = await compileLocalStyleCSS(id, source, options)
    return {
        code: result.css || result.nativeCSS || '',
        dependencies: [...new Set([cleanStyleRequest(id), ...(result.dependencies || [])])],
        transformed: true,
        result
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

export function getStylesheetClasses(state: StylesheetState) {
    return filterExcludedClasses([...new Set([
        ...(state.latentClasses || []),
        ...(state.validClasses || []),
        ...(state.usedNativeClasses || []),
        ...(state.options.safelist || [])
    ])], state.options.blocklist)
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
    state: StylesheetState,
    styleSource: StyleCSSSource,
    baseClasses: string[],
    projectDir?: string
) {
    if (!hasStylesheetDirectives(styleSource.directives)) return baseClasses
    const scopedOptions = mergeStylesheetSourceOptions(state.options, styleSource.directives)
    const classes = hasStylesheetSourceDirectives(styleSource.directives)
        ? getStylesheetOptionClasses(scopedOptions, projectDir)
        : [
            ...baseClasses,
            ...(styleSource.directives.safelist || [])
        ]
    return filterExcludedClasses([...new Set(classes)], scopedOptions.blocklist)
}

export function refreshStylesheetNativeClasses(state: StylesheetState, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!state.nativeClassNames.has(className)) {
            state.nativeClassNames.add(className)
            changed = true
        }
        if (state.latentClasses.has(className) && !state.usedNativeClasses.has(className)) {
            state.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        state.emit?.('change')
    }
}

export async function registerStyleCSSSource(
    state: StylesheetState,
    styleCSSSources: StyleCSSSources,
    id: string,
    source: string,
    options: RegisterStyleCSSSourceOptions = {}
) {
    const filename = cleanStyleRequest(id)
    const detectionSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? state.cwd)
    const resolvedSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? state.cwd, {
        expandMasterCSSPackage: false
    })
    const collectedDirectives = extname(filename) === '.css'
        ? collectStylesheetDirectivesFromCSSGraph(filename, detectionSource.source, state.cwd)
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
    const scopedOptions = mergeStylesheetSourceOptions(state.options, collectedDirectives.directives)
    const sourceDependencies = hasStylesheetSourceDirectives(collectedDirectives.directives)
        ? resolveStylesheetSourcePaths(scopedOptions, state.cwd).map((sourcePath) => resolve(state.cwd, sourcePath))
        : []
    result.dependencies = [...new Set([
        ...resolvedSource.dependencies,
        ...detectionSource.dependencies,
        ...(result.dependencies || []),
        ...collectedDirectives.dependencies,
        ...sourceDependencies
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
        refreshStylesheetNativeClasses(state, result.nativeClassNames)
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
    const styleResults = await Promise.all([
        ...(hasMasterCSS
            ? [compileMasterCSSPackage(compileOptions.projectDir, compileOptions)]
            : []),
        ...entries.map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, compileOptions))
    ])
    const dependencies = [
        ...entries.flatMap(([, styleSource]) => styleSource.dependencies),
        ...styleResults.flatMap((result) => result.dependencies || [])
    ]
    let manifest: MasterCSSManifest | undefined = compileOptions.baseManifest
    let hasStyleManifest = false
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

export function collectCSSVariableReferences(source: string) {
    const references = new Set<string>()
    for (const match of source.matchAll(/var\(\s*--([_a-zA-Z0-9-]+)/g)) {
        references.add(match[1])
    }
    return references
}

function collectStyleCSSVariableReferences(nativeCSS: string[]) {
    const references = new Set<string>()
    for (const source of nativeCSS) {
        for (const reference of collectCSSVariableReferences(source)) {
            references.add(reference)
        }
    }
    return references
}

function collectCSSKeyframeNames(source: string) {
    const names = new Set<string>()
    for (const match of source.matchAll(/@keyframes\s+(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
        names.add(match[1])
    }
    return names
}

function collectStyleCSSKeyframeNames(nativeCSS: string[]) {
    const names = new Set<string>()
    for (const source of nativeCSS) {
        for (const name of collectCSSKeyframeNames(source)) {
            names.add(name)
        }
    }
    return names
}

function insertVariableReferences(css: ReturnType<typeof createCSSWithNativeDeclarations>, references: Set<string>) {
    const insert = (name: string, visited = new Set<string>()) => {
        if (visited.has(name)) return
        visited.add(name)
        const variable = css.variables.get(name)
        if (!variable || variable.inline) return
        css.themeLayer.insert(new VariableRule(name, variable, css))
        variable.dependencies?.forEach((dependency) => insert(dependency, visited))
    }
    const visited = new Set<string>()
    for (const name of references) {
        insert(name, visited)
    }
}

function collectCSSAnimationReferences(source: string, css: ReturnType<typeof createCSSWithNativeDeclarations>, ignoredAnimationNames = new Set<string>()) {
    const references = new Set<string>()
    const animationNames = Array.from(css.animations.keys())
    if (!animationNames.length) return references
    for (const match of source.matchAll(/\b(animation(?:-name)?)\s*:\s*([^;{}]+)/g)) {
        for (const name of collectAnimationNamesFromDeclaration(match[1], match[2], {
            animationNames,
            variables: css.variables,
            variableNames: collectCSSVariableReferences(match[2])
        })) {
            if (ignoredAnimationNames.has(name)) continue
            references.add(name)
        }
    }
    return references
}

function collectNativeCSSAnimationReferences(nativeCSS: string[], css: ReturnType<typeof createCSSWithNativeDeclarations>, ignoredAnimationNames = new Set<string>()) {
    const references = new Set<string>()
    for (const source of nativeCSS) {
        for (const reference of collectCSSAnimationReferences(source, css, ignoredAnimationNames)) {
            references.add(reference)
        }
    }
    return references
}

function insertAnimationReferences(css: ReturnType<typeof createCSSWithNativeDeclarations>, references: Set<string>) {
    for (const name of references) {
        const keyframes = css.animations.get(name)
        if (!keyframes) continue
        const rule = new AnimationRule(name, keyframes, css)
        css.animationsNonLayer.insert(rule)
        insertVariableReferences(css, rule.variableNames ?? new Set())
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

function createEmittedGlobals(css: ReturnType<typeof createCSSWithNativeDeclarations>): Required<MasterCSSEmittedGlobals> {
    const emittedGlobals: Required<MasterCSSEmittedGlobals> = {
        variables: { ...css.emittedGlobals.variables },
        animations: { ...css.emittedGlobals.animations }
    }
    for (const rule of css.themeLayer.rules) {
        if (rule instanceof VariableRule) {
            emittedGlobals.variables[rule.name] = 1
        }
    }
    for (const rule of css.animationsNonLayer.rules) {
        if (rule instanceof AnimationRule) {
            emittedGlobals.animations[rule.name] = 1
        }
    }
    return emittedGlobals
}

export async function createExtractedCSSResult(options: CreateExtractedCSSOptions): Promise<CreateExtractedCSSResult> {
    const {
        state,
        styleCSSSources,
        manifest: planOption,
        includeGeneratedCSS = true,
        includeNativeCSS = true,
        includeMasterBaseCSS = true,
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getStylesheetClasses(state)

    if (!planOption && !compileOptions.classes && !styleCSSSources?.size) {
        return createEmptyExtractedCSSResult(includeGeneratedCSS ? state.css.text : '')
    }

    const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
    const masterCSSResult = hasMasterCSS
        ? await compileMasterCSSPackage(compileOptions.projectDir, compileOptions)
        : undefined
    const entryStyleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, {
                ...compileOptions,
                classes: styleSource.pruneNativeCSS
                    ? getStyleSourceClasses(state, styleSource, classes, compileOptions.projectDir ?? state.cwd)
                    : undefined
            }))
    )
    const styleResults = [
        ...(masterCSSResult ? [masterCSSResult] : []),
        ...entryStyleResults
    ]
    const explicitPlan = planOption ?? state.customOptions?.manifest
    let mergedPlan = compileOptions.baseManifest ?? explicitPlan ?? state.css.manifest
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
        ...(includeGeneratedCSS && includeMasterBaseCSS && masterCSSResult
            ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)]
            : []),
        ...(includeNativeCSS
            ? entryStyleResults
                .map((result) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
                .filter(Boolean)
            : [])
    ]
    const nativeAnimationNames = collectStyleCSSKeyframeNames(nativeCSS)
    const css = createCSSWithNativeDeclarations(mergedPlan)
    if (nativeAnimationNames.size) {
        css.registerEmittedGlobals({
            animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
        })
    }
    if (includeGeneratedCSS) {
        const generatedClasses = new Set(classes)
        for (const styleSource of styleCSSSources?.values() || []) {
            if (!hasStylesheetDirectives(styleSource.directives)) continue
            for (const className of getStyleSourceClasses(state, styleSource, classes, compileOptions.projectDir ?? state.cwd)) {
                generatedClasses.add(className)
            }
        }
        for (const className of generatedClasses) {
            css.add(className)
        }
    }
    const variableReferences = collectStyleCSSVariableReferences(nativeCSS)
    const animationReferences = collectNativeCSSAnimationReferences(nativeCSS, css, nativeAnimationNames)
    insertVariableReferences(css, variableReferences)
    insertAnimationReferences(css, animationReferences)
    const shouldIncludeMasterCSS = includeGeneratedCSS || variableReferences.size || animationReferences.size || Boolean(css.text)
    const cssText = [
        ...nativeCSS,
        shouldIncludeMasterCSS ? css.text : ''
    ].filter(Boolean).join('\n\n')
    return {
        css: cssText,
        emittedGlobals: shouldIncludeMasterCSS || nativeAnimationNames.size ? createEmittedGlobals(css) : createEmptyExtractedCSSResult().emittedGlobals
    }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
    return (await createExtractedCSSResult(options)).css
}
