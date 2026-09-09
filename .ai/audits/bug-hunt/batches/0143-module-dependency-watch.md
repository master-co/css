# 0143 CSS Modules dependency watch

- 範圍：BH-0004 的 production CSS／Sass Modules `composes` 依賴更新、巢狀 composition、既有 compiler 錯誤恢復及來源位置防護。其他需求不縮減；0038 追加驗證仍等待使用者明確確認身分驗證通過。
- 批次起始 HEAD `3e44f4fb3d747c2864ee6ff51c30de722b9d106d`；中途使用者授權提交0141–0142帳本為 `eb6b479a3998aebc37af18523a1458225909d9dc`，0143與產品變更保留工作目錄。本批未再提交／推送。
- 前一 goal turn 為有效進展：完成已授權的105檔帳本提交、128工作檔保存核對；本次恢復時全部保存雜湊相符。

## 證據與原因

1. 0142 已確認 public `preprocessCSS` 對 composed CSS 子檔回傳空 `deps`；純 Vite 同樣漏掉 child-only watch。這是已重現主機限制，不能當作需求完成。
2. 檢查實際 Vite8.2.2：public `preprocessCSS` 的 client environment 經 `createBackCompatIdResolver` 呼叫 public `config.createResolver(options)`。在單次 cloned config 包裝該 factory，完整轉交 options、呼叫參數及結果，即能觀察巢狀 composition 的實體 resolved IDs。沒有使用 private Modules Loader、複製 CSS parser 或直接 import transitive dependency。
3. [resolver controls](../evidence/0143-resolver-controls.log)：relative、alias、package `style` condition 三類 control 的 CSS／Modules output 與未包裝 public preprocessCSS 完全相同，並取得 shared＋leaf 依賴。`vite-module-resolver.mjs` 可重現。
4. `prepareBuildSassSource` 將解析到的 absolute IDs 與既有 `result.deps` 合併；cached caller 重播依賴；錯誤時亦回呼已解析依賴，供主機 `addWatchFile` 註冊。接至 Sass／Modules loader 與 build import resolver，不改全域 Vite config。
5. Composed CSS 的 host map 使用含NUL的 `<no source>` 佔位值；原 mapping 會把它當真實檔名。現在 origin 與 decoded URL 中任何NUL均回到明確標示的 preprocessed CSS 診斷；沒有捏造 child原始位置或範圍。

## 分類與修正過程

| 證據 | 分類與結論 |
|---|---|
| `0143-dependency-tests-first.log` | 新測試錯誤假設缺少 imported class 應拋錯；純Vite實際接受並產生 `undefined` class。改測真正的 `getJSON` callback錯誤，保留主機baseline，不宣稱修復其missing-export語意。 |
| `0143-modules-watch-first.log` | resolver追蹤後直接CSS／Sass子檔編輯6build／18browser PASS。 |
| `0143-modules-nested-recovery.log`、`0143-module-diagnostics-tests.log` | 擴充驗證抓出來源佔位值；首次只檢查startsWith NUL仍漏絕對路徑前綴，後改includes NUL並補package回歸。 |
| `0143-modules-nested-recovery-final.log` | 6build／18browser為16PASS／2FAIL；每種extension的Chromium恢復時404，當時原因未分類。 |
| `0143-watch-event-trace.log` | 事件順序證明ERROR之後仍發END；舊腳本把失敗週期END當成下一次恢復成功，提前讀資產。這兩筆404是harness時序錯誤，不是已確認的產品發布bug。 |
| `0143-watch-recovery-verified.log` | 成功只消費BUNDLE_END；CSS與Sass巢狀composition、JS-only重建、錯誤後child-only恢復6build／18browser全PASS，兩個expected-error均強制核對structured diagnostic與preprocessed位置註記。 |
| `0143-inline-command-error.log` | 控制命令誤用不存在的`vite-inline-stylesheet.mjs`；未執行產品，改用既有`vite-inline-delivery.mjs`，原錯誤留存。 |

## 驗證

- Vite完整26files／158tests PASS（0142為154）；本批新增dependency3tests與composed診斷1test。focused dependency3與Modules9亦PASS。
- Vite lint／type-check／build與原Vite範例build PASS。
- production Modules20build／60browser、Sass15build／90browser PASS。Inline14build／84browser PASS；Site prepare/lint PASS（0errors／75warnings）。最終四組browser共252PASS；另早期直接watch18PASS。
- [artifact hashes](../evidence/0143-artifact-hashes.json)：五項compiler／engine／runtime產物與0142完全相同，raw／gzip／brotli不變。沒有runtime效能改善宣稱。
- 本批沒有改public exports／Rust契約，不重建binding、不刷新golden；0141兩項root API失敗保留為歷史證據，四個root gates仍未完成。
- 最終來源保存、AI budget、whitespace及檔案inventory見本批final-checks與source-hashes；原始失敗log不覆寫。

## 未完成與下一步

- 以新批次測composition子檔刪除／還原、改名與引用更新；需原始錯誤及恢復後真實browser證據。
- Development Modules／HMR、其他預處理器及user PostCSS、reference／resource alias與virtual ownership、多入口／共享environment、cycles及完整published source maps仍未完成。
- 主機提供無來源的composed CSS時只能明確保留preprocessed位置，未證明完整child原始source mapping。
- 原Webpack3build／12browser失敗、legacy39browser失敗、其他未完成finding及coverage需求保持。
- 45歷史findings：33fixed／12unresolved；75coverage：65checked／10blocked；4root gates／4候選。BH-0004仍已確認未結案；受阻不計完成。
