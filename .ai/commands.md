# Commands

## Root Commands

```sh
pnpm build
pnpm build:examples
pnpm check
pnpm test
pnpm e2e
pnpm lint
pnpm type-check
pnpm commit-check
pnpm submodules
```

`pnpm check` runs commit check, build, and package test/lint/type-check scripts.

## Common Package Commands

```sh
pnpm --filter @master/css build
pnpm --filter @master/css test
pnpm --filter @master/css type-check
pnpm --filter @master/css lint
```

Use the real scripts in each package `package.json`. Some packages have `test`, some have `e2e`, and some only have build/type-check/lint.

## High-Value Scoped Checks

```sh
pnpm --filter @master/css test
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-server test
pnpm --filter @master/css-extractor test
pnpm --filter @master/css.vite test
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-server test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-validator test
pnpm --filter @master/css-cli test
```

## CI Equivalents

- Test workflow: `pnpm run build` then `pnpm test`
- Lint workflow: `pnpm run build` then `pnpm run lint`
- Type-check workflow: `pnpm run build` then `pnpm run type-check`
- E2E workflow: Playwright install, `pnpm run build`, then `pnpm e2e`
- Example check: `pnpm build`, reinstall, then `pnpm build:examples`

