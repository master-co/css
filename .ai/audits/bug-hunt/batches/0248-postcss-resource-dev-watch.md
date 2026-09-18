# Batch 0248: Late-resource dev watch and diagnostics classification

## 目前交接點

0247是progress：owned Next副本已自動接線PostCSS resource policy，但late資源（由使用者plugin引入的global引用）在`next dev`／watch下的依賴登錄與HMR、以及compiler diagnostics是否需要轉發到PostCSS messages，仍未驗證。本批只新增audit repro與證據，沒有修改任何產品、候選source／dist、既有測試／fixtures、依賴、CI、release或Site；0247副本59source／60dist、0244 API與native binding SHA、root 670selected sources與493shared artifacts全部不變（root新增2個repro後672）。0038仍暫停。

## 實際`next dev --webpack`觀察

`repros/next-resource-dev-watch.mjs`在owned 0247副本上建立fixture：`card.module.css`以`@theme`定義`--image-audit:url("./new.svg?rev=1#shape")`與`--color-audit`，作者CSS未引用；使用者PostCSS plugin在Once對`.direct`追加`background-image:var(--image-audit)`與`outline-color:var(--color-audit)`。頁面hydrate後設定window marker，之後依序：改寫SVG位元組（red→blue）、把theme值改為`#222222`、再改回`#111111`。pure控制把同樣的定義放在global stylesheet的`:root`，不載入Master。

| 組合 | initial | SVG位元組更新 | theme值更新 | 回到原值 | marker |
|---|---|---|---|---|---|
| Master／Chromium | PASS，`?rev=1#shape`保留，資源200且為red | PASS，URL改為新內容雜湊、位元組為blue | PASS，outline變為rgb(34,34,34) | PASS | preserved（無整頁reload） |
| Master／WebKit | PASS | PASS | PASS | PASS | preserved |
| Pure／Chromium | PASS（Next asset module丟棄`?rev=1`，保留`#shape`） | PASS | PASS | PASS | preserved |
| Pure／WebKit | PASS | PASS | PASS | PASS | preserved |

16／16步驟通過；沒有page error。Master路徑的資源由靜態發布路徑`/_next/static/css/master/<graph>/maps/<content>.svg?rev=1`供應，兩個不同內容雜湊各回應200，證明late資源的位元組變更會被watch並重新發布；theme值變更透過snapshot digest變化重新走完整pipeline。每個狀態的plugin Once各執行2次（server／client compilation），沒有重跑。

三次harness錯誤分開保存：首版pure把`:root`放在Module內，被Next pure-selector檢查拒絕；改`:global(:root)`同樣被拒絕（正是`protectNextGeneratedGlobals`加入pure-ignore註記的原因，作為對照有價值）；改到global stylesheet後，pass predicate仍要求`?rev=1`，實際是pure Next丟棄query的差異，改以fragment比較並另記`queryPreserved`。[初版](../evidence/0248-dev-watch-matrix-initial.log) [第二版](../evidence/0248-dev-watch-pure-initial.log) [predicate](../evidence/0248-dev-watch-pure-predicate.log) [最終](../evidence/0248-dev-watch-final.log)

## diagnostics轉發契約

以0244 compiler API探查5種stylesheet問題：未知`@compose`與缺失import在`compileRenderedStylesheet`直接拋錯（hook路徑由0246 bridge歸屬`master-css-resources`）；空theme值、未知directive、未定義變數引用與`compileStylesheet`的缺失import都回傳空diagnostics。既有Next loader路徑（preflight、lowering、delivery）同樣不讀取`result.diagnostics`。在有直接證據的案例中沒有可轉發而被丟棄的warning，因此不新增轉發機制、不新增finding；若日後compiler對stylesheet產生非拋錯diagnostics，須回頭補契約。[probe](../evidence/0248-diagnostics-probe.log)

## 可接續材料與下一步

- 已驗證：late資源在Webpack dev的watch／HMR（位元組與theme值）、雙瀏覽器、pure對照。
- 未完成：sibling歷史共享／去重、hook效能、Turbopack路徑（本批只跑`--webpack`）、Document／並行生命週期、late資源被刪除或改名的dev恢復、0243 selector provenance與Turbo persistent-cache publication、完整Sass／watch／SSR／Modules／multi-root／host邊界；BH-0004／BH-0053不結案。
- 下一步：在dev下驗證late資源檔案刪除→恢復與theme定義刪除的行為，再評估promote至0242候選。
- 61historical／57fixed／4unresolved、65checked／10blocked不變；pending approvals不變；goal active。

[Final checks](../evidence/0248-final-checks.json) · [Inventory](../evidence/0248-inventory-summary.json)
