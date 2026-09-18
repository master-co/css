# Batch 0236: Next PostCSS graph prototype

0235 made progress: immutable native PostCSS transport/options/messages verified. Opening658sources/493sharedartifacts/49candidate sources/54candidate artifacts match0235. All51remaining entries retained;0038identity pause unchanged.

## 整合實作與交付狀態

在owned Next候選實作兩階段來源準備：Next自己的values／extract-imports發現ICSS依賴，保留原CSS及synthetic import；Rust整圖先收集manifest，各檔再用既有compileStylesheet展開@compose。每檔lowered CSS/map經snapshot＋原生PostCSS，再算Module exports，最後沿用完整graph發布。原生options closure、resource request/query與外層metadata skip沿用0235。沒有改Rust語義、compiler API或依賴。

**原型尚不能交付。** generated globals的分類／同AST plugin語義尚未接入，設明確實驗guard，避免默默把全域規則scope成Module或跳過其PostCSS。新增theme變數案例實際觸發guard；恢復的0231基線同案雙browser PASS，證明這是原型限制／回歸，不是產品原有不支援。

保留初版及修正後prototype完整src/dist/tests；工作中的candidate已恢復0231的49sources／54dist逐檔hash。正式產品、原有測試、fixtures、依賴、CI/release、shared artifacts未變，未commit／promotion。

## Actual Next 證據

| 行為 | prototype結果 |
|---|---|
| root原生declaration進PostCSS | 2browser PASS |
| ICSS child進PostCSS | 2browser PASS |
| inline child 1px→3px→PostCSS7px | 2browser PASS |
| @compose p:2rem→PostCSS3rem | 2browser PASS，48px |
| PostCSS .original→.direct影響Module export | 2browser PASS |
| 原本正常local @compose路徑 | 2browser PASS |
| maps補充建置：rename、inline無map、inline有map、修正inline、修正generated | 各2browser PASS；map另判定如下 |
| theme變數global案例 | build FAIL：原型explicit guard |
| 恢復0231基線的同一global案例 | 2browser PASS |

共13個actual Next production builds，12成功／1失敗；24browser PASS／0browser FAIL，另1個build失敗不能計作通過。0232五個原失敗scenario的10browser在原型已通過；由於原型尚有global回歸且未交付，原候選／產品的10FAIL仍未結案。沒有弱化border/padding/color或exports期望。

## Source maps：發現並修正原型錯誤

rename案例的published CSS selector對回原始.original、正確file/line/column與完整原文。inline第一版loader沒有產生map，child sourcesContent僅有3px輸入；增加能提供原始1px map的獨立inline producer後仍失敗，排除「只有producer缺map」的解釋。

最小PostCSS控制確認：只在root.toResult傳prev不能補回parse階段已丟掉的來源；在postcss.parse時也傳prev，才保留原始sourcesContent。修正raw graph的parse選項後，最新actual inline root／child兩錨點與generated root一錨點全部PASS，含完整1px作者原文。原失敗json/log與最小stage證據保留。這是本批原型引入並修正的錯誤；無map的任意inline transformer、全部declaration、global錨點、empty pipeline、既有Turbo URI問題仍未完成。

## 套件檢查與腳本分類

- 初次build為新增函式推導到未export的PreparedNode而DTS失敗；在內部模組export type後build PASS。最終map修正後build/types/lint也PASS，未改建置設定。
- 全套首次126PASS／2FAIL，失敗是pipeline test只解開css dispatcher，還沒讀新增PostCSS dispatcher。僅owned test改成解開兩層，並加強options物件／closure identity斷言；focused5PASS。沒有改root既有測試，沒有宣稱全套單次128PASS。
- 3e2e PASS；18原graph controls PASS。最終map修正只重跑受影響actual maps/build/types/lint，沒有不必要重跑整套。
- edge repro新增獨立authored capture、map收集及有／無map inline控制；既有行為斷言不變。新增next-edge-map-controls核對actual assets。
- Build log保留既有Next dynamic-import dependency trace警告；不因此宣稱watch/cache完整正確。

## 保存與接續

初版：`tmp/0236-postcss-prototype`＋`repros/next-postcss-graph-prototype.patch`。
修正後：`tmp/0236-postcss-prototype-corrected`＋`repros/next-postcss-graph-prototype-corrected.patch`；source patch對恢復後owned0231候選apply-check PASS。對應owned test patch為`repros/next-postcss-pipeline-test-prototype.patch`，不是root既有測試修改授權。Archive不是獨立可build workspace；用inventory的buildableLocation及既有依賴，在owned候選接續。

0237從**corrected**原型接續，不重做已驗證transport／map探索。先處理generated global與authored Module同次PostCSS的分類，確保全域選擇器不被scope且不重跑plugin；用本批theme正反對照、component/keyframe與combined-root plugin驗證，再跑原五案與local控制。PostCSS新增import／ICSS、完整resources／conditions／Sass、watch/recovery及先前要求仍需驗證。不能保留guard作最終產品限制，也不能退回native單檔路徑取代完整graph。

52個remaining entries完整保留；候選49／54與493shared artifacts保持；51舊entry逐字保留另加本批約束。全部builders/readers/browser/server terminal、owned app已清除；0038／pending approvals／Firefox／root gates／Site等原要求不變。

[總核對](../evidence/0236-final-checks.json) · [actual矩陣](../evidence/0236-summary.json) · [修正後prototype](../evidence/0236-prototype-corrected-inventory.json) · [inline maps](../evidence/0236-inline-maps-corrected.json) · [global基線](../evidence/0236-baseline-global.json)
