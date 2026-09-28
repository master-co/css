import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rustContractRecordScopeDigest } from './evidence.mjs'
import { resolveReviewedRemoval, resolveReviewedRename } from './rust-contracts.mjs'

const target = { id: 'rc87-1234567890abcdef', sourceDigest: 'a'.repeat(64) }
function record() {
  const value = { sourceId: 'rc87-fedcba0987654321', sourceDigest: 'b'.repeat(64), targetId: target.id, targetDigest: target.sourceDigest,
    proof: 'approved-contract-change', reason: 'Explicitly reviewed replacement of the former contract.' }
  value.approval = { scopeDigest: rustContractRecordScopeDigest(value) }
  return value
}
const targets = new Map([[target.id, [target]]])
test('renamed evidence resolves one reviewed target and binds its identity and content', () => {
  assert.deepEqual(resolveReviewedRename(record(), targets, new Set()), [target])
  const renamed = record(); renamed.targetId = 'rc87-0000000000000000'
  assert.throws(() => resolveReviewedRename(renamed, targets, new Set()), /approval is stale/)
  assert.throws(() => resolveReviewedRename(record(), new Map([[target.id, [{ ...target, sourceDigest: 'c'.repeat(64) }]]]), new Set()), /Stale renamed target digest/)
})
test('renames cannot hide missing, ambiguous or already allocated targets', () => {
  assert.throws(() => resolveReviewedRename(record(), new Map(), new Set()), /Missing or ambiguous/)
  assert.throws(() => resolveReviewedRename(record(), new Map([[target.id, [target, target]]]), new Set()), /Missing or ambiguous/)
  assert.throws(() => resolveReviewedRename(record(), targets, new Set([target.id])), /already used/)
})
test('renames require an approved contract change instead of a superset assertion', () => {
  assert.throws(() => resolveReviewedRename({ ...record(), proof: 'verified-superset' }, targets, new Set()), /approved contract evidence/)
  assert.throws(() => resolveReviewedRename({ ...record(), approval: undefined }, targets, new Set()), /approval metadata/)
})

const retiredSource = { id: 'rc87-fedcba0987654321', sourceDigest: 'b'.repeat(64) }
function removalRecord(changes = {}) {
  const value = { ...record(), targetDigest: null, proof: 'approved-contract-removal', ...changes }
  value.approval = { approvedBy: 'test reviewer', approvedAt: '2026-09-28T00:00:00Z',
    reviewRef: 'test-removal-review', scopeDigest: rustContractRecordScopeDigest(value) }
  return value
}
test('approved removals retain historical sources without claiming an executable target', () => {
  const evidence = removalRecord()
  const entry = resolveReviewedRemoval(evidence, retiredSource, [], new Map())
  assert.equal(entry.source, retiredSource)
  assert.equal(entry.status, 'approved-contract-removal')
  assert.equal(entry.target, null)
  assert.equal(entry.approval, evidence.approval)
})
test('removals reject present, relocated and previously renamed targets', () => {
  assert.throws(() => resolveReviewedRemoval(removalRecord(), retiredSource, [target], new Map()), /present or relocated/)
  assert.throws(() => resolveReviewedRemoval(removalRecord(), retiredSource, [], targets), /retired target still exists/)
})
test('removals bind source identity, retired target, absent output and human approval', () => {
  const check = (value, pattern) => assert.throws(() => resolveReviewedRemoval(value, retiredSource, [], new Map()), pattern)
  check(removalRecord({ proof: 'approved-contract-change' }), /requires removal evidence/)
  check(removalRecord({ sourceId: target.id }), /source identity drifted/)
  check(removalRecord({ sourceDigest: 'c'.repeat(64) }), /source digest drifted/)
  check(removalRecord({ targetId: undefined }), /must identify the retired target/)
  check(removalRecord({ targetDigest: target.sourceDigest }), /no executable target/)
  check(removalRecord({ reason: '' }), /requires a reason/)
  check({ ...removalRecord(), reason: 'Unreviewed change' }, /approval is stale/)
  const missingReviewer = removalRecord(); delete missingReviewer.approval.approvedBy
  check(missingReviewer, /approvedBy/)
})
