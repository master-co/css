import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve, sep } from 'node:path'
import type { compileCSS as compileCSSFunction, CompileCSSOptions, CompileCSSResult } from '@master/css-compiler'
import {
    createMasterCSSConfigEntryPattern,
    findCSSImportStatements,
    hasMasterCSSConfigEntrypoint,
    isMasterCSSModuleId,
    normalizeMasterCSSModuleIds,
    parseCSSImportSource,
    removeMasterDirectiveStatements
} from 'shared/css-config-entry'
import { stripResourceQuery } from 'shared/css-config-module'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'

type CompileCSS = typeof compileCSSFunction

const require = createRequire(import.meta.url)

const CSS_CONFIG_ENTRY_IGNORED_DIRECTORIES = new Set([
    'node_modules',
    'dist',
    'out',
    '.next',
    '.nuxt',
    '.svelte-kit'
])

const MASTER_CSS_PACKAGE_ID = '@master/css'
const MASTER_CSS_PACKAGE_NAME_PATTERN = /^@master\/css(?:$|[.-])/

const PACKAGE_JSON_DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
] as const

type PackageJSON = Partial<Record<typeof PACKAGE_JSON_DEPENDENCY_FIELDS[number], unknown>>

interface CSSPackageJSON extends PackageJSON {
    name?: unknown
    style?: unknown
    exports?: unknown
}

export interface ResolvedCSSConfigImportGraph {
    source: string
    dependencies: string[]
}

export interface ResolveCSSConfigImportGraphOptions {
    projectDir?: string
    expandMasterCSSPackage?: boolean
}

export function cleanCSSConfigRequest(id: string) {
    return stripResourceQuery(id)
}

export function isCSSConfigRequest(id: string) {
    return extname(cleanCSSConfigRequest(id)) === '.css'
}

export {
    createMasterCSSConfigEntryPattern,
    hasMasterCSSConfigEntrypoint,
    isMasterCSSModuleId,
    normalizeMasterCSSModuleIds
}

