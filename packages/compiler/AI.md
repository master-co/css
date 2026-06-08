# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the canonical CSS source compiler for Master CSS. It parses Master CSS stylesheet directives and native CSS, resolves CSS import graphs, detects project entry markers, parses standalone extraction directives, and uses `@master/css` core adapters to produce semantic `Config` values.

## Inputs And Outputs

- Input: CSS containing `@settings`, `@theme`, `@custom-at`, `@custom-selector`, top-level managed `@layer preset`, `@layer components`, and `@layer utilities` blocks, condition blocks with `@at`, style rules with `@compose`, top-level extraction policy directives, and top-level native `@keyframes`.
- Output: semantic core `Config`, shared directive data for lower-level consumers, style definitions, native CSS with consumed Master directives removed, native class names, warnings, standalone directive metadata, and CSS import dependencies.
- CSS config directives such as `@settings`, `@theme`, `@custom-at`, and `@custom-selector` are config definitions. Defining a component, utility, variable, token, or animation does not emit CSS by itself; the class still needs to be used or extracted.
- `@master;` is only a lightweight entry marker. Legacy non-empty `@master` statements and `@master {}` blocks are stripped with no config or extraction effect.
- `@master;` and `@import "@master/css"` are equivalent user project entry markers. Package CSS files such as `@master/css/index.css` must not contain `@master;`.
- `compileCSSFile()` resolves CSS `@import` graphs before compiling and returns absolute dependency paths.
- `compileProjectConfig()` compiles project entry CSS files into the canonical project-level `Config`.

## Boundaries

- Do not make `@master/css` depend on this package.
- This package may depend on `@master/css` for semantic config conversion.
- Keep directive parsing package-local.
- Consume dependency-free source range helpers from `@master/css-lexer`; compiler-specific semantic directive parsing stays package-local.
- Emit shared directive contracts from `shared/css-directives` for low-level consumers, and expose semantic `Config` APIs for config loading.
- Do not reintroduce PostCSS in this package.
- If CSS configuration directive syntax is expanded or changed incompatibly, update any language-service semantic token classification that is affected in the same change when practical.

## Directive MVP

- `@settings { root-size: 16; }`
- `@settings { important: on; }` and `@settings { important: off; }`
- `@theme { --color-primary: #123; --breakpoint-md: 768; }`
- `@theme dark { --color-primary: #456; }`
- The compiler records mode declarations as written. Core adapters decide which modes are defaults.
- `@custom-at motion-safe @media (prefers-reduced-motion: no-preference);`
- `@custom-selector ::scrollbar ::-webkit-scrollbar;`
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
- The compiler package does not scan unrelated `.css` files for class usage. Pair CSS configs with static mode or pass extracted classes through compiler options when filtering native CSS.
- CSS/theme/source tests that depend on `.css` files belong here rather than in core tests.

## Tests

Use focused package tests first:

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```
