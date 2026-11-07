import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { runCommand } from 'aronrepo/node'
import { release, releaseNotesPath } from './release.mjs'

function write(cwd, file, content) {
  mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })
  writeFileSync(path.join(cwd, file), content)
}

function createRepo() {
  const cwd = mkdtempSync(path.join(tmpdir(), 'master-css-release-'))
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(cwd, 'empty-gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GITHUB_TOKEN: 'token', GITHUB_REPOSITORY: 'master-co/css' }
  for (const key of ['GITHUB_REF_NAME', 'GITHUB_API_URL', 'GITHUB_SERVER_URL']) delete env[key]
  writeFileSync(env.GIT_CONFIG_GLOBAL, '')
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'fixture@example.com')
  git('config', 'user.name', 'Fixture')
  write(cwd, '.gitignore', 'release-artifacts\n')
  write(cwd, 'package.json', JSON.stringify({ private: true, type: 'module', workspaces: ['packages/*'] }))
  write(cwd, 'aronrepo.config.js', `export default { release: { mode: 'explicit', assets: [{ path: '${releaseNotesPath}', name: 'release-notes-{tag}.md' }] } }\n`)
  for (const name of ['a', 'b']) {
    write(cwd, `packages/${name}/package.json`, JSON.stringify({ name: `@fixture/${name}`, version: '0.0.0', publishConfig: { access: 'public', provenance: true } }))
  }
  const commit = (message, files = {}) => {
    for (const [file, content] of Object.entries(files)) write(cwd, file, content)
    git('add', '-A')
    git('commit', '--allow-empty', '-q', '-m', message)
    return git('rev-parse', 'HEAD')
  }
  commit('Chore: Initialize fixture')
  git('tag', 'v1.0.0')
  return { cwd, env, git, commit }
}

function createHarness(cwd, env) {
  const steps = []
  const releases = []
  const uploads = []
  const recorder = name => async (config, context) => {
    steps.push(`${name}${config?.pkgRoot ? ` ${config.pkgRoot}` : ''}`)
    if (name === 'workspace.verifyConditions') assert.match(context.nextRelease.gitHead, /^[a-f0-9]{40}$/)
  }
  const workspace = {
    verifyConditions: recorder('workspace.verifyConditions'),
    prepare: recorder('workspace.prepare'),
    publish: recorder('workspace.publish'),
    success: async () => { steps.push('workspace.success') },
    fail: async () => {}
  }
  const promotion = {
    verifyConditions: recorder('promotion.verifyConditions'),
    verifyRelease: recorder('promotion.verifyRelease'),
    publish: recorder('promotion.publish')
  }
  const run = async (command, args, options) => {
    if (command === 'git' && args[0] === 'push') {
      steps.push(`git push ${args.at(-1)}`)
      return { stdout: '', stderr: '' }
    }
    if (command === 'git' && args[0] === '-c' && args[2] === 'tag') steps.push(`git tag ${args.at(-2)}`)
    return runCommand(command, args, options)
  }
  const fetch = async (input, init) => {
    if (input.startsWith('https://uploads.github.com/')) {
      uploads.push(new URL(input).searchParams.get('name'))
      return Response.json({}, { status: 201 })
    }
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body)
      releases.push(body)
      steps.push(`github ${body.tag_name}`)
      return Response.json({ html_url: 'url', upload_url: 'https://uploads.github.com/repos/master-co/css/releases/1/assets{?name,label}', assets: [] }, { status: 201 })
    }
    return new Response('', { status: 404 })
  }
  return { steps, releases, uploads, workspace, promotion, run, fetch, options: { cwd, env, log: () => {}, run, fetch, workspace, promotion } }
}

