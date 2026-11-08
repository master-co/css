import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import ignore, { type Ignore } from 'ignore'
import { minimatch } from 'minimatch'

export interface SourcePolicyOptions {
  readonly exclude?: readonly string[]
  readonly outputDirectories?: readonly string[]
}
const automaticExcludes = ['**/node_modules/**', '**/*.d.ts', '**/*.d.mts', '**/*.d.cts', '**/dist/**', '**/out/**', '**/.cache/**', '**/.next/**', '**/.nuxt/**', '**/.output/**', '**/.svelte-kit/**']
const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.bmp', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.zip', '.gz', '.br', '.wasm', '.mp3', '.mp4', '.webm', '.mov'])
const neverInputs = ['**/.git/**', '**/.hg/**', '**/.svn/**', '**/.master/**']
const posix = (value: string) => value.split(sep).join('/')
const inside = (root: string, file: string) => { const path = relative(root, file); return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`) }

function isWorkspace(directory: string) {
  if (existsSync(resolve(directory, 'pnpm-workspace.yaml'))) return true
  try {
    const { workspaces } = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
    return Array.isArray(workspaces) || Array.isArray(workspaces?.packages)
  } catch { return false }
}

/**
 * Shared Node input boundary. No global Git configuration or ignore file is read.
 *
 * Ignore files apply from the nearest repository (`.git`, a directory or a worktree
 * file) or, without one, the outermost workspace root. A project its repository
 * ignores, such as a verification copy in an ignored directory or a checkout under a
 * home-directory repository that ignores everything, is its own root.
 */
export class SourcePolicy {
  readonly dependencies = new Set<string>()
  readonly root: string
  private readonly cache = new Map<string, { identity: string, matcher: Ignore }>()
  constructor(readonly projectDir: string, readonly options: SourcePolicyOptions = {}) {
    const project = resolve(projectDir)
    const workspaces: string[] = []
    let repository: string | undefined
    for (let directory = project; ; directory = dirname(directory)) {
      if (existsSync(resolve(directory, '.git'))) { repository = directory; break }
      if (isWorkspace(directory)) workspaces.push(directory)
      const parent = dirname(directory)
      if (parent === directory) break
    }
    let root = repository ?? workspaces.at(-1) ?? project
    if (root !== project && this.ignored(root, project, true)) {
      // The repository excludes the project: use the outermost workspace whose own
      // ignore files keep it, or the project itself.
      const outer = root
      root = workspaces.findLast(workspace => workspace !== outer && !this.ignored(workspace, project, true)) ?? project
    }
    this.root = root
  }

  accepts(source: string, explicit = false): boolean {
    const file = resolve(this.projectDir, source.split('?')[0])
    if (binaryExtensions.has(extname(file).toLowerCase())) return false
    const path = posix(file)
    const matches = (pattern: string) => minimatch(path, pattern, { dot: true }) || minimatch(posix(relative(this.projectDir, file)), pattern, { dot: true })
    if (neverInputs.some(matches) || this.options.outputDirectories?.some(directory => inside(resolve(this.projectDir, directory), file))) return false
    if (this.options.exclude?.some(matches)) return false
    if (explicit) return true
    if (automaticExcludes.some(matches)) return false
    return !this.ignored(this.root, file, false)
  }

  /** Whether the ignore files from `root` down to `target` exclude it or a directory above it. */
  private ignored(root: string, target: string, isDirectory: boolean): boolean {
    const directories: string[] = []
    for (let directory = isDirectory ? target : dirname(target); inside(root, directory); directory = dirname(directory)) {
      directories.unshift(directory)
      if (directory === root) break
    }
    const rules: { directory: string, matcher: Ignore }[] = []
    const ignored = (path: string, directory: boolean) => {
      let result = false
      for (const rule of rules) {
        const name = posix(relative(rule.directory, path)) + (directory ? '/' : '')
        const match = rule.matcher.test(name)
        if (match.ignored) result = true
        if (match.unignored) result = false
      }
      return result
    }
    for (const directory of directories) {
      if (directory !== root && ignored(directory, true)) return true
      if (isDirectory && directory === target) return false
      const filename = resolve(directory, '.gitignore')
      this.dependencies.add(filename)
      try {
        const stat = statSync(filename)
        const identity = `${stat.mtimeMs}:${stat.size}:${stat.ino}`
        let cached = this.cache.get(filename)
        if (cached?.identity !== identity) {
          cached = { identity, matcher: ignore().add(readFileSync(filename, 'utf8')) }
          this.cache.set(filename, cached)
        }
        rules.push({ directory, matcher: cached.matcher })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        this.cache.delete(filename)
      }
    }
    return !isDirectory && ignored(target, false)
  }
}
