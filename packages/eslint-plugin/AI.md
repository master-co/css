# AI Notes For `@master/eslint-plugin-css`

## Responsibility

`@master/eslint-plugin-css` validates and normalizes Master CSS classes in source code. It detects class locations, validates syntax, enforces class order, and detects classes with equivalent declarations.

## Owns

- ESLint plugin object, configs, and rule definitions.
- AST visitor helpers for supported source syntaxes.
- Class validation, ordering, collision reporting, and autofix output.
- ESLint settings resolution and manifest cache behavior.

## Does Not Own

- Engine CSS generation semantics.
- Source extraction adapters outside ESLint visitors.
- Language service or LSP behavior.

## Public Surface

- Default plugin object.
- Configs under `./configs/*`.
- Rules: `class-validation`, `class-order`, and `class-collision`.

## Key Files

- `src/plugin.ts`
- `src/index.ts`
- `src/settings.ts`
- `src/utils/define-visitors.ts`
- `src/utils/resolve-class-node.ts`
- `src/utils/resolve-context.ts`
- `src/rules/*`
- `src/functions/filter-collision-classes.ts`

## Risk Areas

- AST shape differences across React, Vue, Svelte, Angular, MDX, and template syntaxes.
- Raw versus cooked string range mapping.
- Autofix whitespace, quote, and range preservation.
- Manifest cache scoping by cwd/settings.
- Collision detection depending on generated declarations and variants.

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
