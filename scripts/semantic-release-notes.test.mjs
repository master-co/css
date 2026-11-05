import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { template } from 'lodash-es'
import config from '../release.config.js'
import { prepare, releaseBodyLimit, releaseNotesPath } from './semantic-release-notes.mjs'

const github = config.plugins.find(plugin => plugin[0] === '@semantic-release/github')[1]
const context = notes => ({ nextRelease: { notes, version: '2.0.0', gitTag: 'v2.0.0' }, lastRelease: { gitTag: 'v1.37.8' } })

test('normal release bodies remain the exact generator output, including the boundary', () => {
  for (const notes of ['', '# Changes\n\n- Preserve <code> and 日本語\n', 'a'.repeat(releaseBodyLimit)]) {
    assert.equal(template(github.releaseBodyTemplate)(context(notes)), notes)
  }
})

test('oversized release pages link the complete versioned attachment and original comparison', () => {
  const value = context('a'.repeat(releaseBodyLimit + 1) + '\n### BREAKING CHANGES\n\nRequired migration details\n')
  const body = template(github.releaseBodyTemplate)(value)
  assert.ok(body.length < releaseBodyLimit)
  const asset = github.assets.find(asset => asset.path === releaseNotesPath)
  assert.ok(asset, 'the linked full notes are actually uploaded')
  const name = template(asset.name)(value)
  assert.ok(body.includes(`https://github.com/master-co/css/releases/download/v2.0.0/${name}`))
  assert.ok(body.includes('/compare/v1.37.8...v2.0.0'))
  const firstRelease = template(github.releaseBodyTemplate)({ ...value, lastRelease: {} })
  assert.ok(firstRelease.length < releaseBodyLimit)
  assert.ok(!firstRelease.includes('/compare/'))
  assert.ok(!firstRelease.includes('undefined'))
})

test('prepare preserves every original byte, including breaking changes after the page budget', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'master-css-release-notes-'))
  try {
    const notes = '# Changes\n' + '- Historical entry\n'.repeat(20_000) + '\n### BREAKING CHANGES\n\n完整內容 <code>\n'
    const value = { cwd, ...context(notes) }
    await prepare({}, value)
    assert.deepEqual(await readFile(path.join(cwd, releaseNotesPath)), Buffer.from(notes))
    assert.equal(value.nextRelease.notes, notes, 'other release hooks retain the full notes')
    await assert.rejects(prepare({}, { cwd, nextRelease: {} }), /Expected generated release notes/)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})
