import configure from '@aronrepo/semantic-release-config/configure'

const PNPM_RELEASE_PLUGIN = '@aronrepo/semantic-release-pnpm'
const BINDING_TARGET_PACKAGE_PATTERN = /^packages\/binding-(?:darwin|linux|win32)-/
const WASM_PACKAGE_ROOTS = new Set([
  'packages/binding-wasm-compiler',
  'packages/binding-wasm-engine',
  'packages/binding-wasm-tooling'
])

function packageReleasePriority(plugin) {
  if (Array.isArray(plugin) && plugin[0] === '@semantic-release/github') return 4
  if (!Array.isArray(plugin) || plugin[0] !== PNPM_RELEASE_PLUGIN) return 0
  const packageRoot = plugin[1]?.pkgRoot
  if (BINDING_TARGET_PACKAGE_PATTERN.test(packageRoot)) return 1
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
          path: 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm',
          name: 'runtime-${nextRelease.gitTag}.wasm',
          label: 'runtime-${nextRelease.gitTag}.wasm'
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

config.plugins = orderReleasePlugins(config.plugins)

export default config
