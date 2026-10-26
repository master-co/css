# 排版 token 重疊縮減：決策文件

- 狀態：**已核准（2026-10-26），尚未實作**。決定見第 12 節；本文件不改任何 code。
- 分析對象：`rust` 分支 HEAD `7366cd12d`。`packages/preset/src/theme.css` 與 `utilities.css` 在主 checkout 的 working tree 和 `rust` HEAD 完全相同（主 checkout 另有 palette session 尚未 commit 的修改，不影響排版來源）。
- 比對基準：`v2.0.0-rc.88`（`d8a0472b5`，2026-07-24）。
- 本文件所在的 worktree 分支從 `rc` 切出；實作必須在 `rust` 上進行，並排在 palette 變更 commit 之後（兩者都會改 `packages/preset/AI.md` 與 `default-manifest.json`）。

## 結論摘要

| 組別 | 數量 | rc.88 | 判定 |
| --- | --- | --- | --- |
| `text-<step>` utility、`--text-<step>`、`--text-<step>--line-height` | 1 utility、16 + 16 token | 未發佈 | **保留，作為字級唯一的 class 入口** |
| `--text-<step>--letter-spacing` 非零值（`xl`～`10xl`） | 10 token | 未發佈 | 保留 |
| `--text-<step>--letter-spacing: 0`（`3xs`～`lg`） | 6 token | 未發佈 | **直接刪除** |
| `@utility font-(--font-size)`（`font-sm` 等 class） | 1 utility、16 class | class 形式未發佈（rc.88 是 `font:sm`） | **刪除** |
| `--font-size-*` | 16 token | 已發佈 | 保留，作為數值來源（`--text-*` 的值、`@theme` 客製、stylesheet 撰寫） |
| `--leading-*`、`@utility leading-(--leading)` | 5 token、1 utility | token 已發佈；class 形式未發佈（rc.88 是 `leading:md`） | **刪除，需 migration** |
| `--tracking-*` 中與 Tailwind 同名的 6 個、`@utility tracking-(--tracking)` | 6 token、1 utility | 已發佈 | 保留 |
| `--tracking-tightest` | 1 token | 已發佈 | **刪除，需 migration** |
| 字級 16 階 | 16 | 已發佈 | 全部保留，不刪階 |

效果：

- 字級、行高、字距相關的 token 從 76 個降到 64 個（`--font-size-*` 16、`--text-*` 16、line-height companion 16、letter-spacing companion 10、`--tracking-*` 6）。
- 同一件事可寫的 class 詞彙從 44 個（`text-*` 16、`font-<size>` 16、`leading-*` 5、`tracking-*` 7）降到 22 個（`text-*` 16、`tracking-*` 6）。
- `font-` 前綴只剩 family 與 weight，跟 Tailwind 的語意一致。

## 1. 判準

沿用 palette boundary 的四條判準，並明確定義「模型的既有認知」：

1. **名稱要符合模型的既有認知。** 對 utility class 而言，模型最強的先驗是 Tailwind；對宣告而言是 CSS 規格本身。這裡以 Tailwind v4 預設主題（`tailwindcss@4.1.11/theme.css`）作為對照：
   - `--text-xs`～`--text-9xl`（含 `base`），每階附 `--text-*--line-height`；`--text-*--letter-spacing` 是選用 companion，預設主題沒有定義。
   - `font-*` 只代表 family（`--font-sans`）與 weight（`--font-weight-*`），**沒有** size。
   - `--leading-*` 是 `tight` 1.25、`snug` 1.375、`normal` 1.5、`relaxed` 1.625、`loose` 2，另有靜態 `leading-none` 與數字 `leading-6`。
   - `--tracking-*` 是 `tighter`、`tight`、`normal`、`wide`、`wider`、`widest`。
2. **近似重複的詞彙會讓不同 agent session 產出不一致。** 兩個寫法都「看起來對」、但輸出不同時，模型會隨機選一個。
3. **美學性的組合屬於使用者主題。** preset 提供功能性的基準，不收藏風格。
4. **成本要跟用量相稱。** 用量以 `rust` 上 site 與 examples 的實際寫法計算。

## 2. 現況（`rust`，以已建好的 `mcss` CLI 實測）

