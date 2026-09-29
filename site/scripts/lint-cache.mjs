import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'fast-glob'
import { discoverManifestEntriesSync, loadProjectManifestSync } from '@master/css-compiler/project/sync'
import { discoverBuildWorkspaceDirectoriesSync } from '@master/css-internal/workspace-directories'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function workspaceRuntimeInputs(root) {
  const packages = new Map(glob.sync('packages/*/package.json', { cwd: root, absolute: true }).map(file => {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    return [data.name, { directory: dirname(file), data }]
  }))
  const pending = ['@master/eslint-config-css', '@master/css-compiler', '@master/css-internal']
  const visited = new Set()
  const inputs = []
  while (pending.length) {
    const name = pending.pop()
    if (visited.has(name)) continue
    visited.add(name)
    const pkg = packages.get(name)
    if (!pkg) continue
    inputs.push(join(pkg.directory, 'package.json'))
    // Hash the delivered code/assets, including bundled internal helpers and
    // optional native packages. Workspace versions need not change on rebuild.
    for (const file of glob.sync(pkg.data.files ?? ['dist'], { cwd: pkg.directory, absolute: true, dot: true, onlyFiles: false })) {
      if (statSync(file).isDirectory()) {
        inputs.push(...glob.sync('**/*', { cwd: file, absolute: true, dot: true, onlyFiles: true }))
      } else {
        inputs.push(file)
      }
    }
    for (const dependency of Object.keys({ ...pkg.data.dependencies, ...pkg.data.optionalDependencies, ...pkg.data.peerDependencies })) {
      if (packages.has(dependency)) pending.push(dependency)
    }
  }
  return inputs
}

/** Content fingerprint for inputs ESLint cannot infer from an individual file. */
export function lintCacheFingerprint({ site = join(repository, 'site'), root = repository } = {}) {
  const inputs = new Set([
    ...['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.gitignore', 'scripts/typescript-tooling-compat.mjs'].map(file => join(root, file)),
    ...['package.json', '.gitignore', 'scripts/lint.mjs', 'scripts/lint-cache.mjs'].map(file => join(site, file)),
    ...glob.sync(['**/eslint.config.*', 'eslint.rules.*'], { cwd: site, absolute: true, dot: true, ignore: ['node_modules/**', '.next/**', 'out/**', '.cache/**'] }),
    ...workspaceRuntimeInputs(root)
  ])
  const entries = discoverManifestEntriesSync({ root: site })
  const directories = discoverBuildWorkspaceDirectoriesSync(site, entries, file => {
    // The inventory catches new/deleted candidates. Directory mtimes would
    // unnecessarily invalidate on source edits and on writing the lint cache.
    if (statSync(file).isFile()) inputs.add(file)
  })
  for (const directory of directories) {
    const project = loadProjectManifestSync({
      root: directory,
      baseManifest: defaultManifest,
      onDependency: file => inputs.add(file)
    })
    for (const file of project.dependencies) inputs.add(file)
  }
  if (process.env.MASTER_CSS_NATIVE_BINDING_PATH) inputs.add(resolve(process.env.MASTER_CSS_NATIVE_BINDING_PATH))
  const hash = createHash('sha256')
  hash.update(JSON.stringify([process.version, process.platform, process.arch, process.env.NODE_OPTIONS ?? '', site]))
  // Next's link diagnostics depend on other route filenames, even when the
  // file containing the link has not changed.
  hash.update(JSON.stringify(glob.sync(['app/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}', 'src/pages/**/*.{js,jsx,ts,tsx}'], { cwd: site }).sort()))
  for (const file of [...inputs].sort()) {
    const name = relative(root, file)
    hash.update(JSON.stringify(isAbsolute(name) ? file : name))
    try {
      hash.update(readFileSync(file))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      hash.update('<missing>')
    }
    hash.update('\0')
  }
  return hash.digest('hex')
}
