import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { CSSDirectiveReference } from 'shared/css-directives'
import { createMasterCSSPlan } from './master-css-plan'
import lowerCSSDirectives from './lower-css-directives'
import {
    compileCSS,
    createCSSDirectiveExtractionPolicy,
    findCSSReferenceStatements,
    findStandaloneMasterDirectiveStatements,
    mergeCSSDirectiveExtractionPolicy,
    removeCSSReferenceStatements,
    type CompileCSSOptions,
    setCSSTransform,
    type CSSReferenceStatement,
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
    onReference?: (reference: CSSReferenceStatement, fromFile: string) => void
}

export type CompileCSSPlanOptions = CompileCSSFileOptions & {
    basePlan?: MasterCSSPlan
}
export type CompileCSSPlanSourceOptions = CompileCSSOptions & {
    basePlan?: MasterCSSPlan
    root?: string
}

type CompileCSSPlanInternalOptions = CompileCSSPlanSourceOptions & {
    referenceStack?: string[]
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
    const references = findCSSReferenceStatements(source, absoluteFile)
    for (const reference of references) {
        options.onReference?.(reference, absoluteFile)
    }
    const sourceWithoutReferences = removeCSSReferenceStatements(source, absoluteFile)
    const imports = findCSSImportStatements(sourceWithoutReferences, absoluteFile)
    if (!imports.length) return sourceWithoutReferences

    const preservedImports: string[] = []
    const resolvedSource = replaceCSSImportStatements(sourceWithoutReferences, absoluteFile, (importStatement: CSSImportStatement): string | undefined => {
        const importSource = importStatement.source
        const packageFile = options.expandPackageImports !== false
            ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
            : undefined
        if (packageFile || isExpandableImportSource(importSource)) {
            const importedFile = packageFile || resolve(dirname(absoluteFile), importSource)
            return resolveCSSImportGraphFile(importedFile, dependencies, dependencySet, [...stack, absoluteFile], options)
        }
        preservedImports.push(importStatement.statement.trim())
        return ''
    })
    if (!preservedImports.length) return resolvedSource

    const firstImportStart = imports[0].start
    const afterImports = resolvedSource.slice(firstImportStart)
    return resolvedSource.slice(0, firstImportStart)
        + preservedImports.join('\n')
        + (afterImports ? '\n' : '')
        + afterImports
}

export function resolveCSSImportGraph(file: string, options: ResolveCSSImportGraphOptions = {}): ResolvedCSSImportGraph {
    const dependencies: string[] = []
    const references: CSSReferenceStatement[] = []
    const source = resolveCSSImportGraphFile(file, dependencies, new Set(), [], {
        ...options,
        onReference(reference, fromFile) {
            references.push(reference)
            options.onReference?.(reference, fromFile)
        }
    })
    return {
        source,
        dependencies,
        ...(references.length ? { references } : {})
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
        dependencies: graph.dependencies,
        ...(graph.references?.length ? { references: graph.references } : {})
    }
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
    if (!values) return
    for (const value of values) {
        if (!target.includes(value)) target.push(value)
    }
}

function resolveCSSReferenceFile(reference: CSSDirectiveReference, options: CompileCSSPlanSourceOptions = {}) {
    const fromFile = reference.file
        ? isAbsolute(reference.file)
            ? reference.file
            : resolve(options.root || '', reference.file)
        : resolve(options.root || process.cwd(), 'master.css')
    const packageFile = resolveMasterCSSPackageEntryFile(reference.source, fromFile, options.root)
    if (packageFile) return packageFile
    if (isExpandableImportSource(reference.source)) return resolve(dirname(fromFile), reference.source)
    throw new Error(`@reference only supports relative CSS files or Master CSS package entries: ${reference.source}`)
}

function normalizeReferenceStack(stack: string[] | undefined) {
    return (stack || []).map((file) => resolveComparablePath(file))
}

function resolveCSSReferenceContext(
    references: CSSDirectiveReference[] | undefined,
    options: CompileCSSPlanInternalOptions = {}
) {
    const dependencies: string[] = []
    const warnings: string[] = []
    let plan = options.basePlan
    let hasReferences = false

    for (const reference of references || []) {
        const referenceFile = resolveCSSReferenceFile(reference, options)
        const comparableReferenceFile = resolveComparablePath(referenceFile)
        const stack = normalizeReferenceStack(options.referenceStack)
        if (stack.includes(comparableReferenceFile)) {
            throw new Error(`Circular CSS reference: ${[...(options.referenceStack || []), referenceFile].join(' -> ')}`)
        }
        const result = compileCSSPlanFileInternal(referenceFile, {
            ...options,
            basePlan: plan,
            preserveNativeCSS: false,
            referenceStack: options.referenceStack
        })
        hasReferences = true
        plan = result.plan
        addUnique(dependencies, result.dependencies)
        addUnique(warnings, result.warnings)
    }

    return {
        dependencies,
        warnings,
        ...(hasReferences ? { plan } : {})
    }
}

function toCompileCSSPlanResult(
    result: CompileCSSResult,
    options: CompileCSSPlanInternalOptions = {}
): CompileCSSPlanResult {
    const { planInput: _directivePlanInput, ...directiveData } = result
    const referenceContext = resolveCSSReferenceContext(result.references, options)
    const lowerResult = lowerCSSDirectives(result, {
        basePlan: options.basePlan,
        resolutionPlan: referenceContext.plan,
        onWarning: options.onWarning
    })
    const dependencies: string[] = []
    const warnings: string[] = []
    addUnique(dependencies, result.dependencies)
    addUnique(dependencies, referenceContext.dependencies)
    addUnique(warnings, referenceContext.warnings)
    addUnique(warnings, lowerResult.warnings)
    const generatedCSS = lowerResult.generatedCSS || ''
    const css = [
        result.nativeCSS,
        generatedCSS
    ].filter(Boolean).join('\n')
    return {
        ...directiveData,
        dependencies,
        plan: lowerResult.plan,
        warnings,
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
    const from = options.from ? stripRequest(options.from) : undefined
    const fromFile = from ? isAbsolute(from) ? from : resolve(options.root || '', from) : undefined
    const result = compileCSS(source, {
        ...options,
        ...(fromFile ? { from: fromFile } : {})
    })
    return toCompileCSSPlanResult(result, {
        ...options,
        ...(fromFile
            ? {
                from: fromFile,
                referenceStack: [...((options as CompileCSSPlanInternalOptions).referenceStack || []), fromFile]
            }
            : {})
    })
}

function compileCSSPlanFileInternal(file: string, options: CompileCSSPlanInternalOptions = {}): CompileCSSPlanResult {
    const absoluteFile = isAbsolute(file) ? file : resolve(options.root || '', file)
    const result = compileCSSFile(file, {
        ...options,
        preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    return toCompileCSSPlanResult(result, {
        ...options,
        from: absoluteFile,
        referenceStack: [...(options.referenceStack || []), absoluteFile]
    })
}

export function compileCSSPlanFile(file: string, options: CompileCSSPlanOptions = {}): CompileCSSPlanResult {
    return compileCSSPlanFileInternal(file, options)
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
        const planResult = toCompileCSSPlanResult(result, {
            ...options,
            basePlan: plan,
            from: entry,
            referenceStack: [isAbsolute(entry) ? entry : resolve(options.root || '', entry)]
        })
        plan = planResult.plan
        addUnique(dependencies, planResult.dependencies)
        addUnique(warnings, planResult.warnings)
        const entryGeneratedCSS = planResult.generatedCSS || ''
        if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
        if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
        if (planResult.css) css.push(planResult.css)
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
