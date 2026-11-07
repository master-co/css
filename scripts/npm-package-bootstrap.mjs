import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { appendFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { setTimeout as pause } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { readWorkspacePackages, stageSnapshot } from './site-toolchain-snapshot.mjs'
import { createWorkspaceRelease, packedManifest, validatePackedArchive } from './release-workspace.mjs'
import { readPublishedPackage, readRegistryTags } from './release-promotion.mjs'
import { assertNpmOidcEnvironment, npmRegistry } from './npm-oidc.mjs'

const repository = 'master-co/css', repositoryId = 434642460
export const bootstrapPackages = Object.freeze({
  '@master/css-next': 'packages/next', '@master/css-nuxt': 'packages/nuxt',
  '@master/css-svelte': 'packages/svelte', '@master/css-svelte-addon': 'packages/css-sv',
  '@master/css-vscode': 'packages/vscode', '@master/css-webpack': 'packages/webpack'
})
export const bootstrapTag = 'bootstrap'
export const bootstrapConfirmation = 'BOOTSTRAP SIX NPM NAMES'
export const cleanupConfirmation = 'REMOVE C5 BOOTSTRAP LATEST'
const bootstrapWorkflow = '.github/workflows/npm-package-bootstrap.yml'
const recoveryName = '@master/css-next'
const recoveryVersion = '0.0.0-bootstrap.41977322027.1'
const historicalBootstrap = Object.freeze({
  run: 41983776353, attempt: 1, job: 127099659562, workflow: 407567928, sourceRun: 41977322027, sourceAttempt: 1,
  revision: '441516cfe59171a75ae6e25049ebb13bbe093e7d', artifact: 13395446596, size: 144409301,
  zipDigest: 'sha256:7c828ddc73f1dfb5049455bd3d2c6d8412099d61d3086f9c816fed0bc288933e',
  archive: `packages/master-css-next-${recoveryVersion}.tgz`,
  integrity: 'sha512-I4eb91M3tTfSivpwwFZTddmE3s9ODme6H4+Yjph5xi9GuVUd7IG0JMViVQ4CTtoeAjxHeLXczLQA/nV/90f7ww==',
  archiveDigest: '455dabb89f2cfa7aca1bc2b84c29a71c7d8c7772f484a987fa448490073ec336',
  placeholderIntegrity: 'sha512-/m0BuqDmx3lEMNP1oyClKRV7RlWpECNGAwr6yJN8t4LLNVSTzWy/WWfVNzx7RuebiyNzC/Vn3Zkk9kmjt8K+oA=='
})
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

async function downloadNative(artifact, output, github, expectedSize) {
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
  if (expectedSize !== undefined) assert.equal(size, expectedSize, 'Historical ZIP size differs from GitHub metadata')
  assert.equal(`sha256:${hash.digest('hex')}`, artifact.digest, 'Native ZIP differs from GitHub digest')
}

export function verifyFailedBootstrapEvidence({ workflow, releaseWorkflow, run, latest, jobs, artifact }) {
  const old = historicalBootstrap
  assert.equal(workflow.id, old.workflow)
  assert.equal(workflow.path, bootstrapWorkflow)
  assert.equal(releaseWorkflow.path, '.github/workflows/release.yml')
  assert.equal(releaseWorkflow.state, 'disabled_manually', 'Keep Release disabled during bootstrap remediation')
  for (const candidate of [run, latest]) {
    for (const [key, value] of Object.entries({ id: old.run, run_attempt: old.attempt, workflow_id: old.workflow, path: bootstrapWorkflow,
      head_sha: old.revision, head_branch: 'rc', event: 'workflow_dispatch', status: 'completed', conclusion: 'failure' })) {
      assert.equal(candidate[key], value, `Historical bootstrap run ${key} differs`)
    }
    for (const source of [candidate.repository, candidate.head_repository]) {
      assert.equal(source?.id, repositoryId)
      assert.equal(source?.full_name, repository)
    }
  }
  assert.equal(jobs.length, 1)
  const [job] = jobs
  for (const [key, value] of Object.entries({ id: old.job, run_id: old.run, run_attempt: old.attempt, head_sha: old.revision,
    name: 'bootstrap', status: 'completed', conclusion: 'failure' })) assert.equal(job[key], value, `Historical bootstrap job ${key} differs`)
  for (const [name, conclusion] of [['Dry-run or explicitly publish the reviewed six archives', 'failure'],
    ['Retain original archives and source/integrity/provenance receipts even after failure', 'success']]) {
    assert.deepEqual(job.steps.filter(step => step.name === name).map(step => [step.status, step.conclusion]), [['completed', conclusion]])
  }
  for (const [key, value] of Object.entries({ id: old.artifact, name: `npm-package-bootstrap-${old.revision}-${old.attempt}`,
    size_in_bytes: old.size, digest: old.zipDigest, expired: false })) assert.equal(artifact[key], value, `Original bootstrap artifact ${key} differs`)
  for (const [key, value] of Object.entries({ id: old.run, repository_id: repositoryId, head_repository_id: repositoryId,
    head_sha: old.revision, head_branch: 'rc' })) assert.equal(artifact.workflow_run?.[key], value, `Original bootstrap artifact source ${key} differs`)
  const created = Date.parse(artifact.created_at)
  assert.ok(created >= Date.parse(run.run_started_at) && created <= Date.parse(run.updated_at), 'Original bootstrap artifact is outside the failed attempt')
}

const extractFailedBootstrap = String.raw`
import pathlib,stat,sys,zipfile
source,destination,archive=sys.argv[1:]
outputs={'plan.json':'original-plan.json','prepared.json':'original-prepared.json',
         'publication-receipt.json':'original-publication-receipt.json',archive:'original-package.tgz'}
with zipfile.ZipFile(source) as z:
    names=set()
    total=0
    for item in z.infolist():
        name=item.filename.rstrip('/')
        path=pathlib.PurePosixPath(name)
        assert name and path.as_posix()==name and not path.is_absolute() and '..' not in path.parts and '\\' not in name and ':' not in name
        assert name.casefold() not in names
        names.add(name.casefold())
        assert stat.S_IFMT(item.external_attr>>16) in (0,stat.S_IFREG,stat.S_IFDIR)
        total+=item.file_size
        assert total<=512*1024**2
        if name in outputs:
            assert not item.is_dir() and item.file_size<=2*1024**2
            with (pathlib.Path(destination)/outputs[name]).open('xb') as f:
                f.write(z.read(item))
    assert set(outputs).issubset(names)
`

export function verifyFailedBootstrapArchive({ plan, prepared, receipt, bytes }) {
  const old = historicalBootstrap
  const request = bootstrapRequest({ runId: old.sourceRun, attempt: old.sourceAttempt, revision: old.revision })
  const names = Object.entries(bootstrapPackages).map(([name, root]) => ({ name, root }))
  assert.equal(plan.schemaVersion, 1)
  assert.equal(plan.mode, 'bootstrap-plan')
  for (const [key, value] of Object.entries(request)) assert.equal(plan[key], value, `Original plan ${key} differs`)
  assert.deepEqual(plan.packages, names)
  assert.equal(plan.publicationPerformed, false)
  assert.equal(prepared.schemaVersion, 1)
  assert.equal(prepared.revision, old.revision)
  assert.equal(prepared.version, recoveryVersion)
  assert.equal(prepared.tag, bootstrapTag)
  assert.deepEqual(prepared.packages.map(pkg => pkg.name), Object.keys(bootstrapPackages))
  const pkg = { name: recoveryName, file: old.archive, integrity: old.integrity, sha256: old.archiveDigest, provenance: true }
  assert.deepEqual(prepared.packages[0], pkg)
  assert.equal(receipt.schemaVersion, 1)
  assert.equal(receipt.mode, 'bootstrap-publication')
  assert.equal(receipt.revision, old.revision)
  assert.equal(receipt.version, recoveryVersion)
  assert.equal(receipt.tag, bootstrapTag)
  assert.deepEqual(receipt.sourceCI, { run: old.sourceRun, attempt: old.sourceAttempt })
  assert.equal(receipt.complete, undefined)
  assert.equal(receipt.publicationPerformed, null)
  assert.equal(receipt.operations.length, 1)
  const [op] = receipt.operations
  assert.deepEqual({ name: op.name, archive: op.archive, integrity: op.integrity, state: op.state },
    { name: recoveryName, archive: old.archive, integrity: old.integrity, state: 'attempted' })
  assert.ok(Number.isFinite(Date.parse(op.at)))
  assert.equal(digest(bytes), old.archiveDigest)
  assert.equal(integrity(bytes), old.integrity)
  bootstrapManifest(bytes, recoveryName, request)
  return pkg
}

export async function readFailedBootstrap(output, { github, run }) {
  const old = historicalBootstrap, path = `/actions/runs/${old.run}`, attemptPath = `${path}/attempts/${old.attempt}`
  const [workflow, releaseWorkflow, candidate, latest, jobs, artifact] = await Promise.all([
    github.api(`/actions/workflows/${bootstrapWorkflow.split('/').at(-1)}`), github.api('/actions/workflows/release.yml'),
    github.api(attemptPath), github.api(path), github.pages(`${attemptPath}/jobs`, 'jobs'), github.api(`/actions/artifacts/${old.artifact}`)
  ])
  const evidence = { workflow, releaseWorkflow, run: candidate, latest, jobs, artifact }
  verifyFailedBootstrapEvidence(evidence)
  await save(join(output, 'historical-github-evidence.json'), evidence)
  const temp = await mkdtemp(join(tmpdir(), 'master-failed-bootstrap-'))
  try {
    const zip = join(temp, 'original.zip')
    await downloadNative(artifact, zip, github, old.size)
    await run('python3', ['-c', extractFailedBootstrap, zip, output, old.archive])
  } finally { await rm(temp, { recursive: true, force: true }) }
  const [plan, prepared, receipt, bytes] = await Promise.all(['original-plan.json', 'original-prepared.json', 'original-publication-receipt.json'].map(name => json(join(output, name)))
    .concat(readFile(join(output, 'original-package.tgz'))))
  return { pkg: verifyFailedBootstrapArchive({ plan, prepared, receipt, bytes }), bytes }
}

async function readPublicBytes(fetchMetadata, url, bound, accept) {
  const response = await fetchMetadata(url, { headers: { 'cache-control': 'no-cache', ...(accept && { accept }) },
    redirect: 'error', signal: AbortSignal.timeout(60_000) })
  assert.equal(response.status, 200, `Public bootstrap evidence unavailable (HTTP ${response.status})`)
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    assert.ok(size <= bound, 'Public bootstrap evidence exceeds size bound')
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export function verifyHistoricalBootstrapStatement(bundle, archiveIntegrity) {
  assert.equal(bundle.dsseEnvelope.payloadType, 'application/vnd.in-toto+json')
  const statement = JSON.parse(Buffer.from(bundle.dsseEnvelope.payload, 'base64').toString('utf8'))
  assert.equal(statement._type, 'https://in-toto.io/Statement/v1')
  assert.equal(statement.predicateType, 'https://slsa.dev/provenance/v1')
  assert.deepEqual(statement.subject, [{ name: `pkg:npm/%40master/css-next@${recoveryVersion}`,
    digest: { sha512: Buffer.from(archiveIntegrity.slice(7), 'base64').toString('hex') } }])
  const source = `https://github.com/${repository}`, ref = 'refs/heads/rc', old = historicalBootstrap
  const { buildDefinition: build, runDetails: details } = statement.predicate
  assert.equal(build.buildType, 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1')
  assert.deepEqual(build.externalParameters.workflow, { ref, repository: source, path: bootstrapWorkflow })
  assert.equal(build.internalParameters.github.repository_id, String(repositoryId))
  assert.equal(build.internalParameters.github.event_name, 'workflow_dispatch')
  assert.deepEqual(build.resolvedDependencies, [{ uri: `git+${source}@${ref}`, digest: { gitCommit: old.revision } }])
  assert.equal(details.builder.id, 'https://github.com/actions/runner/github-hosted')
  assert.equal(details.metadata.invocationId, `${source}/actions/runs/${old.run}/attempts/${old.attempt}`)
  return statement
}

async function verifyHistoricalSignature(bundle, { run, env }) {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bootstrap-trust-'))
  try {
    const userconfig = join(cwd, 'user.npmrc'), globalconfig = join(cwd, 'global.npmrc')
    await Promise.all([writeFile(userconfig, '', { mode: 0o600 }), writeFile(globalconfig, '', { mode: 0o600 })])
    const tool = await run('npm', ['root', '--global'], { cwd, extendEnv: false, timeout: 30_000,
      env: { PATH: env.PATH, NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig, NPM_CONFIG_CACHE: join(cwd, 'cache') } })
    const directory = tool.stdout.trim()
    assert.ok(isAbsolute(directory) && !/[\r\n]/.test(directory), 'Invalid pinned npm installation root')
    const require = createRequire(join(directory, 'npm', 'package.json'))
    assert.equal(require('./package.json').version, '11.21.0', 'Verify with the pinned npm Sigstore toolkit')
    const source = `https://github.com/${repository}`, ref = 'refs/heads/rc', old = historicalBootstrap
    const identity = `${source}/${bootstrapWorkflow}@${ref}`
    await require('sigstore').verify(bundle, { tufCachePath: join(cwd, 'tuf'), tlogThreshold: 1, ctLogThreshold: 1,
      certificateIdentityURI: '^' + identity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$',
      certificateIssuer: 'https://token.actions.githubusercontent.com' })
    const { ASN1Obj, X509Certificate } = require('@sigstore/core')
    const encoded = bundle.verificationMaterial?.certificate?.rawBytes ?? bundle.verificationMaterial?.x509CertificateChain?.certificates?.[0]?.rawBytes
    const certificate = X509Certificate.parse(Buffer.from(encoded, 'base64'))
    const claims = new Map(certificate.extensions.map(extension => [extension.subs[0].toOID(), extension.subs.at(-1).value]))
    for (const [id, value] of Object.entries({ 9: identity, 10: old.revision, 11: 'github-hosted', 12: source,
      13: old.revision, 14: ref, 21: `${source}/actions/runs/${old.run}/attempts/${old.attempt}` })) {
      const claim = claims.get(`1.3.6.1.4.1.57264.1.${id}`)
      assert.ok(claim, `Missing Fulcio source claim ${id}`)
      assert.equal(ASN1Obj.parseBuffer(claim).value.toString('utf8'), value)
    }
  } finally { await rm(cwd, { recursive: true, force: true }) }
}

export async function verifyFailedBootstrapPackage(output, { original, fetchMetadata, verifySignature = verifyHistoricalSignature, run, env }) {
  const old = historicalBootstrap
  const published = await readPublishedPackage({ ...original.pkg, gitHead: old.revision }, recoveryVersion, fetchMetadata)
  const tarball = `${npmRegistry}@master/css-next/-/css-next-${recoveryVersion}.tgz`
  const attestation = `${npmRegistry}-/npm/v1/attestations/@master%2fcss-next@${recoveryVersion}`
  assert.equal(published.dist.tarball, tarball)
  assert.equal(published.dist.attestations.url, attestation)
  const [bytes, attestationBytes] = await Promise.all([readPublicBytes(fetchMetadata, tarball, 1024 ** 2), readPublicBytes(fetchMetadata, attestation, 4 * 1024 ** 2)])
  assert.ok(bytes.equals(original.bytes), 'Registry tarball differs from the original verified GitHub artifact')
  assert.equal(integrity(bytes), old.integrity)
  const bundles = JSON.parse(attestationBytes).attestations.filter(record => record.predicateType === 'https://slsa.dev/provenance/v1')
  assert.equal(bundles.length, 1, 'Exactly one current signed bootstrap provenance statement is required')
  const statement = verifyHistoricalBootstrapStatement(bundles[0].bundle, old.integrity)
  await verifySignature(bundles[0].bundle, { run, env })
  await writeFile(join(output, 'public-package.tgz'), bytes, { mode: 0o600 })
  await writeFile(join(output, 'public-attestations.json'), attestationBytes, { mode: 0o600 })
  const proof = { name: recoveryName, version: recoveryVersion, revision: old.revision, run: old.run, attempt: old.attempt,
    integrity: old.integrity, sha256: digest(bytes), attestationSHA256: digest(attestationBytes),
    originalArtifactId: old.artifact, originalZIPDigest: old.zipDigest, publicTarballByteIdentical: true, cryptographicProvenanceVerified: true,
    provenanceInvocation: statement.predicate.runDetails.metadata.invocationId }
  await save(join(output, 'historical-package-proof.json'), proof)
  return proof
}

function checkedCleanupPackument(raw, abbreviated = false) {
  const old = historicalBootstrap
  const packument = JSON.parse(raw)
  assert.equal(packument.name, recoveryName)
  assert.deepEqual(Object.keys(packument.versions).sort(), [recoveryVersion, '0.0.0-stage'].sort(), 'Unknown package version appeared during cleanup')
  assert.equal(packument.versions[recoveryVersion].dist.integrity, old.integrity)
  const placeholder = packument.versions['0.0.0-stage']
  assert.equal(placeholder.dist.integrity, old.placeholderIntegrity)
  if (!abbreviated) {
    assert.equal(packument.versions[recoveryVersion].gitHead, old.revision)
    assert.equal(placeholder.description, 'Temporary package placeholder for staged publishing')
  }
  return packument['dist-tags']
}

async function verifiedCleanupTags(fetchMetadata, authenticated = false) {
  const packumentURL = `${npmRegistry}@master%2fcss-next`
  const packument = async (writeView, abbreviated = false) => checkedCleanupPackument(await readPublicBytes(fetchMetadata,
    packumentURL + (writeView ? '?write=true' : ''), 16 * 1024 ** 2, abbreviated ? 'application/vnd.npm.install-v1+json' : 'application/json'), abbreviated)
  const [tags, packumentTags, latest] = await Promise.all([readRegistryTags(recoveryName, fetchMetadata),
    Promise.all(authenticated ? [packument(true)] : [packument(false), packument(true), packument(false, true)]),
    fetchMetadata(`${packumentURL}/latest`, { headers: { accept: 'application/json', 'cache-control': 'no-cache' },
      redirect: 'error', signal: AbortSignal.timeout(15_000) })])
  assert.ok([200, 404].includes(latest.status), `Unexpected latest endpoint status ${latest.status}`)
  if (latest.status === 200) {
    const manifest = await latest.json()
    assert.equal(manifest.name, recoveryName)
    assert.equal(manifest.version, recoveryVersion, 'The latest endpoint resolves a different version; refuse cleanup')
    assert.equal(manifest.dist.integrity, historicalBootstrap.integrity)
  }
  return { tags, packumentTags, latestStatus: latest.status }
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
      await plugin.prepare({ pkgRoot, workspaceRoots, tarballDir: join(output, 'packages') }, {
        cwd: stage, env: process.env, nextRelease: { version: plan.version, gitHead: plan.revision }
      })
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

function assertBootstrapHost(env, revision) {
  assert.equal(env.GITHUB_ACTIONS, 'true')
  assert.equal(env.RUNNER_ENVIRONMENT, 'github-hosted', 'Use a real GitHub-hosted runner')
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch')
  assert.equal(env.GITHUB_REPOSITORY, repository)
  assert.equal(env.GITHUB_REPOSITORY_ID, String(repositoryId))
  assert.equal(env.GITHUB_SHA, revision)
  assert.ok(['refs/heads/main', 'refs/heads/rc'].includes(env.GITHUB_REF), 'Bootstrap only from a reviewed main/rc branch')
  assert.equal(env.GITHUB_WORKFLOW_REF, `${repository}/${bootstrapWorkflow}@${env.GITHUB_REF}`)
}

function assertBootstrapCredential(env) {
  if (!/^[A-Za-z0-9._-]{24,512}$/.test(env.NPM_PACKAGE_BOOTSTRAP_TOKEN ?? '')) throw new Error('Configure the separate bootstrap credential without whitespace')
}

export function assertBootstrapPublication(env, plan, { publish, confirm }) {
  assert.equal(publish, true, 'Explicit publish=true is required')
  assert.equal(confirm, bootstrapConfirmation, 'Exact bootstrap confirmation is required')
  assertBootstrapHost(env, plan.revision)
  assertNpmOidcEnvironment(env) // Required for genuine CI provenance, not package authentication.
  assertBootstrapCredential(env)
}

export async function bootstrapNpmSession(env, { allowOidc = true } = {}) {
  const cwd = await mkdtemp(join(tmpdir(), 'master-npm-bootstrap-'))
  try {
    const userconfig = join(cwd, '.npmrc'), globalconfig = join(cwd, 'global.npmrc')
    // Keep the actual credential out of files as well as receipts/logs.
    await writeFile(userconfig, '//registry.npmjs.org/:_authToken=${NPM_PACKAGE_BOOTSTRAP_TOKEN}\n', { mode: 0o600 })
    await writeFile(globalconfig, '', { mode: 0o600 })
    await writeFile(join(cwd, 'package.json'), '{"private":true}\n')
    const allowed = /^(PATH|PATHEXT|HOME|USERPROFILE|SYSTEMROOT|WINDIR|COMSPEC|TMPDIR|TMP|TEMP|LANG|LC_ALL|LC_CTYPE|TZ|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS|GITHUB_(?!TOKEN$)[A-Z_]+|ACTIONS_ID_TOKEN_REQUEST_(URL|TOKEN)|RUNNER_ENVIRONMENT|CI|NPM_PACKAGE_BOOTSTRAP_TOKEN)$/
    return { cwd, env: { ...Object.fromEntries(Object.entries(env).filter(([key]) => allowed.test(key) && (allowOidc || !key.startsWith('ACTIONS_ID_TOKEN_REQUEST_')))),
      NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig, NPM_CONFIG_CACHE: join(cwd, 'cache'), NPM_CONFIG_REGISTRY: npmRegistry },
    extendEnv: false, preferLocal: false, cleanup: () => rm(cwd, { recursive: true, force: true }) }
  } catch (error) { await rm(cwd, { recursive: true, force: true }); throw error }
}

export async function cleanupFailedBootstrapLatest(output, { revision, cleanup = false, publish = false, confirm = '', env = process.env,
  github = githubReader(env), fetchMetadata = fetch, run = execa, wait = pause, loadHistorical = readFailedBootstrap,
  verifyPackage = verifyFailedBootstrapPackage } = {}) {
  assert.equal(cleanup, true, 'Select the dedicated C5 latest cleanup explicitly')
  assert.equal(publish, false, 'The cleanup run cannot publish any npm version')
  assert.ok(confirm === cleanupConfirmation, 'Exact C5 latest cleanup confirmation is required')
  assert.match(revision ?? '', /^[a-f0-9]{40}$/)
  assertBootstrapHost(env, revision)
  assertBootstrapCredential(env)
  await mkdir(output, { mode: 0o700 })
  const original = await loadHistorical(output, { github, run })
  const historical = await verifyPackage(output, { original, fetchMetadata, run, env })
  const authenticated = (url, options) => fetchMetadata(url, { ...options,
    headers: { ...options.headers, Authorization: `Bearer ${env.NPM_PACKAGE_BOOTSTRAP_TOKEN}` } })
  const before = { bootstrap: recoveryVersion, latest: recoveryVersion }, after = { bootstrap: recoveryVersion }
  const observe = () => Promise.all([verifiedCleanupTags(fetchMetadata), verifiedCleanupTags(authenticated, true)])
  const assertBefore = async () => {
    for (const evidence of await observe()) {
      assert.deepEqual(evidence.tags, before, 'Unexpected direct tag map; refusing C5 cleanup')
      for (const tags of evidence.packumentTags) assert.deepEqual(tags, before, 'Unexpected packument tags; refusing C5 cleanup')
      assert.equal(evidence.latestStatus, 200, 'The latest alias must resolve before cleanup')
    }
  }
  await assertBefore()
  const receipt = { schemaVersion: 1, mode: 'remove-c5-bootstrap-latest', workflowRevision: revision, historical,
    package: recoveryName, version: recoveryVersion, tagsBefore: before, state: 'attempted', latestRemovalPerformed: null,
    publicationPerformed: false, unpublicationPerformed: false }
  const receiptFile = join(output, 'cleanup-receipt.json')
  const session = await bootstrapNpmSession(env, { allowOidc: false })
  try {
    await assertBefore()
    await save(receiptFile, receipt)
    try {
      const { cleanup: _cleanup, ...options } = session
      const result = await run('npm', ['dist-tag', 'rm', recoveryName, 'latest', '--registry', npmRegistry, '--fetch-retries=0', '--color=false'],
        { ...options, stdout: 'pipe', stderr: 'pipe', timeout: 60_000 })
      if (result.stdout.trim() !== `-latest: ${recoveryName}@${recoveryVersion}`) throw new Error('Unconfirmed tag removal')
    } catch {
      throw new Error('C5 latest cleanup failed or was ambiguous; retain the receipt and inspect registry state. No write retry was performed.')
    }
    // The ordinary public packument can retain its previous view for 300s.
    // Poll reads only. A failed or ambiguous DELETE is never repeated.
    const delays = [2000, 4000, 8000, ...Array(35).fill(10_000)]
    for (let i = 0; i <= delays.length; i++) {
      const evidence = await observe()
      const maps = evidence.flatMap(result => [result.tags, ...result.packumentTags])
      for (const tags of maps) assert.deepEqual(tags, Object.hasOwn(tags, 'latest') ? before : after, 'Unexpected tags appeared after C5 cleanup')
      if (maps.every(tags => !Object.hasOwn(tags, 'latest')) && evidence.every(result => result.latestStatus === 404)) {
        Object.assign(receipt, { tagsAfter: after, latestAliasHTTPStatusAfter: 404, state: 'verified', latestRemovalPerformed: true })
        await save(receiptFile, receipt)
        return receipt
      }
      if (i < delays.length) await wait(delays[i])
    }
    throw new Error('C5 latest cleanup has not become visible in both registry views; inspect the attempted receipt without retrying the write')
  } finally { await session.cleanup() }
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
      const published = await readPublishedPackage({ ...pkg, gitHead: plan.revision }, plan.version, fetchMetadata)
      assert.deepEqual(await readRegistryTags(pkg.name, fetchMetadata), { [bootstrapTag]: plan.version }, `Unexpected tags after bootstrap: ${pkg.name}`)
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
  } else if (command === 'cleanup-failed-c5-latest') {
    assert.ok(!process.env.BOOTSTRAP_SOURCE_CI_RUN_ID && !process.env.BOOTSTRAP_SOURCE_CI_ATTEMPT, 'Omit source CI inputs for the cleanup-only run')
    const revision = (await execa('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
    assert.equal((await execa('git', ['status', '--porcelain=v1', '--untracked-files=no'], { cwd: root })).stdout.trim(), '')
    await cleanupFailedBootstrapLatest(resolve(option('--output')), { revision, cleanup: process.env.BOOTSTRAP_CLEANUP === 'true',
      publish: process.env.BOOTSTRAP_PUBLISH === 'true', confirm: process.env.BOOTSTRAP_CONFIRM })
    console.log('Verified removal of the unintended C5 latest tag. The bootstrap version and its bootstrap tag are retained.')
  } else if (command === 'publish') {
    const result = await publishBootstrap(resolve(option('--plan')), { publish: process.env.BOOTSTRAP_PUBLISH === 'true', confirm: process.env.BOOTSTRAP_CONFIRM ?? '' })
    console.log(`${result.mode}: ${result.operations.length} attempted operations; no stable/RC promotion.`)
  } else throw new Error('Use plan, prepare, publish or cleanup-failed-c5-latest; writes require their explicit workflow confirmation and credential')
  if (process.env.GITHUB_OUTPUT && command === 'plan') await appendFile(process.env.GITHUB_OUTPUT, 'plan=bootstrap-artifacts/plan.json\n')
}
