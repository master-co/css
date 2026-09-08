# 0024 Next browser hydration and HMR

- Scope PKG-next; runtime/Vite-independent Turbopack client instrumentation and CSS update.
- HEAD unchanged; README, Next coverage and 0023 reviewed. Read dev-hmr-e2e test temporary fixture creation, child process startup/termination and browser cleanup. No tracked fixture modification.
- Baseline run pending; actual Chromium + Next dev, class layer precedence and repeated CSS edits.

- `npm_lifecycle_event=e2e node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-next exec vitest run tests/dev-hmr-e2e.test.ts`: 1 actual Chromium test PASS, exit 0. [log](../evidence/0024-hmr.log).
- Next client hydrated marker true; utility block overrides component flex; edit @compose inline-flex→flex updates computed style and retains window marker (no full reload). Browser and own Next child terminated; temporary dev workspace removed. One edit, not repeated-edit stress coverage.
- Next totals 57 unit + 3 production build + 1 live HMR PASS. No new bug; no package modifications. Residual: other browsers for Next instrumentation, dynamic request-time SSR outside documented ownership, every option combination.
- Completed; next Astro middleware/hooks and build asset normalization.
