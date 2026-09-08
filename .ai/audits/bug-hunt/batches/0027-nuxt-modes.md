# 0027 Nuxt mode host builds and responses

- Scope PKG-nuxt and SUP-nested-hosts four Nuxt fixtures; mode selection→Vite→Nitro/client runtime→CSS/HTML.
- HEAD unchanged; README/coverage Nuxt row read. Package/AI, module.ts, css-server.ts, options, external hydration helper, fixtures/config/setup-test and four test files read. Fixed ports 49101..49104 must be free.
- Run in isolated package to avoid rewriting tracked fixture generated files. Tests create Nuxt host builds and fetch real HTML/CSS. Runtime/client browser coverage assessed separately from fetch assertions.
- Initial source questions (ssr:false early return, headers casing) require contract/evidence before being bugs; no claim yet.

## Validation/conclusions

- Isolated runner command: prepare via `pnpm exec nuxt-module-build prepare`, then `pnpm exec vitest run --no-file-parallelism`, under TS compatibility wrapper. [exact command/log](../evidence/0027-tests.log). 4 files / 8 PASS, exit 0, 27.26s.
- Real four-mode Nuxt/Nitro builds and HTTP fetch assertions pass: static CSS, progressive/pre-render style/hydration and emitted globals, runtime-only SSR absence and accessible v1 JSON, actual browser computed utility precedence. Additional real temporary filesystem prerender externalization and /docs base route hook checks pass. Tests teardown hosts/browser; isolated tree removed.
- Initial missing .nuxt/tsconfig before prepare caused zero tests to run; setup requirement resolved before counting coverage. No existing test failure remains.
- Early ssr:false return is explicit implementation boundary; without declared SPA support or a failing supported-mode contract it is not confirmed as bug. HTML header casing combinations and real Nuxt HMR remain residual coverage. No product changes. Completed.
