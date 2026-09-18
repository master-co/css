# 0251 Previous checkpoint archive

以下0250交接與受影響列逐字保留。

## README.md

- 0250：量測owned副本resource hook成本，定位為compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數二次成長（800純CSS規則2.0s、preserveNativeSource 72.5s），profile 90%在native binding，來源索引每規則從頭掃描。新增BH-0062（P1未修復）；62historical／57fixed／5unresolved。無產品變更。[證據](evidence/0250-final-checks.json)；[批次](batches/0250-compiler-rule-count-scaling.md)；[前次](progress-history-0250-compiler-rule-count-scaling.md)。

## coverage.md

- 0250：量測owned副本resource hook成本，定位為compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數二次成長（800純CSS規則2.0s、preserveNativeSource 72.5s），profile 90%在native binding，來源索引每規則從頭掃描。新增BH-0062（P1未修復）；62historical／57fixed／5unresolved。無產品變更。[證據](evidence/0250-final-checks.json)；[批次](batches/0250-compiler-rule-count-scaling.md)；[前次](progress-history-0250-compiler-rule-count-scaling.md)。

| CRATE-mastercss-compiler | `crates/mastercss-compiler` | 高 | 已檢查 | 0092: Rust34/TS126/lint/clippy/native-Wasm and96browser comparisons PASS; BH-0004 local conditions repaired  0112: native/Wasm10 and60browser comparisons identify21cascade failures/18typed refusals;| BH-0004 nested unresolved imports/cascade remains incomplete; Windows live filesystem  0114 public graph126browser/50Rust/153hostPASS; legacy source graph still39FAIL. Full boundary-preserving external CSS delivery and URL bases remain required;| [0092](batches/0092-import-conditions.md)  [0112](batches/0112-external-import-order.md) [0113](batches/0113-stylesheet-boundaries.md) 0250：BH-0062規則數二次成長已確認（800rules 2.0s／preserveNativeSource 72.5s），未修復。[0250](batches/0250-compiler-rule-count-scaling.md) |

## findings.md

- 0250：量測owned副本resource hook成本，定位為compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數二次成長（800純CSS規則2.0s、preserveNativeSource 72.5s），profile 90%在native binding，來源索引每規則從頭掃描。新增BH-0062（P1未修復）；62historical／57fixed／5unresolved。無產品變更。[證據](evidence/0250-final-checks.json)；[批次](batches/0250-compiler-rule-count-scaling.md)；[前次](progress-history-0250-compiler-rule-count-scaling.md)。

| BH-0062 | P1 | 已確認 | Stylesheet compile 對規則數二次成長，preserveNativeSource 再放大 10–35 倍 | `variant.rs` `byte_offset_for_location`／`source_location`與lexer `byte_to_utf16_offset`每次從來源開頭掃描，`output_mappings.rs` Mapper每mapping呼叫4次、native_style／pattern每規則呼叫。純CSS 200／400／800規則109／387／1450ms；profile 90%在native binding。[0250](batches/0250-compiler-rule-count-scaling.md) |

## changes.md

- 0250：量測owned副本resource hook成本，定位為compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數二次成長（800純CSS規則2.0s、preserveNativeSource 72.5s），profile 90%在native binding，來源索引每規則從頭掃描。新增BH-0062（P1未修復）；62historical／57fixed／5unresolved。無產品變更。[證據](evidence/0250-final-checks.json)；[批次](batches/0250-compiler-rule-count-scaling.md)；[前次](progress-history-0250-compiler-rule-count-scaling.md)。

## report.md

- 0250：量測owned副本resource hook成本，定位為compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數二次成長（800純CSS規則2.0s、preserveNativeSource 72.5s），profile 90%在native binding，來源索引每規則從頭掃描。新增BH-0062（P1未修復）；62historical／57fixed／5unresolved。無產品變更。[證據](evidence/0250-final-checks.json)；[批次](batches/0250-compiler-rule-count-scaling.md)；[前次](progress-history-0250-compiler-rule-count-scaling.md)。
