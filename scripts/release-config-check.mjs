import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { YAML } from 'bun'
import config from '../release.config.js'
import { assertNpmPublishConfig } from './npm-oidc.mjs'

const WORKSPACE_RELEASE_PLUGIN = './scripts/semantic-release-workspace.mjs'
const expectedFirstPackages = [
  'packages/binding-darwin-arm64',
  'packages/binding-darwin-x64',
  'packages/binding-linux-arm64-gnu',
  'packages/binding-linux-arm64-musl',
  'packages/binding-linux-x64-gnu',
  'packages/binding-linux-x64-musl',
  'packages/binding-win32-arm64-msvc',
  'packages/binding-win32-x64-msvc',
  'packages/binding-wasm-compiler',
  'packages/binding-wasm-engine',
  'packages/binding-wasm-tooling'
]

const packageRoots = config.plugins
  .filter((plugin) => Array.isArray(plugin) && plugin[0] === WORKSPACE_RELEASE_PLUGIN)
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

for (const root of packageRoots) {
  assertNpmPublishConfig(JSON.parse(readFileSync(new URL(`../${root}/package.json`, import.meta.url))))
}
for (const [file, jobName] of [['release.yml', 'release'], ['site-toolchain-snapshot.yml', 'snapshot']]) {
  const workflow = YAML.parse(readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8'))
  const job = workflow.jobs[jobName]
  assert.equal(job.permissions['id-token'], 'write', `${file} requires GitHub OIDC permission`)
  const install = job.steps.findIndex(step => step.run === 'npm install --global npm@11.21.0')
  const publish = job.steps.findIndex(step => /bun run release$|site-toolchain-snapshot\.mjs.*--publish/.test(step.run ?? ''))
  assert.ok(install >= 0 && publish > install, `${file} must install the OIDC publishing CLI before publication`)
  for (const env of [workflow.env, job.env, ...job.steps.map(step => step.env)]) {
    for (const key of Object.keys(env ?? {})) {
      assert.doesNotMatch(key, /^npm_|^node_auth_token$/i, `${file} must not inject npm credentials or config`)
    }
  }
}

process.stdout.write(`Validated ${packageRoots.length} release package(s) in dependency-safe order.\n`)
process.stdout.write('Validated OIDC-only npm publication configuration in both workflows.\n')
