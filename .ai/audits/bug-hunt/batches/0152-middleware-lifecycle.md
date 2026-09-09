# 0152 Middleware restart 資源生命週期

## 範圍及修復

- 接續0151的實際middleware restart失敗。HEAD8d40735be；依既有修復目標處理Vite adapter生命週期，維持BH-0004整體未完成。0038身分驗證暫停不變，本批未commit／push。
- 先核對0151的185個source SHA-256皆一致，index為空。只更動Vite三個產品檔、兩份已有文件，新增兩個最小測試檔；既有fixtures/snapshots、依賴、lockfiles、CI/release與其他對話Site變更保留。

## 根因及證據

- 0151正常模式的managed middleware重啟後HTML／CSS404、SSR缺scanner；pure對照通過。公開hook trace顯示新config的buildStart完成後，舊config的client／SSR才執行closeBundle。略過舊清理的定位控制通過，但不構成產品修復。
- 原scanner初始化及closeBundle共用單一context；舊server關閉會清空新server使用的scanner與stylesheet collection。現在以ResolvedConfig記錄scanner狀態，config切換先保存舊collection，closeBundle透過公開environment.getTopLevelConfig只釋放所屬config資源。
- 同一config並行初始化共用promise；重複close共用dispose promise；關閉時等待尚未完成的init再釋放。失敗init會釋放scanner並允許重試，舊init完成不會覆蓋當前scanner。後續build仍可重建同config的scanner。
- 首次修復即讓middleware正常模式與Sass環境／舊scanner回歸13tests通過；新增四個資源生命週期測試後17tests／lint/types通過。
- 另新增HMR server保留測試：原本重啟後scanner change仍呼叫已關閉server.reloadModule，`0152-hmr-retention-before.log`確認1FAIL。HMR server改按config登記，舊config close時刪除其登記；修後25個聚焦測試通過。

## 最終驗證

- Vite完整173tests／33files PASS，包含0151原本失敗的middleware案例。新增5tests：四個scanner生命週期、1個HMR server移除；既有測試／snapshot皆未改。
- Vite lint／type-check／build PASS，完整測試在最終產品版本上執行。最終正常模式沒有使用BH_SKIP_RESTART_DISPOSE。
- Middleware與一般server分別以pure Vite／managed、兩個獨立factory/root、Chromium／Firefox／WebKit、連續兩次restart與後續partial edit驗證。各72browser／24SSR outputs PASS，共144browser rows／48SSR outputs；每份SSR各在三browser shadow root渲染。
- 保持頁面連線，不用page.goto代替restart重連；每次reload有新bootID及該navigation的WebSocket connected訊息，後續edit保持bootID。未編輯root保留purple，SSR channel沒有browser CSS更新，舊stylesheet URL不再收到更新。
- `0152-middleware-browser-first.log`為只修scanner後的72browser／24SSR PASS；最終兩矩陣是在HMR登記修正及最終build後重跑，不能混用中間版本。
- Vite README與Site既有directive contract同步已驗證的重啟／middleware行為；Site prepare/lint與原Vite範例build結果皆PASS（Site 0errors／75warnings），詳見final-checks。
- Source／artifact hashes、AI budget、whitespace與全部job終態見`../evidence/0152-final-checks.json`。五產物僅重驗原始bytes／SHA-256，相同bytes沿用gzip/brotli大小，未聲稱新壓縮量測。

## 接續及限制

1. 本批限定middleware與一般server restart修復完成；同plugin instance並行重用、custom environment單獨關閉、多root／SSR共享等尚未完整驗證，不能由兩個獨立factory/root推論全部安全。
2. 接續資源內容變更／reference ownership、其他preprocessor/PostCSS、完整published maps與Webpack交付。
3. 0144巢狀CSS Modules缺檔host終止、0148Modules?url未交付、Webpack3build／12browser及legacy39browser失敗仍未完成；未改主機私有loader／module graph，也未以略過清理或捕捉全域錯誤結案。
4. BH-0004整體保持未完成，固定ID不新增替代：33fixed／12unresolved、65checked／10blocked、4root gates／4候選。兩root API既有失敗未刷新，其他gates及0038身分暫停不變；目標active。
