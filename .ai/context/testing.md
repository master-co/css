# Testing Pack

Use this for adding tests or choosing validation for an implementation.

## Baseline

Use scoped validation first, then broaden based on risk. When changing a workspace package, run that package's `lint` script if it exists. For multi-package changes, run lint for every affected package that defines it. If an affected package has no package-local lint script, report that explicitly.

## Common Commands

```sh
pnpm build
pnpm test
pnpm e2e
pnpm lint
pnpm type-check
pnpm check
pnpm build:examples
```

## High-Value Scoped Checks

```sh
pnpm --filter @master/css test
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-server test
pnpm --filter @master/css-scanner test
pnpm --filter @master/css.vite test
pnpm --filter @master/css-language test
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-server test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-validator test
pnpm --filter @master/css-cli test
```

## Escalate When

- Parser, compiler, renderer, runtime, scanner, language tooling, or ESLint behavior changes: read `.ai/testing-policy.md`.
- Performance-sensitive engine or runtime work changes: read `.ai/context/performance.md`.
- CSS output snapshots or fixtures change: read `.ai/context/css-output.md`.

## Fixtures And Snapshots

Only update snapshots or generated CSS fixtures when the behavior change is intentional, explained, and covered by a focused regression test or fixture.
