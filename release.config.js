import { readFileSync } from 'node:fs'
import configure from '@aronrepo/semantic-release-config/configure'
import { releaseBodyTemplate, releaseNotesPath } from './scripts/semantic-release-notes.mjs'
import { dependencyOrder, publishedDependencies } from './scripts/release-readiness.mjs'

const SOURCE_RELEASE_PLUGIN = '@aronrepo/semantic-release-pnpm'
const WORKSPACE_RELEASE_PLUGIN = './scripts/semantic-release-workspace.mjs'
const PROMOTION_PLUGIN = './scripts/semantic-release-promotion.mjs'
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

function orderReleasePlugins(plugins) {
  const named = name => plugins.filter(plugin => Array.isArray(plugin) && plugin[0] === name)
  const workspaces = named(WORKSPACE_RELEASE_PLUGIN).map(plugin => {
    const root = plugin[1].pkgRoot
    const manifest = JSON.parse(readFileSync(new URL(`${root}/package.json`, import.meta.url)))
    return { name: manifest.name, manifest, root, plugin }
  })
  const publishedNames = new Set(workspaces.map(({ name }) => name))
  const ordered = dependencyOrder(workspaces.map(entry => ({ ...entry,
    dependencies: publishedDependencies(entry.manifest, publishedNames)
  })), (a, b) => packageReleasePriority(a.root) - packageReleasePriority(b.root) || a.root.localeCompare(b.root))
  const publication = [...ordered.map(({ plugin }) => plugin), ...named(PROMOTION_PLUGIN), ...named('@semantic-release/github')]
  const publicationSet = new Set(publication)
  return [...plugins.filter(plugin => !publicationSet.has(plugin)), ...publication]
}

const config = configure({
  plugins: {
    '@semantic-release/github': {
      releaseBodyTemplate,
      assets: [
        {
          path: releaseNotesPath,
          name: 'release-notes-${nextRelease.gitTag}.md',
          label: 'Complete release notes'
        },
        {
          path: 'packages/runtime/dist/global.min.js',
          name: 'global-${nextRelease.gitTag}.min.js',
          label: 'global-${nextRelease.gitTag}.min.js'
        },
        {
          path: 'packages/runtime/dist/default-program.bin',
          name: 'default-program-${nextRelease.gitTag}.bin',
          label: 'default-program-${nextRelease.gitTag}.bin'
        },
        {
          path: 'release-artifacts/checksums.json',
          name: 'checksums-${nextRelease.gitTag}.json',
          label: 'checksums-${nextRelease.gitTag}.json'
        }
      ]
    }
  }
})

const workspaceRoots = config.plugins
  .filter(plugin => Array.isArray(plugin) && plugin[0] === SOURCE_RELEASE_PLUGIN)
  .map(plugin => plugin[1].pkgRoot).sort()

config.plugins = orderReleasePlugins([...config.plugins.map(plugin =>
  Array.isArray(plugin) && plugin[0] === SOURCE_RELEASE_PLUGIN
    ? [WORKSPACE_RELEASE_PLUGIN, { ...plugin[1], workspaceRoots }]
    : plugin
), ['./scripts/semantic-release-notes.mjs'], [PROMOTION_PLUGIN, { workspaceRoots }]])

export default config
