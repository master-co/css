import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { RUST_REFACTOR_CONTRACT_COMMIT, rustRefactorContractEvidencePath } from './config.mjs'
import { assertObjectKeys, rustContractRecordScopeDigest, rustContractSurfaceScopeDigest, targetReference, validateApprovalMetadata } from './evidence.mjs'
import { collectCasesFromRef, normalizeWhitespace } from './inventory.mjs'
import { git, sha256 } from './utils.mjs'

function loadRustRefactorContractEvidence() {
  assert.ok(
    existsSync(rustRefactorContractEvidencePath),
    `${path.relative(process.cwd(), rustRefactorContractEvidencePath)} does not exist.`
  )
  const evidence = JSON.parse(readFileSync(rustRefactorContractEvidencePath, 'utf8'))
  assertObjectKeys(evidence, ['$schema', 'version', 'baseline', 'records', 'surfaces'], 'Rust refactor contract evidence')
  assert.equal(evidence.version, 1, 'Unsupported Rust refactor contract evidence version.')
  assertObjectKeys(evidence.baseline, ['ref', 'commit'], 'Rust refactor contract evidence baseline')
  assert.equal(
    evidence.baseline.commit,
    RUST_REFACTOR_CONTRACT_COMMIT,
    'Rust refactor contract evidence baseline drifted.'
  )
  assert.ok(Array.isArray(evidence.records), 'Rust refactor contract evidence records must be an array.')
  assert.ok(Array.isArray(evidence.surfaces), 'Rust refactor contract surface evidence must be an array.')
  for (const record of evidence.records) {
    const label = `Rust contract evidence ${record.sourceId ?? '<unknown>'}`
    assertObjectKeys(record, ['sourceId', 'sourceDigest', 'targetDigest', 'proof', 'reason', 'approval'], label)
    if (record.proof === 'approved-contract-change') {
      assertObjectKeys(record.approval, ['approvedBy', 'approvedAt', 'reviewRef', 'scopeDigest'], `${label} approval`)
      validateApprovalMetadata(record.approval, `${label} approval`)
      assert.equal(record.approval.scopeDigest, rustContractRecordScopeDigest(record), `${label} approval scope digest is stale.`)
    } else {
      assert.equal(record.approval, undefined, `${label} cannot carry approval metadata for ${record.proof}.`)
    }
  }
  for (const record of evidence.surfaces) {
    const label = `Rust contract surface ${record.surfaceId ?? '<unknown>'}`
    assertObjectKeys(record, ['surfaceId', 'baselineDigest', 'targetDigest', 'proof', 'reason', 'approval'], label)
    assertObjectKeys(record.approval, ['approvedBy', 'approvedAt', 'reviewRef', 'scopeDigest'], `${label} approval`)
    validateApprovalMetadata(record.approval, `${label} approval`)
    assert.equal(record.approval.scopeDigest, rustContractSurfaceScopeDigest(record), `${label} approval scope digest is stale.`)
  }
  return evidence
}

function extractContractBlock(source, signature) {
  const start = source.indexOf(signature)
  assert.notEqual(start, -1, `Cannot locate contract block: ${signature}`)
  const open = source.indexOf('{', start)
  assert.notEqual(open, -1, `Cannot locate contract block opening brace: ${signature}`)
  let depth = 0
  let quote
  let escaped = false
  for (let index = open; index < source.length; index++) {
    const character = source[index]
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === '\'' || character === '`') {
      quote = character
      continue
    }
    if (character === '{') depth++
    else if (character === '}' && --depth === 0) return source.slice(start, index + 1)
  }
  throw new Error(`Cannot locate contract block closing brace: ${signature}`)
}

export function sourceAtCommit(commit, file) {
  return git(['show', `${commit}:${file}`])
}

function packageExportContract(commit) {
  const files = git(['ls-tree', '-r', '--name-only', commit])
    .trim()
    .split('\n')
    .filter((file) => /^packages\/[^/]+\/package\.json$/u.test(file))
    .sort()
  return files.map((file) => {
    const manifest = JSON.parse(sourceAtCommit(commit, file))
    return {
      file,
      name: manifest.name,
      version: manifest.version,
      type: manifest.type,
      main: manifest.main,
      module: manifest.module,
      types: manifest.types,
      browser: manifest.browser,
      bin: manifest.bin,
      exports: manifest.exports
    }
  })
}

