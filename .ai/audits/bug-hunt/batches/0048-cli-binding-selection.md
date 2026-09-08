# 0048 CLI execution binding selection

- Purpose: resolve existing BH-0026 using actual CLI execution and native/Wasm controls. Scope PKG-cli, scanner/tooling/binding consumers; no product edits.
- Starting HEAD `3d2f47768c30e1678228fa04efcfc4b152e70120`. README, coverage CLI row,0029 and affected routing/manifests/AI notes read. Foreign site/next.config.js and untracked site agent docs preserved.
- Since0047, foreign commits changed255 site paths; current site evidence is now pending revalidation. Packages/crates are unchanged. This is queued separately and does not expand the CLI batch.
- Source flow: CLI core.ts option → generate.ts options → scanner init → createScannerSession → createToolingBinding. GenerateOptions declares binding, but runGenerate does not forward it; scanner helper calls binding factory with default options.
- Planned evidence: actual CLI with auto/native/wasm, observed native ScannerSession construction; direct tooling factory native/Wasm session controls. Temporary instrumentation only records calls and delegates unchanged; no native artifact or product file replacement.
- Completion: valid controls plus observable CLI binding choice, update original BH-0026 status, indexes and handoff. No classification of CSS output differences from binding selection alone.

## Handoff requested by user

- First harness run: `node scripts/with-typescript-tooling-compat.mjs node .ai/audits/bug-hunt/repros/BH-0026-binding.mjs`, exit1; [log](../evidence/0048-binding.log). This is a harness failure, not product evidence. CLI auto/native/wasm all exit0 with block CSS, but direct controls fail because the harness guessed a nonexistent preset dist path.
- The instrumentation also observed the wrong loader: native-loader.ts:255 calls `process.dlopen` directly, so wrapping `Module._extensions['.node']` cannot observe ScannerSession construction. Zero observed calls are invalid evidence.
- Next concrete action: resolve the actual preset JSON path from package exports/current source; change only the audit repro to observe/delegate `process.dlopen` and native ScannerSession construction. Rerun with direct native/Wasm controls; only classify BH-0026 after both controls succeed. Preserve first-run failure history.
- No process remains live from this reproduction; its temporary directory was removed in finally. User requested a prompt for moving continuation to another conversation. No new conversation created and no goal completion claimed.

## Final verification — 2026-09-08

- HEAD remains `3d2f47768c30e1678228fa04efcfc4b152e70120`; all four stored0048 source hashes still match. No package source edits.
- Corrected harness uses the preset's package export (`src/default-manifest.json`) and delegates `process.dlopen` while observing native ScannerSession construction. First corrected attempt ([log](../evidence/0048-binding-corrected.log)) exposed Node fetch's unsupported file: URL in the direct Wasm control. This is a control setup limitation, not evidence for BH-0026. Pass existing local Wasm bytes through the supported `wasm.input` option to validate the control. No loader/semantic product change or network fetch workaround.
- Final command: `node scripts/with-typescript-tooling-compat.mjs node .ai/audits/bug-hunt/repros/BH-0026-binding.mjs`; [log](../evidence/0048-binding-final.log), exit1 at the intended CLI assertion. Auto baseline, direct native/Wasm controls, and CLI native/Wasm all exit0 and emit `display:block`. Direct controls report native/wasm respectively and observe 1/0 native scanner constructions. CLI native/wasm each observes1.
- **BH-0026 P2 confirmed**: advertised CLI `generate --binding wasm` is ignored and uses native on this host. `packages/cli/src/core.ts:26` advertises the selection; `generate.ts:138` drops binding when creating the scanner, and tooling `binding-session.ts:123` calls the default factory. Expected requested execution binding; actual default auto path. No CSS mismatch claimed. Rust executable is outside this Node CLI flag finding.
- Fix direction for later product work: deliberately thread binding/load configuration into the scanner and dependent execution path, or revise the public option contract. Audit makes no fix.
- Completed this bounded hypothesis. Repro cleanup ran in finally. Only ledger/repro changed; no workspace package modified, so no new package-local lint obligation. Next0049 verifies BH-0027; BH-0025, site revision and blocked units remain unfinished.
