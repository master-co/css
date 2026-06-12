import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import { extendConfig } from '@master/css/utils'
import type { Config } from '@master/css'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import { toConfigModuleResult, type CSSConfigModuleResult } from '@master/css-integration/config-module'
import { toPlanModuleResult, type CSSPlanModuleResult } from '@master/css-integration/plan-module'
import { createMasterCSSPlan } from './master-css-plan'
import resolveCSSDirectiveConfig from './resolve-css-directive-config'
import {
    compileCSS,
    createCSSDirectiveExtractionPolicy,
    findStandaloneMasterDirectiveStatements,
    mergeCSSDirectiveExtractionPolicy,
    type CompileCSSOptions,
    setCSSTransform,
    type CompileCSSFileOptions,
    type CompileCSSResult,
    type ResolvedCSSImportGraph
} from './core'
import {
    findCSSImportStatements,
    removeCSSImportStatements,
    replaceCSSImportStatements,
    type CSSImportStatement
} from './lexer/imports'

export * from './core'
export { createMasterCSSPlan } from './master-css-plan'
export { default as resolveCSSDirectiveConfig } from './resolve-css-directive-config'
export type {
    CSSDirectiveConfigResolution,
    ResolveCSSDirectiveConfigOptions
} from './resolve-css-directive-config'

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
    plan: MasterCSSPlan
    directives: CompileCSSResult
}

export interface CompileProjectConfigResult extends CompileCSSConfigResult {
    entries: string[]
}

export type CompileCSSConfigModuleResult = CSSConfigModuleResult<Config> & {
    plan: MasterCSSPlan
    directives: CompileCSSResult
}

export type CompileCSSPlanModuleResult = CSSPlanModuleResult & {
    config: Config
    directives: CompileCSSResult
}

function isExpandableImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
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
    const hasMasterCSSImport = findCSSImportStatements(source)
        .some((statement) => statement.source === MASTER_CSS_PACKAGE_ID)
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
): string {
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
    const imports = findCSSImportStatements(source, absoluteFile)
    if (!imports.length) return source

    return replaceCSSImportStatements(source, absoluteFile, (importStatement: CSSImportStatement): string | undefined => {
        const importSource = importStatement.source
        const packageFile = options.expandPackageImports !== false
            ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
            : undefined
        if (packageFile || isExpandableImportSource(importSource)) {
            const importedFile = packageFile || resolve(dirname(absoluteFile), importSource)
            return resolveCSSImportGraphFile(importedFile, dependencies, dependencySet, [...stack, absoluteFile], options)
        }
    })
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
        ? removeCSSImportStatements(graph.source, absoluteFile)
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
    const adapterResult = resolveCSSDirectiveConfig(result, {
        config: options.config,
        onWarning: options.onWarning
    })
    const generatedCSS = adapterResult.generatedCSS || ''
    const css = [
        result.nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n')
    return {
        ...result,
        config: adapterResult.config,
        plan: createMasterCSSPlan(adapterResult.config),
        warnings: adapterResult.warnings,
        generatedCSS,
        css,
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

export const compileCSSPlan = compileCSSConfig

export function compileCSSConfigFile(file: string, options: CompileCSSConfigOptions = {}): CompileCSSConfigResult {
    const result = compileCSSFile(file, {
        ...options,
        preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    return toCompileCSSConfigResult(result, options)
}

export const compileCSSPlanFile = compileCSSConfigFile

export function compileProjectConfig(entries: string[], options: CompileCSSConfigOptions = {}): CompileProjectConfigResult {
    const styleConfigs: Config[] = []
    const dependencies: string[] = []
    let extractionPolicy = createCSSDirectiveExtractionPolicy()
    const classNames: string[] = []
    const nativeClassNames: string[] = []
    const nativeCSS: string[] = []
    const css: string[] = []
    const generatedCSS: string[] = []
    const warnings: string[] = []
    let directives: CompileCSSResult = {
        config: {},
        extractionPolicy: createCSSDirectiveExtractionPolicy(),
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
        extractionPolicy = mergeCSSDirectiveExtractionPolicy(extractionPolicy, result.extractionPolicy)
        addUnique(dependencies, result.dependencies)
        addUnique(classNames, result.classNames)
        addUnique(nativeClassNames, result.nativeClassNames)
        addUnique(warnings, result.warnings)
        const adapterResult = resolveCSSDirectiveConfig(result, {
            config: extendConfig(...styleConfigs, options.config),
            onWarning: options.onWarning
        })
        const entryGeneratedCSS = adapterResult.generatedCSS || ''
        if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
        if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
        const entryCSS = [
            result.nativeCSS,
            entryGeneratedCSS
        ].filter(Boolean).join('\n')
        if (entryCSS) css.push(entryCSS)
        styleConfigs.push(adapterResult.config)
        addUnique(warnings, adapterResult.warnings)
    }
    const finalConfig = entries.length ? extendConfig(...styleConfigs, options.config) : options.config || {}
    return {
        entries,
        config: finalConfig,
        plan: createMasterCSSPlan(finalConfig),
        dependencies,
        extractionPolicy,
        classNames,
        nativeClassNames,
        nativeCSS: nativeCSS.join('\n'),
        css: css.join('\n'),
        generatedCSS: generatedCSS.join('\n'),
        warnings,
        directives
    }
}

export const compileProjectPlan = compileProjectConfig

export function compileCSSConfigModule(file: string, options: CompileCSSConfigOptions = {}): CompileCSSConfigModuleResult {
    return toConfigModuleResult(compileCSSConfigFile(file, options))
}

export function compileCSSPlanModule(file: string, options: CompileCSSConfigOptions = {}): CompileCSSPlanModuleResult {
    return toPlanModuleResult(compileCSSConfigFile(file, options))
}

export function compileProjectConfigModule(entries: string[], options: CompileCSSConfigOptions = {}) {
    return toConfigModuleResult(compileProjectConfig(entries, options))
}

export function compileProjectPlanModule(entries: string[], options: CompileCSSConfigOptions = {}) {
    return toPlanModuleResult(compileProjectConfig(entries, options))
}
