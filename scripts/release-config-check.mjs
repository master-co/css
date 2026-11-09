import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { YAML } from 'bun'
import { assertNpmProvenanceRepository, assertNpmPublishConfig } from './npm-oidc.mjs'
import { releasePackageRoots } from './release-order.mjs'

const expectedFirstPackages = [
  'packages/binding-darwin-arm64',
  'packages/binding-darwin-x64',
  'packages/binding-linux-arm64-gnu',
  'packages/binding-linux-arm64-musl',
  'packages/binding-linux-x64-gnu',
  'packages/binding-linux-x64-musl',
  'packages/binding-win32-arm64-msvc',
  'packages/binding-win32-x64-msvc',
  'packages/schema',
  'packages/binding-wasm-compiler',
  'packages/binding-wasm-engine',
  'packages/binding-wasm-tooling'
]

const packageRoots = releasePackageRoots()

const manifests = packageRoots.map(root => JSON.parse(readFileSync(new URL(`../${root}/package.json`, import.meta.url))))
const positions = new Map(manifests.map(({ name }, index) => [name, index]))
assert.equal(positions.size, manifests.length, 'Release package names must be unique.')
for (const [index, manifest] of manifests.entries()) {
  assert.notEqual(manifest.private, true, `Private workspace cannot be released: ${manifest.name}`)
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const dependency of Object.keys(manifest[field] ?? {})) {
      if (positions.has(dependency)) assert.ok(positions.get(dependency) < index,
        `Publish ${dependency} before its ${field} consumer ${manifest.name}.`)
    }
  }
}

assert.deepEqual(
  packageRoots.slice(0, expectedFirstPackages.length),
  expectedFirstPackages,
  'Release packages must publish native targets first, followed by schema and Wasm before public wrappers.'
)
assert.equal(new Set(packageRoots).size, packageRoots.length, 'Release package roots must be unique.')
assert.ok(packageRoots.length > expectedFirstPackages.length, 'Release config must include public wrapper packages.')
const releaseScript = readFileSync(new URL('./release.mjs', import.meta.url), 'utf8')
assert.ok(releaseScript.lastIndexOf('promotion.publish(') < releaseScript.lastIndexOf('publishGitHubRelease('),
  'GitHub release assets must publish only after all npm packages succeed.')

