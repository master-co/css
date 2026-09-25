import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rustContractRecordScopeDigest } from './evidence.mjs'
import { resolveReviewedRename } from './rust-contracts.mjs'

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
