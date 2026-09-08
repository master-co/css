# 0045 Play share → compile → preview state contracts

- HEAD9bc565e512744e7fe6e4f28ae42fafa71f8b18ad; README/coverage0044 read. Scope SITE-main Play API/share/compiler/preview. Route-handler, compiler browser wrapper, existing tests and preview state source read.
- Existing tests use in-memory KV, actual compiler Wasm input, and fake DOM/VM for preview state ordering; this is not a Cloudflare deployment or real browser test. No security exploit repro reruns. Normal application-state tests only; no external share creation/messages/deployments. Pending baseline.

## Results

- `python3 .ai/audits/bug-hunt/repros/isolated-package.py site node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs pnpm run test:play`:17 PASS exit0 ([log](../evidence/0045-play.log)). Real Wasm4 CSS template/native/keyframe tests; memory KV11 health/create/read/missing/invalid/oversize/origin/TTL checks; VM2 preview CSS-before-HTML and stale animation-frame rejection tests.
- Preview operations have explicit fake DOM/RAF, no real browser isolation claim. Share writes occur only MemoryKV; no external host or user record touched. No new finding. Full browser/site output remains0046; live Cloudflare KV/deployment unavailable and not represented by mocks.