| Class | 輸出 |
| --- | --- |
| `text-sm` | `font-size:var(--text-sm);line-height:var(--text-sm--line-height, normal);letter-spacing:var(--text-sm--letter-spacing, normal)`，theme 層同時輸出 `--font-size-sm` 與 `--text-sm: var(--font-size-sm)` |
| `font-sm` | `font-size:var(--font-size-sm)` |
| `leading-md`、`tracking-tight` | `line-height:var(--leading-md)`、`letter-spacing:var(--tracking-tight)` |
| `tracking-tight`、`tracking-tighter`、`tracking-widest` | 正常（Tailwind 同名） |
| `text-base`、`text-sm/6`、`leading-tight`、`leading-none`、`leading-relaxed`、`leading-6`、`font-base` | 不產生任何 CSS，CLI 也沒有提示 |
| `font-size:sm`、`line-height:md`、`letter-spacing:tight`（rc.88 寫法） | 輸出無效宣告，例如 `font-size:sm` |

覆寫順序已實測：`leading-lg tracking-wide font-lg text-sm` 不論 class 書寫順序，輸出都是 recipe（`text-sm`）在前、單一屬性 utility 在後，native 宣告（`line-height:1`）排最後。所以「`text-*` 打底，再用單一屬性覆寫」是確定性的，跟 Tailwind v4 用 `--tw-leading` 讓 `leading-*` 必勝的心智模型一致。

缺 companion 的行為已有測試鎖定（`crates/mastercss-compiler/tests/mixin_contract.rs` 的 `missing_companions_keep_css_fallbacks_and_do_not_create_named_classes`）：companion 不存在時保留 `var(--text-<step>--line-height, normal)` fallback。

## 3. 發佈狀態（對照 `v2.0.0-rc.88`）

| 項目 | rc.88 | `rust` |
| --- | --- | --- |
| `--font-size-*` 16 階 | 有，數值相同 | 有 |
| `--leading-*` 5 個、`--tracking-*` 7 個 | 有，數值相同 | 有 |
| `--text-*` 與兩種 companion，共 48 個 | **沒有** | 有 |
| 字級 class | `font:sm`；`text:sm` 是公式（`line-height:max(1.8em - …)`、`letter-spacing:clamp(-0.072em, …)`）；`font-size:sm` 經 native value namespace 解析成 token | `font-sm`、`text-sm`（authored companion）；`text:value` 已移除並有診斷 |
| 行高、字距 class | `leading:md`、`line-height:md`、`tracking:tight`、`letter-spacing:tight` | `leading-md`、`tracking-tight`；raw alias `leading:`／`tracking:` 只剩移除診斷 |

重點：**所有 hyphen 形式的 class（`font-sm`、`text-sm`、`leading-md`、`tracking-tight`）都還沒發佈。** rc.88 使用者升級時本來就得遷移每一個排版 class。已發佈、需要評估 migration 的只有 token 本身：使用者可能在 `@theme` 覆寫 `--leading-md`，或在 stylesheet 寫 `var(--leading-md)`。

`--tracking-tightest: -0.072em` 是 rc.88 `text:` 公式的 clamp 下限遺留值；新 recipe 最緊只到 `10xl` 的 `-.05em`。

## 4. 實際用量（`rust`，site 與 examples）

排除自動產生的檔案（`site/tests/css-contract.snapshot.json`、`.master/`、`default-manifest.json`）；reference specimen JSON 另計。

| 寫法 | 次數 | 分布 |
| --- | --- | --- |
| `text-<step>` | 289 次、79 個檔案 | site 223；examples 66，**全部在 `examples/laravel`**（shadcn 來源、半遷移的 Tailwind 寫法） |
| `font-<size>` | 228 次、125 個檔案 | site 227（docs 內容 149、docs-shell 39、components 31）；另有 42/80 個 reference specimen JSON；examples 1 |
| `leading-<key>` | 10 次、8 個檔案 | 全在 site；另有 7 個 specimen JSON；examples 0 |
| `tracking-<key>` | 18 次 | site 11、examples 7；`tight` 10、`widest` 5、`normal` 3、`tightest` 0 |
| `var(--font-size-*)` | 113 次 | `site/styles` 94 |
| `var(--leading-*)` | 23 次 | `site/styles` 22 |
| `var(--tracking-*)` | 1 次 | `--tracking-wide` |
| `var(--text-*)` | 0 | — |

