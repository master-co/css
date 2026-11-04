import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { appendFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { readWorkspacePackages, stageSnapshot } from './site-toolchain-snapshot.mjs'
import { createWorkspaceRelease, packedManifest, validatePackedArchive } from './semantic-release-workspace.mjs'
import { readPublishedPackage } from './semantic-release-promotion.mjs'
import { assertNpmOidcEnvironment, npmRegistry } from './npm-oidc.mjs'

const repository = 'master-co/css', repositoryId = 434642460
export const bootstrapPackages = Object.freeze({
  '@master/css-next': 'packages/next', '@master/css-nuxt': 'packages/nuxt',
  '@master/css-svelte': 'packages/svelte', '@master/css-svelte-addon': 'packages/css-sv',
  '@master/css-vscode': 'packages/vscode', '@master/css-webpack': 'packages/webpack'
})
export const bootstrapTag = 'bootstrap'
export const bootstrapConfirmation = 'BOOTSTRAP SIX NPM NAMES'
const targets = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-arm64-musl', 'linux-x64-gnu', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc']
const editorTargets = ['alpine-arm64', 'alpine-x64', 'darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-arm64', 'win32-x64']
const workflowPath = '.github/workflows/ci.yml'
const digest = (bytes, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(bytes).digest(encoding)
const integrity = bytes => `sha512-${digest(bytes, 'sha512', 'base64')}`
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const save = async (file, value) => { await writeFile(file + '.tmp', JSON.stringify(value, null, 2) + '\n', { mode: 0o600 }); await rename(file + '.tmp', file) }

function bootstrapManifest(bytes, name, plan) {
  validatePackedArchive(bytes, name, plan.version)
  const manifest = packedManifest(bytes)
  assert.equal(manifest.gitHead, plan.revision)
  assert.equal(manifest.publishConfig?.access, 'public')
  assert.equal(manifest.publishConfig?.provenance, true)
  // libnpmpublish prioritizes a top-level manifest.tag over --tag.
  assert.equal(manifest.tag, undefined, 'A manifest must not override the bootstrap-only tag')
  const source = new URL(manifest.repository?.url?.replace(/^git\+/, ''))
  assert.equal(source.protocol, 'https:')
  assert.equal(source.hostname, 'github.com')
  assert.equal(source.pathname.replace(/\.git$/, ''), '/master-co/css')
  assert.ok(!source.username && !source.password && !source.search && !source.hash)
  return manifest
}

export function bootstrapRequest({ runId, attempt, revision }) {
  for (const value of [runId, attempt]) {
    assert.match(String(value ?? ''), /^[1-9]\d*$/, 'Use a positive CI run ID/attempt')
    assert.ok(Number.isSafeInteger(Number(value)), 'CI identifiers must be safe integers')
  }
  assert.match(revision ?? '', /^[a-f0-9]{40}$/, 'A full source HEAD is required')
  return { repository, repositoryId, runId: Number(runId), attempt: Number(attempt), revision,
    version: `0.0.0-bootstrap.${runId}.${attempt}`, tag: bootstrapTag }
}

export function verifyBootstrapSource(request, { workflow, releaseWorkflow, run, latest, jobs, artifacts }) {
  assert.equal(workflow.path, workflowPath)
  assert.equal(releaseWorkflow.path, '.github/workflows/release.yml')
  assert.equal(releaseWorkflow.state, 'disabled_manually', 'Keep normal Release disabled until bootstrap finishes')
  for (const candidate of [run, latest]) {
    assert.equal(candidate.id, request.runId)
    assert.equal(candidate.run_attempt, request.attempt, 'Select the latest completed CI attempt')
    assert.equal(candidate.workflow_id, workflow.id)
    assert.equal(candidate.path, workflowPath)
    assert.equal(candidate.head_sha, request.revision, 'CI must validate this exact checkout HEAD')
    assert.equal(candidate.event, 'workflow_dispatch', 'Require manually selected release-candidate CI')
    assert.equal(candidate.status, 'completed')
    assert.equal(candidate.conclusion, 'success', 'The complete source CI must formally pass')
    for (const source of [candidate.repository, candidate.head_repository]) {
      assert.equal(source?.id, repositoryId, 'Fork/other repository CI is forbidden')
      assert.equal(source?.full_name, repository)
    }
  }
  assert.ok(jobs.length > 0 && jobs.every(job => job.status === 'completed' && job.conclusion === 'success'), 'Every CI job must pass; skipped jobs are not evidence')
  const expectedJobs = ['required', ...['preflight', 'quality-linux', 'rust-quality', 'compat-macos', 'compat-windows', 'e2e-linux'].map(name => `validation / ${name}`),
    ...targets.map(target => `validation / native-binding-${target}`),
    ...targets.map(target => `validation / editor-release-evidence / Build editor native target binding-${target}`),
    'validation / editor-release-evidence / Package both publisher identities without versioning or publishing',
    ...editorTargets.map(target => `validation / editor-release-evidence / Verify installed editor artifact ${target}`),
    'validation / editor-release-evidence / Require every editor artifact proof']
  for (const name of expectedJobs) assert.equal(jobs.filter(job => job.name === name).length, 1, `Missing/duplicate release-candidate job: ${name}`)
  // CI only uploads these native archives and runs the editor gate when
  // release_candidate=true. A plain full CI run cannot satisfy these checks.
  const expectedNames = [...targets.map(target => `mastercss-binding-${target}`), 'editor-vsix', ...editorTargets.map(target => `editor-proof-${target}`)]
  const selected = expectedNames.map(name => {
    const matches = artifacts.filter(artifact => artifact.name === name)
    assert.equal(matches.length, 1, `Require one current-attempt artifact: ${name}`)
    const artifact = matches[0]
    assert.ok(Number.isSafeInteger(artifact.id) && artifact.id > 0)
    assert.equal(artifact.expired, false, `Artifact expired: ${name}`)
    assert.match(artifact.digest ?? '', /^sha256:[a-f0-9]{64}$/, `Missing GitHub digest: ${name}`)
    for (const [key, value] of Object.entries({ id: request.runId, repository_id: repositoryId, head_repository_id: repositoryId, head_sha: request.revision, head_branch: run.head_branch })) {
      assert.equal(artifact.workflow_run?.[key], value, `Artifact ${name} source ${key} differs`)
    }
    const created = Date.parse(artifact.created_at), started = Date.parse(run.run_started_at), completed = Date.parse(run.updated_at)
    assert.ok(Number.isFinite(created) && Number.isFinite(started) && Number.isFinite(completed) && created >= started && created <= completed, `Artifact is outside selected attempt: ${name}`)
    return artifact
  })
  return selected.filter(artifact => artifact.name.startsWith('mastercss-binding-'))
}

export function githubReader(env = process.env, fetchApi = fetch) {
  const base = `https://api.github.com/repos/${repository}`
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}) }
  const api = async route => {
    const response = await fetchApi(base + route, { headers, redirect: 'error', signal: AbortSignal.timeout(30_000) })
    assert.equal(response.status, 200, `GitHub lookup failed (HTTP ${response.status})`)
    return response.json()
  }
  const pages = async (route, key) => {
    const all = []
    for (let page = 1; ; page++) {
      assert.ok(page <= 100, 'GitHub evidence exceeds pagination bounds')
      const batch = await api(`${route}?per_page=100&page=${page}`)
      assert.ok(Array.isArray(batch[key]))
      all.push(...batch[key])
      if (batch[key].length < 100) return all
    }
  }
  return { api, headers, base, pages, fetchApi }
}

