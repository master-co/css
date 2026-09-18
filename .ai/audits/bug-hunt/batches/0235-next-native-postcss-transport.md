# Batch 0235: Native Next PostCSS transport

Previous batch0234 made progress: existing graph APIs relink resources and preserve bounded maps. Opening657sources／493shared artifacts／49candidate sources／54candidate artifacts match0234. All50remaining entries and0038identity pause retained.

## 範圍與機制

新增audit-only `next-native-postcss-transport.mjs`。使用安裝中的Next16.3.4 bundled Webpack及原生PostCSS loader，不修改產品或0231候選。這是後續graph整合的transport原型，尚非managed graph delivery修復。

原型把Rust `compileRenderedStylesheet` 的單一authored CSS／map存成不可變hash snapshot；Webpack `importModule` request沿用loader原始`??ident`，保留含函式的options物件。input loader的pitch回傳snapshot，resourcePath／query仍是原檔。dispatcher委派原生PostCSS，再以callback metadata避免外層重跑。沒有序列化plugin closure或手寫TS CSS語義。

單檔限制明確拋錯：多檔graph、resource發布、generated global CSS不在這份transport原型內；沒有藉此繞過完整候選的graph／global要求。actual app的ICSS子檔由Next原生css-loader管理，不能視為candidate graph已整合。

## 五個bundled Webpack控制

| 案例 | 結果 |
|---|---|
| configured Rust lowering → native PostCSS | PASS；rename export前的selector、2rem→3rem、1px→7px |
| 不同closure options | PASS；native factory各執行一次，第二設定得到9px |
| ordinary CSS直接委派 | PASS；原生流程一次，不走snapshot bridge |
| empty plugin pipeline | PASS輸出；帶既有Rust map的這個selector仍對回原始第4行 |
| plugin deliberate error | PASS負對照；build失敗、原錯誤傳出、原檔列dependency，無fallback／外層重跑 |

每案只有一次原CSS readResource。bridge在nested處理期間把owned原檔暫換成invalid CSS，完成後還原；nested pitch仍用snapshot成功，證明此request沒有重讀。此操作只存在audit-owned fixture，不是產品策略。

configured／不同options／ordinary三個selector anchors都驗證原檔、line、column及完整sourcesContent。空pipeline帶prev map的單一anchor通過是補充觀察，沒有撤銷0234無prev／稀疏map限制，也沒涵蓋全部declaration或actual Next空配置。

dependency、build-dependency、missing-dependency、dir-dependency、asset及warning皆由原生loader傳到compilation；原resourcePath/from/to/query保留。這僅證明登記與傳遞，watch增刪／recovery／失效重建尚未驗證。error案例有2則Webpack衍生錯誤，同源原錯誤保留，不當作2個產品bug。

## Actual Next production build

三個owned app建置均成功；CSS Module root同時包含`@compose p:2rem`、PostCSS `.original`→`.direct`、inline loader child1px→3px→PostCSS7px。純Next對照只把Master directive換成等效padding:2rem。

| 模式 | Chromium／WebKit | 觀察 |
|---|---|---|
| bridge Server Component | 2 FAIL | padding48px／exports正確，但額外原始child CSS以1px覆蓋7px |
| bridge Client Component | 2 PASS | padding48px、border7px、color及public export皆正確 |
| pure Next Server Component | 2 FAIL | 同樣額外原始child1px覆蓋7px；不是bridge獨有回歸 |

Server prototype有5 capture／5delegate／5plugin Once／5skip；Client各4次。每個native處理都有對應skip，plugin看到的CSS已無@compose，inline child進PostCSS前確為3px。Server同檔不同request／compiler仍會各處理一次，不能把合法不同module的多次呼叫叫做重複pipeline。

保留原始Server FAIL；最初browser assertion被通用catch標成harnessError，後續摘要分類為實際渲染失敗。純Next重現支持這與0231既有Server載入差異相符，但不宣稱完整因果或host修復。預期仍為7px，未弱化斷言。0232候選的五組10FAIL全部仍開放，這三個app没有載入候選。

## 腳本錯誤及保存

- 最初API探測誤呼叫Next bundled webpack `.init()`；讀本機export後改用現成webpack export。
- 第一版fixture `/var`／`/private/var`路徑未canonicalize，找不到dispatcher；修正owned root realpath。
- 第二／三版readResource觀測只訂閱file scheme，normal absolute path實際為undefined scheme；改為同時訂閱兩者，保留原始失敗json/log。不是產品bug，也沒有更改「只能讀一次」期望。
- Server完成後加入Client與pure Server對照；沒有移除失敗case或調低預期border。

原657來源不變，新增repro後658；493shared artifacts、candidate49sources／54dist不變，HEAD／index不變。3actual Next apps、所有bundled webpack compilers、瀏覽器、HTTP server及owned暫存都結束／移除。沒有安裝依賴、產品修改、既有測試變更、候選promotion或commit。

## 接續

0236把經驗證的immutable input／native option reference／metadata skip機制接到owned Next graph候選，不能用這個delegated-single-file原型替換完整graph需求。先保留0231備份，在root／ICSS child Rust lowering之後、Module exports之前執行原生PostCSS；整合0234既有graph relinking/maps及per-owner resources，處理generated-global邊界與同AST plugin語義。重跑0232五個actual失敗案例與local控制；再驗watch重建、Sass、empty maps、條件／Server副作用。全部未完成項與pending approvals／0038暫停保留。

[transport結果](../evidence/0235-native-transport-final.json) · [Client actual Next](../evidence/0235-actual-next-client.json) · [pure Server](../evidence/0235-actual-next-pure-server.json) · [總核對](../evidence/0235-final-checks.json)
