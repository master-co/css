# 0252 Previous checkpoint archive

以下0251交接與受影響列逐字保留。

## README.md

- 0251：BH-0062已修復：root compiler新增每來源一次的line／UTF-16索引供mapping anchor與native lowering共用；窮舉對照測試、新scaling回歸（HEAD基準4000規則84.6s FAIL→1.05s PASS）、Rust全套件／clippy／fmt／codegen PASS；0242候選＋修正的compiler428／Next151／e2e3／真實Webpack PASS，800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms。62historical／58fixed／4unresolved。[證據](evidence/0251-final-checks.json)；[批次](batches/0251-compiler-source-index.md)；[前次](progress-history-0251-compiler-source-index.md)。

## coverage.md

- 0251：BH-0062已修復：root compiler新增每來源一次的line／UTF-16索引供mapping anchor與native lowering共用；窮舉對照測試、新scaling回歸（HEAD基準4000規則84.6s FAIL→1.05s PASS）、Rust全套件／clippy／fmt／codegen PASS；0242候選＋修正的compiler428／Next151／e2e3／真實Webpack PASS，800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms。62historical／58fixed／4unresolved。[證據](evidence/0251-final-checks.json)；[批次](batches/0251-compiler-source-index.md)；[前次](progress-history-0251-compiler-source-index.md)。

| CRATE-mastercss-compiler | `crates/mastercss-compiler` | 高 | 已檢查 | 0092: Rust34/TS126/lint/clippy/native-Wasm and96browser comparisons PASS; BH-0004 local conditions repaired  0112: native/Wasm10 and60browser comparisons identify21cascade failures/18typed refusals;| BH-0004 nested unresolved imports/cascade remains incomplete; Windows live filesystem  0114 public graph126browser/50Rust/153hostPASS; legacy source graph still39FAIL. Full boundary-preserving external CSS delivery and URL bases remain required;| [0092](batches/0092-import-conditions.md)  [0112](batches/0112-external-import-order.md) [0113](batches/0113-stylesheet-boundaries.md) 0250：BH-0062規則數二次成長已確認；0251修復：來源索引，4000規則84.6s→1.05s，Rust／TS套件PASS。[0251](batches/0251-compiler-source-index.md) |

## findings.md

- 0251：BH-0062已修復：root compiler新增每來源一次的line／UTF-16索引供mapping anchor與native lowering共用；窮舉對照測試、新scaling回歸（HEAD基準4000規則84.6s FAIL→1.05s PASS）、Rust全套件／clippy／fmt／codegen PASS；0242候選＋修正的compiler428／Next151／e2e3／真實Webpack PASS，800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms。62historical／58fixed／4unresolved。[證據](evidence/0251-final-checks.json)；[批次](batches/0251-compiler-source-index.md)；[前次](progress-history-0251-compiler-source-index.md)。

| BH-0062 | P1 | 已修復 | Stylesheet compile 對規則數二次成長，preserveNativeSource 再放大 10–35 倍 | 0251 root新增`source_index.rs`每來源索引；Mapper／native lowering改用，掃描函式語義以窮舉測試固定。HEAD基準4000規則84.6s FAIL→1.05s；0242候選對應patch使800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms，compiler428／Next151 PASS。[0251](batches/0251-compiler-source-index.md)；[0250](batches/0250-compiler-rule-count-scaling.md) |

## changes.md

- 0251：BH-0062已修復：root compiler新增每來源一次的line／UTF-16索引供mapping anchor與native lowering共用；窮舉對照測試、新scaling回歸（HEAD基準4000規則84.6s FAIL→1.05s PASS）、Rust全套件／clippy／fmt／codegen PASS；0242候選＋修正的compiler428／Next151／e2e3／真實Webpack PASS，800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms。62historical／58fixed／4unresolved。[證據](evidence/0251-final-checks.json)；[批次](batches/0251-compiler-source-index.md)；[前次](progress-history-0251-compiler-source-index.md)。

## report.md

- 0251：BH-0062已修復：root compiler新增每來源一次的line／UTF-16索引供mapping anchor與native lowering共用；窮舉對照測試、新scaling回歸（HEAD基準4000規則84.6s FAIL→1.05s PASS）、Rust全套件／clippy／fmt／codegen PASS；0242候選＋修正的compiler428／Next151／e2e3／真實Webpack PASS，800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms。62historical／58fixed／4unresolved。[證據](evidence/0251-final-checks.json)；[批次](batches/0251-compiler-source-index.md)；[前次](progress-history-0251-compiler-source-index.md)。
