# 0147 Sass stylesheet URL HMR

- 本批起始來源承接0146（175項）；目前HEAD `45747c24a`。上一輪完成0143–0146帳本提交與118檔保存核對，屬有效進展。本批不提交／推送。
- 限定development Sass `?url` stylesheet在來源編輯後更新；沿用BH-0004，其他finding、coverage與交付要求不縮減。
- 0146的三個browser更新失敗已在本批修復；此結果不代表完整BH-0004結案。

## 根因與修改

Vite 8.2.2將原始`/style.scss`解析至預處理CSS代理後，public module graph的url正規化成`/style.scss.css?direct`。CSS HMR client以更新路徑匹配實際link；原路徑不一致，stylesheet停留舊顏色。

`packages/vite/src/plugins/sass-source.ts`使用public configureServer middleware觀察成功的text/css回應，移除base後保留實際編碼pathname；經public getModuleByUrl找回prepared Sass owner。原有HMR失效所有相關代理後，再向client發送匹配已服務pathname的css-update。graph查詢保留原query並補bare `?direct`；不修改ModuleNode、Vite private maps、client碼或全域錯誤處理。

新增`bug-hunt-sass-url-hmr.test.ts`兩項真實devserver回歸：根base與nested base，核對成功CSS回應、public websocket更新路徑及編輯後CSS。Vite README與Site既有directives contract同步說明；該目錄目前沒有content.mdx，不重建舊文件。

## 可重現證據與分類

| 證據 | 結果／範圍 |
|---|---|
| `0147-sass-url-first.log`、`0147-sass-url-tests-first.log` | 初版來源修正：6browser與2focused tests PASS；初版browser在兩輪間重插link，不能單憑此宣稱持續link HMR。 |
| `0147-persistent-link.log` | 修正oracle：link從初始載入保留至編輯，核對computed color、link數量與bootID；6PASS。 |
| `0147-tracking-disabled-control.log` | 同一目前產品與修正oracle，僅在重現host停用Sass plugin configureServer tracking：6觀測3PASS／3更新FAIL。屬功能停用對照，不宣稱歷史checkout重建。 |
| `0147-url-relative-nested.log`、`0147-url-encoded-nested.log` | 巢狀base、中文與空白檔名各6PASS。 |
| `0147-url-alias-nested.log`、`0147-url-external-nested.log`、`0147-url-alias-error.log` | 初版精確alias `@audit-style`不匹配`@audit-style?url`，entry import-analysis HTTP500。不能列產品bug。 |
| `0147-alias-pure-invalid-control.log` | 同一错误alias在pure Vite亦6FAIL，確認主機設定問題。 |
| `0147-url-alias-corrected.log`、`0147-url-external-corrected.log` | 改目錄alias `@audit/style.scss?url`；root內alias及fs.allow外部root，各6PASS；產品碼未因alias腳本錯誤改動。 |
| `0147-url-repeat.log` | nested base＋中文／空白path，持續link連續red→green→blue；三browser共9PASS，無整頁reload。 |
| `0147-requests-final.log` | CSS/Sass × normal/inline/raw/url × pure/managed，初始／更新三browser：96PASS。URL消費者保持同一stylesheet跨編輯，其他request oracle不變。 |
| `0147-modules-control.log` | managed entry CSS/Sass Modules、巢狀composes，初始／leaf／root更新：18PASS。 |

最終repro新增BH_BASE、BH_PATH（relative/alias/external/encoded）、BH_REPEAT及BH_NO_URL_TRACKING控制；沒有套件依賴或CI變更。舊raw logs原样保存。query序列化初稿的`direct=`在執行第一個browser前已更正，不宣稱是實測產品失敗。

## 驗證與保存

- Vite162tests／28files、lint／type-check／build與原Vite範例build PASS；2項新增suite測試在全套內。
- 最終browser：request96、Modules18、四種nested路徑24、重複更新9，共147PASS；另persistent root6PASS與初版6PASS獨立保留，不混入最終總數。
- Site prepare/lint、AI budget、source hashes與五項artifact保存詳見`0147-final-checks.json`。未涉及runtime core或browser payload，不宣稱效能改善。
- 兩個root API既有失敗證據仍保留；本批未變更public type/Rust契約，不刷新golden，四個root gates仍未完成。

## 直接接續

1. 驗證CSS/Sass Modules在development的inline/raw/url等request modes，以pure Vite公開契約分開分類（例如host不支援的Modules url不得作產品回歸）。
2. 補普通Sass partial及resource/reference ownership、其他preprocessor/PostCSS、server restart/multi-root／SSR/shared environment與完整published maps；本批root source URL通過不外推所有這些行為。
3. 0144巢狀缺檔composition會終止Vite host仍未修復；不得吞全域rejection或將紀錄host限制當完成。續接Webpack實際3build／12browserFAIL及legacy39browserFAIL。
4. 45historical findings：33fixed／12unresolved；75coverage：65checked／10blocked；4root gates／4候選。0038追加驗證仍等待使用者明確確認身分驗證通過。全部條件有充分證據前保持目標active。
