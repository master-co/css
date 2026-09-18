# Batch 0258: Promote the Next PostCSS/module candidate

## 目前交接點

0257量化了promote所需的完整依賴鏈並留在owned副本。使用者本批明確授權「完成所有帳本項目、自行修正並promote、分批commit」，因此把0232–0256累積的候選正式交付到主工作樹，含先前待授權的`nextGraphDeliveryTests`四個既有測試調整。BH-0063改判為已修復。0038仍暫停。

## Rebase方法

候選副本的分叉點是`7edc87136`（0250記錄），主工作樹其後已提交0251–0253的compiler perf（`9b89eddcc`／`c98845ab1`／`b5569e8c2`）。本批用worktree在`7edc87136`重建候選commit，再把主工作樹`9c1751b1a`合併進去，取得真正的三方合併結果（無衝突）。合併後`native_source.rs`仍是0251前的版本，會重新引入`byte_offset_for_location`逐次掃描：改套`repros/compiler-source-index-on-0242.patch`中`native_source.rs`的hunks，讓anchor改用每來源一次的`SourceIndex`，避免BH-0062的二次成本回歸。`cargo fmt`修正候選帶入的排版。

`packages/next`的分叉點`f3f6f7616`與`9c1751b1a`內容相同，直接交付，不需合併。

## 交付內容（3個產品commit）

| commit | 範圍 | 說明 |
|---|---|---|
| `9d1910e24` Feat(Compiler) | `crates/mastercss-compiler`（含新`native_source.rs`與`bug_hunt_preserved_native_source.rs`）、`mastercss-project`、`xtask` template、`packages/binding/src/protocol.ts` | `preserve_native_source`：保留作者原文與per-anchor輸出對映，預設關閉，與class pruning互斥 |
| `879b58d96` Feat(Compiler) | `packages/compiler/src`11檔、2個新測試、`site/.../directives/contract.mdx` | 對外暴露`preserveNativeSource`與rendered resource context差集 |
| `5810c71ed` Feat(Next) | `packages/next/src`13新檔＋4改檔、4新測試＋5改測試 | PostCSS／CSS Module graph管線；Turbopack保留preset animation全域名稱並交付`@keyframes`（BH-0063） |

## 驗證

| 檢查 | 結果 | 證據 |
|---|---|---|
| `cargo fmt --check` | PASS（先以`cargo fmt`修正候選排版） | [log](../evidence/0258-fmt.log) |
| `cargo clippy --workspace --all-targets --all-features -D warnings` | PASS | [log](../evidence/0258-clippy.log) |
| `cargo test --workspace` | 357 PASS／0 FAIL | [log](../evidence/0258-cargo-test-main.log) |
| `cargo xtask codegen --check`、`cargo xtask parity` | PASS | 同批次執行 |
| `packages/compiler` lint／type-check／test | PASS；57 files／428 tests | [test](../evidence/0258-compiler-test.log) |
| `packages/next` lint／type-check／test／e2e | PASS；24 files／152 tests、3 e2e | [test](../evidence/0258-next-test.log) [e2e](../evidence/0258-next-e2e.log) |
| 全套件build（turbo，28 packages） | PASS | [log](../evidence/0258-build-all.log) |
| BH-0063實際host（主工作樹，非副本） | Turbopack `fade`／2 frames、Webpack `fade`／2 frames，Chromium／WebKit皆PASS | [turbopack](../evidence/0258-promoted-turbopack-module-animation.json) [webpack](../evidence/0258-promoted-webpack-module-animation.json) |

## 既有失敗對照（baseline vs promoted，皆非本批造成）

以`9c1751b1a`（promote前）重建native binding與全套件後跑同樣四個套件作為baseline，再於promoted狀態重跑。預設file parallelism在本機會產生額外的載入失敗與零星失敗（例如`Cannot find module '/dist/plugins/usage-graph.js'`，但該檔存在且`node`可直接import；`bug-hunt-module-import-contexts`與`bug-hunt-theme`單獨執行皆PASS），因此以`--no-file-parallelism`的結果為準。

| 套件 | baseline | promoted（serial） | 判定 |
|---|---|---|---|
| `@master/css-vite` | 23 FAIL／644 PASS | 23 FAIL／644 PASS，失敗項目名稱完全相同（`bug-hunt-build-config-recovery`／`build-failure-lifecycle`／`build-recovery-ownership`） | 既有，未變 |
| `@master/css-nuxt` | 3 FAIL／6 PASS／1 skipped | 3 FAIL／7 PASS，同樣三項`@import …` 未含`.box` | 既有，未變（一項原skipped現PASS） |
| `@master/css-webpack` | — | 2 FAIL／86 PASS，僅`plugin-runtime.test.ts`兩個watch測試 | 既有；0208起記錄的`existingWebpackTestContract` patch仍未授權 |
| `@master/css-binding-wasm-compiler` | 1 FAIL（`loads the isolated compiler Wasm surface`） | 同一項 | 既有，未變 |
| `@master/css-binding-wasm-tooling` | 1 FAIL（`loads the isolated source tooling Wasm surface`） | 同一項 | 既有，未變 |

其餘套件（css、tooling、compiler、next、server、runtime、language-service、language-server、eslint-plugin、mcp、vscode、astro、svelte、figma、cli 等）在`turbo run test lint type-check --filter="./packages/*" --continue`中全部通過：102／107 tasks successful，未通過的5項即上表。**promote未新增任何失敗。**[baseline](../evidence/0258-base-four.log)；[全套件](../evidence/0258-all-checks2.log)；[vite serial](../evidence/0258-vite-serial-promoted.log)；[nuxt serial](../evidence/0258-nuxt-serial-promoted.log)；[webpack serial](../evidence/0258-webpack-serial.log)

過程中曾因在package目錄直接`pnpm build`產生不完整的`packages/webpack/dist`，已用turbo重建修正；該中間狀態未提交。

## 帳本

- BH-0063：已確認／owned候選修復 → **已修復**。63historical、58→59fixed、5→4unresolved。65checked／10blocked不變；goal active。
- pending approvals：`nextGraphDeliveryTests`（四個既有Next測試調整）本批依授權交付並移出待審；`existingWebpackTestContract`與`watchpackDependencyPatch`仍未授權、未交付。
- BH-0004維持部分修復：source preservation與rendered resource context已交付，完整public／host graph遷移仍未完成。
- 下一步：Turbopack combined-root PostCSS與late resource契約仍不存在，需另行設計；帳本檔案接近拆分門檻，下一批比照0254歸檔頭部。

[Final checks](../evidence/0258-final-checks.json)
