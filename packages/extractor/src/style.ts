import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { AnimationRule, createCSS, VariableRule } from '@master/css'
import createConfigFromCSSDirectives from '@master/css/create-config-from-css-directives'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'
import {
    findCSSImportStatements,
    hasMasterCSSImport,
    hasMasterCSSConfigEntrypoint,
    isMasterCSSModuleId as isMasterCSSConfigModuleId,
    normalizeMasterCSSModuleIds,
    parseCSSImportSource
} from 'shared/css-config-entry'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
import {
    findCSSConfigEntryFiles,
    isMasterCSSPackageStyleFile as isMasterCSSConfigPackageStyleFile,
    resolveMasterCSSPackageImportGraph
} from '@master/css-configer/css'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import type CSSExtractor from './core'
import extractLatentClasses from './functions/extract-latent-classes'
import {
    collectExtractorDirectivesFromCSSGraph,
    createExtractorDirectives,
    findExtractorDirectiveStatements,
    hasExtractorDirectives,
    hasExtractorSourceDirectives,
    mergeExtractorOptions,
    removeExtractorDirectiveStatements,
    resolveExtractorSourcePaths,
    type ExtractorDirectives
} from './directives'
import type { Options as ExtractorOptions } from './options'
import { filterExcludedClasses } from './utils/class-exclusion'

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
    projectDir?: string
    loadSass?: (projectDir?: string) => SassModule
}

export type RegisterStyleCSSSourceOptions = CompileStyleCSSOptions

export interface CreateExtractedCSSOptions extends CompileStyleCSSOptions {
    extractor: CSSExtractor
    styleCSSSources?: StyleCSSSources
    config?: Config
    includeGeneratedCSS?: boolean
    includeNativeCSS?: boolean
    includeMasterBaseCSS?: boolean
}