function nativeTargetPackageContract(commit) {
  const files = git(['ls-tree', '-r', '--name-only', commit])
    .trim()
    .split('\n')
    .filter((file) => /^packages\/binding-(?:darwin|linux|win32)-[^/]+\/package\.json$/u.test(file))
    .sort()
  const targets = files.map((file) => {
    const manifest = JSON.parse(sourceAtCommit(commit, file))
    return {
      file,
      name: manifest.name,
      exports: manifest.exports,
      bin: manifest.bin,
      files: manifest.files,
      os: manifest.os,
      cpu: manifest.cpu,
      libc: manifest.libc
    }
  })
  const cliFile = 'packages/cli/package.json'
  const cli = JSON.parse(sourceAtCommit(commit, cliFile))
  return {
    targets,
    cli: {
      file: cliFile,
      name: cli.name,
      bin: cli.bin
    }
  }
}

function contractSurfaceSources(commit) {
  const protocol = sourceAtCommit(commit, 'packages/binding/src/protocol.ts')
  const nativeLoader = sourceAtCommit(commit, 'packages/binding/src/native-loader.ts')
  const wasmEngine = sourceAtCommit(commit, 'packages/binding-wasm-engine/src/index.ts')
  const language = sourceAtCommit(commit, 'crates/mastercss-language/src/lib.rs')
  const renderingOptionFiles = [
    'packages/schema/src/integration.ts',
    'packages/vite/src/options.ts',
    'packages/webpack/src/options.ts',
    'packages/next/src/options.ts',
    'packages/astro/src/options.ts',
    'packages/nuxt/src/options.ts'
  ]
  const versions = protocol
    .split('\n')
    .filter((line) => /^export const MASTER_CSS_.+_VERSION =/u.test(line))
    .join('\n')
  const surfaces = [
    {
      id: 'published-package-exports',
      files: ['packages/*/package.json'],
      source: JSON.stringify(packageExportContract(commit))
    },
    {
      id: 'public-api-contract',
      files: ['.ai/contracts/public-api.json', '.ai/contracts/api-census.json'],
      source: sourceAtCommit(commit, '.ai/contracts/public-api.json')
        + sourceAtCommit(commit, '.ai/contracts/api-census.json')
    },
    {
      id: 'native-target-package-contract',
      files: ['packages/binding-{darwin,linux,win32}-*/package.json', 'packages/cli/package.json'],
      source: JSON.stringify(nativeTargetPackageContract(commit))
    },
    {
      id: 'binding-version-contract',
      files: ['packages/binding/src/protocol.ts'],
      source: versions
    },
    {
      id: 'native-engine-raw-surface',
      files: ['packages/binding/src/native-loader.ts'],
      source: extractContractBlock(nativeLoader, 'export interface NativeEngineSession')
    },
    {
      id: 'wasm-engine-raw-surface',
      files: ['packages/binding-wasm-engine/src/index.ts'],
      source: extractContractBlock(wasmEngine, 'interface GeneratedEngineSession')
        + extractContractBlock(wasmEngine, 'interface GeneratedRenderSession')
    },
    {
      id: 'language-wire-contract',
      files: [
        'packages/binding/src/protocol.ts',
        'crates/mastercss-language/src/lib.rs'
      ],
      source: extractContractBlock(protocol, 'export interface MasterCSSLanguageSemanticToken')
        + extractContractBlock(protocol, 'export interface MasterCSSLanguageDocument')
        + extractContractBlock(language, 'pub struct SemanticTokenInputIr')
    },
    {
      id: 'integration-rendering-options-contract',
      files: renderingOptionFiles,
      source: renderingOptionFiles.map((file) => sourceAtCommit(commit, file)).join('\n')
    }
  ]
  return surfaces.map(({ source, ...surface }) => ({
    ...surface,
    digest: sha256(normalizeWhitespace(source))
  }))
}

