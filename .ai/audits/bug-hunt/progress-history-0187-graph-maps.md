# Graph output mappings checkpoint history

0186 handoff preserved verbatim:

- 0186：BH-0004限定查核完成，產品修復仍未完成。0185最終產物重跑legacy60browser仍21PASS/39FAIL（21cascade／18拒絕）；10cases native/Wasm一致。Qualified managed import矩陣60觀察30PASS/30CSS_PRINT_ERROR；direct native/Wasm/rendered各2PASS/10FAIL，prepared native/Wasm各12PASS；所有qualifier含／不含compose均失敗。根因是先將作者定義包進import條件再直接編譯；下一步將既有file/rendered/project接到Rust graph manifest／native-output分離，補原始maps與資源交付，不能以搬移文字替代。492來源與0185產物未變。57historical/53fixed/4unresolved、65checked/10blocked及全scope保留，0038仍待身分確認；目標active，未提交／推送。[證據](evidence/0186-final-checks.json)；[批次](batches/0186-qualified-managed-imports.md)；[0185結案交接](progress-history-0186-qualified.md)。
