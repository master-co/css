# AI Notes For `@master/eslint-plugin-css`

## Responsibility

`@master/eslint-plugin-css` adapts Master CSS lint helpers to ESLint. It detects class locations, reports diagnostics, and applies autofixes through ESLint rule APIs.

## Owns

- ESLint plugin object, configs, and rule definitions.
- AST visitor helpers for supported source syntaxes.
- ESLint report formatting and autofix output.
- ESLint settings resolution and manifest cache behavior.

## Does Not Own

- Engine CSS generation semantics.
- Class lint policy owned by `@master/css-tooling/lint`.
- Class-list token/range parsing owned by `@master/css-tooling/lexer`.
- Framework-neutral class-list edit text owned by `@master/css-tooling/lint`.
- Source extraction adapters outside ESLint visitors.
- Language service or LSP behavior.

## Public Surface

- Default plugin object.
- Configs under `./configs/*`.
- Rules: `sort-classes`, `no-invalid-classes`, `no-conflicting-classes`, `prefer-canonical-classes`, and `no-unapproved-raw-values`.

## Key Files

- `src/plugin.ts`
- `src/index.ts`
- `src/settings.ts`
- `src/utils/define-visitors.ts`
- `src/utils/resolve-class-node.ts`
- `src/utils/resolve-context.ts`
- `src/rules/*`

## Risk Areas

- AST shape differences across React, Vue, Svelte, Angular, MDX, and template syntaxes.
- Raw versus cooked string range mapping.
- Autofix whitespace, quote, and range preservation.
- Keep AST/report/fixer orchestration here, but delegate token/range parsing and class-list replacement text to lower packages.
- Manifest cache scoping by cwd/settings.
- Adapter drift from `@master/css-tooling/lint` policy helpers.

## Safe Changes

- Parser/framework visitor fixes with fixtures.
- Autofix range fixes with input/output tests.
- Rule option fixes with config coverage.

## Dangerous Changes

- Recursing into arbitrary expressions as static classes.
- Removing collision classes without preserving user spacing and quotes.
- Reusing stale manifests across unrelated cwd/settings.
- Changing rule names, recommended config, or defaults casually.

## Validation

```sh
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/eslint-plugin-css lint
pnpm --filter @master/eslint-plugin-css type-check
pnpm --filter @master/eslint-plugin-css build
```

Use or extend `tests/*.test.ts` and issue fixtures for rule behavior changes.
