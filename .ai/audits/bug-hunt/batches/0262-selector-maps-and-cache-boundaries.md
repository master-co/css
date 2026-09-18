# Batch 0262: BH-0053 closure — selector maps and persistent-cache boundaries

## 目前交接點

0260已驗證BH-0053列明的缺陷（Turbopack在Sass預處理前分類造成編譯失敗）在交付版本上不再發生。該列尾隨的兩個0243反例仍掛著：per-selector delivery asset maps與Turbopack持久快取的新publication。本批在交付後的主工作樹重跑兩個0243 repro並補對照，將兩者歸類為Master以外的邊界。沒有產品變更、沒有repro變更。0038仍暫停。

## 反例一：per-selector maps — Master側已完整，殘餘在Next optimizer

`repros/next-selector-map-stages.mjs`直接呼叫公開`compileStylesheet`，再呼叫**目前安裝的Next 16.3.4真正的**`CssMinimizerPlugin.optimizeAsset`（`next/dist/build/webpack/plugins/css-minimizer-plugin`）。五份固定原文、每份核對兩個selector的原始line／UTF-16 column：

| `preserveNativeSource` | compiler階段 | 經Next optimizer後 |
|---|---|---|
| false（預設） | 6 PASS／4 FAIL | 6 PASS／4 FAIL |
| **true** | **10 PASS／0 FAIL** | 6 PASS／4 FAIL |

0258交付的`preserveNativeSource`把compiler階段補到全數通過——`separate-mergeable`、`authored-list`、`nested-mergeable`、`unicode-lines`的第二個selector原本都錨到第一個selector的來源，開啟後各自錨回自己的位置。同一份payload交給Next自己的minimizer後一律退回6／4，兩種設定結果相同。

這是同一輸入的A／B：compiler交出10／0，`optimizeAsset`回來變6／4，因此殘餘損失發生在Next的minimizer（cssnano）而非Master。Master能提供的per-selector provenance已完整；要讓它活過publication需要Next側的改變，不在本repo範圍。[證據](../evidence/0262-selector-map-stages.json)

## 反例二：Turbopack持久快取 — 純Next對照同樣失敗

`repros/next-initial-publication.mjs`每次建立全新app，依序build：initial → 修改entry CSS → 重建。

| 對照 | initial | 修改source後 |
|---|---|---|
| Master交付版本 | PASS | FAIL：`Can't resolve '../.master/stylesheets/24ab59d2…/ce0a2697…-entry.css'` |
| **純Next＋最小寫檔loader（`BH_INITIAL_PURE=1`，完全不載入Master）** | PASS | FAIL：`Can't resolve '../.master/stylesheets/pure/a927b0a3….css'` |

純對照用自己的最小loader寫自己的檔案，症狀逐字相同：Turbopack持久快取重播loader結果時，該次新寫入的檔案已不存在，於是解析不到剛發布的stylesheet。與Master的發布邏輯無關，屬Turbopack持久快取行為。[master](../evidence/0262-initial-publication-master.json)；[pure](../evidence/0262-initial-publication-pure.json)

## BH-0053結案與剩餘範圍去向

BH-0053的缺陷陳述（Sass分類順序）已由0260的四組Turbopack對照（scss dev／build／partial／partial+recovery，Chromium＋WebKit）驗證通過，兩個尾隨反例本批歸類為Next／Turbopack側邊界，因此改標**已修復**。

原本掛在該列、但不屬於這個缺陷的探索範圍——native declaration granularity與完整Sass option／host邊界——移到PKG-next覆蓋列的「剩餘」欄追蹤，不再以finding形式留存；這是記錄位置的調整，不是宣稱已完成。

## 帳本

- BH-0053：部分修正 → **已修復**。63historical、61→62fixed、2→1unresolved（僅剩BH-0004部分修正）。65checked／10blocked不變；goal active。
- 新歸類為外部邊界（不新增finding）：Next `CssMinimizerPlugin`的per-selector provenance損失、Turbopack持久快取的新publication解析失敗；兩者都有純對照證據。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步：BH-0004完整public／host graph遷移是唯一剩餘未解finding；PKG-next剩餘覆蓋為native declaration granularity、完整Sass option／host邊界、Turbopack combined-root PostCSS與late resource契約。

[Final checks](../evidence/0262-final-checks.json)
