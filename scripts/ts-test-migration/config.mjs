import path from 'node:path'

export const DEFAULT_BASELINE_REF = 'v2.0.0-rc.87'
export const DEFAULT_POST_BASELINE_REF = 'origin/rc'
export const RC87_COMMIT = '9cc3e8b5f2e34d5220f10f27ed5ce8186fbcb524'
export const POST_RC87_COMMIT = 'a71c23a2680fc49fc12724e47db5b2d88bdf229d'
export const RUST_REFACTOR_CONTRACT_COMMIT = 'bd164e4b5ae3a713940913d745183e9ab6b54263'
export const RC87_RENDERING_TARGET_COMMIT = 'b242a52a0fcb43b1b506d9fa1e010d0c85621d13'
export const RC87_AUTHORING_TARGET_COMMIT = '7ac3c1a63a7af8c8c927a869fa3e4d531261cec6'
export const RC87_LANGUAGE_TARGET_COMMIT = '61b9def159eeb78cfe67a70e96cb3dc148088952'
export const RC87_SCANNER_TARGET_COMMIT = 'ee78ca31a85d39fa5eaded9fc2e912b6bd8698d6'
export const RC87_P1_TARGET_COMMIT = RC87_SCANNER_TARGET_COMMIT
export const RC87_P2_TARGET_COMMIT = '9caecbd2e0a449f71ec896e437ff0ab787c7470d'
export const RC87_FINAL_LANGUAGE_TARGET_COMMIT = 'f9aa00be94ac4e40c92dd9050e46e282b4a7855d'
export const RC87_MIGRATION_TARGET_COMMIT = '884d19a7606fefaf0754df6b4ebf3d9dd9b0eb35'
export const ledgerPath = path.resolve('parity/ts-test-migration-ledger.json')
export const postRc87DeltaPath = path.resolve('parity/post-rc87-delta-ledger.json')
export const postRc87DecisionPath = path.resolve('parity/post-rc87-delta-decisions.json')
export const evidencePath = path.resolve('parity/ts-test-migration-evidence.json')
export const exceptionsPath = path.resolve('parity-exceptions.json')
export const reportPath = path.resolve('.ai/reports/rust-test-migration.md')
export const rustRefactorContractLedgerPath = path.resolve('parity/rust-refactor-contract-ledger.json')
export const rustRefactorContractEvidencePath = path.resolve('parity/rust-refactor-contract-evidence.json')

export const sourceExtensions = /\.(?:c|m)?(?:j|t)sx?$/
export const legacyOwnerMap = new Map(Object.entries({
  diagnostics: 'compiler',
  engine: 'css',
  facade: 'css',
  integration: 'internal',
  language: 'tooling',
  lexer: 'tooling',
  lint: 'tooling',
  project: 'compiler',
  scanner: 'tooling',
  source: 'tooling',
  stylesheet: 'compiler',
  validator: 'tooling'
}))

export const legacyCaseOwnerMap = new Map(Object.entries({
  'rc87-3acbadf9896a963e': 'css'
}))

export const corePackages = new Set([
  'astro',
  'compiler',
  'engine',
  'facade',
  'integration',
  'next',
  'nuxt',
  'preset',
  'runtime',
  'server',
  'stylesheet',
  'svelte',
  'vite',
  'webpack'
])

export const toolingPackages = new Set([
  'diagnostics',
  'eslint-config',
  'eslint-plugin',
  'language',
  'language-service',
  'lexer',
  'lint',
  'project',
  'scanner',
  'schema',
  'source',
  'validator'
])
