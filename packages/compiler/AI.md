# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` parses Master CSS stylesheet directives and compiles them into generated Master CSS output through `@master/css`.

## Inputs And Outputs

- Input: CSS containing `@master`, variables, nested mode blocks, `@custom-at`, `@custom-selector`, `@layer general`, condition blocks with `@at`, reusable main style rules with `@compose`, and native `@keyframes`.
- Output: CSS with consumed Master directives removed and generated Master CSS appended only for classes passed to the compiler.
- `@master` definitions are config definitions. Defining a main style, utility, variable, token, or animation does not emit CSS by itself; the class still needs to be used or extracted.
- `compileCSSFile()` resolves local relative CSS `@import` graphs before compiling and returns absolute dependency paths.

## Boundaries

- Do not make `@master/css` depend on this package.
- Keep directive parsing package-local.
- Prefer using the public `@master/css` engine for rule generation.
- Avoid duplicating core parser, selector, priority, and layer behavior.
- Do not reintroduce PostCSS in this package.
- If `@master` CSS configuration syntax is expanded or changed incompatibly, update the TextMate/Shiki highlighting in `packages/language` in the same change when practical.

## Directive MVP

- `@master { root-size: 16; --color-primary: #123; --screen-md: 768; }`
- `@master { important; }` and `@master { !important; }`
- `@master { dark { --color-primary: #456; } }`
- `light` and `dark` are core default modes; the compiler should only add custom modes such as `chrisma`.
- `@master { @custom-at motion-safe @media (prefers-reduced-motion: no-preference); }`
- `@master { @custom-selector ::scrollbar ::-webkit-scrollbar; }`
- `@master { .btn { @compose "inline-flex"; display: inline-flex; } }`
- `@master { .btn { @at dark { @compose "bg:neutral-90"; } } }`
- `@master { @layer general { .content-auto { content-visibility: auto; } } }`
- `@master { @layer general { .print-hidden { @at print { display: none; } } } }`
- `@master { @keyframes fade { from { opacity: 0; } to { opacity: 1; } } }`
- Main style definition selectors must start with one class selector.
- `@compose` is allowed only in main style definitions.
- General utilities defined in CSS are static utilities only.
- `body`, `html`, and other HTML tag rules inside `@master` should warn because regular CSS selectors must live outside Master directives.
- The compiler package does not scan unrelated `.css` files for class usage. Pair CSS configs with `@master/css.vite` extract mode or pass extracted classes through `compileCSS(..., { classes })`.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
