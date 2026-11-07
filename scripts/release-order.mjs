import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { queryReleaseDirs } from 'aronrepo/node'
import { dependencyOrder, publishedDependencies } from './release-readiness.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const BINDING_TARGET_PACKAGE_PATTERN = /^packages\/binding-(?:darwin|linux|win32)-/
const WASM_PACKAGE_ROOTS = new Set([
  'packages/binding-wasm-compiler',
  'packages/binding-wasm-engine',
  'packages/binding-wasm-tooling'
])

function packageReleasePriority(root) {
  if (BINDING_TARGET_PACKAGE_PATTERN.test(root)) return 0
  // All Wasm packages depend on schema. Keep it in their early upload group.
  if (root === 'packages/schema' || WASM_PACKAGE_ROOTS.has(root)) return 1
  return 2
}

/** Public, non-private workspace packages, as Aronrepo derives its release paths. */
export function releaseWorkspaceRoots(root = repositoryRoot) {
  return queryReleaseDirs(root).sort()
}

/**
 * Workspace roots in upload order: native targets, then schema and Wasm, then the
 * rest. Uploads wait only for their own dependencies, so finishing each dependency
 * depth before the next lets npm scan as many archives at once as possible.
 */
export function releasePackageRoots(root = repositoryRoot) {
  const entries = releaseWorkspaceRoots(root).map(pkgRoot => {
    const manifest = JSON.parse(readFileSync(path.join(root, pkgRoot, 'package.json'), 'utf8'))
    return { name: manifest.name, manifest, root: pkgRoot }
  })
  const publishedNames = new Set(entries.map(({ name }) => name))
  for (const entry of entries) entry.dependencies = publishedDependencies(entry.manifest, publishedNames)
  const byName = new Map(entries.map(entry => [entry.name, entry]))
  const depths = new Map()
  const depth = entry => depths.get(entry.name) ?? depths.set(entry.name,
    Math.max(-1, ...entry.dependencies.map(name => depth(byName.get(name)))) + 1).get(entry.name)
  return dependencyOrder(entries, (a, b) => packageReleasePriority(a.root) - packageReleasePriority(b.root) ||
    depth(a) - depth(b) || a.root.localeCompare(b.root)).map(({ root: pkgRoot }) => pkgRoot)
}
