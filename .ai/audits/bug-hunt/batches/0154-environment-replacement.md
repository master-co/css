# 0154 Environment replacement 與 per-environment hooks

## 範圍及基線

- 接續0153的替換環境、hook旗標邊界。先驗189個source SHA-256皆一致，HEAD8d40735be；前輪完成修復與驗證，屬有效進展。沿用修復目標，整體BH-0004及0038身分驗證暫停不變。
- 本批以已宣告的edge／ssr名稱建立runnable替換實例，使用公開init(previousInstance,watcher)、server.environments登記、舊close及新listen；不改Vite私有欄位或module graph。

## 三個產品問題及證據

1. **Idle替換實例沒有被保留**：新實例尚未第一次載入模組，舊edge／client／ssr關閉時便dispose共用scanner。最初pure兩case PASS，managed在per-environment hooks開／關皆FAIL（0154-replacement-before.log）。現在清理時讀取該config的公開server registry，加入新實例，並以closed WeakSet避免將留在registry的已關閉實例重新加入。新舊config仍分開，registry getter核對原config，避免restart後舊server物件指向新config造成污染。
2. **HMR listeners重複**：開啟server.perEnvironmentStartEndDuringDev後，client／SSR／edge buildStart各登記一次，change listener由1變3（0154-listeners-before.log）。現在每個scanner只附加一次reset／change listeners；scanner更新代次仍可附加新listeners。
3. **晚啟動server environment清掉client Sass依賴**：client stylesheet先載入，再讓edge載入不同CSS；hooks開啟時Sass buildStart重新清掉共用cache，編輯client partial不送HMR（0154-sass-cache-before.log）。開發模式改在configureServer清一次，build模式仍逐次buildStart清理；其他環境啟動保留既有依賴追蹤。

## 不採用的嘗試及測試錯誤

- 第一個產品嘗試使用applyToEnvironment登記環境，仍2FAIL。已核對安裝中的Vite8.2.2：該hook在config解析時收到PartialEnvironment，真正DevEnvironment.init重用已解析plugins，不重新呼叫hook。已移除此嘗試，最終方案不依賴它。原始實作摘錄及SHA見0154-vite-api.json。
- Spy context型別為unknown使首次type-check TS18046；新增instanceof檢查後通過，屬新測試型別錯誤。
- 讀取剛建立但仍空白的standalone log時，狀態觀察腳本發生IndexError；沒有重啟browser collector或將觀察失敗當成產品／測試失敗。記錄見0154-observation-error.json。

## 修改及驗證

- 修改Vite scanner/context、HMR及Sass source四個產品檔；擴充既有custom environment重現腳本；新增8個actual-server tests。Vite README與Site現有directive contract同步idle replacement及hooks行為。
- 最終28個聚焦測試、lint／type-check／build PASS。正常清理模式驗證idle replacement在其他環境關閉後仍可首次載入及更新stylesheet，最後才dispose一次；listener數量在其他環境啟動後仍為1；晚啟動edge不影響client Sass partial更新。
- Browser replacement：hooks關／開各48browser／32SSR outputs；hooks開啟的獨立close48browser／20SSR outputs。pure／managed、edge／ssr、三browser、兩次partial更新全部PASS，bootID不變，無HTTP/page錯誤或server channel的browser CSS payload。
- Middleware／一般server連續兩次restart各72browser／24SSR outputs PASS。全部最終矩陣共288browser／132SSR outputs，每份SSR在三browser shadow root渲染。未混用中途產品版本，最終build完成後才執行這些矩陣。
- 完整Vite187tests／35files、Site prepare/lint（0errors／75warnings）及Vite範例build皆PASS；命令終態、來源／五產物SHA、AI budget／whitespace見0154-final-checks.json。既有fixtures/snapshots、依賴、lockfile、CI/release與其他對話Site變更保留。

## 接續及限制

1. 下一批驗證同一plugin instance並行多root／server的context與輸出隔離；本批僅同一config中替換已宣告環境，不替未宣告環境名稱、任意第三方environment或共用instance並行背書。
2. 繼續resource內容變更／reference ownership、其他preprocessor/PostCSS、完整published maps及Webpack交付。
3. 0144巢狀CSS Modules缺檔host終止、0148Modules?url未交付、Webpack3build／12browser與legacy39browser失敗仍未完成。33fixed／12unresolved、65checked／10blocked、4root gates／4候選及0038身分暫停維持；目標active，本批未commit／push。
