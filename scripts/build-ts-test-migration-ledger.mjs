import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_BASELINE_REF,
  DEFAULT_POST_BASELINE_REF,
  RC87_MIGRATION_TARGET_COMMIT,
  evidencePath,
  ledgerPath,
  postRc87DeltaPath,
  reportPath,
  rustRefactorContractLedgerPath
} from './ts-test-migration/config.mjs'
import { loadMigrationEvidence, loadParityExceptions, loadTakeoverEvidence, mapCases, seedAuthoringEvidence, seedFinalLanguageEvidence, seedLanguageEvidence, seedP1Evidence, seedP2Evidence, seedRenderingEvidence, seedScannerEvidence, seedSemanticCoreEvidence } from './ts-test-migration/evidence.mjs'
import { collectCasesFromRef, collectRustTakeoverCases, collectSemanticCorpusCases } from './ts-test-migration/inventory.mjs'
import { buildPostRc87Delta, countBy, loadPostRc87Decisions } from './ts-test-migration/post-rc87.mjs'
import { buildPackageSummary, buildReport, validateLedger } from './ts-test-migration/report.mjs'
import { buildRustRefactorContractLedger, validatePostRc87Delta, validateRustRefactorContractLedger } from './ts-test-migration/rust-contracts.mjs'
import { argument, resolveLatestTargetCommit, resolveRef } from './ts-test-migration/utils.mjs'

function writeOrCheck(file, content, check) {
  if (check) {
    assert.ok(existsSync(file), `${path.relative(process.cwd(), file)} does not exist.`)
    assert.equal(readFileSync(file, 'utf8'), content, `${path.relative(process.cwd(), file)} is stale.`)
  } else {
    writeFileSync(file, content)
  }
}

const baselineRef = DEFAULT_BASELINE_REF
const targetArgument = argument('target')
const targetRef = targetArgument ?? 'rc87-migration-closure'
const postBaselineRef = argument('post-baseline', DEFAULT_POST_BASELINE_REF)
const check = process.argv.includes('--check')
const baselineCommit = resolveRef(baselineRef)
const targetCommit = targetArgument ? resolveRef(targetArgument) : RC87_MIGRATION_TARGET_COMMIT
const contractTargetCommit = resolveLatestTargetCommit()
const contractTargetRef = 'latest-target-change'

const legacyInventory = collectCasesFromRef(baselineRef, baselineCommit)
const targetInventory = collectCasesFromRef(targetRef, targetCommit)
const contractTargetInventory = collectCasesFromRef(contractTargetRef, contractTargetCommit)
const rustRefactorContractLedger = buildRustRefactorContractLedger(contractTargetInventory, contractTargetCommit)
targetInventory.cases.push(...collectSemanticCorpusCases(targetCommit))
targetInventory.cases.push(...collectRustTakeoverCases(targetCommit))
targetInventory.cases.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.title.localeCompare(right.title))
const takeover = loadTakeoverEvidence()
if (process.argv.includes('--seed-semantic-core-evidence')) {
  seedSemanticCoreEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-rendering-evidence')) {
  seedRenderingEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-authoring-evidence')) {
  seedAuthoringEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-language-evidence')) {
  seedLanguageEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-scanner-evidence')) {
  seedScannerEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-p1-evidence')) {
  seedP1Evidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-p2-evidence')) {
  seedP2Evidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-final-language-evidence')) {
  seedFinalLanguageEvidence(legacyInventory, targetInventory)
}
const migrationEvidence = loadMigrationEvidence()
const exceptions = loadParityExceptions(migrationEvidence)
const mapping = mapCases(legacyInventory, targetInventory, takeover, migrationEvidence, exceptions)
const byStatus = countBy(mapping.entries, (entry) => entry.migration.status)
const byPriority = countBy(mapping.entries, (entry) => entry.priority)
const byCoverage = countBy(mapping.entries, (entry) => entry.migration.coverage)
const byProof = countBy(mapping.entries.filter((entry) => entry.migration.proof), (entry) => entry.migration.proof.kind)
const postRc87DecisionSource = loadPostRc87Decisions(contractTargetInventory, contractTargetCommit)
const postRc87Delta = buildPostRc87Delta(
  baselineCommit,
  postBaselineRef,
  postRc87DecisionSource,
  contractTargetCommit
)

