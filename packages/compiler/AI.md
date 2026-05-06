# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` parses Master CSS stylesheet directives and compiles them into generated Master CSS output through `@master/css`.

## Inputs And Outputs

- Input: CSS containing `@master`, variables, nested mode blocks, `@at`, `@selector`, `@master components`, `@master utilities`, component rules with `@compose`, and `@master animations`.
- Output: CSS with consumed Master directives removed and generated Master CSS appended only for classes passed to the compiler.
- `@master` definitions are config definitions. Defining a component, utility, variable, token, or animation does not emit CSS by itself; the class still needs to be used or extracted.

## Boundaries

- Do not make `@master/css` depend on this package.
- Keep directive parsing package-local.
- Prefer using the public `@master/css` engine for rule generation.
- Avoid duplicating core parser, selector, priority, and layer behavior.
- Do not reintroduce PostCSS in this package.

## Directive MVP

- `@master { root-size: 16; --color-primary: #123; --screen-md: 768; }`
- `@master { dark { --color-primary: #456; } }`
- `@master { @at motion-safe @media (prefers-reduced-motion: no-preference); }`
- `@master { @selector ::scrollbar ::-webkit-scrollbar; }`
- `@master components { .btn { @compose "inline-flex"; display: inline-flex; } }`
- `@master utilities { .content-auto { content-visibility: auto; } }`
- `@master animations { fade { from { opacity: 0; } to { opacity: 1; } } }`
- Component definition selectors must start with one class selector.
- `@compose` is allowed only in component definitions.
- Utilities defined in CSS are static utilities only.
- `body`, `html`, and other HTML tag rules inside `@master` should warn because regular CSS selectors must live outside Master directives.
- The compiler package does not scan unrelated `.css` files for usage. Pair CSS configs with `@master/css.vite` extract mode or pass extracted classes through `compileCSS(..., { classes })`.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
