# 0058 LSP cancellation, settings and document versions

- Scope actual in-process JSON-RPC transport via existing connection helper; three initialization/settings modes, six cancel/change/current-hover cycles per mode, close/reopen and formatting setting controls. Disposable empty workspace, bundled fallback, no product/fixture/service changes.
- Read language-server package/AI, core/settings/connection/setup/runtime/semantic/formatting tests and lower service settings, existing0015/0016 evidence. Source governs asynchronous init and client-requested restart.
- [Repro](../repros/lsp-cancellation-settings.mts), [source hashes](../evidence/0058-source-hashes.json). Command:`node scripts/with-typescript-tooling-compat.mjs node --import tsx .ai/audits/bug-hunt/repros/lsp-cancellation-settings.mts`.
- Cancellation may legally return a result if the server completes before cancellation is handled. Require transport health and correct subsequent version, not mandatory abortion. Client restart is simulated by disposing each server and creating the next with new initialization settings; this is not a real editor settings-race claim. Corrected harness exits0; all assertions PASS.

## Results and harness correction

- [Final log](../evidence/0058-lsp-final.log), [structured results](../evidence/0058-lsp-results.json):3 actual initialize/configuration exchanges,18 cancel/change/latest-hover cycles,3 close/reopen service replacements, formatting edits0/1/0 matchingfalse/true/false,3settings notifications and restart requests. Reopened documents reach version8 with expected grid hover.
- All18 cancelled hover requests returned a result; source does not consume cancellation tokens. This test does not require cancellation to abort completed work and confirms no transport breakage/stale subsequent hover. It does not measure cancellation CPU savings or prove every race safe.
- Initial [log](../evidence/0058-lsp.log) reached all assertions but did not exit. Repro supplied its own PID as parent; installed LSP library's [watchdog](../evidence/0058-watchdog-control.txt) starts a3s interval for numeric processId. An in-process client has no independent parent to monitor. Terminated only that audit child, changed harness initialize processId to null; rerun completed and exited0 without forced process.exit. Harness error, not a Master CSS leak.
- No new finding; package source/fixtures unchanged. No added persistent package test and no new package-local lint obligation. Remaining real VS Code settings/cancellation races, manual corpus and Windows are explicitly unclaimed.

## End-of-batch validation

- `pnpm run check:ai-context` PASS ([log](../evidence/0058-ai-context.log)); [final checks](../evidence/0058-final-checks.json):5558 source entries, current snapshots unchanged except superseded0044/0047 Site snapshots;34findings/63checked/12blocked, no budget violation or missing link.
- Initial ledger link pass ran before its new inventory file was written and reported that one missing file. Inventory was generated, then all links rechecked; this was check ordering, not missing evidence. Latest [inventory](../evidence/0058-file-inventory.json) retains prior ownership records.
- No audit test processes remain; tracked diff still only foreign `site/next.config.js`, internal clean. Goal remains active with specific blockers; next0059 uses a disposable real VS Code host to test bounded setting transitions after reading current package context.
