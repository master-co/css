# Batch 0250: Resource hook cost and quadratic stylesheet compile scaling

## 目前交接點

0249是progress：late資源的dev恢復已驗證，hook效能仍未量測。本批先量測owned 0247副本resource hook的成本，結果指向compiler本身：`compileRenderedStylesheet`／`compileStylesheet`對規則數呈二次成長，與Master指令、theme或var引用無關；`preserveNativeSource`路徑再放大10–35倍。新增BH-0062。本批只新增repro與證據；沒有修改產品、候選、既有測試／fixtures、依賴、CI、release或Site。0038仍暫停。

## 量測（0242 native binding、0244 compiler API）

| 輸入 | rendered | compileStylesheet(preserveNativeCSS) | rendered+preserveNativeSource |
|---|---:|---:|---:|
| 20 rules／10 theme（1.3KB） | 7.7ms | 2.8ms | 63ms |
| 100 rules／60 theme（7KB） | 56ms | 26ms | 1.38s |
| 200 rules（13KB） | 161ms | 74ms | 4.90s |
| 400 rules（26KB） | 551ms | 254ms | 18.5s |
| 800 rules（50KB） | 2.02s | 973ms | 72.5s |

規則加倍時間約×3.4–3.9。形狀對照：純CSS無theme無var 200／400／800 rules為109／387／1450ms，與含var引用（122／442／1633ms）相同量級；單一規則800個宣告只要34ms（線性）；800個`@media`包裹規則4.5s。故成本來自「每條規則」的線性掃描，非規則內容。[cost](../evidence/0250-render-cost-probe.log) [shape](../evidence/0250-shape-probe.log)

CPU profile（400 rules）：`compileCSSStylesheetGraph`47%、`compileCSSDirectives`43%，皆為native binding；preserveNativeSource（200 rules）95%在`compileCSSStylesheetGraph`。TS側不到3%。[profile](../evidence/0250-render-profile.log)

原始碼定位（未修改）：`crates/mastercss-compiler/src/variant.rs`的`byte_offset_for_location`每次呼叫都從來源開頭逐行`find('\n')`再逐字元走到column，`source_location`對prefix重新計算行數與UTF-16欄位，`mastercss-lexer::byte_to_utf16_offset`對prefix重新計算UTF-16長度；`output_mappings.rs::Mapper::anchor`每個mapping呼叫4次、`native_style.rs`與`pattern.rs`每條規則呼叫，合計每條規則O(n)，總量O(n²)。preserveNativeSource產生更多mapping與span。

## Resource hook成本（owned 0247副本，真實loader chain）

| stylesheet | plugins | hook off | hook on | hook renders |
|---|---:|---:|---:|---:|
| 1KB（20 rules） | 0／1／2／4／8 | ≈1ms | 28／38／46／64／94ms | 3／4／5／7／11 |
| 19KB（400 rules） | 0／1／2／4／8 | 8–13ms | 1.9／2.5／3.0／4.3／6.8s | 3／4／5／7／11 |

每次hook render約等於一次rendered compile，因此hook成本＝(plugins Once／OnceExit／RootExit數＋3)×compile成本；在compiler二次成長修正前，中型Module就會讓每次build多數秒。這是BH-0062的放大，不是hook自身的額外複雜度；hook本身仍保留「減少render次數」為後續最佳化項。[hook cost](../evidence/0250-hook-cost.log)

## 帳本

- 新增BH-0062（P1，已確認、未修復）：stylesheet compile對規則數二次成長。61historical→62、57fixed、4→5unresolved。
- report.md：10個已逐字歸檔的P2段落stub合併為一段索引以騰出行數（原文仍在`report-fixed-p2-history-0183.md`），新增BH-0062段落。
- 下一步：0251在Rust建立一次性的來源索引（line starts＋UTF-16前綴），改寫`byte_offset_for_location`／`source_location`／mapping anchor的呼叫端，以`cargo test -p mastercss-compiler`與新增scaling測試驗證，再以owned tmp native binding重跑本批probe對照；不重建shared artifacts。
- 65checked／10blocked、pending approvals不變；goal active。

[Final checks](../evidence/0250-final-checks.json) · [Inventory](../evidence/0250-inventory-summary.json)