從用量看到的不一致：

- **site 自己混用兩套字級入口**：`text-<step>` 223 次、`font-<size>` 227 次。8 行同時出現兩者。
- **手動組裝 recipe 的寫法普遍**：20 行是 `font-<size>` 搭配 `leading-*`／`tracking-*`／`line-height:`／`letter-spacing:`。`site/styles/*.css` 把 `font-size: var(--font-size-xs)` 配上 `line-height: var(--leading-md)`（1.6），但 `text-xs` 的 recipe 是 1.5；specimen JSON 的內文常寫 `font-md leading-lg`（1.8），但 `text-md` 是 1.6。兩套行高 scale 的數值只有 3 個交集（1.2、1.4、1.6）。
- **教學入口用的是要被取代的寫法**：安裝指南共有 44 處 hello world 片段，全部是 `m-2xl font-style:italic font-5xl font-heavy fg-text-neutral`。site 也是 `llms.txt` 的來源，這是模型最常抄的片段。
- **Tailwind migration 指南把 `text-lg` 轉成 `font-lg`**（`site/content/guide/migration/tailwindcss/content.mdx:159`），跟本提案方向相反。
- **repo 自己的 example 已經出現 Tailwind 先驗漏進來的死 class**：`examples/laravel` 有 `leading-none` ×4、`leading-tight`、`leading-relaxed`，Master 都不產生 CSS。

## 5. 各組判定

### 5.1 字級：`text-<step>` 是唯一 class 入口，刪除 `font-(--font-size)`

- **判準 1**：`text-sm` 是 Tailwind 最常見的排版 class，模型不看文件也會寫；`font-sm` 在 Tailwind 沒有意義。刪掉 `font-<size>` 之後，`font-` 只剩 family 與 weight，跟先驗完全一致。
- **判準 2**：`text-sm` 和 `font-sm` 同 key、同字級，但前者多設行高與字距，是典型的近似重複。site 的混用（223 比 227）就是不同 session 選了不同寫法的結果。
- **判準 4**：hyphen 形式的 `font-sm` 未發佈，刪除不影響已發佈的 class 表面。
- 需要只改字級、保留繼承行高時，寫 `font-size:var(--font-size-sm)`（或 `text-sm` 再用 `line-height:` 覆寫）。這是 native CSS，模型完全理解。
- `--font-size-*` 保留：它已發佈，是 `--text-*` 的值，也是 site stylesheet 113 處的依賴。`--text-*` 也保留：它是 Tailwind v4 的主題命名，使用者照先驗寫 `@theme { --text-brand: 2rem; --text-brand--line-height: 1.2 }` 就能直接得到 `text-brand`。
- shared prefix 機制（`46c21c14b`）仍有 `font-`（family／weight）、`transition-`、`animation-` 在用，不需要改 engine。

### 5.2 刪除 6 個 `--text-<step>--letter-spacing: 0`

- utility 本身就以 `normal` 作 fallback。CSS Text 3 規定 `letter-spacing: normal` 計算值為 0。
- 已實測：Chromium 與 WebKit（Playwright）中，在 `letter-spacing: .12em` 的父層下、`text-align: justify` 的段落裡，`0`、`normal`、`var(--missing, normal)` 三者的字元位置完全相同，computed value 都是 `normal`。
- `packages/runtime/e2e/mixins.test.ts` 的 metrics 測試本來就把 `normal` 視為 0，刪除後不需改期望值。
- 結果是 theme 層每用一個小字級少輸出一個變數，渲染不變。跟 Tailwind v4 預設主題「letter-spacing companion 為選用」一致。
- 代價：recipe 表不再每階都有三個 token。agent 新增自訂階時，可能不加 letter-spacing companion，但 fallback 會讓結果等同 0，所以沒有不一致。

### 5.3 刪除 `--leading-*` 與 `leading-(--leading)`