export async function sourceEvidence(request, github) {
  const [workflow, releaseWorkflow, run, latest, jobs, artifacts] = await Promise.all([
    github.api('/actions/workflows/ci.yml'), github.api('/actions/workflows/release.yml'),
    github.api(`/actions/runs/${request.runId}/attempts/${request.attempt}`), github.api(`/actions/runs/${request.runId}`),
    github.pages(`/actions/runs/${request.runId}/attempts/${request.attempt}/jobs`, 'jobs'), github.pages(`/actions/runs/${request.runId}/artifacts`, 'artifacts')
  ])
  const evidence = { workflow, releaseWorkflow, run, latest, jobs, artifacts }
  return { ...evidence, nativeArtifacts: verifyBootstrapSource(request, evidence) }
}

async function absentNames(fetchMetadata, token) {
  for (const name of Object.keys(bootstrapPackages)) await absentName(name, fetchMetadata, token)
}
async function absentName(name, fetchMetadata, token) {
  const response = await fetchMetadata(`${npmRegistry}${encodeURIComponent(name)}`, {
    headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, redirect: 'error', signal: AbortSignal.timeout(15_000)
  })
  assert.equal(response.status, 404, `Bootstrap requires an absent name; existing/unknown registry result for ${name} (HTTP ${response.status})`)
}

