# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the canonical CSS source compiler for Master CSS. It parses Master CSS stylesheet directives and native CSS, resolves CSS import graphs, detects project entry markers, parses standalone extraction directives, and uses `@master/css` core adapters to produce semantic `Config` values.

## Inputs And Outputs

- Input: CSS containing `@master`, variables, mode blocks such as `dark { ... }`, `@custom-at`, `@custom-selector`, top-level managed `@layer preset`, `@layer components`, and `@layer utilities` blocks, condition blocks with `@at`, style rules with `@compose`, and top-level native `@keyframes`.
- Output: semantic core `Config`, shared directive data for lower-level consumers, style definitions, native CSS with consumed Master directives removed, native class names, warnings, standalone directive metadata, and CSS import dependencies.
- `@master` definitions are config definitions. Defining a component, utility, variable, token, or animation does not emit CSS by itself; the class still needs to be used or extracted.
- `@master;` and `@import "@master/css"` are equivalent user project entry markers. Package CSS files such as `@master/css/index.css` must not contain `@master;`.
- `compileCSSFile()` resolves CSS `@import` graphs before compiling and returns absolute dependency paths.
- `compileProjectConfig()` compiles project entry CSS files into the canonical project-level `Config`.

## Boundaries

- Do not make `@master/css` depend on this package.
- This package may depend on `@master/css` for semantic config conversion.
- Keep directive parsing package-local.
- Emit shared directive contracts from `shared/css-directives` for low-level consumers, and expose semantic `Config` APIs for config loading.
- Do not reintroduce PostCSS in this package.
- If `@master` CSS configuration syntax is expanded or changed incompatibly, update the TextMate/Shiki highlighting in `packages/language` in the same change when practical.

## Directive MVP

- `@master { root-size: 16; --color-primary: #123; --screen-md: 768; }`
- `@master { important: on; }` and `@master { important: off; }`
- `@master { dark { --color-primary: #456; } }`
- The compiler records mode declarations as written. Core adapters decide which modes are defaults.
- `@master { @custom-at motion-safe @media (prefers-reduced-motion: no-preference); }`
- `@master { @custom-selector ::scrollbar ::-webkit-scrollbar; }`
- `@layer components { .btn { @compose "inline-flex"; display: inline-flex; } }`
- `@layer components { .btn { @at dark { @compose "bg:neutral-90"; } } }`
- `@layer utilities { .content-auto { content-visibility: auto; } }`
- `@layer utilities { .print-hidden { @at print { display: none; } } }`
- `.card { @compose "block"; @at dark { @compose "fg:primary"; } }`
- `@keyframes fade { from { opacity: 0; } to { opacity: 1; } }`
- Component and utility definition selectors must start with one class selector.
- `@compose` is allowed in managed class definitions and native style rules, including inside `@at`.
- Utilities defined in CSS are static utilities only.
- `body`, `html`, and other HTML tag rules inside top-level managed layers should warn because regular CSS selectors must live outside Master directives.
- The compiler package does not scan unrelated `.css` files for class usage. Pair CSS configs with extract mode or pass extracted classes through compiler options when filtering native CSS.
- CSS/theme/source tests that depend on `.css` files belong here rather than in core tests.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
