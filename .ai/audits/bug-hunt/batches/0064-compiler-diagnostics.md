# 0064 Compiler benchmark diagnostics

- Previous0061–0063 added18executed browser controls; continuation follows progress. HEAD3d2f47768 unchanged, foreign work preserved. Root/index reread; benchmark package/AI/performance pack read0063; current diagnostic/fixture/static-build/runner source inspected.
- Scope existing compiler diagnostic suite, four existing static fixtures and one round. Writes are only isolated benchmarks/.results workspaces/reports. No snapshot/history update or product instrumentation/edit. Source scanner/stylesheet correctness baseline from0003/0005 remains current by hash; actual diagnostic rejects CSS hash mismatch and missing markers before reporting.
- [Driver](../repros/compiler-diagnostic-report.mjs) runs`pnpm exec vitest bench compiler-diagnostics --run` withBENCHMARK_ROUNDS=1, preserves report JSON if produced and reports metric coverage. Command:`python3 .ai/audits/bug-hunt/repros/isolated-package.py benchmarks node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/compiler-diagnostic-report.mjs`.
- [Source hashes](../evidence/0064-source-hashes.json). This is correctness/measurement-availability evidence on one local host, not a speed comparison or statistical performance conclusion. Browser lifecycle defectsBH-0032/0033/0034 remain separate. Suite exit0; four fixtures passed the existing hash and marker gates.

## BH-0037 · P3 · 已確認：diagnostic 報告宣告未量測的分階段指標

- 原始套件 suite 1PASS，minimal/docs/dashboard/stress-css 四個 variant、各一輪；[完整 log](../evidence/0064-compiler-diagnostics.log)、[原始 report](../evidence/0064-compiler-report.json)、[可重算摘要](../evidence/0064-report-validation.json)。Node24.20.0/macOS arm64 本機隔離副本，無產品或既有 fixture 變更。
- 報告宣告136個 metrics，但每個 variant 只有17個 samples，共68；119個 metric IDs 在全部四個 fixtures 完全無 sample，包括所有110個 lower/manifest 前綴指標。控制組17個已有指標全部 finite、摘要每格 sampleCount=1；最終 CSS bytes 分別5178/5903/6101/11779。CSS hash/marker gates 均通過。
- 預期依據：`benchmarks/shared/compiler-diagnostics.ts:155` 宣告 timings decompose compiler lowering，suite:108及173–176宣告 internal instrumentation 與已收集 lowering 指標。實際 helper:326起只呼叫兩次 public stylesheet compose；DiagnosticRecorder 的 withPrefix/time/addCount 沒有接上任何內部階段，無法產出所宣告的 lowering/manifest samples。
- 這不是隨機零耗時、report serializer 丟數據或單一fixture略過某分支：缺項沒有 recorder 呼叫來源，四fixture結果一致。既有 report summary 只遍歷已有 samples，因此缺值未被填成0；不沿用BH-0033錯報零的描述。低影響 benchmark tooling 缺漏，沒有證據顯示 CSS 產出錯誤。
- 修正方向（未實作）：讓診斷定義符合目前實際可量測的公開操作，或恢復擁有者層提供的正確階段量測；不可把重複完整 compose 當內部 lowering 分解。
- 已完成本批四fixture輸出一致性和量測可用性分類；詳細 compiler phase measurement 仍未完成，受BH-0037阻礙；SUP-benchmarks維持受阻。既有300秒browser lifecycle及其他suite/history未因此完成。無package-local lint script；本批只新增帳本/driver，無package修改。

- Final ownership/hash/link/budget reconciliation: [0066 checks](../evidence/0066-final-checks.json), [inventory](../evidence/0066-file-inventory.json), [AI context check](../evidence/0066-ai-context.log).
