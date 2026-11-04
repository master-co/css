import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import YAML from 'yaml'
import { recoveryRequest, verifyRecoverySource, verifyRestoredEvidence, extractEvidencePython, restoreRecoveryEvidence } from './release-recovery-artifact.mjs'

const revision = 'a'.repeat(40)
const environment = { GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF_NAME: 'rc', GITHUB_REF: 'refs/heads/rc',
  GITHUB_SHA: revision, GITHUB_REPOSITORY: 'master-co/css', GITHUB_REPOSITORY_ID: '123', GITHUB_RUN_ID: '20',
  RECOVERY_RUN_ID: '10', RECOVERY_ATTEMPT: '2', RECOVERY_VERSION: '2.0.0-rc.99', RECOVERY_CONFIRM: 'RECOVER NPM ONLY' }
const request = recoveryRequest(environment)
const workflow = { id: 7, path: '.github/workflows/release.yml' }
const run = { id: 10, run_attempt: 2, workflow_id: 7, path: workflow.path,
  repository: { id: 123, full_name: 'master-co/css' }, head_repository: { id: 123, full_name: 'master-co/css' },
  event: 'push', status: 'completed', conclusion: 'failure', head_sha: revision, head_branch: 'rc' }
const artifact = { id: 99, name: `npm-release-${revision}-2`, expired: false, digest: 'sha256:' + 'b'.repeat(64),
  workflow_run: { id: 10, repository_id: 123, head_repository_id: 123, head_sha: revision, head_branch: 'rc' } }

