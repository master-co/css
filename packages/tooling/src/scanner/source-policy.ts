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

/** Shared Node input boundary. No global Git configuration or ignore file is read. */
export class SourcePolicy {
  readonly dependencies = new Set<string>()
  readonly root: string
  private readonly cache = new Map<string, { identity: string, matcher: Ignore }>()
  constructor(readonly projectDir: string, readonly options: SourcePolicyOptions = {}) {
    this.root = resolve(projectDir)
    for (let directory = resolve(projectDir); ; directory = dirname(directory)) {
      if (existsSync(resolve(directory, '.git')) || existsSync(resolve(directory, 'pnpm-workspace.yaml'))) this.root = directory
      const parent = dirname(directory)
      if (parent === directory) break
    }
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
    const directories: string[] = []
    for (let directory = dirname(file); inside(this.root, directory); directory = dirname(directory)) {
      directories.unshift(directory)
      if (directory === this.root) break
    }
    const rules: { directory: string, matcher: Ignore }[] = []
    const ignored = (target: string, directory: boolean) => {
      let result = false
      for (const rule of rules) {
        const name = posix(relative(rule.directory, target)) + (directory ? '/' : '')
        const match = rule.matcher.test(name)
        if (match.ignored) result = true
        if (match.unignored) result = false
      }
      return result
    }
    for (const directory of directories) {
      if (directory !== this.root && ignored(directory, true)) return false
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
    return !ignored(file, false)
  }
}
