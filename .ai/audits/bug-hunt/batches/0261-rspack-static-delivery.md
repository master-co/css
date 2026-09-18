# Batch 0261: BH-0029 Rspack static delivery

## 目前交接點

BH-0029自0038起標「已確認」，追加host覆蓋因0038的平台狀況暫停至今。本批不重啟0038的integration-lab覆蓋，只用既有repro在**目前主工作樹**重新量測finding本身的症狀，並補Webpack對照。沒有產品變更；repro `BH-0029-rspack.mjs`修正兩處斷言前提，新增`rspack-webpack-static-delivery-parity.mjs`。0038仍暫停。

## 原症狀已不成立

0038記錄的症狀是「Rspack static模式漏掉所有managed CSS」。重跑原repro：Rspack模組確實仍沒有source（`privateSource: undefined`、`originalSource: undefined`，`usage-graph`的`succeedModule`取不到內容），但`finishModules`會以完整module graph補齊，掃描結果`classes: ["block"]`正確，**managed CSS實際有產出**：`master-css-…-3.css`含`@layer utilities{.block{display:block}}`，並經`main.css` → `-0` → `-1` → `-3`的`@import`鏈交付，所有鏈上檔案都寫入`dist/`。

原斷言只讀`dist/main.css`（內容僅`@import "./master-css-…-0.css";`，50 bytes），沒有跟隨交付鏈，因此把正常的graph delivery誤判為遺漏。這個`@import`鏈正是`packages/webpack/tests/bug-hunt-static-graph-delivery.test.ts`所斷言的形狀（`expect(result.contents[result.css]).toMatch(/^@import /)`後再走鏈）。[原斷言](../evidence/0261-rspack-delivery-original-assert.log)

## Webpack對照：四格完全一致

新repro同一fixture各跑Webpack（`mini-css-extract-plugin`）與Rspack（`CssExtractRspackPlugin`），沿`@import`鏈攤平後比對：

| bundler | `@preserve native` | managed `.block{display:block}` | 作者`.control` | 交付總量 |
|---|---|---|---|---|
| webpack | 無 | 有 | 無 | 3786 bytes |
| webpack | 有 | 有 | 有 | 3814 bytes |
| rspack | 無 | 有 | 無 | 3350 bytes |
| rspack | 有 | 有 | 有 | 3369 bytes |

兩個bundler的行為逐格相同：managed CSS一律交付；作者原生CSS只有宣告`@preserve native`才保留，這是Master既有的預設行為，不是Rspack差異。原repro的fixture沒有`@preserve native`，因此作者規則本來就不會出現。[對照](../evidence/0261-rspack-webpack-parity.log)

## repro修正

- `BH-0029-rspack.mjs`：斷言改為沿`@import`鏈攤平後檢查，並在fixture加入`@preserve native`後同時斷言managed與作者CSS。修正後PASS（交付3369 bytes）。[修正後](../evidence/0261-rspack-delivery-fixed.log)
- 新增`repros/rspack-webpack-static-delivery-parity.mjs`：上表四格的對照腳本。

## 未涵蓋

0038暫停的integration-lab追加host覆蓋（Rspack／Rsbuild static與runtime、TanStack Start）未重啟，不在本批範圍；EX-integration-lab覆蓋單位維持受阻。本批只證明BH-0029列明的症狀在目前主工作樹不再成立且與Webpack同行為。

## 帳本

- BH-0029：已確認 → **已修復**（由graph delivery交付；原斷言未跟隨`@import`鏈）。63historical、60→61fixed、3→2unresolved（BH-0004部分修正、BH-0053部分修正）。65checked／10blocked不變；goal active。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步：BH-0053剩餘的delivery asset maps／native declaration granularity／完整Sass host邊界；BH-0004完整public／host graph遷移。

[Final checks](../evidence/0261-final-checks.json)
