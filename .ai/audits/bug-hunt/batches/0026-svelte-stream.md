# 0026 Svelte streamed HTML lifecycle

- Scope PKG-svelte, server renderer, actual SvelteKit chunk contract. HEAD unchanged; README/coverage and 0025 reviewed.
- Read package/AI, lib/server.ts, hooks.server.ts, Vite wrapper, server/rc87 tests and server/html-render-session.ts.
- Suspect to examine: using renderer/session ends at resolve response return; establish whether actual SvelteKit calls transformPageChunk after response return before labeling a bug. Existing unit helper transforms chunks before returning Response.
- No production modifications. Baseline pending.

## Validation/conclusions

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-svelte exec vitest run`: 3 files / 14 PASS, exit 0. [log](../evidence/0026-tests.log).
- Chunk boundaries, complete document CSS/hydration, request isolation, external hydration callback hash/JSON, disabled hydration/emitted globals and SSR external Vite wrapper contracts pass.
- Disposed-before-final-chunk hypothesis excluded for installed SvelteKit: `packages/svelte/node_modules/@sveltejs/kit/src/runtime/server/page/render.js:635` awaits transformPageChunk with done:true before Response construction at 662; later streamed data chunks bypass that hook. Therefore manufacturing a delayed callback would not represent this host. Source inspection, not standalone host proof. Existing behavior tests establish current renderer contract. No BH ID claimed for excluded preliminary hypothesis.
- No new package tests/product edits. Actual SvelteKit app build/interaction in EX-svelte; future framework streaming API changes remain a risk. Completed.
