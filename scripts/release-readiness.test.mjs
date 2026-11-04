import assert from 'node:assert/strict'
import test from 'node:test'
import { inventory, dependencyOrder, planRecovery, rehearse } from './release-readiness.mjs'

const candidate = { revision: 'a'.repeat(40), version: '2.0.0', packages: [
  { name: '@master/css', version: '2.0.0', integrity: 'sha512-Y3Nz', dependencies: ['@master/css-binding'] },
  { name: '@master/css-binding', version: '2.0.0', integrity: 'sha512-YmluZGluZw==', dependencies: [] }
] }
const before = { registry: 'https://registry.npmjs.org/', version: '2.0.0', packages: candidate.packages.map(pkg => ({
  name: pkg.name, tags: pkg.name === '@master/css' ? { latest: '1.37.8' } : {}, candidate: null
})) }
function uploaded() {
  const current = structuredClone(before)
  current.packages.forEach((pkg, index) => { pkg.candidate = { version: '2.0.0', integrity: candidate.packages[index].integrity } })
  return current
}

test('registry inventory distinguishes missing names, missing versions and request failures', async () => {
  const responses = [new Response('{}', { status: 404 }), Response.json({ 'dist-tags': { latest: '1.0.0' }, versions: {} })]
  const output = await inventory(['b', 'a'], '2.0.0', async () => responses.shift())
  assert.equal(output.packages[0].status, 404)
  assert.equal(output.packages[1].candidate, null)
  await assert.rejects(inventory(['a'], '2.0.0', async () => new Response('', { status: 403 })), /Registry request failed/)
})

test('partial uploads block promotion and preserve immutable packages for separate verification', () => {
  const current = uploaded()
  current.packages[0].candidate = null
  const plan = planRecovery(candidate, before, current)
  assert.equal(plan.promotionBlocked, true)
  assert.equal(plan.registryComplete, false)
  assert.equal(plan.packages[0].name, '@master/css-binding')
  assert.equal(plan.packages[0].upload, 'verify-existing-provenance-and-consumers')
  assert.equal(plan.packages[1].upload, 'needs-staged-upload')
})

test('wrong or absent integrity blocks recovery instead of blindly skipping a published version', () => {
  for (const value of ['sha512-d3Jvbmc=', undefined]) {
    const current = uploaded()
    current.packages[0].candidate.integrity = value
    const plan = planRecovery(candidate, before, current)
    assert.equal(plan.promotionBlocked, true)
    assert.equal(plan.packages.find(pkg => pkg.name === '@master/css').upload, 'BLOCK-immutable-version-conflict')
  }
})

test('rollback restores old stable tags, removes previously absent tags, and refuses concurrent changes', () => {
  const current = uploaded()
  current.packages.forEach(pkg => { pkg.tags.latest = '2.0.0' })
  let plan = planRecovery(candidate, before, current)
  assert.equal(plan.packages[0].rollback, 'remove-candidate-tag')
  assert.equal(plan.packages[1].rollback, 'restore-prior-tag')
  assert.equal(plan.packages[1].priorTag, '1.37.8')
  current.packages[0].tags.latest = '2.0.1'
  plan = planRecovery(candidate, before, current)
  assert.equal(plan.promotionBlocked, true)
  assert.equal(plan.packages[1].rollback, 'BLOCK-concurrent-tag-change')
})

test('every upload and promotion interruption is rehearsed without network writes', () => {
  const result = rehearse(candidate, before)
  assert.equal(result.steps.length, 6)
  assert.deepEqual(result.steps.slice(0, 3).map(step => step.pending), [2, 1, 0])
  assert.equal(result.steps.at(-1).rollback.length, 2)
})

test('mismatched snapshot cohort/version and dependency cycles fail closed', () => {
  const current = uploaded()
  current.packages.pop()
  assert.throws(() => planRecovery(candidate, before, current), /cohort differs/)
  assert.throws(() => planRecovery(candidate, { ...before, version: '2.0.1' }, uploaded()), /same candidate/)
  assert.throws(() => dependencyOrder([{ name: 'a', dependencies: ['b'] }, { name: 'b', dependencies: ['a'] }]), /cycle/)
})
