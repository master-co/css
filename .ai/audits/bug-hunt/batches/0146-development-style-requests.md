# 0146 Development stylesheet requests

- HEAD `eb6b479a3998aebc37af18523a1458225909d9dc`；起始172項來源雜湊全部相符，index空。上一goal turn修復0145 Modules HMR並完成證據，屬有效進展。
- 限定普通CSS／Sass的normal、inline、raw、url開發請求及編輯更新；沿用BH-0004交付工作，不將其他未完成邊界縮減為本矩陣。
- 本批修復共用manifest hook吞掉stylesheet/query HMR；最終96browser為93PASS／3managed Sass URL更新FAIL。**Sass URL與0144巢狀缺檔恢復仍未完成。**

## 證據與分類

| 證據 | 結果／結論 |
|---|---|
| `0146-dev-requests-first.log` | 16個hosts（CSS/Sass × normal/inline/raw/url × pure/managed）、每個初始與更新三browser，共96觀測57PASS／39FAIL；包含URL oracle與啟動boot判定問題，不能把39筆全列產品bug。 |
| `0146-pure-inline-oracle.log` | 加入expected bootID／分項correct後，單獨pure inline6PASS；第一版pure部分畫面正確卻FAIL，未據此宣稱產品bug。 |
| `0146-url-corrected.log` | `?url`原先用text/plain請求並要求raw source；pure Vite實際回傳JS stylesheet module。改用text/css与真正link stylesheet載入／computed styles，屬腳本語意修正。 |
| `0146-managed-css-update-confirmed.log`、`0146-managed-css-trace.log` | 普通managed CSS更新再次失敗；沒有green來源transform，hot-update收到modules空陣列。 |
| `0146-managed-hook-trace.log` | `master-css:virtual-module:manifest`將傳入stylesheet節點清成空陣列；之後各hook無原更新節點可用。 |
| `0146-internal-hmr-before.log` | 兩個新internal回歸FAIL：沒有virtual manifest時丟棄全部modules；有manifest時只保留manifest，漏普通／inline／raw消費者。 |
| `0146-managed-css-after.log` | 修後普通managed CSS六browser PASS，root edit有效且無整頁reload。 |
| `0146-dev-requests-after.log` | 修正腳本與共用hook後，93PASS／3FAIL；所有普通／inline／raw CSS/Sass與CSS URL控制通過。5筆pure-host第一輪bootID不同，作cold-start observation保留；HMR只在完成初始載入後檢查bootID不變。未宣稱cold-start從不reload。 |
| `0146-sass-url-trace.log`、`0146-sass-url-websocket.log` | 剩下3FAIL：Sass URL link載入`/style.scss`，preprocessed direct module的url卻是`/style.scss.css?direct`，CSS HMR payload沿用後者，link不匹配而停留red。source cache已失效、query JS已有更新，不能誤判成相同manifest hook或server缺少file event。 |

## 最終修改

- `packages/internal/src/manifest-virtual-module.ts`保留傳入HMR modules，加入失效的virtual manifest，並以Set去重。即使virtual manifest沒有被import，也不吞掉普通CSS與query更新。
- 不在Vite外層繞過共用hook；兩個直接consumer是Vite與Astro，均完成下游套件驗證。沒有移動CSS語意、改compiler/Rust或新增依賴。
- 新增`packages/internal/tests/bug-hunt-manifest-hmr.test.ts`兩個回歸：virtual manifest存在／不存在，以及既有manifest節點去重；原有未import CSS manifest控制仍維持。
- 新增`vite-dev-style-requests.mjs`；normal驗證自動CSS，inline驗證手動注入前無效果／注入後顏色，raw精確核對作者source，url用text/css與link載入。每次source編輯後仍須對應新內容，更新期間不能整頁reload；trace開關保留每個Master hook及WebSocket payload。
- README／Site contract同步CSS entry更新與inline/raw實測契約，明列Sass URL尚未可靠更新。
- 為保持帳本大小，5個主帳本共20個0141–0144進度段落逐字移至`progress-history-0146.md`；段落SHA-256記於`0146-history-preservation.json`。最新狀態、批次索引與其他進度未刪除。

## 驗證與保存

- internal18tests（新增2）、Vite160tests、Astro15tests PASS。
- internal、Vite、Astro lint／type-check／build PASS；Vite與Astro範例build PASS。Astro原sitemap缺site設定warning保留，沒有新增設定或依賴。
- 普通CSS trace修後6PASS、Modules HMR18PASS；完整request96觀測仍93PASS／3FAIL，不合併掩蓋failed需求。
- Site prepare/lint及AI budget等terminal結果見本批final-checks；本批Site只修改文字。
- 五项compiler／engine／runtime artifact hashes及raw／gzip／brotli與0145相同；無runtime效能或payload改善宣稱。
- 四個root gates仍未完成；本次未改public surface／Rust契約，不refresh golden，保留既有API失敗證據。

## 直接接續的下一步

1. 修正development Sass `?url`的direct stylesheet HMR路徑歸屬。先確認Vite公開module graph／URL mapping能力，讓更新對應實際link URL；不要修改host內部ModuleNode資料、全域攔截錯誤或以reload繞過HMR要求。
2. 重跑`BH_REQUEST=url BH_EXTENSION=scss BH_MANAGED=1 BH_TRACE=1 node .ai/audits/bug-hunt/repros/vite-dev-style-requests.mjs`；修後需6browser與完整request96控制，且驗證base/alias/外部root等URL邊界。
3. 接續Module request modes、普通Sass partial／來源與resource/reference ownership、其他preprocessor/PostCSS、multi-root／SSR/shared environment、完整published maps與Webpack；0144巢狀缺檔host終止保持未完成。
4. 原Webpack3build／12browser、legacy39browser失敗及所有其他finding/coverage/gate要求仍保留。45歷史findings為33fixed／12unresolved；75coverage為65checked／10blocked；4root gates／4候選。
5. 0038追加驗證仍等待使用者明確確認身分驗證通過；本批不commit／push，保留其他對話變更。記錄host限制與這些失敗不代表完成整體目標。
