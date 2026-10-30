import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { TOML } from 'bun'
import fg from 'fast-glob'

const guidance = [
  'AGENTS.md',
  '.ai/context/index.md',
  '.ai/context/package-routing.md',
  '.ai/context/accuracy-guardrails.md',
  '.ai/context/testing.md'
]
const dependencyKinds = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const cargoDependencyKinds = ['dependencies', 'dev-dependencies', 'build-dependencies']
const unique = values => [...new Set(values)].sort()
const readJSON = path => JSON.parse(readFileSync(path, 'utf8'))
const readTOML = path => TOML.parse(readFileSync(path, 'utf8'))

function repositoryPath(root, path) {
  const result = relative(root, resolve(root, path)).split('\\').join('/')
  if (result === '..' || result.startsWith('../') || isAbsolute(result)) {
    throw new Error(`Path is outside the repository: ${path}`)
  }
  return result || '.'
}

function localInstructions(root, path) {
  const files = []
  for (let directory = resolve(root, path); directory !== dirname(directory); directory = dirname(directory)) {
    for (const name of ['AGENTS.md', 'AI.md']) {
      const candidate = resolve(directory, name)
      if (existsSync(candidate)) files.push(repositoryPath(root, candidate))
    }
    if (directory === root) break
  }
  return unique(files)
}

function inventory(root) {
  const rootPackage = readJSON(resolve(root, 'package.json'))
  const workspacePatterns = Array.isArray(rootPackage.workspaces)
    ? rootPackage.workspaces
    : rootPackage.workspaces?.packages ?? []
  const packageFiles = fg.sync(['package.json', ...workspacePatterns.map(path => `${path}/package.json`)], {
    cwd: root, onlyFiles: true, ignore: ['**/node_modules/**', '**/dist/**']
  }).sort()
  const packages = packageFiles.map(manifest => {
    const pkg = readJSON(resolve(root, manifest))
    const path = dirname(manifest)
    return {
      name: pkg.name || path,
      path,
      kind: 'package',
      manifest,
      private: Boolean(pkg.private),
      scripts: pkg.scripts || {},
      exports: pkg.exports ?? null,
      instructions: localInstructions(root, path),
      dependencies: unique(dependencyKinds.flatMap(kind => Object.keys(pkg[kind] || {})))
    }
  })
  if (existsSync(resolve(root, 'Cargo.toml'))) {
    const workspace = readTOML(resolve(root, 'Cargo.toml')).workspace || {}
    const manifests = fg.sync((workspace.members || []).map(path => `${path}/Cargo.toml`), {
      cwd: root, onlyFiles: true, ignore: (workspace.exclude || []).map(path => `${path}/**`)
    }).sort()
    for (const manifest of manifests) {
      const cargo = readTOML(resolve(root, manifest))
      if (!cargo.package?.name) continue
      const scopes = [cargo, ...Object.values(cargo.target || {})]
      const dependencies = scopes.flatMap(scope => cargoDependencyKinds.flatMap(kind =>
        Object.entries(scope[kind] || {}).map(([name, dependency]) => {
          const resolved = dependency.workspace ? workspace.dependencies?.[name] : dependency
          return resolved?.package || name
        })
      ))
      packages.push({
        name: cargo.package.name,
        path: dirname(manifest),
        kind: 'crate',
        manifest,
        instructions: localInstructions(root, dirname(manifest)),
        dependencies: unique(dependencies)
      })
    }
  }
  const names = new Set(packages.map(pkg => pkg.name))
  for (const pkg of packages) pkg.dependencies = pkg.dependencies.filter(name => names.has(name))
  for (const pkg of packages) pkg.dependents = packages.filter(other => other.dependencies.includes(pkg.name)).map(other => other.name).sort()
  return packages.sort((left, right) => left.path.localeCompare(right.path))
}

