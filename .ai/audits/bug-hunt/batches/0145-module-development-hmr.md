# 0145 Development Modules HMR

- HEAD `eb6b479a3998aebc37af18523a1458225909d9dc`；起始逐一核對0144的170項來源雜湊全部相符，index空。上一goal turn完成0143修復與0144限定查核，屬有效進展。
- 限定BH-0004：development CSS／Sass Modules的具名／預設匯出、native usage、managed entry與local `@compose`、直接／巢狀composes子檔與root HMR。0144巢狀缺檔主機終止問題仍未解決。

## 重現與分類

| 證據 | 判讀 |
|---|---|
| `0145-dev-modules-first.log` | 六個dev hosts／54browser observations，12PASS／42FAIL。CSS/Sass managed entry缺少example具名匯出，頁面不能啟動；pure Vite初始與root-edit通過，但child-only HMR無更新；local Sass有HTTP500。local CSS另含下列色彩oracle錯誤，因此42FAIL不能全列產品bug。 |
| `0145-local-baseline-corrected.log` | 以明確`bg:#0000ff`取代Master preset `blue` token，並於相同host停用新增SassSource bridge重測old development path。local CSS initial／root-edit六PASS，child-only三FAIL；local Sass九FAIL／HTTP500。此為功能開關對照，未宣稱整個歷史worktree重建。 |
| `0145-dev-tests-first.log` | 首次接入development後2個新增server測試FAIL：傳入baseFile但preserveImports為false，觸發compiler契約TypeError。保留為產品接入中間回歸；不改compiler契約來讓測試通過。 |
| `0145-dev-tests-second.log` | 只有production傳baseFile，development代理CSS仍以相同目錄解析；2個new server tests與3個cache/dependency tests全PASS。 |
| `0145-entry-hmr-first.log`、`0145-local-hmr-first.log` | CSS／Sass兩種extension、entry／local兩模式、initial／child-edit／root-edit、三瀏覽器，共36PASS。每次編輯需新的HMR callback，bootID保持相同，具名與default export相等，computed color/background正確。 |
| `0145-entry-nested-hmr.log`、`0145-local-nested-hmr.log` | 追加shared→leaf巢狀composition，兩模式／兩extension／三瀏覽器36PASS。 |
| `0145-production-modules-control.log` | 原production Modules20build／60browser全PASS，包含預設pruning與scoped exports。 |

## 最終修改

- `SassSourcePlugin`的public Vite預處理／CSS Modules匯出橋接亦用於serve。主機先產生scoped class匯出，交給既有scanner登記usage，再由Rust/compiler處理native rules及Master directives；沒有新增TS CSS語意fallback。
- 新增`invalidatePreparedSassSources`：針對root或resolved dependency編輯，只移除受影響owner的prepared cache，保留無關cache。
- `handleHotUpdate`根據affected owner失效Vite module graph內的JS／CSS代理（包括query variants），並回傳原始與受影響modules，沿用Vite更新協定。
- `StyleEntryPlugin`／`LocalComposePlugin`僅在build傳入baseFile，符合既有compiler preserveImports契約；沒有改public compiler API、Rust、bindings或generated contracts。
- 新增兩個actual dev server測試；擴充既有兩個nested dependency測試，確認child改變會重算CSS、無關檔案不破壞cache。browser script以每步minimum HMR count與固定bootID排除假通過／整頁reload。
- 公開Vite README與Site directive contract同步development已驗證行為；移除與現行host預處理不符的「一定在Modules前lower」敘述，改述scoped names／exports的實測契約。其他request modes與missing recovery維持待驗證。現行directives目錄僅有contract.mdx與LegacySyntaxPage轉接page.tsx，root AGENTS所指content.mdx已不存在；依Site現行canonical contract更新，沒有重建舊頁面。

## 驗證

- 27files／160Vite tests PASS（前批158）；Vite lint／types／build PASS；原Vite範例build PASS。
- development72browser及production60browser，共132最終對照PASS。pure Vite的child-only限制及先前腳本失敗另列，不加總為產品成功。
- Site prepare/lint PASS（0errors／75warnings）；最後一段lowering敘述校正後再跑prepare，沒有Next API或Site程式修改。
- 五項compiler／engine／runtime artifact hashes與0144完全相同，raw／gzip／brotli不變；無runtime CPU、memory、payload改善宣稱。
- root API／golden沒有變更，沿用0141失敗證據而未refresh；四個root gates仍未完成。來源保存、AI budget、syntax／whitespace及inventory見本批final-checks。

## 未完成與下一步

1. 0144巢狀missing composition仍會使Vite8.2.2內部async loader拒絕未捕捉，刪除／改名恢復不能結案。繼續研究公開host能力或正確錯誤隔離，不能吞掉全域unhandled rejection、複製Modules parser或以拒絕當完成。
2. 下一批驗證development inline／raw／url requests與普通Sass的HMR、source／resource/reference ownership；再補其他preprocessor／user PostCSS、aliases／virtual、多入口與SSR/shared environment、完整published maps。
3. production及legacy未遷移路徑：原Webpack3build／12browser、legacy39browser失敗保持；其他findings、coverage和root gates仍需完成。
4. 45歷史findings維持33fixed／12unresolved；75coverage為65checked／10blocked；4root gates／4候選。0038追加驗證仍等待使用者明確身分確認；本提示或一般進度不代表驗證通過。
5. 本批不提交／推送；保留其他工作。ledger容量接近soft threshold，下次追加前整理歷史原文，不能覆寫既有進度。
