import { readFileSync, readdirSync, realpathSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  inspectCSS,
  resolveMasterCSSPackageEntryFile
} from '../node-compiler'
import { createCompilerBackendSessionSync } from '@master/css-backend/compiler/node'

const MASTER_CSS_MODULE_IDS = ['@master/css'] as const
const MASTER_CSS_MODULE_ID_SET = new Set<string>(MASTER_CSS_MODULE_IDS)

export function normalizeMasterCSSModuleIds() {
  return new Set(MASTER_CSS_MODULE_IDS)
}

export function isMasterCSSModuleId(id: string) {
  return MASTER_CSS_MODULE_ID_SET.has(id)
}

export function createMasterCSSManifestEntryPattern() {
  return /(?:@master\s+entry\s*;|@import\s+(?:url\(\s*)?(['"])@master\/css\1\s*\)?[^;]*;)/
}

const CSS_MANIFEST_ENTRY_IGNORED_DIRECTORIES = new Set([
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

export function cleanCSSManifestRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

export function isCSSManifestRequest(id: string) {
  return extname(cleanCSSManifestRequest(id)) === '.css'
}

export { resolveMasterCSSPackageEntryFile }

export function hasMasterCSSManifestEntrypoint(source: string) {
  return inspectCSS(source).hasMasterEntry
}

export async function findCSSManifestEntryFiles(projectDir = process.cwd()) {
  return findCSSManifestEntryFilesSync(projectDir)
}

export function findCSSManifestEntryFilesSync(projectDir = process.cwd()) {
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = realpathSync.native(root)
  } catch {
    // Let the native project layer report unreadable roots.
  }
  return createCompilerBackendSessionSync()
    .findManifestEntries(root)
    .map((entry) => realRoot !== root && (entry === realRoot || entry.startsWith(`${realRoot}${sep}`))
      ? join(root, relative(realRoot, entry))
      : entry)
}

export async function findCSSManifestEntryFile(projectDir = process.cwd()) {
  return (await findCSSManifestEntryFiles(projectDir))[0]
}

export function findCSSManifestEntryFileSync(projectDir = process.cwd()) {
  return findCSSManifestEntryFilesSync(projectDir)[0]
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
        if (CSS_MANIFEST_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
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
        if (CSS_MANIFEST_ENTRY_IGNORED_DIRECTORIES.has(dirent.name)) continue
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

function isSameOrChildPath(parentPath: string, childPath: string) {
  const relativePath = relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${sep}`)
      && !isAbsolute(relativePath)
    )
}

function resolveWorkspaceDirectoryForEntry(cssFile: string, workspaceDirectories: Set<string>) {
  let closestDirectory: string | undefined
  const absoluteCSSFile = resolve(cssFile)
  for (const workspaceDir of workspaceDirectories) {
    const absoluteWorkspaceDir = resolve(workspaceDir)
    if (
      isSameOrChildPath(absoluteWorkspaceDir, absoluteCSSFile)
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
  for (const entry of await findCSSManifestEntryFiles(root)) {
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
  for (const entry of findCSSManifestEntryFilesSync(root)) {
    directories.add(resolveWorkspaceDirectoryForEntry(entry, packageDirectories))
  }
  return [...directories].sort()
}