- **判準 1 不符**：key 是 `xs`～`xl`，Tailwind 先驗的 `tight`、`relaxed`、`none`、`6` 全部不存在。laravel example 的 6 個死 class 就是證據。
- **判準 2 不符**：`text-*` 已經為每一階提供行高。`--leading-*` 是第二套、數值大多不重合的行高 scale，site 的手動組裝已經跟 recipe 分歧。
- **判準 4**：class 用量只有 10 次；`var()` 用量 23 次幾乎都是在 stylesheet 裡手動組 recipe。
- 覆寫改寫 native `line-height:1.25`。模型對 CSS 行高數值的認知是完整的，也沒有 key 要猜。
- 想保留命名行高的專案，可以在自己的主題裡加回來（判準 3）：

  ```css
  @theme { --leading-relaxed: 1.625; }
  @utility leading-(--leading) { line-height: var(--leading); }
  ```

  已用 CLI 實測這段主題會產生 `.leading-relaxed{line-height:var(--leading-relaxed)}`，同一次也確認自訂的 `--text-brand` 會得到帶 fallback 的 `text-brand`。這是在 preset 仍有 leading utility 的狀態下測的，移除後要在實作時再確認一次。

### 5.4 保留 6 個 `tracking-*`，刪除 `tightest`

- `tighter`～`widest` 跟 Tailwind 同名（判準 1），模型寫了就有效；examples 的 7 次用量全部命中。
- 字距跟 recipe 只部分重疊：recipe 處理大標的負字距，但小字級全是 0，大寫小標籤（`tracking-widest`）的正字距沒有 recipe 能取代，是獨立的軸。
- 這是跟 leading 不對稱的理由：leading 的名稱不符先驗、又是 recipe 已涵蓋的軸；tracking 的名稱符合先驗，且有 recipe 不涵蓋的用途。
- `tightest` 不在先驗內、用量 0，數值是已移除公式的遺留，而且比任何 recipe 都緊，所以刪除。

### 5.5 16 階全部保留

`3xs`、`2xs`、`10xl` 是 Tailwind 沒有的延伸，但不構成近似重複：模型不會在別的意思下寫出它們，也不會造成產出不一致。刪階要動已發佈的 `--font-size-*`，換來的只有幾個 token。

## 6. 考慮過但不採用

- **保留 `font-<size>`、刪除 `text-*` recipe**：`text-sm` 是先驗，刪了會變成最常見的排版 class 完全不產生 CSS。
- **把 leading key 改成 Tailwind 名稱**（`none`、`tight`、`snug`、`normal`、`relaxed`、`loose`）：能救回 `leading-tight` 等寫法，但仍保留跟 recipe 競爭的第二套行高 scale；同一張卡片，參考 Tailwind 的 session 會寫 `text-sm leading-relaxed`（1.625），照 Master 文件的 session 會寫 `text-sm`（1.5），輸出仍然不一致。刪除後兩者都會落在 recipe 的 1.5。這是第 9 節要你決定的第二個問題。
- **把 `--font-size-*` 併入 `--text-*`**：會移除 16 個 alias，但 `--font-size-*` 已發佈、site 有 113 處引用，也牽動 compiler 的 `BUILTIN_NAMESPACES`／`NUMERIC_THEME_NAMESPACES`。兩個名稱的值永遠相同，不會造成渲染不一致，效益不成比例。
- **新增 `text-base` alias**：會跟 `text-md` 形成新的近似重複。改用診斷提示（見第 10 節）。

## 7. Migration（已發佈的部分）

| rc.88 寫法 | `rust` 現況 | 提案 |
| --- | --- | --- |
| `font:sm` | `v2-rc-syntax-map.json` 轉成 `font-sm` | 轉成 `font-size:var(--font-size-sm)`，輸出不變（跟既有的 `font:16px` → `font-size:16px` 同一原則） |
| `text:sm` | migration 報錯，要求人工審查行高與字距 | 不變 |
| `leading:md`、`line-height:md` | 沒有 fixture 覆蓋 | 轉成 `line-height:1.6`；專案 `@theme` 有覆寫 `--leading-md` 時保留 `line-height:var(--leading-md)` |
| `tracking:tightest`、`letter-spacing:tightest` | 沒有 fixture 覆蓋 | 轉成 `letter-spacing:-.072em` |
| stylesheet 中的 `var(--leading-*)`、`var(--tracking-tightest)` | 正常 | release note 列出被移除的 token 與數值；使用者改寫成數值，或在自己的 `@theme` 重新宣告 |