export async function planBootstrap(request, { github = githubReader(), fetchMetadata = fetch } = {}) {
  const evidence = await sourceEvidence(request, github)
  await absentNames(fetchMetadata)
  return { schemaVersion: 1, mode: 'bootstrap-plan', ...request, packages: Object.entries(bootstrapPackages).map(([name, root]) => ({ name, root })),
    evidence, usableReleaseCohort: false, ownershipVerified: false, publicationPerformed: false,
    note: 'These six inactive bootstrap versions do not publish their complete dependency cohort. Public 404 is not ownership evidence. No stable/rc tag or final 2.0.0 version is used.' }
}

export const extractNativePython = String.raw`
import json,os,pathlib,stat,sys,zipfile
source,destination,target=sys.argv[1:]
allowed={'package.json','mastercss.node','mcss.exe' if target.startswith('win32-') else 'mcss'}
with zipfile.ZipFile(source) as z:
    names=set()
    total=0
    for item in z.infolist():
        assert item.filename in allowed and item.filename not in names,'Unexpected/duplicate native archive entry'
        assert not item.is_dir() and stat.S_IFMT(item.external_attr>>16) in (0,stat.S_IFREG),'Native archive links/special entries forbidden'
        total+=item.file_size
        assert total<=512*1024**2,'Native archive exceeds size bound'
        names.add(item.filename)
    assert names==allowed,'Native archive files missing'
    manifest=json.loads(z.read('package.json'))
    assert manifest['name']=='@master/css-binding-'+target,'Native manifest target mismatch'
    os.makedirs(destination,exist_ok=False)
    z.extractall(destination)
`

async function downloadNative(artifact, output, github) {
  const response = await github.fetchApi(`${github.base}/actions/artifacts/${artifact.id}/zip`, { headers: github.headers, redirect: 'manual', signal: AbortSignal.timeout(30_000) })
  assert.equal(response.status, 302, 'Expected GitHub artifact download redirect')
  const location = new URL(response.headers.get('location'))
  assert.ok(location.protocol === 'https:' && !location.username && !location.password)
  // The repository token must never be forwarded to artifact blob storage.
  const body = await github.fetchApi(location, { redirect: 'error', signal: AbortSignal.timeout(180_000) })
  assert.equal(body.status, 200, 'Native artifact download failed')
  let size = 0
  const hash = createHash('sha256')
  const inspect = new Transform({ transform(chunk, _encoding, callback) {
    size += chunk.length
    if (size > 256 * 1024 ** 2) { callback(new Error('Native download exceeds bound')); return }
    hash.update(chunk); callback(null, chunk)
  } })
  await pipeline(Readable.fromWeb(body.body), inspect, createWriteStream(output, { flags: 'wx', mode: 0o600 }))
  assert.equal(`sha256:${hash.digest('hex')}`, artifact.digest, 'Native ZIP differs from GitHub digest')
}