const ledger = {
  $schema: '../scripts/ts-test-migration-ledger.schema.json',
  version: 2,
  policy: {
    baselineAuthority: 'v2.0.0-rc.87 is the only TypeScript behavior baseline.',
    cssBytes: 'Exact bytes or an explicitly approved parity exception.',
    syntaxAndAuthoring: 'Exact behavior or an explicitly approved parity exception.',
    p0Coverage: 'Representative-only coverage is not complete.',
    newerRC: 'Post-rc.87 changes are a separate decision overlay and do not redefine parity.',
    priorities: {
      P0: 'CSS bytes, syntax, authoring, runtime, server rendering, rendering modes, and integration behavior.',
      P1: 'Extraction, validation, lint, language, schema, diagnostics, and project behavior.',
      P2: 'CLI, extension, packaging, host, and peripheral integration behavior.',
      P3: 'Performance, bundle size, examples, site, and benchmark residual risk outside the migration denominator.'
    },
    ciGate: true
  },
  baseline: {
    ref: baselineRef,
    commit: baselineCommit,
    packageCount: legacyInventory.packageCount,
    testFiles: legacyInventory.files.length,
    e2eFiles: legacyInventory.files.filter((file) => file.kind === 'e2e').length,
    cases: legacyInventory.cases.length,
    expandedMatrixCases: legacyInventory.expandedMatrixCases,
    dynamicMatrixCases: legacyInventory.dynamicMatrixCases,
    files: legacyInventory.files
  },
  target: {
    ref: targetRef,
    commit: targetCommit,
    packageCount: targetInventory.packageCount,
    testFiles: targetInventory.files.length,
    e2eFiles: targetInventory.files.filter((file) => file.kind === 'e2e').length,
    cases: targetInventory.cases.length
  },
  existingParity: {
    semanticBaseline: takeover.semanticBaseline,
    expectedLegacyTests: takeover.expectedLegacyTests,
    suites: takeover.suites,
    treatment: 'Historical engine evidence only; every reference must be revalidated against rc.87.'
  },
  evidence: {
    path: path.relative(process.cwd(), evidencePath),
    version: migrationEvidence.version,
    records: migrationEvidence.records.length,
    proofs: byProof
  },
  summary: {
    byStatus,
    byPriority,
    byCoverage,
    byProof,
    byPackage: buildPackageSummary(mapping.entries),
    targetOnlyCases: mapping.targetOnly.length
  },
  postBaselineDelta: {
    path: path.relative(process.cwd(), postRc87DeltaPath),
    version: postRc87Delta.version,
    ref: postRc87Delta.delta.ref,
    commit: postRc87Delta.delta.commit
  },
  entries: mapping.entries,
  targetOnly: mapping.targetOnly
}

validateLedger(ledger)
validateRustRefactorContractLedger(rustRefactorContractLedger)
validatePostRc87Delta(postRc87Delta)
const json = `${JSON.stringify(ledger, null, 2)}\n`
const rustRefactorContractJson = `${JSON.stringify(rustRefactorContractLedger, null, 2)}\n`
const postRc87DeltaJson = `${JSON.stringify(postRc87Delta, null, 2)}\n`
const report = buildReport(ledger, rustRefactorContractLedger, postRc87Delta)
writeOrCheck(ledgerPath, json, check)
writeOrCheck(rustRefactorContractLedgerPath, rustRefactorContractJson, check)
writeOrCheck(postRc87DeltaPath, postRc87DeltaJson, check)
writeOrCheck(reportPath, report, check)

console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), ledgerPath)} (${ledger.entries.length} rc.87 cases).`)
console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), rustRefactorContractLedgerPath)} (${rustRefactorContractLedger.entries.length} Rust refactor contract cases).`)
console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), postRc87DeltaPath)} (${postRc87Delta.files.length} post-rc.87 files).`)
console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), reportPath)}.`)
