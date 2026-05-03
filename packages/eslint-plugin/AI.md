# AI Notes For `@master/eslint-plugin-css`

## Responsibility

`@master/eslint-plugin-css` validates and normalizes Master CSS classes in source code. It detects class locations, validates syntax, enforces class order, and detects classes with equivalent declarations.

## Inputs And Outputs

- Input: ESLint AST nodes, settings, optional Master CSS config.
- Output: ESLint reports and autofixes.

## Public APIs

- default plugin object
- configs under `./configs/*`
- rules:
  - `class-validation`
  - `class-order`
  - `class-collision`

## Core Files

- `src/plugin.ts`
- `src/index.ts`
- `src/settings.ts`
- `src/utils/define-visitors.ts`
- `src/utils/resolve-class-node.ts`
- `src/utils/resolve-context.ts`
- `src/rules/*`
- `src/functions/filter-collision-classes.ts`

## Allowed Changes

- Parser/framework visitor fixes with tests.
- Autofix range fixes with input/output fixtures.
- Rule option fixes.

## Forbidden Without Explicit Request

- Changing rule names or recommended config casually.
- Making autofixes that remove unrelated text.
- Changing settings defaults without docs/tests.

## Risk Areas

- AST shape differences across React, Vue, Svelte, Angular, MDX.
- Raw vs cooked string range mapping.
- Autofix whitespace preservation.
- Config cache behavior.
- Collision detection depending on generated declarations and variants.

## Required Tests

```sh
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/eslint-plugin-css type-check
pnpm --filter @master/eslint-plugin-css build
```

Use or extend tests in `tests/*.test.ts` and issue fixtures.

## Good Changes

- Add a parser-specific fixture for a missed class string.
- Fix an autofix range and assert the output.

## Dangerous Changes

- Recursing into arbitrary expressions as if they are static classes.
- Removing collision classes without preserving user spacing/quotes.
- Reusing a stale config across unrelated cwd/settings.