function isExpandableImportSource(source: string) {
    return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function createProjectRequire(fromFile: string, projectDir?: string) {
    return createRequire(join(projectDir || dirname(fromFile), 'package.json'))
}

function readJSONFile<T>(file: string) {
    return JSON.parse(readFileSync(file, 'utf-8')) as T
}

function findPackageRoot(entryFile: string, packageName: string) {
    let directory = dirname(entryFile)
    while (true) {
        const packageJSONFile = join(directory, 'package.json')
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

export function resolveMasterCSSPackageEntryFile(importSource: string, fromFile = process.cwd(), projectDir?: string) {
    if (!isMasterCSSModuleId(importSource)) return
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

function resolveCSSConfigImportGraphFile(
    file: string,
    source: string,
    dependencies: string[],
    dependencySet: Set<string>,
    stack: string[],
    options: ResolveCSSConfigImportGraphOptions = {}
): string {
    const absoluteFile = resolve(file)
    if (stack.includes(absoluteFile)) {
        throw new Error(`Circular CSS import: ${[...stack, absoluteFile].join(' -> ')}`)
    }
    if (!dependencySet.has(absoluteFile)) {
        dependencySet.add(absoluteFile)
        dependencies.push(absoluteFile)
    }

    const imports = findCSSImportStatements(source)
    if (!imports.length) return source

    let output = ''
    let index = 0
    for (const importStatement of imports) {
        output += source.slice(index, importStatement.start)
        const importSource = parseCSSImportSource(importStatement.statement)
        const packageFile = options.expandMasterCSSPackage !== false && importSource
            ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
            : undefined
        if (packageFile || (importSource && isExpandableImportSource(importSource))) {
            const importedFile = packageFile || resolve(dirname(absoluteFile), importSource!)
            if (!existsSync(importedFile)) {
                throw new Error(`CSS config file not found: ${importedFile}`)
            }
            output += resolveCSSConfigImportGraphFile(
                importedFile,
                readFileSync(importedFile, 'utf-8'),
                dependencies,
                dependencySet,
                [...stack, absoluteFile],
                options
            )
        } else {
            output += importStatement.statement
        }
        index = importStatement.end
    }
    return output + source.slice(index)
}

export function resolveCSSConfigImportGraph(
    file: string,
    source = readFileSync(cleanCSSConfigRequest(file), 'utf-8'),
    options: ResolveCSSConfigImportGraphOptions = {}
): ResolvedCSSConfigImportGraph {
    const filename = cleanCSSConfigRequest(file)
    const dependencies: string[] = []
    if (!isCSSConfigRequest(filename)) {
        return {
            source,
            dependencies: [filename]
        }
    }
    return {
        source: resolveCSSConfigImportGraphFile(filename, source, dependencies, new Set(), [], options),
        dependencies
    }
}

export function resolveMasterCSSPackageImportGraph(projectDir?: string) {
    const entry = resolveMasterCSSPackageEntryFile(MASTER_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
    if (!entry) {
        throw new Error(`Cannot resolve ${MASTER_CSS_PACKAGE_ID} CSS entry.`)
    }
    return resolveCSSConfigImportGraph(entry, readFileSync(entry, 'utf-8'), {
        projectDir
    })
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
    const filename = resolve(cleanCSSConfigRequest(id))
    if (extname(filename) !== '.css') return false
    try {
        return resolveMasterCSSPackageImportGraph(projectDir).dependencies.some((dependency) => {
            return resolve(dependency) === filename
        })
    } catch {
        return false
    }
}

function prepareCSSConfigSource(source: string) {
    const imports = findCSSImportStatements(source)
    let body = ''
    let hoistedImports = ''
    let index = 0
    for (const importStatement of imports) {
        body += source.slice(index, importStatement.start)
        const importSource = parseCSSImportSource(importStatement.statement)
        if (!importSource || (!isMasterCSSModuleId(importSource) && importSource !== VIRTUAL_CSS_ID)) {
            hoistedImports += importStatement.statement
        }
        index = importStatement.end
    }
    body += source.slice(index)
    return removeMasterDirectiveStatements(`${hoistedImports}${body}`).code
}

export function compileCSSConfigFile(
    compileCSS: CompileCSS,
    file: string,
    options: CompileCSSOptions = {}
): CompileCSSResult {
    const absoluteFile = resolve(cleanCSSConfigRequest(file))
    const graph = resolveCSSConfigImportGraph(absoluteFile, readFileSync(absoluteFile, 'utf-8'), {
        projectDir: dirname(absoluteFile)
    })
    const result = compileCSS(prepareCSSConfigSource(graph.source), {
        ...options,
        from: absoluteFile
    })

    return {
        ...result,
        dependencies: [...new Set(graph.dependencies)]
    }
}

async function collectCSSConfigEntryFiles(directory: string, entries: string[]) {
    try {
        for (const dirent of await readdir(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_CONFIG_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                await collectCSSConfigEntryFiles(file, entries)
                continue
            }
            if (!dirent.isFile() || extname(dirent.name) !== '.css') continue
            try {
                if (hasMasterCSSConfigEntrypoint(await readFile(file, 'utf8'))) {
                    entries.push(file)
                }
            } catch {
                // Ignore files that disappear or become unreadable while scanning.
            }
        }
    } catch {
        // Ignore directories that disappear or are unreadable while scanning.
    }
}

function collectCSSConfigEntryFilesSync(directory: string, entries: string[]) {
    try {
        for (const dirent of readdirSync(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_CONFIG_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                collectCSSConfigEntryFilesSync(file, entries)
                continue
            }
            if (!dirent.isFile() || extname(dirent.name) !== '.css') continue
            try {
                if (hasMasterCSSConfigEntrypoint(readFileSync(file, 'utf8'))) {
                    entries.push(file)
                }
            } catch {
                // Ignore files that disappear or become unreadable while scanning.
            }
        }
    } catch {
        // Ignore directories that disappear or are unreadable while scanning.
    }
}

export async function findCSSConfigEntryFiles(projectDir = process.cwd()) {
    const entries: string[] = []
    await collectCSSConfigEntryFiles(resolve(projectDir), entries)
    return entries.sort()
}

export function findCSSConfigEntryFilesSync(projectDir = process.cwd()) {
    const entries: string[] = []
    collectCSSConfigEntryFilesSync(resolve(projectDir), entries)
    return entries.sort()
}

export async function findCSSConfigEntryFile(projectDir = process.cwd()) {
    return (await findCSSConfigEntryFiles(projectDir))[0]
}

export function findCSSConfigEntryFileSync(projectDir = process.cwd()) {
    return findCSSConfigEntryFilesSync(projectDir)[0]
}

function isMasterCSSDependencyName(dependency: string) {
    return MASTER_CSS_PACKAGE_NAME_PATTERN.test(dependency)
}

function hasMasterCSSDependency(packageJSON: PackageJSON) {
    return PACKAGE_JSON_DEPENDENCY_FIELDS.some((field) => {
        const dependencies = packageJSON[field]
        if (!dependencies || typeof dependencies !== 'object') return false
        return Object.keys(dependencies).some(isMasterCSSDependencyName)
    })
}

async function collectMasterCSSPackageWorkspaceDirectories(directory: string, directories: Set<string>) {
    try {
        for (const dirent of await readdir(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_CONFIG_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                await collectMasterCSSPackageWorkspaceDirectories(file, directories)
                continue
            }
            if (!dirent.isFile() || dirent.name !== 'package.json') continue
            try {
                if (hasMasterCSSDependency(JSON.parse(await readFile(file, 'utf8')) as PackageJSON)) {
                    directories.add(dirname(file))
                }
            } catch {
                // Ignore invalid or disappearing package.json files.
            }
        }
    } catch {
        // Ignore directories that disappear or are unreadable while scanning.
    }
}

function collectMasterCSSPackageWorkspaceDirectoriesSync(directory: string, directories: Set<string>) {
    try {
        for (const dirent of readdirSync(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_CONFIG_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                collectMasterCSSPackageWorkspaceDirectoriesSync(file, directories)
                continue
            }
            if (!dirent.isFile() || dirent.name !== 'package.json') continue
            try {
                if (hasMasterCSSDependency(JSON.parse(readFileSync(file, 'utf8')) as PackageJSON)) {
                    directories.add(dirname(file))
                }
            } catch {
                // Ignore invalid or disappearing package.json files.
            }
        }
    } catch {
        // Ignore directories that disappear or are unreadable while scanning.
    }
}

function resolveWorkspaceDirectoryForEntry(cssFile: string, workspaceDirectories: Set<string>) {
    let closestDirectory: string | undefined
    const absoluteCSSFile = resolve(cssFile)
    for (const workspaceDir of workspaceDirectories) {
        const absoluteWorkspaceDir = resolve(workspaceDir)
        if (
            absoluteCSSFile.startsWith(absoluteWorkspaceDir + sep)
            && (!closestDirectory || absoluteWorkspaceDir.length > closestDirectory.length)
        ) {
            closestDirectory = absoluteWorkspaceDir
        }
    }
    return closestDirectory || dirname(absoluteCSSFile)
}

export async function findMasterCSSWorkspaceDirectories(rootDir = process.cwd()) {
    const root = resolve(rootDir)
    const directories = new Set<string>([root])
    const packageDirectories = new Set<string>()
    await collectMasterCSSPackageWorkspaceDirectories(root, packageDirectories)
    for (const directory of packageDirectories) {
        directories.add(directory)
    }
    for (const entry of await findCSSConfigEntryFiles(root)) {
        directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
    }
    return [...directories].sort()
}

export function findMasterCSSWorkspaceDirectoriesSync(rootDir = process.cwd()) {
    const root = resolve(rootDir)
    const directories = new Set<string>([root])
    const packageDirectories = new Set<string>()
    collectMasterCSSPackageWorkspaceDirectoriesSync(root, packageDirectories)
    for (const directory of packageDirectories) {
        directories.add(directory)
    }
    for (const entry of findCSSConfigEntryFilesSync(root)) {
        directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
    }
    return [...directories].sort()
}
