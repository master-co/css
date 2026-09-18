# Batch 0242: Explicit native-source preservation for host preparation

## 目前交接點

0241為progress；opening核對662selected source inputs、493shared artifacts及Next候選54source／64dist符合前批。本批建立新的owned workspace `tmp/0242-source-preservation-api`，不覆寫0240兩個Rust原型。持續目標active；61historical confirmed／57fixed／4unresolved、75coverage中的65checked／10blocked不變。

目前保留0242 Next候選，仍在`tmp/master-next-copy-3z8i_q4c/packages/next`；其自己的`node_modules/@master/css-compiler`現在連到0242 owned compiler。前一份Next src／dist與原compiler symlink記錄保存在`tmp/0242-next-baseline`。正式產品、root既有tests／fixtures、deps／lockfile／CI／release／Site不變，無commit，index空。0038仍缺explicit identity確認。

## 本批契約

- Rust `CompileNativeCssOptions.preserve_native_source`／TS `preserveNativeSource`預設false；恢復原native printer的minify，保留117個既有Rust測試的預設行為。
- 明確true才使用compiler-owned source-span保留：消耗Master定義、替換lowering slots，保留其他註解、空規則、值拼法與規則界線，以及原文UTF-16位置。
- true不能與class pruning並用，包括空list與graph每檔案的list。`preserveNativeCSS:false`仍關閉native輸出；native-only入口仍先驗證CSS語法。
- generated binding contract由owned xtask codegen產生，並check通過。TS universal／Node／graph／browser入口傳遞選項；未設定時省略欄位，避免Wasm把undefined當成無效bool。
- Next只在含Master指令檔案交給native PostCSS前的`compileStylesheet`設true；preflight與最終publication維持預設。普通CSS保留0241分流。
- 文件候選寫在目前實際存在的`site/app/[locale]/guide/directives/contract.mdx`副本；canonical guidance所指`content.mdx`已不存在，沒有重建舊文件或修改他人Site工作。

## 證據與分類

| 驗證 | 結果 |
|---|---|
| Rust compiler | 124PASS：117既有＋7source-preservation controls |
| Rust project | 16PASS；兩個完整options initializer補false |
| Clippy | compiler／project all-targets、all-features、deny warnings PASS |
| Native／Wasm／codegen | owned builds及codegen check PASS；未建置共享artifacts |
| TS compiler | 424項跨初跑與針對性重驗通過；含6個native／Wasm／graph／Node exact-map／browser新控制 |
| TS checks | binding、binding-wasm-compiler、compiler build／lint／types PASS；source-only types使用明確workspace rootDir |
| Actual Next webpack | 4build、8Chromium／WebKit observations PASS：themed comment、spelling、empty及merged cases |
| Actual maps | 擴充兩個merged selectors後，共11PASS／1FAIL，見下節 |
| Next package | 128項跨初跑／PATH重驗PASS；18graph controls、build／types／lint PASS |
| Next e2e | 初跑2PASS／1static FAIL；保留失敗cache後static cold及warm各1PASS，初次失敗仍未定位 |

初始Rust borrow與新field缺失是本批實作錯誤，已修；Wasm undefined也是本批傳遞錯誤，已修。其他重現環境錯誤分開保留：copy／syntax命令cwd錯誤、host scenario漏`postcss-`前綴、owned preset不完整／Sass未連結、lint缺`.gitignore`、TS預設rootDir、Next指令PATH。沒有放寬既有斷言，沒有把這些當成新產品bug。

Sass只連結已安裝1.101.0到owned node_modules；preset檔案與ignore設定由當前root複製，未install／改依賴。Next套件test自身會build候選，故actual host readers全部結束後才執行；actual builds最多兩個並行。

## 仍未完成的兩個具體反例

**Merged selector provenance**：0241原型中`.shared`錨到48而非26；0242有限選用後第一個selector映到26，但擴充檢查第二個`.sibling`，它也映到26而非48。原11anchor控制全PASS不足以代表合併規則兩個selector都正確；本批明確擴充observer，沒有刪除舊失敗。純Next此前的相反偏移反例仍保留。完整per-selector map要求未完成，BH-0053不結案。

**Static export cache／publication**：初跑Turbopack聲稱找不到`.master/stylesheets/...-entry.css`，但build結束後精確路徑存在。失敗`.next`移存`tmp/0242-static-export-failed-next`；保留published assets，cold restart及隨後warm build都PASS。這不能證明競態／舊快取問題已修，也不能確定由本批API引入；接續須用保留cache、原compiler對照與publication時序定位。初次完整log保留，不以重跑成功消除此項。

## 保存與下一步

- Compiler完整19file候選：`repros/compiler-native-source-preservation-candidate.patch`；Next完整15source候選：`repros/next-source-preservation-opt-in-candidate.patch`。兩者read-only root apply-check PASS；Next patch需要新compiler API，不能單獨交付。
- API workspace345selected source files／118artifacts、Next54／64 hash已記錄；共享493artifacts不變。662selected inputs只改`repros/next-edge-map-controls.mjs`，其餘661不變。
- 原57個remaining條目逐字保留，追加本批更新；pending approvals及unrequested test patches保持。未全量promotion，不因本批scope通過改fixed數。
- 0243先定位merged-selector mapping在final compiler normalization與Next optimizer的per-selector來源損失，及static cache反例；沿用本批owned API／Next連結，所有native驗證仍逐command指定`MASTER_CSS_NATIVE_BINDING_PATH=.../0242-source-preservation-api/mastercss.node`。
- 接續完成PostCSS新增global-reference closure／child新增Master定義、graph edge刪改與ownership／metadata／cleanup；完整Sass、watch、SSR、Turbo、Firefox、raw入口、其他hosts、root gates等歷史要求不变。0038暫停不解除，禁止自行dependency／lockfile修正或commit。

[Final checks](../evidence/0242-final-checks.json) · [API inventory](../evidence/0242-api-inventory.json) · [Expanded map counterexample](../evidence/0242-merged-both-selectors-maps.json)
