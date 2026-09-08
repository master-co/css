# 0008 Runtime startup and hydration

- 目的：Wasm 啟動與 hydration snapshot/CSSOM 一致性、資源初始狀態、mismatch fallback。
- 範圍：PKG-runtime，配對 server/render/engine/binding 的前批證據。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；只修改 audit/repros/tests，外部 site/reference 保留。
- 下一步：讀 runtime AI/package/source/e2e setup，檢查寫檔副作用後建置並跑三瀏覽器 startup/progressive/hydration suites。

## 初步結果

- fresh runtime build 成功；選定 startup/global/progressive/hydration/rc87 suites 在 Chromium/Firefox/WebKit 共 117 passed。[build](../evidence/0008-runtime-build.log)、[e2e](../evidence/0008-hydration-e2e.log)
- 已讀 core.start/startNew、hydration URL/inline/external loading、host resource/CSSOM mapping、e2e init；fixture 檔僅讀。
- BH-0008 待驗證：external hydration 使用 globalThis.Function 建立 import，可能在允許 Wasm/module、但禁止 unsafe-eval 的 CSP 下失敗。

## BH-0008 — P2 已確認：external hydration 需要不必要的 unsafe-eval

- 定位：`packages/runtime/src/hydration.ts:72` 的 Function constructor；catch 只接受 SyntaxError，CSP EvalError 直接讓 startup 失敗。
- 觸發：使用 external hydration JSON，CSP 允許同源/module/wasm-unsafe-eval、禁止 unsafe-eval。
- 預期：合法 JSON 可讀取且 runtime 啟動；實際：public MasterCSSRuntime.start 拒絕 INVALID_HYDRATION_MANIFEST，cause 是 CSP 不允許 string evaluation。
- 新測試先確認 fetchOK=true、直接 JSON importVersion=1，再呼叫完整 runtime startup，因此排除了網路、JSON 語法與一般 module CSP 限制。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-runtime exec playwright test e2e/bug-hunt-hydration.test.ts --project=chromium --reporter=line`：1 failed。[log](../evidence/0008-csp-regression.log)
- 新檔 `packages/runtime/e2e/bug-hunt-hydration.test.ts`；runtime package lint 已執行，[log](../evidence/0008-runtime-lint.log)。
- 修正方向：使用不依賴 runtime string evaluation 的原生動態 import；保留現有 JSON module／載入失敗嚴格契約，不盲目把所有 import 失敗改成 fetch fallback。

## 結束與下一步

- 原有 startup/hydration 117 tests 通過，新增 CSP regression 失敗；未修改產品。
- runtime 單位尚未完成，0009 查 DOM mutation、跨 root、frame/disconnect/retention/disposal。
