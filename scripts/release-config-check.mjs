import assert from 'node:assert/strict'
import config from '../release.config.js'

const PNPM_RELEASE_PLUGIN = '@aronrepo/semantic-release-pnpm'
const expectedFirstPackages = [
  'packages/native-darwin-arm64',
  'packages/native-darwin-x64',
  'packages/native-linux-arm64-gnu',
  'packages/native-linux-arm64-musl',
  'packages/native-linux-x64-gnu',
  'packages/native-linux-x64-musl',
  'packages/native-win32-arm64-msvc',
  'packages/native-win32-x64-msvc',
  'packages/wasm-compiler',
  'packages/wasm-runtime',
  'packages/wasm-tooling'
]

const packageRoots = config.plugins
  .filter((plugin) => Array.isArray(plugin) && plugin[0] === PNPM_RELEASE_PLUGIN)
  .map((plugin) => plugin[1]?.pkgRoot)

assert.deepEqual(
  packageRoots.slice(0, expectedFirstPackages.length),
  expectedFirstPackages,
  'Release packages must publish native targets, then Wasm packages, before public wrappers.'
)
assert.equal(new Set(packageRoots).size, packageRoots.length, 'Release package roots must be unique.')
assert.ok(packageRoots.length > expectedFirstPackages.length, 'Release config must include public wrapper packages.')
assert.equal(
  config.plugins.at(-1)?.[0],
  '@semantic-release/github',
  'GitHub release assets must publish only after all npm packages succeed.'
)

process.stdout.write(`Validated ${packageRoots.length} release package(s) in dependency-safe order.\n`)
