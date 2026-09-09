# 0117 VS Code settings restart — BH-0035

- Starting HEAD2449e8664; previous0116turn made executed Node/Rust product and evidence progress.54source/preserved hashes verified; BH-0004full asset delivery remains required and its0116handoff is retained. This batch advances another confirmed unresolved finding, without narrowing the overall goal.
- Scope actual VS Code optional ESLint command dispatch during manual/settings restart. Reuse0059isolated build/staging/disposable profile; no global extension installation, generated contribution/fixture/dependency/CI changes.0038追加驗證 remains paused pending explicit identity confirmation. No commit/push.
- Status: BH-0035fixed after completed host/package verification; overall goal remains unfinished.

## BH-0035 fixed

- Current-source actual VS Code baseline reproduced0059: manual restart produced0missing-command unhandled rejections, while one settings update produced1. [Before host](../evidence/0117-vscode-before.json), [log](../evidence/0117-vscode-before.log).
- Configuration changes now await the existing `restart` function, which already checks registered commands before invoking optional `eslint.restart`. A catch logs configuration restart failures through the existing output channel, so an optional command failure cannot leave the event listener's promise unhandled. Manual restart behavior and public settings/contributions are unchanged. Only the configuration branch in `packages/vscode/src/extension.min.ts` changed.
- Added an actual extension-host regression at `packages/vscode/tests/bug-hunt-settings-host.cjs` and isolated [launcher](../repros/vscode-restart-host.mjs). It uses disposable profile/extensions/workspace directories; no user extension is installed or configured. Before mode is `BH_VSCODE_BEFORE=1`; normal mode verifies the fix. Run through the existing isolated-package.py wrapper, as in0059.

| Verification | Result |
|---|---|
| Missing optional command |Same actual VS Code1.136.1: manual0/settings0 unhandled rejections after fix; before was0/1 |
| Registered optional command |Public VS Code command registration control called exactly once by manual restart and once by settings restart |
| Registered command rejects |Injected command failure reached;0unhandled rejections; hover and active tokens remain usable |
| Optional command removed |Next settings update succeeds without invoking the removed command or producing missing-command rejection |
| Setting feature regression |Actual active30→always35→off0→active30 token integers, edited-documentv2 hover reports display:grid; formatDirectives false/true/false/true returns0/1/0/1edits |
| Package suite |31testsPASS, including staged bundle/stdio/native delivery and existing grammar/release-script controls |
| Lint/types/build |Package lint and type-checkPASS; direct extension/server bundle buildPASS; full `pnpm run build` including generated contributionsPASS in an isolated copy |
| Root gates |API census/package contracts remainFAIL with identical output hashes to0116; no golden updates |

- [After host](../evidence/0117-vscode-after.json), [comparison](../evidence/0117-comparison.json), [feature controls](../evidence/0117-vscode-settings.json), [package suite](../evidence/0117-host-tests.log), [full isolated build](../evidence/0117-isolated-full-build.log), [root gates](../evidence/0117-root-checks.json).
- The registered success/failure endpoints are explicitly synthetic commands registered through the real VS Code API. They verify optional-command dispatch/error handling, not an installed ESLint extension's internal behavior. Missing-command and settings/hover/format tests use the actual staged Master CSS extension. No new harness failure or weakened assertion in this batch.
- Full-build contribution writes were confined to the disposable package copy. Repository package.json, generated contributions, fixtures, grammar sources, dependency/lockfile, packaging/release/CI code and all prior compiler/Site work are preserved. Existing release tests run their inspected dry-run only; no release is performed.
- All actual hosts exited0 and wrapper disposal cleaned the owned profiles/staging/package trees. Unrelated VS Code AgentHost/AccountPolicyGate log lines are not classified as product failures or identity-verification evidence.0038追加驗證 remains paused.
- No runtime benchmark: this is desktop extension restart control flow; engine/runtime/compiler semantics and runtime payload are unchanged. No bundle-size or speed improvement is claimed.

## Remaining work and handoff

- BH-0035 is now fixed:32fixed/12unresolved;65checked/10blocked coverage remains unchanged. UnresolvedIDs:BH-0004/0029/0032/0033/0034/0037/0038/0039/0040/0041/0042/0043. All4root gates and4unclassified candidates remain open.
- Return to0116's BH-0004 handoff: integrate prepared references/resource ownership and real output URL/asset emission into file/project/stylesheet/build/CLI consumers. Existing external-import baseline remains39FAIL; graph-only successes do not close it. Source diagnostics, namespace/URL forms, reload dependencies and legacy string compose order remain explicit requirements.
- Other remaining findings and blocked units remain in findings/coverage. Actual VS Code testing here is Darwin ARM64/VS Code1.136.1; exhaustive configuration concurrency and other editor/OS matrices are not claimed.
- No commit/push. Goal remains active. Final source/preservation hashes, ledger counts and cleanup checks are recorded with this batch.

- Final verification:4current and57preserved source hashes checked;44finding rows reconcile32fixed/12unresolved. All own host/tool handles terminal, index empty, no commit/push. One ledger-update command had a stdin encoding error before any Python edits; rerunning with ASCII-escaped string literals completed the update. Product and host evidence were unaffected.

## Commit review correction

提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。
