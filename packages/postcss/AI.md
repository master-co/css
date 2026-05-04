# AI Notes For `@master/postcss`

## Responsibility

`@master/postcss` parses Master CSS stylesheet directives and transforms them into generated Master CSS output through `@master/css`.

## Inputs And Outputs

- Input: CSS containing `@master`, variables, `@mode`, `@at`, `@selector`, `@utility`, component rules with `@apply`, and `@keyframes`.
- Output: CSS with `@master` removed and generated Master CSS appended.

## Boundaries

- Do not make `@master/css` depend on this package.
- Keep directive parsing package-local.
- Prefer using the public `@master/css` engine for rule generation.
- Avoid duplicating core parser, selector, priority, and layer behavior.

## Directive MVP

- `@master { root-size: 16; --color-primary: #123; --screen-md: 48; }`
- `@mode dark { --color-primary: #456; }`
- `@at motion-safe @media (prefers-reduced-motion: no-preference);`
- `@selector ::scrollbar ::-webkit-scrollbar;`
- `@layer utilities { .content-auto { content-visibility: auto; } }`
- `@layer components { .btn { @apply "inline-flex content-auto"; display: inline-flex; } }`
- `@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`
- `.name` and `name` are both accepted for utility/component definition names.
- `@apply` is allowed only in component definitions.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/postcss test
pnpm --filter @master/postcss type-check
pnpm --filter @master/postcss build
```
