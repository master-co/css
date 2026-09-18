# Previous checkpoints before0200collection audit

The commonfive-ledger checkpoint,BH-0004row andbindingcoverage below are preserved verbatim. Earlierhistory remains linked.

- 0199：已驗證逐檔graph metadata與source目錄，binding24、browser36及原生對照36PASS。當前compiler379PASS/5FAIL；5項legacy輸出仍殘留source/safelist，graph對照5PASS；Wasm舊新版本均3PASS/1FAIL（既有sourceMappings斷言）。三套件lint/types/build、Rustclippy/fmt/codegen/parity與隔離Site通過。下一步同步遷移註冊儲存graph及組合流程，保留reference、manifest合併、pruning與套件開關。60historical/56fixed/4unresolved、10blocked及所有hosts/maps/gates/benchmarks/Site、0038身分暫停維持；目標active，0199未提交。[證據](evidence/0199-final-checks.json)；[批次](batches/0199-graph-directive-metadata.md)；[前次交接](progress-history-0199-metadata.md)。

| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 | 0199metadata/sourceownership已驗證；legacy註冊5policy殘留FAIL，raw20qualified／39external與完整hosts交付未完成。[0199](batches/0199-graph-directive-metadata.md)；[完整歷史](progress-history-0199-metadata.md)。 |

| PKG-binding | `packages/binding` | 高 | 已檢查 | 0006: native/Wasm load/errors/version/cache/disposal; 32 TS tests; Darwin binary ABI smoke  0103: optional HTML attribute source mapping; native/Wasm and focused/full checks PASS;| Release installation; exhaustive host environments | [0006](batches/0006-binding-contracts.md)  [0103](batches/0103-vue-attribute-mapping.md) |
