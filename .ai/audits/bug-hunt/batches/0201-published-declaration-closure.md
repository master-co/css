# Batch 0201: Published declaration closure

## Scope and authorization

Confirm the 0200 binding artifact candidate using fresh default-output builds in disposable copies, then repair only the reviewed binding DTS rule. The user explicitly answered「授權這一處建置設定修正」. No authorization to alter other package build rules, dependencies, lockfiles, CI or release. No commit/push; HEAD remains `3b5c98d61`. The 0038 identity pause remains active.

## BH-0061 — P2, fixed

The shared declaration `neverBundle` rule externalized local type imports while the binding runtime entry list omitted pure type modules. A fresh normal `dist` build succeeded but its copied published package failed strict external TypeScript 6 compilation (TS7016 / TS2307). The consumer has no workspace aliases and uses `skipLibCheck: false`.

The approved conditional removes relative imports from `neverBundle` only for `@master/css-binding`; other package rules retain their exact expression. Existing runtime entrypoints stay unchanged. The repaired build emits five previously absent declarations and updates eleven existing declarations. All 28 JavaScript files are byte-identical to both the fresh baseline and the live pre-delivery package. No CSS semantics or runtime API change.

## Evidence and verification

- [Fresh baseline and first candidate](../evidence/0201-default-build-controls.json): baseline build 0, external types exit 2. The initial all-source entry glob made types pass but changed runtime JavaScript and was rejected. Its failed byte-equality assumption is a candidate validation failure, not another product bug; no root edit was applied from that candidate.
- [Reviewed candidate](../evidence/0201-reviewed-candidate.json): binding-only rule, default build PASS, seven exported surfaces PASS, positive and expected-error type controls PASS, seven runtime imports and native inspection PASS.
- [Atomic delivery](../evidence/0201-promotion.json): complete candidate directory exchanged with live binding dist; previous directory retained at the recorded backup. No foreign host stopped/restarted. Loaded foreign modules are not claimed refreshed.
- [Delivered checks](../evidence/0201-delivered-checks.json): strict types, runtime smoke and closure scan PASS. Binding package: 25 tests PASS; package lint and shared configuration ESLint PASS. Shared has no package-local lint script.
- [Portable fresh-build reproduction](../repros/published-binding-types.py): run `python3 .ai/audits/bug-hunt/repros/published-binding-types.py /tmp/new-output-directory`. Requires an unused output directory and the installed workspace toolchain; installs nothing and builds only temporary copies. Archived original configuration provides the failing control; current configuration provides the repaired control. Actual rerun [results](../evidence/0201-portable-controls.json) prove baseline FAIL / candidate PASS and identical JS.
- [Current artifact closure probe](../repros/published-declaration-closure.mjs): binding relative issues 13 → 0. This checks local declaration closure; the separate external consumer validates the seven binding surfaces and dependency types.
- 550 prior source hashes unchanged; source inventory now includes the approved config and three repro materials (554). Artifact inventory extends 453 → 458: 442 old artifacts unchanged, 11 declaration changes, 5 added declarations. Native, Wasm, compiler and other package artifacts unchanged. Existing tests, fixtures, snapshots, dependency files and foreign Site bytes preserved.

## Remaining and next handoff

61 historical findings / 57 fixed / 4 unresolved (BH-0004, BH-0029, BH-0051, BH-0053); coverage remains 65 checked / 10 blocked. Checked coverage does not imply complete feature coverage. The full retained requirements are copied into [final checks](../evidence/0201-final-checks.json).

Current language-server (2), MCP (1), and tooling (3) relative declaration issues are artifact candidates only. Next reproduce each with fresh default-output builds and strict external consumers before classifying a product issue. Other package build-rule edits are not covered by this authorization. Continue raw imports, full hosts/maps/recovery, root gates, benchmark matrices and foreign Site revalidation. The existing Wasm sourceMappings expectation mismatch remains unfinished. Recorded blockers are not completion. All owned commands terminal; goal active.
