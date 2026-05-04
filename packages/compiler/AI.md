# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` parses Master CSS stylesheet directives and compiles them into generated Master CSS output through `@master/css`.

## Inputs And Outputs

- Input: CSS containing `@master`, variables, `@mode`, `@at`, `@selector`, `@layer utilities`, `@layer components`, component rules with `@apply`, and `@keyframes`.
- Output: CSS with consumed Master directives removed and generated Master CSS appended.

## Boundaries

- Do not make `@master/css` depend on this package.
- Keep directive parsing package-local.
- Prefer using the public `@master/css` engine for rule generation.
- Avoid duplicating core parser, selector, priority, and layer behavior.
- Do not reintroduce PostCSS in this package.

## Directive MVP

- `@master { root-size: 16; --color-primary: #123; --screen-md: 48; }`
- `@mode dark { --color-primary: #456; }`
- `@at motion-safe @media (prefers-reduced-motion: no-preference);`
- `@selector ::scrollbar ::-webkit-scrollbar;`
- `@layer utilities { .content-auto { content-visibility: auto; } }`
- `@layer components { .btn { @apply "inline-flex content-auto"; display: inline-flex; } }`
- `@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`
- Utility and component definition selectors must be single class selectors.
- `@apply` is allowed only in component definitions.
- `@utility` is not supported.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
