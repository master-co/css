import assert from 'node:assert/strict'
import { test } from 'node:test'
import { releaseOutcome } from './release-outcome.mjs'

const revision = 'a'.repeat(40)
const packages = [{ name: '@fixture/a', integrity: 'sha512-YQ==' }, { name: '@fixture/b', integrity: 'sha512-Yg==' }]
  .map(pkg => ({ ...pkg, uploadRun: '1:1', uploadEvent: 'push' }))
const state = { schemaVersion: 1, revision, version: '2.0.0', packages, channels: { latest: { complete: true, promoted: ['@fixture/a', '@fixture/b'] } },
  provenanceProof: { schemaVersion: 1, revision, version: '2.0.0', cryptographicProvenanceVerified: true, verifiedCount: 2,
    packages: packages.map(pkg => ({ ...pkg, version: '2.0.0', attestationSHA256: 'f'.repeat(64) })) } }
const context = { revision, branch: 'main', resolveTag: tag => { assert.equal(tag, 'v2.0.0'); return revision } }

test('a no-op release never borrows a newer remote version for site or editor delivery', () => {
  assert.deepEqual(releaseOutcome(null, { ...context, resolveTag: () => { throw new Error('must not resolve a fallback tag') } }), { released: 'false' })
})

test('delivery uses the completed cohort version and its exact source tag', () => {
  assert.deepEqual(releaseOutcome(state, context), { released: 'true', version: '2.0.0', revision, tag: 'v2.0.0' })
  assert.throws(() => releaseOutcome(state, { ...context, resolveTag: () => 'b'.repeat(40) }), /validated source/)
  assert.throws(() => releaseOutcome(state, { ...context, revision: 'b'.repeat(40) }), /workflow revision/)
})

test('partial or different-channel promotion cannot trigger delivery', () => {
  assert.throws(() => releaseOutcome(state, { ...context, branch: 'rc' }), /complete candidate/)
  const partial = structuredClone(state)
  partial.channels.latest.promoted.pop()
  assert.throws(() => releaseOutcome(partial, context), /Every package/)
  partial.channels.latest.complete = false
  assert.throws(() => releaseOutcome(partial, context), /complete candidate/)
})

test('delivery rejects missing or substituted provenance evidence even after promotion', () => {
  assert.throws(() => releaseOutcome({ ...state, provenanceProof: null }, context), /cryptographic npm provenance/)
  const wrong = structuredClone(state)
  wrong.provenanceProof.packages[0].integrity = 'sha512-Yw=='
  assert.throws(() => releaseOutcome(wrong, context), /exact package archives/)
})
