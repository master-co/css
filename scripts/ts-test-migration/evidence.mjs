import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_BASELINE_REF, RC87_AUTHORING_TARGET_COMMIT, RC87_FINAL_LANGUAGE_TARGET_COMMIT, RC87_LANGUAGE_TARGET_COMMIT, RC87_P1_TARGET_COMMIT, RC87_P2_TARGET_COMMIT, RC87_RENDERING_TARGET_COMMIT, RC87_SCANNER_TARGET_COMMIT, evidencePath, exceptionsPath, rustRefactorContractEvidencePath } from './config.mjs'
import { normalizeTitle } from './inventory.mjs'
import { git, sha256 } from './utils.mjs'

export function loadTakeoverEvidence() {
  const ledger = JSON.parse(readFileSync(path.resolve('parity/rust-takeover-ledger.json'), 'utf8'))
  const evidence = new Map()
  for (const suite of ledger.suites) {
    for (const test of suite.tests) {
      evidence.set(`${suite.file}\0${normalizeTitle(test.name)}`, test.coverage)
    }
  }
  return {
    evidence,
    expectedLegacyTests: ledger.expectedLegacyTests,
    semanticBaseline: ledger.semanticBaseline,
    suites: ledger.suites.length
  }
}

export function assertObjectKeys(value, allowedKeys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`)
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key))
  assert.deepEqual(unknownKeys, [], `${label} has unsupported keys.`)
}

export function validateApprovalMetadata(approval, label) {
  assert.equal(typeof approval.approvedBy, 'string', `${label} approvedBy must be a string.`)
  assert.ok(approval.approvedBy.length, `${label} approvedBy must not be empty.`)
  assert.equal(typeof approval.approvedAt, 'string', `${label} approvedAt must be a string.`)
  assert.match(
    approval.approvedAt,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u,
    `${label} approvedAt must be an RFC 3339 UTC timestamp.`
  )
  assert.ok(!Number.isNaN(Date.parse(approval.approvedAt)), `${label} approvedAt is invalid.`)
  assert.equal(typeof approval.reviewRef, 'string', `${label} reviewRef must be a string.`)
  assert.ok(approval.reviewRef.length, `${label} reviewRef must not be empty.`)
  assert.match(approval.scopeDigest, /^[a-f0-9]{64}$/u, `${label} scopeDigest is invalid.`)
}

function parityExceptionScopeDigest(exception) {
  return sha256(JSON.stringify({
    id: exception.id,
    reason: exception.reason,
    old: exception.old,
    new: exception.new,
    packages: exception.packages,
    test: exception.test,
    cases: exception.approval.cases
  }))
}

export function rustContractRecordScopeDigest(record) {
  return sha256(JSON.stringify({
    sourceId: record.sourceId,
    sourceDigest: record.sourceDigest,
    targetDigest: record.targetDigest,
    proof: record.proof,
    reason: record.reason
  }))
}

export function rustContractSurfaceScopeDigest(record) {
  return sha256(JSON.stringify({
    surfaceId: record.surfaceId,
    baselineDigest: record.baselineDigest,
    targetDigest: record.targetDigest,
    proof: record.proof,
    reason: record.reason
  }))
}

export function postRc87UpstreamDigest(upstream) {
  return sha256(JSON.stringify({
    behavior: upstream.behavior,
    files: upstream.files
  }))
}

export function postRc87TargetDigest(target) {
  return sha256(JSON.stringify({
    behavior: target.behavior,
    implementedAtCommit: target.implementedAtCommit,
    files: target.files,
    tests: target.tests
  }))
}

export function postRc87DecisionScopeDigest(decision) {
  return sha256(JSON.stringify({
    id: decision.id,
    status: decision.status,
    priority: decision.priority,
    owner: decision.owner,
    upstream: decision.upstream,
    target: decision.target,
    invariants: decision.invariants
  }))
}

export function loadMigrationEvidence() {
  assert.ok(existsSync(evidencePath), `${path.relative(process.cwd(), evidencePath)} does not exist.`)
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  assertObjectKeys(evidence, ['$schema', 'version', 'baseline', 'records'], 'Migration evidence')
  assert.equal(evidence.version, 1, 'Unsupported test migration evidence version.')
  assertObjectKeys(evidence.baseline, ['ref', 'commit'], 'Migration evidence baseline')
  assert.deepEqual(evidence.baseline, {
    ref: DEFAULT_BASELINE_REF,
    commit: RC87_COMMIT
  }, 'Migration evidence must remain rooted at v2.0.0-rc.87.')
  assert.ok(Array.isArray(evidence.records), 'Migration evidence records must be an array.')
  assert.equal(
    new Set(evidence.records.map((record) => record.sourceId)).size,
    evidence.records.length,
    'Migration evidence source ids must be unique.'
  )
  for (const record of evidence.records) {
    assertObjectKeys(record, ['sourceId', 'sourceDigest', 'proof', 'targets', 'exceptionId'], `Migration evidence ${record.sourceId ?? '<unknown>'}`)
    assert.match(record.sourceId, /^rc87-[a-f0-9]{16}$/u, 'Invalid migration evidence source id.')
    assert.match(record.sourceDigest, /^[a-f0-9]{64}$/u, `Invalid source digest for ${record.sourceId}.`)
    assert.ok(Array.isArray(record.targets), `Migration evidence targets must be an array for ${record.sourceId}.`)
    for (const target of record.targets) {
      assertObjectKeys(target, ['caseId', 'runner', 'digest'], `Migration evidence target for ${record.sourceId}`)
      assert.match(target.caseId, /^rc87-[a-f0-9]{16}$/u, `Invalid target case id for ${record.sourceId}.`)
      assert.equal(typeof target.runner, 'string', `Invalid target runner for ${record.sourceId}/${target.caseId}.`)
      assert.match(target.digest, /^[a-f0-9]{64}$/u, `Invalid target digest for ${record.sourceId}/${target.caseId}.`)
    }
  }
  return evidence
}

export function seedSemanticCoreEvidence(legacyInventory, targetInventory) {
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))

  const add = (sourceId, targetId, proof = 'rc87-golden', exceptionId) => {
    const source = legacyById.get(sourceId)
    const target = targetById.get(targetId)
    assert.ok(source, `Cannot seed evidence for unknown rc.87 source ${sourceId}.`)
    assert.ok(target, `Cannot seed evidence from unknown target ${targetId}.`)
    const record = {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof,
      targets: [proofTargetReference(target)],
      ...(exceptionId ? { exceptionId } : {})
    }
    recordsBySourceId.set(sourceId, record)
  }

  const corpus = JSON.parse(git(['show', `${targetInventory.commit}:parity/rust-semantic-corpus.json`]))
  const corpusCases = [
    ...(corpus.parserCases ?? []),
    ...(corpus.engineCases ?? []),
    ...(corpus.compilerCases ?? [])
  ]
  for (const target of targetInventory.cases.filter((testCase) => testCase.sourceKind === 'corpus')) {
    const marker = target.title.match(/^rc87-(?:rule|condition|selector)-([a-f0-9]{16})$/u)
    const corpusCase = corpusCases.find((parityCase) => parityCase.id === target.title)
    const sourceId = corpusCase?.sourceId ?? (marker ? `rc87-${marker[1]}` : undefined)
    assert.ok(sourceId, `Semantic corpus target ${target.id} is missing a source id.`)
    add(sourceId, target.id)
  }

  for (const source of legacyInventory.cases.filter((testCase) => testCase.package === 'preset')) {
    const target = targetById.get(source.id)
    assert.ok(target, `Preset target ${source.id} does not exist.`)
    if (target.sourceDigest !== source.sourceDigest) add(source.id, target.id)
  }

  for (const [sourceId, targetId] of Object.entries({
    'rc87-b11746c9f1518fb7': 'rc87-b11746c9f1518fb7',
    'rc87-4df86b020ce4b8b0': 'rc87-169aa2084c530524',
    'rc87-5addd7a449a39251': 'rc87-1ce84bf138cf2c12',
    'rc87-92453f4235a0cfe7': 'rc87-c8e38b5882938dae',
    'rc87-1314e9fb5567b923': 'rc87-c80932d3a9a18c74'
  })) add(sourceId, targetId)

  add(
    'rc87-e20922b4178a8548',
    'rc87-bee4d1e5c45c7230',
    'approved-divergence',
    'rc87-stylesheet-explicit-preset-input'
  )
  add(
    'rc87-fb2f146924e1ad8d',
    'rc87-1f6ba6afdba0cb65',
    'approved-divergence',
    'rc87-facade-async-rust-engine'
  )

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedRenderingEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_RENDERING_TARGET_COMMIT,
    'Rendering evidence must be audited against the pinned milestone 2 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))

  for (const [sourceId, targetId] of Object.entries({
    'rc87-e5e959ce815f4075': 'rc87-afcc9d12f3e25e40',
    'rc87-3acbadf9896a963e': 'rc87-f850677b1ac88e1f',
    'rc87-7972b1e44a0ef1b0': 'rc87-7972b1e44a0ef1b0',
    'rc87-728a7d9729298578': 'rc87-97ab7b679d64361a',
    'rc87-57602588c78ae709': 'rc87-bb70569b1ed54bb8',
    'rc87-795623b483f38e22': 'rc87-39a77796e0b1f824',
    'rc87-fe7a516491c038f9': 'rc87-b005654530dfa559',
    'rc87-e2132de21c68b007': 'rc87-72e45c26e6cbfd8b',
    'rc87-47fa115a9538f8d2': 'rc87-f92062b7788b8b27',
    'rc87-70c2e3c4a256b439': 'rc87-c7c1de220cf317cb',
    'rc87-0a260cfed5ff47f3': 'rc87-7b9e66b4d7c60243',
    'rc87-8f7a7d12d1d84faa': 'rc87-b0218b93c7b226b7',
    'rc87-4810e1434426c157': 'rc87-3870cf70bffbc204',
    'rc87-b15b04cb5918ded5': 'rc87-4209a04423ae00dc',
    'rc87-a7c3d85a8ea0f2a5': 'rc87-5b9cf5b8ce504959',
    'rc87-2e2293bca9545a5d': 'rc87-083f0c80af0348a1',
    'rc87-444fa61e3043ad5a': 'rc87-a68de8240d5d5ab1',
    'rc87-a56511bb87340647': 'rc87-2374f8fb8b086ebb',
    'rc87-8fdccb91ecc7d385': 'rc87-5ac35fa4acb8eccb',
    'rc87-8896fbca801ba254': 'rc87-2efcdbec736de191',
    'rc87-79f6c5b29444c7c2': 'rc87-40741f3f92fa5de7',
    'rc87-d14914b2ce83eea4': 'rc87-5732d85f2647b215',
    'rc87-adc2c0320de1390a': 'rc87-ea9b5d2ffe198b2f',
    'rc87-445f7d5e699d5a2a': 'rc87-b3e92ac7d4b8a66d',
    'rc87-0c1a66389510440f': 'rc87-609e3c42e72dd6d3'
  })) {
    const source = legacyById.get(sourceId)
    const target = targetById.get(targetId)
    assert.ok(source, `Cannot seed rendering evidence for unknown rc.87 source ${sourceId}.`)
    assert.ok(target, `Cannot seed rendering evidence from unknown target ${targetId}.`)
    recordsBySourceId.set(sourceId, {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  // These candidates were reviewed file-by-file and executed through their owner
  // package suites; runtime additionally passed the complete 231-case browser matrix.
  const auditedPackages = new Set([
    'astro',
    'next',
    'runtime',
    'server',
    'svelte',
    'vite',
    'webpack'
  ])
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_RENDERING_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 2 target.'
  )
  for (const entry of currentLedger.entries) {
    if (
      !auditedPackages.has(entry.source.package)
      || entry.migration.status !== 'mapped-unverified'
    ) continue
    assert.equal(entry.priority, 'P0', `Unexpected non-P0 rendering case ${entry.id}.`)
    assert.equal(entry.migration.targets.length, 1, `Rendering evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited rendering source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited rendering target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedAuthoringEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_AUTHORING_TARGET_COMMIT,
    'Authoring evidence must be audited against the pinned milestone 3 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_AUTHORING_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 3 target.'
  )

  for (const entry of currentLedger.entries) {
    if (entry.priority !== 'P0' || entry.migration.status !== 'mapped-unverified') continue
    assert.equal(entry.migration.targets.length, 1, `P0 evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited P0 source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited P0 target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedLanguageEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_LANGUAGE_TARGET_COMMIT,
    'Language evidence must be audited against the pinned language target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_LANGUAGE_TARGET_COMMIT,
    'The current ledger does not describe the pinned language target.'
  )

  for (const entry of currentLedger.entries) {
    if (entry.source.package !== 'language' || entry.migration.status !== 'mapped-unverified') continue
    const source = legacyById.get(entry.id)
    assert.ok(source, `Cannot seed audited language source ${entry.id}.`)
    let target
    if (entry.source.file === 'packages/language/tests/shiki.test.ts') {
      target = targetInventory.cases.find((candidate) => (
        candidate.file === 'packages/language-service/tests/rc87-shiki.test.ts'
        && candidate.title === entry.source.title
      ))
    } else {
      assert.equal(entry.migration.targets.length, 1, `Language evidence target is ambiguous for ${entry.id}.`)
      target = targetById.get(entry.migration.targets[0].id)
    }
    assert.ok(target, `Cannot seed audited language target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedScannerEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_SCANNER_TARGET_COMMIT,
    'Scanner evidence must be audited against the pinned scanner target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_SCANNER_TARGET_COMMIT,
    'The current ledger does not describe the pinned scanner target.'
  )

  for (const entry of currentLedger.entries) {
    if (entry.source.package !== 'scanner' || entry.migration.status !== 'mapped-unverified') continue
    assert.equal(entry.migration.targets.length, 1, `Scanner evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited scanner source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited scanner target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  const customAdapterSourceId = 'rc87-e15886ff6be17517'
  const source = legacyById.get(customAdapterSourceId)
  const target = targetInventory.cases.find((candidate) => (
    candidate.file === 'packages/tooling/tests/scanner/adapters.test.ts'
    && candidate.title === 'does not restore the removed custom source adapter registry'
  ))
  assert.ok(source, `Cannot seed custom adapter source ${customAdapterSourceId}.`)
  assert.ok(target, `Cannot seed custom adapter divergence target ${customAdapterSourceId}.`)
  recordsBySourceId.set(customAdapterSourceId, {
    sourceId: customAdapterSourceId,
    sourceDigest: source.sourceDigest,
    proof: 'approved-divergence',
    targets: [proofTargetReference(target)],
    exceptionId: 'rc87-scanner-custom-adapter-public-api-removal'
  })

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedP1Evidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_P1_TARGET_COMMIT,
    'P1 evidence must be audited against the pinned milestone 3 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_P1_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 3 target.'
  )
  const auditedPackages = new Set(['diagnostics', 'eslint-plugin', 'language-service', 'schema'])

  for (const entry of currentLedger.entries) {
    if (entry.priority !== 'P1' || entry.migration.status !== 'mapped-unverified') continue
    assert.ok(auditedPackages.has(entry.source.package), `Unaudited P1 package for ${entry.id}.`)
    assert.equal(entry.migration.targets.length, 1, `P1 evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited P1 source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited P1 target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedP2Evidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_P2_TARGET_COMMIT,
    'P2 evidence must be audited against the pinned milestone 4 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_P2_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 4 target.'
  )
  const auditedPackages = new Set(['cli', 'create', 'css-sv', 'language-server', 'mcp', 'vscode'])

  for (const entry of currentLedger.entries) {
    if (entry.priority !== 'P2' || entry.migration.status !== 'mapped-unverified') continue
    assert.ok(auditedPackages.has(entry.source.package), `Unaudited P2 package for ${entry.id}.`)
    assert.equal(entry.migration.targets.length, 1, `P2 evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited P2 source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited P2 target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  for (const [sourceId, targetId, exceptionId] of [
    ['rc87-020cb2849514556c', 'rc87-5afff731b12da503', 'rc87-cli-explicit-generate-command'],
    ['rc87-1fc20aa6a8bdba65', 'rc87-4b144ace73024a4e', 'rc87-cli-removed-command-shims'],
    ['rc87-d770516f41616299', 'rc87-6dbaed8ad2db027d', 'rc87-cli-removed-command-shims'],
    ['rc87-79afa858624c3b81', 'rc87-4df6ca0358c81014', 'rc87-cli-removed-command-shims'],
    ['rc87-1fd50671fc535704', 'rc87-25b0e10bf66ab41a', 'rc87-cli-master-css-binary-name'],
    ['rc87-3115beeb6e85ca7f', 'rc87-6db9abcf55ac44c6', 'rc87-create-svelte-addon-package-rename'],
    ['rc87-619282be04e91f81', 'rc87-69e7b6412f26781a', 'rc87-vscode-rust-native-runtime-externalization'],
    ['rc87-97511bf86497a765', 'rc87-d534af146eb72292', undefined]
  ]) {
    const source = legacyById.get(sourceId)
    const target = targetById.get(targetId)
    assert.ok(source, `Cannot seed P2 gap source ${sourceId}.`)
    assert.ok(target, `Cannot seed P2 gap target ${sourceId}/${targetId}.`)
    recordsBySourceId.set(sourceId, {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof: exceptionId ? 'approved-divergence' : 'rc87-golden',
      targets: [proofTargetReference(target)],
      ...(exceptionId ? { exceptionId } : {})
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function seedFinalLanguageEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_FINAL_LANGUAGE_TARGET_COMMIT,
    'Final language evidence must be audited against the named-export target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const add = (sourceId, title, proof, exceptionId) => {
    const source = legacyById.get(sourceId)
    const target = targetInventory.cases.find((candidate) => (
      candidate.file === 'packages/language-service/tests/rc87-shiki.test.ts'
      && candidate.title === title
    ))
    assert.ok(source, `Cannot seed final language source ${sourceId}.`)
    assert.ok(target, `Cannot seed final language target ${sourceId}/${title}.`)
    recordsBySourceId.set(sourceId, {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof,
      targets: [proofTargetReference(target)],
      ...(exceptionId ? { exceptionId } : {})
    })
  }

  add(
    'rc87-dbd7e09c6df8d73c',
    'does not restore the rc.87 Shiki default array export',
    'approved-divergence',
    'rc87-language-service-shiki-named-export'
  )
  add(
    'rc87-f7ae069d57b1d29c',
    'supports Shiki dynamic language imports',
    'rc87-golden'
  )

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

export function loadParityExceptions(migrationEvidence) {
  const registry = JSON.parse(readFileSync(exceptionsPath, 'utf8'))
  assertObjectKeys(registry, ['$schema', 'exceptions'], 'Parity exception registry')
  assert.ok(Array.isArray(registry.exceptions), 'Parity exceptions must be an array.')
  assert.equal(
    new Set(registry.exceptions.map((exception) => exception.id)).size,
    registry.exceptions.length,
    'Parity exception ids must be unique.'
  )
  const recordsByException = new Map()
  for (const record of migrationEvidence.records.filter(({ proof }) => proof === 'approved-divergence')) {
    if (!recordsByException.has(record.exceptionId)) recordsByException.set(record.exceptionId, [])
    recordsByException.get(record.exceptionId).push({
      sourceId: record.sourceId,
      sourceDigest: record.sourceDigest,
      targets: record.targets
    })
  }
  for (const exception of registry.exceptions) {
    const label = `Parity exception ${exception.id ?? '<unknown>'}`
    assertObjectKeys(exception, ['id', 'reason', 'old', 'new', 'packages', 'test', 'approval'], label)
    assert.equal(typeof exception.id, 'string', `${label} id must be a string.`)
    assert.ok(exception.id.length, `${label} id must not be empty.`)
    assert.equal(typeof exception.reason, 'string', `${label} reason must be a string.`)
    assert.ok(exception.reason.length, `${label} reason must not be empty.`)
    assert.equal(typeof exception.old, 'string', `${label} old behavior must be a string.`)
    assert.equal(typeof exception.new, 'string', `${label} new behavior must be a string.`)
    assert.ok(Array.isArray(exception.packages) && exception.packages.length, `${label} packages are required.`)
    assert.equal(typeof exception.test, 'string', `${label} test must be a string.`)
    assertObjectKeys(
      exception.approval,
      ['approvedBy', 'approvedAt', 'reviewRef', 'scopeDigest', 'cases'],
      `${label} approval`
    )
    validateApprovalMetadata(exception.approval, `${label} approval`)
    assert.ok(Array.isArray(exception.approval.cases) && exception.approval.cases.length, `${label} approval cases are required.`)
    assert.equal(
      new Set(exception.approval.cases.map(({ sourceId }) => sourceId)).size,
      exception.approval.cases.length,
      `${label} approval source ids must be unique.`
    )
    for (const approvedCase of exception.approval.cases) {
      assertObjectKeys(approvedCase, ['sourceId', 'sourceDigest', 'targets'], `${label} approval case`)
      assert.match(approvedCase.sourceId, /^rc87-[a-f0-9]{16}$/u, `${label} approval source id is invalid.`)
      assert.match(approvedCase.sourceDigest, /^[a-f0-9]{64}$/u, `${label} approval source digest is invalid.`)
      assert.ok(Array.isArray(approvedCase.targets) && approvedCase.targets.length, `${label} approval targets are required.`)
      for (const target of approvedCase.targets) {
        assertObjectKeys(target, ['caseId', 'runner', 'digest'], `${label} approval target`)
        assert.match(target.caseId, /^rc87-[a-f0-9]{16}$/u, `${label} approval target id is invalid.`)
        assert.equal(typeof target.runner, 'string', `${label} approval target runner is invalid.`)
        assert.match(target.digest, /^[a-f0-9]{64}$/u, `${label} approval target digest is invalid.`)
      }
    }
    const expectedCases = recordsByException.get(exception.id) ?? []
    assert.ok(expectedCases.length, `${label} does not close any migration evidence.`)
    assert.deepEqual(
      exception.approval.cases,
      expectedCases,
      `${label} approval cases drifted from migration evidence.`
    )
    assert.equal(
      exception.approval.scopeDigest,
      parityExceptionScopeDigest(exception),
      `${label} approval scope digest is stale.`
    )
  }
  const exceptions = new Map(registry.exceptions.map((exception) => [exception.id, exception]))
  assert.deepEqual(
    [...recordsByException.keys()].sort(),
    [...exceptions.keys()].sort(),
    'Approved-divergence evidence and parity exception approvals must have identical ids.'
  )
  return exceptions
}

function targetOwner(packageName, sourceId, sourceFile) {
  if (
    packageName === 'language'
    && /\/tests\/(?:browser|shiki|get-class-position\/)/u.test(sourceFile)
  ) return 'language-service'
  return legacyCaseOwnerMap.get(sourceId) ?? legacyOwnerMap.get(packageName) ?? packageName
}

export function targetReference(testCase) {
  return {
    id: testCase.id,
    package: testCase.package,
    file: testCase.file,
    line: testCase.line,
    title: testCase.title,
    runner: testCase.runner,
    kind: testCase.kind,
    sourceDigest: testCase.sourceDigest,
    matrix: testCase.matrix
  }
}

function proofTargetReference(testCase) {
  return {
    caseId: testCase.id,
    runner: testCase.runner,
    digest: testCase.sourceDigest
  }
}

function validateEvidenceRecord(record, legacyCase, targetById, exceptions) {
  assert.equal(record.sourceDigest, legacyCase.sourceDigest, `Stale rc.87 source digest for ${record.sourceId}.`)
  assert.ok(
    ['exact-source', 'rc87-golden', 'approved-divergence'].includes(record.proof),
    `Unsupported proof kind for ${record.sourceId}.`
  )
  assert.ok(Array.isArray(record.targets) && record.targets.length, `Evidence targets are required for ${record.sourceId}.`)
  assert.equal(
    new Set(record.targets.map((target) => target.caseId)).size,
    record.targets.length,
    `Evidence targets must be unique for ${record.sourceId}.`
  )

  const targets = record.targets.map((reference) => {
    const target = targetById.get(reference.caseId)
    assert.ok(target, `Evidence target ${reference.caseId} for ${record.sourceId} does not exist.`)
    assert.equal(reference.runner, target.runner, `Stale target runner for ${record.sourceId}/${reference.caseId}.`)
    assert.equal(reference.digest, target.sourceDigest, `Stale target digest for ${record.sourceId}/${reference.caseId}.`)
    assert.equal(target.package, targetOwner(legacyCase.package, legacyCase.id, legacyCase.file), `Evidence target owner mismatch for ${record.sourceId}/${reference.caseId}.`)
    return target
  })

  if (record.proof === 'exact-source') {
    assert.equal(targets.length, 1, `Exact-source evidence requires one target for ${record.sourceId}.`)
    assert.equal(targets[0].sourceDigest, legacyCase.sourceDigest, `Exact-source digest mismatch for ${record.sourceId}.`)
    assert.equal(record.exceptionId, undefined, `Exact-source evidence cannot reference an exception for ${record.sourceId}.`)
  } else if (record.proof === 'rc87-golden') {
    assert.equal(record.exceptionId, undefined, `rc87-golden evidence cannot reference an exception for ${record.sourceId}.`)
  } else {
    assert.equal(typeof record.exceptionId, 'string', `Approved divergence requires an exception id for ${record.sourceId}.`)
    assert.ok(exceptions.has(record.exceptionId), `Unknown parity exception ${record.exceptionId} for ${record.sourceId}.`)
  }

  return targets
}

export function mapCases(legacyInventory, targetInventory, takeover, migrationEvidence, exceptions) {
  const targetByPackageAndExactTitle = new Map()
  const targetByPackageAndExactFullTitle = new Map()
  const targetByPackageAndTitle = new Map()
  const targetByPackageAndFullTitle = new Map()
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const evidenceBySourceId = new Map(migrationEvidence.records.map((record) => [record.sourceId, record]))

  for (const record of migrationEvidence.records) {
    assert.ok(legacyById.has(record.sourceId), `Migration evidence references unknown source ${record.sourceId}.`)
  }

  for (const targetCase of targetInventory.cases) {
    const exactTitleKey = `${targetCase.package}\0${exactTitle(targetCase.title)}`
    const exactFullKey = `${targetCase.package}\0${exactTitle([...targetCase.suites, targetCase.title].join(' > '))}`
    const titleKey = `${targetCase.package}\0${normalizeTitle(targetCase.title)}`
    const fullKey = `${targetCase.package}\0${normalizeTitle([...targetCase.suites, targetCase.title].join(' > '))}`
    if (!targetByPackageAndExactTitle.has(exactTitleKey)) targetByPackageAndExactTitle.set(exactTitleKey, [])
    if (!targetByPackageAndExactFullTitle.has(exactFullKey)) targetByPackageAndExactFullTitle.set(exactFullKey, [])
    if (!targetByPackageAndTitle.has(titleKey)) targetByPackageAndTitle.set(titleKey, [])
    if (!targetByPackageAndFullTitle.has(fullKey)) targetByPackageAndFullTitle.set(fullKey, [])
    targetByPackageAndExactTitle.get(exactTitleKey).push(targetCase)
    targetByPackageAndExactFullTitle.get(exactFullKey).push(targetCase)
    targetByPackageAndTitle.get(titleKey).push(targetCase)
    targetByPackageAndFullTitle.get(fullKey).push(targetCase)
  }

  const mappedTargetIds = new Set()
  const entries = legacyInventory.cases.map((legacyCase) => {
    const owner = targetOwner(legacyCase.package, legacyCase.id, legacyCase.file)
    const exactFullTitle = exactTitle([...legacyCase.suites, legacyCase.title].join(' > '))
    const exactCaseTitle = exactTitle(legacyCase.title)
    const fullTitle = normalizeTitle([...legacyCase.suites, legacyCase.title].join(' > '))
    const title = normalizeTitle(legacyCase.title)
    let candidates = targetByPackageAndExactFullTitle.get(`${owner}\0${exactFullTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndExactTitle.get(`${owner}\0${exactCaseTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndFullTitle.get(`${owner}\0${fullTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndTitle.get(`${owner}\0${title}`) ?? []

    if (candidates.length > 1) {
      const sameFile = candidates.filter((candidate) => candidate.file === legacyCase.file)
      if (sameFile.length) candidates = sameFile
    }
    if (candidates.length > 1) {
      const basename = path.posix.basename(legacyCase.file)
      const sameBasename = candidates.filter((candidate) => path.posix.basename(candidate.file) === basename)
      if (sameBasename.length) candidates = sameBasename
    }

    const takeoverCoverage = takeover.evidence.get(`${legacyCase.file}\0${title}`) ?? []
    const identicalTargets = candidates
      .filter((target) => target.sourceDigest === legacyCase.sourceDigest)
      .map((target) => target.id)
    const evidenceRecord = evidenceBySourceId.get(legacyCase.id)
    const evidenceTargets = evidenceRecord
      ? validateEvidenceRecord(evidenceRecord, legacyCase, targetById, exceptions)
      : []
    const exactSourceTarget = !evidenceRecord && identicalTargets.length === 1
      ? targetById.get(identicalTargets[0])
      : undefined
    const selectedTargets = evidenceTargets.length
      ? evidenceTargets
      : exactSourceTarget
        ? [exactSourceTarget]
        : candidates
    const targets = selectedTargets.map(targetReference)
    for (const target of selectedTargets) mappedTargetIds.add(target.id)

    let status = 'gap'
    let coverage = targets.length === 1 || takeoverCoverage.length ? 'candidate-all' : targets.length > 1 ? 'ambiguous' : 'none'
    let proof = null
    let divergence = null
    if (legacyCase.state === 'todo' || legacyCase.state === 'skip') {
      assert.equal(evidenceRecord, undefined, `Source-inactive case ${legacyCase.id} cannot carry migration evidence.`)
      status = 'source-inactive'
    } else if (evidenceRecord) {
      status = evidenceRecord.proof === 'approved-divergence' ? 'approved-divergence' : 'verified-exact'
      coverage = 'evidence'
      proof = {
        kind: evidenceRecord.proof,
        sourceDigest: evidenceRecord.sourceDigest,
        targets: evidenceRecord.targets,
        exceptionId: evidenceRecord.exceptionId
      }
      if (evidenceRecord.proof === 'approved-divergence') divergence = exceptions.get(evidenceRecord.exceptionId)
    } else if (exactSourceTarget) {
      status = 'verified-exact'
      coverage = 'exact-source'
      proof = {
        kind: 'exact-source',
        sourceDigest: legacyCase.sourceDigest,
        targets: [proofTargetReference(exactSourceTarget)]
      }
    } else if (targets.length || takeoverCoverage.length) {
      status = 'mapped-unverified'
    }

    return {
      id: legacyCase.id,
      priority: legacyCase.priority,
      domains: legacyCase.domains,
      source: {
        package: legacyCase.package,
        file: legacyCase.file,
        line: legacyCase.line,
        suites: legacyCase.suites,
        title: legacyCase.title,
        runner: legacyCase.runner,
        kind: legacyCase.kind,
        state: legacyCase.state,
        sourceKind: legacyCase.sourceKind,
        sourceDigest: legacyCase.sourceDigest,
        matrix: legacyCase.matrix
      },
      ownership: {
        targetPackage: owner
      },
      migration: {
        status,
        coverage,
        targets,
        sourceIdenticalTargetIds: identicalTargets,
        takeoverCoverage,
        proof
      },
      divergence
    }
  })

  const targetOnly = targetInventory.cases
    .filter((testCase) => testCase.sourceKind !== 'takeover-audit' && !mappedTargetIds.has(testCase.id))
    .map(targetReference)

  return { entries, targetOnly }
}