function decodeDiffPath(value) {
  if (!value.startsWith('"')) return value.split('\t', 1)[0]
  const bytes = []
  // Git quotes paths as C strings, including octal UTF-8 bytes.
  for (let index = 1; index < value.length; index++) {
    const character = String.fromCodePoint(value.codePointAt(index))
    if (character === '"') return Buffer.from(bytes).toString('utf8')
    if (character !== '\\') {
      bytes.push(...Buffer.from(character))
      index += character.length - 1
      continue
    }
    const escape = value[++index]
    const octal = value.slice(index).match(/^[0-7]{1,3}/)?.[0]
    if (octal) {
      bytes.push(parseInt(octal, 8))
      index += octal.length - 1
    } else {
      bytes.push(...Buffer.from(({ t: '\t', n: '\n', r: '\r', b: '\b', f: '\f', v: '\v' })[escape] || escape))
    }
  }
  throw new Error('Unterminated quoted path in diff')
}

export function extractDiffPaths(diff) {
  const paths = []
  let inHunk = false
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) inHunk = false
    if (line.startsWith('@@')) inHunk = true
    if (inHunk) continue
    const file = line.match(/^(---|\+\+\+) (.+)$/)
    const rename = line.match(/^(?:rename|copy) (?:from|to) (.+)$/)
    if (file) {
      const path = decodeDiffPath(file[2])
      if (path !== '/dev/null') paths.push(path.replace(/^[ab]\//, ''))
    } else if (rename) paths.push(decodeDiffPath(rename[1]))
    else if (line.startsWith('diff --git ')) {
      const pathsText = line.slice('diff --git '.length)
      const pair = pathsText.match(/^("(?:\\.|[^"\\])*"|a\/.+?) ("(?:\\.|[^"\\])*"|b\/.+)$/)
      if (pair) paths.push(...pair.slice(1).map(path => decodeDiffPath(path).replace(/^[ab]\//, '')))
    }
  }
  return unique(paths)
}

export function contributorContext({ root = process.cwd(), paths = [], diff = '', graph = false } = {}) {
  root = realpathSync(root)
  for (const path of guidance) {
    if (!existsSync(resolve(root, path))) throw new Error(`Expected Master CSS repository guidance: ${path}`)
  }
  const inputs = unique([...paths, ...extractDiffPaths(diff)].map(path => repositoryPath(root, path)))
  const packages = inventory(root)
  const affected = new Map()
  for (const path of inputs) {
    const owner = packages.filter(pkg => pkg.path === '.' || path === pkg.path || path.startsWith(`${pkg.path}/`))
      .sort((left, right) => right.path.length - left.path.length)[0]
    const entry = affected.get(owner.path) || { ...owner, matchedPaths: [] }
    entry.matchedPaths.push(path)
    affected.set(owner.path, entry)
  }
  const owners = [...affected.values()]
  const context = unique([
    ...guidance,
    ...owners.flatMap(owner => [owner.manifest, ...owner.instructions]),
    ...inputs.flatMap(path => localInstructions(root, dirname(path))),
    ...(inputs.some(path => path.startsWith('crates/') || path.startsWith('parity/') || /^Cargo\.(toml|lock)$/.test(path))
      ? ['Cargo.toml', '.ai/context/rust-routing.md'] : [])
  ])
  return {
    root,
    inputs,
    owners,
    context,
    note: 'Read the canonical context router and owning instructions for risk and validation policy. Scripts are available package commands, not a claim that every command is required.',
    ...(graph ? { packages } : {})
  }
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { root: { type: 'string' }, diff: { type: 'string' }, graph: { type: 'boolean' }, help: { type: 'boolean' } }
  })
  if (values.help) {
    console.log('Usage: bun scripts/contributor-context.mjs [--root PATH] [--diff FILE|-] [--graph] [paths...]\n\nReports ownership and existing guidance from this repository. --graph includes all workspace packages and crates. --diff - reads a Git diff from stdin. No files are written.')
    return
  }
  const root = values.root || process.cwd()
  const diff = values.diff ? readFileSync(values.diff === '-' ? 0 : resolve(root, values.diff), 'utf8') : ''
  console.log(JSON.stringify(contributorContext({ root, paths: positionals, diff, graph: values.graph }), null, 2))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { main() } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
