# Batch 0241: Next PostCSS producer source-map context

## 目前交接點

0240為progress：建立compiler-owned source preservation原型並驗證實際host／maps反例。本批opening核對661selected inputs／493shared artifacts／Next54source／64dist及Rust prototype203source files符合前批。56個舊remaining條目完整保留，新增限定取代說明，並非57個獨立bug。

現在保留更新的0241 owned Next候選，source／dist仍54／64；本批僅改其中`src/prepare-module-graph.ts`。起始版本備份`tmp/0241-next-baseline`。0240 Rust source／三份pinned binary完全不變，仍是未交付原型；正式產品、既有root tests／fixtures、deps／lockfile／CI／release／Site不變，沒有commit。

## 兩個map反例的分類

1. **child originalSource少app/**：本批先用預設binding而非Rust prototype重跑imported-keyframe，兩browser行為PASS但map仍FAIL，證實是Next候選回歸。0239繞過不必要的plain CSS lowering後，raw graph產生的相對map直接交給Next，不再經compiler變成絕對URL。0240只是在更完整map驗證中暴露它。
2. **合併selector column48而非26**：同一themed-merged fixture直接使用純Next亦重現，root／leaf錨點通過而shared錨到sibling。這不是Rust source-preservation獨有的回歸；仍是未滿足的精確selector mapping需求，不能以「已記錄host限制」結案。

讀回Next自身`postcss-loader/src/utils.js`後，獨立repro使用其真實normalizer確認：PostCSS producer的`sources:['other.module.css']`會依process cwd解析，Next resource context雖然是app，結果仍指到project root／other.module.css。這不是缺失原始檔，也不是Rust編譯器改了file owner。

## 修正

在raw graph自己的PostCSS map產生點，以該檔案的絕對file URL作base，將sources改為絕對URL，再序列化給下游；保持原mappings和sourcesContent，特殊`<...>`來源保持原樣。普通CSS仍保持原文交給Next，不恢復提前最佳化；原來就有完整URI的compiler／Sass map亦不需重寫語義。

不改Next依賴內部程式、不改loader options identity、不加入parser fallback或新依賴。獨立normalizer control檢查絕對來源、原文、mappings與零位定位全部PASS。

## Actual驗證

| Binding／案例 | Browser | 精確selector maps |
|---|---|---|
| default imported-keyframe | 2PASS | root／child PASS |
| Rust prototype imported-keyframe | 2PASS | root／child PASS |
| default普通ICSS | 2PASS | root／child PASS |
| default inline ICSS，實際inline producer map | 2PASS | root／child PASS |
| prototype themed comment | 2PASS | root／child／leaf PASS |
| prototype themed spelling | 2PASS | root／child／leaf PASS |
| prototype child theme resource | 2PASS | root／child PASS |
| prototype merged selectors | 2PASS | root／leaf PASS，shared仍FAIL |

修正後8build全部成功、16browser PASS；19個必要map anchors中18PASS／1FAIL，核對file/line/column及完整sourcesContent。另有兩個before/native-control builds，共4browser PASS、3maps PASS／2FAIL。沒有刪除或放寬欄位斷言；原始失敗保留。

## 保存與下一步

完整15source Next候選patch：`repros/next-postcss-map-context-candidate.patch`，root read-only apply-check PASS。新normalizer重現：`repros/next-postcss-map-context.mjs`。0240原型仍由每條command單獨設置binding path使用，沒有改全域或工作區預設binding。

0242優先把0240 source preservation設為compiler擁有的明確host preparation選項／API，讓3個既有預設格式tests保持原行為；接續native/Wasm／generated contract／必要文件和Next選用。不能直接promote無條件改printer的原型。原型最新source／binary inventory仍以0240-rust-preserved-inputs-final.json為準，Next端則使用本批0241 candidate。

合併selector map仍需追後段optimizer的selector合併與per-selector provenance，先以純Next反例隔離；若需外部依賴修正，現有禁止依賴／lockfile變更限制仍適用，不得自行套用。新global引用closure、child新Master定義、synthetic edge刪改、ownership／metadata、Sass／watch／清理／SSR／Turbo／Firefox／raw gates及其他帳本項目照舊未完成。

0038追加驗證仍缺explicit identity確認；pending approvals未變。Goal active，未正式交付或commit。

[總核對](../evidence/0241-final-checks.json) · [Host／map摘要](../evidence/0241-summary.json) · [Normalizer證據](../evidence/0241-map-context.json) · [純Next反例](../evidence/0241-pure-merged-maps.json)

收尾：128tests、3e2e、18graph controls、build、types及lint均PASS；662selected source inputs只新增normalizer repro，既有661不變，493shared artifacts不變，Rust prototype203source與3binary不變。Next僅一份source修改，54／64新hash已保存，HEAD／空index不變。
