# 0253 Previous checkpoint archive

以下0252交接與受影響列逐字保留。

## README.md

- 0252：BH-0062第二階段：`SourceIndex`貫穿native／managed lowering與資源引用，移除只剩測試用的掃描函式；擴充scaling回歸（0251基準compose 4000規則128.6s FAIL→1.55s PASS）、Rust 140tests／clippy／fmt／codegen、0242候選＋patch compiler428／Next151 PASS；`@compose` 800規則562→76ms、url() 153→15ms。manifest合併仍超線性，待查。[證據](evidence/0252-final-checks.json)；[批次](batches/0252-compiler-lowering-index.md)；[前次](progress-history-0252-compiler-lowering-index.md)。

## coverage.md

- 0252：BH-0062第二階段：`SourceIndex`貫穿native／managed lowering與資源引用，移除只剩測試用的掃描函式；擴充scaling回歸（0251基準compose 4000規則128.6s FAIL→1.55s PASS）、Rust 140tests／clippy／fmt／codegen、0242候選＋patch compiler428／Next151 PASS；`@compose` 800規則562→76ms、url() 153→15ms。manifest合併仍超線性，待查。[證據](evidence/0252-final-checks.json)；[批次](batches/0252-compiler-lowering-index.md)；[前次](progress-history-0252-compiler-lowering-index.md)。

| CRATE-mastercss-compiler | `crates/mastercss-compiler` | 高 | 已檢查 | 0092: Rust34/TS126/lint/clippy/native-Wasm and96browser comparisons PASS; BH-0004 local conditions repaired  0112: native/Wasm10 and60browser comparisons identify21cascade failures/18typed refusals;| BH-0004 nested unresolved imports/cascade remains incomplete; Windows live filesystem  0114 public graph126browser/50Rust/153hostPASS; legacy source graph still39FAIL. Full boundary-preserving external CSS delivery and URL bases remain required;| [0092](batches/0092-import-conditions.md)  [0112](batches/0112-external-import-order.md) [0113](batches/0113-stylesheet-boundaries.md) 0250：BH-0062規則數二次成長已確認；0251修復：來源索引，4000規則84.6s→1.05s，Rust／TS套件PASS。[0251](batches/0251-compiler-source-index.md)；0252 lowering／資源索引，compose 4000規則128.6s→1.55s。[0252](batches/0252-compiler-lowering-index.md) |

## findings.md

- 0252：BH-0062第二階段：`SourceIndex`貫穿native／managed lowering與資源引用，移除只剩測試用的掃描函式；擴充scaling回歸（0251基準compose 4000規則128.6s FAIL→1.55s PASS）、Rust 140tests／clippy／fmt／codegen、0242候選＋patch compiler428／Next151 PASS；`@compose` 800規則562→76ms、url() 153→15ms。manifest合併仍超線性，待查。[證據](evidence/0252-final-checks.json)；[批次](batches/0252-compiler-lowering-index.md)；[前次](progress-history-0252-compiler-lowering-index.md)。

| BH-0062 | P1 | 已修復 | Stylesheet compile 對規則數二次成長，preserveNativeSource 再放大 10–35 倍 | 0251 root新增`source_index.rs`每來源索引；Mapper／native lowering改用，掃描函式語義以窮舉測試固定。HEAD基準4000規則84.6s FAIL→1.05s；0242候選對應patch使800規則rendered 2.0s→17ms、preserveNativeSource 72.5s→96ms，compiler428／Next151 PASS。0252把索引貫穿native／managed lowering與url()引用：compose 4000規則128.6s→1.55s、800規則562→76ms；manifest合併超線性另列待查。[0252](batches/0252-compiler-lowering-index.md)；[0251](batches/0251-compiler-source-index.md)；[0250](batches/0250-compiler-rule-count-scaling.md) |

## changes.md

- 0252：BH-0062第二階段：`SourceIndex`貫穿native／managed lowering與資源引用，移除只剩測試用的掃描函式；擴充scaling回歸（0251基準compose 4000規則128.6s FAIL→1.55s PASS）、Rust 140tests／clippy／fmt／codegen、0242候選＋patch compiler428／Next151 PASS；`@compose` 800規則562→76ms、url() 153→15ms。manifest合併仍超線性，待查。[證據](evidence/0252-final-checks.json)；[批次](batches/0252-compiler-lowering-index.md)；[前次](progress-history-0252-compiler-lowering-index.md)。

## report.md

- 0252：BH-0062第二階段：`SourceIndex`貫穿native／managed lowering與資源引用，移除只剩測試用的掃描函式；擴充scaling回歸（0251基準compose 4000規則128.6s FAIL→1.55s PASS）、Rust 140tests／clippy／fmt／codegen、0242候選＋patch compiler428／Next151 PASS；`@compose` 800規則562→76ms、url() 153→15ms。manifest合併仍超線性，待查。[證據](evidence/0252-final-checks.json)；[批次](batches/0252-compiler-lowering-index.md)；[前次](progress-history-0252-compiler-lowering-index.md)。