export function buildRustRefactorContractLedger(targetInventory, targetCommit) {
  const baselineInventory = collectCasesFromRef(
    'rust-refactor-contract',
    RUST_REFACTOR_CONTRACT_COMMIT
  )
  const evidence = loadRustRefactorContractEvidence()
  const evidenceBySourceId = new Map()
  for (const record of evidence.records) {
    assert.ok(!evidenceBySourceId.has(record.sourceId), `Duplicate Rust contract evidence for ${record.sourceId}.`)
    assert.ok(
      ['verified-superset', 'approved-contract-change'].includes(record.proof),
      `Invalid Rust contract proof for ${record.sourceId}.`
    )
    evidenceBySourceId.set(record.sourceId, record)
  }
  const targetById = new Map()
  for (const testCase of targetInventory.cases) {
    if (!targetById.has(testCase.id)) targetById.set(testCase.id, [])
    targetById.get(testCase.id).push(testCase)
  }
  const usedEvidence = new Set()
  const entries = baselineInventory.cases.map((source) => {
    const targets = targetById.get(source.id) ?? []
    if (!targets.length) {
      return { source, status: 'removed-unapproved', target: null, proof: null }
    }
    if (targets.length > 1) {
      return {
        source,
        status: 'regressed',
        target: null,
        proof: null,
        error: `Ambiguous target IDs: ${targets.map(({ id }) => id).join(', ')}`
      }
    }
    const target = targets[0]
    if (target.sourceDigest === source.sourceDigest) {
      return { source, status: 'preserved-exact', target: targetReference(target), proof: 'exact-source' }
    }
    const record = evidenceBySourceId.get(source.id)
    if (!record) {
      return { source, status: 'regressed', target: targetReference(target), proof: null }
    }
    assert.equal(record.sourceDigest, source.sourceDigest, `Stale Rust contract source digest for ${source.id}.`)
    assert.equal(record.targetDigest, target.sourceDigest, `Stale Rust contract target digest for ${source.id}.`)
    usedEvidence.add(source.id)
    return {
      source,
      status: record.proof,
      target: targetReference(target),
      proof: record.proof,
      reason: record.reason,
      ...(record.approval ? { approval: record.approval } : {})
    }
  })
  assert.deepEqual(
    [...evidenceBySourceId.keys()].sort(),
    [...usedEvidence].sort(),
    'Rust refactor contract test evidence contains unused records.'
  )

  const baselineIds = new Set(baselineInventory.cases.map(({ id }) => id))
  const added = targetInventory.cases
    .filter(({ id }) => !baselineIds.has(id))
    .map(targetReference)

  const surfaceEvidenceById = new Map()
  for (const record of evidence.surfaces) {
    assert.ok(!surfaceEvidenceById.has(record.surfaceId), `Duplicate Rust contract surface evidence for ${record.surfaceId}.`)
    assert.equal(record.proof, 'approved-contract-change', `Invalid surface proof for ${record.surfaceId}.`)
    surfaceEvidenceById.set(record.surfaceId, record)
  }
  const baselineSurfaces = contractSurfaceSources(RUST_REFACTOR_CONTRACT_COMMIT)
  const targetSurfaces = new Map(contractSurfaceSources(targetCommit).map((surface) => [surface.id, surface]))
  const usedSurfaceEvidence = new Set()
  const surfaces = baselineSurfaces.map((baseline) => {
    const target = targetSurfaces.get(baseline.id)
    assert.ok(target, `Missing Rust contract target surface ${baseline.id}.`)
    if (target.digest === baseline.digest) {
      return { ...baseline, targetDigest: target.digest, status: 'preserved-exact', proof: 'exact-source' }
    }
    const record = surfaceEvidenceById.get(baseline.id)
    if (!record) {
      return { ...baseline, targetDigest: target.digest, status: 'regressed', proof: null }
    }
    assert.equal(record.baselineDigest, baseline.digest, `Stale baseline surface digest for ${baseline.id}.`)
    assert.equal(record.targetDigest, target.digest, `Stale target surface digest for ${baseline.id}.`)
    usedSurfaceEvidence.add(baseline.id)
    return {
      ...baseline,
      targetDigest: target.digest,
      status: 'approved-contract-change',
      proof: record.proof,
      reason: record.reason,
      approval: record.approval
    }
  })
  assert.deepEqual(
    [...surfaceEvidenceById.keys()].sort(),
    [...usedSurfaceEvidence].sort(),
    'Rust refactor contract surface evidence contains unused records.'
  )

  return {
    $schema: '../scripts/rust-refactor-contract-ledger.schema.json',
    version: 1,
    policy: {
      role: 'This is a non-regression guard for the completed Rust refactor, not a second rc.87 parity denominator.',
      conflictAuthority: 'The explicit Rust refactor contract wins; conflicting rc.87 behavior requires a parity exception.',
      targetOnly: 'Cases added after the Rust refactor baseline are supplemental and cannot replace baseline cases.'
    },
    baseline: {
      ref: 'bd164e4b5',
      commit: RUST_REFACTOR_CONTRACT_COMMIT,
      cases: baselineInventory.cases.length
    },
    target: {
      ref: targetInventory.ref,
      commit: targetCommit,
      cases: targetInventory.cases.length
    },
    evidence: {
      path: path.relative(process.cwd(), rustRefactorContractEvidencePath),
      version: evidence.version,
      records: evidence.records.length,
      surfaces: evidence.surfaces.length
    },
    summary: {
      byStatus: countBy(entries, ({ status }) => status),
      surfaceByStatus: countBy(surfaces, ({ status }) => status),
      addedCases: added.length
    },
    surfaces,
    entries,
    added
  }
}

