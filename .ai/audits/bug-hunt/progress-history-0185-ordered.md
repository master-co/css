# Ordered output checkpoint history

Previous commit handoff preserved verbatim:

- 提交交接：依使用者要求，本次保存0183 source-map及0184 conditional compose已收尾的有界查核、原始證據與2個重現腳本。產品／套件測試仍依賴未完成graph實作，0185新工作與其他對話Site變更保留工作區。50份歷史log雜湊一致；0184的483來源中467仍一致，16份已由0185更新，故舊PASS不代表目前版本。證據依賴記錄的工作區來源，非乾淨checkout驗證。57historical/52fixed/5unresolved、10blocked、4gates/4candidates及0038身分暫停維持；目標active，未推送。0185已改善直接輸出順序，但qualified managed import仍FAIL；接續核對最終native CLI／browser、來源與產物並同步帳本後，才能結案BH-0057。[提交核對](evidence/0184-commit-validation.json)；[0184原交接](progress-history-0184-commit.md)。

## Previous BH-0057 report

## BH-0057 · P1 · Outer native conditions leave compose unlowered

0184 repairs traversal of ordinary media/supports/container/layer/starting-style and preserves arbitrary native children in graph output. Native/Wasm graph and authored CSS controls pass72browserobservations. Direct output now expands compose but still appends lowered rules after native CSS, reversing sibling order and splitting anonymous layers:15browserPASS/9FAIL,32px instead of48px. Rust98PASS/2newFAIL andcompiler305PASS/1newFAIL retain these regressions. BH-0057 remains partial; reuse structural Rust output assembly for Node/universal direct APIs while retaining original maps. [Evidence](evidence/0184-final-checks.json);[repro](repros/native-conditional-matrix.mjs);[original finding](evidence/0183-output-maps-findings.json).

