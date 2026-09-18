# Batch 0217: Next static asset publication

BATCH FINISHED for the bounded static publication work. Counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked. Goal active. This batch bounds BH-0004 Next static publication; it does not close the general stylesheet loader or full host/watch/maps/SSR requirements.

## Implementation and authorization

Next owns a small publisher consuming the existing compiler delivery API and all returned stylesheet/resource assets. It captures resource bytes, names immutable revisions, finishes companion assets before atomically replacing the fixed entry, and retains prior revisions for in-flight host readers. Explicit preparation/transformation errors reject; later attempts recover. Session dependencies include source resources and published files. The static CSS loader reports dependencies again after transformation to include resources first discovered by that invocation.

User explicitly approved next-static-output-graph-test.patch during this batch. Applied only to packages/next/tests/static.test.ts: existing assertions read the reachable imported CSS graph; original expected values remain unchanged. Two earlier Webpack patch approvals and 0038 identity confirmation remain pending. No dependency/lockfile/CI/release or new commit authorization is inferred.

## Evidence collected so far

- Original publisher regression baseline: 3 FAIL. Corrected candidate focused tests: 3 PASS.
- New same-invocation resource dependency regression: old loader FAIL (0217-new-dependency-baseline.log), final candidate PASS; all focused static tests 13 PASS (0217-static-final-13.log).
- Approved existing static graph assertions and original three new regressions: 12 PASS.
- Prior-source full suite: 115 PASS / 4 FAIL. Candidate approved suite: 118 PASS / 4 FAIL; same three existing Next config expectation failures and missing Next executable in playground PATH.
- Process-only PATH to the already installed Next executable resolves the original playground test: 1 PASS. Existing package e2e: 3 PASS.
- Actual Next Turbopack static export: direct/nested SVG delivery and generated padding, 9 checks across Chromium/Firefox/WebKit PASS. Single worker, no dynamic SSR or live HMR claim.
- Delivery probe candidate: static 4 PASS, general loader 2 PASS / 2 FAIL; general retained graph delivery still requires implementation.
- Final source lint/types and owned normal build PASS. Final full suite with process-only installed Next PATH: 120 PASS / 3 existing Next config expectation FAIL. Final existing e2e: 3 PASS. Final candidate actual host: 9 PASS. Complete42-file Next dist atomically swapped and verified; delivered actual host9PASS, static function4PASS/general2PASS2FAIL. No other shared package artifact changed.

## Harness corrections

Wrong working-directory Vitest invocation found no tests. The first new recovery assertion assumed native CSS was inline; corrected it to read reachable CSS assets. Initial out-of-workspace Next copy could not resolve Next; owned copy inside the real workspace with explicit Turbopack root fixes topology. Installed playground has no .bin/next; process PATH uses the already installed package executable without installation or node_modules changes. A later baseline command contained a temporary-directory spelling error and never started; the corrected invocation is recorded. None of these are product bugs.

## Remaining scope

All 31 inherited requirements in 0216-final-checks.json remain, with only bounded static publication results eligible for supersession. General Next loader, immutable revision lifecycle cleanup, multi-process/multi-entry/default-worker consistency, complete static/dev/HMR/SSR/maps, native watch limitations, pending Webpack patches, root gates, cross-platform, Site and benchmarks remain unfinished. Do not count documented barriers as completion. Final validation, artifact swap and all five ledger updates are recorded below. Next batch0218 starts with the current general Next loader retained graph failures; do not extend the static publisher result to those paths.

## Final validation and preservation

| Verification | Result | Evidence |
|---|---|---|
| Original publication regressions | 3 FAIL | 0217-next-baseline-corrected.log |
| Old loader newly introduced dependency | 1 FAIL / 3 skipped | 0217-new-dependency-baseline.log |
| Final existing/new static tests | 13 PASS | 0217-static-final-13.log |
| Prior-source full package tests | 115 PASS / 4 FAIL | 0217-next-prior-full-suite.log |
| Final full package tests with installed Next PATH | 120 PASS / 3 existing config FAIL | 0217-next-final-full-suite.log |
| Existing e2e after latest loader change | 3 PASS | 0217-next-e2e-final.log |
| Final candidate actual static export / browsers | 9 PASS | 0217-next-host-final.log |
| Delivered actual static export / browsers | 9 PASS | 0217-next-host-delivered.log |
| Delivered direct function controls | Static4PASS, general2PASS/2FAIL | 0217-next-delivery-delivered.log |
| Final lint / type check / owned build | PASS | 0217-next-lint-verified.log, 0217-next-types-verified.log, 0217-next-dependency-final-build.log |

Three existing config failures are adds a CSS manifest webpack loader, adds a CSS manifest Turbopack loader, and adds CSS manifest loaders without runtime aliases or the adapter when mode is null. They reproduce on prior source; they remain unfinished and their tests are unchanged. The fourth historical full-suite failure was playground executable lookup; process-only PATH resolves it without dependency edits. Full-suite counts differ by four new audit tests; no assertion was disabled.

The exact user-approved static.test.ts patch is verified by git apply --reverse --check. Approval/hash evidence: 0217-approved-static-test.json. All expected values and fixtures remain unchanged. The two separate pending Webpack patches remain byte-identical; original plugin-runtime.test.ts remains unchanged.

Atomic promotion evidence: 0217-promotion.json. Original40 Next files were unchanged before promotion; final42 files have five changed/new records (static.js, static.d.ts, static-css-loader.js and two static-publication outputs), no removed files. The old40-file backup is .ai/audits/bug-hunt/tmp/master-next-copy-5oprky4y/packages/next/dist. Never rebuild that copy after this swap. Use a fresh owned copy for future suite/build work.

Source inventory expands599 selected records to629 by including all Next src/tests, package docs/metadata and new audit materials. This is not a whole-repository census: notably static.ts was absent from the old599. Of those inherited599 records,598 are unchanged; the sole changed inherited record is the bounded delivery repro. Separate product/test diffs and added paths are recorded in0217-source-preservation.json. Artifact inventory expands475 to493 by adding16 previously omitted Next declarations and2new helper artifacts; all451 non-Next selected artifacts remain unchanged. Do not describe inventory expansion as30new source edits or18new generated files.

All31 inherited remaining requirements are preserved verbatim in0217-final-checks.json, with two explicit bounded supersession/remaining entries appended (33 total). Historical57fixed/4unresolved and65checked/10blocked counts remain. Old immutable revision cleanup/retention and multi-process/multi-entry/default-worker consistency are unverified. Raw/native watch/root gates/host maps/Site/platform/benchmark requirements remain; two Webpack approvals and0038 identity confirmation are pending. HEAD/index unchanged, no commit or push. Owned host servers/browsers/scanners are disposed and commands terminal. Final AI context check is recorded in final-checks.

Next: reproduce the two remaining general stylesheet-loader cases using delivered artifacts, then inspect compileRenderedStylesheet delivery callbacks, returned assets and source maps before choosing Next-owned publication. Preserve Sass/preprocessed input maps and original owner URLs. Keep this separate from immutable asset retention policy and historical Next config test migration. Never restart foreign hosts or modify original dependencies/fixtures to make the tests pass.
