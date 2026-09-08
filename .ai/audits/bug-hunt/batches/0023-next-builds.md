# 0023 Next actual build outputs

- Scope: PKG-next, SUP-nested-hosts Next playground/static-export/css-manifest-query. Normal build, nested routes, asset references and manifest contract.
- HEAD unchanged e66ba7236e183046dfc071f190caa44ade0b95e9. README and Next coverage/0022 read before start. Only audit tests/ledger changed; foreign site/internal preserved.
- Read three build test files and fixture manifests/configs. Next may rewrite generated TS config, so run copied package via [isolated-package.py](../repros/isolated-package.py). Shared dependencies are linked; target package fixtures are copies; finally removes only own temp tree.
- Pending command/results.

## Validation / conclusion

- `npm_lifecycle_event=e2e python3 .ai/audits/bug-hunt/repros/isolated-package.py packages/next node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs pnpm exec vitest run tests/playground.test.ts tests/static-export-e2e.test.ts tests/css-manifest-query-e2e.test.ts --no-file-parallelism`: 3 files / 3 PASS, exit 0, 15.27s. [log](../evidence/0023-builds.log).
- Builds real Next/Turbopack projects and checks rendered class CSS, runtime client bundle/manifest separation, custom/default token data, nested export pages, every referenced hydration JSON exists and contains v1 rules.
- Initial isolation under OS temp failed Turbopack filesystem-root constraints because dependency symlinks escaped root. Moved disposable tree under repository tmp and inherited actual workspace root (no cloned lock/workspace config); all original assertions pass. Harness limitation, not product bug.
- Original tracked Next fixtures unchanged; disposable tree removed. No bug confirmed. Actual document hydration/HMR next.
- [source revalidation](../evidence/0023-revalidation.json): all recorded source hashes unchanged. `pnpm run check:ai-context`: PASS ([log](../evidence/0023-ai-context.log)).
