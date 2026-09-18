# Batch 0239: Preserve native inputs before Next PostCSS

## 目前交接點

前一goal turn為progress：0238修正新增ICSS與global resource並留下可重現closure／空rule缺口。Opening核對660selected source inputs、493shared artifacts、candidate54sources／64dist全符合0238；沒有忽略其他工作的變更。54個舊remaining條目原文保留，本批新增限定取代說明，並非55個獨立bug。

保留更新後owned候選`tmp/master-next-copy-3z8i_q4c/packages/next`，正式產品未套用。本批candidate只改`src/prepare-entry-graph.ts`；audit新增`next-postcss-input-stages.mjs`、擴充host與map repro。起始src/dist備份`tmp/0239-baseline`，未commit。

## 空rule實際對照與修正

同一`.shared{}`由PostCSS新增nested composes：純Next Webpack production build成功、Chromium/WebKit各PASS；0238candidate build報missing export。兩套都使用同一plugin與實際leaf CSS，不是mock。

候選先前把普通CSS也送入`compileStylesheet`，Rust既有最佳化移除了空rule，native PostCSS的Once visitor就看不到`.shared`。改由公開Rust-backed `inspectCSS`判定是否有Master entry／directives。普通CSS直接保留raw graph source與map交給Next；需要Master lowering的檔案仍由compiler處理。這是host選擇必要處理階段，沒有在TS重寫CSS或directive語義、沒有變更Rust API／實作、沒有移除Master lowering。

| Actual Next Webpack案例 | 最新結果 |
|---|---|
| 原純Next空rule對照 | 2browser PASS |
| 候選普通空rule＋新增巢狀ICSS | 修正後2browser PASS |
| 候選media內空rule＋新增巢狀ICSS | 修正後2browser PASS |
| 候選theme定義＋空rule | build仍失敗，不能由plain修正推論已解 |
| 新增theme引用 | 仍2browser FAIL |
| 既有combined-root global context | 2browser PASS |
| 既有local generated compose | 2browser PASS |

本批8次actual builds，6成功／2失敗；10browser PASS／2FAIL。兩個build失敗是修正前plain candidate及修正後仍未完成的themed空rule，非script故障。當前普通empty故障已有修正證據，themed故障保留。

## Public compiler階段證據

新repro直接使用公開inspection／stylesheet lowering／render APIs與Next PostCSS。五組native輸入顯示：普通與media空rule會被compileStylesheet移除；加theme同樣移除；其他輸入的comments消失、值由rgb與四邊寫法正規化、相同宣告的selector rules合併。因此plain原文分流有必要，但不能代表含Master指令檔案的PostCSS輸入保真已完成。下一步需在正確Rust/compiler層保留必要輸入，避免只針對`.shared`補回節點。

global closure控制只執行user plugin Once一次：先有--color-audit，plugin把值改成#123456並新增var(--color-late)。空manifest publication不會產生late變數；直接恢復完整manifest雖能生成late，卻最後再輸出舊--color-audit:#111覆蓋plugin修改，repro明確斷言此反例。**不採用盲目重新生成整份manifest，也不重跑非冪等user plugin。** 這只是定位所需closure／emitted-globals能力，尚未交付修正。

## Maps與驗證

五個current host inputs共7個實際emitted selector anchors PASS，核對file/line/column與完整sourcesContent。首輪另有2FAIL，原因是map repro要求只有ICSS composition、沒有自身宣告的空rule也出現selector。改為對這兩個已知fixture明確斷言不輸出自身rule，記錄omitted；root與實際leaf的定位仍必須通過。首輪原始map證據已另存，不將觀察腳本錯誤算成產品map錯誤。

改過的map repro另對0238十組已保存輸出重驗16anchors全部PASS；這是repro回歸，沒有冒稱重新跑十次current host builds。

全套128tests、3e2e、18graph controls、build、types、lint PASS。沿用已保存owned test adaptations，root既有測試未更動。未新增依賴、lockfile、CI/release、fixtures、snapshots，也未建置共享native／Wasm產物；runtime bundle未變更，無效能主張。

## 下一步與未完成

0240優先處理含Master指令時Rust lowering的提前最佳化與PostCSS可见输入：以theme＋empty／comments／相同宣告rules／local compose作完整原生和managed對照，評估在compiler擁有層提供不破壞host輸入的lowering階段，先在owned實驗驗證，不能自行在TS拼回語義。若需要public契約／directive文件，依原規則一起處理；不要把ordinary CSS pass當作整體完成。

同步保留PostCSS新global引用閉包：下一步查既有public emitted-globals/session能力及原生PostCSS lifecycle，再設計只新增必要globals且保留plugin修改／一次處理的方案；新ICSS child Master定義、刪改舊synthetic edges、任意AST ownership／metadata、完整Sass／watch／snapshot清理／條件／SSR／Turbo／Firefox與歷史raw gates均未完成。

0038追加驗證仍缺explicit identity確認，原pending patches與限制不變。全目標active，未正式交付或commit。

完整15source候選patch：`repros/next-postcss-native-input-candidate.patch`，對root只做apply-check PASS。

[總核對](../evidence/0239-final-checks.json) · [host/map摘要](../evidence/0239-summary.json) · [階段證據](../evidence/0239-input-stages.json) · [純Next對照](../evidence/0239-empty-comparison.json)
