# Batch 0257: Next candidate promote feasibility

## 目前交接點

0256交付的下一步：在owned副本跑`packages/next` lint／types／build與測試套件、e2e，並量化compiler／Rust候選鏈，通過再談交付。本批在同一owned副本`tmp/0256-turbopack-animations/packages/next`完成五項檢查全PASS，並量化promote所需的完整依賴鏈。沒有產品變更；沒有promote；另以獨立commit訂正0256「副本無tests」的錯誤敘述（副本有`tests/`共30項）。0038仍暫停。

## Next候選套件檢查（owned副本）

| 檢查 | 命令 | 結果 | 證據 |
|---|---|---|---|
| lint | `pnpm lint`（eslint） | PASS | [log](../evidence/0257-next-candidate-lint.log) |
| type-check | `tsc -p tsconfig.audit-0246.json --noEmit`（src＋tests，`@master/css-compiler`指向0244候選dist d.ts；套件原`tsc -b tsconfig.typecheck.json`在部分副本因workspace references缺檔而不適用） | PASS | [log](../evidence/0257-next-candidate-type-check-audit.log) |
| build | `pnpm build`（tsdown，68 files／261.63 kB） | PASS | [log](../evidence/0257-next-candidate-build.log) |
| test | `vitest run --exclude tests/*-e2e.test.ts` | 24 files／152 tests PASS（0247為151，新增Turbopack global animation測試） | [log](../evidence/0257-next-candidate-test.log) |
| e2e | `pnpm e2e`（css-manifest-query／dev-hmr／static-export） | 3 files／3 tests PASS | [log](../evidence/0257-next-candidate-e2e.log) |

候選測試契約相對主工作樹：新增4個測試檔（`bug-hunt-postcss-request-plugins` 191行、`bug-hunt-postcss-resource-host` 113行、`bug-hunt-postcss-resource-policy` 100行、`bug-hunt-turbopack-global-animations` 56行）；修改5個既有測試檔（`stylesheet-loader` 7行、`bug-hunt-sass-source-offsets` 3行、`bug-hunt-output-source-maps` 3行、`next-config` 13行、`bug-hunt-webpack-css-pipeline` 14行差異）。前四項即pending approval `nextGraphDeliveryTests`（0221起未獲回覆），第五項為0247以後的候選調整；152 PASS是對候選契約，不是對主工作樹契約。

新增測試`bug-hunt-turbopack-global-animations.test.ts`直接呼叫`stylesheet-loader`的general（Turbopack）路徑：entry與composes子Module各引用preset `fade`，斷言兩處`animation`名稱維持`fade`、`@keyframes fade`只輸出一次、不出現`card_fade__`／`other_fade__`、作者`@keyframes local-spin`仍作用域化，且`fade`不是Module export而`local-spin`是。

## promote依賴鏈（量化，未執行）

| 層 | 主工作樹 vs 候選 | 說明 |
|---|---|---|
| `crates/mastercss-compiler`、`mastercss-project`、`xtask` template | 535行差異、新增`native_source.rs`與`bug_hunt_preserved_native_source.rs`（0244副本） | 0240–0244的native source preservation／rendered resource context候選；主工作樹沒有`preserveNativeSource` |
| `packages/binding/src/protocol.ts` | 候選patch觸及 | Rust契約轉發 |
| `packages/compiler/src` | 11檔46行差異（`contracts`／`index`／`node-compiler`／`session`／`stylesheet/*`）＋2個測試檔 | `compileRenderedStylesheet` delivery選項、`preserveNativeSource`、rendered resource context |
| `packages/next` | 13新檔約800行＋4改檔約63行＋4新測試＋5改測試 | 0232–0256整套PostCSS／module pipeline |
| `site/.../guide/directives/contract.mdx` | 候選patch觸及 | 指令契約文件同步 |
| `packages/internal`／`schema`／`preset` | src無差異 | 副本link到`master-next-copy-3z8i_q4c`，與主工作樹一致 |

主工作樹自0251–0253已提交compiler Rust perf（`source_index.rs`、lowering索引、manifest合併），0244候選crates沒有這些；`repros/compiler-source-index-on-0242.patch`（0251）對0244候選crates `patch --dry-run`全部檔案可套用，0252／0253差異未另存patch，rebase方向與衝突未驗。promote因此是跨Rust／binding／compiler／next／site的一次交付，需要重建native binding並跑Rust／compiler／next全套；不是本批範圍。

## 帳本

- 63historical、58fixed、5unresolved不變；BH-0063維持owned候選修復。65checked／10blocked、pending approvals不變（`nextGraphDeliveryTests`仍待回覆）；goal active。
- 下一步（需授權）：若要交付，先把0244候選crates rebase到主工作樹0253之後（先套0251 patch，再對照0252／0253），重建binding，在完整副本跑Rust／compiler／next；或先取得`nextGraphDeliveryTests`四檔與`bug-hunt-webpack-css-pipeline`調整的授權。未授權前候選留在owned副本。
- 帳本檔案findings／coverage／report／changes各42–46 KiB，超過40 KiB拆分建議值，下一批需比照0254再歸檔一次頭部。

[Final checks](../evidence/0257-final-checks.json)
