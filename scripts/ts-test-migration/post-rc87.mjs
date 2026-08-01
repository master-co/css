import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_BASELINE_REF, DEFAULT_POST_BASELINE_REF, POST_RC87_COMMIT, RC87_COMMIT, postRc87DecisionPath } from './config.mjs'
import { assertObjectKeys, postRc87DecisionScopeDigest, postRc87TargetDigest, postRc87UpstreamDigest, validateApprovalMetadata } from './evidence.mjs'
import { sourceAtCommit } from './rust-contracts.mjs'
import { git, hasRef, isCommitAncestor, resolveRef, sha256 } from './utils.mjs'

export function countBy(values, getKey) {
  const counts = {}
  for (const value of values) {
    const key = getKey(value)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

export function loadPostRc87Decisions(targetInventory, targetCommit) {
  assert.ok(
    existsSync(postRc87DecisionPath),
    `${path.relative(process.cwd(), postRc87DecisionPath)} does not exist.`
  )
  const source = JSON.parse(readFileSync(postRc87DecisionPath, 'utf8'))
  assertObjectKeys(source, ['$schema', 'version', 'baseline', 'upstreamDelta', 'decisions'], 'Post-rc.87 decision source')
  assert.equal(source.version, 1, 'Unsupported post-rc.87 decision source version.')
  assertObjectKeys(source.baseline, ['ref', 'commit'], 'Post-rc.87 decision baseline')
  assert.equal(source.baseline.ref, DEFAULT_BASELINE_REF, 'Post-rc.87 decision baseline ref drifted.')
  assert.equal(source.baseline.commit, RC87_COMMIT, 'Post-rc.87 decision baseline commit drifted.')
  assertObjectKeys(source.upstreamDelta, ['ref', 'commit'], 'Post-rc.87 upstream delta')
  assert.equal(source.upstreamDelta.ref, DEFAULT_POST_BASELINE_REF, 'Post-rc.87 upstream delta ref drifted.')
  assert.equal(source.upstreamDelta.commit, POST_RC87_COMMIT, 'Post-rc.87 upstream delta commit drifted.')
  assert.ok(Array.isArray(source.decisions), 'Post-rc.87 decisions must be an array.')
  assert.equal(source.decisions.length, 1, 'Exactly one post-rc.87 adaptation decision is expected.')

  const expectedUpstreamFiles = new Set([
    'packages/integration/src/manifest-facade.ts',
    'packages/integration/tests/module.test.ts',
    'packages/next/tests/css-manifest-loader.test.ts',
    'packages/vite/tests/plugins/manifest-loader.test.ts',
    'packages/vite/tests/plugins/manifest-virtual-module.test.ts',
    'packages/webpack/tests/plugin.test.ts'
  ])
  const expectedTargetFiles = new Set([
    'packages/internal/src/manifest-facade.ts',
    'packages/internal/tests/module.test.ts',
    'packages/next/tests/css-manifest-loader.test.ts',
    'packages/runtime/src/core.ts',
    'packages/runtime/e2e/edge-cases.test.ts',
    'packages/vite/tests/plugins/manifest-loader.test.ts',
    'packages/vite/tests/plugins/manifest-virtual-module.test.ts',
    'packages/webpack/tests/plugin.test.ts'
  ])
  const targetById = new Map()
  for (const testCase of targetInventory.cases) {
    if (!targetById.has(testCase.id)) targetById.set(testCase.id, [])
    targetById.get(testCase.id).push(testCase)
  }
  const seenDecisionIds = new Set()
  for (const decision of source.decisions) {
    const label = `Post-rc.87 decision ${decision.id ?? '<unknown>'}`
    assertObjectKeys(decision, ['id', 'status', 'priority', 'owner', 'upstream', 'target', 'invariants', 'approval'], label)
    assert.equal(decision.id, 'post-rc87-browser-manifest-import-fallback', `${label} id is not recognized.`)
    assert.ok(!seenDecisionIds.has(decision.id), `Duplicate ${label}.`)
    seenDecisionIds.add(decision.id)
    assert.equal(decision.status, 'approved-adaptation', `${label} must be approved-adaptation.`)
    assert.equal(decision.priority, 'P0', `${label} must remain P0.`)
    assert.equal(typeof decision.owner, 'string', `${label} owner must be a string.`)
    assert.ok(decision.owner.length, `${label} owner must not be empty.`)
    assertObjectKeys(decision.upstream, ['behavior', 'files', 'digest'], `${label} upstream`)
    assertObjectKeys(decision.target, ['behavior', 'implementedAtCommit', 'files', 'tests', 'digest'], `${label} target`)
    assert.equal(typeof decision.upstream.behavior, 'string', `${label} upstream behavior must be a string.`)
    assert.equal(typeof decision.target.behavior, 'string', `${label} target behavior must be a string.`)
    assert.ok(Array.isArray(decision.upstream.files), `${label} upstream files must be an array.`)
    assert.ok(Array.isArray(decision.target.files), `${label} target files must be an array.`)
    assert.ok(Array.isArray(decision.target.tests), `${label} target tests must be an array.`)
    assert.ok(Array.isArray(decision.invariants) && decision.invariants.length, `${label} invariants must be a non-empty array.`)
    assert.deepEqual(
      new Set(decision.upstream.files.map(({ file }) => file)),
      expectedUpstreamFiles,
      `${label} upstream file scope drifted.`
    )
    assert.deepEqual(
      new Set(decision.target.files.map(({ file }) => file)),
      expectedTargetFiles,
      `${label} target file scope drifted.`
    )
    assert.equal(
      new Set(decision.target.tests.map(({ caseId }) => caseId)).size,
      decision.target.tests.length,
      `${label} target test case ids must be unique.`
    )
    for (const fileRecord of decision.upstream.files) {
      assertObjectKeys(fileRecord, ['file', 'digest'], `${label} upstream file`)
      assert.match(fileRecord.digest, /^[a-f0-9]{64}$/u, `${label} upstream file digest is invalid.`)
      assert.equal(
        fileRecord.digest,
        sha256(sourceAtCommit(POST_RC87_COMMIT, fileRecord.file)),
        `${label} upstream file ${fileRecord.file} drifted.`
      )
    }
    assert.match(decision.target.implementedAtCommit, /^[a-f0-9]{40}$/u, `${label} implementation commit is invalid.`)
    assert.equal(
      resolveRef(decision.target.implementedAtCommit),
      decision.target.implementedAtCommit,
      `${label} implementation commit cannot be resolved.`
    )
    assert.ok(
      isCommitAncestor(decision.target.implementedAtCommit, targetCommit),
      `${label} implementation commit is not an ancestor of the latest contract target.`
    )
    const implementationFiles = new Set(git([
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      decision.target.implementedAtCommit
    ]).trim().split('\n').filter(Boolean))
    for (const fileRecord of decision.target.files) {
      assertObjectKeys(fileRecord, ['file', 'digest'], `${label} target file`)
      assert.match(fileRecord.digest, /^[a-f0-9]{64}$/u, `${label} target file digest is invalid.`)
      assert.ok(implementationFiles.has(fileRecord.file), `${label} implementation commit does not change ${fileRecord.file}.`)
      assert.equal(
        fileRecord.digest,
        sha256(sourceAtCommit(targetCommit, fileRecord.file)),
        `${label} target file ${fileRecord.file} drifted.`
      )
    }
    for (const testRecord of decision.target.tests) {
      assertObjectKeys(testRecord, ['caseId', 'runner', 'digest'], `${label} target test`)
      assert.match(testRecord.digest, /^[a-f0-9]{64}$/u, `${label} target test digest is invalid.`)
      const targets = targetById.get(testRecord.caseId) ?? []
      assert.equal(targets.length, 1, `${label} target test ${testRecord.caseId} must resolve uniquely.`)
      assert.equal(testRecord.runner, targets[0].runner, `${label} target test ${testRecord.caseId} runner drifted.`)
      assert.equal(testRecord.digest, targets[0].sourceDigest, `${label} target test ${testRecord.caseId} digest drifted.`)
    }
    assert.equal(decision.upstream.digest, postRc87UpstreamDigest(decision.upstream), `${label} upstream digest is stale.`)
    assert.equal(decision.target.digest, postRc87TargetDigest(decision.target), `${label} target digest is stale.`)
    assertObjectKeys(decision.approval, ['approvedBy', 'approvedAt', 'reviewRef', 'scopeDigest'], `${label} approval`)
    validateApprovalMetadata(decision.approval, `${label} approval`)
    assert.equal(decision.approval.scopeDigest, postRc87DecisionScopeDigest(decision), `${label} approval scope digest is stale.`)
  }
  return source
}

export function buildPostRc87Delta(baselineCommit, preferredRef, decisionSource, targetCommit) {
  assert.ok(hasRef(preferredRef), `Post-rc.87 delta ref ${preferredRef} does not exist.`)
  const ref = preferredRef
  const commit = resolveRef(ref)
  assert.equal(commit, POST_RC87_COMMIT, `Post-rc.87 delta ref ${ref} drifted from ${POST_RC87_COMMIT}.`)
  const changes = git(['diff', '--name-status', `${baselineCommit}..${commit}`, '--', 'packages'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [gitStatus, ...paths] = line.split('\t')
      const file = paths.at(-1)
      const manifestLoader = /manifest-(?:facade|loader|virtual-module)|css-manifest-loader/u.test(file)
        || file === 'packages/integration/tests/module.test.ts'
        || file === 'packages/webpack/tests/plugin.test.ts'
      const decision = decisionSource.decisions.find(({ upstream }) => upstream.files.some((entry) => entry.file === file))
      return {
        file,
        gitStatus,
        priority: manifestLoader ? 'P0' : 'P2',
        decision: decision?.status ?? 'outside-semantic-parity',
        ...(decision ? { decisionId: decision.id } : {}),
        behavior: decision?.target.behavior ?? 'Post-rc.87 package metadata or peripheral change.'
      }
    })
  const commits = git(['log', '--format=%H%x09%s', `${baselineCommit}..${commit}`, '--', 'packages'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, ...summary] = line.split('\t')
      return { commit: hash, summary: summary.join('\t') }
    })
  return {
    $schema: '../scripts/post-rc87-delta-ledger.schema.json',
    version: 2,
    policy: {
      baselineIsolation: 'This delta never changes or closes an rc.87 migration case.',
      behaviorAdoption: 'Each behavior delta requires a separate approved decision after rc.87 parity is complete.',
      browserManifest: 'Browser manifest fetch behavior must not be backported into the rc.87 baseline.'
    },
    baseline: {
      ref: DEFAULT_BASELINE_REF,
      commit: baselineCommit
    },
    delta: { ref, commit },
    decisionSource: {
      path: path.relative(process.cwd(), postRc87DecisionPath),
      version: decisionSource.version
    },
    targetAudit: {
      ref: 'latest-target-change',
      commit: targetCommit
    },
    summary: {
      files: changes.length,
      behaviorFiles: changes.filter((change) => change.decision === 'approved-adaptation').length,
      metadataFiles: changes.filter((change) => change.decision === 'outside-semantic-parity').length,
      byDecision: countBy(changes, (change) => change.decision)
    },
    files: changes,
    commits,
    decisions: decisionSource.decisions
  }
}