test('stages, tags, promotes, and creates the GitHub release in the order of the recovery model', async () => {
  const { cwd, env, commit } = createRepo()
  const head = commit('Fix(A): Repair the cache', { 'packages/a/index.js': 'export {}' })
  const harness = createHarness(cwd, env)
  const result = await release({ ...harness.options, env: { ...env, GITHUB_REF_NAME: 'main' } })

  assert.equal(result.status, 'released')
  assert.equal(result.plan.version, '1.0.1')
  assert.deepEqual(harness.steps, [
    'workspace.verifyConditions packages/a', 'workspace.verifyConditions packages/b',
    'promotion.verifyConditions', 'promotion.verifyRelease',
    'workspace.prepare packages/a', 'workspace.prepare packages/b',
    'git tag v1.0.1', 'git push refs/tags/v1.0.1',
    'workspace.publish packages/a', 'workspace.publish packages/b',
    'promotion.publish', 'workspace.success', 'github v1.0.1'
  ])
  assert.deepEqual(harness.releases.map(({ tag_name, target_commitish, prerelease }) => ({ tag_name, target_commitish, prerelease })),
    [{ tag_name: 'v1.0.1', target_commitish: head, prerelease: false }])
  assert.deepEqual(harness.uploads, ['release-notes-v1.0.1.md'])
  const notes = readFileSync(path.join(cwd, releaseNotesPath), 'utf8')
  assert.equal(notes, harness.releases[0].body)
  assert.match(notes, /^### Bug Fixes\n\n- \*\*A:\*\* Repair the cache/)
  assert.match(notes, /\*\*Full Changelog\*\*: https:\/\/github\.com\/master-co\/css\/compare\/v1\.0\.0\.\.\.v1\.0\.1\n$/)
})

test('passes the prerelease channel and never reaches GitHub when npm fails', async () => {
  const { cwd, env, git, commit } = createRepo()
  git('checkout', '-q', '-b', 'rc')
  commit('Fix(B): Repair the parser', { 'packages/b/index.js': 'export {}' })
  const harness = createHarness(cwd, env)
  let channel
  harness.promotion.publish = async (_config, context) => {
    channel = context.nextRelease.channel
    throw new Error('npm scan timed out')
  }
  await assert.rejects(release({ ...harness.options, promotion: harness.promotion, env: { ...env, GITHUB_REF_NAME: 'rc' } }), /npm scan timed out/)
  assert.equal(channel, 'rc')
  assert.ok(harness.steps.includes('git push refs/tags/v1.0.1-rc.1'))
  assert.ok(harness.steps.includes('workspace.success'))
  assert.deepEqual(harness.releases, [])
})

test('releases nothing for non-release commits, and resumes the GitHub release only after npm promotion', async () => {
  const { cwd, env, git, commit } = createRepo()
  commit('Chore(Site): Tidy up', { 'site/index.js': 'export {}' })
  const quiet = createHarness(cwd, env)
  assert.equal((await release({ ...quiet.options, env: { ...env, GITHUB_REF_NAME: 'main' } })).status, 'none')
  assert.deepEqual(quiet.steps, [])

  commit('Fix(A): Repair the cache', { 'packages/a/index.js': 'export {}' })
  git('tag', 'v1.0.1')
  const tags = { '@fixture/a': '1.0.1', '@fixture/b': '1.0.0' }
  const fetchMetadata = async input => Response.json({ latest: tags[decodeURIComponent(input).match(/package\/(.+)\/dist-tags/)[1]] })
  const pending = createHarness(cwd, env)
  assert.equal((await release({ ...pending.options, fetchMetadata, env: { ...env, GITHUB_REF_NAME: 'main' } })).status, 'none')
  assert.deepEqual(pending.releases, [])

  tags['@fixture/b'] = '1.0.1'
  const promoted = createHarness(cwd, env)
  const result = await release({ ...promoted.options, fetchMetadata, env: { ...env, GITHUB_REF_NAME: 'main' } })
  assert.equal(result.status, 'resumed')
  assert.deepEqual(promoted.releases.map(({ tag_name }) => tag_name), ['v1.0.1'])
  assert.deepEqual(promoted.uploads, ['release-notes-v1.0.1.md'])
  assert.deepEqual(promoted.steps, ['github v1.0.1'])
})

test('a dry run writes the plan for later workflow steps without releasing', async () => {
  const { cwd, env, commit } = createRepo()
  const output = path.join(cwd, 'github-output')
  const harness = createHarness(cwd, env)
  const quiet = await release({ ...harness.options, dryRun: true, githubOutput: output, env: { ...env, GITHUB_REF_NAME: 'main' } })
  assert.equal(quiet.status, 'dry-run')
  assert.equal(readFileSync(output, 'utf8'), 'release=\nversion=\ntag=\n')

  commit('Fix(A): Repair the cache', { 'packages/a/index.js': 'export {}' })
  writeFileSync(output, '')
  await release({ ...harness.options, dryRun: true, githubOutput: output, env: { ...env, GITHUB_REF_NAME: 'main' } })
  assert.equal(readFileSync(output, 'utf8'), 'release=patch\nversion=1.0.1\ntag=v1.0.1\n')
  assert.deepEqual(harness.steps, [])
  assert.deepEqual(harness.releases, [])
})
