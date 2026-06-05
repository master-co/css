import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import createConfigFromCSSDirectives from '@master/css/create-config-from-css-directives'
import { extendConfig } from '@master/css/utils'
import type { Config } from '@master/css'
import { toConfigModuleResult, type CSSConfigModuleResult } from 'shared/css-config-module'
import {
    compileCSS,
    findStandaloneMasterDirectiveStatements,
    type CompileCSSOptions,
    setCSSTransform,
    type CompileCSSFileOptions,
    type CompileCSSResult,
    type ResolvedCSSImportGraph
} from './core'

export * from './core'

setCSSTransform(transform)

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@master/css'

interface CSSPackageJSON {
    name?: unknown
    style?: unknown
    exports?: unknown
}

export interface InspectCSSResult {
    hasMasterEntryDirective: boolean
    hasMasterCSSImport: boolean
    hasMasterEntry: boolean
}

export interface ResolveCSSImportGraphOptions {
    projectDir?: string
    expandPackageImports?: boolean
}

export type CompileCSSConfigOptions = Omit<CompileCSSFileOptions, 'config'> & {
    config?: Config
}

export type CompileCSSConfigSourceOptions = Omit<CompileCSSOptions, 'config'> & {
    config?: Config
}

export interface CompileCSSConfigResult extends Omit<CompileCSSResult, 'config'> {
    config: Config
    directives: CompileCSSResult
}

export interface CompileProjectConfigResult extends CompileCSSConfigResult {
    entries: string[]
}

export type CompileCSSConfigModuleResult = CSSConfigModuleResult<Config> & {
    directives: CompileCSSResult
}