另外建議同一個變更加入**移除診斷**：`leading-<key>` 提示改用 `line-height:<number>`，`font-<size key>` 提示改用 `text-<step>` 或 `font-size:var(--font-size-<step>)`。沒有診斷時，刪除只會讓 class 靜默失效，而 agent 是透過 MCP `inspectClass`、ESLint、language server 拿到回饋的。`crates/mastercss-engine/src/removed_syntax.rs` 已有同類模式（`text:value was removed…`），但它目前以 `property:` 開頭比對，hyphen class 需要另外的掛點，實際成本要在實作時確認。

## 8. 受影響的檔案

以下是 grep 找到的直接斷言與內容；完整清單以第 9 節的驗證結果為準。

### Preset

- `packages/preset/src/theme.css`：刪 6 個 zero companion、5 個 `--leading-*`（連同 `/* Line heights */` 標題）、`--tracking-tightest`；recipe 區塊的註解「explicit line height and letter spacing per step」改成只在非零時才有 letter-spacing。
- `packages/preset/src/utilities.css`：刪 `font-(--font-size)`、`leading-(--leading)`。
- `packages/preset/src/default-manifest.json`：重新產生。
- `packages/preset/tests/default-manifest.test.ts:344`、`:391`、`:426`（`font-sm` 斷言）。
- `packages/preset/README.md:25`（`font-sans`、`font-sm`、`font-bold` 共用前綴的說明）。
- `packages/preset/AI.md`：在 Palette boundary 旁新增 Typography boundary（草稿見第 11 節）。

### Rust crates

- `crates/mastercss-engine/tests/canonical_syntax.rs` 與 `fixtures/token-family-baseline.json`：`font-size`、`leading` 移入 `RETIRED_PRESET_FAMILIES`，`prefixes.len()` 從 119 變 117。
- `crates/mastercss-compiler/tests/named_token_contract.rs:61`、`:110-140`：`font-sm` 斷言；`font-brand` 的歧義案例改成 family 對 weight。
- `crates/mastercss-compiler/tests/mixin_contract.rs:193-215`（`token_maps_require_explicit_utility_definitions` 載入 preset `utilities.css` 後斷言 `font-sm` 的輸出）。
- `crates/mastercss-compiler/tests/rc_mixins_migration.rs:92`、`:147`。
- `crates/mastercss-compiler/tests/fixtures/v2-rc-syntax-map.json`：`font:sm` 列；新增 `leading:md`、`tracking:tightest` 列。
- migration 原始碼（`crates/mastercss-compiler/src/migration/`）與（若採用）`crates/mastercss-engine/src/removed_syntax.rs`。
- `crates/mastercss-compiler/tests/shared_prefix_contract.rs` 使用自己的 `FONT` fixture，預期不受影響，需確認。

### TypeScript packages

- `packages/runtime/e2e/mixins.test.ts:87-102`：`#font-only` 用 `font-sm`；metrics 期望值不變。
- `packages/runtime/e2e/shared-prefix.test.ts:11`、`:35-38`（`font-sm`、`font-lg` 搭配預設 manifest）。
- `packages/language-service/tests/suggest-syntax/utilities.test.ts:7`、`:9`；`values.test.ts:30`。
- `packages/tooling/tests/language/create-language-session.test.ts:160-163`；`packages/tooling/tests/lint/index.test.ts:84`。
- `packages/eslint-plugin/tests/no-unapproved-raw-values.test.ts:42`；`prefer-canonical-classes.test.ts:77`、`:147`。
- `packages/mcp/tests/final-semantics.test.ts:24-26`；`semantic-context.test.ts:72-107`（`font-brand` 歧義、`font` family 清單 `['font-family', 'font-size', 'font-weight']`）。
- `packages/compiler/tests/shared-prefix.test.ts` 使用自己的定義，預期不受影響，需確認。

### Site

