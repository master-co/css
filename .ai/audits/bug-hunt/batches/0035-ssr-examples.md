# 0035 SSR example build/hydration

- Scope EX-astro, EX-next.js, EX-nuxt.js, EX-svelte; upstream packages already checked in 0022-27. Bounded flow actual SSR/static HTML→hydration→runtime class mutation.
- HEAD unchanged; README/coverage rows read. Each package manifest/framework config and app entry/layout/counter read. Next Google font build may require network; distinguish fetch failures from product. Svelte Vercel adapter output tested through local Vite preview, no deployment.
- Run inspected build scripts in isolated copies; next/nuxt local child server and Svelte preview stop after checks. No production/fixture edits. Pending commands/results.

- Important intermediate validation: Astro/Next/Svelte builds/browser tests PASS. Nuxt SSR HTML exists but client cannot apply new hidden class. Investigating package artifact freshness and browser asset diagnostics; not yet confirmed. Original Nuxt fixture tests only browser-tested runtime mode.
- Svelte preview wrapper initially terminated pnpm but left its Vite child (PID30673); explicitly terminated that own process and changed harness to spawn Vite directly. No foreign processes touched.
- Direct Nuxt module build without the repository TS compatibility wrapper failed on TypeScript7 removed compiler API; rerun using wrapper before attributing to product.

## BH-0023 (P1, confirmed) / batch conclusion

- [Astro](../evidence/0035-astro.log), [Next](../evidence/0035-next.js.log), [Svelte](../evidence/0035-svelte.log): actual builds and Chromium PASS. Next/Svelte HTTP SSR contains master style; runtime new hidden/block classes work. Astro existing toggle changes color to royalblue; Svelte counter increments after hydration.
- [Nuxt example](../evidence/0035-nuxt.js.log): build/SSR PASS, browser runtime update FAIL. New package regression `packages/nuxt/tests/bug-hunt-progressive.test.ts` on existing progressive fixture confirms independently with real Nuxt build + Chromium ([log](../evidence/0035-nuxt-progressive.log)): requested /_master-css/manifest/master-css-manifest.7a05a78a.json returns HTTP200 text/html; browser rejects JSON-module MIME and app hydration never finishes. Probe hidden remains display:block. Runtime mode control passed 0027.
- Source `packages/nuxt/src/module.ts:255-257` registers Nitro public asset only for runtime, while progressive also imports RuntimeVirtualModulesPlugin facade (line182) pointing to that asset. Default progressive mode loses client startup; initial SSR CSS masks failure. Fix register public manifest assets whenever the selected client mode consumes them (runtime and progressive), preserving baseURL and avoiding unnecessary preloads. Add progressive browser/default-mode regression.
- Fresh Nuxt package build under compatibility wrapper PASS; source-owned fixture proves this is not stale dist. Nuxt lint PASS. Test first waited for hydration before attaching diagnostics, then changed harness to capture initial network responses; HTTP200 fallback explains why status>=400 alone missed it.
- No other new finding. Original tracked fixture/config untouched; isolated package/browser/server cleanup complete, including explicitly cleaned own Svelte orphan and corrected direct-child spawning. Completed.
