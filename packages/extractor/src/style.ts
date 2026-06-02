import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { AnimationRule, createCSS, VariableRule } from '@master/css'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'
import { loadConfig } from '@master/css-configer/load'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
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

type LoadConfigMode = 'always' | 'css' | false

const MASTER_CSS_PACKAGE_MODULE_IDS = ['@master/css', '@master/css/index.css']
const MASTER_CSS_PACKAGE_INDEX_ID = '@master/css/index.css'

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
    configPath?: string
    loadConfigMode?: LoadConfigMode
    includeGeneratedCSS?: boolean
    includeNativeCSS?: boolean
}

export interface StyleCSSSource {
    source: string
    shake: boolean
    directives: ExtractorDirectives
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
    return new Set(MASTER_CSS_PACKAGE_MODULE_IDS)
}

export function createStyleCSSImportPattern() {
    const ids = [...normalizeStyleCSSModuleIds()].map(escapeRegExp)
    return new RegExp(String.raw`(?:@master\s+shake\s*;|@import\s+(?:url\(\s*)?(['"])(?:${ids.join('|')})\1\s*\)?[^;]*;)`)
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

function findImportEnd(source: string, start: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = start; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(') {
            depth++
            continue
        }
        if (char === ')') {
            depth--
            continue
        }
        if (char === ';' && depth === 0) return index + 1
    }
    return -1
}

function parseImportSource(statement: string) {
    const match = /^\s*@import\s+(?:(["'])(.*?)\1|url\(\s*(?:(["'])(.*?)\3|([^'")\s]+))\s*\))[^;]*;\s*$/s.exec(statement)
    return match?.[2] || match?.[4] || match?.[5]
}

function isExpandableStyleImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function resolveMasterCSSPackageImport(source: string, projectDir?: string) {
    if (!normalizeStyleCSSModuleIds().has(source)) return
    const resolver = projectDir
        ? createRequire(join(projectDir, 'package.json'))
        : require
    try {
        return resolver.resolve(MASTER_CSS_PACKAGE_INDEX_ID)
    } catch {
        return require.resolve(MASTER_CSS_PACKAGE_INDEX_ID)
    }
}

function findImportStatements(source: string) {
    const imports: { start: number, end: number, statement: string }[] = []
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = 0; index < source.length; index++) {
        const char = source[index]
        const next = source[index + 1]
        if (comment) {
            if (char === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '/' && next === '*') {
            comment = true
            index++
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '{') {
            depth++
            continue
        }
        if (char === '}') {
            depth--
            continue
        }
        if (depth === 0 && source.startsWith('@import', index) && /\s/.test(source[index + '@import'.length] || '')) {
            const end = findImportEnd(source, index)
            if (end === -1) continue
            imports.push({
                start: index,
                end,
                statement: source.slice(index, end)
            })
            index = end - 1
        }
    }
    return imports
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
        const importSource = parseImportSource(importStatement.statement)
        const packageFile = options.expandMasterCSSPackage !== false && importSource && importSource !== VIRTUAL_CSS_ID
            ? resolveMasterCSSPackageImport(importSource, projectDir)
            : undefined
        if (packageFile || (importSource && isExpandableStyleImportSource(importSource))) {
            const importedFile = packageFile || resolve(dirname(absoluteFile), importSource!)
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
    return hasMasterShakeDirective(source) || hasStyleCSSImport(source)
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
    return normalizeStyleCSSModuleIds().has(id)
}

export function isMasterCSSPackageStyleFile(id: string) {
    const file = cleanStyleRequest(id).replace(/\\/g, '/')
    return /(?:^|\/)(?:packages\/core|@master\/css)\/(?:index|base|theme|utilities|runtime)\.css$/.test(file)
}

export function removeMasterStyleDirectives(source: string) {
    return removeExtractorDirectiveStatements(source)
}

export function createStyleCSSHostSource(source: string) {
    const cleanSource = removeMasterStyleDirectives(source).code
    const imports = findImportStatements(cleanSource)
    const preservedImports: string[] = []
    for (const importStatement of imports) {
        const importSource = parseImportSource(importStatement.statement)
        if (!importSource) continue
        if (
            importSource === VIRTUAL_CSS_ID ||
            normalizeStyleCSSModuleIds().has(importSource) ||
            !isExpandableStyleImportSource(importSource)
        ) {
            preservedImports.push(importStatement.statement.trim())
        }
    }
    if (!preservedImports.some((statement) => {
        const importSource = parseImportSource(statement)
        return importSource && (importSource === VIRTUAL_CSS_ID || normalizeStyleCSSModuleIds().has(importSource))
    })) {
        preservedImports.unshift(`@import "@master/css";`)
    }
    return preservedImports.join('\n')
}

export function removeMasterShakeDirectives(source: string) {
    return removeMasterStyleDirectives(source)
}

export function hasMasterShakeDirective(source: string) {
    return findExtractorDirectiveStatements(source).some((statement) => statement.name === 'shake')
}

export function hasMasterNoShakeDirective(source: string) {
    return findExtractorDirectiveStatements(source).some((statement) => statement.name === 'no-shake')
}

export function isMasterStyleSource(source: string) {
    return hasMasterShakeDirective(source)
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
    const shake = !hasMasterNoShakeDirective(detectionSource.source) && hasMasterShakeDirective(detectionSource.source)
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
        directives: collectedDirectives.directives,
        sourceDependencies
    })
    if (shake) {
        refreshExtractorNativeClasses(extractor, result.nativeClassNames)
    }
    return result
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
        configPath = extractor.resolvedConfigPath,
        loadConfigMode = 'always',
        includeGeneratedCSS = true,
        includeNativeCSS = true,
        ...compileOptions
    } = options
    const classes = compileOptions.classes ?? getExtractorClasses(extractor)
    const shouldLoadConfig = Boolean(configPath && (
        loadConfigMode === 'always' ||
        (loadConfigMode === 'css' && extname(configPath) === '.css')
    ))

    if (!shouldLoadConfig && !configOption && !compileOptions.classes && !styleCSSSources?.size) {
        return includeGeneratedCSS ? extractor.css.text : ''
    }

    const styleResults = await Promise.all(
        Array.from(styleCSSSources || [])
            .map(([id, styleSource]) => compileStyleCSS(id, styleSource.source, {
                ...compileOptions,
                classes: styleSource.shake
                    ? getStyleSourceClasses(extractor, styleSource, classes, compileOptions.projectDir ?? extractor.cwd)
                    : undefined
            }))
    )
    const nativeCSS = includeNativeCSS
        ? styleResults.map((result) => result.nativeCSS).filter(Boolean)
        : []
    const configResult = shouldLoadConfig && configPath
        ? await loadConfig(configPath, { classes })
        : undefined

    const css = createCSS(extendConfig(configResult?.config ?? configOption ?? extractor.config))
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
