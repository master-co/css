import configure from '@aronrepo/semantic-release-config/configure'

const PNPM_RELEASE_PLUGIN = '@aronrepo/semantic-release-pnpm'
const NATIVE_TARGET_PACKAGE_PATTERN = /^packages\/native-(?:darwin|linux|win32)-/
const WASM_PACKAGE_ROOTS = new Set([
  'packages/wasm-compiler',
  'packages/wasm-runtime',
  'packages/wasm-tooling'
])

function packageReleasePriority(plugin) {
  if (Array.isArray(plugin) && plugin[0] === '@semantic-release/github') return 4
  if (!Array.isArray(plugin) || plugin[0] !== PNPM_RELEASE_PLUGIN) return 0
  const packageRoot = plugin[1]?.pkgRoot
  if (NATIVE_TARGET_PACKAGE_PATTERN.test(packageRoot)) return 1
  if (WASM_PACKAGE_ROOTS.has(packageRoot)) return 2
  return 3
}

function orderReleasePlugins(plugins) {
  return plugins
    .map((plugin, index) => ({ plugin, index, priority: packageReleasePriority(plugin) }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map(({ plugin }) => plugin)
}

const config = configure({
  plugins: {
    '@semantic-release/github': {
      assets: [
        {
          path: 'packages/runtime/dist/global.min.js',
          name: 'global-${nextRelease.gitTag}.min.js',
          label: 'global-${nextRelease.gitTag}.min.js'
        },
        {
          path: 'packages/runtime/artifacts/mastercss_wasm_runtime_bg.wasm',
          name: 'runtime-${nextRelease.gitTag}.wasm',
          label: 'runtime-${nextRelease.gitTag}.wasm'
        },
        {
          path: 'packages/preset/dist/default-manifest.json',
          name: 'default-manifest-${nextRelease.gitTag}.json',
          label: 'default-manifest-${nextRelease.gitTag}.json'
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

config.plugins = orderReleasePlugins(config.plugins)

export default config
