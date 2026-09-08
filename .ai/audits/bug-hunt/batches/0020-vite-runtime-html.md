# 0020 Vite runtime HTML and HMR

- 目的：HTML transformation→bootstrap/preload→browser runtime、pre-render/progressive 初始 CSS 與 HMR/recovery。
- 範圍：PKG-vite、runtime/server/internal 下游；樣例另列覆蓋。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal changes 保留。
- 已讀 dev-hmr Chromium setup/cleanup、runtime-bootstrap，下一步 injection/FOUC/pre-render/preload suites 與真 browser HMR。

## 驗證

- 已讀 pre-render manifest asset storage/build URL/renderer disposal、runtime injection/preload、FOUC 與 mode 組裝。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-vite exec vitest run tests/dev-hmr.test.ts tests/plugins/inject-runtime.test.ts tests/plugins/runtime-preload.test.ts tests/plugins/manifest-preload.test.ts tests/plugins/pre-render.test.ts tests/plugins/avoid-fouc.test.ts`：6 files / 28 passed，exit 0。[log](../evidence/0020-tests.log)
- 包含 actual Chromium dev runtime CSS layer order、無 full reload 的 CSS 更新/invalid CSS 恢復、HTML/preload/pre-render/renderer cleanup。
- 新 `packages/vite/tests/bug-hunt-relative-hydration.test.ts`：actual production 多頁 build，root control PASS、nested path assertion FAIL；同 vitest 命令指定該檔 exit 1。[log](../evidence/0020-relative-hydration.log)
- package lint exit 0：[log](../evidence/0020-vite-lint.log)。

## BH-0016 — P2 已確認：relative base 的巢狀頁 hydration URL 錯誤

- 定位：`packages/vite/src/plugins/pre-render.ts:83` 的 toBuildPublicURL 只拼 base/assets，未考慮輸出 HTML 所在目錄；transformIndexHtml 未使用 path context。
- 觸發：progressive mode，base='./'，輸出 `index.html` 和 `pages/nested.html`。
- 預期：每頁 data-master-css-hydration-manifest 的相對 URL 都解析到實際 JSON asset。
- 實際：nested HTML 使用 `./assets/_master-css/hydration/master-css-hydration.5b0d4ed6.json`，asset 在 dist/assets，而 URL 指 dist/pages/assets；根頁 control 成功。
- 影響巢狀頁 external hydration 載入，runtime 啟動依賴該 manifest；CSS 初始 SSR 可能可見但後續 runtime 無法正常啟動。
- 建議：使用 HTML path context 與既有 toAssetHref 類似的相對資產解析，覆蓋 root/nested、多層 nested、空 base/./ 與絕對 base。

## 結束

- 0019+0020 共 99 原有 tests 通過，新 regression 1 fail。PKG-vite 所列 bounded checks 完成；Firefox/WebKit integration HMR 尚未單独重跑（runtime 核心三瀏覽器已驗證）。
- 下一批 0021 Webpack usage/virtual CSS/HTML runtime 及 actual build/browser。
