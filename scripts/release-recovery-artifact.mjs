import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { appendFile, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const formalBranches = ['main', 'alpha', 'beta', 'rc', 'canary']
const workflowPath = '.github/workflows/release.yml'

export function recoveryRequest(env) {
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Recovery requires explicit manual dispatch')
  assert.ok(formalBranches.includes(env.GITHUB_REF_NAME), 'Recovery requires a formal release branch')
  assert.equal(env.GITHUB_REF, `refs/heads/${env.GITHUB_REF_NAME}`, 'Recovery requires a branch, not a tag')
  assert.equal(env.RECOVERY_CONFIRM, 'RECOVER NPM ONLY', 'Explicit npm-only recovery confirmation is required')
  assert.match(env.RECOVERY_RUN_ID ?? '', /^[1-9]\d*$/)
  assert.match(env.RECOVERY_ATTEMPT ?? '', /^[1-9]\d*$/)
  for (const value of [env.RECOVERY_RUN_ID, env.RECOVERY_ATTEMPT]) assert.ok(Number.isSafeInteger(Number(value)), 'Run identifiers must be safe integers')
  assert.match(env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/)
  assert.match(env.GITHUB_REPOSITORY ?? '', /^[\w.-]+\/[\w.-]+$/)
  const versionPattern = env.GITHUB_REF_NAME === 'main' ? /^\d+\.\d+\.\d+$/ : new RegExp(`^\\d+\\.\\d+\\.\\d+-${env.GITHUB_REF_NAME}\\.\\d+$`)
  assert.match(env.RECOVERY_VERSION ?? '', versionPattern, 'Recovery version must match the selected release channel')
  assert.notEqual(env.RECOVERY_RUN_ID, env.GITHUB_RUN_ID, 'A recovery cannot use its own unfinished artifacts')
  return { repository: env.GITHUB_REPOSITORY, repositoryId: Number(env.GITHUB_REPOSITORY_ID),
    runId: Number(env.RECOVERY_RUN_ID), attempt: Number(env.RECOVERY_ATTEMPT), revision: env.GITHUB_SHA,
    branch: env.GITHUB_REF_NAME, version: env.RECOVERY_VERSION, channel: env.GITHUB_REF_NAME === 'main' ? 'latest' : env.GITHUB_REF_NAME }
}

export function verifyRecoverySource(request, workflow, run, artifact) {
  assert.ok(Number.isSafeInteger(request.repositoryId) && request.repositoryId > 0, 'Repository identity is required')
  assert.equal(workflow.path, workflowPath)
  assert.equal(run.workflow_id, workflow.id, 'Source run uses a different workflow')
  assert.equal(run.path, workflowPath, 'Source run path is not the release workflow')
  assert.equal(run.id, request.runId)
  assert.equal(run.run_attempt, request.attempt, 'Source attempt differs')
  for (const repository of [run.repository, run.head_repository]) {
    assert.equal(repository?.id, request.repositoryId, 'Source run is from another repository or fork')
    assert.equal(repository?.full_name, request.repository)
  }
  assert.ok(['push', 'workflow_dispatch'].includes(run.event), 'Pull-request and other event artifacts cannot authorize recovery')
  assert.equal(run.status, 'completed', 'Source run must have stopped before recovery')
  assert.ok(['failure', 'cancelled', 'timed_out', 'success'].includes(run.conclusion), 'Source run is not recoverable')
  assert.equal(run.head_sha, request.revision, 'Recovery must use the exact original source revision')
  assert.equal(run.head_branch, request.branch, 'Recovery must use the original formal branch')
  assert.ok(Number.isSafeInteger(artifact.id) && artifact.id > 0, 'Artifact identity is required')
  assert.equal(artifact.name, `npm-release-${request.revision}-${request.attempt}`, 'Unexpected release evidence artifact')
  assert.equal(artifact.expired, false, 'Release evidence has expired')
  assert.match(artifact.digest ?? '', /^sha256:[a-f0-9]{64}$/, 'GitHub artifact SHA-256 is required')
  for (const [key, value] of Object.entries({ id: request.runId, repository_id: request.repositoryId,
    head_repository_id: request.repositoryId, head_sha: request.revision, head_branch: request.branch })) {
    assert.equal(artifact.workflow_run?.[key], value, `Artifact source ${key} differs`)
  }
}

export async function verifyRestoredEvidence(directory, request) {
  const state = JSON.parse(await readFile(join(directory, 'promotion-state.json'), 'utf8'))
  assert.equal(state.schemaVersion, 1)
  assert.equal(state.revision, request.revision)
  assert.equal(state.version, request.version, 'Restored version differs from the explicitly confirmed version')
  assert.equal(state.candidateTag, `candidate-${request.version}`)
  assert.ok(state.channels?.[request.channel], 'Recovery cannot invent a different channel baseline')
  assert.ok(Array.isArray(state.packages) && state.packages.length > 0, 'Release cohort is missing')
  assert.equal(new Set(state.packages.map(pkg => pkg.name)).size, state.packages.length)
  const expected = []
  for (const pkg of state.packages) {
    assert.match(pkg.archive, /^packages\/[A-Za-z0-9_.-]+\.tgz$/, 'Recovery archive must stay inside the retained evidence')
    assert.match(pkg.integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/)
    const bytes = await readFile(join(directory, pkg.archive))
    assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, pkg.integrity, `Restored archive changed: ${pkg.name}`)
    expected.push(pkg.archive.slice('packages/'.length))
  }
  assert.deepEqual((await readdir(join(directory, 'packages'))).sort(), expected.sort(), 'Evidence must contain exactly the archived cohort')
  return state
}

