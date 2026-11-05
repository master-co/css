import configure from '@aronrepo/semantic-release-config/configure'
import { releaseBodyTemplate, releaseNotesPath } from './scripts/semantic-release-notes.mjs'

const SOURCE_RELEASE_PLUGIN = '@aronrepo/semantic-release-pnpm'
const WORKSPACE_RELEASE_PLUGIN = './scripts/semantic-release-workspace.mjs'
const PROMOTION_PLUGIN = './scripts/semantic-release-promotion.mjs'
const BINDING_TARGET_PACKAGE_PATTERN = /^packages\/binding-(?:darwin|linux|win32)-/
const WASM_PACKAGE_ROOTS = new Set([
  'packages/binding-wasm-compiler',
  'packages/binding-wasm-engine',
  'packages/binding-wasm-tooling'
])

function packageReleasePriority(plugin) {
  if (Array.isArray(plugin) && plugin[0] === '@semantic-release/github') return 5
  if (Array.isArray(plugin) && plugin[0] === PROMOTION_PLUGIN) return 4
  if (!Array.isArray(plugin) || plugin[0] !== WORKSPACE_RELEASE_PLUGIN) return 0
  const packageRoot = plugin[1]?.pkgRoot
  if (BINDING_TARGET_PACKAGE_PATTERN.test(packageRoot)) return 1
  if (WASM_PACKAGE_ROOTS.has(packageRoot)) return 2
  return 3
}

function orderReleasePlugins(plugins) {
  return plugins
    .map((plugin, index) => ({ plugin, index, priority: packageReleasePriority(plugin) }))
    .sort((left, right) => left.priority - right.priority
      || (left.priority >= 1 && left.priority <= 3
        ? left.plugin[1].pkgRoot.localeCompare(right.plugin[1].pkgRoot)
        : left.index - right.index))
    .map(({ plugin }) => plugin)
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
