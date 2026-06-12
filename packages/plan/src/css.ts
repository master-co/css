import { readFileSync, readdirSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import {
    inspectCSS,
    resolveMasterCSSPackageEntryFile
} from '@master/css-compiler'
import {
    createMasterCSSPlanEntryPattern,
    hasMasterCSSPlanEntrypoint as hasMasterCSSPlanEntrypointFallback,
    isMasterCSSModuleId,
    normalizeMasterCSSModuleIds
} from '@master/css-lexer'
import { stripResourceQuery } from '@master/css-integration/plan-module'

const CSS_PLAN_ENTRY_IGNORED_DIRECTORIES = new Set([
    'node_modules',
    'dist',
    'out',
    '.next',
    '.nuxt',
    '.svelte-kit'
])

const MASTER_CSS_PACKAGE_NAME_PATTERN = /^@master\/css(?:$|[.-])/

const PACKAGE_JSON_DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
] as const

type PackageJSON = Partial<Record<typeof PACKAGE_JSON_DEPENDENCY_FIELDS[number], unknown>>

export function cleanCSSPlanRequest(id: string) {
    return stripResourceQuery(id)
}

export function isCSSPlanRequest(id: string) {
    return extname(cleanCSSPlanRequest(id)) === '.css'
}

export {
    createMasterCSSPlanEntryPattern,
    isMasterCSSModuleId,
    normalizeMasterCSSModuleIds,
    resolveMasterCSSPackageEntryFile
}

export function hasMasterCSSPlanEntrypoint(source: string) {
    try {
        return inspectCSS(source).hasMasterEntry
    } catch {
        return hasMasterCSSPlanEntrypointFallback(source)
    }
}

async function collectCSSPlanEntryFiles(directory: string, entries: string[]) {
    try {
        for (const dirent of await readdir(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_PLAN_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                await collectCSSPlanEntryFiles(file, entries)
                continue
            }
            if (!dirent.isFile() || extname(dirent.name) !== '.css') continue
            try {
                if (hasMasterCSSPlanEntrypoint(await readFile(file, 'utf8'))) {
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

function collectCSSPlanEntryFilesSync(directory: string, entries: string[]) {
    try {
        for (const dirent of readdirSync(directory, { withFileTypes: true })) {
            const file = join(directory, dirent.name)
            if (dirent.isDirectory()) {
                if (CSS_PLAN_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
                collectCSSPlanEntryFilesSync(file, entries)
                continue
            }
            if (!dirent.isFile() || extname(dirent.name) !== '.css') continue
            try {
                if (hasMasterCSSPlanEntrypoint(readFileSync(file, 'utf8'))) {
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

export async function findCSSPlanEntryFiles(projectDir = process.cwd()) {
    const entries: string[] = []
    await collectCSSPlanEntryFiles(resolve(projectDir), entries)
    return entries.sort()
}

export function findCSSPlanEntryFilesSync(projectDir = process.cwd()) {
    const entries: string[] = []
    collectCSSPlanEntryFilesSync(resolve(projectDir), entries)
    return entries.sort()
}

export async function findCSSPlanEntryFile(projectDir = process.cwd()) {
    return (await findCSSPlanEntryFiles(projectDir))[0]
}

export function findCSSPlanEntryFileSync(projectDir = process.cwd()) {
    return findCSSPlanEntryFilesSync(projectDir)[0]
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
                if (CSS_PLAN_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
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
                if (CSS_PLAN_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
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
    for (const entry of await findCSSPlanEntryFiles(root)) {
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
    for (const entry of findCSSPlanEntryFilesSync(root)) {
        directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
    }
    return [...directories].sort()
}
