# Rust semantic parity

This directory freezes the user-visible engine and compiler behavior that Rust took
over from TypeScript.

- `ts-test-migration-ledger.json` is the complete `packages/*` migration inventory
  rooted at `v2.0.0-rc.87`. It expands Vitest tests, parameter matrices, generic
  `tests/test.ts` suites, package E2E suites, and ESLint RuleTester valid/invalid
  cases. It references, but never absorbs, the separate post-rc.87 delta ledger.
- `post-rc87-delta-ledger.json` freezes the six behavior files and one VS Code
  metadata file between rc.87 and `origin/rc@a71c23a`. Its pending browser manifest
  behavior cannot close or redefine an rc.87 case.
- `ts-test-migration-evidence.json` is the reviewed evidence source keyed by rc.87
  case id. It pins target case ids, runners, and source digests for rewritten golden
  tests and approved divergences. Identical source cases are proved automatically by
  the generator only when exactly one target has the same normalized case digest.
- `rust-refactor-contract-ledger.json` independently pins the completed Rust refactor
  at `bd164e4b5`. It prevents rc.87 migration work from restoring removed APIs,
  exports, binding or language wire contracts, or retired rendering-mode options.
- `rust-refactor-contract-evidence.json` records reviewed supersets and explicit
  contract-surface changes. Unapproved case removal, digest drift, or surface drift
  makes the generator fail.
- `rust-semantic-corpus.json` records exact CSS bytes and selected rule metadata from
  `ef1a7c851`, with `v2.0.0-rc.87` recorded as the public baseline.
- `rust-takeover-ledger.json` accounts for all 114 test declarations in the 11 engine
  test files removed by `7c59bed3f`. Every entry must point to an executable corpus
  case, a current focused test, or an approved parity exception.
- `../parity-exceptions.json` is the only exception registry. Do not add an exception
  or change frozen expected output without an old/new byte diff and user QA approval.

Run the gate with:

```sh
cargo xtask parity
```

Generate or validate the complete migration ledger and its human-readable report
with:

```sh
node scripts/build-ts-test-migration-ledger.mjs
node scripts/build-ts-test-migration-ledger.mjs --check
```

The generated report lives at `.ai/reports/rust-test-migration.md`. A
`mapped-unverified` entry means only that a target candidate or historical takeover
reference exists; it is not a parity claim. A `verified-exact` entry must carry either
an automatically validated `exact-source` proof or a reviewed `rc87-golden` record
whose target runner and digest still match. This ledger is deliberately not wired into
CI yet.

The command executes every frozen engine/compiler case, verifies exact CSS and
selected Manifest v1 utility records, validates the ledger count and references, and
then validates approved exceptions. Native/Wasm wrapper parity remains useful, but it
does not replace this historical semantic oracle because both wrappers execute the
same Rust implementation.