export interface StyleCSSSource {
    source: string
    shake: boolean
    masterCSS: boolean
    directives: ExtractorDirectives
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

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

export function isStyleCSSRequest(id: string) {
    return STYLE_CSS_REQUEST_RE.test(id)
}

export async function findStyleCSSEntryFiles(projectDir = process.cwd()) {
    return findCSSConfigEntryFiles(projectDir)
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
        const packageGraph = options.expandMasterCSSPackage !== false && importSource && isMasterCSSConfigModuleId(importSource)
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

export function hasStyleCSSImport(source: string) {
    return removeStyleCSSImports(source).replaced
}

export function hasDefaultStyleCSSImport(source: string) {
    return hasStyleCSSImport(source)
}

export function hasMasterStyleEntrypoint(source: string) {
    return hasMasterCSSConfigEntrypoint(source)
}

export function resolveMasterStyleSource(
    file: string,
    source: string,
    projectDir?: string
) {
    if (!isStyleCSSRequest(file)) return
    const resolvedSource = resolveStyleCSSImportGraph(file, source, projectDir)
    if (!isMasterStyleSource(resolvedSource.source)) return
    return resolvedSource
}

export function isMasterCSSModuleId(id: string) {
    return isMasterCSSConfigModuleId(id)
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
    return isMasterCSSConfigPackageStyleFile(id, projectDir)
}

export function removeMasterStyleDirectives(source: string) {
    return removeExtractorDirectiveStatements(source)
}

function isStyleCSSHostImport(importSource: string, masterImport: string) {
    return importSource === masterImport || (masterImport === '@master/css' && normalizeStyleCSSModuleIds().has(importSource))
}

export function createStyleCSSHostSource(source: string, options: CreateStyleCSSHostSourceOptions = {}) {
    const masterImport = options.masterImport || '@master/css'
    const masterSource = options.masterSource
    const cleanSource = removeMasterStyleDirectives(source).code
    const imports = findImportStatements(cleanSource)
    const preservedImports: string[] = []
    for (const importStatement of imports) {
        const importSource = parseCSSImportSource(importStatement.statement)
        if (!importSource) continue
        if (importSource === VIRTUAL_CSS_ID || normalizeStyleCSSModuleIds().has(importSource)) {
            if (!masterSource && isStyleCSSHostImport(importSource, masterImport)) {
                preservedImports.push(importStatement.statement.trim())
            }
            continue
        }
        if (!isExpandableStyleImportSource(importSource)) {
            preservedImports.push(importStatement.statement.trim())
        }
    }
    if (masterSource) {
        preservedImports.unshift(masterSource)
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
    return {
        source: getNativeCSS(result),
        dependencies: graph.dependencies
    }
}

export function removeMasterShakeDirectives(source: string) {
    return removeMasterStyleDirectives(source)
}

export function hasMasterShakeDirective(source: string) {
    return findExtractorDirectiveStatements(source).some((statement) => statement.name === 'shake')
}

export function hasMasterEntryDirective(source: string) {
    return findExtractorDirectiveStatements(source).some((statement) => statement.name === '')
}

export function hasMasterNoShakeDirective(source: string) {
    return findExtractorDirectiveStatements(source).some((statement) => statement.name === 'no-shake')
}

export function isMasterStyleSource(source: string) {
    return hasMasterEntryDirective(source)
}

export async function preprocessStyleCSS(source: string, id: string, options: CompileStyleCSSOptions = {}) {
    const filename = cleanStyleRequest(id)
    const extension = extname(filename)
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
    const { projectDir: _projectDir, loadSass: _loadSass, ...compileOptions } = options
    const css = await preprocessStyleCSS(source, id, options)
    return compileCSS(css, {
        ...compileOptions,
        from: cleanStyleRequest(id)
    })
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

function hasCompiledStyleConfig(result: CompileCSSResult) {
    return Object.keys(result.config).length || Object.keys(result.componentDefinitions || {}).length
}

export function getExtractorClasses(extractor: CSSExtractor) {
    return filterExcludedClasses([...new Set([
        ...(extractor.latentClasses || []),
        ...(extractor.validClasses || []),
        ...(extractor.usedNativeClasses || []),
        ...(extractor.options.includeClasses || [])
    ])], extractor.options.excludeClasses)
}

function getExtractorOptionClasses(options: ExtractorOptions, projectDir = process.cwd()) {
    const classes = new Set<string>(options.includeClasses || [])
    for (const sourcePath of resolveExtractorSourcePaths(options, projectDir)) {
        const absolutePath = resolve(projectDir, sourcePath)
        if (!existsSync(absolutePath)) continue
        for (const className of extractLatentClasses(readFileSync(absolutePath, 'utf-8'))) {
            classes.add(className)
        }
    }
    return filterExcludedClasses([...classes], options.excludeClasses)
}

function getStyleSourceClasses(
    extractor: CSSExtractor,
    styleSource: StyleCSSSource,
    baseClasses: string[],
    projectDir?: string
) {
    if (!hasExtractorDirectives(styleSource.directives)) return baseClasses
    const scopedOptions = mergeExtractorOptions(extractor.options, styleSource.directives)
    const classes = hasExtractorSourceDirectives(styleSource.directives)
        ? getExtractorOptionClasses(scopedOptions, projectDir)
        : [
            ...baseClasses,
            ...(styleSource.directives.includeClasses || [])
        ]
    return filterExcludedClasses([...new Set(classes)], scopedOptions.excludeClasses)
}

export function refreshExtractorNativeClasses(extractor: CSSExtractor, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!extractor.nativeClassNames.has(className)) {
            extractor.nativeClassNames.add(className)
            changed = true
        }
        if (extractor.latentClasses.has(className) && !extractor.usedNativeClasses.has(className)) {
            extractor.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        extractor.emit('change')
    }
}

export async function registerStyleCSSSource(
    extractor: CSSExtractor,
    styleCSSSources: StyleCSSSources,
    id: string,
    source: string,
    options: RegisterStyleCSSSourceOptions = {}
) {
    const filename = cleanStyleRequest(id)
    const detectionSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? extractor.cwd)
    const resolvedSource = resolveStyleCSSImportGraph(filename, source, options.projectDir ?? extractor.cwd, {
        expandMasterCSSPackage: false
    })
    const collectedDirectives = extname(filename) === '.css'
        ? collectExtractorDirectivesFromCSSGraph(filename, detectionSource.source, extractor.cwd)
        : {
            directives: createExtractorDirectives(),
            dependencies: []
        }
    const masterCSS = hasMasterCSSImport(resolvedSource.source)
    const shake = !hasMasterNoShakeDirective(detectionSource.source) && isMasterStyleSource(detectionSource.source)
    const sourceWithoutImports = removeStyleCSSImports(resolvedSource.source).code
    const cleanSource = removeMasterStyleDirectives(sourceWithoutImports).code
    const compileOptions = options
    const result = await compileStyleCSS(filename, cleanSource, compileOptions)
    const scopedOptions = mergeExtractorOptions(extractor.options, collectedDirectives.directives)
    const sourceDependencies = hasExtractorSourceDirectives(collectedDirectives.directives)
        ? resolveExtractorSourcePaths(scopedOptions, extractor.cwd).map((sourcePath) => resolve(extractor.cwd, sourcePath))
        : []
    result.dependencies = [...new Set([
        ...resolvedSource.dependencies,
        ...detectionSource.dependencies,
        ...collectedDirectives.dependencies,
        ...sourceDependencies
    ])]
    styleCSSSources.set(filename, {
        source: cleanSource,
        shake,
        masterCSS,
        directives: collectedDirectives.directives,
        dependencies: result.dependencies || [],
        sourceDependencies
    })
    if (shake) {
        refreshExtractorNativeClasses(extractor, result.nativeClassNames)
    }
    return result
}

export interface CreateStyleCSSConfigOptions extends CompileStyleCSSOptions {
    styleCSSSources?: StyleCSSSources
    config?: Config
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

export async function createStyleCSSConfig(options: CreateStyleCSSConfigOptions = {}) {
    const {
        styleCSSSources,
        config,
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
    const styleConfigs: Config[] = []
    for (const result of styleResults) {
        if (!hasCompiledStyleConfig(result)) continue
        styleConfigs.push(createConfigFromCSSDirectives(result, {
            config: extendConfig(...styleConfigs, config)
        }).config)
    }
    const dependencies = [
        ...entries.flatMap(([, styleSource]) => styleSource.dependencies),
        ...styleResults.flatMap((result) => result.dependencies || [])
    ]
    return {
        config: extendConfig(...styleConfigs, config),
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

function insertVariableReferences(css: ReturnType<typeof createCSS>, references: Set<string>) {
    const insert = (name: string, visited = new Set<string>()) => {
        if (visited.has(name)) return
        visited.add(name)
        const variable = css.variables.get(name)
        if (!variable) return
        css.themeLayer.insert(new VariableRule(name, variable, css))
        variable.dependencies?.forEach((dependency) => insert(dependency, visited))
    }
    const visited = new Set<string>()
    for (const name of references) {
        insert(name, visited)
    }
}

function collectCSSAnimationReferences(source: string, animationNames: readonly string[]) {
    const references = new Set<string>()
    if (!animationNames.length) return references
    for (const match of source.matchAll(/\banimation(?:-name)?\s*:\s*([^;{}]+)/g)) {
        const value = match[1]
        for (const name of animationNames) {
            if (new RegExp(String.raw`(^|[\s,])${escapeRegExp(name)}(?=$|[\s,])`).test(value)) {
                references.add(name)
            }
        }
    }
    return references
}

function collectNativeCSSAnimationReferences(nativeCSS: string[], animationNames: Iterable<string>) {
    const references = new Set<string>()
    const names = Array.from(animationNames)
    for (const source of nativeCSS) {
        for (const reference of collectCSSAnimationReferences(source, names)) {
            references.add(reference)
        }
    }
    return references
}

function insertAnimationReferences(css: ReturnType<typeof createCSS>, references: Set<string>) {
    for (const name of references) {
        const keyframes = css.animations.get(name)
        if (!keyframes) continue
        const rule = new AnimationRule(name, keyframes, css)
        css.animationsNonLayer.insert(rule)
        insertVariableReferences(css, rule.variableNames ?? new Set())
    }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
    const {
        extractor,
        styleCSSSources,
        config: configOption,
        includeGeneratedCSS = true,
        includeNativeCSS = true,
        includeMasterBaseCSS = true,
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getExtractorClasses(extractor)

    if (!configOption && !compileOptions.classes && !styleCSSSources?.size) {
        return includeGeneratedCSS ? extractor.css.text : ''
    }

    const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
    const masterCSSResult = hasMasterCSS
        ? await compileMasterCSSPackage(compileOptions.projectDir, compileOptions)
        : undefined
    const entryStyleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, {
                ...compileOptions,
                classes: styleSource.shake
                    ? getStyleSourceClasses(extractor, styleSource, classes, compileOptions.projectDir ?? extractor.cwd)
                    : undefined
            }))
    )
    const styleResults = [
        ...(masterCSSResult ? [masterCSSResult] : []),
        ...entryStyleResults
    ]
    const nativeCSS = [
        ...(includeGeneratedCSS && includeMasterBaseCSS && masterCSSResult
            ? [getNativeCSS(masterCSSResult)]
            : []),
        ...(includeNativeCSS
            ? entryStyleResults.map((result) => result.nativeCSS).filter(Boolean)
            : [])
    ]
    const explicitConfig = configOption ?? extractor.customOptions?.config
    const styleConfigs: Config[] = []
    for (const result of styleResults) {
        if (!hasCompiledStyleConfig(result)) continue
        styleConfigs.push(createConfigFromCSSDirectives(result, {
            config: extendConfig(...styleConfigs, explicitConfig)
        }).config)
    }
    const css = createCSS(extendConfig(...styleConfigs, explicitConfig))
    if (includeGeneratedCSS) {
        const generatedClasses = new Set(classes)
        for (const styleSource of styleCSSSources?.values() || []) {
            if (!hasExtractorDirectives(styleSource.directives)) continue
            for (const className of getStyleSourceClasses(extractor, styleSource, classes, compileOptions.projectDir ?? extractor.cwd)) {
                generatedClasses.add(className)
            }
        }
        for (const className of generatedClasses) {
            css.add(className)
        }
    }
    const variableReferences = collectStyleCSSVariableReferences(nativeCSS)
    const animationReferences = collectNativeCSSAnimationReferences(nativeCSS, css.animations.keys())
    insertVariableReferences(css, variableReferences)
    insertAnimationReferences(css, animationReferences)
    const shouldIncludeMasterCSS = includeGeneratedCSS || variableReferences.size || animationReferences.size
    return [
        ...nativeCSS,
        shouldIncludeMasterCSS ? css.text : ''
    ].filter(Boolean).join('\n\n')
}
