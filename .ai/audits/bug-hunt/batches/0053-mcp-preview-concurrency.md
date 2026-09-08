# 0053 MCP preview concurrency

- Scope bounded concurrent apply and independent workspace-root file controls, continuing the explicit0030 residual. HEAD3d2f47768 unchanged. Read MCP manifest/AI/context/server and existing preview tests; existing sequential one-use token and stale-write checks establish expected behavior.
- Only disposable audit files are written through the real context methods. No user project files, symlink/containment bypass, external host or paused0038 checks. Compare sequential reapply rejection with simultaneous duplicate apply and independent-root success.
- Pending reproduction; no new finding assigned before valid controls.

## Results — BH-0031 P2 confirmed

- Baseline `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-mcp exec vitest run tests/core.test.ts`:17PASS ([log](../evidence/0053-mcp-baseline.log)). No product/fixture changes.
- Final command: `node scripts/with-typescript-tooling-compat.mjs node --import tsx .ai/audits/bug-hunt/repros/mcp-preview-concurrency.mts`; [log](../evidence/0053-preview-overlap.log), exit1 at intended one-accepted-apply assertion. Earlier direct/SDK logs are retained as narrower incremental evidence.
- Controls PASS: sequential duplicate token rejected, sequential competing preview rejected by stale hash, concurrent independent files in two configured roots each receive their intended output. No monkeypatch, artificial I/O barrier or file path redirection.
- Failure:10/10 simultaneous same-token rounds both report applied:true; actual MCP SDK client/InMemoryTransport3/3 rounds also both report applied:true. Same context, real server registration and formatting-preview→apply tool flow.
- Overlap evidence:3/3 distinct-token pairs targeting the same initial file both report applied:true for after-one/after-two; final file is after-two. One accepted replacement is overwritten by another preview derived from the old hash, whereas sequential control rejects the second preview. This shows lost update protection fails for overlapping applies, not arbitrary corruption or unauthorized file access.
- Source `packages/mcp/src/context.ts:221-251`: retrieves preview before awaits, checks all hashes, then writes; token removed only after write completes. Neither token claiming nor overlapping file validation/write is serialized. `server.ts:583` awaits this method per request without serialization. Expected one-use token and stale-write rejection, supported by context errors and sequential controls; concurrent calls violate both.
- Fix direction: atomically claim tokens and serialize/revalidate overlapping write transactions, with deliberate failure/retry semantics. No product fix authorized. Multi-process writers and filesystem faults not covered; same-process bounded race is confirmed.
- Cleanup: both real SDK endpoints disposed, context disposed, temporary roots removed in finally. No new workspace package test file, so no new package-local lint obligation. Repro stays under ledger.
- Completed bounded concurrency behavior; PKG-mcp residual narrowed. Source hashes match. Next bounded candidate0054: exercise existing Site interactions on locally available Firefox/WebKit in an isolated build, with engine-specific rendering evidence;11 blocked units in0052 remain unfinished and0038 stays paused.

- Final ledger checks:0 missing links,0 Markdown budget violations,64checked/11blocked,31confirmed (P1=7,P2=21,P3=3). Latest sources unchanged;5528 hash entries compare with only superseded0044/0047 snapshots differing. [Checks](../evidence/0053-final-checks.json), [inventory](../evidence/0053-file-inventory.json), [AI context PASS](../evidence/0053-ai-context.log). Tracked diff only foreign site/next.config.js; internal clean.
