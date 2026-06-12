import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import { createMasterCSSPlan } from './master-css-plan'
import lowerCSSDirectives from './lower-css-directives'
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

setCSSTransform(transform)

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@master/css'
const MASTER_CSS_PACKAGE_IDS = new Set([MASTER_CSS_PACKAGE_ID, '@master/css-preset'])

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

export type CompileCSSPlanOptions = CompileCSSFileOptions & {
    basePlan?: MasterCSSPlan
}
export type CompileCSSPlanSourceOptions = CompileCSSOptions & {
    basePlan?: MasterCSSPlan
}

export interface CompileCSSPlanResult extends Omit<CompileCSSResult, 'planInput'> {
    plan: MasterCSSPlan
    directives: CompileCSSResult
}

export interface CompileProjectPlanResult extends CompileCSSPlanResult {
    entries: string[]
}

export type CompileCSSPlanModuleResult = CompileCSSPlanResult & {
    code: string
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
    if (!MASTER_CSS_PACKAGE_IDS.has(importSource)) return
    const resolver = createProjectRequire(fromFile, projectDir)
    let packageEntryFile: string
    try {
        packageEntryFile = resolver.resolve(importSource)
    } catch {
        packageEntryFile = require.resolve(importSource)
    }
    const packageRoot = findPackageRoot(packageEntryFile, importSource)
    if (!packageRoot) return
    const styleEntry = getPackageStyleEntry(packageRoot.packageJSON)
    if (!styleEntry) return
    const styleFile = resolve(packageRoot.directory, styleEntry)
    if (!existsSync(styleFile)) {
        throw new Error(`${importSource} CSS style entry was not found: ${styleFile}`)
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
        throw new Error(`CSS plan entry file not found: ${absoluteFile}`)
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

function toCompileCSSPlanResult(
    result: CompileCSSResult,
    options: CompileCSSPlanSourceOptions = {}
): CompileCSSPlanResult {
    const { planInput: _directivePlanInput, ...directiveData } = result
    const lowerResult = lowerCSSDirectives(result, {
        basePlan: options.basePlan,
        onWarning: options.onWarning
    })
    const generatedCSS = lowerResult.generatedCSS || ''
    const css = [
        result.nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n')
    return {
        ...directiveData,
        plan: lowerResult.plan,
        warnings: lowerResult.warnings,
        generatedCSS,
        css,
        directives: result
    }
}

export function createPlanFromCSSResult(
    result: CompileCSSResult,
    options: CompileCSSPlanSourceOptions = {}
) {
    return toCompileCSSPlanResult(result, options)
}

export function compileCSSPlan(source: string, options: CompileCSSPlanSourceOptions = {}): CompileCSSPlanResult {
    const result = compileCSS(source, options)
    return toCompileCSSPlanResult(result, options)
}

export function compileCSSPlanFile(file: string, options: CompileCSSPlanOptions = {}): CompileCSSPlanResult {
    const result = compileCSSFile(file, {
        ...options,
        preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    return toCompileCSSPlanResult(result, options)
}

export function compileProjectPlan(entries: string[], options: CompileCSSPlanOptions = {}): CompileProjectPlanResult {
    const dependencies: string[] = []
    let extractionPolicy = createCSSDirectiveExtractionPolicy()
    const classNames: string[] = []
    const nativeClassNames: string[] = []
    const nativeCSS: string[] = []
    const css: string[] = []
    const generatedCSS: string[] = []
    const warnings: string[] = []
    let directives: CompileCSSResult = {
        planInput: {},
        extractionPolicy: createCSSDirectiveExtractionPolicy(),
        classNames: [],
        nativeClassNames: [],
        nativeCSS: '',
        css: '',
        generatedCSS: '',
        warnings: [],
        dependencies: []
    }
    let plan: MasterCSSPlan | undefined = options.basePlan
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
        const lowerResult = lowerCSSDirectives(result, {
            basePlan: plan,
            onWarning: options.onWarning
        })
        plan = lowerResult.plan
        const entryGeneratedCSS = lowerResult.generatedCSS || ''
        if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
        if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
        const entryCSS = [
            result.nativeCSS,
            entryGeneratedCSS
        ].filter(Boolean).join('\n')
        if (entryCSS) css.push(entryCSS)
        addUnique(warnings, lowerResult.warnings)
    }
    return {
        entries,
        plan: plan || createMasterCSSPlan(),
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

type PlanUtility = NonNullable<MasterCSSPlan['utilities']>[number]

function normalizeTemplateDeclarations(declarations: Record<string, unknown>) {
    const normalized: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const value = declarations[propertyName]
        normalized[propertyName] = Array.isArray(value)
            ? value.map((part) => part === undefined ? null : part)
            : value === undefined
                ? null
                : value
    }
    return normalized
}

function normalizeUtilityForJSON(utility: PlanUtility): PlanUtility {
    if (utility.emit.type !== 'template') return utility
    return {
        ...utility,
        emit: {
            ...utility.emit,
            declarations: normalizeTemplateDeclarations(utility.emit.declarations as Record<string, unknown>)
        }
    }
}

function stringifyPlan(plan: MasterCSSPlan) {
    return JSON.stringify(plan.utilities?.length
        ? { ...plan, utilities: plan.utilities.map(normalizeUtilityForJSON) }
        : plan)
}

function toPlanModule(plan: MasterCSSPlan) {
    return `export default ${stringifyPlan(plan)};`
}

function toPlanModuleResult<T extends { plan: MasterCSSPlan }>(result: T): T & { code: string } {
    return {
        ...result,
        code: toPlanModule(result.plan)
    }
}

export function compileCSSPlanModule(file: string, options: CompileCSSPlanOptions = {}): CompileCSSPlanModuleResult {
    return toPlanModuleResult(compileCSSPlanFile(file, options))
}

export function compileProjectPlanModule(entries: string[], options: CompileCSSPlanOptions = {}) {
    return toPlanModuleResult(compileProjectPlan(entries, options))
}