- 指南：`guide/typography/content.mdx`（整頁的入口說明、`font-brand` 歧義範例、Line height 與 Letter spacing 段落）、`guide/syntax-tutorial/content.mdx:254`、`guide/migration/v2-rc/content.mdx:692`、`guide/migration/tailwindcss/content.mdx:109`、`:159`、`:171`、`guide/route-level-styles/content.mdx:99`、`guide/ai-coding/content.mdx:271`，以及 `responsive-design`、`breakpoints`、`rendering-modes` 等使用 `font-<size>` 的頁面。
- 安裝指南的 44 處 hello world 片段。
- Reference：`site/reference/token-contracts.ts:17-18`、`token-editorial.ts:13`、`:15`、`recipes.ts:20`；`/reference/tokens/leading` 路由會消失，需檢查連結。
- Foundation 資料：`site/common/foundation-data/specimens.ts:34-82`、`tokens.ts:26`、`specimens.test.ts:42-45`、`recipe-specimens.ts`；`site/components/demo/FoundationTypeMotion.tsx`、`FoundationPaint.tsx`。
- Specimen JSON：42 個檔案含 `font-<size>`，7 個含 `leading-*`（`site/components/demo/specimens/`）。
- 測試與腳本：`site/utils/manifest-utilities.test.ts:23`、`:26`；`site/reference/reference.test.ts:60`；`site/scripts/verify-css-contract.ts:238-240`（期望 route CSS 含 `--leading-md:`）；`site/scripts/generate-llms-txt.test.ts:616`（`font-2xl`）；`site/tests/delivery-examples-checks.ts:67`、`installation-examples.ts:50`、`next-installation-examples.ts:55`；`site/utils/authoring-examples.ts:41`、`first-paint-examples.ts:31`。
- Stylesheet：`site/styles/documentation-index.css`、`documentation-values.css`、`docs-shell/prose.css` 的 22 處 `var(--leading-*)`。
- Site UI：`site/docs-shell/components/`（`ArticleHeader`、`NotFound`、`OverviewButtons`、`HeroHeader`、`DocSidebar` 等）與 `site/content/blog/page.tsx`。
- `site/tests/css-contract.snapshot.json`：已知過期且含其他 checkout 的絕對路徑，只做差異比對，不在這個變更裡重新 baseline。

### Site 改寫原則

- 教學內容（`site/content` 的範例、安裝指南、specimen、會進 `llms.txt` 的片段）一律改成 `text-<step>`。這些是 agent 會抄的寫法，渲染上的行高與字距變化是預期中的。
- Site UI 預設也改成 `text-<step>`；需要保留原本繼承行高的地方（例如 `font-sm line-height:1` 的按鈕），寫 `text-sm line-height:1`。用截圖比對確認。
- Stylesheet 的 `var(--leading-*)` 先換成等值數字，維持輸出不變。改用 recipe companion 是另一個視覺變更，不放在這次。

### 其他

- `.ai/reports/reference-content-inventory.md:50`（Typography namespace 清單含 `leading`）。
- `examples/eslint/index.css` 自己宣告了 `--tracking-tightest`，屬於使用者主題，不受影響。
- Blank、Lit、React、Vite、Webpack 範本只用 `tracking-tight`，不受影響。

## 9. 驗證方式

依 `packages/preset/AI.md` 的 Validation，再加上受影響套件：

```sh
pnpm --filter @master/css-preset build        # 重新產生 default-manifest.json
pnpm --filter @master/css-preset test
pnpm --filter @master/css-preset lint
pnpm --filter @master/css-preset type-check
cargo test -p mastercss-compiler -p mastercss-engine
pnpm build:rust:native                         # 有改 Rust（migration、診斷）時；要排在任何 turbo build 之後
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-tooling test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-mcp test
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-runtime e2e --project=chromium --project=webkit   # 本機 Firefox 無法啟動
pnpm --filter site test:reference
pnpm --filter site test:docs-examples          # 文件範例中無法 match 的 class 會失敗，可抓到殘留的 font-<size>／leading-*
pnpm --filter site test:llms
pnpm --filter site test:css-contract           # 只做差異比對，見下
```

另外確認：

