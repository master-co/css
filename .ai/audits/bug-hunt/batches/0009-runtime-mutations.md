# 0009 Runtime DOM mutation and cleanup

- 目的：class/subtree 更新、跨 root 行為、retention、disconnect/reobserve/dispose。
- 範圍：PKG-runtime，engine 與 hydration 使用前批證據。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；產品未修改。新增 CSP regression 已知失敗，與原有 baseline 分開。
- 已讀：mutation.ts、class-tracker.ts（WeakMap snapshots/deltas）、core observers/queues/retention；後續追蹤 actual e2e。
- 疑點 BH-0009：class tracker 用當前 realm 的 instanceof Element，可能忽略 iframe Document root 的元素 mutation。
- 下一步：跑其餘既有 runtime suites，對 iframe root 做最小重現。

## 驗證與工作目錄

- HEAD 未變；0001–0008 已記錄的 source hashes 全部一致，舊結論無須待重驗。
- 外部 site reference/styles/prepare 與 internal search 變更持續中；[worktree](../evidence/0009-worktree.json) 保存完整路徑，未納入本批結論。
- 原有 class-usages/complex/edge-cases/keyframes/lifecycle/theme-layer-order/variables suites：Chromium、Firefox、WebKit 共 126 passed，42.2s。[log](../evidence/0009-mutation-e2e.log)
- 指令：`node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-runtime exec playwright test e2e/class-usages.test.ts e2e/complex.test.ts e2e/edge-cases.test.ts e2e/keyframes.test.ts e2e/lifecycle.test.ts e2e/theme-layer-order.test.ts e2e/variables.test.ts --reporter=line`，exit 0。
- 包含 shared counts、subtree removal/reparenting、ShadowRoot、retention、dispose/restart、emittedGlobals、native CSSOM order。
- runtime `lint`、`type-check` exit 0：[lint](../evidence/0009-runtime-lint.log)、[type-check](../evidence/0009-runtime-typecheck.log)。

## BH-0009 — P2 已確認：iframe Document root 不處理元素更新

- 定位：`packages/runtime/src/class-tracker.ts:67`、70、74 的 `instanceof Element` 使用 module realm 的 constructor。
- 觸發：父頁載入 runtime，將同源 iframe 的 Document 傳入公開 `MasterCSSRuntime.start({root, manifest})` 後 observe。
- 預期：元素 class 從 block 改為 hidden 後 usageCounts 變為 `{hidden:1}`；實際三瀏覽器皆保留 `{block:1}`，新 CSS 未建立。
- 初始 root query 成功且起始 snapshot 是 `{block:1}`，排除 root 啟動或 manifest 問題；外 realm Element 判定使 attribute record 被略過。
- 新測試：`packages/runtime/e2e/bug-hunt-frame.test.ts`；雙 requestAnimationFrame 等待既有 flush，finally dispose/frame.remove。
- 指令：`node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-runtime exec playwright test e2e/bug-hunt-frame.test.ts --reporter=line`，exit 1，3 failed。[log](../evidence/0009-frame-regression.log)
- 修正方向：使用跨 realm 的元素判定（nodeType 或 ownerDocument.defaultView.Element），並覆蓋 attribute、added/removed subtree。

## 存取限制與結束

- 使用者回報平台 Trusted Access 提示；無工具提供具體被拒動作或分類理由，不能認定確切觸發條件。
- 使用者最新決策：再遇到限制時，明記受阻動作及恢復條件，繼續其他範圍；等使用者身份驗證通過並通知後再續受限部分。
- BH-0006/0008 既有證據足夠，不需要重跑。這一批普通 iframe correctness 測試正常執行。
- 0009 完成；runtime 所列 bounded checks 完成，尚未窮舉所有第三方 DOM/custom elements 時序。
- 下一批 0010：source extraction 的字串/Unicode/動態片段邊界；再拆 scanner 狀態更新。
