# 0151 Live reconnect 與 middleware restart

## 範圍及狀態

- 接續0150的live reconnect與middleware生命週期；普通server限定驗證完成，middleware產品問題仍未修復，不能將本批查核收尾視為BH-0004完成。
- 本批開始HEAD45747c24a；中途使用者授權僅提交已完成0147–0150帳本，HEAD變為8d40735be。0151材料、產品及其他對話修改均未被該commit納入。
- 本批只改共用重現腳本、新增最小actual-server測試及帳本；正式產品、既有fixtures/snapshots、依賴、lockfile、CI/release保持原樣。0038追加驗證仍須使用者明確確認身分驗證通過。

## 可重現證據

### 一般server的live reconnect

- `BH_LIVE_RESTART=1`保留頁面連線，restart後不以page.goto替代重連。每次main-frame navigation記錄序號，並等待該navigation收到Vite WebSocket connected訊息。
- generation由transformIndexHtml的記憶體狀態產生；不提前寫index.html觸發額外reload。restart必須換bootID；之後partial edit必須保持bootID、更新CSS。兩個獨立factory/root中，未編輯root持續purple。
- 首輪48browser／16SSR outputs PASS；連續兩次restart72browser／24SSR PASS；目前腳本重跑`0151-live-final.log`再次72browser／24SSR PASS。SSR每份輸出分別在三瀏覽器shadow root渲染，避免blue／#00f序列化誤判。
- 三瀏覽器、pure Vite／managed皆覆蓋initial、partial edit、restart、再edit、第二次restart及再edit。此證據不替代同plugin instance並行重用、custom environments或其他host。

### Middleware失敗與診斷控制

- 外部Node HTTP server持有Vite middleware及WebSocket server。初輪pure控制36browser／12SSR PASS，managed initial/edit12browser／4SSR PASS，第一次restart後#target消失。完整輸出49browser rows包含48成功觀測與1個host-error，不能當作49個完整瀏覽器比較。
- `0151-middleware-browser-diagnostic.log`於目前腳本重跑managed，12成功browser觀測／4SSR後再次出現1個host-error。三瀏覽器皆收到edited root的HTTP404；Chromium/WebKit空body，Firefox錯誤頁。獨立root的頁面內容仍保留。失敗頁面／URL／response error均留原始log。
- 新測試`packages/vite/tests/plugins/bug-hunt-middleware-restart.test.ts`使用actual Vite server、真Sass及SSR inline load；正常執行pure PASS、managed FAIL，重啟後HTML／CSS為404，SSR回報`Scanner context was not initialized`。
- 公開plugin hook passthrough記錄：configResolved:0 → buildStart:client:0 → configResolved:1 → buildStart:client:1 → closeBundle:ssr:0及closeBundle:client:0。最後兩者順序可能並行變化，但皆屬舊config且發生於新server buildStart後。
- `BH_SKIP_RESTART_DISPOSE=1 BH_TRACE_TEST=1`僅在測試中略過舊config的scanner closeBundle；新config最終close仍呼叫原hook。兩個actual-server案例通過，含HTML、CSS及SSR編輯更新。這是定位用控制，不是產品修復；也未證明略過dispose是可接受的生命週期設計。
- 目前`scanner.ts`的closeBundle直接清除共用context.scanner及context.stylesheets；`ensureScanner`以context為key並直接重用既有scanner。新server初始化後舊環境的清理會影響共用資源，與缺少scanner及控制結果一致。必須分開追蹤scanner與stylesheet collection所有權，不能只靠重試HTTP補初始化。

## 測試／觀察錯誤分開記錄

- 初版pure控制在writeFile後立即讀CSS，讀到舊red；改等待實際CSS與SSR都更新green後pure通過。不是pure Vite產品bug。
- 外部HTTP final callback原先未處理error，已補500/error body分支；但修正後實際仍404，所以「錯誤被callback誤報404」的早期推測撤回，不能用來解釋本次404。
- middleware stack的ServerHandle不一定是函式；診斷`.name`使首次type-check TS2339。加typeof guard後lint/types通過，屬新增測試型別錯誤。
- 原始失敗日誌皆保留；skip-old-close的2PASS不得替代正常模式的managed失敗。

## 驗證及保存

- 全Vite167PASS／1FAIL（31files／168tests），唯一失敗為新增managed middleware案例；新增pure控制通過，既有166tests通過。lint/type-check PASS。
- 來源／產物SHA-256、AI budget、whitespace及命令終態見`../evidence/0151-final-checks.json`。
- 五產物只重新核對byte length及SHA-256；相同bytes沿用既有gzip/brotli大小，未宣稱重新壓縮。
- 不重跑未受影響的產品build、範例或Site；本批沒有產品／Site修改，不沿用0150通過結果宣稱middleware已修復。

## 可直接接續

1. 修復前先補scanner與stylesheet collection按ResolvedConfig／server generation擁有資源的設計；舊client／SSR closeBundle必須只清理舊資源，且重複close冪等。檢查失敗init、重複restart及server列表／scanner event listeners。
2. 保留本批正常模式失敗測試與skip-old-close定位控制；正式修復後必須讓未略過清理的測試及middleware live browser矩陣通過，再跑Vite scoped回歸、lint/types/build與範例。
3. 接續custom environments、同plugin instance重用、多root／SSR共享、resource/reference ownership、其他preprocessor/PostCSS、完整published maps與Webpack。
4. BH-0004繼續未完成；0144巢狀CSS Modules缺檔host終止、0148Modules?url未交付、Webpack3build／12browser及legacy39browser失敗仍保留。總數33fixed／12unresolved、65checked／10blocked、4root gates／4候選；0038身分暫停不變，目標active。