export function validateRustRefactorContractLedger(ledger) {
  assert.equal(ledger.baseline.commit, RUST_REFACTOR_CONTRACT_COMMIT, 'Rust contract baseline moved unexpectedly.')
  assert.equal(ledger.entries.length, 1033, 'Rust contract baseline case count drifted.')
  assert.equal(new Set(ledger.entries.map(({ source }) => source.id)).size, ledger.entries.length, 'Duplicate Rust contract source IDs.')
  assert.deepEqual(
    ledger.surfaces.map(({ id }) => id).sort(),
    [
      'binding-version-contract',
      'integration-rendering-options-contract',
      'language-wire-contract',
      'native-engine-raw-surface',
      'native-target-package-contract',
      'public-api-contract',
      'published-package-exports',
      'wasm-engine-raw-surface'
    ],
    'Rust refactor contract surface inventory drifted.'
  )
  for (const entry of ledger.entries) {
    assert.ok(
      ['preserved-exact', 'verified-superset', 'approved-contract-change', 'regressed', 'removed-unapproved'].includes(entry.status),
      `Invalid Rust contract status for ${entry.source.id}.`
    )
    if (entry.status === 'approved-contract-change') {
      assert.ok(entry.approval, `Approved Rust contract change ${entry.source.id} is missing human approval.`)
    }
  }
  const regressedEntries = ledger.entries
    .filter(({ status }) => ['regressed', 'removed-unapproved'].includes(status))
  assert.equal(
    regressedEntries.length,
    0,
    `Rust refactor contract cases contain an unapproved regression or removal: ${regressedEntries.map(({ source, target }) => `${source.id}->${target?.sourceDigest ?? 'removed'}`).join(', ')}`
  )
  assert.ok(
    ledger.surfaces.every(({ status }) => status !== 'regressed'),
    'Rust refactor contract surfaces contain an unapproved regression.'
  )
  for (const surface of ledger.surfaces.filter(({ status }) => status === 'approved-contract-change')) {
    assert.ok(surface.approval, `Approved Rust contract surface ${surface.id} is missing human approval.`)
  }
}

export function validatePostRc87Delta(delta) {
  const expectedBehaviorFiles = new Set([
    'packages/integration/src/manifest-facade.ts',
    'packages/integration/tests/module.test.ts',
    'packages/next/tests/css-manifest-loader.test.ts',
    'packages/vite/tests/plugins/manifest-loader.test.ts',
    'packages/vite/tests/plugins/manifest-virtual-module.test.ts',
    'packages/webpack/tests/plugin.test.ts'
  ])
  const expectedMetadataFiles = new Set(['packages/vscode/package.json'])
  assert.equal(delta.baseline.ref, DEFAULT_BASELINE_REF, 'Post-rc.87 delta must remain rooted at rc.87.')
  assert.equal(delta.baseline.commit, RC87_COMMIT, 'Post-rc.87 delta baseline moved unexpectedly.')
  assert.equal(delta.delta.commit, POST_RC87_COMMIT, 'Post-rc.87 delta commit moved unexpectedly.')
  assert.equal(delta.decisionSource.path, 'parity/post-rc87-delta-decisions.json', 'Post-rc.87 decision source path drifted.')
  assert.equal(delta.decisionSource.version, 1, 'Post-rc.87 decision source version drifted.')
  assert.equal(delta.decisions.length, 1, 'Post-rc.87 delta must contain one approved adaptation decision.')
  assert.equal(delta.files.length, 7, 'Post-rc.87 delta must contain six behavior files and one metadata file.')
  assert.equal(new Set(delta.files.map((entry) => entry.file)).size, delta.files.length, 'Post-rc.87 delta files must be unique.')
  const behaviorFiles = new Set(delta.files.filter((entry) => entry.decision === 'approved-adaptation').map((entry) => entry.file))
  const metadataFiles = new Set(delta.files.filter((entry) => entry.decision === 'outside-semantic-parity').map((entry) => entry.file))
  assert.deepEqual(behaviorFiles, expectedBehaviorFiles, 'Post-rc.87 behavior file set drifted.')
  assert.deepEqual(metadataFiles, expectedMetadataFiles, 'Post-rc.87 metadata file set drifted.')
  assert.ok(
    delta.files.filter(({ decision }) => decision === 'approved-adaptation').every(({ decisionId }) => decisionId === delta.decisions[0].id),
    'Post-rc.87 behavior files must bind to the approved adaptation decision.'
  )
  assert.equal(delta.summary.byDecision['pending-decision'] ?? 0, 0, 'Post-rc.87 delta contains a pending decision.')
  assert.equal(delta.summary.behaviorFiles, 6, 'Post-rc.87 delta must retain six behavior files.')
  assert.equal(delta.summary.metadataFiles, 1, 'Post-rc.87 delta must retain one metadata file.')
}

function countBy(values, getKey) {
  const counts = {}
  for (const value of values) {
    const key = getKey(value)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}
