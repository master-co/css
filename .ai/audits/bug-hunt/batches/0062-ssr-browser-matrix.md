# 0062 Astro/Next/Svelte browser delivery

- Scope0035 actual generated/SSR pages and hydration controls onFirefox/WebKit. Existing Nuxt progressive blockerBH-0023 remains; do not use it as a passing matrix case. No deployment or0038 paused verification.
- Read current manifests/framework configs/layouts and Astro/Svelte AI; Next integration context already read0056. Source snapshot0035 matches current selected examples. Astro is built static output; Next uses next start, Svelte uses local Vite preview rather than claiming Vercel deployment.
- Astro uses0061 [matrix driver](../repros/example-browser-matrix.mjs) withruntime kind. Next/Svelte [SSR driver](../repros/ssr-example.mjs) now supports explicitBH_BROWSER_MATRIX while preserving default Chromium; each copied app builds once and one own server supplies both browser tests. Existing [smoke](../repros/browser-smoke.mjs) assertsvisible UI, applicable counter/toggle, and dynamic runtime classes.
- Command prefix:`BH_BROWSER_MATRIX=firefox,webkit python3 .ai/audits/bug-hunt/repros/isolated-package.py examples/<name> node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node <absolute-driver> <kind>`.Astro driverexample-browser-matrix/runtime; next.js driverssr-example/next; svelte driverssr-example/svelte.
- [Source hashes](../evidence/0062-source-hashes.json); all6browser controls PASS.

## Results

- [Astro](../evidence/0062-astro.log), [Next](../evidence/0062-next.js.log), [Svelte](../evidence/0062-svelte.log), [structured status](../evidence/0062-results.json). Original builds andFirefox155.0/WebKit26.6 controls allPASS. Astro toggle rendersroyalblue, Svelte counter hydrates/increments, each runtime accepts hidden→block→remove; no page errors.
- Astro retains known sitemap warning for missing site option; build/static output and requested controls pass. Next/Svelte actual HTTP HTML contains Master style; local servers cleanly exited. No remote deployment or exhaustive network/localization/route claim.
- No new finding;13blocked units unchanged. No package source/fixture edit or new package-local lint obligation. Existing Nuxt/Angular blocks remain separate.
