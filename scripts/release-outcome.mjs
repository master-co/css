import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { assertReleaseProvenanceProof } from './release-registry-provenance.mjs'

export function releaseOutcome(state, { revision, branch, resolveTag }) {
  if (!state) return { released: 'false' }
  const channel = branch === 'main' ? 'latest' : branch
  assert.equal(state.schemaVersion, 1, 'Unsupported release state')
  assert.equal(state.revision, revision, 'Release state must belong to this workflow revision')
  assert.match(state.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
  assert.equal(state.channels?.[channel]?.complete, true, 'The complete candidate must be promoted before delivery')
  assert.ok(state.packages?.length > 0, 'Release package inventory is required')
  assert.deepEqual([...state.channels[channel].promoted].sort(), state.packages.map(pkg => pkg.name).sort(), 'Every package must be promoted before delivery')
  assertReleaseProvenanceProof(state)
  const tag = `v${state.version}`
  assert.equal(resolveTag(tag), revision, 'Release version tag must point to the validated source revision')
  return { released: 'true', version: state.version, revision, tag }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let state
  try { state = JSON.parse(readFileSync(process.env.MASTER_CSS_RELEASE_STATE ?? 'release-artifacts/promotion-state.json', 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const outcome = releaseOutcome(state, {
    revision: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME,
    resolveTag: tag => execFileSync('git', ['rev-parse', `refs/tags/${tag}^{commit}`], { encoding: 'utf8' }).trim()
  })
  assert.ok(process.env.GITHUB_OUTPUT, 'GITHUB_OUTPUT is required')
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(outcome).map(([key, value]) => `${key}=${value}\n`).join(''))
  console.log(outcome.released === 'true' ? `Delivery may use ${outcome.tag} at ${outcome.revision}.` : 'No npm release was promoted; site and editor delivery will be skipped.')
}
