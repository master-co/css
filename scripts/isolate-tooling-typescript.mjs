import { existsSync, globSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { legacyTypeScriptAlias, legacyTypeScriptPackages, legacyTypeScriptVersion } from './toolchain-policy.mjs'

/**
 * Bun currently reuses a root-provided TypeScript peer even when a nested
 * override requests TS6. Give only the declared legacy tools their own real
 * dependency boundary. This changes installation output, not runtime loading.
 */
export function isolateToolingTypeScript(root = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  root = realpathSync(root)
  const nodeModules = join(root, 'node_modules')
  const legacy = new Set(legacyTypeScriptPackages)
  const visited = new Set()
  let count = 0
  function visitModules(directory) {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const candidate = join(directory, entry.name)
      if (entry.name.startsWith('@')) {
        for (const scoped of readdirSync(candidate)) visitPackage(join(candidate, scoped))
      } else visitPackage(candidate)
    }
  }
  function visitPackage(directory) {
    if (!existsSync(join(directory, 'package.json'))) return
    const actual = realpathSync(directory)
    // Workspace symlinks belong to repository source, never to this workaround.
    const parts = relative(root, actual).split(/[\\/]/)
    if (parts[0] === '..' || !parts.includes('node_modules') || visited.has(actual)) return
    visited.add(actual)
    const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
    if (legacy.has(manifest.name)) {
      const require = createRequire(join(directory, 'package.json'))
      const dependency = require.resolve(`${legacyTypeScriptAlias}/package.json`)
      const compiler = JSON.parse(readFileSync(dependency, 'utf8'))
      if (compiler.version !== legacyTypeScriptVersion) throw new Error(`Incorrect legacy TypeScript for ${manifest.name}`)
      const link = join(directory, 'node_modules/typescript')
      const installed = lstatSync(link, { throwIfNoEntry: false })
      if (installed && (!existsSync(link) || realpathSync(link) !== realpathSync(dirname(dependency)))) {
        if (!installed.isSymbolicLink()) throw new Error(`Refusing to replace an installed TypeScript directory: ${link}`)
        rmSync(link)
      }
      mkdirSync(dirname(link), { recursive: true })
      if (!existsSync(link)) symlinkSync(dirname(dependency), link, process.platform === 'win32' ? 'junction' : 'dir')
      count++
    }
    visitModules(join(directory, 'node_modules'))
  }
  visitModules(nodeModules)
  const manifestFile = join(root, 'package.json')
  if (existsSync(manifestFile)) {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    for (const workspace of globSync(manifest.workspaces || [], { cwd: root })) {
      visitModules(join(root, workspace, 'node_modules'))
    }
  }
  return count
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Isolated TypeScript ${legacyTypeScriptVersion} for ${isolateToolingTypeScript()} third-party tooling package(s).`)
}