async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), 'master-recovery-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return directory
}
async function fixture(directory) {
  await mkdir(join(directory, 'packages'), { recursive: true })
  const bytes = Buffer.from('immutable archive fixture')
  const state = { schemaVersion: 1, revision, version: request.version, candidateTag: `candidate-${request.version}`,
    channels: { rc: { baseline: {} } }, packages: [{ name: '@fixture/pkg', archive: 'packages/pkg.tgz',
      integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}` }] }
  await writeFile(join(directory, 'promotion-state.json'), JSON.stringify(state))
  await writeFile(join(directory, 'packages/pkg.tgz'), bytes)
  return state
}
function zip(source, destination) {
  execFileSync('python3', ['-c', 'import pathlib,sys,zipfile\nwith zipfile.ZipFile(sys.argv[2],"w") as z:\n for p in pathlib.Path(sys.argv[1]).rglob("*"):\n  if p.is_file(): z.write(p,str(p.relative_to(sys.argv[1])))', source, destination])
}

test('only an explicit same-channel manual request can enter recovery', () => {
  for (const change of [{ GITHUB_EVENT_NAME: 'push' }, { GITHUB_REF_NAME: 'feature' }, { GITHUB_REF: 'refs/tags/rc' },
    { RECOVERY_CONFIRM: 'yes' }, { RECOVERY_RUN_ID: '20' }, { RECOVERY_RUN_ID: '10; npm publish' },
    { RECOVERY_ATTEMPT: '../2' }, { RECOVERY_VERSION: '2.0.0' }]) assert.throws(() => recoveryRequest({ ...environment, ...change }))
})

test('foreign workflow, repository, fork, SHA, attempt and noncompleted evidence fail closed', () => {
  assert.doesNotThrow(() => verifyRecoverySource(request, workflow, run, artifact))
  for (const change of [{ workflow_id: 8 }, { path: '.github/workflows/other.yml' }, { id: 11 }, { run_attempt: 3 },
    { head_repository: { ...run.head_repository, id: 999 } }, { repository: { ...run.repository, full_name: 'other/css' } },
    { event: 'pull_request' }, { status: 'in_progress' }, { head_sha: 'c'.repeat(40) }, { head_branch: 'main' }]) {
    assert.throws(() => verifyRecoverySource(request, workflow, { ...run, ...change }, artifact))
  }
  for (const change of [{ expired: true }, { digest: undefined }, { name: 'arbitrary' }, { workflow_run: { ...artifact.workflow_run, id: 12 } }]) {
    assert.throws(() => verifyRecoverySource(request, workflow, run, { ...artifact, ...change }))
  }
})

test('restored evidence requires exact bytes, expected version and its original channel baseline', async t => {
  const directory = await temporary(t)
  const state = await fixture(directory)
  await verifyRestoredEvidence(directory, request)
  await assert.rejects(verifyRestoredEvidence(directory, { ...request, version: '2.0.0-rc.100' }))
  await assert.rejects(verifyRestoredEvidence(directory, { ...request, channel: 'latest' }))
  await writeFile(join(directory, 'packages/pkg.tgz'), 'tampered')
  await assert.rejects(verifyRestoredEvidence(directory, request), /archive changed/)
  state.packages[0].archive = '../outside.tgz'
  await writeFile(join(directory, 'promotion-state.json'), JSON.stringify(state))
  await assert.rejects(verifyRestoredEvidence(directory, request), /inside the retained evidence/)
})

test('ZIP extraction rejects traversal, links and files outside the evidence allowlist', async t => {
  const directory = await temporary(t)
  for (const [index, name] of ['../escape', '/absolute', 'packages/../../escape', 'packages/a\\b.tgz', 'poison.js', 'link'].entries()) {
    const archive = join(directory, `${index}.zip`)
    execFileSync('python3', ['-c', 'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[1],"w") as z:\n z.writestr("promotion-state.json","{}")\n i=zipfile.ZipInfo(sys.argv[2]); i.external_attr=(0o120777<<16) if sys.argv[2]=="link" else 0\n z.writestr(i,"payload")', archive, name])
    assert.throws(() => execFileSync('python3', ['-c', extractEvidencePython, archive, join(directory, `out-${index}`)], { stdio: 'pipe' }))
  }
})

test('GitHub evidence download verifies its actual ZIP digest and never forwards repository credentials to blob storage', async t => {
  const directory = await temporary(t)
  const source = join(directory, 'source')
  await fixture(source)
  const archive = join(directory, 'artifact.zip')
  zip(source, archive)
  const bytes = await readFile(archive)
  const metadata = { ...artifact, digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}` }
  const originalCwd = process.cwd()
  process.chdir(directory)
  t.after(() => process.chdir(originalCwd))
  const env = { ...environment, GITHUB_TOKEN: 'fixture-read-only-token', GITHUB_OUTPUT: join(directory, 'outputs') }
  const fetchApi = async (url, options) => {
    const target = new URL(url)
    if (target.host === 'fixture.blob.invalid') {
      assert.equal(options.headers, undefined, 'Blob download must not receive GitHub authorization')
      return new Response(bytes)
    }
    assert.equal(target.host, 'api.github.com')
    assert.equal(options.headers.Authorization, 'Bearer fixture-read-only-token')
    assert.equal(options.method, undefined, 'Only GET is allowed')
    if (target.pathname.endsWith('/release.yml')) return Response.json(workflow)
    if (target.pathname.endsWith('/attempts/2')) return Response.json(run)
    if (target.pathname.endsWith('/artifacts')) return Response.json({ artifacts: [metadata] })
    if (target.pathname.endsWith('/99/zip')) return new Response(null, { status: 302, headers: { location: 'https://fixture.blob.invalid/evidence' } })
    throw new Error('Unexpected API path')
  }
  metadata.digest = 'sha256:' + 'c'.repeat(64)
  await assert.rejects(restoreRecoveryEvidence(env, fetchApi), /SHA-256 differs/)
  metadata.digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`
  await restoreRecoveryEvidence(env, fetchApi)
  assert.match(await readFile(env.GITHUB_OUTPUT, 'utf8'), /channel=rc/)
})

test('manual recovery cannot enter normal publication or deployment jobs', async () => {
  const yaml = YAML.parse(await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'))
  for (const name of ['validation', 'release', 'deploy-site', 'publish-editors']) assert.ok(yaml.jobs[name].if.includes('github.event_name == \'push\''), name)
  const job = yaml.jobs['npm-recovery']
  assert.ok(job.if.includes('github.event_name == \'workflow_dispatch\''))
  assert.ok(job.if.includes('github.ref_type == \'branch\''))
  assert.deepEqual(job.permissions, { contents: 'read', actions: 'read', 'id-token': 'write' })
  assert.equal(job.steps[0].with.ref, '${{ github.sha }}')
  assert.equal(job.steps[0].with['persist-credentials'], false)
  const commands = job.steps.filter(step => step.run).map(step => step.run).join('\n')
  assert.ok(commands.includes('release-recover.mjs'))
  assert.doesNotMatch(commands, /bun run release|vsce publish|wrangler|git push/)
  const recover = job.steps.find(step => step.run?.includes('release-recover.mjs'))
  assert.equal(recover.env.GITHUB_TOKEN, undefined)
  assert.equal(recover.env.MASTER_CSS_RELEASE_RECOVERY, '1')
})