export const extractEvidencePython = String.raw`
import os, pathlib, stat, sys, zipfile
source, destination = sys.argv[1:]
with zipfile.ZipFile(source) as archive:
    names = set()
    size = 0
    for entry in archive.infolist():
        name = entry.filename
        path = pathlib.PurePosixPath(name)
        assert not path.is_absolute() and '..' not in path.parts and '\\' not in name, 'Unsafe artifact path'
        assert not stat.S_ISLNK(entry.external_attr >> 16), 'Artifact symlinks are forbidden'
        if entry.is_dir():
            assert name == 'packages/', 'Unexpected artifact directory'
            continue
        assert name not in names, 'Duplicate artifact file'
        names.add(name)
        assert name in ('promotion-state.json', 'checksums.json') or (len(path.parts) == 2 and path.parts[0] == 'packages' and name.endswith('.tgz')), 'Unexpected artifact file'
        size += entry.file_size
        assert len(names) <= 100 and size <= 2 * 1024 ** 3, 'Artifact exceeds recovery bounds'
    assert 'promotion-state.json' in names, 'Missing release state'
    os.makedirs(destination, exist_ok=False)
    archive.extractall(destination)
`

/** Read-only GitHub API and local evidence restoration. Never invokes npm.
 * API identities and digest: https://docs.github.com/en/rest/actions/artifacts
 * Attempt identity: https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run-attempt
 */
export async function restoreRecoveryEvidence(env = process.env, fetchApi = fetch) {
  const request = recoveryRequest(env)
  assert.ok(env.GITHUB_TOKEN, 'Read-only Actions token is required to retrieve evidence')
  const apiBase = `https://api.github.com/repos/${request.repository}`
  const api = async route => {
    const response = await fetchApi(apiBase + route, { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error', signal: AbortSignal.timeout(30_000) })
    assert.equal(response.status, 200, `GitHub evidence lookup failed (HTTP ${response.status})`)
    return response.json()
  }
  const [workflow, run] = await Promise.all([
    api('/actions/workflows/release.yml'), api(`/actions/runs/${request.runId}/attempts/${request.attempt}`)
  ])
  const artifacts = []
  for (let page = 1; ; page++) {
    assert.ok(page <= 100, 'Too many artifacts to identify release evidence safely')
    const batch = await api(`/actions/runs/${request.runId}/artifacts?per_page=100&page=${page}`)
    artifacts.push(...batch.artifacts)
    if (batch.artifacts.length < 100) break
  }
  const matches = artifacts.filter(item => item.name === `npm-release-${request.revision}-${request.attempt}`)
  assert.equal(matches.length, 1, 'Require exactly one matching release evidence artifact')
  const artifact = matches[0]
  verifyRecoverySource(request, workflow, run, artifact)
  const temporary = await mkdtemp(join(tmpdir(), 'master-recovery-evidence-'))
  const destination = resolve('release-artifacts/recovery')
  try {
    const response = await fetchApi(`${apiBase}/actions/artifacts/${artifact.id}/zip`, {
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, redirect: 'manual', signal: AbortSignal.timeout(30_000)
    })
    assert.equal(response.status, 302, 'Expected the GitHub artifact download redirect')
    const location = new URL(response.headers.get('location'))
    assert.equal(location.protocol, 'https:')
    assert.ok(!location.username && !location.password)
    // Never forward the repository token to artifact blob storage.
    const download = await fetchApi(location, { redirect: 'error', signal: AbortSignal.timeout(180_000) })
    assert.equal(download.status, 200, `Artifact download failed (HTTP ${download.status})`)
    const hash = createHash('sha256')
    let size = 0
    const archive = join(temporary, 'evidence.zip')
    const inspect = new Transform({ transform(chunk, _encoding, callback) {
      size += chunk.length
      if (size > 2 * 1024 ** 3) { callback(new Error('Artifact exceeds recovery download bounds')); return }
      hash.update(chunk); callback(null, chunk)
    } })
    await pipeline(Readable.fromWeb(download.body), inspect, createWriteStream(archive, { flags: 'wx', mode: 0o600 }))
    assert.equal(`sha256:${hash.digest('hex')}`, artifact.digest, 'Downloaded artifact SHA-256 differs from GitHub evidence')
    execFileSync('python3', ['-c', extractEvidencePython, archive, destination], { stdio: ['ignore', 'pipe', 'pipe'] })
    await verifyRestoredEvidence(destination, request)
    assert.ok(env.GITHUB_OUTPUT)
    await appendFile(env.GITHUB_OUTPUT, `state=${destination}/promotion-state.json\nchannel=${request.channel}\n`)
    console.log(`Verified original release evidence for ${request.version} at ${request.revision}; no registry writes performed.`)
  } finally { await rm(temporary, { recursive: true, force: true }) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await restoreRecoveryEvidence()
