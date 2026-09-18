# 0263 Previous checkpoint archive

以下0262交接與受影響列逐字保留。

- 0262：BH-0053結案。兩個0243尾隨反例在交付版本重測後歸類為Master以外：per-selector maps方面，`preserveNativeSource`讓compiler階段從6P/4F補到**10P/0F**，但同一payload交給目前安裝Next的`CssMinimizerPlugin.optimizeAsset`後兩種設定都退回6P/4F，殘餘損失在Next的minimizer；持久快取方面，純Next＋最小寫檔loader（完全不載入Master）與Master交付版本同樣在修改source後`Module not found`解析不到剛發布的stylesheet，屬Turbopack持久快取行為。缺陷陳述本身已由0260四組Turbopack Sass對照驗證通過，故改標已修復；native declaration granularity與完整Sass option／host邊界移到PKG-next覆蓋列追蹤。63historical／62fixed／1unresolved（僅剩BH-0004）。[證據](evidence/0262-final-checks.json)；[批次](batches/0262-selector-maps-and-cache-boundaries.md)；[前次](progress-history-0262-selector-maps.md)。

| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 | 0242明確source-preservation選項，Rust124／compiler424及actual4build／8browser通過，預設格式回歸解除。仍為owned候選；global closure／raw20qualified/39external／完整host待續。[0242](batches/0242-source-preservation-api.md)。 |
