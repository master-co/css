# 0025 Astro response and asset lifecycle

- Scope PKG-astro; upstream Vite/internal/server and emitted globals contract.
- HEAD unchanged; README and coverage Astro row read. package/AI, src/core.ts, server.ts, middleware.ts, external-hydration-manifest.ts, runtime-preload and tests.
- Flow: Astro mode hooks→Vite/kernel virtual manifests→middleware HTML renderer→build hydration/preload normalization. Real Response normal/nonHTML/bodyless/repeated page isolation; temp asset tree for base/nested/idempotence.
- Foreign site/internal work preserved; no target product changes. Tests pending.

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-astro exec vitest run`: 2 files / 15 PASS, exit 0. [log](../evidence/0025-tests.log).
- Guards preserve non-HTML/bodyless responses, remove stale content-length for transformed bodies; sequential responses isolate CSS; emitted globals not duplicated; mode hook combinations and base-aware preloads/external manifest files checked on real temporary filesystem.
- No confirmed bug. Middleware renderer is long-lived at module scope; finite cache policy inherited from server; per-request disposal would contradict reuse. Full Astro host build remains EX-astro. No package edits. Completed.
