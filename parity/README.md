# Rust semantic parity

This directory freezes the user-visible engine and compiler behavior that Rust took
over from TypeScript.

- `ts-test-migration-ledger.json` is the complete `packages/*` migration inventory
  rooted at `v2.0.0-rc.87`. It expands Vitest tests, parameter matrices, generic
  `tests/test.ts` suites, package E2E suites, and ESLint RuleTester valid/invalid
  cases. It references, but never absorbs, the separate post-rc.87 delta ledger.
- `post-rc87-delta-decisions.json` is the manually reviewed decision source for
  behavior after rc.87. It pins the approved browser manifest adaptation to upstream
  and target file digests, its implementation commit, executable test case digests,
  ownership, human approval, and an approval scope digest.
- `post-rc87-delta-ledger.json` is generated from that decision source. It freezes the
  six behavior files and one VS Code metadata file between rc.87 and
  `origin/rc@a71c23a`; its approved adaptation cannot close or redefine an rc.87 case
  and is deliberately separate from `parity-exceptions.json`.
- `ts-test-migration-evidence.json` is the reviewed evidence source keyed by rc.87
  case id. It pins target case ids, runners, and source digests for rewritten golden
  tests and approved divergences. Identical source cases are proved automatically by
  the generator only when exactly one target has the same normalized case digest.
- `rust-refactor-contract-ledger.json` independently compares the completed Rust
  refactor baseline at `bd164e4b5` with the latest package commit. It prevents rc.87
  migration work from restoring removed APIs, exports, binding or language wire
  contracts, or retired rendering-mode options.
- `rust-refactor-contract-evidence.json` records reviewed supersets and explicit
  contract-surface changes. Unapproved case removal, digest drift, or surface drift
  makes the generator fail.
- Rust refactor cases moved between test files are preserved only through a unique
  package/suite/title/runner/matrix/body match. RuleTester entries use a per-case
  configuration digest, so adding a neighboring matrix case does not invalidate the
  whole suite; ambiguous moves still fail. Post-rc.87 file records use
  `implementedFrom` when a current split module differs from its original
  implementation path.
- `rust-semantic-corpus.json` records exact CSS bytes and selected rule metadata from
  `ef1a7c851`, with `v2.0.0-rc.87` recorded as the public baseline.
- `rust-takeover-ledger.json` accounts for all 114 test declarations in the 11 engine
  test files removed by `7c59bed3f`. Every entry must point to an executable corpus
  case, a current focused test, or an approved parity exception.
- `../parity-exceptions.json` is the only exception registry. Every exception approval
  records the approver, UTC timestamp, review reference, exact rc.87 source and target
  digests, and a scope digest over the old/new contract. Missing metadata or any scope
  drift makes ledger generation fail. Do not add an exception or change frozen expected
  output without an old/new byte diff and user QA approval.
- `rust-refactor-contract-evidence.json` applies the same human-approval metadata and
  scope-digest rule to every explicit `approved-contract-change` record or surface.

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
whose target runner and digest still match. The complete ledger check runs as a
required validation contract in CI.

The command executes every frozen engine/compiler case, verifies exact CSS and
selected Manifest v1 utility records, validates the ledger count and references, and
then validates approved exceptions. Native/Wasm wrapper parity remains useful, but it
does not replace this historical semantic oracle because both wrappers execute the
same Rust implementation.
