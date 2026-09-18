# Batch 0247: PostCSS resource policy and processed-global history

## 目前交接點

0246是progress：request-local adapter已能在原生Next PostCSS loader內於每個user Once／OnceExit／RootExit後呼叫resource hook，但hook沒有自動接線，也沒有定義global刪改後的context。本批在新owned副本`tmp/0247-postcss-resource-policy/packages/next`（compiler link仍為0244 API）把policy接進`stylesheet-input-loader`／`prepare-postcss`／`prepare-entry-graph`，並以實際Next Webpack build與安裝版loader驗證。原0242 Next候選54source、0244 API100source／62artifacts、root 666selected sources與493shared artifacts全部不變；native binding SHA一致。

副本變更：新增`src/postcss-resource-policy.ts`；修改`src/prepare-entry-graph.ts`、`src/prepare-postcss.ts`、`src/stylesheet-input-loader.ts`、`src/prepare-global-module.ts`；新增`tests/bug-hunt-postcss-resource-policy.test.ts`（7）與`tests/bug-hunt-postcss-resource-host.test.ts`（1）。正式root產品、既有測試／fixtures、Site、依賴／lockfile、CI／release未變。0038仍暫停。

## 設計結論

- `emittedGlobals`在此路徑是「已交給使用者PostCSS處理過的資源歷史」，不是當前AST仍存在的global清單。plugin刪除、改名或修改global時不得依目前AST重設計數，否則會復活使用者刻意刪除的定義；delete／rename／rename-references／edit四種操作與pure PostCSS逐一相等，Once各只執行一次。
- entry先於所有child transform；child policy帶entry處理後的歷史，只補入entry從未處理的global。sibling child之間不共享歷史：兩個sibling各自補入一份相同定義（新增測試固定此行為，屬有界限制，非錯誤輸出）。
- hook以`proxyOf`取得穩定root身分並以WeakMap／`root.masterCSSProcessedGlobals`累積每Root歷史；歷史隨AST的toJSON／fromJSON經capture loader傳回`protectNextGeneratedGlobals`，不進入hydration或global inventory。
- 補入節點標記`masterCSSGlobal`，scoped Module輸出仍得到`:global(:root)`與pure-ignore註記；resource URL只重寫compiler已分配的file URL，保留query與fragment，其他file identity維持不透明。
- request-local adapter不修改shared `processor.plugins`（host測試斷言相等）或使用者plugin物件。

## 審查結果（child graph、歷史、外部globals、Modules、訊息）

| 項目 | 結論／證據 |
|---|---|
| child graph | 實際Next Webpack `postcss-child-global-resource`（nested Module內資源）與`postcss-added-global-reference`在最終dist重跑，Chromium／WebKit各PASS並載入`?rev=1#shape`資源 [1](../evidence/0247-final-postcss-child-global-resource.json) [2](../evidence/0247-final-postcss-added-global-reference.json) |
| 外部既有global | 作者自行寫的`:root{--color-late}`加上plugin引用時，hook仍補入theme定義（unlayered作者值在cascade勝出）。純compiler對同一來源也產生相同補入，屬Rust語義，未在TS改寫 [probe](../evidence/0247-native-history-probes.log) |
| 歷史計數 | 作者`@keyframes`在每次hook呼叫都被累加計數（variables不會）；純compiler回饋emittedGlobals時同樣累加。此歷史只作presence使用、不進runtime hydration，未觀察到輸出影響；列為待查觀察，不新增finding ID |
| Modules ownership | host chain測試：scoped entry／child補入節點皆為`:global(:root)`，`.card`不被誤包；混合authored／generated子節點仍由`protectNextGeneratedGlobals`既有檢查拒絕（本批未新增此案測試） |
| metadata／message／error | hook未轉發compiler diagnostics到`result.messages`（preflight／lowering路徑既有行為相同）；未知late引用不產生diagnostic也不補入。錯誤歸屬沿用0246 bridge lastPlugin。維持現狀並記錄 |
| 效能 | 每個plugin的Once／OnceExit／RootExit各觸發一次Rust差集render；正確性優先，未最佳化 |

## 測試及修正

| 檢查 | 結果 |
|---|---|
| 新host chain測試 | 真實`pitch`→dispatcher→安裝版Next PostCSS loader→JSON transfer→ownership保護；首跑1FAIL為測試期望值錯誤（compiler把`#111111`縮寫為`#111`），修正斷言後PASS [initial](../evidence/0247-host-test-initial.log) [fixed](../evidence/0247-host-test-fixed.log) |
| 聚焦 | policy7＋host1＋adapter15＝23 PASS |
| 完整套件 | 23files／151tests PASS [log](../evidence/0247-final-next-tests.log) |
| E2E | 3files／3tests PASS，於最終source之後 [log](../evidence/0247-final-next-e2e.log) |
| lint／types／build | eslint 0、tsc（0244 declarations）0、tsdown PASS，dist60檔 [lint+types](../evidence/0247-final-lint-types.log) [build](../evidence/0247-final-next-build.log) |
| 真實Next Webpack | 前次5案（含edit-intent 16browser）加最終2案4browser全PASS |
| Patch | `repros/next-postcss-resource-policy-on-0246.patch` 7檔，base為0246 owned副本；read-only apply check通過，未套用 |

執行環境：本批的Mac端命令經`tmp/0247-runner`佇列執行（Cowork shell為Linux VM，無法載入macOS binding）；每個job的原始log保存於evidence。首次以`.command`啟動被oh-my-zsh更新提示吞掉首字元，改以app bundle啟動；屬工具腳本問題，未影響產品。

## 可接續材料與下一步

- 尚未完成：diagnostics轉發到PostCSS messages、sibling共享歷史（或去重）、late資源的watch依賴登錄、hook效能、Document／並行生命週期下的policy、Turbopack路徑、0243 selector provenance與Turbo persistent-cache publication、完整Sass／watch／SSR／Modules／multi-root／host邊界；BH-0004／BH-0053不結案。
- 下一步：以實際Next dev／watch驗證late資源的依賴登錄與HMR；決定diagnostics轉發契約；再評估是否promote至0242候選。
- 61historical／57fixed／4unresolved、65checked／10blocked不變；pending approvals不變；goal active。

[Final checks](../evidence/0247-final-checks.json) · [Inventory](../evidence/0247-inventory-summary.json) · [Candidate](../evidence/0247-candidate-source.json)
