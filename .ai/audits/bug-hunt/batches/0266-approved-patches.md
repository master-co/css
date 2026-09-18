# Batch 0266: Approved patches and the 0265 remedy correction

## 目前交接點

使用者明確授權交付兩個長期待審的patch。本批交付兩者並驗證，同時訂正0265對external import修法範圍的誤判——0265把`same-layer`列為可修，實測後不成立。0038仍暫停。

## 交付一：`existingWebpackTestContract`（`cb0233d56`）

自0208起待審。`packages/webpack/tests/plugin-runtime.test.ts`的兩個watch測試斷言的是舊契約：reset replay失敗應使`watchRun`reject、reset依賴應進`fileDependencies`。plugin實際實作的是把replay錯誤推進`compilation.errors`（`watchRun`正常resolve），並把尚不存在的reset路徑登記為`missingDependencies`。

套用前先核對記錄的雜湊全部相符：root檔`378564be…`、patch `e4960863…`；套用後檔案`da2cf049…`與記錄的`isolatedPatchedFileSha256`一致。錯誤identity、logging與recovery斷言都保留。

## 交付二：`watchpackDependencyPatch`（`68ced2463`）

自0209起待審。`watchpack@2.5.2`的`DirectoryWatcher`在initial scan時，把所有掃描到的項目都從missing-watcher map移除——包含掃描結果為「不存在」的路徑。於是替尚不存在的檔案註冊的watcher永遠收不到`initial-missing`，watch期間刪除依賴就沒有事件，build沿用舊結果。改為只在`this.files`或`this.directories`確實有該項目時才移除。

以`pnpm patch` → `pnpm patch-commit`正式產生`patches/watchpack@2.5.2.patch`（patch內容與記錄的`497eca85…`一致）與`pnpm-workspace.yaml`的`patchedDependencies`。

`patch-commit`的install順帶重新解析出`@vitejs/devtools`等12個無關套件與`supports-color`／`less`／`@types/node`的版本漂移，超出授權範圍（「no upgrades/additional dependencies」）。已還原lockfile後只套用與patch相關的5個hunk，最終lockfile變動為**7 insertions／4 deletions**，僅含`patchedDependencies`區塊與`watchpack@2.5.2(patch_hash=…)`引用；`pnpm install --frozen-lockfile`確認一致，且patch確實落在store。

## 結果：`@master/css-webpack`全綠

| 階段 | 結果 |
|---|---|
| 交付前 | 12 files／88 tests 中 **2 FAIL**（`plugin-runtime`兩個watch測試）＋1 FAIL（`bug-hunt-static-watch-recovery`，watchpack race） |
| 只套test contract | 1 failed／11 passed，**87 PASS／1 FAIL** |
| 兩者都套 | **12 files／88 tests 全PASS** |

全套件：build 28／28，`turbo run test lint type-check --filter="./packages/*"` **103／107 successful**，未通過的4項為`binding-wasm-compiler`、`binding-wasm-tooling`、`nuxt`、`vite`——與promote前baseline相同，webpack已不在其中。[webpack](../evidence/0266-webpack-after-patches.log)；[全套件](../evidence/0266-all-checks.log)

## 工作區修復（非產品變更）

`patch-commit`的install清掉了若干孤立的store目錄，暴露出`packages/figma`、`language-service`、`svelte`底下自2026-09-07遺留的陳舊`node_modules/.bin` shim——它們硬寫了已被清掉的store路徑，因而遮蔽了root `node_modules/.bin`的`vite`／`eslint`。刪除這三個套件的`node_modules`並以`--frozen-lockfile`重裝後，三者的build與lint全部通過（21／21 tasks）。這些套件本來就靠root bin解析`vite`／`eslint`，並非缺少宣告；不新增finding，也沒有改任何`package.json`。

## 訂正0265：可修的只有`different-layers`

0265把`same-layer`與`different-layers`同列為「補一行依作者順序的`@layer`宣告即可修」。新增`repros/external-layer-statement-remedy.mjs`實測（Chromium）：

| 案例 | 作者行為 | 目前展開 | 補`@layer`宣告後 | 修法有效 |
|---|---|---|---|---|
| different-layers | blue | red | **blue** | 是 |
| same-layer | blue | red | red | **否** |
| external-last | blue | red | 不適用 | 否 |

`same-layer`兩側都在同一個layer，決勝的是**layer內的出現順序**，不是layer順序；展開把外部`@import`提到最前就翻轉了它，任何`@layer`宣告都救不回來。正確分類因此是：明確限制6項、可修**2項**（`different-layers`的screen／print兩筆；當時僅Chromium，見0268）、固有邊界**5項**（`same-layer`、`external-last`、`conditional-local`）。修復後基準為**9 PASS／11 FAIL**，不是0265寫的11／9。[實測](../evidence/0266-layer-statement-remedy.log)

## 帳本

- 兩個pending approvals皆已交付，`pendingApprovals`清空。63historical、62fixed、1unresolved不變；65checked／10blocked不變；goal active。
- BH-0004的external修法範圍依本批訂正：只有`different-layers`可由`@layer`宣告修復，尚未實作（會改CSS輸出，待授權）。

[Final checks](../evidence/0266-final-checks.json)