1. **CSS 輸出差異可解釋**：對 `text-<step>` 全 16 階比對前後輸出。只有 `3xs`～`lg` 的 theme 層少了 `--text-*--letter-spacing`，utility 規則不變。
2. **渲染不變**：`mixins.test.ts` 的 16 階 metrics 測試在 390px 與 1440px 都通過，字距仍為 0。
3. **殘留為零**：在 `site`、`examples`、`packages`、`crates` grep `font-<size>`、`leading-<key>`、`--leading-`、`tracking-tightest`，只允許出現在 migration fixture、移除診斷與使用者主題範例。
4. **Migration**：`v2-rc-syntax-map.json` 的新列通過 `rc_migration` 測試；`font:sm` 遷移前後輸出相同。
5. **Site 視覺**：對改寫過的頁面（typography 指南、安裝指南、docs-shell 標頭、NotFound、blog 列表、reference specimen）在 390px 與 1440px 截圖前後比對，只接受預期中的行高與字距變化。
6. **CSS contract snapshot**：依既有作法，結構化比對 `projectManifest`、`cssSegments`、`routes`，抽出本次變更的差異後還原 snapshot，並回報它仍然過期。

## 10. 範圍外的發現（建議另開工作）

- rc.88 的 `font-size:sm`、`line-height:md`、`letter-spacing:tight` 在 `rust` 上會輸出無效 CSS，CLI 沒有提示，migration fixture 也沒有涵蓋。這跟本提案無關，但會影響每個 rc.88 使用者，以及用 rc 文件訓練過的模型。
- 仍會靜默失效的 Tailwind 先驗寫法：`text-base`、`text-sm/6`、`font-normal`、`font-black`、`leading-none`。建議用診斷提示對應寫法，而不是新增 alias。
- `examples/laravel` 混有 Master 不產生 CSS 的 Tailwind class（`leading-none`、`text-muted-foreground`、`gap-1`、`flex-1` 等），`package.json` 也還留著 `tailwindcss` 依賴。

## 11. 需要你決定的事

1. **是否核准整體方向**：`text-<step>` 作為唯一字級入口；刪除 `font-(--font-size)`、6 個 zero companion、`--leading-*` 與其 utility、`--tracking-tightest`。
2. **leading 要刪除（建議）還是改名成 Tailwind 的 key？** 刪除讓輸出最一致，改名讓 Tailwind 寫法有效。
3. **`font:sm` 的 migration 目標**：`font-size:var(--font-size-sm)`（建議，輸出不變），或 `text-sm`（行高與字距會變，需要人工審查）。
4. **移除診斷要放在同一個變更，還是另開工作？** 建議同一個變更；如果 hyphen class 的掛點成本過高，再拆出去。

核准後，`packages/preset/AI.md` 建議新增的規則草稿：

```md
## Typography boundary

`text-<step>` is the only class entry for type size. Each step is a `--text-<step>` primary token that aliases `--font-size-<step>`, a `--text-<step>--line-height` companion and, only when nonzero, a `--text-<step>--letter-spacing` companion; the utility's `normal` fallback covers zero tracking. `--font-size-*` is the value scale for themes and stylesheets, not a class family. Line-height overrides use native `line-height:<number>`; the preset has no line-height scale. `tracking-*` keeps only the established ecosystem keys `tighter` through `widest`. Do not add a second size, line-height or letter-spacing vocabulary whose keys overlap `text-<step>`.
```

## 12. 決策紀錄（2026-10-26）

使用者授權依專業判斷決定，第 11 節四項定案如下：

1. **核准整體方向。** `text-<step>` 是唯一字級 class 入口；刪除 `font-(--font-size)`、6 個 zero letter-spacing companion、`--leading-*` 與 `leading-(--leading)`、`--tracking-tightest`。
2. **leading 刪除，不改名。** 改用 Tailwind key 仍會留下跟 recipe 競爭的第二套行高 scale，輸出一致性比讓 `leading-tight` 有效更重要。
3. **`font:sm` 轉成 `font-size:var(--font-size-sm)`。** 輸出不變，不需要人工審查行高與字距。
4. **移除診斷放在同一個變更。** 只有在 hyphen class 的診斷掛點成本明顯過高時才拆出去，並在實作回報中說明原因。

實作時把第 11 節的 Typography boundary 草稿寫進 `packages/preset/AI.md`。site 的 `font-<size>` class 要逐一改寫：需要 recipe 行高時用 `text-<step>`，只改字級時用 `font-size:var(--font-size-<step>)`，並以 CSS contract 差異和瀏覽器 QA 確認視覺變化。