for (const [index, manifest] of manifests.entries()) {
  assertNpmPublishConfig(manifest)
  assertNpmProvenanceRepository(manifest, packageRoots[index])
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

const releaseWorkflow = YAML.parse(readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'))
const notesReceipt = releaseWorkflow.jobs.release.steps.find(step => step.with?.path === 'release-artifacts/release-notes.md')
assert.equal(notesReceipt?.if, '${{ always() }}', 'Retain the complete generated notes even if GitHub publication fails')
assert.equal(notesReceipt.with.name, 'release-notes-${{ github.sha }}-${{ github.run_attempt }}', 'Bind retained notes to their owning source and attempt')
assert.equal(notesReceipt.with['retention-days'], 90, 'Keep notes for the same recovery window as npm evidence')
const site = releaseWorkflow.jobs['deploy-site']
assert.deepEqual(site.needs, ['validation', 'release', 'publish-editors'], 'Site delivery must follow validation, npm promotion and editor publication')
for (const condition of [`needs.validation.result == 'success'`, `needs.release.result == 'success'`,
  `needs.release.outputs.released != 'true'`, `needs.publish-editors.result == 'success'`,
  `needs.validation.outputs.vscode_release_affected != 'true'`, `needs.publish-editors.result == 'skipped'`]) {
  assert.ok(site.if.includes(condition), `Site delivery is missing a release gate: ${condition}`)
}
assert.equal(releaseWorkflow.concurrency['cancel-in-progress'], false, 'Keep the release serialized while Pages builds')
assert.deepEqual(site.permissions, { contents: 'write', checks: 'read' })
assert.equal(site.env.PUBLIC_VERSION, undefined, 'The delivery plan sets the documented version, with or without a release')
const planStep = site.steps.find(step => step.id === 'plan')
assert.equal(planStep?.run, 'node scripts/pages-site-release.mjs plan')
assert.equal(planStep.env.RELEASED, '${{ needs.release.outputs.released }}')
assert.equal(planStep.env.RELEASE_VERSION, '${{ needs.release.outputs.version }}')
assert.doesNotMatch(site.if, /released == 'true'/, 'Site-only pushes deliver without a package release; a release still waits for its editors')
for (const step of site.steps.slice(site.steps.indexOf(planStep) + 1)) {
  assert.match(step.if ?? '', /steps\.plan\.outputs\.deliver == 'true'/, `Only a planned delivery may run: ${step.name}`)
}
assert.equal(site.env.PUBLIC_COMMIT_REF, '${{ github.ref_name }}')
assert.equal(site.env.MASTER_CSS_IMAGE_TRANSFORMATIONS, 'false')
for (const suffix of ['PROJECT', 'SUBDOMAIN', 'MODE']) {
  const value = site.env[`PAGES_${suffix === 'MODE' ? 'RELEASE_MODE' : suffix}`]
  assert.ok(value.includes(`vars[format('CLOUDFLARE_PAGES_{0}_${suffix}'`))
  assert.ok(value.includes(`github.ref_name == 'main' && 'STABLE' || 'RC'`))
  assert.doesNotMatch(value, /\|\|\s*vars/, 'A missing stable setting must not fall back to the RC project/mode')
}
assert.equal(site.steps.find(step => step.uses === 'actions/download-artifact@v7').with.name, '${{ needs.release.outputs.artifact_name }}', 'Site retries must use the owning release attempt artifact')
const siteRuns = site.steps.map(step => step.run ?? '').join('\n')
assert.doesNotMatch(JSON.stringify(site), /CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|wrangler pages deploy/, 'Git App delivery must not use Cloudflare credentials or upload commands')
const order = ['pages-site-release.mjs plan', 'pages-site-release.mjs preflight', 'bun run build:site', 'pages-site-release.mjs identity',
  'verify-release-site.mjs', 'pages-site-release.mjs manifest', 'pages-site-release.mjs deliver']
let position = -1
for (const command of order) {
  const next = siteRuns.indexOf(command)
  assert.ok(next > position, `Site release command must follow its prerequisites: ${command}`)
  position = next
}
const delivery = site.steps.find(step => step.run === 'node scripts/pages-site-release.mjs deliver')
assert.equal(delivery.env.GITHUB_TOKEN, '${{ secrets.GITHUB_TOKEN }}')
assert.equal(site.steps.filter(step => step.env?.GITHUB_TOKEN).length, 1, 'Do not expose the repository write token during site dependency builds')
const receipt = site.steps.find(step => step.uses === 'actions/upload-artifact@v7' && step.with.path === 'release-artifacts/site-delivery.json')
assert.equal(receipt?.if, '${{ always() && steps.plan.outputs.deliver == \'true\' }}', 'Keep recovery receipts when a delivery step fails after an external write')
assert.equal(receipt.with.name, 'site-delivery-${{ github.sha }}-${{ github.run_attempt }}', 'Retain each owning workflow attempt independently')
const registry = releaseWorkflow.jobs['mcp-registry']
assert.equal(registry?.uses, './.github/workflows/mcp-registry.yml', 'Every stable release lists its MCP server in the MCP Registry')
assert.equal(registry.needs, 'release', 'List the MCP server only after npm promotion')
for (const condition of [`github.event_name == 'push'`, `needs.release.outputs.released == 'true'`, `github.ref_name == 'main'`]) {
  assert.ok(registry.if.includes(condition), `MCP Registry listing is missing a release gate: ${condition}`)
}
assert.deepEqual(registry.with, { version: '${{ needs.release.outputs.version }}' }, 'List the version npm actually released')
assert.deepEqual(registry.permissions, { contents: 'read', 'id-token': 'write' })
assert.equal(registry.secrets, undefined, 'GitHub OIDC lists the server without repository secrets')
const registryWorkflow = YAML.parse(readFileSync(new URL('../.github/workflows/mcp-registry.yml', import.meta.url), 'utf8'))
assert.equal(registryWorkflow.on.workflow_call.inputs.version.required, true)
assert.ok('workflow_dispatch' in registryWorkflow.on, 'Keep the manual listing for a missed release')
assert.equal(registryWorkflow.jobs.publish.if, "${{ github.ref == 'refs/heads/main' }}")
assert.deepEqual(registryWorkflow.jobs.publish.permissions, { contents: 'read', 'id-token': 'write' })
const hosted = readFileSync(new URL('./build-site-hosted.sh', import.meta.url), 'utf8')
assert.ok(hosted.indexOf('hosted-prepare') < hosted.indexOf('bun install --frozen-lockfile'))
assert.ok(hosted.indexOf('hosted-verify') > hosted.indexOf('bun run build:site'))
assert.doesNotMatch(hosted, /^\s*eval\b/m, 'Never evaluate downloaded release metadata as shell code')

process.stdout.write(`Validated ${packageRoots.length} release package(s) in dependency-safe order.\n`)
process.stdout.write('Validated OIDC-only npm publication configuration in both workflows.\n')
process.stdout.write('Validated gated, exact-output Pages Git delivery without Cloudflare credentials.\n')
process.stdout.write('Validated the MCP Registry listing of every stable release.\n')
