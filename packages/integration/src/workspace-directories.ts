import { readFileSync, readdirSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'out',
  '.next',
  '.nuxt',
  '.svelte-kit'
])
const MASTER_CSS_PACKAGE_NAME = /^@master\/css(?:$|[.-])/
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
] as const

type PackageJSON = Partial<Record<typeof DEPENDENCY_FIELDS[number], unknown>>

function hasMasterCSSDependency(packageJSON: PackageJSON) {
  return DEPENDENCY_FIELDS.some((field) => {
    const dependencies = packageJSON[field]
    return dependencies
      && typeof dependencies === 'object'
      && Object.keys(dependencies).some((dependency) => MASTER_CSS_PACKAGE_NAME.test(dependency))
  })
}

async function collectPackageDirectories(directory: string, directories: Set<string>) {
  try {
    for (const dirent of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(dirent.name)) {
          await collectPackageDirectories(file, directories)
        }
      } else if (dirent.isFile() && dirent.name === 'package.json') {
        try {
          if (hasMasterCSSDependency(JSON.parse(await readFile(file, 'utf8')) as PackageJSON)) {
            directories.add(dirname(file))
          }
        } catch {
          // A package can disappear while a watcher is discovering workspaces.
        }
      }
    }
  } catch {
    // Ignore unreadable directories; project compilation reports concrete entry errors.
  }
}

function collectPackageDirectoriesSync(directory: string, directories: Set<string>) {
  try {
    for (const dirent of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, dirent.name)
      if (dirent.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(dirent.name)) {
          collectPackageDirectoriesSync(file, directories)
        }
      } else if (dirent.isFile() && dirent.name === 'package.json') {
        try {
          if (hasMasterCSSDependency(JSON.parse(readFileSync(file, 'utf8')) as PackageJSON)) {
            directories.add(dirname(file))
          }
        } catch {
          // A package can disappear while a watcher is discovering workspaces.
        }
      }
    }
  } catch {
    // Ignore unreadable directories; project compilation reports concrete entry errors.
  }
}

function isSameOrChildPath(parent: string, child: string) {
  const path = relative(parent, child)
  return path === '' || (
    path !== '..'
    && !path.startsWith(`..${sep}`)
    && !isAbsolute(path)
  )
}

function resolveEntryWorkspace(entry: string, directories: ReadonlySet<string>) {
  const absoluteEntry = resolve(entry)
  let closest: string | undefined
  for (const directory of directories) {
    const absoluteDirectory = resolve(directory)
    if (
      isSameOrChildPath(absoluteDirectory, absoluteEntry)
      && (!closest || absoluteDirectory.length > closest.length)
    ) {
      closest = absoluteDirectory
    }
  }
  return closest ?? dirname(absoluteEntry)
}

function finalizeWorkspaceDirectories(
  root: string,
  packageDirectories: ReadonlySet<string>,
  manifestEntries: readonly string[]
) {
  const directories = new Set<string>([root, ...packageDirectories])
  for (const entry of manifestEntries) {
    directories.add(resolveEntryWorkspace(entry, packageDirectories))
  }
  return Object.freeze([...directories].sort())
}

export async function discoverBuildWorkspaceDirectories(
  rootDirectory: string,
  manifestEntries: readonly string[] = []
): Promise<readonly string[]> {
  const root = resolve(rootDirectory)
  const packageDirectories = new Set<string>()
  await collectPackageDirectories(root, packageDirectories)
  return finalizeWorkspaceDirectories(root, packageDirectories, manifestEntries)
}

export function discoverBuildWorkspaceDirectoriesSync(
  rootDirectory: string,
  manifestEntries: readonly string[] = []
): readonly string[] {
  const root = resolve(rootDirectory)
  const packageDirectories = new Set<string>()
  collectPackageDirectoriesSync(root, packageDirectories)
  return finalizeWorkspaceDirectories(root, packageDirectories, manifestEntries)
}