async function checkedPlan(file, github, fetchMetadata) {
  const plan = await json(file)
  const request = bootstrapRequest(plan)
  assert.equal(plan.schemaVersion, 1)
  assert.equal(plan.version, request.version)
  assert.equal(plan.tag, bootstrapTag)
  assert.equal(plan.repository, repository)
  assert.deepEqual(plan.packages, Object.entries(bootstrapPackages).map(([name, root]) => ({ name, root })))
  const current = await sourceEvidence(request, github)
  assert.deepEqual(current.nativeArtifacts, plan.evidence.nativeArtifacts, 'Native source evidence changed')
  await absentNames(fetchMetadata)
  return plan
}

export async function prepareBootstrap(root, planFile, { github = githubReader(), fetchMetadata = fetch, run = execa } = {}) {
  const plan = await checkedPlan(planFile, github, fetchMetadata)
  assert.equal((await run('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim(), plan.revision)
  assert.equal((await run('git', ['status', '--porcelain=v1', '--untracked-files=no'], { cwd: root })).stdout.trim(), '', 'Commit tracked source changes before preparing bootstrap')
  const output = dirname(resolve(planFile)), native = join(output, 'native'), archives = join(output, 'native-archives')
  await mkdir(native); await mkdir(archives)
  for (const artifact of plan.evidence.nativeArtifacts) {
    const zip = join(archives, artifact.name + '.zip')
    await downloadNative(artifact, zip, github)
    const target = artifact.name.slice('mastercss-binding-'.length)
    await run('python3', ['-c', extractNativePython, zip, join(native, artifact.name), target])
  }
  const options = { cwd: root, stdout: 'inherit', stderr: 'inherit', env: process.env }
  await run('cargo', ['xtask', 'assemble-native-release', native, join(output, 'checksums.json'), '--stage'], options)
  await run('bun', ['run', 'build'], options)
  await run('cargo', ['xtask', 'assemble-native-release', native, join(output, 'checksums.json'), '--require-assets', '--verify-staged'], options)
  assert.equal((await run('git', ['status', '--porcelain=v1', '--untracked-files=no'], { cwd: root })).stdout.trim(), '', 'Build changed tracked source')
  return packBootstrap(root, output, plan)
}

export async function packBootstrap(root, output, plan) {
  const workspace = await readWorkspacePackages(root)
  const entries = [...workspace.values()].filter(entry => !entry.manifest.private)
  for (const [name, packageRoot] of Object.entries(bootstrapPackages)) {
    const entry = workspace.get(name)
    assert.equal(entry?.directory, resolve(root, packageRoot))
    assert.equal(entry.manifest.publishConfig?.access, 'public')
    assert.equal(entry.manifest.publishConfig?.provenance, true)
  }
  const stage = join(output, 'workspace'), plugin = createWorkspaceRelease()
  try {
    const workspaceRoots = await stageSnapshot(entries, stage, plan.version, plan.revision)
    const packages = []
    for (const name of Object.keys(bootstrapPackages)) {
      const pkgRoot = `packages/${name.replace(/^@/, '').replaceAll('/', '-')}`
      await plugin.prepare({ pkgRoot, workspaceRoots, tarballDir: join(output, 'packages') }, { cwd: stage, env: process.env, nextRelease: { version: plan.version } })
      const file = `packages/${name.replace(/^@/, '').replaceAll('/', '-')}-${plan.version}.tgz`
      const bytes = await readFile(join(output, file))
      bootstrapManifest(bytes, name, plan)
      packages.push({ name, file, integrity: integrity(bytes), sha256: digest(bytes), provenance: true })
    }
    const prepared = { schemaVersion: 1, revision: plan.revision, version: plan.version, tag: bootstrapTag, usableReleaseCohort: false, packages }
    await save(join(output, 'prepared.json'), prepared)
    return prepared
  } finally { await plugin.fail(); await rm(stage, { recursive: true, force: true }) }
}

export function assertBootstrapPublication(env, plan, { publish, confirm }) {
  assert.equal(publish, true, 'Explicit publish=true is required')
  assert.equal(confirm, bootstrapConfirmation, 'Exact bootstrap confirmation is required')
  assert.equal(env.GITHUB_ACTIONS, 'true')
  assert.equal(env.RUNNER_ENVIRONMENT, 'github-hosted', 'Use a real GitHub-hosted runner')
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch')
  assert.equal(env.GITHUB_REPOSITORY, repository)
  assert.equal(env.GITHUB_REPOSITORY_ID, String(repositoryId))
  assert.equal(env.GITHUB_SHA, plan.revision)
  assert.ok(['refs/heads/main', 'refs/heads/rc'].includes(env.GITHUB_REF), 'Bootstrap only from a reviewed main/rc branch')
  assert.equal(env.GITHUB_WORKFLOW_REF, `${repository}/.github/workflows/npm-package-bootstrap.yml@${env.GITHUB_REF}`)
  assertNpmOidcEnvironment(env) // Required for genuine CI provenance, not package authentication.
  if (!/^[A-Za-z0-9._-]{24,512}$/.test(env.NPM_PACKAGE_BOOTSTRAP_TOKEN ?? '')) throw new Error('Configure the separate bootstrap credential without whitespace')
}

export async function bootstrapNpmSession(env) {
  const cwd = await mkdtemp(join(tmpdir(), 'master-npm-bootstrap-'))
  try {
    const userconfig = join(cwd, '.npmrc'), globalconfig = join(cwd, 'global.npmrc')
    // Keep the actual credential out of files as well as receipts/logs.
    await writeFile(userconfig, '//registry.npmjs.org/:_authToken=${NPM_PACKAGE_BOOTSTRAP_TOKEN}\n', { mode: 0o600 })
    await writeFile(globalconfig, '', { mode: 0o600 })
    await writeFile(join(cwd, 'package.json'), '{"private":true}\n')
    const allowed = /^(PATH|PATHEXT|HOME|USERPROFILE|SYSTEMROOT|WINDIR|COMSPEC|TMPDIR|TMP|TEMP|LANG|LC_ALL|LC_CTYPE|TZ|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS|GITHUB_(?!TOKEN$)[A-Z_]+|ACTIONS_ID_TOKEN_REQUEST_(URL|TOKEN)|RUNNER_ENVIRONMENT|CI|NPM_PACKAGE_BOOTSTRAP_TOKEN)$/
    return { cwd, env: { ...Object.fromEntries(Object.entries(env).filter(([key]) => allowed.test(key))),
      NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig, NPM_CONFIG_CACHE: join(cwd, 'cache'), NPM_CONFIG_REGISTRY: npmRegistry },
    extendEnv: false, preferLocal: false, cleanup: () => rm(cwd, { recursive: true, force: true }) }
  } catch (error) { await rm(cwd, { recursive: true, force: true }); throw error }
}

export async function publishBootstrap(planFile, { publish = false, confirm = '', env = process.env, github = githubReader(env), fetchMetadata = fetch, run = execa } = {}) {
  const plan = await checkedPlan(planFile, github, fetchMetadata)
  const output = dirname(resolve(planFile)), prepared = await json(join(output, 'prepared.json'))
  assert.equal(prepared.revision, plan.revision)
  assert.equal(prepared.version, plan.version)
  assert.equal(prepared.tag, bootstrapTag)
  assert.deepEqual(prepared.packages.map(pkg => pkg.name), Object.keys(bootstrapPackages))
  for (const pkg of prepared.packages) {
    assert.equal(pkg.file, `packages/${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${plan.version}.tgz`)
    const bytes = await readFile(join(output, pkg.file))
    assert.equal(integrity(bytes), pkg.integrity, 'Prepared bootstrap archive changed')
    assert.equal(digest(bytes), pkg.sha256)
    assert.equal(pkg.provenance, true)
    bootstrapManifest(bytes, pkg.name, plan)
  }
  const receipt = { schemaVersion: 1, mode: publish ? 'bootstrap-publication' : 'dry-run', revision: plan.revision, version: plan.version, tag: bootstrapTag,
    sourceCI: { run: plan.runId, attempt: plan.attempt }, usableReleaseCohort: false, operations: [], publicationPerformed: false,
    provenanceVerification: 'Provenance generation is mandatory; receipts verify registry attestation metadata, not a cryptographic signature audit.' }
  if (!publish) { await save(join(output, 'dry-run.json'), receipt); return receipt }
  assertBootstrapPublication(env, plan, { publish, confirm })
  await absentNames(fetchMetadata, env.NPM_PACKAGE_BOOTSTRAP_TOKEN) // Also reject private names visible only to this identity.
  const session = await bootstrapNpmSession(env)
  try {
    for (const pkg of prepared.packages) {
      await absentName(pkg.name, fetchMetadata, env.NPM_PACKAGE_BOOTSTRAP_TOKEN)
      receipt.operations.push({ name: pkg.name, archive: pkg.file, integrity: pkg.integrity, state: 'attempted', at: new Date().toISOString() })
      receipt.publicationPerformed = null // A lost response cannot establish that no write occurred.
      await save(join(output, 'publication-receipt.json'), receipt)
      try {
        const { cleanup: _cleanup, ...options } = session
        await run('npm', ['publish', join(output, pkg.file), '--tag', bootstrapTag, '--ignore-scripts', '--provenance', '--access', 'public', '--registry', npmRegistry], { ...options, stdout: 'pipe', stderr: 'pipe', timeout: 180_000 })
      } catch {
        throw new Error('Bootstrap npm operation failed; retain the attempted-operation receipt and review registry state before any recovery. Credential-bearing output was discarded.')
      }
      const data = await readPublishedPackage(pkg, plan.version, fetchMetadata)
      const published = data.versions[plan.version]
      assert.equal(published.gitHead, plan.revision)
      assert.equal(data['dist-tags']?.[bootstrapTag], plan.version)
      for (const formal of ['latest', 'rc', 'alpha', 'beta', 'canary', 'site']) assert.equal(data['dist-tags']?.[formal], undefined, `Unexpected formal tag after bootstrap: ${pkg.name}@${formal}`)
      Object.assign(receipt.operations.at(-1), { state: 'verified', version: plan.version, attestations: published.dist.attestations, tarball: published.dist.tarball })
      receipt.publicationPerformed = true
      await save(join(output, 'publication-receipt.json'), receipt)
    }
    receipt.complete = true
    await save(join(output, 'publication-receipt.json'), receipt)
    return receipt
  } finally { await session.cleanup() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command = 'plan', ...args] = process.argv.slice(2)
  const option = name => args[args.indexOf(name) + 1]
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  if (command === 'plan') {
    const revision = (await execa('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
    const request = bootstrapRequest({ runId: option('--run-id'), attempt: option('--attempt'), revision })
    const plan = await planBootstrap(request)
    if (args.includes('--output')) {
      const output = resolve(option('--output'))
      await mkdir(output, { recursive: false })
      await save(join(output, 'plan.json'), plan)
    }
    console.log(JSON.stringify({ ...request, names: Object.keys(bootstrapPackages), mode: 'dry-run-plan', nativeArtifacts: plan.evidence.nativeArtifacts.length, publicationPerformed: false }, null, 2))
  } else if (command === 'prepare') {
    const result = await prepareBootstrap(root, resolve(option('--plan')))
    console.log(`Prepared ${result.packages.length} exact bootstrap archives; no publication performed.`)
  } else if (command === 'publish') {
    const result = await publishBootstrap(resolve(option('--plan')), { publish: process.env.BOOTSTRAP_PUBLISH === 'true', confirm: process.env.BOOTSTRAP_CONFIRM ?? '' })
    console.log(`${result.mode}: ${result.operations.length} attempted operations; no stable/RC promotion.`)
  } else throw new Error('Use plan, prepare or publish; publication additionally requires explicit workflow confirmation and credential')
  if (process.env.GITHUB_OUTPUT && command === 'plan') await appendFile(process.env.GITHUB_OUTPUT, 'plan=bootstrap-artifacts/plan.json\n')
}