function findImportEnd(source: string, startIndex: number) {
    let quote = ''
    let comment = false
    let depth = 0
    for (let index = startIndex; index < source.length; index++) {
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

function isExpandableImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
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

function removeImportStatements(source: string) {
    const imports = findImportStatements(source)
    if (!imports.length) return source
    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        index = importStatement.end
    }
    return output + source.slice(index)
}

function readJSONFile<T>(file: string) {
    return JSON.parse(readFileSync(file, 'utf-8')) as T
}

function findPackageRoot(entryFile: string, packageName: string) {
    let directory = dirname(entryFile)
    while (true) {
        const packageJSONFile = resolve(directory, 'package.json')
        if (existsSync(packageJSONFile)) {
            try {
                const packageJSON = readJSONFile<CSSPackageJSON>(packageJSONFile)
                if (packageJSON.name === packageName) {
                    return {
                        directory,
                        packageJSON
                    }
                }
            } catch {
                // Keep walking up in case this is not the package root.
            }
        }
        const parentDirectory = dirname(directory)
        if (parentDirectory === directory) return
        directory = parentDirectory
    }
}

function getPackageStyleEntry(packageJSON: CSSPackageJSON) {
    if (typeof packageJSON.style === 'string') return packageJSON.style
    if (!packageJSON.exports || typeof packageJSON.exports !== 'object') return
    const rootExport = (packageJSON.exports as Record<string, unknown>)['.']
    if (!rootExport || typeof rootExport !== 'object') return
    const styleExport = (rootExport as Record<string, unknown>).style
    return typeof styleExport === 'string' ? styleExport : undefined
}

function createProjectRequire(fromFile: string, projectDir?: string) {
    return createRequire(resolve(projectDir || dirname(fromFile), 'package.json'))
}

export function resolveMasterCSSPackageEntryFile(importSource: string, fromFile = process.cwd(), projectDir?: string) {
    if (importSource !== MASTER_CSS_PACKAGE_ID) return
    const resolver = createProjectRequire(fromFile, projectDir)
    let packageEntryFile: string
    try {
        packageEntryFile = resolver.resolve(MASTER_CSS_PACKAGE_ID)
    } catch {
        packageEntryFile = require.resolve(MASTER_CSS_PACKAGE_ID)
    }
    const packageRoot = findPackageRoot(packageEntryFile, MASTER_CSS_PACKAGE_ID)
    if (!packageRoot) return
    const styleEntry = getPackageStyleEntry(packageRoot.packageJSON)
    if (!styleEntry) return
    const styleFile = resolve(packageRoot.directory, styleEntry)
    if (!existsSync(styleFile)) {
        throw new Error(`${MASTER_CSS_PACKAGE_ID} CSS style entry was not found: ${styleFile}`)
    }
    return styleFile
}

export function inspectCSS(source: string): InspectCSSResult {
    const hasMasterEntryDirective = findStandaloneMasterDirectiveStatements(source)
        .some((statement) => statement.name === '')
    const hasMasterCSSImport = findImportStatements(source)
        .some((statement) => parseImportSource(statement.statement) === MASTER_CSS_PACKAGE_ID)
    return {
        hasMasterEntryDirective,
        hasMasterCSSImport,
        hasMasterEntry: hasMasterEntryDirective || hasMasterCSSImport
    }
}

function resolveCSSImportGraphFile(
    file: string,
    dependencies: string[],
    dependencySet: Set<string>,
    stack: string[],
    options: ResolveCSSImportGraphOptions = {}
) {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!existsSync(absoluteFile)) {
        throw new Error(`CSS config file not found: ${absoluteFile}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    const source = readFileSync(absoluteFile, 'utf-8')
    const imports = findImportStatements(source)
    if (!imports.length) return source

    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        const importSource = parseImportSource(importStatement.statement)
        const packageFile = options.expandPackageImports !== false && importSource
            ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
            : undefined
        if (packageFile || (importSource && isExpandableImportSource(importSource))) {
            if (!importSource) {
                throw new Error(`Unable to resolve CSS import in ${absoluteFile}`)
            }
            const importedFile = packageFile || resolve(dirname(absoluteFile), importSource)
            output += resolveCSSImportGraphFile(importedFile, dependencies, dependencySet, [...stack, absoluteFile], options)
        } else {
            output += importStatement.statement
        }
        index = importStatement.end
    }
    return output + source.slice(index)
}

export function resolveCSSImportGraph(file: string, options: ResolveCSSImportGraphOptions = {}): ResolvedCSSImportGraph {
    const dependencies: string[] = []
    const source = resolveCSSImportGraphFile(file, dependencies, new Set(), [], options)
    return {
        source,
        dependencies
    }
}

export function resolveMasterCSSPackageImportGraph(projectDir?: string) {
    const entry = resolveMasterCSSPackageEntryFile(MASTER_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
    if (!entry) {
        throw new Error(`Cannot resolve ${MASTER_CSS_PACKAGE_ID} CSS entry.`)
    }
    return resolveCSSImportGraph(entry, {
        projectDir
    })
}

function stripRequest(id: string) {
    return id.replace(/[?#].*$/, '')
}

function resolveComparablePath(file: string) {
    const filename = resolve(file)
    try {
        return realpathSync(filename)
    } catch {
        return filename
    }
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
    const filename = resolveComparablePath(stripRequest(id))
    if (extname(filename) !== '.css') return false
    try {
        return resolveMasterCSSPackageImportGraph(projectDir).dependencies.some((dependency) => {
            return resolveComparablePath(dependency) === filename
        })
    } catch {
        return false
    }
}

export function compileCSSFile(file: string, options: CompileCSSFileOptions = {}): CompileCSSResult {
    const { root, ...compileOptions } = options
    const absoluteFile = isAbsolute(file) ? file : resolve(root || '', file)
    const graph = resolveCSSImportGraph(absoluteFile, {
        projectDir: root
    })
    const source = compileOptions.preserveNativeCSS === false
        ? removeImportStatements(graph.source)
        : graph.source
    const result = compileCSS(source, {
        ...compileOptions,
        from: absoluteFile
    })
    return {
        ...result,
        dependencies: graph.dependencies
    }
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
    if (!values) return
    for (const value of values) {
        if (!target.includes(value)) target.push(value)
    }
}

function toCompileCSSConfigResult(
    result: CompileCSSResult,
    options: CompileCSSConfigSourceOptions = {}
): CompileCSSConfigResult {
    const adapterResult = createConfigFromCSSDirectives(result, {
        config: options.config,
        onWarning: options.onWarning
    })
    return {
        ...result,
        config: adapterResult.config,
        warnings: adapterResult.warnings,
        directives: result
    }
}

export function createConfigFromCSSResult(
    result: CompileCSSResult,
    options: CompileCSSConfigSourceOptions = {}
) {
    return toCompileCSSConfigResult(result, options)
}

export function compileCSSConfig(source: string, options: CompileCSSConfigSourceOptions = {}): CompileCSSConfigResult {
    const result = compileCSS(source, options)
    return toCompileCSSConfigResult(result, options)
}

export function compileCSSConfigFile(file: string, options: CompileCSSConfigOptions = {}): CompileCSSConfigResult {
    const result = compileCSSFile(file, {
        ...options,
        preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    return toCompileCSSConfigResult(result, options)
}

export function compileProjectConfig(entries: string[], options: CompileCSSConfigOptions = {}): CompileProjectConfigResult {
    const styleConfigs: Config[] = []
    const dependencies: string[] = []
    const classNames: string[] = []
    const nativeClassNames: string[] = []
    const nativeCSS: string[] = []
    const css: string[] = []
    const generatedCSS: string[] = []
    const warnings: string[] = []
    let directives: CompileCSSResult = {
        config: {},
        classNames: [],
        nativeClassNames: [],
        nativeCSS: '',
        css: '',
        generatedCSS: '',
        warnings: [],
        dependencies: []
    }
    for (const entry of entries) {
        const result = compileCSSFile(entry, {
            ...options,
            preserveNativeCSS: options.preserveNativeCSS ?? false
        })
        directives = result
        addUnique(dependencies, result.dependencies)
        addUnique(classNames, result.classNames)
        addUnique(nativeClassNames, result.nativeClassNames)
        if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
        if (result.css) css.push(result.css)
        if (result.generatedCSS) generatedCSS.push(result.generatedCSS)
        addUnique(warnings, result.warnings)
        const adapterResult = createConfigFromCSSDirectives(result, {
            config: extendConfig(...styleConfigs, options.config),
            onWarning: options.onWarning
        })
        styleConfigs.push(adapterResult.config)
        addUnique(warnings, adapterResult.warnings)
    }
    return {
        entries,
        config: entries.length ? extendConfig(...styleConfigs, options.config) : options.config || {},
        dependencies,
        classNames,
        nativeClassNames,
        nativeCSS: nativeCSS.join('\n'),
        css: css.join('\n'),
        generatedCSS: generatedCSS.join('\n'),
        warnings,
        directives
    }
}

export function compileCSSConfigModule(file: string, options: CompileCSSConfigOptions = {}): CompileCSSConfigModuleResult {
    return toConfigModuleResult(compileCSSConfigFile(file, options))
}

export function compileProjectConfigModule(entries: string[], options: CompileCSSConfigOptions = {}) {
    return toConfigModuleResult(compileProjectConfig(entries, options))
}
