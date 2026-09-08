# 0047 Revision/source revalidation and handoff consistency

- HEADcdc18eadbaca7271a4d92c4876d2a6d0a86ddba9; internal169b5ee6f8b4ca9817fa82eb572e105a24f78d80. README/coverage0046 read; changed source list/diff verified. No semantic source changed since starting commit; current site next.config.js foreign dirty change remains.
- Scope revalidate evidence affected by external commits, finish current site coverage, reconcile ledger/source hashes/authorized file list. New source snapshot below. No product/fixture/golden edits; reruns write new0047 evidence without replacing0046.
- Nuxt new regression test lint rerun PASS ([log](../evidence/0047-nuxt-lint.log)); prior final test edit covered.

## Current-source validation

- Read current site source/diffs, relevant README/coverage and prior0044–0046 evidence. Data flow: content preparation → generated app/Play compiler → Next static output → CSS contract → browser search/Play/theme interactions.
- Commands ran from repository root with the isolated-package harness, copying site and preserving the shared working directory. Exact child commands, cwd, exit codes and cleanup paths: [content](../evidence/0047-site-content.log), [build](../evidence/0047-site-build.log). Harnesses: [content](../repros/site-content.mjs), [build](../repros/site-build.mjs), [browser](../repros/site-interactions.mjs).
- Current content suite:65 tests PASS. Play17 tests from0045 remain valid because their source hashes match. Current build generated764 Next pages and1142 final HTML routes; lint and type-check PASS.
- [CSS contract](../evidence/0047-css-contract.log):1142 routes,204 hydration contracts,1901 generated rules,2202 exact CSS segments PASS. Prior0046 snapshot failure was superseded by the foreign source/snapshot update; this audit did not edit that snapshot.
- [Dogfood](../evidence/0047-dogfood.log):5 PASS,6 FAIL,1 skipped; aggregate build harness exit1 accurately preserves dogfood failure. Build itself and other stages exit0. Stale heading/spacing expectations and equivalent color serialization explain these failures; no six new product bugs claimed.
- [Additional browser controls](../evidence/0047-interactions.log): search at390/768/1280 widths, no overflow, query/keyboard/Escape/focus/reopen/empty/navigation PASS. Actual Monaco edits recompiled red→blue in Play. White and dark colors matched pixel RGBA even when computed color strings differed.
- Existing hypotheses excluded: equivalent CSS color strings are not a color mismatch; removed guide headings/explicit index spacing are not unexplained runtime regressions. The old0046 evidence is retained with its revision limitations.

## Reconciliation and handoff

- No new findings in0047. Confirmed27 (P1=7,P2=18,P3=2); pending BH-0025/0026/0027. Coverage:64 checked,11 blocked,0 active,0 not started across75 units. Blocked units are not completed.
- [Source revalidation](../evidence/0047-revalidation.json):3956 stored entries examined; only7 paths in the superseded0044 site snapshot differ. Current0047 site snapshot and all other snapshots match.
- Current source locations and severity checked against [finding locations](../evidence/0047-finding-locations.json). [Report](../report.md), [changes](../changes.md), README, coverage and findings synchronized.
- Remaining work: explicit blockers and pending hypotheses remain as listed; no product fixes authorized. Additional0038 host checks require the user's verification confirmation. Unblocked follow-up can investigate BH-0026 or BH-0027 using their existing IDs and bounded controls.
- Cleanup is limited to audit-owned isolated directories. Foreign site edits and servers remain untouched. Final structural/link/status checks are recorded below.

## Final checks

- `pnpm run check:ai-context` exit0, [log](../evidence/0047-ai-context.log). All ledger Markdown within400 lines/48KiB;0 missing local links;0 invalid finding source locations. [Machine results](../evidence/0047-final-checks.json).
- Preserved3956 source hash comparisons and revision differences as recorded above. Final tracked diff remains only the foreign `site/next.config.js`; internal is clean. The23 new package/crate tests and ledger files are enumerated in [inventory](../evidence/0047-file-inventory.json).
- Removed only the recorded audit-owned static browser copy after retaining evidence; [cleanup](../evidence/0047-cleanup.json). No product edits, fixture/golden updates, dependency changes or commits were made.
