# Historical progress archived during0149

Historical paragraphs are preserved verbatim. Current status remains in each source ledger.

## README.md

- 0140：inline已接renderBuiltUrl的js／css主機映射、runtime URL與URI編碼；修復映射改變卻沿用CSS檔名、relative base的client／SSR資產不一致。Vite131／lint/types/build、最終URL36／paired12／inline84／pruning30／watch18browser全PASS；Site通過（75warnings）。來源序列化仍由Rust負責，automatic hooks／multi-environment／cycles仍待驗證；下一批Sass原始位置對映，再續其他host與Webpack。33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0140](batches/0140-inline-built-urls.md)。 automatic stylesheet hooks、特殊路徑／callback、multi-environment／cycles仍待驗證；HEAD087655705，未提交／推送。

- 0139：修復SSR inline輸出本機file URL及繞過emitAssets設定；改用public base，關閉發布時搭配client資產。Vite125、SSR24build／36browser、Node16loads、worker6及原inline84browser全PASS；Site prepare/lint通過（75warnings）。首輪library格式設定與SSR弱斷言屬harness錯誤。自訂URL映射／maps／其他host與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0139](batches/0139-inline-server-hosts.md)。 下一批驗證自訂URL映射與來源位置對映，續接其他host與Webpack；HEAD087655705，未提交／推送。

- 0138：修復inline無條件發布，依Rust URL參照及實際輸出chunk裁剪子CSS／資源，保留共用anchor。Vite121／lint/types/build、10build／30browser與watch18PASS；純Vite兩筆閒置資源保留列BASELINE。used字串仍有35byte anchor，其他格式／cycles／maps與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0138](batches/0138-inline-asset-pruning.md)。 原inline14build／84browser全PASS；HEAD087655705，未提交／推送。

- 0137：managed CSS／Sass `?inline`改為獨立完整字串，Rust安全展開import並保留namespace／external邊界；修復URL誤改作者字串、IIFE／UMD路徑與graph-only假警告。83Rust／227compiler／118Vite及198public、84inline、90Sass、36watch瀏覽器對照PASS。early WebKit時序、pruning／lazy／其他格式、source maps與Webpack仍待驗證；compiler-Wasm+9642raw／2868gzip／1947brotli，runtime四產物不變。33fixed／12unresolved、10blocked、4root gates／4候選與0038暫停不變；HEAD087655705，未提交／推送。[0137](batches/0137-inline-css-delivery.md)。 下一批先驗證unused／shared／lazy資產與其他輸出主機，再補Sass來源對映、Modules及其他host路徑。

- 0136：Vite Sass入口／匯入改用主機預處理，保留CSS import條件、來源owner與partial依賴；修復additionalData重複、raw解析及CSS Modules匯出，baseFile無custom resolver亦可用。compiler225／Vite114、lint/types/build與原Vite範例通過；原host-inputs13build／78browser全PASS。擴充Sass15build全成功、90browser為84PASS／6managed-inlineFAIL；partial直接／條件／錯誤恢復共54PASS，另驗證一次預期Sass錯誤及原partial路徑。小SVG內嵌造成的network斷言及color格式斷言屬測試錯誤。Site prepare/lint通過（75warnings）；5artifacts與兩root API失敗hash不變。下一步修managed `?inline`完整字串／資產交付，再補preprocessor位置對映、Modules／其他host路徑與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEAD111046867，本批未提交／推送。[0136](batches/0136-vite-sass-sources.md)。

