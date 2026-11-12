import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertPagesTarget, verifyPagesTarget } from './pages-release-target.mjs'

const expected = { name: 'fixture-stable', branch: 'main', origin: 'https://css.master.co' }
const project = { name: 'fixture-stable', production_branch: 'pages-stable', domains: ['fixture-stable.pages.dev', 'css.master.co'] }

test('a stable release requires the matching project, production branch and hostname', () => {
  assert.doesNotThrow(() => assertPagesTarget(project, expected))
  for (const wrong of [
    { ...project, name: 'another-project' },
    { ...project, production_branch: 'codex/pages-stable' },
    { ...project, production_branch: 'rc' },
    { ...project, production_branch: 'main' },
    { ...project, domains: ['rc.css.master.co'] }
  ]) assert.throws(() => assertPagesTarget(wrong, expected))
  assert.throws(() => assertPagesTarget(project, { ...expected, origin: 'https://preview.example' }))
  assert.throws(() => assertPagesTarget(project, { ...expected, branch: 'canary' }))
  assert.throws(() => assertPagesTarget({ ...project, production_branch: 'codex/pages-rc', domains: ['rc.css.master.co'] },
    { ...expected, branch: 'rc', origin: 'https://rc.css.master.co' }), /Only main/)
})

test('missing credentials and unsuccessful API responses cannot pass target verification', async () => {
  await assert.rejects(verifyPagesTarget({}, () => { throw new Error('must not fetch') }), /Missing/)
  const env = { CLOUDFLARE_API_TOKEN: 'fixture-token', CLOUDFLARE_ACCOUNT_ID: 'fixture-account', PAGES_PROJECT: expected.name, PUBLIC_COMMIT_REF: expected.branch, PUBLIC_URL: expected.origin }
  const fetchProject = async (url, options) => {
    assert.equal(new URL(url).hostname, 'api.cloudflare.com')
    assert.equal(options.method, undefined, 'preflight only uses GET')
    assert.equal(options.redirect, 'error')
    return { ok: true, json: async () => ({ success: true, result: project }) }
  }
  await verifyPagesTarget(env, fetchProject)
  await assert.rejects(verifyPagesTarget(env, async () => ({ ok: false, status: 403 })), /HTTP 403/)
  await assert.rejects(verifyPagesTarget(env, async () => ({ ok: true, json: async () => ({ success: false }) })), /not successful/)
})
