# Prior checkpoint preserved verbatim

- 0190：default build-watch 缺檔恢復與 manifest 關閉生命週期已修正；36聚焦測試、Vite全套619、built plugin48browser及lint/types/build通過。其後新增2項自訂watch include／exclude測試均FAIL：私有觸發檔被篩除，完整恢復仍未完成；下一步查可保留使用者篩選的host invalidation及共用cache生命週期。58historical/54fixed/4unresolved、65checked/10blocked；完整hosts/maps/gates/benchmarks與0038身分暫停保持。目標active；本批未提交／推送。[檢查](evidence/0190-progress-checks.json)；[批次](batches/0190-build-watch-startup-recovery.md)；[前次交接](progress-history-0190-watch.md)。
