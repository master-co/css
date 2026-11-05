import assert from 'node:assert/strict'

const identity = (run, attempt) => {
  assert.ok(Number.isSafeInteger(run) && Number.isSafeInteger(attempt) && run > 0 && attempt > 0)
  return run + ':' + attempt
}

export function assertUploadOwners(original, recovered, provider) {
  assert.equal(original.run, identity(provider.originalRun, provider.originalAttempt))
  assert.equal(recovered.run, original.run)
  const owners = new Set()
  let previous = original.run
  for (const row of provider.recoveryChain) {
    assert.equal(identity(row.predecessorRun, row.predecessorAttempt), previous)
    assert.ok(row.run > row.predecessorRun && row.event === 'workflow_dispatch')
    assert.match(row.logSHA256, /^[a-f0-9]{64}$/)
    previous = identity(row.run, row.attempt)
    owners.add(previous)
  }
  assert.ok(owners.size > 0 && provider.recoveryChain.at(-1).conclusion === 'success')
  assert.equal(previous, identity(provider.recoveryRun, provider.recoveryAttempt))
  const previously = new Map(original.packages.map(pkg => [pkg.name, pkg]))
  for (const pkg of recovered.packages) {
    const old = previously.get(pkg.name)
    assert.ok(old && pkg.provenance === true && pkg.staged === true && pkg.attempt)
    if (old.attempt) {
      assert.deepEqual([pkg.uploadRun, pkg.uploadEvent, pkg.attempt], [original.run, 'push', old.attempt],
        'An original upload attempt changed')
      assert.deepEqual([old.uploadRun, old.uploadEvent], [original.run, 'push'])
    } else {
      assert.ok(owners.has(pkg.uploadRun) && pkg.uploadEvent === 'workflow_dispatch',
        'An upload belongs to an unauthenticated recovery attempt')
    }
  }
}
