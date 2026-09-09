# 0155 共用插件的多 root 隔離

## 範圍、基線與進度

- 接續0154，同一個Master CSS插件陣列用於多個並行Vite root／server／build。批次前190個來源雜湊一致；0155中途使用者授權提交已完成0151–0154查核，HEAD現為9aefc18ac；產品與0155材料未提交。上輪完成提交與保存核對，屬有效進展。
- 本批限定的多root隔離修正與驗證完成；197tests／37files及三瀏覽器建置後套件矩陣通過。BH-0004整體交付仍未完成。

## 重現與實作

- 原始actual-server測試：各自factory控制PASS；共用同一陣列時第二root CSS包含red與green，1PASS／1FAIL，見0155-shared-roots-before.log。
- core每個ResolvedConfig建立一組完整插件closures，包括scanner、stylesheets、manifest、renderer與HMR；插件名稱、mode組成與hook order/filter保留。新scoped-plugins helper以config／server／HTML context路由全域hooks，applyToEnvironment為環境提供綁定設定的hook包裝。
- 部分Rolldown hook（實測resolveFileUrl）沒有this.environment；使用Node AsyncLocalStorage傳遞此次呼叫所屬config，涵蓋await與並行呼叫，且保留消費者在原Plugin物件上加的hook包裝。只有單config時才容許無context的直接hook呼叫；多config缺乏歸屬時明確報錯。
- InlineStylesheet原始base由config hook保存為Symbol metadata，經Vite config merge傳至resolved config；保留SSR中被Vite正規化的空字串／相對base。未新增公開options／exports或修改Rust語義。

## 中途失敗分類

1. 初版全測184PASS／5FAIL：context-free pre-render hook取到未初始化template；修正首個config與template共用狀態，7focused PASS。
2. 首輪共用build的resolveFileUrl缺少environment，無法選root；改由applyToEnvironment綁定呼叫設定。安裝中的Vite8.2.2原始碼及SHA見0155-vite-api.json。
3. 直接以原始owned plugins替換造成消費者的Sass hotUpdate包裝被跳過；既有pending URL registration測試60000ms timeout。保留公開plugin hook包裝後該測試及其他聚焦測試通過，無改既有測試。
4. 新SSR/client測試最初一邊經HTML入口、一邊純JS，managed class使用圖不同，卻要求完整CSS graph檔名相同。統一JS入口後相對／空／absolute bases及config-file／post-config merge四cases通過；原始錯誤log保留。
5. 新測試編輯少一個右大括號造成語法錯誤；helper新hook物件展開TS2698以已檢查HookObject型別修正。皆為本次測試／實作錯誤，非既有產品finding。

## 另一條仍未完成的產品路徑

- qualified本地import的子檔保留external import時，pre-render與progressive在manifest載入階段拋「Cannot inline a qualified CSS import containing unresolved imports」。獨立factory對照也各FAIL，static／runtime PASS；見0155-qualified-import-control.log。這是BH-0004尚未完成的host/graph交付，不是共用instance根因，也不算環境阻礙或已完成。
- 直接接續命令：`BH_QUALIFIED=1 BH_INDEPENDENT=1 node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-vite test --run tests/plugins/bug-hunt-shared-plugin-builds.test.ts -t 'concurrent HTML'`。目前一般隔離case採已支援的可解析子檔，qualified選項保留失敗重現。
- 下一步追PreRenderPlugin.loadCSSManifest中loadProjectManifest／collectStylesheetEmittedGlobals的舊圖譜路徑；需獨立批次證明保留條件／外部import與正確hydration，而非移除或拒絕輸入。

## 最終驗證與保存

- 最終Vite197tests／37files PASS（較0154新增10tests），兩檔focused11 PASS；lint與type-check修正後PASS，Vite套件build及原Vite範例build PASS。型別斷言修正無執行碼差異。Site prepare/lint PASS，既有75warnings／0errors。
- 共用／獨立factory × 一般／middleware四組矩陣，各72browser／24SSR outputs PASS；連續兩次live restart核對WebSocket重連、root隔離、原頁面bootID與新stylesheet路徑。SSR輸出各在三browser shadow root實際渲染。
- per-environment hooks開啟的idle replacement控制48browser／32SSR outputs PASS；舊環境關閉後新實例仍能首次load與更新。
- static／runtime／pre-render／progressive四模式各兩root並行build，再用同一陣列重新build；共16build／48browser PASS。實際驗證component color、utility padding、資源HTTP bytes及URL root，並檢查頁面／HTTP錯誤。總計384browser／128SSR outputs與16build全PASS；browser command terminal狀態見0155-browser-commands.json。
- 190基線來源：修改core／inline-stylesheet、兩份文件與既有repro，共5檔；185其餘來源不變。新增scoped helper、兩個測試檔、browser repro，合計194source SHA。五個Wasm/runtime/manifest產物byte-identical；壓縮大小沿用相同bytes的舊測值。
- 0152–0154共用交接3段／15出現逐字歸檔至progress-history-0155.md；原始批次與logs不覆寫。AI budget、來源保存、未預期變更與命令終態見0155-final-checks.json。其他對話Site變更、依賴、lockfile、fixtures/snapshots與CI/release保留；index為空，本批未commit／push。

## 接續與未完成範圍

- 下一批先修正上述pre-render／progressive qualified import路徑；獨立與共用factory都要驗證，保留正確CSS graph、條件、資源及hydration。
- 同一resolved config的並行production environments／worker與其他Vite版本尚未驗證；本批並行build是分別解析的多config，不替這些範圍背書。
- BH-0004整體、12unresolved、10blocked、4root gates、4候選，以及0038等待使用者明確確認身分驗證仍維持。其他preprocessor/PostCSS、完整maps、資源／reference與Webpack等原有未完成項目保留。
