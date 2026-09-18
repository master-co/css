# 0259 Previous checkpoint archive

以下0258交接與受影響列逐字保留。

- 0258：依授權promote 0232–0256整套候選到主工作樹，分3個產品commit（`9d1910e24` Rust `preserve_native_source`＋binding、`879b58d96` compiler公開API與rendered resource context、`5810c71ed` Next PostCSS／module graph管線），含先前待授權的`nextGraphDeliveryTests`四檔。候選分叉點`7edc87136`與主工作樹0251–0253 perf三方合併無衝突，另補套`native_source.rs`的`SourceIndex` hunks避免BH-0062二次成本回歸。驗證：cargo fmt／clippy／357tests／codegen／parity、compiler 57files/428tests、next 24files/152tests＋3e2e、28套件build全PASS；BH-0063在主工作樹實際host雙bundler雙瀏覽器PASS。vite 23／nuxt 3／webpack 2／wasm 2為serial對照下與baseline完全相同的既有失敗，promote未新增失敗。BH-0063改為已修復：63historical／59fixed／4unresolved。[證據](evidence/0258-final-checks.json)；[批次](batches/0258-promote-next-candidate.md)；[前次](progress-history-0258-promote.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0258 候選已交付主工作樹：lint／type-check／24files/152tests／3e2e PASS，BH-0063實際host雙bundler雙瀏覽器PASS；0249 late資源dev 20步驟；0248 watch16步驟 | Turbopack combined-root PostCSS／late resource契約不存在，待設計；BH-0004完整public／host graph遷移未完成 | [0258](batches/0258-promote-next-candidate.md)；[0257](batches/0257-next-candidate-promote-feasibility.md)；[0256](batches/0256-next-turbopack-module-animation.md) |
